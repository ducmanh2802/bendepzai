/**
 * T02B/B4+A — Xây Tháp Số (NumberTower) data. Pure TypeScript.
 * part1 + missing = total with NO carrying (lớp 1), total ≤ maxTotal.
 */

import { defaultRoundsPerTier, numericOptions, seededRng } from '../gameLevels';
import { isNoCarryAdd } from './mathUtils';

export interface TowerRound {
  part1: number;
  total: number;
  missing: number;
  options: number[];
}

/**
 * `seed` mixes the play nonce (component passes stage.nonce).
 */
export function buildTowerRounds(tier: number, seed = 0): TowerRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const roundsPerTier = defaultRoundsPerTier();
  const count = roundsPerTier[safeTier - 1];
  const maxTotal = safeTier <= 1 ? 5 : safeTier <= 3 ? 10 : 20;
  const rounds: TowerRound[] = [];
  for (let i = 0; i < count; i++) {
    const rng = seededRng(1300 + safeTier * 37 + seed * 1009 + i * 131);
    let total = 2;
    let part1 = 1;
    for (let tries = 0; tries < 80; tries++) {
      const candTotal = Math.floor(rng() * (maxTotal - 1)) + 2;
      const candPart = Math.floor(rng() * candTotal);
      const candMissing = candTotal - candPart;
      if (isNoCarryAdd(candPart, candMissing) && candTotal <= maxTotal) {
        total = candTotal;
        part1 = candPart;
        break;
      }
      if (tries === 79) {
        total = Math.min(10, maxTotal);
        part1 = Math.floor(total / 2);
      }
    }
    const missing = total - part1;
    const floor = safeTier >= 3 ? 1 : 0;
    const options = numericOptions(missing, 4, seededRng(1300 + safeTier * 37 + seed * 1009 + i * 131 + 7), floor, maxTotal);
    rounds.push({ part1, total, missing, options });
  }
  return rounds;
}

export function buildRounds(tier: number, seed = 0): TowerRound[] {
  return buildTowerRounds(tier, seed);
}
