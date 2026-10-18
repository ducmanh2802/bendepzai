/**
 * T15 — Tô Dấu Thanh (tone_paint) data. Pure TypeScript, no React imports.
 *
 * Bé nghe 1 tiếng + thấy hình, chọn 1 trong 6 dấu thanh đặt lên đúng
 * nguyên âm. Cấp cao: từ 2 tiếng (chọn dấu cho tiếng được khoanh),
 * chọn đúng VỊ TRÍ dấu trong vần có 2 nguyên âm (hoà, khoẻ, thửa…).
 *
 * Quy ước dấu theo SGK hiện hành (hoà, khoẻ, thuỷ).
 */

import { pickDistinct, roundsForTier, seededRng, shuffleSeeded } from '../gameLevels';

export type ToneName = 'ngang' | 'sắc' | 'huyền' | 'hỏi' | 'ngã' | 'nặng';

export const TONE_NAMES: ToneName[] = ['ngang', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng'];

/** Ký hiệu dấu cho bé lớp 1 (ngang = gạch ngang "không dấu"). */
export const TONE_SYMBOLS: Record<ToneName, string> = {
  ngang: '—',
  sắc: '´',
  huyền: '`',
  hỏi: '?',
  ngã: '~',
  nặng: '.',
};

export interface TonePaintSeed {
  /** Từ đầy đủ có dấu, đã NFC. */
  w: string;
  /** Tiếng được khoanh cần tô dấu (mặc định = cả từ khi từ 1 tiếng). */
  focus: string;
  /** Dấu đúng của tiếng focus. */
  t: ToneName;
  /** Nguyên âm đúng mang dấu (chỉ dùng khi vần có ≥2 nguyên âm). */
  vow?: string;
  emoji: string;
}

export interface TonePaintRound {
  id: string;
  /** Từ đầy đủ (hiển thị sau khi đúng, và để đọc). */
  word: string;
  /** Dạng chưa có dấu thanh của tiếng focus (bé tô dấu lên đây). */
  bare: string;
  /** Các tiếng của từ 2 tiếng (undefined khi từ 1 tiếng). */
  syllables?: string[];
  /** Chỉ số tiếng focus trong syllables. */
  focusIndex?: number;
  emoji: string;
  targetTone: ToneName;
  /** 6 dấu đã xáo trộn (vị trí đáp án phân tán theo seed). */
  toneOptions: ToneName[];
  /** Các nguyên âm để chọn vị trí (chỉ khi vần có ≥2 nguyên âm). */
  vowelOptions?: string[];
  /** Nguyên âm đúng mang dấu. */
  vowelAnswer?: string;
  needsVowelPick: boolean;
}

/** Bỏ 5 dấu THANH, giữ mũ/móc (ă â ê ô ơ ư, đ). */
function stripTonesOnly(s: string): string {
  return s.normalize('NFD').replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '').normalize('NFC');
}

/**
 * POOL_BY_TIER — mỗi pool ≥ 8 mục (số vòng tối đa mỗi cấp là 8).
 * T1: ngang/sắc/huyền, 1 nguyên âm.
 * T2: + hỏi/ngã/nặng.
 * T3: vần 2 nguyên âm dễ + chọn vị trí (bèo, cáo, mèo…).
 * T4: vần khó + chọn vị trí (hoà, khoẻ, thửa, lưỡi, xoài, chuối…).
 * T5: từ 2 tiếng quen thuộc, tô dấu cho tiếng được khoanh.
 * T6: từ 2 tiếng khó (oang/uyên…) + chọn vị trí khi cần.
 */
