import {
  KIDBOX_PROGRESSION_STEPS,
  KIDBOX_STEP_LABELS,
  KidBoxActivity,
  KidBoxAttemptOutcome,
  KidBoxAttemptRecord,
  KidBoxDailyPlan,
  KidBoxEnglishProfile,
  KidBoxHomeworkPack,
  KidBoxHomeworkSection,
  KidBoxPlanItem,
  KidBoxPracticeFocus,
  KidBoxProgressionStep,
  KidBoxProgressStore,
  KidBoxSkillId,
  KidBoxSkillStar,
  KidBoxStepProgress,
  KidBoxStrand,
  KidBoxStrandProfile,
  KidBoxUnit,
  KidBoxWeeklyReport,
} from '../types/kidBox';
import { LearningAction } from '../types/learningOS';
import { KIDBOX_POLICY } from '../config/policy';
import { KIDBOX_SKILLS, getKidBoxSkill, getSkillsForStrand } from '../data/kidBoxTaxonomy';
import {
  KIDBOX_BRIDGE_UNIT_ID,
  getKidBoxContentReadiness,
  getKidBoxCourse,
  getKidBoxUnitLabel,
  findKidBoxUnit,
} from '../data/kidBoxCurriculum';
import { KIDBOX_STRAND_LABELS } from '../types/kidBox';
import { buildUnitActivities, KidBoxResponse, evaluateActivityResponse } from './kidBoxActivities';
import { DAY_MS, KidBoxStore, todayISO } from './kidBoxStore';
import { StorageService } from './storage';

/**
 * §18 ADAPTIVE ENGLISH + §19 DAILY ENGLISH PLAN + §23/§24 PARENT REPORTING.
 *
 * Everything in this module reads evidence and nothing else:
 *   - skill mastery comes from the Learning OS (`StorageService.getKnowledgeStates`)
 *   - item-level review state comes from the Kid's Box store
 * No score, no game result and no "AI guess" ever becomes a claim about the
 * child. When there is no evidence, the answer is "chưa có dữ liệu".
 */

const STRANDS: KidBoxStrand[] = ['VOCABULARY', 'PHONICS', 'LISTENING', 'SPEAKING', 'READING', 'LANGUAGE_USE'];

/** Focus → skill, so a recommendation always names a concrete skill (§18). */
const FOCUS_SKILL: Record<KidBoxPracticeFocus, KidBoxSkillId> = {
  VOCABULARY_RECOGNITION: 'EN-VOCAB-RECOGNITION',
  VOCABULARY_RECALL: 'EN-VOCAB-RECALL',
  LISTENING_RECOGNITION: 'EN-LISTENING-RECOGNITION',
  LISTENING_INSTRUCTION: 'EN-LISTENING-INSTRUCTION',
  PHONICS_DISCRIMINATION: 'EN-PHONICS-DISCRIMINATION',
  SPEAKING_REPEAT: 'EN-SPEAKING-REPEAT',
  SPEAKING_PATTERN: 'EN-SPEAKING-PATTERN',
  READING_WORD: 'EN-READING-WORD',
  READING_COMPREHENSION: 'EN-READING-COMPREHENSION',
  PATTERN_USE: 'EN-LANGUAGE-PATTERN',
  GENTLE_BASELINE: 'EN-VOCAB-RECOGNITION',
};

const FOCUS_LABEL: Record<KidBoxPracticeFocus, { title: string; emoji: string }> = {
  VOCABULARY_RECOGNITION: { title: 'Luyện nhận diện từ vựng', emoji: '🧺' },
  VOCABULARY_RECALL: { title: 'Ôn từ vựng đã học', emoji: '🔁' },
  LISTENING_RECOGNITION: { title: 'Luyện nghe hiểu', emoji: '👂' },
  LISTENING_INSTRUCTION: { title: 'Luyện nghe và làm theo', emoji: '📣' },
  PHONICS_DISCRIMINATION: { title: 'Luyện phân biệt âm thanh', emoji: '🔤' },
  SPEAKING_REPEAT: { title: 'Luyện nói lại từ', emoji: '🗣️' },
  SPEAKING_PATTERN: { title: 'Luyện nói theo mẫu câu', emoji: '💬' },
  READING_WORD: { title: 'Luyện đọc từ', emoji: '📖' },
  READING_COMPREHENSION: { title: 'Luyện đọc hiểu', emoji: '📚' },
  PATTERN_USE: { title: 'Luyện dùng mẫu câu', emoji: '✨' },
  GENTLE_BASELINE: { title: 'Khám phá English thật nhẹ nhàng', emoji: '🐣' },
};

export interface KidBoxKnowledgeSnapshot {
  /** skillId → attempt count / accuracy, taken from the Learning OS. */
  attempts: number;
  correct: number;
  recentAccuracy: number;
  mastery: number;
  confidence: number;
}

export type KidBoxKnowledgeMap = Record<string, KidBoxKnowledgeSnapshot>;

/**
 * §22 — resolves the unit the Learning OS should prioritise. Falls back to the
 * bridge pack so a brand-new child always lands somewhere real instead of on a
 * broken screen.
 */
