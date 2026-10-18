import { SPEECH_REPORTING_POLICY } from '../config/policy';
import { sound } from './sound';

/**
 * §7 BRITISH ENGLISH + §13/§14 SPEAKING SAFETY for the Kid's Box Companion track.
 *
 * Hard rules implemented here:
 *  - The only locale this track declares is `en-GB`. `en-US` is never used as
 *    the default for Kid's Box content.
 *  - Voice fallback is a controlled chain: en-GB voice → any English voice →
 *    text/captions only. Nothing ever throws and nothing claims to be
 *    "authentic British pronunciation" when the device has no en-GB voice.
 *  - Speech recognition is optional. When it is missing, the child can still
 *    listen, repeat and self-check, and the UI says which method was used.
 *  - §14: no pronunciation percentage is ever produced or displayed.
 */

export const BRITISH_LOCALE = 'en-GB' as const;

export type BritishVoiceTier = 'EN_GB' | 'EN_GB_VARIANT' | 'GENERIC_ENGLISH' | 'NONE';

export type BritishFallback = 'USE_EN_GB_VOICE' | 'USE_GENERIC_ENGLISH' | 'USE_TEXT_AND_CAPTIONS_ONLY';

export interface BritishVoiceCapability {
  /** Speech synthesis exists at all. */
  supported: boolean;
  tier: BritishVoiceTier;
  voiceName: string | null;
  voiceLang: string | null;
  /** Only true when a real en-GB voice is installed. */
  canClaimBritishEnglish: boolean;
  fallback: BritishFallback;
  /** Honest, parent-readable description of what will actually be heard. */
  label: string;
  reason: string;
}

/** Capability of the browser's speech recognition, never assumed to exist. */
export interface SpeechRecognitionCapability {
  supported: boolean;
  /** Recognition usually returns an accent-dependent string match. */
  language: typeof BRITISH_LOCALE;
  label: string;
  reason: string;
}

let cachedCapability: BritishVoiceCapability | null = null;

/** Normalises `en_GB` style lang tags to `en-GB`. */
function normaliseLang(lang: string): string {
  return lang.replace('_', '-');
}

function computeCapability(): BritishVoiceCapability {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      supported: false,
      tier: 'NONE',
      voiceName: null,
      voiceLang: null,
      canClaimBritishEnglish: false,
      fallback: 'USE_TEXT_AND_CAPTIONS_ONLY',
      label: 'Máy chưa có giọng đọc — dùng hình và chữ',
      reason: 'Trình duyệt không hỗ trợ speechSynthesis.',
    };
  }

  const voices = sound.getVoices();
  const exact = voices.find((v) => normaliseLang(v.lang) === BRITISH_LOCALE);
  if (exact) {
    return {
      supported: true,
      tier: 'EN_GB',
      voiceName: exact.name,
      voiceLang: exact.lang,
      canClaimBritishEnglish: true,
      fallback: 'USE_EN_GB_VOICE',
      label: `Giọng British English (${BRITISH_LOCALE})`,
      reason: `Thiết bị có giọng "${exact.name}" (${exact.lang}).`,
    };
  }

  const variant = voices.find((v) => normaliseLang(v.lang).startsWith(`${BRITISH_LOCALE}-`));
  if (variant) {
    return {
      supported: true,
      tier: 'EN_GB_VARIANT',
      voiceName: variant.name,
      voiceLang: variant.lang,
      canClaimBritishEnglish: true,
      fallback: 'USE_EN_GB_VOICE',
      label: `Giọng British English (${variant.lang})`,
      reason: `Thiết bị chỉ có giọng "${variant.name}" (${variant.lang}) — vẫn thuộc nhóm en-GB.`,
    };
  }

  const genericEnglish = voices.find((v) => normaliseLang(v.lang).startsWith('en'));
  if (genericEnglish) {
    return {
      supported: true,
      tier: 'GENERIC_ENGLISH',
      voiceName: genericEnglish.name,
      voiceLang: genericEnglish.lang,
      canClaimBritishEnglish: false,
      fallback: 'USE_GENERIC_ENGLISH',
      label: `Giọng English (${genericEnglish.lang}) — không phải en-GB`,
      reason:
        'Thiết bị chưa có giọng en-GB. Bé vẫn nghe được, nhưng ba mẹ nên cho bé nghe giọng chuẩn tại lớp để luyện tai.',
    };
  }

  return {
    supported: false,
    tier: 'NONE',
    voiceName: null,
    voiceLang: null,
    canClaimBritishEnglish: false,
    fallback: 'USE_TEXT_AND_CAPTIONS_ONLY',
    label: 'Máy chưa có giọng đọc — dùng hình và chữ',
    reason: 'Chưa nạp được danh sách giọng của thiết bị.',
  };
}

