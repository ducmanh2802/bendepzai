/**
 * T02B/B5+A — Săn Vần (RhymeHunter) data. Pure TypeScript.
 *
 * T02B/B5: stripTones chỉ bỏ 5 dấu THANH (sắc/huyền/hỏi/ngã/nặng),
 * giữ nguyên mũ/móc (ă â ê ô ơ ư đ) nên "on" ≠ "ôn", "an" ≠ "ăn".
 * "cái khăn" (ăn) → "con ngan" (an); "mặt đất" (ất) → "mát mẻ" (át);
 * họ "on" dùng toàn từ vần "on" thật (con/lon/non/ngon).
 */

import { defaultRoundsPerTier, pickDistinct, roundsForTier, seededRng, shuffleSeeded } from '../gameLevels';

export interface RhymeFruit {
  id: string;
  word: string;
  hasRhyme: boolean;
  emoji: string;
  picked: boolean;
}

export interface RhymeRound {
  targetRhyme: string;
  targetDescription: string;
  fruits: RhymeFruit[];
}

export const RHYME_FAMILIES: { rhyme: string; words: string[] }[] = [
  { rhyme: 'an', words: ['cái bàn', 'bạn Lan', 'cái can', 'con ngan'] },
  { rhyme: 'on', words: ['chú thỏ con', 'lon ton', 'cỏ non', 'kẹo ngon'] },
  { rhyme: 'at', words: ['hạt cát', 'ca hát', 'bát ngát', 'mát mẻ'] },
  { rhyme: 'ach', words: ['quyển sách', 'tách trà', 'vá rách', 'viên gạch'] },
  { rhyme: 'anh', words: ['cây xanh', 'anh trai', 'bức tranh', 'cành chanh'] },
  { rhyme: 'ay', words: ['máy bay', 'đôi tay', 'cỏ may', 'bàn tay'] },
];

export const DISTRACTOR_POOL = [
  'hoa sen', 'mặt trời', 'quả cam', 'búp bê',
  'cây bàng', 'củ cà rốt', 'quả táo', 'đám mây',
  'bông hồng', 'chú mèo', 'cái ghế', 'quả chuối',
  'quả dâu', 'chiếc ô tô', 'ngôi sao',
];

const FRUIT_EMOJI = ['🍎', '🍐', '🍊', '🍑', '🍓', '🍇', '🍉', '🍒', '🥭', '🍌'] as const;

/**
 * T02B/B5 — lowercase + strip ONLY the 5 tone marks. Circumflex / breve /
 * horn (â ă ê ô ơ ư) and đ are preserved, so ă≠a, ô≠o, ơ≠o.
 */
export function stripTones(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFC');
}

/** Does the word contain the target rhyme (tone-insensitive, shape-sensitive)? */
export function containsRhyme(word: string, rhyme: string): boolean {
  return stripTones(word).includes(stripTones(rhyme));
}

const ROUNDS_PER_TIER = defaultRoundsPerTier();

/**
 * Decoys are filtered by RHYME (never contain the target rhyme); every tier
 * builds ≥ 5 rounds. `seed` mixes the play nonce.
 */
export function buildRhymeRounds(tier: number, seedOrNonce = 0, seedOverride?: number): RhymeRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const base = seedOverride ?? 5600 + safeTier * 61 + seedOrNonce * 1009;
  const count = Math.max(5, roundsForTier(safeTier));
  const rng = seededRng(base);
  const fams = shuffleSeeded(RHYME_FAMILIES, rng);
  const targetCount = safeTier <= 2 ? 2 : safeTier <= 4 ? 3 : 4;
  const rounds: RhymeRound[] = [];
  let fruitId = 0;
  for (let i = 0; i < count; i++) {
    const fam = fams[i % fams.length];
    const roundRng = seededRng(base + i * 101);
    const targets = pickDistinct(fam.words, 4, roundRng).slice(0, targetCount);
    const distractorCount = Math.max(2, 6 - targetCount);
    const safeDecoys = DISTRACTOR_POOL.filter(
      (w) => !fam.words.includes(w) && !containsRhyme(w, fam.rhyme)
    );
    const distractors = pickDistinct(
      safeDecoys,
      distractorCount,
      seededRng(base + i * 101 + 7)
    );
    const fruits: RhymeFruit[] = [
      ...targets.map((w) => ({ id: `r${i}-${fruitId++}`, word: w, hasRhyme: true as const, emoji: FRUIT_EMOJI[Math.floor(roundRng() * FRUIT_EMOJI.length)], picked: false })),
      ...distractors.map((w) => ({ id: `r${i}-${fruitId++}`, word: w, hasRhyme: false as const, emoji: FRUIT_EMOJI[Math.floor(roundRng() * FRUIT_EMOJI.length)], picked: false })),
    ];
    rounds.push({
      targetRhyme: fam.rhyme,
      targetDescription: `vần "${fam.rhyme.toUpperCase()}"`,
      fruits: shuffleSeeded(fruits, seededRng(base + i * 733)),
    });
  }
  return rounds;
}

export function buildRounds(tier: number, seed = 0): RhymeRound[] {
  return buildRhymeRounds(tier, seed);
}