export function getCurrentUnit(store: KidBoxProgressStore): KidBoxUnit {
  const course = getKidBoxCourse();
  const preferred =
    course.units.find((u) => u.id === store.courseState.currentUnitId) ?? findKidBoxUnit(KIDBOX_BRIDGE_UNIT_ID);
  return preferred ?? course.units[0];
}

/** §22 — preview/practice/review are always allowed; only the priority changes. */
export function listUnitsForChild(store: KidBoxProgressStore): { unit: KidBoxUnit; isCurrent: boolean }[] {
  const course = getKidBoxCourse();
  const currentId = getCurrentUnit(store).id;
  return course.units
    .map((unit) => ({ unit, isCurrent: unit.id === currentId }))
    .sort((a, b) => {
      // Current unit first, then mapped textbook units, then the bridge pack.
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      const aBridge = a.unit.sourceType === 'APP_BRIDGE';
      const bBridge = b.unit.sourceType === 'APP_BRIDGE';
      if (aBridge !== bBridge) return aBridge ? 1 : -1;
      return a.unit.index - b.unit.index;
    });
}

/** §9 — step status for the hub ladder, derived from recorded evidence. */
export function getStepProgress(
  store: KidBoxProgressStore,
  unit: KidBoxUnit
): { step: KidBoxProgressionStep; label: string; emoji: string; progress: KidBoxStepProgress; activityCount: number }[] {
  const activities = buildUnitActivities(unit);
  const unitProgress = store.unitProgress[unit.id];

  return KIDBOX_PROGRESSION_STEPS.map((step) => {
    const fallback: KidBoxStepProgress = { step, status: 'AVAILABLE', evidenceCount: 0 };
    return {
      step,
      label: KIDBOX_STEP_LABELS[step].vi,
      emoji: KIDBOX_STEP_LABELS[step].emoji,
      progress: unitProgress?.steps[step] ?? fallback,
      activityCount: activities.filter((a) => a.step === step).length,
    };
  });
}

/** Steps a unit cannot run yet, because the source content is missing (§27). */
export function getStepsMissingContent(unit: KidBoxUnit): KidBoxProgressionStep[] {
  const available = new Set(buildUnitActivities(unit).map((a) => a.step));
  return KIDBOX_PROGRESSION_STEPS.filter((step) => step !== 'REVIEW' && !available.has(step));
}

/* ------------------------------------------------------------------ */
/* §18 ADAPTIVE ENGLISH                                                 */
/* ------------------------------------------------------------------ */

function emptyStrandProfile(strand: KidBoxStrand): KidBoxStrandProfile {
  return {
    strand,
    attemptCount: 0,
    accuracy: 0,
    recentAccuracy: 0,
    mastery: 0,
    confidence: 0,
    status: 'NO_EVIDENCE',
  };
}

/** Strand-level picture, aggregated from real skill evidence only. */
export function buildStrandProfiles(knowledge: KidBoxKnowledgeMap): Record<KidBoxStrand, KidBoxStrandProfile> {
  const profiles = {} as Record<KidBoxStrand, KidBoxStrandProfile>;
  const correctByStrand: Record<KidBoxStrand, number> = {
    VOCABULARY: 0,
    PHONICS: 0,
    LISTENING: 0,
    SPEAKING: 0,
    READING: 0,
    LANGUAGE_USE: 0,
  };

  for (const strand of STRANDS) profiles[strand] = emptyStrandProfile(strand);

  for (const skill of KIDBOX_SKILLS) {
    const state = knowledge[skill.skillId];
    if (!state || state.attempts === 0) continue;
    const profile = profiles[skill.strand];
    profile.attemptCount += state.attempts;
    correctByStrand[skill.strand] += state.correct;
    profile.mastery = Math.max(profile.mastery, state.mastery);
    profile.confidence = Math.max(profile.confidence, state.confidence);
    profile.recentAccuracy =
      profile.attemptCount === state.attempts ? state.recentAccuracy : weightedAverage(profile, state);
  }

  for (const strand of STRANDS) {
    const p = profiles[strand];
    p.accuracy = p.attemptCount > 0 ? Math.round((correctByStrand[strand] / p.attemptCount) * 100) : 0;
    if (p.attemptCount === 0) {
      p.status = 'NO_EVIDENCE';
      continue;
    }
    if (p.accuracy < KIDBOX_POLICY.WEAK_MAX_ACCURACY || p.recentAccuracy < KIDBOX_POLICY.WEAK_MAX_ACCURACY) {
      p.status = 'NEEDS_WORK';
    } else if (p.accuracy >= KIDBOX_POLICY.STRONG_MIN_ACCURACY && p.attemptCount >= KIDBOX_POLICY.STRONG_MIN_ATTEMPTS) {
      p.status = 'SECURE';
    } else {
      p.status = 'PRACTICING';
    }
  }

  return profiles;
}

function weightedAverage(
  profile: { attemptCount: number; recentAccuracy: number },
  state: { attempts: number; recentAccuracy: number }
): number {
  const total = profile.attemptCount + state.attempts;
  const numerator = profile.recentAccuracy * profile.attemptCount + state.recentAccuracy * state.attempts;
  return Math.round(numerator / Math.max(1, total));
}

