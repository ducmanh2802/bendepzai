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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService, STORAGE_SCHEMA_VERSION } from '../src/services/storage';
import { resetStaleFatigue, LEARNING_OS_POLICY } from '../src/services/learningOS';
import type { SessionFatigueState } from '../src/types/learningOS';

const STORE_KEY = 'kho_bau_learning_os_store';

function makeFatigue(overrides: Partial<SessionFatigueState> = {}): SessionFatigueState {
  return {
    sessionStartTime: Date.now(),
    questionsAnsweredThisSession: 0,
    sessionErrorsCount: 0,
    consecutiveErrorsInSession: 0,
    isFatigued: false,
    ...overrides,
  };
}

function recordEvidence(id: string, correct: boolean) {
  return StorageService.recordLearningEvidence({
    id,
    learnerId: 'child_1',
    source: 'LESSON',
    skillId: 'vn_alphabet',
    subject: 'tieng-viet',
    timestamp: Date.now(),
    correct,
  });
}

describe('resetStaleFatigue (P0-2)', () => {
  it('keeps an active session untouched (same object)', () => {
    const f = makeFatigue({ questionsAnsweredThisSession: 20, isFatigued: true });
    const now = f.sessionStartTime + 5 * 60 * 1000;
    expect(resetStaleFatigue(f, now)).toBe(f);
  });

  it('resets after FATIGUE_SESSION_GAP_MS of inactivity', () => {
    const f = makeFatigue({ questionsAnsweredThisSession: 20, isFatigued: true });
    const now = f.sessionStartTime + LEARNING_OS_POLICY.FATIGUE_SESSION_GAP_MS + 1;
    const r = resetStaleFatigue(f, now);
    expect(r).not.toBe(f);
    expect(r.questionsAnsweredThisSession).toBe(0);
    expect(r.sessionErrorsCount).toBe(0);
    expect(r.consecutiveErrorsInSession).toBe(0);
    expect(r.isFatigued).toBe(false);
    expect(r.sessionStartTime).toBe(now);
  });

  it('resets when the local day changes', () => {
    const start = new Date(2026, 9, 17, 23, 30).getTime(); // 23:30 local
    const f = makeFatigue({ sessionStartTime: start, isFatigued: true });
    const now = new Date(2026, 9, 18, 8, 0).getTime(); // next morning
    const r = resetStaleFatigue(f, now);
    expect(r.isFatigued).toBe(false);
    expect(r.questionsAnsweredThisSession).toBe(0);
  });

  it('does not reset one millisecond before the gap boundary', () => {
    const f = makeFatigue({ questionsAnsweredThisSession: 3 });
    const now = f.sessionStartTime + LEARNING_OS_POLICY.FATIGUE_SESSION_GAP_MS - 1;
    expect(resetStaleFatigue(f, now)).toBe(f);
  });
});

describe('StorageService fatigue reset (P0-2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears a latched fatigue when the app is reopened after a gap', () => {
    const old = Date.now() - 2 * 60 * 60 * 1000;
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        schemaVersion: STORAGE_SCHEMA_VERSION,
        knowledgeStates: {},
        recentEvidences: [],
        processedEvidenceIds: [],
        fatigue: {
          sessionStartTime: old,
          questionsAnsweredThisSession: 30,
          sessionErrorsCount: 5,
          consecutiveErrorsInSession: 5,
          isFatigued: true,
        },
        recommendationHistory: [],
        sessionState: null,
      })
    );
    const store = StorageService.getLearningOSStore();
    expect(store.fatigue.isFatigued).toBe(false);
    expect(store.fatigue.questionsAnsweredThisSession).toBe(0);
  });

  it('resets counters when evidence arrives after a long gap', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 17, 9, 0, 0));
    expect(recordEvidence('gap_test_1', false)).toBe(true);
    let store = StorageService.getLearningOSStore();
    expect(store.fatigue.questionsAnsweredThisSession).toBe(1);
    expect(store.fatigue.sessionErrorsCount).toBe(1);

    // 60 minutes later — same morning, but the previous session is stale.
    vi.setSystemTime(new Date(2026, 9, 17, 10, 0, 0));
    expect(recordEvidence('gap_test_2', true)).toBe(true);
    store = StorageService.getLearningOSStore();
    expect(store.fatigue.questionsAnsweredThisSession).toBe(1); // reset, then +1
    expect(store.fatigue.sessionErrorsCount).toBe(0);
    expect(store.fatigue.consecutiveErrorsInSession).toBe(0);
  });

  it('keeps counting within an active session', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 17, 9, 0, 0));
    for (let i = 0; i < 3; i += 1) {
      recordEvidence(`active_${i}`, true);
    }
    vi.setSystemTime(new Date(2026, 9, 17, 9, 15, 0)); // +15 min, still under the gap
    recordEvidence('active_3', true);
    const store = StorageService.getLearningOSStore();
    expect(store.fatigue.questionsAnsweredThisSession).toBe(4);
  });
});
