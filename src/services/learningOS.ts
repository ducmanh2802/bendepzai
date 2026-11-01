import {
  ActionType,
  AdaptiveLevel,
  DailyPlan,
  DailyPlanItem,
  EvidenceDifficulty,
  EvidenceReductionResult,
  KnowledgeState,
  KnowledgeStatus,
  LearningAction,
  LearningEvidence,
  ProgressionDecision,
  RecommendationExplanation,
  SessionFatigueState,
} from '../types/learningOS';
import { SessionProfileKind, SubjectType } from '../types';
import { localDateKey } from './dateUtils';
import { getAllSkills } from '../data/curriculum';
import { COMPETITION_SKILLS } from '../data/competitionTaxonomy';
import { ADAPTIVE_DIFFICULTY_POLICY, SPEED_POLICY } from '../config/policy';

export const LEARNING_OS_POLICY = {
  POLICY_VERSION: 'P41-v1',
  MIN_DAILY_MINUTES: 10,
  MAX_DAILY_MINUTES: 20,
  DEFAULT_DAILY_ITEMS: 3,
  MAX_DAILY_ITEMS: 4,
  RECENCY_WINDOW: 5,
  FATIGUE_MAX_QUESTIONS: 25,
  FATIGUE_MAX_CONSECUTIVE_ERRORS: 4,
  /**
   * P0-2 — a child who comes back after a long break must not inherit the
   * previous session's fatigue. Any inactivity gap longer than this starts a
   * fresh session (counters and isFatigued reset). 30 minutes ≈ one school
   * period plus a short rest; shorter gaps keep the session continuous.
   */
  FATIGUE_SESSION_GAP_MS: 30 * 60 * 1000,
  OVERPRACTICE_THRESHOLD: 15,
  MASTERY_HIGH_THRESHOLD: 85,
  MASTERY_LOW_THRESHOLD: 60,
  /** Expanding spaced-review ladder in days (retention evidence moves up it). */
  SPACED_INTERVAL_DAYS: ADAPTIVE_DIFFICULTY_POLICY.SPACED_REVIEW_INTERVAL_DAYS,
  /** Consecutive successful reviews that pull the ladder index forward. */
  RETENTION_STRENGTHEN_AFTER: 2,
};

/**
 * P0-2 fix — fatigue auto-resets so the rest recommendation can never latch
 * forever. A session is stale when either:
 *  - the child was inactive for FATIGUE_SESSION_GAP_MS (e.g. came back after
 *    school / a nap / the next morning), or
 *  - the device-local calendar day changed (Vietnam time, see dateUtils).
 * Returns the SAME object when still active (identity keeps callers simple).
 */
export function resetStaleFatigue(fatigue: SessionFatigueState, now: number): SessionFatigueState {
  const gapExceeded = now - fatigue.sessionStartTime >= LEARNING_OS_POLICY.FATIGUE_SESSION_GAP_MS;
  const dayChanged = localDateKey(new Date(now)) !== localDateKey(new Date(fatigue.sessionStartTime));
  if (!gapExceeded && !dayChanged) return fatigue;
  return {
    sessionStartTime: now,
    questionsAnsweredThisSession: 0,
    sessionErrorsCount: 0,
    consecutiveErrorsInSession: 0,
    isFatigued: false,
  };
}

const DAY_MS = 24 * 3600 * 1000;

export class LearningOS {
  /**
   * Initializes a pristine default knowledge state for a skill.
   *
   * The adaptive fields (level, independence counters, misconception map,
   * retention evidence) start empty on purpose: difficulty only ever moves on
   * real demonstrated evidence, never on a fresh profile.
   */
  public static createInitialKnowledgeState(
    skillId: string,
    skillName: string,
    subject: SubjectType
  ): KnowledgeState {
    return {
      skillId,
      skillName,
      subject,
      status: 'NOT_STARTED',
      mastery: 0,
      confidence: 0,
      accuracy: 0,
      recentAccuracy: 0,
      attemptCount: 0,
      correctCount: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      independentAttempts: 0,
      independentCorrect: 0,
      assistedAttempts: 0,
      assistedCorrect: 0,
      hintCount: 0,
      currentLevel: ADAPTIVE_DIFFICULTY_POLICY.DEFAULT_STARTING_LEVEL,
      levelHistory: [],
      misconceptionCategories: {},
      retentionEvidence: { correctOnReview: 0, totalReviews: 0 },
      difficultyPerformance: {
        easy: { attempts: 0, correct: 0 },
        medium: { attempts: 0, correct: 0 },
        hard: { attempts: 0, correct: 0 },
        challenge: { attempts: 0, correct: 0 },
      },
      errorProfile: {
        knowledgeGap: 0,
        careless: 0,
        speed: 0,
        misread: 0,
        reasoning: 0,
        unclassified: 0,
      },
      evidenceVersion: 1,
    };
  }

