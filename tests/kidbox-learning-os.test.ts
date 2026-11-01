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
import { LearningOS } from '../src/services/learningOS';
import { KidBoxStore, sanitiseKidBoxStore, createEmptyKidBoxStore, KIDBOX_STORE_KEY } from '../src/services/kidBoxStore';
import {
  KIDBOX_TRACK_ID,
  analyseEnglishProfile,
  buildDailyEnglishPlan,
  buildKidBoxActions,
  buildReviewQueue,
  buildSkillStars,
  buildWeeklyReport,
  computeReviewPriority,
  getCurrentUnit,
  getKnowledgeSnapshot,
  getStepProgress,
  getStepsMissingContent,
  shouldEmitLearningEvidence,
  submitActivityResponse,
  KidBoxKnowledgeMap,
} from '../src/services/kidBoxEngine';
import { buildUnitActivities } from '../src/services/kidBoxActivities';
import { findKidBoxUnit, KIDBOX_BRIDGE_UNIT_ID } from '../src/data/kidBoxCurriculum';
import { KIDBOX_POLICY } from '../src/config/policy';
import { KidBoxSkillId } from '../src/types/kidBox';
import { KnowledgeState } from '../src/types';

/** Builds a KnowledgeState snapshot the way the Learning OS would expose it. */
function knowledgeFor(
  entries: Partial<Record<KidBoxSkillId, { attempts: number; correct: number; mastery?: number }>>
): KidBoxKnowledgeMap {
  const map: KidBoxKnowledgeMap = {};
  for (const [skillId, value] of Object.entries(entries) as [
    KidBoxSkillId,
    { attempts: number; correct: number; mastery?: number },
  ][]) {
    map[skillId] = {
      attempts: value.attempts,
      correct: value.correct,
      recentAccuracy: value.attempts > 0 ? Math.round((value.correct / value.attempts) * 100) : 0,
      mastery: value.mastery ?? Math.round((value.correct / Math.max(1, value.attempts)) * 100),
      confidence: Math.min(100, Math.round((value.attempts / 6) * 100)),
    };
  }
  return map;
}

const unit = findKidBoxUnit(KIDBOX_BRIDGE_UNIT_ID)!;
const activities = buildUnitActivities(unit);

function playActivity(kind: string, pickCorrect: boolean, suffix: string) {
  const activity = activities.find((a) => a.kind === kind)!;
  const choice = pickCorrect
    ? activity.items.find((i) => i.isCorrect)!
    : activity.items.find((i) => !i.isCorrect) ?? activity.items[0];
  return submitActivityResponse({
    activity,
    response: { type: 'CHOICE', itemId: choice.id },
    responseKey: suffix,
    startedAt: Date.now() - 1200,
    now: Date.now(),
    childProfileId: 'child_1',
  });
}

