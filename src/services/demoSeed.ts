import type { ChildProfile, CompetitionHistoryStore } from '../types';
import type { CompetitionExamResult, QuestionResponse } from '../types/competition';
import { localDateKey } from './dateUtils';
import { StorageService } from './storage';
import { CompetitionEngine } from './competitionEngine';
import { getBlueprintById } from '../data/competitionBlueprints';

/**
 * T02C — demo-data seeder, split out of `storage.ts`.
 *
 * `StorageService` (first-load chunk) must not import `CompetitionEngine` or
 * the competition bank (~150 kB): the only reason it did was this demo
 * seeder. Screens that offer "nạp dữ liệu thử nghiệm" (parent dashboard, a
 * lazy chunk) import this module instead, so the heavy bank only loads when
 * the demo seed is actually requested.
 */

/** Fixed seed so the demo paper is byte-for-byte reproducible. */
const DEMO_SEED = 20250101;

/**
 * Seeds realistic demo data for evaluators/parents to test diagnostic reports
 * without affecting initial clean profile creation for new users.
 *
 * SAFETY (§1.2): the resulting profile is explicitly flagged with
 * `isDemoData: true` so the UI can label every screen that shows these
 * fabricated numbers, and so parents are never misled into believing a real
 * learner produced them.
 */
export function seedDemoProfile(): void {
  const today = localDateKey();
  const demoProfile: ChildProfile = {
    id: 'child_demo',
    name: 'Bé Minh',
    grade: 1,
    avatarBase: 'bear',
    equipped: {
      hat: 'hat_cap',
      glasses: 'glasses_nerd',
      backpack: 'bag_dino',
    },
    xp: 220,
    stars: 18,
    gems: 5,
    tickets: 4,
    streak: 4,
    lastActiveDate: today,
    unlockedItems: ['hat_cap', 'glasses_nerd', 'bag_dino', 'hat_party'],
    completedLessons: ['vn-les-1', 'vn-les-2', 'math-les-1', 'math-les-2', 'eng-les-1'],
    completedWeeklyChallenges: ['week_1'],
    dailyChestClaimedDate: undefined,
    lessonStars: {
      'vn-les-1': 3,
      'vn-les-2': 3,
      'math-les-1': 3,
      'math-les-2': 2,
      'eng-les-1': 3,
    },
    chestState: {},
    unlockAllLessons: false,
    isDemoData: true,
  };
  StorageService.saveChildProfile(demoProfile);

  const analytics = StorageService.getAnalytics();
  analytics.totalMinutesSpent = 45;
  analytics.minutesToday = 15;
  analytics.totalQuestionsAnswered = 24;
  analytics.totalCorrect = 19;
  analytics.lessonsCompletedCount = 5;
  analytics.gamesPlayedCount = 4;

  // Seed skill masteries
  if (analytics.skillMastery['vn_alphabet']) {
    analytics.skillMastery['vn_alphabet'].attempts = 6;
    analytics.skillMastery['vn_alphabet'].correctCount = 6;
    analytics.skillMastery['vn_alphabet'].status = 'MASTERED';
  }
  if (analytics.skillMastery['math_counting_10']) {
    analytics.skillMastery['math_counting_10'].attempts = 5;
    analytics.skillMastery['math_counting_10'].correctCount = 5;
    analytics.skillMastery['math_counting_10'].status = 'MASTERED';
  }
  if (analytics.skillMastery['math_subtraction_10']) {
    analytics.skillMastery['math_subtraction_10'].attempts = 5;
    analytics.skillMastery['math_subtraction_10'].correctCount = 1;
    analytics.skillMastery['math_subtraction_10'].wrongCount = 4;
    analytics.skillMastery['math_subtraction_10'].status = 'NEEDS_REVIEW';
  }
  if (analytics.skillMastery['eng_phonics_letters']) {
    analytics.skillMastery['eng_phonics_letters'].attempts = 4;
    analytics.skillMastery['eng_phonics_letters'].correctCount = 3;
    analytics.skillMastery['eng_phonics_letters'].wrongCount = 1;
    analytics.skillMastery['eng_phonics_letters'].status = 'PRACTICING';
  }

  analytics.recentErrors = [
    {
      questionId: 'math-q4-2',
      subject: 'toan',
      prompt: '10 - 4 = ...',
      timestamp: new Date().toISOString(),
    },
  ];

  StorageService.saveAnalytics(analytics);

  // Seed a sample competition exam result.
  // IMPORTANT: the demo paper is produced by the real CompetitionEngine from
  // scripted demo answers, so it can never drift from production scoring logic.
  const demoBlueprint = getBlueprintById('bp-math-mini-01');
  let sampleExam: CompetitionExamResult | null = null;
  if (demoBlueprint) {
    const demoQuestions = CompetitionEngine.assembleExamQuestions(demoBlueprint, DEMO_SEED);
    const demoResponses: QuestionResponse[] = demoQuestions.map((q, idx) => {
      // 5 of 6 answered correctly on purpose so reports show a realistic mix.
      const isCorrect = idx !== 3;
      return {
        questionId: q.id,
        userAnswer: isCorrect ? q.correctAnswer : q.options[q.options.length - 1],
        isCorrect,
        timeSpentSeconds: isCorrect ? 12 + idx : 26,
      };
    });
    sampleExam = CompetitionEngine.scoreSession(
      demoBlueprint,
      demoQuestions,
      demoResponses,
      110,
      [],
      DEMO_SEED
    );
    sampleExam.id = 'demo_exam_01';
  }

  const compStore: CompetitionHistoryStore = {
    examResults: sampleExam ? [sampleExam] : [],
    practicedSkills: sampleExam
      ? Object.entries(sampleExam.skillBreakdown).reduce<
          Record<string, { attempts: number; correct: number; lastPracticed: string }>
        >((acc, [skillId, stat]) => {
          acc[skillId] = { attempts: stat.total, correct: stat.correct, lastPracticed: today };
          return acc;
        }, {})
      : {},
    speedTrialsCompleted: 0,
    remediationPlans: [
      {
        generatedDate: today,
        targetSkills: ['MATH-SUBTRACTION'],
        completed: false,
      },
    ],
  };

  StorageService.saveCompetitionHistory(compStore);
}
