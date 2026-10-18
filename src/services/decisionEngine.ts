/**
 * P39 LEARNING OS DECISION ENGINE — canonical pipeline.
 *
 * observe evidence
 *   → understand current learning state
 *   → identify highest-value need
 *   → select next best action
 *   → explain why
 *   → generate an appropriate session
 *
 * Learning Engine remains the source of truth (§1.1). Decision Engine consumes
 * evidence; it never invents mastery and never compares the child with peers.
 *
 * Determinism: same canonical evidence → same recommendation (§32).
 * No uncontrolled randomness. Equivalent activities may be rotated only when
 * the caller supplies an explicit seed (production personalisation).
 */
import {
  DailyPlan,
  KnowledgeState,
  LearningAction,
  LearningEvidence,
  SessionFatigueState,
} from '../types/learningOS';
import type { SubjectType } from '../types';
import type {
  ActivityAvailability,
  DecisionActivityType,
  DecisionCompetitionReadiness,
  DecisionDailyPlan,
  DecisionEvidenceSummary,
  DecisionInput,
  DecisionMode,
  DecisionOutput,
  DecisionPriorityFactor,
  DecisionRecommendation,
  DecisionReasonCode,
  EvidenceFreshness,
  EvidenceQuality,
  NormalizedEvidence,
  ParentDecisionReport,
  SessionKind,
  SessionPlan,
  SessionPlanItem,
  SessionPhase,
  SkillDecisionState,
} from '../types/decisionEngine';
import { LAUNCHABLE_GAME_IDS, P39_DECISION_POLICY, SPEED_POLICY } from '../config/policy';
import { LearningOS, LEARNING_OS_POLICY } from './learningOS';
import { getAllSkills } from '../data/curriculum';
import { buildKidBoxActions, getCurrentUnit, getKnowledgeSnapshot, getContentSourceSummary, KIDBOX_TRACK_ID } from './kidBoxEngine';
import { KidBoxStore } from './kidBoxStore';
import { StorageService } from './storage';
import { CompetitionEngine } from './competitionEngine';
import { findLessonById } from '../data/curriculum';
import { getBlueprintById } from '../data/competitionBlueprints';
import type { ActiveScreen } from '../types';
import type { ReadinessAssessment } from '../types/competition';
import { READINESS_POLICY } from '../config/policy';

const DAY_MS = 24 * 3600 * 1000;

const SUBJECT_LABEL: Record<SubjectType, string> = {
  'tieng-viet': 'Tiếng Việt',
  toan: 'Toán',
  english: 'English',
  'cuoc-song': 'Em & Cuộc sống',
};

const REASON_LABEL_VI: Record<DecisionReasonCode, string> = {
  SM2_DUE: 'đến hạn ôn tập định kỳ',
  REPEATED_ERRORS: 'có lỗi sai lặp lại',
  RECENT_ACCURACY_DROP: 'độ chính xác gần đây giảm',
  NEEDS_REVIEW: 'cần ôn lại kỹ năng',
  FOUNDATION_GAP: 'thiếu kiến thức nền',
  CURRENT_UNIT: 'thuộc Unit English hiện tại',
  LOW_FLUENCY: 'lưu loát còn thấp',
  LOW_COMPREHENSION: 'hiểu nội dung còn thấp',
  LOW_STABILITY: 'độ ổn định chính xác chưa đủ',
  COMPETITION_READINESS: 'cần chuẩn bị cho Đấu Trường',
  NOT_PRACTICED_RECENTLY: 'chưa luyện kỹ năng này gần đây',
  IMPROVEMENT_OPPORTUNITY: 'có dấu hiệu đang tiến bộ',
  RECOVERY_AFTER_ERROR: 'cần phục hồi sau lỗi',
  DISCOVERY_NEEDED: 'chưa đủ dữ liệu để xác định điểm yếu',
  CONTENT_SOURCE_REQUIRED: 'nội dung nguồn chưa sẵn sàng',
  SUBJECT_BALANCE: 'cân bằng giữa các môn',
  FATIGUE: 'bé đã mệt sau phiên học dài',
  OVERPRACTICE: 'đã luyện quá nhiều kỹ năng này',
  SPEED_SAFE: 'đã đủ chính xác để luyện tốc độ an toàn',
  FOUNDATION_BEFORE_DEPENDENT: 'nắm kỹ năng nền trước',
  ACCURACY_BEFORE_SPEED: 'chính xác trước, tốc độ sau',
  WEAK_BEFORE_MASTERED: 'luyện kỹ năng yếu trước',
  AVAILABILITY_OK: 'hoạt động sẵn sàng mở được',
  RECENT_REPETITION: 'vừa được khuyến nghị hoạt động tương tự',
};

const SESSION_KIND_LABEL: Record<SessionKind, string> = {
  QUICK: 'Phiên nhanh',
  STANDARD: 'Phiên chuẩn',
  FULL: 'Phiên đầy đủ',
  RECOVERY: 'Phục hồi ngắn',
  DISCOVERY: 'Khám phá',
};

/* ------------------------------------------------------------------ */
/* Evidence collection & normalisation                                  */
/* ------------------------------------------------------------------ */

function classifyFreshness(timestamp: number | undefined, now: number): EvidenceFreshness {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return 'UNKNOWN';
  const age = now - timestamp;
  if (age <= P39_DECISION_POLICY.FRESHNESS.RECENT_MAX_MS) return 'RECENT';
  if (age <= P39_DECISION_POLICY.FRESHNESS.OLDER_MAX_MS) return 'OLDER';
  if (age <= P39_DECISION_POLICY.FRESHNESS.STALE_MAX_MS) return 'STALE';
  return 'STALE';
}

function classifyQuality(
  attemptCount: number,
  confidence: number,
  freshness: EvidenceFreshness
): EvidenceQuality {
  if (attemptCount <= 0) return 'UNAVAILABLE';
  if (freshness === 'STALE' && attemptCount < LEARNING_OS_POLICY.MASTERY_LOW_THRESHOLD) return 'STALE';
  if (attemptCount < P39_DECISION_POLICY.MIN_ATTEMPTS_FOR_CONFIDENT_NEED || confidence < 40) return 'PARTIAL';
  if (freshness === 'STALE') return 'STALE';
  return 'VERIFIED';
}

function normalizeKnowledgeState(state: KnowledgeState, now: number): SkillDecisionState {
  const freshness = classifyFreshness(state.lastPracticedAt, now);
  const quality = classifyQuality(state.attemptCount, state.confidence, freshness);
  const reasonCodes = detectSkillReasonCodes(state, now);
  const needScore = computeNeedScore(state, reasonCodes, quality, freshness);

  return {
    skillId: state.skillId,
    skillName: state.skillName,
    subject: state.subject,
    status: state.status,
    mastery: state.mastery,
    confidence: state.confidence,
    accuracy: state.accuracy,
    recentAccuracy: state.recentAccuracy,
    attemptCount: state.attemptCount,
    correctCount: state.correctCount,
    consecutiveCorrect: state.consecutiveCorrect,
    consecutiveIncorrect: state.consecutiveIncorrect,
    lastPracticedAt: state.lastPracticedAt,
    nextReviewAt: state.nextReviewAt,
    averageResponseTimeMs: state.averageResponseTimeMs,
    quality,
    freshness,
    reasonCodes,
    needScore,
  };
}

