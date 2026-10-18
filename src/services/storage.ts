import {
  Achievement,
  AvatarItem,
  ChildProfile,
  CompetitionHistoryStore,
  DailyPlan,
  DailyQuest,
  GameLevelProgress,
  GameProgressStore,
  KnowledgeState,
  LearningAnalytics,
  LearningEvidence,
  LearningOSStore,
  MasteryStatus,
  MotivationDaily,
  MotivationState,
  MotivationStats,
  ParentSettings,
  QuestEvent,
  RewardHistoryEntry,
  SessionFatigueState,
  SessionProfileKind,
  SkillMastery,
  SubjectType,
} from '../types';
import { getAllSkills, getTopicsBySubject } from '../data/curriculum';
import { GAMES_CATALOG } from '../data/gamesCatalog';
import { SHOP_MAP } from '../data/shopCatalog';
import { ACHIEVEMENT_CATALOG } from '../data/achievementCatalog';
import { QUEST_MAP } from '../data/questPool';
import { STICKER_MAP } from '../data/stickers';
import { xpToLevel, pendingLevels, rewardForLevel, levelProgress, levelTitle } from './levelEngine';
import { drawSticker, completedSetsCount, ownedStickersCount } from './stickerEngine';
import type { RandomFn } from './stickerEngine';
import { selectDailyQuests, applyQuestEvent } from './questEngine';
import { weekKeyOf } from './streakEngine';
import { evaluateNewAchievements, xpForUnlocks } from './achievementEngine';
import { canBuyShopItem } from './shopEngine';
import { localDateKey, diffDateKeys, parseDateKey } from './dateUtils';
import { LearningOS, LEARNING_OS_POLICY, resetStaleFatigue } from './learningOS';
// T02C — storage (first-load chunk) must NOT import CompetitionEngine,
// ReadingEngine or the competition/reading banks. The demo seeder lives in
// `./demoSeed` and the default reading profile in `./readingDefaults`.
import { createEmptyReadingProfile } from './readingDefaults';
import {
  ADAPTIVE_DIFFICULTY_POLICY,
  GAME_LEVEL_POLICY,
  LEGACY_MASTERY_POLICY,
  READING_POLICY,
  SESSION_PROFILE_POLICY,
} from '../config/policy';
import type {
  AdaptiveLevel,
  EvidenceDifficulty,
  SessionState,
} from '../types/learningOS';
import type { CompetitionExamResult, ErrorCategory } from '../types/competition';
import type { ReadingMetrics, ReadingParentRating, ReadingProfile, ReadingSkillState, ReadingStage, ReadingStageState } from '../types/reading';

const STORAGE_KEYS = {
  CHILD_PROFILE: 'kho_bau_child_profile',
  ANALYTICS: 'kho_bau_analytics',
  PARENT_SETTINGS: 'kho_bau_parent_settings',
  DAILY_QUESTS: 'kho_bau_daily_quests',
  ACHIEVEMENTS: 'kho_bau_achievements',
  COMPETITION_HISTORY: 'kho_bau_competition_history',
  LEARNING_OS_STORE: 'kho_bau_learning_os_store',
  READING_STORE: 'kho_bau_reading_store',
  KIDBOX_STORE: 'kho_bau_kidbox_store',
  ENGLISH_MASTERY_STORE: 'kho_bau_english_mastery_store',
  GAME_PROGRESS: 'kho_bau_game_progress',
  REVIEW_DAYS: 'kho_bau_review_days',
  GAME_NONCE: 'kho_bau_game_nonce',
  // T08 — ngày bé thấy mỗi trò chơi lần đầu (YYYY-MM-DD giờ máy).
  GAME_FIRST_SEEN: 'kho_bau_game_first_seen',
  // T01B/10 — ngày tưới cây gần nhất (YYYY-MM-DD giờ máy). Key mới hoàn toàn
  // nên không cần migration; giá trị lạ được sanitizer loại bỏ, tiến độ cũ giữ nguyên.
  TREE_WATER: 'kho_bau_tree_water',
  // T18A — kho động lực (sticker, khiên, số liệu ngày...). Key mới hoàn toàn
  // nên payload cũ không cần migration; sanitizer dựng lại từ mặc định.
  MOTIVATION: 'kho_bau_motivation',
};

/**
 * Versioned persistence schema for every localStorage-backed store.
 * Bumping a version requires a matching migration entry in MIGRATIONS below.
 *
 * P30-v1 adds the Kid's Box Companion store. It lives in its own localStorage
 * key, so P29-v2 payloads keep working untouched — the migration only records
 * that the child has no Kid's Box course state yet.
 *
 * P41-v1 (Adaptive Learning Upgrade) adds:
 *  - `sessionState` — the resumable practice session (profile, question ids,
 *    progress, pause flag) inside the Learning OS store.
 *  - expanded `KnowledgeState` adaptive fields (per-skill level, independence
 *    counters, misconception map, retention evidence). Missing fields on older
 *    payloads are backfilled by the sanitizer, so no learning history is reset.
 */
export const STORAGE_SCHEMA_VERSION = 'P42-v3';

/** Schema version for the game-progress store (separate key from the Learning OS). */
export const GAME_PROGRESS_SCHEMA_VERSION = 1;

/**
 * Ordered migration chain. Key = target schema version, value = upgrade function.
 * Each migration must be pure, defensive and idempotent (safe to re-run).
 */
const MIGRATIONS: Record<string, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  // P28-v1 stores had no `processedEvidenceIds`; rebuild the guard list from
  // the surviving evidence so historical events stay idempotent after upgrade.
  'P29-v2': (raw) => {
    const evidences = Array.isArray(raw.recentEvidences) ? (raw.recentEvidences as LearningEvidence[]) : [];
    return {
      ...raw,
      processedEvidenceIds: Array.isArray(raw.processedEvidenceIds)
        ? raw.processedEvidenceIds
        : evidences.map((e) => (e && typeof e.id === 'string' ? e.id : '')).filter(Boolean),
    };
  },
  // Kid's Box Companion state arrives in a separate key, so this step only has
  // to guarantee the Learning OS payload stays structurally valid.
  'P30-v1': (raw) => ({ ...raw }),
  // Adaptive Learning Upgrade: a resumable session slot plus the per-skill
  // adaptive fields. Existing states are backfilled by the sanitizer with
  // level 1 and empty counters — historical evidence is never re-scored here,
  // it simply starts accruing adaptive signals from the next answer.
  'P41-v1': (raw) => ({
    ...raw,
    sessionState: raw.sessionState ?? null,
  }),
  // T03A — Night mode setting in ParentSettings. Default false.
  'P42-v1': (raw) => ({ ...raw }),
  // T18A — kho động lực nằm ở key riêng nên Learning OS store không đổi;
  // migration chỉ ghi nhận phiên bản (mặc định do sanitizer dựng lại).
  'P42-v2': (raw) => ({ ...raw }),
  // T19 — thêm bgMusicEnabled vào ParentSettings (key riêng, không cần migrate Learning OS)
  'P42-v3': (raw) => ({ ...raw }),
};

/** Every schema version the app has ever written, oldest first. */
const SCHEMA_HISTORY = ['P28-v1', 'P29-v2', 'P30-v1', 'P41-v1', 'P42-v1', 'P42-v2', 'P42-v3'] as const;

const SESSION_PROFILE_KINDS: SessionProfileKind[] = ['QUICK', 'STANDARD', 'DEEP', 'EXTENDED'];

const MAX_RECENT_EVIDENCES = 200;

function createDefaultFatigue(now: number): SessionFatigueState {
  return {
    sessionStartTime: now,
    questionsAnsweredThisSession: 0,
    sessionErrorsCount: 0,
    consecutiveErrorsInSession: 0,
    isFatigued: false,
  };
}

function createEmptyLearningOSStore(now: number = Date.now()): LearningOSStore {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    knowledgeStates: {},
    recentEvidences: [],
    dailyPlan: null,
    fatigue: createDefaultFatigue(now),
    sessionState: null,
    recommendationHistory: [],
    processedEvidenceIds: [],
  };
}

function clampPercent(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function safeCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

/**
 * Reads an ErrorProfile defensively out of an unknown object.
 */
function sanitizeErrorProfile(source: unknown): KnowledgeState['errorProfile'] {
  const read = (key: string): number => {
    if (!source || typeof source !== 'object') return 0;
    const n = (source as Record<string, unknown>)[key];
    return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  };
  return {
    knowledgeGap: read('knowledgeGap'),
    careless: read('careless'),
    speed: read('speed'),
    misread: read('misread'),
    reasoning: read('reasoning'),
    unclassified: read('unclassified'),
  };
}

/**
 * Reads a `{attempts, correct}` bucket defensively out of an unknown object.
 */
function countPair(source: unknown, key: string): { attempts: number; correct: number } {
  if (!source || typeof source !== 'object') return { attempts: 0, correct: 0 };
  const bucket = (source as Record<string, unknown>)[key];
  if (!bucket || typeof bucket !== 'object') return { attempts: 0, correct: 0 };
  const b = bucket as Record<string, unknown>;
  const safe = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n) : 0);
  return { attempts: safe(b.attempts), correct: Math.min(safe(b.correct), safe(b.attempts)) };
}

/**
 * Reads and JSON-parses a key without ever throwing.
 * Returns `undefined` for missing keys, malformed JSON and non-object payloads.
 * Exported so sibling stores (Kid's Box Companion) reuse the same hardening
 * instead of re-implementing it.
 */
export function readJSONObject(key: string): Record<string, unknown> | undefined {
  try {
    if (typeof localStorage === 'undefined') return undefined;
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Writes a payload without ever throwing (private mode / quota exhaustion).
 * Exported for sibling stores that must survive the same hostile environments.
 */
export function writeJSON(key: string, value: unknown): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the app must keep running from defaults.
  }
}

/**
 * Runs the ordered migration chain until the payload reaches the current schema.
 * An unknown or missing version is treated as the oldest known schema, so a
 * payload written by any past build is upgraded rather than discarded.
 */
function migrateToCurrentSchema(raw: Record<string, unknown>): Record<string, unknown> {
  let payload = { ...raw };
  const from = typeof payload.schemaVersion === 'string' ? payload.schemaVersion : '';
  if (from === STORAGE_SCHEMA_VERSION) return payload;

  const knownIndex = SCHEMA_HISTORY.indexOf(from as (typeof SCHEMA_HISTORY)[number]);
  const startIndex = knownIndex >= 0 ? knownIndex : 0;
  payload.schemaVersion = SCHEMA_HISTORY[startIndex];

  for (let i = startIndex + 1; i < SCHEMA_HISTORY.length; i += 1) {
    const target = SCHEMA_HISTORY[i];
    const migrate = MIGRATIONS[target];
    if (!migrate) continue;
    payload = migrate(payload);
    payload.schemaVersion = target;
  }

  payload.schemaVersion = STORAGE_SCHEMA_VERSION;
  return payload;
}

/**
 * T18A — Shop 43 món (catalog ở `src/data/shopCatalog.ts`).
 * 12 món đầu giữ nguyên id/giá/trạng thái như trước P42 nên đồ bé đã mở
 * không bao giờ mất; chỉ thêm `minLevel` (món cũ mở bán ngay từ level 1–20).
 */
export const AVATAR_SHOP_ITEMS: AvatarItem[] = [...SHOP_MAP.values()].map((i) => ({ ...i }));

/**
 * T18A — 35 thành tựu (catalog ở `src/data/achievementCatalog.ts`).
 * 8 thành tựu đầu giữ nguyên id/tiêu đề/thưởng như trước P42.
 */
export const INITIAL_ACHIEVEMENTS: Achievement[] = ACHIEVEMENT_CATALOG.map(
  ({ rule, ...rest }) => ({ ...rest })
);

const DEFAULT_CHILD_PROFILE: ChildProfile = {
  id: 'child_1',
  name: 'Bé Minh',
  grade: 1,
  avatarBase: 'bear',
  equipped: {
    hat: 'hat_cap',
    glasses: 'glasses_nerd',
    backpack: 'bag_dino',
  },
  xp: 0,
  stars: 0,
  gems: 0,
  tickets: 0,
  streak: 1,
  lastActiveDate: localDateKey(),
  unlockedItems: ['hat_cap', 'glasses_nerd', 'bag_dino'],
  completedLessons: [],
  completedWeeklyChallenges: [],
  dailyChestClaimedDate: undefined,
  lessonStars: {},
  chestState: {},
  unlockAllLessons: false,
  isDemoData: false,
};