describe("Kid's Box Companion — evidence into the shared Learning OS (§17, §18)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('turns a correct answer into a real Learning OS knowledge state', () => {
    const activity = activities.find((a) => a.kind === 'LISTEN_AND_CHOOSE')!;
    const correct = activity.items.find((i) => i.isCorrect)!;

    const result = submitActivityResponse({
      activity,
      response: { type: 'CHOICE', itemId: correct.id },
      responseKey: 'r1',
      startedAt: Date.now() - 900,
      childProfileId: 'child_1',
    });

    expect(result.outcome).toBe('CORRECT');
    expect(result.evidenceRecorded).toBe(true);

    const states = StorageService.getKnowledgeStates();
    const state = states[activity.skillId];
    expect(state).toBeDefined();
    expect(state.attemptCount).toBe(1);
    expect(state.correctCount).toBe(1);
    expect(state.subject).toBe('english');
    // §17 — the mastery model is the app's, not a private companion model.
    expect(state.mastery).toBeGreaterThan(0);
  });

  it('is idempotent: a replayed answer never counts twice', () => {
    const activity = activities.find((a) => a.kind === 'RECOGNITION')!;
    const correct = activity.items.find((i) => i.isCorrect)!;
    const payload = {
      activity,
      response: { type: 'CHOICE' as const, itemId: correct.id },
      responseKey: 'same-key',
      startedAt: Date.now(),
      childProfileId: 'child_1',
    };

    const first = submitActivityResponse(payload);
    const second = submitActivityResponse(payload);

    expect(first.evidenceRecorded).toBe(true);
    expect(second.evidenceRecorded).toBe(false);
    expect(second.progressRecorded).toBe(false);
    expect(StorageService.getKnowledgeStates()[activity.skillId].attemptCount).toBe(1);
  });

  it('never emits evidence for a self-checked or skipped attempt (§14)', () => {
    expect(shouldEmitLearningEvidence('SELF_CHECKED')).toBe(false);
    expect(shouldEmitLearningEvidence('SKIPPED')).toBe(false);
    expect(shouldEmitLearningEvidence('CORRECT')).toBe(true);
    expect(shouldEmitLearningEvidence('INCORRECT')).toBe(true);
    expect(shouldEmitLearningEvidence('RECOGNITION_MATCH')).toBe(true);
  });

  it('records a self-checked speaking attempt as an attempt, not as a right answer', () => {
    const speak = activities.find((a) => a.mode === 'SPEAK')!;
    const target = speak.items.find((i) => i.isCorrect)!;

    const result = submitActivityResponse({
      activity: speak,
      response: { type: 'SPEAK', itemId: target.id, recognitionSupported: false, selfConfirmed: true },
      responseKey: 'speak-1',
      startedAt: Date.now(),
      childProfileId: 'child_1',
    });

    expect(result.outcome).toBe('SELF_CHECKED');
    expect(result.evidenceRecorded).toBe(false);
    // The attempt itself is still stored, so the parent can see the child tried.
    expect(KidBoxStore.get().attempts.some((a) => a.outcome === 'SELF_CHECKED')).toBe(true);
  });

  it('tracks game taps as evidence while never treating a game score as mastery', () => {
    const game = activities.find((a) => a.kind === 'MINI_GAME')!;
    // P0-3 — exactly one picture matches the word the child hears, so the
    // game is winnable; tapping only that picture counts as correct.
    const targets = game.items.filter((i) => i.isCorrect);
    expect(targets).toHaveLength(1);

    const win = submitActivityResponse({
      activity: game,
      response: { type: 'TAPS', itemIds: targets.map((t) => t.id) },
      responseKey: 'game-win',
      startedAt: Date.now(),
      childProfileId: 'child_1',
    });
    expect(win.outcome).toBe('CORRECT');

    const decoy = game.items.find((i) => !i.isCorrect)!;
    const miss = submitActivityResponse({
      activity: game,
      response: { type: 'TAPS', itemIds: [decoy.id] },
      responseKey: 'game-miss',
      startedAt: Date.now(),
      childProfileId: 'child_1',
    });
    expect(miss.outcome).toBe('INCORRECT');

    // §17 — the game is a source, but the Learning OS still owns mastery.
    const state = StorageService.getKnowledgeStates()[game.skillId];
    expect(state.attemptCount).toBe(2);
    expect(state.correctCount).toBe(1);
    expect(state.mastery).toBeLessThan(100);
  });

  it('contributes track actions into the single Learning OS action list (§26)', () => {
    playActivity('LISTEN_AND_CHOOSE', true, 'a1');
    const store = KidBoxStore.get();
    const actions = buildKidBoxActions({ knowledge: getKnowledgeSnapshot(), store });

    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) {
      expect(action.trackId).toBe(KIDBOX_TRACK_ID);
      expect(action.subject).toBe('english');
      expect(action.reason.length).toBeGreaterThan(0);
      expect(action.childExplanation.length).toBeGreaterThan(0);
    }

    const ranked = LearningOS.getNextBestActions(
      StorageService.getKnowledgeStates(),
      StorageService.getLearningOSStore().fatigue,
      Date.now(),
      actions
    );
    expect(ranked[0].trackId).toBe(KIDBOX_TRACK_ID);
  });

  it('never mixes English Kid\u2019s Box actions into the Vietnamese competition set', () => {
    const actions = buildKidBoxActions({ knowledge: {}, store: createEmptyKidBoxStore() });
    for (const action of actions) {
      expect(action.examBlueprintId).toBeUndefined();
      expect(action.subject).toBe('english');
    }
  });
});

