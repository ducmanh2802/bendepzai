/**
 * T18A — Hệ thống động lực (dữ liệu + engine + storage).
 * Mọi rule đều test trực tiếp: số lượng, không trùng id, đáp án/NFC,
 * không từ cấm, tất định theo ngày, khiên streak, gacha không trùng,
 * migration giữ nguyên sao/vé/đồ đã có.
 */
import { describe, it, expect, beforeEach } from 'vitest';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
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

import { StorageService, STORAGE_SCHEMA_VERSION } from '../src/services/storage';
import { STICKERS, STICKER_SETS, getStickersBySet } from '../src/data/stickers';
import { SHOP_CATALOG } from '../src/data/shopCatalog';
import { QUEST_POOL, QUEST_MAP } from '../src/data/questPool';
import { ACHIEVEMENT_CATALOG } from '../src/data/achievementCatalog';
import { containsBannedWord } from '../src/data/contentSafety';
import { localDateKey } from '../src/services/dateUtils';
import {
  xpForLevel,
  xpToLevel,
  levelTitle,
  levelProgress,
  rewardForLevel,
  pendingLevels,
  MAX_LEVEL,
} from '../src/services/levelEngine';
import {
  drawSticker,
  completedSetsCount,
  ownedStickersCount,
  isSetCompleted,
} from '../src/services/stickerEngine';
import { seededRandom } from '../src/services/questEngine';
import { selectDailyQuests, applyQuestEvent } from '../src/services/questEngine';
import { touchStreakDay, countStreak, weekKeyOf, MAX_SHIELDS } from '../src/services/streakEngine';
import { evaluateNewAchievements, xpForUnlocks } from '../src/services/achievementEngine';
import { canBuyShopItem } from '../src/services/shopEngine';
import type { DailyQuest, MotivationStats } from '../src/types';

function clearLs() {
  localStorage.clear();
}

function dayKey(daysAgo: number): string {
  return localDateKey(new Date(Date.now() - daysAgo * 86400000));
}

function maxedStats(): MotivationStats {
  return {
    lessonsTotal: 99,
    lessonsViet: 99,
    lessonsMath: 99,
    lessonsEnglish: 99,
    lessonsLife: 99,
    lessons3Star: 99,
    gamesPlayed: 99,
    reviewDays: 99,
    weeklyChallenges: 99,
    streak: 99,
    streakBest: 99,
    level: 50,
    starsEarnedTotal: 9999,
    stickersOwned: 60,
    stickerSetsCompleted: 6,
    shopOwned: 99,
    gachaDraws: 99,
    questsCompleted: 99,
    chestsOpened: 99,
    comboBest: 99,
    storiesRead: 99,
  };
}

