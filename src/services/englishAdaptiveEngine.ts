/**
 * ENGLISH ADAPTIVE ENGINE — TARGETED PRACTICE & ADAPTIVE SELECTION
 *
 * Implements:
 * - Deterministic Question Selection based on real mastery evidence
 * - Difficulty Ladder: D1 (Recognition) → D2 (Recall) → D3 (Application) → D4 (Comprehension) → D5 (Starters Challenge)
 * - Pedagogical Prioritization:
 *     1. Due for Spaced Review (NEEDS_REVIEW)
 *     2. Remediation & Weak Skill Recovery (REMEDIAL / High Errors)
 *     3. Active Progression (LEARNING / PRACTICING)
 *     4. Validation Candidate (CANDIDATE_MASTERED)
 *     5. Pristine Curriculum Exploration (NOVICE)
 * - Absolute Anti-Randomness Rule:
 *     NO Math.random() for difficulty, skill, or learning path decision.
 *     Deterministic sorting with anti-repetition guards.
 */

import type { Question } from '../types';
import type {
  AdaptiveQuestionRecommendation,
  AdaptiveSelectionCriteria,
  EnglishAdaptiveSession,
  EnglishDifficultyLevel,
  EnglishMasteryState,
  EnglishSkillDescriptor,
} from '../types/englishMastery';
import {
  CANONICAL_ENGLISH_SKILLS,
  inferQuestionDifficulty,
  resolveEnglishSkill,
} from '../data/englishSkillTaxonomy';
import { getAllQuestions } from '../data/curriculum';
import { EnglishMasteryEngine, MASTERY_CONSTANTS } from './englishMasteryEngine';

export class EnglishAdaptiveEngine {
  /**
   * Retrieves all English questions available in the curriculum bank
   */
  public static getEnglishQuestionBank(): Question[] {
    return getAllQuestions().filter((q) => q.subject === 'english');
  }

  /**
   * Selects the next pedagogical target skill deterministically
   */
  public static selectTargetSkill(
    masteryMap: Record<string, EnglishMasteryState>,
    now: Date = new Date()
  ): { targetSkill: EnglishSkillDescriptor; reason: string; sessionType: EnglishAdaptiveSession['sessionType'] } {
    const nowISO = now.toISOString();

    // 1. Spaced Review Priority: Mastered or Stable skills that are due for review
    for (const desc of CANONICAL_ENGLISH_SKILLS) {
      const state = masteryMap[desc.skillId];
      if (state && (state.status === 'NEEDS_REVIEW' || (state.nextReviewAt && state.nextReviewAt <= nowISO))) {
        return {
          targetSkill: desc,
          reason: `Kỹ năng "${desc.skillName}" đến hạn ôn tập định kỳ để củng cố trí nhớ dài hạn.`,
          sessionType: 'SPACED_REVIEW',
        };
      }
    }

    // 2. Remediation Priority: Skills with high error rate or marked remedial
    for (const desc of CANONICAL_ENGLISH_SKILLS) {
      const state = masteryMap[desc.skillId];
      if (state && (state.status === 'REMEDIAL' || state.remediationNeeded || state.consecutiveErrors >= 2)) {
        return {
          targetSkill: desc,
          reason: `Bé gặp khó khăn ở kỹ năng "${desc.skillName}". Cần phiên luyện tập phục hồi (Remediation).`,
          sessionType: 'REMEDIATION',
        };
      }
    }

    // 3. Validation Priority: Skills ready to prove mastery
    for (const desc of CANONICAL_ENGLISH_SKILLS) {
      const state = masteryMap[desc.skillId];
      if (state && state.status === 'CANDIDATE_MASTERED') {
        return {
          targetSkill: desc,
          reason: `Kỹ năng "${desc.skillName}" đạt phong độ xuất sắc. Sẵn sàng cho bài kiểm chứng Mastery!`,
          sessionType: 'VALIDATION',
        };
      }
    }

    // 4. In-Progress Skills: PRACTICING or LEARNING
    for (const desc of CANONICAL_ENGLISH_SKILLS) {
      const state = masteryMap[desc.skillId];
      if (state && (state.level === 'PRACTICING' || state.level === 'LEARNING')) {
        return {
          targetSkill: desc,
          reason: `Đang phát triển kỹ năng "${desc.skillName}" (Cấp độ: ${state.level}).`,
          sessionType: 'TARGETED_PRACTICE',
        };
      }
    }

    // 5. Unexplored Skills: NOVICE / NOT_STARTED
    for (const desc of CANONICAL_ENGLISH_SKILLS) {
      const state = masteryMap[desc.skillId];
      if (!state || state.level === 'NOVICE' || state.status === 'NOT_STARTED') {
        return {
          targetSkill: desc,
          reason: `Khám phá kỹ năng mới: "${desc.skillName}".`,
          sessionType: 'DIAGNOSTIC',
        };
      }
    }

    // 6. Fallback: First canonical skill for maintenance
    const defaultSkill = CANONICAL_ENGLISH_SKILLS[0];
    return {
      targetSkill: defaultSkill,
      reason: `Ôn tập duy trì phản xạ cho "${defaultSkill.skillName}".`,
      sessionType: 'TARGETED_PRACTICE',
    };
  }

