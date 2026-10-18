import { describe, it, expect } from 'vitest';
import { ENGLISH_TOPICS } from '../src/data/englishCurriculum';

describe('English Curriculum Quality & Pedagogical Invariants', () => {
  it('contains 11 age-appropriate topics for primary Grade 1 English learners', () => {
    // T02C — lower bound (T12+ will add topics; the list below must keep existing).
    expect(ENGLISH_TOPICS.length).toBeGreaterThanOrEqual(11);
    const expectedIds = [
      'eng-alphabet',
      'eng-numbers',
      'eng-colors',
      'eng-animals',
      'eng-family',
      'eng-school',
      'eng-body',
      'eng-food',
      'eng-toys',
      'eng-greetings',
      'eng-phonics-advanced',
    ];
    for (const id of expectedIds) {
      const topic = ENGLISH_TOPICS.find((t) => t.id === id);
      expect(topic).toBeDefined();
      expect(topic!.lessons.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('validates that every English question has an audio prompt and clean option pool', () => {
    for (const topic of ENGLISH_TOPICS) {
      for (const lesson of topic.lessons) {
        expect(lesson.questions.length).toBeGreaterThanOrEqual(2);
        for (const q of lesson.questions) {
          expect(q.prompt).toBeTruthy();
          expect(q.correctAnswer).toBeDefined();
          expect(q.audioPrompt).toBeTruthy();

          if (q.type === 'multiple-choice' || q.type === 'image-choice') {
            expect(Array.isArray(q.options)).toBe(true);
            expect(q.options!.length).toBeGreaterThanOrEqual(2);
            expect(q.options).toContain(q.correctAnswer);
            const unique = new Set(q.options);
            expect(unique.size).toBe(q.options!.length);
          }
        }
      }
    }
  });

  it('verifies phonetic letter associations for primary learners', () => {
    const alphabetTopic = ENGLISH_TOPICS.find((t) => t.id === 'eng-alphabet');
    expect(alphabetTopic).toBeDefined();
    const lesson1 = alphabetTopic!.lessons[0];
    const qA = lesson1.questions.find((q) => q.prompt.includes('Letter A'));
    if (qA) {
      expect(qA.correctAnswer).toContain('Apple');
    }
  });
});
