import { describe, it, expect } from 'vitest';
import { VIETNAMESE_TOPICS } from '../src/data/vietnameseCurriculum';
import { containsBannedWord } from '../src/data/contentSafety';

describe('Vietnamese Curriculum Quality & Deterministic Invariants', () => {
  it('contains 12 comprehensive topics covering primary Grade 1 milestones', () => {
    // T02C — lower bound (T10+ will add topics; the list below must keep existing).
    expect(VIETNAMESE_TOPICS.length).toBeGreaterThanOrEqual(12);
    const expectedIds = [
      'vn-chu-cai',
      'vn-dau-thanh',
      'vn-van-co-ban',
      'vn-ghep-am',
      'vn-chinh-ta',
      'vn-tu-va-vat',
      'vn-hoat-dong',
      'vn-xep-cau',
      'vn-doc-hieu-1',
      'vn-doc-hieu-2',
      'vn-chinh-ta-nang-cao',
      'vn-ke-chuyen-doc-hieu',
    ];
    for (const id of expectedIds) {
      const topic = VIETNAMESE_TOPICS.find((t) => t.id === id);
      expect(topic).toBeDefined();
      expect(topic!.lessons.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('validates that every Vietnamese question has valid options and unambiguous correct answers', () => {
    for (const topic of VIETNAMESE_TOPICS) {
      for (const lesson of topic.lessons) {
        expect(lesson.questions.length).toBeGreaterThanOrEqual(2);
        for (const q of lesson.questions) {
          expect(q.prompt).toBeTruthy();
          expect(q.correctAnswer).toBeDefined();

          if (q.type === 'multiple-choice' || q.type === 'image-choice') {
            expect(Array.isArray(q.options)).toBe(true);
            expect(q.options!.length).toBeGreaterThanOrEqual(2);
            expect(q.options).toContain(q.correctAnswer);
            // Verify uniqueness of options
            const unique = new Set(q.options);
            expect(unique.size).toBe(q.options!.length);
          }

          if (q.type === 'ordering') {
            expect(Array.isArray(q.options)).toBe(true);
            expect(typeof q.correctAnswer).toBe('string');
            const orderedWords = (q.correctAnswer as string).split('|').filter(Boolean);
            for (const word of orderedWords) {
              expect(q.options).toContain(word);
            }
            expect(q.orderingItems).toBeDefined();
            expect(Array.isArray(q.orderingItems)).toBe(true);
          }
        }
      }
    }
  });

  it('ensures spelling rules (c/k, g/gh) are linguistically correct', () => {
    const spellingTopic = VIETNAMESE_TOPICS.find((t) => t.id === 'vn-chinh-ta');
    expect(spellingTopic).toBeDefined();
    for (const lesson of spellingTopic!.lessons) {
      for (const q of lesson.questions) {
        // e.g. "k" goes with e, ê, i; "c" goes with a, o, ô, u, ư
        if (q.prompt.includes('kính') || q.prompt.includes('kim')) {
          expect(q.correctAnswer).toBe('k');
        }
        if (q.prompt.includes('cá') || q.prompt.includes('cam')) {
          expect(q.correctAnswer).toBe('c');
        }
      }
    }
  });

  it('checks vn-q1-4 for strict single-match invariant (no duplicate B-initial words)', () => {
    const topic = VIETNAMESE_TOPICS.find((t) => t.id === 'vn-chu-cai');
    const lesson = topic?.lessons.find((l) => l.id === 'vn-les-1');
    const q4 = lesson?.questions.find((q) => q.id === 'vn-q1-4');
    expect(q4).toBeDefined();
    const bWords = q4!.options!.filter((opt) => opt.startsWith('B'));
    expect(bWords.length).toBe(1);
    expect(bWords[0]).toBe('Búp bê 🎎');
  });

  // --- T10A: chữ cái, dấu thanh, chữ ghép, dấu câu + "nâng bài cũ" ----------

  it('T10A — gives every lesson at least 10 questions', () => {
    const thin: string[] = [];
    for (const topic of VIETNAMESE_TOPICS) {
      for (const lesson of topic.lessons) {
        if (lesson.questions.length < 10) thin.push(`${lesson.id}=${lesson.questions.length}`);
      }
    }
    expect(thin).toEqual([]);
  });

  it('T10A — exercises at least three question types in every lesson', () => {
    const thin: string[] = [];
    for (const topic of VIETNAMESE_TOPICS) {
      for (const lesson of topic.lessons) {
        const types = new Set(lesson.questions.map((q) => q.type));
        if (types.size < 3) thin.push(`${lesson.id}=${[...types].join('+')}`);
      }
    }
    expect(thin).toEqual([]);
  });

  it('T10A — never repeats a Vietnamese question id', () => {
    const ids = VIETNAMESE_TOPICS.flatMap((t) =>
      t.lessons.flatMap((l) => l.questions.map((q) => q.id))
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('T10A — stores every question field in NFC so diacritics never decompose', () => {
    const bad: string[] = [];
    for (const topic of VIETNAMESE_TOPICS) {
      for (const lesson of topic.lessons) {
        for (const q of lesson.questions) {
          const fields = [
            q.prompt,
            q.audioPrompt ?? '',
            q.hint ?? '',
            q.explanation ?? '',
            ...(q.options ?? []),
          ];
          if (fields.some((f) => f.normalize('NFC') !== f)) bad.push(q.id);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('T10A — keeps banned words out of every Vietnamese question', () => {
    const bad: string[] = [];
    for (const topic of VIETNAMESE_TOPICS) {
      for (const lesson of topic.lessons) {
        for (const q of lesson.questions) {
          const fields = [q.prompt, q.hint ?? '', q.explanation ?? '', ...(q.options ?? [])];
          if (fields.some((f) => containsBannedWord(f))) bad.push(q.id);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
