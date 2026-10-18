/**
 * praiseEngine — CANONICAL PRAISE CONTRACT (P38).
 *
 * SINGLE SOURCE OF TRUTH for every child-facing praise moment:
 *   Praise Event → resolvePraise(context) → PraiseResult → render(text) + speak(ttsText)
 *
 * Mandatory invariant for normal praise:
 *   praise.ttsText === praise.text
 *
 * Language contract:
 *   English contexts  → language 'en-GB', pure-English text, locale 'en-GB'
 *   Vietnamese contexts → language 'vi-VN', Vietnamese text, locale 'vi-VN'
 *   Math inherits the actual learning context (default Vietnamese UI → vi-VN).
 *
 * Silent cross-language fallback is FORBIDDEN: when a language has no valid
 * phrase the resolver throws in DEV/test (fail safely) instead of borrowing
 * a phrase from the other language.
 *
 * Failure honesty:
 *   speakPraise() never claims audio success. When the platform cannot speak
 *   it returns 'UNAVAILABLE' (the project's AUDIO_UNAVAILABLE equivalent) and
 *   the caption remains visible. No crash, no fake success.
 *
 * All phrases below are original product content (no textbook copying).
 */

import {
  sound,
  VOICE_PERSONAS,
  PRAISE_PERSONA_ROTATION,
  type VoicePersona,
  type VoicePersonaId,
} from './sound';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PraiseLanguage = 'vi-VN' | 'en-GB';

export type PraiseSubject = 'VIETNAMESE' | 'MATH' | 'ENGLISH';

export type PraiseOutcome =
  | 'CORRECT'
  | 'INCORRECT'
  | 'ALMOST'
  | 'FIRST_SUCCESS'
  | 'STREAK'
  | 'COMBO'
  | 'PERSONAL_BEST'
  | 'IMPROVEMENT'
  | 'MASTERED'
  | 'REVIEW_SUCCESS'
  | 'GAME_COMPLETED'
  | 'LESSON_COMPLETED'
  | 'MISSION_COMPLETED'
  | 'DAILY_GOAL'
  | 'COMPETITION_SUCCESS'
  | 'RECOVERY_AFTER_ERROR'
  | 'ENCOURAGEMENT';

export type PraiseCharacter =
  | 'GAU_BUT_CHI'
  | 'CAO_TOAN_HOC'
  | 'THO_ENGLISH'
  | 'CU_THONG_THAI';

export type PraiseAudioState = 'READY' | 'SPOKEN' | 'UNAVAILABLE';

export interface PraiseContext {
  /** Canonical subject of the activity that produced the event. */
  subject: PraiseSubject;
  /** One outcome, or several competing outcomes — priority resolves to one. */
  outcome: PraiseOutcome | PraiseOutcome[];
  /** Explicit language override (activity/course language wins). */
  language?: PraiseLanguage;
  /** True when the event comes from the Kid's Box English track. */
  kidBox?: boolean;
  /** Math UI language (Math inherits the real learning context). */
  mathUiLanguage?: PraiseLanguage;
  /** Identity for event deduplication (one logical event → one praise). */
  eventId?: string;
  /** Deterministic seed for tests (same seed + same context → same phrase). */
  seed?: string;
}

export interface PraisePhrase {
  id: string;
  language: PraiseLanguage;
  outcome: PraiseOutcome;
  text: string;
}

export interface PraiseResult {
  id: string;
  language: PraiseLanguage;
  subject: PraiseSubject;
  character: PraiseCharacter;
  characterEmoji: string;
  outcome: PraiseOutcome;
  /** Canonical child-facing string — rendered as the caption. */
  text: string;
  /** String handed to the speech engine. INVARIANT: ttsText === text. */
  ttsText: string;
  /** TTS locale: 'en-GB' for English praise, 'vi-VN' for Vietnamese. */
  locale: PraiseLanguage;
  /** Voice persona rotated per event (adult teachers/uncle/grandma + kids). */
  personaId?: VoicePersonaId;
  audioState: PraiseAudioState;
}

export interface PraiseLogEntry {
  language: PraiseLanguage;
  subject: PraiseSubject;
  outcome: PraiseOutcome;
  character: PraiseCharacter;
  displayText: string;
  ttsText: string;
  ttsLocale: PraiseLanguage;
  personaId?: VoicePersonaId;
  textTtsParity: 'PASS' | 'FAIL';
  languageParity: 'PASS' | 'FAIL';
  at: number;
}

/* ------------------------------------------------------------------ */
/* Catalogs — original product content, child-safe, single-language    */
/* ------------------------------------------------------------------ */

