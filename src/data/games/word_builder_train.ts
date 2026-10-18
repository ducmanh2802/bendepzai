/**
 * T17A — Word Train (word_builder_train) data. Pure TypeScript, no React imports.
 *
 * Tàu Chữ Tiếng Anh: mỗi toa là 1 chữ cái (hoặc cụm sh/ch/ck/th),
 * bé chạm toa để nghe âm (phonics) rồi xếp đúng thứ tự thành từ.
 * - T1–T3: từ CVC 3 chữ (a → e/i → o/u), toa chữ đơn.
 * - T4: từ 4 chữ cái giải mã được (duck, frog, crab…).
 * - T5: digraph sh/ch (+ ck) theo Kid's Box (ship, fish, chick…).
 * - T6: ôn tổng hợp khó (sheep, green, grey, clock, train…).
 *
 * British English: GREY (không dùng GRAY).
 */

import { pickDistinct, roundsForTier, seededRng, shuffleSeeded } from '../gameLevels';

export interface WordTrainTarget {
  /** Từ mục tiêu, chữ IN HOA (A–Z). */
  word: string;
  /** Nghĩa tiếng Việt. */
  vi: string;
  emoji: string;
  /** Các toa theo đúng thứ tự (chữ đơn hoặc cụm sh/ch/ck/th). */
  cars: string[];
}

export interface WordTrainRound {
  id: string;
  word: string;
  vi: string;
  emoji: string;
  /** Toa đáp án theo đúng thứ tự. */
  cars: string[];
  /** Toa đã xáo trộn cho bé chọn. */
  carriages: string[];
}

function w(word: string, vi: string, emoji: string, cars: string[]): WordTrainTarget {
  return { word, vi, emoji, cars };
}

/**
 * POOL_BY_TIER — mỗi pool 8 từ (số vòng tối đa mỗi cấp là 8).
 * cars.join('') luôn === word; toa cụm chỉ xuất hiện từ T5.
 */
export const POOL_BY_TIER: WordTrainTarget[][] = [
  // T1 — CVC vần a
  [
    w('CAT', 'con mèo', '🐱', ['C', 'A', 'T']),
    w('HAT', 'cái mũ', '🎩', ['H', 'A', 'T']),
    w('BAG', 'cái túi', '👜', ['B', 'A', 'G']),
    w('MAP', 'bản đồ', '🗺️', ['M', 'A', 'P']),
    w('ANT', 'con kiến', '🐜', ['A', 'N', 'T']),
    w('VAN', 'xe tải', '🚐', ['V', 'A', 'N']),
    w('CAP', 'mũ lưỡi trai', '🧢', ['C', 'A', 'P']),
    w('BAT', 'con dơi', '🦇', ['B', 'A', 'T']),
  ],
  // T2 — CVC vần e/i
  [
    w('BED', 'cái giường', '🛏️', ['B', 'E', 'D']),
    w('PEN', 'cái bút', '🖊️', ['P', 'E', 'N']),
    w('HEN', 'gà mái', '🐔', ['H', 'E', 'N']),
    w('EGG', 'quả trứng', '🥚', ['E', 'G', 'G']),
    w('PIG', 'con lợn', '🐷', ['P', 'I', 'G']),
    w('RED', 'màu đỏ', '🔴', ['R', 'E', 'D']),
    w('TEN', 'số mười', '🔟', ['T', 'E', 'N']),
    w('PIN', 'cái ghim', '📌', ['P', 'I', 'N']),
  ],
  // T3 — CVC vần o/u
  [
    w('DOG', 'con chó', '🐶', ['D', 'O', 'G']),
    w('BOX', 'cái hộp', '📦', ['B', 'O', 'X']),
    w('FOX', 'con cáo', '🦊', ['F', 'O', 'X']),
    w('SUN', 'mặt trời', '☀️', ['S', 'U', 'N']),
    w('BUS', 'xe buýt', '🚌', ['B', 'U', 'S']),
    w('CUP', 'cái cốc', '☕', ['C', 'U', 'P']),
    w('HUT', 'túp lều', '⛺', ['H', 'U', 'T']),
    w('POT', 'cái nồi', '🍲', ['P', 'O', 'T']),
  ],
  // T4 — từ 4 chữ cái
  [
    w('DUCK', 'con vịt', '🦆', ['D', 'U', 'C', 'K']),
    w('FROG', 'con ếch', '🐸', ['F', 'R', 'O', 'G']),
    w('CRAB', 'con cua', '🦀', ['C', 'R', 'A', 'B']),
    w('FISH', 'con cá', '🐟', ['F', 'I', 'S', 'H']),
    w('STAR', 'ngôi sao', '⭐', ['S', 'T', 'A', 'R']),
    w('MOON', 'mặt trăng', '🌙', ['M', 'O', 'O', 'N']),
    w('NEST', 'tổ chim', '🐦', ['N', 'E', 'S', 'T']),
    w('DRUM', 'cái trống', '🥁', ['D', 'R', 'U', 'M']),
  ],
  // T5 — digraph sh/ch (+ ck) theo Kid's Box
  [
    w('SHIP', 'con tàu', '🚢', ['SH', 'I', 'P']),
    w('FISH', 'con cá', '🐟', ['F', 'I', 'SH']),
    w('DISH', 'cái đĩa', '🍽️', ['D', 'I', 'SH']),
    w('CHIP', 'khoai tây chiên', '🍟', ['CH', 'I', 'P']),
    w('CHICK', 'gà con', '🐤', ['CH', 'I', 'CK']),
    w('SHOP', 'cửa hàng', '🏪', ['SH', 'O', 'P']),
    w('BUSH', 'bụi cây', '🌳', ['B', 'U', 'SH']),
    w('CHAT', 'trò chuyện', '💬', ['CH', 'A', 'T']),
  ],
  // T6 — ôn tổng hợp: nguyên âm đôi + th + grey (British)
  [
    w('SHEEP', 'con cừu', '🐑', ['SH', 'EE', 'P']),
    w('GREEN', 'màu xanh lá', '🟢', ['G', 'R', 'EE', 'N']),
    w('GREY', 'màu xám', '🐘', ['G', 'R', 'EY']),
    w('CHAIR', 'cái ghế', '🪑', ['CH', 'AI', 'R']),
    w('TRAIN', 'xe lửa', '🚂', ['T', 'R', 'AI', 'N']),
    w('CLOCK', 'đồng hồ', '⏰', ['C', 'L', 'O', 'CK']),
    w('BRUSH', 'bàn chải', '🖌️', ['B', 'R', 'U', 'SH']),
    w('THIN', 'gầy, mỏng', '🧍', ['TH', 'I', 'N']),
  ],
];

/**
 * Dựng các vòng chơi cho 1 cấp: đủ vòng, từ duy nhất, toa xáo trộn
 * (đa tập hợp toa giữ nguyên) theo seed.
 */
export function buildWordTrainRounds(tier: number, seedOrNonce = 0): WordTrainRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const rng = seededRng(1701 + safeTier * 313 + seedOrNonce * 1009);
  const picks = pickDistinct(pool, count, rng);
  return picks.map((t, i) => {
    const r = seededRng(1701 + safeTier * 313 + seedOrNonce * 1009 + i * 71 + 17);
    return {
      id: `wt-t${safeTier}-${t.word}-${i}`,
      word: t.word,
      vi: t.vi,
      emoji: t.emoji,
      cars: [...t.cars],
      carriages: shuffleSeeded(t.cars, r),
    };
  });
}

export function buildRounds(tier: number, seed = 0): WordTrainRound[] {
  return buildWordTrainRounds(tier, seed);
}
