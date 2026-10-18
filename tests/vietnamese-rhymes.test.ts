import { describe, it, expect } from 'vitest';
import { VIETNAMESE_TOPICS } from '../src/data/vietnameseCurriculum';
import { RHYME_LESSONS, RHYME_SKILLS, RHYME_TOPIC } from '../src/data/vietnamese/rhymes';
import { containsBannedWord } from '../src/data/contentSafety';

/**
 * T10B — nghiệm thu riêng cho vần nhóm 1 (spec T10 §4, nửa đầu: am … ich).
 * Kiểm: đủ danh sách vần, mỗi bài ≥ 10 câu, đáp án ∈ options, NFC,
 * không trùng id, không từ cấm.
 */

const EXPECTED_VAN = [
  'am', 'ap', 'ăm', 'ăp', 'âm', 'âp',
  'om', 'op', 'ôm', 'ôp', 'ơm', 'ơp',
  'em', 'ep', 'êm', 'êp',
  'im', 'ip', 'um', 'up',
  'an', 'at', 'ăn', 'ăt', 'ân', 'ât',
  'on', 'ot', 'ôn', 'ôt', 'ơn', 'ơt',
  'en', 'et', 'ên', 'êt',
  'in', 'it', 'un', 'ut', 'ưt',
  'ang', 'ac', 'ăng', 'ăc', 'âng', 'âc',
  'ong', 'oc', 'ông', 'ôc',
  'ung', 'uc', 'ưng', 'ưc',
  'anh', 'ach', 'ênh', 'êch', 'inh', 'ich',
];

describe('T10B — vần nhóm 1 (am … ich)', () => {
  it('gắn đủ bài và skill mới vào topic vần', () => {
    const topic = VIETNAMESE_TOPICS.find((t) => t.id === RHYME_TOPIC);
    expect(topic).toBeDefined();
    for (const lesson of RHYME_LESSONS) {
      expect(topic!.lessons.some((l) => l.id === lesson.id)).toBe(true);
    }
    for (const skill of RHYME_SKILLS) {
      expect(topic!.skills).toContain(skill);
    }
  });

  it('phủ đủ toàn bộ danh sách vần trong phạm vi T10B', () => {
    const covered = new Set<string>();
    for (const lesson of RHYME_LESSONS) {
      for (const q of lesson.questions) {
        for (const m of q.prompt.matchAll(/vần “([^”]+)”/g)) covered.add(m[1]);
      }
    }
    expect(EXPECTED_VAN.filter((v) => !covered.has(v))).toEqual([]);
  });

  it('mỗi bài có ≥ 10 câu và ≥ 3 loại câu', () => {
    for (const lesson of RHYME_LESSONS) {
      expect({ id: lesson.id, n: lesson.questions.length >= 10 }).toEqual({ id: lesson.id, n: true });
      const types = new Set(lesson.questions.map((q) => q.type));
      expect({ id: lesson.id, ok: types.size >= 3 }).toEqual({ id: lesson.id, ok: true });
    }
  });

  it('đáp án luôn nằm trong options', () => {
    for (const lesson of RHYME_LESSONS) {
      for (const q of lesson.questions) {
        if (q.type === 'multiple-choice' || q.type === 'image-choice' || q.type === 'fill-blank') {
          expect(Array.isArray(q.options)).toBe(true);
          expect(q.options).toContain(q.correctAnswer);
        }
      }
    }
  });

  it('không trùng id câu hỏi', () => {
    const ids = RHYME_LESSONS.flatMap((l) => l.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lưu mọi trường ở dạng NFC', () => {
    for (const lesson of RHYME_LESSONS) {
      for (const q of lesson.questions) {
        const fields = [
          q.prompt,
          q.audioPrompt ?? '',
          q.hint ?? '',
          q.explanation ?? '',
          ...(q.options ?? []),
        ];
        expect({ id: q.id, ok: fields.every((f) => f.normalize('NFC') === f) }).toEqual({
          id: q.id,
          ok: true,
        });
      }
    }
  });

  it('không chứa từ cấm', () => {
    for (const lesson of RHYME_LESSONS) {
      for (const q of lesson.questions) {
        const fields = [q.prompt, q.hint ?? '', q.explanation ?? '', ...(q.options ?? [])];
        expect({ id: q.id, ok: fields.every((f) => !containsBannedWord(f)) }).toEqual({
          id: q.id,
          ok: true,
        });
      }
    }
  });
});
