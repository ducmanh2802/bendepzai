import { describe, it, expect } from 'vitest';
import {
  checkAnswer,
  normalizeForCompare,
  normalizeMathExpression,
  arraysEqual,
  parseMatchingAnswer,
  parseOrderingAnswer,
  buildMatchingAnswer,
  buildOrderingAnswer,
  getAnswerFormatDescription,
} from '../src/services/answerCheck';
import type { Question } from '../src/types';

function makeQuestion(overrides: Partial<Question>): Question {
  return {
    id: 'q-test',
    subject: 'tieng-viet',
    topicId: 't1',
    skillId: 's1',
    difficulty: 1,
    type: 'multiple-choice',
    prompt: 'Test question',
    options: ['A', 'B', 'C'],
    correctAnswer: 'A',
    ...overrides,
  } as Question;
}

describe('answerCheck - normalizeForCompare', () => {
  it('trims whitespace', () => {
    expect(normalizeForCompare('  hello  ')).toBe('hello');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeForCompare('hello   world')).toBe('hello world');
  });

  it('normalizes to NFC', () => {
    const composed = 'café'; // NFC
    const decomposed = 'cafe\u0301'; // NFD
    expect(normalizeForCompare(decomposed)).toBe(normalizeForCompare(composed));
  });

  it('preserves Vietnamese diacritics', () => {
    expect(normalizeForCompare('má')).toBe('má');
    expect(normalizeForCompare('mà')).toBe('mà');
    expect(normalizeForCompare('má')).not.toBe('mà');
  });
});

describe('answerCheck - normalizeMathExpression', () => {
  it('removes all whitespace', () => {
    expect(normalizeMathExpression('5 + 3 = 8')).toBe('5+3=8');
  });

  it('normalizes to NFC', () => {
    expect(normalizeMathExpression('5+3=8')).toBe('5+3=8');
  });
});

