import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill in-memory localStorage for the Node test runner.
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import { CompetitionEngine } from '../src/services/competitionEngine';
import { EXAM_BLUEPRINTS, getBlueprintById } from '../src/data/competitionBlueprints';
import { COMPETITION_QUESTIONS, COMPETITION_BANK_VERSION } from '../src/data/competitionQuestions';
import { StorageService, STORAGE_SCHEMA_VERSION } from '../src/services/storage';
import { CompetitionExamResult, QuestionResponse } from '../src/types/competition';
import { CONTENT_POLICY, SEED_POLICY } from '../src/config/policy';

const ALL_BLUEPRINTS = EXAM_BLUEPRINTS;

function responsesFor(
  questions: typeof COMPETITION_QUESTIONS,
  correctCount: number,
  seconds = 15
): QuestionResponse[] {
  return questions.map((q, idx) => ({
    questionId: q.id,
    userAnswer: idx < correctCount ? q.correctAnswer : 'ZZZ_NO_ANSWER',
    isCorrect: idx < correctCount,
    timeSpentSeconds: seconds,
  }));
}

describe('P27.5 — seeded determinism (§17)', () => {
  it('same seed produces exactly the same paper for every blueprint', () => {
    for (const bp of ALL_BLUEPRINTS) {
      const a = CompetitionEngine.assembleExamQuestions(bp, 4242).map((q) => q.id);
      const b = CompetitionEngine.assembleExamQuestions(bp, 4242).map((q) => q.id);
      expect({ bp: bp.id, equal: JSON.stringify(a) === JSON.stringify(b) }).toEqual({
        bp: bp.id,
        equal: true,
      });
    }
  });

  it('different seeds produce a different but still valid paper', () => {
    const bp = getBlueprintById('bp-vn-full')!;
    const a = CompetitionEngine.assembleExamQuestions(bp, 1).map((q) => q.id);
    const b = CompetitionEngine.assembleExamQuestions(bp, 2).map((q) => q.id);
    expect(a).not.toEqual(b);
    for (const ids of [a, b]) {
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('never puts the same question twice in one paper (no fake copies)', () => {
    for (const bp of ALL_BLUEPRINTS) {
      for (const seed of [1, 7, 99, 20250101]) {
        const ids = CompetitionEngine.assembleExamQuestions(bp, seed).map((q) => q.id);
        expect({ bp: bp.id, seed, unique: new Set(ids).size === ids.length }).toEqual({
          bp: bp.id,
          seed,
          unique: true,
        });
        // A duplicated item would carry the synthetic `_copy_` suffix.
        expect(ids.some((id) => id.includes('_copy_'))).toBe(false);
      }
    }
  });

  it('reports a shortfall instead of padding with duplicated questions', () => {
    const oversized = {
      ...getBlueprintById('bp-vn-mini-01')!,
      questionCount: 9999,
    };
    const { questions, shortfall } = CompetitionEngine.assembleExam(oversized, 1);
    expect(questions.length).toBeLessThan(9999);
    expect(shortfall).toBe(9999 - questions.length);
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  });

  it('derives a stable seed from a string', () => {
    expect(CompetitionEngine.hashSeed('abc')).toBe(CompetitionEngine.hashSeed('abc'));
    expect(CompetitionEngine.hashSeed('abc')).not.toBe(CompetitionEngine.hashSeed('abd'));
  });

  it('uses the documented default seed when none is supplied', () => {
    const bp = getBlueprintById('bp-math-mini-01')!;
    const withDefault = CompetitionEngine.assembleExamQuestions(bp).map((q) => q.id);
    const explicit = CompetitionEngine.assembleExamQuestions(bp, SEED_POLICY.DEFAULT_EXAM_SEED).map(
      (q) => q.id
    );
    expect(withDefault).toEqual(explicit);
  });
});

describe('P27.5 — exam fidelity: distributions, sections, formats (§10, §11)', () => {
  it('honours an explicit skill distribution', () => {
    const bp = getBlueprintById('bp-vn-reading')!;
    const questions = CompetitionEngine.assembleExamQuestions(bp, 5);
    const readingCount = questions.filter((q) => q.skillId === 'TV-READING').length;
    expect(readingCount).toBeGreaterThanOrEqual(4);
  });

  it('honours a question-type distribution on the full-mock presets', () => {
    for (const id of ['bp-vn-full', 'bp-math-full']) {
      const bp = getBlueprintById(id)!;
      const questions = CompetitionEngine.assembleExamQuestions(bp, 11);
      const types = new Set(questions.map((q) => q.questionType));
      // The paper must be more than plain multiple choice.
      expect(types.size).toBeGreaterThan(1);
      expect(types.has('multiple-choice')).toBe(true);
    }
  });

  it('orders the paper into the declared sections', () => {
    const bp = getBlueprintById('bp-vn-full')!;
    const questions = CompetitionEngine.assembleExamQuestions(bp, 3);
    const sectionOf = (skillId: string) =>
      bp.sections!.findIndex((s) => s.skillIds.includes(skillId));
    const indices = questions.map((q) => sectionOf(q.skillId)).filter((i) => i >= 0);
    // Non-decreasing section order proves the paper is grouped by section.
    for (let i = 1; i < indices.length; i += 1) {
      expect(indices[i]).toBeGreaterThanOrEqual(indices[i - 1]);
    }
  });

  it('includes every exam format the app supports', () => {
    const types = new Set(COMPETITION_QUESTIONS.map((q) => q.questionType));
    for (const t of [
      'multiple-choice',
      'true-false',
      'fill-blank',
      'matching',
      'ordering',
      'drag-drop',
      'classify',
    ]) {
      expect(types.has(t as never)).toBe(true);
    }
  });

  it('keeps the competition bank independent from the lesson bank', () => {
    expect(COMPETITION_QUESTIONS.length).toBeGreaterThanOrEqual(45);
    expect(COMPETITION_QUESTIONS.every((q) => !/^(vn|math|eng)-/.test(q.id))).toBe(true);
  });
});

describe('P27.5 — grading is domain-owned and deterministic (§1.3)', () => {
  const byId = (id: string) => COMPETITION_QUESTIONS.find((q) => q.id === id)!;

  it('grades a single-choice question correctly and ignores case/space', () => {
    const q = byId('cq-math-05'); // 6 + 4 = 10
    expect(CompetitionEngine.gradeAnswer(q, '10')).toBe(true);
    expect(CompetitionEngine.gradeAnswer(q, '  10 ')).toBe(true);
    expect(CompetitionEngine.gradeAnswer(q, '9')).toBe(false);
    expect(CompetitionEngine.gradeAnswer(q, null)).toBe(false);
    expect(CompetitionEngine.gradeAnswer(q, '')).toBe(false);
  });

  it('grades an ordering question on the canonical sequence', () => {
    const q = byId('cq-vn-o01');
    expect(CompetitionEngine.gradeAnswer(q, 'Bé|Lan|chăm chỉ|học bài')).toBe(true);
    expect(CompetitionEngine.gradeAnswer(q, 'Lan|Bé|chăm chỉ|học bài')).toBe(false);
    expect(CompetitionEngine.gradeAnswer(q, 'Bé|Lan|học bài')).toBe(false);
  });

  it('grades a matching question on every pair', () => {
    const q = byId('cq-vn-m01');
    expect(CompetitionEngine.gradeAnswer(q, 'ba=bố|me=mẹ|con gai=con gái|con trai=con trai')).toBe(true);
    expect(CompetitionEngine.gradeAnswer(q, 'ba=bố|me=mẹ|con gai=con trai|con trai=con gái')).toBe(false);
  });

  it('grades a classify question on the bucket label', () => {
    const q = byId('cq-math-d01');
    expect(CompetitionEngine.gradeAnswer(q, 'hình vuông')).toBe(true);
    expect(CompetitionEngine.gradeAnswer(q, 'hình tròn')).toBe(false);
  });

  it('never mutates the question while grading', () => {
    const q = byId('cq-vn-o01');
    const snapshot = JSON.stringify(q);
    CompetitionEngine.gradeAnswer(q, 'wrong');
    expect(JSON.stringify(q)).toBe(snapshot);
  });

  it('formats answers for human review', () => {
    expect(CompetitionEngine.formatAnswer(byId('cq-vn-o01'), 'Bé|Lan|học|bài')).toBe(
      'Bé → Lan → học → bài'
    );
    expect(CompetitionEngine.formatAnswer(byId('cq-vn-m01'), 'ba=bố|me=mẹ')).toBe(
      'ba → bố, me → mẹ'
    );
  });
});

describe('P27.5 — decomposed scoring (§13)', () => {
  const bp = getBlueprintById('bp-math-mini-01')!;

  it('reports rawScore, accuracy, completion and timing separately', () => {
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const half = Math.floor(questions.length / 2);
    const responses = responsesFor(questions, half);
    // Leave one question unanswered to prove completion is measured apart.
    responses[responses.length - 1].userAnswer = null;

    const result = CompetitionEngine.scoreSession(bp, questions, responses, 120, []);

    expect(result.scoring.maxScore).toBe(bp.maxScore);
    expect(result.scoring.totalQuestions).toBe(questions.length);
    expect(result.scoring.correctCount).toBe(half);
    expect(result.scoring.attemptedCount).toBe(questions.length - 1);
    expect(result.scoring.completion).toBe(
      Math.round(((questions.length - 1) / questions.length) * 100)
    );
    expect(result.scoring.totalSeconds).toBe(120);
    expect(result.scoring.averageSecondsPerQuestion).toBe(
      Math.round(120 / questions.length)
    );
    expect(result.scoring.fastestQuestionSeconds).toBeLessThanOrEqual(
      result.scoring.slowestQuestionSeconds
    );
  });

  it('breaks performance down by skill AND by question type', () => {
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const result = CompetitionEngine.scoreSession(bp, questions, responsesFor(questions, 3), 90, []);
    expect(Object.keys(result.scoring.skillPerformance).length).toBeGreaterThan(0);
    expect(Object.keys(result.scoring.questionTypePerformance).length).toBeGreaterThan(0);
    for (const stat of Object.values(result.scoring.skillPerformance)) {
      expect(stat.skillName.length).toBeGreaterThan(0);
    }
  });

  it('never lets speed change the score (§13, §9)', () => {
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const responses = responsesFor(questions, 3);
    const slow = CompetitionEngine.scoreSession(bp, questions, responses, 600, []);
    const fast = CompetitionEngine.scoreSession(bp, questions, responses, 30, []);
    expect(slow.score).toBe(fast.score);
    expect(slow.scoring.rawScore).toBe(fast.scoring.rawScore);
    expect(slow.correctCount).toBe(fast.correctCount);
    // Only the descriptive timing differs.
    expect(slow.scoring.averageSecondsPerQuestion).toBeGreaterThan(
      fast.scoring.averageSecondsPerQuestion
    );
  });

  it('scales the score to the blueprint maxScore', () => {
    const custom = { ...bp, maxScore: 20 };
    const questions = CompetitionEngine.assembleExamQuestions(custom, 21);
    const allCorrect = CompetitionEngine.scoreSession(
      custom,
      questions,
      responsesFor(questions, questions.length),
      60,
      []
    );
    expect(allCorrect.score).toBe(20);
    expect(allCorrect.accuracy).toBe(100);
  });

  it('recomputes correctness from the answer, never trusting the UI flag', () => {
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const liar: QuestionResponse[] = questions.map((q, idx) => ({
      questionId: q.id,
      userAnswer: idx === 0 ? 'WRONG_ANSWER' : q.correctAnswer,
      // Deliberately lies about the first answer being correct.
      isCorrect: true,
      timeSpentSeconds: 10,
    }));
    const result = CompetitionEngine.scoreSession(bp, questions, liar, 60, []);
    expect(result.correctCount).toBe(questions.length - 1);
    expect(result.accuracy).toBe(
      Math.round(((questions.length - 1) / questions.length) * 100)
    );
  });

  it('stamps provenance so a paper can be reproduced later', () => {
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const result = CompetitionEngine.scoreSession(bp, questions, responsesFor(questions, 2), 60, [], 21);
    expect(result.provenance.seed).toBe(21);
    expect(result.provenance.blueprintVersion).toBe(bp.version);
    expect(result.provenance.questionBankVersion).toBe(COMPETITION_BANK_VERSION);
  });
});

describe('P27.5 — exam review & error analysis (§14)', () => {
  const bp = getBlueprintById('bp-math-mini-01')!;

  it('returns an explanation, category and a concrete next action for every mistake', () => {
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const responses = responsesFor(questions, 1);
    const result = CompetitionEngine.scoreSession(bp, questions, responses, 90, []);

    expect(result.errorAnalysis.length).toBe(questions.length - 1);
    for (const item of result.errorAnalysis) {
      expect(item.explanation.trim().length).toBeGreaterThan(0);
      expect(item.advice.trim().length).toBeGreaterThan(0);
      expect(item.category.length).toBeGreaterThan(0);
      expect(item.remediation.label.trim().length).toBeGreaterThan(0);
      expect(item.skillName.trim().length).toBeGreaterThan(0);
      expect(Object.keys(QUESTION_TYPE_SET)).toContain(item.questionType);
    }
  });

  it('classifies a rushed wrong answer as a careless tap', () => {
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const responses = responsesFor(questions, 0, 3);
    const result = CompetitionEngine.scoreSession(bp, questions, responses, 30, []);
    expect(result.errorAnalysis.every((e) => e.category === 'CARELESS_ERROR')).toBe(true);
    expect(result.errorAnalysis[0].remediation.actionType).toBe('SPEED_DRILL');
  });

  it('flags an unanswered question without inventing an answer', () => {
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const responses = responsesFor(questions, 0, 20);
    responses[0].userAnswer = null;
    const result = CompetitionEngine.scoreSession(bp, questions, responses, 120, []);
    const first = result.errorAnalysis.find((e) => e.questionId === responses[0].questionId);
    expect(first?.category).toBe('UNCLASSIFIED');
    expect(first?.userAnswer).toBe('Chưa trả lời');
  });

  it('does not analyse questions that were answered correctly', () => {
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const result = CompetitionEngine.scoreSession(bp, questions, responsesFor(questions, questions.length), 60, []);
    expect(result.errorAnalysis).toEqual([]);
  });
});

const QUESTION_TYPE_SET = {
  'multiple-choice': 1,
  'true-false': 1,
  'fill-blank': 1,
  matching: 1,
  ordering: 1,
  'drag-drop': 1,
  classify: 1,
} as const;

describe('P30 — exam submission idempotency (§19)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('awards rewards exactly once for a repeated submission of the same exam', () => {
    const bp = getBlueprintById('bp-math-mini-01')!;
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    const result = CompetitionEngine.scoreSession(bp, questions, responsesFor(questions, 4), 90, []);

    StorageService.recordCompetitionResult(result, bp.rewardXp, bp.rewardStars);
    const firstXp = StorageService.getChildProfile().xp;
    const firstStars = StorageService.getChildProfile().stars;

    // Simulate a double click / retry / refresh-after-submit with the same id.
    StorageService.recordCompetitionResult(result, bp.rewardXp, bp.rewardStars);
    StorageService.recordCompetitionResult(result, bp.rewardXp, bp.rewardStars);

    expect(StorageService.getChildProfile().xp).toBe(firstXp);
    expect(StorageService.getChildProfile().stars).toBe(firstStars);
    expect(StorageService.getCompetitionHistory().examResults.length).toBe(1);
  });

  it('records a genuinely different retake as a separate attempt', () => {
    const bp = getBlueprintById('bp-math-mini-01')!;
    const questionsA = CompetitionEngine.assembleExamQuestions(bp, 1);
    const questionsB = CompetitionEngine.assembleExamQuestions(bp, 2);
    const a = CompetitionEngine.scoreSession(bp, questionsA, responsesFor(questionsA, 3), 90, [], 1);
    const b = CompetitionEngine.scoreSession(bp, questionsB, responsesFor(questionsB, 3), 90, [a], 2);

    StorageService.recordCompetitionResult(a, bp.rewardXp, bp.rewardStars);
    StorageService.recordCompetitionResult(b, bp.rewardXp, bp.rewardStars);

    const history = StorageService.getCompetitionHistory();
    expect(history.examResults.length).toBe(2);
    expect(new Set(history.examResults.map((e) => e.id)).size).toBe(2);
  });

  it('keeps the exam history bounded so storage cannot grow without limit', () => {
    const bp = getBlueprintById('bp-math-mini-01')!;
    const questions = CompetitionEngine.assembleExamQuestions(bp, 21);
    let previous: CompetitionExamResult | null = null;
    for (let i = 0; i < 40; i += 1) {
      const result = CompetitionEngine.scoreSession(bp, questions, responsesFor(questions, 3), 90, previous ? [previous] : [], i);
      StorageService.recordCompetitionResult(result, bp.rewardXp, bp.rewardStars);
      previous = result;
    }
    expect(StorageService.getCompetitionHistory().examResults.length).toBeLessThanOrEqual(30);
  });
});

