/**
 * T02B/B11+A — Hứng Số Rơi (FallingNumbers) data. Pure TypeScript.
 * T02B/B11: bỏ "SỐ CHẴN" (T2 → "BÉ HƠN 5"); "SỐ TRÒN CHỤC" chỉ tính 10–90
 * (không tính 100).
 * T25 — sinh chuỗi bóng tất định theo (tier, nonce): 1/3 bóng thoả điều kiện,
 * 2/3 còn lại là bóng nhiễu ngay sát ngưỡng (19/21 khi tìm số tròn chục),
 * thay cho `Math.random` trong component khiến đề ngẫu nhiên không tái hiện
 * được và bóng đúng xuất hiện quá thưa.
 */

import { seededRng } from '../gameLevels';

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
    maxVal: 15, spawnMs: 1000, speedMin: 0.38, speedMax: 0.65,
  },
  {
    condition: { text: 'BÉ HƠN 7 (< 7)', check: (n) => n < 7, speech: 'Hứng các quả bóng có số bé hơn bảy' },
    maxVal: 20, spawnMs: 900, speedMin: 0.42, speedMax: 0.7,
  },
  {
    condition: { text: 'LỚN HƠN 10 (> 10)', check: (n) => n > 10, speech: 'Hứng các quả bóng có số lớn hơn mười' },
    maxVal: 30, spawnMs: 800, speedMin: 0.45, speedMax: 0.76,
  },
  // T02B/B11 — round tens strictly in 10..90 (100 excluded).
  {
    condition: { text: 'SỐ TRÒN CHỤC', check: (n) => n >= 10 && n <= 90 && n % 10 === 0, speech: 'Hứng các quả bóng mang số tròn chục' },
    maxVal: 70, spawnMs: 720, speedMin: 0.48, speedMax: 0.82,
  },
  {
    condition: { text: 'SỐ LIỀN SAU SỐ TRÒN CHỤC', check: (n) => n > 10 && n % 10 === 1, speech: 'Hứng các quả bóng mang số liền sau số tròn chục' },
    maxVal: 100, spawnMs: 650, speedMin: 0.52, speedMax: 0.9,
  },
];

export function configForTier(tier: number): FallingTierConfig {
  return TIER_CONFIG[Math.min(Math.max(Math.round(tier), 1) - 1, TIER_CONFIG.length - 1)];
}

/** Deterministic round descriptors per (tier, seed) for tests. */
export function buildRounds(tier: number, seed = 0): { tier: number; maxVal: number; sample: number[] }[] {
  const cfg = configForTier(tier);
  const rng = seededRng(seed * 2654435761 + tier * 97);
  return [{ tier, maxVal: cfg.maxVal, sample: Array.from({ length: 8 }, () => 1 + Math.floor(rng() * cfg.maxVal)) }];
}

export interface FallingBallSpec {
  val: number;
  /** Vị trí ngang tính theo %. */
  x: number;
  speed: number;
}

/**
 * Chuỗi bóng cho 1 lần chơi: mỗi nhịp 1 bóng, cứ 3 bóng thì 1 bóng thoả điều
 * kiện; bóng nhiễu lấy ngay sát ngưỡng (±1, ±2) để bé phải đọc và so số thật,
 * không nhìn to/nhỏ là đoán được.
 */
export function spawnSequence(tier: number, nonce = 0, count = 48): FallingBallSpec[] {
  const cfg = configForTier(tier);
  const check = cfg.condition.check;
  const hits: number[] = [];
  const misses: number[] = [];
  for (let n = 1; n <= cfg.maxVal; n++) (check(n) ? hits : misses).push(n);
  // Bẫy ngưỡng: số SAI nhưng chỉ lệch 1–2 đơn vị khỏi một số ĐÚNG
  // (19/21/29 khi bé phải hứng số tròn chục). Không có quả nào thì thôi.
  const traps = misses.filter((v) => hits.some((h) => Math.abs(h - v) <= 2));
  const hitSource = hits.length ? hits : misses;
  const rng = seededRng(2_025_103 + tier * 8_191 + nonce * 1_047_291);
  const balls: FallingBallSpec[] = [];
  for (let i = 0; i < count; i++) {
    const isHit = i % 3 === 0 || misses.length === 0;
    // 4/5 bóng sai là bẫy ngưỡng, phần còn lại lấy lan man trong 1..maxVal để
    // màn không chỉ có toàn số sát nhau.
    const useTrap = !isHit && traps.length > 0 && rng() < 0.8;
    const source = isHit ? hitSource : useTrap ? traps : misses;
    const val = source[Math.floor(rng() * source.length)];
    balls.push({
      val,
      x: 12 + Math.floor(rng() * 75),
      speed: cfg.speedMin + rng() * (cfg.speedMax - cfg.speedMin),
    });
  }
  return balls;
}
