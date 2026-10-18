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

import { computeStars } from '../src/hooks/useGameStage';
import { StorageService } from '../src/services/storage';
import { GAME_LEVEL_POLICY } from '../src/config/policy';
import { shouldCountMemoryMistake } from '../src/components/games/MemoryCardsGame';
import { coverageFromPixels, MIN_PAINT_COVERAGE } from '../src/components/games/ColoringCanvasGame';

describe('T02/B1 stars from real performance', () => {
  it('3 stars = flawless, 2 stars <= 2 mistakes, else 1', () => {
    expect(GAME_LEVEL_POLICY.STAR_THREE_MAX_MISTAKES).toBe(0);
    expect(GAME_LEVEL_POLICY.STAR_TWO_MAX_MISTAKES).toBe(2);
    expect(computeStars(0)).toBe(3);
    expect(computeStars(1)).toBe(2);
    expect(computeStars(2)).toBe(2);
    expect(computeStars(3)).toBe(1);
    expect(computeStars(9)).toBe(1);
  });
});

describe('T02/B2 replay pays only the delta + 20% XP', () => {
  beforeEach(() => {
    localStorage.clear();
    // T18A — quest ngày xoay vòng theo ngày nên test kinh tế replay phải ghim
    // quest về dạng legacy (quest_game target 1) để số học là tất định.
    // Mọi assertion bên dưới giữ nguyên, chỉ cố định ambient state.
    StorageService.saveDailyQuests([
      {
        id: 'quest_game',
        title: 'Thử sức 1 trò chơi thông minh',
        targetCount: 1,
        currentCount: 0,
        rewardStars: 2,
        rewardXp: 20,
        completed: false,
        type: 'play_game',
      },
    ]);
  });

  it('first clear grants full stars + full XP', () => {
    const before = StorageService.getChildProfile();
    const r = StorageService.recordTierReward('spelling_duel', 1, 3, 10, 5, 0);
    expect(r.isFirstClear).toBe(true);
    expect(r.isNewBest).toBe(true);
    expect(r.starsAwarded).toBe(3);
    expect(r.xpAwarded).toBe(10);
    const after = StorageService.getChildProfile();
    // Tier stars (3) plus the first play_game daily-quest bonus (2 stars).
    expect(after.stars - before.stars).toBe(3 + 2);
    expect(after.xp - before.xp).toBeGreaterThanOrEqual(10);
  });

  it('replay with equal stars grants 0 stars + ~20% XP', () => {
    StorageService.recordTierReward('spelling_duel', 1, 3, 10, 5, 0);
    const before = StorageService.getChildProfile();
    const r = StorageService.recordTierReward('spelling_duel', 1, 3, 10, 5, 3);
    expect(r.isFirstClear).toBe(false);
    expect(r.isNewBest).toBe(false);
    expect(r.starsAwarded).toBe(0);
    expect(r.xpAwarded).toBe(2); // 20% of 10
    const after = StorageService.getChildProfile();
    expect(after.stars - before.stars).toBe(0);
    expect(after.xp - before.xp).toBe(2);
  });

  it('replay beating the record grants only the difference', () => {
    StorageService.recordTierReward('ocean_fishing', 2, 1, 15, 4, 0);
    const before = StorageService.getChildProfile();
    const r = StorageService.recordTierReward('ocean_fishing', 2, 3, 15, 6, 1);
    expect(r.starsAwarded).toBe(2);
    expect(r.xpAwarded).toBe(3); // 20% of 15
    const after = StorageService.getChildProfile();
    expect(after.stars - before.stars).toBe(2);
  });
});

describe('T02/B4 memory counts only repeat errors on seen pairs', () => {
  it('same pair never counts; unseen pairs never count', () => {
    expect(shouldCountMemoryMistake([1, 2], 1, 1)).toBe(false);
    expect(shouldCountMemoryMistake([], 1, 2)).toBe(false);
    expect(shouldCountMemoryMistake([1], 1, 2)).toBe(false);
    expect(shouldCountMemoryMistake([1, 2, 3], 1, 3)).toBe(true);
  });
});

describe('T02/B3 coloring needs >= 30% coverage', () => {
  it('threshold is 0.3 and pure-function math holds', () => {
    expect(MIN_PAINT_COVERAGE).toBe(0.3);
    const white = new Uint8ClampedArray(400).fill(255);
    expect(coverageFromPixels(white)).toBe(0);
    const half = new Uint8ClampedArray(400);
    for (let i = 0; i < 200; i += 4) {
      half[i] = 200;
      half[i + 1] = 100;
      half[i + 2] = 50;
      half[i + 3] = 255;
    }
    for (let i = 200; i < 400; i += 4) {
      half[i] = 255;
      half[i + 1] = 255;
      half[i + 2] = 255;
      half[i + 3] = 255;
    }
    // 50 of 100 pixels painted
    expect(coverageFromPixels(half)).toBeCloseTo(0.5, 5);
    expect(coverageFromPixels(half)).toBeGreaterThanOrEqual(MIN_PAINT_COVERAGE);
    expect(coverageFromPixels(white)).toBeLessThan(MIN_PAINT_COVERAGE);
  });
});

describe('T02/B5 play nonce', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('bumps once per play and reads back', () => {
    expect(StorageService.getPlayNonce('spelling_duel', 1)).toBe(0);
    expect(StorageService.bumpPlayNonce('spelling_duel', 1)).toBe(1);
    expect(StorageService.bumpPlayNonce('spelling_duel', 1)).toBe(2);
    expect(StorageService.getPlayNonce('spelling_duel', 1)).toBe(2);
    expect(StorageService.getPlayNonce('spelling_duel', 2)).toBe(0);
  });
});