  /**
   * Pure deterministic reducer: consumes an existing KnowledgeState and a new LearningEvidence
   * and computes the updated KnowledgeState.
   *
   * This is the single canonical fold for the whole app — lessons, games,
   * review and competition evidence all arrive here, so per-skill adaptive
   * difficulty, mastery and review scheduling stay consistent everywhere.
   * Use {@link LearningOS.reduceEvidenceDetailed} when the caller also needs
   * the explainable progression decision.
   */
  public static reduceEvidence(
    prev: KnowledgeState,
    evidence: LearningEvidence
  ): KnowledgeState {
    return LearningOS.reduceEvidenceDetailed(prev, evidence).newState;
  }

  /**
   * Same deterministic fold as `reduceEvidence`, but also returns the adaptive
   * progression decision (level up / level down / support) that the evidence
   * triggered, so callers can explain it to parents and children.
   */
  public static reduceEvidenceDetailed(
    prev: KnowledgeState,
    evidence: LearningEvidence
  ): EvidenceReductionResult {
    const isCorrect = evidence.correct;
    // An answer given after a hint is assistance, not independence. Only
    // independent answers can ever raise the demonstrated level.
    const isIndependent = evidence.usedHint !== true;
    const attemptCount = prev.attemptCount + 1;
    const correctCount = isCorrect ? prev.correctCount + 1 : prev.correctCount;
    const consecutiveCorrect = isCorrect ? prev.consecutiveCorrect + 1 : 0;
    const consecutiveIncorrect = isCorrect ? 0 : prev.consecutiveIncorrect + 1;

    // Difficulty breakdown update
    const diffKey = (evidence.difficulty?.toLowerCase() || 'medium') as keyof typeof prev.difficultyPerformance;
    const currentDiff = prev.difficultyPerformance[diffKey] || { attempts: 0, correct: 0 };
    const difficultyPerformance = {
      ...prev.difficultyPerformance,
      [diffKey]: {
        attempts: currentDiff.attempts + 1,
        correct: isCorrect ? currentDiff.correct + 1 : currentDiff.correct,
      },
    };

    // Error profile update
    const errorProfile = { ...prev.errorProfile };
    if (!isCorrect && evidence.errorType) {
      if (evidence.errorType === 'CARELESS_ERROR') errorProfile.careless += 1;
      else if (evidence.errorType === 'REASONING_ERROR') errorProfile.reasoning += 1;
      else if (evidence.errorType === 'SPEED_ERROR') errorProfile.speed += 1;
      else if (evidence.errorType === 'MISREAD') errorProfile.misread += 1;
      else if (evidence.errorType === 'KNOWLEDGE_GAP') errorProfile.knowledgeGap += 1;
      else errorProfile.unclassified += 1;
    }

    // Misconception categories drive distractor design and remediation
    const misconceptionCategories = { ...prev.misconceptionCategories };
    if (!isCorrect && evidence.errorType) {
      misconceptionCategories[evidence.errorType] = (misconceptionCategories[evidence.errorType] || 0) + 1;
    }

    // Response time rolling average (never used to punish a slow reader)
    let averageResponseTimeMs = prev.averageResponseTimeMs;
    if (evidence.responseTimeMs && evidence.responseTimeMs > 0) {
      if (!averageResponseTimeMs) {
        averageResponseTimeMs = evidence.responseTimeMs;
      } else {
        averageResponseTimeMs = Math.round(
          (averageResponseTimeMs * (attemptCount - 1) + evidence.responseTimeMs) / attemptCount
        );
      }
    }

    // Lifetime accuracy (0 - 100)
    const accuracy = Math.round((correctCount / attemptCount) * 100);

    // Recent accuracy with higher weight on recent events
    let recentAccuracy: number;
    if (attemptCount <= 3) {
      recentAccuracy = accuracy;
    } else {
      // Exponential moving average (alpha = 0.4)
      const prevRecent = prev.recentAccuracy || accuracy;
      recentAccuracy = Math.round(prevRecent * 0.6 + (isCorrect ? 100 : 0) * 0.4);
    }

    // Confidence metric (0 - 100): based on evidence sample size & consistency
    const sampleFactor = Math.min(1, attemptCount / 6); // 6 attempts reach full confidence
    const consistencyPenalty = consecutiveIncorrect >= 2 ? 0.8 : 1.0;
    const confidence = Math.round(sampleFactor * 100 * consistencyPenalty);

    // Blended mastery (0 - 100)
    // 40% lifetime accuracy, 40% recent accuracy, 20% consistency/confidence
    let mastery = Math.round(accuracy * 0.4 + recentAccuracy * 0.4 + confidence * 0.2);

    // Difficulty bonus for hard/challenge successes
    if (difficultyPerformance.hard.correct > 0 || difficultyPerformance.challenge.correct > 0) {
      mastery = Math.min(100, mastery + 5);
    }

    // Determine status deterministically
    let status: KnowledgeStatus = 'LEARNING';
    if (attemptCount === 0) {
      status = 'NOT_STARTED';
    } else if (consecutiveIncorrect >= 2 || (attemptCount >= 3 && recentAccuracy < LEARNING_OS_POLICY.MASTERY_LOW_THRESHOLD)) {
      status = 'NEEDS_REVIEW';
    } else if (attemptCount >= 4 && recentAccuracy >= LEARNING_OS_POLICY.MASTERY_HIGH_THRESHOLD && mastery >= 80) {
      status = 'MASTERED';
    } else if (attemptCount >= 2) {
      status = 'PRACTICING';
    } else {
      status = 'LEARNING';
    }

    // ==========================================================
    // ADAPTIVE DIFFICULTY (per skill, evidence-driven)
    // ==========================================================
    const independentAttempts = isIndependent ? prev.independentAttempts + 1 : prev.independentAttempts;
    const independentCorrect = isIndependent && isCorrect ? prev.independentCorrect + 1 : prev.independentCorrect;
    const assistedAttempts = isIndependent ? prev.assistedAttempts : prev.assistedAttempts + 1;
    const assistedCorrect = !isIndependent && isCorrect ? prev.assistedCorrect + 1 : prev.assistedCorrect;
    const hintCount = evidence.usedHint ? prev.hintCount + 1 : prev.hintCount;

    // Retention evidence is only counted from real review events, so spaced
    // retrieval can prove that knowledge survived, not just that it existed.
    const isReviewEvidence = evidence.source === 'REVIEW';
    const retentionEvidence = isReviewEvidence
      ? {
          correctOnReview: prev.retentionEvidence.correctOnReview + (isCorrect ? 1 : 0),
          totalReviews: prev.retentionEvidence.totalReviews + 1,
        }
      : prev.retentionEvidence;

    const levelHistory: KnowledgeState['levelHistory'] = [...prev.levelHistory];
    const needsSupport =
      consecutiveIncorrect >= ADAPTIVE_DIFFICULTY_POLICY.SUPPORT_TRIGGER_CONSECUTIVE_INCORRECT ||
      (independentAttempts >= ADAPTIVE_DIFFICULTY_POLICY.MIN_ATTEMPTS_AT_LEVEL &&
        recentAccuracy < ADAPTIVE_DIFFICULTY_POLICY.REGRESSION_ACCURACY_THRESHOLD);

    const progression = LearningOS.evaluateProgression({
      state: prev,
      independentCorrect,
      independentAttempts,
      recentAccuracy,
      consecutiveCorrect,
      needsSupport,
      timestamp: evidence.timestamp,
    });

    let currentLevel = prev.currentLevel;
    if (progression) {
      currentLevel = progression.newLevel;
      levelHistory.push({ level: progression.newLevel, timestamp: evidence.timestamp, reason: progression.reason });
    }

    // Schedule spaced review with an expanding interval. A mastered skill is
    // re-checked sooner the first time and later once retention is proven.
    let nextReviewAt = prev.nextReviewAt;
    if (status === 'MASTERED') {
      const strengthening =
        retentionEvidence.totalReviews > 0 &&
        retentionEvidence.correctOnReview >= LEARNING_OS_POLICY.RETENTION_STRENGTHEN_AFTER;
      const ladder = LEARNING_OS_POLICY.SPACED_INTERVAL_DAYS;
      const index = strengthening ? Math.min(ladder.length - 1, 2) : 0;
      nextReviewAt = evidence.timestamp + ladder[index] * DAY_MS;
    }

    const newState: KnowledgeState = {
      skillId: prev.skillId,
      skillName: prev.skillName,
      subject: prev.subject,
      status,
      mastery,
      confidence,
      accuracy,
      recentAccuracy,
      attemptCount,
      correctCount,
      consecutiveCorrect,
      consecutiveIncorrect,
      independentAttempts,
      independentCorrect,
      assistedAttempts,
      assistedCorrect,
      hintCount,
      currentLevel,
      levelHistory,
      misconceptionCategories,
      retentionEvidence,
      lastPracticedAt: evidence.timestamp,
      lastCorrectAt: isCorrect ? evidence.timestamp : prev.lastCorrectAt,
      lastIncorrectAt: !isCorrect ? evidence.timestamp : prev.lastIncorrectAt,
      averageResponseTimeMs,
      difficultyPerformance,
      errorProfile,
      nextReviewAt,
      evidenceVersion: prev.evidenceVersion + 1,
    };

    return { newState, progression };
  }

