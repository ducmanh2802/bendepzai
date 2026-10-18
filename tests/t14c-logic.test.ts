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

import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import {
  GAME_REGISTRY,
  REALTIME_GAME_IDS,
  getGameComponent,
} from '../src/components/games/registry';
import { LAUNCHABLE_GAME_IDS } from '../src/config/policy';
import {
  adaptReadingQuestion,
  readingQuestionToQuestion,
  readingQuestionToLessonQuestion,
  toQuestion,
  toLessonQuestion,
} from '../src/services/readingAdapter';
import { ReadingEngine } from '../src/services/readingEngine';
import { StorageService } from '../src/services/storage';
import { READING_QUESTIONS } from '../src/data/readingContent';
import { CompetitionEngine } from '../src/services/competitionEngine';
import { EXAM_BLUEPRINTS } from '../src/data/competitionBlueprints';
import type { ExamBlueprint } from '../src/types/competition';
import { runContentValidation } from '../src/services/contentValidator';
import { resolvePraise, toPraiseSubject } from '../src/services/praiseEngine';
import { ALL_TOPICS, getAllQuestions, getAllSkills, getTopicsBySubject } from '../src/data/curriculum';

describe('T14C T08 — catalog, registry and launchable ids stay in sync', () => {
  it('has no duplicate game ids and every id is NFC non-empty text', () => {
    const ids = GAMES_CATALOG.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.trim().length).toBeGreaterThan(0);
      expect(id.normalize('NFC')).toBe(id);
    }
  });

  it('every catalog game resolves a component; unknown ids resolve null', () => {
    for (const g of GAMES_CATALOG) {
      expect(getGameComponent(g.id)).not.toBeNull();
      expect(GAME_REGISTRY[g.id]).toBeDefined();
    }
    expect(getGameComponent('no-such-game')).toBeNull();
  });

  it('realtime games are a subset of the catalog and match the launchable set', () => {
    const catalogIds = new Set(GAMES_CATALOG.map((g) => g.id));
    for (const id of REALTIME_GAME_IDS) {
      expect(catalogIds.has(id)).toBe(true);
    }
    expect(new Set(REALTIME_GAME_IDS).size).toBe(REALTIME_GAME_IDS.length);
    expect(Array.from(LAUNCHABLE_GAME_IDS).sort()).toEqual(
      GAMES_CATALOG.map((g) => g.id).sort()
    );
  });

  it('every game carries skillIds plus child-facing text (title/description/emoji)', () => {
    for (const g of GAMES_CATALOG) {
      expect((g.skillIds ?? []).length).toBeGreaterThan(0);
      for (const s of g.skillIds ?? []) {
        expect(typeof s).toBe('string');
        expect(s.trim().length).toBeGreaterThan(0);
      }
      expect(g.title.trim().length).toBeGreaterThan(0);
      expect(g.description.trim().length).toBeGreaterThan(0);
      expect(g.emoji.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('T14C T09A — ReadingQuestion adapter keeps answer and options intact', () => {
  it('adapts a real bank question without losing the correct answer', () => {
    const rq = READING_QUESTIONS[0];
    expect(rq.options).toContain(rq.correctAnswer);
    const q = adaptReadingQuestion(rq);
    expect(q.id).toBe(rq.id);
    expect(q.subject).toBe(rq.subject);
    expect(q.skillId).toBe(rq.skillId);
    expect(q.difficulty).toBe(rq.difficulty);
    expect(q.options).toEqual(rq.options);
    expect(q.correctAnswer).toBe(rq.correctAnswer);
    expect(q.options).toContain(q.correctAnswer);
    expect(q.type).toBe('multiple-choice');
    expect(q.prompt).toBe(rq.prompt);
  });

  it('all alias exports are the same single-source function', () => {
    expect(readingQuestionToQuestion).toBe(adaptReadingQuestion);
    expect(readingQuestionToLessonQuestion).toBe(adaptReadingQuestion);
    expect(toQuestion).toBe(adaptReadingQuestion);
    expect(toLessonQuestion).toBe(adaptReadingQuestion);
    const rq = READING_QUESTIONS[1] ?? READING_QUESTIONS[0];
    expect(toQuestion(rq)).toEqual(adaptReadingQuestion(rq));
  });
});

describe('T14C T09A — recordParentRating engine behaviour', () => {
  beforeEach(() => localStorage.clear());

  it('records a grade into ratings, grades and self-read history together', () => {
    const profile = StorageService.getReadingProfile();
    const next = ReadingEngine.recordParentRating(profile, 'p7', '😀');
    expect(next.parentRatings?.['p7']).toBe('😀');
    expect(next.parentGrades?.['p7']).toBe('😀');
    expect(next.selfReadRatings).toContain('😀');
    // The input profile is not mutated.
    expect(profile.parentRatings?.['p7']).toBeUndefined();
  });

  it('re-grading the same passage updates it instead of duplicating history', () => {
    const profile = StorageService.getReadingProfile();
    const once = ReadingEngine.recordParentRating(profile, 'p7', '🙁');
    const twice = ReadingEngine.recordParentRating(once, 'p7', '😀');
    expect(twice.parentRatings?.['p7']).toBe('😀');
    expect(twice.parentGrades?.['p7']).toBe('😀');
    expect(twice.selfReadRatings?.filter((r) => r === '😀').length).toBe(1);
    expect(twice.selfReadRatings).toEqual(['😀']);
  });

  it('rejects invalid ratings and empty passage ids without changing the profile', () => {
    const profile = StorageService.getReadingProfile();
    expect(ReadingEngine.recordParentRating(profile, 'p7', 'bad' as never)).toEqual(profile);
    expect(ReadingEngine.recordParentRating(profile, '', '😀')).toEqual(profile);
  });

  it('aliases agree with the canonical method', () => {
    const profile = StorageService.getReadingProfile();
    expect(ReadingEngine.applyParentRating(profile, 'p1', '😐')).toEqual(
      ReadingEngine.recordParentRating(profile, 'p1', '😐')
    );
    expect(ReadingEngine.gradeSelfRead(profile, 'p1', '😐')).toEqual(
      ReadingEngine.recordParentRating(profile, 'p1', '😐')
    );
  });
});

describe('T14C T14A — new subject support without breaking competition', () => {
  it('competition blueprints only use the 3 competition subjects', () => {
    const allowed = new Set(['tieng-viet', 'toan', 'english']);
    expect(EXAM_BLUEPRINTS.length).toBeGreaterThan(0);
    for (const bp of EXAM_BLUEPRINTS) {
      expect(allowed.has(bp.subject)).toBe(true);
    }
  });

  it('the competition engine refuses the new subject instead of mis-scoring it', () => {
    const lifeBlueprint = { subject: 'cuoc-song', questionCount: 5 } as unknown as ExamBlueprint;
    expect(() => CompetitionEngine.assembleExamQuestions(lifeBlueprint, 1)).toThrow();
  });

  it('content validation never crashes and every subject has challenge questions', () => {
    const report = runContentValidation();
    expect(report.totals.errors).toBe(0);
    const subjects = ['tieng-viet', 'toan', 'english', 'cuoc-song'];
    for (const subject of subjects) {
      const items = getAllQuestions().filter(
        (q) => q.subject === subject && q.difficulty === 3
      );
      expect(items.length).toBeGreaterThan(0);
    }
    expect(
      report.issues.filter((i) => i.code === 'MISSING_DIFFICULTY_3').length
    ).toBe(0);
  });

  it('praise engine maps every subject (new subject falls back to Vietnamese)', () => {
    expect(toPraiseSubject('cuoc-song')).toBe('VIETNAMESE');
    expect(toPraiseSubject('tieng-viet')).toBe('VIETNAMESE');
    expect(toPraiseSubject('toan')).toBe('MATH');
    expect(toPraiseSubject('english')).toBe('ENGLISH');
    const praise = resolvePraise({ subject: toPraiseSubject('cuoc-song'), outcome: 'CORRECT' });
    expect(praise.language).toBe('vi-VN');
    expect(praise.ttsText).toBe(praise.text);
  });

  it('every Record<SubjectType, …> covers the new subject', () => {
    expect(Object.keys(ALL_TOPICS).sort()).toEqual(
      ['cuoc-song', 'english', 'tieng-viet', 'toan'].sort()
    );
    for (const subject of ['tieng-viet', 'toan', 'english', 'cuoc-song'] as const) {
      expect(getTopicsBySubject(subject).length).toBeGreaterThan(0);
      for (const topic of getTopicsBySubject(subject)) {
        expect(topic.lessons.length).toBeGreaterThan(0);
      }
    }
    const lifeSkills = getAllSkills().filter((s) => s.subject === 'cuoc-song');
    expect(lifeSkills.length).toBeGreaterThan(0);
  });
});

describe('T14C T09B — kid/real modes never change the exam engine or blueprints', () => {
  it('assembles the identical paper for the same blueprint and seed', () => {
    const bp = EXAM_BLUEPRINTS[0];
    const a = CompetitionEngine.assembleExamQuestions(bp, 4242).map((q) => q.id);
    const b = CompetitionEngine.assembleExamQuestions(bp, 4242).map((q) => q.id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });

  it('every assembled paper matches its blueprint subject with no duplicates', () => {
    for (const bp of EXAM_BLUEPRINTS.slice(0, 6)) {
      const { questions } = CompetitionEngine.assembleExam(bp, 7);
      const ids = questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const q of questions) {
        expect(q.subject).toBe(bp.subject);
      }
    }
  });

  it('grading is a pure engine function — same inputs always give the same verdict', () => {
    const bp = EXAM_BLUEPRINTS[0];
    const { questions } = CompetitionEngine.assembleExam(bp, 99);
    expect(questions.length).toBeGreaterThan(0);
    const q = questions[0];
    const verdict = CompetitionEngine.gradeAnswer(q, q.correctAnswer);
    expect(CompetitionEngine.gradeAnswer(q, q.correctAnswer)).toBe(verdict);
    expect(verdict).toBe(true);
  });
});
