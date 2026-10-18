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
