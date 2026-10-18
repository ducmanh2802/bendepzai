import {
  KIDBOX_PROGRESSION_STEPS,
  KidBoxAttemptOutcome,
  KidBoxAttemptRecord,
  KidBoxDayCounters,
  KidBoxProgressionStep,
  KidBoxProgressStore,
  KidBoxReviewState,
  KidBoxSpeakingAttempt,
  KidBoxStepProgress,
  KidBoxUnitProgress,
} from '../types/kidBox';
import { isKidBoxSkillId } from '../data/kidBoxTaxonomy';
import { KIDBOX_BRIDGE_UNIT_ID, KIDBOX_COURSE_ID, KIDBOX_LEVEL_ID } from '../data/kidBoxCurriculum';
import { KIDBOX_POLICY } from '../config/policy';
import { readJSONObject, writeJSON } from './storage';
import { localDateKey } from './dateUtils';

/**
 * §29 PERSISTENCE for the Kid's Box Companion track.
 *
 * Survives reload, browser restart and schema migration:
 *   - current course / unit / lesson (parent controlled, §21)
 *   - per-unit step progress (§9 progression)
 *   - per-item review state for vocabulary + language patterns (§25)
 *   - attempt history and speaking attempts (§13)
 *   - day counters powering the weekly report (§24)
 *
 * The store is a *sibling* of the Learning OS store, never a fork: skill-level
 * mastery stays in the Learning OS, while this store holds only the item-level
 * index the companion needs. It reuses the app's hardened localStorage helpers
 * and never throws.
 */

export const KIDBOX_STORE_KEY = 'kho_bau_kidbox_store';
export const KIDBOX_STORE_SCHEMA_VERSION = 'kidbox-store-v1';
export const DAY_MS = 86400000;

export function todayISO(now: number = Date.now()): string {
  return localDateKey(new Date(now));
}

export function emptyDayCounters(): KidBoxDayCounters {
  return {
    wordsPractised: 0,
    listeningSessions: 0,
    speakingAttempts: 0,
    readingPractised: 0,
    reviewItems: 0,
    phonicsPractised: 0,
    patternPractised: 0,
  };
}

export function createEmptyUnitProgress(unitId: string): KidBoxUnitProgress {
  const steps = {} as Record<KidBoxProgressionStep, KidBoxStepProgress>;
  for (const step of KIDBOX_PROGRESSION_STEPS) {
    // §22 — nothing is ever blocked: steps open AVAILABLE and only earn DONE
    // from real evidence.
    steps[step] = { step, status: 'AVAILABLE', evidenceCount: 0 };
  }
  return { unitId, steps, activityAttempts: 0 };
}

export function createEmptyKidBoxStore(): KidBoxProgressStore {
  return {
    schemaVersion: KIDBOX_STORE_SCHEMA_VERSION,
    courseState: {
      courseId: KIDBOX_COURSE_ID,
      levelId: KIDBOX_LEVEL_ID,
      // §37 Child D — a new learner starts on the bridge pack, the only content
      // the app can honestly offer until a teacher source is mapped.
      currentUnitId: KIDBOX_BRIDGE_UNIT_ID,
      currentLessonId: null,
    },
    unitProgress: {},
    reviewStates: {},
    attempts: [],
    speakingAttempts: [],
    counters: { days: {} },
  };
}

/* ------------------------------------------------------------------ */
/* SANITISING (§30 — corruption must never break the app)              */
/* ------------------------------------------------------------------ */

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function safeCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

function safeTimestamp(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function safePercent(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.min(100, Math.max(0, Math.round(value)));
}

const ATTEMPT_OUTCOMES: readonly KidBoxAttemptOutcome[] = [
  'CORRECT',
  'INCORRECT',
  'RECOGNITION_MATCH',
  'SELF_CHECKED',
  'SKIPPED',
];

function sanitiseReviewState(raw: unknown, fallbackId: string): KidBoxReviewState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  const skillId = safeString(v.skillId);
  if (!isKidBoxSkillId(skillId)) return null;

  const attempts = safeCount(v.attempts);
  const correctCount = Math.min(safeCount(v.correctCount), attempts);

  return {
    itemId: safeString(v.itemId, fallbackId) || fallbackId,
    skillId,
    unitId: safeString(v.unitId),
    attempts,
    correctCount,
    consecutiveCorrect: Math.min(safeCount(v.consecutiveCorrect), correctCount),
    lapses: safeCount(v.lapses),
    lastPracticedAt: safeTimestamp(v.lastPracticedAt),
    lastCorrectAt: safeTimestamp(v.lastCorrectAt),
    nextReviewAt: safeTimestamp(v.nextReviewAt),
    difficulty: v.difficulty === 1 || v.difficulty === 2 || v.difficulty === 3 ? v.difficulty : 1,
  };
}