const EN_CORRECT: PraisePhrase[] = [
  { id: 'en-correct-01', language: 'en-GB', outcome: 'CORRECT', text: 'Great job!' },
  { id: 'en-correct-02', language: 'en-GB', outcome: 'CORRECT', text: 'Well done!' },
  { id: 'en-correct-03', language: 'en-GB', outcome: 'CORRECT', text: 'Excellent!' },
  { id: 'en-correct-04', language: 'en-GB', outcome: 'CORRECT', text: 'Amazing!' },
  { id: 'en-correct-05', language: 'en-GB', outcome: 'CORRECT', text: 'You got it!' },
  { id: 'en-correct-06', language: 'en-GB', outcome: 'CORRECT', text: 'Fantastic!' },
  { id: 'en-correct-07', language: 'en-GB', outcome: 'CORRECT', text: 'Brilliant!' },
  { id: 'en-correct-08', language: 'en-GB', outcome: 'CORRECT', text: 'Super work!' },
  { id: 'en-correct-09', language: 'en-GB', outcome: 'CORRECT', text: 'You did it!' },
];

const EN_ENCOURAGEMENT: PraisePhrase[] = [
  { id: 'en-enc-01', language: 'en-GB', outcome: 'ENCOURAGEMENT', text: 'Good try!' },
  { id: 'en-enc-02', language: 'en-GB', outcome: 'ENCOURAGEMENT', text: 'Almost there!' },
  { id: 'en-enc-03', language: 'en-GB', outcome: 'ENCOURAGEMENT', text: 'Try again!' },
  { id: 'en-enc-04', language: 'en-GB', outcome: 'ENCOURAGEMENT', text: 'Keep going!' },
  { id: 'en-enc-05', language: 'en-GB', outcome: 'ENCOURAGEMENT', text: "You're getting better!" },
  { id: 'en-enc-06', language: 'en-GB', outcome: 'ENCOURAGEMENT', text: 'Nice try! One more time!' },
];

const EN_MILESTONE: PraisePhrase[] = [
  { id: 'en-mile-01', language: 'en-GB', outcome: 'STREAK', text: 'Amazing streak! Keep it up!' },
  { id: 'en-mile-02', language: 'en-GB', outcome: 'STREAK', text: 'Three in a row! Super!' },
  { id: 'en-mile-03', language: 'en-GB', outcome: 'COMBO', text: 'Super combo! Wow!' },
  { id: 'en-mile-04', language: 'en-GB', outcome: 'COMBO', text: 'Fantastic combo!' },
  { id: 'en-mile-05', language: 'en-GB', outcome: 'PERSONAL_BEST', text: 'Your best yet! Amazing!' },
  { id: 'en-mile-06', language: 'en-GB', outcome: 'PERSONAL_BEST', text: 'New record! Well done!' },
  { id: 'en-mile-07', language: 'en-GB', outcome: 'MASTERED', text: 'You mastered it! Brilliant!' },
  { id: 'en-mile-08', language: 'en-GB', outcome: 'MASTERED', text: 'Star reader! Excellent work!' },
  { id: 'en-mile-09', language: 'en-GB', outcome: 'FIRST_SUCCESS', text: 'First star! Great start!' },
  { id: 'en-mile-10', language: 'en-GB', outcome: 'FIRST_SUCCESS', text: 'You did it first try! Wow!' },
  { id: 'en-mile-11', language: 'en-GB', outcome: 'RECOVERY_AFTER_ERROR', text: 'You fixed it! Great trying again!' },
  { id: 'en-mile-12', language: 'en-GB', outcome: 'RECOVERY_AFTER_ERROR', text: 'Bounced back! Well done!' },
  { id: 'en-mile-13', language: 'en-GB', outcome: 'IMPROVEMENT', text: "You're improving! Keep going!" },
  { id: 'en-mile-14', language: 'en-GB', outcome: 'IMPROVEMENT', text: 'Better and better! Great!' },
  { id: 'en-mile-15', language: 'en-GB', outcome: 'REVIEW_SUCCESS', text: 'Great review! You remember it!' },
  { id: 'en-mile-16', language: 'en-GB', outcome: 'REVIEW_SUCCESS', text: 'Well remembered! Super!' },
  { id: 'en-mile-17', language: 'en-GB', outcome: 'GAME_COMPLETED', text: 'Game complete! Fantastic!' },
  { id: 'en-mile-18', language: 'en-GB', outcome: 'GAME_COMPLETED', text: 'You finished the game! Bravo!' },
  { id: 'en-mile-19', language: 'en-GB', outcome: 'LESSON_COMPLETED', text: 'Lesson complete! Amazing work!' },
  { id: 'en-mile-20', language: 'en-GB', outcome: 'LESSON_COMPLETED', text: 'You finished the lesson! Super!' },
  { id: 'en-mile-21', language: 'en-GB', outcome: 'MISSION_COMPLETED', text: 'Mission complete! You did it!' },
  { id: 'en-mile-22', language: 'en-GB', outcome: 'DAILY_GOAL', text: 'Daily goal done! Fantastic!' },
  { id: 'en-mile-23', language: 'en-GB', outcome: 'COMPETITION_SUCCESS', text: 'Champion! Excellent work!' },
  { id: 'en-mile-24', language: 'en-GB', outcome: 'COMPETITION_SUCCESS', text: 'Great contest! Well played!' },
  { id: 'en-mile-25', language: 'en-GB', outcome: 'ALMOST', text: 'So close! Try once more!' },
  { id: 'en-mile-26', language: 'en-GB', outcome: 'ALMOST', text: 'Almost! You can do it!' },
];

