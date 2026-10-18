/**
 * T02B/B13+A — Bé Tập Vẽ (ColoringCanvas) data. Pure TypeScript.
 * T02B/B13: sao theo độ phủ (≥30% 1★, ≥60% 2★, ≥85% 3★).
 */

export interface ColoringTemplate {
  name: string;
  emoji: string;
}

export const TEMPLATES: ColoringTemplate[] = [
  { name: 'Ngôi Nhà Thân Thương', emoji: '🏠' },
  { name: 'Chú Gấu Nhí', emoji: '🐻' },
  { name: 'Bông Hoa Rực Rỡ', emoji: '🌸' },
  { name: 'Quả Táo Ngọt Ngào', emoji: '🍎' },
  { name: 'Chú Cá Đáng Yêu', emoji: '🐠' },
  { name: 'Chiếc Bánh Sinh Nhật', emoji: '🎂' },
];

export const COLORS = [
  '#EF4444',
  '#F97316',
  '#FBBF24',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#78350F',
  '#1F2937',
];

/** Minimum painted share before "Hoàn thành" grants a reward. */
export const MIN_PAINT_COVERAGE = 0.3;

/**
 * Share of pixels that differ from the blank white canvas.
 * The faint template outline (≈white, all channels ≥ 235) never counts.
 */
export function coverageFromPixels(data: Uint8ClampedArray | number[]): number {
  if (data.length < 4) return 0;
  const total = Math.floor(data.length / 4);
  let painted = 0;
  for (let i = 0; i < total; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    if (r < 235 || g < 235 || b < 235) painted++;
  }
  return painted / total;
}

/**
 * T02B/B13 — effective coverage excludes the faint template itself:
 * subtract the baseline snapshot taken right after the template is drawn.
 */
export function effectiveCoverage(raw: number, baseline: number): number {
  if (baseline >= 1) return 0;
  return Math.max(0, Math.min(1, (raw - baseline) / (1 - baseline)));
}

/** T02B/B13 — stars from coverage (0 when below the 30% gate). */
export function starsForCoverage(coverage: number): number {
  if (coverage >= 0.85) return 3;
  if (coverage >= 0.6) return 2;
  if (coverage >= MIN_PAINT_COVERAGE) return 1;
  return 0;
}

export function templateForTier(tier: number): ColoringTemplate {
  return TEMPLATES[Math.min(Math.max(Math.round(tier), 1) - 1, TEMPLATES.length - 1)];
}

export function buildRounds(tier: number, seed = 0): ColoringTemplate[] {
  void seed;
  return [templateForTier(tier)];
}
