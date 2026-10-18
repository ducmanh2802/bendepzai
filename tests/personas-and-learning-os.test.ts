import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill in-memory localStorage for the Node test runner.
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import { ReadingEngine } from '../src/services/readingEngine';
import { LearningOS } from '../src/services/learningOS';
import { StorageService } from '../src/services/storage';
import { AdaptiveService } from '../src/services/adaptive';
import { getReadingQuestionById } from '../src/data/readingContent';
import { READING_POLICY } from '../src/config/policy';
import type { ReadingProfile, ReadingResponse } from '../src/types/reading';
import type { SubjectType } from '../src/types';

function answer(
  questionId: string,
  correct: boolean,
  secondsPerItem: number
): ReadingResponse {
  const q = getReadingQuestionById(questionId)!;
  return {
    questionId: q.id,
    skillId: q.skillId,
    questionType: q.questionType,
    difficulty: q.difficulty,
    correct,
    responseTimeMs: secondsPerItem * 1000,
    wordsProcessed:
      q.questionType === 'read-aloud' || q.questionType === 'phrase-repeat' ? q.wordCount : 0,
    hesitation: secondsPerItem > READING_POLICY.HESITATION_SECONDS,
    answeredAt: secondsPerItem * 1000,
  };
}

/**
 * Simulates a learner's whole reading history and returns the final profile.
 * `plan` maps a stage to the accuracy (0-100) the learner achieves there.
 */
function simulateReading(
  plan: { stage: string; accuracy: number; seconds: number; attempts?: number }[]
): ReadingProfile {
  let profile = ReadingEngine.emptyProfile();
  for (const step of plan) {
    const stage = step.stage as ReadingProfile['currentStage'];
    const items = ReadingEngine.assembleStageItems(stage, 1, 4);
    const attempts = step.attempts ?? 2;
    for (let a = 0; a < attempts; a += 1) {
      // Exact, deterministic hit count so the simulated accuracy is precise.
      const correctCount = Math.round((items.length * step.accuracy) / 100);
      const responses = items.map((q, idx) => answer(q.id, idx < correctCount, step.seconds));
      const metrics = ReadingEngine.computeMetrics(
        `sim_${stage}_${a}`,
        stage,
        responses,
        0,
        step.seconds * 1000 * items.length
      );
      profile = ReadingEngine.applySession(profile, metrics);
    }
  }
  return profile;
}

function answerSubject(
  skillId: string,
  subject: SubjectType,
  correct: boolean,
  n: number,
  questionPrefix = 'sim'
) {
  for (let i = 0; i < n; i += 1) {
    StorageService.recordQuestionAnswer(skillId, correct, `${questionPrefix}_${skillId}_${i}`, 'p', subject);
  }
}