  /**
   * Calculates the exact pedagogical target difficulty for a skill without randomness
   */
  public static calculateTargetDifficulty(
    state?: EnglishMasteryState,
    sessionType: EnglishAdaptiveSession['sessionType'] = 'TARGETED_PRACTICE'
  ): EnglishDifficultyLevel {
    if (!state) return 1;

    // Remediation drops difficulty to rebuild child confidence
    if (sessionType === 'REMEDIATION' || state.remediationNeeded || state.consecutiveErrors >= 2) {
      return Math.max(1, state.difficulty - 1) as EnglishDifficultyLevel;
    }

    // Validation requires high difficulty evidence (D4 or D5)
    if (sessionType === 'VALIDATION' || state.status === 'CANDIDATE_MASTERED') {
      return Math.max(4, state.difficulty) as EnglishDifficultyLevel;
    }

    // If recent performance is very strong, advance
    if (state.streak >= 3 && state.recentAccuracy >= 80) {
      return Math.min(5, state.difficulty + 1) as EnglishDifficultyLevel;
    }

    return state.difficulty;
  }

  /**
   * Recommends the optimal next question deterministically
   */
  public static recommendQuestion(
    masteryMap: Record<string, EnglishMasteryState>,
    criteria: AdaptiveSelectionCriteria = {},
    allQuestions: Question[] = this.getEnglishQuestionBank(),
    now: Date = new Date()
  ): AdaptiveQuestionRecommendation | null {
    // 1. Resolve Target Skill
    let targetSkillDesc: EnglishSkillDescriptor;
    let sessionType: EnglishAdaptiveSession['sessionType'] = criteria.sessionType || 'TARGETED_PRACTICE';
    let pedagogicalReason = '';

    if (criteria.targetSkillId) {
      const found = CANONICAL_ENGLISH_SKILLS.find((s) => s.skillId === criteria.targetSkillId);
      if (found) {
        targetSkillDesc = found;
        pedagogicalReason = `Luyện tập kỹ năng được chỉ định: ${found.skillName}`;
      } else {
        const selection = this.selectTargetSkill(masteryMap, now);
        targetSkillDesc = selection.targetSkill;
        sessionType = selection.sessionType;
        pedagogicalReason = selection.reason;
      }
    } else {
      const selection = this.selectTargetSkill(masteryMap, now);
      targetSkillDesc = selection.targetSkill;
      sessionType = selection.sessionType;
      pedagogicalReason = selection.reason;
    }

    const currentState = masteryMap[targetSkillDesc.skillId];

    // 2. Resolve Target Difficulty (Deterministic)
    const targetDifficulty: EnglishDifficultyLevel =
      criteria.preferredDifficulty ?? this.calculateTargetDifficulty(currentState, sessionType);

    // 3. Find candidate questions in the bank
    const excludeIds = new Set(criteria.excludeQuestionIds || []);

    const matchingCandidates = allQuestions.filter((q) => {
      if (excludeIds.has(q.id)) return false;
      const skill = resolveEnglishSkill(q);
      return skill.skillId === targetSkillDesc.skillId;
    });

    // Score candidates deterministically
    const scoredCandidates = matchingCandidates.map((q) => {
      const diff = inferQuestionDifficulty(q);
      const diffDistance = Math.abs(diff - targetDifficulty);
      const hasRecentError = currentState?.recentErrors.includes(q.id) ? 1 : 0;
      const alreadyAttempted = currentState?.recentHistory.some((h) => h.questionId === q.id) ? 1 : 0;

      // Ranking score (lower = better fit):
      // - exact difficulty match has penalty 0, diffDistance * 10
      // - unseen questions preferred (alreadyAttempted * 5)
      // - questions child previously failed given priority for remediation (-hasRecentError * 3)
      const rankScore = diffDistance * 10 + alreadyAttempted * 5 - hasRecentError * 3;

      return { question: q, rankScore, diff };
    });

    // Deterministic sort: lowest rankScore first, tie-breaker by question ID
    scoredCandidates.sort((a, b) => {
      if (a.rankScore !== b.rankScore) return a.rankScore - b.rankScore;
      return a.question.id.localeCompare(b.question.id);
    });

    let selected = scoredCandidates[0]?.question;

    // Fallback: If no candidate matched the exact skill, broaden to category
    if (!selected) {
      const categoryCandidates = allQuestions.filter((q) => {
        if (excludeIds.has(q.id)) return false;
        const skill = resolveEnglishSkill(q);
        return skill.category === targetSkillDesc.category;
      });

      categoryCandidates.sort((a, b) => a.id.localeCompare(b.id));
      selected = categoryCandidates[0];
    }

    // Absolute fallback: Any unseen English question
    if (!selected) {
      const generalCandidates = allQuestions.filter((q) => !excludeIds.has(q.id));
      selected = generalCandidates[0] || allQuestions[0];
    }

    if (!selected) return null;

    const actualDiff = inferQuestionDifficulty(selected);
    const diffCode = `D${actualDiff}` as const;

    const isRemediation = sessionType === 'REMEDIATION' || Boolean(currentState?.remediationNeeded);
    const isValidation = sessionType === 'VALIDATION' || currentState?.status === 'CANDIDATE_MASTERED';
    const isReview = sessionType === 'SPACED_REVIEW' || currentState?.status === 'NEEDS_REVIEW';

    let scaffoldingHint: string | undefined;
    if (isRemediation) {
      scaffoldingHint = selected.hint || 'Hãy lắng nghe kỹ và quan sát kỹ hình vẽ nhé!';
    }

    return {
      question: selected,
      skillId: targetSkillDesc.skillId,
      skillType: targetSkillDesc.category,
      difficulty: actualDiff,
      difficultyCode: diffCode,
      reason: pedagogicalReason,
      pedagogicalGoal: `Đạt độ chính xác ở cấp độ ${diffCode} (${targetSkillDesc.skillName}).`,
      isReview,
      isValidation,
      isRemediation,
      scaffoldingHint,
    };
  }

