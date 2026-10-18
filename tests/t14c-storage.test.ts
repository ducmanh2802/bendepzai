import { describe, it, expect, beforeEach } from 'vitest';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
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
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import { StorageService } from '../src/services/storage';
import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import { localDateKey } from '../src/services/dateUtils';
import { getTopicsBySubject } from '../src/data/curriculum';

const CHILD_KEY = 'kho_bau_child_profile';
const FIRST_SEEN_KEY = 'kho_bau_game_first_seen';
const READING_KEY = 'kho_bau_reading_store';

const daysAgoKey = (n: number) => localDateKey(new Date(Date.now() - n * 86400000));

describe('T14C storage — T07 fields: legacy load keeps existing progress', () => {
  beforeEach(() => localStorage.clear());

  it('adds defaults for missing lessonStars/chestState/unlockAllLessons without touching xp/stars/tickets/lessons', () => {
    localStorage.setItem(
      CHILD_KEY,
      JSON.stringify({
        xp: 42,
        stars: 7,
        tickets: 3,
        completedLessons: ['vn-les-1', 'math-les-2'],
      })
    );
    const p = StorageService.getChildProfile();
    expect(p.lessonStars).toEqual({});
    expect(p.chestState).toEqual({});
    expect(p.unlockAllLessons).toBe(false);
    expect(p.xp).toBe(42);
    expect(p.stars).toBe(7);
    expect(p.tickets).toBe(3);
    expect(p.completedLessons).toEqual(['vn-les-1', 'math-les-2']);
  });

  it('drops garbage T07 values but keeps every valid star entry', () => {
    localStorage.setItem(
      CHILD_KEY,
      JSON.stringify({
        xp: 5,
        stars: 1,
        lessonStars: { good: 3, low: 0, high: 9, nan: null, str: 'x', arr: [2], frac: 2.4 },
        chestState: { claimed: true, notClaimed: false, num: 1, str: 'yes' },
        unlockAllLessons: 'yes',
      })
    );
    const p = StorageService.getChildProfile();
    expect(p.lessonStars).toEqual({ good: 3, frac: 2 });
    expect(p.chestState).toEqual({ claimed: true });
    expect(p.unlockAllLessons).toBe(false);
    expect(p.xp).toBe(5);
    expect(p.stars).toBe(1);
  });

  it('retaking a lesson never duplicates stars/tickets and keeps lessonStars', () => {
    StorageService.completeLesson('t14c-retake-1', 'tieng-viet', 10, 2);
    const before = StorageService.getChildProfile();
    const starsBefore = before.stars;
    const ticketsBefore = before.tickets;
    const xpBefore = before.xp;
    expect(before.lessonStars['t14c-retake-1']).toBe(2);
    expect(ticketsBefore).toBe(1);

    StorageService.completeLesson('t14c-retake-1', 'tieng-viet', 10, 3);
    const after = StorageService.getChildProfile();
    expect(after.tickets).toBe(ticketsBefore);
    expect(after.stars).toBe(starsBefore);
    expect(after.lessonStars['t14c-retake-1']).toBe(2);
    expect(after.xp).toBeGreaterThanOrEqual(xpBefore);
  });

  it('unlockAllLessons round-trips and chest claims survive a reload', () => {
    const topic = getTopicsBySubject('tieng-viet')[0];
    topic.lessons.forEach((l) => StorageService.completeLesson(l.id, 'tieng-viet', 5, 3));
    expect(StorageService.claimTopicChest(topic.id, 'tieng-viet', 3)).toBe(3);
    expect(StorageService.claimTopicChest(topic.id, 'tieng-viet', 3)).toBe(0);

    const p = StorageService.getChildProfile();
    p.unlockAllLessons = true;
    StorageService.saveChildProfile(p);

    const reloaded = StorageService.getChildProfile();
    expect(reloaded.unlockAllLessons).toBe(true);
    expect(reloaded.chestState[topic.id]).toBe(true);
    expect(reloaded.completedLessons.length).toBeGreaterThanOrEqual(topic.lessons.length);
  });

  it('claiming an incomplete topic awards nothing and writes no chest state', () => {
    const topic = getTopicsBySubject('toan')[0];
    expect(topic.lessons.length).toBeGreaterThan(0);
    expect(StorageService.claimTopicChest(topic.id, 'toan', 3)).toBe(0);
    expect(StorageService.getChildProfile().chestState[topic.id]).toBeUndefined();
  });
});

