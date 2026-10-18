/**
 * ENGLISH MASTERY ENGINE — SCORING & DETERMINISTIC STATE MACHINE
 *
 * Implements:
 * - Multi-factor Mastery Scoring (0 -> 100):
 *     accuracy, recentAccuracy, streak, bestStreak, difficulty tier caps,
 *     attemptCount/confidence, errorFrequency, recency decay
 * - Deterministic State Machine:
 *     NOVICE → LEARNING → PRACTICING → STABLE → CANDIDATE → MASTERED
 * - Deterministic Regression:
 *     MASTERED → review failure (>= 2 errors / poor retention) → STABLE / PRACTICING
 *     Protected against single-error downgrades.
 * - Validation Session Gate before granting MASTERED status.
 * - Spaced Review scheduling.
 */

import type {
  EnglishAnswerSubmission,
  EnglishAttemptRecord,
  EnglishDifficultyLevel,
  EnglishMasteryLevel,
  EnglishMasteryState,
  EnglishMasteryStatus,
  EnglishSkillType,
  EnglishValidationSession,
} from '../types/englishMastery';
import { resolveEnglishSkill } from '../data/englishSkillTaxonomy';

const DAY_MS = 24 * 60 * 60 * 1000;

export const MASTERY_CONSTANTS = {
  MIN_ATTEMPTS_LEARNING: 1,
  MIN_ATTEMPTS_PRACTICING: 4,
  MIN_ATTEMPTS_STABLE: 6,
  MIN_ATTEMPTS_CANDIDATE: 8,
  MIN_ATTEMPTS_FULL_CONFIDENCE: 6,

  // Difficulty tier caps (D1 alone can never grant full mastery!)
  DIFFICULTY_CAPS: {
    1: 55, // D1 (Recognition) alone max score 55
    2: 72, // D2 (Recall) max score 72
    3: 85, // D3 (Application) max score 85
    4: 95, // D4 (Comprehension) max score 95
    5: 100, // D5 (Starters Integrated) max score 100
  } as Record<EnglishDifficultyLevel, number>,

  SCORE_THRESHOLDS: {
    LEARNING: 25,
    PRACTICING: 55,
    STABLE: 75,
    CANDIDATE: 85,
    MASTERED: 88,
  },

  VALIDATION: {
    MIN_QUESTIONS: 4,
    PASS_PERCENTAGE: 75,
    REQUIRED_DIFFICULTY: 4 as EnglishDifficultyLevel,
  },

  SPACED_INTERVALS_DAYS: [2, 5, 14, 30],
} as const;

export class EnglishMasteryEngine {
  /**
   * Initializes a clean mastery state for an English skill
   */
  public static createInitialState(
    skillId: string,
    skillType: EnglishSkillType = 'general',
    now: Date = new Date()
  ): EnglishMasteryState {
    return {
      skillId,
      skillType,
      level: 'NOVICE',
      masteryScore: 0,
      confidence: 0,
      attempts: 0,
      correct: 0,
      incorrect: 0,
      streak: 0,
      bestStreak: 0,
      recentAccuracy: 0,
      recentErrors: [],
      lastPracticedAt: now.toISOString(),
      nextReviewAt: new Date(now.getTime() + DAY_MS).toISOString(),
      difficulty: 1,
      status: 'NOT_STARTED',
      consecutiveErrors: 0,
      difficultyHistory: [],
      recentHistory: [],
      retentionReviews: [],
      remediationNeeded: false,
      remediationCount: 0,
    };
  }