describe("Kid's Box Companion — child personas (§18, §37)", () => {
  it('CHILD D (new learner) gets a gentle baseline, not a score chase', () => {
    const profile = analyseEnglishProfile({});
    expect(profile.isColdStart).toBe(true);
    expect(profile.nextBestFocus).toBe('GENTLE_BASELINE');
    expect(profile.totalAttempts).toBe(0);
    expect(profile.explanation).toContain('chưa cần điểm số');
  });

  it('CHILD A (strong vocabulary, weak listening) is pointed at listening', () => {
    const profile = analyseEnglishProfile(
      knowledgeFor({
        'EN-VOCAB-RECOGNITION': { attempts: 10, correct: 10 },
        'EN-VOCAB-MEANING': { attempts: 8, correct: 8 },
        'EN-VOCAB-LISTENING': { attempts: 6, correct: 6 },
        'EN-LISTENING-RECOGNITION': { attempts: 4, correct: 0 },
      })
    );
    expect(profile.isColdStart).toBe(false);
    expect(profile.weakestStrand).toBe('LISTENING');
    expect(profile.nextBestFocus).toBe('LISTENING_RECOGNITION');
    expect(profile.strongestStrand).toBe('VOCABULARY');
  });

  it('CHILD B (strong listening, weak speaking) is pointed at speaking', () => {
    const profile = analyseEnglishProfile(
      knowledgeFor({
        'EN-VOCAB-LISTENING': { attempts: 8, correct: 8 },
        'EN-LISTENING-RECOGNITION': { attempts: 8, correct: 8 },
        'EN-SPEAKING-REPEAT': { attempts: 5, correct: 1 },
      })
    );
    expect(profile.weakestStrand).toBe('SPEAKING');
    expect(profile.nextBestFocus).toBe('SPEAKING_REPEAT');
  });

  it('CHILD C (weak vocabulary, good phonics) is pointed at vocabulary', () => {
    const profile = analyseEnglishProfile(
      knowledgeFor({
        'EN-VOCAB-RECOGNITION': { attempts: 5, correct: 1 },
        'EN-PHONICS-SOUND': { attempts: 8, correct: 8 },
        'EN-PHONICS-INITIAL': { attempts: 6, correct: 6 },
      })
    );
    expect(profile.weakestStrand).toBe('VOCABULARY');
    expect(profile.nextBestFocus).toBe('VOCABULARY_RECOGNITION');
    expect(profile.strongestStrand).toBe('PHONICS');
  });

  it('CHILD E (accurate but slow) gets accuracy work only, never speed pressure', () => {
    const profile = analyseEnglishProfile(
      knowledgeFor({
        'EN-VOCAB-RECOGNITION': { attempts: 6, correct: 6 },
        'EN-LISTENING-RECOGNITION': { attempts: 5, correct: 5 },
      })
    );
    // Everything is accurate, so the plan must not invent a speed objective.
    const plan = buildDailyEnglishPlan({
      store: createEmptyKidBoxStore(),
      knowledge: knowledgeFor({ 'EN-VOCAB-RECOGNITION': { attempts: 6, correct: 6 } }),
      ageYears: 7,
      isFatigued: false,
    });
    const titles = plan.items.map((i) => i.title).join(' | ');
    expect(titles.toLowerCase()).not.toContain('tốc độ');
    expect(profile.nextBestFocus).toBe('VOCABULARY_RECALL');
  });

  it('only marks a strand secure with enough evidence (§23)', () => {
    const fewAttempts = analyseEnglishProfile(
      knowledgeFor({ 'EN-VOCAB-RECOGNITION': { attempts: 1, correct: 1 } })
    );
    expect(fewAttempts.strands.VOCABULARY.status).not.toBe('SECURE');

    const enough = analyseEnglishProfile(
      knowledgeFor({ 'EN-VOCAB-RECOGNITION': { attempts: 6, correct: 6 } })
    );
    expect(enough.strands.VOCABULARY.status).toBe('SECURE');
  });
});

