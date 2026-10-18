/**
 * T02B/B3+A — Đôi Tai Thính (ListenPickPhonics) data. Pure TypeScript.
 */

import { defaultRoundsPerTier, pickDistinct, seededRng, shuffleSeeded } from '../gameLevels';

export interface PhonicsCard {
  word: string;
  emoji: string;
  spokenText: string;
}

export interface PhonicsRound {
  spokenPrompt: string;
  targetWord: string;
  cards: PhonicsCard[];
}

export interface PhonicsTheme {
  name: string;
  words: { word: string; emoji: string }[];
}

export const THEMES: PhonicsTheme[] = [
  {
    name: 'con vật',
    words: [
      { word: 'Con mèo', emoji: '🐱' },
      { word: 'Con cá', emoji: '🐟' },
      { word: 'Con chó', emoji: '🐶' },
      { word: 'Con gà', emoji: '🐓' },
      { word: 'Con vịt', emoji: '🦆' },
      { word: 'Con thỏ', emoji: '🐰' },
    ],
  },
  {
    name: 'quả cây',
    words: [
      { word: 'Quả cam', emoji: '🍊' },
      { word: 'Quả chuối', emoji: '🍌' },
      { word: 'Quả táo', emoji: '🍎' },
      { word: 'Quả dưa hấu', emoji: '🍉' },
      { word: 'Quả nho', emoji: '🍇' },
      { word: 'Quả lê', emoji: '🍐' },
    ],
  },
  {
    name: 'đồ dùng học tập',
    words: [
      { word: 'Quyển sách', emoji: '📖' },
      { word: 'Cây bút', emoji: '✏️' },
      { word: 'Cái cặp', emoji: '🎒' },
      { word: 'Thước kẻ', emoji: '📏' },
      { word: 'Cái bảng', emoji: '📋' },
      { word: 'Hộp màu', emoji: '🖍️' },
    ],
  },
  {
    name: 'thiên nhiên',
    words: [
      { word: 'Mặt trời', emoji: '☀️' },
      { word: 'Mặt trăng', emoji: '🌙' },
      { word: 'Ngôi sao', emoji: '⭐' },
      { word: 'Đám mây', emoji: '☁️' },
      { word: 'Cầu vồng', emoji: '🌈' },
      { word: 'Ngọn gió', emoji: '🌬️' },
    ],
  },
  {
    name: 'đồ vật gia đình',
    words: [
      { word: 'Chiếc ghế', emoji: '🪑' },
      { word: 'Cái quạt', emoji: '🌀' },
      { word: 'Chiếc đèn', emoji: '💡' },
      { word: 'Cái nồi', emoji: '🍲' },
      { word: 'Cái chổi', emoji: '🧹' },
      { word: 'Cái tủ', emoji: '🗄️' },
    ],
  },
  {
    name: 'đồ ăn',
    words: [
      { word: 'Bánh mì', emoji: '🍞' },
      { word: 'Quả trứng', emoji: '🥚' },
      { word: 'Cốc sữa', emoji: '🥛' },
      { word: 'Đĩa cơm', emoji: '🍚' },
      { word: 'Cốc nước', emoji: '🥤' },
      { word: 'Củ cà rốt', emoji: '🥕' },
    ],
  },
];

/**
 * T02B/B3+A — target picked first, cards shuffled after, so the answer slot
 * is uniformly distributed. `seed` mixes the play nonce.
 */
export function buildPhonicsRounds(tier: number, seed = 0): PhonicsRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const roundsPerTier = defaultRoundsPerTier();
  const count = roundsPerTier[safeTier - 1];
  const themeCount = safeTier <= 1 ? 1 : safeTier <= 3 ? 2 : safeTier <= 5 ? 3 : THEMES.length;
  const themes = pickDistinct(THEMES, themeCount, seededRng(7800 + safeTier * 61 + seed * 1009));
  const rounds: PhonicsRound[] = [];
  for (let i = 0; i < count; i++) {
    const theme = themes[i % themes.length];
    const rngI = seededRng(7800 + safeTier * 47 + seed * 1009 + i * 331);
    const picked = pickDistinct(theme.words, 4, rngI);
    const target = picked[Math.floor(rngI() * picked.length)];
    const cards = shuffleSeeded(
      picked.map((w) => ({ word: w.word, emoji: w.emoji, spokenText: w.word })),
      seededRng(7800 + safeTier * 47 + seed * 1009 + i * 557)
    );
    rounds.push({ spokenPrompt: target.word, targetWord: target.word, cards });
  }
  return rounds;
}

export function buildRounds(tier: number, seed = 0): PhonicsRound[] {
  return buildPhonicsRounds(tier, seed);
}