  /**
   * Process a single student response and deterministically computes the next state
   */
  public static processAnswer(
    currentState: EnglishMasteryState,
    submission: EnglishAnswerSubmission,
    now: Date = new Date()
  ): EnglishMasteryState {
    const timestamp = submission.timestamp || now.toISOString();
    const isCorrect = Boolean(submission.isCorrect);
    const difficulty = submission.difficulty;

    // 1. Update basic attempt counters
    const attempts = currentState.attempts + 1;
    const correct = currentState.correct + (isCorrect ? 1 : 0);
    const incorrect = currentState.incorrect + (isCorrect ? 0 : 1);

    // 2. Streaks and errors
    const streak = isCorrect ? currentState.streak + 1 : 0;
    const bestStreak = Math.max(currentState.bestStreak, streak);
    const consecutiveErrors = isCorrect ? 0 : currentState.consecutiveErrors + 1;

    // 3. Track recent errors
    let recentErrors = [...currentState.recentErrors];
    if (!isCorrect && submission.questionId) {
      recentErrors.unshift(submission.questionId);
      if (recentErrors.length > 10) recentErrors.pop();
    }

    // 4. Update history logs
    const newRecord: EnglishAttemptRecord = {
      timestamp,
      questionId: submission.questionId,
      isCorrect,
      difficulty,
      responseTimeMs: submission.responseTimeMs,
      usedHint: submission.usedHint,
    };

    const recentHistory = [newRecord, ...currentState.recentHistory].slice(0, 10);

    const difficultyHistory = [
      ...currentState.difficultyHistory,
      {
        difficulty,
        isCorrect,
        timestamp,
        questionId: submission.questionId,
      },
    ];

    // 5. Calculate lifetime accuracy and recent window accuracy
    const lifetimeAccuracy = Math.round((correct / attempts) * 100);

    // Recent accuracy: weighted over last 5-10 attempts
    const windowItems = recentHistory.slice(0, 6);
    const recentCorrect = windowItems.filter((h) => h.isCorrect).length;
    const calculatedRecent = windowItems.length > 0 ? Math.round((recentCorrect / windowItems.length) * 100) : 0;

    // Smooth exponential blending if prior exists
    const recentAccuracy =
      currentState.attempts === 0
        ? isCorrect
          ? 100
          : 0
        : Math.round(currentState.recentAccuracy * 0.5 + calculatedRecent * 0.5);

    // 6. Calculate Confidence (0.0 -> 1.0)
    const sampleFactor = Math.min(1.0, attempts / MASTERY_CONSTANTS.MIN_ATTEMPTS_FULL_CONFIDENCE);
    const errorDampener = consecutiveErrors >= 2 ? 0.7 : 1.0;
    const confidence = Math.round(Math.min(1.0, Math.max(0, sampleFactor * errorDampener)) * 100) / 100;

    // 7. Find highest passed difficulty with demonstrated competence
    const highestPassedDifficulty = this.calculateHighestDemonstratedDifficulty(difficultyHistory);

    // 8. Compute Multi-Factor Mastery Score (0 -> 100)
    const masteryScore = this.computeMasteryScore({
      lifetimeAccuracy,
      recentAccuracy,
      confidence,
      streak,
      consecutiveErrors,
      highestDifficulty: highestPassedDifficulty,
      lastPracticedAt: currentState.lastPracticedAt,
      now,
    });

    // 9. Adaptive Difficulty Adjustment
    const nextDifficulty = this.calculateAdaptiveDifficulty({
      currentDifficulty: currentState.difficulty,
      isCorrect,
      consecutiveErrors,
      streak,
      recentAccuracy,
      highestPassedDifficulty,
    });

    // 10. Run State Machine Transition
    const { nextLevel, nextStatus, remediationNeeded } = this.evaluateStateTransition({
      currentLevel: currentState.level,
      currentStatus: currentState.status,
      attempts,
      masteryScore,
      recentAccuracy,
      streak,
      consecutiveErrors,
      highestPassedDifficulty,
      validationSession: currentState.validationSession,
      isReviewEvent: currentState.status === 'NEEDS_REVIEW',
      isCorrect,
    });

    // 11. Spaced review scheduler
    let nextReviewAt = currentState.nextReviewAt;
    if (nextLevel === 'MASTERED' || nextStatus === 'MASTERED') {
      const reviewLadder = MASTERY_CONSTANTS.SPACED_INTERVALS_DAYS;
      const reviewCount = currentState.retentionReviews.length;
      const intervalDays = reviewLadder[Math.min(reviewCount, reviewLadder.length - 1)];
      nextReviewAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
    }

    const state: EnglishMasteryState = {
      ...currentState,
      attempts,
      correct,
      incorrect,
      streak,
      bestStreak,
      consecutiveErrors,
      recentErrors,
      recentHistory,
      difficultyHistory,
      recentAccuracy,
      confidence,
      masteryScore,
      difficulty: nextDifficulty,
      level: nextLevel,
      status: nextStatus,
      remediationNeeded,
      remediationCount: remediationNeeded
        ? (currentState.remediationCount || 0) + 1
        : currentState.remediationCount || 0,
      lastPracticedAt: timestamp,
      nextReviewAt,
    };

    return state;
  }

