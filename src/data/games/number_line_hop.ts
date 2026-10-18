/**
 * T16 — Ếch Nhảy Tia Số (number_line_hop) data. Pure TypeScript, no React imports.
 *
 * Ếch đứng ở số `start`, đề "+3" (hoặc "-2", hoặc bằng lời "Ếch lùi 4 bước"):
 * bé bấm nút "Nhảy" đúng số lần rồi chạm số đích — hoặc chạm thẳng số đích.
 * - T1: cộng 1–3 trong 0–10.
 * - T2: cộng/trừ 1–4 trong 0–10 (không mượn).
 * - T3: cộng/trừ 2–5 trong 0–20 (không nhớ/không mượn).
 * - T4: nhảy theo chục trong 0–100 (bước 10, không nhớ).
 * - T5: đề bằng lời trong 0–20 ("Ếch tiến 3 bước", "Ếch lùi 4 bước").
 * - T6: trộn tia 0–20 + nhảy chục + đề bằng lời.
 *
 * Lớp 1 (GDPT 2018): mọi phép tính đều không nhớ/không mượn, số ≤ 100.
 */

import { numericOptions, pickDistinct, roundsForTier, seededRng } from '../gameLevels';

export interface HopRound {
  id: string;
  /** Số ếch đang đứng. */
  start: number;
  /** Hướng nhảy: 1 = tiến, -1 = lùi. */
  dir: 1 | -1;
  /** Số bước phải nhảy (bước thường = 1, T4 bước chục = 10). */
  hops: number;
  /** Số đích = start + dir * hops * step. */
  target: number;
  /** Biên tia số để vẽ. */
  lineStart: number;
  lineEnd: number;
  /** Bước vạch: 1 (T1–T3, T5–T6) hoặc 10 (T4). */
  step: number;
  /** Đề ngắn ("+3", "−2", "+20"). */
  task: string;
  /** Đề bằng lời cho bé đọc/nghe (NFC). */
  prompt: string;
  /** true = đề bằng lời ("Ếch lùi 4 bước"); false = đề ký hiệu ("4 − 2"). */
  worded: boolean;
  /** 4 phương án số đích (đã xáo trộn, gồm target). */
  options: number[];
}

interface HopTarget {
  start: number;
  dir: 1 | -1;
  hops: number;
  step: number;
  lineStart: number;
  lineEnd: number;
  worded: boolean;
}

function h(
  start: number,
  dir: 1 | -1,
  hops: number,
  step: number,
  lineStart: number,
  lineEnd: number,
  worded = false,
): HopTarget {
  return { start, dir, hops, step, lineStart, lineEnd, worded };
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
 * POOL_BY_TIER — mỗi pool 8 mục (số vòng tối đa mỗi cấp là 8).
 * Mọi mục đều không nhớ/không mượn, đích trong biên tia số.
 */
export const POOL_BY_TIER: HopTarget[][] = [
  // T1 — cộng 1–3 trong 0–10
  [
    h(2, 1, 3, 1, 0, 10),
    h(4, 1, 2, 1, 0, 10),
    h(1, 1, 1, 1, 0, 10),
    h(5, 1, 3, 1, 0, 10),
    h(0, 1, 2, 1, 0, 10),
    h(3, 1, 1, 1, 0, 10),
    h(6, 1, 3, 1, 0, 10),
    h(2, 1, 2, 1, 0, 10),
  ],
  // T2 — cộng/trừ 1–4 trong 0–10
  [
    h(7, -1, 2, 1, 0, 10),
    h(3, 1, 4, 1, 0, 10),
    h(9, -1, 3, 1, 0, 10),
    h(1, 1, 3, 1, 0, 10),
    h(5, -1, 1, 1, 0, 10),
    h(8, -1, 4, 1, 0, 10),
    h(0, 1, 4, 1, 0, 10),
    h(6, -1, 2, 1, 0, 10),
  ],
  // T3 — cộng/trừ 2–5 trong 0–20 (chọn cặp không nhớ/không mượn)
  [
    h(11, 1, 3, 1, 0, 20),
    h(17, -1, 4, 1, 0, 20),
    h(4, 1, 5, 1, 0, 20),
    h(14, -1, 2, 1, 0, 20),
    h(10, 1, 4, 1, 0, 20),
    h(19, -1, 5, 1, 0, 20),
    h(12, 1, 2, 1, 0, 20),
    h(16, 1, 3, 1, 0, 20),
  ],
  // T4 — nhảy theo chục trong 0–100 (start tròn chục, không nhớ)
  [
    h(10, 1, 2, 10, 0, 100),
    h(40, -1, 1, 10, 0, 100),
    h(20, 1, 3, 10, 0, 100),
    h(70, -1, 2, 10, 0, 100),
    h(0, 1, 1, 10, 0, 100),
    h(50, 1, 2, 10, 0, 100),
    h(90, -1, 3, 10, 0, 100),
    h(30, -1, 1, 10, 0, 100),
  ],
  // T5 — đề bằng lời trong 0–20
  [
    h(4, 1, 3, 1, 0, 20, true),
    h(15, -1, 4, 1, 0, 20, true),
    h(7, 1, 2, 1, 0, 20, true),
    h(14, -1, 3, 1, 0, 20, true),
    h(2, 1, 5, 1, 0, 20, true),
    h(18, -1, 2, 1, 0, 20, true),
    h(5, 1, 4, 1, 0, 20, true),
    h(11, -1, 1, 1, 0, 20, true),
  ],
  // T6 — trộn 0–20 + nhảy chục + đề bằng lời
  [
    h(13, 1, 4, 1, 0, 20),
    h(60, 1, 2, 10, 0, 100),
    h(16, -1, 5, 1, 0, 20, true),
    h(20, -1, 2, 10, 0, 100),
    h(4, 1, 5, 1, 0, 20, true),
    h(10, 1, 1, 10, 0, 100),
    h(18, -1, 3, 1, 0, 20),
    h(3, 1, 2, 1, 0, 20, true),
  ],
];

/**
 * Dựng các vòng chơi cho 1 cấp: đủ vòng, đích = start + dir*hops*step,
 * 4 phương án số duy nhất đã xáo trộn theo seed.
 */
export function buildHopRounds(tier: number, seedOrNonce = 0): HopRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const rng = seededRng(1601 + safeTier * 309 + seedOrNonce * 1009);
  const picks = pickDistinct(pool, count, rng);
  return picks.map((t, i) => {
    const r = seededRng(1601 + safeTier * 309 + seedOrNonce * 1009 + i * 67 + 11);
    const target = t.start + t.dir * t.hops * t.step;
    const options = numericOptions(target, 4, r, t.lineStart, t.lineEnd);
    return {
      id: `nh-t${safeTier}-${i}-${t.start}-${t.dir > 0 ? 'p' : 'm'}${t.hops * t.step}`,
      start: t.start,
      dir: t.dir,
      hops: t.hops,
      target,
      lineStart: t.lineStart,
      lineEnd: t.lineEnd,
      step: t.step,
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