const STRAND_FOCUS: Record<KidBoxStrand, KidBoxPracticeFocus> = {
  VOCABULARY: 'VOCABULARY_RECOGNITION',
  PHONICS: 'PHONICS_DISCRIMINATION',
  LISTENING: 'LISTENING_RECOGNITION',
  SPEAKING: 'SPEAKING_REPEAT',
  READING: 'READING_COMPREHENSION',
  LANGUAGE_USE: 'PATTERN_USE',
};

/**
 * When a strand is already SECURE the useful next step is consolidation, not
 * more of the same exercise. This is also why §37 Child E (accurate but slow)
 * never sees speed pressure: the plan deepens accuracy, never pace.
 */
const STRENGTHENING_FOCUS: Record<KidBoxStrand, KidBoxPracticeFocus> = {
  VOCABULARY: 'VOCABULARY_RECALL',
  PHONICS: 'PHONICS_DISCRIMINATION',
  LISTENING: 'LISTENING_INSTRUCTION',
  SPEAKING: 'SPEAKING_PATTERN',
  READING: 'READING_COMPREHENSION',
  LANGUAGE_USE: 'PATTERN_USE',
};

/**
 * §18 — the honest answer to "bé đang yếu gì trong English của Kid's Box?".
 *
 * Child A (good vocab, weak listening) → LISTENING_RECOGNITION.
 * Child B (good listening, weak speaking) → SPEAKING_REPEAT.
 * Child C (weak vocab, good phonics)    → VOCABULARY_RECOGNITION.
 * Child D (new learner)                 → GENTLE_BASELINE.
 * Child E (accurate but slow)           → accuracy work only, never speed pressure.
 */
export function analyseEnglishProfile(knowledge: KidBoxKnowledgeMap): KidBoxEnglishProfile {
  const strands = buildStrandProfiles(knowledge);
  const totalAttempts = STRANDS.reduce((sum, s) => sum + strands[s].attemptCount, 0);
  const isColdStart = totalAttempts < KIDBOX_POLICY.COLD_START_EVIDENCE_THRESHOLD;

  const withEvidence = STRANDS.filter((s) => strands[s].status !== 'NO_EVIDENCE');
  const weakest =
    withEvidence
      .filter((s) => strands[s].status === 'NEEDS_WORK')
      .sort((a, b) => strands[a].accuracy - strands[b].accuracy || strands[a].recentAccuracy - strands[b].recentAccuracy)[0] ??
    (isColdStart ? undefined : [...withEvidence].sort((a, b) => strands[a].recentAccuracy - strands[b].recentAccuracy)[0]);

  const strongest =
    withEvidence
      .filter((s) => strands[s].status === 'SECURE')
      .sort((a, b) => strands[b].accuracy - strands[a].accuracy)[0] ?? undefined;

  const nextBestFocus: KidBoxPracticeFocus = isColdStart
    ? 'GENTLE_BASELINE'
    : !weakest
      ? 'VOCABULARY_RECALL'
      : strands[weakest].status === 'SECURE'
        ? STRENGTHENING_FOCUS[weakest]
        : STRAND_FOCUS[weakest];

  const explanation = isColdStart
    ? 'Bé mới bắt đầu. Hôm nay mình làm quen nhẹ nhàng với hình và tiếng Anh, chưa cần điểm số.'
    : !weakest
      ? 'Các phần English của bé đều ổn rồi, hôm nay mình ôn lại cho nhẹ nhàng.'
      : strands[weakest].status === 'SECURE'
        ? `${KIDBOX_STRAND_LABELS[weakest].vi} của bé đã khá vững (${strands[weakest].accuracy}%), nên hôm nay mình cho bé ôn lại để nhớ lâu hơn.`
        : `Dữ liệu cho thấy phần ${KIDBOX_STRAND_LABELS[weakest].vi.toLowerCase()} của bé còn yếu hơn (${strands[weakest].accuracy}% sau ${strands[weakest].attemptCount} lượt), nên mình ưu tiên luyện phần đó trước.`;

  return {
    weakestStrand: weakest ?? null,
    strongestStrand: strongest ?? null,
    nextBestFocus,
    strands,
    totalAttempts,
    isColdStart,
    explanation,
  };
}

/* ------------------------------------------------------------------ */
/* ACTIVITY → EVIDENCE BRIDGE (§16/§17)                                 */
/* ------------------------------------------------------------------ */

/** §17 — a game score is never mastery; only real responses are evidence. */
export function shouldEmitLearningEvidence(outcome: KidBoxAttemptOutcome): boolean {
  return outcome === 'CORRECT' || outcome === 'INCORRECT' || outcome === 'RECOGNITION_MATCH';
}

function difficultyToEvidence(activity: KidBoxActivity): 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE' {
  if (activity.difficulty === 3) return 'CHALLENGE';
  if (activity.difficulty === 2) return 'MEDIUM';
  return 'EASY';
}

/**
 * Builds a stable attempt id. Stability matters twice: it makes evidence
 * idempotent across reloads and it prevents a double tap from counting twice.
 */
export function buildAttemptId(activityId: string, childResponseKey: string, at: number): string {
  return `kb:${activityId}:${childResponseKey}:${Math.floor(at / 1000)}`;
}