describe("Kid's Box Companion — daily plan, progression and reviews (§9, §19, §25)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the daily plan inside the screen-time budget (§19)', () => {
    for (const ageYears of [6, 7, 8]) {
      const plan = buildDailyEnglishPlan({
        store: createEmptyKidBoxStore(),
        knowledge: {},
        ageYears,
        isFatigued: false,
      });
      expect(plan.estimatedMinutes).toBeGreaterThanOrEqual(0);
      expect(plan.estimatedMinutes).toBeLessThanOrEqual(KIDBOX_POLICY.MAX_DAILY_MINUTES);
      expect(plan.items.every((i) => i.activityId !== null)).toBe(true);
    }
  });

  it('drops listening, speaking and the game when the child is fatigued', () => {
    const rested = buildDailyEnglishPlan({
      store: createEmptyKidBoxStore(),
      knowledge: {},
      ageYears: 7,
      isFatigued: false,
    });
    const tired = buildDailyEnglishPlan({
      store: createEmptyKidBoxStore(),
      knowledge: {},
      ageYears: 7,
      isFatigued: true,
    });

    expect(tired.factors.fatigueAdjusted).toBe(true);
    expect(tired.items.length).toBeLessThan(rested.items.length);
    expect(tired.items.some((i) => i.focus.startsWith('LISTENING'))).toBe(false);
    expect(tired.items.some((i) => i.focus.startsWith('SPEAKING'))).toBe(false);
  });

  it('marks steps DONE only from real evidence and never locks a step (§22)', () => {
    const store = createEmptyKidBoxStore();
    const steps = getStepProgress(store, unit);
    expect(steps).toHaveLength(9);
    expect(steps.every((s) => s.progress.status === 'AVAILABLE')).toBe(true);

    playActivity('LISTEN_AND_CHOOSE', true, 'step-1');
    const after = getStepProgress(KidBoxStore.get(), unit);
    const hear = after.find((s) => s.step === 'HEAR')!;
    expect(hear.progress.status).toBe('DONE');
    expect(hear.progress.evidenceCount).toBeGreaterThan(0);
    // Nothing is ever locked.
    expect(after.some((s) => s.progress.status === 'LOCKED')).toBe(false);
  });

  it('prioritises review by correctness, recency and forgetting risk (§25)', () => {
    const now = Date.now();
    const struggling = computeReviewPriority(
      { attempts: 6, correctCount: 2, consecutiveCorrect: 0, lapses: 2, lastPracticedAt: now - 10 * 86400000, difficulty: 3 },
      now
    );
    const strong = computeReviewPriority(
      { attempts: 10, correctCount: 10, consecutiveCorrect: 5, lapses: 0, lastPracticedAt: now - 3600000, difficulty: 1 },
      now
    );
    expect(struggling.priority).toBeGreaterThan(strong.priority);
    expect(struggling.reason).toContain('quên');
    expect(strong.reason).toContain('giãn cách');
  });

  it('never wipes progress after one wrong answer (§25)', () => {
    const store = createEmptyKidBoxStore();
    const speak = activities.find((a) => a.mode === 'SPEAK')!;
    const target = speak.items.find((i) => i.isCorrect)!;

    submitActivityResponse({
      activity: speak,
      response: { type: 'SPEAK', itemId: target.id, recognitionSupported: true, transcript: target.speakText },
      responseKey: 'ok-1',
      startedAt: Date.now(),
      childProfileId: 'child_1',
    });
    const afterCorrect = KidBoxStore.get().reviewStates[speak.skillId];
    expect(afterCorrect.consecutiveCorrect).toBe(1);

    submitActivityResponse({
      activity: speak,
      response: { type: 'SPEAK', itemId: target.id, recognitionSupported: true, transcript: 'wrong words' },
      responseKey: 'miss-1',
      startedAt: Date.now(),
      childProfileId: 'child_1',
    });
    const afterMiss = KidBoxStore.get().reviewStates[speak.skillId];
    // correctCount survives; only the streak and the interval change.
    expect(afterMiss.correctCount).toBe(afterCorrect.correctCount);
    expect(afterMiss.consecutiveCorrect).toBe(0);
    expect(afterMiss.lapses).toBe(1);
    expect(afterMiss.nextReviewAt).toBeLessThan(afterCorrect.nextReviewAt!);
  });

  it('builds a review queue once something is genuinely due or shaky', () => {
    // A single fresh correct answer is neither due nor shaky, so nothing queues.
    playActivity('LISTEN_AND_CHOOSE', true, 'queue-1');
    expect(buildReviewQueue(KidBoxStore.get())).toEqual([]);

    // Repeated misses make the item due for review (§25).
    for (let i = 0; i < 3; i += 1) {
      playActivity('LISTEN_AND_CHOOSE', false, `queue-miss-${i}`);
    }
    const queue = buildReviewQueue(KidBoxStore.get());
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.every((c) => c.skillId.startsWith('EN-'))).toBe(true);
    expect(queue[0].priority).toBeGreaterThanOrEqual(queue[queue.length - 1].priority);
  });

  it('reports the current unit and its content gaps honestly', () => {
    const store = createEmptyKidBoxStore();
    expect(getCurrentUnit(store).id).toBe(KIDBOX_BRIDGE_UNIT_ID);
    expect(getStepsMissingContent(unit)).toEqual([]);
  });
});

