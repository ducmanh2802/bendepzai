import {
  AdaptiveLevel,
  ADAPTIVE_LEVEL_LABELS,
  EvidenceDifficulty,
  KnowledgeState,
  LearningEvidence,
  ProgressionDecision,
} from '../types/learningOS';
import { SubjectType } from '../types';
import { ADAPTIVE_DIFFICULTY_POLICY, SESSION_PROFILE_POLICY } from '../config/policy';
import { getAllQuestions, getAllSkills } from '../data/curriculum';
import type { Question } from '../types';
import { LearningOS } from './learningOS';

export interface SkillProfile {
  skillId: string;
  skillName: string;
  subject: SubjectType;
  currentLevel: AdaptiveLevel;
  recentAccuracy: number;
  independentAccuracy: number;
  assistedAccuracy: number;
  independentCorrect: number;
  independentAttempts: number;
  assistedCorrect: number;
  assistedAttempts: number;
  hintUsage: number;
  totalAttempts: number;
  misconceptionCategories: Record<string, number>;
  lastPracticedAt?: number;
  retentionEvidence: { correctOnReview: number; totalReviews: number };
  levelHistory: { level: AdaptiveLevel; timestamp: number; reason: string }[];
  status: KnowledgeState['status'];
}

export interface DifficultySelection {
  targetDifficulty: EvidenceDifficulty;
  adaptiveLevel: AdaptiveLevel;
  shouldScaffold: boolean;
  scaffoldingHint?: string;
  /** Question difficulty (1|2|3) that matches the current level. */
  targetQuestionDifficulty: 1 | 2 | 3;
}

export interface QuestionSelectionResult {
  questionIds: string[];
  shortfall: number;
  /** Ids that were requested but do not exist in the lesson bank. */
  missingIds: string[];
}

/**
 * Maps an adaptive level (L1-L5) onto the lesson bank difficulty (1-3).
 *
 * The lesson bank only carries three authored difficulty bands, so L1-L2 draw
 * from band 1, L3-L4 from band 2 and L5 from band 3. The adaptive level stays
 * the single source of truth for progression; this mapping only decides which
 * authored questions are eligible at that level.
 */
export function levelToQuestionDifficulty(level: AdaptiveLevel | number): 1 | 2 | 3 {
  if (level <= 2) return 1;
  if (level <= 4) return 2;
  return 3;
}

/** Vietnamese label for an adaptive level (child + parent facing). */
export function describeLevel(level: AdaptiveLevel): string {
  return ADAPTIVE_LEVEL_LABELS[level] ?? 'Nền tảng';
}

/**
 * ADAPTIVE DIFFICULTY SERVICE
 *
 * Thin, stateless façade over the single canonical evidence reducer in
 * `LearningOS` (there is exactly ONE reducer in this app — this service never
 * re-implements mastery maths) plus the question-selection policy that turns a
 * per-skill level into a concrete, seeded question set.
 */
export class AdaptiveDifficultyService {
  private static instance: AdaptiveDifficultyService;

  static getInstance(): AdaptiveDifficultyService {
    if (!AdaptiveDifficultyService.instance) {
      AdaptiveDifficultyService.instance = new AdaptiveDifficultyService();
    }
    return AdaptiveDifficultyService.instance;
  }

  createInitialKnowledgeState(
    skillId: string,
    skillName: string,
    subject: SubjectType
  ): KnowledgeState {
    return LearningOS.createInitialKnowledgeState(skillId, skillName, subject);
  }

  processEvidence(
    prev: KnowledgeState,
    evidence: LearningEvidence
  ): { newState: KnowledgeState; progression: ProgressionDecision | null } {
    return LearningOS.reduceEvidenceDetailed(prev, evidence);
  }