  /**
   * Adaptive progression rules for one skill.
   *
   * Rules (all configurable in ADAPTIVE_DIFFICULTY_POLICY):
   *  - Level rises only after repeated INDEPENDENT success across different
   *    questions (hinted answers never count), with accuracy above the
   *    progression threshold and enough attempts at the current level.
   *  - Level drops by at most one step and only for support (consecutive
   *    failures or accuracy collapse) — a single mistake never demotes.
   *  - A skill that just changed level must practise at it before moving again,
   *    so levels cannot oscillate.
   */
  private static evaluateProgression(input: {
    state: KnowledgeState;
    independentCorrect: number;
    independentAttempts: number;
    recentAccuracy: number;
    consecutiveCorrect: number;
    needsSupport: boolean;
    timestamp: number;
  }): ProgressionDecision | null {
    const {
      state,
      independentCorrect,
      independentAttempts,
      recentAccuracy,
      consecutiveCorrect,
      needsSupport,
      timestamp,
    } = input;
    const policy = ADAPTIVE_DIFFICULTY_POLICY;
    const currentLevel = state.currentLevel;
    const reasons: string[] = [];
    reasons.push(`${state.attemptCount + 1} lượt làm bài`);
    reasons.push(`Chính xác gần đây ${recentAccuracy}%`);

    // Support first: never punish, only scaffold.
    if (needsSupport && currentLevel > policy.DEFAULT_STARTING_LEVEL) {
      const newLevel = Math.max(
        policy.DEFAULT_STARTING_LEVEL,
        currentLevel - policy.MAX_LEVEL_DROP_PER_EVENT
      ) as AdaptiveLevel;
      return {
        skillId: state.skillId,
        previousLevel: currentLevel,
        newLevel,
        reason: 'Cần hỗ trợ — tạm thời giảm độ khó để củng cố',
        evidence: [...reasons, `${state.consecutiveIncorrect + 1} lần chưa đúng gần đây`],
        timestamp,
      };
    }

    // Enough practice at the current level before it may change.
    // Use the NEW attempt count (state.attemptCount + 1) since progression
    // is evaluated after folding in the current evidence.
    const newAttemptCount = state.attemptCount + 1;
    const attemptsAtLevel = LearningOS.attemptsAtCurrentLevel(state, newAttemptCount);
    if (attemptsAtLevel < policy.MIN_ATTEMPTS_AT_LEVEL) return null;
    if (independentAttempts < policy.MIN_ATTEMPTS_AT_LEVEL) return null;
    if (independentCorrect < policy.MIN_INDEPENDENT_FOR_PROGRESSION) return null;
    if (consecutiveCorrect < policy.MIN_INDEPENDENT_FOR_PROGRESSION) return null;
    if (recentAccuracy < policy.PROGRESSION_ACCURACY_THRESHOLD) return null;
    if (currentLevel >= policy.MAX_LEVEL) return null;

    const newLevel = Math.min(policy.MAX_LEVEL, currentLevel + 1) as AdaptiveLevel;
    return {
      skillId: state.skillId,
      previousLevel: currentLevel,
      newLevel,
      reason: 'Tăng độ khó — bé trả lời độc lập đạt chuẩn',
      evidence: [
        ...reasons,
        `${independentCorrect}/${independentAttempts} câu đúng không cần gợi ý`,
        `${consecutiveCorrect} câu đúng liên tiếp`,
      ],
      timestamp,
    };
  }

