import type { DailyQuestType, ShopItemType } from './motivation';

export type SubjectType = 'tieng-viet' | 'toan' | 'english' | 'cuoc-song';

export type MasteryStatus = 'NOT_STARTED' | 'LEARNING' | 'PRACTICING' | 'MASTERED' | 'NEEDS_REVIEW';

/** Session profiles for the adaptive practice engine. */
export type SessionProfileKind = 'QUICK' | 'STANDARD' | 'DEEP' | 'EXTENDED';

export type QuestionType =
  | 'multiple-choice'
  | 'drag-drop'
  | 'fill-blank'
  | 'matching'
  | 'ordering'
  | 'image-choice'
  | 'audio-choice'
  | 'math-expression'
  | 'true-false'
  | 'classify';

/** SVG visual components a question may reference (T11A, T11B). */
export type VisualKind =
  | 'TenFrame'
  | 'NumberLine'
  | 'PlaceValueBlocks'
  | 'Ruler'
  | 'ClockFace';

export interface Question {
   id: string;
   subject: SubjectType;
   topicId: string;
   skillId: string;
   difficulty: 1 | 2 | 3;
   type: QuestionType;
   prompt: string;
   audioPrompt?: string; // Text to be read by TTS
   mediaEmoji?: string;
   options?: string[];
   correctAnswer: string | string[]; // Can be string or array for ordering/matching
   pairs?: { left: string; right: string }[];
   matchingPairs?: { left: string; right: string }[];
   orderingItems?: string[];
   categoryBuckets?: string[];
    hint?: string;
    explanation?: string;
    visual?: {
      kind: VisualKind;
      props?: Record<string, unknown>;
    };
    /**
     * T11A/T11C — machine-checkable arithmetic fact for every calculation
     * question: the correct answer must equal `a op b`, stay within 0–100,
     * and be a no-carry operation (Grade 1, GDPT 2018).
     * Machine-checkable arithmetic payload (CONTENT_GUIDE §3, T11A/T11B).
     * A test recomputes `a op b` and compares it with `Number(correctAnswer)`,
     * so a hand-written arithmetic answer can never silently drift.
     */
    calc?: { a: number; op: '+' | '-'; b: number };
}

export interface Lesson {
  id: string;
  topicId: string;
  subject: SubjectType;
  title: string;
  description: string;
  mascotTip: string;
  questions: Question[];
  xpReward: number;
  starReward: number;
}

export interface Topic {
  id: string;
  subject: SubjectType;
  title: string;
  subtitle: string;
  iconEmoji: string;
  color: string;
  skills: string[];
  lessons: Lesson[];
}

export interface SkillMastery {
  skillId: string;
  skillName: string;
  subject: SubjectType;
  attempts: number;
  correctCount: number;
  wrongCount: number;
  status: MasteryStatus;
  lastPracticed: string; // ISO string
}

export interface DailyQuest {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  rewardStars: number;
  rewardXp: number;
  completed: boolean;
  type: DailyQuestType;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
}

export interface AvatarItem {
  id: string;
  name: string;
  type: ShopItemType;
  emoji: string;
  priceStars: number;
  unlocked: boolean;
  /** Level bé tối thiểu để mở bán (mặc định 1 = bán ngay). */
  minLevel?: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  grade: number; // 1
  avatarBase: 'bear' | 'fox' | 'rabbit' | 'owl';
  equipped: {
    hat?: string;
    glasses?: string;
    shirt?: string;
    backpack?: string;
    pet?: string;
    background?: string;
    frame?: string;
  };
  xp: number;
  stars: number;
  gems: number;
  tickets: number;
  streak: number;
  lastActiveDate: string;
  unlockedItems: string[];
  completedLessons: string[];
  completedWeeklyChallenges: string[];
  dailyChestClaimedDate?: string;
  /** Stars earned per lesson (1–3). Key = lessonId, value = star count. */
  lessonStars: Record<string, number>;
  /** Whether a topic chest has been opened. Key = topicId, value = true if claimed. */
  chestState: Record<string, boolean>;
  /** Parent override to unlock all lessons (bypasses sequential gating). */
  unlockAllLessons: boolean;
  /**
   * True when the profile was populated by the parent-only demo seeder.
   * Demo figures are fabricated for showcasing reports and must never be
   * presented to the child (or to parents) as real learner progress.
   */
  isDemoData?: boolean;
}