function detectSkillReasonCodes(state: KnowledgeState, now: number): DecisionReasonCode[] {
  const codes: DecisionReasonCode[] = [];
  if (state.attemptCount <= 0) return ['DISCOVERY_NEEDED'];

  if (state.nextReviewAt && state.nextReviewAt <= now) codes.push('SM2_DUE');
  if (state.status === 'NEEDS_REVIEW') codes.push('NEEDS_REVIEW');
  if (state.consecutiveIncorrect >= 2) codes.push('REPEATED_ERRORS');
  if (state.errorProfile.knowledgeGap > 0 && state.status === 'NEEDS_REVIEW') codes.push('FOUNDATION_GAP');
  if (
    state.attemptCount >= 3 &&
    state.recentAccuracy + 10 < state.accuracy &&
    state.recentAccuracy < state.accuracy
  ) {
    codes.push('RECENT_ACCURACY_DROP');
  }
  if (state.consecutiveCorrect >= 2 && state.status === 'NEEDS_REVIEW') codes.push('RECOVERY_AFTER_ERROR');
  if (state.status === 'PRACTICING' && state.recentAccuracy > state.accuracy + 5) {
    codes.push('IMPROVEMENT_OPPORTUNITY');
  }
  if (state.attemptCount >= 2 && state.accuracy < 70) codes.push('LOW_STABILITY');

  // Speed safety: only flag SPEED_SAFE when accuracy is stable.
  const slow =
    state.averageResponseTimeMs &&
    state.accuracy >= SPEED_POLICY.HIGH_ACCURACY_MIN &&
    state.averageResponseTimeMs > SPEED_POLICY.SPEED_PRACTICE_MIN_SECONDS * 1000 &&
    state.consecutiveCorrect >= P39_DECISION_POLICY.SPEED.STABILITY_GATE;
  if (slow) codes.push('SPEED_SAFE');

  // Reading-specific signals (P27.5 ladder feeds the same Learning OS).
  if (state.skillId.startsWith('rf_')) {
    if (state.recentAccuracy < READING_ACCURACY_GATE && state.attemptCount >= 3) {
      codes.push('LOW_FLUENCY');
      codes.push('ACCURACY_BEFORE_SPEED');
    }
    if (state.recentAccuracy >= READING_ACCURACY_GATE && state.status !== 'MASTERED') {
      codes.push('IMPROVEMENT_OPPORTUNITY');
    }
  }

  if (state.attemptCount > 0 && state.lastPracticedAt && now - state.lastPracticedAt > 7 * DAY_MS) {
    codes.push('NOT_PRACTICED_RECENTLY');
  }

  // Deduplicate while preserving order.
  return Array.from(new Set(codes));
}

const READING_ACCURACY_GATE = 80;

function qualityMultiplier(quality: EvidenceQuality): number {
  return P39_DECISION_POLICY.QUALITY_MULTIPLIER[quality];
}

function freshnessMultiplier(freshness: EvidenceFreshness): number {
  return P39_DECISION_POLICY.FRESHNESS_MULTIPLIER[freshness];
}

function computeNeedScore(
  state: KnowledgeState,
  codes: DecisionReasonCode[],
  quality: EvidenceQuality,
  freshness: EvidenceFreshness
): number {
  if (quality === 'UNAVAILABLE') return 0;
  const q = qualityMultiplier(quality);
  const f = freshnessMultiplier(freshness);
  let raw = 0;
  for (const code of codes) {
    raw += P39_DECISION_POLICY.WEIGHT[code] ?? 0;
  }
  // Higher recent error rate raises need; mastered high accuracy lowers it.
  const errorBoost = Math.max(0, 60 - state.recentAccuracy) * 0.4;
  const masteryRelief = state.status === 'MASTERED' ? -10 : 0;
  return Math.round(Math.max(0, (raw + errorBoost + masteryRelief) * q * f));
}

/* ------------------------------------------------------------------ */
/* Activity availability (§23)                                          */
/* ------------------------------------------------------------------ */

export function assessActivityAvailability(action: LearningAction): {
  availability: ActivityAvailability;
  route: ActiveScreen | null;
} {
  // Track actions (Kid's Box) always route to the companion screen.
  if (action.trackId === KIDBOX_TRACK_ID || action.trackId === 'kids-box-companion') {
    return { availability: 'AVAILABLE', route: 'kidbox_companion' };
  }

  switch (action.type) {
    case 'LEARN': {
      if (!action.lessonId) return { availability: 'UNAVAILABLE', route: null };
      const lesson = findLessonById(action.lessonId);
      if (!lesson) return { availability: 'UNAVAILABLE', route: null };
      return { availability: 'AVAILABLE', route: 'subject' };
    }
    case 'PRACTICE':
    case 'REVIEW':
    case 'SPEED_PRACTICE': {
      if (action.skillId?.startsWith('rf_')) {
        return { availability: 'AVAILABLE', route: 'reading_fluency' };
      }
      // Practice/review always launch via Daily Review (question bank is present).
      return { availability: 'AVAILABLE', route: 'daily_review' };
    }
    case 'COMPETITION':
    case 'MOCK_EXAM': {
      if (action.examBlueprintId) {
        const bp = getBlueprintById(action.examBlueprintId);
        if (!bp) return { availability: 'UNAVAILABLE', route: null };
      }
      return { availability: 'AVAILABLE', route: 'competition' };
    }
    case 'GAME': {
      if (action.gameId && action.gameId !== 'kidbox_word_safari' && !(LAUNCHABLE_GAME_IDS as readonly string[]).includes(action.gameId)) {
        return { availability: 'UNAVAILABLE', route: null };
      }
      return { availability: 'AVAILABLE', route: 'games' };
    }
    case 'MAINTENANCE':
      return { availability: 'UNAVAILABLE', route: null };
    default:
      return { availability: 'UNAVAILABLE', route: null };
  }
}

/* ------------------------------------------------------------------ */
/* Mapping LearningAction → DecisionActivityType                        */
/* ------------------------------------------------------------------ */

function toDecisionActivityType(action: LearningAction): DecisionActivityType {
  if (action.trackId === KIDBOX_TRACK_ID) {
    if (action.gameId) return 'GAME';
    if (action.skillId?.startsWith('EN-LISTENING')) return 'LISTENING';
    if (action.skillId?.startsWith('EN-SPEAKING')) return 'SPEAKING';
    if (action.skillId?.startsWith('EN-READING')) return 'READING';
    return 'PRACTICE';
  }
  switch (action.type) {
    case 'REVIEW':
      return 'REVIEW';
    case 'PRACTICE':
      return 'PRACTICE';
    case 'LEARN':
      return 'LESSON';
    case 'SPEED_PRACTICE':
      return 'PRACTICE';
    case 'GAME':
      return 'GAME';
    case 'COMPETITION':
    case 'MOCK_EXAM':
      return 'COMPETITION';
    case 'MAINTENANCE':
      return 'DISCOVERY';
    default:
      return 'PRACTICE';
  }
}

function phaseForAction(action: LearningAction, kind: SessionKind): SessionPhase {
  if (kind === 'DISCOVERY') return 'DISCOVERY';
  if (kind === 'RECOVERY') return 'PRACTICE';
  switch (action.type) {
    case 'REVIEW':
      return 'REVIEW';
    case 'LEARN':
      return 'WARM_UP';
    case 'PRACTICE':
      return 'PRACTICE';
    case 'SPEED_PRACTICE':
      return 'REINFORCEMENT';
    case 'GAME':
      return 'REINFORCEMENT';
    case 'COMPETITION':
    case 'MOCK_EXAM':
      return 'CHECK';
    default:
      return 'PRACTICE';
  }
}

/* ------------------------------------------------------------------ */
/* Priority factors                                                     */
/* ------------------------------------------------------------------ */

