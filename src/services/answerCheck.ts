import type { Question, QuestionType } from '../types';

/**
 * Unified answer checking for lesson questions.
 * Normalises Unicode to NFC, trims whitespace, compares arrays for matching/ordering.
 */
export function checkAnswer(
  question: Question,
  userAnswer: string | string[] | null
): boolean {
  if (userAnswer === null || userAnswer === undefined) return false;

  const type = question.type;
  const correct = question.correctAnswer;

  switch (type) {
    case 'ordering': {
      // Curriculum data stores the expected order as a pipe-string
      // ("a|b|c") while the player submits the child's list as an array.
      // Both sides may therefore be an array OR a pipe-string.
      if (typeof userAnswer === 'string') {
        return arraysEqual(parseOrderingAnswer(userAnswer), parseOrderingAnswer(toPipeText(correct)));
      }
      if (!Array.isArray(userAnswer)) return false;
      return arraysEqual(userAnswer.map(normalizeForCompare), parseOrderingAnswer(toPipeText(correct)));
    }

    case 'matching': {
      if (typeof userAnswer !== 'string' || typeof correct !== 'string') return false;
      // Parse and normalize each pair separately for order-independent comparison
      const userPairs = parseMatchingAnswer(userAnswer);
      const correctPairs = parseMatchingAnswer(correct);
      // Sort pairs by left side for consistent comparison
      userPairs.sort((a, b) => a.left.localeCompare(b.left));
      correctPairs.sort((a, b) => a.left.localeCompare(b.left));
      return arraysEqual(userPairs.map(p => `${p.left}=${p.right}`), correctPairs.map(p => `${p.left}=${p.right}`));
    }

    case 'drag-drop':
    case 'classify': {
      if (typeof userAnswer !== 'string' || typeof correct !== 'string') return false;
      return normalizeForCompare(userAnswer) === normalizeForCompare(correct);
    }

    case 'fill-blank': {
      if (typeof userAnswer !== 'string' || typeof correct !== 'string') return false;
      return normalizeForCompare(userAnswer) === normalizeForCompare(correct);
    }

    case 'true-false': {
      if (typeof userAnswer !== 'string' || typeof correct !== 'string') return false;
      return normalizeForCompare(userAnswer) === normalizeForCompare(correct);
    }

    case 'math-expression': {
      if (typeof userAnswer !== 'string' || typeof correct !== 'string') return false;
      return normalizeMathExpression(userAnswer) === normalizeMathExpression(correct);
    }

    case 'multiple-choice':
    case 'image-choice':
    case 'audio-choice': {
      if (typeof userAnswer !== 'string' || typeof correct !== 'string') return false;
      return normalizeForCompare(userAnswer) === normalizeForCompare(correct);
    }

    default:
      return false;
  }
}

/**
 * Normalise a string for comparison: NFC, trim, collapse whitespace.
 */
export function normalizeForCompare(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ');
}

/**
 * Normalise math expression: remove all whitespace, NFC.
 * Note: We don't evaluate mathematically, just compare canonical string forms.
 * The question author must provide the canonical form in correctAnswer.
 *
 * Curriculum data uses the typographic minus U+2212 ("9 − 4 = 5") while the
 * on-screen keypad types ASCII '-' ("9-4=5"); both must grade identically.
 */
export function normalizeMathExpression(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\u2212/g, '-')
    .replace(/\s+/g, '');
}

/**
 * Compare two arrays for equality (same length, same elements in same order).
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Parse a matching answer string (format: "left=right|left=right") into pairs.
 */
export function parseMatchingAnswer(answer: string): { left: string; right: string }[] {
  if (!answer) return [];
  return answer.split('|').map((pair) => {
    const [left, right] = pair.split('=');
    return { left: normalizeForCompare(left), right: normalizeForCompare(right) };
  });
}

/**
 * Parse an ordering answer string (format: "item|item|item") into array.
 */
export function parseOrderingAnswer(answer: string): string[] {
  if (!answer) return [];
  return answer.split('|').map(normalizeForCompare).filter(Boolean);
}

/**
 * Normalise a stored ordering answer (array or pipe-string) into a pipe-string
 * so both forms can be compared through `parseOrderingAnswer`.
 */
function toPipeText(value: string | string[]): string {
  return Array.isArray(value) ? value.join('|') : value;
}

/**
 * Build a matching answer string from pairs.
 */
