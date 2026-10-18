import type { SubjectType } from './index';
import type { ActionType, DailyPlan, KnowledgeState, LearningAction, LearningEvidence, SessionFatigueState } from './learningOS';
import type { ActiveScreen } from './index';
import type { ReadinessAssessment } from './competition';

/**
 * P39 LEARNING OS DECISION ENGINE — canonical types.
 *
 * The Decision Engine CONSUMES evidence. It never invents mastery, never
 * compares the child with peers, and never treats praise as proof.
 *
 * Note: `EvidenceSource` is defined in types/learningOS.ts (authoritative).
 * This module re-uses that type via LearningEvidence.
 */

/* ------------------------------------------------------------------ */
/* Evidence provenance & quality                                        */
/* ------------------------------------------------------------------ */

export type EvidenceQuality = 'VERIFIED' | 'PARTIAL' | 'STALE' | 'UNAVAILABLE';

export type EvidenceFreshness = 'RECENT' | 'OLDER' | 'STALE' | 'UNKNOWN';

export interface EvidenceProvenance {
  source: string;
  timestamp?: number;
  subject?: SubjectType;
  skillId?: string;
  topicId?: string;
  evidenceType?: string;
  value?: number | boolean | string;
  confidence?: number;
}

export interface NormalizedEvidence extends EvidenceProvenance {
  quality: EvidenceQuality;
  freshness: EvidenceFreshness;
}

/* ------------------------------------------------------------------ */
/* Reason codes                                                         */
/* ------------------------------------------------------------------ */

export type DecisionReasonCode =
  | 'SM2_DUE'
  | 'REPEATED_ERRORS'
  | 'RECENT_ACCURACY_DROP'
  | 'NEEDS_REVIEW'
  | 'FOUNDATION_GAP'
  | 'CURRENT_UNIT'
  | 'LOW_FLUENCY'
  | 'LOW_COMPREHENSION'
  | 'LOW_STABILITY'
  | 'COMPETITION_READINESS'
  | 'NOT_PRACTICED_RECENTLY'
  | 'IMPROVEMENT_OPPORTUNITY'
  | 'RECOVERY_AFTER_ERROR'
  | 'DISCOVERY_NEEDED'
  | 'CONTENT_SOURCE_REQUIRED'
  | 'SUBJECT_BALANCE'
  | 'FATIGUE'
  | 'OVERPRACTICE'
  | 'SPEED_SAFE'
  | 'FOUNDATION_BEFORE_DEPENDENT'
  | 'ACCURACY_BEFORE_SPEED'
  | 'WEAK_BEFORE_MASTERED'
  | 'AVAILABILITY_OK'
  | 'RECENT_REPETITION';

/* ------------------------------------------------------------------ */
/* Skill decision state                                                 */
/* ------------------------------------------------------------------ */

export interface SkillDecisionState {
  skillId: string;
  skillName: string;
  subject: SubjectType;
  status: KnowledgeState['status'];
  mastery: number;
  confidence: number;
  accuracy: number;
  recentAccuracy: number;
  attemptCount: number;
  correctCount: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  lastPracticedAt?: number;
  nextReviewAt?: number;
  averageResponseTimeMs?: number;
  quality: EvidenceQuality;
  freshness: EvidenceFreshness;
  reasonCodes: DecisionReasonCode[];
  /** Transparent 0-100 need score; higher = more urgent. */
  needScore: number;
}

/* ------------------------------------------------------------------ */
/* Priority factors                                                     */
/* ------------------------------------------------------------------ */

export interface DecisionPriorityFactor {
  code: DecisionReasonCode;
  /** Named weight from P39_DECISION_POLICY.WEIGHT. */
  weight: number;
  /** Multiplier after evidence-quality / freshness discount. */
  multiplier: number;
  contribution: number;
  detail: string;
}

/* ------------------------------------------------------------------ */
/* Next best action                                                     */
/* ------------------------------------------------------------------ */

export type DecisionActivityType =
  | 'REVIEW'
  | 'PRACTICE'
  | 'GAME'
  | 'LESSON'
  | 'FLUENCY'
  | 'LISTENING'
  | 'SPEAKING'
  | 'READING'
  | 'COMPETITION'
  | 'DISCOVERY'
  | 'REST';

export type ActivityAvailability = 'AVAILABLE' | 'UNAVAILABLE';

export interface DecisionExplanation {
  /** WHAT — parent-facing activity name. */
  what: string;
  /** WHY — parent-facing, evidence-based. */
  why: string;
  /** HOW LONG — minutes. */
  howLong: number;
  /** Child-facing encouragement. Never exposes codes/percentages. */
  childText: string;
  /** Machine-readable reasons for parent/diagnostics UI. */
  reasonCodes: DecisionReasonCode[];
  /** Human-readable evidence lines for the parent. */
  evidenceLines: string[];
}

export interface DecisionRecommendation extends LearningAction {
  reasonCodes: DecisionReasonCode[];
  priorityFactors: DecisionPriorityFactor[];
  priorityScore: number;
  activityType: DecisionActivityType;
  availability: ActivityAvailability;
  evidenceQuality: EvidenceQuality;
  evidenceFreshness: EvidenceFreshness;
  explanation: DecisionExplanation;
  launchRoute: ActiveScreen | null;
  /** Stable id used by the UI; equals LearningAction.id. */
  recommendationId: string;
}

