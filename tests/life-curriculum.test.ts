import { describe, it, expect } from 'vitest';
import { LIFE_TOPICS } from '../src/data/lifeCurriculum';
import { getAllQuestions } from '../src/data/curriculum';
import { containsBannedWord } from '../src/data/contentSafety';

const EXPECTED_TOPIC_IDS = [
  'life-cam-xuc',
  'life-an-toan',
  'life-gia-dinh',
  'life-ngoi-nha',
  'life-truong-hoc',
  'life-cong-dong',
  'life-thuc-vat',
  'life-dong-vat',
  'life-co-the',
  'life-ve-sinh',
  'life-thoi-tiet',
  'life-an-toan-nha',
  'life-le-phep',
  'life-khoa-hoc',
];

describe('T14B — Em & Cuoc song curriculum volume', () => {
  it('has at least 12 topics, 24 lessons and 240 questions', () => {
    expect(LIFE_TOPICS.length).toBeGreaterThanOrEqual(12);
    for (const id of EXPECTED_TOPIC_IDS) {
      expect(LIFE_TOPICS.some((t) => t.id === id)).toBe(true);
    }
    const lessons = LIFE_TOPICS.flatMap((t) => t.lessons);
    expect(lessons.length).toBeGreaterThanOrEqual(24);
    const questions = lessons.flatMap((l) => l.questions);
    expect(questions.length).toBeGreaterThanOrEqual(240);
  });

  it('gives every life lesson at least 10 questions', () => {
    for (const topic of LIFE_TOPICS) {
      expect(topic.lessons.length).toBeGreaterThanOrEqual(1);
      for (const lesson of topic.lessons) {
        expect(
          { lesson: lesson.id, count: lesson.questions.length },
        ).toEqual({ lesson: lesson.id, count: expect.any(Number) });
        expect(lesson.questions.length).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('keeps every life skill supplied (new T14B skills have 10 questions each)', () => {
    const counts = new Map<string, number>();
    for (const topic of LIFE_TOPICS) {
      for (const lesson of topic.lessons) {
        for (const q of lesson.questions) {
          counts.set(q.skillId, (counts.get(q.skillId) ?? 0) + 1);
        }
      }
    }
    const declared = new Set(LIFE_TOPICS.flatMap((t) => t.skills));
    expect(declared.size).toBeGreaterThanOrEqual(12);
    // Inherited T14A sample lessons mix two skills inside one lesson, so the
    // floor for old skills is the curriculum policy minimum (2).
    const newSkills = [
      'life_community_jobs', 'life_community_services',
      'life_plant_parts', 'life_plant_types',
      'life_animal_homes', 'life_animal_useful',
      'life_body_parts', 'life_body_senses',
      'life_hygiene', 'life_healthy_food',
      'life_weather_daynight', 'life_seasons',
      'life_home_danger', 'life_stranger_phone',
      'life_politeness', 'life_honesty_share',
      'life_science_sinkfloat', 'life_science_living',
    ];
    for (const skillId of declared) {
      expect(skillId.startsWith('life_')).toBe(true);
      expect(counts.get(skillId) ?? 0).toBeGreaterThanOrEqual(2);
    }
    for (const skillId of newSkills) {
      expect(declared.has(skillId)).toBe(true);
      expect(counts.get(skillId)).toBe(10);
    }
  });
});

describe('T14B — Em & Cuoc song curriculum schema', () => {
  const lifeQuestions = getAllQuestions().filter((q) => q.subject === 'cuoc-song');

  it('uses the cuoc-song subject and life- id prefix everywhere', () => {
    expect(lifeQuestions.length).toBeGreaterThanOrEqual(240);
    for (const q of lifeQuestions) {
      expect(q.id.startsWith('life-')).toBe(true);
      expect(q.topicId.startsWith('life-')).toBe(true);
      expect(q.skillId.startsWith('life_')).toBe(true);
      expect([1, 2, 3]).toContain(q.difficulty);
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.explanation?.trim().length).toBeGreaterThan(0);
      expect(q.hint?.trim().length).toBeGreaterThan(0);
    }
  });

  it('never reuses a question id across the whole curriculum', () => {
    const ids = getAllQuestions().map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps answers inside the options with no duplicate options', () => {
    for (const q of lifeQuestions) {
      if (
        q.type === 'multiple-choice' ||
        q.type === 'image-choice' ||
        q.type === 'true-false' ||
        q.type === 'fill-blank'
      ) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options!.length).toBeGreaterThanOrEqual(2);
        expect(q.options).toContain(q.correctAnswer);
        expect(new Set(q.options).size).toBe(q.options!.length);
      }
      if (q.type === 'ordering') {
        const ordered = (q.correctAnswer as string).split('|').filter(Boolean);
        expect(ordered.length).toBe(q.orderingItems!.length);
        for (const word of ordered) expect(q.options).toContain(word);
      }
      if (q.type === 'matching') {
        expect(q.matchingPairs!.length).toBeGreaterThanOrEqual(2);
        for (const pair of q.matchingPairs!) expect(q.options).toContain(pair.right);
      }
    }
  });

  it('has no banned words and stays NFC-normalised', () => {
    for (const q of lifeQuestions) {
      for (const text of [q.prompt, q.explanation ?? '', q.hint ?? '', ...(q.options ?? [])]) {
        expect(containsBannedWord(text)).toBe(false);
        expect(text.normalize('NFC')).toBe(text);
      }
    }
  });

  it('covers every required question kind (true-false, ordering, matching)', () => {
    const types = new Set(lifeQuestions.map((q) => q.type));
    for (const t of ['multiple-choice', 'image-choice', 'true-false', 'fill-blank', 'ordering', 'matching']) {
      expect(types.has(t as never)).toBe(true);
    }
  });

  it('offers difficulty-3 challenge items', () => {
    expect(lifeQuestions.some((q) => q.difficulty === 3)).toBe(true);
  });
});