export interface KidBoxSubmissionResult {
  attempt: KidBoxAttemptRecord;
  /** True when the Learning OS accepted new evidence (not a replay). */
  evidenceRecorded: boolean;
  /** True when the Kid's Box store accepted the attempt (not a replay). */
  progressRecorded: boolean;
  outcome: KidBoxAttemptOutcome;
}

/**
 * Single entry point for every Kid's Box interaction: lessons, listening,
 * speaking, games and the mini check all come through here, so evidence,
 * review state and day counters can never drift apart.
 *
 * §14 — self-checked and skipped attempts are stored (so the parent can see the
 * child tried) but never turned into a right/wrong signal.
 */
export function submitActivityResponse(params: {
  activity: KidBoxActivity;
  response: KidBoxResponse;
  responseKey: string;
  startedAt: number;
  now?: number;
  usedReplay?: boolean;
  speechRecognitionUsed?: boolean;
  childProfileId: string;
}): KidBoxSubmissionResult {
  const now = params.now ?? Date.now();
  const evaluation = evaluateActivityResponse(params.activity, params.response);

  let outcome: KidBoxAttemptOutcome;
  if (params.response.type === 'SPEAK') {
    outcome = params.response.recognitionSupported
      ? evaluation.isCorrect
        ? 'RECOGNITION_MATCH'
        : 'INCORRECT'
      : 'SELF_CHECKED';
  } else if (params.response.type === 'ACTION_DONE') {
    outcome = evaluation.isCorrect ? 'CORRECT' : 'INCORRECT';
  } else {
    outcome = evaluation.isCorrect ? 'CORRECT' : 'INCORRECT';
  }

  const attempt: KidBoxAttemptRecord = {
    attemptId: buildAttemptId(params.activity.id, params.responseKey, now),
    activityId: params.activity.id,
    unitId: params.activity.unitId,
    step: params.activity.step,
    skillId: params.activity.skillId,
    outcome,
    responseTimeMs: Math.max(0, now - params.startedAt),
    at: now,
    usedReplay: params.usedReplay ?? false,
    speechRecognitionUsed: params.speechRecognitionUsed ?? false,
  };

  const progressRecorded = KidBoxStore.recordAttempt(attempt);

  let evidenceRecorded = false;
  if (shouldEmitLearningEvidence(outcome)) {
    evidenceRecorded = StorageService.recordLearningEvidence({
      id: `kbox_ev_${attempt.attemptId}`,
      learnerId: params.childProfileId,
      source: params.activity.step === 'GAME' ? 'GAME' : params.activity.step === 'REVIEW' ? 'REVIEW' : 'LESSON',
      skillId: attempt.skillId,
      subject: 'english',
      questionId: params.activity.id,
      timestamp: now,
      correct: outcome !== 'INCORRECT',
      responseTimeMs: attempt.responseTimeMs,
      difficulty: difficultyToEvidence(params.activity),
    });
  }

  return { attempt, evidenceRecorded, progressRecorded, outcome };
}

/* ------------------------------------------------------------------ */
/* §25 SPACED REPETITION                                                */
/* ------------------------------------------------------------------ */

export interface KidBoxReviewCandidate {
  skillId: KidBoxSkillId;
  unitId: string;
  /** 0-100, higher means "review me sooner". */
  priority: number;
  dueNow: boolean;
  reason: string;
}

/**
 * §25 — review priority from previous correctness, recency, consecutive
 * correct answers, difficulty and forgetting risk. A single miss never zeroes
 * an item: it only shortens the interval.
 */
export function computeReviewPriority(
  state: { attempts: number; correctCount: number; consecutiveCorrect: number; lapses: number; lastPracticedAt?: number; nextReviewAt?: number; difficulty: number },
  now: number
): { priority: number; dueNow: boolean; reason: string } {
  if (state.attempts === 0) return { priority: 0, dueNow: false, reason: 'Chưa học — ưu tiên học mới.' };

  const errorRate = 1 - state.correctCount / state.attempts;
  const daysSince = state.lastPracticedAt ? (now - state.lastPracticedAt) / DAY_MS : 14;
  const recencyScore = Math.min(1, daysSince / 14);
  const difficultyScore = Math.min(1, (state.difficulty - 1) / 2);
  const strengthScore = Math.min(1, state.consecutiveCorrect / 4);

  const raw =
    errorRate * KIDBOX_POLICY.REVIEW_WEIGHT_ERROR_RATE +
    recencyScore * KIDBOX_POLICY.REVIEW_WEIGHT_RECENCY +
    difficultyScore * KIDBOX_POLICY.REVIEW_WEIGHT_DIFFICULTY +
    (1 - strengthScore) * KIDBOX_POLICY.REVIEW_WEIGHT_CONSECUTIVE_CORRECT +
    Math.min(1, state.lapses * KIDBOX_POLICY.REVIEW_LAPSE_WEIGHT * 4);

  const priority = Math.round(Math.min(1, raw / 4) * 100);
  const dueNow = state.nextReviewAt !== undefined && state.nextReviewAt <= now;

  const reason =
    state.lapses > 0
      ? `Đã quên ${state.lapses} lần trước — ôn lại sớm giúp bé nhớ kỹ hơn.`
      : state.consecutiveCorrect >= 3
        ? 'Bé đã làm đúng nhiều lần — giãn cách ôn dài hơn.'
        : 'Đến lúc ôn lại để khỏi quên.';

  return { priority, dueNow, reason };
}

