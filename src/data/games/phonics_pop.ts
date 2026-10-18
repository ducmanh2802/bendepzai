/**
 * T02B/B7+A — Phonics Pop data. Pure TypeScript.
 *
 * T02B/B7: không còn phương án cùng âm với đáp án (PHONE/F→T, KITE/C→P,
 * FIVE/PH→B, FATHER/PH→M); tier blend (T4) dùng toàn cụm blend ở cả đáp án
 * lẫn phương án nhiễu (không lẫn chữ đơn); tier 4/5/6 có 8/8/8 item.
 */

import { GAME_LEVEL_POLICY } from '../../config/policy';
import { seededRng, shuffleSeeded } from '../gameLevels';

export interface PhonicsItem {
  word: string;
  vietnamese: string;
  emoji: string;
  sound: string;
  options: string[];
  answer: string;
}

export const POOLS: PhonicsItem[][] = [
  [
    { word: 'CAT', vietnamese: 'con mèo', emoji: '🐱', sound: 'k', options: ['C', 'B', 'D'], answer: 'C' },
    { word: 'DOG', vietnamese: 'con chó', emoji: '🐶', sound: 'd', options: ['D', 'B', 'P'], answer: 'D' },
    { word: 'APPLE', vietnamese: 'quả táo', emoji: '🍎', sound: 'a', options: ['A', 'E', 'O'], answer: 'A' },
    { word: 'BALL', vietnamese: 'quả bóng', emoji: '⚽', sound: 'b', options: ['B', 'D', 'P'], answer: 'B' },
    { word: 'FISH', vietnamese: 'con cá', emoji: '🐟', sound: 'f', options: ['F', 'V', 'P'], answer: 'F' },
    { word: 'EGG', vietnamese: 'quả trứng', emoji: '🥚', sound: 'e', options: ['E', 'A', 'I'], answer: 'E' },
  ],
  [
    { word: 'SUN', vietnamese: 'mặt trời', emoji: '☀️', sound: 's', options: ['S', 'X', 'Z'], answer: 'S' },
    { word: 'MOON', vietnamese: 'mặt trăng', emoji: '🌙', sound: 'm', options: ['M', 'N', 'W'], answer: 'M' },
    { word: 'PIG', vietnamese: 'con lợn', emoji: '🐷', sound: 'p', options: ['P', 'B', 'D'], answer: 'P' },
    { word: 'LION', vietnamese: 'con sư tử', emoji: '🦁', sound: 'l', options: ['L', 'R', 'N'], answer: 'L' },
    { word: 'TIGER', vietnamese: 'con hổ', emoji: '🐯', sound: 't', options: ['T', 'D', 'J'], answer: 'T' },
    { word: 'HEN', vietnamese: 'con gà mái', emoji: '🐔', sound: 'h', options: ['H', 'K', 'G'], answer: 'H' },
  ],
  [
    { word: 'SHIP', vietnamese: 'con tàu', emoji: '🚢', sound: 'sh', options: ['SH', 'S', 'CH'], answer: 'SH' },
    { word: 'CHICK', vietnamese: 'gà con', emoji: '🐤', sound: 'ch', options: ['CH', 'SH', 'TH'], answer: 'CH' },
    { word: 'THIN', vietnamese: 'gầy, mỏng', emoji: '🧍', sound: 'th', options: ['TH', 'T', 'H'], answer: 'TH' },
    // T02B/B7 — PHONE: F cùng âm /f/ với PH → thay bằng T.
    { word: 'PHONE', vietnamese: 'điện thoại', emoji: '📞', sound: 'ph', options: ['PH', 'P', 'T'], answer: 'PH' },
    // T02B/B7 — KITE: C cùng âm /k/ với K → thay bằng P.
    { word: 'KITE', vietnamese: 'cái diều', emoji: '🪁', sound: 'k', options: ['K', 'P', 'G'], answer: 'K' },
    { word: 'ZEBRA', vietnamese: 'ngựa vằn', emoji: '🦓', sound: 'z', options: ['Z', 'S', 'X'], answer: 'Z' },
  ],
  // T02B/B7 — tier blend: đáp án + nhiễu đều là blend (không hỏi chữ đơn).
  // T02D: RED (chữ đơn R) còn sót → CRAB (blend CR).
  [
    { word: 'CRAB', vietnamese: 'con cua', emoji: '🦀', sound: 'cr', options: ['CR', 'BR', 'GR'], answer: 'CR' },
    { word: 'BLUE', vietnamese: 'màu xanh', emoji: '🔵', sound: 'bl', options: ['BL', 'GR', 'ST'], answer: 'BL' },
    { word: 'GREEN', vietnamese: 'màu xanh lá', emoji: '🟢', sound: 'gr', options: ['GR', 'BL', 'FR'], answer: 'GR' },
    { word: 'STAR', vietnamese: 'ngôi sao', emoji: '⭐', sound: 'st', options: ['ST', 'BL', 'GR'], answer: 'ST' },
    { word: 'FROG', vietnamese: 'con ếch', emoji: '🐸', sound: 'fr', options: ['FR', 'GR', 'BR'], answer: 'FR' },
    { word: 'CLOCK', vietnamese: 'đồng hồ', emoji: '⏰', sound: 'cl', options: ['CL', 'CR', 'BR'], answer: 'CL' },
    { word: 'PLANT', vietnamese: 'cái cây', emoji: '🌱', sound: 'pl', options: ['PL', 'BL', 'CL'], answer: 'PL' },
    { word: 'TRAIN', vietnamese: 'xe lửa', emoji: '🚂', sound: 'tr', options: ['TR', 'DR', 'GR'], answer: 'TR' },
  ],
  [
    { word: 'ORANGE', vietnamese: 'quả cam', emoji: '🍊', sound: 'o', options: ['O', 'A', 'E'], answer: 'O' },
    { word: 'TWO', vietnamese: 'số hai', emoji: '2️⃣', sound: 't', options: ['T', 'W', 'O'], answer: 'T' },
    { word: 'THREE', vietnamese: 'số ba', emoji: '3️⃣', sound: 'th', options: ['TH', 'T', 'H'], answer: 'TH' },
    // T02B/B7 — FIVE: PH cùng âm /f/ với F → thay bằng B.
    { word: 'FIVE', vietnamese: 'số năm', emoji: '5️⃣', sound: 'f', options: ['F', 'B', 'S'], answer: 'F' },
    { word: 'MOTHER', vietnamese: 'mẹ', emoji: '👩', sound: 'm', options: ['M', 'N', 'TH'], answer: 'M' },
    // T02B/B7 — FATHER: PH cùng âm /f/ với F → thay bằng M.
    { word: 'FATHER', vietnamese: 'bố', emoji: '👨', sound: 'f', options: ['F', 'M', 'V'], answer: 'F' },
    { word: 'THANK', vietnamese: 'cảm ơn', emoji: '🙏', sound: 'th', options: ['TH', 'T', 'H'], answer: 'TH' },
    { word: 'SIX', vietnamese: 'số sáu', emoji: '6️⃣', sound: 's', options: ['S', 'X', 'Z'], answer: 'S' },
  ],
  [
    { word: 'SCHOOL', vietnamese: 'trường học', emoji: '🏫', sound: 's', options: ['S', 'C', 'H'], answer: 'S' },
    { word: 'BOOK', vietnamese: 'quyển sách', emoji: '📖', sound: 'b', options: ['B', 'P', 'D'], answer: 'B' },
    { word: 'PENCIL', vietnamese: 'bút chì', emoji: '✏️', sound: 'p', options: ['P', 'B', 'Q'], answer: 'P' },
    { word: 'FRIEND', vietnamese: 'bạn bè', emoji: '🧒', sound: 'fr', options: ['FR', 'GR', 'BR'], answer: 'FR' },
    { word: 'HAPPY', vietnamese: 'vui vẻ', emoji: '😊', sound: 'h', options: ['H', 'Y', 'P'], answer: 'H' },
    { word: 'JUMP', vietnamese: 'nhảy', emoji: '🤸', sound: 'j', options: ['J', 'G', 'Y'], answer: 'J' },
    { word: 'RUN', vietnamese: 'chạy', emoji: '🏃', sound: 'r', options: ['R', 'L', 'W'], answer: 'R' },
    { word: 'DANCE', vietnamese: 'nhảy múa', emoji: '💃', sound: 'd', options: ['D', 'B', 'P'], answer: 'D' },
  ],
];

export interface PhonicsRound {
  item: PhonicsItem;
  options: string[];
}

export function buildPhonicsPopRounds(tier: number, seed = 0): PhonicsRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), POOLS.length);
  const pool = POOLS[safeTier - 1];
  const count = GAME_LEVEL_POLICY.ROUNDS_PER_TIER[Math.min(safeTier - 1, GAME_LEVEL_POLICY.ROUNDS_PER_TIER.length - 1)];
  const list = shuffleSeeded(pool, seededRng(safeTier * 3000 + 5 + seed * 101));
  const rounds: PhonicsRound[] = [];
  for (let i = 0; i < count; i++) {
    const item = list[i % list.length];
    rounds.push({
      item,
      options: shuffleSeeded(item.options, seededRng(safeTier * 911 + i * 37 + seed * 17)),
    });
  }
  return rounds;
}

export function buildRounds(tier: number, seed = 0): PhonicsRound[] {
  return buildPhonicsPopRounds(tier, seed);
}
