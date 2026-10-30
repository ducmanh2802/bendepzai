/**
 * T02B/B4+A — Đường Đua Toán Học (MathSpeedRacing) data. Pure TypeScript.
 * Lớp 1: cộng KHÔNG nhớ, trừ KHÔNG mượn, kết quả 0–100, tổng ≤ max.
 *
 * 2026-10-30 — phụ huynh báo trò chơi "quá dễ". Trần cũ dừng ở 20 ngay từ bậc 4
 * nên bé giữa năm lớp 1 hết thử thách. Bây giờ bậc thang đi hết phạm vi 0–100
 * (TIER_MAX_VALUE) và từ bậc 5 sinh phép tính HAI BƯỚC (a + b − c).
 */

import { defaultRoundsPerTier, numericOptions, seededRng, tierOptionCount } from '../gameLevels';
import { isNoBorrowSub, isNoCarryAdd, tierMaxValue } from './mathUtils';

export interface MathQuestion {
  expr: string;
  ans: number;
  options: number[];
}

/**
 * `seed` mixes the play nonce (component passes stage.nonce), so replays
 * generate different questions instead of replaying identically.
 */
export function buildRaceQuestions(tier: number, seed = 0): MathQuestion[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const roundsPerTier = defaultRoundsPerTier();
  const count = roundsPerTier[safeTier - 1];
  const max = tierMaxValue(safeTier);
  const optionCount = tierOptionCount(safeTier);
  const questions: MathQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const rng = seededRng(3400 + safeTier * 71 + seed * 1009 + i * 229);
    // Bậc 5–6: nửa số câu là phép tính hai bước, bắt bé giữ kết quả trung gian
    // trong đầu thay vì chỉ nhìn một phép.
    const twoStep = safeTier >= 5 && rng() < 0.5;
    if (twoStep) {
      const q = buildTwoStep(rng, max, optionCount);
      if (q) {
        questions.push(q);
        continue;
      }
    }
    const useSub = !twoStep && rng() < (safeTier >= 2 ? 0.45 : 0.2);
    if (useSub) {
      let a = 2;
      let b = 1;
      for (let tries = 0; tries < 60; tries++) {
        const candA = Math.max(2, Math.floor(rng() * max) + 1);
        const candB = Math.max(1, Math.floor(rng() * candA) + 1);
        if (isNoBorrowSub(candA, candB)) {
          a = candA;
          b = candB;
          break;
        }
        if (tries === 59) {
          a = candA;
          b = candA;
        }
      }
      const ans = a - b;
      questions.push({ expr: `${a} - ${b}`, ans, options: numericOptions(ans, optionCount, rng, 0, max) });
    } else {
      // No-carry addition with a + b ≤ max (never overflows the tier range).
      let a = 1;
      let b = 1;
      for (let tries = 0; tries < 80; tries++) {
        const candA = Math.floor(rng() * max) + 1;
        const room = max - candA;
        if (room < 1) continue;
        const candB = Math.floor(rng() * room) + 1;
        if (isNoCarryAdd(candA, candB) && candA + candB <= max) {
          a = candA;
          b = candB;
          break;
        }
        if (tries === 79) {
          a = 1;
          b = 1;
        }
      }
      const ans = a + b;
      questions.push({ expr: `${a} + ${b}`, ans, options: numericOptions(ans, optionCount, rng, 0, max) });
    }
  }
  return questions;
}

/**
 * `a + b - c` với cả hai bước đều đúng chuẩn lớp 1: bước cộng KHÔNG nhớ, bước
 * trừ KHÔNG mượn, mọi giá trị trong 0..max. Trả về `null` khi mẫu số nào đó
 * không tìm được (khi đó caller rơi lại sang phép một bước).
 */
function buildTwoStep(rng: () => number, max: number, optionCount: number): MathQuestion | null {
  for (let tries = 0; tries < 90; tries++) {
    const candA = Math.floor(rng() * (max - 2)) + 1;
    const room = max - candA;
    if (room < 2) continue;
    const candB = Math.floor(rng() * room) + 1;
    if (!isNoCarryAdd(candA, candB)) continue;
    const sum = candA + candB;
    const candC = Math.floor(rng() * sum) + 1;
    if (!isNoBorrowSub(sum, candC)) continue;
    const ans = sum - candC;
    return {
      expr: `${candA} + ${candB} - ${candC}`,
      ans,
      options: numericOptions(ans, optionCount, rng, 0, max),
    };
  }
  return null;
}

export function buildRounds(tier: number, seed = 0): MathQuestion[] {
  return buildRaceQuestions(tier, seed);
}

/**
 * Giấy giờ cho MỖI câu theo bậc (ms), `null` = không giới hạn.
 * Vì sao thêm: 28/31 trò không có chút áp lực thời gian nào, bé tính nhanh thấy
 * nhàn. Ba bậc đầu không đếm giờ để bé quen giao diện trước.
 */
export const TIER_BUDGET_MS: readonly (number | null)[] = [null, null, null, 15000, 12000, 10000];

export function tierBudgetMs(tier: number): number | null {
  const idx = Math.min(Math.max(Math.round(tier) || 1, 1), TIER_BUDGET_MS.length) - 1;
  return TIER_BUDGET_MS[idx];
}

