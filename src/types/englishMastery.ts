/**
 * ENGLISH MASTERY CONTRACTS & DATA TYPES — P32
 *
 * Defines the complete type system for:
 * - English Skill Mastery tracking
 * - Deterministic Mastery State Machine
 * - Adaptive Difficulty Ladder (D1–D5)
 * - Validation Sessions & Spaced Retention
 */

import type { Question, SubjectType } from './index';

/**
 * Mastery level continuum for English skills
 */
export type EnglishMasteryLevel =
  | 'NOVICE'
  | 'LEARNING'
  | 'PRACTICING'
  | 'STABLE'
  | 'MASTERED';

/**
 * High-level status indicating current progression or intervention needed
 */
export type EnglishMasteryStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'REMEDIAL'
  | 'STABLE'
  | 'CANDIDATE_MASTERED'
  | 'MASTERED'
  | 'NEEDS_REVIEW';

/**
 * Standard English skill categories covering Grade 1 & Starters requirements
 */
export type EnglishSkillType =
  | 'alphabet'
  | 'numbers'
  | 'colors'
  | 'animals'
  | 'family'
  | 'school'
  | 'body'
  | 'food'
  | 'toys'
  | 'greetings'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'phonics'
  | 'general';

/**
 * Difficulty levels (D1 to D5)
 * D1: Recognition (Nhận biết hình, nghe chọn âm cơ bản)
 * D2: Recall (Nhớ lại từ vựng, điền khuyết đơn giản)
 * D3: Simple Application (Ghép từ, chọn câu miêu tả)
 * D4: Comprehension (Đọc hiểu, hội thoại ngắn)
 * D5: Integrated Challenge (Thử thách tổng hợp Cambridge Starters)
 */
export type EnglishDifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type EnglishDifficultyCode = 'D1' | 'D2' | 'D3' | 'D4' | 'D5';

export const ENGLISH_DIFFICULTY_META: Record<
  EnglishDifficultyLevel,
  { code: EnglishDifficultyCode; name: string; description: string; minPassingAccuracy: number }
> = {
  1: {
    code: 'D1',
    name: 'Recognition',
    description: 'Bé nhận diện chữ cái, từ vựng hoặc âm thanh cơ bản qua hình ảnh.',
    minPassingAccuracy: 70,
  },
  2: {
    code: 'D2',
    name: 'Recall',
    description: 'Bé nhớ lại và chọn đúng từ vựng/nghĩa mà không cần gợi ý trực tiếp.',
    minPassingAccuracy: 75,
  },
  3: {
    code: 'D3',
    name: 'Simple Application',
    description: 'Bé vận dụng từ trong cụm từ, câu đơn hoặc ngữ cảnh tình huống.',
    minPassingAccuracy: 75,
  },
  4: {
    code: 'D4',
    name: 'Comprehension',
    description: 'Bé hiểu câu hoàn chỉnh, đoạn hội thoại ngắn và trả lời chính xác.',
    minPassingAccuracy: 80,
  },
  5: {
    code: 'D5',
    name: 'Integrated Challenge',
    description: 'Thử thách tích hợp đa kỹ năng theo chuẩn Cambridge Pre A1 Starters.',
    minPassingAccuracy: 85,
  },
};

/**
 * Record of an individual answer attempt
 */
export interface EnglishAttemptRecord {
  timestamp: string;
  questionId: string;
  isCorrect: boolean;
  difficulty: EnglishDifficultyLevel;
  responseTimeMs?: number;
  usedHint?: boolean;
}

/**
 * Formal validation session required before awarding MASTERED level
 */
export interface EnglishValidationSession {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  targetDifficulty: EnglishDifficultyLevel; // D4 or D5
  totalQuestions: number;
  correctCount: number;
  score: number; // 0 - 100
  passed: boolean;
  evidenceNotes: string[];
}

/**
 * Canonical English Mastery State per skill
 */
export interface EnglishMasteryState {
  skillId: string;
  skillType: EnglishSkillType;
  level: EnglishMasteryLevel;
  masteryScore: number; // 0 -> 100
  confidence: number; // 0 -> 1.0 (normalized)
  attempts: number;
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
  recentAccuracy: number; // 0 -> 100
  recentErrors: string[]; // Recent error question IDs or descriptors
  lastPracticedAt: string; // ISO string
  nextReviewAt: string; // ISO string
  difficulty: EnglishDifficultyLevel; // Current adaptive target 1..5
  status: EnglishMasteryStatus;

  // Granular telemetry and audit trail
  consecutiveErrors: number;
  difficultyHistory: {
    difficulty: EnglishDifficultyLevel;
    isCorrect: boolean;
    timestamp: string;
    questionId?: string;
  }[];
  recentHistory: EnglishAttemptRecord[];
  validationSession?: EnglishValidationSession;
  retentionReviews: {
    timestamp: string;
    isCorrect: boolean;
  }[];
  remediationNeeded?: boolean;
  remediationCount?: number;
}

/**
 * Skill Descriptor in the English Taxonomy
 */
export interface EnglishSkillDescriptor {
  skillId: string;
  skillName: string;
  category: EnglishSkillType;
  topicId: string;
  description: string;
  subSkills: string[];
  benchmarkDifficulty: EnglishDifficultyLevel;
}

/**
 * Submission for processing a student's answer
 */
export interface EnglishAnswerSubmission {
  skillId: string;
  questionId: string;
  difficulty: EnglishDifficultyLevel;
  isCorrect: boolean;
  responseTimeMs?: number;
  usedHint?: boolean;
  timestamp?: string;
  subject?: SubjectType;
}

/**
 * Learning profile snapshot across all English skills
 */
export interface EnglishLearnerProfile {
  learnerId: string;
  skills: Record<string, EnglishMasteryState>;
  overallMastery: number; // 0 -> 100
  masteredCount: number;
  inProgressCount: number;
  needsReviewCount: number;
  lastUpdated: string;
}

/**
 * Criteria for adaptive recommendation
 */
export interface AdaptiveSelectionCriteria {
  targetSkillId?: string;
  category?: EnglishSkillType;
  preferredDifficulty?: EnglishDifficultyLevel;
  includeReview?: boolean;
  sessionType?:
    | 'DIAGNOSTIC'
    | 'TARGETED_PRACTICE'
    | 'REMEDIATION'
    | 'VALIDATION'
    | 'SPACED_REVIEW';
  excludeQuestionIds?: string[];
  maxQuestions?: number;
}

/**
 * Result of the adaptive question selection
 */
export interface AdaptiveQuestionRecommendation {
  question: Question;
  skillId: string;
  skillType: EnglishSkillType;
  difficulty: EnglishDifficultyLevel;
  difficultyCode: EnglishDifficultyCode;
  reason: string;
  pedagogicalGoal: string;
  isReview: boolean;
  isValidation: boolean;
  isRemediation: boolean;
  scaffoldingHint?: string;
}

/**
 * Adaptive Session plan
 */
export interface EnglishAdaptiveSession {
  sessionId: string;
  sessionType:
    | 'DIAGNOSTIC'
    | 'TARGETED_PRACTICE'
    | 'REMEDIATION'
    | 'VALIDATION'
    | 'SPACED_REVIEW';
  targetSkillId: string;
  targetDifficulty: EnglishDifficultyLevel;
  recommendations: AdaptiveQuestionRecommendation[];
  createdAt: string;
}
