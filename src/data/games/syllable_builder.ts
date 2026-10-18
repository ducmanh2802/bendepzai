/**
 * T02B/B1 — Xưởng Ghép Tiếng (SyllableBuilder) data.
 * Pure TypeScript: no React imports. The component only imports from here.
 *
 * Every entry satisfies composeSyllable(i, v, t) === w (NFC), so the game
 * can never mark a wrong split as correct.
 */

import { seededRng, shuffleSeeded } from '../gameLevels';

export interface SyllablePuzzle {
  word: string;
  emoji: string;
  initial: string;
  vowel: string;
  tone: string;
  toneSymbol: string;
  readAloud: string;
}

export interface SyllableSeed {
  w: string;
  i: string;
  v: string;
  t: string;
  sym: string;
  emoji: string;
}

export type ToneName = 'ngang' | 'sắc' | 'huyền' | 'hỏi' | 'ngã' | 'nặng';

/** Base vowel -> tone -> composed vowel (precomposed, NFC). */
const TONE_VOWEL: Record<string, Record<ToneName, string>> = {
  a: { ngang: 'a', sắc: 'á', huyền: 'à', hỏi: 'ả', ngã: 'ã', nặng: 'ạ' },
  e: { ngang: 'e', sắc: 'é', huyền: 'è', hỏi: 'ẻ', ngã: 'ẽ', nặng: 'ẹ' },
  ê: { ngang: 'ê', sắc: 'ế', huyền: 'ề', hỏi: 'ể', ngã: 'ễ', nặng: 'ệ' },
  i: { ngang: 'i', sắc: 'í', huyền: 'ì', hỏi: 'ỉ', ngã: 'ĩ', nặng: 'ị' },
  o: { ngang: 'o', sắc: 'ó', huyền: 'ò', hỏi: 'ỏ', ngã: 'õ', nặng: 'ọ' },
  u: { ngang: 'u', sắc: 'ú', huyền: 'ù', hỏi: 'ủ', ngã: 'ũ', nặng: 'ụ' },
};

/**
 * Compose onset + rhyme vowel + tone into a full syllable (NFC).
 * Example: composeSyllable('c', 'a', 'sắc') === 'cá'.
 */
export function composeSyllable(onset: string, rhyme: string, tone: string): string {
  const row = TONE_VOWEL[rhyme];
  const vowel = row ? (row[tone as ToneName] ?? rhyme) : rhyme;
  return `${onset}${vowel}`.normalize('NFC');
}

const TONE_NAMES: Record<string, string> = {
  ngang: 'ngang', sắc: 'sắc', huyền: 'huyền', hỏi: 'hỏi', ngã: 'ngã', nặng: 'nặng',
};

function seed(v: SyllableSeed): SyllablePuzzle {
  return {
    word: v.w,
    emoji: v.emoji,
    initial: v.i,
    vowel: v.v,
    tone: v.t,
    toneSymbol: v.sym,
    readAloud: `${v.i} - ${v.v} - ${v.i}${v.v} - ${TONE_NAMES[v.t]} - ${v.w}`,
  };
}

/**
 * T02B/B1 — fixed pools. Removed: thề, thuê, mù, đô (unmodellable or sad),
 * đa (→ la), che (→ lè), mê (→ me), hề (→ bế/dế/lê), bố/dỗ (→ bó/đỏ),
 * lúa (→ lá), tô/đồ/đổ/đỗ (→ đo/đò/đọ/to/lò). li emoji → 🥛.
 */
