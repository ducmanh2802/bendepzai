/**
 * T02B — shared Grade-1 arithmetic guards (no-carry / no-borrow, 0–100).
 * Lớp 1 (GDPT 2018): cộng/trừ trong phạm vi 100, KHÔNG nhớ, KHÔNG mượn.
 */

/** True when a+b needs no carrying (every digit column sums to ≤ 9). */
export function isNoCarryAdd(a: number, b: number): boolean {
  if (a < 0 || b < 0 || a + b > 100) return false;
  let x = Math.floor(a);
  let y = Math.floor(b);
  while (x > 0 || y > 0) {
    if ((x % 10) + (y % 10) > 9) return false;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return true;
}

/** True when a-b needs no borrowing (a ≥ b and every digit of a ≥ digit of b). */
export function isNoBorrowSub(a: number, b: number): boolean {
  if (a < 0 || b < 0 || a > 100 || b > 100 || a < b) return false;
  let x = Math.floor(a);
  let y = Math.floor(b);
  while (x > 0 || y > 0) {
    if ((x % 10) < (y % 10)) return false;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return true;
}

/** Parse "a + b" / "a - b" expressions produced by generators. */
export function parseAB(expr: string): { a: number; b: number; op: '+' | '-' } | null {
  const m = /^\s*(\d+)\s*([+-])\s*(\d+)\s*$/.exec(expr);
  if (!m) return null;
  return { a: Number(m[1]), b: Number(m[2]), op: m[2] as '+' | '-' };
}

/**
 * Bậc thang trần giá trị cho nhóm trò Toán.
 *
 * Vì sao đổi: phụ huynh báo "trò chơi quá dễ so với con" (2026-10-30). Trần cũ
 * là 5/10/10/15/20 theo bậc — tức bé giữa năm lớp 1 đã chạm đỉnh ở bậc 4 và
 * không còn gì để học. Lớp 1 GDPT 2018 có phạm vi 0–100 (cộng không nhớ, trừ
 * không mượn), nên bậc 6 phải chạm trọn phạm vi đó.
 *
 * Số phương án theo bậc nằm ở `tierOptionCount` trong `src/data/gameLevels.ts`
 * vì mọi nhóm trò chơi (đọc, tiếng Anh, puzzle) đều cần chung thang đó.
 */
export const TIER_MAX_VALUE = [10, 20, 30, 50, 70, 100] as const;

function tierIndex(tier: number): number {
  return Math.min(Math.max(Math.round(tier) || 1, 1), TIER_MAX_VALUE.length) - 1;
}

/** Trần giá trị (số lớn nhất một phép tính có thể đạt) của một bậc. */
export function tierMaxValue(tier: number): number {
  return TIER_MAX_VALUE[tierIndex(tier)];
}

