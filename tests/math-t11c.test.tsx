import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { MATH_TOPICS } from '../src/data/mathCurriculum';
import { containsBannedWord } from '../src/data/contentSafety';
import { TenFrame } from '../src/components/visuals/TenFrame';
import { NumberLine } from '../src/components/visuals/NumberLine';
import { PlaceValueBlocks } from '../src/components/visuals/PlaceValueBlocks';
import { Ruler } from '../src/components/visuals/Ruler';
import { ClockFace } from '../src/components/visuals/ClockFace';
import { QuestionVisual } from '../src/components/visuals/QuestionVisual';
import type { Lesson, Question } from '../src/types';

const ALL = MATH_TOPICS.flatMap((t) => t.lessons.flatMap((l) => l.questions));
const BY_ID = new Map(ALL.map((q) => [q.id, q]));

/** T11C — the lessons that must carry the new Grade-1 content. */
const IN_SCOPE_LESSONS = [
  'math-les-1',
  'math-les-2',
  'math-les-13',
  'math-les-4',
  'math-les-14',
  'math-les-5',
  'math-les-15',
  'math-les-8',
  'math-les-9',
  'math-les-16',
  'math-les-17',
  'math-les-18',
  'math-les-19',
  'math-les-20',
  'math-les-10',
  'math-les-21',
];

const lessonById = (id: string): Lesson =>
  MATH_TOPICS.flatMap((t) => t.lessons).find((l) => l.id === id)!;