function buildPriorityFactors(
  skillState: SkillDecisionState | undefined,
  action: LearningAction,
  context: {
    fatigue: SessionFatigueState;
    history: DecisionInput['recommendationHistory'];
    now: number;
    subjectBalanceBoost: number;
    currentUnit: boolean;
  }
): DecisionPriorityFactor[] {
  const factors: DecisionPriorityFactor[] = [];
  const q = qualityMultiplier(skillState?.quality ?? 'UNAVAILABLE');
  const f = freshnessMultiplier(skillState?.freshness ?? 'UNKNOWN');

  const push = (code: DecisionReasonCode, detail: string, extraMultiplier = 1) => {
    const weight = P39_DECISION_POLICY.WEIGHT[code] ?? 0;
    if (weight === 0) return;
    const multiplier = Math.min(1, Math.max(0, q * f * extraMultiplier));
    factors.push({
      code,
      weight,
      multiplier,
      contribution: Math.round(weight * multiplier),
      detail,
    });
  };

  if (skillState) {
    for (const code of skillState.reasonCodes) {
      if (code === 'SPEED_SAFE') {
        push(code, `Chính xác ${skillState.recentAccuracy}% đã ổn định`);
        continue;
      }
      if (code === 'SM2_DUE') {
        // Spaced-review due date is a deterministic schedule fact, not
        // uncertain accuracy evidence — never decay it by quality/freshness.
        factors.push({
          code: 'SM2_DUE',
          weight: P39_DECISION_POLICY.WEIGHT.SM2_DUE,
          multiplier: 1,
          contribution: P39_DECISION_POLICY.WEIGHT.SM2_DUE,
          detail: `${skillState.skillName}: ${REASON_LABEL_VI.SM2_DUE}`,
        });
        continue;
      }
      push(code, `${skillState.skillName}: ${REASON_LABEL_VI[code]}`);
    }

    if (skillState.status === 'NEEDS_REVIEW' && !skillState.reasonCodes.includes('NEEDS_REVIEW')) {
      push('NEEDS_REVIEW', `${skillState.skillName} đang ở trạng thái cần ôn`);
    }
    if (skillState.status === 'MASTERED' && skillState.attemptCount > 0) {
      // Mastered skills are not a primary need unless spaced review is due.
      if (!skillState.reasonCodes.includes('SM2_DUE')) {
        factors.push({
          code: 'WEAK_BEFORE_MASTERED',
          weight: P39_DECISION_POLICY.WEIGHT.WEAK_BEFORE_MASTERED,
          multiplier: 1,
          contribution: P39_DECISION_POLICY.WEIGHT.WEAK_BEFORE_MASTERED,
          detail: `${skillState.skillName} đã vững — ưu tiên kỹ năng yếu hơn`,
        });
      }
    }
  }

  if (context.currentUnit) {
    push('CURRENT_UNIT', 'Thuộc Unit English hiện tại của bé');
  }

  if (context.subjectBalanceBoost > 0) {
    const code: DecisionReasonCode = 'SUBJECT_BALANCE';
    const weight = P39_DECISION_POLICY.WEIGHT[code];
    const normalized = Math.min(
      1,
      context.subjectBalanceBoost / P39_DECISION_POLICY.SUBJECT_BALANCE.BOOST
    );
    factors.push({
      code,
      weight,
      multiplier: 1,
      contribution: Math.round(weight * normalized),
      detail: 'Cân bằng giữa các môn theo lịch sử luyện tập thật',
    });
  }

  if (context.fatigue.isFatigued) {
    factors.push({
      code: 'FATIGUE',
      weight: P39_DECISION_POLICY.WEIGHT.FATIGUE,
      multiplier: 1,
      contribution: P39_DECISION_POLICY.WEIGHT.FATIGUE,
      detail: 'Phiên học dài — ưu tiên hoạt động nhẹ hơn',
    });
  }

  // Repetition control
  const hist = context.history ?? [];
  const recentSame = hist.find(
    (h) =>
      (h.skillId && h.skillId === action.skillId && h.type === action.type) ||
      h.actionId === action.id
  );
  if (recentSame && context.now - recentSame.timestamp < P39_DECISION_POLICY.REPETITION.COOLDOWN_MS) {
    const recovery = skillState?.reasonCodes.some((c) =>
      (P39_DECISION_POLICY.REPETITION.RECOVERY_REASONS as string[]).includes(c)
    );
    if (!recovery) {
      factors.push({
        code: 'RECENT_REPETITION',
        weight: P39_DECISION_POLICY.WEIGHT.RECENT_REPETITION,
        multiplier: 1,
        contribution: P39_DECISION_POLICY.WEIGHT.RECENT_REPETITION,
        detail: 'Vừa được khuyến nghị hoạt động tương tự',
      });
    }
  }

  // Over-practice penalty for already-mastered, heavily practiced skills
  if (
    skillState &&
    skillState.attemptCount >= LEARNING_OS_POLICY.OVERPRACTICE_THRESHOLD &&
    skillState.accuracy >= 90 &&
    skillState.status !== 'NEEDS_REVIEW'
  ) {
    factors.push({
      code: 'OVERPRACTICE',
      weight: P39_DECISION_POLICY.WEIGHT.OVERPRACTICE,
      multiplier: 1,
      contribution: P39_DECISION_POLICY.WEIGHT.OVERPRACTICE,
      detail: `${skillState.skillName} đã luyện rất nhiều và chính xác cao`,
    });
  }

  // Availability is a constraint, not a score — record it when known.
  if (action.lessonId || action.gameId || action.examBlueprintId || action.skillId) {
    factors.push({
      code: 'AVAILABILITY_OK',
      weight: P39_DECISION_POLICY.WEIGHT.AVAILABILITY_OK,
      multiplier: 1,
      contribution: P39_DECISION_POLICY.WEIGHT.AVAILABILITY_OK,
      detail: 'Hoạt động có thể mở được trong ứng dụng',
    });
  }

  // Deduplicate by code (keep highest contribution)
  const byCode = new Map<DecisionReasonCode, DecisionPriorityFactor>();
  for (const factor of factors) {
    const prev = byCode.get(factor.code);
    if (!prev || Math.abs(factor.contribution) > Math.abs(prev.contribution)) {
      byCode.set(factor.code, factor);
    }
  }
  return Array.from(byCode.values()).sort((a, b) => b.contribution - a.contribution);
}

function scoreFromFactors(factors: DecisionPriorityFactor[]): number {
  return Math.round(factors.reduce((sum, f) => sum + f.contribution, 0));
}

/* ------------------------------------------------------------------ */
/* Explanation                                                          */
/* ------------------------------------------------------------------ */

function buildExplanation(
  action: LearningAction,
  skillState: SkillDecisionState | undefined,
  factors: DecisionPriorityFactor[],
  availability: ActivityAvailability,
  reasonCodes: DecisionReasonCode[],
  language: 'vi' | 'en' = 'vi'
): DecisionRecommendation['explanation'] {
  const positive = factors.filter((f) => f.contribution > 0);
  const why =
    positive.length > 0
      ? positive
          .slice(0, 3)
          .map((f) => f.detail)
          .join('; ')
      : action.reason;

  const evidenceLines: string[] = [];
  if (skillState) {
    evidenceLines.push(
      `${skillState.skillName}: ${skillState.attemptCount} lượt, chính xác ${skillState.accuracy}% (gần đây ${skillState.recentAccuracy}%)`
    );
    evidenceLines.push(`Trạng thái: ${skillState.status} · Chất lượng dữ liệu: ${skillState.quality} · Mới cũ: ${skillState.freshness}`);
    if (skillState.nextReviewAt) {
      evidenceLines.push(`Hạn ôn tiếp theo: ${new Date(skillState.nextReviewAt).toISOString().slice(0, 10)}`);
    }
  } else {
    evidenceLines.push('Chưa có hồ sơ kỹ năng chi tiết cho hoạt động này — dựa trên lịch sử hoạt động tổng thể.');
  }
  evidenceLines.push(`Khả năng mở: ${availability === 'AVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE'}`);
  if (reasonCodes.length > 0) {
    evidenceLines.push(`Mã lý do: ${reasonCodes.join(', ')}`);
  }

  const childText =
    language === 'en'
      ? action.childExplanation
      : action.childExplanation;

  return {
    what: action.title,
    why,
    howLong: action.estimatedMinutes,
    childText,
    reasonCodes,
    evidenceLines,
  };
}