function sanitiseUnitProgress(raw: unknown, unitId: string): KidBoxUnitProgress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  const base = createEmptyUnitProgress(unitId);
  const rawSteps =
    v.steps && typeof v.steps === 'object' && !Array.isArray(v.steps) ? (v.steps as Record<string, unknown>) : {};

  for (const step of KIDBOX_PROGRESSION_STEPS) {
    const stepRaw = rawSteps[step];
    if (!stepRaw || typeof stepRaw !== 'object' || Array.isArray(stepRaw)) continue;
    const s = stepRaw as Record<string, unknown>;
    const status = s.status;
    base.steps[step] = {
      step,
      status:
        status === 'LOCKED' || status === 'AVAILABLE' || status === 'IN_PROGRESS' || status === 'DONE'
          ? status
          : 'AVAILABLE',
      evidenceCount: safeCount(s.evidenceCount),
      lastPracticedAt: safeTimestamp(s.lastPracticedAt),
      bestAccuracy: safePercent(s.bestAccuracy),
    };
  }

  base.activityAttempts = safeCount(v.activityAttempts);
  base.lastPracticedAt = safeTimestamp(v.lastPracticedAt);
  base.checkAccuracy = safePercent(v.checkAccuracy);
  return base;
}

function sanitiseAttempt(raw: unknown): KidBoxAttemptRecord | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  const step = safeString(v.step) as KidBoxProgressionStep;
  const skillId = safeString(v.skillId);
  const attemptId = safeString(v.attemptId);
  if (attemptId.length === 0) return null;
  if (!KIDBOX_PROGRESSION_STEPS.includes(step) || !isKidBoxSkillId(skillId)) return null;

  return {
    attemptId,
    activityId: safeString(v.activityId),
    unitId: safeString(v.unitId),
    step,
    skillId,
    outcome: ATTEMPT_OUTCOMES.includes(v.outcome as KidBoxAttemptOutcome)
      ? (v.outcome as KidBoxAttemptOutcome)
      : 'SKIPPED',
    responseTimeMs: safeTimestamp(v.responseTimeMs),
    at: safeTimestamp(v.at) ?? 0,
    usedReplay: v.usedReplay === true,
    speechRecognitionUsed: v.speechRecognitionUsed === true,
  };
}

function sanitiseSpeakingAttempt(raw: unknown): KidBoxSpeakingAttempt | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  const skillId = safeString(v.skillId);
  const attemptId = safeString(v.attemptId);
  if (attemptId.length === 0 || !isKidBoxSkillId(skillId)) return null;

  return {
    attemptId,
    activityId: safeString(v.activityId),
    unitId: safeString(v.unitId),
    skillId,
    at: safeTimestamp(v.at) ?? 0,
    mode: v.mode === 'QUESTION_ANSWER' || v.mode === 'GUIDED' ? v.mode : 'REPEAT',
    method: v.method === 'SPEECH_RECOGNITION_MATCH' || v.method === 'PARENT_ASSISTED' ? v.method : 'SELF_CHECK',
    transcript: typeof v.transcript === 'string' ? v.transcript : undefined,
    matchedTarget: typeof v.matchedTarget === 'boolean' ? v.matchedTarget : null,
    // §14 — a pronunciation score is never accepted from storage.
    pronunciationScored: false,
  };
}

function sanitiseDayCounters(raw: unknown): KidBoxDayCounters {
  const base = emptyDayCounters();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const v = raw as Record<string, unknown>;
  return {
    wordsPractised: safeCount(v.wordsPractised),
    listeningSessions: safeCount(v.listeningSessions),
    speakingAttempts: safeCount(v.speakingAttempts),
    readingPractised: safeCount(v.readingPractised),
    reviewItems: safeCount(v.reviewItems),
    phonicsPractised: safeCount(v.phonicsPractised),
    patternPractised: safeCount(v.patternPractised),
  };
}

/** De-duplicates by id so a replayed save can never double-count (§30). */
function dedupeById<T extends { attemptId: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((entry) => {
    if (seen.has(entry.attemptId)) return false;
    seen.add(entry.attemptId);
    return true;
  });
}