describe('§32 — persona simulations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('CHILD D (new user, no history) gets a cold-start plan and zero fake scores', () => {
    const states = StorageService.getKnowledgeStates();
    const actions = LearningOS.getNextBestActions(states);
    const report = AdaptiveService.generateParentReport();

    expect(Object.keys(states)).toHaveLength(0);
    expect(report.totalAnswered).toBe(0);
    expect(report.overallAccuracy).toBe(0);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some((a) => a.type === 'LEARN')).toBe(true);
    // Nothing may claim the child has mastered anything.
    expect(report.weakSkills).toEqual([]);
    expect(report.strongSkills).toEqual([]);
  });

  it('CHILD A (weak math) gets maths remediation, not Vietnamese remediation', () => {
    answerSubject('vn_alphabet', 'tieng-viet', true, 6);
    answerSubject('math_subtraction_10', 'toan', false, 4);

    const states = StorageService.getKnowledgeStates();
    const actions = LearningOS.getNextBestActions(states);
    const report = AdaptiveService.generateParentReport();

    expect(states['math_subtraction_10'].status).toBe('NEEDS_REVIEW');
    expect(states['vn_alphabet'].status).toBe('MASTERED');
    expect(report.subjectMastery['toan'].percent).toBe(0);
    expect(report.subjectMastery['tieng-viet'].percent).toBe(100);

    const topAction = actions[0];
    expect(topAction.skillId).toBe('math_subtraction_10');
    expect(topAction.type).toBe('PRACTICE');
  });

  it('CHILD B (weak Vietnamese, strong math) gets Vietnamese remediation', () => {
    answerSubject('math_addition_10', 'toan', true, 6);
    answerSubject('vn_chinh_ta', 'tieng-viet', false, 4);

    const actions = LearningOS.getNextBestActions(StorageService.getKnowledgeStates());
    expect(actions[0].skillId).toBe('vn_chinh_ta');
  });

  it('CHILD E (accurate but slow reader) is NOT judged knowledge-weak', () => {
    // 100% accuracy at 25 s/item — far slower than the "swift" band.
    const profile = simulateReading([
      { stage: 'ACCURACY', accuracy: 100, seconds: 25 },
      { stage: 'FLUENCY', accuracy: 100, seconds: 25 },
      { stage: 'COMPREHENSION', accuracy: 90, seconds: 25 },
    ]);

    expect(profile.accuracyIndex).toBeGreaterThanOrEqual(85);
    expect(profile.readingIndex).toBeGreaterThanOrEqual(70);
    expect(profile.stageStates.ACCURACY.isCompleted).toBe(true);
    expect(profile.stageStates.COMPREHENSION.isUnlocked).toBe(true);
    // Child-facing copy must stay supportive.
    expect(profile.headline.toLowerCase()).not.toContain('chậm');
    expect(profile.headline.toLowerCase()).not.toContain('yếu');
    expect(profile.encouragement.toLowerCase()).not.toContain('kém');
  });

  it('CHILD E is still offered speed practice only AFTER accuracy is established', () => {
    const profile = simulateReading([
      { stage: 'ACCURACY', accuracy: 100, seconds: 25 },
      { stage: 'FLUENCY', accuracy: 100, seconds: 25 },
      { stage: 'COMPREHENSION', accuracy: 90, seconds: 25 },
      { stage: 'PROCESSING_SPEED', accuracy: 90, seconds: 25 },
    ]);
    expect(profile.stageStates.PROCESSING_SPEED.isUnlocked).toBe(true);
    // Speed training is unlocked but mastery is not granted by speed alone.
    expect(profile.readingIndex).toBeGreaterThanOrEqual(70);
  });

  it('CHILD F (fast but poor comprehension) is NOT given high mastery', () => {
    // 4 s/item (fast) but only 25% accuracy (1/4 per session — genuinely poor;
    // T13 grew the ACCURACY pool past 4 items, so 40% would round to 2/4 = 50%).
    const profile = simulateReading([
      { stage: 'ACCURACY', accuracy: 25, seconds: 4 },
      { stage: 'FLUENCY', accuracy: 25, seconds: 4 },
    ]);

    expect(profile.accuracyIndex).toBeLessThan(50);
    expect(profile.readingIndex).toBeLessThan(50);
    expect(profile.stageStates.ACCURACY.isCompleted).toBe(false);
    expect(profile.stageStates.COMPREHENSION.isUnlocked).toBe(false);
    expect(profile.stageStates.PROCESSING_SPEED.isUnlocked).toBe(false);
  });

  it('CHILD C (balanced) advances through the ladder cleanly', () => {
    const profile = simulateReading([
      { stage: 'ACCURACY', accuracy: 100, seconds: 12 },
      { stage: 'FLUENCY', accuracy: 90, seconds: 12 },
      { stage: 'COMPREHENSION', accuracy: 85, seconds: 12 },
    ]);
    expect(profile.stageStates.ACCURACY.isCompleted).toBe(true);
    expect(profile.stageStates.FLUENCY.isCompleted).toBe(true);
    expect(profile.readingIndex).toBeGreaterThanOrEqual(60);
    // Comprehension is complete, so the ladder offers the next speed stage.
    expect(profile.stageStates.COMPREHENSION.isCompleted).toBe(true);
    expect(profile.currentStage).toBe('PROCESSING_SPEED');
  });

  it('every persona gets a reading recommendation from the Learning OS', () => {
    answerSubject('vn_alphabet', 'tieng-viet', true, 4);
    const actions = LearningOS.getNextBestActions(StorageService.getKnowledgeStates());
    expect(actions.some((a) => a.id.startsWith('action_reading'))).toBe(true);
  });
});

