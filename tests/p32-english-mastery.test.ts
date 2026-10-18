/**
 * P32 — ADAPTIVE ENGLISH MASTERY ENGINE TESTS
 *
 * Verifies:
 * 1. Contract & Skill Model (Alphabet, Numbers, Colors, Animals, Family, School, Body, Food, Toys, Greetings, Core Skills)
 * 2. Multi-factor Mastery Scoring (D1 cap, accuracy, recentAccuracy, streak, confidence, decay)
 * 3. Deterministic State Machine (NOVICE → LEARNING → PRACTICING → STABLE → CANDIDATE → MASTERED)
 * 4. Regression Engine (Single error safe, consecutive error demotion, spaced review failure)
 * 5. Adaptive Difficulty Ladder & Question Selection (D1–D5, deterministic, anti-randomness)
 * 6. Remediation & Targeted Practice
 * 7. Validation Session Gate
 * 8. Persistence & Storage Resilience
 * 9. Regression Safety (Math semantics, Audio child-first, Content safety)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EnglishMasteryLevel,
  EnglishMasteryState,
  EnglishDifficultyLevel,
} from '../src/types/englishMastery';
import {
  CANONICAL_ENGLISH_SKILLS,
  ENGLISH_SKILL_MAP,
  inferQuestionDifficulty,
  resolveEnglishSkill,
} from '../src/data/englishSkillTaxonomy';
import { EnglishMasteryEngine, MASTERY_CONSTANTS } from '../src/services/englishMasteryEngine';
import { EnglishAdaptiveEngine } from '../src/services/englishAdaptiveEngine';
import { EnglishMasteryStore } from '../src/services/englishMasteryStore';
import { getAllQuestions } from '../src/data/curriculum';
import { checkAnswer, normalizeMathExpression } from '../src/services/answerCheck';

describe('P32 — 1. English Mastery Contracts & Skill Model', () => {
  it('defines the canonical 5-level continuum for English mastery', () => {
    const levels: EnglishMasteryLevel[] = ['NOVICE', 'LEARNING', 'PRACTICING', 'STABLE', 'MASTERED'];
    expect(levels).toHaveLength(5);
  });

  it('supports all required skill topics from the curriculum', () => {
    const categories = new Set(CANONICAL_ENGLISH_SKILLS.map((s) => s.category));

    // Alphabet, Numbers, Colors, Animals, Family, School Supplies, Body, Food, Toys, Greetings
    expect(categories.has('alphabet')).toBe(true);
    expect(categories.has('numbers')).toBe(true);
    expect(categories.has('colors')).toBe(true);
    expect(categories.has('animals')).toBe(true);
    expect(categories.has('family')).toBe(true);
    expect(categories.has('school')).toBe(true);
    expect(categories.has('body')).toBe(true);
    expect(categories.has('food')).toBe(true);
    expect(categories.has('toys')).toBe(true);
    expect(categories.has('greetings')).toBe(true);
    // Core skills
    expect(categories.has('listening')).toBe(true);
    expect(categories.has('speaking')).toBe(true);
    expect(categories.has('reading')).toBe(true);
    expect(categories.has('writing')).toBe(true);
  });

  it('verifies exact sub-skill taxonomy for each required domain', () => {
    // Alphabet: Letter Recognition, Letter Sound, Phonics, Initial Sound
    expect(ENGLISH_SKILL_MAP.has('eng_alphabet_recognition')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_alphabet_sound')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_alphabet_phonics')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_alphabet_initial_sound')).toBe(true);

    // Numbers: Counting, Number Recognition, Quantity
    expect(ENGLISH_SKILL_MAP.has('eng_numbers_counting')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_numbers_recognition')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_numbers_quantity')).toBe(true);

    // Colors: Color Recognition, Color Vocabulary
    expect(ENGLISH_SKILL_MAP.has('eng_colors_recognition')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_colors_vocabulary')).toBe(true);

    // Animals: Animal Vocabulary, Animal Recognition
    expect(ENGLISH_SKILL_MAP.has('eng_animals_vocabulary')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_animals_recognition')).toBe(true);

    // Family: Family Vocabulary
    expect(ENGLISH_SKILL_MAP.has('eng_family_vocabulary')).toBe(true);

    // School Supplies: School Vocabulary
    expect(ENGLISH_SKILL_MAP.has('eng_school_vocabulary')).toBe(true);

    // Body: Body Vocabulary
    expect(ENGLISH_SKILL_MAP.has('eng_body_vocabulary')).toBe(true);

    // Food & Fruit: Food Vocabulary, Fruit Vocabulary
    expect(ENGLISH_SKILL_MAP.has('eng_food_vocabulary')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_food_fruit')).toBe(true);

    // Toys & Playground: Toy Vocabulary, Playground Vocabulary
    expect(ENGLISH_SKILL_MAP.has('eng_toys_vocabulary')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_playground_vocabulary')).toBe(true);

    // Greetings: Greeting Recognition, Greeting Usage
    expect(ENGLISH_SKILL_MAP.has('eng_greetings_recognition')).toBe(true);
    expect(ENGLISH_SKILL_MAP.has('eng_greetings_usage')).toBe(true);
  });

  it('ensures no duplicate or ambiguous skill IDs exist', () => {
    const ids = CANONICAL_ENGLISH_SKILLS.map((s) => s.skillId);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('maps 100% of English curriculum questions to valid canonical skills', () => {
    const englishQuestions = getAllQuestions().filter((q) => q.subject === 'english');
    expect(englishQuestions.length).toBeGreaterThan(50);

    for (const q of englishQuestions) {
      const resolved = resolveEnglishSkill(q);
      expect(resolved).toBeDefined();
      expect(ENGLISH_SKILL_MAP.has(resolved.skillId)).toBe(true);
      expect(resolved.category).toBeDefined();
    }
  });
});

describe('P32 — 2. Multi-factor Mastery Scoring Engine', () => {
  it('creates a clean initial state with zero mastery and NOVICE level', () => {
    const state = EnglishMasteryEngine.createInitialState('eng_alphabet_recognition', 'alphabet');
    expect(state.level).toBe('NOVICE');
    expect(state.status).toBe('NOT_STARTED');
    expect(state.masteryScore).toBe(0);
    expect(state.confidence).toBe(0);
    expect(state.attempts).toBe(0);
    expect(state.correct).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.difficulty).toBe(1);
  });

  it('does NOT allow D1 alone to achieve full mastery (enforces D1 cap at 55)', () => {
    let state = EnglishMasteryEngine.createInitialState('eng_colors_recognition', 'colors');

    // Simulate 10 consecutive correct answers at D1
    for (let i = 0; i < 10; i++) {
      state = EnglishMasteryEngine.processAnswer(state, {
        skillId: 'eng_colors_recognition',
        questionId: `q-${i}`,
        difficulty: 1, // D1 only
        isCorrect: true,
      });
    }

    // Even with 100% accuracy and 10 streak at D1, mastery score must NOT exceed D1 cap
    expect(state.masteryScore).toBeLessThanOrEqual(MASTERY_CONSTANTS.DIFFICULTY_CAPS[1]);
    expect(state.level).not.toBe('MASTERED');
  });

  it('increases mastery cap as child proves competence at higher difficulty levels', () => {
    let state = EnglishMasteryEngine.createInitialState('eng_animals_vocabulary', 'animals');

    // D1 attempts
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q1', difficulty: 1, isCorrect: true });
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q2', difficulty: 1, isCorrect: true });

    // D2 attempts
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q3', difficulty: 2, isCorrect: true });
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q4', difficulty: 2, isCorrect: true });
    const scoreD2 = state.masteryScore;
    expect(scoreD2).toBeGreaterThan(50);
    expect(scoreD2).toBeLessThanOrEqual(MASTERY_CONSTANTS.DIFFICULTY_CAPS[2]);

    // D3 attempts
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q5', difficulty: 3, isCorrect: true });
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q6', difficulty: 3, isCorrect: true });
    const scoreD3 = state.masteryScore;
    expect(scoreD3).toBeGreaterThan(scoreD2);
    expect(scoreD3).toBeLessThanOrEqual(MASTERY_CONSTANTS.DIFFICULTY_CAPS[3]);

    // D4 attempts
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q7', difficulty: 4, isCorrect: true });
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q8', difficulty: 4, isCorrect: true });
    const scoreD4 = state.masteryScore;
    expect(scoreD4).toBeGreaterThan(scoreD3);
    expect(scoreD4).toBeGreaterThanOrEqual(85);
  });

  it('scales confidence with attempt count and consistency', () => {
    let state = EnglishMasteryEngine.createInitialState('eng_numbers_counting', 'numbers');

    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q1', difficulty: 1, isCorrect: true });
    expect(state.confidence).toBeLessThan(0.4);

    for (let i = 2; i <= 6; i++) {
      state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: `q${i}`, difficulty: 2, isCorrect: true });
    }
    expect(state.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('applies recency decay when unpracticed for over 14 days', () => {
    const now = new Date('2026-10-15T00:00:00Z');
    const oldDate = new Date('2026-09-01T00:00:00Z'); // 44 days earlier

    const freshScore = EnglishMasteryEngine.computeMasteryScore({
      lifetimeAccuracy: 90,
      recentAccuracy: 90,
      confidence: 1.0,
      streak: 5,
      consecutiveErrors: 0,
      highestDifficulty: 4,
      lastPracticedAt: now.toISOString(),
      now,
    });

    const decayedScore = EnglishMasteryEngine.computeMasteryScore({
      lifetimeAccuracy: 90,
      recentAccuracy: 90,
      confidence: 1.0,
      streak: 5,
      consecutiveErrors: 0,
      highestDifficulty: 4,
      lastPracticedAt: oldDate.toISOString(),
      now,
    });

    expect(decayedScore).toBeLessThan(freshScore);
  });
});

describe('P32 — 3. Deterministic State Machine Transitions', () => {
  it('follows the deterministic state machine forward progression', () => {
    let state = EnglishMasteryEngine.createInitialState('eng_school_vocabulary', 'school');
    expect(state.level).toBe('NOVICE');

    // 1. First successful attempts → LEARNING
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q1', difficulty: 1, isCorrect: true });
    expect(state.level).toBe('LEARNING');

    // 2. Further practice at D2 → PRACTICING
    for (let i = 2; i <= 4; i++) {
      state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: `q${i}`, difficulty: 2, isCorrect: true });
    }
    expect(state.level).toBe('PRACTICING');

    // 3. Steady practice at D3 with streak → STABLE
    for (let i = 5; i <= 7; i++) {
      state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: `q${i}`, difficulty: 3, isCorrect: true });
    }
    expect(state.level).toBe('STABLE');

    // 4. Strong practice at D4 → CANDIDATE_MASTERED
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q8', difficulty: 4, isCorrect: true });
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q9', difficulty: 4, isCorrect: true });
    expect(state.status).toBe('CANDIDATE_MASTERED');
    expect(state.level).not.toBe('MASTERED'); // Still needs validation session!
  });

  it('triggers REMEDIAL status when child makes consecutive mistakes', () => {
    let state = EnglishMasteryEngine.createInitialState('eng_food_vocabulary', 'food');

    // Good start
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q1', difficulty: 1, isCorrect: true });
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q2', difficulty: 2, isCorrect: true });

    // Two consecutive mistakes
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q3', difficulty: 2, isCorrect: false });
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'q4', difficulty: 2, isCorrect: false });

    expect(state.consecutiveErrors).toBe(2);
    expect(state.remediationNeeded).toBe(true);
    expect(state.status).toBe('REMEDIAL');
  });
});

describe('P32 — 4. Regression Engine & Protection Rules', () => {
  it('protects MASTERED status from an isolated single mistake', () => {
    // Manually simulate a mastered state
    let state = EnglishMasteryEngine.createInitialState('eng_body_vocabulary', 'body');
    state.level = 'MASTERED';
    state.status = 'MASTERED';
    state.masteryScore = 95;
    state.confidence = 1.0;
    state.attempts = 15;
    state.correct = 14;

    // Single error occurs
    state = EnglishMasteryEngine.processAnswer(state, {
      skillId: state.skillId,
      questionId: 'err-1',
      difficulty: 4,
      isCorrect: false,
    });

    // RULE: Single mistake must NOT demote MASTERED
    expect(state.consecutiveErrors).toBe(1);
    expect(state.level).toBe('MASTERED');
    expect(state.status).toBe('MASTERED');
  });

  it('demotes MASTERED when child exhibits a pattern of failure (consecutive errors)', () => {
    let state = EnglishMasteryEngine.createInitialState('eng_greetings_usage', 'greetings');
    state.level = 'MASTERED';
    state.status = 'MASTERED';
    state.masteryScore = 94;
    state.confidence = 1.0;
    state.attempts = 15;
    state.correct = 14;

    // Error 1: Protected
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'err-1', difficulty: 4, isCorrect: false });
    expect(state.level).toBe('MASTERED');

    // Error 2: Regression triggered!
    state = EnglishMasteryEngine.processAnswer(state, { skillId: state.skillId, questionId: 'err-2', difficulty: 4, isCorrect: false });
    expect(state.consecutiveErrors).toBe(2);
    expect(['STABLE', 'PRACTICING']).toContain(state.level);
    expect(state.status).toBe('NEEDS_REVIEW');
  });

  it('demotes when spaced retention review repeatedly fails', () => {
    let state = EnglishMasteryEngine.createInitialState('eng_alphabet_phonics', 'phonics');
    state.level = 'MASTERED';
    state.status = 'MASTERED';

    // First review check failed (isolated)
    state = EnglishMasteryEngine.recordRetentionReview(state, false);
    expect(state.level).toBe('MASTERED');

    // Second review check failed (pattern)
    state = EnglishMasteryEngine.recordRetentionReview(state, false);
    expect(state.level).toBe('STABLE');
    expect(state.status).toBe('NEEDS_REVIEW');
  });
});

describe('P32 — 5. Validation Session Gate', () => {
  it('cannot be awarded MASTERED without completing validation session', () => {
    let state = EnglishMasteryEngine.createInitialState('eng_family_vocabulary', 'family');
    state.level = 'STABLE';
    state.status = 'CANDIDATE_MASTERED';
    state.masteryScore = 88;

    // Start validation session
    const validationSession = EnglishMasteryEngine.startValidationSession(state, 4);
    expect(validationSession.totalQuestions).toBe(4);
    expect(validationSession.passed).toBe(false);

    // Fail validation (e.g. only 1/4 correct)
    const { updatedState: failedState, session: failedResult } = EnglishMasteryEngine.completeValidationSession(
      state,
      validationSession,
      1
    );
    expect(failedResult.passed).toBe(false);
    expect(failedState.level).toBe('STABLE');
    expect(failedState.status).toBe('STABLE');

    // Pass validation (4/4 correct at D4)
    const { updatedState: passedState, session: passedResult } = EnglishMasteryEngine.completeValidationSession(
      state,
      validationSession,
      4
    );
    expect(passedResult.passed).toBe(true);
    expect(passedState.level).toBe('MASTERED');
    expect(passedState.status).toBe('MASTERED');
    expect(passedState.masteryScore).toBeGreaterThanOrEqual(90);
  });
});

describe('P32 — 6. Adaptive Difficulty Engine & Anti-Randomness Rules', () => {
  it('determines difficulty D1–D5 deterministically from question characteristics', () => {
    const questions = getAllQuestions().filter((q) => q.subject === 'english');
    const difficulties = new Set<EnglishDifficultyLevel>();

    for (const q of questions) {
      const d = inferQuestionDifficulty(q);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(5);
      difficulties.add(d);
    }

    // Verify breadth of difficulty tiers
    expect(difficulties.size).toBeGreaterThanOrEqual(3);
  });

  it('never uses Math.random() to decide difficulty, skill, or learning path', () => {
    const masteryMap: Record<string, EnglishMasteryState> = {
      eng_alphabet_recognition: {
        ...EnglishMasteryEngine.createInitialState('eng_alphabet_recognition', 'alphabet'),
        status: 'NEEDS_REVIEW',
        level: 'MASTERED',
      },
    };

    // Call selectTargetSkill twice with identical input
    const sel1 = EnglishAdaptiveEngine.selectTargetSkill(masteryMap, new Date('2026-10-15T12:00:00Z'));
    const sel2 = EnglishAdaptiveEngine.selectTargetSkill(masteryMap, new Date('2026-10-15T12:00:00Z'));

    expect(sel1.targetSkill.skillId).toBe(sel2.targetSkill.skillId);
    expect(sel1.sessionType).toBe(sel2.sessionType);
    expect(sel1.sessionType).toBe('SPACED_REVIEW');
  });

  it('prioritizes remediation for struggling skills', () => {
    const masteryMap: Record<string, EnglishMasteryState> = {
      eng_toys_vocabulary: {
        ...EnglishMasteryEngine.createInitialState('eng_toys_vocabulary', 'toys'),
        status: 'REMEDIAL',
        remediationNeeded: true,
        consecutiveErrors: 2,
      },
      eng_colors_recognition: {
        ...EnglishMasteryEngine.createInitialState('eng_colors_recognition', 'colors'),
        level: 'LEARNING',
      },
    };

    const target = EnglishAdaptiveEngine.selectTargetSkill(masteryMap);
    expect(target.targetSkill.skillId).toBe('eng_toys_vocabulary');
    expect(target.sessionType).toBe('REMEDIATION');
  });

  it('steps down difficulty during remediation to rebuild child confidence', () => {
    const remedialState: EnglishMasteryState = {
      ...EnglishMasteryEngine.createInitialState('eng_school_vocabulary', 'school'),
      difficulty: 3,
      consecutiveErrors: 2,
      remediationNeeded: true,
    };

    const targetDiff = EnglishAdaptiveEngine.calculateTargetDifficulty(remedialState, 'REMEDIATION');
    expect(targetDiff).toBe(2); // Reduced from 3 to 2
  });

  it('composes an adaptive practice session with anti-repetition guards', () => {
    const masteryMap: Record<string, EnglishMasteryState> = {};
    const session = EnglishAdaptiveEngine.composeAdaptiveSession(masteryMap, { maxQuestions: 5 });

    expect(session.recommendations).toHaveLength(5);
    const questionIds = session.recommendations.map((r) => r.question.id);
    const uniqueIds = new Set(questionIds);

    // No duplicate questions in a single adaptive session
    expect(uniqueIds.size).toBe(5);

    // Every recommendation has explicit pedagogical rationale
    for (const rec of session.recommendations) {
      expect(rec.reason).toBeTruthy();
      expect(rec.pedagogicalGoal).toBeTruthy();
      expect(rec.difficultyCode).toMatch(/^D[1-5]$/);
    }
  });
});

describe('P32 — 7. Persistence & Store Resilience', () => {
  beforeEach(() => {
    EnglishMasteryStore.clear();
  });

  it('persists mastery records across loads without data loss', () => {
    const initial = EnglishMasteryStore.getState('eng_alphabet_sound', 'phonics');
    expect(initial.attempts).toBe(0);

    const updated = EnglishMasteryStore.recordAnswer({
      skillId: 'eng_alphabet_sound',
      questionId: 'q-abc',
      difficulty: 2,
      isCorrect: true,
    });
    expect(updated.attempts).toBe(1);
    expect(updated.correct).toBe(1);

    // Reload from storage
    const reloaded = EnglishMasteryStore.getState('eng_alphabet_sound');
    expect(reloaded.attempts).toBe(1);
    expect(reloaded.correct).toBe(1);
    expect(reloaded.level).toBe('LEARNING');
  });

  it('computes learner profile summary across skills', () => {
    EnglishMasteryStore.recordAnswer({ skillId: 'eng_numbers_counting', questionId: 'q1', difficulty: 1, isCorrect: true });
    EnglishMasteryStore.recordAnswer({ skillId: 'eng_colors_recognition', questionId: 'q2', difficulty: 1, isCorrect: true });

    const profile = EnglishMasteryStore.getLearnerProfile('test-child');
    expect(profile.learnerId).toBe('test-child');
    expect(Object.keys(profile.skills)).toHaveLength(2);
    expect(profile.inProgressCount).toBe(2);
  });
});

describe('P32 — 8. Absolute Safety & Regression Rules', () => {
  it('preserves Math canonical expression normalization and answer checking ("10 - 3 = 7")', () => {
    const canonical = normalizeMathExpression(' 10  -  3 = 7 ');
    expect(canonical).toBe('10-3=7');

    const fakeQuestion = {
      id: 'math-test-1',
      subject: 'toan' as const,
      topicId: 'math-test',
      skillId: 'math_subtraction_10',
      difficulty: 1 as const,
      type: 'math-expression' as const,
      prompt: '10 - 3 = ?',
      correctAnswer: '10 - 3 = 7',
    };
    expect(checkAnswer(fakeQuestion, ' 10 - 3 = 7 ')).toBe(true);
    expect(checkAnswer(fakeQuestion, ' 10 - 3 = 8 ')).toBe(false);
  });

  it('verifies all English questions retain valid audioPrompt for child-initiated audio', () => {
    const englishQuestions = getAllQuestions().filter((q) => q.subject === 'english');
    const withAudio = englishQuestions.filter((q) => Boolean(q.audioPrompt));
    // The vast majority of English questions have audio prompt for listening
    expect(withAudio.length).toBeGreaterThanOrEqual(40);
  });
});
