/**
 * T17B — Lap Trinh Tim Kho Bau (treasure_coding) data.
 * Pure TypeScript, no React imports.
 *
 * Be xep chuoi mui ten roi bam Chay de Gau di toi ruong, tranh da/nuoc.
 * - T1: luoi 4x4, loi giai <= 8 buoc, khong chia khoa, khong vong lap.
 * - T2: 4x4, 2-4 da, re 1-2 lan, <= 9 buoc.
 * - T3: 5x5, 4-6 da, duong vong, <= 11 buoc.
 * - T4: 6x6, 6-8 da + o chia khoa phai lay truoc, <= 13 buoc.
 * - T5: 7x7, 9-12 da + chia khoa + vong lap "x2", <= 16 buoc.
 * - T6: 8x8, 13-18 da + chia khoa + vong lap, loi giai toi 14-18 buoc.
 *
 * Trần độ dài lời giải theo bậc (`MAX_SOLUTION_BY_TIER`) — T25 nâng từ khoá
 * cứng 12 bước lên 8/9/11/13/16/18 vì bậc 5–6 cũ đi ngắn y hệt bậc 4.
 *
 * Moi man deu co loi giai: man hinh duoc sinh xac dinh (seeded) bang cach
 * giu mot duong di goc, dat da len cac o con lai, roi kiem lai bang BFS
 * (solveLevel). Giam sat: neu man loi thi bo da dan den khi co loi giai.
 */

import { pickDistinct, roundsForTier, seededRng } from '../gameLevels';

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface DirMeta {
  id: Dir;
  emoji: string;
  label: string;
  dx: number;
  dy: number;
}

export const DIR_METAS: DirMeta[] = [
  { id: 'up', emoji: '⬆️', label: 'Lên', dx: 0, dy: -1 },
  { id: 'down', emoji: '⬇️', label: 'Xuống', dx: 0, dy: 1 },
  { id: 'left', emoji: '⬅️', label: 'Trái', dx: -1, dy: 0 },
  { id: 'right', emoji: '➡️', label: 'Phải', dx: 1, dy: 0 },
];

export const dirMeta = (d: Dir): DirMeta => DIR_METAS.find((m) => m.id === d) as DirMeta;

export interface Cell {
  x: number;
  y: number;
}

export interface LevelParams {
  rocks: number;
  key: boolean;
  loop: boolean;
}

export interface CodingLevel {
  id: string;
  size: number;
  start: Cell;
  treasure: Cell;
  key: Cell | null;
  rocks: Cell[];
  allowLoop: boolean;
  /** Do dai loi giai ngan nhat (BFS). */
  minSteps: number;
}

export interface CodingRound {
  id: string;
  level: CodingLevel;
}

/** 1 token chuong trinh: 1 mui ten, co the lap lai 2 lan (cap cao). */
export interface ProgToken {
  dir: Dir;
  repeat: 1 | 2;
}

export interface SimResult {
  /** Toan bo o Gau da di qua (gom ca o xuat phat). */
  path: Cell[];
  success: boolean;
  crashed: boolean;
  gotKey: boolean;
  steps: number;
}

const same = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;
const keyOf = (c: Cell): string => `${c.x},${c.y}`;

const TIER_SIZE = [4, 4, 5, 6, 7, 8];

/**
 * T25 — trần độ dài lời giải theo bậc (trước đây khoá cứng 12 bước cho mọi
 * bậc, nên bậc 5–6 không dài hơn bậc 4). Bậc thấp vẫn đi ngắn để bé mới học
 * không bị lạc; bậc cao phải xếp chương trình 16–18 bước.
 * Trần bậc 1 là 8 vì rương luôn đặt cách xa ≥ 4 ô trên luoi 4×4.
 */
const MAX_SOLUTION_BY_TIER = [8, 9, 11, 13, 16, 18];

/**
 * POOL_BY_TIER — moi pool 8 bo tham so (so vong toi da moi cap la 8).
 * rocks tang dan; key tu T4; loop tu T5 (dung spec "cap cao").
 */