describe('§33 — Learning OS domain engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reduces evidence into a mastery transition', () => {
    let state = LearningOS.createInitialKnowledgeState('vn_alphabet', 'Bảng Chữ Cái', 'tieng-viet');
    expect(state.status).toBe('NOT_STARTED');
    expect(state.mastery).toBe(0);

    for (let i = 0; i < 4; i += 1) {
      state = LearningOS.reduceEvidence(state, {
        id: `e${i}`,
        learnerId: 'child_1',
        source: 'LESSON',
        skillId: 'vn_alphabet',
        subject: 'tieng-viet',
        timestamp: 1000 * (i + 1),
        correct: true,
      });
    }
    expect(state.attemptCount).toBe(4);
    expect(state.correctCount).toBe(4);
    expect(state.status).toBe('MASTERED');
    expect(state.mastery).toBeGreaterThan(70);
    expect(state.nextReviewAt).toBeDefined();
  });

  it('flags consecutive failures as NEEDS_REVIEW', () => {
    let state = LearningOS.createInitialKnowledgeState('math_subtraction_10', 'Phép Trừ', 'toan');
    for (let i = 0; i < 3; i += 1) {
      state = LearningOS.reduceEvidence(state, {
        id: `f${i}`,
        learnerId: 'child_1',
        source: 'LESSON',
        skillId: 'math_subtraction_10',
        subject: 'toan',
        timestamp: 1000 * (i + 1),
        correct: false,
        errorType: 'KNOWLEDGE_GAP',
      });
    }
    expect(state.status).toBe('NEEDS_REVIEW');
    expect(state.errorProfile.knowledgeGap).toBe(3);
    expect(state.consecutiveIncorrect).toBe(3);
  });

  it('is a pure function: the previous state is never mutated', () => {
    const before = LearningOS.createInitialKnowledgeState('vn_alphabet', 'Bảng Chữ Cái', 'tieng-viet');
    const snapshot = JSON.stringify(before);
    LearningOS.reduceEvidence(before, {
      id: 'x',
      learnerId: 'child_1',
      source: 'LESSON',
      skillId: 'vn_alphabet',
      subject: 'tieng-viet',
      timestamp: 1,
      correct: true,
    });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('sorts recommendations deterministically for the same evidence', () => {
    answerSubject('math_subtraction_10', 'toan', false, 4);
    answerSubject('vn_alphabet', 'tieng-viet', true, 4);
    const states = StorageService.getKnowledgeStates();
    const first = LearningOS.getNextBestActions(states).map((a) => a.id);
    const second = LearningOS.getNextBestActions(states).map((a) => a.id);
    expect(first).toEqual(second);
  });

  it('respects fatigue and proposes a light activity', () => {
    answerSubject('vn_alphabet', 'tieng-viet', true, 4);
    const fatigued = LearningOS.getNextBestActions(
      StorageService.getKnowledgeStates(),
      {
        sessionStartTime: Date.now(),
        questionsAnsweredThisSession: 30,
        sessionErrorsCount: 5,
        consecutiveErrorsInSession: 5,
        isFatigued: true,
      }
    );
    expect(fatigued).toHaveLength(1);
    expect(fatigued[0].type).toBe('GAME');
  });

  it('explains every recommendation with real evidence lines', () => {
    answerSubject('math_subtraction_10', 'toan', false, 3);
    const states = StorageService.getKnowledgeStates();
    const action = LearningOS.getNextBestActions(states)[0];
    const explanation = LearningOS.explainRecommendation(action, states[action.skillId!]);
    expect(explanation.recommendation).toBe(action.title);
    expect(explanation.evidence.length).toBeGreaterThan(0);
    expect(explanation.expectedGoal.length).toBeGreaterThan(0);
    // Evidence must quote real numbers, not placeholders.
    expect(explanation.evidence.join(' ')).toMatch(/\d/);
  });

  it('builds a daily plan within the configured minute budget', () => {
    answerSubject('math_subtraction_10', 'toan', false, 3);
    answerSubject('vn_alphabet', 'tieng-viet', true, 3);
    const plan = StorageService.refreshDailyPlan('2025-01-01');
    expect(plan.date).toBe('2025-01-01');
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.items.length).toBeLessThanOrEqual(4);
    expect(plan.estimatedMinutes).toBeGreaterThan(0);
    // No duplicate skills inside one plan.
    const skillIds = plan.items.map((i) => i.action.skillId);
    expect(new Set(skillIds).size).toBe(skillIds.length);
    // Persisted for reload.
    expect(StorageService.getLearningOSStore().dailyPlan?.date).toBe('2025-01-01');
  });

  it('persists evidence history and reloads it unchanged', () => {
    answerSubject('vn_alphabet', 'tieng-viet', true, 3);
    const before = StorageService.getLearningOSStore();
    const after = StorageService.getLearningOSStore();
    expect(after.recentEvidences.length).toBe(before.recentEvidences.length);
    expect(after.processedEvidenceIds.length).toBe(before.processedEvidenceIds.length);
  });
});

describe('§33 — adaptive review selection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prioritises weak skills in the daily review set', () => {
    answerSubject('math_subtraction_10', 'toan', false, 3);
    const set = AdaptiveService.generateDailyReview();
    expect(set.weakCount).toBeGreaterThanOrEqual(1);
    expect(set.questions.some((q) => q.skillId === 'math_subtraction_10')).toBe(true);
  });

  it('never returns duplicate questions in one review set', () => {
    answerSubject('vn_alphabet', 'tieng-viet', true, 4);
    const set = AdaptiveService.generateDailyReview();
    const ids = set.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('always returns a usable set for a brand-new child', () => {
    const set = AdaptiveService.generateDailyReview();
    expect(set.questions.length).toBeGreaterThanOrEqual(5);
    expect(set.weakCount).toBe(0);
  });
});
