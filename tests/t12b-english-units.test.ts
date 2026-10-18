import { describe, it, expect } from 'vitest';
import { ENGLISH_TOPICS } from '../src/data/englishCurriculum';
import { COMPETITION_QUESTIONS, COMPETITION_BANK_VERSION } from '../src/data/competitionQuestions';

/**
 * T12B — English units 7–12 + competition top-up acceptance.
 *
 * Owns the task-level thresholds (§Nghiệm thu): at least 30 lessons, 300
 * questions and 250 vocabulary words across English, plus the 40 new English
 * competition items, without weakening any P36 curriculum/quality gate.
 */

const T12B_UNIT_TOPIC_IDS = [
  'eng-wild-units',
  'eng-clothes-units',
  'eng-funtime-units',
  'eng-house-units',
  'eng-party-units',
  'eng-numbers-teen-units',
];

function allEnglishLessons() {
  return ENGLISH_TOPICS.flatMap((t) => t.lessons);
}

function allEnglishQuestions() {
  return allEnglishLessons().flatMap((l) => l.questions);
}

function distinctEnglishWords(): number {
  const words = new Set<string>();
  const collect = (text: string | undefined) => {
    if (!text) return;
    for (const token of text.toLowerCase().normalize('NFC').match(/[a-z]+/g) ?? []) {
      if (token.length >= 2) words.add(token);
    }
  };
  for (const q of allEnglishQuestions()) {
    collect(q.prompt);
    collect(Array.isArray(q.correctAnswer) ? q.correctAnswer.join(' ') : q.correctAnswer);
    (q.options ?? []).forEach((o) => collect(o));
  }
  return words.size;
}

describe('T12B — English curriculum expansion (units 7–12)', () => {
  it('reaches ≥ 30 lessons and ≥ 300 questions across English', () => {
    const lessons = allEnglishLessons();
    const questions = allEnglishQuestions();
    expect(lessons.length).toBeGreaterThanOrEqual(30);
    expect(questions.length).toBeGreaterThanOrEqual(300);
  });

  it('ships ≥ 250 distinct English vocabulary words', () => {
    expect(distinctEnglishWords()).toBeGreaterThanOrEqual(250);
  });

  it('exposes all twelve T12 units as topics', () => {
    const ids = new Set(ENGLISH_TOPICS.map((t) => t.id));
    for (const id of T12B_UNIT_TOPIC_IDS) {
      expect(ids.has(id), `missing unit topic ${id}`).toBe(true);
    }
  });

  it('gives every T12 unit exactly two lessons of at least ten questions', () => {
    for (const id of T12B_UNIT_TOPIC_IDS) {
      const topic = ENGLISH_TOPICS.find((t) => t.id === id);
      expect(topic, `missing topic ${id}`).toBeDefined();
      expect(topic!.lessons.length).toBe(2);
      for (const lesson of topic!.lessons) {
        expect(lesson.questions.length, `${lesson.id} too short`).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('keeps every English question id globally unique', () => {
    const ids = allEnglishQuestions().map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps audioPrompt, hint, explanation and NFC text on every English question', () => {
    for (const q of allEnglishQuestions()) {
      expect(q.audioPrompt, `${q.id} missing audioPrompt`).toBeTruthy();
      expect(q.hint, `${q.id} missing hint`).toBeTruthy();
      expect((q.explanation ?? '').trim().length, `${q.id} explanation too short`).toBeGreaterThan(0);
      expect(q.prompt.normalize('NFC')).toBe(q.prompt);
    }
  });

  it('gives every choice question unique options that contain the answer', () => {
    const choiceTypes = new Set(['multiple-choice', 'image-choice', 'audio-choice', 'fill-blank']);
    for (const q of allEnglishQuestions()) {
      if (!choiceTypes.has(q.type)) continue;
      expect(Array.isArray(q.options), `${q.id} options missing`).toBe(true);
      expect(q.options!.length, `${q.id} needs ≥3 options`).toBeGreaterThanOrEqual(3);
      expect(new Set(q.options).size, `${q.id} duplicate options`).toBe(q.options!.length);
      expect(q.options, `${q.id} answer not in options`).toContain(q.correctAnswer);
    }
    const tf = allEnglishQuestions().filter((q) => q.type === 'true-false');
    for (const q of tf) {
      expect(new Set(q.options)).toEqual(new Set(['True', 'False']));
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it('gives every ordering question a non-repeating tile set matching its answer', () => {
    for (const q of allEnglishQuestions().filter((q) => q.type === 'ordering')) {
      expect(Array.isArray(q.orderingItems), `${q.id} missing orderingItems`).toBe(true);
      expect(new Set(q.orderingItems).size, `${q.id} duplicate tiles`).toBe(q.orderingItems!.length);
      const answer = Array.isArray(q.correctAnswer) ? q.correctAnswer : q.correctAnswer.split('|');
      expect(answer).toEqual(q.orderingItems);
    }
  });
});

describe('T12B — English competition top-up', () => {
  it('bumps the competition bank version to 6', () => {
    expect(COMPETITION_BANK_VERSION).toBe(6);
  });

  it('adds at least forty English competition items', () => {
    const english = COMPETITION_QUESTIONS.filter((q) => q.subject === 'english');
    expect(english.length).toBeGreaterThanOrEqual(160);
  });

  it('ships the 40 T12B items cq-p36-e084 … cq-p36-e123 as unique English entries', () => {
    const byId = new Map(COMPETITION_QUESTIONS.map((q) => [q.id, q]));
    const added: string[] = [];
    for (let n = 84; n <= 123; n += 1) {
      const id = `cq-p36-e${String(n).padStart(3, '0')}`;
      const item = byId.get(id);
      expect(item, `missing ${id}`).toBeDefined();
      expect(item!.subject).toBe('english');
      added.push(id);
    }
    expect(new Set(added).size).toBe(40);
  });
});
