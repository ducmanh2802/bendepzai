import { SessionProfileKind, SubjectType } from './index';
import { ErrorCategory } from './competition';

export type EvidenceSource =
  | 'LESSON'
  | 'PRACTICE'
  | 'GAME'
  | 'COMPETITION'
  | 'MOCK_EXAM'
  | 'REVIEW';

export type EvidenceDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE';

export type AdaptiveLevel = 1 | 2 | 3 | 4 | 5;

export const ADAPTIVE_LEVEL_LABELS: Record<AdaptiveLevel, string> = {
  1: 'Nền tảng',
  2: 'Vận dụng cơ bản',
  3: 'Thử thách',
  4: 'Nâng cao',
  5: 'Bậc thầy',
} as const;

export interface LearningEvidence {
  id: string;
  learnerId: string;
  source: EvidenceSource;
  skillId: string;
  subject: SubjectType;
  questionId?: string;
  timestamp: number;
  correct: boolean;
  responseTimeMs?: number;
  difficulty?: EvidenceDifficulty;
  errorType?: ErrorCategory;
  usedHint?: boolean;
  attemptNumber?: number;
}

export type KnowledgeStatus =
  | 'NOT_STARTED'
  | 'LEARNING'
  | 'PRACTICING'
  | 'MASTERED'
  | 'NEEDS_REVIEW';

export interface DifficultyBreakdown {
  easy: { attempts: number; correct: number };
  medium: { attempts: number; correct: number };
  hard: { attempts: number; correct: number };
  challenge: { attempts: number; correct: number };
}

export interface ErrorProfile {
  knowledgeGap: number;
  careless: number;
  speed: number;
  misread: number;
  reasoning: number;
  unclassified: number;
}

export interface SkillLevelChange {
  level: AdaptiveLevel;
  timestamp: number;
  reason: string;
}

/**
 * Explainable record of one adaptive-progression decision. Every level change
 * carries its own evidence so Parent Mode can show WHY a skill moved.
 */
export interface ProgressionDecision {
  skillId: string;
  previousLevel: AdaptiveLevel;
  newLevel: AdaptiveLevel;
  reason: string;
  evidence: string[];
  timestamp: number;
}

/** Result of folding one evidence event, including the progression decision. */
export interface EvidenceReductionResult {
  newState: KnowledgeState;
  progression: ProgressionDecision | null;
}

export interface KnowledgeState {
  skillId: string;
  skillName: string;
  subject: SubjectType;
  status: KnowledgeStatus;
  mastery: number; // 0 - 100
  confidence: number; // 0 - 100 (based on evidence volume & consistency)
  accuracy: number; // 0 - 100
  recentAccuracy: number; // 0 - 100 (last 5 attempts)
  attemptCount: number;
  correctCount: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  /** Answers given without a hint — the only evidence that can raise a level. */
  independentAttempts: number;
  independentCorrect: number;
  /** Answers given after a hint — tracked, never counted as independence. */
  assistedAttempts: number;
  assistedCorrect: number;
  hintCount: number;
  /** Current demonstrated adaptive level (L1-L5) for THIS skill only. */
  currentLevel: AdaptiveLevel;
  levelHistory: SkillLevelChange[];
  misconceptionCategories: Record<string, number>;
  retentionEvidence: { correctOnReview: number; totalReviews: number };
  lastPracticedAt?: number;
  lastCorrectAt?: number;
  lastIncorrectAt?: number;
  averageResponseTimeMs?: number;
  difficultyPerformance: DifficultyBreakdown;
  errorProfile: ErrorProfile;
  nextReviewAt?: number;
  evidenceVersion: number;
}

export type ActionType =
  | 'LEARN'
  | 'PRACTICE'
  | 'REVIEW'
  | 'SPEED_PRACTICE'
  | 'GAME'
  | 'COMPETITION'
  | 'MOCK_EXAM'
  | 'MAINTENANCE';

export interface LearningAction {
  id: string;
  type: ActionType;
  subject: SubjectType;
  skillId?: string;
  skillName?: string;
  gameId?: string;
  gameTitle?: string;
  examBlueprintId?: string;
  lessonId?: string;
  /**
   * Optional learning track this action belongs to, e.g. the Kid's Box
   * Companion track. Used purely for routing — the Learning OS keeps a single
   * action list for every track (§1, §26).
   */
  trackId?: string;
  title: string;
  description: string;
  reason: string; // Parent & diagnostic explanation
  childExplanation: string; // Encouraging child-friendly wording
  estimatedMinutes: number;
  priority: number; // 1-100, higher = higher priority
  badgeEmoji: string;
}

export interface DailyPlanItem {
  id: string;
  action: LearningAction;
  estimatedMinutes: number;
  priority: number;
  reason: string;
  completed: boolean;
  completedAt?: number;
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD
  estimatedMinutes: number;
  items: DailyPlanItem[];
  generatedFrom: {
    knowledgeVersion: number;
    policyVersion: string;
    generatedAt: number;
  };
}

export interface SessionFatigueState {
  sessionStartTime: number;
  questionsAnsweredThisSession: number;
  sessionErrorsCount: number;
  consecutiveErrorsInSession: number;
  isFatigued: boolean;
}

export interface RecommendationExplanation {
  actionId: string;
  recommendation: string;
  reason: string;
  evidence: string[];
  suggestedDurationMinutes: number;
  expectedGoal: string;
}

export interface SessionProfile {
  kind: SessionProfileKind;
  targetQuestions: number;
  minQuestions: number;
  maxQuestions: number;
  composition: {
    foundation: number;
    currentSkill: number;
    challenging: number;
    spacedReview: number;
  };
  checkpointInterval: number;
  allowEarlyFinish: boolean;
  parentConfigurable: boolean;
}

export interface SessionState {
  profileKind: SessionProfileKind;
  questions: string[];
  currentIndex: number;
  correctCount: number;
  incorrectCount: number;
  hintsUsed: number;
  startedAt: number;
  lastUpdatedAt: number;
  isPaused: boolean;
  isCompleted: boolean;
  checkpointResults: { afterQuestion: number; correctCount: number; totalSoFar: number }[];
}

export interface LearningOSStore {
  schemaVersion: string;
  knowledgeStates: Record<string, KnowledgeState>;
  recentEvidences: LearningEvidence[];
  dailyPlan: DailyPlan | null;
  fatigue: SessionFatigueState;
  sessionState: SessionState | null;
  recommendationHistory: {
    timestamp: number;
    actionId: string;
    actionType: ActionType;
    skillId?: string;
    reason: string;
    completed: boolean;
  }[];
  /**
   * Ids of evidences already folded into `knowledgeStates`.
   * Guarantees idempotency: replaying an event (double click, refresh,
   * retry, back/forward navigation) can never double-count evidence.
   */
  processedEvidenceIds: string[];
}