const VI_CORRECT: PraisePhrase[] = [
  { id: 'vi-correct-01', language: 'vi-VN', outcome: 'CORRECT', text: 'Giỏi lắm!' },
  { id: 'vi-correct-02', language: 'vi-VN', outcome: 'CORRECT', text: 'Làm tốt lắm!' },
  { id: 'vi-correct-03', language: 'vi-VN', outcome: 'CORRECT', text: 'Chính xác!' },
  { id: 'vi-correct-04', language: 'vi-VN', outcome: 'CORRECT', text: 'Con làm rất tốt!' },
  { id: 'vi-correct-05', language: 'vi-VN', outcome: 'CORRECT', text: 'Tuyệt vời!' },
  { id: 'vi-correct-06', language: 'vi-VN', outcome: 'CORRECT', text: 'Đúng rồi!' },
  { id: 'vi-correct-07', language: 'vi-VN', outcome: 'CORRECT', text: 'Rất giỏi!' },
  { id: 'vi-correct-08', language: 'vi-VN', outcome: 'CORRECT', text: 'Hoan hô bé!' },
  { id: 'vi-correct-09', language: 'vi-VN', outcome: 'CORRECT', text: 'Bé giỏi quá!' },
];

const VI_ENCOURAGEMENT: PraisePhrase[] = [
  { id: 'vi-enc-01', language: 'vi-VN', outcome: 'ENCOURAGEMENT', text: 'Cố lên nào!' },
  { id: 'vi-enc-02', language: 'vi-VN', outcome: 'ENCOURAGEMENT', text: 'Gần đúng rồi!' },
  { id: 'vi-enc-03', language: 'vi-VN', outcome: 'ENCOURAGEMENT', text: 'Thử lại nhé!' },
  { id: 'vi-enc-04', language: 'vi-VN', outcome: 'ENCOURAGEMENT', text: 'Không sao đâu, thử lại nào!' },
  { id: 'vi-enc-05', language: 'vi-VN', outcome: 'ENCOURAGEMENT', text: 'Bé cố gắng thêm chút nữa nhé!' },
  { id: 'vi-enc-06', language: 'vi-VN', outcome: 'ENCOURAGEMENT', text: 'Chưa đúng rồi, bé xem lại nhé!' },
];

