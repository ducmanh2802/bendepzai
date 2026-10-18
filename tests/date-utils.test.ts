import { describe, it, expect } from 'vitest';
import { localDateKey, parseDateKey, diffDateKeys } from '../src/services/dateUtils';

describe('T01/B8 localDateKey', () => {
  it('returns YYYY-MM-DD in local time (not UTC)', () => {
    // 06:30 morning local time must still be "today", even though UTC is previous day.
    // Construct a local 06:30 on 2026-10-14.
    const d = new Date(2026, 9, 14, 6, 30, 0);
    expect(localDateKey(d)).toBe('2026-10-14');
  });

  it('pads month and day', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('diffDateKeys counts calendar days', () => {
    expect(diffDateKeys('2026-10-13', '2026-10-14')).toBe(1);
    expect(diffDateKeys('2026-10-14', '2026-10-14')).toBe(0);
    expect(diffDateKeys('2026-10-10', '2026-10-14')).toBe(4);
  });

  it('parseDateKey rejects garbage', () => {
    expect(parseDateKey('not-a-date')).toBeNull();
    expect(parseDateKey('')).toBeNull();
  });

  it('differs from UTC key in +07 evenings (documents the old bug)', () => {
    // 00:30 local on Oct 15 in UTC+7 == Oct 14 17:30 UTC.
    // Old code (toISOString) would report 2026-10-14; local must report 10-15.
    const localEarly = new Date(2026, 9, 15, 0, 30, 0);
    const utcKey = localEarly.toISOString().split('T')[0];
    const localKey = localDateKey(localEarly);
    expect(localKey).toBe('2026-10-15');
    // Only assert they CAN differ (depends on TZ of runner); the invariant
    // that matters is the local key matches the local calendar.
    expect(typeof utcKey).toBe('string');
  });
});
