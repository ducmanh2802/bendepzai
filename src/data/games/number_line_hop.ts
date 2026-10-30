/**
 * T16 — Ếch Nhảy Tia Số (number_line_hop) data. Pure TypeScript, no React imports.
 *
 * Ếch đứng ở số `start`, đề "+3" (hoặc "-2", hoặc bằng lời "Ếch lùi 4 bước"):
 * bé bấm nút "Nhảy" đúng số lần rồi chạm số đích — hoặc chạm thẳng số đích.
 * - T1: cộng 1–4 trong 0–10.
 * - T2: cộng/trừ 2–5 trong 0–20 (không mượn).
 * - T3: cộng/trừ 2–8 trong 0–30 (không nhớ/không mượn).
 * - T4: nhảy theo chục trong 0–100 (bước 10, 1–6 chục).
 * - T5: đề bằng lời trong 0–70 ("Ếch tiến 3 bước", "Ếch lùi 4 bước").
 * - T6: trộn bước 1 + nhảy chục + đề bằng lời trong 0–100.
 *
 * T25 — trần độ khó theo `TIER_MAX_VALUE` (phản hồi của phụ huynh: trò chơi đang
 * quá dễ). Pool không còn soạn tay mà sinh tất định rồi được kiểm bằng
 * `isNoCarryAdd` / `isNoBorrowSub`, nên mọi đề đều chắc chắn nằm trong lớp 1.
 *
 * Lớp 1 (GDPT 2018): mọi phép tính đều không nhớ/không mượn, số ≤ 100.
 */

import { numericOptions, roundsForTier, seededRng, shuffleSeeded, tierOptionCount } from '../gameLevels';
import { isNoBorrowSub, isNoCarryAdd } from './mathUtils';

export interface HopRound {
  id: string;
  /** Số ếch đang đứng. */
  start: number;
  /** Hướng nhảy: 1 = tiến, -1 = lùi. */
  dir: 1 | -1;
  /** Số bước phải nhảy (bước thường = 1, bước chục = 10). */
  hops: number;
  /** Số đích = start + dir * hops * step. */
  target: number;
  /** Biên đoạn tia số được vẽ (cửa sổ quanh ếch + đích, không phải cả tia). */
  lineStart: number;
  lineEnd: number;
  /** Trần số của bậc (0–10/20/30/100/70/100) — biên thật của cả tia. */
  rangeEnd: number;
  /** Bước vạch: 1 hoặc 10. */
  step: number;
  /** Đề ngắn ("+3", "−2", "+20"). */
  task: string;
  /** Đề bằng lời cho bé đọc/nghe (NFC). */
  prompt: string;
  /** true = đề bằng lời ("Ếch lùi 4 bước"); false = đề ký hiệu ("4 − 2"). */
  worded: boolean;
  /** Phương án số đích (đã xáo trộn, gồm target). Số lượng theo bậc. */
  options: number[];
}

interface HopTarget {
  start: number;
  dir: 1 | -1;
  hops: number;
  step: number;
  /** Biên cả tia (0..trần bậc) — dùng để sinh đề, không phải để vẽ. */
  rangeEnd: number;
  worded: boolean;
  /** Shape đã sinh mục này (để bậc trộn luôn đủ kiểu nhảy). */
  shapeIndex: number;
}

interface Shape {
  rangeEnd: number;
  step: 1 | 10;
  dirs: (1 | -1)[];
  hops: number[];
  worded: boolean;
}

function taskText(t: HopTarget): string {
  const amount = t.hops * t.step;
  return t.dir === 1 ? `+${amount}` : `−${amount}`;
}

const TIEN = ['tiến', 'nhảy tới', 'bò tới'];
const LUI = ['lùi', 'nhảy lùi', 'bò lùi'];

function promptText(t: HopTarget): string {
  const amount = t.hops * t.step;
  if (!t.worded) {
    const op = t.dir === 1 ? '+' : '−';
    return `Ếch đang đứng ở số ${t.start}. Đề ${t.start} ${op} ${amount}. Ếch nhảy tới số mấy?`;
  }
  const verb = t.dir === 1 ? TIEN[(t.start + t.hops) % TIEN.length] : LUI[(t.start + t.hops) % LUI.length];
  const buoc = t.step === 10 ? (t.hops === 1 ? 'một chục' : `${t.hops} chục`) : `${amount} bước`;
  return `Ếch đang đứng ở số ${t.start}. Ếch ${verb} ${buoc}. Ếch tới số mấy?`;
}

/**
 * Mỗi bậc một "shape" (T6 trộn 3 shape). Pool sinh tất định, tối đa 12 mục
 * khác nhau — luôn đủ cho 8 vòng/cấp nhiều nhất.
 */
const SHAPES_BY_TIER: Shape[][] = [
  [{ rangeEnd: 10, step: 1, dirs: [1], hops: [1, 2, 3, 4], worded: false }],
  [{ rangeEnd: 20, step: 1, dirs: [1, -1], hops: [2, 3, 4, 5], worded: false }],
  [{ rangeEnd: 30, step: 1, dirs: [1, -1], hops: [2, 3, 4, 6, 7, 8], worded: false }],
  [{ rangeEnd: 100, step: 10, dirs: [1, -1], hops: [1, 2, 3, 4, 5, 6], worded: false }],
  [{ rangeEnd: 70, step: 1, dirs: [1, -1], hops: [2, 3, 4, 5, 6, 7, 8], worded: true }],
  [
    { rangeEnd: 100, step: 1, dirs: [1, -1], hops: [3, 4, 5, 6, 7, 8, 9], worded: false },
    { rangeEnd: 100, step: 10, dirs: [1, -1], hops: [1, 2, 3, 4, 5, 6], worded: false },
    { rangeEnd: 100, step: 1, dirs: [1, -1], hops: [2, 3, 4, 5, 6, 7, 8], worded: true },
  ],
];

