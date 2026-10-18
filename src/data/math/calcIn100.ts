import type { Lesson, Question, QuestionType } from '../../types';
import { createRng, mathLesson, mathQ, shuffled } from './factory';

/**
 * T11B — Cộng, trừ KHÔNG nhớ trong phạm vi 100 (spec T11 §4).
 *
 * Mọi đáp án được TÍNH BẰNG CODE: mỗi câu mang `calc: { a, op, b }` và test
 * `tests/t11b-math-content.test.ts` tính lại, nên đáp số không thể lệch.
 * Phương án nhiễu lấy từ lỗi trẻ hay gặp (lệch 1, đảo chữ số, nhầm cộng/trừ).
 * Không có phép cộng/trừ có nhớ trong phạm vi 10, không kết quả âm, không số
 * vượt quá 100.
 */
export const TOPIC = 'math-cong-tru-100';
export const SKILLS = [
  'math_add_tens_100',
  'math_sub_tens_100',
  'math_add_digit_100',
  'math_sub_digit_100',
  'math_add_2digit_100',
  'math_sub_2digit_100',
  'math_column_100',
];

interface CalcItem {
  a: number;
  op: '+' | '-';
  b: number;
}

/** Kết quả đúng, tính bằng code. */
function valueOf(item: CalcItem): number {
  return item.op === '+' ? item.a + item.b : item.a - item.b;
}

/** Phương án nhiễu từ lỗi phổ biến; luôn khác đáp án và không trùng nhau. */
function distractors(item: CalcItem, answer: number): string[] {
  const pool: number[] = [];
  const swap = Number(String(answer).split('').reverse().join(''));
  if (swap !== answer && swap >= 0 && swap <= 100) pool.push(swap);
  pool.push(answer - 1, answer + 1);
  const flipped = item.op === '+' ? item.a - item.b : item.a + item.b;
  if (flipped >= 0 && flipped <= 100) pool.push(flipped);
  pool.push(answer + 10, answer - 10, item.a, item.b);

  const picked: number[] = [];
  for (const candidate of pool) {
    if (candidate < 0 || candidate > 100) continue;
    if (candidate === answer) continue;
    if (picked.includes(candidate)) continue;
    picked.push(candidate);
    if (picked.length === 3) break;
  }
  return picked.map(String);
}

const HINT_ADD = 'Cộng hàng chục với hàng chục, hàng đơn vị với hàng đơn vị.';
const HINT_SUB = 'Trừ hàng chục với hàng chục, hàng đơn vị với hàng đơn vị.';
const HINT_TENS = 'Nhớ mỗi chục bằng mười đơn vị.';

function calcQuestion(
  topicId: string,
  id: string,
  skillId: string,
  type: QuestionType,
  difficulty: 1 | 2 | 3,
  item: CalcItem,
  wording: number
): Question {
  const answer = valueOf(item);
  const { a, op, b } = item;
  const hint = op === '+' ? HINT_ADD : HINT_SUB;
  const explanation = `${a} ${op} ${b} = ${answer}.`;

  if (type === 'fill-blank') {
    const templates = [
      `Tính nhanh: ${a} ${op} ${b} = …`,
      `Bé tính: ${a} ${op} ${b} = …`,
      `Kết quả của ${a} ${op} ${b} là số …`,
    ];
    return mathQ(topicId, {
      id,
      skillId,
      difficulty,
      type: 'fill-blank',
      prompt: templates[wording % templates.length],
      options: [String(answer), ...distractors(item, answer)],
      correctAnswer: String(answer),
      mediaEmoji: '🧮',
      hint,
      explanation,
      calc: { a, op, b },
    });
  }

  const templates = [
    `Tính: ${a} ${op} ${b} = ?`,
    `${a} ${op} ${b} bằng mấy?`,
    `Bé hãy tính: ${a} ${op} ${b} = ?`,
    `Kết quả của phép tính ${a} ${op} ${b} là?`,
    `Cho phép tính ${a} ${op} ${b}. Đáp số là?`,
  ];
  return mathQ(topicId, {
    id,
    skillId,
    difficulty,
    type: 'multiple-choice',
    prompt: templates[wording % templates.length],
    options: [String(answer), ...distractors(item, answer)],
    correctAnswer: String(answer),
    mediaEmoji: '🧮',
    hint,
    explanation,
    calc: { a, op, b },
  });
}

