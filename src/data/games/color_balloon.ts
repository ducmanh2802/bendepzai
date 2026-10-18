/**
 * T02B/B10+A — Pop The Color Balloons data. Pure TypeScript.
 * T02B/B10: GRAY (Mỹ) → GREY (Anh–Anh); bóng trắng dùng chữ/viền tối.
 */

export interface ColorTarget {
  name: string;
  vietnamese: string;
  cssColor: string;
  hex: string;
}

export const COLOR_TARGETS: ColorTarget[] = [
  { name: 'RED', vietnamese: 'Màu đỏ', cssColor: 'bg-red-500', hex: '#EF4444' },
  { name: 'BLUE', vietnamese: 'Màu xanh dương', cssColor: 'bg-blue-500', hex: '#3B82F6' },
  { name: 'GREEN', vietnamese: 'Màu xanh lá', cssColor: 'bg-emerald-500', hex: '#10B981' },
  { name: 'YELLOW', vietnamese: 'Màu vàng', cssColor: 'bg-amber-400', hex: '#FBBF24' },
  { name: 'PURPLE', vietnamese: 'Màu tím', cssColor: 'bg-purple-500', hex: '#8B5CF6' },
  { name: 'ORANGE', vietnamese: 'Màu cam', cssColor: 'bg-orange-500', hex: '#F97316' },
  { name: 'PINK', vietnamese: 'Màu hồng', cssColor: 'bg-pink-500', hex: '#EC4899' },
  { name: 'BLACK', vietnamese: 'Màu đen', cssColor: 'bg-slate-900', hex: '#1F2937' },
  { name: 'WHITE', vietnamese: 'Màu trắng', cssColor: 'bg-white', hex: '#FFFFFF' },
  { name: 'BROWN', vietnamese: 'Màu nâu', cssColor: 'bg-amber-900', hex: '#78350F' },
  // T02B/B10 — British English spelling.
  { name: 'GREY', vietnamese: 'Màu xám', cssColor: 'bg-slate-500', hex: '#6B7280' },
];

export interface BalloonTierConfig {
  colorCount: number;
  spawnMs: number;
  speedMin: number;
  speedMax: number;
}

export const TIER_CONFIG: BalloonTierConfig[] = [
  { colorCount: 5, spawnMs: 1100, speedMin: 0.4, speedMax: 0.55 },
  { colorCount: 7, spawnMs: 1000, speedMin: 0.42, speedMax: 0.6 },
  { colorCount: 8, spawnMs: 900, speedMin: 0.44, speedMax: 0.66 },
  { colorCount: 9, spawnMs: 820, speedMin: 0.46, speedMax: 0.7 },
  { colorCount: 10, spawnMs: 720, speedMin: 0.5, speedMax: 0.78 },
  { colorCount: 11, spawnMs: 620, speedMin: 0.54, speedMax: 0.9 },
];

/** Palette (targets) for a tier — deterministic, seed-mixable for tests. */
export function paletteForTier(tier: number): ColorTarget[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), TIER_CONFIG.length);
  return COLOR_TARGETS.slice(0, TIER_CONFIG[safeTier - 1].colorCount);
}

/**
 * T02B/B10 — text/border classes for a balloon so WHITE stays readable
 * (dark text + outline) while saturated colours keep white text.
 */
export function balloonTextClass(colorName: string): string {
  if (colorName === 'WHITE') return 'text-slate-800 border-slate-400';
  if (colorName === 'YELLOW') return 'text-slate-900 border-white/60';
  return 'text-white border-white/50';
}

export interface BalloonRound {
  target: ColorTarget;
  palette: ColorTarget[];
}

/** Deterministic target sequence per (tier, seed) for tests. */
export function buildRounds(tier: number, seed = 0): BalloonRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), TIER_CONFIG.length);
  const palette = paletteForTier(safeTier);
  const rounds = 5 + (safeTier - 1 < 3 ? safeTier - 1 : 3);
  const out: BalloonRound[] = [];
  for (let i = 0; i < rounds; i++) {
    out.push({ target: palette[(i + seed) % palette.length], palette });
  }
  return out;
}
