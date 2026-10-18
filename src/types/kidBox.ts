/**
 * KID'S BOX NEW GENERATION 1 — BRITISH ENGLISH COMPANION TRACK
 * Content schema + skill taxonomy.
 *
 * §1 NON-NEGOTIABLE: this file only *describes* content. It never replaces the
 * existing taxonomy, the Learning OS, persistence, adaptive learning, spaced
 * repetition, games, rewards or the competition engine.
 *
 * §4 SOURCE-OF-TRUTH MODEL — every activity is derived from
 *   COURSE → LEVEL → UNIT → LESSON/TOPIC → SKILL → ACTIVITY → EVIDENCE
 * and no UI is allowed to hardcode "unit → question".
 *
 * §2/§39 COPYRIGHT: no textbook page, workbook, audio transcript or copyright
 * exercise is stored here. Only concepts, topics, skill mapping, grammar /
 * phonics concepts, learning objectives and original exercises generated from
 * those concepts. Where the real syllabus is not present in the repository the
 * unit is flagged `CONTENT_SOURCE_REQUIRED` and the app says so out loud.
 */

/* ------------------------------------------------------------------ */
/* LOCALE / SOURCES                                                     */
/* ------------------------------------------------------------------ */

/** §7 British English is the only locale this track may use. */
export const KIDBOX_LOCALE = 'en-GB' as const;
export type KidBoxLocale = typeof KIDBOX_LOCALE;

/**
 * Where a piece of content came from. Kept on every single item so a parent or
 * an auditor can always tell original practice apart from mapped source notes.
 */
export type KidBoxSourceType =
  /** Mapped by a human from the centre's own syllabus / teacher's notes. */
  | 'TEACHER_NOTES'
  /** Mapped from parent-supplied material (photos, PDF exports, typed lists). */
  | 'PARENT_PROVIDED'
  /** Exercises written by this app from the mapped concepts (never copied). */
  | 'ORIGINAL_PRACTICE'
  /**
   * Generic Level 1 English already shipped inside the app's own curriculum.
   * Used as a bridge so the engines are runnable before any Kid's Box source
   * content exists. It is NOT, and never claims to be, Kid's Box content.
   */
  | 'APP_BRIDGE';

/** §27 — never hardcode unverified content. */
export type KidBoxContentStatus =
  /** Usable: the unit has mapped content for every activity it declares. */
  | 'READY'
  /** Some activities are mapped, others still await source content. */
  | 'PARTIAL'
  /** §27/§39 — the repository has no verified source for this unit yet. */
  | 'CONTENT_SOURCE_REQUIRED';

/** A content gap that must be reported verbatim, never silently filled. */
export interface KidBoxRequiredArtifact {
  artifactId: string;
  /** What is needed, in plain language a teacher can act on. */
  label: string;
  /** What the app will do with it once supplied. */
  unlocks: string;
  satisfied: boolean;
  suppliedBy?: string;
}

/* ------------------------------------------------------------------ */
/* SKILL TAXONOMY (§8)                                                  */
/* ------------------------------------------------------------------ */

export type KidBoxStrand = 'VOCABULARY' | 'PHONICS' | 'LISTENING' | 'SPEAKING' | 'READING' | 'LANGUAGE_USE';

export const KIDBOX_STRAND_LABELS: Record<KidBoxStrand, { vi: string; emoji: string }> = {
  VOCABULARY: { vi: 'Từ vựng', emoji: '🧺' },
  PHONICS: { vi: 'Âm thanh', emoji: '🔤' },
  LISTENING: { vi: 'Nghe', emoji: '👂' },
  SPEAKING: { vi: 'Nói', emoji: '🗣️' },
  READING: { vi: 'Đọc', emoji: '📖' },
  LANGUAGE_USE: { vi: 'Cách dùng', emoji: '💬' },
};