describe('P30 — persistence hardening (§18)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates a legacy P28 Learning OS store and keeps evidence idempotent', () => {
    localStorage.setItem(
      'kho_bau_learning_os_store',
      JSON.stringify({
        schemaVersion: 'P28-v1',
        knowledgeStates: {},
        recentEvidences: [{ id: 'legacy_ev_1', learnerId: 'child_1', source: 'LESSON', skillId: 'vn_alphabet', subject: 'tieng-viet', timestamp: 1, correct: true }],
        dailyPlan: null,
        fatigue: {},
        recommendationHistory: [],
      })
    );

    const store = StorageService.getLearningOSStore();
    expect(store.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(store.processedEvidenceIds).toContain('legacy_ev_1');

    // Replaying the legacy evidence must be a no-op.
    const applied = StorageService.recordLearningEvidence({
      id: 'legacy_ev_1',
      learnerId: 'child_1',
      source: 'LESSON',
      skillId: 'vn_alphabet',
      subject: 'tieng-viet',
      timestamp: 2,
      correct: true,
    });
    expect(applied).toBe(false);
  });

  it('recovers from a totally corrupt Learning OS store', () => {
    localStorage.setItem('kho_bau_learning_os_store', 'not json at all {{{');
    const store = StorageService.getLearningOSStore();
    expect(store.knowledgeStates).toEqual({});
    expect(store.recentEvidences).toEqual([]);
    expect(store.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
  });

  it('sanitises hostile knowledge-state values instead of trusting them', () => {
    localStorage.setItem(
      'kho_bau_learning_os_store',
      JSON.stringify({
        schemaVersion: STORAGE_SCHEMA_VERSION,
        knowledgeStates: {
          broken: {
            skillId: 'broken',
            subject: 'not-a-subject',
            mastery: 5000,
            accuracy: -20,
            attemptCount: 'ten',
            consecutiveIncorrect: -3,
            difficultyPerformance: 'nope',
            errorProfile: { knowledgeGap: 'x', careless: 4 },
            evidenceVersion: 0,
            status: 'HACKED',
          },
        },
        recentEvidences: 'nope',
        processedEvidenceIds: [1, 'ok', null],
        fatigue: { questionsAnsweredThisSession: -5, isFatigued: 'yes' },
      })
    );

    const store = StorageService.getLearningOSStore();
    const state = store.knowledgeStates.broken;
    expect(state.subject).toBe('tieng-viet');
    expect(state.mastery).toBe(100);
    expect(state.accuracy).toBe(0);
    expect(state.attemptCount).toBe(0);
    expect(state.consecutiveIncorrect).toBe(0);
    expect(state.status).toBe('NOT_STARTED');
    expect(state.difficultyPerformance.medium).toEqual({ attempts: 0, correct: 0 });
    expect(state.errorProfile.careless).toBe(4);
    expect(state.errorProfile.knowledgeGap).toBe(0);
    expect(state.evidenceVersion).toBe(1);
    expect(store.recentEvidences).toEqual([]);
    expect(store.processedEvidenceIds).toEqual(['ok']);
    expect(store.fatigue.questionsAnsweredThisSession).toBe(0);
    expect(store.fatigue.isFatigued).toBe(false);
  });

  it('never hands out a shared mutable default profile', () => {
    const a = StorageService.getChildProfile();
    a.stars = 999;
    a.completedLessons.push('hacked-lesson');
    const b = StorageService.getChildProfile();
    expect(b.stars).not.toBe(999);
    expect(b.completedLessons).not.toContain('hacked-lesson');
  });

  it('records the same evidence id only once across many calls', () => {
    const evidence = {
      id: 'stable_id_1',
      learnerId: 'child_1' as const,
      source: 'LESSON' as const,
      skillId: 'vn_alphabet',
      subject: 'tieng-viet' as const,
      timestamp: 1,
      correct: true,
    };
    expect(StorageService.recordLearningEvidence(evidence)).toBe(true);
    for (let i = 0; i < 10; i += 1) {
      expect(StorageService.recordLearningEvidence(evidence)).toBe(false);
    }
    const state = StorageService.getKnowledgeStates()['vn_alphabet'];
    expect(state.attemptCount).toBe(1);
  });

  it('updates session fatigue only from real new evidence', () => {
    const before = StorageService.getLearningOSStore().fatigue.questionsAnsweredThisSession;
    StorageService.recordLearningEvidence({
      id: 'fatigue_1',
      learnerId: 'child_1',
      source: 'LESSON',
      skillId: 'vn_alphabet',
      subject: 'tieng-viet',
      timestamp: 1,
      correct: false,
    });
    const after = StorageService.getLearningOSStore().fatigue.questionsAnsweredThisSession;
    expect(after).toBe(before + 1);
  });
});