/* ------------------------------------------------------------------ */
/* Competition readiness bridge                                         */
/* ------------------------------------------------------------------ */

function mapCompetitionReadiness(assessment: ReadinessAssessment | null | undefined): {
  state: DecisionCompetitionReadiness | null;
  label: string | null;
  allowMock: boolean;
  accuracyStable: boolean;
} {
  if (!assessment || !assessment.isSufficientData) {
    return {
      state: assessment ? 'NOT_READY' : null,
      label: assessment ? assessment.overallLabel : null,
      allowMock: false,
      accuracyStable: false,
    };
  }

  const accuracyStable =
    assessment.accuracyScore >= P39_DECISION_POLICY.COMPETITION.ACCURACY_STABILITY_GATE &&
    assessment.consistencyScore >= P39_DECISION_POLICY.COMPETITION.CONSISTENCY_GATE;

  let state: DecisionCompetitionReadiness;
  if (assessment.overallLevel === 'READY_FOR_MOCK') {
    state = assessment.speedScore >= 80 ? 'SPEED_READY' : 'FLUENCY_READY';
    if (assessment.overallLevel === 'READY_FOR_MOCK' && accuracyStable) {
      state = assessment.speedScore >= 80 ? 'COMPETITION_READY' : 'MOCK_READY';
    }
  } else if (assessment.overallLevel === 'STRONG') {
    state = accuracyStable ? 'FLUENCY_READY' : 'ACCURACY_READY';
  } else if (assessment.overallLevel === 'PRACTICING') {
    state = accuracyStable ? 'ACCURACY_READY' : 'BUILDING_FOUNDATION';
  } else {
    state = 'BUILDING_FOUNDATION';
  }

  // P39 §21: unstable accuracy → accuracy practice, NOT mock.
  if (!accuracyStable && (state === 'MOCK_READY' || state === 'COMPETITION_READY' || state === 'SPEED_READY')) {
    state = 'ACCURACY_READY';
  }

  return {
    state,
    label: assessment.overallLabel,
    allowMock: state === 'MOCK_READY' || state === 'COMPETITION_READY' || state === 'FLUENCY_READY',
    accuracyStable,
  };
}

/* ------------------------------------------------------------------ */
/* Subject balance                                                      */
/* ------------------------------------------------------------------ */

function computeSubjectBalanceBoost(
  knowledgeMap: Record<string, KnowledgeState>,
  recentEvidences: LearningEvidence[],
  history: DecisionInput['recommendationHistory']
): Partial<Record<SubjectType, number>> {
  const attempts: Record<SubjectType, number> = {
    'tieng-viet': 0,
    toan: 0,
    english: 0,
    'cuoc-song': 0,
  };

  // Prefer real evidence timestamps; fall back to knowledge state counts.
  const windowStart = Date.now() - 14 * DAY_MS;
  for (const ev of recentEvidences) {
    if (typeof ev.timestamp === 'number' && ev.timestamp >= windowStart) {
      attempts[ev.subject] = (attempts[ev.subject] ?? 0) + 1;
    }
  }

  if (recentEvidences.length === 0) {
    for (const state of Object.values(knowledgeMap)) {
      attempts[state.subject] = (attempts[state.subject] ?? 0) + state.attemptCount;
    }
  }

  const subjects = Object.keys(attempts) as SubjectType[];
  const maxAttempts = Math.max(...subjects.map((s) => attempts[s]), 0);
  const boosts: Partial<Record<SubjectType, number>> = {};

  if (maxAttempts >= P39_DECISION_POLICY.SUBJECT_BALANCE.STARVATION_ATTEMPTS) {
    for (const subject of subjects) {
      if (attempts[subject] === 0) {
        boosts[subject] = P39_DECISION_POLICY.SUBJECT_BALANCE.BOOST;
      }
    }
  }

  // If recommendation history is heavily skewed to one subject, starve the others.
  if (history && history.length >= 5) {
    const bySubject: Record<SubjectType, number> = { 'tieng-viet': 0, toan: 0, english: 0, 'cuoc-song': 0 };
    const states = Object.values(knowledgeMap);
    for (const h of history) {
      const st = states.find((s) => s.skillId === h.skillId);
      if (st) bySubject[st.subject] += 1;
    }
    const histMax = Math.max(bySubject['tieng-viet'], bySubject.toan, bySubject.english, bySubject['cuoc-song']);
    if (histMax >= 5) {
      for (const subject of subjects) {
        if (bySubject[subject] === 0) {
          boosts[subject] = Math.max(boosts[subject] ?? 0, P39_DECISION_POLICY.SUBJECT_BALANCE.BOOST);
        }
      }
    }
  }

  return boosts;
}

/* ------------------------------------------------------------------ */
/* Recommendation enrichment                                            */
/* ------------------------------------------------------------------ */

function toDecisionRecommendation(
  action: LearningAction,
  skillState: SkillDecisionState | undefined,
  context: {
    fatigue: SessionFatigueState;
    history: DecisionInput['recommendationHistory'];
    now: number;
    subjectBalanceBoost: Partial<Record<SubjectType, number>>;
    kidboxUnitLabel: string | null;
  }
): DecisionRecommendation {
  const availabilityInfo = assessActivityAvailability(action);
  const currentUnit =
    action.trackId === KIDBOX_TRACK_ID && !!context.kidboxUnitLabel;

  const factors = buildPriorityFactors(skillState, action, {
    fatigue: context.fatigue,
    history: context.history,
    now: context.now,
    subjectBalanceBoost: context.subjectBalanceBoost[action.subject] ?? 0,
    currentUnit,
  });

  // Force DISCOVERY reason on cold-start style actions with no skill evidence.
  if (!skillState || skillState.quality === 'UNAVAILABLE') {
    if (!factors.some((f) => f.code === 'DISCOVERY_NEEDED')) {
      factors.unshift({
        code: 'DISCOVERY_NEEDED',
        weight: P39_DECISION_POLICY.WEIGHT.DISCOVERY_NEEDED,
        multiplier: 1,
        contribution: P39_DECISION_POLICY.WEIGHT.DISCOVERY_NEEDED,
        detail: 'Chưa đủ dữ liệu — khuyến nghị khám phá / chẩn đoán thay vì bịa điểm yếu',
      });
    }
  }

  // Competition progression safety
  if (action.type === 'COMPETITION' || action.type === 'MOCK_EXAM') {
    // Mock/competition only stays if accuracy is stable for related evidence.
    const related = skillState;
    const unstable =
      !related ||
      related.quality === 'UNAVAILABLE' ||
      related.recentAccuracy < P39_DECISION_POLICY.COMPETITION.ACCURACY_STABILITY_GATE;
    if (unstable) {
      // Downgrade: push accuracy practice factors up by penalising competition.
      factors.push({
        code: 'LOW_STABILITY',
        weight: P39_DECISION_POLICY.WEIGHT.LOW_STABILITY,
        multiplier: 1,
        contribution: P39_DECISION_POLICY.WEIGHT.LOW_STABILITY,
        detail: 'Chính xác chưa ổn định — ưu tiên luyện chính xác trước Đấu Trường',
      });
      // Soft-block mock by reducing score via a synthetic penalty factor.
      factors.push({
        code: 'ACCURACY_BEFORE_SPEED',
        weight: P39_DECISION_POLICY.WEIGHT.ACCURACY_BEFORE_SPEED,
        multiplier: 1,
        contribution: -P39_DECISION_POLICY.WEIGHT.ACCURACY_BEFORE_SPEED * 2,
        detail: 'Không đề nghị mock khi nền chính xác chưa chắc',
      });
    }
  }

  // Speed safety: demote SPEED_PRACTICE unless accuracy gate is met.
  if (action.type === 'SPEED_PRACTICE') {
    const ok =
      skillState &&
      skillState.quality !== 'UNAVAILABLE' &&
      skillState.recentAccuracy >= P39_DECISION_POLICY.SPEED.ACCURACY_GATE &&
      skillState.consecutiveCorrect >= P39_DECISION_POLICY.SPEED.STABILITY_GATE;
    if (!ok) {
      factors.push({
        code: 'ACCURACY_BEFORE_SPEED',
        weight: P39_DECISION_POLICY.WEIGHT.ACCURACY_BEFORE_SPEED,
        multiplier: 1,
        contribution: -P39_DECISION_POLICY.WEIGHT.ACCURACY_BEFORE_SPEED * 3,
        detail: 'Chính xác chưa đủ ổn định — không luyện tốc độ lúc này',
      });
    } else {
      factors.push({
        code: 'SPEED_SAFE',
        weight: P39_DECISION_POLICY.WEIGHT.SPEED_SAFE,
        multiplier: 1,
        contribution: P39_DECISION_POLICY.WEIGHT.SPEED_SAFE,
        detail: 'Đã đủ chính xác ổn định để luyện tốc độ an toàn',
      });
    }
  }

  const reasonCodes = Array.from(
    new Set([
      ...factors.filter((f) => f.contribution > 0).map((f) => f.code),
      ...(skillState?.reasonCodes ?? []),
      ...(currentUnit ? (['CURRENT_UNIT'] as DecisionReasonCode[]) : []),
    ])
  );

  // Keep only codes that are documented.
  const documented = reasonCodes.filter((c) => c in REASON_LABEL_VI);

  const priorityScore = scoreFromFactors(factors);
  const explanation = buildExplanation(
    action,
    skillState,
    factors,
    availabilityInfo.availability,
    documented
  );

  return {
    ...action,
    recommendationId: action.id,
    reasonCodes: documented,
    priorityFactors: factors,
    priorityScore,
    activityType: toDecisionActivityType(action),
    availability: availabilityInfo.availability,
    evidenceQuality: skillState?.quality ?? 'UNAVAILABLE',
    evidenceFreshness: skillState?.freshness ?? 'UNKNOWN',
    explanation,
    launchRoute: availabilityInfo.route,
  };
}