export type KidBoxSkillId =
  | 'EN-VOCAB-RECOGNITION'
  | 'EN-VOCAB-MEANING'
  | 'EN-VOCAB-LISTENING'
  | 'EN-VOCAB-RECALL'
  | 'EN-VOCAB-SPELLING'
  | 'EN-PHONICS-SOUND'
  | 'EN-PHONICS-DISCRIMINATION'
  | 'EN-PHONICS-INITIAL'
  | 'EN-PHONICS-BLENDING'
  | 'EN-LISTENING-RECOGNITION'
  | 'EN-LISTENING-DETAIL'
  | 'EN-LISTENING-INSTRUCTION'
  | 'EN-SPEAKING-REPEAT'
  | 'EN-SPEAKING-QUESTION-ANSWER'
  | 'EN-SPEAKING-PATTERN'
  | 'EN-READING-WORD'
  | 'EN-READING-PHRASE'
  | 'EN-READING-SENTENCE'
  | 'EN-READING-COMPREHENSION'
  | 'EN-LANGUAGE-PATTERN'
  | 'EN-GRAMMAR-IN-CONTEXT';

export interface KidBoxSkillDescriptor {
  skillId: KidBoxSkillId;
  /** Child-friendly Vietnamese label; the app's UI language is Vietnamese. */
  skillName: string;
  strand: KidBoxStrand;
  /** Stable display order, also used as a deterministic tie-breaker. */
  sequence: number;
  /** One-line explanation for the parent panel. */
  description: string;
  /** Skill can only be evidenced from age 6+ (kept uniform at Level 1). */
  minimumAge: number;
}

/* ------------------------------------------------------------------ */
/* CONTENT ITEMS                                                        */
/* ------------------------------------------------------------------ */

export interface KidBoxContentBase {
  id: string;
  unitId: string;
  lessonId?: string;
  /** Skill this item provides evidence for. */
  skillId: KidBoxSkillId;
  difficulty: 1 | 2 | 3;
  britishEnglish: KidBoxLocale;
  sourceType: KidBoxSourceType;
  /** §28 — every item must declare how long it takes. */
  estimatedSeconds: number;
}

/** §10 VOCABULARY ENGINE — word, picture, meaning, audio target, review state. */
export interface KidBoxVocabulary extends KidBoxContentBase {
  kind: 'VOCABULARY';
  /** The headword, always British English spelling. */
  word: string;
  /** Vietnamese meaning for the child and the parent. */
  meaningVi: string;
  /** Emoji stands in for artwork so the bundle stays lightweight (§34). */
  pictureEmoji?: string;
  /** Text read by the en-GB voice. */
  speakText: string;
  /** Topic label used by the parent report ("FOOD", "ANIMALS", …). */
  topic: string;
  /** Sentence frame the word belongs to, when the unit defines one. */
  examplePattern?: string;
}

/** §6 PHONICS — sound recognition / discrimination / initial / blending. */
export interface KidBoxPhonics extends KidBoxContentBase {
  kind: 'PHONICS';
  /** The sound being taught, e.g. "sh" / "th" / "a". */
  focusSound: string;
  /** The letters that carry the sound. */
  grapheme: string;
  exampleWord: string;
  exampleEmoji?: string;
  /** Minimal pair used by discrimination activities, when available. */
  contrastWord?: string;
}

export type KidBoxPatternSlot = string | { slotName: string; exampleAnswer: string; pictureEmoji?: string };

/** §6 LANGUAGE PATTERNS — heard first, explained afterwards. */
export interface KidBoxLanguagePattern extends KidBoxContentBase {
  kind: 'PATTERN';
  /** The chunk as the child hears it, e.g. "What's this?". */
  pattern: string;
  meaningVi: string;
  /** Ordered answerable slots (original examples, not textbook content). */
  slots: KidBoxPatternSlot[];
  /** Pattern for the speaking question/answer mode. */
  question: string;
  suggestedAnswer: string;
  /** Optional picture cue for the pattern. */
  pictureEmoji?: string;
}

export type KidBoxReadingLevel = 'WORD' | 'PHRASE' | 'SENTENCE' | 'SHORT_TEXT';