/** Rebuilds a fully valid store from any (possibly hostile) payload. */
export function sanitiseKidBoxStore(raw: Record<string, unknown> | undefined): KidBoxProgressStore {
  const store = createEmptyKidBoxStore();
  if (!raw) return store;

  const courseStateRaw = raw.courseState;
  if (courseStateRaw && typeof courseStateRaw === 'object' && !Array.isArray(courseStateRaw)) {
    const c = courseStateRaw as Record<string, unknown>;
    const centerHomework = safeString(c.centerHomework).trim();
    const currentWeekLabel = safeString(c.currentWeekLabel).trim();
    store.courseState = {
      courseId: safeString(c.courseId, KIDBOX_COURSE_ID),
      // Only one level exists today; anything else falls back to it instead of
      // letting an unknown level break the UI.
      levelId: KIDBOX_LEVEL_ID,
      currentUnitId: safeString(c.currentUnitId) || null,
      currentLessonId: safeString(c.currentLessonId) || null,
      centerHomework: centerHomework.length > 0 ? centerHomework : undefined,
      currentWeekLabel: currentWeekLabel.length > 0 ? currentWeekLabel : undefined,
    };
  }

  if (raw.unitProgress && typeof raw.unitProgress === 'object' && !Array.isArray(raw.unitProgress)) {
    for (const [unitId, value] of Object.entries(raw.unitProgress as Record<string, unknown>)) {
      const progress = sanitiseUnitProgress(value, unitId);
      if (progress) store.unitProgress[unitId] = progress;
    }
  }

  if (raw.reviewStates && typeof raw.reviewStates === 'object' && !Array.isArray(raw.reviewStates)) {
    for (const [itemId, value] of Object.entries(raw.reviewStates as Record<string, unknown>)) {
      const state = sanitiseReviewState(value, itemId);
      if (state) store.reviewStates[itemId] = state;
    }
  }

  if (Array.isArray(raw.attempts)) {
    store.attempts = dedupeById(
      (raw.attempts as unknown[])
        .map(sanitiseAttempt)
        .filter((a): a is KidBoxAttemptRecord => a !== null)
    ).slice(0, KIDBOX_POLICY.MAX_RECENT_ATTEMPTS);
  }

  if (Array.isArray(raw.speakingAttempts)) {
    store.speakingAttempts = dedupeById(
      (raw.speakingAttempts as unknown[])
        .map(sanitiseSpeakingAttempt)
        .filter((a): a is KidBoxSpeakingAttempt => a !== null)
    ).slice(0, KIDBOX_POLICY.MAX_RECENT_ATTEMPTS);
  }

  if (raw.counters && typeof raw.counters === 'object' && !Array.isArray(raw.counters)) {
    const days = (raw.counters as Record<string, unknown>).days;
    if (days && typeof days === 'object' && !Array.isArray(days)) {
      const kept: Record<string, KidBoxDayCounters> = {};
      const entries = Object.entries(days as Record<string, unknown>).sort(([a], [b]) => b.localeCompare(a));
      for (const [date, value] of entries.slice(0, KIDBOX_POLICY.MAX_WEEKLY_DAYS)) {
        kept[date] = sanitiseDayCounters(value);
      }
      store.counters = { days: kept };
    }
  }

  store.lastPractisedAt = safeTimestamp(raw.lastPractisedAt);
  return store;
}

/* ------------------------------------------------------------------ */
/* PUBLIC API                                                           */
/* ------------------------------------------------------------------ */

