import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill in-memory localStorage for Node test runner
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

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage = createMockLocalStorage();
}

import { StorageService, AVATAR_SHOP_ITEMS } from '../src/services/storage';
import { seedDemoProfile } from '../src/services/demoSeed';
import { AdaptiveService } from '../src/services/adaptive';

describe('Parent Mode, Demo Data & Store Mechanics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly seeds realistic demo data and generates insightful parent diagnostics', () => {
    seedDemoProfile();
    const profile = StorageService.getChildProfile();
    expect(profile.xp).toBe(220);
    expect(profile.stars).toBe(18);
    expect(profile.completedLessons.length).toBe(5);

    const report = AdaptiveService.generateParentReport();
    expect(report.totalAnswered).toBe(24);
    expect(report.overallAccuracy).toBe(79); // 19 / 24 = 79%
    expect(report.weakSkills.length).toBeGreaterThanOrEqual(1);

    // Specifically math subtraction should be flagged as weak
    const weakMath = report.weakSkills.find((w) => w.skillId === 'math_subtraction_10');
    expect(weakMath).toBeDefined();

    // Advice should mention subtraction / math practice
    expect(report.adviceList.some((adv) => adv.includes('toán bớt đi') || adv.includes('Toán') || adv.includes('thử thách'))).toBe(true);
  });

  it('resets progress back to pristine zero baseline from demo state', () => {
    seedDemoProfile();
    expect(StorageService.getChildProfile().xp).toBe(220);

    StorageService.resetProgress();
    const cleanProfile = StorageService.getChildProfile();
    expect(cleanProfile.xp).toBe(0);
    expect(cleanProfile.stars).toBe(0);
    expect(cleanProfile.completedLessons).toEqual([]);

    const cleanReport = AdaptiveService.generateParentReport();
    expect(cleanReport.totalAnswered).toBe(0);
    expect(cleanReport.overallAccuracy).toBe(0);
    expect(cleanReport.weakSkills).toEqual([]);
  });

  it('manages parent settings mutations safely', () => {
    const defaultSettings = StorageService.getParentSettings();
    expect(defaultSettings.dailyLimitMinutes).toBe(20);
    expect(defaultSettings.voiceEnabled).toBe(true);

    StorageService.saveParentSettings({
      ...defaultSettings,
      dailyLimitMinutes: 30,
      voiceEnabled: false,
    });

    const updated = StorageService.getParentSettings();
    expect(updated.dailyLimitMinutes).toBe(30);
    expect(updated.voiceEnabled).toBe(false);
  });

  it('defaults questionAutoplay ON and migrates stored settings without it (§20)', () => {
    // Fresh defaults: pre-readers need to hear questions.
    const fresh = StorageService.getParentSettings();
    expect(fresh.questionAutoplay).toBe(true);

    // Stored settings from before the field existed must migrate to ON, not crash.
    localStorage.setItem(
      'kho_bau_parent_settings',
      JSON.stringify({ dailyLimitMinutes: 20, soundEnabled: true })
    );
    expect(StorageService.getParentSettings().questionAutoplay).toBe(true);

    // An explicit parental OFF must survive a save/load round-trip.
    StorageService.saveParentSettings({ ...fresh, questionAutoplay: false });
    expect(StorageService.getParentSettings().questionAutoplay).toBe(false);
    StorageService.saveParentSettings({ ...fresh, questionAutoplay: true });
  });

  it('enforces avatar shop purchasing with stars and equipping', () => {
    // Start with 0 stars
    let profile = StorageService.getChildProfile();
    const expensiveItem = AVATAR_SHOP_ITEMS.find((i) => i.priceStars >= 10);
    expect(expensiveItem).toBeDefined();

    // Verify cannot afford
    expect(profile.stars).toBeLessThan(expensiveItem!.priceStars);
    expect(profile.unlockedItems).not.toContain(expensiveItem!.id);

    // Award stars
    profile.stars = 50;
    StorageService.saveChildProfile(profile);

    // Buy item
    profile = StorageService.getChildProfile();
    profile.stars -= expensiveItem!.priceStars;
    profile.unlockedItems.push(expensiveItem!.id);
    profile.equipped[expensiveItem!.type] = expensiveItem!.id;
    StorageService.saveChildProfile(profile);

    const verified = StorageService.getChildProfile();
    expect(verified.stars).toBe(50 - expensiveItem!.priceStars);
    expect(verified.unlockedItems).toContain(expensiveItem!.id);
    expect(verified.equipped[expensiveItem!.type]).toBe(expensiveItem!.id);
  });
});
