/**
 * T16 — Thợ Sửa Đồng Hồ (clock_builder) data. Pure TypeScript, no React imports.
 *
 * Bé chỉnh kim giờ trên mặt đồng hồ SVG cho đúng giờ trong đề
 * (tranh hoạt động trong ngày: "Bé ăn sáng lúc 6 giờ"),
 * rồi trả lời thứ trong tuần / ngày trên tờ lịch.
 * - T1: giờ đúng 1–6 với hoạt động buổi sáng.
 * - T2: giờ đúng 1–12 với hoạt động cả ngày (có phân biệt sáng/chiều trong đề).
 * - T3: chỉnh giờ + chọn buổi (sáng/chiều) — 2 ý mới đúng.
 * - T4: giờ khó + thứ trong tuần ("Hôm nay thứ Hai, ngày mai thứ mấy?").
 * - T5: thứ trong tuần + ngày trên tờ lịch ("Hôm nay ngày 5, ngày mai ngày mấy?").
 * - T6: trộn giờ + buổi + thứ + ngày.
 *
 * Giới hạn lớp 1: chỉ giờ đúng (phút luôn 0), số ≤ 100, ngày 1–28.
 */

import { pickDistinct, roundsForTier, seededRng, shuffleSeeded } from '../gameLevels';

export type ClockKind = 'clock' | 'weekday' | 'date';

export interface ClockRound {
  id: string;
  kind: ClockKind;
  /** Giờ đúng 1–12 (vòng clock). */
  hour: number;
  /** Buổi trong đề (vòng clock). */
  amPm: 'sáng' | 'chiều';
  /** Hoạt động trong tranh (vòng clock). */
  activity: string;
  activityEmoji: string;
  /** Thứ hiện tại (vòng weekday). */
  today: string;
  /** Ngày hiện tại 1–28 (vòng date). */
  day: number;
  /** Độ lệch: +1 (ngày mai), -1 (hôm qua), +2. */
  offset: number;
  /** Đáp án chữ (vòng weekday/date): "Thứ Ba" hoặc "ngày 6". */
  answer: string;
  /** Câu đề cho bé (NFC). */
  prompt: string;
  /** 4 phương án (giờ / thứ / ngày) đã xáo trộn, gồm đáp án. */
  options: number[] | string[];
}

interface ClockTarget {
  kind: ClockKind;
  hour: number;
  amPm: 'sáng' | 'chiều';
  activity: string;
  activityEmoji: string;
  today: string;
  day: number;
  offset: number;
}

function c(
  hour: number,
  amPm: 'sáng' | 'chiều',
  activity: string,
  activityEmoji: string,
): ClockTarget {
  return { kind: 'clock', hour, amPm, activity, activityEmoji, today: '', day: 0, offset: 0 };
}

function w(today: string, offset: number): ClockTarget {
  return { kind: 'weekday', hour: 0, amPm: 'sáng', activity: '', activityEmoji: '', today, day: 0, offset };
}

function d(day: number, offset: number): ClockTarget {
  return { kind: 'date', hour: 0, amPm: 'sáng', activity: '', activityEmoji: '', today: '', day, offset };
}

export const WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

/**
 * POOL_BY_TIER — mỗi pool 8 mục (số vòng tối đa mỗi cấp là 8).
 * Giờ đúng 1–12, ngày 1–28 (cộng/trừ không tràn tháng).
 */
export const POOL_BY_TIER: ClockTarget[][] = [
  // T1 — giờ đúng 1–6, hoạt động buổi sáng
  [
    c(6, 'sáng', 'Bé ăn sáng', '🍜'),
    c(5, 'sáng', 'Bé thức dậy', '🌅'),
    c(4, 'sáng', 'Gà gáy', '🐓'),
    c(3, 'sáng', 'Bé tập thể dục', '🤸'),
    c(2, 'sáng', 'Sao còn thức', '⭐'),
    c(1, 'sáng', 'Mèo còn ngủ', '🐱'),
    c(6, 'sáng', 'Bé đánh răng', '🦷'),
    c(5, 'sáng', 'Mẹ gọi bé dậy', '🔔'),
  ],
  // T2 — giờ đúng 1–12, hoạt động cả ngày
  [
    c(7, 'sáng', 'Bé đi học', '🎒'),
    c(11, 'sáng', 'Bé học vẽ', '🎨'),
    c(12, 'sáng', 'Bé ăn trưa', '🍚'),
    c(3, 'chiều', 'Bé đá bóng', '⚽'),
    c(5, 'chiều', 'Bé tưới cây', '🌱'),
    c(8, 'chiều', 'Bé đọc truyện', '📖'),
    c(9, 'chiều', 'Bé đi ngủ', '😴'),
    c(10, 'sáng', 'Bé học hát', '🎵'),
  ],
  // T3 — giờ + buổi (bé phải đúng cả giờ lẫn sáng/chiều)
  [
    c(6, 'sáng', 'Bé ăn sáng', '🍜'),
    c(6, 'chiều', 'Bé ăn tối', '🍲'),
    c(8, 'sáng', 'Bé vào lớp', '🏫'),
    c(8, 'chiều', 'Bé đánh răng đi ngủ', '🦷'),
    c(10, 'sáng', 'Bé ra chơi', '🏃'),
    c(10, 'chiều', 'Mẹ kể chuyện', '🌙'),
    c(4, 'chiều', 'Bé thả diều', '🪁'),
    c(7, 'chiều', 'Bé xem phim', '📺'),
  ],
  // T4 — giờ khó + thứ trong tuần
  [
    c(12, 'sáng', 'Ông mặt trời đứng bóng', '☀️'),
    c(12, 'chiều', 'Nửa đêm yên tĩnh', '🌌'),
    w('Thứ Hai', 1),
    c(9, 'sáng', 'Bé chào cờ', '🚩'),
    w('Thứ Sáu', 1),
    c(2, 'chiều', 'Bé ngủ trưa dậy', '🐣'),
    w('Thứ Bảy', 1),
    w('Chủ Nhật', -1),
  ],
  // T5 — thứ trong tuần + ngày trên tờ lịch
  [
    w('Thứ Hai', 2),
    d(5, 1),
    w('Thứ Tư', -1),
    d(12, 2),
    w('Thứ Sáu', 2),
    d(20, 1),
    w('Chủ Nhật', 1),
    d(27, -1),
  ],
  // T6 — trộn giờ + buổi + thứ + ngày
  [
    c(7, 'sáng', 'Bé đi học', '🎒'),
    w('Thứ Ba', 1),
    c(9, 'chiều', 'Bé đi ngủ', '😴'),
    d(8, 2),
    w('Thứ Năm', -2),
    c(5, 'chiều', 'Bé tưới cây', '🌱'),
    d(15, -1),
    w('Thứ Bảy', 2),
  ],
];