export const POOL_BY_TIER: SyllableSeed[][] = [
  // T1 — vần a (đa → la)
  [
    { w: 'cá', i: 'c', v: 'a', t: 'sắc', sym: '´', emoji: '🐟' },
    { w: 'gà', i: 'g', v: 'a', t: 'huyền', sym: '`', emoji: '🐓' },
    { w: 'bà', i: 'b', v: 'a', t: 'huyền', sym: '`', emoji: '👵' },
    { w: 'ba', i: 'b', v: 'a', t: 'ngang', sym: '-', emoji: '👨' },
    { w: 'ca', i: 'c', v: 'a', t: 'ngang', sym: '-', emoji: '🎤' },
    { w: 'cà', i: 'c', v: 'a', t: 'huyền', sym: '`', emoji: '🍆' },
    { w: 'ga', i: 'g', v: 'a', t: 'ngang', sym: '-', emoji: '🚂' },
    { w: 'má', i: 'm', v: 'a', t: 'sắc', sym: '´', emoji: '👩' },
    { w: 'mạ', i: 'm', v: 'a', t: 'nặng', sym: '.', emoji: '🌾' },
    { w: 'la', i: 'l', v: 'a', t: 'ngang', sym: '-', emoji: '📢' },
    { w: 'thả', i: 'th', v: 'a', t: 'hỏi', sym: '?', emoji: '🪁' },
    { w: 'dạ', i: 'd', v: 'a', t: 'nặng', sym: '.', emoji: '🙋' },
  ],
  // T2 — vần e / ê (bỏ thề, thuê; che→lè, mê→me, hề→bế/dế/lê)
  [
    { w: 'bé', i: 'b', v: 'e', t: 'sắc', sym: '´', emoji: '👶' },
    { w: 'bè', i: 'b', v: 'e', t: 'huyền', sym: '`', emoji: '🛶' },
    { w: 'me', i: 'm', v: 'e', t: 'ngang', sym: '-', emoji: '🌳' },
    { w: 'mè', i: 'm', v: 'e', t: 'huyền', sym: '`', emoji: '🐟' },
    { w: 'thẻ', i: 'th', v: 'e', t: 'hỏi', sym: '?', emoji: '🎫' },
    { w: 'lè', i: 'l', v: 'e', t: 'huyền', sym: '`', emoji: '😛' },
    { w: 'bế', i: 'b', v: 'ê', t: 'sắc', sym: '´', emoji: '🤱' },
    { w: 'dế', i: 'd', v: 'ê', t: 'sắc', sym: '´', emoji: '🦗' },
    { w: 'lê', i: 'l', v: 'ê', t: 'ngang', sym: '-', emoji: '🍐' },
    { w: 'bê', i: 'b', v: 'ê', t: 'ngang', sym: '-', emoji: '🐄' },
    { w: 'dê', i: 'd', v: 'ê', t: 'ngang', sym: '-', emoji: '🐐' },
    { w: 'mề', i: 'm', v: 'ê', t: 'huyền', sym: '`', emoji: '🐔' },
  ],
  // T3 — vần o (bố→bó, dỗ→đỏ)
  [
    { w: 'cò', i: 'c', v: 'o', t: 'huyền', sym: '`', emoji: '🦢' },
    { w: 'cỏ', i: 'c', v: 'o', t: 'hỏi', sym: '?', emoji: '🌱' },
    { w: 'có', i: 'c', v: 'o', t: 'sắc', sym: '´', emoji: '✨' },
    { w: 'cọ', i: 'c', v: 'o', t: 'nặng', sym: '.', emoji: '🖌️' },
    { w: 'bò', i: 'b', v: 'o', t: 'huyền', sym: '`', emoji: '🐮' },
    { w: 'bỏ', i: 'b', v: 'o', t: 'hỏi', sym: '?', emoji: '🗑️' },
    { w: 'bọ', i: 'b', v: 'o', t: 'nặng', sym: '.', emoji: '🐛' },
    { w: 'bó', i: 'b', v: 'o', t: 'sắc', sym: '´', emoji: '💐' },
    { w: 'gò', i: 'g', v: 'o', t: 'huyền', sym: '`', emoji: '⛰️' },
    { w: 'gõ', i: 'g', v: 'o', t: 'ngã', sym: '~', emoji: '🚪' },
    { w: 'mò', i: 'm', v: 'o', t: 'huyền', sym: '`', emoji: '🦀' },
    { w: 'đỏ', i: 'đ', v: 'o', t: 'hỏi', sym: '?', emoji: '🔴' },
  ],
  // T4 — vần u (bỏ mù → lu)
  [
    { w: 'cú', i: 'c', v: 'u', t: 'sắc', sym: '´', emoji: '🦉' },
    { w: 'củ', i: 'c', v: 'u', t: 'hỏi', sym: '?', emoji: '🥔' },
    { w: 'cụ', i: 'c', v: 'u', t: 'nặng', sym: '.', emoji: '👴' },
    { w: 'cũ', i: 'c', v: 'u', t: 'ngã', sym: '~', emoji: '👕' },
    { w: 'bú', i: 'b', v: 'u', t: 'sắc', sym: '´', emoji: '🍼' },
    { w: 'gù', i: 'g', v: 'u', t: 'huyền', sym: '`', emoji: '🕊️' },
    { w: 'lu', i: 'l', v: 'u', t: 'ngang', sym: '-', emoji: '🏺' },
    { w: 'mũ', i: 'm', v: 'u', t: 'ngã', sym: '~', emoji: '🧢' },
    { w: 'thu', i: 'th', v: 'u', t: 'ngang', sym: '-', emoji: '🍂' },
    { w: 'thủ', i: 'th', v: 'u', t: 'hỏi', sym: '?', emoji: '🥅' },
    { w: 'thú', i: 'th', v: 'u', t: 'sắc', sym: '´', emoji: '🐱' },
    { w: 'dù', i: 'd', v: 'u', t: 'huyền', sym: '`', emoji: '☂️' },
  ],
  // T5 — vần i (li → 🥛)
  [
    { w: 'bi', i: 'b', v: 'i', t: 'ngang', sym: '-', emoji: '🔮' },
    { w: 'bí', i: 'b', v: 'i', t: 'sắc', sym: '´', emoji: '🎃' },
    { w: 'bị', i: 'b', v: 'i', t: 'nặng', sym: '.', emoji: '🤒' },
    { w: 'dì', i: 'd', v: 'i', t: 'huyền', sym: '`', emoji: '👩‍👧' },
    { w: 'gì', i: 'g', v: 'i', t: 'huyền', sym: '`', emoji: '❓' },
    { w: 'mi', i: 'm', v: 'i', t: 'ngang', sym: '-', emoji: '👀' },
    { w: 'mí', i: 'm', v: 'i', t: 'sắc', sym: '´', emoji: '👁️' },
    { w: 'thi', i: 'th', v: 'i', t: 'ngang', sym: '-', emoji: '📝' },
    { w: 'thì', i: 'th', v: 'i', t: 'huyền', sym: '`', emoji: '⏳' },
    { w: 'đi', i: 'đ', v: 'i', t: 'ngang', sym: '-', emoji: '🚶' },
    { w: 'ti', i: 't', v: 'i', t: 'ngang', sym: '-', emoji: '📺' },
    { w: 'li', i: 'l', v: 'i', t: 'ngang', sym: '-', emoji: '🥛' },
  ],
  // T6 — ôn tập (bỏ đô; lúa→lá; đồ→đò; đỗ/đổ→đo/đọ; tô→to)
  [
    { w: 'đá', i: 'đ', v: 'a', t: 'sắc', sym: '´', emoji: '⚽' },
    { w: 'lá', i: 'l', v: 'a', t: 'sắc', sym: '´', emoji: '🍃' },
    { w: 'na', i: 'n', v: 'a', t: 'ngang', sym: '-', emoji: '🍈' },
    { w: 'no', i: 'n', v: 'o', t: 'ngang', sym: '-', emoji: '🍚' },
    { w: 'nụ', i: 'n', v: 'u', t: 'nặng', sym: '.', emoji: '🌷' },
    { w: 'đo', i: 'đ', v: 'o', t: 'ngang', sym: '-', emoji: '📏' },
    { w: 'đò', i: 'đ', v: 'o', t: 'huyền', sym: '`', emoji: '🚣' },
    { w: 'đọ', i: 'đ', v: 'o', t: 'nặng', sym: '.', emoji: '💪' },
    { w: 'tí', i: 't', v: 'i', t: 'sắc', sym: '´', emoji: '🤏' },
    { w: 'to', i: 't', v: 'o', t: 'ngang', sym: '-', emoji: '📦' },
    { w: 'tủ', i: 't', v: 'u', t: 'hỏi', sym: '?', emoji: '🗄️' },
    { w: 'lò', i: 'l', v: 'o', t: 'huyền', sym: '`', emoji: '🔥' },
  ],
];

