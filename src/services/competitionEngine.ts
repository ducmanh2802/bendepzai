import {
  CompetitionDifficulty,
  CompetitionExamResult,
  CompetitionQuestion,
  CompetitionQuestionType,
  CompetitionSubject,
  ErrorAnalysisItem,
  ErrorCategory,
  ExamBlueprint,
  QuestionResponse,
  ReadinessAssessment,
  ReadinessLevel,
  SpeedRating,
} from '../types/competition';
import {
  COMPETITION_QUESTIONS,
  getQuestionsBySkill,
  getQuestionsBySubject,
} from '../data/competitionQuestions';
import { COMPETITION_BANK_VERSION } from '../data/competitionQuestions';
import { COMPETITION_SKILLS, getSkillById } from '../data/competitionTaxonomy';
import { ERROR_ANALYSIS_POLICY, READINESS_POLICY, SEED_POLICY, SPEED_POLICY } from '../config/policy';

const DEFAULT_MAX_SCORE = 10;

export class CompetitionEngine {
  // ==========================================================
  // Deterministic assembly (§11, §17)
  // ==========================================================

  /** Deterministic 32-bit string hash (FNV-1a) used to derive seeds. */
  public static hashSeed(input: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /**
   * Deterministically assemble the paper for a blueprint.
   *
   * Guarantees:
   *  - correct subject
   *  - NO duplicate question id anywhere in the paper
   *  - honours blueprint skill / difficulty / question-type distributions first,
   *    then fills the remainder from the subject pool
   *  - identical (blueprint, bank version, seed) => identical paper
   *  - never fabricates "copy" questions to pad the count: when the pool is
   *    smaller than the blueprint the paper is simply shorter and the caller is
   *    told about it via `assembleExam` (see `shortfall`).
   */
  public static assembleExamQuestions(
    blueprint: ExamBlueprint,
    seed: number = SEED_POLICY.DEFAULT_EXAM_SEED
  ): CompetitionQuestion[] {
    const pool = getQuestionsBySubject(blueprint.subject);
    if (pool.length === 0) {
      throw new Error(`No competition questions found for subject: ${blueprint.subject}`);
    }

    const rnd = CompetitionEngine.mulberry32(seed);
    const shuffled = CompetitionEngine.shuffle(pool, rnd);
    const used = new Set<string>();
    const picked: CompetitionQuestion[] = [];

    const take = (question: CompetitionQuestion) => {
      if (used.has(question.id)) return false;
      if (picked.length >= blueprint.questionCount) return false;
      used.add(question.id);
      picked.push(question);
      return true;
    };

    // 1) Explicit skill distribution (highest intent).
    const skillEntries = Object.entries(blueprint.skillDistribution ?? {});
    // Deterministic order: sorted by skill id so the paper is reproducible.
    skillEntries.sort(([a], [b]) => a.localeCompare(b));
    for (const [skillId, count] of skillEntries) {
      const skillPool = shuffled.filter((q) => q.skillId === skillId);
      let added = 0;
      for (const q of skillPool) {
        if (added >= count) break;
        if (take(q)) added += 1;
      }
    }

    // 2) Question-type distribution for whatever is still missing.
    const typeEntries = Object.entries(blueprint.questionTypeDistribution ?? {});
    typeEntries.sort(([a], [b]) => a.localeCompare(b));
    for (const [type, count] of typeEntries) {
      let added = 0;
      for (const q of shuffled) {
        if (added >= count) break;
        if (q.questionType !== type) continue;
        if (take(q)) added += 1;
      }
    }

    // 3) Difficulty distribution target for the whole paper.
    const target = CompetitionEngine.resolveDifficultyTargets(blueprint);
    if (target) {
      for (const [difficulty, wanted] of Object.entries(target)) {
        let added = CompetitionEngine.countByDifficulty(picked, difficulty as CompetitionDifficulty);
        for (const q of shuffled) {
          if (added >= wanted) break;
          if (q.difficulty !== difficulty) continue;
          if (take(q)) added += 1;
        }
      }
    }

    // 4) Fill the remainder from the (already shuffled) subject pool.
    for (const q of shuffled) {
      if (picked.length >= blueprint.questionCount) break;
      take(q);
    }

    // 5) Re-order into declared section order (exam fidelity, §11).
    return CompetitionEngine.orderBySection(picked, blueprint);
  }

  /**
   * Like `assembleExamQuestions` but reports the shortfall instead of silently
   * padding with duplicated items.
   */
  public static assembleExam(
    blueprint: ExamBlueprint,
    seed: number = SEED_POLICY.DEFAULT_EXAM_SEED
  ): {
    questions: CompetitionQuestion[];
    shortfall: number;
    coverage: {
      skillCount: number;
      questionTypeCount: number;
      difficultyCount: number;
      maxSkillShare: number;
    };
  } {
    const questions = CompetitionEngine.assembleExamQuestions(blueprint, seed);
    return {
      questions,
      shortfall: Math.max(0, blueprint.questionCount - questions.length),
      coverage: CompetitionEngine.coverageOf(questions),
    };
  }

  public static coverageOf(questions: CompetitionQuestion[]) {
    const skills = new Set(questions.map((q) => q.skillId));
    const types = new Set(questions.map((q) => q.questionType));
    const difficulties = new Set(questions.map((q) => q.difficulty));
    const maxSkillShare =
      questions.length === 0
        ? 0
        : Math.max(
            ...Object.values(
              questions.reduce<Record<string, number>>((acc, q) => {
                acc[q.skillId] = (acc[q.skillId] ?? 0) + 1;
                return acc;
              }, {})
            )
          ) / questions.length;
    return {
      skillCount: skills.size,
      questionTypeCount: Array.from(types).length,
      difficultyCount: difficulties.size,
      maxSkillShare: Math.round(maxSkillShare * 100) / 100,
    };
  }

  /** Turns a difficulty distribution (shares) into integer counts. */
  private static resolveDifficultyTargets(
    blueprint: ExamBlueprint
  ): Record<CompetitionDifficulty, number> | null {
    const dist = blueprint.difficultyDistribution;
    if (!dist) return null;
    const entries = Object.entries(dist).filter(([, share]) => share > 0);
    if (entries.length === 0) return null;
    const out = {} as Record<CompetitionDifficulty, number>;
    let assigned = 0;
    for (const [difficulty, share] of entries) {
      const count = Math.min(blueprint.questionCount - assigned, Math.floor(blueprint.questionCount * share));
      out[difficulty as CompetitionDifficulty] = count;
      assigned += count;
    }
    return out;
  }

  private static countByDifficulty(questions: CompetitionQuestion[], difficulty: CompetitionDifficulty) {
    return questions.filter((q) => q.difficulty === difficulty).length;
  }

  /** Groups questions by declared section; unlisted questions keep their order. */
  private static orderBySection(
    questions: CompetitionQuestion[],
    blueprint: ExamBlueprint
  ): CompetitionQuestion[] {
    if (!blueprint.sections || blueprint.sections.length === 0) return questions;
    const out: CompetitionQuestion[] = [];
    const taken = new Set<string>();
    for (const section of blueprint.sections) {
      for (const question of questions) {
        if (taken.has(question.id)) continue;
        if (section.skillIds.includes(question.skillId)) {
          out.push(question);
          taken.add(question.id);
        }
      }
    }
    for (const question of questions) {
      if (!taken.has(question.id)) out.push(question);
    }
    return out;
  }

  /**
   * Assemble questions for targeted practice on a single skill.
   */
  public static assembleSkillPractice(
    skillId: string,
    count: number = 5,
    seed: number = SEED_POLICY.DEFAULT_EXAM_SEED
  ): CompetitionQuestion[] {
    const pool = getQuestionsBySkill(skillId);
    if (pool.length === 0) {
      const skill = getSkillById(skillId);
      const subjectPool = skill ? getQuestionsBySubject(skill.subject) : COMPETITION_QUESTIONS;
      return CompetitionEngine.shuffle(subjectPool, CompetitionEngine.mulberry32(seed)).slice(0, count);
    }
    return CompetitionEngine.shuffle(pool, CompetitionEngine.mulberry32(seed)).slice(0, count);
  }

  /**
   * Assemble remediation practice questions for weak skills.
   */
  public static assembleAdaptiveRemediation(
    targetSkills: string[],
    count: number = 6,
    seed: number = SEED_POLICY.DEFAULT_EXAM_SEED
  ): CompetitionQuestion[] {
    const rnd = CompetitionEngine.mulberry32(seed);
    const selected: CompetitionQuestion[] = [];
    const used = new Set<string>();

    for (const skillId of [...targetSkills].sort()) {
      for (const q of CompetitionEngine.shuffle(getQuestionsBySkill(skillId), rnd)) {
        if (selected.length >= count) break;
        if (used.has(q.id)) continue;
        used.add(q.id);
        selected.push(q);
      }
      if (selected.length >= count) break;
    }

    if (selected.length < count) {
      for (const q of CompetitionEngine.shuffle(COMPETITION_QUESTIONS, rnd)) {
        if (selected.length >= count) break;
        if (used.has(q.id)) continue;
        used.add(q.id);
        selected.push(q);
      }
    }

    return selected;
  }

  // ==========================================================
  // Grading — the single source of truth for correctness (§1.3)
  // ==========================================================

  /** Canonicalises an answer so grading is deterministic and case/space safe. */
  public static normalizeAnswer(value: string | null | undefined): string {
    if (value === null || value === undefined) return '';
    return value
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase('vi');
  }

  /**
   * Grades one response. Accepts alternative canonical answers for fill-blank
   * synonyms. Purely deterministic: same inputs always give the same verdict.
   */
  public static gradeAnswer(question: CompetitionQuestion, userAnswer: string | null): boolean {
    const given = CompetitionEngine.normalizeAnswer(userAnswer);
    if (given.length === 0) return false;

    const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])];
    return accepted.some((candidate) => CompetitionEngine.normalizeAnswer(candidate) === given);
  }

  /** Human-readable rendering of a canonical answer for the review screen. */
  public static formatAnswer(question: CompetitionQuestion, canonical: string): string {
    switch (question.questionType) {
      case 'ordering':
        return canonical.split('|').join(' → ');
      case 'matching':
        return canonical
          .split('|')
          .filter(Boolean)
          .map((pair) => pair.replace('=', ' → '))
          .join(', ');
      default:
        return canonical;
    }
  }

  // ==========================================================
  // Speed & pacing (§9 — fairness)
  // ==========================================================

  /**
   * Accuracy-adjusted speed label.
   * SLOW + ACCURATE is never punished; FAST + INACCURATE is never rewarded.
   */
  public static evaluateSpeed(
    accuracy: number,
    averageSeconds: number
  ): { rating: SpeedRating; label: string } {
    if (accuracy >= SPEED_POLICY.HIGH_ACCURACY_MIN && averageSeconds <= SPEED_POLICY.EXCELLENT_MAX_SECONDS) {
      return { rating: 'EXCELLENT', label: 'Tốc độ xuất sắc & Chuẩn xác ⭐' };
    }
    if (accuracy >= SPEED_POLICY.HIGH_ACCURACY_MIN) {
      return { rating: 'STEADY', label: 'Vững vàng & Rất cẩn thận 🎯' };
    }
    if (accuracy < SPEED_POLICY.LOW_ACCURACY_MAX && averageSeconds <= SPEED_POLICY.RUSHING_MAX_SECONDS) {
      return { rating: 'RUSHING', label: 'Bé hơi vội vã, nên đọc kỹ đề bài hơn nhé 🐇' };
    }
    if (accuracy < SPEED_POLICY.LOW_ACCURACY_MAX && averageSeconds > SPEED_POLICY.SLOW_PACE_MIN_SECONDS) {
      return { rating: 'NEEDS_TIME', label: 'Bé cần thêm thời gian luyện phản xạ, cứ từ từ nhé 🐢' };
    }
    return { rating: 'SWIFT', label: 'Tiến độ đều đặn & Tự tin 🚀' };
  }

  // ==========================================================
  // Error analysis (§14)
  // ==========================================================

  /**
   * Data-driven error classification. No hardcoded question ids and no
   * hardcoded skill ids: rules use the question's own metadata.
   */
  public static analyzeErrors(
    responses: QuestionResponse[],
    questions: CompetitionQuestion[]
  ): ErrorAnalysisItem[] {
    const items: ErrorAnalysisItem[] = [];

    for (const response of responses) {
      if (response.isCorrect) continue;
      const question = questions.find((q) => q.id === response.questionId);
      if (!question) continue;

      const skill = getSkillById(question.skillId);
      const skillName = skill ? skill.skillName : question.skillId;
      const unanswered = !response.userAnswer;

      let category: ErrorCategory;
      let advice: string;

      if (unanswered) {
        category = 'UNCLASSIFIED';
        advice = 'Bé chưa chọn đáp án cho câu này. Cùng đọc lại đề và tìm từ khóa nhé.';
      } else if (response.timeSpentSeconds > 0 && response.timeSpentSeconds <= ERROR_ANALYSIS_POLICY.CARELESS_MAX_SECONDS) {
        category = 'CARELESS_ERROR';
        advice =
          'Bé chọn đáp án khá nhanh. Mình thử đọc hết các phương án rồi hãy chọn nhé, sẽ chính xác hơn nhiều!';
      } else if (
        question.difficulty === 'HARD' ||
        question.difficulty === 'CHALLENGE' ||
        question.questionType === 'ordering' ||
        question.questionType === 'matching'
      ) {
        category = 'REASONING_ERROR';
        advice = 'Câu này cần nhiều bước suy nghĩ. Bé thử làm từng bước một, hoặc dùng que tính để kiểm tra nhé.';
      } else if (
        question.questionType === 'drag-drop' ||
        question.questionType === 'classify' ||
        question.questionType === 'fill-blank'
      ) {
        category = 'MISREAD';
        advice = 'Bé đọc kỹ phần câu hỏi và đáp án nhé: dạng phân loại và điền chỗ trống cần đọc từng từ một.';
      } else if (question.skillId.startsWith('TV-READING') || question.skillId.startsWith('rf_')) {
        category = 'MISREAD';
        advice = 'Đây là câu đọc hiểu. Bé thử đọc lại đoạn văn và tìm câu chứa thông tin cần hỏi nhé.';
      } else {
        category = 'KNOWLEDGE_GAP';
        advice = `Kỹ năng "${skillName}" cần được ôn luyện thêm trong mục Luyện Dạng Bài.`;
      }

      items.push({
        questionId: question.id,
        prompt: question.prompt,
        skillId: question.skillId,
        skillName,
        questionType: question.questionType,
        userAnswer: response.userAnswer
          ? CompetitionEngine.formatAnswer(question, response.userAnswer)
          : 'Chưa trả lời',
        correctAnswer: CompetitionEngine.formatAnswer(question, question.correctAnswer),
        explanation: question.explanation,
        category,
        advice,
        remediation: CompetitionEngine.remediationFor(category, question, skillName),
      });
    }

    return items;
  }

  private static remediationFor(
    category: ErrorCategory,
    question: CompetitionQuestion,
    skillName: string
  ): ErrorAnalysisItem['remediation'] {
    if (category === 'CARELESS_ERROR') {
      return {
        actionType: 'SPEED_DRILL',
        label: 'Luyện đọc kỹ đề: đọc hết phương án rồi mới chọn',
      };
    }
    if (category === 'REASONING_ERROR') {
      return {
        actionType: 'PRACTICE_SKILL',
        label: `Luyện lại dạng bài "${skillName}" với các bài tập từng bước`,
        skillId: question.skillId,
      };
    }
    if (category === 'MISREAD' || question.skillId.startsWith('TV-READING')) {
      return {
        actionType: 'READ_PASSAGE',
        label: 'Luyện đọc hiểu: đọc đoạn văn rồi trả lời câu hỏi tìm thông tin',
      };
    }
    return {
      actionType: 'PRACTICE_SKILL',
      label: `Ôn lại "${skillName}" trong Luyện Dạng Bài`,
      skillId: question.skillId,
    };
  }

  // ==========================================================
  // Scoring (§13)
  // ==========================================================

  /**
   * Scores a finished session and returns a complete result document.
   *
   * The score is an explainable points ratio: `round(correct / total * maxScore)`.
   * Speed NEVER enters the score; it is reported separately under `scoring`.
   */
  public static scoreSession(
    blueprint: ExamBlueprint,
    questions: CompetitionQuestion[],
    responses: QuestionResponse[],
    timeUsedSeconds: number,
    history: CompetitionExamResult[],
    seed: number = SEED_POLICY.DEFAULT_EXAM_SEED
  ): CompetitionExamResult {
    const maxScore = blueprint.maxScore ?? DEFAULT_MAX_SCORE;
    const totalQuestions = questions.length;

    let correctCount = 0;
    let attemptedCount = 0;
    let totalQuestionSeconds = 0;
    let fastest = Number.POSITIVE_INFINITY;
    let slowest = 0;

    const skillPerformance: Record<string, { total: number; correct: number; skillName: string }> = {};
    const questionTypePerformance: Record<string, { total: number; correct: number }> = {};

    for (const question of questions) {
      const response = responses.find((r) => r.questionId === question.id);
      const isCorrect = response ? CompetitionEngine.gradeAnswer(question, response.userAnswer) : false;
      if (response && response.userAnswer) attemptedCount += 1;
      if (isCorrect) correctCount += 1;

      const seconds = response ? response.timeSpentSeconds : 0;
      totalQuestionSeconds += seconds;
      if (seconds > 0) {
        fastest = Math.min(fastest, seconds);
        slowest = Math.max(slowest, seconds);
      }

      const skill = getSkillById(question.skillId);
      const skillName = skill ? skill.skillName : question.skillId;
      const skillStat = skillPerformance[question.skillId] ?? {
        total: 0,
        correct: 0,
        skillName,
      };
      skillStat.total += 1;
      if (isCorrect) skillStat.correct += 1;
      skillPerformance[question.skillId] = skillStat;

      const typeStat = questionTypePerformance[question.questionType] ?? { total: 0, correct: 0 };
      typeStat.total += 1;
      if (isCorrect) typeStat.correct += 1;
      questionTypePerformance[question.questionType] = typeStat;
    }

    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const completion = totalQuestions > 0 ? Math.round((attemptedCount / totalQuestions) * 100) : 0;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * maxScore) : 0;
    const averageSeconds =
      totalQuestions > 0 ? Math.round(timeUsedSeconds / totalQuestions) : 0;
    const speed = CompetitionEngine.evaluateSpeed(accuracy, averageSeconds);

    const strongSkills: string[] = [];
    const weakSkills: string[] = [];
    for (const stat of Object.values(skillPerformance)) {
      if (stat.correct === stat.total) strongSkills.push(stat.skillName);
      else if (stat.correct / stat.total < ERROR_ANALYSIS_POLICY.WEAK_SKILL_MAX_RATIO) {
        weakSkills.push(stat.skillName);
      }
    }

    const errorAnalysis = CompetitionEngine.analyzeErrors(responses, questions);

    const scoring = {
      rawScore: score,
      maxScore,
      accuracy,
      completion,
      attemptedCount,
      correctCount,
      totalQuestions,
      totalSeconds: timeUsedSeconds,
      averageSecondsPerQuestion: averageSeconds,
      fastestQuestionSeconds: Number.isFinite(fastest) ? fastest : 0,
      slowestQuestionSeconds: slowest,
      skillPerformance,
      questionTypePerformance,
    };

    const draft = {
      id: `exam_res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      blueprintId: blueprint.id,
      examTitle: blueprint.title,
      subject: blueprint.subject,
      timestamp: new Date().toISOString(),
      durationSeconds: blueprint.durationSeconds,
      timeUsedSeconds,
      totalQuestions,
      correctCount,
      accuracy,
      score,
      speedRating: speed.rating,
      speedLabel: speed.label,
      averageSecondsPerQuestion: averageSeconds,
      responses,
      skillBreakdown: skillPerformance,
      strongSkills,
      weakSkills,
      errorAnalysis,
      readinessSnapshot: {} as ReadinessAssessment,
      scoring,
      provenance: {
        blueprintVersion: blueprint.version ?? 1,
        questionBankVersion: COMPETITION_BANK_VERSION,
        seed,
      },
    };

    draft.readinessSnapshot = CompetitionEngine.assessReadiness([...history, draft]);

    return draft;
  }

  // ==========================================================
  // Readiness (§P27 / P28)
  // ==========================================================

  /**
   * Explainable multi-factor readiness assessment.
   */
  public static assessReadiness(history: CompetitionExamResult[]): ReadinessAssessment {
    if (!history || history.length === 0) {
      return {
        overallLevel: 'FOUNDATION',
        overallLabel: 'Bắt đầu hành trình thử sức 🌱',
        knowledgeScore: 0,
        accuracyScore: 0,
        speedScore: 0,
        consistencyScore: 0,
        skillCoverageScore: 0,
        evidence: {
          totalExamsTaken: 0,
          recentAccuracyAverage: 0,
          medianSecondsPerQuestion: 0,
          strongSkillsCount: 0,
          weakSkillsCount: 0,
          totalSkillsCovered: 0,
        },
        recommendations: [
          'Bé hãy thử sức với một bài Mini Test 5 phút môn Tiếng Việt hoặc Toán học đầu tiên nhé!',
          'Hãy làm quen với dạng bài có đồng hồ đếm ngược với tâm lý vui vẻ, thoải mái.',
        ],
        isSufficientData: false,
      };
    }

    const recent = history.slice(-READINESS_POLICY.RECENT_WINDOW);
    const avgAccuracy = Math.round(
      recent.reduce((sum, h) => sum + h.accuracy, 0) / recent.length
    );
    const medianTime = Math.round(
      recent.reduce((sum, h) => sum + h.averageSecondsPerQuestion, 0) / recent.length
    );

    const variance =
      recent.reduce((sum, h) => sum + Math.pow(h.accuracy - avgAccuracy, 2), 0) / recent.length;
    const consistencyScore = Math.max(20, Math.min(100, Math.round(100 - Math.sqrt(variance))));

    const knowledgeScore = avgAccuracy;
    const accuracyScore = avgAccuracy;

    let speedScore = 75;
    if (medianTime <= SPEED_POLICY.EXCELLENT_MAX_SECONDS && avgAccuracy >= 75) speedScore = 95;
    else if (medianTime <= SPEED_POLICY.STEADY_MAX_SECONDS && avgAccuracy >= 65) speedScore = 80;
    else if (medianTime > SPEED_POLICY.NEEDS_TIME_MIN_SECONDS) speedScore = 60;

    const testedSkills = new Set<string>();
    const strongSkillsSet = new Set<string>();
    const weakSkillsSet = new Set<string>();
    for (const h of history) {
      for (const s of Object.keys(h.skillBreakdown || {})) testedSkills.add(s);
      (h.strongSkills ?? []).forEach((s) => strongSkillsSet.add(s));
      (h.weakSkills ?? []).forEach((s) => weakSkillsSet.add(s));
    }

    const totalTaxonomySkills = COMPETITION_SKILLS.length;
    const skillCoverageScore = Math.min(
      100,
      Math.round((testedSkills.size / totalTaxonomySkills) * 100)
    );

    const overallComposite = Math.round(
      knowledgeScore * READINESS_POLICY.WEIGHTS.KNOWLEDGE +
        speedScore * READINESS_POLICY.WEIGHTS.SPEED +
        consistencyScore * READINESS_POLICY.WEIGHTS.CONSISTENCY +
        skillCoverageScore * READINESS_POLICY.WEIGHTS.SKILL_COVERAGE
    );

    let overallLevel: ReadinessLevel;
    let overallLabel: string;
    if (
      history.length >= READINESS_POLICY.MIN_EXAMS_FOR_READY &&
      overallComposite >= READINESS_POLICY.READY_COMPOSITE_MIN &&
      avgAccuracy >= READINESS_POLICY.READY_ACCURACY_MIN
    ) {
      overallLevel = 'READY_FOR_MOCK';
      overallLabel = 'Sẵn sàng chinh phục Đấu Trường 🏆';
    } else if (
      overallComposite >= READINESS_POLICY.STRONG_COMPOSITE_MIN &&
      avgAccuracy >= READINESS_POLICY.STRONG_ACCURACY_MIN
    ) {
      overallLevel = 'STRONG';
      overallLabel = 'Vững vàng kiến thức ⭐';
    } else if (overallComposite >= READINESS_POLICY.PRACTICING_COMPOSITE_MIN) {
      overallLevel = 'PRACTICING';
      overallLabel = 'Tiến bộ rõ rệt qua từng bài 🚀';
    } else {
      overallLevel = 'DEVELOPING';
      overallLabel = 'Đang rèn luyện & khám phá 🌱';
    }

    const recommendations: string[] = [];
    if (weakSkillsSet.size > 0) {
      const topWeak = Array.from(weakSkillsSet).slice(0, 2).join(', ');
      recommendations.push(
        `Bé nên luyện thêm dạng bài: ${topWeak} trong mục Luyện Kỹ Năng để củng cố phản xạ.`
      );
    } else {
      recommendations.push('Bé nắm kiến thức rất chắc chắn ở các dạng bài đã thi!');
    }

    if (speedScore < 70) {
      recommendations.push(
        'Bé nên thử chế độ "Luyện Tốc Độ" (3 phút) để rèn sự nhanh nhạy khi làm bài trắc nghiệm.'
      );
    } else {
      recommendations.push('Tốc độ làm bài của bé rất nhịp nhàng và chuẩn xác.');
    }

    recommendations.push(
      `Bé đã thử sức ${history.length} bài thi. Ba mẹ hãy tiếp tục động viên bé rèn luyện đều đặn mỗi tuần!`
    );

    return {
      overallLevel,
      overallLabel,
      knowledgeScore,
      accuracyScore,
      speedScore,
      consistencyScore,
      skillCoverageScore,
      evidence: {
        totalExamsTaken: history.length,
        recentAccuracyAverage: avgAccuracy,
        medianSecondsPerQuestion: medianTime,
        strongSkillsCount: strongSkillsSet.size,
        weakSkillsCount: weakSkillsSet.size,
        totalSkillsCovered: testedSkills.size,
      },
      recommendations,
      isSufficientData: history.length >= READINESS_POLICY.MIN_EXAMS_FOR_SUFFICIENT_DATA,
    };
  }

  // ==========================================================
  // Internals
  // ==========================================================

  private static mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private static shuffle<T>(array: T[], rnd: () => number): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/** Labels for every supported exam format, used by the UI and the validator. */
export const QUESTION_TYPE_LABELS: Record<CompetitionQuestionType, string> = {
  'multiple-choice': 'Trắc nghiệm',
  'true-false': 'Đúng / Sai',
  'fill-blank': 'Điền vào chỗ trống',
  matching: 'Nối hình ghép đôi',
  ordering: 'Sắp xếp thứ tự',
  'drag-drop': 'Kéo thả vào nhóm',
  classify: 'Phân loại',
};

export type { CompetitionSubject };
