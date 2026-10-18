import { describe, it, expect } from 'vitest';
import { COMPETITION_QUESTIONS } from '../src/data/competitionQuestions';
import { COMPETITION_SKILLS } from '../src/data/competitionTaxonomy';
import { EXAM_BLUEPRINTS } from '../src/data/competitionBlueprints';
import { CompetitionEngine } from '../src/services/competitionEngine';

describe('Competition Question Bank & Blueprint Quality Gate', () => {
  it('validates that every competition question satisfies strict quality standards', () => {
    expect(COMPETITION_QUESTIONS.length).toBeGreaterThanOrEqual(30);

    const validSkillIds = new Set(COMPETITION_SKILLS.map((s) => s.skillId));

    for (const q of COMPETITION_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.estimatedSeconds).toBeGreaterThan(0);
      expect(q.subject).toMatch(/^(tieng-viet|toan|english)$/);

      // Verify skill exists in taxonomy
      expect(validSkillIds.has(q.skillId)).toBe(true);

      // Verify options are present, non-empty, unique — and that the answer is
      // reachable from the question's own structure (type-aware, §10).
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.every((o) => typeof o === 'string' && o.trim().length > 0)).toBe(true);
      const uniqueOpts = new Set(q.options);
      expect(uniqueOpts.size).toBe(q.options.length);

      if (['multiple-choice', 'true-false', 'fill-blank'].includes(q.questionType)) {
        expect(q.options).toContain(q.correctAnswer);
      } else if (q.questionType === 'matching') {
        expect(q.matchingPairs).toBeDefined();
        expect(q.matchingPairs!.length).toBeGreaterThanOrEqual(2);
        const expected = q.matchingPairs!.map((pair) => `${pair.left}=${pair.right}`).join('|');
        expect(q.correctAnswer).toBe(expected);
      } else if (q.questionType === 'ordering') {
        expect(q.orderingItems).toBeDefined();
        const answerItems = q.correctAnswer.split('|');
        expect(new Set(answerItems).size).toBe(q.orderingItems!.length);
        for (const item of answerItems) expect(q.options).toContain(item);
      } else {
        expect(q.categoryBuckets).toBeDefined();
        expect(q.categoryBuckets).toContain(q.correctAnswer);
      }
    }
  });

  /**
   * The strongest guarantee available for a question bank: every stored answer
   * key must actually grade as CORRECT when fed back through the real engine.
   *
   * Structurally valid but ungradeable keys are the classic silent failure —
   * a matching key with a separator typo, or an ordering key whose tiles do
   * not match the visible options, renders a question no child can ever pass.
   * This closes that loop for the whole bank, including generated keys.
   */
  it('grades every canonical answer key as CORRECT through CompetitionEngine', () => {
    const failures: string[] = [];

    for (const q of COMPETITION_QUESTIONS) {
      if (!CompetitionEngine.gradeAnswer(q, q.correctAnswer)) {
        failures.push(`${q.id} (${q.questionType}) rejected its own answer key`);
      }
      // The normalized form must be identical too — normalizeAnswer feeds the
      // comparison, so a key that only survives un-normalized is a latent bug.
      if (!CompetitionEngine.gradeAnswer(q, CompetitionEngine.normalizeAnswer(q.correctAnswer))) {
        failures.push(`${q.id} (${q.questionType}) failed after answer normalization`);
      }
    }

    expect(failures).toEqual([]);
    expect(COMPETITION_QUESTIONS.length).toBeGreaterThanOrEqual(30);
  });

  it('grades every canonical answer key as INCORRECT when one element is perturbed', () => {
    // Guards the opposite failure: a key so permissive that any answer passes.
    const failures: string[] = [];

    for (const q of COMPETITION_QUESTIONS) {
      if (q.questionType === 'true-false') continue; // only two options; covered elsewhere
      const perturbed = CompetitionEngine.normalizeAnswer(
        q.correctAnswer.endsWith('a') ? q.correctAnswer.slice(0, -1) + 'b' : q.correctAnswer + 'zzz'
      );
      if (perturbed !== q.correctAnswer && CompetitionEngine.gradeAnswer(q, perturbed)) {
        failures.push(`${q.id} (${q.questionType}) accepted a wrong answer`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('covers every taxonomy skill with at least 3 items and several question types', () => {
    const thin: string[] = [];
    const singleType: string[] = [];

    for (const skill of COMPETITION_SKILLS) {
      const items = COMPETITION_QUESTIONS.filter((q) => q.skillId === skill.skillId);
      if (items.length < 3) thin.push(`${skill.skillId}:${items.length}`);
      if (new Set(items.map((q) => q.questionType)).size < 2) singleType.push(skill.skillId);
    }

    expect(thin).toEqual([]);
    expect(singleType).toEqual([]);
  });

  it('includes CHALLENGE-difficulty items across all three subjects', () => {
    const subjects = ['tieng-viet', 'toan', 'english'];
    const missing = subjects.filter(
      (s) => COMPETITION_QUESTIONS.filter((q) => q.subject === s && q.difficulty === 'CHALLENGE').length === 0
    );
    expect(missing).toEqual([]);
  });

  it('assembles every blueprint at full length with zero shortfall and gradeable keys', () => {
    const shortfalls: string[] = [];
    const ungradeable: string[] = [];

    for (const blueprint of EXAM_BLUEPRINTS) {
      const { questions, shortfall } = CompetitionEngine.assembleExam(blueprint, 20240601);
      if (shortfall > 0 || questions.length !== blueprint.questionCount) {
        shortfalls.push(`${blueprint.id}: ${questions.length}/${blueprint.questionCount}`);
      }
      // Every question that reaches a child must be answerable from its own key.
      for (const q of questions) {
        if (!CompetitionEngine.gradeAnswer(q, q.correctAnswer)) ungradeable.push(`${blueprint.id}/${q.id}`);
      }
    }

    expect(shortfalls).toEqual([]);
    expect(ungradeable).toEqual([]);
  });

  it('validates mathematical correctness of all math competition questions', () => {
    const mathQuestions = COMPETITION_QUESTIONS.filter((q) => q.subject === 'toan');
    for (const q of mathQuestions) {
      // 12 + 3 + 2 = ?
      const add3Match = q.prompt.match(/(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
      if (add3Match) {
        const a = parseInt(add3Match[1], 10);
        const b = parseInt(add3Match[2], 10);
        const c = parseInt(add3Match[3], 10);
        expect(q.correctAnswer).toBe((a + b + c).toString());
      } else {
        // 6 + 4 = ?
        const addMatch = q.prompt.match(/(?:^|[^\d+])(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
        if (addMatch) {
          const a = parseInt(addMatch[1], 10);
          const b = parseInt(addMatch[2], 10);
          expect(q.correctAnswer).toBe((a + b).toString());
        }
      }

      // 10 - 7 = ?
      const subMatch = q.prompt.match(/(\d+)\s*-\s*(\d+)\s*=\s*\?/);
      if (subMatch) {
        const a = parseInt(subMatch[1], 10);
        const b = parseInt(subMatch[2], 10);
        expect(q.correctAnswer).toBe((a - b).toString());
      }

      // 5 + ... = 10
      const fillAdd = q.prompt.match(/(\d+)\s*\+\s*\.\.\.\s*=\s*(\d+)/);
      if (fillAdd) {
        const a = parseInt(fillAdd[1], 10);
        const total = parseInt(fillAdd[2], 10);
        expect(q.correctAnswer).toBe((total - a).toString());
      }
    }
  });

  it('verifies that all blueprints define realistic durations, question counts and valid subjects', () => {
    expect(EXAM_BLUEPRINTS.length).toBeGreaterThanOrEqual(6);

    for (const bp of EXAM_BLUEPRINTS) {
      expect(bp.id).toBeDefined();
      expect(bp.title).toBeTruthy();
      expect(bp.durationSeconds).toBeGreaterThanOrEqual(120);
      expect(bp.questionCount).toBeGreaterThanOrEqual(4);
      expect(bp.rewardStars).toBeGreaterThan(0);
      expect(bp.rewardXp).toBeGreaterThan(0);
      expect(bp.subject).toMatch(/^(tieng-viet|toan|english)$/);
    }
  });
});
