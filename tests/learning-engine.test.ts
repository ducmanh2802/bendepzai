import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

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

import { StorageService } from '../src/services/storage';
import { AdaptiveService } from '../src/services/adaptive';
import { ChildProfile, LearningAnalytics } from '../src/types';

describe('Storage & Persistence Invariant Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with a clean, unseeded profile for a new child', () => {
    const profile = StorageService.getChildProfile();
    expect(profile.xp).toBe(0);
    expect(profile.stars).toBe(0);
    expect(profile.tickets).toBe(0);
    expect(profile.completedLessons).toEqual([]);
    expect(profile.completedWeeklyChallenges).toEqual([]);
    expect(profile.streak).toBeGreaterThanOrEqual(1);
  });

  it('initializes with clean, zero baseline analytics for a new child', () => {
    const analytics = StorageService.getAnalytics();
    expect(analytics.totalMinutesSpent).toBe(0);
    expect(analytics.minutesToday).toBe(0);
    expect(analytics.totalQuestionsAnswered).toBe(0);
    expect(analytics.totalCorrect).toBe(0);
    expect(analytics.lessonsCompletedCount).toBe(0);
    expect(analytics.gamesPlayedCount).toBe(0);
    expect(analytics.recentErrors).toEqual([]);
  });

  it('safely recovers and sanitizes when localStorage contains corrupted JSON or invalid types', () => {
    // Inject corrupt data
    localStorage.setItem('kho_bau_child_profile', '{ "completedLessons": "invalid", "xp": -99, "equipped": null }');
    const profile = StorageService.getChildProfile();
    expect(Array.isArray(profile.completedLessons)).toBe(true);
    expect(profile.xp).toBeGreaterThanOrEqual(0);
    expect(profile.equipped).toBeDefined();
    expect(typeof profile.equipped).toBe('object');
  });

  it('safely handles non-JSON garbage string without crashing', () => {
    localStorage.setItem('kho_bau_child_profile', '<<<NOT JSON>>>');
    const profile = StorageService.getChildProfile();
    expect(profile).toBeDefined();
    expect(profile.grade).toBe(1);
    expect(profile.name).toBe('Bé Minh');
  });

  it('enforces lesson reward idempotency: does not duplicate stars or tickets on lesson retake', () => {
    // Complete lesson first time (awards lesson 30xp + daily quest 30xp + First Lesson Achievement 50xp = 110xp, and 3+3 = 6 stars)
    StorageService.completeLesson('vn-les-1', 'tieng-viet', 30, 3);
    const p1 = StorageService.getChildProfile();
    expect(p1.stars).toBe(6);
    expect(p1.xp).toBe(110);
    expect(p1.tickets).toBe(1);
    expect(p1.completedLessons).toContain('vn-les-1');

    // Retake the same completed lesson
    StorageService.completeLesson('vn-les-1', 'tieng-viet', 30, 3);
    const p2 = StorageService.getChildProfile();
    // Stars and tickets MUST NOT double!
    expect(p2.stars).toBe(6);
    expect(p2.tickets).toBe(1);
    // Review practice XP only (+5 XP)
    expect(p2.xp).toBe(115);
  });

  it('tracks question answer correctly and updates skill mastery', () => {
    // Answer question correctly
    StorageService.recordQuestionAnswer('math_addition_10', true, 'math-q4-1', '3 + 2 = ?', 'toan');
    let analytics = StorageService.getAnalytics();
    expect(analytics.totalQuestionsAnswered).toBe(1);
    expect(analytics.totalCorrect).toBe(1);
    expect(analytics.skillMastery['math_addition_10'].correctCount).toBe(1);

    // Answer incorrectly
    StorageService.recordQuestionAnswer('math_addition_10', false, 'math-q4-2', '4 + 4 = ?', 'toan');
    analytics = StorageService.getAnalytics();
    expect(analytics.totalQuestionsAnswered).toBe(2);
    expect(analytics.totalCorrect).toBe(1);
    expect(analytics.skillMastery['math_addition_10'].wrongCount).toBe(1);
    expect(analytics.recentErrors.length).toBe(1);
  });
});

describe('Parent Report & Adaptive Engine Zero-Safe Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates zero-safe, evidence-based parent report when child has 0 activities', () => {
    const report = AdaptiveService.generateParentReport();
    expect(report.totalAnswered).toBe(0);
    expect(report.overallAccuracy).toBe(0);
    expect(report.subjectMastery['tieng-viet'].percent).toBe(0);
    expect(report.subjectMastery['tieng-viet'].label).toBe('Chưa làm bài');
    expect(report.subjectMastery['toan'].percent).toBe(0);
    expect(report.subjectMastery['toan'].label).toBe('Chưa làm bài');
    expect(report.subjectMastery['english'].percent).toBe(0);
    expect(report.subjectMastery['english'].label).toBe('Chưa làm bài');
    expect(report.adviceList.length).toBeGreaterThan(0);
    expect(Number.isNaN(report.overallAccuracy)).toBe(false);
  });

  it('correctly calculates accuracy and status when activities are performed', () => {
    // 3 correct answers, 1 wrong
    StorageService.recordQuestionAnswer('math_counting_10', true, 'q1', 'count', 'toan');
    StorageService.recordQuestionAnswer('math_counting_10', true, 'q2', 'count', 'toan');
    StorageService.recordQuestionAnswer('math_counting_10', true, 'q3', 'count', 'toan');
    StorageService.recordQuestionAnswer('math_counting_10', false, 'q4', 'count', 'toan');

    const report = AdaptiveService.generateParentReport();
    expect(report.totalAnswered).toBe(4);
    expect(report.overallAccuracy).toBe(75);
    expect(report.subjectMastery['toan'].percent).toBe(75);
    expect(report.subjectMastery['toan'].label).toBe('Đạt yêu cầu');
  });

  it('generates daily review questions prioritising weak and practicing skills', () => {
    // Mark a skill as needing review by 3 failures
    StorageService.recordQuestionAnswer('math_subtraction_10', false, 'q1', 'sub', 'toan');
    StorageService.recordQuestionAnswer('math_subtraction_10', false, 'q2', 'sub', 'toan');
    StorageService.recordQuestionAnswer('math_subtraction_10', false, 'q3', 'sub', 'toan');

    const reviewSet = AdaptiveService.generateDailyReview();
    expect(reviewSet.questions.length).toBeGreaterThanOrEqual(5);
    expect(reviewSet.weakCount).toBeGreaterThanOrEqual(1);
    // At least one question in review set should address math subtraction
    const hasTargetSkill = reviewSet.questions.some((q) => q.skillId === 'math_subtraction_10');
    expect(hasTargetSkill).toBe(true);
  });
});
