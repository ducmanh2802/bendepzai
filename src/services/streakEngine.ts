/**
 * T18A — Chuỗi ngày + khiên giữ chuỗi.
 * - Mỗi tuần bé tự động có 1 khiên (tối đa 2 khiên dự trữ).
 * - Nghỉ đúng 1 ngày mà còn khiên → khiên vỡ thay bé, chuỗi giữ nguyên.
 * - Nghỉ ≥ 2 ngày liên tiếp (hoặc hết khiên) → chuỗi tính lại từ 1.
 * Thuần hàm số để test mọi kịch bản ngày tháng.
 */
import { diffDateKeys, parseDateKey } from './dateUtils';

export const MAX_SHIELDS = 2;

export interface StreakInput {
  /** Các ngày bé đã học (YYYY-MM-DD), chưa gồm hôm nay. */
  streakDays: string[];
  /** Các ngày nghỉ đã được khiên lấp (chuỗi đi qua nhưng không +1). */
  shieldedDays?: string[];
  shields: number;
  lastShieldWeek: string | null;
  today: string;
}

export interface StreakOutput {
  streakDays: string[];
  shieldedDays: string[];
  shields: number;
  lastShieldWeek: string;
  /** Chuỗi hiện tại (số ngày HỌC liên tiếp tính tới hôm nay). */
  streak: number;
  /** true khi hôm nay khiên đã vỡ thay bé. */
  shieldUsedToday: boolean;
}

/** Tuần ISO đơn giản `YYYY-Www` từ day key (giờ máy, đủ cho phát khiên/tuần). */
export function weekKeyOf(dateKey: string): string | null {
  const d = parseDateKey(dateKey);
  if (!d) return null;
  const copy = new Date(d.getTime());
  // Đưa về thứ Hai đầu tuần (ISO).
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  const year = copy.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const mondayWeek1 = new Date(year, 0, 4 - jan4Day);
  const week = Math.floor((copy.getTime() - mondayWeek1.getTime()) / 604800000) + 1;
  return `${year}-W${week < 10 ? `0${week}` : `${week}`}`;
}

function prevDayKey(cursor: string): string | null {
  const d = parseDateKey(cursor);
  if (!d) return null;
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

/**
 * Đếm chuỗi liên tiếp kết thúc ở `today` (bao gồm hôm nay).
 * Ngày đã được khiên lấp thì chuỗi đi qua nhưng KHÔNG +1
 * (khiên giữ chuỗi chứ không tặng ngày học).
 */
export function countStreak(
  streakDays: readonly string[],
  today: string,
  shieldedDays: readonly string[] = []
): number {
  const set = new Set(streakDays);
  const shielded = new Set(shieldedDays);
  if (!set.has(today)) return 0;
  let streak = 1;
  let cursor = today;
  for (;;) {
    const prev = prevDayKey(cursor);
    if (!prev) break;
    if (set.has(prev)) {
      streak += 1;
      cursor = prev;
    } else if (shielded.has(prev)) {
      cursor = prev;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Chạm 1 ngày học: phát khiên tuần (nếu sang tuần mới), cộng ngày,
 * dùng khiên khi nghỉ đúng 1 ngày. Không bao giờ xoá ngày cũ.
 */
export function touchStreakDay(input: StreakInput): StreakOutput {
  const week = weekKeyOf(input.today) ?? 'unknown';
  let shields = Math.min(Math.max(Math.round(input.shields), 0), MAX_SHIELDS);
  let lastShieldWeek = input.lastShieldWeek;
  if (lastShieldWeek !== week) {
    shields = Math.min(shields + 1, MAX_SHIELDS);
    lastShieldWeek = week;
  }

  const days = [...input.streakDays];
  const shielded = [...(input.shieldedDays ?? [])];
  let shieldUsedToday = false;
  if (!days.includes(input.today)) {
    const sorted = [...days].sort();
    const last = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const diff = last ? diffDateKeys(last, input.today) : null;
    if (diff === null || diff < 0) {
      // Ngày lạ (quá khứ) hoặc chưa có ngày nào: chỉ ghi nhận, không phạt.
      days.push(input.today);
    } else if (diff <= 1) {
      days.push(input.today);
    } else if (diff === 2 && shields > 0) {
      // Khiên vỡ thay bé: lấp ngày nghỉ để chuỗi đi qua mà không đứt.
      shields -= 1;
      shieldUsedToday = true;
      const missing = prevDayKey(input.today);
      if (missing && !shielded.includes(missing)) shielded.push(missing);
      days.push(input.today);
    } else {
      days.push(input.today);
    }
  }

  const unique = [...new Set(days)].sort();
  const uniqueShielded = [...new Set(shielded)].sort().slice(-400);
  return {
    streakDays: unique.slice(-400),
    shieldedDays: uniqueShielded,
    shields,
    lastShieldWeek,
    streak: countStreak(unique, input.today, uniqueShielded),
    shieldUsedToday,
  };
}