/* ------------------------------------------------------------------ */
/* Public Decision Engine                                               */
/* ------------------------------------------------------------------ */

export interface CollectedEvidence {
  knowledgeMap: Record<string, KnowledgeState>;
  recentEvidences: LearningEvidence[];
  fatigue: SessionFatigueState;
  trackActions: LearningAction[];
  competitionReadiness: ReadinessAssessment | null;
  kidboxUnitLabel: string | null;
  skillMeta: Map<string, { skillName: string; subject: SubjectType }>;
  totalAttempts: number;
}

export class DecisionEngine {
  /**
   * Collects real evidence from Learning OS, Kid's Box, Competition and storage.
   * Never fabricates timestamps or mastery.
   */
  public static collectEvidence(input: DecisionInput = {}, now: number = Date.now()): CollectedEvidence {
    const store = input.knowledgeMap
      ? {
          knowledgeStates: input.knowledgeMap,
          recentEvidences: input.recentEvidences ?? [],
          fatigue: input.fatigue ?? {
            sessionStartTime: now,
            questionsAnsweredThisSession: 0,
            sessionErrorsCount: 0,
            consecutiveErrorsInSession: 0,
            isFatigued: false,
          },
        }
      : StorageService.getLearningOSStore();

    const knowledgeMap = input.knowledgeMap ?? store.knowledgeStates;
    const recentEvidences = input.recentEvidences ?? store.recentEvidences;
    const fatigue = input.fatigue ?? store.fatigue;

    let trackActions = input.trackActions;
    if (!trackActions) {
      try {
        trackActions = buildKidBoxActions({
          knowledge: getKnowledgeSnapshot(),
          store: KidBoxStore.get(),
          isFatigued: fatigue.isFatigued,
        });
      } catch {
        trackActions = [];
      }
    }

    let competitionReadiness = input.competitionReadiness;
    if (competitionReadiness === undefined) {
      try {
        const history = StorageService.getCompetitionHistory();
        competitionReadiness = CompetitionEngine.assessReadiness(history.examResults ?? []);
      } catch {
        competitionReadiness = null;
      }
    }

    let kidboxUnitLabel = input.kidboxUnitLabel;
    if (kidboxUnitLabel === undefined) {
      try {
        const summary = getContentSourceSummary();
        const unit = getCurrentUnit(KidBoxStore.get());
        kidboxUnitLabel = summary.status === 'CONTENT_SOURCE_REQUIRED' ? null : (unit?.title ?? null);
      } catch {
        kidboxUnitLabel = null;
      }
    }

    const skillMeta = new Map<string, { skillName: string; subject: SubjectType }>();
    for (const skill of getAllSkills()) {
      skillMeta.set(skill.skillId, { skillName: skill.skillName, subject: skill.subject });
    }
    for (const [skillId, state] of Object.entries(knowledgeMap)) {
      if (!skillMeta.has(skillId)) {
        skillMeta.set(skillId, { skillName: state.skillName || skillId, subject: state.subject });
      }
    }

    const totalAttempts = Object.values(knowledgeMap).reduce((sum, s) => sum + s.attemptCount, 0);

    return {
      knowledgeMap,
      recentEvidences,
      fatigue,
      trackActions: trackActions ?? [],
      competitionReadiness: competitionReadiness ?? null,
      kidboxUnitLabel: kidboxUnitLabel ?? null,
      skillMeta,
      totalAttempts,
    };
  }

  /**
   * Aggregates transparent skill decision states from Learning OS knowledge.
   * Deterministic — pure function of state + clock.
   */
  public static aggregateSkillStates(
    knowledgeMap: Record<string, KnowledgeState>,
    now: number = Date.now()
  ): SkillDecisionState[] {
    return Object.values(knowledgeMap)
      .map((state) => normalizeKnowledgeState(state, now))
      .sort((a, b) => b.needScore - a.needScore || a.skillId.localeCompare(b.skillId));
  }

  /**
   * Builds evidence summary with quality / freshness breakdowns.
   */
  public static buildEvidenceSummary(
    evidence: CollectedEvidence,
    skillStates: SkillDecisionState[]
  ): DecisionEvidenceSummary {
    const qualityBreakdown: Record<EvidenceQuality, number> = {
      VERIFIED: 0,
      PARTIAL: 0,
      STALE: 0,
      UNAVAILABLE: 0,
    };
    const freshnessBreakdown: Record<EvidenceFreshness, number> = {
      RECENT: 0,
      OLDER: 0,
      STALE: 0,
      UNKNOWN: 0,
    };
    const subjectAttemptCounts: Record<SubjectType, number> = {
      'tieng-viet': 0,
      toan: 0,
      english: 0,
      'cuoc-song': 0,
    };

    for (const state of skillStates) {
      qualityBreakdown[state.quality] += 1;
      freshnessBreakdown[state.freshness] += 1;
      subjectAttemptCounts[state.subject] += state.attemptCount;
    }

    return {
      totalSkillsTracked: skillStates.length,
      skillsWithEvidence: skillStates.filter((s) => s.attemptCount > 0).length,
      totalAttempts: evidence.totalAttempts,
      qualityBreakdown,
      freshnessBreakdown,
      subjectAttemptCounts,
    };
  }

