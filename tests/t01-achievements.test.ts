import { describe, it, expect, beforeEach } from 'vitest';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof (globalThis as Record<string, unknown>).localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import { StorageService } from '../src/services/storage';

function clearLs() {
  localStorage.clear();
}

describe('T01/B10 achievement unlock rules', () => {
  beforeEach(() => {
    clearLs();
  });

  it('unlocks ach_weekly_hero after completing 1 weekly challenge', () => {
    StorageService.recordWeeklyChallengeCompleted('weekly-challenge-week-1');
    const achs = StorageService.getAchievements();
    const hero = achs.find((a) => a.id === 'ach_weekly_hero');
    expect(hero?.unlocked).toBe(true);
    const profile = StorageService.getChildProfile();
    expect(profile.completedWeeklyChallenges).toContain('weekly-challenge-week-1');
  });

  it('unlocks ach_review_pro after 5 distinct review days', () => {
    const days = ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'];
    for (const d of days.slice(0, 4)) {
      StorageService.recordDailyReviewCompleted(d);
    }
    let achs = StorageService.getAchievements();
    expect(achs.find((a) => a.id === 'ach_review_pro')?.unlocked).toBe(false);

    StorageService.recordDailyReviewCompleted(days[4]);
    achs = StorageService.getAchievements();
    expect(achs.find((a) => a.id === 'ach_review_pro')?.unlocked).toBe(true);
  });

  it('recordDailyReviewCompleted is idempotent per day', () => {
    StorageService.recordDailyReviewCompleted('2026-10-14');
    StorageService.recordDailyReviewCompleted('2026-10-14');
    expect(StorageService.getReviewCompletedDays()).toEqual(['2026-10-14']);
  });
});