export interface LearningAnalytics {
  totalMinutesSpent: number;
  minutesToday: number;
  todayDate: string;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  lessonsCompletedCount: number;
  gamesPlayedCount: number;
  skillMastery: Record<string, SkillMastery>;
  recentErrors: {
    questionId: string;
    subject: SubjectType;
    prompt: string;
    timestamp: string;
  }[];
}

export interface ParentSettings {
  dailyLimitMinutes: number; // 10, 15, 20, 30, 0 = unlimited
  soundEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  difficultyScale: 'easy' | 'normal' | 'advanced';
  /**
   * Read each question aloud automatically (§20).
   *
   * Default ON with an explicit rationale: the audience is 6-year-olds who are
   * still LEARNING to read, so silent questions lock pre-readers out of the
   * whole app. This is the documented accessibility mode that permits
   * auto-play; a parent can switch it OFF and questions stay behind the
   * user-initiated "Nghe câu hỏi" button. Mute / voice-off still wins.
   */
  questionAutoplay: boolean;
  /**
   * Default practice-session length offered to the child (Adaptive Learning
   * Upgrade). QUICK ≈ 8-10 câu, STANDARD ≈ 15-20, DEEP ≈ 25-30, EXTENDED ≈ 35-40.
   * The child can always pick a shorter session; a parent can lower the default.
   */
  defaultSessionProfile: SessionProfileKind;
  /** Allow L4-L5 challenge questions once prerequisites are demonstrated. */
  allowAdvancedQuestions: boolean;
  /** How much spaced review a session mixes in. */
  reviewIntensity: 'light' | 'standard' | 'intensive';
  /** Offer an explicit break/pause inside long sessions (never force a 6-year-old). */
  optionalBreaks: boolean;
  /** Night mode (eye-friendly dark theme). */
  nightMode: boolean;

  // T18C — Hệ thống động lực
  /** Giới hạn số lượt quay máy gắp sticker mỗi ngày (0 = không giới hạn). */
  maxGachaPerDay: number;
  /** Bật/tắt toàn bộ phần thưởng (sao, XP, vé, sticker, đồ Shop). */
  rewardsEnabled: boolean;
  /** Lịch sử phần thưởng gần đây (tối đa 50 mục). */
  rewardHistory: RewardHistoryEntry[];

  // T19 — Âm nhạc nền (mặc định TẮT, phụ huynh/bé tự bật)
  bgMusicEnabled: boolean;
}

export interface RewardHistoryEntry {
  date: string; // YYYY-MM-DD
  type: 'stars' | 'xp' | 'tickets' | 'sticker' | 'shop_item' | 'level_reward' | 'quest' | 'chest' | 'gacha';
  amount: number;
  description: string;
  itemId?: string; // stickerId, shopItemId, level, questId
}

/**
 * Per-game level progression (mini-game arcade). `unlockedTier` is the highest
 * tier the child may start, `starsByTier` records the best star result per tier
 * (keyed by tier id, 1..GAME_LEVEL_POLICY.MAX_TIER).
 */
export interface GameLevelProgress {
  unlockedTier: number;
  starsByTier: Record<number, number>;
  bestScoreByTier: Record<number, number>;
  updatedAt: string;
}

/** Versioned store for every game's level progress (own localStorage key). */
export interface GameProgressStore {
  version: number;
  games: Record<string, GameLevelProgress>;
  updatedAt: string;
}

export type ActiveScreen =
  | 'home'
  | 'world_map'
  | 'subject'
  | 'games'
  | 'daily_review'
  | 'reading_fluency'
  | 'weekly_challenge'
  | 'competition'
  | 'achievements'
  | 'avatar_shop'
  | 'kidbox_companion'
  | 'sticker_album'
  | 'gacha_machine'
  | 'streak_calendar'
  | 'chess'
  | 'cotuong'
  | 'english_ioe';

export * from './competition';
export * from './reading';
export * from './learningOS';
export * from './decisionEngine';
export * from './motivation';
export * from './englishMastery';