function trueFalseItem(
  topicId: string,
  id: string,
  skillId: string,
  item: CalcItem,
  stated: number
): Question {
  const real = valueOf(item);
  const isTrue = stated === real;
  return mathQ(topicId, {
    id,
    skillId,
    difficulty: 2,
    type: 'true-false',
    prompt: `${item.a} ${item.op} ${item.b} = ${stated}. ĐÚNG hay SAI?`,
    options: ['Đúng', 'Sai'],
    correctAnswer: isTrue ? 'Đúng' : 'Sai',
    mediaEmoji: '✅',
    hint: 'Tính trước rồi đối chiếu với con số trong câu.',
    explanation: isTrue
      ? `${item.a} ${item.op} ${item.b} = ${real} nên câu đúng.`
      : `${item.a} ${item.op} ${item.b} = ${real}, không phải ${stated}.`,
    calc: { a: item.a, op: item.op, b: item.b },
  });
}

/** Sinh 12 câu cho một bài cộng hoăc trừ, trộn nhiều dạng câu. */
function calcLesson(
  topicId: string,
  lessonId: string,
  title: string,
  description: string,
  mascotTip: string,
  addSkill: string,
  subSkill: string,
  addItems: CalcItem[],
  subItems: CalcItem[]
): Lesson {
  const questions: Question[] = [];

  addItems.forEach((item, index) => {
    questions.push(
      calcQuestion(topicId, `${lessonId}-a${index + 1}`, addSkill, 'multiple-choice', index < 3 ? 1 : 2, item, index)
    );
  });
  subItems.forEach((item, index) => {
    questions.push(
      calcQuestion(topicId, `${lessonId}-s${index + 1}`, subSkill, 'multiple-choice', index < 3 ? 1 : 2, item, index + 2)
    );
  });

  // Điền số — hai câu cộng, một câu trừ.
  questions.push(
    calcQuestion(topicId, `${lessonId}-fa`, addSkill, 'fill-blank', 2, addItems[1], 1),
    calcQuestion(topicId, `${lessonId}-fb`, addSkill, 'fill-blank', 2, addItems[3], 2),
    calcQuestion(topicId, `${lessonId}-fs`, subSkill, 'fill-blank', 2, subItems[1], 0)
  );

  // Đúng/Sai — một câu đúng, một câu sai (đáp án vẫn tính bằng code).
  questions.push(trueFalseItem(topicId, `${lessonId}-t1`, addSkill, addItems[0], valueOf(addItems[0])));
  questions.push(trueFalseItem(topicId, `${lessonId}-t2`, subSkill, subItems[0], valueOf(subItems[0]) + 10));

  // Nối phép tính với đáp số.
  const pairs = [
    ...addItems.slice(0, 2).map((item) => ({ left: `${item.a} + ${item.b}`, right: String(valueOf(item)) })),
    ...subItems.slice(0, 2).map((item) => ({ left: `${item.a} - ${item.b}`, right: String(valueOf(item)) })),
  ];
  questions.push(
    mathQ(topicId, {
      id: `${lessonId}-m1`,
      skillId: addSkill,
      difficulty: 3,
      type: 'matching',
      prompt: 'Nối mỗi phép tính với đáp số của nó:',
      options: pairs.map((p) => p.right),
      correctAnswer: pairs.map((p) => `${p.left}=${p.right}`).join('|'),
      matchingPairs: pairs,
      hint: HINT_TENS,
      explanation: pairs.map((p) => `${p.left}=${p.right}`).join(', ') + '.',
    })
  );

  // Gõ biểu thức.
  const exprItem = addItems[2];
  const exprValue = valueOf(exprItem);
  const exprOptions = [
    `${exprItem.a}+${exprItem.b}=${exprValue}`,
    `${exprItem.a}+${exprItem.b}=${exprValue + 1}`,
    `${exprItem.a}-${exprItem.b}=${Math.max(0, exprItem.a - exprItem.b)}`,
    `${exprItem.b}+${exprItem.a}=${exprValue - 1}`,
  ];
  questions.push(
    mathQ(topicId, {
      id: `${lessonId}-e1`,
      skillId: addSkill,
      difficulty: 3,
      type: 'math-expression',
      prompt: `Gõ biểu thức: ${exprItem.a} cộng ${exprItem.b} bằng ${exprValue}`,
      options: shuffled(Array.from(new Set(exprOptions)), createRng(exprValue + 13)),
      correctAnswer: `${exprItem.a}+${exprItem.b}=${exprValue}`,
      hint: 'Dấu cộng là dấu +, dấu bằng là dấu =.',
      explanation: `Biểu thức đúng: ${exprItem.a} + ${exprItem.b} = ${exprValue}.`,
      calc: { a: exprItem.a, op: '+', b: exprItem.b },
    })
  );

  return mathLesson(topicId, lessonId, title, description, mascotTip, questions, 45, 3);
}

