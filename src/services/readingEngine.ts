import {
  ReadingErrorCategory,
  ReadingMetrics,
  ReadingParentRating,
  ReadingPassage,
  ReadingProfile,
  ReadingQuestion,
  ReadingResponse,
  ReadingSessionResult,
  ReadingSkillId,
  ReadingSkillState,
  ReadingStage,
  ReadingStageState,
} from '../types/reading';
import { READING_POLICY } from '../config/policy';
import {
  READING_PASSAGES,
  READING_QUESTIONS,
  READING_SKILLS,
  READING_STAGE_ITEM_IDS,
  getPassagesByLevel,
  getQuestionsByPassage,
  getReadingQuestionById,
  getReadingSkillById,
} from '../data/readingContent';
import { StorageService } from './storage';
import type { LearningEvidence } from '../types/learningOS';
import { SEED_POLICY } from '../config/policy';
import { createEmptyReadingProfile, gateForReadingStage } from './readingDefaults';

const SEED_SALT = SEED_POLICY.READING_SEED_SALT;

/**
 * READING FLUENCY ENGINE
 *
 * Responsibilities:
 *  1. Deterministically assemble a reading session for a ladder stage (§7, §17).
 *  2. Convert raw responses into measurable reading metrics (§8).
 *  3. Decide which ladder stage the learner may train next (§7 gates, §9 fairness).
 *
 * FAIRNESS INVARIANT (§9): SLOW + ACCURATE != WEAK, FAST + INACCURATE != STRONG.
 * No function in this module may reduce a mastery-like index because of speed
 * alone. Speed only appears in labels, in the fluency index and in the
 * PROCESSING_SPEED gate, which additionally requires comprehension accuracy.
 */

const STAGE_ORDER: ReadingStage[] = [...READING_POLICY.STAGES];

const STAGE_LABELS: Record<ReadingStage, string> = {
  ACCURACY: 'Đọc Chính Xác',
  FLUENCY: 'Đọc Lưu Loát',
  COMPREHENSION: 'Hiểu Nội Dung',
  PROCESSING_SPEED: 'Hiểu Nhanh',
  COMPETITION_SPEED: 'Tốc Độ Thi',
};

/** Difficulty band offered per ladder stage — accuracy first, speed last. */
const STAGE_LEVELS: Record<ReadingStage, 1 | 2 | 3> = {
  ACCURACY: 1,
  FLUENCY: 1,
  COMPREHENSION: 2,
  PROCESSING_SPEED: 2,
  COMPETITION_SPEED: 3,
};