/** Items due for review right now, strongest need first. */
export function buildReviewQueue(store: KidBoxProgressStore, now: number = Date.now()): KidBoxReviewCandidate[] {
  return Object.values(store.reviewStates)
    .map((state) => {
      const { priority, dueNow, reason } = computeReviewPriority(state, now);
      return {
        skillId: state.skillId,
        unitId: state.unitId,
        priority,
        dueNow,
        reason,
      };
    })
    .filter((c) => c.dueNow || c.priority >= 40)
    .sort((a, b) => b.priority - a.priority || a.skillId.localeCompare(b.skillId));
}

/* ------------------------------------------------------------------ */
/* §19 DAILY ENGLISH PLAN                                               */
/* ------------------------------------------------------------------ */

export interface KidBoxPlanInput {
  store: KidBoxProgressStore;
  knowledge: KidBoxKnowledgeMap;
  /** Age in years — drives the plan length (§19). */
  ageYears: number;
  isFatigued: boolean;
  now?: number;
}

/** §19 — plan budget for a given age, always inside the daily screen limit. */
export function dailyBudgetForAge(ageYears: number): number {
  const table = KIDBOX_POLICY.DAILY_MINUTES_BY_AGE as Record<number, number>;
  const budget = table[Math.max(KIDBOX_POLICY.AGE_MIN, Math.min(KIDBOX_POLICY.AGE_MAX, ageYears))];
  return Math.max(KIDBOX_POLICY.MIN_DAILY_MINUTES, Math.min(KIDBOX_POLICY.MAX_DAILY_MINUTES, budget));
}

/**
 * §19 — "English hôm nay". The plan is assembled from the child's real
 * weaknesses, the current unit, what is due for review and the remaining
 * energy, then clamped to a budget that respects Grade 1 screen time.
 */
export function buildDailyEnglishPlan(input: KidBoxPlanInput): KidBoxDailyPlan {
  const now = input.now ?? Date.now();
  const profile = analyseEnglishProfile(input.knowledge);
  const unit = getCurrentUnit(input.store);
  const activities = buildUnitActivities(unit);
  const reviewQueue = buildReviewQueue(input.store, now);

  const ageAdjusted = input.ageYears <= KIDBOX_POLICY.AGE_MIN;
  const budget = dailyBudgetForAge(input.ageYears);

  const items: KidBoxPlanItem[] = [];
  const usedSkills = new Set<KidBoxSkillId>();

  const push = (focus: KidBoxPracticeFocus, step: KidBoxProgressionStep, minutes: number, reason: string, child: string) => {
    const skillId = FOCUS_SKILL[focus];
    if (usedSkills.has(skillId)) return;
    const activity = activities.find((a) => a.step === step && a.skillId === skillId) ?? activities.find((a) => a.step === step);
    if (!activity) return;
    usedSkills.add(skillId);
    const label = FOCUS_LABEL[focus];
    items.push({
      id: `kidbox_plan_${step.toLowerCase()}_${items.length}`,
      title: label.title,
      emoji: label.emoji,
      focus,
      skillId: activity.skillId,
      estimatedMinutes: minutes,
      reason,
      childExplanation: child,
      activityId: activity.id,
    });
  };

  // 1. Review first when something is actually due — never invent a review.
  if (reviewQueue.length > 0) {
    const skillId = reviewQueue[0].skillId;
    const activity = activities.find((a) => a.skillId === skillId) ?? activities.find((a) => a.step === 'PRACTICE');
    if (activity) {
      usedSkills.add(skillId);
      items.push({
        id: 'kidbox_plan_review_0',
        title: 'Ôn lại kiến thức cũ',
        emoji: '🗓️',
        focus: 'VOCABULARY_RECALL',
        skillId,
        estimatedMinutes: KIDBOX_POLICY.PLAN_REVIEW_MINUTES,
        reason: reviewQueue[0].reason,
        childExplanation: 'Mình ôn lại mấy từ hôm trước để bé nhớ lâu hơn nhé.',
        activityId: activity.id,
      });
    }
  }

  // 2. The weakness the Learning OS actually measured (§18).
  push(
    profile.nextBestFocus,
    stepForFocus(profile.nextBestFocus),
    Math.min(KIDBOX_POLICY.PLAN_WEAKNESS_MINUTES, budget),
    profile.explanation,
    profile.isColdStart
      ? 'Bé mới bắt đầu thôi, mình cùng khám phá nhẹ nhàng nha!'
      : 'Mình luyện phần bé còn yếu trước cho dễ nhé.'
  );

  // 3. Listening is a first-class skill, never an afterthought (§12).
  if (!input.isFatigued) {
    push('LISTENING_RECOGNITION', 'HEAR', KIDBOX_POLICY.PLAN_LISTENING_MINUTES, 'Nghe là kỹ năng riêng, cần luyện riêng.', 'Bé nghe thật chăm chỉ rồi chọn hình nha!');
  }

  // 4. Speaking, unless the child is already tired (§13 + fatigue).
  if (!input.isFatigued) {
    push('SPEAKING_REPEAT', 'REPEAT', KIDBOX_POLICY.PLAN_SPEAKING_MINUTES, 'Nói lại giúp bé nhớ âm và từ.', 'Bé nói lại sau mình nhé, sai cũng không sao!');
  }

  // 5. A short game to close on a high note (§16).
  if (!input.isFatigued) {
    push('VOCABULARY_RECOGNITION', 'GAME', KIDBOX_POLICY.PLAN_GAME_MINUTES, 'Trò chơi củng cố, không thay thế luyện tập.', 'Cuối buổi mình chơi một ván cho vui nhé!');
  }

  const clamped: KidBoxPlanItem[] = [];
  let total = 0;
  for (const item of items) {
    if (clamped.length === 0) {
      clamped.push(item);
      total += item.estimatedMinutes;
      continue;
    }
    if (total + item.estimatedMinutes > budget) continue;
    clamped.push(item);
    total += item.estimatedMinutes;
  }

  return {
    date: todayISO(now),
    estimatedMinutes: Math.min(budget, total),
    items: clamped,
    generatedAt: now,
    factors: {
      ageAdjusted,
      fatigueAdjusted: input.isFatigued,
      weaknessAdjusted: !profile.isColdStart,
      reviewAdjusted: reviewQueue.length > 0,
    },
  };
}