  /**
   * Attempts spent at the current level. A fresh level (or a level that was
   * just entered) requires MIN_ATTEMPTS_AT_LEVEL new evidence before the next
   * change, which is what prevents level oscillation.
   *
   * @param state The knowledge state BEFORE the current evidence is applied
   * @param newAttemptCount The attempt count AFTER the current evidence (state.attemptCount + 1)
   */
  private static attemptsAtCurrentLevel(state: KnowledgeState, newAttemptCount: number): number {
    const history = state.levelHistory;
    if (history.length === 0) return newAttemptCount;
    const lastChange = history[history.length - 1];
    if (lastChange.level === state.currentLevel) {
      // Approximate the boundary by attempt volume: each level change is only
      // granted after MIN_ATTEMPTS_AT_LEVEL attempts, so the attempts recorded
      // after the last change are the ones at the current level.
      return Math.max(0, newAttemptCount - history.length * ADAPTIVE_DIFFICULTY_POLICY.MIN_ATTEMPTS_AT_LEVEL);
    }
    return newAttemptCount;
  }

  /** Independent accuracy (0-100): answers without any hint. */
  public static independentAccuracy(state: KnowledgeState): number {
    if (state.independentAttempts === 0) return 0;
    return Math.round((state.independentCorrect / state.independentAttempts) * 100);
  }