describe('T11C — Toán 0–100 content bank', () => {
  it('gives every in-scope lesson at least 10 questions and 3 question types', () => {
    const problems: string[] = [];
    for (const id of IN_SCOPE_LESSONS) {
      const lesson = lessonById(id);
      if (lesson.questions.length < 10) {
        problems.push(`${id}: chỉ có ${lesson.questions.length} câu`);
      }
      const types = new Set(lesson.questions.map((q) => q.type));
      if (types.size < 3) {
        problems.push(`${id}: chỉ có ${types.size} loại câu (${[...types].join(',')})`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('keeps ids unique across the whole math bank', () => {
    const ids = ALL.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses the math- prefix for every question id', () => {
    const bad = ALL.filter((q) => !q.id.startsWith('math-')).map((q) => q.id);
    expect(bad).toEqual([]);
  });

  it('adds no new question without hint and explanation (validator gate)', () => {
    const bad = ALL.filter((q) => !q.hint?.trim() || !q.explanation?.trim()).map((q) => q.id);
    expect(bad).toEqual([]);
  });
});

describe('T11C — machine-checked arithmetic (calc)', () => {
  it('recomputes every calc question: answer agrees, 0–100, no-carry', () => {
    const problems: string[] = [];
    const withCalc = ALL.filter((q) => q.calc);
    expect(withCalc.length).toBeGreaterThanOrEqual(60);

    for (const q of withCalc) {
      const { a, op, b } = q.calc!;
      const result = op === '+' ? a + b : a - b;
      const tag = `${q.id} (${a}${op}${b})`;

      if (result < 0 || result > 100) problems.push(`${tag}: kết quả ${result} ngoài 0–100`);
      // "làm 10" facts (7+3=10, 10-4=6) are core Grade-1 content and are NOT
      // carrying/borrowing in the multi-digit sense, so they are allowed.
      const makeTenAdd = op === '+' && a < 10 && b < 10 && a + b === 10;
      const subFromTen = op === '-' && a === 10 && b < 10;
      if (op === '+' && !makeTenAdd && (a % 10) + (b % 10) > 9) {
        problems.push(`${tag}: phép cộng có nhớ`);
      }
      if (op === '-' && !subFromTen && a % 10 < b % 10) {
        problems.push(`${tag}: phép trừ phải mượn`);
      }

      // True/false items assert a statement; the answer is "Đúng"/"Sai", so the
      // numeric-agreement rule does not apply (range/no-carry still checked).
      if (q.type === 'true-false') continue;

      const ans = String(q.correctAnswer).trim();
      // (1) direct result answer, e.g. "28"
      const direct = ans === String(result);
      // (2) word problem answer, e.g. "28 quả táo" — first number equals the result
      const firstNum = ans.match(/\d+/)?.[0];
      const wordProblem = firstNum !== undefined && Number(firstNum) === result;
      // (3) missing-operand answer, e.g. "Điền số: 7 + ... = 9" → answer is b
      const missingOperand = ans === String(b);
      // (4) missing minuend, e.g. "... - 3 = 7" → answer is a
      const missingMinuend = ans === String(a);
      // (5) answer is itself an arithmetic expression, e.g. "6 + 3" or "2+5=7"
      const expr = ans.match(/^(\d+)\s*([+\-\u2212])\s*(\d+)(?:\s*=\s*(\d+))?$/);
      const lhs = expr
        ? expr[2] === '+'
          ? Number(expr[1]) + Number(expr[3])
          : Number(expr[1]) - Number(expr[3])
        : null;
      const expressionAgrees =
        lhs !== null && lhs === result && (expr![4] === undefined || Number(expr![4]) === result);

      if (!(direct || wordProblem || missingOperand || missingMinuend || expressionAgrees)) {
        problems.push(`${tag}: đáp án "${ans}" không khớp kết quả ${result}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('keeps every direct "A + B = ?" / "A - B = ?" prompt answer correct', () => {
    const problems: string[] = [];
    for (const q of ALL) {
      const add = q.prompt.match(/(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
      const sub = q.prompt.match(/(\d+)\s*[-\u2212]\s*(\d+)\s*=\s*\?/);
      if (add) {
        const expected = String(Number(add[1]) + Number(add[2]));
        if (q.correctAnswer !== expected) problems.push(`${q.id}: ${q.correctAnswer} ≠ ${expected}`);
      }
      if (sub) {
        const expected = String(Number(sub[1]) - Number(sub[2]));
        if (q.correctAnswer !== expected) problems.push(`${q.id}: ${q.correctAnswer} ≠ ${expected}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('keeps every no-carry fact within 0–100', () => {
    const problems: string[] = [];
    for (const q of ALL.filter((x) => x.calc)) {
      const { a, op, b } = q.calc!;
      if (a < 0 || a > 100 || b < 0 || b > 100) problems.push(`${q.id}: số ngoài 0–100`);
    }
    expect(problems).toEqual([]);
  });
});

describe('T11C — visuals', () => {
  it('renders every visual kind to an SVG string', () => {
    const cases: Array<[string, React.ReactElement]> = [
      ['TenFrame', <TenFrame key="tf" count={7} />],
      ['NumberLine', <NumberLine key="nl" start={30} end={40} current={35} />],
      ['PlaceValueBlocks', <PlaceValueBlocks key="pv" chuc={3} donVi={8} />],
      ['Ruler', <Ruler key="ru" length={100} ticks={10} />],
      ['ClockFace', <ClockFace key="cf" gio={3} phut={0} amPm="sáng" />],
    ];
    for (const [kind, el] of cases) {
      const html = renderToString(el);
      expect({ kind, ok: html.includes('<svg') }).toEqual({ kind, ok: true });
    }
  });

  it('renders each visual kind through the QuestionVisual dispatcher', () => {
    const kinds = ['TenFrame', 'NumberLine', 'PlaceValueBlocks', 'Ruler', 'ClockFace'] as const;
    const props: Record<(typeof kinds)[number], Record<string, unknown>> = {
      TenFrame: { count: 5 },
      NumberLine: { start: 40, end: 60, current: 45 },
      PlaceValueBlocks: { chuc: 2, donVi: 5 },
      Ruler: { length: 100 },
      ClockFace: { gio: 6, phut: 0, amPm: 'chiều' },
    };
    for (const kind of kinds) {
      const html = renderToString(
        <QuestionVisual key={kind} visual={{ kind, props: props[kind] }} />
      );
      expect({ kind, ok: html.includes('<svg') }).toEqual({ kind, ok: true });
    }
  });

  it('uses only camelCase SVG props (no stroke-width / font-size kebab-case)', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const files = ['TenFrame', 'NumberLine', 'PlaceValueBlocks', 'Ruler', 'ClockFace'];
    const offenders: string[] = [];
    for (const name of files) {
      const src = readFileSync(resolve('src/components/visuals', `${name}.tsx`), 'utf8');
      for (const kebab of ['stroke-width', 'font-size', 'text-anchor', 'stroke-linecap', 'stroke-dasharray']) {
        if (src.includes(kebab)) offenders.push(`${name}: ${kebab}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('attaches a visual to at least one question in the number / place-value / number-line lessons', () => {
    const mustHaveVisual = ['math-les-13', 'math-les-16', 'math-les-17', 'math-les-20'];
    const problems: string[] = [];
    for (const id of mustHaveVisual) {
      const lesson = lessonById(id);
      if (!lesson.questions.some((q) => q.visual)) problems.push(`${id}: không có câu dùng visual`);
    }
    expect(problems).toEqual([]);
  });

  it('only uses known visual kinds', () => {
    const known = new Set(['TenFrame', 'NumberLine', 'PlaceValueBlocks', 'Ruler', 'ClockFace']);
    const bad = ALL.filter((q) => q.visual && !known.has(q.visual.kind)).map((q) => q.id);
    expect(bad).toEqual([]);
  });
});

describe('T11C — content safety', () => {
  it('keeps banned words out of every math question', () => {
    const bad: string[] = [];
    for (const q of ALL) {
      const fields = [q.prompt, q.hint ?? '', q.explanation ?? '', ...(q.options ?? [])];
      if (fields.some((f) => containsBannedWord(f))) bad.push(q.id);
    }
    expect(bad).toEqual([]);
  });

  it('normalises every new math string to NFC', () => {
    const bad: string[] = [];
    for (const q of ALL) {
      const fields = [q.prompt, q.hint ?? '', q.explanation ?? '', ...(q.options ?? [])];
      for (const f of fields) {
        if (f !== f.normalize('NFC')) bad.push(q.id);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('T11C — repaired borrowing facts', () => {
  it('keeps the corrected no-carry word problems', () => {
    // q10-3: 14 + 5 = 19 (was 14 + 9 = 23, a carry)
    expect(BY_ID.get('math-q10-3')?.correctAnswer).toBe('19 bạn');
    expect(BY_ID.get('math-q10-3')?.calc).toEqual({ a: 14, op: '+', b: 5 });
    // q10-4: 50 - 20 = 30 (was 50 - 18 = 32, a borrow)
    expect(BY_ID.get('math-q10-4')?.correctAnswer).toBe('30 nghìn');
    expect(BY_ID.get('math-q10-4')?.calc).toEqual({ a: 50, op: '-', b: 20 });
  });
});