function stepForFocus(focus: KidBoxPracticeFocus): KidBoxProgressionStep {
  switch (focus) {
    case 'LISTENING_RECOGNITION':
    case 'LISTENING_INSTRUCTION':
      return 'HEAR';
    case 'SPEAKING_REPEAT':
    case 'SPEAKING_PATTERN':
      return 'REPEAT';
    case 'PHONICS_DISCRIMINATION':
    case 'VOCABULARY_RECOGNITION':
    case 'VOCABULARY_RECALL':
    case 'GENTLE_BASELINE':
      return 'PRACTICE';
    case 'READING_WORD':
    case 'READING_COMPREHENSION':
      return 'PRACTICE';
    case 'PATTERN_USE':
      return 'USE';
    default:
      return 'PRACTICE';
  }
}

/* ------------------------------------------------------------------ */
/* §20 CENTER ↔ HOME BRIDGE                                             */
/* ------------------------------------------------------------------ */

/**
 * "Ôn ở nhà" — a small pack the parent can hand over without entering scores.
 * Built from the same activities the child practises at the centre.
 */
export function buildHomeworkPack(input: {
  unitId?: string;
  weekLabel?: string;
  now?: number;
}): KidBoxHomeworkPack {
  const now = input.now ?? Date.now();
  const store = KidBoxStore.get();
  const unit = findKidBoxUnit(input.unitId ?? store.courseState.currentUnitId ?? KIDBOX_BRIDGE_UNIT_ID);
  const activities = unit ? buildUnitActivities(unit) : [];

  const sectionDefs: { id: string; title: string; emoji: string; skill: KidBoxSkillId; step: KidBoxProgressionStep; minutes: number; note: string }[] = [
    { id: 'vocab', title: 'Ôn từ vựng', emoji: '🧺', skill: 'EN-VOCAB-RECOGNITION', step: 'PRACTICE', minutes: 3, note: 'Chọn đúng hình theo từ.' },
    { id: 'listening', title: 'Luyện nghe', emoji: '👂', skill: 'EN-VOCAB-LISTENING', step: 'HEAR', minutes: 3, note: 'Nghe giọng British English, nghe lại bao nhiêu lần cũng được.' },
    { id: 'speaking', title: 'Luyện nói', emoji: '🗣️', skill: 'EN-SPEAKING-REPEAT', step: 'REPEAT', minutes: 2, note: 'Nghe rồi nói lại; không chấm điểm phát âm.' },
    { id: 'phonics', title: 'Luyện âm thanh', emoji: '🔤', skill: 'EN-PHONICS-SOUND', step: 'PRACTICE', minutes: 3, note: 'Nghe âm đầu, chọn từ đúng.' },
    { id: 'game', title: 'Trò chơi nhỏ', emoji: '🎮', skill: 'EN-VOCAB-RECOGNITION', step: 'GAME', minutes: 2, note: 'Chơi để ôn lại từ.' },
  ];

  const sections: KidBoxHomeworkSection[] = sectionDefs
    .map((def) => {
      const activity = activities.find((a) => a.step === def.step && a.skillId === def.skill) ?? activities.find((a) => a.step === def.step);
      if (!activity) return null;
      return {
        sectionId: def.id,
        title: def.title,
        emoji: def.emoji,
        skillId: activity.skillId,
        estimatedMinutes: def.minutes,
        activityIds: [activity.id],
        note: def.note,
      };
    })
    .filter((s): s is KidBoxHomeworkSection => s !== null);

  return {
    packId: `kidbox_hw_${unit?.id ?? 'none'}_${Math.floor(now / DAY_MS)}`,
    generatedAt: now,
    scopeLabel: unit ? getKidBoxUnitLabel(unit) : 'Chưa chọn Unit',
    unitId: unit?.id ?? null,
    sections,
  };
}