  /** Assisted accuracy (0-100): answers given after a hint. */
  public static assistedAccuracy(state: KnowledgeState): number {
    if (state.assistedAttempts === 0) return 0;
    return Math.round((state.assistedCorrect / state.assistedAttempts) * 100);
  }


  /**
   * Generates prioritized list of Next Best Actions based on knowledge states, fatigue, and policy.
   *
   * `trackActions` lets a learning track (e.g. the Kid's Box Companion) inject
   * its own evidence-driven recommendations into the same ranked list, instead
   * of running a second, parallel recommendation engine (§1, §26). A track
   * still cannot invent mastery: it only proposes actions from its own evidence.
   */
  public static getNextBestActions(
    knowledgeMap: Record<string, KnowledgeState>,
    fatigue?: SessionFatigueState,
    currentTime: number = Date.now(),
    trackActions: LearningAction[] = []
  ): LearningAction[] {
    const states = Object.values(knowledgeMap);
    const totalEvidenceCount = states.reduce((sum, s) => sum + s.attemptCount, 0);

    // Track actions lead the list while a track still has work to propose, so
    // the child sees the track's own next best step first (§19, §22).
    if (trackActions.length > 0) {
      return [...trackActions].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
    }

    // ==========================================
    // 1. COLD START HANDLER (New child with 0 or < 3 total attempts)
    // ==========================================
    if (totalEvidenceCount < 3) {
      return [
        {
          id: 'action_cold_viet',
          type: 'LEARN',
          subject: 'tieng-viet',
          skillId: 'vn_alphabet',
          skillName: 'Bảng Chữ Cái Tiếng Việt',
          lessonId: 'vn-les-1',
          title: 'Khám Phá Chữ Cái A, B, C',
          description: 'Làm quen bảng chữ cái tiếng Việt cùng Gấu Bút Chì',
          reason: 'Bắt đầu hành trình lớp 1 với kiến thức chữ cái nền tảng vững chắc.',
          childExplanation: 'Cùng bạn Gấu Bút Chì học những chữ cái xinh xắn đầu tiên nhé!',
          estimatedMinutes: 5,
          priority: 95,
          badgeEmoji: '🔤',
        },
        {
          id: 'action_cold_math',
          type: 'LEARN',
          subject: 'toan',
          skillId: 'math_counting_10',
          skillName: 'Đếm Số Trong Phạm Vi 10',
          lessonId: 'math-les-1',
          title: 'Đếm Số 0 Đến 5 Kỳ Thú',
          description: 'Tập đếm đồ vật thân quen cùng Cáo Toán Học',
          reason: 'Làm quen số đếm cơ bản qua hình ảnh đồ vật trực quan sinh động.',
          childExplanation: 'Đếm xem có bao nhiêu bạn táo và ngôi sao đang chờ bé kìa!',
          estimatedMinutes: 5,
          priority: 90,
          badgeEmoji: '🔢',
        },
        {
          id: 'action_cold_game',
          type: 'GAME',
          subject: 'tieng-viet',
          gameId: 'catch_letters',
          gameTitle: 'Bắt Chữ Cái Bay',
          title: 'Trò Chơi: Bắt Chữ Cái Bay',
          description: 'Hứng những chữ cái rơi để làm quen phản xạ',
          reason: 'Tạo cảm xúc vui vẻ, hào hứng và làm quen thao tác trong ứng dụng.',
          childExplanation: 'Chơi một trò chơi hứng chữ cực vui để nhận điểm thưởng nhé!',
          estimatedMinutes: 3,
          priority: 85,
          badgeEmoji: '🎮',
        },
      ];
    }

    // ==========================================
    // 2. SESSION FATIGUE OVERRIDE
    // ==========================================
    if (fatigue && fatigue.isFatigued) {
      return [
        {
          id: 'action_fatigue_rest',
          type: 'GAME',
          subject: 'toan',
          gameId: 'memory_cards',
          gameTitle: 'Lật Thẻ Trí Nhớ Vàng',
          title: 'Thư Giãn Cùng Lật Thẻ Trí Nhớ',
          description: 'Trò chơi nhẹ nhàng giúp mắt bé nghỉ ngơi và thư giãn tinh thần',
          reason: 'Bé đã học liên tục trong thời gian dài. Hệ thống chuyển sang hoạt động thư giãn nhẹ nhàng.',
          childExplanation: 'Hôm nay con đã rất chăm chỉ rồi! Chơi một trò chơi nhẹ nhàng rồi nghỉ ngơi nhé.',
          estimatedMinutes: 3,
          priority: 99,
          badgeEmoji: '🌈',
        },
      ];
    }

    const candidateActions: LearningAction[] = [];

    // ==========================================
    // 3. PRIORITY PIPELINE
    // ==========================================
    for (const k of states) {
      // P0: Critical Knowledge Gap (NEEDS_REVIEW with high errors)
      if (k.status === 'NEEDS_REVIEW') {
        candidateActions.push({
          id: `remediate_${k.skillId}`,
          type: 'PRACTICE',
          subject: k.subject,
          skillId: k.skillId,
          skillName: k.skillName,
          title: `Củng Cố: ${k.skillName}`,
          description: `Luyện tập 5 câu hỏi trọng tâm giúp con nắm vững ${k.skillName}`,
          reason: `Độ chính xác gần đây ${k.recentAccuracy}% (${k.consecutiveIncorrect} lần chưa đúng). Cần củng cố ngay.`,
          childExplanation: `Đừng lo nhé! Chúng mình cùng bạn Gấu ôn lại ${k.skillName} một chút là nhớ ngay!`,
          estimatedMinutes: 5,
          priority: 90 + Math.min(8, k.consecutiveIncorrect * 2),
          badgeEmoji: '🎯',
        });
      }

      // P1: Spaced Repetition / Forgetting Risk
      else if (k.status === 'MASTERED' && k.nextReviewAt && k.nextReviewAt <= currentTime) {
        candidateActions.push({
          id: `review_${k.skillId}`,
          type: 'REVIEW',
          subject: k.subject,
          skillId: k.skillId,
          skillName: k.skillName,
          title: `Ôn Tập Định Kỳ: ${k.skillName}`,
          description: `Ôn nhanh 3 câu hỏi để kích hoạt trí nhớ dài hạn`,
          reason: `Đã làm chủ kỹ năng nhưng đã qua thời gian giãn cách ôn tập. Tránh nguy cơ quên.`,
          childExplanation: `Ôn lại bài cũ một chút xíu để giữ vững phong độ siêu nhân nào!`,
          estimatedMinutes: 3,
          priority: 80,
          badgeEmoji: '💡',
        });
      }

      // P2: Practicing (Normal progression)
      else if (k.status === 'PRACTICING') {
        const isOverpracticed = k.attemptCount >= LEARNING_OS_POLICY.OVERPRACTICE_THRESHOLD && k.accuracy >= 90;
        if (!isOverpracticed) {
          candidateActions.push({
            id: `practice_${k.skillId}`,
            type: 'PRACTICE',
            subject: k.subject,
            skillId: k.skillId,
            skillName: k.skillName,
            title: `Luyện Tập Nâng Cao: ${k.skillName}`,
            description: `Tăng cường độ thuần thục với các dạng bài đa dạng`,
            reason: `Kỹ năng đang tiến bộ tốt (${k.accuracy}%). Luyện thêm để đạt mốc Mastered.`,
            childExplanation: `Bé đang làm rất cừ! Luyện thêm một chút nữa để trở thành Trạng Nguyên nhé!`,
            estimatedMinutes: 5,
            priority: 65 + Math.round(k.mastery / 10),
            badgeEmoji: '⭐',
          });
        }
      }

      // P3: High accuracy but slow pace -> SPEED_PRACTICE
      if (k.accuracy >= 85 &&
        k.averageResponseTimeMs &&
        k.averageResponseTimeMs > SPEED_POLICY.SPEED_PRACTICE_MIN_SECONDS * 1000) {
        candidateActions.push({
          id: `speed_${k.skillId}`,
          type: 'SPEED_PRACTICE',
          subject: k.subject,
          skillId: k.skillId,
          skillName: k.skillName,
          title: `Rèn Tốc Độ: ${k.skillName}`,
          description: `Tập phản xạ nhẩm nhanh và dứt khoát`,
          reason: `Kiến thức chắc chắn (${k.accuracy}%) nhưng thời gian làm bài trung bình ${Math.round(k.averageResponseTimeMs / 1000)}s/câu. Rèn thêm tốc độ.`,
          childExplanation: `Thử tài phản xạ thần tốc xem bé có vượt qua kỷ lục của chính mình không nào!`,
          estimatedMinutes: 3,
          priority: 72,
          badgeEmoji: '⚡',
        });
      }
    }

    // Add Competition / Mock Exam suggestion if learner has strong base
    const masteredCount = states.filter((s) => s.status === 'MASTERED').length;
    if (masteredCount >= 3) {
      candidateActions.push({
        id: 'action_competition_mock',
        type: 'COMPETITION',
        subject: 'toan',
        examBlueprintId: 'bp-math-mini-01',
        title: 'Thử Sức Đấu Trường Toán Học',
        description: 'Bài thi thử 5 phút kiểm tra toàn diện kỹ năng đã học',
        reason: `Bé đã làm chủ ${masteredCount} kỹ năng. Đây là thời điểm tuyệt vời để trải nghiệm Đấu Trường thử thách.`,
        childExplanation: 'Bé đã rất giỏi rồi! Vào Đấu Trường thi thử 5 phút để rinh Cúp Vàng nào!',
        estimatedMinutes: 5,
        priority: 70,
        badgeEmoji: '🏆',
      });
    }

    // Add Gamified practice
    candidateActions.push({
      id: 'action_game_reinforce',
      type: 'GAME',
      subject: 'toan',
      gameId: 'color_balloon',
      gameTitle: 'Đập Bóng Màu',
      title: 'Trò Chơi: Bóng Bay Màu Sắc',
      description: 'Bận vỡ bóng bay mang đúng màu sắc tiếng Anh',
      reason: 'Củng cố từ vựng thông qua tương tác phản xạ trò chơi giải trí có thưởng.',
      childExplanation: 'Thử tài nhanh tay tinh mắt bắn bóng bay màu sắc vui nhộn!',
      estimatedMinutes: 4,
      priority: 60,
      badgeEmoji: '🎈',
    });

    // ==========================================
    // 4. READING FLUENCY TRACK (P27.5)
    // ==========================================
    // Reading fluency is a first-class learning goal, not a side quest.
    // It is derived from real reading evidence only (never from a single score).
    const readingStates = states.filter((s) => s.skillId.startsWith('rf_'));
    if (readingStates.length > 0) {
      const readingAttempts = readingStates.reduce((sum, s) => sum + s.attemptCount, 0);
      const readingRecent = Math.round(
        readingStates.reduce((sum, s) => sum + s.recentAccuracy, 0) / readingStates.length
      );
      const weakest = [...readingStates].sort((a, b) => a.recentAccuracy - b.recentAccuracy)[0];

      if (readingRecent < LEARNING_OS_POLICY.MASTERY_HIGH_THRESHOLD && readingAttempts >= 3) {
        candidateActions.push({
          id: 'action_reading_fluency',
          type: 'PRACTICE',
          subject: 'tieng-viet',
          skillId: weakest.skillId,
          skillName: 'Luyện đọc chắc – đọc lưu loát',
          title: 'Luyện Đọc Chắc & Lưu Loát',
          description: 'Đọc đoạn văn ngắn rồi trả lời câu hỏi hiểu nội dung',
          reason: `Độ chính xác đọc hiểu gần đây ${readingRecent}%. Mỗi bài đọc ngắn giúp bé đọc vững hơn.`,
          childExplanation: 'Mình cùng đọc một đoạn ngắn rồi trả lời mấy câu nhé, bé đọc rất tốt rồi!',
          estimatedMinutes: 6,
          priority: 88,
          badgeEmoji: '📖',
        });
      } else if (readingRecent >= LEARNING_OS_POLICY.MASTERY_HIGH_THRESHOLD) {
        candidateActions.push({
          id: 'action_reading_speed',
          type: 'SPEED_PRACTICE',
          subject: 'tieng-viet',
          skillId: 'rf_read_aloud_speed',
          skillName: 'Đọc nhanh mà rõ',
          title: 'Rèn Đọc Nhanh Mà Vẫn Rõ',
          description: 'Đọc câu ngắn thật nhanh nhưng không bỏ sót chữ nào',
          reason: `Bé đọc hiểu đã ở mức ${readingRecent}%. Đã đủ nền để luyện thêm tốc độ đọc.`,
          childExplanation: 'Bé đọc chắc rồi, giờ mình thử đọc nhanh thêm chút nhé!',
          estimatedMinutes: 4,
          priority: 74,
          badgeEmoji: '⚡',
        });
      }
    } else {
      // Cold start for reading: introduce the ladder as a low-pressure habit.
      candidateActions.push({
        id: 'action_reading_intro',
        type: 'LEARN',
        subject: 'tieng-viet',
        skillId: 'rf_word_recognition',
        skillName: 'Nhận diện từ khi đọc',
        title: 'Làm Quen Luyện Đọc',
        description: 'Đọc đoạn văn thật ngắn và trả lời câu hỏi đơn giản',
        reason: 'Đọc lưu loát là nền tảng để đọc nhanh và hiểu nhanh sau này.',
        childExplanation: 'Mình cùng đọc một đoạn ngắn xem nhé, rất dễ!',
        estimatedMinutes: 5,
        priority: 76,
        badgeEmoji: '📖',
      });
    }

    // Sort deterministically by priority descending, then by id for stability
    candidateActions.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

    return candidateActions;
  }