  /**
   * Computes multi-factor mastery score taking difficulty cap and recency into account
   */
  public static computeMasteryScore(params: {
    lifetimeAccuracy: number;
    recentAccuracy: number;
    confidence: number;
    streak: number;
    consecutiveErrors: number;
    highestDifficulty: EnglishDifficultyLevel;
    lastPracticedAt?: string;
    now: Date;
  }): number {
    const {
      lifetimeAccuracy,
      recentAccuracy,
      confidence,
      streak,
      consecutiveErrors,
      highestDifficulty,
      lastPracticedAt,
      now,
    } = params;

    // Base formula: 35% lifetime accuracy, 45% recent accuracy, 20% confidence
    const baseScore = lifetimeAccuracy * 0.35 + recentAccuracy * 0.45 + confidence * 100 * 0.2;

    // Small bonus for consistent streak (max +6)
    const streakBonus = Math.min(6, streak * 1.5);

    // Consecutive error penalty
    const errorPenalty = consecutiveErrors * 6;

    let computed = Math.round(baseScore + streakBonus - errorPenalty);

    // Recency decay if unpracticed for over 14 days
    if (lastPracticedAt) {
      const daysSince = (now.getTime() - new Date(lastPracticedAt).getTime()) / DAY_MS;
      if (daysSince > 14) {
        const decayDays = Math.min(30, daysSince - 14);
        computed -= Math.round(decayDays * 0.5); // modest decay
      }
    }

    // CRITICAL MISSION RULE: D1 alone CANNOT achieve full mastery!
    // Difficulty tier cap enforces moving up the D1 -> D5 ladder.
    const tierCap = MASTERY_CONSTANTS.DIFFICULTY_CAPS[highestDifficulty] ?? 55;
    computed = Math.min(tierCap, computed);

    return Math.max(0, Math.min(100, computed));
  }