  /**
   * Full deterministic decision pipeline.
   *
   * Given identical canonical evidence the output is identical (§32).
   */
  public static decide(input: DecisionInput = {}): DecisionOutput {
    const now = input.now ?? Date.now();
    const evidence = this.collectEvidence(input, now);
    const skillStates = this.aggregateSkillStates(evidence.knowledgeMap, now);
    const skillById = new Map(skillStates.map((s) => [s.skillId, s]));

    const subjectBalanceBoost = computeSubjectBalanceBoost(
      evidence.knowledgeMap,
      evidence.recentEvidences,
      input.recommendationHistory
    );

    const readiness = mapCompetitionReadiness(evidence.competitionReadiness);

    // Build base action candidates from Learning OS (source of truth).
    // Core skills and track actions are merged, then scored together — a track
    // never blindly outranks a measured NEEDS_REVIEW in another subject (§13).
    const coreActions = LearningOS.getNextBestActions(
      evidence.knowledgeMap,
      evidence.fatigue,
      now,
      []
    );
    const trackActions = evidence.trackActions ?? [];
    const baseActions = [...coreActions];
    for (const track of trackActions) {
      if (!baseActions.some((a) => a.id === track.id)) baseActions.push(track);
    }

    // Fatigue override: only rest / light game remains available.
    const isFatigued = evidence.fatigue.isFatigued;

    const enriched: DecisionRecommendation[] = [];
    for (const action of baseActions) {
      // Constraint filter: competition progression
      if (
        (action.type === 'COMPETITION' || action.type === 'MOCK_EXAM') &&
        !readiness.allowMock &&
        readiness.state !== null
      ) {
        // Allow only if the Learning OS itself produced it with strong mastery
        // AND readiness is not actively blocking. When readiness says NOT_READY /
        // BUILDING_FOUNDATION without accuracy, demote to practice later via score.
        // We keep the candidate but scoreFromFactors already applied penalties.
      }

      const skillState = action.skillId ? skillById.get(action.skillId) : undefined;
      const rec = toDecisionRecommendation(action, skillState, {
        fatigue: evidence.fatigue,
        history: input.recommendationHistory,
        now,
        subjectBalanceBoost,
        kidboxUnitLabel: evidence.kidboxUnitLabel,
      });
      enriched.push(rec);
    }

    // Add explicit subject-balance candidates for starved subjects that have
    // curriculum skills but zero recent practice — only when not cold start.
    if (evidence.totalAttempts >= P39_DECISION_POLICY.COLD_START_EVIDENCE_THRESHOLD) {
      for (const [subject, boost] of Object.entries(subjectBalanceBoost) as [SubjectType, number][]) {
        if (!boost) continue;
        const subjectSkills = skillStates.filter((s) => s.subject === subject);
        const hasCandidate = enriched.some((r) => r.subject === subject);
        if (hasCandidate || subjectSkills.length === 0) continue;

        // Pick weakest practiced skill in that subject, or a curriculum lesson.
        const practiced = subjectSkills.filter((s) => s.attemptCount > 0);
        const target = practiced.sort((a, b) => a.recentAccuracy - b.recentAccuracy)[0];
        const action: LearningAction = target
          ? {
              id: `balance_${target.skillId}`,
              type: 'PRACTICE',
              subject,
              skillId: target.skillId,
              skillName: target.skillName,
              title: `Luyện cân bằng: ${target.skillName}`,
              description: `Môn ${SUBJECT_LABEL[subject]} đã bị bỏ qua thời gian dài — luyện nhẹ để giữ nhịp.`,
              reason: `Chưa luyện ${SUBJECT_LABEL[subject]} trong khi các môn khác đã có nhiều lượt.`,
              childExplanation: `Mình cùng làm vài câu ${SUBJECT_LABEL[subject]} cho vui nhé!`,
              estimatedMinutes: 4,
              priority: 70,
              badgeEmoji: subject === 'toan' ? '🔢' : subject === 'english' ? '🐰' : subject === 'cuoc-song' ? '💜' : '📚',
            }
          : {
              id: `balance_lesson_${subject}`,
              type: 'LEARN',
              subject,
              title: `Khám phá ${SUBJECT_LABEL[subject]}`,
              description: 'Một bài học ngắn để làm quen lại môn học.',
              reason: `Cân bằng theo lịch sử luyện tập thật của bé.`,
              childExplanation: 'Mình làm một bài nhỏ cho vui nhé!',
              estimatedMinutes: 5,
              priority: 65,
              badgeEmoji: '🌟',
            };

        // Prefer an existing lesson for the subject if present.
        if (action.type === 'LEARN') {
          // Leave lessonId unset → availability UNAVAILABLE unless we find one.
          // Find first lesson for subject.
          const allSkills = getAllSkills().filter((s) => s.subject === subject);
          const skillId = allSkills[0]?.skillId;
          if (skillId) {
            // Daily review can still run without a specific lesson.
            action.type = 'PRACTICE';
            action.skillId = skillId;
            action.skillName = allSkills[0].skillName;
          }
        }

        enriched.push(
          toDecisionRecommendation(action, target, {
            fatigue: evidence.fatigue,
            history: input.recommendationHistory,
            now,
            subjectBalanceBoost,
            kidboxUnitLabel: evidence.kidboxUnitLabel,
          })
        );
      }
    }

    // Constraint filter: drop dead-end activities when requireAvailable.
    const requireAvailable = input.requireAvailable ?? true;
    let candidates = enriched;
    if (requireAvailable) {
      candidates = candidates.filter((c) => c.availability === 'AVAILABLE');
    }

    // Repetition control is encoded in priority factors; re-sort after.
    candidates.sort(
      (a, b) => b.priorityScore - a.priorityScore || a.id.localeCompare(b.id)
    );

    // Deduplicate by skill for daily plan variety (keep highest score).
    const seenSkills = new Set<string>();
    const uniqueBySkill: DecisionRecommendation[] = [];
    for (const rec of candidates) {
      const key = rec.skillId ?? rec.id;
      if (seenSkills.has(key)) continue;
      seenSkills.add(key);
      uniqueBySkill.push(rec);
    }

    const insufficientEvidence =
      evidence.totalAttempts < P39_DECISION_POLICY.COLD_START_EVIDENCE_THRESHOLD;

    // Golden path C: a due spaced review must never be crowded out of the
    // visible list by lower-signal discovery fillers.
    let visible = uniqueBySkill.slice(0, P39_DECISION_POLICY.RECOMMEND_MAX);
    const dueReview = uniqueBySkill.find((r) => r.reasonCodes.includes('SM2_DUE'));
    if (dueReview && !visible.some((r) => r.recommendationId === dueReview.recommendationId)) {
      if (visible.length >= P39_DECISION_POLICY.RECOMMEND_MAX) {
        visible = [...visible.slice(0, P39_DECISION_POLICY.RECOMMEND_MAX - 1), dueReview];
      } else {
        visible = [...visible, dueReview];
      }
      visible.sort((a, b) => b.priorityScore - a.priorityScore || a.id.localeCompare(b.id));
    }

    const insufficientEvidenceMessage = insufficientEvidence
      ? {
          vi: 'Chưa đủ dữ liệu để xác định điểm yếu. Hãy làm một bài luyện ngắn để hệ thống hiểu khả năng hiện tại của bé.',
          en: "Let's do a short practice activity so we can see what you already know.",
        }
      : null;

    let mode: DecisionMode = input.mode ?? 'BALANCED';
    if (!input.mode) {
      if (isFatigued) mode = 'FATIGUE';
      else if (insufficientEvidence) mode = 'DISCOVERY';
      else if (uniqueBySkill.some((r) => r.reasonCodes.includes('NEEDS_REVIEW') || r.reasonCodes.includes('REPEATED_ERRORS'))) {
        mode = 'REMEDIATION';
      } else if (uniqueBySkill.some((r) => r.reasonCodes.includes('SM2_DUE'))) {
        mode = 'REVIEW';
      } else if (uniqueBySkill.some((r) => r.reasonCodes.includes('IMPROVEMENT_OPPORTUNITY'))) {
        mode = 'PROGRESS';
      }
    }

    // Next best action = top available recommendation.
    const nextBestAction = uniqueBySkill[0] ?? null;

    // Daily plan: 3–5 meaningful actions, evidence-driven, budget-aware.
    const budgetMinutes =
      input.budgetMinutes ??
      (StorageService.getParentSettings().dailyLimitMinutes ||
        P39_DECISION_POLICY.DEFAULT_BUDGET_MINUTES);

    const dailyPlan = this.buildDailyPlan(uniqueBySkill, {
      now,
      budgetMinutes,
      insufficientEvidence,
      mode,
      fatigue: evidence.fatigue,
    });

    const sessionPlan = this.planSession(uniqueBySkill, {
      now,
      budgetMinutes,
      mode,
      insufficientEvidence,
      fatigue: evidence.fatigue,
      nextBest: nextBestAction,
    });

    const parentReport = this.buildParentReport({
      skillStates,
      recommendations: uniqueBySkill.slice(0, 5),
      nextBest: nextBestAction,
      evidence,
      readiness,
      now,
    });

    const recommendations = visible;

    return {
      generatedAt: now,
      policyVersion: P39_DECISION_POLICY.POLICY_VERSION,
      mode,
      insufficientEvidence,
      insufficientEvidenceMessage,
      nextBestAction,
      recommendations,
      dailyPlan,
      sessionPlan,
      parentReport,
      evidenceSummary: this.buildEvidenceSummary(evidence, skillStates),
      skillStates,
      competitionReadiness: readiness.state,
      competitionReadinessLabel: readiness.label,
      fatigue: evidence.fatigue,
    };
  }

