import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveDifficultyService } from '../src/services/adaptiveDifficulty';
import { ADAPTIVE_DIFFICULTY_POLICY } from '../src/config/policy';
import { KnowledgeState, LearningEvidence } from '../src/types/learningOS';

function createEvidence(overrides: Partial<LearningEvidence> = {}): LearningEvidence {
  return {
    id: `ev_${Math.random().toString(36).slice(2)}`,
    learnerId: 'test-child',
    source: 'LESSON',
    skillId: 'vn_alphabet',
    subject: 'tieng-viet',
    timestamp: Date.now(),
    correct: true,
    responseTimeMs: 5000,
    difficulty: 'EASY',
    ...overrides,
  };
}

describe('AdaptiveDifficultyService', () => {
  let service: AdaptiveDifficultyService;

  beforeEach(() => {
    service = new AdaptiveDifficultyService();
  });

  describe('createInitialKnowledgeState', () => {
    it('creates a valid initial state with default level 1', () => {
      const state = service.createInitialKnowledgeState('vn_alphabet', 'Bang Chu Cai', 'tieng-viet');
      expect(state.skillId).toBe('vn_alphabet');
      expect(state.status).toBe('NOT_STARTED');
      expect(state.currentLevel).toBe(1);
      expect(state.independentAttempts).toBe(0);
      expect(state.hintCount).toBe(0);
    });

    it('initializes level history as empty', () => {
      const state = service.createInitialKnowledgeState('test', 'Test', 'toan');
      expect(state.levelHistory).toEqual([]);
    });

    it('initializes retention evidence to zero', () => {
      const state = service.createInitialKnowledgeState('test', 'Test', 'english');
      expect(state.retentionEvidence).toEqual({ correctOnReview: 0, totalReviews: 0 });
    });
  });

  describe('processEvidence', () => {
    it('tracks independent vs assisted attempts', () => {
      const initial = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      const r1 = service.processEvidence(initial, createEvidence({ correct: true, usedHint: false }));
      expect(r1.newState.independentAttempts).toBe(1);
      expect(r1.newState.assistedAttempts).toBe(0);

      const r2 = service.processEvidence(r1.newState, createEvidence({ correct: false, usedHint: true }));
      expect(r2.newState.assistedAttempts).toBe(1);
      expect(r2.newState.independentAttempts).toBe(1);
    });

    it('tracks hint usage count', () => {
      const initial = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      const r1 = service.processEvidence(initial, createEvidence({ usedHint: true }));
      expect(r1.newState.hintCount).toBe(1);

      const r2 = service.processEvidence(r1.newState, createEvidence({ usedHint: true }));
      expect(r2.newState.hintCount).toBe(2);
    });

    it('does not increase difficulty on first success', () => {
      const initial = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      const r1 = service.processEvidence(initial, createEvidence({ correct: true, usedHint: false }));
      expect(r1.newState.currentLevel).toBe(1);
    });

    it('requires minimum independent correct for progression', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      for (let i = 0; i < 2; i++) {
        const r = service.processEvidence(state, createEvidence({ correct: true, usedHint: false }));
        state = r.newState;
      }

      expect(state.currentLevel).toBe(1);
      expect(state.independentCorrect).toBe(2);
    });

    it('progresses after 3 independent correct with 80%+ accuracy', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      for (let i = 0; i < 4; i++) {
        const r = service.processEvidence(state, createEvidence({ correct: true, usedHint: false }));
        state = r.newState;
      }

      expect(state.independentCorrect).toBe(4);
      expect(state.currentLevel).toBe(2);
      expect(state.levelHistory.length).toBeGreaterThan(0);
    });

    it('does not progress with assisted answers', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      for (let i = 0; i < 5; i++) {
        const r = service.processEvidence(state, createEvidence({ correct: true, usedHint: true }));
        state = r.newState;
      }

      expect(state.assistedAttempts).toBe(5);
      expect(state.independentCorrect).toBe(0);
      expect(state.currentLevel).toBe(1);
    });

    it('regresses on consecutive failures', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      for (let i = 0; i < 4; i++) {
        const r = service.processEvidence(state, createEvidence({ correct: true, usedHint: false }));
        state = r.newState;
      }

      expect(state.currentLevel).toBe(2);

      for (let i = 0; i < 3; i++) {
        const r = service.processEvidence(state, createEvidence({ correct: false, usedHint: false }));
        state = r.newState;
      }

      expect(state.currentLevel).toBe(1);
    });

    it('never drops below level 1', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      for (let i = 0; i < 5; i++) {
        const r = service.processEvidence(state, createEvidence({ correct: false, usedHint: false }));
        state = r.newState;
      }

      expect(state.currentLevel).toBe(1);
    });

    it('never exceeds level 5', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      for (let i = 0; i < 30; i++) {
        const r = service.processEvidence(state, createEvidence({ correct: true, usedHint: false }));
        state = r.newState;
      }

      expect(state.currentLevel).toBeLessThanOrEqual(5);
    });

    it('a single mistake does not cause level oscillation', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      for (let i = 0; i < 4; i++) {
        const r = service.processEvidence(state, createEvidence({ correct: true, usedHint: false }));
        state = r.newState;
      }

      const beforeLevel = state.currentLevel;

      const mistake = service.processEvidence(state, createEvidence({ correct: false, usedHint: false }));
      const afterMistakeLevel = mistake.newState.currentLevel;

      expect(afterMistakeLevel).toBeGreaterThanOrEqual(beforeLevel - 1);
    });

    it('tracks misconception categories', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      const r1 = service.processEvidence(state, createEvidence({ correct: false, errorType: 'KNOWLEDGE_GAP' }));
      state = r1.newState;

      const r2 = service.processEvidence(state, createEvidence({ correct: false, errorType: 'KNOWLEDGE_GAP' }));
      state = r2.newState;

      expect(state.misconceptionCategories['KNOWLEDGE_GAP']).toBe(2);
    });

    it('tracks retention evidence from review source', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');

      const r1 = service.processEvidence(state, createEvidence({ source: 'REVIEW', correct: true }));
      state = r1.newState;

      expect(state.retentionEvidence.totalReviews).toBe(1);
      expect(state.retentionEvidence.correctOnReview).toBe(1);

      const r2 = service.processEvidence(state, createEvidence({ source: 'REVIEW', correct: false }));
      state = r2.newState;

      expect(state.retentionEvidence.totalReviews).toBe(2);
      expect(state.retentionEvidence.correctOnReview).toBe(1);
    });
  });

  describe('selectDifficulty', () => {
    it('returns EASY for unknown skills', () => {
      const selection = service.selectDifficulty('unknown_skill', {});
      expect(selection.targetDifficulty).toBe('EASY');
      expect(selection.adaptiveLevel).toBe(1);
      expect(selection.shouldScaffold).toBe(true);
    });

    it('maps level 1-2 to EASY', () => {
      const initial = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');
      const selection = service.selectDifficulty('vn_alphabet', { vn_alphabet: initial });
      expect(selection.targetDifficulty).toBe('EASY');
    });

    it('maps level 3 to MEDIUM', () => {
      const state: KnowledgeState = {
        ...service.createInitialKnowledgeState('vn_alphabet_vowel', 'Bang', 'tieng-viet'),
        currentLevel: 3,
      };
      const selection = service.selectDifficulty('vn_alphabet_vowel', { vn_alphabet_vowel: state });
      expect(selection.targetDifficulty).toBe('MEDIUM');
    });

    it('maps level 4 to HARD', () => {
      const state: KnowledgeState = {
        ...service.createInitialKnowledgeState('vn_alphabet_vowel', 'Bang', 'tieng-viet'),
        currentLevel: 4,
      };
      const selection = service.selectDifficulty('vn_alphabet_vowel', { vn_alphabet_vowel: state });
      expect(selection.targetDifficulty).toBe('HARD');
    });

    it('maps level 5 to CHALLENGE', () => {
      const state: KnowledgeState = {
        ...service.createInitialKnowledgeState('vn_alphabet_vowel', 'Bang', 'tieng-viet'),
        currentLevel: 5,
      };
      const selection = service.selectDifficulty('vn_alphabet_vowel', { vn_alphabet_vowel: state });
      expect(selection.targetDifficulty).toBe('CHALLENGE');
    });

    it('scaffolds when consecutive incorrect >= 2', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');
      for (let i = 0; i < 3; i++) {
        const r = service.processEvidence(state, createEvidence({ correct: false, usedHint: false }));
        state = r.newState;
      }

      const selection = service.selectDifficulty('vn_alphabet', { vn_alphabet: state });
      expect(selection.shouldScaffold).toBe(true);
      expect(selection.scaffoldingHint).toBeTruthy();
    });
  });

  describe('getSkillProfile', () => {
    it('returns null for unknown skill', () => {
      const profile = service.getSkillProfile('unknown', {});
      expect(profile).toBeNull();
    });

    it('returns a valid profile for known skill', () => {
      const state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');
      const profile = service.getSkillProfile('vn_alphabet', { vn_alphabet: state });

      expect(profile).not.toBeNull();
      expect(profile!.skillId).toBe('vn_alphabet');
      expect(profile!.currentLevel).toBe(1);
      expect(profile!.totalAttempts).toBe(0);
    });

    it('includes misconception categories in profile', () => {
      let state = service.createInitialKnowledgeState('vn_alphabet', 'Bang', 'tieng-viet');
      const r = service.processEvidence(state, createEvidence({ correct: false, errorType: 'CARELESS_ERROR' }));
      state = r.newState;

      const profile = service.getSkillProfile('vn_alphabet', { vn_alphabet: state });
      expect(profile!.misconceptionCategories['CARELESS_ERROR']).toBe(1);
    });
  });

  describe('getReviewQuestions', () => {
    it('returns empty arrays for empty knowledge map', () => {
      const result = service.getReviewQuestions({}, 5);
      expect(result.questionIds).toEqual([]);
      expect(result.focusSkills).toEqual([]);
    });

    it('includes mastered skills with due review', () => {
      const now = Date.now();
      const state: KnowledgeState = {
        ...service.createInitialKnowledgeState('vn_alphabet_vowel', 'Bang', 'tieng-viet'),
        status: 'MASTERED',
        nextReviewAt: now - 1000,
      };

      const result = service.getReviewQuestions({ vn_alphabet_vowel: state }, 5);
      expect(result.questionIds.length).toBeGreaterThan(0);
      expect(result.focusSkills).toContain('vn_alphabet_vowel');
    });

    it('includes weak skills in focus', () => {
      const now = Date.now();
      const state: KnowledgeState = {
        ...service.createInitialKnowledgeState('math_counting_10', 'Dem', 'toan'),
        status: 'NEEDS_REVIEW',
        recentAccuracy: 30,
        nextReviewAt: now - 1000,
      };

      const result = service.getReviewQuestions({ math_counting_10: state }, 5);
      expect(result.focusSkills).toContain('math_counting_10');
    });
  });

  describe('ADAPTIVE_DIFFICULTY_POLICY', () => {
    it('has correct progression thresholds', () => {
      expect(ADAPTIVE_DIFFICULTY_POLICY.PROGRESSION_ACCURACY_THRESHOLD).toBe(80);
      expect(ADAPTIVE_DIFFICULTY_POLICY.REGRESSION_ACCURACY_THRESHOLD).toBe(50);
      expect(ADAPTIVE_DIFFICULTY_POLICY.MIN_INDEPENDENT_FOR_PROGRESSION).toBe(3);
    });

    it('has correct level mapping', () => {
      expect(ADAPTIVE_DIFFICULTY_POLICY.LEVEL_TO_EVIDENCE[1]).toBe('EASY');
      expect(ADAPTIVE_DIFFICULTY_POLICY.LEVEL_TO_EVIDENCE[3]).toBe('MEDIUM');
      expect(ADAPTIVE_DIFFICULTY_POLICY.LEVEL_TO_EVIDENCE[4]).toBe('HARD');
      expect(ADAPTIVE_DIFFICULTY_POLICY.LEVEL_TO_EVIDENCE[5]).toBe('CHALLENGE');
    });

    it('has support trigger at 2 consecutive incorrect', () => {
      expect(ADAPTIVE_DIFFICULTY_POLICY.SUPPORT_TRIGGER_CONSECUTIVE_INCORRECT).toBe(2);
    });
  });
});