  /**
   * Decides the difficulty band for the next question of a skill.
   * Unknown skills (first contact) start at L1 with supportive scaffolding.
   */
  selectDifficulty(skillId: string, knowledgeMap: Record<string, KnowledgeState>): DifficultySelection {
    const state = knowledgeMap[skillId];
    if (!state) {
      return {
        targetDifficulty: ADAPTIVE_DIFFICULTY_POLICY.LEVEL_TO_EVIDENCE[ADAPTIVE_DIFFICULTY_POLICY.DEFAULT_STARTING_LEVEL],
        adaptiveLevel: ADAPTIVE_DIFFICULTY_POLICY.DEFAULT_STARTING_LEVEL,
        shouldScaffold: true,
        scaffoldingHint: 'Hãy đọc kỹ câu hỏi và chọn đáp án bé nghĩ là đúng nhé!',
        targetQuestionDifficulty: 1,
      };
    }

    const level = state.currentLevel ?? ADAPTIVE_DIFFICULTY_POLICY.DEFAULT_STARTING_LEVEL;
    const targetDifficulty = ADAPTIVE_DIFFICULTY_POLICY.LEVEL_TO_EVIDENCE[level] || 'MEDIUM';

    const shouldScaffold =
      state.consecutiveIncorrect >= ADAPTIVE_DIFFICULTY_POLICY.SUPPORT_TRIGGER_CONSECUTIVE_INCORRECT ||
      (state.independentAttempts > 0 &&
        state.recentAccuracy < ADAPTIVE_DIFFICULTY_POLICY.REGRESSION_ACCURACY_THRESHOLD);

    return {
      targetDifficulty,
      adaptiveLevel: level,
      shouldScaffold,
      scaffoldingHint: shouldScaffold ? this.generateScaffoldingHint(state) : undefined,
      targetQuestionDifficulty: levelToQuestionDifficulty(level),
    };
  }

  getSkillProfile(skillId: string, knowledgeMap: Record<string, KnowledgeState>): SkillProfile | null {
    const state = knowledgeMap[skillId];
    if (!state) return null;

    return {
      skillId: state.skillId,
      skillName: state.skillName,
      subject: state.subject,
      currentLevel: state.currentLevel ?? 1,
      recentAccuracy: state.recentAccuracy,
      independentAccuracy: LearningOS.independentAccuracy(state),
      assistedAccuracy: LearningOS.assistedAccuracy(state),
      independentCorrect: state.independentCorrect,
      independentAttempts: state.independentAttempts,
      assistedCorrect: state.assistedCorrect,
      assistedAttempts: state.assistedAttempts,
      hintUsage: state.hintCount,
      totalAttempts: state.attemptCount,
      misconceptionCategories: { ...state.misconceptionCategories },
      lastPracticedAt: state.lastPracticedAt,
      retentionEvidence: { ...state.retentionEvidence },
      levelHistory: state.levelHistory.map((h) => ({ ...h })),
      status: state.status,
    };
  }

  /**
   * Picks real questions for one skill at its adaptive level.
   *
   * Selection is seeded (reproducible under a fixed seed for tests) and stable:
   * the same seed + knowledgeMap always yields the same set. `excludeIds`
   * prevents repeating questions the child already saw this session.
   */
  getQuestionsForSkill(
    skillId: string,
    knowledgeMap: Record<string, KnowledgeState>,
    count: number,
    options: { seed?: number; excludeIds?: string[] } = {}
  ): QuestionSelectionResult {
    const selection = this.selectDifficulty(skillId, knowledgeMap);
    const band = selection.targetQuestionDifficulty;
    const excluded = new Set(options.excludeIds ?? []);
    const all = getAllQuestions().filter((q) => q.skillId === skillId && !excluded.has(q.id));

    // Prefer the band that matches the level; degrade gracefully to the
    // nearest authored band when the bank has nothing at that band.
    const exact = all.filter((q) => q.difficulty === band);
    const easier = all.filter((q) => q.difficulty < band);
    const harder = all.filter((q) => q.difficulty > band);
    const ordered = [...exact, ...harder, ...easier];

    const picked = this.deterministicPick(ordered, count, options.seed ?? this.seedForSkill(skillId));
    return {
      questionIds: picked.map((q) => q.id),
      shortfall: Math.max(0, count - picked.length),
      missingIds: [],
    };
  }

  /** Resolves persisted question ids back to real questions (order preserved). */
  resolveQuestions(questionIds: string[]): { questions: Question[]; missingIds: string[] } {
    const byId = new Map(getAllQuestions().map((q) => [q.id, q]));
    const questions: Question[] = [];
    const missingIds: string[] = [];
    for (const id of questionIds) {
      const q = byId.get(id);
      if (q) questions.push(q);
      else missingIds.push(id);
    }
    return { questions, missingIds };
  }