export const POOL_BY_TIER: TonePaintSeed[][] = [
  // T1 — ngang / sắc / huyền, 1 nguyên âm
  [
    { w: 'cá', focus: 'cá', t: 'sắc', emoji: '🐟' },
    { w: 'gà', focus: 'gà', t: 'huyền', emoji: '🐓' },
    { w: 'bò', focus: 'bò', t: 'huyền', emoji: '🐄' },
    { w: 'me', focus: 'me', t: 'ngang', emoji: '🐱' },
    { w: 'ba', focus: 'ba', t: 'ngang', emoji: '👨' },
    { w: 'cô', focus: 'cô', t: 'ngang', emoji: '👩' },
    { w: 'bé', focus: 'bé', t: 'sắc', emoji: '👧' },
    { w: 'lá', focus: 'lá', t: 'sắc', emoji: '🍃' },
  ],
  // T2 — thêm hỏi / ngã / nặng
  [
    { w: 'thỏ', focus: 'thỏ', t: 'hỏi', emoji: '🐰' },
    { w: 'cỏ', focus: 'cỏ', t: 'hỏi', emoji: '🌿' },
    { w: 'vải', focus: 'vải', t: 'hỏi', emoji: '🍒' },
    { w: 'mận', focus: 'mận', t: 'nặng', emoji: '🍑' },
    { w: 'bút', focus: 'bút', t: 'nặng', emoji: '✏️' },
    { w: 'mẹ', focus: 'mẹ', t: 'nặng', emoji: '👩' },
    { w: 'sữa', focus: 'sữa', t: 'ngã', emoji: '🥛' },
    { w: 'đũa', focus: 'đũa', t: 'ngã', emoji: '🥢' },
  ],
  // T3 — vần 2 nguyên âm dễ + chọn vị trí dấu
  [
    { w: 'bèo', focus: 'bèo', t: 'huyền', vow: 'e', emoji: '🌊' },
    { w: 'véo', focus: 'véo', t: 'sắc', vow: 'e', emoji: '🤏' },
    { w: 'cáo', focus: 'cáo', t: 'sắc', vow: 'a', emoji: '🦊' },
    { w: 'mèo', focus: 'mèo', t: 'huyền', vow: 'e', emoji: '🐱' },
    { w: 'kéo', focus: 'kéo', t: 'sắc', vow: 'e', emoji: '🧶' },
    { w: 'chào', focus: 'chào', t: 'huyền', vow: 'a', emoji: '👋' },
    { w: 'đào', focus: 'đào', t: 'huyền', vow: 'a', emoji: '🍑' },
    { w: 'gạo', focus: 'gạo', t: 'nặng', vow: 'a', emoji: '🍚' },
  ],
  // T4 — vần khó (oa, oe, ửa, ưỡi, oài, uôi…) + chọn vị trí
  [
    { w: 'hoà', focus: 'hoà', t: 'huyền', vow: 'a', emoji: '🕊️' },
    { w: 'khoẻ', focus: 'khoẻ', t: 'hỏi', vow: 'e', emoji: '💪' },
    { w: 'thửa', focus: 'thửa', t: 'hỏi', vow: 'ư', emoji: '🌾' },
    { w: 'lưỡi', focus: 'lưỡi', t: 'ngã', vow: 'ơ', emoji: '👅' },
    { w: 'xoài', focus: 'xoài', t: 'huyền', vow: 'a', emoji: '🥭' },
    { w: 'chuối', focus: 'chuối', t: 'sắc', vow: 'ô', emoji: '🍌' },
    { w: 'tuổi', focus: 'tuổi', t: 'hỏi', vow: 'ô', emoji: '🎂' },
    { w: 'suối', focus: 'suối', t: 'sắc', vow: 'ô', emoji: '🏞️' },
  ],
  // T5 — từ 2 tiếng quen thuộc, tô dấu cho tiếng được khoanh
  [
    { w: 'quả cam', focus: 'quả', t: 'hỏi', emoji: '🍊' },
    { w: 'con bò', focus: 'bò', t: 'huyền', emoji: '🐄' },
    { w: 'cái bàn', focus: 'bàn', t: 'huyền', emoji: '🪑' },
    { w: 'con mèo', focus: 'mèo', t: 'huyền', emoji: '🐱' },
    { w: 'xe đạp', focus: 'đạp', t: 'nặng', emoji: '🚲' },
    { w: 'mặt trời', focus: 'mặt', t: 'nặng', emoji: '☀️' },
    { w: 'cầu vồng', focus: 'vồng', t: 'huyền', emoji: '🌈' },
    { w: 'bông hoa', focus: 'bông', t: 'ngang', emoji: '🌸' },
  ],
  // T6 — từ 2 tiếng khó (oang, uyên…) + vị trí khi vần đôi
  [
    { w: 'quyển sách', focus: 'quyển', t: 'sắc', vow: 'ê', emoji: '📖' },
    { w: 'vầng trăng', focus: 'vầng', t: 'huyền', emoji: '🌙' },
    { w: 'con thuyền', focus: 'thuyền', t: 'huyền', vow: 'ê', emoji: '⛵' },
    { w: 'hoa huệ', focus: 'huệ', t: 'nặng', vow: 'ê', emoji: '🌷' },
    { w: 'con suối', focus: 'suối', t: 'sắc', vow: 'ô', emoji: '🏞️' },
    { w: 'tiếng hát', focus: 'tiếng', t: 'sắc', vow: 'ê', emoji: '🎤' },
    { w: 'buổi sáng', focus: 'buổi', t: 'hỏi', vow: 'ô', emoji: '🌅' },
    { w: 'ánh nắng', focus: 'nắng', t: 'nặng', emoji: '☀️' },
  ],
];

