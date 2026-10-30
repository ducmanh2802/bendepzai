/**
 * Nối Số Tô Màu (Connect the dots) data. Pure TypeScript.
 *
 * Mỗi hình là một danh sách điểm theo ĐÚNG thứ tự vẽ (điểm 1 → 2 → 3…) trong
 * khung 100×100. Bé chạm lần lượt các điểm, nối xong sẽ hiện hình và tô màu.
 * Toạ độ được "rung" nhẹ theo seed để mỗi lượt chơi lại thấy hình hơi khác.
 */

import { defaultRoundsPerTier, seededRng, shuffleSeeded } from '../gameLevels';

export interface ShapePoint {
  x: number;
  y: number;
}

export interface DotShape {
  id: string;
  name: string;
  emoji: string;
  /** Màu tô khi nối xong (hex). */
  color: string;
  /** Thứ tự vẽ — mỗi phần tử là một chấm được đánh số 1..N. */
  points: readonly ShapePoint[];
}

/**
 * Điểm trên đường tròn tâm (50,50), bán kính `radius`, chia đều `total` phần
 * tử, bắt đầu ở hướng 12 giờ. `Math.cos/sin` là hàm thuần → cùng đầu vào luôn
 * cùng đầu ra, nên vẫn giữ bất biến deterministic của data builder.
 */
function ringPoint(index: number, total: number, radius: number): ShapePoint {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: Math.round((50 + radius * Math.cos(angle)) * 10) / 10,
    y: Math.round((50 + radius * Math.sin(angle)) * 10) / 10,
  };
}

/** Hình có `petals` mũi: xen kẽ bán kính ngoài và trong → 2×petals chấm. */
function starPoints(petals: number, outer: number, inner: number): ShapePoint[] {
  const total = petals * 2;
  return Array.from({ length: total }, (_, i) => ringPoint(i, total, i % 2 === 0 ? outer : inner));
}

/** Đa giác đều `sides` cạnh. */
function polygonPoints(sides: number, radius: number): ShapePoint[] {
  return Array.from({ length: sides }, (_, i) => ringPoint(i, sides, radius));
}