  /**
   * "ÔN TẬP HÔM NAY" — 3–5 meaningful actions from real evidence.
   */
  public static buildDailyPlan(
    recommendations: DecisionRecommendation[],
    opts: {
      now: number;
      budgetMinutes: number;
      insufficientEvidence: boolean;
      mode: DecisionMode;
      fatigue: SessionFatigueState;
    }
  ): DecisionDailyPlan {
    const items: SessionPlanItem[] = [];
    let total = 0;
    const usedSkills = new Set<string>();

    const pool = [...recommendations];

    // Ensure discovery is first when evidence is insufficient.
    if (opts.insufficientEvidence) {
      const discovery = pool.find((r) => r.reasonCodes.includes('DISCOVERY_NEEDED')) ?? pool[0];
      if (discovery) {
        items.push(this.toPlanItem(discovery, 'DISCOVERY'));
        total += discovery.estimatedMinutes;
        usedSkills.add(discovery.skillId ?? discovery.id);
      }
    }

    for (const rec of pool) {
      if (items.length >= P39_DECISION_POLICY.DAILY_PLAN.MAX_ITEMS) break;
      const key = rec.skillId ?? rec.id;
      if (usedSkills.has(key)) continue;
      if (total + rec.estimatedMinutes > opts.budgetMinutes) continue;

      // Fatigue: only allow rest/light if already fatigued and nothing else fits.
      if (opts.fatigue.isFatigued && items.length > 0 && rec.activityType !== 'GAME') {
        continue;
      }

      items.push(this.toPlanItem(rec, phaseForAction(rec, opts.mode === 'FATIGUE' ? 'RECOVERY' : 'STANDARD')));
      total += rec.estimatedMinutes;
      usedSkills.add(key);
    }

    // Fill to minimum when we have candidates and budget allows.
    if (
      items.length < P39_DECISION_POLICY.DAILY_PLAN.MIN_ITEMS &&
      !opts.insufficientEvidence
    ) {
      for (const rec of pool) {
        if (items.length >= P39_DECISION_POLICY.DAILY_PLAN.MIN_ITEMS) break;
        const key = rec.skillId ?? rec.id;
        if (usedSkills.has(key)) continue;
        if (total + rec.estimatedMinutes > opts.budgetMinutes) continue;
        items.push(this.toPlanItem(rec, phaseForAction(rec, 'STANDARD')));
        total += rec.estimatedMinutes;
        usedSkills.add(key);
      }
    }

    return {
      title: 'ÔN TẬP HÔM NAY',
      estimatedMinutes: total,
      items,
      generatedAt: opts.now,
      policyVersion: P39_DECISION_POLICY.POLICY_VERSION,
      insufficientEvidence: opts.insufficientEvidence,
      mode: opts.mode,
    };
  }

  private static toPlanItem(rec: DecisionRecommendation, phase: SessionPhase): SessionPlanItem {
    return {
      id: `plan_${rec.recommendationId}`,
      title: rec.title,
      description: rec.description,
      childExplanation: rec.childExplanation,
      estimatedMinutes: rec.estimatedMinutes,
      reasonCodes: rec.reasonCodes,
      reason: rec.explanation.why,
      route: rec.launchRoute,
      actionType: rec.type,
      skillId: rec.skillId,
      badgeEmoji: rec.badgeEmoji,
      phase,
    };
  }

  /**
   * Session planner: QUICK (≤5), STANDARD (10–15), FULL (15–20), RECOVERY, DISCOVERY.
   * Never exceeds the parent screen-time budget.
   */
  public static planSession(
    recommendations: DecisionRecommendation[],
    opts: {
      now: number;
      budgetMinutes: number;
      mode: DecisionMode;
      insufficientEvidence: boolean;
      fatigue: SessionFatigueState;
      nextBest: DecisionRecommendation | null;
    }
  ): SessionPlan {
    let kind: SessionKind;
    if (opts.insufficientEvidence) kind = 'DISCOVERY';
    else if (opts.fatigue.isFatigued) kind = 'RECOVERY';
    else if (opts.budgetMinutes <= P39_DECISION_POLICY.SESSION.QUICK_MAX_MINUTES) kind = 'QUICK';
    else if (opts.budgetMinutes >= P39_DECISION_POLICY.SESSION.FULL_MIN_MINUTES) kind = 'FULL';
    else kind = 'STANDARD';

    let budgetMinutes = opts.budgetMinutes;
    if (kind === 'QUICK') budgetMinutes = Math.min(budgetMinutes, P39_DECISION_POLICY.SESSION.QUICK_MAX_MINUTES);
    if (kind === 'RECOVERY') budgetMinutes = Math.min(budgetMinutes, P39_DECISION_POLICY.SESSION.RECOVERY_MAX_MINUTES);
    if (kind === 'FULL') budgetMinutes = Math.min(budgetMinutes, P39_DECISION_POLICY.SESSION.FULL_MAX_MINUTES);
    if (kind === 'STANDARD') {
      budgetMinutes = Math.min(
        Math.max(budgetMinutes, P39_DECISION_POLICY.SESSION.STANDARD_MIN_MINUTES),
        P39_DECISION_POLICY.SESSION.STANDARD_MAX_MINUTES
      );
      // Respect parent limit if smaller.
      if (opts.budgetMinutes < budgetMinutes) budgetMinutes = opts.budgetMinutes;
    }

    const items: SessionPlanItem[] = [];
    let total = 0;
    let truncated = false;
    const used = new Set<string>();

    const ordered = [...recommendations];
    // Recovery: only top recovery action + optional light game.
    if (kind === 'RECOVERY' && opts.nextBest) {
      const top = opts.nextBest;
      items.push(this.toPlanItem(top, 'PRACTICE'));
      total += top.estimatedMinutes;
      used.add(top.skillId ?? top.id);
    } else if (kind === 'DISCOVERY' && opts.nextBest) {
      items.push(this.toPlanItem(opts.nextBest, 'DISCOVERY'));
      total += opts.nextBest.estimatedMinutes;
      used.add(opts.nextBest.skillId ?? opts.nextBest.id);
    } else {
      // Warm-up → Review → Practice → Reinforcement → Check (§16), flexible.
      const warm = ordered.find((r) => r.type === 'LEARN' && !used.has(r.skillId ?? r.id));
      const review = ordered.find(
        (r) => (r.type === 'REVIEW' || r.reasonCodes.includes('SM2_DUE')) && !used.has(r.skillId ?? r.id)
      );
      const practice = ordered.find(
        (r) => r.type === 'PRACTICE' && !used.has(r.skillId ?? r.id)
      );
      const reinforce = ordered.find(
        (r) => (r.type === 'GAME' || r.type === 'SPEED_PRACTICE') && !used.has(r.skillId ?? r.id)
      );
      const check = ordered.find(
        (r) => (r.type === 'COMPETITION' || r.type === 'MOCK_EXAM') && !used.has(r.skillId ?? r.id)
      );

      const sequence: { rec?: DecisionRecommendation; phase: SessionPhase }[] = [
        { rec: warm, phase: 'WARM_UP' },
        { rec: review, phase: 'REVIEW' },
        { rec: practice, phase: 'PRACTICE' },
        { rec: reinforce, phase: 'REINFORCEMENT' },
        { rec: check, phase: 'CHECK' },
      ];

      // Fill remaining with top recommendations.
      for (const rec of ordered) {
        if (sequence.some((s) => s.rec?.id === rec.id)) continue;
        if (used.has(rec.skillId ?? rec.id)) continue;
        sequence.push({ rec, phase: phaseForAction(rec, kind) });
      }

      for (const step of sequence) {
        if (!step.rec) continue;
        const key = step.rec.skillId ?? step.rec.id;
        if (used.has(key)) continue;
        if (total + step.rec.estimatedMinutes > budgetMinutes) {
          truncated = true;
          continue;
        }
        items.push(this.toPlanItem(step.rec, step.phase));
        total += step.rec.estimatedMinutes;
        used.add(key);
      }
    }

    const focus =
      opts.nextBest?.title ??
      (items[0]?.title ?? (opts.insufficientEvidence ? 'Khám phá nhẹ nhàng' : 'Ôn tập'));

    const parentExplanation =
      kind === 'DISCOVERY'
        ? 'Hệ thống chưa đủ dữ liệu để xác định điểm yếu. Phiên này giúp bé làm quen và ghi nhận năng lực thật.'
        : kind === 'RECOVERY'
          ? 'Bé đã mệt sau phiên học dài — hệ thống chuyển sang hoạt động ngắn, nhẹ nhàng.'
          : `Phiên ${SESSION_KIND_LABEL[kind].toLowerCase()} (~${total} phút): ưu tiên theo bằng chứng thật, không so sánh với bạn khác.`;

    return {
      kind,
      estimatedMinutes: total,
      budgetMinutes,
      items,
      focus,
      explanation: parentExplanation,
      parentExplanation,
      generatedAt: opts.now,
      policyVersion: P39_DECISION_POLICY.POLICY_VERSION,
      truncatedByBudget: truncated,
    };
  }

