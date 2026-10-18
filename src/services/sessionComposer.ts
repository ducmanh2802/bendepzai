import { KnowledgeState, SessionProfile, SessionProfileKind, SessionState, SubjectType } from '../types';
import { SESSION_PROFILE_POLICY, SKILL_PREREQUISITES } from '../config/policy';
import { getAllQuestions } from '../data/curriculum';
import { levelToQuestionDifficulty, seededRandom } from './adaptiveDifficulty';
import type { Question } from '../types';

export interface ComposedSession {
  questionIds: string[];
  profile: SessionProfile;
  checkpoints: { afterQuestion: number; label: string }[];
  composition: {
    foundation: string[];
    currentSkill: string[];
    challenging: string[];
    spacedReview: string[];
  };
  shortfall: number;
  warnings: string[];
}

export class SessionComposer {
  private static instance: SessionComposer;

  static getInstance(): SessionComposer {
    if (!SessionComposer.instance) {
      SessionComposer.instance = new SessionComposer();
    }
    return SessionComposer.instance;
  }

  getProfile(kind: SessionProfileKind): SessionProfile {
    const p = SESSION_PROFILE_POLICY[kind];
    return {
      kind,
      targetQuestions: p.targetQuestions,
      minQuestions: p.minQuestions,
      maxQuestions: p.maxQuestions,
      composition: { ...p.composition },
      checkpointInterval: p.checkpointInterval,
      allowEarlyFinish: p.allowEarlyFinish,
      parentConfigurable: p.parentConfigurable,
    };
  }

  composeSession(
    kind: SessionProfileKind,
    focusSkillIds: string[],
    knowledgeMap: Record<string, KnowledgeState>,
    options: { seed?: number; subject?: SubjectType } = {}
  ): ComposedSession {
    const profile = this.getProfile(kind);
    const allQuestions = getAllQuestions();
    const warnings: string[] = [];

    const foundationCount = Math.round(profile.targetQuestions * profile.composition.foundation);
    const currentSkillCount = Math.round(profile.targetQuestions * profile.composition.currentSkill);
    const challengingCount = Math.round(profile.targetQuestions * profile.composition.challenging);
    const spacedReviewCount = Math.round(profile.targetQuestions * profile.composition.spacedReview);

    // Session-level seed for reproducible but varied sessions.
    const sessionSeed = options.seed ?? Date.now();

    const foundation = this.selectFoundationQuestions(foundationCount, focusSkillIds, knowledgeMap, allQuestions, sessionSeed);
    const currentSkill = this.selectCurrentSkillQuestions(currentSkillCount, focusSkillIds, knowledgeMap, allQuestions, sessionSeed);
    const challenging = this.selectChallengingQuestions(challengingCount, focusSkillIds, knowledgeMap, allQuestions, sessionSeed);
    const spacedReview = this.selectSpacedReviewQuestions(spacedReviewCount, knowledgeMap, allQuestions, sessionSeed);

    // Interleave selections to mix difficulty and skills (avoids blocks of same type).
    const allIds = this.interleaveSelections(
      [foundation, currentSkill, challenging, spacedReview],
      profile.targetQuestions
    );

    const shortfall = Math.max(0, profile.targetQuestions - allIds.length);
    if (shortfall > 0) {
      warnings.push(`Chỉ tìm thấy ${allIds.length}/${profile.targetQuestions} câu hỏi phù hợp`);
    }

    const checkpoints: { afterQuestion: number; label: string }[] = [];
    for (let i = profile.checkpointInterval; i < allIds.length; i += profile.checkpointInterval) {
      checkpoints.push({ afterQuestion: i, label: `Mốc ${checkpoints.length + 1}` });
    }

    return {
      questionIds: allIds,
      profile,
      checkpoints,
      composition: { foundation, currentSkill, challenging, spacedReview },
      shortfall,
      warnings,
    };
  }

  /**
   * Round-robin interleaves multiple question id arrays, respecting the
   * target total and removing duplicates.
   */
  private interleaveSelections(categories: string[][], target: number): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    const iterators = categories.map((cat) => cat[Symbol.iterator]());
    let progress = true;

