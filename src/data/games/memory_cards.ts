/**
 * T02B/B12+A — Lật Thẻ Trí Nhớ (MemoryCards) data. Pure TypeScript.
 * T02B/B12: theo dõi THẺ đã lật (card id), không theo cặp (pair id).
 */

import { seededRng, shuffleSeeded } from '../gameLevels';

export interface PairDef {
  pairId: number;
  label: string;
  emoji: string;
}

export const PAIR_POOL: PairDef[] = [
  { pairId: 1, label: 'Quả táo', emoji: '🍎' },
  { pairId: 2, label: 'Mèo con', emoji: '🐱' },
  { pairId: 3, label: 'Cún cưng', emoji: '🐶' },
  { pairId: 4, label: 'Ngôi sao', emoji: '⭐' },
  { pairId: 5, label: 'Bông hoa', emoji: '🌸' },
  { pairId: 6, label: 'Mặt trời', emoji: '☀️' },
  { pairId: 7, label: 'Chiếc ô tô', emoji: '🚗' },
  { pairId: 8, label: 'Chú bướm', emoji: '🦋' },
  { pairId: 9, label: 'Quả dâu', emoji: '🍓' },
  { pairId: 10, label: 'Mặt trăng', emoji: '🌙' },
  { pairId: 11, label: 'Chú ếch', emoji: '🐸' },
  { pairId: 12, label: 'Quả chuối', emoji: '🍌' },
  { pairId: 13, label: 'Con thuyền', emoji: '⛵' },
  { pairId: 14, label: 'Ngôi nhà', emoji: '🏠' },
  { pairId: 15, label: 'Trái tim', emoji: '💖' },
  { pairId: 16, label: 'Chiếc bánh', emoji: '🍰' },
];

export const GOALS_PER_TIER = [3, 4, 5, 6, 7, 8];

export interface MemoryCard {
  id: number;
  pairId: number;
  label: string;
  emoji: string;
}

/**
 * T02B/B12 — a mismatch counts as a mistake ONLY when the child has already
 * seen BOTH card ids and still mismatches them. First-time exploration is
 * never punished. (Same truth table as the old pair-based helper, but keyed
 * by individual card ids so re-flipping one known + one new card is free.)
 */
export function shouldCountMemoryMistake(
  seenCardIds: readonly number[],
  cardAId: number,
  cardBId: number
): boolean {
  if (cardAId === cardBId) return false;
  const seen = new Set(seenCardIds);
  return seen.has(cardAId) && seen.has(cardBId);
}

/** Deterministic deck per (tier, seed) for tests. */
export function buildMemoryDeck(tier: number, seed = 0): MemoryCard[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), GOALS_PER_TIER.length);
  const goalPairs = GOALS_PER_TIER[safeTier - 1];
  const pool = PAIR_POOL.slice(0, goalPairs);
  const baseSeed = 10000 + safeTier * 133 + seed * 101;
  const shuffledPool = shuffleSeeded(pool, seededRng(baseSeed));
  const deck: MemoryCard[] = [];
  let idCounter = 1;
  shuffledPool.forEach((p) => {
    deck.push({ id: idCounter++, pairId: p.pairId, label: p.label, emoji: p.emoji });
    deck.push({ id: idCounter++, pairId: p.pairId, label: p.label, emoji: p.emoji });
  });
  return shuffleSeeded(deck, seededRng(baseSeed + 17));
}

export function buildRounds(tier: number, seed = 0): MemoryCard[][] {
  return [buildMemoryDeck(tier, seed)];
}