export const KidBoxStore = {
  /** Loads the store, degrading gracefully on any corruption. */
  get(): KidBoxProgressStore {
    return sanitiseKidBoxStore(readJSONObject(KIDBOX_STORE_KEY));
  },

  /** Trims before writing so localStorage can never grow unbounded (§34). */
  save(store: KidBoxProgressStore): void {
    writeJSON(KIDBOX_STORE_KEY, {
      ...store,
      attempts: store.attempts.slice(0, KIDBOX_POLICY.MAX_RECENT_ATTEMPTS),
      speakingAttempts: store.speakingAttempts.slice(0, KIDBOX_POLICY.MAX_RECENT_ATTEMPTS),
      reviewStates: Object.fromEntries(
        Object.entries(store.reviewStates).slice(0, KIDBOX_POLICY.MAX_REVIEW_STATES)
      ),
    });
  },

  /** §21 CURRENT UNIT — parent-controlled course / unit / lesson selection. */
  setCourseState(patch: Partial<KidBoxProgressStore['courseState']>): KidBoxProgressStore {
    const store = KidBoxStore.get();
    store.courseState = { ...store.courseState, ...patch };
    KidBoxStore.save(store);
    return store;
  },

  getUnitProgress(unitId: string): KidBoxUnitProgress {
    return KidBoxStore.get().unitProgress[unitId] ?? createEmptyUnitProgress(unitId);
  },

  /**
   * Records one attempt: step progress + review state + day counters.
   * Idempotent by `attemptId`, so a double click, a refresh or a back
   * navigation can never inflate progress (§30 reward idempotency).
   */
  recordAttempt(attempt: KidBoxAttemptRecord): boolean {
    const store = KidBoxStore.get();
    if (store.attempts.some((a) => a.attemptId === attempt.attemptId)) return false;

    const isCorrect = attempt.outcome === 'CORRECT' || attempt.outcome === 'RECOGNITION_MATCH';

    store.attempts.unshift(attempt);

    const progress = store.unitProgress[attempt.unitId] ?? createEmptyUnitProgress(attempt.unitId);
    const step = progress.steps[attempt.step];
    step.evidenceCount += 1;
    step.status = 'DONE';
    step.lastPracticedAt = attempt.at;
    if (isCorrect) step.bestAccuracy = Math.min(100, (step.bestAccuracy ?? 0) + 25);
    progress.activityAttempts += 1;
    progress.lastPracticedAt = attempt.at;
    // §17 — a game score is never mastery: only the CHECK step sets this, and
    // only from answered items.
    if (attempt.step === 'CHECK' && isCorrect) {
      progress.checkAccuracy = Math.min(100, (progress.checkAccuracy ?? 0) + 20);
    }
    store.unitProgress[attempt.unitId] = progress;

    KidBoxStore.applyReviewOutcome(store, attempt);
    KidBoxStore.bumpCounters(store, attempt);
    store.lastPractisedAt = attempt.at;

    KidBoxStore.save(store);
    return true;
  },

  /**
   * §25 SPACED REPETITION — one wrong answer never wipes progress. A miss adds
   * a lapse and shortens the next interval; `correctCount` is never reset.
   */
  applyReviewOutcome(store: KidBoxProgressStore, attempt: KidBoxAttemptRecord): KidBoxReviewState {
    const existing = store.reviewStates[attempt.skillId];
    const state: KidBoxReviewState = existing
      ? { ...existing }
      : {
          itemId: attempt.skillId,
          skillId: attempt.skillId,
          unitId: attempt.unitId,
          attempts: 0,
          correctCount: 0,
          consecutiveCorrect: 0,
          lapses: 0,
          difficulty: 1,
        };

    state.attempts += 1;
    state.lastPracticedAt = attempt.at;

    if (attempt.outcome === 'CORRECT' || attempt.outcome === 'RECOGNITION_MATCH') {
      state.correctCount += 1;
      state.consecutiveCorrect += 1;
      state.lastCorrectAt = attempt.at;
    } else if (attempt.outcome === 'INCORRECT') {
      state.consecutiveCorrect = 0;
      state.lapses += 1;
    }

    const index = Math.min(state.consecutiveCorrect, KIDBOX_POLICY.REVIEW_INTERVAL_DAYS.length - 1);
    const baseDays = KIDBOX_POLICY.REVIEW_INTERVAL_DAYS[index];
    // Forgetting risk shortens the gap without discarding earned progress.
    const lapseFactor = 1 / (1 + state.lapses * KIDBOX_POLICY.REVIEW_LAPSE_WEIGHT * 10);
    state.nextReviewAt = attempt.at + Math.round(baseDays * DAY_MS * lapseFactor);

    store.reviewStates[attempt.skillId] = state;
    return state;
  },

  /** Day counters behind the weekly report (§24). */
  bumpCounters(store: KidBoxProgressStore, attempt: KidBoxAttemptRecord): KidBoxDayCounters {
    const day = todayISO(attempt.at);
    const counters = store.counters.days[day] ?? emptyDayCounters();

    if (attempt.step === 'HEAR') counters.listeningSessions += 1;
    if (attempt.step === 'REPEAT' || attempt.step === 'USE') counters.speakingAttempts += 1;
    if (attempt.step === 'REVIEW') counters.reviewItems += 1;
    if (attempt.skillId.startsWith('EN-PHONICS')) counters.phonicsPractised += 1;
    if (attempt.skillId.startsWith('EN-READING')) counters.readingPractised += 1;
    if (attempt.skillId.startsWith('EN-VOCAB')) counters.wordsPractised += 1;
    if (attempt.skillId.startsWith('EN-LANGUAGE') || attempt.skillId.startsWith('EN-GRAMMAR')) {
      counters.patternPractised += 1;
    }

    store.counters.days[day] = counters;

    const dates = Object.keys(store.counters.days).sort((a, b) => b.localeCompare(a));
    for (const old of dates.slice(KIDBOX_POLICY.MAX_WEEKLY_DAYS)) delete store.counters.days[old];
    return counters;
  },

  /** Records a speaking attempt with its honest method label (§14). */
  recordSpeakingAttempt(attempt: KidBoxSpeakingAttempt): boolean {
    const store = KidBoxStore.get();
    if (store.speakingAttempts.some((a) => a.attemptId === attempt.attemptId)) return false;
    store.speakingAttempts.unshift(attempt);
    KidBoxStore.save(store);
    return true;
  },

  /** Removes the whole Kid's Box store (used by the parent data reset). */
  clear(): void {
    writeJSON(KIDBOX_STORE_KEY, createEmptyKidBoxStore());
  },
};
