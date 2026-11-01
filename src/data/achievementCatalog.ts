/**
 * T18A — 35 thành tựu, mỗi cái có rule mở khoá kiểm thử được
 * (`rule` chấm trên MotivationStats trong achievementEngine).
 * 8 thành tựu đầu giữ nguyên id/tiêu đề/thưởng như trước P42.
 */
import type { Achievement } from '../types';
import type { AchievementRule } from '../types/motivation';

export interface AchievementDef extends Achievement {
  rule: AchievementRule;
}

export const ACHIEVEMENT_CATALOG: readonly AchievementDef[] = [
  // --- 8 thành tựu gốc (giữ nguyên) ---
  { id: 'ach_first_lesson', title: 'Bước Chân Đầu Tiên', description: 'Hoàn thành bài học đầu tiên trên hành trình', icon: '🌟', unlocked: false, xpReward: 50, rule: { stat: 'lessonsTotal', atLeast: 1 } },
  { id: 'ach_viet_master', title: 'Bé Giỏi Tiếng Việt', description: 'Hoàn thành 3 bài học Tiếng Việt', icon: '📚', unlocked: false, xpReward: 80, rule: { stat: 'lessonsViet', atLeast: 3 } },
  { id: 'ach_math_hero', title: 'Thần Đồng Toán Học', description: 'Hoàn thành 3 bài học Toán vui vẻ', icon: '🔢', unlocked: false, xpReward: 80, rule: { stat: 'lessonsMath', atLeast: 3 } },
  { id: 'ach_english_star', title: 'Nhà Khám Phá Tiếng Anh', description: 'Hoàn thành 3 bài học Tiếng Anh', icon: '🇬🇧', unlocked: false, xpReward: 80, rule: { stat: 'lessonsEnglish', atLeast: 3 } },
  { id: 'ach_gamer_fun', title: 'Nhà Vô Địch Trò Chơi', description: 'Chơi và vượt qua 3 trò chơi giáo dục', icon: '🎮', unlocked: false, xpReward: 60, rule: { stat: 'gamesPlayed', atLeast: 3 } },
  { id: 'ach_streak_3', title: 'Ngọn Lửa Chăm Chỉ', description: 'Duy trì chuỗi học 3 ngày liên tiếp', icon: '🔥', unlocked: false, xpReward: 100, rule: { stat: 'streak', atLeast: 3 } },
  { id: 'ach_review_pro', title: 'Trí Nhớ Siêu Phàm', description: 'Hoàn thành Ôn Tập Thông Minh 5 ngày khác nhau', icon: '💡', unlocked: false, xpReward: 75, rule: { stat: 'reviewDays', atLeast: 5 } },
  { id: 'ach_weekly_hero', title: 'Chiến Binh Tuần', description: 'Vượt qua bài Thử Thách Tuần Lớp 1', icon: '🏆', unlocked: false, xpReward: 120, rule: { stat: 'weeklyChallenges', atLeast: 1 } },
  // --- Chuỗi ngày dài ---
  { id: 'ach_streak_7', title: 'Ngọn Lửa Kiên Trì', description: 'Học liên tiếp 7 ngày không nghỉ', icon: '🔥', unlocked: false, xpReward: 150, rule: { stat: 'streak', atLeast: 7 } },
  { id: 'ach_streak_14', title: 'Ngọn Lửa Bền Bỉ', description: 'Học liên tiếp 14 ngày không nghỉ', icon: '🌋', unlocked: false, xpReward: 250, rule: { stat: 'streak', atLeast: 14 } },
  { id: 'ach_streak_30', title: 'Ngọn Lửa Rực Rỡ', description: 'Học liên tiếp 30 ngày không nghỉ', icon: '🎆', unlocked: false, xpReward: 500, rule: { stat: 'streak', atLeast: 30 } },
  // --- Số bài học ---
  { id: 'ach_lessons_10', title: 'Nhà Thám Hiểm Chăm Chỉ', description: 'Hoàn thành 10 bài học', icon: '🧭', unlocked: false, xpReward: 120, rule: { stat: 'lessonsTotal', atLeast: 10 } },
  { id: 'ach_lessons_25', title: 'Nhà Thám Hiểm Kiên Nhẫn', description: 'Hoàn thành 25 bài học', icon: '🗺️', unlocked: false, xpReward: 200, rule: { stat: 'lessonsTotal', atLeast: 25 } },
  { id: 'ach_lessons_50', title: 'Nhà Thám Hiểm Vĩ Đại', description: 'Hoàn thành 50 bài học', icon: '👑', unlocked: false, xpReward: 350, rule: { stat: 'lessonsTotal', atLeast: 50 } },
  // --- Môn học sâu ---
  { id: 'ach_viet_10', title: 'Bậc Thầy Tiếng Việt', description: 'Hoàn thành 10 bài học Tiếng Việt', icon: '✏️', unlocked: false, xpReward: 120, rule: { stat: 'lessonsViet', atLeast: 10 } },
  { id: 'ach_math_10', title: 'Vua Toán Nhí', description: 'Hoàn thành 10 bài học Toán', icon: '➕', unlocked: false, xpReward: 120, rule: { stat: 'lessonsMath', atLeast: 10 } },
  { id: 'ach_english_10', title: 'Siêu Sao Tiếng Anh', description: 'Hoàn thành 10 bài học Tiếng Anh', icon: '🌍', unlocked: false, xpReward: 120, rule: { stat: 'lessonsEnglish', atLeast: 10 } },
  { id: 'ach_life_3', title: 'Bạn Nhỏ Hiểu Chuyện', description: 'Hoàn thành 3 bài Em & Cuộc sống', icon: '🏡', unlocked: false, xpReward: 100, rule: { stat: 'lessonsLife', atLeast: 3 } },
  { id: 'ach_life_10', title: 'Công Dân Nhí Gương Mẫu', description: 'Hoàn thành 10 bài Em & Cuộc sống', icon: '🌻', unlocked: false, xpReward: 150, rule: { stat: 'lessonsLife', atLeast: 10 } },
  // --- Chất lượng & rương ---
  { id: 'ach_perfect_5', title: 'Ngôi Sao Hoàn Hảo', description: 'Đạt 3 sao trong 5 bài học', icon: '⭐', unlocked: false, xpReward: 150, rule: { stat: 'lessons3Star', atLeast: 5 } },
  { id: 'ach_chest_3', title: 'Thợ Săn Rương Báu', description: 'Mở 3 rương kho báu', icon: '🎁', unlocked: false, xpReward: 120, rule: { stat: 'chestsOpened', atLeast: 3 } },
  // --- Trò chơi & ôn tập ---
  { id: 'ach_gamer_10', title: 'Siêu Sao Trò Chơi', description: 'Chơi 10 lượt trò chơi', icon: '🕹️', unlocked: false, xpReward: 100, rule: { stat: 'gamesPlayed', atLeast: 10 } },
  { id: 'ach_review_10', title: 'Bậc Thầy Trí Nhớ', description: 'Ôn tập trong 10 ngày khác nhau', icon: '🧠', unlocked: false, xpReward: 150, rule: { stat: 'reviewDays', atLeast: 10 } },
  { id: 'ach_weekly_3', title: 'Anh Hùng Thử Thách', description: 'Vượt qua 3 Thử Thách Tuần', icon: '🥇', unlocked: false, xpReward: 200, rule: { stat: 'weeklyChallenges', atLeast: 3 } },
  // --- Nhiệm vụ ngày ---
  { id: 'ach_quest_7', title: 'Người Hoàn Thành Nhiệm Vụ', description: 'Hoàn thành 7 nhiệm vụ ngày', icon: '📜', unlocked: false, xpReward: 100, rule: { stat: 'questsCompleted', atLeast: 7 } },
  { id: 'ach_quest_30', title: 'Bậc Thầy Nhiệm Vụ', description: 'Hoàn thành 30 nhiệm vụ ngày', icon: '📯', unlocked: false, xpReward: 250, rule: { stat: 'questsCompleted', atLeast: 30 } },
  // --- Sưu tập & Shop ---
  { id: 'ach_sticker_1', title: 'Sticker Đầu Tiên', description: 'Nhận sticker đầu tiên vào Bộ Sưu Tập', icon: '🌟', unlocked: false, xpReward: 50, rule: { stat: 'stickersOwned', atLeast: 1 } },
  { id: 'ach_sticker_10', title: 'Nhà Sưu Tập Nhí', description: 'Sở hữu 10 sticker khác nhau', icon: '🖼️', unlocked: false, xpReward: 120, rule: { stat: 'stickersOwned', atLeast: 10 } },
  { id: 'ach_sticker_set', title: 'Hoàn Thành 1 Bộ Sticker', description: 'Sưu tập đủ 10 sticker một bộ', icon: '🏵️', unlocked: false, xpReward: 200, rule: { stat: 'stickerSetsCompleted', atLeast: 1 } },
  { id: 'ach_shop_1', title: 'Khách Hàng Đầu Tiên', description: 'Mua món đồ đầu tiên trong Tủ Đồ', icon: '🛍️', unlocked: false, xpReward: 80, rule: { stat: 'shopOwned', atLeast: 1 } },
  { id: 'ach_gacha_1', title: 'Thử Vận May Đầu Tiên', description: 'Quay máy gắp sticker lần đầu', icon: '🎰', unlocked: false, xpReward: 60, rule: { stat: 'gachaDraws', atLeast: 1 } },
  // --- Level & combo ---
  { id: 'ach_level_5', title: 'Ngôi Sao Đang Lên', description: 'Đạt cấp độ 5 của bé', icon: '🌠', unlocked: false, xpReward: 120, rule: { stat: 'level', atLeast: 5 } },
  { id: 'ach_level_10', title: 'Ngôi Sao Tỏa Sáng', description: 'Đạt cấp độ 10 của bé', icon: '💫', unlocked: false, xpReward: 200, rule: { stat: 'level', atLeast: 10 } },
  { id: 'ach_level_20', title: 'Ngôi Sao Lớn', description: 'Đạt cấp độ 20 của bé', icon: '☄️', unlocked: false, xpReward: 350, rule: { stat: 'level', atLeast: 20 } },
  { id: 'ach_combo_8', title: 'Chuỗi Đúng Dài Nhất', description: 'Trả lời đúng 8 câu liên tiếp trong ngày', icon: '⚡', unlocked: false, xpReward: 100, rule: { stat: 'comboBest', atLeast: 8 } },
];

export const ACHIEVEMENT_MAP: ReadonlyMap<string, AchievementDef> = new Map(
  ACHIEVEMENT_CATALOG.map((a) => [a.id, a])
);
