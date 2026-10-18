/**
 * T02B/B2 — Đoàn Tàu Xếp Câu (SentenceScramble) data.
 * Pure TypeScript: no React imports.
 */

import { defaultRoundsPerTier, pickDistinct, seededRng, shuffleSeeded } from '../gameLevels';

export interface SentenceLevel {
  correctWords: string[];
  meaning: string;
  emoji: string;
}

export interface SentencePoolItem {
  words: string[];
  meaning: string;
  emoji: string;
}

export const SENTENCE_POOL: SentencePoolItem[] = [
  { words: ['Lan', 'đi', 'học'], meaning: 'Lan đi học đến trường', emoji: '🎒' },
  { words: ['Bé', 'yêu', 'mẹ'], meaning: 'Bé thương yêu mẹ', emoji: '❤️' },
  { words: ['Mèo', 'kêu', 'meo'], meaning: 'Chú mèo kêu meo meo', emoji: '🐱' },
  { words: ['Trời', 'đang', 'mưa'], meaning: 'Trời đang mưa', emoji: '🌧️' },
  { words: ['Bé', 'chơi', 'bóng'], meaning: 'Bé chơi bóng', emoji: '⚽' },
  { words: ['Hoa', 'rất', 'đẹp'], meaning: 'Bông hoa rất đẹp', emoji: '🌸' },
  { words: ['Con', 'mèo', 'trèo', 'cây'], meaning: 'Chú mèo trèo cây', emoji: '🐱' },
  { words: ['Bà', 'nấu', 'cháo', 'ngon'], meaning: 'Bà nấu cháo rất ngon', emoji: '🍲' },
  { words: ['Bố', 'đi', 'làm', 'sớm'], meaning: 'Bố đi làm từ sớm', emoji: '💼' },
  { words: ['Chim', 'sơn', 'ca', 'hót'], meaning: 'Chim sơn ca hót', emoji: '🐦' },
  { words: ['Bạn', 'Nam', 'chăm', 'chỉ'], meaning: 'Bạn Nam rất chăm chỉ', emoji: '👦' },
  { words: ['Bé', 'đọc', 'sách', 'hay'], meaning: 'Bé đọc sách rất hay', emoji: '📖' },
  { words: ['Mẹ', 'mua', 'rau', 'tươi'], meaning: 'Mẹ mua rau tươi ngoài chợ', emoji: '🥬' },
  { words: ['Chú', 'thỏ', 'ăn', 'cà', 'rốt'], meaning: 'Chú thỏ ăn cà rốt', emoji: '🐰' },
  { words: ['Bé', 'tưới', 'nước', 'cho', 'hoa'], meaning: 'Bé tưới nước cho hoa', emoji: '💧' },
  { words: ['Mẹ', 'nấu', 'cơm', 'ngon', 'quá'], meaning: 'Mẹ nấu cơm ngon quá', emoji: '🍚' },
  { words: ['Hoa', 'nở', 'rực', 'rỡ'], meaning: 'Bông hoa khoe sắc', emoji: '🌺' },
  { words: ['Bé', 'gấp', 'quần', 'áo', 'gọn'], meaning: 'Bé gấp quần áo gọn gàng', emoji: '👕' },
  { words: ['Ông', 'mặt', 'trời', 'tỏa', 'nắng'], meaning: 'Ông mặt trời tỏa nắng ấm', emoji: '☀️' },
  { words: ['Con', 'gà', 'trống', 'gáy', 'to'], meaning: 'Con gà trống gáy ò ó o', emoji: '🐓' },
  { words: ['Bé', 'rửa', 'tay', 'trước', 'khi', 'ăn'], meaning: 'Bé rửa tay trước khi ăn cơm', emoji: '🧼' },
  { words: ['Bố', 'đọc', 'truyện', 'cho', 'bé', 'nghe'], meaning: 'Bố đọc truyện cho bé nghe', emoji: '📖' },
  { words: ['Em', 'giúp', 'mẹ', 'quét', 'nhà'], meaning: 'Em giúp mẹ quét nhà thật sạch', emoji: '🧹' },
  { words: ['Đàn', 'gà', 'con', 'chạy', 'lon', 'ton'], meaning: 'Đàn gà con chạy lon ton theo mẹ', emoji: '🐤' },
  { words: ['Bé', 'cùng', 'bà', 'trồng', 'hoa'], meaning: 'Bé cùng bà trồng hoa trước sân nhà', emoji: '🌱' },
  { words: ['Mùa', 'xuân', 'hoa', 'nở', 'rực', 'rỡ'], meaning: 'Mùa xuân về muôn hoa nở rực rỡ', emoji: '🌸' },
];

/**
 * T02B/B2+A — deterministic per (tier, seed). `seed` already mixes the
 * play nonce (component passes stage.nonce), so replays reshuffle.
 */
export function buildScrambleRounds(tier: number, seed = 0): SentenceLevel[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const roundsPerTier = defaultRoundsPerTier();
  const count = roundsPerTier[safeTier - 1];
  let pool: SentencePoolItem[];
  if (safeTier <= 1) pool = SENTENCE_POOL.filter((s) => s.words.length <= 3);
  else if (safeTier === 2) pool = SENTENCE_POOL.filter((s) => s.words.length === 4);
  else if (safeTier === 3) pool = SENTENCE_POOL.filter((s) => s.words.length === 4 || s.words.length === 5);
  else if (safeTier === 4) pool = SENTENCE_POOL.filter((s) => s.words.length === 5 || s.words.length === 6);
  else pool = SENTENCE_POOL.filter((s) => s.words.length >= 5);
  return pickDistinct(pool, count, seededRng(6700 + safeTier * 29 + seed * 1009)).map((s) => ({
    correctWords: s.words,
    meaning: s.meaning,
    emoji: s.emoji,
  }));
}

export function buildRounds(tier: number, seed = 0): SentenceLevel[] {
  return buildScrambleRounds(tier, seed);
}

/**
 * T02B/B2 — seeded scramble that NEVER shows the exact correct order
 * (nor the plain reverse that children could game right-to-left).
 * Pass roundIdx so every round in a tier shuffles differently.
 */
export function scrambleWords(correctWords: readonly string[], tier: number, seed: number, roundIdx: number): string[] {
  const rng = seededRng(6700 + tier * 29 + seed * 1009 + roundIdx * 733);
  let out = shuffleSeeded([...correctWords], rng);
  const correct = correctWords.join(' ');
  const reversed = [...correctWords].reverse().join(' ');
  let guard = 0;
  while ((out.join(' ') === correct || out.join(' ') === reversed) && guard < 10) {
    guard++;
    // Rotate once more deterministically instead of looping forever.
    out = [...out.slice(1), out[0]];
    if (out.join(' ') === correct || out.join(' ') === reversed) {
      out = shuffleSeeded(out, seededRng(6700 + tier * 29 + seed * 1009 + roundIdx * 733 + guard * 97));
    }
  }
  return out;
}
