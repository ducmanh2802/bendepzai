import { describe, it, expect } from 'vitest';
import {
  runContentValidation,
  buildCurriculumAnswerPositionReport,
} from '../src/services/contentValidator';
import { getAllQuestions, getTopicsBySubject } from '../src/data/curriculum';
import {
  MATH_TOPICS,
  MATH_TOPICS_RAW,
} from '../src/data/mathCurriculum';
import { VIETNAMESE_TOPICS_RAW } from '../src/data/vietnameseCurriculum';
import { ENGLISH_TOPICS_RAW } from '../src/data/englishCurriculum';
import { balanceTopics, balanceOptionOrder, isBalanceable } from '../src/data/optionBalance';
import { CURRICULUM_POLICY } from '../src/config/policy';
import type { Question, SubjectType } from '../src/types';

const CHOICE_TYPES = ['multiple-choice', 'image-choice', 'audio-choice', 'fill-blank'];

const questions = getAllQuestions();
const report = runContentValidation();
const curriculumIssues = report.issues.filter((i) => i.scope.startsWith('curriculum:'));

describe('P41 — curriculum quality gate (§4, §5, §6)', () => {
  it('reports ZERO curriculum errors (incl. answer-position bias)', () => {
    const errors = curriculumIssues.filter((i) => i.severity === 'ERROR');
    if (errors.length > 0) {
      throw new Error(
        `Found ${errors.length} curriculum errors:\n` +
          errors.map((e) => `  [${e.scope}] ${e.code}: ${e.message}`).join('\n')
      );
    }
    expect(errors).toEqual([]);
  });

  it('has no curriculum warnings for depth, difficulty, hint leaks or near-duplicates', () => {
    expect(curriculumIssues.filter((i) => i.severity === 'WARNING')).toEqual([]);
  });

  it('distributes correct answers across option positions in every subject', () => {
    const positions = buildCurriculumAnswerPositionReport();
    expect(positions.overall.total).toBeGreaterThan(0);
    expect(positions.overall.maxShare).toBeLessThanOrEqual(
      CURRICULUM_POLICY.MAX_ANSWER_POSITION_SHARE
    );
    for (const subject of ['tieng-viet', 'toan', 'english'] as SubjectType[]) {
      const stat = positions.bySubject[subject];
      expect(stat.total).toBeGreaterThan(0);
      expect(stat.maxShare).toBeLessThanOrEqual(CURRICULUM_POLICY.MAX_ANSWER_POSITION_SHARE);
    }
  });

  it('gives every active lesson-bank skill at least the minimum number of questions', () => {
    const activeSkills = new Set<string>();
    for (const subject of ['tieng-viet', 'toan', 'english'] as SubjectType[]) {
      for (const topic of getTopicsBySubject(subject)) {
        for (const skillId of topic.skills) activeSkills.add(skillId);
      }
    }
    expect(activeSkills.size).toBeGreaterThan(0);

    const counts = new Map<string, number>();
    for (const q of questions) counts.set(q.skillId, (counts.get(q.skillId) ?? 0) + 1);

    const thin: string[] = [];
    for (const skillId of activeSkills) {
      const count = counts.get(skillId) ?? 0;
      if (count < CURRICULUM_POLICY.MIN_QUESTIONS_PER_SKILL) thin.push(`${skillId}=${count}`);
    }
    expect(thin).toEqual([]);
  });

  it('offers a difficulty-3 challenge item in every subject', () => {
    for (const subject of ['tieng-viet', 'toan', 'english'] as SubjectType[]) {
      const hasChallenge = questions.some((q) => q.subject === subject && q.difficulty === 3);
      expect({ subject, hasChallenge }).toEqual({ subject, hasChallenge: true });
    }
  });

  it('never has two identical curriculum question ids or duplicate options', () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of questions) {
      if (!q.options) continue;
      expect({ id: q.id, unique: new Set(q.options).size === q.options.length }).toEqual({
        id: q.id,
        unique: true,
      });
    }
  });

  it('has no ambiguous numeric "between" question with more than one valid answer', () => {
    const offenders: string[] = [];
    for (const q of questions.filter((x) => x.subject === 'toan')) {
      const between = q.prompt.match(/(\d+)\s*<\s*\.\.\.\s*<\s*(\d+)/);
      if (!between || !q.options) continue;
      const [lo, hi] = [Number(between[1]), Number(between[2])];
      const valid = q.options.filter((o) => /^\d+$/.test(o.trim()) && Number(o) > lo && Number(o) < hi);
      if (valid.length !== 1) offenders.push(`${q.id}: ${valid.join(',') || 'none'}`);
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the specifically-repaired questions unambiguous', () => {
    const byId = new Map(questions.map((q) => [q.id, q]));
    expect(byId.get('math-q3-5')?.correctAnswer).toBe('8');
    expect(byId.get('math-q4-5')?.correctAnswer).toBe('5 + 5');
    expect(byId.get('math-q5-4')?.correctAnswer).toBe('9 − 4');
    expect(new Set(byId.get('vn-q7-4')?.options ?? []).size).toBe(
      byId.get('vn-q7-4')?.options?.length
    );
  });

  it('keeps every English curriculum question with an audio prompt', () => {
    for (const q of questions.filter((x) => x.subject === 'english')) {
      expect({ id: q.id, audio: !!q.audioPrompt?.trim() }).toEqual({ id: q.id, audio: true });
    }
  });
});