  /**
   * Assembles a balanced Daily Learning Plan of 12 - 18 minutes (Grade 1 target).
   */
  public static generateDailyPlan(
    knowledgeMap: Record<string, KnowledgeState>,
    dateString: string = localDateKey(),
    fatigue?: SessionFatigueState,
    policyVersion: string = LEARNING_OS_POLICY.POLICY_VERSION,
    trackActions: LearningAction[] = []
  ): DailyPlan {
    const actions = this.getNextBestActions(knowledgeMap, fatigue, Date.now(), trackActions);

    const selectedItems: DailyPlanItem[] = [];
    let totalMinutes = 0;
    const usedSubjects = new Set<SubjectType>();

    // Pass 1: Select up to 3-4 distinct interleaved actions
    for (const act of actions) {
      if (totalMinutes + act.estimatedMinutes > LEARNING_OS_POLICY.MAX_DAILY_MINUTES) {
        continue;
      }

      // Interleaving check: avoid repeating the same skill or action type consecutively
      const isDuplicateSkill = act.skillId && selectedItems.some((item) => item.action.skillId === act.skillId);
      if (isDuplicateSkill) continue;

      selectedItems.push({
        id: `plan_item_${act.id}_${selectedItems.length}`,
        action: act,
        estimatedMinutes: act.estimatedMinutes,
        priority: act.priority,
        reason: act.reason,
        completed: false,
      });

      totalMinutes += act.estimatedMinutes;
      usedSubjects.add(act.subject);

      if (selectedItems.length >= LEARNING_OS_POLICY.MAX_DAILY_ITEMS) break;
    }

    // Pass 2: Ensure minimum daily duration (>= 10 minutes)
    if (totalMinutes < LEARNING_OS_POLICY.MIN_DAILY_MINUTES && actions.length > selectedItems.length) {
      for (const act of actions) {
        if (!selectedItems.some((i) => i.action.id === act.id)) {
          selectedItems.push({
            id: `plan_item_fill_${act.id}`,
            action: act,
            estimatedMinutes: act.estimatedMinutes,
            priority: act.priority,
            reason: act.reason,
            completed: false,
          });
          totalMinutes += act.estimatedMinutes;
          if (totalMinutes >= LEARNING_OS_POLICY.MIN_DAILY_MINUTES) break;
        }
      }
    }

    return {
      date: dateString,
      estimatedMinutes: totalMinutes,
      items: selectedItems,
      generatedFrom: {
        knowledgeVersion: 1,
        policyVersion,
        generatedAt: Date.now(),
      },
    };
  }