export const POOL_BY_TIER: LevelParams[][] = [
  [
    { rocks: 1, key: false, loop: false }, { rocks: 2, key: false, loop: false },
    { rocks: 0, key: false, loop: false }, { rocks: 1, key: false, loop: false },
    { rocks: 2, key: false, loop: false }, { rocks: 1, key: false, loop: false },
    { rocks: 0, key: false, loop: false }, { rocks: 2, key: false, loop: false },
  ],
  [
    { rocks: 3, key: false, loop: false }, { rocks: 4, key: false, loop: false },
    { rocks: 2, key: false, loop: false }, { rocks: 3, key: false, loop: false },
    { rocks: 4, key: false, loop: false }, { rocks: 2, key: false, loop: false },
    { rocks: 3, key: false, loop: false }, { rocks: 4, key: false, loop: false },
  ],
  [
    { rocks: 5, key: false, loop: false }, { rocks: 6, key: false, loop: false },
    { rocks: 4, key: false, loop: false }, { rocks: 5, key: false, loop: false },
    { rocks: 6, key: false, loop: false }, { rocks: 4, key: false, loop: false },
    { rocks: 5, key: false, loop: false }, { rocks: 6, key: false, loop: false },
  ],
  [
    { rocks: 7, key: true, loop: false }, { rocks: 8, key: true, loop: false },
    { rocks: 6, key: true, loop: false }, { rocks: 7, key: true, loop: false },
    { rocks: 8, key: true, loop: false }, { rocks: 6, key: true, loop: false },
    { rocks: 7, key: true, loop: false }, { rocks: 8, key: true, loop: false },
  ],
  [
    { rocks: 10, key: true, loop: true }, { rocks: 12, key: true, loop: true },
    { rocks: 9, key: true, loop: true }, { rocks: 10, key: true, loop: true },
    { rocks: 12, key: true, loop: true }, { rocks: 11, key: true, loop: true },
    { rocks: 9, key: true, loop: true }, { rocks: 12, key: true, loop: true },
  ],
  [
    { rocks: 14, key: true, loop: true }, { rocks: 16, key: true, loop: true },
    { rocks: 13, key: true, loop: true }, { rocks: 15, key: true, loop: true },
    { rocks: 17, key: true, loop: true }, { rocks: 16, key: true, loop: true },
    { rocks: 14, key: true, loop: true }, { rocks: 18, key: true, loop: true },
  ],
];

/** BFS tren (x, y, co chia khoa): tra ve chuoi huong ngan nhat hoac null. */
export function solveLevel(level: CodingLevel): Dir[] | null {
  const rockSet = new Set(level.rocks.map(keyOf));
  const inGrid = (c: Cell): boolean => c.x >= 0 && c.y >= 0 && c.x < level.size && c.y < level.size;
  const startKey = `${level.start.x},${level.start.y},${level.key && same(level.start, level.key) ? 1 : 0}`;
  const seen = new Set<string>([startKey]);
  const queue: { pos: Cell; hasKey: boolean; path: Dir[] }[] = [
    { pos: level.start, hasKey: !!level.key && same(level.start, level.key), path: [] },
  ];
  while (queue.length > 0) {
    const cur = queue.shift() as { pos: Cell; hasKey: boolean; path: Dir[] };
    if (same(cur.pos, level.treasure) && (!level.key || cur.hasKey)) return cur.path;
    for (const m of DIR_METAS) {
      const next: Cell = { x: cur.pos.x + m.dx, y: cur.pos.y + m.dy };
      if (!inGrid(next) || rockSet.has(keyOf(next))) continue;
      const hasKey = cur.hasKey || (!!level.key && same(next, level.key));
      const k = `${next.x},${next.y},${hasKey ? 1 : 0}`;
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ pos: next, hasKey, path: [...cur.path, m.id] });
    }
  }
  return null;
}

/** Mo rong token lap (x2) thanh chuoi huong don. */
export function expandProgram(tokens: ProgToken[]): Dir[] {
  const out: Dir[] = [];
  for (const t of tokens) {
    const n = t.repeat === 2 ? 2 : 1;
    for (let i = 0; i < n; i++) out.push(t.dir);
  }
  return out;
}

/** Mo phong chuong trinh cua be tren mot man. */
export function simulateProgram(level: CodingLevel, tokens: ProgToken[]): SimResult {
  const dirs = expandProgram(tokens);
  const rockSet = new Set(level.rocks.map(keyOf));
  const inGrid = (c: Cell): boolean => c.x >= 0 && c.y >= 0 && c.x < level.size && c.y < level.size;
  const path: Cell[] = [{ ...level.start }];
  let pos: Cell = { ...level.start };
  let gotKey = !!level.key && same(pos, level.key);
  for (const d of dirs) {
    const m = dirMeta(d);
    const next: Cell = { x: pos.x + m.dx, y: pos.y + m.dy };
    if (!inGrid(next) || rockSet.has(keyOf(next))) {
      return { path, success: false, crashed: true, gotKey, steps: dirs.length };
    }
    pos = next;
    path.push({ ...pos });
    if (level.key && same(pos, level.key)) gotKey = true;
  }
  const success = same(pos, level.treasure) && (!level.key || gotKey);
  return { path, success, crashed: false, gotKey, steps: dirs.length };
}

