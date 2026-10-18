/**
 * T02B/B11+A — Hứng Số Rơi (FallingNumbers) data. Pure TypeScript.
 * T02B/B11: bỏ "SỐ CHẴN" (T2 → "BÉ HƠN 5"); "SỐ TRÒN CHỤC" chỉ tính 10–90
 * (không tính 100).
 */

export interface Condition {
  text: string;
  check: (n: number) => boolean;
  speech: string;
}

export interface FallingTierConfig {
  condition: Condition;
  maxVal: number;
  spawnMs: number;
  speedMin: number;
  speedMax: number;
}

export const TIER_CONFIG: FallingTierConfig[] = [
  {
    condition: { text: 'LỚN HƠN 5 (> 5)', check: (n) => n > 5, speech: 'Hứng các quả bóng có số lớn hơn năm' },
    maxVal: 10, spawnMs: 1100, speedMin: 0.35, speedMax: 0.6,
  },
  // T02B/B11 — "SỐ CHẴN" removed; T2 mirrors T1 from below.
  {
    condition: { text: 'BÉ HƠN 5 (< 5)', check: (n) => n < 5, speech: 'Hứng các quả bóng có số bé hơn năm' },
    maxVal: 10, spawnMs: 1000, speedMin: 0.35, speedMax: 0.62,
  },
  {
    condition: { text: 'BÉ HƠN 7 (< 7)', check: (n) => n < 7, speech: 'Hứng các quả bóng có số bé hơn bảy' },
    maxVal: 12, spawnMs: 900, speedMin: 0.38, speedMax: 0.68,
  },
  {
    condition: { text: 'LỚN HƠN 10 (> 10)', check: (n) => n > 10, speech: 'Hứng các quả bóng có số lớn hơn mười' },
    maxVal: 20, spawnMs: 850, speedMin: 0.4, speedMax: 0.72,
  },
  // T02B/B11 — round tens strictly in 10..90 (100 excluded).
  {
    condition: { text: 'SỐ TRÒN CHỤC', check: (n) => n >= 10 && n <= 90 && n % 10 === 0, speech: 'Hứng các quả bóng mang số tròn chục' },
    maxVal: 90, spawnMs: 750, speedMin: 0.42, speedMax: 0.78,
  },
  {
    condition: { text: 'SỐ LIỀN SAU SỐ TRÒN CHỤC', check: (n) => n > 10 && n % 10 === 1, speech: 'Hứng các quả bóng mang số liền sau số tròn chục' },
    maxVal: 100, spawnMs: 650, speedMin: 0.46, speedMax: 0.86,
  },
];

export function configForTier(tier: number): FallingTierConfig {
  return TIER_CONFIG[Math.min(Math.max(Math.round(tier), 1) - 1, TIER_CONFIG.length - 1)];
}

/** Deterministic round descriptors per (tier, seed) for tests. */
export function buildRounds(tier: number, seed = 0): { tier: number; maxVal: number; sample: number[] }[] {
  const cfg = configForTier(tier);
  let a = (seed * 2654435761 + tier * 97) >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return [{ tier, maxVal: cfg.maxVal, sample: Array.from({ length: 8 }, () => Math.floor(rnd() * cfg.maxVal) + 1) }];
}