function weekdayAnswer(today: string, offset: number): string {
  const i = WEEKDAYS.indexOf(today);
  return WEEKDAYS[(i + offset + WEEKDAYS.length * 2) % WEEKDAYS.length];
}

function weekdayDistractors(today: string, offset: number, rng: () => number): string[] {
  const answer = weekdayAnswer(today, offset);
  const i = WEEKDAYS.indexOf(today);
  const near = [1, -1, 2, -2, 3]
    .map((k) => WEEKDAYS[(i + k + WEEKDAYS.length * 2) % WEEKDAYS.length])
    .filter((x) => x !== answer && x !== today);
  const picks = shuffleSeeded([...new Set(near)], rng).slice(0, 3);
  return shuffleSeeded([answer, ...picks], rng);
}

function dateDistractors(day: number, offset: number, rng: () => number): string[] {
  const answer = `ngày ${day + offset}`;
  const near = [day + offset + 1, day + offset - 1, day + offset + 2, day]
    .filter((n) => n >= 1 && n <= 28 && n !== day + offset)
    .map((n) => `ngày ${n}`);
  const picks = [...new Set(near)].slice(0, 3);
  while (picks.length < 3) picks.push(`ngày ${day + offset + picks.length + 2}`);
  return shuffleSeeded([answer, ...picks], rng);
}

function promptFor(t: ClockTarget): string {
  if (t.kind === 'clock') {
    return `${t.activity} lúc ${t.hour} giờ ${t.amPm}. Bé chỉnh đồng hồ tới ${t.hour} giờ nhé!`;
  }
  if (t.kind === 'weekday') {
    const when = t.offset === 1 ? 'ngày mai' : t.offset === -1 ? 'hôm qua' : t.offset > 0 ? `${t.offset} ngày nữa` : `${-t.offset} ngày trước`;
    return `Hôm nay là ${t.today}. ${when === 'ngày mai' || when === 'hôm qua' ? when : when} là thứ mấy?`;
  }
  const when = t.offset === 1 ? 'ngày mai' : t.offset === -1 ? 'hôm qua' : t.offset > 0 ? `${t.offset} ngày nữa` : `${-t.offset} ngày trước`;
  return `Tờ lịch ghi hôm nay ngày ${t.day}. ${when} là ngày mấy?`;
}

/**
 * Dựng các vòng chơi cho 1 cấp: đủ vòng, đáp án đúng lịch/giờ,
 * 4 phương án duy nhất đã xáo trộn theo seed.
 */
export function buildClockRounds(tier: number, seedOrNonce = 0): ClockRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const rng = seededRng(1602 + safeTier * 311 + seedOrNonce * 1009);
  const picks = pickDistinct(pool, count, rng);
  return picks.map((t, i) => {
    const r = seededRng(1602 + safeTier * 311 + seedOrNonce * 1009 + i * 71 + 19);
    if (t.kind === 'clock') {
      const near = [t.hour + 1, t.hour - 1, t.hour + 2, t.hour - 2, t.hour + 3]
        .map((x) => ((x - 1 + 12) % 12) + 1)
        .filter((x) => x !== t.hour);
      const opts = shuffleSeeded([t.hour, ...[...new Set(near)].slice(0, 3)], r);
      return {
        id: `cb-t${safeTier}-${i}-h${t.hour}`,
        kind: t.kind,
        hour: t.hour,
        amPm: t.amPm,
        activity: t.activity,
        activityEmoji: t.activityEmoji,
        today: '',
        day: 0,
        offset: 0,
        answer: `${t.hour} giờ ${t.amPm}`,
        prompt: promptFor(t),
        options: opts,
      };
    }
    if (t.kind === 'weekday') {
      const answer = weekdayAnswer(t.today, t.offset);
      return {
        id: `cb-t${safeTier}-${i}-${t.today}-${t.offset}`,
        kind: t.kind,
        hour: 0,
        amPm: 'sáng',
        activity: '',
        activityEmoji: '📅',
        today: t.today,
        day: 0,
        offset: t.offset,
        answer,
        prompt: promptFor(t),
        options: weekdayDistractors(t.today, t.offset, r),
      };
    }
    const answer = `ngày ${t.day + t.offset}`;
    return {
      id: `cb-t${safeTier}-${i}-d${t.day}-${t.offset}`,
      kind: t.kind,
      hour: 0,
      amPm: 'sáng',
      activity: '',
      activityEmoji: '📅',
      today: '',
      day: t.day,
      offset: t.offset,
      answer,
      prompt: promptFor(t),
      options: dateDistractors(t.day, t.offset, r),
    };
  });
}

export function buildRounds(tier: number, seed = 0): ClockRound[] {
  return buildClockRounds(tier, seed);
}