describe("Kid's Box Companion — parent reporting (§23, §24)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows zero stars until evidence exists, and never fakes a weak skill', () => {
    const stars = buildSkillStars({});
    expect(stars.every((s) => s.stars === 0)).toBe(true);
    expect(stars.every((s) => s.hasEvidence === false)).toBe(true);
    expect(stars.every((s) => s.label === 'Chưa có dữ liệu')).toBe(true);
  });

  it('awards stars only above the documented attempt and accuracy gates', () => {
    const weak = buildSkillStars(knowledgeFor({ 'EN-VOCAB-RECOGNITION': { attempts: 10, correct: 4 } }));
    const weakStar = weak.find((s) => s.skillId === 'EN-VOCAB-RECOGNITION')!;
    expect(weakStar.stars).toBe(0);
    expect(weakStar.label).toBe('Cần luyện thêm');

    const good = buildSkillStars(knowledgeFor({ 'EN-VOCAB-RECOGNITION': { attempts: 10, correct: 10 } }));
    const goodStar = good.find((s) => s.skillId === 'EN-VOCAB-RECOGNITION')!;
    expect(goodStar.stars).toBeGreaterThanOrEqual(3);
    expect(goodStar.hasEvidence).toBe(true);
  });

  it('builds a weekly report from real counters with no comparison to other children', () => {
    playActivity('LISTEN_AND_CHOOSE', true, 'weekly-1');
    playActivity('RECOGNITION', true, 'weekly-2');
    const store = KidBoxStore.get();

    const report = buildWeeklyReport({ store, knowledge: getKnowledgeSnapshot() });
    expect(report.listeningSessions).toBeGreaterThan(0);
    expect(report.wordsPractised).toBeGreaterThan(0);
    expect(report.daysPractised).toBeGreaterThan(0);
    expect(report.notes.join(' ')).toContain('không so với bạn khác');
    expect(report.currentUnitLabel.length).toBeGreaterThan(0);

    const empty = buildWeeklyReport({ store: createEmptyKidBoxStore(), knowledge: {} });
    expect(empty.wordsPractised).toBe(0);
    expect(empty.notes[0]).toContain('chưa luyện tiếng Anh');
  });

  it('keeps every star row tied to a real skill in the taxonomy', () => {
    const stars = buildSkillStars(getKnowledgeSnapshot());
    const knowledge = getKnowledgeSnapshot();
    for (const star of stars) {
      expect(star.skillId.startsWith('EN-')).toBe(true);
      if (star.hasEvidence) {
        expect(knowledge[star.skillId].attempts).toBeGreaterThan(0);
      }
    }
  });
});

