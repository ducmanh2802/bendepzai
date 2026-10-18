import { SubjectType } from './index';

export type CompetitionSubject = 'tieng-viet' | 'toan' | 'english';

export type CompetitionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE';

export interface SkillDefinition {
  skillId: string;
  skillName: string;
  subject: CompetitionSubject;
  category: string;
  description: string;
}

/**
 * EXAM-LIKE QUESTION TYPES (§10)
 *
 * Every type is graded by the domain engine (`CompetitionEngine.gradeAnswer`).
 * The UI only renders state — it never decides correctness (§1.3).
 */
export type CompetitionQuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'fill-blank'
  | 'matching'
  | 'ordering'
  | 'drag-drop'
  | 'classify';

/**
 * Canonical answer encoding: all responses are persisted as a single string so
 * that persistence, idempotency and review stay deterministic.
 *  - single-choice  : "Chữ Đ"
 *  - fill-blank     : "10"
 *  - ordering       : "Bé|Lan|học|bài"
 *  - matching       : "ga=bò|chó=chó"
 */
export interface CompetitionQuestion {
  id: string;
  subject: CompetitionSubject;
  /** Curriculum-facing topic bucket, used for coverage reporting (§16). */
  topic: string;
  skillId: string;
  difficulty: CompetitionDifficulty;
  questionType: CompetitionQuestionType;
  prompt: string;
  mediaEmoji?: string;
  /** Choices for choice-style types; word tiles for ordering; items for drag-drop. */
  options: string[];
  /** Canonical correct answer string (see encoding note above). */
  correctAnswer: string;
  /** Alternative accepted canonical answers (fill-blank synonyms). */
  acceptedAnswers?: string[];
  /** Left/right items for `matching`. */
  matchingPairs?: { left: string; right: string }[];
  /** Correct ordered sequence for `ordering` (same members as options). */
  orderingItems?: string[];
  /** Bucket labels for `classify` / `drag-drop`. */
  categoryBuckets?: string[];
  explanation: string;
  estimatedSeconds: number;
  /** Bumped whenever the item content changes; feeds the bank version. */
  version: number;
}

export type ExamMode = 'mini_test' | 'full_mock' | 'speed_trial' | 'skill_practice' | 'tournament';

export interface ExamSection {
  id: string;
  title: string;
  /** Skills covered by this section, in presentation order (§11). */
  skillIds: string[];
  /** Optional instruction shown above the section. */
  instruction?: string;
}

export interface ExamBlueprint {
  id: string;
  title: string;
  subtitle: string;
  subject: CompetitionSubject;
  mode: ExamMode;
  difficulty: CompetitionDifficulty;
  durationSeconds: number;
  questionCount: number;
  badgeEmoji: string;
  rewardXp: number;
  rewardStars: number;
  /** Maximum score for the paper (§13). Defaults to 10 when omitted. */
  maxScore?: number;
  /** Skill -> number of questions, used before the generic pool (§11). */
  skillDistribution?: Record<string, number>;
  /** Difficulty -> share of the paper (§11). */
  difficultyDistribution?: Record<CompetitionDifficulty, number>;
  /** Question type -> share of the paper (§11). */
  questionTypeDistribution?: Partial<Record<CompetitionQuestionType, number>>;
  /** Ordered sections; when absent the engine uses a single implicit section. */
  sections?: ExamSection[];
  /**
   * Official-source note. Presets are ORIGINAL and exam-like; the app never
   * claims to replicate an official paper (§5, §11).
   */
  sourceNote?: string;
  version: number;
}

export type CompetitionSessionState =
  | 'READY'
  | 'IN_PROGRESS'
  | 'SUBMITTING'
  | 'COMPLETED'
  | 'REVIEW';

export interface QuestionResponse {
  questionId: string;
  /** Canonical answer string, or null when unanswered. */
  userAnswer: string | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
  flagged?: boolean;
}

export type ErrorCategory =
  | 'KNOWLEDGE_GAP'
  | 'CARELESS_ERROR'
  | 'SPEED_ERROR'
  | 'MISREAD'
  | 'REASONING_ERROR'
  | 'UNCLASSIFIED';

export interface ErrorAnalysisItem {
  questionId: string;
  prompt: string;
  skillId: string;
  skillName: string;
  questionType: CompetitionQuestionType;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  category: ErrorCategory;
  advice: string;
  /** Concrete next action the learner (or parent) can take (§14). */
  remediation: {
    actionType: 'PRACTICE_SKILL' | 'READ_PASSAGE' | 'SPEED_DRILL' | 'REVIEW_EXPLANATION';
    label: string;
    skillId?: string;
  };
}

export type SpeedRating = 'EXCELLENT' | 'SWIFT' | 'STEADY' | 'RUSHING' | 'NEEDS_TIME';

export type ReadinessLevel =
  | 'FOUNDATION'
  | 'DEVELOPING'
  | 'PRACTICING'
  | 'STRONG'
  | 'READY_FOR_MOCK';

export interface ReadinessAssessment {
  overallLevel: ReadinessLevel;
  overallLabel: string;
  knowledgeScore: number;
  accuracyScore: number;
  speedScore: number;
  consistencyScore: number;
  skillCoverageScore: number;
  evidence: {
    totalExamsTaken: number;
    recentAccuracyAverage: number;
    medianSecondsPerQuestion: number;
    strongSkillsCount: number;
    weakSkillsCount: number;
    totalSkillsCovered: number;
  };
  recommendations: string[];
  isSufficientData: boolean;
}

export interface CompetitionExamResult {
  id: string;
  blueprintId: string;
  examTitle: string;
  subject: CompetitionSubject;
  timestamp: string;
  durationSeconds: number;
  timeUsedSeconds: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  score: number;
  speedRating: SpeedRating;
  speedLabel: string;
  averageSecondsPerQuestion: number;
  responses: QuestionResponse[];
  skillBreakdown: Record<string, { total: number; correct: number; skillName: string }>;
  strongSkills: string[];
  weakSkills: string[];
  errorAnalysis: ErrorAnalysisItem[];
  readinessSnapshot: ReadinessAssessment;
  /**
   * DECOMPOSED SCORING (§13). Kept separate so nothing is a magic formula:
   *  - rawScore         : points earned, capped by blueprint.maxScore
   *  - accuracy         : correct / answered / total, reported separately
   *  - completion       : questions actually attempted
   *  - timing           : pace only, never able to raise or lower correctness
   *  - skillPerformance / questionTypePerformance : diagnostic breakdowns
   */
  scoring: {
    rawScore: number;
    maxScore: number;
    accuracy: number;
    completion: number;
    attemptedCount: number;
    correctCount: number;
    totalQuestions: number;
    totalSeconds: number;
    averageSecondsPerQuestion: number;
    fastestQuestionSeconds: number;
    slowestQuestionSeconds: number;
    skillPerformance: Record<string, { total: number; correct: number; skillName: string }>;
    questionTypePerformance: Record<string, { total: number; correct: number }>;
  };
  /** Blueprint version + question bank version used for this paper (§17). */
  provenance: {
    blueprintVersion: number;
    questionBankVersion: number;
    seed: number;
  };
}

export interface CompetitionHistoryStore {
  examResults: CompetitionExamResult[];
  practicedSkills: Record<string, { attempts: number; correct: number; lastPracticed: string }>;
  speedTrialsCompleted: number;
  remediationPlans: {
    generatedDate: string;
    targetSkills: string[];
    completed: boolean;
  }[];
}
