import { GAME_LEVEL_POLICY } from '../config/policy';

export type GameTierMeta = (typeof GAME_LEVEL_POLICY.TIERS)[number];

/** Clamp a tier number into the valid 1..MAX_TIER range. */
export function clampTier(tier: number): number {
  if (!Number.isFinite(tier)) return 1;
  return Math.min(Math.max(Math.round(tier), 1), GAME_LEVEL_POLICY.MAX_TIER);
}

/** Identity (name/emoji/color/blurb) for a tier number (1-based). */
export function getTierMeta(tier: number): GameTierMeta {
  return GAME_LEVEL_POLICY.TIERS[clampTier(tier) - 1];
}

/**
 * Deterministic mulberry32 generator. Game builders seed from the tier so a
 * given tier always produces the same rounds — keeping tests reproducible and
 * letting two children compare scores fairly.
 */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle using a seeded RNG (non-mutating). */
export function shuffleSeeded<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Deterministically pick `count` distinct items from a pool. */
export function pickDistinct<T>(pool: readonly T[], count: number, rng: () => number): T[] {
  return shuffleSeeded(pool, rng).slice(0, Math.min(count, pool.length));
}

/**
 * Build `count` distinct numeric options that always include `answer`.
 * Distractors stay within [min, max] and near the answer so they are plausible.
 */
export function numericOptions(
  answer: number,
  count: number,
  rng: () => number,
  min = 0,
  max = 20
): number[] {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < count && guard < 200) {
    guard++;
    const spread = Math.max(1, Math.ceil(Math.abs(answer) * 0.5) + 1);
    const delta = Math.floor(rng() * (spread * 2 + 1)) - spread;
    const candidate = answer + delta;
    if (candidate < min || candidate > max || candidate === answer) continue;
    set.add(candidate);
  }
  // Fallback fill if the range was too tight.
  let fill = min;
  while (set.size < count && fill <= max) {
    set.add(fill++);
  }
  return shuffleSeeded([...set], rng);
}

/** Number of rounds/objectives for a tier, clamped to the policy array. */
export function roundsForTier(tier: number): number {
  const idx = clampTier(tier) - 1;
  const arr = GAME_LEVEL_POLICY.ROUNDS_PER_TIER;
  return arr[Math.min(idx, arr.length - 1)];
}

/**
 * Full rounds-per-tier array. Games may override individual tiers but should
 * default to this so their level HUD and progress bar stay consistent.
 */
export function defaultRoundsPerTier(): number[] {
  return GAME_LEVEL_POLICY.TIERS.map((_, i) => roundsForTier(i + 1));
}