/**
 * Reads the current voice capability. Voice lists load asynchronously in most
 * browsers, so pass `refresh = true` once `voiceschanged` has fired.
 */
export function getBritishVoiceCapability(refresh = false): BritishVoiceCapability {
  if (refresh || !cachedCapability) cachedCapability = computeCapability();
  return cachedCapability;
}

/** Registers the platform `voiceschanged` listener exactly once. */
export function watchBritishVoices(onChange?: (cap: BritishVoiceCapability) => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => {};
  const handler = () => {
    const cap = getBritishVoiceCapability(true);
    onChange?.(cap);
  };
  window.speechSynthesis.addEventListener?.('voiceschanged', handler);
  return () => window.speechSynthesis.removeEventListener?.('voiceschanged', handler);
}

export interface SpeakOptions {
  /** 0.6 keeps the word audible for a 6-year-old (see KIDBOX_POLICY). */
  rate?: number;
  /** Called after the utterance ends, so the UI can move on. */
  onEnd?: () => void;
}

/**
 * Speaks British English text. Returns `false` when the platform cannot speak,
 * so the caller can fall back to captions instead of leaving a silent gap.
 */
export function speakBritish(text: string, options: SpeakOptions = {}): boolean {
  const capability = getBritishVoiceCapability();
  if (!capability.supported) {
    options.onEnd?.();
    return false;
  }

  try {
    if (options.onEnd) {
      const original = window.speechSynthesis;
      if (!original) return false;
      // A lightweight approach: schedule the callback after the utterance has
      // had time to play. Never blocks, never throws.
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = BRITISH_LOCALE;
      utterance.rate = options.rate ?? 0.85;
      utterance.pitch = 1.1;
      const voice = sound.pickVoice(BRITISH_LOCALE);
      if (voice) utterance.voice = voice;
      utterance.onend = () => options.onEnd?.();
      utterance.onerror = () => options.onEnd?.();
      original.speak(utterance);
      return true;
    }

    sound.speak(text, BRITISH_LOCALE);
    return true;
  } catch {
    options.onEnd?.();
    return false;
  }
}

export function stopBritishSpeech(): void {
  sound.stopSpeaking();
}

/* ------------------------------------------------------------------ */
/* SPEECH RECOGNITION (optional, never a hard dependency)              */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function getSpeechRecognitionCapability(): SpeechRecognitionCapability {
  const ctor = getRecognitionCtor();
  if (!ctor) {
    return {
      supported: false,
      language: BRITISH_LOCALE,
      label: 'Máy không nhận giọng nói — bé tự đối chiếu',
      reason: 'Trình duyệt không có Web Speech Recognition. Bé vẫn nghe và lặp lại bình thường.',
    };
  }
  return {
    supported: true,
    language: BRITISH_LOCALE,
    label: 'Nhận giọng nói (đối chiếu, không chấm phát âm)',
    reason: 'Thiết bị hỗ trợ Web Speech Recognition; kết quả chỉ là so khớp chuỗi, không phải điểm phát âm.',
  };
}

export interface SpeechRecognitionMatch {
  /** Raw transcript as recognised by the platform. */
  transcript: string;
  /** Platform confidence, 0-1. Never shown as a pronunciation score. */
  confidence: number;
  /** Whether the transcript matched the target phrase/word. */
  matched: boolean;
  target: string;
}

/** Normalises text so "It's a book." can match "its a book". */
export function normaliseSpoken(text: string): string {
  return spokenWords(text).join(' ');
}

/**
 * Common Grade-1 contractions expanded before comparison. Without this, a child
 * who says "it's a book" would never match the target "It is a book" — and the
 * honest answer to §13/§14 is a *match*, not a fabricated pronunciation score.
 */