  /**
   * Builds the review set from real learning evidence: skills that are due
   * for spaced review, then the weakest practising skills. Never random filler.
   */
  getReviewQuestions(
    knowledgeMap: Record<string, KnowledgeState>,
    count: number,
    options: { now?: number; seed?: number } = {}
  ): { questionIds: string[]; focusSkills: string[] } {
    const now = options.now ?? Date.now();
    const allQuestions = getAllQuestions();
    const seed = options.seed ?? SEED_POLICY_FALLBACK;

    const dueSkills = Object.values(knowledgeMap)
      .filter((s) => s.status === 'MASTERED' && s.nextReviewAt && s.nextReviewAt <= now)
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));

    const weakSkills = Object.values(knowledgeMap)
      .filter((s) => s.status === 'NEEDS_REVIEW' || s.status === 'PRACTICING' || s.status === 'LEARNING')
      .sort((a, b) => a.recentAccuracy - b.recentAccuracy || a.skillId.localeCompare(b.skillId));

    const focusSkills: string[] = [];
    const questionIds: string[] = [];

    for (const skill of [...dueSkills, ...weakSkills]) {
      if (questionIds.length >= count) break;
      if (focusSkills.includes(skill.skillId)) continue;
      focusSkills.push(skill.skillId);

      const skillQuestions = allQuestions.filter((q) => q.skillId === skill.skillId);
      if (skillQuestions.length === 0) continue;

      // Level-aware: a mastered skill is re-checked at challenge band first.
      const level = skill.currentLevel ?? 1;
      const ordered = [...skillQuestions].sort(
        (a, b) => Math.abs(b.difficulty - levelToQuestionDifficulty(level)) - Math.abs(a.difficulty - levelToQuestionDifficulty(level))
      );
      const picked = this.deterministicPick(ordered, 1, seed + focusSkills.length);
      questionIds.push(picked[0].id);
    }

    return { questionIds: questionIds.slice(0, count), focusSkills };
  }

  generateScaffoldingHint(state: KnowledgeState): string {
    const misconceptions = Object.entries(state.misconceptionCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat]) => cat);

    if (misconceptions.length > 0) {
      return `Hãy đọc kỹ câu hỏi nhé! Lần trước bé nhầm ở phần "${misconceptions[0]}". Thử lại xem sao!`;
    }

    if (state.errorProfile.careless > 0) {
      return 'Chậm rãi thôi nào! Đọc kỹ câu hỏi rồi chọn đáp án nhé!';
    }

    if (state.errorProfile.knowledgeGap > 0) {
      return 'Hãy nhìn kỹ hình ảnh và đọc kỹ câu hỏi. Bé làm được mà!';
    }

    return 'Đừng lo nhé! Thử đọc kỹ câu hỏi một lần nữa xem sao!';
  }

  /** Skills the child has never practised (cold start ordering). */
  getUnstartedSkills(subject: SubjectType, knowledgeMap: Record<string, KnowledgeState>, limit = 3): string[] {
    return getAllSkills()
      .filter((s) => s.subject === subject && !knowledgeMap[s.skillId])
      .slice(0, limit)
      .map((s) => s.skillId);
  }

  /** Weakest practised skills of a subject (remediation first, then progress). */
  getWeakestSkills(subject: SubjectType, knowledgeMap: Record<string, KnowledgeState>, limit = 3): string[] {
    return Object.values(knowledgeMap)
      .filter((s) => s.subject === subject && s.attemptCount > 0)
      .sort((a, b) => a.recentAccuracy - b.recentAccuracy || a.skillId.localeCompare(b.skillId))
      .slice(0, limit)
      .map((s) => s.skillId);
  }

  private seedForSkill(skillId: string): number {
    let hash = 0;
    for (let i = 0; i < skillId.length; i += 1) {
      hash = (hash * 31 + skillId.charCodeAt(i)) & 0x7fffffff;
    }
    return hash;
  }

  private deterministicPick(candidates: Question[], count: number, seed: number): Question[] {
    if (candidates.length <= count) return [...candidates];
    const rng = seededRandom(seed);
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }
}

/** Deterministic LCG so every selection is reproducible under a fixed seed. */
export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Fallback seed when a caller does not supply one (stable across sessions). */
export const SEED_POLICY_FALLBACK = SESSION_PROFILE_POLICY.POLICY_VERSION.length * 7919;

export const adaptiveDifficulty = AdaptiveDifficultyService.getInstance();
