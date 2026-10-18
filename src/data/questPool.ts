/**
 * T18A — Pool 31 nhiệm vụ ngày xoay vòng.
 * Mỗi ngày engine chọn 3 nhiệm vụ học (ưu tiên môn bé còn yếu) + 1 nhiệm vụ vui,
 * tất định theo `localDateKey` nên bé nào mở app cùng ngày cũng thấy cùng bộ.
 *
 * 5 id đầu (`quest_viet`, `quest_math`, `quest_english`, `quest_game`,
 * `quest_review`) giữ nguyên như bản cũ để tiến trình đã lưu không mất.
 */
import type { QuestPoolEntry } from '../types/motivation';

export const QUEST_POOL: readonly QuestPoolEntry[] = [
  // --- Tiếng Việt ---
  { id: 'quest_viet', title: 'Học 1 bài Tiếng Việt xinh', type: 'lesson_viet', targetCount: 1, rewardStars: 3, rewardXp: 30, subjects: ['tieng-viet'], isFun: false },
  { id: 'quest_viet_2', title: 'Học 2 bài Tiếng Việt thật hay', type: 'lesson_viet', targetCount: 2, rewardStars: 4, rewardXp: 40, subjects: ['tieng-viet'], isFun: false },
  { id: 'quest_correct_vn', title: 'Trả lời đúng 5 câu Tiếng Việt', type: 'correct_5', targetCount: 5, rewardStars: 3, rewardXp: 30, subjects: ['tieng-viet'], isFun: false },
  // --- Toán ---
  { id: 'quest_math', title: 'Làm quen 1 bài Toán kỳ thú', type: 'lesson_math', targetCount: 1, rewardStars: 3, rewardXp: 30, subjects: ['toan'], isFun: false },
  { id: 'quest_math_2', title: 'Chinh phục 2 bài Toán thật vui', type: 'lesson_math', targetCount: 2, rewardStars: 4, rewardXp: 40, subjects: ['toan'], isFun: false },
  { id: 'quest_correct_math', title: 'Trả lời đúng 5 câu Toán', type: 'correct_5', targetCount: 5, rewardStars: 3, rewardXp: 30, subjects: ['toan'], isFun: false },
  // --- Tiếng Anh ---
  { id: 'quest_english', title: 'Khám phá 1 bài English vui nhộn', type: 'lesson_english', targetCount: 1, rewardStars: 3, rewardXp: 30, subjects: ['english'], isFun: false },
  { id: 'quest_english_2', title: 'Học 2 bài English thật giỏi', type: 'lesson_english', targetCount: 2, rewardStars: 4, rewardXp: 40, subjects: ['english'], isFun: false },
  { id: 'quest_correct_en', title: 'Trả lời đúng 5 câu English', type: 'correct_5', targetCount: 5, rewardStars: 3, rewardXp: 30, subjects: ['english'], isFun: false },
  { id: 'quest_game_en', title: 'Chơi 1 game Tiếng Anh', type: 'game_english', targetCount: 1, rewardStars: 3, rewardXp: 30, subjects: ['english'], isFun: false },
  { id: 'quest_game_en_2', title: 'Chơi 2 game Tiếng Anh thật vui', type: 'game_english', targetCount: 2, rewardStars: 4, rewardXp: 40, subjects: ['english'], isFun: false },
  // --- Em & Cuộc sống ---
  { id: 'quest_life', title: 'Học 1 bài Em & Cuộc sống', type: 'lesson_life', targetCount: 1, rewardStars: 3, rewardXp: 30, subjects: ['cuoc-song'], isFun: false },
  { id: 'quest_life_2', title: 'Học 2 bài Em & Cuộc sống', type: 'lesson_life', targetCount: 2, rewardStars: 4, rewardXp: 40, subjects: ['cuoc-song'], isFun: false },
  // --- Ôn tập & đọc ---
  { id: 'quest_review', title: 'Hoàn thành Ôn tập hôm nay', type: 'daily_review', targetCount: 1, rewardStars: 4, rewardXp: 40, subjects: [], isFun: false },
  { id: 'quest_review_5q', title: 'Ôn lại 5 câu hỏi cũ', type: 'review_5q', targetCount: 5, rewardStars: 3, rewardXp: 30, subjects: [], isFun: false },
  { id: 'quest_review_10q', title: 'Ôn lại 10 câu hỏi cũ', type: 'review_5q', targetCount: 10, rewardStars: 4, rewardXp: 40, subjects: [], isFun: false },
  { id: 'quest_read_1', title: 'Đọc 1 truyện thật hay', type: 'read_story', targetCount: 1, rewardStars: 3, rewardXp: 30, subjects: ['tieng-viet'], isFun: false },
  { id: 'quest_read_2', title: 'Đọc 2 truyện thật vui', type: 'read_story', targetCount: 2, rewardStars: 4, rewardXp: 40, subjects: ['tieng-viet'], isFun: false },
  // --- Trò chơi & combo ---
  { id: 'quest_game', title: 'Thử sức 1 trò chơi thông minh', type: 'play_game', targetCount: 1, rewardStars: 2, rewardXp: 20, subjects: [], isFun: false },
  { id: 'quest_game_2', title: 'Chơi 2 trò chơi thật giỏi', type: 'play_game', targetCount: 2, rewardStars: 3, rewardXp: 30, subjects: [], isFun: false },
  { id: 'quest_combo_5', title: 'Trả lời đúng 5 câu liên tiếp', type: 'combo_5', targetCount: 5, rewardStars: 3, rewardXp: 30, subjects: [], isFun: false },
  { id: 'quest_combo_8', title: 'Trả lời đúng 8 câu liên tiếp', type: 'combo_5', targetCount: 8, rewardStars: 4, rewardXp: 40, subjects: [], isFun: false },
  // --- Bài học bất kỳ / sao / tuần ---
  { id: 'quest_lessons_2', title: 'Hoàn thành 2 bài học bất kỳ', type: 'lesson_any', targetCount: 2, rewardStars: 3, rewardXp: 30, subjects: [], isFun: false },
  { id: 'quest_lessons_3', title: 'Hoàn thành 3 bài học bất kỳ', type: 'lesson_any', targetCount: 3, rewardStars: 4, rewardXp: 40, subjects: [], isFun: false },
  { id: 'quest_perfect', title: 'Đạt 3 sao trong 1 bài học', type: 'star_3', targetCount: 1, rewardStars: 4, rewardXp: 40, subjects: [], isFun: false },
  { id: 'quest_weekly', title: 'Thử sức 1 Thử Thách Tuần', type: 'weekly_try', targetCount: 1, rewardStars: 4, rewardXp: 40, subjects: [], isFun: false },
  // --- Nhiệm vụ vui (mỗi ngày 1 nhiệm vụ) ---
  { id: 'quest_water', title: 'Tưới nước cho cây tri thức', type: 'fun', targetCount: 1, rewardStars: 2, rewardXp: 20, subjects: [], isFun: true },
  { id: 'quest_dressup', title: 'Mặc đồ mới cho Gấu Bút Chì', type: 'fun', targetCount: 1, rewardStars: 2, rewardXp: 20, subjects: [], isFun: true },
  { id: 'quest_chest', title: 'Mở 1 rương kho báu', type: 'fun', targetCount: 1, rewardStars: 2, rewardXp: 20, subjects: [], isFun: true },
  { id: 'quest_gacha', title: 'Quay 1 lượt máy gắp sticker', type: 'fun', targetCount: 1, rewardStars: 2, rewardXp: 20, subjects: [], isFun: true },
  { id: 'quest_combo_3', title: 'Trả lời đúng 3 câu liên tiếp', type: 'combo_5', targetCount: 3, rewardStars: 2, rewardXp: 20, subjects: [], isFun: true },
];

export const QUEST_MAP: ReadonlyMap<string, QuestPoolEntry> = new Map(QUEST_POOL.map((q) => [q.id, q]));