const CONTRACTIONS: [RegExp, string][] = [
  [/\bit's\b/gi, 'it is'],
  [/\bthat's\b/gi, 'that is'],
  [/\bwhat's\b/gi, 'what is'],
  [/\bwho's\b/gi, 'who is'],
  [/\blet's\b/gi, 'let us'],
  [/\bhe's\b/gi, 'he is'],
  [/\bshe's\b/gi, 'she is'],
  [/\bthere's\b/gi, 'there is'],
  [/\bi'm\b/gi, 'i am'],
  [/\bdon't\b/gi, 'do not'],
  [/\bdoesn't\b/gi, 'does not'],
  [/\bcan't\b/gi, 'can not'],
  [/\bisn't\b/gi, 'is not'],
  [/\baren't\b/gi, 'are not'],
  [/\bwon't\b/gi, 'will not'],
];

/**
 * Single normalisation used by every speech comparison in the app, so the
 * player, the evaluator and the tests can never disagree about what "the same
 * words" means.
 */
export function spokenWords(text: string): string[] {
  let value = text.toLowerCase();
  for (const [pattern, replacement] of CONTRACTIONS) value = value.replace(pattern, replacement);
  return value
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Every target word must appear in the transcript (order-insensitive). */
export function matchesSpoken(transcript: string, target: string): boolean {
  const said = spokenWords(transcript);
  const wanted = spokenWords(target);
  if (wanted.length === 0) return false;
  const remaining = [...said];
  for (const word of wanted) {
    const idx = remaining.indexOf(word);
    if (idx < 0) return false;
    remaining.splice(idx, 1);
  }
  return true;
}

/**
 * Listens once and resolves with a match, or `null` when recognition is
 * unavailable or fails. Never throws, never blocks the UI.
 */
export function listenBritishOnce(target: string, timeoutMs = 6000): Promise<SpeechRecognitionMatch | null> {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return Promise.resolve(null);

  return new Promise<SpeechRecognitionMatch | null>((resolve) => {
    let settled = false;
    let recognition: SpeechRecognitionLike;

    const finish = (value: SpeechRecognitionMatch | null) => {
      if (settled) return;
      settled = true;
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
      resolve(value);
    };

    try {
      recognition = new Ctor();
      recognition.lang = BRITISH_LOCALE;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event: unknown) => {
        const results = (event as { results?: ArrayLike<{ 0?: { transcript?: string; confidence?: number } }> }).results;
        const first = results?.[0]?.[0];
        const transcript = first?.transcript ?? '';
        const confidence = typeof first?.confidence === 'number' ? first.confidence : 0;
        finish({ transcript, confidence, matched: matchesSpoken(transcript, target), target });
      };
      recognition.onerror = () => finish(null);
      recognition.onend = () => finish(null);

      recognition.start();
      if (typeof window !== 'undefined') {
        window.setTimeout(() => finish(null), timeoutMs);
      }
    } catch {
      resolve(null);
    }
  });
}

/* ------------------------------------------------------------------ */
/* §14 HONEST LABELS                                                    */
/* ------------------------------------------------------------------ */

export type SpeakingCheckMethod = 'SPEECH_RECOGNITION_MATCH' | 'SELF_CHECK' | 'PARENT_ASSISTED';

const METHOD_LABELS: Record<SpeakingCheckMethod, string> = {
  SPEECH_RECOGNITION_MATCH: SPEECH_REPORTING_POLICY.RECOGNITION_LABEL,
  SELF_CHECK: SPEECH_REPORTING_POLICY.SELF_CHECK_LABEL,
  PARENT_ASSISTED: SPEECH_REPORTING_POLICY.PARENT_CHECK_LABEL,
};

export function describeSpeakingMethod(method: SpeakingCheckMethod): string {
  return METHOD_LABELS[method];
}

/**
 * Guard used by the UI and by tests: refuses any claim of pronunciation quality,
 * because this app has no engine able to measure it honestly (§14).
 */
export function containsBannedPronunciationClaim(text: string): boolean {
  const lower = text.toLowerCase();
  return SPEECH_REPORTING_POLICY.BANNED_CLAIMS.some((claim) => lower.includes(claim.toLowerCase()));
}