  /**
   * Deterministic State Machine Transition Rules
   */
  public static evaluateStateTransition(params: {
    currentLevel: EnglishMasteryLevel;
    currentStatus: EnglishMasteryStatus;
    attempts: number;
    masteryScore: number;
    recentAccuracy: number;
    streak: number;
    consecutiveErrors: number;
    highestPassedDifficulty: EnglishDifficultyLevel;
    validationSession?: EnglishValidationSession;
    isReviewEvent: boolean;
    isCorrect: boolean;
  }): {
    nextLevel: EnglishMasteryLevel;
    nextStatus: EnglishMasteryStatus;
    remediationNeeded: boolean;
  } {
    const {
      currentLevel,
      currentStatus,
      attempts,
      masteryScore,
      recentAccuracy,
      streak,
      consecutiveErrors,
      highestPassedDifficulty,
      validationSession,
      isReviewEvent,
      isCorrect,
    } = params;

    let nextLevel: EnglishMasteryLevel = currentLevel;
    let nextStatus: EnglishMasteryStatus = currentStatus;
    let remediationNeeded = false;

    // Check for remediation trigger
    if (consecutiveErrors >= 2 || (attempts >= 4 && recentAccuracy < 45)) {
      remediationNeeded = true;
      nextStatus = 'REMEDIAL';
    }

    // REGRESSION LOGIC: If currently MASTERED
    if (currentLevel === 'MASTERED') {
      // Rule: Do NOT drop mastery for 1 single isolated mistake
      if (consecutiveErrors === 1) {
        return {
          nextLevel: 'MASTERED',
          nextStatus: 'MASTERED',
          remediationNeeded: false,
        };
      }

      // If consecutive errors >= 2 or recent accuracy drops severely on review
      if (consecutiveErrors >= 2 || (isReviewEvent && !isCorrect && consecutiveErrors >= 2) || recentAccuracy < 65) {
        // Regress to STABLE or PRACTICING
        return {
          nextLevel: recentAccuracy >= 65 ? 'STABLE' : 'PRACTICING',
          nextStatus: 'NEEDS_REVIEW',
          remediationNeeded: true,
        };
      }

      return {
        nextLevel: 'MASTERED',
        nextStatus: 'MASTERED',
        remediationNeeded: false,
      };
    }

    // FORWARD PROGRESSION STATE MACHINE
    if (currentLevel === 'NOVICE') {
      if (attempts >= MASTERY_CONSTANTS.MIN_ATTEMPTS_LEARNING && masteryScore >= MASTERY_CONSTANTS.SCORE_THRESHOLDS.LEARNING) {
        nextLevel = 'LEARNING';
        nextStatus = 'IN_PROGRESS';
      }
    } else if (currentLevel === 'LEARNING') {
      if (
        attempts >= MASTERY_CONSTANTS.MIN_ATTEMPTS_PRACTICING &&
        masteryScore >= MASTERY_CONSTANTS.SCORE_THRESHOLDS.PRACTICING &&
        recentAccuracy >= 60 &&
        !remediationNeeded
      ) {
        nextLevel = 'PRACTICING';
        nextStatus = 'IN_PROGRESS';
      }
    } else if (currentLevel === 'PRACTICING') {
      // Regress if performance falls
      if (consecutiveErrors >= 3 || (attempts >= 6 && recentAccuracy < 40)) {
        nextLevel = 'LEARNING';
        nextStatus = 'REMEDIAL';
      } else if (
        attempts >= MASTERY_CONSTANTS.MIN_ATTEMPTS_STABLE &&
        masteryScore >= MASTERY_CONSTANTS.SCORE_THRESHOLDS.STABLE &&
        recentAccuracy >= 75 &&
        streak >= 2 &&
        highestPassedDifficulty >= 3
      ) {
        nextLevel = 'STABLE';
        nextStatus = 'STABLE';
      }
    } else if (currentLevel === 'STABLE') {
      // Regress if performance drops
      if (consecutiveErrors >= 3 || recentAccuracy < 55) {
        nextLevel = 'PRACTICING';
        nextStatus = 'NEEDS_REVIEW';
      } else if (
        attempts >= MASTERY_CONSTANTS.MIN_ATTEMPTS_CANDIDATE &&
        masteryScore >= MASTERY_CONSTANTS.SCORE_THRESHOLDS.CANDIDATE &&
        recentAccuracy >= 80 &&
        highestPassedDifficulty >= 4
      ) {
        // Candidate for mastery!
        nextStatus = 'CANDIDATE_MASTERED';

        // Check if validation session has passed
        if (validationSession && validationSession.passed) {
          nextLevel = 'MASTERED';
          nextStatus = 'MASTERED';
        }
      }
    }

    return { nextLevel, nextStatus, remediationNeeded };
  }

  /**
   * Analyzes history to see what highest difficulty level has evidence of stability
   */
  public static calculateHighestDemonstratedDifficulty(
    history: { difficulty: EnglishDifficultyLevel; isCorrect: boolean }[]
  ): EnglishDifficultyLevel {
    if (history.length === 0) return 1;

    // Check from D5 down to D1
    for (const d of [5, 4, 3, 2] as EnglishDifficultyLevel[]) {
      const diffAttempts = history.filter((h) => h.difficulty === d);
      const diffCorrect = diffAttempts.filter((h) => h.isCorrect).length;
      if (diffAttempts.length >= 2 && (diffCorrect / diffAttempts.length) >= 0.7) {
        return d;
      }
    }

    return 1;
  }

