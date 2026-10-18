import { describe, it, expect, beforeEach } from 'vitest';
import { CompetitionEngine } from '../src/services/competitionEngine';
import { EXAM_BLUEPRINTS } from '../src/data/competitionBlueprints';
import { CompetitionQuestion, QuestionResponse } from '../src/types/competition';

describe('Competition Engine Assembly, Scoring & Error Analysis', () => {
  it('deterministically assembles questions for a blueprint with zero duplicates', () => {
    const mathBlueprint = EXAM_BLUEPRINTS.find((b) => b.id === 'bp-math-mini-01');
    expect(mathBlueprint).toBeDefined();

    const questions = CompetitionEngine.assembleExamQuestions(mathBlueprint!, 1234);
    expect(questions.length).toBe(mathBlueprint!.questionCount);

    // Subject integrity
    for (const q of questions) {
      expect(q.subject).toBe(mathBlueprint!.subject);
    }

    // Uniqueness
    const ids = questions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(questions.length);

    // Deterministic repeatability: same seed yields same order
    const questionsRep = CompetitionEngine.assembleExamQuestions(mathBlueprint!, 1234);
    expect(questionsRep.map((q) => q.id)).toEqual(ids);
  });

  it('assembles targeted skill practice questions correctly', () => {
    const skillQuestions = CompetitionEngine.assembleSkillPractice('MATH-ADDITION', 3);
    expect(skillQuestions.length).toBeGreaterThanOrEqual(1);
    for (const q of skillQuestions) {
      expect(q.skillId).toBe('MATH-ADDITION');
    }
  });

  it('assembles adaptive remediation questions prioritizing targeted weak skills', () => {
    const remediation = CompetitionEngine.assembleAdaptiveRemediation(
      ['TV-SPELLING', 'MATH-SUBTRACTION'],
      4
    );
    expect(remediation.length).toBeGreaterThanOrEqual(2);
    const hasTargetSkill = remediation.some(
      (q) => q.skillId === 'TV-SPELLING' || q.skillId === 'MATH-SUBTRACTION'
    );
    expect(hasTargetSkill).toBe(true);
  });

  it('evaluates speed and accuracy ratings fairly without penalizing careful learners', () => {
    // High accuracy + fast pacing
    const fastAccurate = CompetitionEngine.evaluateSpeed(90, 14);
    expect(fastAccurate.rating).toBe('EXCELLENT');

    // High accuracy + thoughtful deliberation
    const steadyAccurate = CompetitionEngine.evaluateSpeed(85, 24);
    expect(steadyAccurate.rating).toBe('STEADY');

    // Low accuracy + rushed answers
    const rushed = CompetitionEngine.evaluateSpeed(40, 8);
    expect(rushed.rating).toBe('RUSHING');

    // Low accuracy + slow answers
    const struggling = CompetitionEngine.evaluateSpeed(40, 22);
    expect(struggling.rating).toBe('NEEDS_TIME');
  });

  it('categorizes errors with pedagogical evidence', () => {
    const dummyQuestions: CompetitionQuestion[] = [
      {
        id: 'q1',
        subject: 'toan',
        topic: 'Số học',
        skillId: 'MATH-NUMBER',
        questionType: 'multiple-choice',
        version: 1,
        difficulty: 'EASY',
        prompt: '1 + 1 = ?',
        options: ['1', '2', '3', '4'],
        correctAnswer: '2',
        explanation: '1 + 1 = 2.',
        estimatedSeconds: 10,
      },
      {
        id: 'q2',
        subject: 'toan',
        topic: 'Tư duy logic',
        skillId: 'MATH-LOGIC',
        questionType: 'multiple-choice',
        version: 1,
        difficulty: 'HARD',
        prompt: 'Hard logic puzzle',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'B',
        explanation: 'Step 1 then step 2.',
        estimatedSeconds: 30,
      },
    ];

    const responses: QuestionResponse[] = [
      // Careless quick tap (<6s)
      { questionId: 'q1', userAnswer: '1', isCorrect: false, timeSpentSeconds: 4 },
      // High deliberation logic error
      { questionId: 'q2', userAnswer: 'A', isCorrect: false, timeSpentSeconds: 28 },
    ];

    const errors = CompetitionEngine.analyzeErrors(responses, dummyQuestions);
    expect(errors.length).toBe(2);

    const q1Error = errors.find((e) => e.questionId === 'q1');
    expect(q1Error?.category).toBe('CARELESS_ERROR');

    const q2Error = errors.find((e) => e.questionId === 'q2');
    expect(q2Error?.category).toBe('REASONING_ERROR');
  });

  it('scores an entire exam session deterministically with complete skill breakdown', () => {
    const bp = EXAM_BLUEPRINTS[0];
    const questions = CompetitionEngine.assembleExamQuestions(bp, 999);

    // Answer first half correctly, second half incorrectly
    const responses: QuestionResponse[] = questions.map((q, idx) => ({
      questionId: q.id,
      userAnswer: idx < questions.length / 2 ? (Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer) : 'WRONG',
      isCorrect: idx < questions.length / 2,
      timeSpentSeconds: 15,
    }));

    const result = CompetitionEngine.scoreSession(bp, questions, responses, 90, []);
    expect(result.totalQuestions).toBe(questions.length);
    expect(result.correctCount).toBe(Math.floor(questions.length / 2));
    expect(result.accuracy).toBe(50);
    expect(result.score).toBe(5);
    expect(result.timeUsedSeconds).toBe(90);
    expect(result.errorAnalysis.length).toBe(questions.length - Math.floor(questions.length / 2));
  });
});