const POOL_SIZE = 12;

function pickHopTarget(shape: Shape, rng: () => number): Omit<HopTarget, 'shapeIndex'> | null {
  for (let attempt = 0; attempt < 500; attempt++) {
    const hops = shape.hops[Math.floor(rng() * shape.hops.length)];
    const dir = shape.dirs[Math.floor(rng() * shape.dirs.length)];
    const amount = hops * shape.step;
    const start = Math.floor(rng() * (shape.rangeEnd - amount + 1));
    const target = start + dir * amount;
    if (target < 0 || target > shape.rangeEnd) continue;
    if (dir === 1 ? !isNoCarryAdd(start, amount) : !isNoBorrowSub(start, amount)) continue;
    return { start, dir, hops, step: shape.step, rangeEnd: shape.rangeEnd, worded: shape.worded };
  }
  return null;
}

function buildPool(tier: number, shapes: Shape[]): HopTarget[] {
  const rng = seededRng(16_000_007 + tier * 7_717);
  const seen = new Set<string>();
  const pool: HopTarget[] = [];
  for (let slot = 0; slot < POOL_SIZE; slot++) {
    const shape = shapes[slot % shapes.length];
    const t = pickHopTarget(shape, rng);
    if (!t) continue;
    const key = `${t.start}|${t.dir}|${t.hops}|${t.step}|${t.worded}`;
    if (seen.has(key)) {
      slot--;
      continue;
    }
    seen.add(key);
    pool.push({ ...t, shapeIndex: slot % shapes.length });
  }
  return pool;
}

/**
 * Chọn vòng theo lối "trộn đều": rút luân phiên từng shape một nên bậc trộn
 * (T6) luôn có đủ nhảy bước 1, nhảy chục và đề bằng lời trong MỌI lần chơi,
 * thay vì để rng randomly bỏ sót cả một nhóm.
 */
function pickBalanced(pool: HopTarget[], count: number, rng: () => number): HopTarget[] {
  const groups = new Map<number, HopTarget[]>();
  for (const t of pool) {
    const g = groups.get(t.shapeIndex) ?? [];
    g.push(t);
    groups.set(t.shapeIndex, g);
  }
  const shuffled = [...groups.values()].map((g) => shuffleSeeded(g, rng));
  const out: HopTarget[] = [];
  for (let i = 0; out.length < Math.min(count, pool.length); i++) {
    let added = false;
    for (const g of shuffled) {
      if (i >= g.length) continue;
      out.push(g[i]);
      added = true;
      if (out.length >= Math.min(count, pool.length)) break;
    }
    if (!added) break;
  }
  return shuffleSeeded(out, rng);
}

/**
 * POOL_BY_TIER — mỗi cấp ≥ 8 mục (số vòng tối đa mỗi cấp là 8), mọi đề đều
 * không nhớ/không mượn và đích nằm trong trần của bậc.
 */
export const POOL_BY_TIER: HopTarget[][] = SHAPES_BY_TIER.map((shapes, i) => buildPool(i + 1, shapes));

/**
 * Vẽ cửa sổ tia số vừa đủ quanh ếch và đích (vẽ cả tia 0–100 với bước 1 thì
 * quá dày), đồng thời là biên sinh phương án — đáp án nhiễu sát số đích hơn.
 */
function lineWindow(t: HopTarget, target: number, optionCount: number): { start: number; end: number } {
  const lo = Math.min(t.start, target);
  const hi = Math.max(t.start, target);
  const pad = t.step === 10 ? 1 : 2;
  let ws = Math.max(0, lo - pad * t.step);
  let we = Math.min(t.rangeEnd, hi + pad * t.step);
  let guard = 0;
  while (we - ws + 1 < optionCount && guard++ < 60) {
    if (ws > 0) ws = Math.max(0, ws - t.step);
    else we = Math.min(t.rangeEnd, we + t.step);
  }
  return { start: ws, end: we };
}

/**
 * Dựng các vòng chơi cho 1 cấp: đủ vòng, đích = start + dir*hops*step,
 * phương án duy nhất đã xáo trộn theo seed, số phương án tăng theo bậc.
 */
export function buildHopRounds(tier: number, seedOrNonce = 0): HopRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), SHAPES_BY_TIER.length);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const optionCount = tierOptionCount(safeTier);
  const rng = seededRng(1601 + safeTier * 309 + seedOrNonce * 1009);
  const picks = pickBalanced(pool, count, rng);
  return picks.map((t, i) => {
    const r = seededRng(1601 + safeTier * 309 + seedOrNonce * 1009 + i * 67 + 11);
    const target = t.start + t.dir * t.hops * t.step;
    const window = lineWindow(t, target, optionCount);
    const options = numericOptions(target, optionCount, r, window.start, window.end);
    return {
      id: `nh-t${safeTier}-${i}-${t.start}-${t.dir > 0 ? 'p' : 'm'}${t.hops * t.step}`,
      start: t.start,
      dir: t.dir,
      hops: t.hops,
      target,
      lineStart: window.start,
      lineEnd: window.end,
      step: t.step,
      rangeEnd: t.rangeEnd,
      task: taskText(t),
      prompt: promptText(t),
      worded: t.worded,
      options,
    };
  });
}

export function buildRounds(tier: number, seed = 0): HopRound[] {
  return buildHopRounds(tier, seed);
}
