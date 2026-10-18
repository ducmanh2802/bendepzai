import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill in-memory localStorage for Node test runner
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
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
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage = createMockLocalStorage();
}

import { CompetitionEngine } from '../src/services/competitionEngine';
import { StorageService } from '../src/services/storage';
import { seedDemoProfile } from '../src/services/demoSeed';
import { CompetitionExamResult, ReadinessAssessment } from '../src/types/competition';


/**
 * Builds a complete, contract-valid exam result for readiness tests.
 * All scoring fields are derived, never hand-waved.
 */
function buildExamResult(overrides: Partial<CompetitionExamResult>): CompetitionExamResult {
  const base: CompetitionExamResult = {
    id: 'ex_fixture',
    blueprintId: 'bp-math-mini-01',
    examTitle: 'Toán Mini',
    subject: 'toan',
    timestamp: new Date().toISOString(),
    durationSeconds: 300,
    timeUsedSeconds: 100,
    totalQuestions: 6,
    correctCount: 5,
    accuracy: 83,
    score: 8,
    speedRating: 'EXCELLENT',
    speedLabel: 'Nhanh & Chuẩn xác',
    averageSecondsPerQuestion: 16,
    responses: [],
    skillBreakdown: {
      'MATH-ADDITION': { total: 3, correct: 3, skillName: 'Phép Cộng' },
      'MATH-NUMBER': { total: 3, correct: 2, skillName: 'Đếm Số' },
    },
    strongSkills: ['Phép Cộng'],
    weakSkills: [],
    errorAnalysis: [],
    readinessSnapshot: {} as ReadinessAssessment,
    scoring: {
      rawScore: 8,
      maxScore: 10,
      accuracy: 83,
      completion: 100,
      attemptedCount: 6,
      correctCount: 5,
      totalQuestions: 6,
      totalSeconds: 100,
      averageSecondsPerQuestion: 16,
      fastestQuestionSeconds: 10,
      slowestQuestionSeconds: 22,
      skillPerformance: {
        'MATH-ADDITION': { total: 3, correct: 3, skillName: 'Phép Cộng' },
        'MATH-NUMBER': { total: 3, correct: 2, skillName: 'Đếm Số' },
      },
      questionTypePerformance: { 'multiple-choice': { total: 6, correct: 5 } },
    },
    provenance: { blueprintVersion: 2, questionBankVersion: 2, seed: 1 },
    ...overrides,
  };
  return base;
}

describe('Competition Readiness Model & Persistence Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('evaluates readiness accurately for persona Child-New (0 exams)', () => {
    const readiness = CompetitionEngine.assessReadiness([]);
    expect(readiness.overallLevel).toBe('FOUNDATION');
    expect(readiness.isSufficientData).toBe(false);
    expect(readiness.knowledgeScore).toBe(0);
    expect(readiness.evidence.totalExamsTaken).toBe(0);
    expect(readiness.recommendations.length).toBeGreaterThan(0);
  });

  it('evaluates readiness for persona Child-Strong (high consistent performance)', () => {
    const dummyExam = (acc: number): CompetitionExamResult =>
      buildExamResult({
        id: `ex_${acc}`,
        correctCount: Math.round((acc / 100) * 6),
        accuracy: acc,
        score: Math.round((acc / 100) * 10),
        strongSkills: ['Phép Cộng', 'Đếm Số'],
      });

    const highHistory: CompetitionExamResult[] = [
      dummyExam(90),
      dummyExam(95),
      dummyExam(100),
    ];

    const readiness = CompetitionEngine.assessReadiness(highHistory);
    expect(readiness.isSufficientData).toBe(true);
    expect(readiness.knowledgeScore).toBeGreaterThanOrEqual(90);
    expect(readiness.overallLevel).toMatch(/^(STRONG|READY_FOR_MOCK)$/);
  });

  it('evaluates readiness for persona Child-Struggling and recommends weak skills', () => {
    const weakExam = buildExamResult({
      id: 'ex_weak',
      blueprintId: 'bp-vn-mini-01',
      examTitle: 'Tiếng Việt Mini',
      subject: 'tieng-viet',
      timeUsedSeconds: 200,
      correctCount: 2,
      accuracy: 33,
      score: 3,
      speedRating: 'NEEDS_TIME',
      speedLabel: 'Cần thêm thời gian',
      averageSecondsPerQuestion: 33,
      skillBreakdown: {
        'TV-SPELLING': { total: 3, correct: 0, skillName: 'Quy Tắc Chính Tả' },
        'TV-PHONICS': { total: 3, correct: 2, skillName: 'Nhận Diện Chữ Cái' },
      },
      strongSkills: [],
      weakSkills: ['Quy Tắc Chính Tả'],
    });

    const readiness = CompetitionEngine.assessReadiness([weakExam]);
    expect(readiness.isSufficientData).toBe(true);
    expect(readiness.overallLevel).toBe('DEVELOPING');
    expect(readiness.recommendations.some((r) => r.includes('Quy Tắc Chính Tả'))).toBe(true);
  });

  it('persists exam result to storage with idempotency protection', () => {
    const dummyExam = buildExamResult({
      id: 'exam_unique_101',
      examTitle: 'Toán Mini 01',
      timeUsedSeconds: 90,
      averageSecondsPerQuestion: 15,
      skillBreakdown: {},
      strongSkills: ['Số học'],
    });

    // First recording: awards +50 XP and +4 Stars
    StorageService.recordCompetitionResult(dummyExam, 50, 4);
    let profile = StorageService.getChildProfile();
    let history = StorageService.getCompetitionHistory();

    expect(history.examResults.length).toBe(1);
    expect(history.examResults[0].id).toBe('exam_unique_101');
    expect(profile.xp).toBe(50);
    expect(profile.stars).toBe(4);

    // Idempotency: recording the exact same exam ID MUST NOT award stars/XP again
    StorageService.recordCompetitionResult(dummyExam, 50, 4);
    profile = StorageService.getChildProfile();
    history = StorageService.getCompetitionHistory();

    expect(history.examResults.length).toBe(1);
    expect(profile.xp).toBe(50);
    expect(profile.stars).toBe(4);
  });

  it('cleanses competition history when parent executes full reset', () => {
    seedDemoProfile();
    let history = StorageService.getCompetitionHistory();
    expect(history.examResults.length).toBeGreaterThanOrEqual(1);

    StorageService.resetProgress();
    history = StorageService.getCompetitionHistory();
    expect(history.examResults.length).toBe(0);
    expect(history.speedTrialsCompleted).toBe(0);
  });
});
