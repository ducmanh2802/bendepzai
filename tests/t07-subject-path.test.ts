import { describe, it, expect, beforeEach } from 'vitest';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import { StorageService } from '../src/services/storage';
import { getTopicsBySubject } from '../src/data/curriculum';

describe('T07 subject path progress storage', () => {
  beforeEach(() => localStorage.clear());

  it('migrates legacy profile without new T07 fields', () => {
    localStorage.setItem(
      'kho_bau_child_profile',
      JSON.stringify({ xp: 10, stars: 2, completedLessons: ['vn-les-1'] })
    );
    const p = StorageService.getChildProfile();
    expect(p.lessonStars).toEqual({});
    expect(p.chestState).toEqual({});
    expect(p.unlockAllLessons).toBe(false);
  });

  it('sanitizes lessonStars and chestState values', () => {
    localStorage.setItem(
      'kho_bau_child_profile',
      JSON.stringify({
        completedLessons: [],
        lessonStars: { a: 2, b: 5, c: 'x', d: 1.4 },
        chestState: { t1: true, t2: false, t3: 1 },
        unlockAllLessons: 1,
      })
    );
    const p = StorageService.getChildProfile();
    expect(p.lessonStars).toEqual({ a: 2, d: 1 });
    expect(p.chestState).toEqual({ t1: true });
    expect(p.unlockAllLessons).toBe(false);
  });

  it('records stars on completeLesson', () => {
    StorageService.completeLesson('t07-les-a', 'tieng-viet', 10, 2.4);
    const p = StorageService.getChildProfile();
    expect(p.lessonStars['t07-les-a']).toBe(2);
  });

  it('claims a topic chest once and awards stars', () => {
    const topic = getTopicsBySubject('tieng-viet')[0];
    topic.lessons.forEach((l) => StorageService.completeLesson(l.id, 'tieng-viet', 5, 3));
    const first = StorageService.claimTopicChest(topic.id, 'tieng-viet', 3);
    const second = StorageService.claimTopicChest(topic.id, 'tieng-viet', 3);
    const p = StorageService.getChildProfile();
    expect(first).toBe(3);
    expect(second).toBe(0);
    expect(p.chestState[topic.id]).toBe(true);
  });

  it('honours unlockAllLessons override', () => {
    const p = StorageService.getChildProfile();
    p.unlockAllLessons = true;
    StorageService.saveChildProfile(p);
    expect(StorageService.getChildProfile().unlockAllLessons).toBe(true);
  });
});
