import { SubjectType } from './index';

/**
 * READING FLUENCY SKILL TAXONOMY (§6.1)
 *
 * Reading speed is deliberately NOT a single metric. Each skill below is
 * measured independently so that a fast-but-inaccurate reader never looks
 * strong and a slow-but-accurate reader never looks weak.
 */
export type ReadingSkillId =
  | 'RF-WORD-RECOGNITION'
  | 'RF-SYLLABLE-FLUENCY'
  | 'RF-PHRASE-FLUENCY'
  | 'RF-SENTENCE-FLUENCY'
  | 'RF-READ-ALOUD-ACCURACY'
  | 'RF-READ-ALOUD-SPEED'
  | 'RF-PUNCTUATION-PAUSE'
  | 'RF-READING-COMPREHENSION'
  | 'RF-KEYWORD-FINDING'
  | 'RF-QUESTION-UNDERSTANDING'
  | 'RF-ANSWER-SELECTION-SPEED';

export type ReadingSkillCategory = 'ACCURACY' | 'FLUENCY' | 'COMPREHENSION' | 'PROCESSING_SPEED';

/**
 * READING TRAINING LADDER (§7)
 * Stages are ordered; a learner advances only when the previous stage's gate
 * is met, and speed training is locked until accuracy/comprehension pass.
 */
export type ReadingStage = 'ACCURACY' | 'FLUENCY' | 'COMPREHENSION' | 'PROCESSING_SPEED' | 'COMPETITION_SPEED';

/**
 * T13 theme of a reading passage (6 themes x 4 passages).
 * Legacy passages (pre-T13) leave this undefined.
 */
export type ReadingTheme =
  | 'gia-dinh'
  | 'truong-lop'
  | 'con-vat'
  | 'thien-nhien'
  | 'que-huong'
  | 'tinh-ban';

/** Quick parent grading after the child reads aloud (😀 good, 😐 okay, 🙁 needs help). */
export type ReadingParentRating = '😀' | '😐' | '🙁';

export type ReadingQuestionType =
  | 'word-recognition'
  | 'syllable-clap'
  | 'phrase-repeat'
  | 'sentence-order'
  | 'read-aloud'
  | 'punctuation-pause'
  | 'comprehension-who'
  | 'comprehension-what'
  | 'comprehension-where'
  | 'comprehension-when'
  | 'comprehension-why'
  | 'comprehension-how'
  | 'keyword-finding'
  | 'question-meaning';

export interface ReadingSkillDefinition {
  skillId: ReadingSkillId;
  skillName: string;
  category: ReadingSkillCategory;
  /** Which ladder stage primarily trains this skill. */
  stage: ReadingStage;
  description: string;
}

export interface ReadingQuestion {
  id: string;
  passageId: string;
  subject: SubjectType;
  skillId: ReadingSkillId;
  questionType: ReadingQuestionType;
  /** 1 = easy, 2 = medium, 3 = challenge. */
  difficulty: 1 | 2 | 3;
  prompt: string;
  /** Text shown to the learner for read-aloud / repeat tasks. */
  stimulus?: string;
  mediaEmoji?: string;
  options: string[];
  correctAnswer: string;
  /** For read-aloud tasks: the exact sentence that must be reproduced. */
  targetText?: string;
  /** Word count of `targetText`/`stimulus`, used for words-per-minute. */
  wordCount: number;
  explanation: string;
  /** Estimated seconds a Grade 1 learner needs for this item. */
  estimatedSeconds: number;
}

/**
 * A short reading passage. Original Grade-1-appropriate Vietnamese text
 * written for this app (no copyrighted or official exam content).
 */
export interface ReadingPassage {
  id: string;
  title: string;
  /** Difficulty band of the passage text itself. */
  level: 1 | 2 | 3;
  subject: SubjectType;
  mediaEmoji: string;
  /** Paragraphs, in reading order. */
  paragraphs: string[];
  /** Vocabulary support shown as a picture bank (helps pre-readers). */
  pictureBank: { emoji: string; label: string }[];
  /** Comprehension questions attached to this passage. */
  questionIds: string[];
  wordCount: number;
  /**
   * T13 — theme of this passage (6 themes x 4). Legacy passages leave this
   * undefined. Used for theme-based browsing and unlock-by-theme.
   */
  theme?: ReadingTheme;
  /**
   * T13 — focus rimes/letters of this passage (e.g. ['an','at']).
   * L1 passages only use rimes from the first T10 group.
   */
  targetVowels?: string[];
}

