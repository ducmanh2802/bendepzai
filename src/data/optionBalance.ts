import { Question, Topic } from '../types';

/**
 * P41 §5 — ANSWER-POSITION BALANCING (curriculum bank).
 *
 * The curriculum lesson bank inherited a severe predictable bias: 80 of 84
 * choice items placed the correct answer at options[0], which teaches the child
 * to always tap the first option instead of reasoning. The competition bank
 * already solved this with deterministic rotation; this module applies the same
 * discipline to the Vietnamese/Math/English lesson bank.
 *
 * Design rules:
 *  - Pure + deterministic: the same question id always yields the same option
 *    order, so tests stay reproducible (no runtime randomness).
 *  - Relative option order is preserved — only the start point rotates — so
 *    answer validation (which compares VALUES, not indices) is untouched.
 *  - Rotation target is assigned round-robin per option-length, guaranteeing a
 *    balanced distribution instead of a lucky hash spread.
 */

const CHOICE_TYPES = new Set(['multiple-choice', 'image-choice', 'audio-choice', 'fill-blank']);

/** True when a question's options can be safely rotated. */
export function isBalanceable(q: Question): boolean {
  return (
    !!q.options &&
    q.options.length >= 2 &&
    !Array.isArray(q.correctAnswer) &&
    CHOICE_TYPES.has(q.type) &&
    q.options.indexOf(q.correctAnswer as string) >= 0
  );
}

/**
 * Rotates a question's options so the correct answer lands at `targetIndex`
 * (modulo option count). Returns a new object; never mutates the input.
 */
export function balanceOptionOrder(q: Question, targetIndex: number): Question {
  if (!isBalanceable(q)) return q;
  const options = q.options!;
  const n = options.length;
  const current = options.indexOf(q.correctAnswer as string);
  const target = ((targetIndex % n) + n) % n;
  if (target === current) return q;
  const offset = (current - target + n) % n;
  const rotated = options.map((_, i) => options[(i + offset) % n]);
  return { ...q, options: rotated };
}

/** Applies balanced rotations across every question of one subject's topics. */
export function balanceTopics(topics: Topic[]): Topic[] {
  const counters = new Map<number, number>();
  return topics.map((topic) => ({
    ...topic,
    lessons: topic.lessons.map((lesson) => ({
      ...lesson,
      questions: lesson.questions.map((q) => {
        if (!isBalanceable(q)) return q;
        const n = q.options!.length;
        const next = counters.get(n) ?? 0;
        counters.set(n, next + 1);
        return balanceOptionOrder(q, next);
      }),
    })),
  }));
}