describe("Kid's Box Companion — persistence (§29, §30)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and reloads progress across a full store round-trip', () => {
    playActivity('LISTEN_AND_CHOOSE', true, 'persist-1');
    KidBoxStore.setCourseState({ currentUnitId: KIDBOX_BRIDGE_UNIT_ID, centerHomework: 'Nghe lại Unit 1' });

    const reloaded = KidBoxStore.get();
    expect(reloaded.courseState.centerHomework).toBe('Nghe lại Unit 1');
    expect(Object.keys(reloaded.unitProgress).length).toBeGreaterThan(0);
    expect(reloaded.attempts.length).toBeGreaterThan(0);
    expect(reloaded.counters.days[Object.keys(reloaded.counters.days)[0]]).toBeDefined();
  });

  it('survives a corrupted payload without throwing', () => {
    localStorage.setItem(KIDBOX_STORE_KEY, '{not json at all');
    expect(() => KidBoxStore.get()).not.toThrow();
    expect(KidBoxStore.get().attempts).toEqual([]);

    localStorage.setItem(KIDBOX_STORE_KEY, JSON.stringify({ courseState: 'nope', attempts: 42, counters: 7 }));
    const store = KidBoxStore.get();
    expect(store.courseState.currentUnitId).toBe(KIDBOX_BRIDGE_UNIT_ID);
    expect(store.attempts).toEqual([]);
  });

  it('rejects unknown skills, unknown steps and impossible counts while sanitising', () => {
    const hostile = sanitiseKidBoxStore({
      schemaVersion: 'kidbox-store-v99',
      courseState: { courseId: 'x', levelId: 'LEVEL_9', currentUnitId: '', currentLessonId: 42 },
      reviewStates: {
        good: { skillId: 'EN-VOCAB-RECOGNITION', attempts: 5, correctCount: 99, consecutiveCorrect: 99 },
        bad: { skillId: 'MADE-UP-SKILL', attempts: 3 },
      },
      attempts: [
        { attemptId: 'a1', step: 'HEAR', skillId: 'EN-VOCAB-LISTENING', outcome: 'CORRECT', at: Date.now() },
        { attemptId: 'a1', step: 'HEAR', skillId: 'EN-VOCAB-LISTENING', outcome: 'CORRECT', at: Date.now() },
        { attemptId: 'a2', step: 'NOT_A_STEP', skillId: 'EN-VOCAB-LISTENING', outcome: 'CORRECT', at: Date.now() },
      ],
      speakingAttempts: [
        { attemptId: 's1', skillId: 'EN-SPEAKING-REPEAT', method: 'SPEECH_RECOGNITION_MATCH', pronunciationScored: true },
      ],
      counters: { days: { '2026-01-01': { wordsPractised: 'lots' } } },
    });

    expect(hostile.reviewStates.good.correctCount).toBeLessThanOrEqual(hostile.reviewStates.good.attempts);
    expect(hostile.reviewStates.bad).toBeUndefined();
    // Duplicate attempt ids collapse, invalid steps drop out.
    expect(hostile.attempts.map((a) => a.attemptId)).toEqual(['a1']);
    // §14 — a stored pronunciation score is never accepted.
    expect(hostile.speakingAttempts[0].pronunciationScored).toBe(false);
    expect(hostile.counters.days['2026-01-01'].wordsPractised).toBe(0);
  });

  it('is wiped by the app-wide progress reset', () => {
    playActivity('LISTEN_AND_CHOOSE', true, 'reset-1');
    expect(KidBoxStore.get().attempts.length).toBeGreaterThan(0);
    StorageService.resetProgress();
    expect(KidBoxStore.get().attempts).toEqual([]);
  });
});

describe("Kid's Box Companion — Learning OS integration stays compatible (§1)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the original Learning OS behaviour when no track action is supplied', () => {
    const states: Record<string, KnowledgeState> = {
      demo: LearningOS.createInitialKnowledgeState('demo', 'Demo', 'toan'),
    };
    states.demo.attemptCount = 6;
    states.demo.correctCount = 5;
    states.demo.recentAccuracy = 85;
    states.demo.accuracy = 83;
    states.demo.mastery = 82;
    states.demo.status = 'PRACTICING';

    const actions = LearningOS.getNextBestActions(states, undefined, Date.now(), []);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every((a) => a.trackId === undefined)).toBe(true);
  });

  it('keeps the daily plan generator working for the other tracks', () => {
    const plan = LearningOS.generateDailyPlan({}, '2026-01-01', undefined, 'test-policy', []);
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.generatedFrom.policyVersion).toBe('test-policy');
  });
});
