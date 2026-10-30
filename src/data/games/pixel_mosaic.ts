/**
 * Bé Xếp Hình Mosaic (pixel mosaic) data. Pure TypeScript.
 *
 * Mỗi màn là một bức tranh pixel nhỏ. Bé chọn màu trong bảng màu rồi chạm
 * từng ô để ghép đúng bức tranh. Màn 1–2 có "bóng mờ" gợi ý màu, màn cao
 * hơn phải nhìn tranh mẫu để tự ghép.
 */

import { seededRng, shuffleSeeded } from '../gameLevels';

export interface MosaicColor {
  key: string;
  hex: string;
  label: string;
}

const PALETTE: Record<string, MosaicColor> = {
  R: { key: 'R', hex: '#ef4444', label: 'Đỏ' },
  O: { key: 'O', hex: '#f97316', label: 'Cam' },
  Y: { key: 'Y', hex: '#facc15', label: 'Vàng' },
  G: { key: 'G', hex: '#22c55e', label: 'Xanh lá' },
  B: { key: 'B', hex: '#3b82f6', label: 'Xanh dương' },
  P: { key: 'P', hex: '#ec4899', label: 'Hồng' },
  T: { key: 'T', hex: '#a16207', label: 'Nâu' },
  W: { key: 'W', hex: '#e2e8f0', label: 'Trắng' },
};

export interface MosaicPattern {
  id: string;
  name: string;
  emoji: string;
  size: number;
  rows: string[];
  /** Chỉ những màu thật sự dùng trong tranh. */
  colors: MosaicColor[];
}

function makePattern(id: string, name: string, emoji: string, rows: string[]): MosaicPattern {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const ch of row) {
      if (ch !== '.') keys.add(ch);
    }
  }
  const colors = Array.from(keys)
    .sort()
    .map((k) => PALETTE[k]);
  return { id, name, emoji, size: rows.length, rows, colors };
}

export const MOSAIC_PATTERNS: MosaicPattern[] = [
  // 3×3
  makePattern('tree', 'Cái cây', '🌳', ['G.G', 'GGG', '.T.']),
  makePattern('house', 'Ngôi nhà', '🏠', ['.R.', 'RRR', 'YTY']),
  makePattern('fish', 'Con cá', '🐟', ['.B.', 'BBO', '.B.']),
  makePattern('sun', 'Mặt trời', '☀️', ['Y.Y', 'YOY', 'Y.Y']),
  makePattern('flower', 'Bông hoa', '🌸', ['.P.', 'PYP', '.G.']),
  // 4×4
  makePattern('heart', 'Trái tim', '💖', ['.R.R', 'RWRR', 'RRRR', '.RR.']),
  makePattern('diamond', 'Kim cương', '💎', ['..W.', '.BBB', 'BBBB', '.BB.']),
  makePattern('mushroom', 'Cây nấm', '🍄', ['.RR.', 'RRRR', '.WW.', '.WW.']),
  makePattern('umbrella', 'Cái ô', '☂️', ['.PP.', 'PPPP', '..T.', '..T.']),
  makePattern('butterfly', 'Con bướm', '🦋', ['P..P', 'PPPP', 'PPBP', 'P..P']),
  makePattern('boat', 'Con thuyền', '⛵', ['..W.', '.WWW', 'BBBB', 'BBBB']),
  // 5×5
  makePattern('big_house', 'Ngôi nhà lớn', '🏠', ['..R..', '.RRR.', 'RRRRR', 'YYTYY', 'YYTYY']),
  makePattern('big_flower', 'Bông hoa lớn', '🌻', ['.P.P.', 'PPPPP', 'PPYPP', '.PPP.', '..G..']),
  makePattern('big_heart', 'Trái tim lớn', '💖', ['.R.R.', 'RRWRR', 'RRRRR', '.RRR.', '..R..']),
  makePattern('big_fish', 'Chú cá lớn', '🐟', ['..BB.', '.BBBB', 'BBBBO', '..BB.', '.BB..']),
  makePattern('bird', 'Chú chim', '🐦', ['..B..', '.BBB.', 'BBBBB', '..Y..', '.YYY.']),
];

/** Số màn mỗi cấp: tranh mosaic tốn thời gian nên ít vòng hơn game khác. */
export const MOSAIC_ROUNDS_PER_TIER = [2, 2, 3, 3, 3, 4];

export type MosaicGoal = (string | null)[][];

export function mosaicGoal(pattern: MosaicPattern): MosaicGoal {
  return pattern.rows.map((row) => Array.from(row, (ch) => (ch === '.' ? null : ch)));
}

export interface MosaicRound {
  id: string;
  pattern: MosaicPattern;
  palette: MosaicColor[];
  goal: MosaicGoal;
  showGhost: boolean;
}

const SIZE_BY_TIER = [3, 3, 4, 4, 5, 5];

export function buildMosaicRounds(tier: number, seed = 0): MosaicRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), SIZE_BY_TIER.length);
  const count = MOSAIC_ROUNDS_PER_TIER[safeTier - 1];
  const size = SIZE_BY_TIER[safeTier - 1];
  const rng = seededRng(9300 + safeTier * 101 + Math.max(0, Math.round(seed)) * 1013);

  const pool = MOSAIC_PATTERNS.filter((p) => p.size === size);
  let deck = shuffleSeeded(pool, rng);
  const picked: MosaicPattern[] = [];
  while (picked.length < count) {
    if (deck.length === 0) deck = shuffleSeeded(pool, rng);
    picked.push(deck.shift() as MosaicPattern);
  }

  return picked.map((pattern, i) => ({
    id: `${pattern.id}-${safeTier}-${i}`,
    pattern,
    palette: shuffleSeeded(pattern.colors, rng),
    goal: mosaicGoal(pattern),
    showGhost: safeTier <= 2,
  }));
}

/** Bé ghép xong khi mọi ô cần tô đều đúng màu. */
export function isMosaicComplete(
  goal: readonly (string | null)[][],
  filled: readonly (string | null)[][]
): boolean {
  for (let r = 0; r < goal.length; r++) {
    for (let c = 0; c < goal[r].length; c++) {
      const target = goal[r][c];
      if (target !== null && filled[r]?.[c] !== target) return false;
    }
  }
  return true;
}
