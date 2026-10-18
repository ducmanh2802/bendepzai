import { describe, it, expect } from 'vitest';
import { COMPETITION_QUESTIONS, COMPETITION_BANK_VERSION } from '../src/data/competitionQuestions';
import { P36_QUESTIONS } from '../src/data/competitionBankP36';
import { COMPETITION_SKILLS } from '../src/data/competitionTaxonomy';
import { EXAM_BLUEPRINTS } from '../src/data/competitionBlueprints';
import { CompetitionEngine } from '../src/services/competitionEngine';
import {
  validateP36Item,
  validateP36Bank,
  findP36Duplicates,
  p36Distribution,
  buildP36CoverageMatrix,
  p36Signature,
} from '../src/services/competitionQuality';
import { P36_BANK_POLICY, CONTENT_POLICY } from '../src/config/policy';

/**
 * P36 — COMPETITION BANK EXPANSION & QUALITY ENGINE certification.
 *
 * Hard gates (§25): depth, zero validator gaps, zero grading mismatches,
 * zero semantic duplicates, balanced positions, real-engine grading for
 * every item, perturbation resistance, and full blueprint assembly.
 */
describe('P36 — bank depth & quality certification', () => {
  it(`holds at least ${P36_BANK_POLICY.MIN_BANK_ITEMS} validated canonical items (bank v4)`, () => {
    expect(COMPETITION_BANK_VERSION).toBeGreaterThanOrEqual(4);
    expect(COMPETITION_QUESTIONS.length).toBeGreaterThanOrEqual(P36_BANK_POLICY.MIN_BANK_ITEMS);
    expect(P36_QUESTIONS.length).toBeGreaterThanOrEqual(
      P36_BANK_POLICY.MIN_BANK_ITEMS - 132
    );
    const ids = COMPETITION_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reports ZERO P36 per-item validator gaps across the whole bank', () => {
    const gaps = COMPETITION_QUESTIONS.flatMap((q) => validateP36Item(q));
    if (gaps.length > 0) {
      throw new Error(
        `Found ${gaps.length} P36 item gaps:\n` +
          gaps.map((g) => `  [${g.itemId}] ${g.code}: ${g.message}`).join('\n')
      );
    }
    expect(gaps).toEqual([]);
  });

  it('reports ZERO P36 bank-level validator gaps', () => {
    const gaps = validateP36Bank(COMPETITION_QUESTIONS);
    if (gaps.length > 0) {
      throw new Error(
        `Found ${gaps.length} P36 bank gaps:\n` +
          gaps.map((g) => `  ${g.code}: ${g.message}`).join('\n')
      );
    }
    expect(gaps).toEqual([]);
  });

  it('has zero exact or near semantic duplicates (configurable threshold)', () => {
    expect(CONTENT_POLICY.DUPLICATE_PROMPT_SIMILARITY).toBeGreaterThan(0);
    const { exact, near } = findP36Duplicates(COMPETITION_QUESTIONS);
    expect({ exact, near }).toEqual({ exact: [], near: [] });
    const sigs = COMPETITION_QUESTIONS.map(p36Signature);
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it('grades 100% of canonical answers CORRECT through the real CompetitionEngine', () => {
    const failures: string[] = [];
    for (const q of COMPETITION_QUESTIONS) {
      if (!CompetitionEngine.gradeAnswer(q, q.correctAnswer)) {
        failures.push(`${q.id} rejected its own canonical answer`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('rejects representative wrong answers for every item (no permissive keys)', () => {
    const failures: string[] = [];
    for (const q of COMPETITION_QUESTIONS) {
      if (q.questionType === 'true-false') {
        const flipped = q.correctAnswer === 'Đúng' ? 'Sai' : 'Đúng';
        if (CompetitionEngine.gradeAnswer(q, flipped)) {
          failures.push(`${q.id} accepted the wrong verdict`);
        }
        continue;
      }
      const wrong = q.correctAnswer + 'zzz-khong-dung';
      if (CompetitionEngine.gradeAnswer(q, wrong)) {
        failures.push(`${q.id} accepted a wrong answer`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('resists controlled perturbations on structured + numeric items (§15)', () => {
    const failures: string[] = [];
    for (const q of COMPETITION_QUESTIONS) {
      if (q.questionType === 'matching' && q.matchingPairs && q.matchingPairs.length >= 2) {
        // Swap two right-hand sides: must no longer grade as correct.
        const swapped = q.matchingPairs.map((p) => ({ ...p }));
        const tmp = swapped[0].right;
        swapped[0].right = swapped[1].right;
        swapped[1].right = tmp;
        const perturbed = swapped.map((p) => `${p.left}=${p.right}`).join('|');
        if (perturbed !== q.correctAnswer && CompetitionEngine.gradeAnswer(q, perturbed)) {
          failures.push(`${q.id} accepted a swapped matching key`);
        }
      }
      if (q.questionType === 'ordering') {
        const parts = q.correctAnswer.split('|');
        if (parts.length >= 2) {
          const swapped = [parts[1], parts[0], ...parts.slice(2)].join('|');
          if (swapped !== q.correctAnswer && CompetitionEngine.gradeAnswer(q, swapped)) {
            failures.push(`${q.id} accepted a swapped ordering key`);
          }
        }
      }
      if (
        (q.questionType === 'multiple-choice' || q.questionType === 'fill-blank') &&
        /^-?\d+$/.test(q.correctAnswer.trim())
      ) {
        const off = String(Number(q.correctAnswer.trim()) + 1);
        if (!q.options.includes(off) && CompetitionEngine.gradeAnswer(q, off)) {
          failures.push(`${q.id} accepted an off-by-one numeric answer`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('keeps correct-answer positions balanced and verdicts fair (§5)', () => {
    const dist = p36Distribution(COMPETITION_QUESTIONS);
    expect(dist.maxPositionShare).toBeLessThanOrEqual(P36_BANK_POLICY.MAX_ANSWER_POSITION_SHARE);
    const tfTotal = dist.trueFalseShare.dung + dist.trueFalseShare.sai;
    const share = dist.trueFalseShare.dung / tfTotal;
    expect(share).toBeGreaterThanOrEqual(P36_BANK_POLICY.TF_MIN_SHARE);
    expect(share).toBeLessThanOrEqual(P36_BANK_POLICY.TF_MAX_SHARE);
    for (const subject of ['tieng-viet', 'toan', 'english']) {
      expect(dist.bySubject[subject] ?? 0).toBeGreaterThanOrEqual(P36_BANK_POLICY.MIN_ITEMS_PER_SUBJECT);
    }
    for (const diff of ['EASY', 'MEDIUM', 'HARD', 'CHALLENGE']) {
      expect(dist.byDifficulty[diff] ?? 0).toBeGreaterThanOrEqual(P36_BANK_POLICY.MIN_ITEMS_PER_DIFFICULTY);
    }
  });

  it('covers every taxonomy skill with depth and every type meaningfully', () => {
    const dist = p36Distribution(COMPETITION_QUESTIONS);
    for (const skill of COMPETITION_SKILLS) {
      expect(dist.bySkill[skill.skillId] ?? 0).toBeGreaterThanOrEqual(P36_BANK_POLICY.MIN_ITEMS_PER_SKILL);
    }
    for (const type of ['multiple-choice', 'true-false', 'fill-blank', 'matching', 'ordering', 'drag-drop', 'classify']) {
      expect(dist.byType[type] ?? 0).toBeGreaterThanOrEqual(P36_BANK_POLICY.MIN_ITEMS_PER_TYPE);
    }
    const matrix = buildP36CoverageMatrix(COMPETITION_QUESTIONS);
    expect(matrix.length).toBe(COMPETITION_SKILLS.length);
    for (const cell of matrix) {
      expect(cell.total).toBeGreaterThanOrEqual(P36_BANK_POLICY.MIN_ITEMS_PER_SKILL);
    }
  });

  it('assembles every blueprint at full length with gradeable keys', () => {
    const shortfalls: string[] = [];
    const ungradeable: string[] = [];
    for (const blueprint of EXAM_BLUEPRINTS) {
      const { questions, shortfall } = CompetitionEngine.assembleExam(blueprint, 20240601);
      if (shortfall > 0 || questions.length !== blueprint.questionCount) {
        shortfalls.push(`${blueprint.id}: ${questions.length}/${blueprint.questionCount}`);
      }
      for (const q of questions) {
        if (!CompetitionEngine.gradeAnswer(q, q.correctAnswer)) ungradeable.push(`${blueprint.id}/${q.id}`);
      }
    }
    expect(shortfalls).toEqual([]);
    expect(ungradeable).toEqual([]);
  });

  it('certifies Learning OS + Praise integration inputs for new items', () => {
    // Every P36 item must map to a real taxonomy skill so competition answers
    // produce valid learning evidence through the Learning Engine (§19).
    for (const q of P36_QUESTIONS) {
      const skill = COMPETITION_SKILLS.find((s) => s.skillId === q.skillId);
      expect(skill).toBeDefined();
      expect(skill!.subject).toBe(q.subject);
      expect(q.explanation.trim().length).toBeGreaterThanOrEqual(P36_BANK_POLICY.MIN_EXPLANATION_CHARS);
    }
    // Scoring stays deterministic on a P36-only paper: correct vs wrong.
    const sample = P36_QUESTIONS.slice(0, 8);
    const blueprint = EXAM_BLUEPRINTS[0];
    const responses = sample.map((q, i) => ({
      questionId: q.id,
      userAnswer: i % 2 === 0 ? q.correctAnswer : 'WRONG-ANSWER-XYZ',
      isCorrect: i % 2 === 0,
      timeSpentSeconds: 15,
    }));
    const result = CompetitionEngine.scoreSession(blueprint, sample, responses, 120, []);
    expect(result.correctCount).toBe(4);
    expect(result.errorAnalysis.length).toBe(4);
    expect(result.readinessSnapshot).toBeDefined();
  });
});