/* ------------------------------------------------------------------ */
/* §23 PARENT SKILL STARS + §24 WEEKLY REPORT                           */
/* ------------------------------------------------------------------ */

/**
 * §23 — stars, but only when evidence supports them. A skill with fewer than
 * one attempt shows 0 stars and says "chưa có dữ liệu" instead of guessing.
 */
export function buildSkillStars(knowledge: KidBoxKnowledgeMap): KidBoxSkillStar[] {
  return KIDBOX_SKILLS.map((skill) => {
    const state = knowledge[skill.skillId];
    const attempts = state?.attempts ?? 0;
    const accuracy = attempts > 0 ? Math.round(((state?.correct ?? 0) / attempts) * 100) : 0;

    let stars: KidBoxSkillStar['stars'] = 0;
    if (attempts > 0) {
      for (let i = 0; i < KIDBOX_POLICY.STAR_MIN_ATTEMPTS.length; i += 1) {
        if (attempts >= KIDBOX_POLICY.STAR_MIN_ATTEMPTS[i] && accuracy >= KIDBOX_POLICY.STAR_MIN_ACCURACY[i]) {
          stars = (i + 1) as KidBoxSkillStar['stars'];
        }
      }
      if (accuracy < KIDBOX_POLICY.STAR_WEAK_ACCURACY) stars = 0;
    }

    const label =
      attempts === 0
        ? 'Chưa có dữ liệu'
        : stars === 0
          ? 'Cần luyện thêm'
          : stars >= 4
            ? 'Rất vững'
            : stars >= 2
              ? 'Đang tốt'
              : 'Bắt đầu ổn';

    return {
      skillId: skill.skillId,
      skillName: skill.skillName,
      strand: skill.strand,
      stars,
      evidenceCount: attempts,
      accuracy,
      mastery: state?.mastery ?? 0,
      hasEvidence: attempts > 0,
      label,
    };
  });
}

/** Groups stars by strand for the parent dashboard layout. */
export function buildStrandStars(stars: KidBoxSkillStar[]): Record<KidBoxStrand, KidBoxSkillStar[]> {
  const grouped = {} as Record<KidBoxStrand, KidBoxSkillStar[]>;
  for (const strand of STRANDS) grouped[strand] = [];
  for (const star of stars) grouped[star.strand].push(star);
  return grouped;
}

/**
 * §24 — "this week" only. Never compares the child with other children and
 * never shows a leaderboard.
 */
export function buildWeeklyReport(input: {
  store: KidBoxProgressStore;
  knowledge: KidBoxKnowledgeMap;
  now?: number;
  days?: number;
}): KidBoxWeeklyReport {
  const now = input.now ?? Date.now();
  const days = input.days ?? 7;
  const fromDate = todayISO(now - (days - 1) * DAY_MS);
  const toDate = todayISO(now);

  const totals = {
    wordsPractised: 0,
    listeningSessions: 0,
    speakingAttempts: 0,
    readingPractised: 0,
    reviewItems: 0,
    phonicsPractised: 0,
    patternPractised: 0,
    daysPractised: 0,
  };

  for (const [date, counters] of Object.entries(input.store.counters.days)) {
    if (date < fromDate || date > toDate) continue;
    totals.daysPractised += 1;
    totals.wordsPractised += counters.wordsPractised;
    totals.listeningSessions += counters.listeningSessions;
    totals.speakingAttempts += counters.speakingAttempts;
    totals.readingPractised += counters.readingPractised;
    totals.reviewItems += counters.reviewItems;
    totals.phonicsPractised += counters.phonicsPractised;
    totals.patternPractised += counters.patternPractised;
  }

  const stars = buildSkillStars(input.knowledge);
  const strongestSkills = stars
    .filter((s) => s.hasEvidence && s.stars >= 3)
    .sort((a, b) => b.stars - a.stars || b.accuracy - a.accuracy)
    .slice(0, 4);
  const skillsToPractise = stars
    .filter((s) => s.hasEvidence && s.stars <= 1)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  const notes: string[] = [];
  if (totals.daysPractised === 0) {
    notes.push('Bé chưa luyện English trong tuần này. Gợi ý: bắt đầu bằng 5 phút mỗi ngày.');
  } else {
    if (totals.listeningSessions === 0) notes.push('Chưa có hoạt động nghe trong tuần — nên bổ sung 3 phút nghe mỗi ngày.');
    if (totals.speakingAttempts === 0) notes.push('Chưa có hoạt động nói trong tuần — nên cho bé nói lại từ cùng ba mẹ.');
    if (totals.wordsPractised > 0) notes.push(`Bé đã luyện ${totals.wordsPractised} lượt từ vựng trong tuần.`);
    notes.push('Báo cáo này chỉ so với chính bé trong những tuần trước, không so với bạn khác.');
  }

  const unit = getCurrentUnit(input.store);

  return {
    fromDate,
    toDate,
    ...totals,
    strongestSkills,
    skillsToPractise,
    currentUnitLabel: getKidBoxUnitLabel(unit),
    notes,
  };
}

