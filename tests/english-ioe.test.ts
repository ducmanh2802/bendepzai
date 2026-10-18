import { describe, it, expect } from 'vitest';
import { IOE_WEEKS, getAllIoeQuestions } from '../src/data/englishIoe';

describe('English IOE Champion — data quality gates', () => {
  it('has all 12 weeks in order', () => {
    expect(IOE_WEEKS).toHaveLength(12);
    expect(IOE_WEEKS.map((w) => w.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('every week has at least one lesson, an objective and topics', () => {
    for (const w of IOE_WEEKS) {
      expect(w.lessons.length, `week ${w.week}`).toBeGreaterThan(0);
      expect(w.title.length).toBeGreaterThan(0);
      expect(w.topics.length, `week ${w.week}`).toBeGreaterThan(0);
      for (const l of w.lessons) {
        expect(l.objective.length, `${l.id}`).toBeGreaterThan(0);
        expect(l.questions.length, `${l.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('question ids are unique', () => {
    const ids = getAllIoeQuestions().map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every answer index points at an existing option and has an explanation', () => {
    for (const q of getAllIoeQuestions()) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.id).toBeLessThan(q.options.length);
      expect(q.explanation.trim().length, q.id).toBeGreaterThan(0);
      expect(q.prompt.trim().length, q.id).toBeGreaterThan(0);
    }
  });

  it('difficulty is always 1..3 and skill is a known skill', () => {
    const skills = new Set(['vocabulary', 'spelling', 'grammar', 'reading', 'listening']);
    for (const q of getAllIoeQuestions()) {
      expect([1, 2, 3]).toContain(q.difficulty);
      expect(skills.has(q.skill), `${q.id} skill=${q.skill}`).toBe(true);
    }
  });

  it('no mojibake or replacement characters', () => {
    for (const q of getAllIoeQuestions()) {
      expect(q.prompt.includes('\uFFFD')).toBe(false);
      expect(q.explanation.includes('\uFFFD')).toBe(false);
    }
  });
});