  /**
   * Deterministically calculates next recommended difficulty (D1–D5 ladder)
   */
  public static calculateAdaptiveDifficulty(params: {
    currentDifficulty: EnglishDifficultyLevel;
    isCorrect: boolean;
    consecutiveErrors: number;
    streak: number;
    recentAccuracy: number;
    highestPassedDifficulty: EnglishDifficultyLevel;
  }): EnglishDifficultyLevel {
    const { currentDifficulty, consecutiveErrors, streak, recentAccuracy } = params;

    // Remediation / stepped down on consecutive errors
    if (consecutiveErrors >= 2) {
      return Math.max(1, currentDifficulty - 1) as EnglishDifficultyLevel;
    }

    // Advancement criteria: strong streak & high recent accuracy
    if (streak >= 3 && recentAccuracy >= 80) {
      return Math.min(5, currentDifficulty + 1) as EnglishDifficultyLevel;
    }

    return currentDifficulty;
  }

  /**
   * Initiates a formal Mastery Validation Session for candidate skills
   */
  public static startValidationSession(
    state: EnglishMasteryState,
    targetDifficulty: EnglishDifficultyLevel = 4,
    now: Date = new Date()
  ): EnglishValidationSession {
    return {
      sessionId: `val-${state.skillId}-${now.getTime()}`,
      startedAt: now.toISOString(),
      targetDifficulty,
      totalQuestions: MASTERY_CONSTANTS.VALIDATION.MIN_QUESTIONS,
      correctCount: 0,
      score: 0,
      passed: false,
      evidenceNotes: [],
    };
  }

  /**
   * Completes a validation session and validates if child achieved mastery
   */
  public static completeValidationSession(
    state: EnglishMasteryState,
    session: EnglishValidationSession,
    correctCount: number,
    now: Date = new Date()
  ): { updatedState: EnglishMasteryState; session: EnglishValidationSession } {
    const total = session.totalQuestions;
    const score = Math.round((correctCount / total) * 100);
    const passed = score >= MASTERY_CONSTANTS.VALIDATION.PASS_PERCENTAGE;

    const completedSession: EnglishValidationSession = {
      ...session,
      completedAt: now.toISOString(),
      correctCount,
      score,
      passed,
      evidenceNotes: [
        `Achieved ${correctCount}/${total} (${score}%) at Difficulty D${session.targetDifficulty}`,
        passed ? 'Validation PASS: Full mastery verified' : 'Validation FAIL: More practice needed',
      ],
    };

    let updatedLevel = state.level;
    let updatedStatus = state.status;
    let updatedScore = state.masteryScore;

    if (passed) {
      updatedLevel = 'MASTERED';
      updatedStatus = 'MASTERED';
      updatedScore = Math.max(state.masteryScore, 92);
    } else {
      updatedLevel = 'STABLE';
      updatedStatus = 'STABLE';
    }

    const updatedState: EnglishMasteryState = {
      ...state,
      level: updatedLevel,
      status: updatedStatus,
      masteryScore: updatedScore,
      validationSession: completedSession,
      lastPracticedAt: now.toISOString(),
    };

    return { updatedState, session: completedSession };
  }

  /**
   * Record a review retention check for spaced repetition
   */
  public static recordRetentionReview(
    state: EnglishMasteryState,
    isCorrect: boolean,
    now: Date = new Date()
  ): EnglishMasteryState {
    const retentionReviews = [
      ...state.retentionReviews,
      { timestamp: now.toISOString(), isCorrect },
    ];

    // If review failed, run state machine check for potential regression
    if (!isCorrect) {
      const recentFails = retentionReviews.slice(-2).filter((r) => !r.isCorrect).length;
      if (recentFails >= 2) {
        return {
          ...state,
          level: 'STABLE',
          status: 'NEEDS_REVIEW',
          retentionReviews,
          lastPracticedAt: now.toISOString(),
        };
      }
    }

    return {
      ...state,
      retentionReviews,
      status: isCorrect ? 'MASTERED' : state.status,
      lastPracticedAt: now.toISOString(),
    };
  }
}