const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  dailyLimitMinutes: 20, // 20 minutes safe recommendation for 6-7 y/o
  soundEnabled: true,
  musicEnabled: true,
  voiceEnabled: true,
  difficultyScale: 'normal',
  questionAutoplay: true, // pre-readers need to hear questions; parents can switch off
  defaultSessionProfile: 'STANDARD',
  allowAdvancedQuestions: false,
  reviewIntensity: 'standard',
  optionalBreaks: true,
  nightMode: false,
  maxGachaPerDay: 5,
  rewardsEnabled: true,
  rewardHistory: [],
  // T19 — nhạc nền mặc định TẮT (khác với musicEnabled hiệu ứng âm thanh)
  bgMusicEnabled: false,
};

function getTodayString(): string {
  return localDateKey();
}

/**
 * T14C — strict YYYY-MM-DD check: correct shape AND a real calendar day.
 * The old regex-only check accepted impossible dates like `2026-13-99`,
 * which then poisoned NEW-label and streak math; those are now rejected.
 */
function isRealDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseDateKey(value);
  return parsed !== null && localDateKey(parsed) === value;
}

/**
 * T18A — Môn bé còn yếu nhất xếp trước (độ chính xác thấp nhất trong
 * skillMastery), môn chưa học bao giờ xếp sau, môn giỏi xếp cuối.
 * Engine dùng thứ tự này để "chữa yếu" bằng nhiệm vụ đầu ngày.
 */
function weakestSubjectsForQuests(): SubjectType[] {
  try {
    const analytics = StorageService.getAnalytics();
    const subjects: SubjectType[] = ['tieng-viet', 'toan', 'english', 'cuoc-song'];
    const scored = subjects.map((s) => {
      let attempts = 0;
      let correct = 0;
      for (const m of Object.values(analytics.skillMastery)) {
        if (m.subject === s && m.attempts > 0) {
          attempts += m.attempts;
          correct += m.correctCount;
        }
      }
      return { subject: s, accuracy: attempts > 0 ? correct / attempts : null };
    });
    const weak = scored
      .filter((x) => x.accuracy !== null)
      .sort((a, b) => (a.accuracy as number) - (b.accuracy as number))
      .map((x) => x.subject);
    const untried = scored.filter((x) => x.accuracy === null).map((x) => x.subject);
    return [...weak, ...untried];
  } catch {
    return [];
  }
}

/**
 * T18A — Bộ nhiệm vụ mới mỗi ngày: 3 nhiệm vụ học (ưu tiên môn yếu,
 * tất định theo ngày) + 1 nhiệm vụ vui. 5 id cũ vẫn nằm trong pool
 * nên tiến trình đã lưu của bé không bao giờ mất.
 */
function createDefaultQuests(dateKey: string = getTodayString()): DailyQuest[] {
  return selectDailyQuests(dateKey, weakestSubjectsForQuests());
}

export interface TierRewardReceipt {
  starsAwarded: number;
  xpAwarded: number;
  isFirstClear: boolean;
  isNewBest: boolean;
}

export class StorageService {
  // ==========================================================
  // Learning OS persistence (versioned, migratable, recoverable)
  // ==========================================================

  /**
   * Loads the Learning OS store. Any corruption, partial write or unknown
   * schema degrades to a pristine, fully usable store instead of crashing.
   */
  public static getLearningOSStore(): LearningOSStore {
    const raw = readJSONObject(STORAGE_KEYS.LEARNING_OS_STORE);
    if (!raw) return createEmptyLearningOSStore();
    // P0-2 — opening the app after a break/new day immediately clears a
    // latched fatigue instead of waiting for the next answered question.
    const store = StorageService.sanitizeLearningOSStore(migrateToCurrentSchema(raw));
    store.fatigue = resetStaleFatigue(store.fatigue, Date.now());
    return store;
  }

  public static saveLearningOSStore(store: LearningOSStore) {
    writeJSON(STORAGE_KEYS.LEARNING_OS_STORE, store);
  }

  /**
   * Idempotently folds a LearningEvidence record into the Knowledge State.
   *
   * Returns true when the evidence was newly applied, false when it had
   * already been processed. Callers may therefore retry freely (double click,
   * refresh, back/forward, reopened session) without inflating mastery.
   */
  public static recordLearningEvidence(evidence: LearningEvidence): boolean {
    if (!evidence || typeof evidence.id !== 'string' || evidence.id.length === 0) return false;

    const now = Date.now();
    const store = StorageService.getLearningOSStore();
    if (store.processedEvidenceIds.includes(evidence.id)) return false;

    const skillMeta = getAllSkills().find((s) => s.skillId === evidence.skillId);
    const previous =
      store.knowledgeStates[evidence.skillId] ??
      LearningOS.createInitialKnowledgeState(
        evidence.skillId,
        skillMeta?.skillName || evidence.skillId,
        evidence.subject
      );

    store.knowledgeStates[evidence.skillId] = LearningOS.reduceEvidence(previous, evidence);

    store.recentEvidences.unshift(evidence);
    if (store.recentEvidences.length > MAX_RECENT_EVIDENCES) {
      store.recentEvidences.length = MAX_RECENT_EVIDENCES;
    }

    store.processedEvidenceIds.unshift(evidence.id);
    if (store.processedEvidenceIds.length > MAX_RECENT_EVIDENCES * 2) {
      store.processedEvidenceIds.length = MAX_RECENT_EVIDENCES * 2;
    }

    // Session fatigue tracking (drives the Learning OS rest recommendation).
    // P0-2 — a long inactivity gap or a new local day starts a fresh session,
    // so fatigue resets instead of latching forever.
    store.fatigue = resetStaleFatigue(store.fatigue, now);
    store.fatigue.questionsAnsweredThisSession += 1;
    if (evidence.correct) {
      store.fatigue.consecutiveErrorsInSession = 0;
    } else {
      store.fatigue.sessionErrorsCount += 1;
      store.fatigue.consecutiveErrorsInSession += 1;
    }
    store.fatigue.isFatigued =
      store.fatigue.questionsAnsweredThisSession >= LEARNING_OS_POLICY.FATIGUE_MAX_QUESTIONS ||
      store.fatigue.consecutiveErrorsInSession >= LEARNING_OS_POLICY.FATIGUE_MAX_CONSECUTIVE_ERRORS;
    // Keep the anchor on the latest activity so the gap measures inactivity,
    // not total session age.
    store.fatigue.sessionStartTime = now;

    StorageService.saveLearningOSStore(store);
    return true;
  }

  /** Convenience accessor used by the UI and parent reports. */
  public static getKnowledgeStates(): Record<string, KnowledgeState> {
    return StorageService.getLearningOSStore().knowledgeStates;
  }

  /** Regenerates and persists today's plan from current evidence. */
  public static refreshDailyPlan(dateString: string = getTodayString()): DailyPlan {
    const store = StorageService.getLearningOSStore();
    const plan = LearningOS.generateDailyPlan(
      store.knowledgeStates,
      dateString,
      store.fatigue,
      LEARNING_OS_POLICY.POLICY_VERSION
    );
    store.dailyPlan = plan;
    StorageService.saveLearningOSStore(store);
    return plan;
  }

  // ==========================================================
  // Reading fluency persistence
  // ==========================================================

  /** Loads the reading fluency profile, defaulting to a pristine ladder. */
  public static getReadingProfile(): ReadingProfile {
    const raw = readJSONObject(STORAGE_KEYS.READING_STORE);
    if (!raw) return createEmptyReadingProfile();
    return StorageService.sanitizeReadingProfile(raw);
  }

  public static saveReadingProfile(profile: ReadingProfile) {
    const existing = readJSONObject(STORAGE_KEYS.READING_STORE);
    writeJSON(STORAGE_KEYS.READING_STORE, {
      ...(existing ?? {}),
      schemaVersion: STORAGE_SCHEMA_VERSION,
      profile,
    });
  }

  /**
   * Returns the retained reading session metrics, newest first.
   * Sessions already stored are de-duplicated by sessionId.
   */
  public static getReadingMetricsHistory(): ReadingMetrics[] {
    const raw = readJSONObject(STORAGE_KEYS.READING_STORE);
    const list = raw && Array.isArray(raw.metrics) ? (raw.metrics as ReadingMetrics[]) : [];
    const seen = new Set<string>();
    const out: ReadingMetrics[] = [];
    for (const m of list) {
      if (!m || typeof m !== 'object' || typeof m.sessionId !== 'string') continue;
      if (seen.has(m.sessionId)) continue;
      seen.add(m.sessionId);
      out.push(m);
    }
    return out;
  }

  /** Idempotently records one reading session's metrics. */
  public static saveReadingMetrics(metrics: ReadingMetrics) {
    const raw = readJSONObject(STORAGE_KEYS.READING_STORE);
    const history = StorageService.getReadingMetricsHistory();
    const isNew = !history.some((m) => m.sessionId === metrics.sessionId);
    const existing = history.filter((m) => m.sessionId !== metrics.sessionId);
    existing.unshift(metrics);
    writeJSON(STORAGE_KEYS.READING_STORE, {
      ...(raw ?? {}),
      schemaVersion: STORAGE_SCHEMA_VERSION,
      metrics: existing.slice(0, READING_POLICY.MAX_RECENT_SESSIONS),
    });
    // T18A — mỗi buổi đọc mới tính 1 truyện + quest đọc qua engine chung.
    if (isNew) {
      const motivation = StorageService.getMotivationState();
      motivation.storiesReadTotal += 1;
      StorageService.saveMotivationState(motivation);
      StorageService.recordQuestEvent({ kind: 'read' });
    }
  }

  /**
   * Returns parent quick grades keyed by passage id (😀/😐/🙁).
   */
  public static getReadingParentRatings(): Record<string, ReadingParentRating> {
    return StorageService.getReadingProfile().parentRatings ?? {};
  }

  /** Alias kept for names expected by callers/tests. */
  public static getReadingParentGrades(): Record<string, ReadingParentRating> {
    return StorageService.getReadingParentRatings();
  }

  /** Persists one parent quick grade for a passage (in-place on the profile). */
  public static saveReadingParentRating(passageId: string, rating: ReadingParentRating): void {
    if (typeof passageId !== 'string' || !passageId) return;
    if (!['😀', '😐', '🙁'].includes(rating)) return;
    const profile = StorageService.getReadingProfile();
    const next = {
      ...(profile.parentRatings ?? {}),
      [passageId]: rating,
    };
    const updated: ReadingProfile = {
      ...profile,
      parentRatings: next,
      parentGrades: { ...next },
      selfReadRatings: [...Object.values(next)],
    };
    StorageService.saveReadingProfile(updated);
  }

  /** Alias kept for names expected by callers/tests. */
  public static recordReadingParentRating(passageId: string, rating: ReadingParentRating): void {
    StorageService.saveReadingParentRating(passageId, rating);
  }

  /** Alias kept for names expected by callers/tests. */
  public static gradeReadingPassage(passageId: string, rating: ReadingParentRating): void {
    StorageService.saveReadingParentRating(passageId, rating);
  }