export class ReadingEngine {
  // ==========================================================
  // Deterministic PRNG (identical for a given seed)
  // ==========================================================
  private static mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Deterministic 32-bit hash of a string (FNV-1a). */
  public static hashSeed(input: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /**
   * Derives a stable seed from a calendar day so a learner revisiting the same
   * day sees the same reading session (deterministic and reproducible).
   */
  public static seedForDate(date: Date = new Date()): number {
    return ReadingEngine.hashSeed(
      `${SEED_SALT}:${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    );
  }

  /**
   * Deterministically assembles the item list for a ladder stage.
   * Guarantees: no duplicate question ids, stable order for a stable seed.
   */
  public static assembleStageItems(
    stage: ReadingStage,
    seed: number = ReadingEngine.seedForDate(),
    limit: number = 6
  ): ReadingQuestion[] {
    const stageIds = READING_STAGE_ITEM_IDS[stage] ?? [];
    const level = STAGE_LEVELS[stage];
    const passages = getPassagesByLevel(level);
    const passageIds = passages.map((p) => p.id);
    const passageSet = new Set(passageIds);

    // Prefer items that belong to a passage matching the stage difficulty band.
    const primary = stageIds
      .map((id) => getReadingQuestionById(id))
      .filter((q): q is ReadingQuestion => !!q)
      .filter((q) => passageSet.has(q.passageId));

    const fallback = stageIds
      .map((id) => getReadingQuestionById(id))
      .filter((q): q is ReadingQuestion => !!q)
      .filter((q) => !passageSet.has(q.passageId));

    const pool = [...primary, ...fallback];
    if (pool.length === 0) return [];

    const rnd = ReadingEngine.mulberry32(seed);
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const picked: ReadingQuestion[] = [];
    const used = new Set<string>();
    // Interleave passages so a session never reads one passage only.
    const byPassage = new Map<string, ReadingQuestion[]>();
    for (const q of shuffled) {
      const list = byPassage.get(q.passageId) ?? [];
      list.push(q);
      byPassage.set(q.passageId, list);
    }
    while (picked.length < limit) {
      let progressed = false;
      for (const list of byPassage.values()) {
        const next = list.shift();
        if (next && !used.has(next.id)) {
          used.add(next.id);
          picked.push(next);
          progressed = true;
          if (picked.length >= limit) break;
        }
      }
      if (!progressed) break;
    }
    return picked;
  }

  /**
   * Returns the passages the learner should read for a stage, in order.
   */
  public static passagesForStage(
    stage: ReadingStage,
    seed: number = ReadingEngine.seedForDate()
  ) {
    const items = ReadingEngine.assembleStageItems(stage, seed, 6);
    const seen = new Set<string>();
    const ordered: ReadingPassage[] = [];
    for (const item of items) {
      if (seen.has(item.passageId)) continue;
      seen.add(item.passageId);
      const passage = READING_PASSAGES.find((p) => p.id === item.passageId);
      if (passage) ordered.push(passage);
    }
    return ordered;
  }

  // ==========================================================
  // Metrics
  // ==========================================================

  /**
   * Builds the full metric set for a finished session.
   * `startedAt`/`endedAt` are real timestamps supplied by the caller: the engine
   * never invents timing data.
   */
  public static computeMetrics(
    sessionId: string,
    stage: ReadingStage,
    responses: ReadingResponse[],
    startedAt: number,
    endedAt: number
  ): ReadingMetrics {
    const total = responses.length;
    const correctCount = responses.filter((r) => r.correct).length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const comprehension = responses.filter((r) =>
      isComprehensionType(r.questionType)
    );
    const comprehensionAccuracy =
      comprehension.length > 0
        ? Math.round((comprehension.filter((r) => r.correct).length / comprehension.length) * 100)
        : -1; // -1 = not measured this session (never rendered as 0%)

    const interpretation = responses.filter((r) => r.questionType === 'question-meaning');
    const questionInterpretationAccuracy =
      interpretation.length > 0
        ? Math.round((interpretation.filter((r) => r.correct).length / interpretation.length) * 100)
        : -1;

    const wordsProcessed = responses.reduce((sum, r) => sum + (r.wordsProcessed || 0), 0);
    const durationMs = Math.max(0, endedAt - startedAt);
    const averageResponseMs = total > 0 ? Math.round(durationMs / total) : 0;

    // WPM is measured ONLY on items where the learner actually read text aloud or
    // repeated it. Comprehension taps must never inflate the speed figure.
    const spoken = responses.filter((r) => r.wordsProcessed > 0 && isSpokenType(r.questionType));
    const spokenWords = spoken.reduce((sum, r) => sum + r.wordsProcessed, 0);
    const spokenMs = spoken.reduce((sum, r) => sum + r.responseTimeMs, 0);
    const wordsPerMinute = spokenMs > 0 ? Math.round((spokenWords / spokenMs) * 60000) : 0;

    const hesitationCount = responses.filter((r) => r.hesitation).length;

    const difficultyBreakdown = { '1': { total: 0, correct: 0 }, '2': { total: 0, correct: 0 }, '3': { total: 0, correct: 0 } };
    const skillPerformance: Record<string, { total: number; correct: number }> = {};
    const questionTypePerformance: Record<string, { total: number; correct: number }> = {};
    const errorTally = new Map<ReadingErrorCategory['category'], number>();

    for (const r of responses) {
      const dk = String(r.difficulty) as '1' | '2' | '3';
      difficultyBreakdown[dk].total += 1;
      if (r.correct) difficultyBreakdown[dk].correct += 1;

      const skill = skillPerformance[r.skillId] ?? { total: 0, correct: 0 };
      skill.total += 1;
      if (r.correct) skill.correct += 1;
      skillPerformance[r.skillId] = skill;

      const qt = questionTypePerformance[r.questionType] ?? { total: 0, correct: 0 };
      qt.total += 1;
      if (r.correct) qt.correct += 1;
      questionTypePerformance[r.questionType] = qt;

      if (!r.correct) {
        const question = getReadingQuestionById(r.questionId);
        const category = question ? classifyReadingError(question, r) : 'CARELESS_TAP';
        errorTally.set(category, (errorTally.get(category) ?? 0) + 1);
      }
    }

    const errors: ReadingErrorCategory[] = Array.from(errorTally.entries()).map(
      ([category, count]) => ({ category, count })
    );

    const parentRatingCounts = { '😀': 0, '😐': 0, '🙁': 0 } as Record<string, number>;
    for (const r of responses) {
      if (r.parentRating && Object.prototype.hasOwnProperty.call(parentRatingCounts, r.parentRating)) {
        parentRatingCounts[r.parentRating] += 1;
      }
    }
    const hasParentRatings = Object.values(parentRatingCounts).some((n) => n > 0);

    return {
      sessionId,
      stage,
      passageId: responses[0] ? getReadingQuestionById(responses[0].questionId)?.passageId ?? '' : '',
      subject: 'tieng-viet',
      accuracy,
      comprehensionAccuracy,
      questionInterpretationAccuracy,
      itemsProcessed: total,
      wordsProcessed,
      durationMs,
      averageResponseMs,
      wordsPerMinute,
      hesitationCount,
      hesitationRatio: total > 0 ? Math.round((hesitationCount / total) * 100) / 100 : 0,
      difficultyBreakdown,
      skillPerformance,
      questionTypePerformance,
      errors,
      timestamp: endedAt,
      parentRatingCounts: hasParentRatings
        ? (parentRatingCounts as ReadingMetrics['parentRatingCounts'])
        : undefined,
    };
  }

  // ==========================================================
  // Profile / ladder progression
  // ==========================================================

  public static emptyProfile(): ReadingProfile {
    // T02C — single source of truth lives in `readingDefaults` so the
    // first-load chunk can build the same shape without this engine.
    return createEmptyReadingProfile();
  }

  /**
   * Accuracy gate per stage. Speed-oriented stages carry an EXTRA comprehension
   * gate, so a fast-but-inaccurate reader can never skip the comprehension work.
   */
  public static gateForStage(stage: ReadingStage): number {
    return gateForReadingStage(stage);
  }

  /**
   * Folds a finished session into the persisted reading profile.
   * Pure function: returns the next profile without touching storage.
   */
  public static applySession(profile: ReadingProfile, metrics: ReadingMetrics): ReadingProfile {
    const next: ReadingProfile = {
      ...profile,
      stageStates: { ...profile.stageStates },
      skillStates: { ...profile.skillStates },
      lastSessionAt: metrics.timestamp,
    };

    // --- Skill level updates -------------------------------------------------
    for (const [skillId, stat] of Object.entries(metrics.skillPerformance)) {
      const def = getReadingSkillById(skillId);
      const prev = next.skillStates[skillId];
      const attempts = (prev?.attempts ?? 0) + stat.total;
      const correctCount = (prev?.correctCount ?? 0) + stat.correct;
      const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;
      next.skillStates[skillId] = {
        skillId: skillId as ReadingSkillId,
        skillName: def?.skillName ?? skillId,
        accuracy,
        attempts,
        correctCount,
        averageResponseMs: metrics.averageResponseMs,
        status:
          prev?.status === 'STRONG' || accuracy >= READING_POLICY.ACCURACY_GATE + 10
            ? 'STRONG'
            : attempts >= 3
            ? 'PRACTICING'
            : attempts > 0
            ? 'LEARNING'
            : 'NOT_STARTED',
        lastPracticedAt: metrics.timestamp,
      };
    }

    // --- Stage states --------------------------------------------------------
    const stageKey = metrics.stage;
    const stageState = next.stageStates[stageKey] ?? {
      stage: stageKey,
      accuracy: 0,
      accuracyGate: ReadingEngine.gateForStage(stageKey),
      isUnlocked: false,
      isCompleted: false,
      attempts: 0,
    };
    const stageAttempts = stageState.attempts + metrics.itemsProcessed;
    // Weighted running accuracy: keeps earlier practice from being erased.
    const stageAccuracy =
      stageAttempts > 0
        ? Math.round((stageState.accuracy * stageState.attempts + metrics.accuracy * metrics.itemsProcessed) / stageAttempts)
        : metrics.accuracy;
    next.stageStates[stageKey] = {
      ...stageState,
      accuracy: stageAccuracy,
      accuracyGate: ReadingEngine.gateForStage(stageKey),
      attempts: stageAttempts,
      // Lock integrity: practising a locked stage must never unlock it.
      isUnlocked: stageState.isUnlocked,
      isCompleted:
        stageState.isCompleted ||
        (stageAccuracy >= ReadingEngine.gateForStage(stageKey) &&
          stageAttempts >= READING_POLICY.MIN_ITEMS_FOR_METRICS),
    };

    // --- Unlocking -----------------------------------------------------------
    // A stage unlocks when the immediately preceding stage is COMPLETED.
    // Speed stages additionally require the comprehension stage to be complete,
    // so a fast-but-inaccurate reader can never reach speed training (§9).
    for (let i = 1; i < STAGE_ORDER.length; i += 1) {
      const stage = STAGE_ORDER[i];
      const state = next.stageStates[stage];
      if (state.isUnlocked) continue;

      const previousStage = STAGE_ORDER[i - 1];
      if (!next.stageStates[previousStage].isCompleted) continue;

      if (isSpeedStage(stage) && !next.stageStates.COMPREHENSION.isCompleted) continue;
      if (
        isSpeedStage(stage) &&
        metrics.comprehensionAccuracy >= 0 &&
        metrics.comprehensionAccuracy < READING_POLICY.COMPREHENSION_ACCURACY_GATE
      ) {
        continue;
      }

      state.isUnlocked = true;
    }

    // First unlocked, not yet completed stage is where the learner trains next.
    const nextStage =
      STAGE_ORDER.find((s) => next.stageStates[s].isUnlocked && !next.stageStates[s].isCompleted) ??
      STAGE_ORDER[STAGE_ORDER.length - 1];
    next.currentStage = nextStage;

    // --- Composite indexes ---------------------------------------------------
    // Reading index is accuracy-led on purpose (§8/§9): a fast but inaccurate
    // reader cannot reach a high reading index.
    //
    // IMPORTANT: components that have never been measured are EXCLUDED from the
    // weighted average and their weight is redistributed. Otherwise a learner who
    // has not reached the comprehension stage yet would be scored as if they had
    // failed it — which is exactly the "slow but accurate looks weak" bug (§9).
    const accuracyIndex = averageOf(
      Object.values(next.skillStates).map((s) => s.accuracy),
      next.stageStates.ACCURACY.accuracy
    );
    const comprehensionMeasured = next.stageStates.COMPREHENSION.attempts > 0;
    const comprehensionIndex = next.stageStates.COMPREHENSION.accuracy;
    const fluencyMeasured = next.stageStates.FLUENCY.attempts > 0;
    const fluencyIndex = fluencyMeasured
      ? Math.round(
          weightedAverage([
            { value: accuracyIndex, weight: 1, measured: true },
            { value: next.stageStates.FLUENCY.accuracy, weight: 2, measured: true },
          ])
        )
      : accuracyIndex;

    next.accuracyIndex = accuracyIndex;
    next.comprehensionIndex = comprehensionIndex;
    next.fluencyIndex = fluencyIndex;

    // Up to +10 fluency credit for genuinely measured reading speed.
    // Zero when no read-aloud item was attempted: unmeasured speed earns nothing.
    const speedBonus =
      metrics.wordsPerMinute > 0
        ? Math.min(10, Math.round((metrics.wordsPerMinute / READING_POLICY.TARGET_WPM) * 2))
        : 0;
    const baseIndex = weightedAverage([
      { value: accuracyIndex, weight: 0.6, measured: true },
      { value: comprehensionIndex, weight: 0.4, measured: comprehensionMeasured },
    ]);
    next.readingIndex = Math.min(100, baseIndex + speedBonus);

    next.headline = ReadingEngine.headlineFor(next);
    next.encouragement = ReadingEngine.encouragementFor(next, metrics);
    return next;
  }

  /**
   * Persists a session: metrics + profile + Learning OS evidence.
   * Idempotent: replaying the same sessionId never double-counts.
   */
  public static commitSession(result: ReadingSessionResult): ReadingSessionResult {
    StorageService.saveReadingProfile(result.profile);
    StorageService.saveReadingMetrics(result.metrics);

    for (const [skillId, stat] of Object.entries(result.metrics.skillPerformance)) {
      StorageService.recordLearningEvidence({
        id: `read_${result.metrics.sessionId}_${skillId}`,
        learnerId: StorageService.getChildProfile().id,
        source: 'PRACTICE',
        skillId: normalizeReadingSkillId(skillId),
        subject: result.metrics.subject,
        questionId: skillId,
        timestamp: result.metrics.timestamp,
        correct: stat.correct >= stat.total,
        responseTimeMs: result.metrics.averageResponseMs,
      });
    }
    return result;
  }

  /**
   * End-to-end convenience used by the UI and by tests.
   */
  public static finishSession(
    sessionId: string,
    stage: ReadingStage,
    responses: ReadingResponse[],
    startedAt: number,
    endedAt: number,
    persist: boolean = true
  ): ReadingSessionResult {
    const metrics = ReadingEngine.computeMetrics(sessionId, stage, responses, startedAt, endedAt);
    const profile = ReadingEngine.applySession(StorageService.getReadingProfile(), metrics);
    const result: ReadingSessionResult = {
      metrics,
      profile,
      nextActions: ReadingEngine.nextActionsFor(profile),
    };
    if (persist) ReadingEngine.commitSession(result);
    return result;
  }

  public static nextActionsFor(profile: ReadingProfile) {
    return STAGE_ORDER.filter((s) => profile.stageStates[s].isUnlocked).map((stage) => {
      const state = profile.stageStates[stage];
      if (state.isCompleted) {
        return {
          stage,
          label: `Ôn lại: ${STAGE_LABELS[stage]}`,
          reason: `Bé đã đạt ${state.accuracy}% ở bước này. Luyện lại để giữ vững nhé!`,
        };
      }
      return {
        stage,
        label: `Luyện ${STAGE_LABELS[stage]}`,
        reason: `Cần đạt ${state.accuracyGate}% để mở bước tiếp theo. Bé đang ở ${state.accuracy}%.`,
      };
    });
  }

  /** Records a parent quick grade (😀/😐/🙁) for a passage in the profile. */
  public static recordParentRating(
    profile: ReadingProfile,
    passageId: string,
    rating: ReadingParentRating
  ): ReadingProfile {
    if (!profile) return profile;
    if (!passageId || !['😀', '😐', '🙁'].includes(rating)) return profile;
    // T14C: idempotent per passage — re-grading updates the entry instead of
    // appending a duplicate to selfReadRatings (mirrors the persisted
    // StorageService.saveReadingParentRating semantics).
    const parentRatings = { ...(profile.parentRatings ?? {}), [passageId]: rating };
    const parentGrades = { ...(profile.parentGrades ?? {}), [passageId]: rating };
    return {
      ...profile,
      parentRatings,
      parentGrades,
      selfReadRatings: [...Object.values(parentRatings)],
    };
  }

  /** Alias kept for compatibility with alternate naming. */
  public static applyParentRating(
    profile: ReadingProfile,
    passageId: string,
    rating: ReadingParentRating
  ): ReadingProfile {
    return ReadingEngine.recordParentRating(profile, passageId, rating);
  }

  /** Alias kept for alternate naming. */
  public static gradeSelfRead(
    profile: ReadingProfile,
    passageId: string,
    rating: ReadingParentRating
  ): ReadingProfile {
    return ReadingEngine.recordParentRating(profile, passageId, rating);
  }

  private static headlineFor(profile: ReadingProfile): string {
    if (profile.readingIndex >= 85) return 'Bé đọc rất chắc và đọc nhanh!';
    if (profile.readingIndex >= 70) return 'Bé đọc chắc rồi, giờ mình luyện thêm mượt nhé!';
    if (profile.readingIndex >= 50) return 'Bé đang tiến bộ tốt, mình cùng đọc tiếp nha!';
    if (profile.readingIndex > 0) return 'Bé đang tập đọc, mình cứ đọc chậm một chút nhé!';
    return 'Mình bắt đầu luyện đọc chắc nhé!';
  }

  private static encouragementFor(profile: ReadingProfile, metrics: ReadingMetrics): string {
    // §8: supportive copy only. Never label the learner slow/weak.
    if (metrics.accuracy >= 90) {
      return 'Bé đọc chuẩn lắm! Mình thử đọc thêm một chút cho mượt nữa nhé!';
    }
    if (metrics.hesitationRatio >= 0.5) {
      return 'Bé đang đọc cẩn thần, đó là điều tốt! Mình đọc cùng nhé.';
    }
    if (metrics.accuracy >= READING_POLICY.ACCURACY_GATE) {
      return 'Đọc tốt lắm rồi! Tiếp tục đều đặn là bé sẽ đọc lưu loát ngay thôi!';
    }
    return 'Mỗi lần đọc là bé tiến thêm một chút. Mình đi cùng bé nhé!';
  }
}

/**
 * Mapping between reading skill ids and the Learning OS knowledge-state space.
 * Reading skills are tracked under the `rf_` prefix so they never collide with
 * curriculum skills, while still flowing through the same evidence pipeline.
 */
export function normalizeReadingSkillId(skillId: string): string {
  return skillId.startsWith('rf_') ? skillId : `rf_${skillId.toLowerCase().replace(/-/g, '_')}`;
}

function isComprehensionType(type: string): boolean {
  return type.startsWith('comprehension-');
}

function isSpokenType(type: string): boolean {
  return type === 'read-aloud' || type === 'phrase-repeat';
}

function isSpeedStage(stage: ReadingStage): boolean {
  return stage === 'PROCESSING_SPEED' || stage === 'COMPETITION_SPEED';
}

function averageOf(values: number[], fallback: number): number {
  const usable = values.filter((v) => Number.isFinite(v));
  if (usable.length === 0) return fallback;
  return Math.round(usable.reduce((a, b) => a + b, 0) / usable.length);
}

/**
 * Weighted average that ignores unmeasured components and redistributes their
 * weight across the measured ones. Returns 0 when nothing is measured.
 */
function weightedAverage(components: { value: number; weight: number; measured: boolean }[]): number {
  const usable = components.filter((c) => c.measured && Number.isFinite(c.value));
  const totalWeight = usable.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) return 0;
  return Math.round(usable.reduce((sum, c) => sum + c.value * c.weight, 0) / totalWeight);
}

/**
 * Deterministic error classification (§8 "error classification").
 * Rules are data-driven: no hardcoded question ids.
 */
export function classifyReadingError(
  question: ReadingQuestion,
  response: ReadingResponse
): ReadingErrorCategory['category'] {
  if (response.hesitation && response.responseTimeMs > READING_POLICY.HESITATION_SECONDS * 1000) {
    return question.questionType.startsWith('comprehension-') ? 'COMPREHENSION_GAP' : 'MISPRONUNCIATION';
  }
  if (question.questionType === 'keyword-finding') return 'KEYWORD_MISSED';
  if (question.questionType === 'punctuation-pause') return 'PUNCTUATION_IGNORED';
  if (question.questionType.startsWith('comprehension-')) return 'COMPREHENSION_GAP';
  if (question.questionType === 'read-aloud') return 'MISPRONUNCIATION';
  if (question.questionType === 'word-recognition') return 'SUBSTITUTION';
  if (question.questionType === 'sentence-order') return 'OMISSION';
  return 'CARELESS_TAP';
}

/** All skills that make up the reading profile (exposed for parent reports). */
export function getAllReadingSkills() {
  return READING_SKILLS;
}

export function getAllReadingQuestions(): ReadingQuestion[] {
  return READING_QUESTIONS;
}

export function getAllReadingPassages(): ReadingPassage[] {
  return READING_PASSAGES;
}