/** One measured response inside a reading session. */
export interface ReadingResponse {
  questionId: string;
  skillId: ReadingSkillId;
  questionType: ReadingQuestionType;
  difficulty: 1 | 2 | 3;
  correct: boolean;
  responseTimeMs: number;
  /** Words the learner processed for this item (0 for non-text items). */
  wordsProcessed: number;
  /** True when the learner paused longer than the hesitation threshold. */
  hesitation: boolean;
  answeredAt: number;
  /** Optional parent quick grade when the child reads aloud (😀/😐/🙁). */
  parentRating?: ReadingParentRating;
}

export interface ReadingErrorCategory {
  category: 'SUBSTITUTION' | 'OMISSION' | 'MISPRONUNCIATION' | 'PUNCTUATION_IGNORED' | 'COMPREHENSION_GAP' | 'KEYWORD_MISSED' | 'CARELESS_TAP';
  count: number;
}

/** Everything measurable from one reading session. */
export interface ReadingMetrics {
  sessionId: string;
  stage: ReadingStage;
  passageId: string;
  subject: SubjectType;
  /** 0-100 */
  accuracy: number;
  /** 0-100, comprehension items only */
  comprehensionAccuracy: number;
  /** 0-100, "did the learner understand the question" items only */
  questionInterpretationAccuracy: number;
  itemsProcessed: number;
  wordsProcessed: number;
  /** Real elapsed time of the session in ms. */
  durationMs: number;
  averageResponseMs: number;
  /** Words per minute on read-aloud / repeat items only; 0 if none. */
  wordsPerMinute: number;
  hesitationCount: number;
  /** Ratio 0-1 of responses slower than the hesitation threshold. */
  hesitationRatio: number;
  difficultyBreakdown: Record<'1' | '2' | '3', { total: number; correct: number }>;
  skillPerformance: Record<string, { total: number; correct: number }>;
  questionTypePerformance: Record<string, { total: number; correct: number }>;
  errors: ReadingErrorCategory[];
  /** Stable id so replaying a session never double-counts. */
  timestamp: number;
  /** Optional parent quick-grade tally (😀/😐/🙁) for self-read items. */
  parentRatingCounts?: Record<ReadingParentRating, number>;
}

export interface ReadingSkillState {
  skillId: ReadingSkillId;
  skillName: string;
  accuracy: number;
  attempts: number;
  correctCount: number;
  averageResponseMs: number;
  status: 'NOT_STARTED' | 'LEARNING' | 'PRACTICING' | 'STRONG';
  lastPracticedAt?: number;
}

export interface ReadingStageState {
  stage: ReadingStage;
  /** 0-100 aggregated accuracy for the stage. */
  accuracy: number;
  accuracyGate: number;
  /** True only when the stage gate is satisfied (accuracy-based only). */
  isUnlocked: boolean;
  isCompleted: boolean;
  attempts: number;
}

export interface ReadingProfile {
  currentStage: ReadingStage;
  stageStates: Record<ReadingStage, ReadingStageState>;
  skillStates: Record<string, ReadingSkillState>;
  /** Overall reading index 0-100: accuracy first, fluency as a modifier. */
  readingIndex: number;
  accuracyIndex: number;
  fluencyIndex: number;
  comprehensionIndex: number;
  /** Child-facing, supportive summary. Never labels the learner negatively. */
  headline: string;
  encouragement: string;
  lastSessionAt?: number;
  /** Parent quick grades keyed by passage id ("😀"/"😐"/"🙁"). */
  parentRatings?: Record<string, ReadingParentRating>;
  /** Alias retained for compatibility with earlier naming. */
  parentGrades?: Record<string, ReadingParentRating>;
  selfReadRatings?: ReadingParentRating[];
}

export interface ReadingSessionResult {
  metrics: ReadingMetrics;
  profile: ReadingProfile;
  /** Ordered next steps for the child. */
  nextActions: { stage: ReadingStage; label: string; reason: string }[];
}