describe('P41 — deterministic option balancing (§5)', () => {
  const balanceable = (q: Question): boolean =>
    !!q.options && CHOICE_TYPES.includes(q.type) && typeof q.correctAnswer === 'string';

  it('is deterministic — rebalancing raw topics reproduces the exported topics', () => {
    expect(balanceTopics(MATH_TOPICS_RAW)).toEqual(MATH_TOPICS);
    const again = balanceTopics(VIETNAMESE_TOPICS_RAW);
    const once = balanceTopics(VIETNAMESE_TOPICS_RAW);
    expect(JSON.stringify(again)).toBe(JSON.stringify(once));
    expect(JSON.stringify(balanceTopics(ENGLISH_TOPICS_RAW))).toBe(
      JSON.stringify(balanceTopics(ENGLISH_TOPICS_RAW))
    );
  });

  it('only rotates options — the option SET and correct answer are preserved', () => {
    for (const q of questions) {
      if (!isBalanceable(q)) continue;
      expect(Array.isArray(q.correctAnswer)).toBe(false);
      expect(q.options).toContain(q.correctAnswer as string);
    }
  });

  it('leaves non-choice and array-answer questions untouched', () => {
    const raw = VIETNAMESE_TOPICS_RAW.flatMap((t) => t.lessons.flatMap((l) => l.questions));
    const balanced = balanceTopics(VIETNAMESE_TOPICS_RAW).flatMap((t) =>
      t.lessons.flatMap((l) => l.questions)
    );
    for (const q of raw) {
      if (balanceable(q)) continue;
      const after = balanced.find((b) => b.id === q.id);
      expect(after?.options).toEqual(q.options);
    }
  });

  it('balanceOptionOrder is a pure rotation that lands the answer on the target index', () => {
    const sample: Question = {
      id: 'x',
      subject: 'toan',
      topicId: 't',
      skillId: 's',
      difficulty: 1,
      type: 'multiple-choice',
      prompt: 'p',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'C',
    };
    expect(isBalanceable(sample)).toBe(true);
    for (let target = 0; target < 4; target += 1) {
      const rotated = balanceOptionOrder(sample, target);
      expect(rotated.options!.indexOf('C')).toBe(target);
      expect(new Set(rotated.options)).toEqual(new Set(sample.options));
    }
    // Non-choice question is returned unchanged (same reference).
    const notChoice: Question = { ...sample, type: 'ordering', options: ['a', 'b'] };
    expect(balanceOptionOrder(notChoice, 1)).toBe(notChoice);
  });
});