  /**
   * Composes a complete adaptive practice session (e.g. 5–10 targeted questions)
   */
  public static composeAdaptiveSession(
    masteryMap: Record<string, EnglishMasteryState>,
    criteria: AdaptiveSelectionCriteria = {},
    allQuestions: Question[] = this.getEnglishQuestionBank(),
    now: Date = new Date()
  ): EnglishAdaptiveSession {
    const maxQuestions = criteria.maxQuestions || 5;
    const recommendations: AdaptiveQuestionRecommendation[] = [];
    const usedIds = new Set(criteria.excludeQuestionIds || []);

    const targetSelection = this.selectTargetSkill(masteryMap, now);
    const targetSkillId = criteria.targetSkillId || targetSelection.targetSkill.skillId;
    const sessionType = criteria.sessionType || targetSelection.sessionType;

    const currentState = masteryMap[targetSkillId];
    const targetDifficulty = this.calculateTargetDifficulty(currentState, sessionType);

    for (let i = 0; i < maxQuestions; i++) {
      const rec = this.recommendQuestion(
        masteryMap,
        {
          ...criteria,
          targetSkillId,
          sessionType,
          preferredDifficulty: targetDifficulty,
          excludeQuestionIds: Array.from(usedIds),
        },
        allQuestions,
        now
      );

      if (!rec) break;

      recommendations.push(rec);
      usedIds.add(rec.question.id);
    }

    return {
      sessionId: `eng-session-${targetSkillId}-${now.getTime()}`,
      sessionType,
      targetSkillId,
      targetDifficulty,
      recommendations,
      createdAt: now.toISOString(),
    };
  }
}