/** Human summary of what content is still missing (§27/§39). */
export function getContentSourceSummary(): {
  status: 'READY' | 'PARTIAL' | 'CONTENT_SOURCE_REQUIRED';
  mappedUnits: number;
  missingArtifacts: { label: string; unlocks: string }[];
} {
  const readiness = getKidBoxContentReadiness();
  return {
    status: readiness.status,
    mappedUnits: readiness.mappedUnits,
    missingArtifacts: readiness.missingArtifacts.map((a) => ({ label: a.label, unlocks: a.unlocks })),
  };
}

/** Convenience used by the Learning OS bridge and the parent panel. */
export function getKnowledgeSnapshot(): KidBoxKnowledgeMap {
  const knowledgeStates = StorageService.getKnowledgeStates();
  const snapshot: KidBoxKnowledgeMap = {};
  for (const [skillId, state] of Object.entries(knowledgeStates)) {
    snapshot[skillId] = {
      attempts: state.attemptCount,
      correct: state.correctCount,
      recentAccuracy: state.recentAccuracy,
      mastery: state.mastery,
      confidence: state.confidence,
    };
  }
  return snapshot;
}

/** Skills of a strand, exposed for the parent panel's detail view. */
export function getStrandSkillCount(strand: KidBoxStrand): number {
  return getSkillsForStrand(strand).length;
}

/** The child-facing recommendation text, used by the hub and the plan card. */
export function describeFocus(focus: KidBoxPracticeFocus): string {
  const label = FOCUS_LABEL[focus];
  const skill = getKidBoxSkill(FOCUS_SKILL[focus]);
  return `${label.emoji} ${label.title} — ${skill?.description ?? ''}`.trim();
}

/* ------------------------------------------------------------------ */
/* §26 LEARNING OS BRIDGE                                              */
/* ------------------------------------------------------------------ */

/** Track id used for routing only; the Learning OS stays subject-aware. */
export const KIDBOX_TRACK_ID = 'kids-box-companion';

/**
 * Turns the companion's own evidence into `LearningAction`s for the single,
 * shared Learning OS action list (§18 + §26).
 *
 * Only English is produced here, and never for the Vietnamese competition
 * track: the Kid's Box skills are English subject, so they can never be mixed
 * into Trạng Nguyên by accident.
 */
export function buildKidBoxActions(input: {
  knowledge: KidBoxKnowledgeMap;
  store: KidBoxProgressStore;
  isFatigued?: boolean;
  maxActions?: number;
}): LearningAction[] {
  const maxActions = input.maxActions ?? 3;
  const profile = analyseEnglishProfile(input.knowledge);
  const unit = getCurrentUnit(input.store);
  const activities = buildUnitActivities(unit);
  const plan = buildDailyEnglishPlan({
    store: input.store,
    knowledge: input.knowledge,
    ageYears: KIDBOX_POLICY.AGE_MIN,
    isFatigued: input.isFatigued ?? false,
  });

  const actions: LearningAction[] = [];
  const usedSkills = new Set<string>();

  for (const item of plan.items) {
    if (actions.length >= maxActions) break;
    if (usedSkills.has(item.skillId)) continue;
    const activity = activities.find((a) => a.id === item.activityId);
    if (!activity) continue;
    usedSkills.add(item.skillId);

    const type = activity.step === 'GAME' ? 'GAME' : activity.step === 'HEAR' ? 'PRACTICE' : 'PRACTICE';
    actions.push({
      id: `kidbox_${activity.id}`,
      type,
      subject: 'english',
      skillId: item.skillId,
      skillName: getKidBoxSkill(item.skillId)?.skillName ?? item.skillId,
      trackId: KIDBOX_TRACK_ID,
      lessonId: unit.lessons[0]?.id,
      gameId: activity.step === 'GAME' ? 'kidbox_word_safari' : undefined,
      gameTitle: activity.step === 'GAME' ? activity.titleVi : undefined,
      title: `${getKidBoxUnitLabel(unit)} · ${item.title}`,
      description: activity.titleVi,
      reason: item.reason,
      childExplanation: item.childExplanation,
      estimatedMinutes: item.estimatedMinutes,
      priority: 92 - actions.length * 4,
      badgeEmoji: item.emoji,
    });
  }

  if (actions.length === 0) {
    // Nothing to run yet: be explicit instead of pretending.
    actions.push({
      id: 'kidbox_content_required',
      type: 'LEARN',
      subject: 'english',
      trackId: KIDBOX_TRACK_ID,
      title: 'Kid\u2019s Box Companion',
      description: 'Chưa có nội dung Unit đã ánh xạ từ nguồn giáo viên.',
      reason:
        'Kho nội dung giáo trình chưa được cung cấp nên ứng dụng không tự bịa Unit. Xem danh sách nội dung cần bổ sung trong chế độ phụ huynh.',
      childExplanation: 'Khi cô giáo đưa danh sách từ vựng, mình sẽ học Unit mới ngay nha!',
      estimatedMinutes: 2,
      priority: 50,
      badgeEmoji: '📋',
    });
  }

  return actions;
}
