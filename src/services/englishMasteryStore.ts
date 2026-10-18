/**
 * ENGLISH MASTERY STORE & PERSISTENCE — P32
 *
 * Implements hardened, resilient persistence for English skill mastery:
 * - LocalStorage persistence with versioning & auto-recovery
 * - Seamless integration with StorageService
 * - In-memory fallback cache for Node/SSR/private browsing environments
 * - Defends against corruption, missing fields, or empty data
 */

import type {
  EnglishAnswerSubmission,
  EnglishLearnerProfile,
  EnglishMasteryState,
  EnglishSkillType,
} from '../types/englishMastery';
import { readJSONObject, writeJSON } from './storage';
import { EnglishMasteryEngine } from './englishMasteryEngine';
import { CANONICAL_ENGLISH_SKILLS } from '../data/englishSkillTaxonomy';

export const ENGLISH_MASTERY_STORE_KEY = 'kho_bau_english_mastery_store';
export const ENGLISH_MASTERY_STORE_VERSION = 'eng-mastery-v1';

export interface EnglishMasteryStorePayload {
  version: string;
  skills: Record<string, EnglishMasteryState>;
  updatedAt: string;
}

export class EnglishMasteryStore {
  private static memoryCache: Record<string, EnglishMasteryState> = {};

  /**
   * Loads all English mastery states defensively
   */
  public static getAllStates(): Record<string, EnglishMasteryState> {
    const raw = readJSONObject(ENGLISH_MASTERY_STORE_KEY);
    if (!raw || typeof raw !== 'object') {
      return { ...this.memoryCache };
    }

    const payload = raw as unknown as EnglishMasteryStorePayload;
    if (!payload.skills || typeof payload.skills !== 'object') {
      return { ...this.memoryCache };
    }

    const sanitized: Record<string, EnglishMasteryState> = {};
    for (const [skillId, state] of Object.entries(payload.skills)) {
      if (state && typeof state === 'object' && typeof state.skillId === 'string') {
        sanitized[skillId] = {
          ...EnglishMasteryEngine.createInitialState(skillId, state.skillType),
          ...state,
        };
      }
    }

    this.memoryCache = sanitized;
    return sanitized;
  }

  /**
   * Persists all English mastery states
   */
  public static saveAllStates(skills: Record<string, EnglishMasteryState>): void {
    this.memoryCache = { ...skills };
    const payload: EnglishMasteryStorePayload = {
      version: ENGLISH_MASTERY_STORE_VERSION,
      skills,
      updatedAt: new Date().toISOString(),
    };
    writeJSON(ENGLISH_MASTERY_STORE_KEY, payload);
  }

  /**
   * Retrieves the mastery state for a specific skill, or initializes if missing
   */
  public static getState(skillId: string, skillType?: EnglishSkillType): EnglishMasteryState {
    const states = this.getAllStates();
    if (states[skillId]) {
      return states[skillId];
    }

    // Lookup skill type from taxonomy if not provided
    const descriptor = CANONICAL_ENGLISH_SKILLS.find((s) => s.skillId === skillId);
    const resolvedType = skillType || descriptor?.category || 'general';

    const initial = EnglishMasteryEngine.createInitialState(skillId, resolvedType);
    states[skillId] = initial;
    this.saveAllStates(states);
    return initial;
  }

  /**
   * Records an answer submission, computes the next state, and persists
   */
  public static recordAnswer(
    submission: EnglishAnswerSubmission,
    now: Date = new Date()
  ): EnglishMasteryState {
    const states = this.getAllStates();
    const currentState =
      states[submission.skillId] ||
      EnglishMasteryEngine.createInitialState(submission.skillId, 'general', now);

    const updatedState = EnglishMasteryEngine.processAnswer(currentState, submission, now);
    states[submission.skillId] = updatedState;
    this.saveAllStates(states);

    return updatedState;
  }

  /**
   * Generates a high-level summary of the learner's English mastery
   */
  public static getLearnerProfile(learnerId = 'default-learner'): EnglishLearnerProfile {
    const states = this.getAllStates();
    const skillsList = Object.values(states);

    let totalScore = 0;
    let masteredCount = 0;
    let inProgressCount = 0;
    let needsReviewCount = 0;

    for (const s of skillsList) {
      totalScore += s.masteryScore;
      if (s.level === 'MASTERED') masteredCount++;
      else if (s.status === 'NEEDS_REVIEW') needsReviewCount++;
      else if (s.level !== 'NOVICE') inProgressCount++;
    }

    const overallMastery =
      skillsList.length > 0 ? Math.round(totalScore / skillsList.length) : 0;

    return {
      learnerId,
      skills: states,
      overallMastery,
      masteredCount,
      inProgressCount,
      needsReviewCount,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Resets all English mastery data (used for clean resets / testing)
   */
  public static clear(): void {
    this.memoryCache = {};
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ENGLISH_MASTERY_STORE_KEY);
      }
    } catch {
      // ignore
    }
  }
}