function manhattan(a: Cell, b: Cell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Sinh 1 man xac dinh tu (tier, paramIdx, nonce): luon co loi giai. */
export function generateLevel(tier: number, paramIdx: number, nonce = 0): CodingLevel {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const size = TIER_SIZE[safeTier - 1];
  const params = POOL_BY_TIER[safeTier - 1][paramIdx % 8];
  const rng = seededRng(1750 + safeTier * 733 + paramIdx * 97 + nonce * 1009);

  const start: Cell = { x: 0, y: size - 1 };
  const far: Cell[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = { x, y };
      if (!same(c, start) && manhattan(start, c) >= size) far.push(c);
    }
  }
  const treasure = far[Math.floor(rng() * far.length)];

  // Duong goc tren luoi trong: di ngang truoc roi doc (xac dinh theo seed).
  const basePath: Cell[] = [{ ...start }];
  const goXFirst = rng() < 0.5;
  const walk = (from: Cell, to: Cell): void => {
    let cur = { ...from };
    const stepX = Math.sign(to.x - cur.x);
    const stepY = Math.sign(to.y - cur.y);
    const xFirst = goXFirst;
    const doAxis = (horiz: boolean): void => {
      if (horiz) {
        while (cur.x !== to.x) {
          cur = { x: cur.x + stepX, y: cur.y };
          basePath.push({ ...cur });
        }
      } else {
        while (cur.y !== to.y) {
          cur = { x: cur.x, y: cur.y + stepY };
          basePath.push({ ...cur });
        }
      }
    };
    if (xFirst) { doAxis(true); doAxis(false); } else { doAxis(false); doAxis(true); }
  };
  walk(start, treasure);
  const baseSet = new Set(basePath.map(keyOf));

  let key: Cell | null = null;
  if (params.key && basePath.length > 2) {
    const at = 1 + Math.floor(rng() * (basePath.length - 2));
    key = { ...basePath[at] };
  }

  // Dat da: tranh o dac biet; neu man vo nghiem thi bo da dan.
  const keyCell = key;
  const forbidden = new Set<string>([keyOf(start), keyOf(treasure)]);
  if (keyCell) forbidden.add(keyOf(keyCell));
  const free: Cell[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = { x, y };
      if (!forbidden.has(keyOf(c))) free.push(c);
    }
  }
  const shuffled = [...free];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Uu tien dat da ngoai duong goc (giu thu thach nhe cho be lop 1).
  const offPath = shuffled.filter((c) => !baseSet.has(keyOf(c)));
  const onPath = shuffled.filter((c) => baseSet.has(keyOf(c)));
  const ordered = [...offPath, ...onPath];
  let rocks: Cell[] = ordered.slice(0, Math.min(params.rocks, ordered.length));

  const id = `tc-t${safeTier}-p${paramIdx}-n${nonce}`;
  let draft: CodingLevel = {
    id, size, start, treasure, key, rocks, allowLoop: params.loop, minSteps: 0,
  };
  let sol = solveLevel(draft);
  while (!sol && rocks.length > 0) {
    rocks = rocks.slice(0, rocks.length - 1);
    draft = { ...draft, rocks };
    sol = solveLevel(draft);
  }
  // Giu man vua suc be lop 1: loi giai khong dai hon trần theo bậc (T25).
  const maxSolution = MAX_SOLUTION_BY_TIER[safeTier - 1];
  while (sol && sol.length > maxSolution && rocks.length > 0) {
    rocks = rocks.slice(0, rocks.length - 1);
    draft = { ...draft, rocks };
    sol = solveLevel(draft);
  }
  const minSteps = sol ? sol.length : manhattan(start, treasure);
  return { ...draft, minSteps };
}

/** Dung cac vong cho 1 cap: du vong, id duy nhat, moi man co loi giai. */
export function buildCodingRounds(tier: number, seedOrNonce = 0): CodingRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const count = roundsForTier(safeTier);
  const rng = seededRng(1750 + safeTier * 733 + seedOrNonce * 1009);
  const paramIdxs = pickDistinct([0, 1, 2, 3, 4, 5, 6, 7], count, rng);
  return paramIdxs.map((p, i) => {
    const level = generateLevel(safeTier, p, seedOrNonce * 31 + i);
    return { id: `${level.id}-r${i}`, level: { ...level, id: `${level.id}-r${i}` } };
  });
}

export function buildRounds(tier: number, seed = 0): CodingRound[] {
  return buildCodingRounds(tier, seed);
}