export const SYLLABLE_ROUNDS_PER_TIER = [4, 4, 5, 5, 6, 6];

export function buildSyllableRounds(tier: number, seedOrNonce = 0, seedOverride?: number): SyllablePuzzle[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), POOL_BY_TIER.length);
  const count = SYLLABLE_ROUNDS_PER_TIER[safeTier - 1];
  const pool = POOL_BY_TIER[safeTier - 1];
  const shuffled = shuffleSeeded(pool, seededRng(seedOverride ?? 8900 + safeTier * 53 + seedOrNonce * 1009));
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(seed);
}

/** Back-compat alias: old components called buildRounds(tier, nonce, seedOverride). */
export function buildRounds(tier: number, seed = 0): SyllablePuzzle[] {
  return buildSyllableRounds(tier, seed);
}

export const INITIAL_OPTIONS = ['c', 'b', 'g', 'm', 'th', 'd', 'đ', 'l', 'n', 't'];
export const VOWEL_OPTIONS = ['a', 'e', 'o', 'u', 'i', 'ê'];
export const TONE_OPTIONS = [
  { label: 'Không dấu', val: 'ngang', sym: '-' },
  { label: 'Dấu Sắc (/)', val: 'sắc', sym: '´' },
  { label: 'Dấu Huyền (\\)', val: 'huyền', sym: '`' },
  { label: 'Dấu Hỏi (?)', val: 'hỏi', sym: '?' },
  { label: 'Dấu Ngã (~)', val: 'ngã', sym: '~' },
  { label: 'Dấu Nặng (.)', val: 'nặng', sym: '.' },
];