/* ------------------------------------------------------------------ */
/* Session plan                                                         */
/* ------------------------------------------------------------------ */

export type SessionKind = 'QUICK' | 'STANDARD' | 'FULL' | 'RECOVERY' | 'DISCOVERY';

export type SessionPhase =
  | 'WARM_UP'
  | 'REVIEW'
  | 'PRACTICE'
  | 'REINFORCEMENT'
  | 'CHECK'
  | 'DISCOVERY'
  | 'REST';

export interface SessionPlanItem {
  id: string;
  title: string;
  description: string;
  childExplanation: string;
  estimatedMinutes: number;
  reasonCodes: DecisionReasonCode[];
  reason: string;
  route: ActiveScreen | null;
  actionType: ActionType;
  skillId?: string;
  badgeEmoji: string;
  phase: SessionPhase;
}

export interface SessionPlan {
  kind: SessionKind;
  estimatedMinutes: number;
  budgetMinutes: number;
  items: SessionPlanItem[];
  focus: string;
  explanation: string;
  parentExplanation: string;
  generatedAt: number;
  policyVersion: string;
  /** True when screen-time limit forced a shorter plan. */
  truncatedByBudget: boolean;
}

/* ------------------------------------------------------------------ */
/* Daily plan                                                           */
/* ------------------------------------------------------------------ */

export interface DecisionDailyPlan {
  title: string;
  estimatedMinutes: number;
  items: SessionPlanItem[];
  generatedAt: number;
  policyVersion: string;
  insufficientEvidence: boolean;
  mode: DecisionMode;
}

/* ------------------------------------------------------------------ */
/* Competition readiness bridge                                         */
/* ------------------------------------------------------------------ */

export type DecisionCompetitionReadiness =
  | 'NOT_READY'
  | 'BUILDING_FOUNDATION'
  | 'ACCURACY_READY'
  | 'FLUENCY_READY'
  | 'SPEED_READY'
  | 'MOCK_READY'
  | 'COMPETITION_READY';

/* ------------------------------------------------------------------ */
/* Parent report                                                        */
/* ------------------------------------------------------------------ */

export interface ParentDecisionReport {
  today: string;
  headline: string;
  strengths: { skillName: string; detail: string; accuracy: number }[];
  needsWork: { skillName: string; detail: string; accuracy: number; reasonCodes: DecisionReasonCode[] }[];
  improving: { skillName: string; detail: string }[];
  nextBest: {
    title: string;
    why: string;
    howLong: number;
    reasonCodes: DecisionReasonCode[];
  }[];
  activityMinutesToday: number;
  totalAttempts: number;
  isDemoData: boolean;
  competitionReadiness: DecisionCompetitionReadiness | null;
  competitionReadinessLabel: string | null;
}

/* ------------------------------------------------------------------ */
/* Full decision output                                                 */
/* ------------------------------------------------------------------ */

export type DecisionMode =
  | 'DISCOVERY'
  | 'REMEDIATION'
  | 'REVIEW'
  | 'PROGRESS'
  | 'FATIGUE'
  | 'BALANCED';

export interface DecisionEvidenceSummary {
  totalSkillsTracked: number;
  skillsWithEvidence: number;
  totalAttempts: number;
  qualityBreakdown: Record<EvidenceQuality, number>;
  freshnessBreakdown: Record<EvidenceFreshness, number>;
  subjectAttemptCounts: Record<SubjectType, number>;
}

export interface DecisionOutput {
  generatedAt: number;
  policyVersion: string;
  mode: DecisionMode;
  insufficientEvidence: boolean;
  insufficientEvidenceMessage: { vi: string; en: string } | null;
  nextBestAction: DecisionRecommendation | null;
  recommendations: DecisionRecommendation[];
  dailyPlan: DecisionDailyPlan;
  sessionPlan: SessionPlan;
  parentReport: ParentDecisionReport;
  evidenceSummary: DecisionEvidenceSummary;
  skillStates: SkillDecisionState[];
  competitionReadiness: DecisionCompetitionReadiness | null;
  competitionReadinessLabel: string | null;
  fatigue: SessionFatigueState;
}

export interface DecisionInput {
  /** Override knowledge map (tests). Defaults to StorageService. */
  knowledgeMap?: Record<string, KnowledgeState>;
  recentEvidences?: LearningEvidence[];
  fatigue?: SessionFatigueState;
  trackActions?: LearningAction[];
  recommendationHistory?: { actionId: string; skillId?: string; type: ActionType; timestamp: number; completed?: boolean }[];
  competitionReadiness?: ReadinessAssessment | null;
  /** Deterministic clock for tests. */
  now?: number;
  /** Daily screen-time budget in minutes. */
  budgetMinutes?: number;
  /** Kid's Box current unit label when English course context exists. */
  kidboxUnitLabel?: string | null;
  /** Force mode (tests). */
  mode?: DecisionMode;
  /** When true, suppress any recommendation that is not AVAILABLE. */
  requireAvailable?: boolean;
}
