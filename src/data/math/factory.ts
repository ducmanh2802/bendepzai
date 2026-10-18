import type { Lesson, Question, QuestionType, VisualKind } from '../../types';

/**
 * T11B — compact builders for the Toán lesson bank.
 *
 * The bank grows past 350 questions in T11A/T11B, so almost every new item is
 * authored through these helpers: they only fill in the shared defaults
 * (subject), while every pedagogical field stays explicit in the unit files.
 * Arithmetic drills are additionally emitted by generators inside those unit
 * files (spec T11 §"Câu số học dùng hàm sinh có kiểm chứng") — the answer is
 * always computed by code, never typed by hand.
 *
 * T11C — same builder with machine-checkable `calc` + `visual` support;
 * `MathQuestionInit` is kept as an alias so both lanes compile.
 */
export interface QuestionInit {
  id: string;
  type: QuestionType;
  difficulty: 1 | 2 | 3;
  skillId: string;
  prompt: string;
  correctAnswer: string | string[];
  options?: string[];
  audioPrompt?: string;
  mediaEmoji?: string;
  hint?: string;
  explanation?: string;
  matchingPairs?: { left: string; right: string }[];
  orderingItems?: string[];
  categoryBuckets?: string[];
  calc?: { a: number; op: '+' | '-'; b: number };
  visual?: { kind: VisualKind; props?: Record<string, unknown> };
}

/** T11C alias — identical shape, kept so both lanes keep working. */
export type MathQuestionInit = QuestionInit;

export function mathQ(topicId: string, init: QuestionInit | MathQuestionInit): Question {
  const question: Question = {
    id: init.id,
    subject: 'toan',
    topicId,
    skillId: init.skillId,
    difficulty: init.difficulty,
    type: init.type,
    prompt: init.prompt,
    // T11C default: read the prompt aloud when no explicit audio script.
    // Keeps T11B callers (no audioPrompt) working and T11C callers exact.
    audioPrompt: init.audioPrompt ?? init.prompt,
    correctAnswer: init.correctAnswer,
  };
  if (init.options) question.options = init.options;
  if (init.mediaEmoji) question.mediaEmoji = init.mediaEmoji;
  if (init.hint) question.hint = init.hint;
  if (init.explanation) question.explanation = init.explanation;
  if (init.matchingPairs) question.matchingPairs = init.matchingPairs;
  if (init.orderingItems) question.orderingItems = init.orderingItems;
  if (init.categoryBuckets) question.categoryBuckets = init.categoryBuckets;
  if (init.calc) question.calc = init.calc;
  if (init.visual) question.visual = init.visual;
  return question;
}

export function mathLesson(
  topicId: string,
  id: string,
  title: string,
  description: string,
  mascotTip: string,
  questions: Question[],
  xpReward = 40,
  starReward = 3
): Lesson {
  return {
    id,
    topicId,
    subject: 'toan',
    title,
    description,
    mascotTip,
    questions,
    xpReward,
    starReward,
  };
}

// T11C — no-carry helpers (Grade 1, GDPT 2018).
export function checkNoCarryAdd(a: number, b: number): boolean {
  const onesA = a % 10;
  const onesB = b % 10;
  return onesA + onesB <= 9;
}

export function checkNoCarrySub(a: number, b: number): boolean {
  const onesA = a % 10;
  const onesB = b % 10;
  return onesA >= onesB;
}

export function makeCalc(a: number, op: '+' | '-', b: number) {
  return { a, op, b };
}

/**
 * T11B — deterministic pseudo-random generator (mulberry32) so every generated
 * drill is byte-identical on each run — the option balancer and the duplicate
 * scan both depend on a stable bank.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** T11B — shuffles a copy of `items` with the given rng (never mutates input). */
export function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