  /**
   * Generates detailed explainability document for parents & educators.
   */
  public static explainRecommendation(
    action: LearningAction,
    knowledgeState?: KnowledgeState
  ): RecommendationExplanation {
    const evidenceList: string[] = [];

    if (knowledgeState) {
      evidenceList.push(`Tổng số lượt làm bài: ${knowledgeState.attemptCount} lượt.`);
      evidenceList.push(`Độ chính xác hiện tại: ${knowledgeState.accuracy}%.`);
      evidenceList.push(`Độ chính xác gần đây: ${knowledgeState.recentAccuracy}%.`);
      if (knowledgeState.averageResponseTimeMs) {
        evidenceList.push(
          `Thời gian trả lời trung bình: ${Math.round(knowledgeState.averageResponseTimeMs / 1000)} giây/câu.`
        );
      }
      if (knowledgeState.errorProfile.knowledgeGap > 0) {
        evidenceList.push(`Phát hiện ${knowledgeState.errorProfile.knowledgeGap} lỗi hổng kiến thức căn bản.`);
      }
      if (knowledgeState.errorProfile.careless > 0) {
        evidenceList.push(`Phát hiện ${knowledgeState.errorProfile.careless} lỗi bất cẩn do bấm nhanh.`);
      }
    } else {
      evidenceList.push('Hồ sơ học tập mới khởi tạo (Cold Start) theo chương trình phổ thông lớp 1.');
    }

    let expectedGoal = 'Củng cố kiến thức và xây dựng sự tự tin.';
    if (action.type === 'PRACTICE' || action.type === 'LEARN') {
      expectedGoal = 'Nâng độ chính xác lên $\\ge 85\\%$ trong 2 buổi liên tiếp để đạt chuẩn Mastered.';
    } else if (action.type === 'REVIEW') {
      expectedGoal = 'Kích hoạt trí nhớ dài hạn và ngăn ngừa đường cong lãng quên.';
    } else if (action.type === 'SPEED_PRACTICE') {
      expectedGoal = 'Tối ưu thời gian làm bài dưới 18 giây/câu mà vẫn giữ vững độ chuẩn xác.';
    } else if (action.type === 'COMPETITION') {
      expectedGoal = 'Rèn luyện bản lĩnh phòng thi và tâm lý bình tĩnh dưới áp lực thời gian.';
    }

    return {
      actionId: action.id,
      recommendation: action.title,
      reason: action.reason,
      evidence: evidenceList,
      suggestedDurationMinutes: action.estimatedMinutes,
      expectedGoal,
    };
  }
}
