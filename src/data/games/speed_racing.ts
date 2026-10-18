/**
 * T02B/B4+A — Đường Đua Toán Học (MathSpeedRacing) data. Pure TypeScript.
 * Lớp 1: cộng KHÔNG nhớ, trừ KHÔNG mượn, kết quả 0–100, tổng ≤ max.
 */

import { defaultRoundsPerTier, numericOptions, seededRng } from '../gameLevels';
import { isNoBorrowSub, isNoCarryAdd } from './mathUtils';

export interface MathQuestion {
  expr: string;
  ans: number;
  options: number[];
}

/**
 * `seed` mixes the play nonce (component passes stage.nonce), so replays
 * generate different questions instead of replaying identically.
 */
export function buildRaceQuestions(tier: number, seed = 0): MathQuestion[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const roundsPerTier = defaultRoundsPerTier();
  const count = roundsPerTier[safeTier - 1];
  const max = safeTier <= 1 ? 5 : safeTier <= 3 ? 10 : safeTier === 4 ? 15 : 20;
  const questions: MathQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const rng = seededRng(3400 + safeTier * 71 + seed * 1009 + i * 229);
    const useSub = rng() < (safeTier >= 2 ? 0.45 : 0.2);
    if (useSub) {
      let a = 2;
      let b = 1;
      for (let tries = 0; tries < 60; tries++) {
        const candA = Math.max(2, Math.floor(rng() * max) + 1);
        const candB = Math.max(1, Math.floor(rng() * candA) + 1);
        if (isNoBorrowSub(candA, candB)) {
          a = candA;
          b = candB;
          break;
        }
        if (tries === 59) {
          a = candA;
          b = candA;
        }
      }
      const ans = a - b;
      questions.push({ expr: `${a} - ${b}`, ans, options: numericOptions(ans, 4, rng, 0, max) });
    } else {
      // No-carry addition with a + b ≤ max (never overflows the tier range).
      let a = 1;
      let b = 1;
      for (let tries = 0; tries < 80; tries++) {
        const candA = Math.floor(rng() * max) + 1;
        const room = max - candA;
        if (room < 1) continue;
        const candB = Math.floor(rng() * room) + 1;
        if (isNoCarryAdd(candA, candB) && candA + candB <= max) {
          a = candA;
          b = candB;
          break;
        }
        if (tries === 79) {
          a = 1;
          b = 1;
        }
      }
      const ans = a + b;
      questions.push({ expr: `${a} + ${b}`, ans, options: numericOptions(ans, 4, rng, 0, max) });
    }
  }
  return questions;
}

export function buildRounds(tier: number, seed = 0): MathQuestion[] {
  return buildRaceQuestions(tier, seed);
}