describe('answerCheck - arraysEqual', () => {
  it('returns true for equal arrays', () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('returns false for different length', () => {
    expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('returns false for different elements', () => {
    expect(arraysEqual([1, 2, 3], [1, 3, 2])).toBe(false);
  });

  it('works with strings', () => {
    expect(arraysEqual(['a', 'b'], ['a', 'b'])).toBe(true);
  });
});

describe('answerCheck - parseMatchingAnswer', () => {
  it('parses matching answer string', () => {
    const result = parseMatchingAnswer('left1=right1|left2=right2');
    expect(result).toEqual([
      { left: 'left1', right: 'right1' },
      { left: 'left2', right: 'right2' },
    ]);
  });

  it('handles empty string', () => {
    expect(parseMatchingAnswer('')).toEqual([]);
  });

  it('normalizes each pair', () => {
    const result = parseMatchingAnswer('  left  =  right  ');
    expect(result).toEqual([{ left: 'left', right: 'right' }]);
  });
});

describe('answerCheck - parseOrderingAnswer', () => {
  it('parses ordering answer string', () => {
    const result = parseOrderingAnswer('first|second|third');
    expect(result).toEqual(['first', 'second', 'third']);
  });

  it('handles empty string', () => {
    expect(parseOrderingAnswer('')).toEqual([]);
  });

  it('filters empty parts', () => {
    const result = parseOrderingAnswer('first||second|');
    expect(result).toEqual(['first', 'second']);
  });

  it('normalizes each item', () => {
    const result = parseOrderingAnswer('  a  |  b  ');
    expect(result).toEqual(['a', 'b']);
  });
});

describe('answerCheck - buildMatchingAnswer', () => {
  it('builds matching answer from pairs', () => {
    const pairs = [
      { left: 'left1', right: 'right1' },
      { left: 'left2', right: 'right2' },
    ];
    expect(buildMatchingAnswer(pairs)).toBe('left1=right1|left2=right2');
  });

  it('normalizes pairs', () => {
    const pairs = [{ left: '  left  ', right: '  right  ' }];
    expect(buildMatchingAnswer(pairs)).toBe('left=right');
  });
});

describe('answerCheck - buildOrderingAnswer', () => {
  it('builds ordering answer from items', () => {
    expect(buildOrderingAnswer(['first', 'second', 'third'])).toBe('first|second|third');
  });

  it('normalizes items', () => {
    expect(buildOrderingAnswer(['  a  ', '  b  '])).toBe('a|b');
  });
});

describe('answerCheck - checkAnswer (multiple-choice)', () => {
  it('returns true for correct answer', () => {
    const q = makeQuestion({ type: 'multiple-choice', correctAnswer: 'A' });
    expect(checkAnswer(q, 'A')).toBe(true);
  });

  it('returns false for wrong answer', () => {
    const q = makeQuestion({ type: 'multiple-choice', correctAnswer: 'A' });
    expect(checkAnswer(q, 'B')).toBe(false);
  });

  it('returns false for null answer', () => {
    const q = makeQuestion({ type: 'multiple-choice', correctAnswer: 'A' });
    expect(checkAnswer(q, null)).toBe(false);
  });

  it('normalizes before comparing', () => {
    const q = makeQuestion({ type: 'multiple-choice', correctAnswer: '  A  ' });
    expect(checkAnswer(q, 'A')).toBe(true);
  });
});

describe('answerCheck - checkAnswer (image-choice)', () => {
  it('works same as multiple-choice', () => {
    const q = makeQuestion({ type: 'image-choice', correctAnswer: 'Apple 🍎' });
    expect(checkAnswer(q, 'Apple 🍎')).toBe(true);
    expect(checkAnswer(q, 'Ball ⚽')).toBe(false);
  });
});

describe('answerCheck - checkAnswer (audio-choice)', () => {
  it('works same as multiple-choice', () => {
    const q = makeQuestion({ type: 'audio-choice', correctAnswer: 'Cat 🐱' });
    expect(checkAnswer(q, 'Cat 🐱')).toBe(true);
  });
});

describe('answerCheck - checkAnswer (true-false)', () => {
  it('returns true for correct answer', () => {
    const q = makeQuestion({ type: 'true-false', correctAnswer: 'Đúng' });
    expect(checkAnswer(q, 'Đúng')).toBe(true);
  });

  it('returns false for wrong answer', () => {
    const q = makeQuestion({ type: 'true-false', correctAnswer: 'Đúng' });
    expect(checkAnswer(q, 'Sai')).toBe(false);
  });
});

describe('answerCheck - checkAnswer (fill-blank)', () => {
  it('returns true for correct answer', () => {
    const q = makeQuestion({ type: 'fill-blank', correctAnswer: 'c' });
    expect(checkAnswer(q, 'c')).toBe(true);
  });

  it('returns false for wrong answer', () => {
    const q = makeQuestion({ type: 'fill-blank', correctAnswer: 'c' });
    expect(checkAnswer(q, 'b')).toBe(false);
  });

  it('normalizes whitespace', () => {
    const q = makeQuestion({ type: 'fill-blank', correctAnswer: '  c  ' });
    expect(checkAnswer(q, 'c')).toBe(true);
  });
});

describe('answerCheck - checkAnswer (matching)', () => {
  it('returns true for correct canonical answer', () => {
    const q = makeQuestion({
      type: 'matching',
      correctAnswer: 'left1=right1|left2=right2',
    });
    expect(checkAnswer(q, 'left1=right1|left2=right2')).toBe(true);
  });

  it('returns true for different pair order (matching is order-independent)', () => {
    const q = makeQuestion({
      type: 'matching',
      correctAnswer: 'left1=right1|left2=right2',
    });
    // Matching questions: order of pairs doesn't matter
    expect(checkAnswer(q, 'left2=right2|left1=right1')).toBe(true);
  });

  it('normalizes whitespace', () => {
    const q = makeQuestion({
      type: 'matching',
      correctAnswer: ' left1 = right1 | left2 = right2 ',
    });
    expect(checkAnswer(q, 'left1=right1|left2=right2')).toBe(true);
  });
});

describe('answerCheck - checkAnswer (ordering)', () => {
  it('returns true for correct order', () => {
    const q = makeQuestion({
      type: 'ordering',
      correctAnswer: ['first', 'second', 'third'],
    });
    expect(checkAnswer(q, ['first', 'second', 'third'])).toBe(true);
  });

  it('returns false for wrong order', () => {
    const q = makeQuestion({
      type: 'ordering',
      correctAnswer: ['first', 'second', 'third'],
    });
    expect(checkAnswer(q, ['second', 'first', 'third'])).toBe(false);
  });

  it('returns false for different length', () => {
    const q = makeQuestion({
      type: 'ordering',
      correctAnswer: ['first', 'second', 'third'],
    });
    expect(checkAnswer(q, ['first', 'second'])).toBe(false);
  });

  it('normalizes items', () => {
    const q = makeQuestion({
      type: 'ordering',
      correctAnswer: ['  first  ', '  second  '],
    });
    expect(checkAnswer(q, ['first', 'second'])).toBe(true);
  });
});

describe('answerCheck - checkAnswer (ordering, pipe-string data)', () => {
  // P0-1 regression — curriculum data stores the expected order as a
  // pipe-string ("3|5|7|9") while the lesson player submits the child's list
  // as an array. Both sides must be accepted in either form.
  it('accepts a pipe-string correctAnswer against an array userAnswer', () => {
    const q = makeQuestion({
      type: 'ordering',
      correctAnswer: '3|5|7|9',
      orderingItems: ['3', '5', '7', '9'],
    });
    expect(checkAnswer(q, ['3', '5', '7', '9'])).toBe(true);
    expect(checkAnswer(q, ['9', '7', '5', '3'])).toBe(false);
  });

  it('accepts a pipe-string userAnswer against an array correctAnswer', () => {
    const q = makeQuestion({
      type: 'ordering',
      correctAnswer: ['a', 'b', 'c'],
    });
    expect(checkAnswer(q, 'a|b|c')).toBe(true);
    expect(checkAnswer(q, 'a|c|b')).toBe(false);
  });

  it('accepts pipe-strings on both sides and normalizes whitespace', () => {
    const q = makeQuestion({
      type: 'ordering',
      correctAnswer: ' x | y | z ',
    });
    expect(checkAnswer(q, ['x', 'y', 'z'])).toBe(true);
    expect(checkAnswer(q, 'z|y|x')).toBe(false);
  });

  it('rejects empty or missing user answers', () => {
    const q = makeQuestion({ type: 'ordering', correctAnswer: 'a|b' });
    expect(checkAnswer(q, '')).toBe(false);
    expect(checkAnswer(q, [])).toBe(false);
  });
});

describe('answerCheck - checkAnswer (drag-drop)', () => {
  it('returns true for correct bucket', () => {
    const q = makeQuestion({
      type: 'drag-drop',
      correctAnswer: 'Động vật',
    });
    expect(checkAnswer(q, 'Động vật')).toBe(true);
  });

  it('returns false for wrong bucket', () => {
    const q = makeQuestion({
      type: 'drag-drop',
      correctAnswer: 'Động vật',
    });
    expect(checkAnswer(q, 'Đồ vật')).toBe(false);
  });
});

describe('answerCheck - checkAnswer (classify)', () => {
  it('works same as drag-drop', () => {
    const q = makeQuestion({
      type: 'classify',
      correctAnswer: 'Số chẵn',
    });
    expect(checkAnswer(q, 'Số chẵn')).toBe(true);
    expect(checkAnswer(q, 'Số lẻ')).toBe(false);
  });
});

describe('answerCheck - checkAnswer (math-expression)', () => {
  it('returns true for exact match', () => {
    const q = makeQuestion({
      type: 'math-expression',
      correctAnswer: '5+3=8',
    });
    expect(checkAnswer(q, '5+3=8')).toBe(true);
  });

  it('returns false for different expression', () => {
    const q = makeQuestion({
      type: 'math-expression',
      correctAnswer: '5+3=8',
    });
    expect(checkAnswer(q, '3+5=8')).toBe(false);
  });

  it('ignores whitespace', () => {
    const q = makeQuestion({
      type: 'math-expression',
      correctAnswer: '5 + 3 = 8',
    });
    expect(checkAnswer(q, '5+3=8')).toBe(true);
    expect(checkAnswer(q, ' 5 + 3 = 8 ')).toBe(true);
  });
});

describe('answerCheck - getAnswerFormatDescription', () => {
  it('returns description for each type', () => {
    expect(getAnswerFormatDescription('ordering')).toContain('|');
    expect(getAnswerFormatDescription('matching')).toContain('=');
    expect(getAnswerFormatDescription('drag-drop')).toContain('nhóm');
    expect(getAnswerFormatDescription('fill-blank')).toContain('điền');
    expect(getAnswerFormatDescription('true-false')).toContain('Đúng');
    expect(getAnswerFormatDescription('math-expression')).toContain('Biểu thức');
    expect(getAnswerFormatDescription('multiple-choice')).toContain('phương án');
  });
});