const VI_MILESTONE: PraisePhrase[] = [
  { id: 'vi-mile-01', language: 'vi-VN', outcome: 'STREAK', text: 'Ba câu liền đúng! Tuyệt vời!' },
  { id: 'vi-mile-02', language: 'vi-VN', outcome: 'STREAK', text: 'Mạch đúng dài quá! Giỏi lắm!' },
  { id: 'vi-mile-03', language: 'vi-VN', outcome: 'COMBO', text: 'Combo tuyệt đỉnh! Hoan hô!' },
  { id: 'vi-mile-04', language: 'vi-VN', outcome: 'COMBO', text: 'Combo liên tiếp! Xuất sắc!' },
  { id: 'vi-mile-05', language: 'vi-VN', outcome: 'PERSONAL_BEST', text: 'Kỷ lục mới của bé! Giỏi quá!' },
  { id: 'vi-mile-06', language: 'vi-VN', outcome: 'PERSONAL_BEST', text: 'Bé giỏi hơn hôm qua rồi!' },
  { id: 'vi-mile-07', language: 'vi-VN', outcome: 'MASTERED', text: 'Bé đã thành thạo rồi! Tuyệt!' },
  { id: 'vi-mile-08', language: 'vi-VN', outcome: 'MASTERED', text: 'Chinh phục xong! Xuất sắc!' },
  { id: 'vi-mile-09', language: 'vi-VN', outcome: 'FIRST_SUCCESS', text: 'Ngôi sao đầu tiên! Giỏi lắm!' },
  { id: 'vi-mile-10', language: 'vi-VN', outcome: 'FIRST_SUCCESS', text: 'Lần đầu đã đúng! Hoan hô!' },
  { id: 'vi-mile-11', language: 'vi-VN', outcome: 'RECOVERY_AFTER_ERROR', text: 'Sửa lại đúng rồi! Cố gắng tốt lắm!' },
  { id: 'vi-mile-12', language: 'vi-VN', outcome: 'RECOVERY_AFTER_ERROR', text: 'Bé đã làm lại thành công!' },
  { id: 'vi-mile-13', language: 'vi-VN', outcome: 'IMPROVEMENT', text: 'Bé tiến bộ nhiều rồi! Cố lên!' },
  { id: 'vi-mile-14', language: 'vi-VN', outcome: 'IMPROVEMENT', text: 'Ngày càng giỏi hơn! Tuyệt!' },
  { id: 'vi-mile-15', language: 'vi-VN', outcome: 'REVIEW_SUCCESS', text: 'Ôn bài rất tốt! Bé nhớ bài!' },
  { id: 'vi-mile-16', language: 'vi-VN', outcome: 'REVIEW_SUCCESS', text: 'Nhớ bài giỏi quá! Hoan hô!' },
  { id: 'vi-mile-17', language: 'vi-VN', outcome: 'GAME_COMPLETED', text: 'Hoàn thành trò chơi! Tuyệt vời!' },
  { id: 'vi-mile-18', language: 'vi-VN', outcome: 'GAME_COMPLETED', text: 'Chơi xong rồi! Bé giỏi quá!' },
  { id: 'vi-mile-19', language: 'vi-VN', outcome: 'LESSON_COMPLETED', text: 'Hoàn thành bài học! Giỏi lắm!' },
  { id: 'vi-mile-20', language: 'vi-VN', outcome: 'LESSON_COMPLETED', text: 'Học xong bài rồi! Hoan hô bé!' },
  { id: 'vi-mile-21', language: 'vi-VN', outcome: 'MISSION_COMPLETED', text: 'Hoàn thành nhiệm vụ! Xuất sắc!' },
  { id: 'vi-mile-22', language: 'vi-VN', outcome: 'DAILY_GOAL', text: 'Xong mục tiêu hôm nay! Tuyệt!' },
  { id: 'vi-mile-23', language: 'vi-VN', outcome: 'COMPETITION_SUCCESS', text: 'Nhà vô địch nhí! Giỏi quá!' },
  { id: 'vi-mile-24', language: 'vi-VN', outcome: 'COMPETITION_SUCCESS', text: 'Thi đấu xuất sắc! Hoan hô!' },
  { id: 'vi-mile-25', language: 'vi-VN', outcome: 'ALMOST', text: 'Suýt đúng rồi! Thử lại nhé!' },
  { id: 'vi-mile-26', language: 'vi-VN', outcome: 'ALMOST', text: 'Gần được rồi! Bé cố lên!' },
];

const CATALOG: PraisePhrase[] = [
  ...EN_CORRECT,
  ...EN_ENCOURAGEMENT,
  ...EN_MILESTONE,
  ...VI_CORRECT,
  ...VI_ENCOURAGEMENT,
  ...VI_MILESTONE,
];

/* ------------------------------------------------------------------ */
/* Language resolution — one canonical resolver (P38 §6)                */
/*                                                                     */
/* Priority: explicit activity/course language → Kid's Box / English   */
/* context → subject language → Math UI language → safe default vi-VN */
/* ------------------------------------------------------------------ */

export function resolvePraiseLanguage(ctx: {
  subject: PraiseSubject;
  language?: PraiseLanguage;
  kidBox?: boolean;
  mathUiLanguage?: PraiseLanguage;
}): PraiseLanguage {
  if (ctx.language) return ctx.language;
  if (ctx.kidBox) return 'en-GB';
  if (ctx.subject === 'ENGLISH') return 'en-GB';
  if (ctx.subject === 'MATH') return ctx.mathUiLanguage ?? 'vi-VN';
  return 'vi-VN';
}

