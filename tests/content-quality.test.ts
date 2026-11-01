import { describe, it, expect } from 'vitest';
import {
  runContentValidation,
  buildCoverageReport,
  semanticSimilarity,
  normalizeForDuplicateCheck,
} from '../src/services/contentValidator';
import { COMPETITION_QUESTIONS, COMPETITION_BANK_VERSION } from '../src/data/competitionQuestions';
import { COMPETITION_SKILLS } from '../src/data/competitionTaxonomy';
import { EXAM_BLUEPRINTS } from '../src/data/competitionBlueprints';
import { READING_QUESTIONS, READING_SKILLS } from '../src/data/readingContent';
import { CONTENT_POLICY } from '../src/config/policy';

describe('P29 — content quality gate (§15)', () => {
  const report = runContentValidation();

  it('reports ZERO content errors across every bank', () => {
    const errors = report.issues.filter((i) => i.severity === 'ERROR');
    if (errors.length > 0) {
      // Surface the exact offenders so the failure is actionable, not vague.
      throw new Error(
        `Found ${errors.length} content errors:\n` +
          errors.map((e) => `  [${e.scope}] ${e.code}: ${e.message}`).join('\n')
      );
    }
    expect(errors).toEqual([]);
  });

  it('keeps every competition question inside the documented contract', () => {
    for (const q of COMPETITION_QUESTIONS) {
      expect(q.id).toBeTruthy();
      expect(q.topic).toBeTruthy();
      expect(q.skillId).toBeTruthy();
      expect(COMPETITION_SKILLS.some((s) => s.skillId === q.skillId)).toBe(true);
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.estimatedSeconds).toBeGreaterThanOrEqual(CONTENT_POLICY.MIN_ESTIMATED_SECONDS);
      expect(q.estimatedSeconds).toBeLessThanOrEqual(CONTENT_POLICY.MAX_ESTIMATED_SECONDS);
      expect(q.options.length).toBeGreaterThanOrEqual(CONTENT_POLICY.MIN_OPTIONS);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.correctAnswer).toBeTruthy();
      expect(q.version).toBeGreaterThanOrEqual(1);
    }
  });

  it('never has two identical question ids', () => {
    const ids = COMPETITION_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // O(n²) trên toàn bộ ngân hàng đề: chạy một mình hết ~4 s nhưng khi 8 worker
  // tranh nhau CPU thì vượt trần 20 s mặc định của vitest và đỏ vì timing, không
  // phải vì nội dung trùng — nên cấp riêng ngân sách thời gian cho test này.
  it('never has two semantically duplicated prompts', () => {
    for (let i = 0; i < COMPETITION_QUESTIONS.length; i += 1) {
      for (let j = i + 1; j < COMPETITION_QUESTIONS.length; j += 1) {
        const a = COMPETITION_QUESTIONS[i];
        const b = COMPETITION_QUESTIONS[j];
        const similarity = semanticSimilarity(a.prompt, b.prompt);
        expect({
          pair: `${a.id} vs ${b.id}`,
          similarity: Number(similarity.toFixed(3)),
        }).not.toMatchObject({ similarity: expect.any(Number) && 1 });
        expect(similarity).toBeLessThan(CONTENT_POLICY.DUPLICATE_PROMPT_SIMILARITY);
      }
    }
  }, 120_000);

  it('keeps Vietnamese diacritics when detecting duplicates (T02C: má ≠ mà, ăn ≠ ân)', () => {
    // Tone-different words are different questions and must never match.
    expect(normalizeForDuplicateCheck('Má đi chợ')).not.toBe(normalizeForDuplicateCheck('Mà đi chợ'));
    expect(normalizeForDuplicateCheck('Bé ăn cơm')).not.toBe(normalizeForDuplicateCheck('Bé ân cơm'));
    expect(semanticSimilarity('Má đi chợ mua rau', 'Mà đi chợ mua rau')).toBeLessThan(
      CONTENT_POLICY.DUPLICATE_PROMPT_SIMILARITY
    );
    // Identical meaning with different punctuation/case still matches.
    expect(semanticSimilarity('Tính: 6 + 4 = ?', 'Tính 6 + 4 =?')).toBe(1);
    expect(semanticSimilarity('Tính: 6 + 4 = ?', 'Con gì nào sống dưới nước?')).toBeLessThan(0.3);
  });

  it('keeps Vietnamese diacritics intact in prompts', () => {
    const missing = COMPETITION_QUESTIONS.filter((q) => {
      // A Vietnamese Grade-1 prompt should carry at least one accented vowel.
      return q.subject !== 'english' && !/[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(q.prompt);
    });
    expect(missing.map((q) => q.id)).toEqual([]);
  });

  it('validates arithmetic answers of every competition math question', () => {
    for (const q of COMPETITION_QUESTIONS.filter((x) => x.subject === 'toan')) {
      const add3 = q.prompt.match(/(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
      const add = q.prompt.match(/(?:^|[^\d+])(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
      const sub = q.prompt.match(/(\d+)\s*-\s*(\d+)\s*=\s*\?/);
      const fillAdd = q.prompt.match(/(\d+)\s*\+\s*\.\.\.\s*=\s*(\d+)/);
      const fillSub = q.prompt.match(/(\d+)\s*-\s*\.\.\.\s*=\s*(\d+)/);

      if (add3) {
        const [a, b, c] = add3.slice(1, 4).map(Number);
        expect({ id: q.id, answer: q.correctAnswer }).toEqual({
          id: q.id,
          answer: (a + b + c).toString(),
        });
      } else if (add && !fillAdd) {
        const [a, b] = add.slice(1, 3).map(Number);
        expect({ id: q.id, answer: q.correctAnswer }).toEqual({
          id: q.id,
          answer: (a + b).toString(),
        });
      }
      if (sub) {
        const [a, b] = sub.slice(1, 3).map(Number);
        expect({ id: q.id, answer: q.correctAnswer }).toEqual({
          id: q.id,
          answer: (a - b).toString(),
        });
      }
      if (fillAdd) {
        const [a, total] = fillAdd.slice(1, 3).map(Number);
        expect({ id: q.id, answer: q.correctAnswer }).toEqual({
          id: q.id,
          answer: (total - a).toString(),
        });
      }
      if (fillSub) {
        const [a, diff] = fillSub.slice(1, 3).map(Number);
        expect({ id: q.id, answer: q.correctAnswer }).toEqual({
          id: q.id,
          answer: (a - diff).toString(),
        });
      }
    }
  });

  it('validates every reading item against the reading contract', () => {
    for (const q of READING_QUESTIONS) {
      expect(READING_SKILLS.some((s) => s.skillId === q.skillId)).toBe(true);
      expect(q.options).toContain(q.correctAnswer);
      expect(q.wordCount).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('P29 — blueprint quality gate (§11)', () => {
  it('gives every preset a duration, count, rewards, version and source note', () => {
    for (const bp of EXAM_BLUEPRINTS) {
      expect(bp.id).toBeTruthy();
      expect(bp.title.trim().length).toBeGreaterThan(0);
      expect(bp.durationSeconds).toBeGreaterThanOrEqual(120);
      expect(bp.questionCount).toBeGreaterThanOrEqual(4);
      expect(bp.rewardStars).toBeGreaterThan(0);
      expect(bp.rewardXp).toBeGreaterThan(0);
      expect(bp.maxScore).toBeGreaterThan(0);
      expect(bp.version).toBeGreaterThanOrEqual(1);
      // §5/§11: never claim to be an official paper.
      expect(bp.sourceNote).toBeTruthy();
      expect(bp.sourceNote!.toLowerCase()).toContain('không phải đề thi chính thức');
    }
  });

  it('never hardcodes a single exam: multiple presets per subject exist', () => {
    const subjects = new Set(EXAM_BLUEPRINTS.map((b) => b.subject));
    expect(subjects.size).toBeGreaterThanOrEqual(3);
    expect(EXAM_BLUEPRINTS.length).toBeGreaterThanOrEqual(6);
    for (const subject of subjects) {
      expect(EXAM_BLUEPRINTS.filter((b) => b.subject === subject).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps question-type distributions normalised to 1', () => {
    for (const bp of EXAM_BLUEPRINTS) {
      if (!bp.questionTypeDistribution) continue;
      const total = Object.values(bp.questionTypeDistribution).reduce((a, b) => a + b, 0);
      expect({ id: bp.id, total: Number(total.toFixed(3)) }).toEqual({
        id: bp.id,
        total: 1,
      });
    }
  });
});

describe('P29 — coverage matrix (§16)', () => {
  const coverage = buildCoverageReport();

  it('gives every taxonomy skill at least the minimum number of questions', () => {
    expect(coverage.skillsWithoutQuestions).toEqual([]);
    expect(coverage.underSuppliedSkills).toEqual([]);
  });

  it('exercises every supported exam question type', () => {
    expect(coverage.questionTypesMissing).toEqual([]);
    for (const type of [
      'multiple-choice',
      'true-false',
      'fill-blank',
      'matching',
      'ordering',
      'drag-drop',
      'classify',
    ]) {
      expect(coverage.questionTypesPresent).toContain(type);
    }
  });

  it('keeps the competition bank from being a copy of the lesson bank', () => {
    const competitionIds = new Set(COMPETITION_QUESTIONS.map((q) => q.id));
    // Lesson question ids follow the vn-/math-/eng- prefix convention.
    const copied = COMPETITION_QUESTIONS.filter((q) => /^(vn|math|eng)-/.test(q.id));
    expect(copied.filter((q) => competitionIds.has(q.id))).toEqual([]);
    expect(copied).toEqual([]);
  });

  it('never lets one skill dominate the whole bank', () => {
    expect(coverage.overConcentratedSkills).toEqual([]);
    expect(coverage.maxSkillShare).toBeLessThanOrEqual(CONTENT_POLICY.MAX_SKILL_CONCENTRATION);
  });

  it('reports a non-empty coverage matrix', () => {
    expect(coverage.matrix.length).toBeGreaterThan(0);
    for (const cell of coverage.matrix) {
      expect(cell.topic).toBeTruthy();
      expect(Object.keys(cell.skills).length).toBeGreaterThan(0);
    }
  });
});