export const CONNECT_SHAPES: DotShape[] = [
  {
    id: 'kite',
    name: 'Cánh diều',
    emoji: '🪁',
    color: '#38bdf8',
    points: [
      { x: 50, y: 8 },
      { x: 86, y: 44 },
      { x: 50, y: 92 },
      { x: 14, y: 44 },
    ],
  },
  {
    id: 'house',
    name: 'Ngôi nhà',
    emoji: '🏠',
    color: '#f97316',
    points: [
      { x: 26, y: 84 },
      { x: 26, y: 44 },
      { x: 50, y: 20 },
      { x: 74, y: 44 },
      { x: 74, y: 84 },
    ],
  },
  {
    id: 'mountain',
    name: 'Ngọn núi',
    emoji: '⛰️',
    color: '#10b981',
    points: [
      { x: 8, y: 84 },
      { x: 30, y: 40 },
      { x: 48, y: 56 },
      { x: 66, y: 24 },
      { x: 92, y: 84 },
    ],
  },
  {
    id: 'leaf',
    name: 'Chiếc lá',
    emoji: '🍃',
    color: '#22c55e',
    points: [
      { x: 50, y: 10 },
      { x: 84, y: 32 },
      { x: 78, y: 62 },
      { x: 50, y: 90 },
      { x: 22, y: 62 },
      { x: 16, y: 32 },
    ],
  },
  {
    id: 'boat',
    name: 'Con thuyền',
    emoji: '⛵',
    color: '#3b82f6',
    points: [
      { x: 8, y: 70 },
      { x: 20, y: 86 },
      { x: 80, y: 86 },
      { x: 92, y: 70 },
      { x: 50, y: 70 },
      { x: 50, y: 14 },
    ],
  },
  {
    id: 'fish',
    name: 'Con cá',
    emoji: '🐟',
    color: '#06b6d4',
    points: [
      { x: 8, y: 50 },
      { x: 28, y: 26 },
      { x: 56, y: 26 },
      { x: 72, y: 40 },
      { x: 90, y: 50 },
      { x: 72, y: 60 },
      { x: 56, y: 74 },
      { x: 28, y: 74 },
    ],
  },
  {
    id: 'heart',
    name: 'Trái tim',
    emoji: '💖',
    color: '#ec4899',
    points: [
      { x: 50, y: 88 },
      { x: 14, y: 60 },
      { x: 10, y: 34 },
      { x: 28, y: 18 },
      { x: 50, y: 30 },
      { x: 72, y: 18 },
      { x: 90, y: 34 },
      { x: 86, y: 60 },
    ],
  },
  {
    id: 'tree',
    name: 'Cái cây',
    emoji: '🌳',
    color: '#65a30d',
    points: [
      { x: 50, y: 8 },
      { x: 66, y: 28 },
      { x: 82, y: 50 },
      { x: 68, y: 50 },
      { x: 74, y: 84 },
      { x: 26, y: 84 },
      { x: 32, y: 50 },
      { x: 18, y: 50 },
      { x: 34, y: 28 },
    ],
  },
  {
    id: 'star',
    name: 'Ngôi sao',
    emoji: '⭐',
    color: '#f59e0b',
    points: [
      { x: 50, y: 12 },
      { x: 60, y: 38.3 },
      { x: 88, y: 39.6 },
      { x: 66.2, y: 57.3 },
      { x: 73.5, y: 84.4 },
      { x: 50, y: 69 },
      { x: 26.5, y: 84.4 },
      { x: 33.8, y: 57.3 },
      { x: 12, y: 39.6 },
      { x: 40, y: 38.3 },
    ],
  },
  {
    id: 'sun',
    name: 'Mặt trời',
    emoji: '☀️',
    color: '#fbbf24',
    points: [
      { x: 50, y: 10 },
      { x: 63, y: 27.5 },
      { x: 84.6, y: 30 },
      { x: 76, y: 50 },
      { x: 84.6, y: 70 },
      { x: 63, y: 72.5 },
      { x: 50, y: 90 },
      { x: 37, y: 72.5 },
      { x: 15.4, y: 70 },
      { x: 24, y: 50 },
      { x: 15.4, y: 30 },
      { x: 37, y: 27.5 },
    ],
  },
  // T25 — ba hình nhiều chấm cho bậc 5–6 (16/18/14 chấm), bé nối lâu hơn và
  // phải đếm số chính xác đến hàng chục.
  {
    id: 'star8',
    name: 'Ngôi sao tám cánh',
    emoji: '🌟',
    color: '#facc15',
    points: starPoints(8, 45, 20),
  },
  {
    id: 'flower9',
    name: 'Bông hoa chín cánh',
    emoji: '🌼',
    color: '#ec4899',
    points: starPoints(9, 45, 26),
  },
  {
    id: 'wheel14',
    name: 'Bánh xe mười bốn cạnh',
    emoji: '🎡',
    color: '#38bdf8',
    points: polygonPoints(14, 43),
  },
];

export interface ConnectDot {
  /** Số thứ tự bé phải chạm (1..N). */
  n: number;
  x: number;
  y: number;
}

export interface ConnectRound {
  id: string;
  shape: DotShape;
  dots: ConnectDot[];
}

/**
 * Số điểm tối đa theo màn — màn thấp hình đơn giản, màn cao nhiều điểm.
 * T25: 6/6/8/8/12/12 → 6/8/10/12/16/18 (thêm ba hình 14–18 chấm).
 */
const MAX_DOTS_BY_TIER = [6, 8, 10, 12, 16, 18];

export function shapesForTier(tier: number): DotShape[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), MAX_DOTS_BY_TIER.length);
  const maxDots = MAX_DOTS_BY_TIER[safeTier - 1];
  return CONNECT_SHAPES.filter((s) => s.points.length <= maxDots);
}

function clampCoord(value: number): number {
  return Math.round(Math.min(Math.max(value, 7), 93) * 10) / 10;
}

export function buildConnectRounds(tier: number, seed = 0): ConnectRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), MAX_DOTS_BY_TIER.length);
  const count = defaultRoundsPerTier()[safeTier - 1];
  const rng = seededRng(7100 + safeTier * 89 + Math.max(0, Math.round(seed)) * 977);

  const pool = shapesForTier(safeTier);
  let deck = shuffleSeeded(pool, rng);
  const picked: DotShape[] = [];
  while (picked.length < count) {
    if (deck.length === 0) deck = shuffleSeeded(pool, rng);
    picked.push(deck.shift() as DotShape);
  }

  return picked.map((shape, roundIdx) => {
    const dots: ConnectDot[] = shape.points.map((p, i) => ({
      n: i + 1,
      x: clampCoord(p.x + (rng() - 0.5) * 5),
      y: clampCoord(p.y + (rng() - 0.5) * 5),
    }));
    return { id: `${shape.id}-${safeTier}-${roundIdx}`, shape, dots };
  });
}