/** Map a lesson/curriculum subject string to the canonical PraiseSubject. */
export function toPraiseSubject(
  subject: string | null | undefined,
  kidBox = false
): PraiseSubject {
  if (kidBox) return 'ENGLISH';
  if (subject === 'english') return 'ENGLISH';
  if (subject === 'toan' || subject === 'math') return 'MATH';
  return 'VIETNAMESE';
}

/* ------------------------------------------------------------------ */
/* Character resolution — centralized (P38 §10)                        */
/* ------------------------------------------------------------------ */

const CHARACTER_META: Record<PraiseCharacter, { emoji: string; name: string }> = {
  THO_ENGLISH: { emoji: '🐰', name: 'Thỏ English' },
  CAO_TOAN_HOC: { emoji: '🦊', name: 'Cáo Toán Học' },
  GAU_BUT_CHI: { emoji: '🐻', name: 'Gấu Bút Chì' },
  CU_THONG_THAI: { emoji: '🦉', name: 'Cú Thông Thái' },
};

export function resolvePraiseCharacter(subject: PraiseSubject): PraiseCharacter {
  if (subject === 'ENGLISH') return 'THO_ENGLISH';
  if (subject === 'MATH') return 'CAO_TOAN_HOC';
  return 'GAU_BUT_CHI';
}

export function praiseCharacterEmoji(character: PraiseCharacter): string {
  return CHARACTER_META[character].emoji;
}

export function praiseCharacterName(character: PraiseCharacter): string {
  return CHARACTER_META[character].name;
}

/* ------------------------------------------------------------------ */
/* Outcome priority — deterministic (P38 §11)                          */
/* ------------------------------------------------------------------ */

/** Highest priority first. INCORRECT maps to ENCOURAGEMENT speech. */
const OUTCOME_PRIORITY: PraiseOutcome[] = [
  'MASTERED',
  'PERSONAL_BEST',
  'RECOVERY_AFTER_ERROR',
  'STREAK',
  'COMBO',
  'FIRST_SUCCESS',
  'CORRECT',
  'IMPROVEMENT',
  'REVIEW_SUCCESS',
  'GAME_COMPLETED',
  'LESSON_COMPLETED',
  'MISSION_COMPLETED',
  'DAILY_GOAL',
  'COMPETITION_SUCCESS',
  'ALMOST',
  'ENCOURAGEMENT',
  'INCORRECT',
];

/** INCORRECT is a verdict, not a speech line — it speaks encouragement. */
function speechOutcome(outcome: PraiseOutcome): PraiseOutcome {
  return outcome === 'INCORRECT' ? 'ENCOURAGEMENT' : outcome;
}

export function pickOutcome(outcome: PraiseOutcome | PraiseOutcome[]): PraiseOutcome {
  if (!Array.isArray(outcome)) return outcome;
  if (outcome.length === 0) {
    throw new Error('[praiseEngine] pickOutcome: empty outcome list — refusing to guess.');
  }
  for (const candidate of OUTCOME_PRIORITY) {
    if (outcome.includes(candidate)) return candidate;
  }
  return outcome[0];
}

/* ------------------------------------------------------------------ */
/* Content validation (P38 §17–19)                                     */
/* ------------------------------------------------------------------ */

const VIETNAMESE_MARKS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/** Common Vietnamese words — whole-word match only, so English names pass. */
const VI_COMMON_WORDS = [
  'bé', 'con', 'làm', 'giỏi', 'lắm', 'cố', 'lên', 'thử', 'lại', 'đúng',
  'rồi', 'tuyệt', 'vời', 'hoan', 'hô', 'chính', 'xác', 'không', 'sao',
  'đâu', 'nhé', 'nào', 'quá', 'rất', 'tốt', 'xuất', 'sắc', 'nhiệm',
  'vụ', 'xong', 'nhớ', 'bài', 'thi', 'đấu', 'chưa', 'được', 'cùng',
  'mẹ', 'suýt', 'thành', 'thạo', 'chinh', 'phục', 'kỷ', 'lục', 'hôm',
  'nay', 'ngày', 'càng', 'thêm', 'chút', 'nữa', 'xem', 'câu', 'trò',
  'chơi', 'học', 'ôn', 'tiến', 'bộ', 'nhiều', 'liền', 'mạch', 'dài',
  'đỉnh', 'tiếp', 'đầu', 'tiên',
];

const PLACEHOLDER_WORDS = ['todo', 'test', 'undefined', 'null', 'xxx'];
const PLACEHOLDER_PHRASES = ['lorem ipsum', '[missing]', '???'];

function containsWholeWord(haystack: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, 'iu').test(haystack);
}