  /**
   * Rebuilds a valid reading profile from an arbitrary payload.
   */
  private static sanitizeReadingProfile(raw: Record<string, unknown>): ReadingProfile {
    const base = createEmptyReadingProfile();
    const p = (raw.profile && typeof raw.profile === 'object' ? raw.profile : raw) as Partial<ReadingProfile>;

    const stageStates = { ...base.stageStates };
    if (p.stageStates && typeof p.stageStates === 'object' && !Array.isArray(p.stageStates)) {
      for (const [stage, value] of Object.entries(p.stageStates as Record<string, unknown>)) {
        if (!Object.prototype.hasOwnProperty.call(stageStates, stage)) continue;
        if (!value || typeof value !== 'object') continue;
        const v = value as Partial<ReadingStageState>;
        const safe = stageStates[stage as ReadingStage];
        stageStates[stage as ReadingStage] = {
          stage: safe.stage,
          accuracy: clampPercent(v.accuracy, safe.accuracy),
          accuracyGate: typeof v.accuracyGate === 'number' ? v.accuracyGate : safe.accuracyGate,
          isUnlocked: Boolean(v.isUnlocked),
          isCompleted: Boolean(v.isCompleted),
          attempts: safeCount(v.attempts),
        };
      }
    }

    const skillStates: Record<string, ReadingSkillState> = {};
    if (p.skillStates && typeof p.skillStates === 'object' && !Array.isArray(p.skillStates)) {
      for (const [skillId, value] of Object.entries(p.skillStates as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') continue;
        const v = value as Partial<ReadingSkillState>;
        skillStates[skillId] = {
          skillId: (typeof v.skillId === 'string' ? v.skillId : skillId) as ReadingSkillState['skillId'],
          skillName: typeof v.skillName === 'string' ? v.skillName : skillId,
          accuracy: clampPercent(v.accuracy, 0),
          attempts: safeCount(v.attempts),
          correctCount: safeCount(v.correctCount),
          averageResponseMs: typeof v.averageResponseMs === 'number' ? Math.max(0, v.averageResponseMs) : 0,
          status: (['NOT_STARTED', 'LEARNING', 'PRACTICING', 'STRONG'] as const).includes(v.status as never)
            ? (v.status as ReadingSkillState['status'])
            : 'NOT_STARTED',
          lastPracticedAt: typeof v.lastPracticedAt === 'number' ? v.lastPracticedAt : undefined,
        };
      }
    }

    const currentStage = (['ACCURACY', 'FLUENCY', 'COMPREHENSION', 'PROCESSING_SPEED', 'COMPETITION_SPEED'] as const).includes(
      p.currentStage as never
    )
      ? (p.currentStage as ReadingStage)
      : 'ACCURACY';

    const VALID_RATING = new Set(['😀', '😐', '🙁']);
    const safeRating = (v: unknown): ReadingParentRating | undefined =>
      typeof v === 'string' && VALID_RATING.has(v) ? (v as ReadingParentRating) : undefined;

    const parentRatings: Record<string, ReadingParentRating> = {};
    for (const srcObj of [p.parentRatings, p.parentGrades, p.selfReadRatings]) {
      // support both record and array shapes
      if (srcObj && typeof srcObj === 'object' && !Array.isArray(srcObj)) {
        for (const [key, val] of Object.entries(srcObj as Record<string, unknown>)) {
          const r = safeRating(val);
          if (r) parentRatings[key] = r;
        }
      }
    }

    const selfReadRatings = Array.isArray(p.selfReadRatings)
      ? (p.selfReadRatings as unknown[]).map(safeRating).filter((r): r is ReadingParentRating => !!r)
      : Object.values(parentRatings);

    return {
      currentStage,
      stageStates,
      skillStates,
      readingIndex: clampPercent(p.readingIndex, 0),
      accuracyIndex: clampPercent(p.accuracyIndex, 0),
      fluencyIndex: clampPercent(p.fluencyIndex, 0),
      comprehensionIndex: clampPercent(p.comprehensionIndex, 0),
      headline: typeof p.headline === 'string' ? p.headline : base.headline,
      encouragement: typeof p.encouragement === 'string' ? p.encouragement : base.encouragement,
      lastSessionAt: typeof p.lastSessionAt === 'number' ? p.lastSessionAt : undefined,
      parentRatings: Object.keys(parentRatings).length ? parentRatings : undefined,
      parentGrades: Object.keys(parentRatings).length ? { ...parentRatings } : undefined,
      selfReadRatings: selfReadRatings.length ? selfReadRatings : undefined,
    };
  }

  /**
   * Rebuilds a structurally valid store from an arbitrary (possibly hostile)
   * payload. Every field is type-checked and coerced to a safe default.
   */
  private static sanitizeLearningOSStore(raw: Record<string, unknown>): LearningOSStore {
    const now = Date.now();
    const store = createEmptyLearningOSStore(now);
    store.schemaVersion = STORAGE_SCHEMA_VERSION;

    const states = raw.knowledgeStates;
    if (states && typeof states === 'object' && !Array.isArray(states)) {
      for (const [skillId, value] of Object.entries(states as Record<string, unknown>)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
        const v = value as Partial<KnowledgeState>;
        const subject: SubjectType =
          v.subject === 'toan' || v.subject === 'english' || v.subject === 'cuoc-song' ? v.subject : 'tieng-viet';
        const num = (n: unknown, fallback = 0) =>
          typeof n === 'number' && Number.isFinite(n) ? n : fallback;
        const count = (n: unknown) => Math.max(0, Math.round(num(n, 0)));

        store.knowledgeStates[skillId] = {
          ...LearningOS.createInitialKnowledgeState(
            skillId,
            typeof v.skillName === 'string' && v.skillName ? v.skillName : skillId,
            subject
          ),
          status: (['NOT_STARTED', 'LEARNING', 'PRACTICING', 'MASTERED', 'NEEDS_REVIEW'] as const).includes(
            v.status as never
          )
            ? (v.status as KnowledgeState['status'])
            : 'NOT_STARTED',
          mastery: Math.min(100, Math.max(0, num(v.mastery))),
          confidence: Math.min(100, Math.max(0, num(v.confidence))),
          accuracy: Math.min(100, Math.max(0, num(v.accuracy))),
          recentAccuracy: Math.min(100, Math.max(0, num(v.recentAccuracy))),
          attemptCount: count(v.attemptCount),
          correctCount: count(v.correctCount),
          consecutiveCorrect: count(v.consecutiveCorrect),
          consecutiveIncorrect: count(v.consecutiveIncorrect),
          // Adaptive Learning Upgrade fields. A legacy payload simply has none
          // of them, so every field falls back to its pristine default —
          // historical evidence is preserved, never re-scored or reset.
          independentAttempts: count(v.independentAttempts),
          independentCorrect: count(v.independentCorrect),
          assistedAttempts: count(v.assistedAttempts),
          assistedCorrect: count(v.assistedCorrect),
          hintCount: count(v.hintCount),
          currentLevel: ([1, 2, 3, 4, 5] as const).includes(v.currentLevel as never)
            ? (v.currentLevel as AdaptiveLevel)
            : ADAPTIVE_DIFFICULTY_POLICY.DEFAULT_STARTING_LEVEL,
          levelHistory: Array.isArray(v.levelHistory)
            ? (v.levelHistory as unknown[])
                .filter(
                  (h): h is { level: AdaptiveLevel; timestamp: number; reason: string } =>
                    !!h &&
                    typeof h === 'object' &&
                    ([1, 2, 3, 4, 5] as const).includes((h as { level: AdaptiveLevel }).level) &&
                    typeof (h as { timestamp: number }).timestamp === 'number' &&
                    typeof (h as { reason: string }).reason === 'string'
                )
                .slice(-20)
            : [],
          misconceptionCategories:
            v.misconceptionCategories && typeof v.misconceptionCategories === 'object' && !Array.isArray(v.misconceptionCategories)
              ? Object.fromEntries(
                  Object.entries(v.misconceptionCategories as Record<string, unknown>)
                    .filter(([, n]) => typeof n === 'number' && Number.isFinite(n) && n > 0)
                    .map(([k, n]) => [k, Math.round(n as number)])
                )
              : {},
          retentionEvidence:
            v.retentionEvidence && typeof v.retentionEvidence === 'object' && !Array.isArray(v.retentionEvidence)
              ? {
                  correctOnReview: count((v.retentionEvidence as { correctOnReview?: unknown }).correctOnReview),
                  totalReviews: count((v.retentionEvidence as { totalReviews?: unknown }).totalReviews),
                }
              : { correctOnReview: 0, totalReviews: 0 },
          lastPracticedAt: typeof v.lastPracticedAt === 'number' ? v.lastPracticedAt : undefined,
          lastCorrectAt: typeof v.lastCorrectAt === 'number' ? v.lastCorrectAt : undefined,
          lastIncorrectAt: typeof v.lastIncorrectAt === 'number' ? v.lastIncorrectAt : undefined,
          averageResponseTimeMs:
            typeof v.averageResponseTimeMs === 'number' && v.averageResponseTimeMs > 0
              ? v.averageResponseTimeMs
              : undefined,
          difficultyPerformance:
            v.difficultyPerformance && typeof v.difficultyPerformance === 'object'
              ? {
                  easy: countPair(v.difficultyPerformance, 'easy'),
                  medium: countPair(v.difficultyPerformance, 'medium'),
                  hard: countPair(v.difficultyPerformance, 'hard'),
                  challenge: countPair(v.difficultyPerformance, 'challenge'),
                }
              : { easy: { attempts: 0, correct: 0 }, medium: { attempts: 0, correct: 0 }, hard: { attempts: 0, correct: 0 }, challenge: { attempts: 0, correct: 0 } },
          errorProfile:
            v.errorProfile && typeof v.errorProfile === 'object'
              ? sanitizeErrorProfile(v.errorProfile as unknown)
              : { knowledgeGap: 0, careless: 0, speed: 0, misread: 0, reasoning: 0, unclassified: 0 },
          nextReviewAt: typeof v.nextReviewAt === 'number' ? v.nextReviewAt : undefined,
          evidenceVersion: Math.max(1, count(v.evidenceVersion) || 1),
        };
      }
    }

    if (Array.isArray(raw.recentEvidences)) {
      store.recentEvidences = (raw.recentEvidences as LearningEvidence[])
        .filter((e): e is LearningEvidence => !!e && typeof e === 'object' && typeof e.id === 'string')
        .slice(0, MAX_RECENT_EVIDENCES);
    }

    if (Array.isArray(raw.processedEvidenceIds)) {
      store.processedEvidenceIds = (raw.processedEvidenceIds as unknown[])
        .filter((id): id is string => typeof id === 'string')
        .slice(0, MAX_RECENT_EVIDENCES * 2);
    }

    if (raw.dailyPlan && typeof raw.dailyPlan === 'object' && !Array.isArray(raw.dailyPlan)) {
      const plan = raw.dailyPlan as Partial<DailyPlan>;
      if (Array.isArray(plan.items)) {
        store.dailyPlan = {
          date: typeof plan.date === 'string' ? plan.date : getTodayString(),
          estimatedMinutes: typeof plan.estimatedMinutes === 'number' ? plan.estimatedMinutes : 0,
          items: plan.items.filter((i) => i && typeof i === 'object') as DailyPlan['items'],
          generatedFrom: {
            knowledgeVersion: 1,
            policyVersion: LEARNING_OS_POLICY.POLICY_VERSION,
            generatedAt: now,
          },
        };
      }
    }

    const fatigue = raw.fatigue;
    if (fatigue && typeof fatigue === 'object' && !Array.isArray(fatigue)) {
      const f = fatigue as Partial<SessionFatigueState>;
      store.fatigue = {
        sessionStartTime: typeof f.sessionStartTime === 'number' ? f.sessionStartTime : now,
        questionsAnsweredThisSession: Math.max(0, Math.round(Number(f.questionsAnsweredThisSession) || 0)),
        sessionErrorsCount: Math.max(0, Math.round(Number(f.sessionErrorsCount) || 0)),
        consecutiveErrorsInSession: Math.max(0, Math.round(Number(f.consecutiveErrorsInSession) || 0)),
        // Strict boolean: a truthy string like 'yes' must NOT enable fatigue.
        isFatigued: f.isFatigued === true,
      };
    }

    if (Array.isArray(raw.recommendationHistory)) {
      store.recommendationHistory = (raw.recommendationHistory as LearningOSStore['recommendationHistory'])
        .filter((r) => r && typeof r === 'object' && typeof r.actionId === 'string')
        .slice(0, 100);
    }

    // Resumable practice session. A malformed or hostile payload degrades to
    // "no session" instead of blocking the child from starting a fresh one.
    const session = raw.sessionState;
    if (session && typeof session === 'object' && !Array.isArray(session)) {
      const s = session as Partial<SessionState>;
      const questions = Array.isArray(s.questions)
        ? (s.questions as unknown[]).filter((id): id is string => typeof id === 'string').slice(0, 60)
        : [];
      const currentIndex = Math.max(0, Math.min(questions.length, Math.round(Number(s.currentIndex) || 0)));
      store.sessionState = {
        profileKind: SESSION_PROFILE_KINDS.includes(s.profileKind as SessionProfileKind)
          ? (s.profileKind as SessionProfileKind)
          : 'QUICK',
        questions,
        currentIndex,
        correctCount: Math.max(0, Math.min(currentIndex, Math.round(Number(s.correctCount) || 0))),
        incorrectCount: Math.max(0, Math.min(currentIndex, Math.round(Number(s.incorrectCount) || 0))),
        hintsUsed: Math.max(0, Math.round(Number(s.hintsUsed) || 0)),
        startedAt: typeof s.startedAt === 'number' ? s.startedAt : now,
        lastUpdatedAt: typeof s.lastUpdatedAt === 'number' ? s.lastUpdatedAt : now,
        isPaused: s.isPaused === true,
        isCompleted: s.isCompleted === true,
        checkpointResults: Array.isArray(s.checkpointResults)
          ? (s.checkpointResults as unknown[])
              .filter(
                (c): c is { afterQuestion: number; correctCount: number; totalSoFar: number } =>
                  !!c &&
                  typeof c === 'object' &&
                  typeof (c as { afterQuestion: number }).afterQuestion === 'number' &&
                  typeof (c as { correctCount: number }).correctCount === 'number' &&
                  typeof (c as { totalSoFar: number }).totalSoFar === 'number'
              )
              .slice(-20)
          : [],
      };
    }

    return store;
  }

  // ==========================================================
  // Resumable practice session (adaptive learning sessions)
  // ==========================================================

  /** Current session or null when the child is not inside a practice session. */
  public static getSessionState(): SessionState | null {
    return StorageService.getLearningOSStore().sessionState;
  }

  /** Persists the session after every answer so a refresh never loses progress. */
  public static saveSessionState(state: SessionState | null): void {
    const store = StorageService.getLearningOSStore();
    store.sessionState = state;
    StorageService.saveLearningOSStore(store);
  }

  public static getChildProfile(): ChildProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHILD_PROFILE);
      if (data) {
        const raw = JSON.parse(data);
        if (raw && typeof raw === 'object') {
          // Defensively sanitize and merge with defaults
          const sanitized: ChildProfile = {
            id: typeof raw.id === 'string' ? raw.id : DEFAULT_CHILD_PROFILE.id,
            name: typeof raw.name === 'string' ? raw.name : DEFAULT_CHILD_PROFILE.name,
            grade: 1,
            avatarBase: ['bear', 'fox', 'rabbit', 'owl'].includes(raw.avatarBase)
              ? raw.avatarBase
              : DEFAULT_CHILD_PROFILE.avatarBase,
            equipped: raw.equipped && typeof raw.equipped === 'object' ? raw.equipped : {},
            xp: typeof raw.xp === 'number' && !isNaN(raw.xp) && raw.xp >= 0 ? raw.xp : 0,
            stars: typeof raw.stars === 'number' && !isNaN(raw.stars) && raw.stars >= 0 ? raw.stars : 0,
            gems: typeof raw.gems === 'number' && !isNaN(raw.gems) && raw.gems >= 0 ? raw.gems : 0,
            tickets: typeof raw.tickets === 'number' && !isNaN(raw.tickets) && raw.tickets >= 0 ? raw.tickets : 0,
            streak: typeof raw.streak === 'number' && !isNaN(raw.streak) && raw.streak >= 1 ? raw.streak : 1,
            lastActiveDate: typeof raw.lastActiveDate === 'string' ? raw.lastActiveDate : getTodayString(),
            unlockedItems: Array.isArray(raw.unlockedItems)
              ? raw.unlockedItems
              : [...DEFAULT_CHILD_PROFILE.unlockedItems],
            completedLessons: Array.isArray(raw.completedLessons) ? raw.completedLessons : [],
            completedWeeklyChallenges: Array.isArray(raw.completedWeeklyChallenges)
              ? raw.completedWeeklyChallenges
              : [],
            dailyChestClaimedDate: raw.dailyChestClaimedDate,
            lessonStars: raw.lessonStars && typeof raw.lessonStars === 'object' && !Array.isArray(raw.lessonStars)
              ? Object.fromEntries(
                  Object.entries(raw.lessonStars as Record<string, unknown>)
                    .filter(([, v]) => typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 3)
                    .map(([k, v]) => [k, Math.round(v as number)])
                )
              : {},
            chestState: raw.chestState && typeof raw.chestState === 'object' && !Array.isArray(raw.chestState)
              ? Object.fromEntries(
                  Object.entries(raw.chestState as Record<string, unknown>)
                    .filter(([, v]) => v === true)
                    .map(([k]) => [k, true])
                )
              : {},
            unlockAllLessons: raw.unlockAllLessons === true,
            isDemoData: raw.isDemoData === true,
          };

          // Verify streak progression (T01/B8: local calendar days; old UTC
          // keys are still YYYY-MM-DD so they keep working).
          // T18A: nghỉ đúng 1 ngày mà còn khiên → khiên vỡ thay bé, chuỗi
          // giữ nguyên (trẻ con không bị phạt vì bố mẹ bận); lịch chuỗi
          // ngày + kỷ lục chuỗi lưu ở kho động lực (key riêng, không mất).
          const today = getTodayString();
          if (sanitized.lastActiveDate !== today) {
            const diffDays = diffDateKeys(sanitized.lastActiveDate, today);
            if (diffDays === 1) {
              sanitized.streak += 1;
            } else if (diffDays === 2) {
              const motivation = StorageService.getMotivationState(today);
              if (motivation.shields > 0) {
                motivation.shields -= 1;
                motivation.shieldsUsedTotal += 1;
                sanitized.streak += 1;
                // Lấp ngày nghỉ (hôm qua) để lịch chuỗi liền mạch.
                const yesterday = parseDateKey(today);
                if (yesterday) {
                  yesterday.setDate(yesterday.getDate() - 1);
                  const missing = localDateKey(yesterday);
                  if (!motivation.shieldedDays.includes(missing)) {
                    motivation.shieldedDays = [...motivation.shieldedDays, missing].sort().slice(-400);
                  }
                }
                if (!motivation.streakDays.includes(today)) {
                  motivation.streakDays = [...motivation.streakDays, today].sort().slice(-400);
                }
                motivation.streakBest = Math.max(motivation.streakBest, sanitized.streak);
                StorageService.saveMotivationState(motivation);
              } else {
                sanitized.streak = 1;
              }
            } else if (diffDays === null || diffDays > 2 || diffDays < 0) {
              sanitized.streak = 1;
            }
            sanitized.lastActiveDate = today;
            StorageService.saveChildProfile(sanitized);
          }
          // Ghi ngày học vào lịch chuỗi (kể cả mở app nhiều lần trong ngày).
          try {
            const motivation = StorageService.getMotivationState(today);
            if (!motivation.streakDays.includes(today)) {
              motivation.streakDays = [...motivation.streakDays, today].sort().slice(-400);
              motivation.streakBest = Math.max(motivation.streakBest, sanitized.streak);
              StorageService.saveMotivationState(motivation);
            }
          } catch {
            // Lịch chuỗi chỉ để khoe ở T18B — không bao giờ chặn bé học.
          }
          return sanitized;
        }
      }
    } catch {
      // Ignore parse error and recover safely
    }
    // Never hand out the shared module constant: callers mutate the returned
    // object, which would otherwise corrupt the "pristine profile" baseline.
    const fresh: ChildProfile = {
      ...DEFAULT_CHILD_PROFILE,
      equipped: { ...DEFAULT_CHILD_PROFILE.equipped },
      unlockedItems: [...DEFAULT_CHILD_PROFILE.unlockedItems],
      completedLessons: [],
      completedWeeklyChallenges: [],
      lessonStars: {},
      chestState: {},
      unlockAllLessons: false,
      lastActiveDate: getTodayString(),
      isDemoData: false,
    };
    StorageService.saveChildProfile(fresh);
    return fresh;
  }

  public static saveChildProfile(profile: ChildProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHILD_PROFILE, JSON.stringify(profile));
    } catch {
      // Storage full or private mode handled safely
    }
  }

