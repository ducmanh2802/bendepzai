/**
 * Date helpers — local (device) calendar day keys (YYYY-MM-DD).
 *
 * T01/B8: the app previously used `new Date().toISOString().split('T')[0]`
 * (UTC) for streaks, quests and analytics. In Vietnam (UTC+7) a new day
 * started at 07:00 local time, breaking streaks/quests. All "day" logic
 * must use the device-local calendar day instead.
 */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local calendar day key `YYYY-MM-DD` for the given date (default: now). */
export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parse a `YYYY-MM-DD` key back to a local-midnight Date (NaN-safe). */
export function parseDateKey(key: string): Date | null {
  if (typeof key !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole-calendar-day difference between two day keys (keyB - keyA). */
export function diffDateKeys(keyA: string, keyB: string): number | null {
  const a = parseDateKey(keyA);
  const b = parseDateKey(keyB);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}