export interface KidBoxReadingComprehension {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

/** §15 READING — original short texts, word → phrase → sentence → text. */
export interface KidBoxReadingText extends KidBoxContentBase {
  kind: 'READING';
  level: KidBoxReadingLevel;
  /** Original text written by this app, never copied from the textbook. */
  text: string;
  textVi: string;
  wordCount: number;
  comprehension: KidBoxReadingComprehension[];
}

/* ------------------------------------------------------------------ */
/* UNITS & LESSONS                                                      */
/* ------------------------------------------------------------------ */

export interface KidBoxLesson {
  id: string;
  unitId: string;
  index: number;
  title: string;
  /** §5 minimum metadata: what the child should be able to do afterwards. */
  learningObjective: string;
  skills: KidBoxSkillId[];
  mascotTip: string;
}

export interface KidBoxUnit {
  id: string;
  courseId: string;
  levelId: KidBoxLevelId;
  /** 1-based position in the course. */
  index: number;
  /**
   * `undefined` when the title is not verified. The UI must render
   * "Chưa có nội dung nguồn" instead of guessing a title.
   */
  title?: string;
  topicLabel?: string;
  sourceType: KidBoxSourceType;
  contentStatus: KidBoxContentStatus;
  britishEnglish: KidBoxLocale;
  learningObjectives: string[];
  skills: KidBoxSkillId[];
  lessons: KidBoxLesson[];
  vocabulary: KidBoxVocabulary[];
  phonics: KidBoxPhonics[];
  patterns: KidBoxLanguagePattern[];
  readingTexts: KidBoxReadingText[];
  /**
   * For `CONTENT_SOURCE_REQUIRED` units: the exact list of content the app
   * still needs before the unit can be taught.
   */
  missingContent: string[];
  /** Free-form note from the mapper (e.g. "mapped from teacher's photo p.12"). */
  mappingNote?: string;
}

export type KidBoxLevelId = 'LEVEL_1';

export interface KidBoxLevel {
  levelId: KidBoxLevelId;
  label: string;
  /** Age band the level targets; drives plan length and pressure policy. */
  ageMin: number;
  ageMax: number;
}

export interface KidBoxCourse {
  courseId: string;
  title: string;
  /** Textbook series the track accompanies. No content is bundled from it. */
  textbookSeries: string;
  publisher: string;
  variant: 'BRITISH_ENGLISH';
  locale: KidBoxLocale;
  levels: KidBoxLevel[];
  units: KidBoxUnit[];
  /** §27 — every artifact that must be supplied before real mapping. */
  requiredArtifacts: KidBoxRequiredArtifact[];
  /** §35 documentation pointer, kept next to the data it describes. */
  schemaVersion: string;
}

/* ------------------------------------------------------------------ */
/* ACTIVITIES (§9 progression, §11–§13 engines)                         */
/* ------------------------------------------------------------------ */

/** §9 — SEE → HEAR → UNDERSTAND → REPEAT → PRACTICE → USE → REVIEW → GAME → CHECK. */
export type KidBoxProgressionStep =
  | 'SEE'
  | 'HEAR'
  | 'UNDERSTAND'
  | 'REPEAT'
  | 'PRACTICE'
  | 'USE'
  | 'REVIEW'
  | 'GAME'
  | 'CHECK';

export const KIDBOX_PROGRESSION_STEPS: readonly KidBoxProgressionStep[] = [
  'SEE',
  'HEAR',
  'UNDERSTAND',
  'REPEAT',
  'PRACTICE',
  'USE',
  'REVIEW',
  'GAME',
  'CHECK',
] as const;

export const KIDBOX_STEP_LABELS: Record<KidBoxProgressionStep, { vi: string; emoji: string }> = {
  SEE: { vi: 'Nhìn', emoji: '👀' },
  HEAR: { vi: 'Nghe', emoji: '👂' },
  UNDERSTAND: { vi: 'Hiểu', emoji: '💡' },
  REPEAT: { vi: 'Lặp lại', emoji: '🔊' },
  PRACTICE: { vi: 'Luyện tập', emoji: '✏️' },
  USE: { vi: 'Dùng', emoji: '💬' },
  REVIEW: { vi: 'Ôn tập', emoji: '🗓️' },
  GAME: { vi: 'Trò chơi', emoji: '🎮' },
  CHECK: { vi: 'Kiểm tra', emoji: '🏁' },
};

export type KidBoxActivityKind =
  // §6 vocabulary
  | 'PICTURE_TO_WORD'
  | 'WORD_TO_PICTURE'
  | 'PICTURE_MATCH'
  // §12 listening
  | 'LISTEN_AND_CHOOSE'
  | 'LISTEN_AND_MATCH'
  | 'LISTEN_AND_ORDER'
  | 'LISTEN_AND_ACT'
  | 'LISTEN_AND_FIND'
  // §6 understanding
  | 'MEANING_MATCH'
  // §13 speaking
  | 'SPEAKING_REPEAT'
  | 'SPEAKING_QUESTION_ANSWER'
  | 'SPEAKING_PATTERN'
  // §11 flash / memory
  | 'RECOGNITION'
  | 'MEMORY_PAIRS'
  | 'ODD_ONE_OUT'
  | 'FIND_THE_PAIR'
  | 'MISSING_WORD'
  // §6 language use
  | 'PATTERN_BUILD'
  | 'LANGUAGE_PATTERN'
  // §25 review
  | 'SPACED_REVIEW'
  // §16 game
  | 'MINI_GAME'
  // §9 check
  | 'MINI_CHECK';

export type KidBoxActivityMode =
  /** Child picks one item from a set (single answer). */
  | 'SINGLE_CHOICE'
  /** Child pairs every left item with a right item. */
  | 'MATCHING'
  /** Child arranges items into an order. */
  | 'ORDERING'
  /** Child performs a physical action. */
  | 'ACTION'
  /** Child speaks; recognition is optional. */
  | 'SPEAK'
  /** Child flips memory cards. */
  | 'MEMORY'
  /** Child builds a sentence from chunks. */
  | 'BUILD'
  /** Child taps every matching target. */
  | 'MULTI_SELECT'
  /** A short assessment rendered as a single-choice check. */
  | 'CHECK';

export interface KidBoxActivityItem {
  id: string;
  /** Text handed to the en-GB voice. Never the only carrier of meaning. */
  speakText: string;
  /** §32 accessibility: on-screen text equivalent of the audio. */
  captionEn: string;
  captionVi?: string;
  pictureEmoji?: string;
  word?: string;
  meaningVi?: string;
  /** For choice-style activities: is this the target answer. */
  isCorrect: boolean;
  /** For `ORDERING`: canonical 1-based position. */
  orderHint?: number;
  /** For `ACTION`: what the child must physically do. */
  actionCueVi?: string;
  /** For `BUILD`: chunk order in the target sentence. */
  chunkOrder?: number;
  /**
   * For `MATCHING` / `MEMORY`: the key both halves of a pair share. Two items
   * form a correct pair when their `pairKey`s are equal and the pair is a
   * target (one half flagged `isCorrect`).
   */
  pairKey?: string;
  skillId: KidBoxSkillId;
}

export interface KidBoxActivity {
  id: string;
  unitId: string;
  lessonId?: string;
  step: KidBoxProgressionStep;
  kind: KidBoxActivityKind;
  mode: KidBoxActivityMode;
  skillId: KidBoxSkillId;
  title: string;
  titleVi: string;
  /** Spoken instruction, always British English. */
  instructionEn: string;
  /** On-screen Vietnamese instruction (audio is never the only channel). */
  instructionVi: string;
  items: KidBoxActivityItem[];
  /** §12 — replaying is always free; no punishment, ever. */
  allowReplay: boolean;
  allowSlowReplay: boolean;
  /** Whether recognition may contribute evidence for a SPEAK activity. */
  acceptsSpeechRecognition: boolean;
  difficulty: 1 | 2 | 3;
  sourceType: KidBoxSourceType;
  britishEnglish: KidBoxLocale;
  /** §28 — every activity explains itself. */
  explanation: string;
  estimatedSeconds: number;
  estimatedMinutes: number;
  /** Activity may be opened even if the previous step has no evidence yet. */
  previewable: boolean;
}

/* ------------------------------------------------------------------ */
/* PROGRESS / EVIDENCE-ADJACENT STATE                                   */
/* ------------------------------------------------------------------ */

export type KidBoxStepStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'DONE';

export interface KidBoxStepProgress {
  step: KidBoxProgressionStep;
  status: KidBoxStepStatus;
  /** Number of evidence items recorded for this step. */
  evidenceCount: number;
  lastPracticedAt?: number;
  bestAccuracy?: number;
}

export interface KidBoxUnitProgress {
  unitId: string;
  /** Step → status, used by the hub ladder. */
  steps: Record<KidBoxProgressionStep, KidBoxStepProgress>;
  activityAttempts: number;
  lastPracticedAt?: number;
  /** Highest MINI_CHECK accuracy, 0-100. Never a game score. */
  checkAccuracy?: number;
}

/** §25 SPACED REPETITION — per-item review state, layered on the Learning OS. */
export interface KidBoxReviewState {
  itemId: string;
  skillId: KidBoxSkillId;
  unitId: string;
  attempts: number;
  correctCount: number;
  consecutiveCorrect: number;
  /** Never reset by a single miss (§25). */
  lapses: number;
  lastPracticedAt?: number;
  lastCorrectAt?: number;
  nextReviewAt?: number;
  difficulty: 1 | 2 | 3;
}

export type KidBoxAttemptOutcome = 'CORRECT' | 'INCORRECT' | 'RECOGNITION_MATCH' | 'SELF_CHECKED' | 'SKIPPED';

export interface KidBoxAttemptRecord {
  attemptId: string;
  activityId: string;
  unitId: string;
  step: KidBoxProgressionStep;
  skillId: KidBoxSkillId;
  outcome: KidBoxAttemptOutcome;
  responseTimeMs?: number;
  at: number;
  /** `true` when the child used the replay button. Never punished (§12). */
  usedReplay: boolean;
  /** Present only for SPEAK activities when recognition was available. */
  speechRecognitionUsed: boolean;
}

/** §13/§14 — an attempt is a *recognition match*, never a pronunciation score. */
export interface KidBoxSpeakingAttempt {
  attemptId: string;
  activityId: string;
  unitId: string;
  skillId: KidBoxSkillId;
  at: number;
  mode: 'REPEAT' | 'QUESTION_ANSWER' | 'GUIDED';
  /** 'speech recognition match' | 'self-check' | 'parent-assisted check'. */
  method: 'SPEECH_RECOGNITION_MATCH' | 'SELF_CHECK' | 'PARENT_ASSISTED';
  transcript?: string;
  matchedTarget: boolean | null;
  /** Always false: this app has no trustworthy pronunciation scorer (§14). */
  pronunciationScored: false;
}

export interface KidBoxHomeworkPack {
  packId: string;
  generatedAt: number;
  scopeLabel: string;
  unitId: string | null;
  sections: KidBoxHomeworkSection[];
}

export interface KidBoxHomeworkSection {
  sectionId: string;
  title: string;
  emoji: string;
  skillId: KidBoxSkillId;
  estimatedMinutes: number;
  activityIds: string[];
  note: string;
}

/** §21 CURRENT UNIT — parent-controlled, persisted. */
export interface KidBoxCourseState {
  courseId: string;
  levelId: KidBoxLevelId;
  currentUnitId: string | null;
  currentLessonId: string | null;
  /** §20 CENTER ↔ HOME BRIDGE — optional parent note. */
  centerHomework?: string;
  /** Optional week selector used by the home bridge. */
  currentWeekLabel?: string;
}

export interface KidBoxProgressStore {
  schemaVersion: string;
  courseState: KidBoxCourseState;
  unitProgress: Record<string, KidBoxUnitProgress>;
  reviewStates: Record<string, KidBoxReviewState>;
  attempts: KidBoxAttemptRecord[];
  speakingAttempts: KidBoxSpeakingAttempt[];
  /** Timestamped counters powering the weekly report (§24). */
  counters: KidBoxWeeklyCounters;
  lastPractisedAt?: number;
}

export interface KidBoxWeeklyCounters {
  /** ISO date (YYYY-MM-DD) → counter payload. */
  days: Record<string, KidBoxDayCounters>;
}

export interface KidBoxDayCounters {
  wordsPractised: number;
  listeningSessions: number;
  speakingAttempts: number;
  readingPractised: number;
  reviewItems: number;
  phonicsPractised: number;
  patternPractised: number;
}

/* ------------------------------------------------------------------ */
/* ADAPTIVE / REPORTING                                                  */
/* ------------------------------------------------------------------ */

export type KidBoxPracticeFocus =
  | 'VOCABULARY_RECOGNITION'
  | 'VOCABULARY_RECALL'
  | 'LISTENING_RECOGNITION'
  | 'LISTENING_INSTRUCTION'
  | 'PHONICS_DISCRIMINATION'
  | 'SPEAKING_REPEAT'
  | 'SPEAKING_PATTERN'
  | 'READING_WORD'
  | 'READING_COMPREHENSION'
  | 'PATTERN_USE'
  | 'GENTLE_BASELINE';

export interface KidBoxStrandProfile {
  strand: KidBoxStrand;
  attemptCount: number;
  accuracy: number;
  recentAccuracy: number;
  mastery: number;
  confidence: number;
  status: 'NO_EVIDENCE' | 'LEARNING' | 'PRACTICING' | 'SECURE' | 'NEEDS_WORK';
}

export interface KidBoxEnglishProfile {
  /** §18 — the honest answer to "bé đang yếu gì trong English?". */
  weakestStrand: KidBoxStrand | null;
  strongestStrand: KidBoxStrand | null;
  nextBestFocus: KidBoxPracticeFocus;
  strands: Record<KidBoxStrand, KidBoxStrandProfile>;
  totalAttempts: number;
  isColdStart: boolean;
  /** Child-friendly Vietnamese explanation of the recommendation. */
  explanation: string;
}

export interface KidBoxPlanItem {
  id: string;
  title: string;
  emoji: string;
  focus: KidBoxPracticeFocus;
  skillId: KidBoxSkillId;
  estimatedMinutes: number;
  reason: string;
  childExplanation: string;
  activityId: string | null;
}

export interface KidBoxDailyPlan {
  date: string;
  estimatedMinutes: number;
  items: KidBoxPlanItem[];
  generatedAt: number;
  /** Age / fatigue / weakness inputs that shaped the plan. */
  factors: {
    ageAdjusted: boolean;
    fatigueAdjusted: boolean;
    weaknessAdjusted: boolean;
    reviewAdjusted: boolean;
  };
}

export interface KidBoxSkillStar {
  skillId: KidBoxSkillId;
  skillName: string;
  strand: KidBoxStrand;
  stars: 0 | 1 | 2 | 3 | 4 | 5;
  evidenceCount: number;
  accuracy: number;
  mastery: number;
  /** §23 — stars are only shown when backed by evidence. */
  hasEvidence: boolean;
  label: string;
}

export interface KidBoxWeeklyReport {
  fromDate: string;
  toDate: string;
  daysPractised: number;
  wordsPractised: number;
  listeningSessions: number;
  speakingAttempts: number;
  readingPractised: number;
  reviewItems: number;
  phonicsPractised: number;
  patternPractised: number;
  /** §24 — no comparison with other children, ever. */
  strongestSkills: KidBoxSkillStar[];
  skillsToPractise: KidBoxSkillStar[];
  currentUnitLabel: string;
  notes: string[];
}

export interface KidBoxValidationIssue {
  severity: 'ERROR' | 'WARNING';
  scope: string;
  code: string;
  message: string;
}

export interface KidBoxValidationReport {
  schemaVersion: string;
  courseId: string;
  totals: {
    units: number;
    lessons: number;
    vocabulary: number;
    phonics: number;
    patterns: number;
    readingTexts: number;
    activities: number;
    errors: number;
    warnings: number;
  };
  issues: KidBoxValidationIssue[];
  contentStatus: Record<string, KidBoxContentStatus>;
}