/** True when the text is pure English (no Vietnamese marks or words). */
export function isPureEnglishPraise(text: string): boolean {
  if (VIETNAMESE_MARKS.test(text)) return false;
  return !VI_COMMON_WORDS.some((w) => containsWholeWord(text, w));
}

/** True when the text carries Vietnamese identity (marks or common words). */
export function isVietnamesePraise(text: string): boolean {
  if (VIETNAMESE_MARKS.test(text)) return true;
  return VI_COMMON_WORDS.some((w) => containsWholeWord(text, w));
}

export function isPlaceholderText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  const lower = trimmed.toLowerCase();
  // Multi-word markers match as substrings; single words match whole-word
  // only, so "contest" never trips the "test" guard.
  if (PLACEHOLDER_PHRASES.some((p) => lower.includes(p))) return true;
  return PLACEHOLDER_WORDS.some((w) => containsWholeWord(trimmed, w));
}

/**
 * Validates one catalog phrase against its declared language.
 * Throws in DEV/test on violation; returns true when valid.
 */
export function validatePraisePhrase(phrase: PraisePhrase): boolean {
  if (!phrase.text || phrase.text.trim().length === 0) {
    throw new Error(`[praiseEngine] EMPTY praise text (id=${phrase.id}).`);
  }
  if (isPlaceholderText(phrase.text)) {
    throw new Error(
      `[praiseEngine] PLACEHOLDER praise text (id=${phrase.id}): ${JSON.stringify(phrase.text)}.`
    );
  }
  if (phrase.language === 'en-GB' && !isPureEnglishPraise(phrase.text)) {
    throw new Error(
      `[praiseEngine] MIXED-LANGUAGE contamination in English praise (id=${phrase.id}): ` +
        `${JSON.stringify(phrase.text)}. English praise must be pure English.`
    );
  }
  if (phrase.language === 'vi-VN' && !isVietnamesePraise(phrase.text)) {
    throw new Error(
      `[praiseEngine] LANGUAGE_MISMATCH in Vietnamese praise (id=${phrase.id}): ` +
        `${JSON.stringify(phrase.text)}. Vietnamese praise must read as Vietnamese.`
    );
  }
  return true;
}