export function buildMatchingAnswer(pairs: { left: string; right: string }[]): string {
  return pairs
    .map((p) => `${normalizeForCompare(p.left)}=${normalizeForCompare(p.right)}`)
    .join('|');
}

/**
 * Build an ordering answer string from items.
 */
export function buildOrderingAnswer(items: string[]): string {
  return items.map(normalizeForCompare).join('|');
}

/**
 * T14B — lesson-player matching state machine (pure, tested).
 *
 * The player keeps one entry per question+left label: `"<qid>::<left>"`.
 * A pending tap is stored as `"L:<label>"` / `"R:<label>"`; a finished pair
 * as `"<left>=<right>"` — the exact canonical form `checkAnswer` expects.
 *
 * Gesture (matches the on-screen hint "chạm ô bên trái, rồi chạm ô bên phải",
 * right-first order also works): tapping a label selects it (clearing any
 * other pending tap); tapping the opposite side completes the pair; tapping
 * the same pending label again cancels it. Completed pairs are never
 * disturbed. Returns a NEW state object; never mutates the input.
 */
export function applyMatchingTap(
  prev: Record<string, string>,
  questionId: string,
  side: 'left' | 'right',
  value: string
): Record<string, string> {
  const state = { ...prev };
  const prefix = `${questionId}::`;
  const key = `${prefix}${value}`;
  const pending = (v: string | undefined): boolean =>
    typeof v === 'string' && (v.startsWith('L:') || v.startsWith('R:'));
  if (state[key] === `${side === 'left' ? 'L' : 'R'}:${value}`) {
    delete state[key];
    return state;
  }
  const otherPending = Object.keys(state).find((k) => k.startsWith(prefix) && pending(state[k]));
  if (otherPending !== undefined) {
    const [otherSide, otherValue] = [state[otherPending][0], state[otherPending].slice(2)];
    if (otherSide !== (side === 'left' ? 'L' : 'R')) {
      // Opposite side pending: complete the pair under the LEFT label.
      const left = side === 'left' ? value : otherValue;
      const right = side === 'left' ? otherValue : value;
      delete state[otherPending];
      delete state[key];
      state[`${prefix}${left}`] = `${left}=${right}`;
      return state;
    }
  }
  // Fresh pending tap: clear other pendings, keep completed pairs.
  for (const k of Object.keys(state)) {
    if (k.startsWith(prefix) && pending(state[k])) delete state[k];
  }
  state[key] = `${side === 'left' ? 'L' : 'R'}:${value}`;
  return state;
}

/** True when every declared pair has a finished "<left>=<right>" entry. */
export function isMatchingComplete(
  pairs: { left: string; right: string }[],
  state: Record<string, string>,
  questionId: string
): boolean {
  return (
    pairs.length > 0 &&
    pairs.every((p) => {
      const stored = state[`${questionId}::${p.left}`];
      return typeof stored === 'string' && stored.includes('=');
    })
  );
}

/**
 * Canonical user answer for a matching question: finished pairs joined by
 * "|". Entries already hold the "<left>=<right>" form (no extra prefix).
 */
export function buildMatchingCanonical(
  pairs: { left: string; right: string }[],
  state: Record<string, string>,
  questionId: string
): string {
  const partial = Object.entries(state)
    .filter(([k, v]) => k.startsWith(`${questionId}::`) && v.includes('='))
    .map(([, v]) => v)
    .join('|');
  if (!isMatchingComplete(pairs, state, questionId)) return partial;
  return pairs.map((p) => state[`${questionId}::${p.left}`]).join('|');
}

/**
 * Get the expected answer format description for a question type.
 */
export function getAnswerFormatDescription(type: QuestionType): string {
  switch (type) {
    case 'ordering':
      return 'Các phần tử cách nhau bằng "|" theo thứ tự đúng (VD: "Bé|Lan|học|bài")';
    case 'matching':
      return 'Các cặp "trái=phải" cách nhau bằng "|" (VD: "ga=bò|chó=chó")';
    case 'drag-drop':
    case 'classify':
      return 'Nhãn nhóm đúng (VD: "Động vật")';
    case 'fill-blank':
      return 'Từ/đáp án điền vào chỗ trống';
    case 'true-false':
      return '"Đúng" hoặc "Sai"';
    case 'math-expression':
      return 'Biểu thức toán học (VD: "5+3=8")';
    case 'multiple-choice':
    case 'image-choice':
    case 'audio-choice':
      return 'Một trong các phương án cho sẵn';
    default:
      return 'Đáp án';
  }
}