/** Các nguyên âm trong tiếng (đã bỏ dấu thanh) để làm phương án vị trí. */
export function vowelsOf(syllable: string): string[] {
  const bare = stripTonesOnly(syllable).toLowerCase();
  const out: string[] = [];
  for (const ch of bare) {
    if ('aeiouyăâêôơư'.includes(ch) && !out.includes(ch)) out.push(ch);
  }
  return out;
}

/**
 * Dựng các vòng chơi cho 1 cấp: đủ vòng, từ không trùng, đáp án đúng,
 * phương án dấu phân tán vị trí theo seed.
 */
export function buildToneRounds(tier: number, seedOrNonce = 0): TonePaintRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const rng = seededRng(7100 + safeTier * 131 + seedOrNonce * 1009);
  const picks = pickDistinct(pool, count, rng);
  return picks.map((s, i) => {
    const r = seededRng(7100 + safeTier * 131 + seedOrNonce * 1009 + i * 37 + 5);
    const word = s.w.normalize('NFC');
    const parts = word.split(' ');
    const twoPart = parts.length > 1;
    const focusIndex = twoPart ? parts.findIndex((p) => p === s.focus.normalize('NFC')) : undefined;
    const bare = stripTonesOnly(s.focus).normalize('NFC');
    const needsVowelPick = typeof s.vow === 'string';
    let vowelOptions: string[] | undefined;
    let vowelAnswer: string | undefined;
    if (needsVowelPick) {
      const vowels = vowelsOf(s.focus);
      // Đáp án luôn có mặt; thêm nguyên âm khác làm mồi (tối đa 3 phương án).
      const others = vowels.filter((v) => v !== s.vow);
      vowelOptions = shuffleSeeded([s.vow!, ...others.slice(0, 2)], r);
      vowelAnswer = s.vow;
    }
    return {
      id: `tp-t${safeTier}-${s.w.replace(/\s+/g, '-')}-${i}`,
      word,
      bare,
      syllables: twoPart ? parts : undefined,
      focusIndex: twoPart && (focusIndex ?? -1) >= 0 ? focusIndex : undefined,
      emoji: s.emoji,
      targetTone: s.t,
      toneOptions: shuffleSeeded(TONE_NAMES, r),
      vowelOptions,
      vowelAnswer,
      needsVowelPick,
    };
  });
}

export function buildRounds(tier: number, seed = 0): TonePaintRound[] {
  return buildToneRounds(tier, seed);
}
