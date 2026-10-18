/**
 * T02B/A — Bắt Chữ Cái Bay (CatchFallingLetters) data. Pure TypeScript.
 */

export interface CatchTierConfig {
  pool: string[];
  spawnMs: number;
  speedMin: number;
  speedMax: number;
}

export const TIER_CONFIG: CatchTierConfig[] = [
  { pool: ['A', 'B', 'C', 'D', 'E'], spawnMs: 1300, speedMin: 0.3, speedMax: 0.55 },
  { pool: ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I'], spawnMs: 1150, speedMin: 0.32, speedMax: 0.6 },
  { pool: ['A', 'B', 'C', 'D', 'Đ', 'E', 'G', 'H', 'I', 'K', 'L', 'M'], spawnMs: 1000, speedMin: 0.35, speedMax: 0.65 },
  { pool: ['A', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô'], spawnMs: 850, speedMin: 0.38, speedMax: 0.72 },
  { pool: ['A', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'U'], spawnMs: 700, speedMin: 0.42, speedMax: 0.8 },
  { pool: ['A', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'U', 'Ư', 'V'], spawnMs: 600, speedMin: 0.46, speedMax: 0.9 },
];

export const BUBBLE_COLORS = ['bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-purple-400', 'bg-pink-400'];

export function poolForTier(tier: number): string[] {
  return TIER_CONFIG[Math.min(Math.max(Math.round(tier), 1) - 1, TIER_CONFIG.length - 1)].pool;
}

/** Deterministic target-letter sequence per (tier, seed) for tests. */
export function buildRounds(tier: number, seed = 0): string[] {
  const pool = poolForTier(tier);
  const out: string[] = [];
  let a = (seed * 2654435761 + tier * 131) >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 8; i++) out.push(pool[Math.floor(rnd() * pool.length)]);
  return out;
}
