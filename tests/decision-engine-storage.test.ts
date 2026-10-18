import { describe, it, expect, beforeEach } from 'vitest';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
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

import { StorageService } from '../src/services/storage';
import { DecisionEngine } from '../src/services/decisionEngine';
import { LearningOS } from '../src/services/learningOS';

describe('SM2 repro via StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('produces SM2_DUE recommendation from real store', () => {
    const now = Date.now();
    localStorage.setItem(
      'kho_bau_learning_os_store',
      JSON.stringify({
        schemaVersion: 'P30-v1',
        knowledgeStates: {
          math_addition_10: {
            skillId: 'math_addition_10',
            skillName: 'Cộng trong phạm vi 10',
            subject: 'toan',
            status: 'MASTERED',
            mastery: 90,
            confidence: 100,
            accuracy: 92,
            recentAccuracy: 93,
            attemptCount: 7,
            correctCount: 7,
            consecutiveCorrect: 3,
            consecutiveIncorrect: 0,
            lastPracticedAt: now - 10 * 86400000,
            nextReviewAt: now - 86400000,
            averageResponseTimeMs: 15000,
            difficultyPerformance: {
              easy: { attempts: 3, correct: 3 },
              medium: { attempts: 4, correct: 4 },
              hard: { attempts: 0, correct: 0 },
              challenge: { attempts: 0, correct: 0 },
            },
            errorProfile: { knowledgeGap: 0, careless: 0, speed: 0, misread: 0, reasoning: 0, unclassified: 0 },
            evidenceVersion: 7,
          },
          math_subtraction_10: {
            skillId: 'math_subtraction_10',
            skillName: 'Trừ trong phạm vi 10',
            subject: 'toan',
            status: 'NEEDS_REVIEW',
            mastery: 40,
            confidence: 70,
            accuracy: 45,
            recentAccuracy: 30,
            attemptCount: 6,
            correctCount: 3,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 3,
            lastPracticedAt: now - 2 * 86400000,
            lastIncorrectAt: now - 86400000,
            difficultyPerformance: {
              easy: { attempts: 2, correct: 1 },
              medium: { attempts: 4, correct: 2 },
              hard: { attempts: 0, correct: 0 },
              challenge: { attempts: 0, correct: 0 },
            },
            errorProfile: { knowledgeGap: 2, careless: 0, speed: 0, misread: 0, reasoning: 1, unclassified: 0 },
            evidenceVersion: 6,
          },
        },
        recentEvidences: [],
        dailyPlan: null,
        fatigue: {
          sessionStartTime: now,
          questionsAnsweredThisSession: 0,
          sessionErrorsCount: 0,
          consecutiveErrorsInSession: 0,
          isFatigued: false,
        },
        recommendationHistory: [],
        processedEvidenceIds: [],
      })
    );

    const store = StorageService.getLearningOSStore();
    console.log(
      'addition:',
      JSON.stringify({
        status: store.knowledgeStates.math_addition_10?.status,
        nextReviewAt: store.knowledgeStates.math_addition_10?.nextReviewAt,
        now,
      })
    );

    const core = LearningOS.getNextBestActions(store.knowledgeStates, store.fatigue, now, []);
    console.log(
      'core actions:',
      core.map((a) => ({ id: a.id, type: a.type, skillId: a.skillId }))
    );

    const output = DecisionEngine.decide();
    console.log(
      'recs:',
      output.recommendations.map((r) => ({ id: r.id, codes: r.reasonCodes }))
    );
    const codes = output.recommendations.flatMap((r) => r.reasonCodes);
    expect(codes).toContain('SM2_DUE');
  });
});