  /**
   * Parent report: Hôm nay · Điểm mạnh · Cần củng cố · Đang tiến bộ · Nên học tiếp.
   * All values from real evidence — no fake charts, no invented percentages.
   */
  public static buildParentReport(args: {
    skillStates: SkillDecisionState[];
    recommendations: DecisionRecommendation[];
    nextBest: DecisionRecommendation | null;
    evidence: CollectedEvidence;
    readiness: { state: DecisionCompetitionReadiness | null; label: string | null };
    now: number;
  }): ParentDecisionReport {
    const { skillStates, recommendations, nextBest, evidence, readiness, now } = args;

    const withEvidence = skillStates.filter((s) => s.attemptCount > 0);
    const strengths = withEvidence
      .filter((s) => s.status === 'MASTERED' || (s.attemptCount >= 4 && s.recentAccuracy >= 85))
      .sort((a, b) => b.recentAccuracy - a.recentAccuracy || b.mastery - a.mastery)
      .slice(0, 4)
      .map((s) => ({
        skillName: s.skillName,
        detail: `Làm chủ với ${s.recentAccuracy}% chính xác gần đây sau ${s.attemptCount} lượt.`,
        accuracy: s.recentAccuracy,
      }));

    const needsWork = withEvidence
      .filter(
        (s) =>
          s.status === 'NEEDS_REVIEW' ||
          s.consecutiveIncorrect >= 2 ||
          (s.attemptCount >= 3 && s.recentAccuracy < 70)
      )
      .sort((a, b) => a.recentAccuracy - b.recentAccuracy || b.consecutiveIncorrect - a.consecutiveIncorrect)
      .slice(0, 4)
      .map((s) => ({
        skillName: s.skillName,
        detail: `${s.consecutiveIncorrect} lần liên tiếp chưa đúng · chính xác gần đây ${s.recentAccuracy}%.`,
        accuracy: s.recentAccuracy,
        reasonCodes: s.reasonCodes.filter((c) => c !== 'AVAILABILITY_OK'),
      }));

    const improving = withEvidence
      .filter((s) => s.reasonCodes.includes('IMPROVEMENT_OPPORTUNITY'))
      .sort((a, b) => b.recentAccuracy - a.recentAccuracy)
      .slice(0, 3)
      .map((s) => ({
        skillName: s.skillName,
        detail: `Gần đây ${s.recentAccuracy}% so với trung bình ${s.accuracy}% — đang tiến bộ.`,
      }));

    // Activity minutes today from real evidence timestamps.
    const todayStart = new Date(now).toISOString().slice(0, 10);
    let activityMinutesToday = 0;
    for (const ev of evidence.recentEvidences) {
      if (!ev.timestamp) continue;
      const evDay = new Date(ev.timestamp).toISOString().slice(0, 10);
      if (evDay !== todayStart) continue;
      // Approximate: each evidence ~30s of focused practice when timed.
      activityMinutesToday += ev.responseTimeMs ? ev.responseTimeMs / 60000 : 0.5;
    }
    // If no timed evidence, count attempts * 0.5 min estimate only when analytics has minutes.
    if (activityMinutesToday === 0 && evidence.totalAttempts > 0) {
      try {
        const analytics = StorageService.getAnalytics();
        if (analytics.todayDate === todayStart) {
          activityMinutesToday = analytics.minutesToday || 0;
        }
      } catch {
        /* ignore */
      }
    }

    const isDemoData = (() => {
      try {
        return StorageService.getChildProfile().isDemoData === true;
      } catch {
        return false;
      }
    })();

    const nextBestBlock = nextBest
      ? [
          {
            title: nextBest.title,
            why: nextBest.explanation.why,
            howLong: nextBest.explanation.howLong,
            reasonCodes: nextBest.reasonCodes,
          },
        ]
      : recommendations.slice(0, 2).map((r) => ({
          title: r.title,
          why: r.explanation.why,
          howLong: r.explanation.howLong,
          reasonCodes: r.reasonCodes,
        }));

    const headline =
      evidence.totalAttempts === 0
        ? 'Bé mới bắt đầu — hãy cùng bé làm một bài học đầu tiên.'
        : needsWork.length > 0
          ? `Cần củng cố ${needsWork.length} kỹ năng dựa trên dữ liệu thật của bé.`
          : strengths.length > 0
            ? 'Bé đang có nền tảng tốt — tiếp tục luyện đều đặn.'
            : 'Hệ thống đang chờ thêm dữ liệu để đưa ra gợi ý chính xác hơn.';

    return {
      today: new Date(now).toISOString().slice(0, 10),
      headline,
      strengths,
      needsWork,
      improving,
      nextBest: nextBestBlock,
      activityMinutesToday: Math.round(activityMinutesToday),
      totalAttempts: evidence.totalAttempts,
      isDemoData,
      competitionReadiness: readiness.state,
      competitionReadinessLabel: readiness.label,
    };
  }

  /**
   * Convenience: decide + persist a lightweight decision stamp (not a cached
   * recommendation forever). Evidence version drives recomputation.
   */
  public static refreshAndSnapshot(input: DecisionInput = {}): {
    output: DecisionOutput;
    knowledgeVersion: number;
  } {
    const output = this.decide(input);
    const knowledgeVersion = Object.values(input.knowledgeMap ?? StorageService.getKnowledgeStates()).reduce(
      (sum, s) => sum + (s.evidenceVersion ?? 0),
      0
    );
    return { output, knowledgeVersion };
  }
}

/** Default export for convenience in UI modules. */
export default DecisionEngine;
