import { describe, it, expect } from 'vitest';
import { MATH_TOPICS } from '../src/data/mathCurriculum';
import { VIETNAMESE_TOPICS } from '../src/data/vietnameseCurriculum';
import { ENGLISH_TOPICS } from '../src/data/englishCurriculum';
import { getAllQuestions } from '../src/data/curriculum';

describe('Curriculum Deterministic Correctness & Invariants', () => {
  it('verifies that every question in curriculum has a valid non-empty prompt and correctAnswer', () => {
    const allQuestions = getAllQuestions();
    expect(allQuestions.length).toBeGreaterThanOrEqual(40);

    for (const q of allQuestions) {
      expect(q.id).toBeDefined();
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.correctAnswer).toBeDefined();
      expect(q.subject).toMatch(/^(tieng-viet|toan|english|cuoc-song)$/);

      if (q.type === 'multiple-choice' || q.type === 'image-choice' || q.type === 'audio-choice' || q.type === 'fill-blank') {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options!.length).toBeGreaterThanOrEqual(2);
        // Correct answer MUST be in options!
        expect(q.options).toContain(q.correctAnswer);
        // No duplicate options allowed!
        const uniqueOptions = new Set(q.options);
        expect(uniqueOptions.size).toBe(q.options!.length);
      }

      if (q.type === 'ordering') {
        expect(Array.isArray(q.options)).toBe(true);
        expect(typeof q.correctAnswer).toBe('string');
        // All ordered words must be present in options
        const orderedWords = (q.correctAnswer as string).split('|').filter(Boolean);
        for (const word of orderedWords) {
          expect(q.options).toContain(word);
        }
        expect(q.orderingItems).toBeDefined();
        expect(Array.isArray(q.orderingItems)).toBe(true);
      }
    }
  });

  it('validates mathematical correctness of addition and subtraction questions', () => {
    for (const topic of MATH_TOPICS) {
      for (const lesson of topic.lessons) {
        for (const q of lesson.questions) {
          // Check addition patterns like "3 + 2 = ?"
          const addMatch = q.prompt.match(/(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
          if (addMatch) {
            const a = parseInt(addMatch[1], 10);
            const b = parseInt(addMatch[2], 10);
            const expected = (a + b).toString();
            expect(q.correctAnswer).toBe(expected);
          }

          // Check fill-blank addition patterns like "7 + ... = 10"
          const fillAddMatch = q.prompt.match(/(\d+)\s*\+\s*\.\.\.\s*=\s*(\d+)/);
          if (fillAddMatch) {
            const a = parseInt(fillAddMatch[1], 10);
            const total = parseInt(fillAddMatch[2], 10);
            const expected = (total - a).toString();
            expect(q.correctAnswer).toBe(expected);
          }

          // Check subtraction patterns like "6 - 2 = ?"
          const subMatch = q.prompt.match(/(\d+)\s*-\s*(\d+)\s*=\s*\?/);
          if (subMatch) {
            const a = parseInt(subMatch[1], 10);
            const b = parseInt(subMatch[2], 10);
            const expected = (a - b).toString();
            expect(q.correctAnswer).toBe(expected);
          }

          // Check fill-blank subtraction patterns like "10 - 4 = ..."
          const fillSubMatch = q.prompt.match(/(\d+)\s*-\s*(\d+)\s*=\s*\.\.\./);
          if (fillSubMatch) {
            const a = parseInt(fillSubMatch[1], 10);
            const b = parseInt(fillSubMatch[2], 10);
            const expected = (a - b).toString();
            expect(q.correctAnswer).toBe(expected);
          }

          // Check comparison questions like "8 ... 5"
          const compMatch = q.prompt.match(/(\d+)\s*\.\.\.\s*(\d+)/);
          if (compMatch) {
            const a = parseInt(compMatch[1], 10);
            const b = parseInt(compMatch[2], 10);
            const expected = a > b ? '>' : a < b ? '<' : '=';
            expect(q.correctAnswer).toBe(expected);
          }
        }
      }
    }
  });

  it('validates that Vietnamese questions have clear single unambiguous answers', () => {
    for (const topic of VIETNAMESE_TOPICS) {
      for (const lesson of topic.lessons) {
        for (const q of lesson.questions) {
          if (q.id === 'vn-q1-4') {
            // Must have only one word starting with B
            const bWords = q.options!.filter((opt) => opt.startsWith('B'));
            expect(bWords.length).toBe(1);
            expect(bWords[0]).toContain('Búp bê');
          }
        }
      }
    }
  });

  it('verifies that English questions map cleanly to valid phonics and words', () => {
    for (const topic of ENGLISH_TOPICS) {
      for (const lesson of topic.lessons) {
        for (const q of lesson.questions) {
          expect(q.audioPrompt).toBeDefined();
          expect(q.audioPrompt!.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