    while (progress && result.length < target) {
      progress = false;
      for (const it of iterators) {
        if (result.length >= target) break;
        const next = it.next();
        if (!next.done && !seen.has(next.value)) {
          seen.add(next.value);
          result.push(next.value);
          progress = true;
        }
      }
    }
    return result;
  }

  createSessionState(composed: ComposedSession): SessionState {
    return {
      profileKind: composed.profile.kind,
      questions: composed.questionIds,
      currentIndex: 0,
      correctCount: 0,
      incorrectCount: 0,
      hintsUsed: 0,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      isPaused: false,
      isCompleted: false,
      checkpointResults: [],
    };
  }

  advanceSession(state: SessionState, isCorrect: boolean, usedHint: boolean): SessionState {
    const updated = { ...state };
    updated.currentIndex = state.currentIndex + 1;
    updated.lastUpdatedAt = Date.now();

    if (isCorrect) {
      updated.correctCount = state.correctCount + 1;
    } else {
      updated.incorrectCount = state.incorrectCount + 1;
    }

    if (usedHint) {
      updated.hintsUsed = state.hintsUsed + 1;
    }

    if (state.questions.length > 0 && updated.currentIndex >= state.questions.length) {
      updated.isCompleted = true;
    }

    return updated;
  }

  recordCheckpoint(state: SessionState): SessionState {
    return {
      ...state,
      checkpointResults: [
        ...state.checkpointResults,
        {
          afterQuestion: state.currentIndex,
          correctCount: state.correctCount,
          totalSoFar: state.currentIndex,
        },
      ],
    };
  }

  pauseSession(state: SessionState): SessionState {
    return { ...state, isPaused: true, lastUpdatedAt: Date.now() };
  }

  resumeSession(state: SessionState): SessionState {
    return { ...state, isPaused: false, lastUpdatedAt: Date.now() };
  }

  canFinishEarly(state: SessionState): boolean {
    if (state.questions.length === 0) return false;
    return state.currentIndex >= Math.ceil(state.questions.length * 0.6);
  }

  getProgress(state: SessionState): { answered: number; total: number; percentage: number } {
    return {
      answered: state.currentIndex,
      total: state.questions.length,
      percentage: Math.round((state.currentIndex / state.questions.length) * 100),
    };
  }

  private selectFoundationQuestions(
    count: number,
    focusSkillIds: string[],
    knowledgeMap: Record<string, KnowledgeState>,
    allQuestions: Question[],
    seed: number
  ): string[] {
    const prerequisiteSkills = this.getPrerequisiteSkills(focusSkillIds);
    const candidates = allQuestions.filter(
      (q) => prerequisiteSkills.includes(q.skillId) && q.difficulty === 1
    );

    return this.deterministicPick(candidates, count, seed, 'foundation');
  }

  private selectCurrentSkillQuestions(
    count: number,
    focusSkillIds: string[],
    knowledgeMap: Record<string, KnowledgeState>,
    allQuestions: Question[],
    seed: number
  ): string[] {
    const candidates = allQuestions.filter(
      (q) => focusSkillIds.includes(q.skillId)
    );

    const sorted = candidates.sort((a, b) => {
      const aState = knowledgeMap[a.skillId];
      const bState = knowledgeMap[b.skillId];
      const aLevel = aState?.currentLevel || 1;
      const bLevel = bState?.currentLevel || 1;
      const aDiff = Math.abs(a.difficulty - levelToQuestionDifficulty(aLevel));
      const bDiff = Math.abs(b.difficulty - levelToQuestionDifficulty(bLevel));
      return aDiff - bDiff;
    });

    return this.deterministicPick(sorted, count, seed, 'current');
  }

  private selectChallengingQuestions(
    count: number,
    focusSkillIds: string[],
    knowledgeMap: Record<string, KnowledgeState>,
    allQuestions: Question[],
    seed: number
  ): string[] {
    const candidates = allQuestions.filter(
      (q) => focusSkillIds.includes(q.skillId) && q.difficulty >= 2
    );

    const sorted = candidates.sort((a, b) => {
      const aState = knowledgeMap[a.skillId];
      const bState = knowledgeMap[b.skillId];
      const aLevel = aState?.currentLevel || 1;
      const bLevel = bState?.currentLevel || 1;
      return bLevel - aLevel;
    });

    return this.deterministicPick(sorted, count, seed, 'challenging');
  }

  private selectSpacedReviewQuestions(
    count: number,
    knowledgeMap: Record<string, KnowledgeState>,
    allQuestions: Question[],
    seed: number
  ): string[] {
    const now = Date.now();
    const reviewSkills = Object.values(knowledgeMap)
      .filter((s) => s.status === 'MASTERED' && s.nextReviewAt && s.nextReviewAt <= now)
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));

    const ids: string[] = [];
    for (const skill of reviewSkills) {
      if (ids.length >= count) break;
      const skillQs = allQuestions.filter((q) => q.skillId === skill.skillId);
      if (skillQs.length > 0) {
        ids.push(skillQs[0].id);
      }
    }

    if (ids.length < count) {
      const practicingSkills = Object.values(knowledgeMap)
        .filter((s) => s.status === 'PRACTICING' || s.status === 'LEARNING')
        .sort((a, b) => a.recentAccuracy - b.recentAccuracy);

      for (const skill of practicingSkills) {
        if (ids.length >= count) break;
        const skillQs = allQuestions.filter((q) => q.skillId === skill.skillId && !ids.includes(q.id));
        if (skillQs.length > 0) {
          ids.push(skillQs[0].id);
        }
      }
    }

    return ids.slice(0, count);
  }

  private getPrerequisiteSkills(focusSkillIds: string[]): string[] {
    const prerequisites: string[] = [];

    for (const skillId of focusSkillIds) {
      const prereqs = SKILL_PREREQUISITES[skillId];
      if (prereqs && prereqs.length > 0) {
        prerequisites.push(...prereqs);
      }
    }

    if (prerequisites.length === 0) {
      return focusSkillIds.slice(0, 2);
    }

    return [...new Set(prerequisites)];
  }

  private deterministicPick(
    candidates: Question[],
    count: number,
    seed: number,
    category: string
  ): string[] {
    if (candidates.length <= count) {
      return candidates.map((q) => q.id);
    }

    const combinedSeed = seed * 31 + category.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const rng = seededRandom(combinedSeed);

    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count).map((q) => q.id);
  }
}

export const sessionComposer = SessionComposer.getInstance();