// ---------------------------------------------------------------- catalog
describe('T18A catalog: số lượng + id duy nhất', () => {
  it('sticker ≥ 60, đúng 6 bộ × 10, hiếm 6/3/1 mỗi bộ', () => {
    expect(STICKER_SETS.length).toBe(6);
    expect(STICKERS.length).toBeGreaterThanOrEqual(60);
    for (const set of STICKER_SETS) {
      const members = getStickersBySet(set.id);
      expect(members.length).toBe(10);
      expect(members.filter((s) => s.rarity === 'thuong').length).toBe(6);
      expect(members.filter((s) => s.rarity === 'hiem').length).toBe(3);
      expect(members.filter((s) => s.rarity === 'sieu-hiem').length).toBe(1);
    }
  });

  it('shop ≥ 40 món, id duy nhất, giá + level hợp lệ', () => {
    expect(SHOP_CATALOG.length).toBeGreaterThanOrEqual(40);
    const ids = SHOP_CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of SHOP_CATALOG) {
      expect(item.priceStars).toBeGreaterThan(0);
      expect(item.minLevel).toBeGreaterThanOrEqual(1);
      expect(item.minLevel).toBeLessThanOrEqual(MAX_LEVEL);
      expect(item.emoji.length).toBeGreaterThan(0);
    }
  });

  it('quest pool ≥ 30 (3 học + 1 vui mỗi ngày), id duy nhất', () => {
    expect(QUEST_POOL.length).toBeGreaterThanOrEqual(30);
    const ids = QUEST_POOL.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(QUEST_POOL.filter((q) => q.isFun).length).toBeGreaterThanOrEqual(3);
    expect(QUEST_POOL.filter((q) => !q.isFun).length).toBeGreaterThanOrEqual(20);
  });

  it('thành tựu ≥ 30, id duy nhất, rule có ngưỡng dương', () => {
    expect(ACHIEVEMENT_CATALOG.length).toBeGreaterThanOrEqual(30);
    const ids = ACHIEVEMENT_CATALOG.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENT_CATALOG) {
      expect(a.rule.atLeast).toBeGreaterThan(0);
      expect(a.xpReward).toBeGreaterThan(0);
    }
  });

  it('mọi chữ cho bé: chuẩn NFC + không từ cấm', () => {
    const texts: string[] = [
      ...STICKERS.map((s) => s.name),
      ...STICKER_SETS.map((s) => `${s.name} ${s.description}`),
      ...SHOP_CATALOG.map((i) => i.name),
      ...QUEST_POOL.map((q) => q.title),
      ...ACHIEVEMENT_CATALOG.flatMap((a) => [a.title, a.description]),
    ];
    expect(texts.length).toBeGreaterThan(150);
    for (const t of texts) {
      expect(t, `NFC: ${t}`).toBe(t.normalize('NFC'));
      expect(containsBannedWord(t), `banned: ${t}`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------- level
describe('T18A level engine: XP → 1–50 + danh hiệu', () => {
  it('đường cong đơn điệu, level đầu nhanh, chốt ở 50', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBeLessThanOrEqual(60);
    for (let l = 2; l <= MAX_LEVEL; l += 1) {
      expect(xpForLevel(l)).toBeGreaterThan(xpForLevel(l - 1));
    }
    expect(xpToLevel(0)).toBe(1);
    expect(xpToLevel(xpForLevel(2))).toBe(2);
    expect(xpToLevel(xpForLevel(50))).toBe(50);
    expect(xpToLevel(999_999_999)).toBe(50);
  });

  it('danh hiệu từ Thám Hiểm Nhí tới Trạng Nguyên Nhí', () => {
    expect(levelTitle(1)).toBe('Thám Hiểm Nhí');
    expect(levelTitle(50)).toBe('Trạng Nguyên Nhí');
    expect(levelTitle(7)).toBe('Thợ Săn Chữ');
    expect(levelTitle(12)).toBe('Nhà Toán Học Nhí');
  });

  it('thanh XP + quà level + level chờ nhận', () => {
    const p = levelProgress(xpForLevel(3));
    expect(p.level).toBe(3);
    expect(p.pct).toBe(0);
    const top = levelProgress(10_000_000);
    expect(top.level).toBe(50);
    expect(top.pct).toBe(100);
    expect(rewardForLevel(3).stickerDraws).toBe(1);
    expect(rewardForLevel(5).tickets).toBe(1);
    expect(pendingLevels(xpForLevel(4), [2, 3])).toEqual([4]);
    expect(pendingLevels(0, [])).toEqual([]);
  });
});

// ---------------------------------------------------------------- quest
describe('T18A quest engine: tất định + ưu tiên môn yếu', () => {
  it('cùng ngày + cùng môn yếu → cùng bộ (3 học + 1 vui)', () => {
    const a = selectDailyQuests('2026-10-15', ['toan']);
    const b = selectDailyQuests('2026-10-15', ['toan']);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    expect(a.length).toBe(4);
    const fun = a.filter((q) => QUEST_MAP.get(q.id)?.isFun);
    expect(fun.length).toBe(1);
    for (const q of a) expect(QUEST_MAP.has(q.id)).toBe(true);
  });

  it('nhiệm vụ đầu nhắm môn yếu nhất của bé', () => {
    const quests = selectDailyQuests('2026-10-15', ['toan', 'english']);
    const first = QUEST_MAP.get(quests[0].id);
    expect(first?.subjects).toContain('toan');
  });

  it('ngày khác nhau cho bộ khác nhau (xoay vòng thật)', () => {
    const seen = new Set<string>();
    for (let d = 0; d < 30; d += 1) {
      const key = dayKey(d);
      seen.add(selectDailyQuests(key, []).map((q) => q.id).join('|'));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('sự kiện lesson/correct/combo/review làm tăng đúng quest', () => {
    const mkQuest = (id: string): DailyQuest => {
      const def = QUEST_MAP.get(id);
      if (!def) throw new Error(id);
      return {
        id: def.id, title: def.title, targetCount: def.targetCount,
        currentCount: 0, rewardStars: def.rewardStars, rewardXp: def.rewardXp,
        completed: false, type: def.type,
      };
    };
    const daily = {
      date: '2026-10-15', comboBest: 8, comboNow: 8,
      reviewQuestions: 6, gachaDraws: 0,
      correctBySubject: { 'tieng-viet': 0, toan: 5, english: 0, 'cuoc-song': 0 },
    };
    const quests = ['quest_math', 'quest_correct_math', 'quest_combo_5', 'quest_review_5q'].map(mkQuest);
    const { quests: next, newlyCompleted } = applyQuestEvent(
      quests, { kind: 'answer', subject: 'toan', correct: true }, daily
    );
    expect(next.find((q) => q.id === 'quest_combo_5')?.completed).toBe(true);
    expect(next.find((q) => q.id === 'quest_correct_math')?.completed).toBe(true);
    // Ôn tập chỉ tiến triển khi bé ôn bài (review_question), không phải khi trả lời thường.
    expect(next.find((q) => q.id === 'quest_review_5q')?.completed).toBe(false);
    expect(next.find((q) => q.id === 'quest_math')?.completed).toBe(false);
    expect(newlyCompleted.length).toBe(2);
    const reviewed = applyQuestEvent(next, { kind: 'review_question' }, daily);
    expect(reviewed.quests.find((q) => q.id === 'quest_review_5q')?.completed).toBe(true);
    expect(reviewed.newlyCompleted.map((q) => q.id)).toEqual(['quest_review_5q']);
  });
});

// ---------------------------------------------------------------- streak
describe('T18A streak engine: khiên giữ chuỗi', () => {
  it('học liên tiếp tăng chuỗi, nghỉ 1 ngày có khiên giữ nguyên', () => {
    const monday = touchStreakDay({ streakDays: [], shields: 1, lastShieldWeek: null, today: '2026-10-12' });
    expect(monday.streak).toBe(1);
    const tuesday = touchStreakDay({ ...monday, today: '2026-10-13' });
    expect(tuesday.streak).toBe(2);
    // Nghỉ thứ Tư, học thứ Năm (cách 2 ngày): khiên vỡ thay bé.
    const thursday = touchStreakDay({ ...tuesday, today: '2026-10-15' });
    expect(thursday.shieldUsedToday).toBe(true);
    expect(thursday.streak).toBe(3);
    expect(thursday.shields).toBeLessThan(tuesday.shields);
  });

  it('nghỉ 2 ngày liên tiếp (hoặc hết khiên) → chuỗi tính lại', () => {
    const out = touchStreakDay({ streakDays: ['2026-10-10'], shields: 0, lastShieldWeek: '2026-W41', today: '2026-10-13' });
    expect(out.shieldUsedToday).toBe(false);
    expect(out.streak).toBe(1);
  });

  it('sang tuần mới tự có thêm khiên (tối đa 2)', () => {
    const out = touchStreakDay({ streakDays: ['2026-10-11'], shields: 0, lastShieldWeek: '2026-W40', today: '2026-10-12' });
    expect(out.shields).toBe(1);
    expect(out.lastShieldWeek).toBe(weekKeyOf('2026-10-12'));
    expect(MAX_SHIELDS).toBe(2);
    expect(countStreak(['2026-10-10', '2026-10-11', '2026-10-12'], '2026-10-12')).toBe(3);
  });
});

// ---------------------------------------------------------------- gacha
describe('T18A sticker engine: không trùng tới khi đủ bộ', () => {
  it('60 lượt đầu không trùng sticker nào', () => {
    const owned: Record<string, number> = {};
    const seen = new Set<string>();
    const rng = seededRandom(42);
    for (let i = 0; i < STICKERS.length; i += 1) {
      const { stickerId, isNew } = drawSticker(owned, rng);
      expect(isNew).toBe(true);
      expect(seen.has(stickerId)).toBe(false);
      seen.add(stickerId);
      owned[stickerId] = 1;
    }
    expect(seen.size).toBe(STICKERS.length);
    const dupe = drawSticker(owned, rng);
    expect(dupe.isNew).toBe(false);
  });

  it('đếm bộ sưu tập đúng', () => {
    const owned: Record<string, number> = {};
    for (const s of getStickersBySet('dong-vat')) owned[s.id] = 1;
    expect(isSetCompleted(owned, 'dong-vat')).toBe(true);
    expect(isSetCompleted(owned, 'vu-tru')).toBe(false);
    expect(completedSetsCount(owned)).toBe(1);
    expect(ownedStickersCount(owned)).toBe(10);
  });
});

// ---------------------------------------------------------------- achievement
describe('T18A achievement engine: mọi rule kiểm thử được', () => {
  it('số liệu tối đa mở hết, số liệu trắng không mở gì', () => {
    expect(evaluateNewAchievements(maxedStats(), []).length).toBe(ACHIEVEMENT_CATALOG.length);
    const zero: MotivationStats = {
      lessonsTotal: 0, lessonsViet: 0, lessonsMath: 0, lessonsEnglish: 0, lessonsLife: 0,
      lessons3Star: 0, gamesPlayed: 0, reviewDays: 0, weeklyChallenges: 0, streak: 1,
      streakBest: 1, level: 1, starsEarnedTotal: 0, stickersOwned: 0, stickerSetsCompleted: 0,
      shopOwned: 0, gachaDraws: 0, questsCompleted: 0, chestsOpened: 0, comboBest: 0, storiesRead: 0,
    };
    expect(evaluateNewAchievements(zero, [])).toEqual([]);
  });

  it('8 rule cũ giữ nguyên ngưỡng', () => {
    const stats = { ...maxedStats(), lessonsTotal: 1, streak: 3, gamesPlayed: 3, reviewDays: 5, weeklyChallenges: 1, lessonsViet: 0, lessonsMath: 0, lessonsEnglish: 0 };
    const unlocked = evaluateNewAchievements(stats, []);
    for (const id of ['ach_first_lesson', 'ach_streak_3', 'ach_gamer_fun', 'ach_review_pro', 'ach_weekly_hero']) {
      expect(unlocked).toContain(id);
    }
    expect(unlocked).not.toContain('ach_viet_master');
  });

  it('XP thưởng cộng dồn đúng', () => {
    expect(xpForUnlocks(['ach_first_lesson', 'ach_streak_3'])).toBe(150);
    expect(xpForUnlocks([])).toBe(0);
  });
});

// ---------------------------------------------------------------- storage
describe('T18A storage: migration + sanitizer + API', () => {
  beforeEach(() => {
    clearLs();
  });

  it('schema P42-v2, kho cũ (P28) vẫn migrate, sao/vé/đồ không mất', () => {
    localStorage.setItem(
      'kho_bau_child_profile',
      JSON.stringify({
        id: 'child_1', name: 'Bé Test', stars: 42, tickets: 7, xp: 100,
        unlockedItems: ['hat_cap', 'hat_crown'],
        completedLessons: ['vn-les-1'], lastActiveDate: dayKey(0),
      })
    );
    localStorage.setItem(
      'kho_bau_achievements',
      JSON.stringify([{ id: 'ach_first_lesson', unlocked: true, unlockedAt: '2026-01-01', xpReward: 50 }])
    );
    localStorage.setItem(
      'kho_bau_learning_os_store',
      JSON.stringify({ schemaVersion: 'P28-v1', knowledgeStates: {}, recentEvidences: [], dailyPlan: null, fatigue: {}, recommendationHistory: [] })
    );
    const profile = StorageService.getChildProfile();
    expect(profile.stars).toBe(42);
    expect(profile.tickets).toBe(7);
    expect(profile.unlockedItems).toContain('hat_crown');
    expect(StorageService.getLearningOSStore().schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    const achs = StorageService.getAchievements();
    expect(achs.length).toBeGreaterThanOrEqual(30);
    expect(achs.find((a) => a.id === 'ach_first_lesson')?.unlocked).toBe(true);
    expect(achs.find((a) => a.id === 'ach_streak_30')?.unlocked).toBe(false);
  });

  it('khiên cứu chuỗi 2 ngày, reset khi nghỉ 3 ngày', () => {
    localStorage.setItem(
      'kho_bau_child_profile',
      JSON.stringify({ id: 'child_1', streak: 4, lastActiveDate: dayKey(2), stars: 0, tickets: 0 })
    );
    const before = StorageService.getMotivationState();
    const shieldsBefore = before.shields;
    expect(shieldsBefore).toBeGreaterThan(0);
    const profile = StorageService.getChildProfile();
    expect(profile.streak).toBe(5);
    expect(StorageService.getMotivationState().shields).toBe(shieldsBefore - 1);

    clearLs();
    localStorage.setItem(
      'kho_bau_child_profile',
      JSON.stringify({ id: 'child_1', streak: 9, lastActiveDate: dayKey(3), stars: 0, tickets: 0 })
    );
    localStorage.setItem('kho_bau_motivation', JSON.stringify({ shields: 0, lastShieldWeek: weekKeyOf(dayKey(0)) }));
    expect(StorageService.getChildProfile().streak).toBe(1);
  });

  it('quest hoàn thành trao thưởng 1 lần, không trao trùng', () => {
    const def = QUEST_MAP.get('quest_viet');
    if (!def) throw new Error('missing quest_viet');
    const quest: DailyQuest = {
      id: def.id, title: def.title, targetCount: 1, currentCount: 0,
      rewardStars: def.rewardStars, rewardXp: def.rewardXp, completed: false, type: def.type,
    };
    StorageService.saveDailyQuests([quest]);
    const starsBefore = StorageService.getChildProfile().stars;
    const done = StorageService.recordQuestEvent({ kind: 'lesson', subject: 'tieng-viet' });
    expect(done).toEqual(['quest_viet']);
    expect(StorageService.getChildProfile().stars).toBe(starsBefore + def.rewardStars);
    StorageService.recordQuestEvent({ kind: 'lesson', subject: 'tieng-viet' });
    expect(StorageService.getChildProfile().stars).toBe(starsBefore + def.rewardStars);
  });

  it('completeLesson mở thành tựu đầu + quest Em & Cuộc sống', () => {
    StorageService.completeLesson('life-les-1', 'cuoc-song', 30, 3);
    const achs = StorageService.getAchievements();
    expect(achs.find((a) => a.id === 'ach_first_lesson')?.unlocked).toBe(true);
    const quests = StorageService.getDailyQuests();
    const lifeQuests = quests.filter((q) => q.type === 'lesson_life');
    const progressed = lifeQuests.filter((q) => q.currentCount > 0 || q.completed);
    expect(progressed.length).toBeGreaterThanOrEqual(lifeQuests.length > 0 ? 1 : 0);
  });

  it('gacha: hết vé báo no-ticket, quá 5 lượt/ngày báo daily-limit', () => {
    const rng = seededRandom(7);
    expect(StorageService.drawGacha(rng).reason).toBe('no-ticket');
    const profile = StorageService.getChildProfile();
    profile.tickets = 10;
    StorageService.saveChildProfile(profile);
    const seen = new Set<string>();
    for (let i = 0; i < 5; i += 1) {
      const r = StorageService.drawGacha(rng);
      expect(r.ok).toBe(true);
      if (r.stickerId) seen.add(r.stickerId);
    }
    expect(seen.size).toBe(5);
    expect(StorageService.drawGacha(rng).reason).toBe('daily-limit');
    expect(StorageService.getChildProfile().tickets).toBe(5);
  });

  it('shop: khoá level, thiếu sao, mua thành công trừ đúng giá', () => {
    // Món mở ngay nhưng bé chưa đủ sao.
    expect(StorageService.buyShopItem('shirt_yellow').reason).toBe('not-enough-stars');
    const profile = StorageService.getChildProfile();
    profile.stars = 1000;
    StorageService.saveChildProfile(profile);
    // Đủ sao nhưng chưa đủ level (món mở theo level).
    const locked = StorageService.buyShopItem('hat_crown');
    expect(locked.reason).toBe('level-locked');
    expect(locked.missingLevels).toBeGreaterThan(0);
    const bought = StorageService.buyShopItem('shirt_yellow');
    expect(bought.ok).toBe(true);
    const after = StorageService.getChildProfile();
    expect(after.unlockedItems).toContain('shirt_yellow');
    expect(after.stars).toBe(1000 - 6);
    expect(StorageService.buyShopItem('shirt_yellow').reason).toBe('already-owned');
    expect(canBuyShopItem('nope', [], 999, 50).reason).toBe('unknown-item');
  });

  it('quà level nhận 1 lần, nhận lại không trùng', () => {
    const profile = StorageService.getChildProfile();
    profile.xp = xpForLevel(6);
    StorageService.saveChildProfile(profile);
    const rng = seededRandom(3);
    const first = StorageService.claimLevelRewards(rng);
    expect(first.claimed.length).toBeGreaterThan(0);
    expect(first.claimed).toContain(6);
    const starsAfter = StorageService.getChildProfile().stars;
    expect(starsAfter).toBeGreaterThan(0);
    // XP thưởng thành tựu có thể đẩy bé lên level mới — level mới thì được
    // nhận, nhưng level đã nhận không bao giờ trao lại.
    const second = StorageService.claimLevelRewards(rng);
    const overlap = second.claimed.filter((l) => first.claimed.includes(l));
    expect(overlap).toEqual([]);
    const third = StorageService.claimLevelRewards(rng);
    const overlap2 = third.claimed.filter((l) => [...first.claimed, ...second.claimed].includes(l));
    expect(overlap2).toEqual([]);
  });

  it('sanitizer chịu được kho động lực thù địch', () => {
    localStorage.setItem(
      'kho_bau_motivation',
      JSON.stringify({
        stickers: { st_dongvat_1: 2, hacker: 999, st_dongvat_2: 'nhieu' },
        shields: 99, claimedLevelRewards: [2, 'x', -5, 999],
        streakDays: ['2026-13-99', '2026-10-14', 42],
        daily: { date: 'cu', comboBest: -3 },
      })
    );
    const m = StorageService.getMotivationState();
    expect(m.stickers['st_dongvat_1']).toBe(2);
    expect(m.stickers['hacker']).toBeUndefined();
    expect(m.shields).toBeLessThanOrEqual(2);
    expect(m.streakDays).not.toContain('2026-13-99');
    expect(m.daily.comboBest).toBe(0);
  });
});

// ---------------------------------------------------------------- T18C: Parent Settings + Reward History
describe('T18C parent settings: maxGachaPerDay, rewardsEnabled, rewardHistory', () => {
  beforeEach(() => {
    clearLs();
  });

  it('parent settings mặc định có maxGachaPerDay=5, rewardsEnabled=true, rewardHistory=[]', () => {
    const settings = StorageService.getParentSettings();
    expect(settings.maxGachaPerDay).toBe(5);
    expect(settings.rewardsEnabled).toBe(true);
    expect(settings.rewardHistory).toEqual([]);
  });

  it('cập nhật maxGachaPerDay qua saveParentSettings', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), maxGachaPerDay: 10 });
    const settings = StorageService.getParentSettings();
    expect(settings.maxGachaPerDay).toBe(10);
  });

  it('cập nhật rewardsEnabled qua saveParentSettings', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: false });
    const settings = StorageService.getParentSettings();
    expect(settings.rewardsEnabled).toBe(false);
  });

  it('maxGachaPerDay=0 nghĩa là không giới hạn', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), maxGachaPerDay: 0 });
    const settings = StorageService.getParentSettings();
    expect(settings.maxGachaPerDay).toBe(0);
  });

  it('gacha dùng maxGachaPerDay từ cài đặt phụ huynh', () => {
    const rng = seededRandom(7);
    const profile = StorageService.getChildProfile();
    profile.tickets = 20;
    StorageService.saveChildProfile(profile);

    // Mặc định 5 lượt
    for (let i = 0; i < 5; i += 1) {
      expect(StorageService.drawGacha(rng).ok).toBe(true);
    }
    expect(StorageService.drawGacha(rng).reason).toBe('daily-limit');

    clearLs();
    // Đặt giới hạn 10 lượt
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), maxGachaPerDay: 10 });
    profile.tickets = 20;
    StorageService.saveChildProfile(profile);
    for (let i = 0; i < 10; i += 1) {
      expect(StorageService.drawGacha(rng).ok).toBe(true);
    }
    expect(StorageService.drawGacha(rng).reason).toBe('daily-limit');
  });

  it('rewardsEnabled=false không ghi rewardHistory', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: false });
    const rng = seededRandom(7);
    const profile = StorageService.getChildProfile();
    profile.tickets = 10;
    profile.stars = 1000;
    StorageService.saveChildProfile(profile);

    StorageService.drawGacha(rng);
    StorageService.completeLesson('vn-les-1', 'tieng-viet', 30, 3);

    const settings = StorageService.getParentSettings();
    expect(settings.rewardHistory.length).toBe(0);
  });

  it('rewardsEnabled=true ghi rewardHistory cho các loại phần thưởng', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: true });
    const rng = seededRandom(7);
    const profile = StorageService.getChildProfile();
    profile.tickets = 10;
    profile.stars = 1000;
    StorageService.saveChildProfile(profile);

    // Gacha
    StorageService.drawGacha(rng);
    // Hoàn thành bài học
    StorageService.completeLesson('vn-les-1', 'tieng-viet', 30, 3);
    // Mua đồ shop
    StorageService.buyShopItem('shirt_yellow');

    const settings = StorageService.getParentSettings();
    expect(settings.rewardHistory.length).toBeGreaterThan(0);
    // Kiểm tra có sticker, stars, xp, tickets, shop_item
    const types = settings.rewardHistory.map((e) => e.type);
    expect(types).toContain('sticker');
    expect(types).toContain('stars');
    expect(types).toContain('xp');
    expect(types).toContain('tickets');
    expect(types).toContain('shop_item');
  });

  it('rewardHistory tối đa 50 mục, mới nhất lên đầu', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: true });
    const profile = StorageService.getChildProfile();
    profile.stars = 10000;
    StorageService.saveChildProfile(profile);

    // Use completeLesson to add reward history (public method) - each lesson adds 3 entries
    for (let i = 0; i < 60; i += 1) {
      StorageService.completeLesson(`test-les-${i}`, 'tieng-viet', 10, 1);
    }
    const settings = StorageService.getParentSettings();
    expect(settings.rewardHistory.length).toBe(50);
    // Mới nhất ở đầu - completeLesson adds: XP, stars, tickets (tickets last)
    expect(settings.rewardHistory[0].description).toContain('test-les-59');
    expect(settings.rewardHistory[49].description).toContain('test-les-');
  });

  it('claimLevelRewards ghi rewardHistory cho stars, tickets, sticker', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: true });
    const profile = StorageService.getChildProfile();
    profile.xp = xpForLevel(5);
    StorageService.saveChildProfile(profile);
    const rng = seededRandom(3);
    StorageService.claimLevelRewards(rng);

    const settings = StorageService.getParentSettings();
    const types = settings.rewardHistory.map((e) => e.type);
    expect(types).toContain('stars');
    expect(types).toContain('tickets');
    expect(types).toContain('sticker');
  });

  it('claimDailyChest ghi rewardHistory', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: true });
    StorageService.claimDailyChest(10, 50);

    const settings = StorageService.getParentSettings();
    const types = settings.rewardHistory.map((e) => e.type);
    expect(types).toContain('stars');
    expect(types).toContain('xp');
  });

  it('recordTierReward ghi rewardHistory', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: true });
    StorageService.recordTierReward('shape_sorting', 1, 3, 50, 100, 0);

    const settings = StorageService.getParentSettings();
    const types = settings.rewardHistory.map((e) => e.type);
    expect(types).toContain('xp');
    expect(types).toContain('stars');
  });

  it('recordGamePlayed ghi rewardHistory', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: true });
    StorageService.recordGamePlayed(15, 1, 'shape_sorting');

    const settings = StorageService.getParentSettings();
    const types = settings.rewardHistory.map((e) => e.type);
    expect(types).toContain('xp');
    expect(types).toContain('stars');
  });

  it('checkAchievements ghi rewardHistory khi mở khóa thành tựu', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: true });
    const profile = StorageService.getChildProfile();
    profile.xp = xpForLevel(10);
    StorageService.saveChildProfile(profile);
    StorageService.checkAchievements();

    const settings = StorageService.getParentSettings();
    const types = settings.rewardHistory.map((e) => e.type);
    expect(types).toContain('xp');
  });

  it('recordCompetitionResult ghi rewardHistory', () => {
    StorageService.saveParentSettings({ ...StorageService.getParentSettings(), rewardsEnabled: true });
    const profile = StorageService.getChildProfile();
    profile.xp = 0;
    profile.stars = 0;
    StorageService.saveChildProfile(profile);

    StorageService.recordCompetitionResult(
      {
        id: 'test_exam_1',
        blueprintId: 'math_p1',
        examTitle: 'Thi Thử Môn Toán',
        subject: 'toan',
        timestamp: new Date().toISOString(),
        durationSeconds: 600,
        timeUsedSeconds: 600,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        score: 8,
        speedRating: 'STEADY',
        speedLabel: 'Bình thường',
        averageSecondsPerQuestion: 60,
        responses: [],
        skillBreakdown: {},
        strongSkills: [],
        weakSkills: [],
        errorAnalysis: [],
        readinessSnapshot: {
          overallLevel: 'DEVELOPING',
          overallLabel: 'Cần luyện tập thêm',
          knowledgeScore: 50,
          accuracyScore: 80,
          speedScore: 60,
          consistencyScore: 70,
          skillCoverageScore: 40,
          evidence: {
            totalExamsTaken: 1,
            recentAccuracyAverage: 80,
            medianSecondsPerQuestion: 60,
            strongSkillsCount: 0,
            weakSkillsCount: 1,
            totalSkillsCovered: 1,
          },
          recommendations: ['Luyện tập thêm Toán'],
          isSufficientData: false,
        },
        scoring: {
          rawScore: 8,
          maxScore: 10,
          accuracy: 80,
          completion: 100,
          attemptedCount: 10,
          correctCount: 8,
          totalQuestions: 10,
          totalSeconds: 600,
          averageSecondsPerQuestion: 60,
          fastestQuestionSeconds: 30,
          slowestQuestionSeconds: 120,
          skillPerformance: {},
          questionTypePerformance: {},
        },
        provenance: {
          blueprintVersion: 1,
          questionBankVersion: 1,
          seed: 12345,
        },
      },
      100,
      5
    );

    const settings = StorageService.getParentSettings();
    const types = settings.rewardHistory.map((e) => e.type);
    expect(types).toContain('xp');
    expect(types).toContain('stars');
  });
});