/** Assert displayed caption === TTS text for normal praise. Throws on mismatch. */
export function assertTextTtsParity(praise: Pick<PraiseResult, 'text' | 'ttsText' | 'id'>): boolean {
  if (praise.text !== praise.ttsText) {
    throw new Error(
      `[praiseEngine] TEXT_TTS_PARITY FAIL (id=${praise.id}): ` +
        `display=${JSON.stringify(praise.text)} tts=${JSON.stringify(praise.ttsText)}.`
    );
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Selector + anti-repetition (P38 §12) + dedup (P38 §16)              */
/* ------------------------------------------------------------------ */

const recentHistory = new Map<string, string[]>();
const HISTORY_CAP = 3;

const seenEventIds = new Set<string>();

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function phrasesFor(language: PraiseLanguage, outcome: PraiseOutcome): PraisePhrase[] {
  const spoken = speechOutcome(outcome);
  const exact = CATALOG.filter((p) => p.language === language && p.outcome === spoken);
  if (exact.length > 0) return exact;
  // Graceful narrowing INSIDE the same language only (never cross-language):
  // milestone outcomes fall back to CORRECT, encouragement stays encouraging.
  if (language === 'en-GB') {
    return spoken === 'ENCOURAGEMENT' || spoken === 'ALMOST' ? EN_ENCOURAGEMENT : EN_CORRECT;
  }
  return spoken === 'ENCOURAGEMENT' || spoken === 'ALMOST' ? VI_ENCOURAGEMENT : VI_CORRECT;
}

export function selectPhrase(
  language: PraiseLanguage,
  outcome: PraiseOutcome,
  seed?: string
): PraisePhrase {
  const pool = phrasesFor(language, outcome);
  if (pool.length === 0) {
    // Fail safely — NEVER borrow from the other language (§2.3).
    throw new Error(
      `[praiseEngine] NO_PHRASE for language=${language} outcome=${outcome} — refusing silent fallback.`
    );
  }
  // Deterministic test mode: same seed → same phrase.
  if (seed !== undefined) {
    return pool[hashSeed(`${language}:${outcome}:${seed}`) % pool.length];
  }
  const key = `${language}:${outcome}`;
  const recent = recentHistory.get(key) ?? [];
  const fresh = pool.filter((p) => !recent.includes(p.id));
  const chosen = (fresh.length > 0 ? fresh : pool)[Math.floor(Math.random() * (fresh.length > 0 ? fresh.length : pool.length))];
  const next = [...recent, chosen.id].slice(-HISTORY_CAP);
  recentHistory.set(key, next);
  return chosen;
}

/** True when this logical event already produced praise (duplicate guard). */
export function isDuplicatePraiseEvent(eventId: string): boolean {
  return seenEventIds.has(eventId);
}

export function markPraiseEventSeen(eventId: string): void {
  seenEventIds.add(eventId);
  if (seenEventIds.size > 500) {
    const first = seenEventIds.values().next().value;
    if (first) seenEventIds.delete(first);
  }
}

/** Test helper — resets anti-repetition history and dedup set. */
export function resetPraiseEngineForTests(): void {
  recentHistory.clear();
  seenEventIds.clear();
}

/* ------------------------------------------------------------------ */
/* Resolver — the single entry point (P38 §5, §13)                      */
/*                                                                     */
/*   const praise = resolvePraise(ctx);                                 */
/*   render(praise.text); speakPraise(praise); // speaks praise.ttsText */
/* ------------------------------------------------------------------ */

export function resolvePraise(ctx: PraiseContext): PraiseResult {
  const outcome = pickOutcome(ctx.outcome);
  const language = resolvePraiseLanguage(ctx);
  const subject = ctx.subject;
  const character = resolvePraiseCharacter(subject);
  const phrase = selectPhrase(language, outcome, ctx.seed);

  if (import.meta.env.DEV) {
    validatePraisePhrase(phrase);
  }

  const result: PraiseResult = {
    id: phrase.id,
    language,
    subject,
    character,
    characterEmoji: praiseCharacterEmoji(character),
    outcome,
    text: phrase.text,
    ttsText: phrase.text,
    locale: language,
    audioState: 'READY',
  };

  assertTextTtsParity(result);
  logPraiseEvent(result);
  if (ctx.eventId) markPraiseEventSeen(ctx.eventId);
  return result;
}

/**
 * Contextual praise for content-bound feedback (e.g. "Great job! This is a
 * Dog!"). The sentence is authored by the caller, validated to match the
 * context language, and logged — caption and TTS stay identical by using the
 * SAME string for both. Preferred for games that name the learned object.
 */
export function resolveContextualPraise(
  ctx: PraiseContext,
  sentence: string,
  sentenceLang: PraiseLanguage
): PraiseResult {
  const language = resolvePraiseLanguage(ctx);
  if (sentenceLang !== language) {
    throw new Error(
      `[praiseEngine] CONTEXT_LANGUAGE_MISMATCH: context=${language} sentence=${sentenceLang} ` +
        `${JSON.stringify(sentence)}. Praise must stay in one language.`
    );
  }
  if (!sentence || sentence.trim().length === 0 || isPlaceholderText(sentence)) {
    throw new Error('[praiseEngine] EMPTY_OR_PLACEHOLDER contextual praise — refusing to speak.');
  }
  if (language === 'en-GB' && !isPureEnglishPraise(sentence)) {
    throw new Error(
      `[praiseEngine] MIXED-LANGUAGE contextual praise in English context: ${JSON.stringify(sentence)}.`
    );
  }
  const outcome = pickOutcome(ctx.outcome);
  const result: PraiseResult = {
    id: `ctx-${hashSeed(sentence).toString(36)}`,
    language,
    subject: ctx.subject,
    character: resolvePraiseCharacter(ctx.subject),
    characterEmoji: praiseCharacterEmoji(resolvePraiseCharacter(ctx.subject)),
    outcome,
    text: sentence,
    ttsText: sentence,
    locale: language,
    audioState: 'READY',
  };
  assertTextTtsParity(result);
  logPraiseEvent(result);
  if (ctx.eventId) markPraiseEventSeen(ctx.eventId);
  return result;
}

/* ------------------------------------------------------------------ */
/* Speech routing (P38 §14–15) — Praise → Speech Service, nothing else */
/* ------------------------------------------------------------------ */

const PRAISE_PERSONA_HISTORY_CAP = 2;
const praisePersonaHistory: VoicePersonaId[] = [];

/**
 * Rotates the praising voice across the PRAISE_PERSONA_ROTATION pool
 * (adult + child personas). Without a seed it never repeats a persona within
 * the last two praise events; with a seed it is deterministic.
 */
export function pickPraisePersona(seed?: string): VoicePersonaId {
  if (seed !== undefined) {
    return PRAISE_PERSONA_ROTATION[hashSeed(seed) % PRAISE_PERSONA_ROTATION.length];
  }
  const fresh = PRAISE_PERSONA_ROTATION.filter((p) => !praisePersonaHistory.includes(p));
  const pool = fresh.length > 0 ? fresh : PRAISE_PERSONA_ROTATION;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  praisePersonaHistory.push(chosen);
  if (praisePersonaHistory.length > PRAISE_PERSONA_HISTORY_CAP) {
    praisePersonaHistory.splice(0, praisePersonaHistory.length - PRAISE_PERSONA_HISTORY_CAP);
  }
  return chosen;
}

export function listPraisePersonas(): VoicePersona[] {
  return PRAISE_PERSONA_ROTATION.map((id) => VOICE_PERSONAS[id]);
}

export function resetPraisePersonasForTests(): void {
  praisePersonaHistory.length = 0;
}

function speechAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('speechSynthesis' in window)) return false;
  try {
    return typeof window.speechSynthesis?.speak === 'function';
  } catch {
    return false;
  }
}

