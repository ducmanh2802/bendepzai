/**
 * T18A — Hệ thống động lực: types dùng chung cho sticker, level bé,
 * nhiệm vụ ngày, chuỗi ngày + khiên, shop và thành tựu.
 *
 * Tất cả thuật ngữ tiếng Việt trong file này hướng tới bé lớp 1:
 * vui, ngắn gọn, không có từ buồn/đáng sợ.
 */

import type { SubjectType } from './index';

/** Độ hiếm của sticker trong Album. */
export type StickerRarity = 'thuong' | 'hiem' | 'sieu-hiem';

/** 6 bộ sticker của Album (mỗi bộ đúng 10 sticker). */
export type StickerSetId =
  | 'dong-vat'
  | 'do-an-tet'
  | 'phuong-tien'
  | 'vu-tru'
  | 'khung-long'
  | 'nghe-nghiep';

export interface StickerSet {
  id: StickerSetId;
  name: string;
  emoji: string;
  description: string;
}

export interface Sticker {
  id: string;
  setId: StickerSetId;
  name: string;
  emoji: string;
  rarity: StickerRarity;
}

/** Loại món đồ trong Shop (mở rộng từ AvatarItem cũ). */
export type ShopItemType =
  | 'hat'
  | 'glasses'
  | 'shirt'
  | 'backpack'
  | 'pet'
  | 'background'
  | 'frame';

export interface ShopItem {
  id: string;
  name: string;
  type: ShopItemType;
  emoji: string;
  priceStars: number;
  /** Level bé tối thiểu để mở bán (món mở theo level — T18 §5). */
  minLevel: number;
  unlocked: boolean;
}

/** Loại tiến trình của nhiệm vụ ngày (mở rộng từ DailyQuest cũ). */
export type DailyQuestType =
  | 'lesson_viet'
  | 'lesson_math'
  | 'lesson_english'
  | 'lesson_life'
  | 'lesson_any'
  | 'play_game'
  | 'game_english'
  | 'daily_review'
  | 'review_5q'
  | 'read_story'
  | 'combo_5'
  | 'correct_5'
  | 'star_3'
  | 'weekly_try'
  | 'fun';

export interface QuestPoolEntry {
  id: string;
  title: string;
  type: DailyQuestType;
  targetCount: number;
  rewardStars: number;
  rewardXp: number;
  /** Môn học mà nhiệm vụ này rèn (rỗng = nhiệm vụ vui chung). */
  subjects: SubjectType[];
  /** Nhiệm vụ vui (luôn có 1 trong 4 nhiệm vụ mỗi ngày). */
  isFun: boolean;
}

/** Sự kiện tiến trình thô mà app ghi nhận (engine ánh xạ sang quest type). */
export type QuestEventKind =
  | 'lesson'
  | 'game'
  | 'review'
  | 'review_question'
  | 'read'
  | 'answer'
  | 'water'
  | 'dressup'
  | 'chest'
  | 'gacha'
  | 'weekly';

export interface QuestEvent {
  kind: QuestEventKind;
  subject?: SubjectType;
  /** true khi câu trả lời đúng (chỉ dùng cho kind 'answer'). */
  correct?: boolean;
  /** true khi game thuộc môn Tiếng Anh (chỉ dùng cho kind 'game'). */
  englishGame?: boolean;
  /** Số sao bé đạt trong bài (chỉ dùng cho kind 'lesson', để chấm quest 3 sao). */
  stars?: number;
}

/**
 * Kho động lực của bé (1 localStorage key riêng — không chạm vào
 * sao/vé/đồ đã có trong ChildProfile).
 */
export interface MotivationState {
  schemaVersion: string;
  /** Bộ sưu tập sticker: key = stickerId, value = số lượng sở hữu. */
  stickers: Record<string, number>;
  /** Các level đã nhận thưởng (tránh nhận trùng). */
  claimedLevelRewards: number[];
  /** Số khiên giữ chuỗi đang có. */
  shields: number;
  /** Tuần (YYYY-Www) đã nhận khiên gần nhất — 1 khiên/tuần tự động. */
  lastShieldWeek: string | null;
  /** Các ngày (YYYY-MM-DD) bé đã học — lịch chuỗi ngày. */
  streakDays: string[];
  /** Các ngày nghỉ đã được khiên lấp (chuỗi đi qua nhưng không +1). */
  shieldedDays: string[];
  /** Số lần dùng khiên giữ chuỗi từ trước tới nay. */
  shieldsUsedTotal: number;
  /** Tổng số lượt quay máy gắp sticker. */
  gachaDrawsTotal: number;
  /** Tổng số món Shop bé đã mua (không tính 3 món mở sẵn). */
  shopBoughtTotal: number;
  /** Chuỗi đúng liên tiếp tốt nhất mọi thời đại (chấm thành tựu combo). */
  comboBestAll: number;
  /** Tổng số nhiệm vụ ngày đã hoàn thành. */
  questsCompletedTotal: number;
  /** Tổng số sao bé từng kiếm được (kể cả sao đã tiêu trong Shop). */
  starsEarnedTotal: number;
  /** Tổng số truyện bé đã đọc xong. */
  storiesReadTotal: number;
  /** Tổng số rương kho báu bé đã mở. */
  chestsOpenedTotal: number;
  /** Chuỗi ngày dài nhất bé từng đạt. */
  streakBest: number;
  /** Số liệu trong ngày hiện tại (reset khi sang ngày mới). */
  daily: MotivationDaily;
}

export interface MotivationDaily {
  date: string;
  /** Chuỗi câu đúng liên tiếp tốt nhất hôm nay (nhiệm vụ combo). */
  comboBest: number;
  /** Chuỗi câu đúng liên tiếp hiện tại (không lưu lâu). */
  comboNow: number;
  /** Số câu ôn tập đã làm hôm nay. */
  reviewQuestions: number;
  /** Số lượt quay máy gắp hôm nay (giới hạn/ngày — phụ huynh chỉnh ở T18C). */
  gachaDraws: number;
  /** Số câu trả lời đúng hôm nay theo từng môn. */
  correctBySubject: Record<SubjectType, number>;
}

/** Ảnh chụp số liệu để chấm rule thành tựu (thuần dữ liệu, dễ test). */
export interface MotivationStats {
  lessonsTotal: number;
  lessonsViet: number;
  lessonsMath: number;
  lessonsEnglish: number;
  lessonsLife: number;
  lessons3Star: number;
  gamesPlayed: number;
  reviewDays: number;
  weeklyChallenges: number;
  streak: number;
  streakBest: number;
  level: number;
  starsEarnedTotal: number;
  stickersOwned: number;
  stickerSetsCompleted: number;
  shopOwned: number;
  gachaDraws: number;
  questsCompleted: number;
  chestsOpened: number;
  comboBest: number;
  storiesRead: number;
}

/** Rule mở khoá thành tựu: tên field trong MotivationStats + ngưỡng. */
export interface AchievementRule {
  stat: keyof MotivationStats;
  atLeast: number;
}
