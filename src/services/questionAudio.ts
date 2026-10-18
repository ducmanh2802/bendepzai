/**
 * questionAudio — SINGLE SOURCE OF TRUTH for "🔊 Đọc câu hỏi" routing.
 *
 * Semantic contract (never mix these three):
 *   QUESTION AUDIO    → canonical question text (audioPrompt || prompt)
 *   ANSWER AUDIO      → answer/option text (handled by callers, never here)
 *   EXPLANATION AUDIO → explanation text (handled by callers, never here)
 *
 * Fail-safe rule: when no canonical question text exists this module returns
 * `null` (AUDIO_UNAVAILABLE). It NEVER falls back to:
 *   answers[0] / options[0] / choices[0] / correctAnswer /
 *   selectedAnswer / explanation / hint / stimulus.
 *
 * Why `audioPrompt` wins over `prompt`:
 *   the curriculum team authors `audioPrompt` as the explicit TTS script
 *   (e.g. natural-Vietnamese math phrasing "Ba cộng hai bằng mấy?").
 *   For `audio-choice` listening items the script is intentionally the
 *   stimulus word ("Bờ", "Cat") — that is the question for that type, not a
 *   leaked answer. The debug assertion below distinguishes an explicitly
 *   authored script from a routing leak.
 */

export type QuestionAudioTarget = {
  type: 'QUESTION';
  text: string;
  questionId: string;
};

/** Minimal shape accepted — covers Lesson Question, Competition & Reading. */
export interface QuestionAudioSource {
  id: string;
  prompt?: string | null;
  audioPrompt?: string | null;
  subject?: string | null;
}

type AudioLang = 'vi-VN' | 'en-US' | 'en-GB';

function clean(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolve the exact visible question text that "Đọc câu hỏi" must speak.
 * Returns `null` when unavailable — the caller must NOT speak and must NOT
 * fall back to any answer/option/explanation.
 */
export function resolveQuestionAudioText(question: QuestionAudioSource | null | undefined): string | null {
  if (!question) return null;
  return clean(question.audioPrompt) ?? clean(question.prompt) ?? null;
}

/** Build a typed QUESTION target, or `null` when audio is unavailable. */
export function buildQuestionAudioTarget(
  question: QuestionAudioSource | null | undefined
): QuestionAudioTarget | null {
  if (!question) return null;
  const text = resolveQuestionAudioText(question);
  if (!text) return null;
  return { type: 'QUESTION', text, questionId: question.id };
}

/** TTS locale for a question: English questions use en-GB (P38), rest use vi-VN. */
export function getQuestionAudioLang(
  question: QuestionAudioSource | null | undefined
): AudioLang {
  return question?.subject === 'english' ? 'en-GB' : 'vi-VN';
}

/**
 * In-app debug trail (test instrumentation, production-safe).
 *
 * Every question-audio call-site records the exact `{ questionId, text }`
 * handed toward `SpeechSynthesisUtterance` here, capped at 50 entries.
 * Real-browser QA reads this (plus the button `data-last-spoken` attribute,
 * which survives even when the automation driver runs in an isolated JS
 * world) to prove routing without mocking application data.
 */
export function logQuestionAudioTarget(target: QuestionAudioTarget): void {
  try {
    const w = window as unknown as {
      __questionAudioLog?: QuestionAudioTarget[];
    };
    const log = (w.__questionAudioLog ??= []);
    log.push(target);
    if (log.length > 50) log.splice(0, log.length - 50);
  } catch {
    /* Logging must never break audio. */
  }
}

export interface AssertQuestionAudioTargetArgs {
  questionId: string;
  /** The text about to be handed to SpeechSynthesisUtterance. */
  text: string;
  /** Canonical question text (audioPrompt || prompt). */
  canonicalText: string;
  options?: readonly string[];
  correctAnswer?: string | string[] | null;
  selectedAnswer?: string | string[] | null;
  explanation?: string | null;
  hint?: string | null;
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Debug assertion for development/test mode.
 * FAILS (throws) when the about-to-speak text is NOT the canonical question
 * text, or when it coincides with a forbidden source (first option, selected
 * answer, correct answer, explanation, hint) while the canonical question
 * text is different — i.e. the classic "reads answers[0]" routing leak.
 *
 * Returns `true` when the target is valid. In production callers may catch
 * and refuse to speak; in tests the throw is the signal.
 */
export function assertQuestionAudioTarget(args: AssertQuestionAudioTargetArgs): boolean {
  const text = clean(args.text);
  const canonical = clean(args.canonicalText);
  if (!text || !canonical) {
    throw new Error(
      `[questionAudio] ASSERT FAIL (${args.questionId}): missing text or canonical question text — refusing to speak.`
    );
  }
  if (normalized(text) !== normalized(canonical)) {
    throw new Error(
      `[questionAudio] ASSERT FAIL (${args.questionId}): about-to-speak text is not the canonical question text. ` +
        `spoken=${JSON.stringify(text)} canonical=${JSON.stringify(canonical)}`
    );
  }
  const forbidden: string[] = [];
  if (args.options && args.options.length > 0) {
    for (const opt of args.options) {
      const c = clean(opt);
      if (c) forbidden.push(c);
    }
  }
  const pushValue = (v: string | string[] | null | undefined) => {
    if (Array.isArray(v)) {
      for (const item of v) {
        const c = clean(item);
        if (c) forbidden.push(c);
      }
    } else {
      const c = clean(v);
      if (c) forbidden.push(c);
    }
  };
  pushValue(args.correctAnswer);
  pushValue(args.selectedAnswer);
  pushValue(args.explanation);
  pushValue(args.hint);

  const spokenNorm = normalized(text);
  const canonicalNorm = normalized(canonical);
  for (const f of forbidden) {
    if (normalized(f) === spokenNorm && spokenNorm !== canonicalNorm) {
      throw new Error(
        `[questionAudio] ASSERT FAIL (${args.questionId}): question audio target matches a forbidden source ` +
          `(answer/option/explanation/hint). spoken=${JSON.stringify(text)}`
      );
    }
  }
  // When the authored canonical script itself equals an option word
  // (audio-choice listening items like "Bờ"/"Cat"), spoken === canonical,
  // so the loop above cannot fire — that is the documented exception, not a leak.
  return true;
}