public static getParentSettings(): ParentSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PARENT_SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return {
            dailyLimitMinutes: typeof parsed.dailyLimitMinutes === 'number' ? parsed.dailyLimitMinutes : 20,
            soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
            musicEnabled: typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : true,
            voiceEnabled: typeof parsed.voiceEnabled === 'boolean' ? parsed.voiceEnabled : true,
            difficultyScale: ['easy', 'normal', 'advanced'].includes(parsed.difficultyScale)
              ? parsed.difficultyScale
              : 'normal',
            questionAutoplay:
              typeof parsed.questionAutoplay === 'boolean' ? parsed.questionAutoplay : true,
            defaultSessionProfile: ['QUICK', 'STANDARD', 'DEEP', 'EXTENDED'].includes(parsed.defaultSessionProfile)
              ? parsed.defaultSessionProfile
              : 'STANDARD',
            allowAdvancedQuestions: parsed.allowAdvancedQuestions === true,
            reviewIntensity: ['light', 'standard', 'intensive'].includes(parsed.reviewIntensity)
              ? parsed.reviewIntensity
              : 'standard',
            optionalBreaks: parsed.optionalBreaks === true,
            nightMode: parsed.nightMode === true,
            maxGachaPerDay: typeof parsed.maxGachaPerDay === 'number' && parsed.maxGachaPerDay >= 0
              ? Math.round(parsed.maxGachaPerDay)
              : 5,
            rewardsEnabled: parsed.rewardsEnabled === true,
            rewardHistory: Array.isArray(parsed.rewardHistory) ? parsed.rewardHistory.slice(-50) : [],
            // T19 — nhạc nền mặc định TẮT
            bgMusicEnabled: typeof parsed.bgMusicEnabled === 'boolean' ? parsed.bgMusicEnabled : false,
          };
        }
      }
    } catch {
      // Ignore
    }
    // Return a fresh copy to avoid mutating the shared default object.
    return {
      ...DEFAULT_PARENT_SETTINGS,
      rewardHistory: [],
    };
  }

  public static saveParentSettings(settings: ParentSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.PARENT_SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }

  public static getAnalytics(): LearningAnalytics {
    const today = getTodayString();
    let analytics: LearningAnalytics = {
      totalMinutesSpent: 0,
      minutesToday: 0,
      todayDate: today,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      lessonsCompletedCount: 0,
      gamesPlayedCount: 0,
      skillMastery: {},
      recentErrors: [],
    };

    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          analytics = {
            totalMinutesSpent: typeof parsed.totalMinutesSpent === 'number' ? parsed.totalMinutesSpent : 0,
            minutesToday: parsed.todayDate === today && typeof parsed.minutesToday === 'number' ? parsed.minutesToday : 0,
            todayDate: today,
            totalQuestionsAnswered: typeof parsed.totalQuestionsAnswered === 'number' ? parsed.totalQuestionsAnswered : 0,
            totalCorrect: typeof parsed.totalCorrect === 'number' ? parsed.totalCorrect : 0,
            lessonsCompletedCount: typeof parsed.lessonsCompletedCount === 'number' ? parsed.lessonsCompletedCount : 0,
            gamesPlayedCount: typeof parsed.gamesPlayedCount === 'number' ? parsed.gamesPlayedCount : 0,
            skillMastery: parsed.skillMastery && typeof parsed.skillMastery === 'object' ? parsed.skillMastery : {},
            recentErrors: Array.isArray(parsed.recentErrors) ? parsed.recentErrors : [],
          };
        }
      }
    } catch {
      // Ignore
    }

    // Ensure all curriculum skills have mastery records
    const allSkills = getAllSkills();
    for (const s of allSkills) {
      if (!analytics.skillMastery[s.skillId]) {
        analytics.skillMastery[s.skillId] = {
          skillId: s.skillId,
          skillName: s.skillName,
          subject: s.subject,
          attempts: 0,
          correctCount: 0,
          wrongCount: 0,
          status: 'NOT_STARTED',
          lastPracticed: new Date().toISOString(),
        };
      }
    }

    return analytics;
  }

  public static saveAnalytics(analytics: LearningAnalytics) {
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
    } catch {
      // Ignore
    }
  }

  /**
   * T18A — Nhiệm vụ đã lưu trong ngày được giữ nguyên (kể cả tiến trình),
   * chỉ loại quest lạ (không có trong pool) — đề không "nhảy" giữa ngày.
   */
  private static sanitizeStoredQuests(raw: unknown): DailyQuest[] | null {
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const out: DailyQuest[] = [];
    for (const q of raw) {
      if (!q || typeof q !== 'object') continue;
      const quest = q as Partial<DailyQuest>;
      const def = typeof quest.id === 'string' ? QUEST_MAP.get(quest.id) : undefined;
      if (!def) continue;
      out.push({
        id: def.id,
        title: def.title,
        targetCount: def.targetCount,
        currentCount:
          typeof quest.currentCount === 'number' && Number.isFinite(quest.currentCount)
            ? Math.min(Math.max(Math.round(quest.currentCount), 0), def.targetCount)
            : 0,
        rewardStars: def.rewardStars,
        rewardXp: def.rewardXp,
        completed: quest.completed === true,
        type: def.type,
      });
    }
    return out.length > 0 ? out : null;
  }

  public static getDailyQuests(): DailyQuest[] {
    const today = getTodayString();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DAILY_QUESTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === today && Array.isArray(parsed.quests)) {
          const kept = StorageService.sanitizeStoredQuests(parsed.quests);
          if (kept) return kept;
        }
      }
    } catch {
      // Ignore
    }

    const newQuests = createDefaultQuests(today);
    StorageService.saveDailyQuests(newQuests);
    return newQuests;
  }

  public static saveDailyQuests(quests: DailyQuest[]) {
    try {
      const today = getTodayString();
      localStorage.setItem(STORAGE_KEYS.DAILY_QUESTS, JSON.stringify({ date: today, quests }));
    } catch {
      // Ignore
    }
  }

  /**
   * T18A — Danh sách thành tựu luôn đủ 35 mục: trạng thái đã mở của bé
   * được giữ lại theo id, thành tựu mới tự thêm ở dạng khoá.
   */
  public static getAchievements(): Achievement[] {
    const unlockedById = new Map<string, Achievement>();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          for (const a of parsed) {
            if (a && typeof a === 'object' && typeof a.id === 'string') {
              unlockedById.set(a.id, a as Achievement);
            }
          }
        }
      }
    } catch {
      // Ignore — dùng catalog mặc định
    }
    return INITIAL_ACHIEVEMENTS.map((def) => {
      const stored = unlockedById.get(def.id);
      if (stored && stored.unlocked === true) {
        return {
          ...def,
          unlocked: true,
          unlockedAt: typeof stored.unlockedAt === 'string' ? stored.unlockedAt : new Date().toISOString(),
        };
      }
      return { ...def };
    });
  }

  public static saveAchievements(achs: Achievement[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achs));
    } catch {
      // Ignore
    }
  }

  // ==========================================================
  // T18A — Kho động lực (sticker, khiên, số liệu ngày)
  // Key riêng nên payload cũ không cần migration; mọi giá trị lạ
  // đều được sanitizer dựng lại từ mặc định, không bao giờ crash.
  // ==========================================================

  private static createDefaultMotivationDaily(date: string): MotivationDaily {
    return {
      date,
      comboBest: 0,
      comboNow: 0,
      reviewQuestions: 0,
      gachaDraws: 0,
      correctBySubject: { 'tieng-viet': 0, toan: 0, english: 0, 'cuoc-song': 0 },
    };
  }

  private static createDefaultMotivation(date: string): MotivationState {
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      stickers: {},
      claimedLevelRewards: [],
      shields: 1,
      lastShieldWeek: null,
      streakDays: [],
      shieldedDays: [],
      shieldsUsedTotal: 0,
      gachaDrawsTotal: 0,
      questsCompletedTotal: 0,
      shopBoughtTotal: 0,
      comboBestAll: 0,
      starsEarnedTotal: 0,
      storiesReadTotal: 0,
      chestsOpenedTotal: 0,
      streakBest: 1,
      daily: StorageService.createDefaultMotivationDaily(date),
    };
  }

  private static sanitizeMotivation(raw: Record<string, unknown>, today: string): MotivationState {
    const base = StorageService.createDefaultMotivation(today);
    const count = (n: unknown) =>
      typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;

    const stickers: Record<string, number> = {};
    if (raw.stickers && typeof raw.stickers === 'object' && !Array.isArray(raw.stickers)) {
      for (const [id, n] of Object.entries(raw.stickers as Record<string, unknown>)) {
        if (typeof id === 'string' && STICKER_MAP.has(id) && typeof n === 'number' && n > 0) {
          stickers[id] = Math.min(Math.floor(n), 999);
        }
      }
    }

    const streakDays = Array.isArray(raw.streakDays)
      ? [...new Set((raw.streakDays as unknown[]).filter((d): d is string => isRealDateKey(d)))].sort().slice(-400)
      : [];
    const shieldedDays = Array.isArray(raw.shieldedDays)
      ? [...new Set((raw.shieldedDays as unknown[]).filter((d): d is string => isRealDateKey(d)))].sort().slice(-400)
      : [];

    const dailyRaw = raw.daily && typeof raw.daily === 'object' && !Array.isArray(raw.daily)
      ? (raw.daily as Record<string, unknown>)
      : null;
    const daily =
      dailyRaw && dailyRaw.date === today
        ? {
            date: today,
            comboBest: count(dailyRaw.comboBest),
            comboNow: count(dailyRaw.comboNow),
            reviewQuestions: count(dailyRaw.reviewQuestions),
            gachaDraws: count(dailyRaw.gachaDraws),
            correctBySubject: {
              'tieng-viet': count((dailyRaw.correctBySubject as Record<string, unknown> | undefined)?.['tieng-viet']),
              toan: count((dailyRaw.correctBySubject as Record<string, unknown> | undefined)?.toan),
              english: count((dailyRaw.correctBySubject as Record<string, unknown> | undefined)?.english),
              'cuoc-song': count((dailyRaw.correctBySubject as Record<string, unknown> | undefined)?.['cuoc-song']),
            },
          }
        : StorageService.createDefaultMotivationDaily(today);

    return {
      ...base,
      shieldedDays,
      stickers,
      claimedLevelRewards: Array.isArray(raw.claimedLevelRewards)
        ? [...new Set(
            (raw.claimedLevelRewards as unknown[])
              .filter((l): l is number => typeof l === 'number' && Number.isFinite(l))
              .map((l) => Math.round(l))
              .filter((l) => l >= 2 && l <= 50)
          )].sort((a, b) => a - b)
        : [],
      shields: typeof raw.shields === 'number' && Number.isFinite(raw.shields)
        ? Math.min(Math.max(Math.round(raw.shields), 0), 2)
        : 1,
      lastShieldWeek: typeof raw.lastShieldWeek === 'string' ? raw.lastShieldWeek : null,
      streakDays,
      shieldsUsedTotal: count(raw.shieldsUsedTotal),
      gachaDrawsTotal: count(raw.gachaDrawsTotal),
      shopBoughtTotal: count(raw.shopBoughtTotal),
      comboBestAll: count(raw.comboBestAll),
      starsEarnedTotal: count(raw.starsEarnedTotal),
      storiesReadTotal: count(raw.storiesReadTotal),
      chestsOpenedTotal: count(raw.chestsOpenedTotal),
      streakBest: Math.max(1, count(raw.streakBest)),
      daily,
    };
  }

  public static getMotivationState(today: string = getTodayString()): MotivationState {
    const raw = readJSONObject(STORAGE_KEYS.MOTIVATION);
    const state = raw
      ? StorageService.sanitizeMotivation(raw, today)
      : StorageService.createDefaultMotivation(today);
    // Phát khiên tuần tự động (1 khiên/tuần, tối đa 2) ngay khi đọc.
    const week = weekKeyOf(today);
    if (week && state.lastShieldWeek !== week) {
      state.shields = Math.min(state.shields + 1, 2);
      state.lastShieldWeek = week;
      StorageService.saveMotivationState(state);
    }
    return state;
  }

  public static saveMotivationState(state: MotivationState): void {
    writeJSON(STORAGE_KEYS.MOTIVATION, { ...state, schemaVersion: STORAGE_SCHEMA_VERSION });
  }

  /**
   * T18A — Ghi 1 sự kiện tiến trình vào quest hôm nay + số liệu ngày.
   * Quest nào vừa xong thì trao sao/XP ngay cho bé (không trao trùng).
   * Trả về id các quest vừa hoàn thành (để UI ăn mừng ở T18B).
   */
  public static recordQuestEvent(event: QuestEvent): string[] {
    if (!event || typeof event.kind !== 'string') return [];
    const today = getTodayString();
    const motivation = StorageService.getMotivationState(today);

    // Cập nhật số liệu ngày trước để quest combo/correct/review đọc đúng.
    if (event.kind === 'answer') {
      if (event.correct) {
        motivation.daily.comboNow += 1;
        motivation.daily.comboBest = Math.max(motivation.daily.comboBest, motivation.daily.comboNow);
        motivation.comboBestAll = Math.max(motivation.comboBestAll, motivation.daily.comboBest);
        if (event.subject) {
          motivation.daily.correctBySubject[event.subject] =
            (motivation.daily.correctBySubject[event.subject] ?? 0) + 1;
        }
      } else {
        motivation.daily.comboNow = 0;
      }
    } else if (event.kind === 'review_question') {
      motivation.daily.reviewQuestions += 1;
    } else if (event.kind === 'gacha') {
      motivation.daily.gachaDraws += 1;
      motivation.gachaDrawsTotal += 1;
    }

    const quests = StorageService.getDailyQuests();
    const { quests: next, newlyCompleted } = applyQuestEvent(quests, event, motivation.daily);

    if (next !== quests) StorageService.saveDailyQuests(next);
    if (newlyCompleted.length > 0) {
      const profile = StorageService.getChildProfile();
      for (const q of newlyCompleted) {
        profile.stars += q.rewardStars;
        profile.xp += q.rewardXp;
        motivation.starsEarnedTotal += q.rewardStars;
        StorageService.addRewardHistory({ type: 'quest', amount: q.rewardStars, description: `Hoàn thành nhiệm vụ: ${q.title}`, itemId: q.id });
      }
      motivation.questsCompletedTotal += newlyCompleted.length;
      StorageService.saveChildProfile(profile);
      StorageService.saveMotivationState(motivation);
    } else {
      StorageService.saveMotivationState(motivation);
    }

    StorageService.checkAchievements();
    return newlyCompleted.map((q) => q.id);
  }

  /** T18A — Bé mặc/tháo đồ cho Gấu (UI T18B gọi để xong quest vui). */
  public static recordDressUp(): string[] {
    return StorageService.recordQuestEvent({ kind: 'dressup' });
  }

  /**
   * T18A — Ảnh chụp số liệu để chấm rule thành tựu.
   * Nguồn duy nhất: profile + analytics + reviewDays + kho động lực
   * (không đọc Learning OS để tránh vòng lặp import).
   */
  public static buildMotivationStats(): MotivationStats {
    const profile = StorageService.getChildProfile();
    const analytics = StorageService.getAnalytics();
    const reviewDays = StorageService.getReviewCompletedDays();
    const motivation = StorageService.getMotivationState();
    const byPrefix = (prefix: string) =>
      profile.completedLessons.filter((l) => l.startsWith(prefix)).length;
    const lessons3Star = Object.values(profile.lessonStars).filter((s) => s === 3).length;
    return {
      lessonsTotal: profile.completedLessons.length,
      lessonsViet: byPrefix('vn-'),
      lessonsMath: byPrefix('math-'),
      lessonsEnglish: byPrefix('eng-'),
      lessonsLife: byPrefix('life-'),
      lessons3Star,
      gamesPlayed: analytics.gamesPlayedCount,
      reviewDays: reviewDays.length,
      weeklyChallenges: profile.completedWeeklyChallenges.length,
      streak: profile.streak,
      streakBest: Math.max(motivation.streakBest, profile.streak),
      level: xpToLevel(profile.xp),
      starsEarnedTotal: Math.max(motivation.starsEarnedTotal, profile.stars),
      stickersOwned: ownedStickersCount(motivation.stickers),
      stickerSetsCompleted: completedSetsCount(motivation.stickers),
      shopOwned: motivation.shopBoughtTotal,
      gachaDraws: motivation.gachaDrawsTotal,
      questsCompleted: motivation.questsCompletedTotal,
      chestsOpened: Math.max(motivation.chestsOpenedTotal, Object.keys(profile.chestState).length),
      comboBest: motivation.comboBestAll,
      storiesRead: motivation.storiesReadTotal,
    };
  }

  /**
   * T01B/10 — "Tưới nước cho cây" chỉ bắn confetti 1 lần/ngày.
   * Sanitizer: chỉ chấp nhận YYYY-MM-DD, còn lại coi như chưa tưới.
   */
  public static getTreeWateredDate(): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TREE_WATER);
      if (isRealDateKey(raw)) return raw;
    } catch {
      // Ignore — ngoài trình duyệt hoặc quota đầy thì coi như chưa tưới.
    }
    return null;
  }

  public static setTreeWateredDate(dateKey: string): void {
    if (!isRealDateKey(dateKey)) return;
    const firstToday = StorageService.getTreeWateredDate() !== dateKey;
    try {
      localStorage.setItem(STORAGE_KEYS.TREE_WATER, dateKey);
    } catch {
      // Ignore
    }
    // T18A — quest vui "tưới cây" (chỉ tính lần đầu trong ngày).
    if (firstToday) {
      try {
        StorageService.recordQuestEvent({ kind: 'water' });
      } catch {
        // Tưới cây không bao giờ chặn bé học.
      }
    }
  }

  // Record an answered question for adaptive learning & mastery
  public static recordQuestionAnswer(
    skillId: string,
    isCorrect: boolean,
    questionId: string,
    prompt: string,
    subject: SubjectType,
    options: {
      responseTimeMs?: number;
      difficulty?: EvidenceDifficulty;
      errorType?: ErrorCategory;
      source?: LearningEvidence['source'];
      /** Stable id so retries of the same item never double-count evidence. */
      evidenceId?: string;
      /** Whether the child used a hint before answering (assisted, not independent). */
      usedHint?: boolean;
    } = {}
  ) {
    const analytics = StorageService.getAnalytics();
    analytics.totalQuestionsAnswered += 1;
    if (isCorrect) {
      analytics.totalCorrect += 1;
    } else {
      analytics.recentErrors.unshift({
        questionId,
        subject,
        prompt,
        timestamp: new Date().toISOString(),
      });
      if (analytics.recentErrors.length > 20) {
        analytics.recentErrors.pop();
      }
    }

    // Emit evidence into Learning OS (idempotent: replays return false).
    StorageService.recordLearningEvidence({
      id: options.evidenceId ?? `ev_${subject}_${skillId}_${questionId}_${Date.now()}`,
      learnerId: StorageService.getChildProfile().id,
      source: options.source ?? 'LESSON',
      skillId,
      subject,
      questionId,
      timestamp: Date.now(),
      correct: isCorrect,
      responseTimeMs: options.responseTimeMs,
      difficulty: options.difficulty,
      errorType: options.errorType,
      usedHint: options.usedHint,
    });

    let mastery = analytics.skillMastery[skillId];
    if (!mastery) {
      mastery = {
        skillId,
        skillName: skillId,
        subject,
        attempts: 0,
        correctCount: 0,
        wrongCount: 0,
        status: 'NOT_STARTED',
        lastPracticed: new Date().toISOString(),
      };
      analytics.skillMastery[skillId] = mastery;
    }

    mastery.attempts += 1;
    if (isCorrect) {
      mastery.correctCount += 1;
    } else {
      mastery.wrongCount += 1;
    }
    mastery.lastPracticed = new Date().toISOString();

    // Determine mastery status (thresholds live in the central policy module)
    const accuracy = mastery.attempts > 0 ? mastery.correctCount / mastery.attempts : 0;
    if (
      mastery.attempts >= LEGACY_MASTERY_POLICY.MASTERED_MIN_ATTEMPTS &&
      accuracy >= LEGACY_MASTERY_POLICY.MASTERED_MIN_ACCURACY
    ) {
      mastery.status = 'MASTERED';
    } else if (
      mastery.attempts >= LEGACY_MASTERY_POLICY.REVIEW_MIN_ATTEMPTS &&
      accuracy < LEGACY_MASTERY_POLICY.REVIEW_MAX_ACCURACY
    ) {
      mastery.status = 'NEEDS_REVIEW';
    } else if (mastery.attempts >= LEGACY_MASTERY_POLICY.PRACTICING_MIN_ATTEMPTS) {
      mastery.status = 'PRACTICING';
    } else {
      mastery.status = 'LEARNING';
    }

    StorageService.saveAnalytics(analytics);

    // T18A — quest combo/correct theo môn qua engine chung.
    StorageService.recordQuestEvent({ kind: 'answer', subject, correct: isCorrect });
  }

  // Increment screen time
  public static addMinutesSpent(minutes: number) {
    const analytics = StorageService.getAnalytics();
    analytics.minutesToday += minutes;
    analytics.totalMinutesSpent += minutes;
    StorageService.saveAnalytics(analytics);
  }

  // Record completed lesson
  public static completeLesson(lessonId: string, subject: SubjectType, xp: number, stars: number) {
    const profile = StorageService.getChildProfile();
    const isFirstTime = !profile.completedLessons.includes(lessonId);

    if (isFirstTime) {
      profile.completedLessons.push(lessonId);
      profile.xp += xp;
      profile.stars += stars;
      profile.tickets += 1; // Earn 1 arcade ticket per new lesson!
      // Record stars earned for this lesson (1–3)
      profile.lessonStars[lessonId] = Math.min(Math.max(Math.round(stars), 1), 3);
      StorageService.addRewardHistory({ type: 'xp', amount: xp, description: `Hoàn thành bài học ${lessonId}`, itemId: lessonId });
      StorageService.addRewardHistory({ type: 'stars', amount: stars, description: `Sao bài học ${lessonId}`, itemId: lessonId });
      StorageService.addRewardHistory({ type: 'tickets', amount: 1, description: `Vé bài học ${lessonId}`, itemId: lessonId });
    } else {
      // Retaking an already completed lesson grants practice review XP (+5 XP)
      // but does NOT duplicate stars/tickets (anti-farming reward integrity)
      profile.xp += 5;
      StorageService.addRewardHistory({ type: 'xp', amount: 5, description: `Luyện lại bài ${lessonId}`, itemId: lessonId });
    }
    StorageService.saveChildProfile(profile);

    const analytics = StorageService.getAnalytics();
    analytics.lessonsCompletedCount += 1;
    StorageService.saveAnalytics(analytics);

    // T18A — sao kiếm được trong bài (kể cả trước khi tiêu ở Shop).
    if (isFirstTime) {
      const motivation = StorageService.getMotivationState();
      motivation.starsEarnedTotal += Math.min(Math.max(Math.round(stars), 1), 3);
      StorageService.saveMotivationState(motivation);
    }

    // T18A — tiến trình quest qua engine chung (lesson_any/lesson_life/star_3...).
    // recordQuestEvent tự trao thưởng quest + chấm thành tựu nên không cần thêm.
    StorageService.recordQuestEvent({ kind: 'lesson', subject, stars });
  }

  /**
   * Claim the treasure chest reward for completing all lessons in a topic.
   * Returns the stars awarded (0 if already claimed or topic not complete).
   */
  public static claimTopicChest(topicId: string, subject: SubjectType, starReward: number): number {
    const profile = StorageService.getChildProfile();
    if (profile.chestState[topicId]) return 0; // Already claimed

    // Verify all lessons in this topic are completed
    const topics = getTopicsBySubject(subject);
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return 0;

    const allLessonsDone = topic.lessons.every((l) => profile.completedLessons.includes(l.id));
    if (!allLessonsDone) return 0;

    // Award stars and mark chest as claimed
    const safeStars = Math.min(Math.max(Math.round(starReward), 1), 3);
    profile.stars += safeStars;
    profile.chestState[topicId] = true;
    StorageService.saveChildProfile(profile);

    const analytics = StorageService.getAnalytics();
    StorageService.saveAnalytics(analytics);

    // T18A — đếm rương + quest vui "mở rương" (kể cả trước khi tiêu sao).
    const motivation = StorageService.getMotivationState();
    motivation.starsEarnedTotal += safeStars;
    motivation.chestsOpenedTotal += 1;
    StorageService.saveMotivationState(motivation);
    StorageService.recordQuestEvent({ kind: 'chest' });
    StorageService.addRewardHistory({ type: 'stars', amount: safeStars, description: `Rương chủ đề ${topicId}`, itemId: topicId });
    return safeStars;
  }

  /**
   * T18A — Rương kho báu mỗi ngày trên Home (giữ logic thưởng cũ:
   * +10 sao, +50 XP) và cộng thêm đếm rương + quest vui cho bé.
   */
  public static claimDailyChest(stars = 10, xp = 50): boolean {
    const today = getTodayString();
    const profile = StorageService.getChildProfile();
    if (profile.dailyChestClaimedDate === today) return false;
    profile.stars += stars;
    profile.xp += xp;
    profile.dailyChestClaimedDate = today;
    StorageService.saveChildProfile(profile);
    const motivation = StorageService.getMotivationState();
    motivation.starsEarnedTotal += stars;
    motivation.chestsOpenedTotal += 1;
    StorageService.saveMotivationState(motivation);
    StorageService.recordQuestEvent({ kind: 'chest' });
    StorageService.addRewardHistory({ type: 'stars', amount: stars, description: `Rương hàng ngày`, itemId: 'daily_chest' });
    StorageService.addRewardHistory({ type: 'xp', amount: xp, description: `Rương hàng ngày`, itemId: 'daily_chest' });
    return true;
  }

  // --- Game level progression -------------------------------------------
  private static sanitizeGameProgress(raw: unknown): GameLevelProgress {
    const empty: GameLevelProgress = {
      unlockedTier: 1,
      starsByTier: {},
      bestScoreByTier: {},
      updatedAt: new Date().toISOString(),
    };
    if (!raw || typeof raw !== 'object') return empty;
    const r = raw as Record<string, unknown>;
    const clampTier = (t: unknown): number =>
      typeof t === 'number' && Number.isFinite(t) ? Math.min(Math.max(Math.round(t), 1), GAME_LEVEL_POLICY.MAX_TIER) : 1;
    const record = (v: unknown): Record<number, number> => {
      const out: Record<number, number> = {};
      if (v && typeof v === 'object') {
        for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
          const n = Number(k);
          if (Number.isFinite(n) && typeof val === 'number' && Number.isFinite(val)) out[n] = val;
        }
      }
      return out;
    };
    return {
      unlockedTier: clampTier(r.unlockedTier),
      starsByTier: record(r.starsByTier),
      bestScoreByTier: record(r.bestScoreByTier),
      updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : empty.updatedAt,
    };
  }

  public static getGameProgressStore(): GameProgressStore {
    const emptyStore: GameProgressStore = {
      version: GAME_PROGRESS_SCHEMA_VERSION,
      games: {},
      updatedAt: new Date().toISOString(),
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS);
      if (!raw) return emptyStore;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const games: Record<string, GameLevelProgress> = {};
      if (parsed.games && typeof parsed.games === 'object') {
        for (const [id, val] of Object.entries(parsed.games as Record<string, unknown>)) {
          games[id] = StorageService.sanitizeGameProgress(val);
        }
      }
      return {
        version: typeof parsed.version === 'number' ? parsed.version : GAME_PROGRESS_SCHEMA_VERSION,
        games,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : emptyStore.updatedAt,
      };
    } catch {
      return emptyStore;
    }
  }

  public static saveGameProgressStore(store: GameProgressStore) {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_PROGRESS, JSON.stringify(store));
    } catch {
      // Ignore
    }
  }

  /** Highest tier a child may currently start for a game (defaults to 1). */
  public static getGameProgress(gameId: string): GameLevelProgress {
    const store = StorageService.getGameProgressStore();
    return store.games[gameId] ?? {
      unlockedTier: 1,
      starsByTier: {},
      bestScoreByTier: {},
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Record a finished tier. Only ever improves progress: stars and best score
   * are kept at their best values, and the next tier unlocks (up to MAX_TIER).
   */
  public static completeGameTier(gameId: string, tier: number, stars: number, score = 0): GameLevelProgress {
    const store = StorageService.getGameProgressStore();
    const current = store.games[gameId] ?? {
      unlockedTier: 1,
      starsByTier: {},
      bestScoreByTier: {},
      updatedAt: new Date().toISOString(),
    };
    const safeTier = Math.min(Math.max(Math.round(tier), 1), GAME_LEVEL_POLICY.MAX_TIER);
    const safeStars = Math.min(Math.max(Math.round(stars), 1), 3);
    const next: GameLevelProgress = {
      unlockedTier: Math.max(current.unlockedTier, Math.min(safeTier + 1, GAME_LEVEL_POLICY.MAX_TIER)),
      starsByTier: { ...current.starsByTier, [safeTier]: Math.max(current.starsByTier[safeTier] ?? 0, safeStars) },
      bestScoreByTier: { ...current.bestScoreByTier, [safeTier]: Math.max(current.bestScoreByTier[safeTier] ?? 0, Math.round(score)) },
      updatedAt: new Date().toISOString(),
    };
    store.games[gameId] = next;
    store.updatedAt = next.updatedAt;
    StorageService.saveGameProgressStore(store);
    return next;
  }

  /** Reset one (or all) games back to fresh level-1 progress. */
  public static resetGameProgress(gameId?: string) {
    const store = StorageService.getGameProgressStore();
    if (gameId) {
      delete store.games[gameId];
    } else {
      store.games = {};
    }
    store.updatedAt = new Date().toISOString();
    StorageService.saveGameProgressStore(store);
  }

  // --- T02/B5 play nonce: how many times each tier was started -------------
  // Builders mix the nonce into their seed so every replay shuffles
  // differently, while tests stay deterministic by passing an explicit seed.

  private static readNonceStore(): Record<string, Record<string, number>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_NONCE);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          const out: Record<string, Record<string, number>> = {};
          for (const [gid, val] of Object.entries(parsed)) {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              const tiers: Record<string, number> = {};
              for (const [tk, n] of Object.entries(val as Record<string, unknown>)) {
                if (typeof n === 'number' && Number.isFinite(n) && n >= 0) tiers[tk] = Math.floor(n);
              }
              out[gid] = tiers;
            }
          }
          return out;
        }
      }
    } catch {
      // Corrupt nonce store degrades to empty — never blocks play.
    }
    return {};
  }

  /** Current play count for a game tier (0 = never started). */
  public static getPlayNonce(gameId: string, tier: number): number {
    const store = StorageService.readNonceStore();
    return store[gameId]?.[String(Math.round(tier))] ?? 0;
  }

  /** Records one more play of a tier; returns the new nonce. */
  public static bumpPlayNonce(gameId: string, tier: number): number {
    const store = StorageService.readNonceStore();
    const key = String(Math.round(tier));
    const next = (store[gameId]?.[key] ?? 0) + 1;
    store[gameId] = { ...(store[gameId] ?? {}), [key]: next };
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_NONCE, JSON.stringify(store));
    } catch {
      // Ignore
    }
    return next;
  }

  // --- T08 game first-seen dates: when the child first saw a game ----------
  private static sanitizeGameFirstSeen(raw: unknown): Record<string, string> {
    const out: Record<string, string> = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof k !== 'string' || !k.trim()) continue;
      if (!isRealDateKey(v)) continue;
      out[k] = v;
    }
    return out;
  }

  private static readGameFirstSeenStoreRaw(): Record<string, string> | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_FIRST_SEEN);
      if (raw === null) return null;
      const parsed = JSON.parse(raw) as unknown;
      return StorageService.sanitizeGameFirstSeen(parsed);
    } catch {
      return {};
    }
  }

  /** Baseline: every game in the current catalog is considered already seen (>7 days ago). */
  private static baselineGameFirstSeen(): Record<string, string> {
    const oldKey = localDateKey(new Date(Date.now() - 8 * 86400000));
    const out: Record<string, string> = {};
    for (const g of GAMES_CATALOG) out[g.id] = oldKey;
    return out;
  }

  public static getGameFirstSeenStore(): Record<string, string> {
    let raw: string | null = null;
    try { raw = localStorage.getItem(STORAGE_KEYS.GAME_FIRST_SEEN); } catch { raw = null; }
    if (raw === null) {
      const baseline = StorageService.baselineGameFirstSeen();
      try { localStorage.setItem(STORAGE_KEYS.GAME_FIRST_SEEN, JSON.stringify(baseline)); } catch {}
      return baseline;
    }
    try {
      return StorageService.sanitizeGameFirstSeen(JSON.parse(raw));
    } catch {
      return {};
    }
  }

  public static getGameFirstSeen(gameId: string): string | null {
    const store = StorageService.getGameFirstSeenStore();
    return typeof store[gameId] === 'string' ? store[gameId] : null;
  }

  public static markGameSeen(gameId: string, dateKey: string = localDateKey()): string {
    if (typeof gameId !== 'string' || !gameId.trim()) return localDateKey();
    const store = StorageService.getGameFirstSeenStore();
    if (!store[gameId]) {
      store[gameId] = dateKey;
      try { localStorage.setItem(STORAGE_KEYS.GAME_FIRST_SEEN, JSON.stringify(store)); } catch {}
    }
    return store[gameId];
  }

  /** A game is "NEW" for 7 days after the child first sees it. First call marks it seen. */
  public static isGameNew(gameId: string, now: Date = new Date()): boolean {
    const today = localDateKey(now);
    let seen = StorageService.getGameFirstSeen(gameId);
    if (!seen) {
      seen = StorageService.markGameSeen(gameId, today);
      return true;
    }
    const diff = diffDateKeys(seen, today);
    return diff !== null && diff >= 0 && diff <= 7;
  }

  // Aliases for differing naming conventions.
  public static isNewGame(gameId: string, now?: Date): boolean { return StorageService.isGameNew(gameId, now ?? new Date()); }
  public static gameFirstSeen(gameId: string): string | null { return StorageService.getGameFirstSeen(gameId); }
  public static setGameFirstSeen(gameId: string, dateKey?: string): string { return StorageService.markGameSeen(gameId, dateKey ?? localDateKey()); }
  public static recordGameSeen(gameId: string, dateKey?: string): string { return StorageService.markGameSeen(gameId, dateKey ?? localDateKey()); }

  /**
   * T02/B2 — fair replay economy for tiered games.
   *
   * The hook persists best stars via completeGameTier; this awards ONLY the
   * delta when the child beats their record, plus a small practice XP (~20%)
   * on replays. First clears grant the full XP. `prevStars` must be the best
   * BEFORE this completion (captured by useGameStage).
   */
  public static recordTierReward(
    gameId: string,
    tier: number,
    stars: number,
    xpFull: number,
    score = 0,
    prevStars = 0
  ): TierRewardReceipt {
    const safeStars = Math.min(Math.max(Math.round(stars), 1), 3);
    const safePrev = Math.min(Math.max(Math.round(prevStars), 0), 3);
    const isFirstClear = safePrev === 0;
    const isNewBest = safeStars > safePrev;
    const starsAwarded = isNewBest ? safeStars - safePrev : 0;
    const xpAwarded = isFirstClear ? Math.round(xpFull) : Math.max(1, Math.round(xpFull * 0.2));
    void score;

    const profile = StorageService.getChildProfile();
    profile.xp += xpAwarded;
    profile.stars += starsAwarded;
    StorageService.saveChildProfile(profile);

    const analytics = StorageService.getAnalytics();
    analytics.gamesPlayedCount += 1;
    StorageService.saveAnalytics(analytics);

    // T18A — quest game (kể cả game Tiếng Anh) qua engine chung.
    const game = GAMES_CATALOG.find((g) => g.id === gameId);
    StorageService.recordQuestEvent({ kind: 'game', englishGame: game?.category === 'english' });
    if (xpAwarded > 0) {
      StorageService.addRewardHistory({ type: 'xp', amount: xpAwarded, description: `Game ${gameId} tier ${tier} ${isFirstClear ? 'lần đầu' : 'luyện lại'}`, itemId: `${gameId}_t${tier}` });
    }
    if (starsAwarded > 0) {
      StorageService.addRewardHistory({ type: 'stars', amount: starsAwarded, description: `Sao game ${gameId} tier ${tier}`, itemId: `${gameId}_t${tier}` });
    }
    return { starsAwarded, xpAwarded, isFirstClear, isNewBest };
  }

  // Record played mini game
  public static recordGamePlayed(xpReward: number = 15, starReward: number = 1, gameId?: string) {
    const profile = StorageService.getChildProfile();
    profile.xp += xpReward;
    profile.stars += starReward;
    StorageService.saveChildProfile(profile);

    const motivation = StorageService.getMotivationState();
    motivation.starsEarnedTotal += Math.max(0, Math.round(starReward));
    StorageService.saveMotivationState(motivation);

    const analytics = StorageService.getAnalytics();
    analytics.gamesPlayedCount += 1;
    StorageService.saveAnalytics(analytics);

    // T18A — quest game qua engine chung (biết game Tiếng Anh khi có gameId).
    const game = typeof gameId === 'string' ? GAMES_CATALOG.find((g) => g.id === gameId) : undefined;
    StorageService.recordQuestEvent({ kind: 'game', englishGame: game?.category === 'english' });
    if (xpReward > 0) {
      StorageService.addRewardHistory({ type: 'xp', amount: xpReward, description: `Chơi game ${gameId ?? 'mini'}`, itemId: gameId });
    }
    if (starReward > 0) {
      StorageService.addRewardHistory({ type: 'stars', amount: starReward, description: `Sao game ${gameId ?? 'mini'}`, itemId: gameId });
    }
  }

  /** Distinct local-day keys on which the child finished a daily review. */
  public static getReviewCompletedDays(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REVIEW_DAYS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((d): d is string => isRealDateKey(d));
        }
      }
    } catch {
      // Ignore — fall through to empty
    }
    return [];
  }

  public static saveReviewCompletedDays(days: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEW_DAYS, JSON.stringify(days));
    } catch {
      // Ignore
    }
  }

  /**
   * T01/B10 — records one finished daily-review session for today
   * (idempotent per day) and re-checks achievements.
   */
  public static recordDailyReviewCompleted(dateKey: string = getTodayString()): string[] {
    const days = StorageService.getReviewCompletedDays();
    if (!days.includes(dateKey)) {
      days.push(dateKey);
      StorageService.saveReviewCompletedDays(days);
    }
    // T18A — quest "Ôn tập hôm nay" qua engine chung.
    StorageService.recordQuestEvent({ kind: 'review' });
    return days;
  }

  /**
   * T18A — Ghi số câu vừa ôn xong (DailyReview gọi 1 lần khi bé làm xong
   * bộ ôn tập) để quest "Ôn 5/10 câu" có tiến trình thật.
   */
  public static recordReviewQuestions(count: number): string[] {
    const safe = typeof count === 'number' && Number.isFinite(count)
      ? Math.min(Math.max(Math.round(count), 0), 60)
      : 0;
    if (safe <= 0) return [];
    const motivation = StorageService.getMotivationState();
    motivation.daily.reviewQuestions += safe;
    StorageService.saveMotivationState(motivation);
    const quests = StorageService.getDailyQuests();
    const { quests: next, newlyCompleted } = applyQuestEvent(
      quests,
      { kind: 'review_question' },
      motivation.daily
    );
    if (next !== quests) StorageService.saveDailyQuests(next);
    if (newlyCompleted.length > 0) {
      const profile = StorageService.getChildProfile();
      for (const q of newlyCompleted) {
        profile.stars += q.rewardStars;
        profile.xp += q.rewardXp;
        motivation.starsEarnedTotal += q.rewardStars;
        StorageService.addRewardHistory({ type: 'quest', amount: q.rewardStars, description: `Hoàn thành nhiệm vụ ôn tập: ${q.title}`, itemId: q.id });
      }
      motivation.questsCompletedTotal += newlyCompleted.length;
      StorageService.saveChildProfile(profile);
      StorageService.saveMotivationState(motivation);
    }
    StorageService.checkAchievements();
    return newlyCompleted.map((q) => q.id);
  }

  /**
   * T01/B10 — records a finished weekly challenge (idempotent per id)
   * and re-checks achievements.
   */
  public static recordWeeklyChallengeCompleted(challengeId: string): void {
    const profile = StorageService.getChildProfile();
    if (!profile.completedWeeklyChallenges.includes(challengeId)) {
      profile.completedWeeklyChallenges = [...profile.completedWeeklyChallenges, challengeId];
      StorageService.saveChildProfile(profile);
    }
    // T18A — quest "Thử Thách Tuần" qua engine chung.
    StorageService.recordQuestEvent({ kind: 'weekly' });
    StorageService.addRewardHistory({ type: 'xp', amount: 0, description: `Hoàn thành Thử Thách Tuần ${challengeId}`, itemId: challengeId });
  }

  /**
   * T18A — Chấm toàn bộ 35 rule thành tựu trên ảnh chụp số liệu thật.
   * 8 rule cũ cho kết quả y hệt trước đây (test T01 vẫn xanh).
   */
  public static checkAchievements() {
    const profile = StorageService.getChildProfile();
    const achs = StorageService.getAchievements();
    const stats = StorageService.buildMotivationStats();
    const newlyUnlocked = evaluateNewAchievements(
      stats,
      achs.filter((a) => a.unlocked).map((a) => a.id)
    );
    if (newlyUnlocked.length === 0) return;

    const now = new Date().toISOString();
    const unlockedSet = new Set(newlyUnlocked);
    for (const a of achs) {
      if (unlockedSet.has(a.id)) {
        a.unlocked = true;
        a.unlockedAt = now;
      }
    }
    const xpReward = xpForUnlocks(newlyUnlocked);
    profile.xp += xpReward;
    StorageService.saveAchievements(achs);
    StorageService.saveChildProfile(profile);
    if (xpReward > 0) {
      StorageService.addRewardHistory({ type: 'xp', amount: xpReward, description: `Mở khóa thành tựu: ${newlyUnlocked.join(', ')}`, itemId: newlyUnlocked.join(',') });
    }
  }

  public static getCompetitionHistory(): CompetitionHistoryStore {
    const emptyStore: CompetitionHistoryStore = {
      examResults: [],
      practicedSkills: {},
      speedTrialsCompleted: 0,
      remediationPlans: [],
    };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPETITION_HISTORY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return {
            examResults: Array.isArray(parsed.examResults) ? parsed.examResults : [],
            practicedSkills: parsed.practicedSkills && typeof parsed.practicedSkills === 'object' ? parsed.practicedSkills : {},
            speedTrialsCompleted: typeof parsed.speedTrialsCompleted === 'number' ? parsed.speedTrialsCompleted : 0,
            remediationPlans: Array.isArray(parsed.remediationPlans) ? parsed.remediationPlans : [],
          };
        }
      }
    } catch {
      // Safe fallback
    }
    return emptyStore;
  }

  public static saveCompetitionHistory(store: CompetitionHistoryStore) {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPETITION_HISTORY, JSON.stringify(store));
    } catch {
      // Storage full handled safely
    }
  }

  /**
   * Idempotently records an exam result and awards profile rewards.
   */
  public static recordCompetitionResult(
    result: CompetitionExamResult,
    xpReward: number,
    starsReward: number
  ) {
    const store = StorageService.getCompetitionHistory();
    const existingIndex = store.examResults.findIndex((e) => e.id === result.id);

    if (existingIndex >= 0) {
      // Already recorded: avoid duplicate rewards
      store.examResults[existingIndex] = result;
      StorageService.saveCompetitionHistory(store);
      return;
    }

    // Append new result
    store.examResults.unshift(result);
    if (store.examResults.length > 30) {
      store.examResults.pop();
    }

    if (result.blueprintId.includes('speed')) {
      store.speedTrialsCompleted += 1;
    }

    // Track practiced skills
    Object.keys(result.skillBreakdown).forEach((sId) => {
      const st = result.skillBreakdown[sId];
      if (!store.practicedSkills[sId]) {
        store.practicedSkills[sId] = { attempts: 0, correct: 0, lastPracticed: new Date().toISOString() };
      }
      store.practicedSkills[sId].attempts += st.total;
      store.practicedSkills[sId].correct += st.correct;
      store.practicedSkills[sId].lastPracticed = new Date().toISOString();
    });

    StorageService.saveCompetitionHistory(store);

    // Reward child profile
    const profile = StorageService.getChildProfile();
    profile.xp += xpReward;
    profile.stars += starsReward;
    StorageService.saveChildProfile(profile);

    // Update analytics
    const analytics = StorageService.getAnalytics();
    analytics.totalQuestionsAnswered += result.totalQuestions;
    analytics.totalCorrect += result.correctCount;

    // Check errors
    result.errorAnalysis.forEach((err) => {
      analytics.recentErrors.unshift({
        questionId: err.questionId,
        subject: result.subject,
        prompt: err.prompt,
        timestamp: new Date().toISOString(),
      });
      if (analytics.recentErrors.length > 20) {
        analytics.recentErrors.pop();
      }
    });

    StorageService.saveAnalytics(analytics);
    StorageService.checkAchievements();
    if (xpReward > 0) {
      StorageService.addRewardHistory({ type: 'xp', amount: xpReward, description: `Thi đấu ${result.examTitle}`, itemId: result.id });
    }
    if (starsReward > 0) {
      StorageService.addRewardHistory({ type: 'stars', amount: starsReward, description: `Sao thi đấu ${result.examTitle}`, itemId: result.id });
    }
  }

  // ==========================================================
  // T18A — Máy gắp sticker, quà level, mua đồ Shop (UI ở T18B/T18C)
  // ==========================================================

  /** Level + danh hiệu + thanh XP của bé từ tổng XP (đọc nhanh cho Header T18B). */
  public static getLevelInfo() {
    const profile = StorageService.getChildProfile();
    const p = levelProgress(profile.xp);
    return {
      ...p,
      title: levelTitle(p.level),
      pending: pendingLevels(profile.xp, StorageService.getMotivationState().claimedLevelRewards),
    };
  }

  /**
   * T18C — Ghi nhận phần thưởng vào lịch sử (tối đa 50 mục, mới nhất lên đầu).
   */
  private static addRewardHistory(entry: Omit<RewardHistoryEntry, 'date'>): void {
    const settings = StorageService.getParentSettings();
    if (!settings.rewardsEnabled) return;
    const today = getTodayString();
    const history = settings.rewardHistory ?? [];
    history.unshift({ date: today, ...entry });
    if (history.length > 50) history.length = 50;
    StorageService.saveParentSettings({ ...settings, rewardHistory: history });
  }

  /**
   * Quay máy gắp sticker: tốn 1 vé, tối đa lượt/ngày theo cài đặt phụ huynh,
   * không trùng tới khi đủ 60 sticker. Trùng thì cứ 5 sticker trùng +2 sao an ủi.
   */
  public static drawGacha(rng?: RandomFn): GachaResult {
    const settings = StorageService.getParentSettings();
    const maxDaily = settings.maxGachaPerDay > 0 ? settings.maxGachaPerDay : 5;
    const profile = StorageService.getChildProfile();
    const motivation = StorageService.getMotivationState();
    if (profile.tickets < 1) return { ok: false, reason: 'no-ticket' };
    if (motivation.daily.gachaDraws >= maxDaily) {
      return { ok: false, reason: 'daily-limit' };
    }
    const { stickerId, isNew } = drawSticker(motivation.stickers, rng);
    profile.tickets -= 1;
    motivation.stickers[stickerId] = (motivation.stickers[stickerId] ?? 0) + 1;
    let consolationStars = 0;
    if (!isNew) {
      const dupes = Object.values(motivation.stickers).reduce((a, n) => a + Math.max(0, n - 1), 0);
      if (dupes % 5 === 0) {
        consolationStars = 2;
        profile.stars += 2;
        motivation.starsEarnedTotal += 2;
        StorageService.addRewardHistory({ type: 'stars', amount: 2, description: '5 sticker trùng tặng 2 sao an ủi', itemId: stickerId });
      }
    }
    StorageService.saveChildProfile(profile);
    StorageService.saveMotivationState(motivation);
    StorageService.recordQuestEvent({ kind: 'gacha' });
    if (stickerId) {
      StorageService.addRewardHistory({ type: 'sticker', amount: 1, description: `Nhận sticker từ máy gắp`, itemId: stickerId });
    }
    return { ok: true, reason: 'ok', stickerId, isNew, consolationStars };
  }

  /**
   * Nhận quà các level đã đạt (mỗi level 1 lần): sao + vé vào túi bé,
   * lượt gắp sticker thưởng tự quay vào Album. Trả về để UI ăn mừng (T18B).
   */
  public static claimLevelRewards(rng?: RandomFn): LevelClaimResult {
    const profile = StorageService.getChildProfile();
    const motivation = StorageService.getMotivationState();
    const pending = pendingLevels(profile.xp, motivation.claimedLevelRewards);
    const result: LevelClaimResult = { claimed: [], stars: 0, tickets: 0, stickerIds: [] };
    for (const level of pending) {
      const reward = rewardForLevel(level);
      result.claimed.push(level);
      result.stars += reward.stars;
      result.tickets += reward.tickets;
      for (let i = 0; i < reward.stickerDraws; i += 1) {
        const { stickerId } = drawSticker(motivation.stickers, rng);
        motivation.stickers[stickerId] = (motivation.stickers[stickerId] ?? 0) + 1;
        result.stickerIds.push(stickerId);
      }
    }
    if (result.claimed.length === 0) return result;
    profile.stars += result.stars;
    profile.tickets += result.tickets;
    motivation.claimedLevelRewards = [...motivation.claimedLevelRewards, ...result.claimed].sort((a, b) => a - b);
    motivation.starsEarnedTotal += result.stars;
    StorageService.saveChildProfile(profile);
    StorageService.saveMotivationState(motivation);
    StorageService.checkAchievements();
    if (result.stars > 0) {
      StorageService.addRewardHistory({ type: 'stars', amount: result.stars, description: `Quà level ${result.claimed.join(', ')}`, itemId: `level_${result.claimed[0]}` });
    }
    if (result.tickets > 0) {
      StorageService.addRewardHistory({ type: 'tickets', amount: result.tickets, description: `Quà level ${result.claimed.join(', ')}`, itemId: `level_${result.claimed[0]}` });
    }
    for (const stickerId of result.stickerIds) {
      StorageService.addRewardHistory({ type: 'sticker', amount: 1, description: `Sticker từ quà level`, itemId: stickerId });
    }
    return result;
  }

  /**
   * Mua 1 món Shop bằng sao (đủ level mới mua được, mỗi món 1 lần).
   * Mặc đồ cho Gấu do UI gọi recordDressUp để xong quest vui.
   */
  public static buyShopItem(itemId: string): ShopBuyResult {
    const profile = StorageService.getChildProfile();
    const check = canBuyShopItem(itemId, profile.unlockedItems, profile.stars, xpToLevel(profile.xp));
    if (!check.ok) return { ...check };
    const item = SHOP_MAP.get(itemId);
    if (!item) return { ok: false, reason: 'unknown-item' };
    profile.stars -= item.priceStars;
    profile.unlockedItems = [...profile.unlockedItems, itemId];
    StorageService.saveChildProfile(profile);
    const motivation = StorageService.getMotivationState();
    motivation.shopBoughtTotal += 1;
    StorageService.saveMotivationState(motivation);
    StorageService.checkAchievements();
    StorageService.addRewardHistory({ type: 'shop_item', amount: 1, description: `Mua ${item.name} (${item.priceStars} sao)`, itemId: itemId });
    return { ok: true, reason: 'ok' };
  }

  public static resetProgress() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHILD_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
      localStorage.removeItem(STORAGE_KEYS.DAILY_QUESTS);
      localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
      localStorage.removeItem(STORAGE_KEYS.COMPETITION_HISTORY);
      localStorage.removeItem(STORAGE_KEYS.LEARNING_OS_STORE);
      localStorage.removeItem(STORAGE_KEYS.READING_STORE);
      localStorage.removeItem(STORAGE_KEYS.KIDBOX_STORE);
      localStorage.removeItem(STORAGE_KEYS.ENGLISH_MASTERY_STORE);
      // T02B/B14 — parent reset also clears tier/star progress and the
      // play-nonce store so a fresh start really starts fresh.
      localStorage.removeItem(STORAGE_KEYS.GAME_PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.GAME_NONCE);
      // T18A — kho động lực cũng về trắng (sticker, khiên, số liệu ngày).
      localStorage.removeItem(STORAGE_KEYS.MOTIVATION);
    } catch {
      // Storage unavailable: nothing to clear.
    }
  }

}

// T18A — kết quả trả về của API động lực (đặt ngoài class vì
// TypeScript không cho khai báo interface trong class body).
export interface GachaResult {
  ok: boolean;
  reason: 'no-ticket' | 'daily-limit' | 'ok';
  stickerId?: string;
  isNew?: boolean;
  /** Sao an ủi khi gắp trùng (mỗi 5 sticker trùng +2 sao). */
  consolationStars?: number;
}

export interface LevelClaimResult {
  claimed: number[];
  stars: number;
  tickets: number;
  stickerIds: string[];
}

export interface ShopBuyResult {
  ok: boolean;
  reason: 'unknown-item' | 'already-owned' | 'level-locked' | 'not-enough-stars' | 'ok';
  missingLevels?: number;
  missingStars?: number;
}