describe('T14C storage — T08 game first-seen dates', () => {
  beforeEach(() => localStorage.clear());

  it('seeds a baseline for all catalog games so existing games are not NEW', () => {
    const store = StorageService.getGameFirstSeenStore();
    expect(Object.keys(store).sort()).toEqual(GAMES_CATALOG.map((g) => g.id).sort());
    for (const g of GAMES_CATALOG) {
      expect(StorageService.isGameNew(g.id)).toBe(false);
    }
  });

  it('sanitizes garbage first-seen values instead of crashing', () => {
    localStorage.setItem(
      FIRST_SEEN_KEY,
      JSON.stringify({
        catch_letters: 'not-a-date',
        falling_numbers: 12345,
        color_balloon: '2026-13-99',
        memory_cards: daysAgoKey(2),
        '': daysAgoKey(1),
      })
    );
    const store = StorageService.getGameFirstSeenStore();
    expect(store['memory_cards']).toBe(daysAgoKey(2));
    expect(store['catch_letters']).toBeUndefined();
    expect(store['falling_numbers']).toBeUndefined();
    expect(store['color_balloon']).toBeUndefined();
  });

  it('marks a brand-new game NEW once and never overwrites its first date', () => {
    expect(StorageService.isGameNew('t14c-future-game')).toBe(true);
    const first = StorageService.getGameFirstSeen('t14c-future-game');
    expect(first).toBe(localDateKey());
    expect(StorageService.markGameSeen('t14c-future-game', daysAgoKey(30))).toBe(first);
    expect(StorageService.getGameFirstSeen('t14c-future-game')).toBe(first);
  });

  it('NEW label lasts 7 days after first sight', () => {
    localStorage.setItem(
      FIRST_SEEN_KEY,
      JSON.stringify({ g7: daysAgoKey(7), g8: daysAgoKey(8), g0: daysAgoKey(0) })
    );
    expect(StorageService.isGameNew('g7')).toBe(true);
    expect(StorageService.isGameNew('g8')).toBe(false);
    expect(StorageService.isGameNew('g0')).toBe(true);
  });

  it('seeding first-seen never touches the child star/ticket progress', () => {
    StorageService.completeLesson('t14c-keep-progress', 'toan', 12, 3);
    const before = StorageService.getChildProfile();
    StorageService.getGameFirstSeenStore();
    StorageService.isGameNew('t14c-another-new-game');
    const after = StorageService.getChildProfile();
    expect(after.stars).toBe(before.stars);
    expect(after.tickets).toBe(before.tickets);
    expect(after.lessonStars).toEqual(before.lessonStars);
  });
});

describe('T14C storage — strict date keys reject impossible calendar dates', () => {
  beforeEach(() => localStorage.clear());

  it('tree-watered date ignores impossible dates', () => {
    localStorage.setItem('kho_bau_tree_water', '2026-13-99');
    expect(StorageService.getTreeWateredDate()).toBeNull();
    StorageService.setTreeWateredDate('2026-02-30');
    expect(StorageService.getTreeWateredDate()).toBeNull();
    StorageService.setTreeWateredDate(localDateKey());
    expect(StorageService.getTreeWateredDate()).toBe(localDateKey());
  });

  it('review completed days drop impossible dates but keep real ones', () => {
    const today = localDateKey();
    localStorage.setItem(
      'kho_bau_review_days',
      JSON.stringify([today, '2026-13-99', 'not-a-date', 42])
    );
    expect(StorageService.getReviewCompletedDays()).toEqual([today]);
  });
});

describe('T14C storage — T09A parent quick grades', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty and persists a valid grade across all aliases', () => {
    expect(StorageService.getReadingParentRatings()).toEqual({});
    StorageService.saveReadingParentRating('passage-1', '😀');
    expect(StorageService.getReadingParentRatings()['passage-1']).toBe('😀');
    expect(StorageService.getReadingParentGrades()['passage-1']).toBe('😀');
    StorageService.recordReadingParentRating('passage-2', '🙁');
    StorageService.gradeReadingPassage('passage-3', '😐');
    const all = StorageService.getReadingParentRatings();
    expect(all).toEqual({ 'passage-1': '😀', 'passage-2': '🙁', 'passage-3': '😐' });
  });

  it('ignores invalid grades and keeps the previous value', () => {
    StorageService.saveReadingParentRating('p1', '😀');
    StorageService.saveReadingParentRating('p1', 'bad' as never);
    StorageService.saveReadingParentRating('', '🙁');
    expect(StorageService.getReadingParentRatings()).toEqual({ p1: '😀' });
  });

  it('re-grading a passage updates it without duplicating history', () => {
    StorageService.saveReadingParentRating('p1', '🙁');
    StorageService.saveReadingParentRating('p1', '😀');
    StorageService.saveReadingParentRating('p2', '😐');
    expect(StorageService.getReadingParentRatings()).toEqual({ p1: '😀', p2: '😐' });
  });

  it('legacy payloads with only parentGrades still load (no data loss)', () => {
    localStorage.setItem(
      READING_KEY,
      JSON.stringify({
        profile: {
          parentGrades: { 'legacy-p': '😐' },
        },
      })
    );
    expect(StorageService.getReadingParentRatings()).toEqual({ 'legacy-p': '😐' });
  });

  it('sanitizer drops garbage ratings but keeps valid ones', () => {
    localStorage.setItem(
      READING_KEY,
      JSON.stringify({
        profile: {
          parentRatings: { ok: '😀', bad: 'awesome', num: 5, empty: '' },
          selfReadRatings: ['😀', 'nope', '🙁', 42],
        },
      })
    );
    const profile = StorageService.getReadingProfile();
    expect(profile.parentRatings).toEqual({ ok: '😀' });
    expect(profile.parentGrades).toEqual({ ok: '😀' });
    expect(profile.selfReadRatings).toEqual(['😀', '🙁']);
  });
});
