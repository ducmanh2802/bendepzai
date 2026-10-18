import { describe, it, expect, beforeEach } from 'vitest';
import { SessionComposer } from '../src/services/sessionComposer';
import { SESSION_PROFILE_POLICY } from '../src/config/policy';
import { SessionProfileKind, SessionState } from '../src/types';

describe('SessionComposer', () => {
  let composer: SessionComposer;

  beforeEach(() => {
    composer = new SessionComposer();
  });

  describe('getProfile', () => {
    it('returns correct targets for QUICK profile', () => {
      const profile = composer.getProfile('QUICK');
      expect(profile.targetQuestions).toBe(SESSION_PROFILE_POLICY.QUICK.targetQuestions);
      expect(profile.minQuestions).toBe(SESSION_PROFILE_POLICY.QUICK.minQuestions);
      expect(profile.maxQuestions).toBe(SESSION_PROFILE_POLICY.QUICK.maxQuestions);
    });

    it('returns correct targets for STANDARD profile', () => {
      const profile = composer.getProfile('STANDARD');
      expect(profile.targetQuestions).toBe(18);
    });

    it('returns correct targets for DEEP profile', () => {
      const profile = composer.getProfile('DEEP');
      expect(profile.targetQuestions).toBe(28);
    });

    it('returns correct targets for EXTENDED profile', () => {
      const profile = composer.getProfile('EXTENDED');
      expect(profile.targetQuestions).toBe(38);
    });

    it('all profiles have 20/35/25/20 composition', () => {
      const kinds: SessionProfileKind[] = ['QUICK', 'STANDARD', 'DEEP', 'EXTENDED'];
      for (const kind of kinds) {
        const profile = composer.getProfile(kind);
        expect(profile.composition.foundation).toBe(0.2);
        expect(profile.composition.currentSkill).toBe(0.35);
        expect(profile.composition.challenging).toBe(0.25);
        expect(profile.composition.spacedReview).toBe(0.2);
      }
    });

    it('all profiles allow early finish', () => {
      const kinds: SessionProfileKind[] = ['QUICK', 'STANDARD', 'DEEP', 'EXTENDED'];
      for (const kind of kinds) {
        expect(composer.getProfile(kind).allowEarlyFinish).toBe(true);
      }
    });

    it('all profiles are parent configurable', () => {
      const kinds: SessionProfileKind[] = ['QUICK', 'STANDARD', 'DEEP', 'EXTENDED'];
      for (const kind of kinds) {
        expect(composer.getProfile(kind).parentConfigurable).toBe(true);
      }
    });
  });

  describe('composeSession', () => {
    it('produces a valid session with questions', () => {
      const session = composer.composeSession('QUICK', ['vn_alphabet_vowel'], {});
      expect(session.questionIds.length).toBeGreaterThan(0);
      expect(session.profile.kind).toBe('QUICK');
    });

    it('does not contain duplicate questions', () => {
      const session = composer.composeSession('STANDARD', ['vn_alphabet_vowel', 'math_counting_10'], {});
      const uniqueIds = [...new Set(session.questionIds)];
      expect(uniqueIds.length).toBe(session.questionIds.length);
    });

    it('reports shortfall when not enough questions', () => {
      const session = composer.composeSession('EXTENDED', ['vn_alphabet_vowel'], {});
      expect(session.shortfall).toBeGreaterThan(0);
      expect(session.warnings.length).toBeGreaterThan(0);
    });

    it('includes checkpoints for longer sessions', () => {
      const skills = ['vn_alphabet_vowel', 'vn_reading_comprehension', 'math_counting_10', 'math_addition_10'];
      const session = composer.composeSession('DEEP', skills, {});
      expect(session.questionIds.length).toBeGreaterThanOrEqual(10);
      expect(session.checkpoints.length).toBeGreaterThan(0);
    });

    it('STANDARD has more or equal questions than QUICK', () => {
      const skills = ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'];
      const quick = composer.composeSession('QUICK', skills, {});
      const standard = composer.composeSession('STANDARD', skills, {});
      expect(standard.questionIds.length).toBeGreaterThanOrEqual(quick.questionIds.length);
    });

    it('DEEP has more or equal questions than STANDARD', () => {
      const skills = ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'];
      const standard = composer.composeSession('STANDARD', skills, {});
      const deep = composer.composeSession('DEEP', skills, {});
      expect(deep.questionIds.length).toBeGreaterThanOrEqual(standard.questionIds.length);
    });
  });

  describe('createSessionState', () => {
    it('creates initial session state', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      expect(state.currentIndex).toBe(0);
      expect(state.correctCount).toBe(0);
      expect(state.incorrectCount).toBe(0);
      expect(state.isCompleted).toBe(false);
      expect(state.isPaused).toBe(false);
    });
  });

  describe('advanceSession', () => {
    it('advances index on correct answer', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      const advanced = composer.advanceSession(state, true, false);
      expect(advanced.currentIndex).toBe(1);
      expect(advanced.correctCount).toBe(1);
      expect(advanced.incorrectCount).toBe(0);
    });

    it('advances index on incorrect answer', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      const advanced = composer.advanceSession(state, false, false);
      expect(advanced.currentIndex).toBe(1);
      expect(advanced.correctCount).toBe(0);
      expect(advanced.incorrectCount).toBe(1);
    });

    it('tracks hint usage', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      const advanced = composer.advanceSession(state, true, true);
      expect(advanced.hintsUsed).toBe(1);
    });

    it('marks session complete when all questions answered', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      let current = state;
      for (let i = 0; i < state.questions.length; i++) {
        current = composer.advanceSession(current, true, false);
      }

      expect(current.isCompleted).toBe(true);
    });
  });

  describe('pause/resume', () => {
    it('pauses session', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      const paused = composer.pauseSession(state);
      expect(paused.isPaused).toBe(true);
    });

    it('resumes paused session', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      const paused = composer.pauseSession(state);
      const resumed = composer.resumeSession(paused);
      expect(resumed.isPaused).toBe(false);
    });
  });

  describe('canFinishEarly', () => {
    it('allows early finish after 60% completion', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      let current = state;
      const sixtyPercent = Math.ceil(state.questions.length * 0.6);
      for (let i = 0; i < sixtyPercent; i++) {
        current = composer.advanceSession(current, true, false);
      }

      expect(composer.canFinishEarly(current)).toBe(true);
    });

    it('does not allow early finish before 60%', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      const advanced = composer.advanceSession(state, true, false);
      expect(composer.canFinishEarly(advanced)).toBe(false);
    });
  });

  describe('getProgress', () => {
    it('returns accurate progress', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      const advanced = composer.advanceSession(state, true, false);
      const progress = composer.getProgress(advanced);

      expect(progress.answered).toBe(1);
      expect(progress.total).toBe(state.questions.length);
      expect(progress.percentage).toBe(Math.round((1 / state.questions.length) * 100));
    });
  });

  describe('recordCheckpoint', () => {
    it('records checkpoint at question boundary', () => {
      const composed = composer.composeSession('QUICK', ['vn_alphabet_vowel', 'math_counting_10', 'eng_letters_phonics'], {});
      const state = composer.createSessionState(composed);

      let current = state;
      for (let i = 0; i < 5; i++) {
        current = composer.advanceSession(current, i < 3, false);
      }

      const withCheckpoint = composer.recordCheckpoint(current);
      expect(withCheckpoint.checkpointResults.length).toBe(1);
      expect(withCheckpoint.checkpointResults[0].afterQuestion).toBe(5);
      expect(withCheckpoint.checkpointResults[0].correctCount).toBe(3);
    });
  });
});

describe('SESSION_PROFILE_POLICY', () => {
  it('QUICK profile targets 8-10 questions', () => {
    expect(SESSION_PROFILE_POLICY.QUICK.minQuestions).toBe(8);
    expect(SESSION_PROFILE_POLICY.QUICK.maxQuestions).toBe(10);
  });

  it('STANDARD profile targets 15-20 questions', () => {
    expect(SESSION_PROFILE_POLICY.STANDARD.minQuestions).toBe(15);
    expect(SESSION_PROFILE_POLICY.STANDARD.maxQuestions).toBe(20);
  });

  it('DEEP profile targets 25-30 questions', () => {
    expect(SESSION_PROFILE_POLICY.DEEP.minQuestions).toBe(25);
    expect(SESSION_PROFILE_POLICY.DEEP.maxQuestions).toBe(30);
  });

  it('EXTENDED profile targets 35-40 questions', () => {
    expect(SESSION_PROFILE_POLICY.EXTENDED.minQuestions).toBe(35);
    expect(SESSION_PROFILE_POLICY.EXTENDED.maxQuestions).toBe(40);
  });
});