const TENS_ADD: CalcItem[] = [
  { a: 30, op: '+', b: 40 },
  { a: 60, op: '+', b: 20 },
  { a: 50, op: '+', b: 30 },
  { a: 20, op: '+', b: 70 },
  { a: 40, op: '+', b: 50 },
  { a: 10, op: '+', b: 80 },
];
const TENS_SUB: CalcItem[] = [
  { a: 80, op: '-', b: 30 },
  { a: 90, op: '-', b: 50 },
  { a: 60, op: '-', b: 40 },
  { a: 70, op: '-', b: 20 },
  { a: 50, op: '-', b: 10 },
  { a: 100, op: '-', b: 40 },
];

const DIGIT_ADD: CalcItem[] = [
  { a: 23, op: '+', b: 6 },
  { a: 48, op: '+', b: 5 },
  { a: 36, op: '+', b: 7 },
  { a: 57, op: '+', b: 4 },
  { a: 65, op: '+', b: 8 },
  { a: 29, op: '+', b: 5 },
];
const DIGIT_SUB: CalcItem[] = [
  { a: 43, op: '-', b: 6 },
  { a: 58, op: '-', b: 7 },
  { a: 62, op: '-', b: 8 },
  { a: 95, op: '-', b: 5 },
  { a: 71, op: '-', b: 4 },
  { a: 86, op: '-', b: 3 },
];

const TWO_ADD: CalcItem[] = [
  { a: 35, op: '+', b: 42 },
  { a: 26, op: '+', b: 53 },
  { a: 18, op: '+', b: 71 },
  { a: 47, op: '+', b: 28 },
  { a: 59, op: '+', b: 31 },
  { a: 64, op: '+', b: 22 },
];
const TWO_SUB: CalcItem[] = [
  { a: 58, op: '-', b: 26 },
  { a: 73, op: '-', b: 45 },
  { a: 91, op: '-', b: 38 },
  { a: 80, op: '-', b: 52 },
  { a: 66, op: '-', b: 19 },
  { a: 54, op: '-', b: 27 },
];