/**
 * Speaks praise.ttsText with praise.locale. Returns the truthful outcome:
 *   'SPOKEN'     — audio was requested with the exact caption string
 *   'UNAVAILABLE' — platform muted / voice disabled / synthesis missing or
 *                   threw (AUDIO_UNAVAILABLE). Caption stays visible; no crash.
 * Never throws, never reports fake success.
 */
export function speakPraise(praise: PraiseResult): 'SPOKEN' | 'UNAVAILABLE' {
  assertTextTtsParity(praise);
  if (typeof window === 'undefined') return 'UNAVAILABLE';
  try {
    if (sound.getMuted() || !sound.getVoiceEnabled()) return 'UNAVAILABLE';
    if (!speechAvailable()) return 'UNAVAILABLE';
    const personaId = pickPraisePersona();
    praise.personaId = personaId;
    sound.speak(praise.ttsText, praise.locale, { personaId });
    praise.audioState = 'SPOKEN';
    return 'SPOKEN';
  } catch {
    praise.audioState = 'UNAVAILABLE';
    return 'UNAVAILABLE';
  }
}

/* ------------------------------------------------------------------ */
/* Instrumentation — DEV/test evidence trail (P38 §26)                 */
/*                                                                     */
/*   PRAISE_EVENT language=en-GB subject=ENGLISH outcome=CORRECT ...   */
/* ------------------------------------------------------------------ */

export function logPraiseEvent(praise: PraiseResult): void {
  try {
    const w = window as unknown as { __praiseLog?: PraiseLogEntry[] };
    const log = (w.__praiseLog ??= []);
    log.push({
      language: praise.language,
      subject: praise.subject,
      outcome: praise.outcome,
      character: praise.character,
      displayText: praise.text,
      ttsText: praise.ttsText,
      ttsLocale: praise.locale,
      personaId: praise.personaId,
      textTtsParity: praise.text === praise.ttsText ? 'PASS' : 'FAIL',
      languageParity:
        praise.language === 'en-GB'
          ? isPureEnglishPraise(praise.text)
            ? 'PASS'
            : 'FAIL'
          : isVietnamesePraise(praise.text)
            ? 'PASS'
            : 'FAIL',
      at: Date.now(),
    });
    if (log.length > 50) log.splice(0, log.length - 50);
  } catch {
    /* Logging must never break praise. */
  }
}

/** Dev/test one-liner mirroring the §26 evidence block. */
export function formatPraiseEvidence(praise: PraiseResult): string {
  const lines = [
    'PRAISE_EVENT',
    `language=${praise.language}`,
    `subject=${praise.subject}`,
    `outcome=${praise.outcome}`,
    `character=${praise.character}`,
    '',
    `DISPLAY_TEXT=${JSON.stringify(praise.text)}`,
    `TTS_TEXT=${JSON.stringify(praise.ttsText)}`,
    `TTS_LOCALE=${JSON.stringify(praise.locale)}`,
    `TTS_PERSONA=${JSON.stringify(praise.personaId ?? 'narrator')}`,
    '',
    `TEXT_TTS_PARITY=${praise.text === praise.ttsText ? 'PASS' : 'FAIL'}`,
    `LANGUAGE_PARITY=${
      praise.language === 'en-GB'
        ? isPureEnglishPraise(praise.text)
          ? 'PASS'
          : 'FAIL'
        : isVietnamesePraise(praise.text)
          ? 'PASS'
          : 'FAIL'
    }`,
  ];
  return lines.join('\n');
}

/** Full catalog (read-only copy) for audits and tests. */
export function getPraiseCatalog(): readonly PraisePhrase[] {
  return CATALOG;
}
