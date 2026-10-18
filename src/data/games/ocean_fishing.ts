/**
 * T02B/B4+A — Câu Cá Đại Dương (OceanFishing) data. Pure TypeScript.
 * Lớp 1: trừ KHÔNG mượn, kết quả 0–100.
 */

import { defaultRoundsPerTier, numericOptions, seededRng, shuffleSeeded } from '../gameLevels';
import { isNoBorrowSub } from './mathUtils';

export interface FishItem {
  val: number;
  emoji: string;
  color: string;
}

export interface FishQuestion {
  expr: string;
  ans: number;
  fishPool: FishItem[];
}

const FISH_EMOJI = ['🐠', '🐟', '🐡'] as const;
const FISH_COLORS = ['text-amber-500', 'text-blue-500', 'text-rose-500', 'text-emerald-500', 'text-purple-500', 'text-teal-500'] as const;

/**
 * Every subtraction keeps a ≥ b with NO borrowing and ans in 0..maxA.
 * `seedOrNonce` mixes the play nonce (component passes stage.nonce);
 * `seedOverride` pins an exact seed for deterministic tests.
 */
export function buildFishRounds(tier: number, seedOrNonce = 0, seedOverride?: number): FishQuestion[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const roundsPerTier = defaultRoundsPerTier();
  const count = roundsPerTier[safeTier - 1];
  const maxA = safeTier <= 1 ? 5 : safeTier <= 3 ? 10 : 20;
  const base = seedOverride ?? 2300 + safeTier * 53 + seedOrNonce * 1009;
  const rounds: FishQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const rngI = seededRng(base + i * 157);
    let a = 2;
    let b = 1;
    // Rejection-sample a no-borrow pair (bounded: always terminates because
    // a==b is a valid no-borrow pair).
    for (let tries = 0; tries < 60; tries++) {
      const candA = Math.max(2, Math.floor(rngI() * maxA) + 1);
      const candB = Math.max(1, Math.floor(rngI() * candA) + 1);
      if (isNoBorrowSub(candA, candB) && candA <= maxA) {
        a = candA;
        b = candB;
        break;
      }
      if (tries === 59) {
        a = candA;
        b = candA; // ans 0, trivially no-borrow
      }
    }
    const ans = a - b;
    const vals = numericOptions(ans, 4, rngI, 0, maxA);
    const fishPool = vals.map((val, idx) => ({
      val,
      emoji: FISH_EMOJI[idx % FISH_EMOJI.length],
      color: FISH_COLORS[Math.floor(rngI() * FISH_COLORS.length)],
    }));
    rounds.push({
      expr: `${a} - ${b}`,
      ans,
      fishPool: shuffleSeeded(fishPool, seededRng(base + i * 911)),
    });
  }
  return rounds;
}

export function buildRounds(tier: number, seed = 0): FishQuestion[] {
  return buildFishRounds(tier, seed);
}