export const LESSONS: Lesson[] = [
  calcLesson(
    TOPIC,
    'math-les-100-tens',
    'Tròn chục cộng trừ tròn chục',
    '30 + 40 = ?, 80 − 30 = ?',
    'Gấu Bút Chì dạy: chục cộng chục, đơn vị cộng đơn vị là ra đáp số!',
    'math_add_tens_100',
    'math_sub_tens_100',
    TENS_ADD,
    TENS_SUB
  ),
  calcLesson(
    TOPIC,
    'math-les-100-digit',
    'Số hai chữ số cộng trừ một chữ số',
    '45 + 7 = ?, 52 − 8 = ?',
    'Gấu Bút Chì nhắc: giữ nguyên hàng chục, chỉ tính hàng đơn vị!',
    'math_add_digit_100',
    'math_sub_digit_100',
    DIGIT_ADD,
    DIGIT_SUB
  ),
  calcLesson(
    TOPIC,
    'math-les-100-two',
    'Số hai chữ số cộng trừ hai chữ số',
    '35 + 42 = ?, 58 − 26 = ?',
    'Gấu Bút Chì bật mí: tính đơn vị trước, nhớ 1 rồi tính chục sau!',
    'math_add_2digit_100',
    'math_sub_2digit_100',
    TWO_ADD,
    TWO_SUB
  ),
  mathLesson(
    TOPIC,
    'math-les-100-column',
    'Đặt tính rồi tính',
    'Hàng đơn vị thẳng hàng, hàng chục thẳng hàng',
    'Gấu Bút Chì nhắc: luôn tính hàng đơn vị trước, hàng chục sau!',
    [
      mathQ(TOPIC, {
        id: 'math-q-col-1',
        skillId: 'math_column_100',
        difficulty: 2,
        type: 'fill-blank',
        prompt: 'Đặt tính 36 + 24. Cột đơn vị: 6 + 4 = …',
        options: ['10', '9', '8', '11'],
        correctAnswer: '10',
        hint: 'Sáu thêm bốn được mười.',
        explanation: '6 + 4 = 10, ghi 0 nhớ 1 ở hàng chục.',
        calc: { a: 6, op: '+', b: 4 },
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-2',
        skillId: 'math_column_100',
        difficulty: 2,
        type: 'multiple-choice',
        prompt: 'Đặt tính 36 + 24. Kết quả là:',
        options: ['60', '61', '59', '50'],
        correctAnswer: '60',
        hint: 'Cộng xong cột đơn vị nhớ 1, cộng tiếp cột chục.',
        explanation: '36 + 24 = 60.',
        calc: { a: 36, op: '+', b: 24 },
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-3',
        skillId: 'math_column_100',
        difficulty: 2,
        type: 'fill-blank',
        prompt: 'Đặt tính 52 + 9. Cột đơn vị: 2 + 9 = …',
        options: ['11', '12', '10', '13'],
        correctAnswer: '11',
        hint: 'Hai cộng chín được mười một.',
        explanation: '2 + 9 = 11, ghi 1 nhớ 1.',
        calc: { a: 2, op: '+', b: 9 },
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-4',
        skillId: 'math_column_100',
        difficulty: 2,
        type: 'multiple-choice',
        prompt: 'Đặt tính 52 + 9. Kết quả là:',
        options: ['61', '60', '62', '51'],
        correctAnswer: '61',
        hint: 'Nhớ 1 ở hàng chục khi cộng đơn vị được mười một.',
        explanation: '52 + 9 = 61.',
        calc: { a: 52, op: '+', b: 9 },
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-5',
        skillId: 'math_column_100',
        difficulty: 3,
        type: 'fill-blank',
        prompt: 'Đặt tính 70 − 25. Cột đơn vị: 10 − 5 = …',
        options: ['5', '6', '4', '7'],
        correctAnswer: '5',
        hint: 'Mượn một chục rồi trừ năm.',
        explanation: '10 − 5 = 5, cột chục còn 6.',
        calc: { a: 10, op: '-', b: 5 },
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-6',
        skillId: 'math_column_100',
        difficulty: 3,
        type: 'multiple-choice',
        prompt: 'Đặt tính 70 − 25. Kết quả là:',
        options: ['45', '55', '35', '46'],
        correctAnswer: '45',
        hint: 'Mượn một chục nên hàng chục chỉ còn 6 chục.',
        explanation: '70 − 25 = 45.',
        calc: { a: 70, op: '-', b: 25 },
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-7',
        skillId: 'math_column_100',
        difficulty: 3,
        type: 'multiple-choice',
        prompt: 'Đặt tính 46 + 17. Cột đơn vị được 13 thì cột chục tính thế nào?',
        options: ['4 + 1 + 1 = 6', '4 + 1 = 5', '6 + 7 = 13', '1 + 1 = 2'],
        correctAnswer: '4 + 1 + 1 = 6',
        hint: 'Số 1 nhớ ở hàng chục phải cộng vào.',
        explanation: '4 + 1 = 5, cộng thêm 1 nhớ được 6.',
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-8',
        skillId: 'math_column_100',
        difficulty: 3,
        type: 'fill-blank',
        prompt: 'Đặt tính 62 − 8. Cột đơn vị: 12 − 8 = …',
        options: ['4', '5', '3', '6'],
        correctAnswer: '4',
        hint: 'Mượn một chục rồi trừ tám.',
        explanation: '12 − 8 = 4, còn 5 chục ở hàng chục.',
        calc: { a: 12, op: '-', b: 8 },
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-9',
        skillId: 'math_column_100',
        difficulty: 3,
        type: 'multiple-choice',
        prompt: 'Đặt tính 62 − 8. Kết quả là:',
        options: ['54', '55', '56', '64'],
        correctAnswer: '54',
        hint: 'Mượn một chục nên hàng chục còn 5.',
        explanation: '62 − 8 = 54.',
        calc: { a: 62, op: '-', b: 8 },
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-10',
        skillId: 'math_column_100',
        difficulty: 3,
        type: 'multiple-choice',
        prompt: 'Phép tính nào cần nhớ 1 sang hàng chục?',
        options: ['27 + 15', '30 + 40', '18 + 20', '50 + 10'],
        correctAnswer: '27 + 15',
        hint: 'Cộng hàng đơn vị được từ mười trở lên thì nhớ 1.',
        explanation: '7 + 5 = 12 nên 27 + 15 cần nhớ 1.',
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-11',
        skillId: 'math_column_100',
        difficulty: 3,
        type: 'multiple-choice',
        prompt: 'Đặt tính 38 + 26. Kết quả là:',
        options: ['64', '63', '65', '54'],
        correctAnswer: '64',
        hint: '8 + 6 = 14, nhớ 1 ở hàng chục.',
        explanation: '38 + 26 = 64.',
        calc: { a: 38, op: '+', b: 26 },
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-12',
        skillId: 'math_column_100',
        difficulty: 3,
        type: 'matching',
        prompt: 'Nối phép tính với đáp số đã đặt tính:',
        options: ['60', '61', '45', '54'],
        correctAnswer: '36 + 24=60|52 + 9=61|70 − 25=45|62 − 8=54',
        matchingPairs: [
          { left: '36 + 24', right: '60' },
          { left: '52 + 9', right: '61' },
          { left: '70 − 25', right: '45' },
          { left: '62 − 8', right: '54' },
        ],
        hint: HINT_TENS,
        explanation: '36+24=60, 52+9=61, 70 − 25=45, 62 − 8=54.',
      }),
      mathQ(TOPIC, {
        id: 'math-q-col-13',
        skillId: 'math_column_100',
        difficulty: 3,
        type: 'true-false',
        prompt: 'Đặt tính 45 + 18 được 63. ĐÚNG hay SAI?',
        options: ['Đúng', 'Sai'],
        correctAnswer: 'Đúng',
        hint: 'Tính cột đơn vị trước rồi đến cột chục.',
        explanation: '5 + 8 = 13 nhớ 1, 4 + 1 + 1 = 6 nên 45 + 18 = 63.',
        calc: { a: 45, op: '+', b: 18 },
      }),
    ],
    45,
    4
  ),
];
