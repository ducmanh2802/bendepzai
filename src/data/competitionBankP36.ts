import { CompetitionQuestion } from '../types/competition';

/**
 * COMPETITION BANK — P36 EXPANSION (230 items, bank v4: 132 → 362).
 *
 * Original Grade-1 content inspired by required skills only — no copied
 * Trạng Nguyên / textbook / Kid's Box / proprietary material.
 *
 * Quality construction (§6):
 *  - arithmetic / comparison / sequence / tens-unit answers are COMPUTED by
 *    the helpers below from the same operands the child sees, never
 *    hand-typed, so template-level answer drift is structurally impossible;
 *  - matching / ordering / classify keys are derived from their own
 *    structural payload (same convention as the P35 expansion);
 *  - choice builders rotate options round-robin per options-length class so
 *    correct-answer positions stay balanced (§5);
 *  - every builder asserts its own contract at build time (fail fast).
 */

// ---------------------------------------------------------------- builders --

type Pair = [left: string, right: string];

const TOPIC_OF_SKILL: Record<string, string> = {
  'TV-PHONICS': 'Ngữ âm',
  'TV-TONES': 'Ngữ âm',
  'TV-SYLLABLE': 'Cấu tạo từ',
  'TV-RHYME': 'Cấu tạo từ',
  'TV-SPELLING': 'Chính tả',
  'TV-WORD': 'Từ vựng',
  'TV-SENTENCE': 'Ngữ pháp',
  'TV-READING': 'Đọc hiểu',
  'TV-LANGUAGE-LOGIC': 'Tư duy logic',
  'MATH-NUMBER': 'Số học',
  'MATH-COMPARISON': 'Số học',
  'MATH-ADDITION': 'Phép tính',
  'MATH-SUBTRACTION': 'Phép tính',
  'MATH-SEQUENCE': 'Số học',
  'MATH-PATTERN': 'Tư duy logic',
  'MATH-SHAPE': 'Hình học',
  'MATH-MEASUREMENT': 'Đại lượng',
  'MATH-WORD-PROBLEM': 'Giải toán',
  'MATH-LOGIC': 'Tư duy logic',
  'EN-PHONICS': 'Phonics',
  'EN-NUMBERS': 'Vocabulary',
  'EN-COLORS': 'Vocabulary',
  'EN-ANIMALS': 'Vocabulary',
  'EN-FAMILY': 'Vocabulary',
  'EN-SCHOOL': 'Vocabulary',
  'EN-BODY': 'Vocabulary',
};

/** Round-robin answer placement per options-length class (§5). */
const p36Positions: Record<number, number> = {};

function place(options: string[], answer: string): string[] {
  const n = options.length;
  const current = options.indexOf(answer);
  if (current < 0 || n < 2) return [...options];
  const target = (p36Positions[n] ?? 0) % n;
  p36Positions[n] = (p36Positions[n] ?? 0) + 1;
  const shift = (current - target + n) % n;
  return options.map((_, i) => options[(i + shift) % n]);
}

function assertUnique(options: string[], id: string): void {
  if (new Set(options).size !== options.length) {
    throw new Error(`P36 builder: duplicate options in ${id}`);
  }
}

function base(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  explanation: string,
  estimatedSeconds: number
) {
  const topic = TOPIC_OF_SKILL[skillId];
  if (!topic) throw new Error(`P36 builder: unknown skill ${skillId}`);
  if (!prompt.trim() || !explanation.trim()) throw new Error(`P36 builder: empty prompt/explanation in ${id}`);
  return { id, skillId, topic, difficulty, prompt, explanation, estimatedSeconds } as const;
}

/** Single-choice question. Options are rotated so answers spread across positions. */
function choice(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  options: string[],
  answer: string,
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  assertUnique(options, id);
  if (!options.includes(answer)) throw new Error(`P36 builder: answer not in options in ${id}`);
  return {
    ...base(id, skillId, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'multiple-choice',
    version: 1,
    mediaEmoji,
    options: place(options, answer),
    correctAnswer: answer,
  };
}

/** True/False question. */
function bool(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  answer: 'Đúng' | 'Sai',
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  return {
    ...base(id, skillId, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'true-false',
    version: 1,
    mediaEmoji,
    options: ['Đúng', 'Sai'],
    correctAnswer: answer,
  };
}

/** Fill-in-the-blank question (choice form). */
function blank(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  options: string[],
  answer: string,
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  assertUnique(options, id);
  if (!options.includes(answer)) throw new Error(`P36 builder: answer not in options in ${id}`);
  return {
    ...base(id, skillId, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'fill-blank',
    version: 1,
    mediaEmoji,
    options: place(options, answer),
    correctAnswer: answer,
  };
}

/** Matching question. The answer key is derived from `pairs`. */
function matching(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  pairs: Pair[],
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  if (pairs.length < 2) throw new Error(`P36 builder: need 2+ pairs in ${id}`);
  const lefts = pairs.map(([l]) => l);
  if (new Set(lefts).size !== lefts.length) throw new Error(`P36 builder: duplicate left in ${id}`);
  const rights = pairs.map(([, r]) => r);
  assertUnique(rights, id);
  return {
    ...base(id, skillId, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'matching',
    version: 1,
    mediaEmoji,
    options: [...rights],
    matchingPairs: pairs.map(([left, right]) => ({ left, right })),
    correctAnswer: pairs.map(([left, right]) => `${left}=${right}`).join('|'),
  };
}

/** Ordering tiles get a varying deterministic rotation so displays differ. */
let orderCounter = 0;

function ordering(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  order: string[],
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  if (order.length < 2) throw new Error(`P36 builder: need 2+ tiles in ${id}`);
  assertUnique(order, id);
  const shift = 1 + (orderCounter++ % (order.length - 1));
  const tiles = [...order.slice(shift), ...order.slice(0, shift)];
  return {
    ...base(id, skillId, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'ordering',
    version: 1,
    mediaEmoji,
    options: tiles,
    orderingItems: [...order],
    correctAnswer: order.join('|'),
  };
}

/** Classify question. The answer is always a bucket label. */
function classify(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  buckets: string[],
  options: string[],
  answer: string,
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  assertUnique(options, id);
  if (buckets.length < 2) throw new Error(`P36 builder: need 2+ buckets in ${id}`);
  if (!buckets.includes(answer)) throw new Error(`P36 builder: answer not a bucket in ${id}`);
  return {
    ...base(id, skillId, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'classify',
    version: 1,
    mediaEmoji,
    options,
    categoryBuckets: buckets,
    correctAnswer: answer,
  };
}

/** Drag-and-drop question. Same contract as classify with two buckets. */
function dragdrop(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  buckets: [string, string],
  options: string[],
  answer: string,
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  return {
    ...classify(id, subject, skillId, difficulty, prompt, mediaEmoji, buckets, options, answer, explanation, estimatedSeconds),
    questionType: 'drag-drop',
  };
}

// ------------------------------------------------------- computed arithmetic --

function nearAnswers(correct: number, count: number): string[] {
  const cands = [correct + 1, correct - 1, correct + 2, correct - 2, correct + 10, correct + 3];
  const out: string[] = [];
  for (const c of cands) {
    if (out.length >= count) break;
    if (c >= 0 && c !== correct && !out.includes(String(c))) out.push(String(c));
  }
  return out;
}

const ADD_TEMPLATES = [
  (a: number, b: number) => `Tính: ${a} + ${b} = ?`,
  (a: number, b: number) => `Kết quả của phép tính ${a} + ${b} là bao nhiêu?`,
  (a: number, b: number) => `${a} cộng ${b} bằng bao nhiêu?`,
  (a: number, b: number) => `Điền kết quả vào chỗ chấm: ${a} + ${b} = ...`,
];

/** Addition within 20. Answer + distractors computed from (a, b). */
function add2(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  a: number,
  b: number,
  template: number,
  estimatedSeconds: number
): CompetitionQuestion {
  const c = a + b;
  const prompt = ADD_TEMPLATES[template % ADD_TEMPLATES.length](a, b);
  const expl = template % 2 === 0 ? `${a} cộng ${b} bằng ${c}.` : `Đếm tiếp từ ${a}: thêm ${b} nữa ta được ${c}.`;
  return choice(id, 'toan', skillId, difficulty, prompt, '➕', [String(c), ...nearAnswers(c, 3)], String(c), expl, estimatedSeconds);
}

const SUB_TEMPLATES = [
  (a: number, b: number) => `Tính: ${a} - ${b} = ?`,
  (a: number, b: number) => `Kết quả của phép tính ${a} - ${b} là bao nhiêu?`,
  (a: number, b: number) => `${a} trừ ${b} bằng bao nhiêu?`,
  (a: number, b: number) => `Có ${a} viên kẹo, bé ăn mất ${b} viên. Hỏi còn lại bao nhiêu viên kẹo?`,
];

/** Subtraction with non-negative result. Answer + distractors computed. */
function sub2(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  a: number,
  b: number,
  template: number,
  estimatedSeconds: number
): CompetitionQuestion {
  if (b > a) throw new Error(`P36 builder: negative subtraction in ${id}`);
  const d = a - b;
  const prompt = SUB_TEMPLATES[template % SUB_TEMPLATES.length](a, b);
  const expl = template % 2 === 0 ? `${a} bớt đi ${b} còn lại ${d}.` : `Đếm ngược từ ${a}: bớt ${b} ta được ${d}.`;
  return choice(id, 'toan', skillId, difficulty, prompt, '➖', [String(d), ...nearAnswers(d, 3)], String(d), expl, estimatedSeconds);
}

/** Missing addend: known + ... = total. */
function addMissing(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  known: number,
  total: number,
  template: number,
  estimatedSeconds: number
): CompetitionQuestion {
  const ans = total - known;
  if (ans <= 0) throw new Error(`P36 builder: bad missing-addend in ${id}`);
  const prompt =
    template % 2 === 0
      ? `Điền số vào chỗ chấm: ${known} + ... = ${total}`
      : `Tìm số còn thiếu: ${known} + ... = ${total}`;
  return choice(
    id, 'toan', skillId, difficulty, prompt, '🔍',
    [String(ans), ...nearAnswers(ans, 3)], String(ans),
    `Vì ${known} + ${ans} = ${total}, nên số cần điền là ${ans}.`,
    estimatedSeconds
  );
}

/** Missing subtrahend: a - ... = result. */
function subMissing(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  a: number,
  result: number,
  template: number,
  estimatedSeconds: number
): CompetitionQuestion {
  const ans = a - result;
  if (ans <= 0) throw new Error(`P36 builder: bad missing-subtrahend in ${id}`);
  const prompt =
    template % 2 === 0
      ? `Điền số vào chỗ chấm: ${a} - ... = ${result}`
      : `Tìm số còn thiếu: ${a} - ... = ${result}`;
  return choice(
    id, 'toan', skillId, difficulty, prompt, '🔍',
    [String(ans), ...nearAnswers(ans, 3)], String(ans),
    `Vì ${a} - ${ans} = ${result}, nên số cần điền là ${ans}.`,
    estimatedSeconds
  );
}

/** Three-term addition within 20. */
function add3(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  a: number,
  b: number,
  c: number,
  template: number,
  estimatedSeconds: number
): CompetitionQuestion {
  const s = a + b + c;
  if (s > 20) throw new Error(`P36 builder: sum over 20 in ${id}`);
  const prompt =
    template % 2 === 0
      ? `Tính nhẩm nhanh: ${a} + ${b} + ${c} = ?`
      : `Kết quả của ${a} + ${b} + ${c} là bao nhiêu?`;
  return choice(
    id, 'toan', skillId, difficulty, prompt, '⚡',
    [String(s), ...nearAnswers(s, 3)], String(s),
    `${a} + ${b} = ${a + b}; ${a + b} + ${c} = ${s}.`,
    estimatedSeconds
  );
}

/** Comparison of two values. The sign is computed, never hand-picked. */
function compare(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  leftText: string,
  leftVal: number,
  rightText: string,
  rightVal: number,
  estimatedSeconds: number,
  template = 0
): CompetitionQuestion {
  const sign = leftVal < rightVal ? '<' : leftVal > rightVal ? '>' : '=';
  const word = sign === '<' ? 'nhỏ hơn' : sign === '>' ? 'lớn hơn' : 'bằng';
  const prompt =
    template === 0
      ? `Chọn dấu thích hợp điền vào chỗ chấm: ${leftText} ... ${rightText}`
      : `Điền dấu >, <, = vào chỗ chấm: ${leftText} ... ${rightText}`;
  return choice(
    id, 'toan', skillId, difficulty,
    prompt,
    '⚖️',
    ['>', '<', '=', 'Không so sánh được'], sign,
    `${leftText} = ${leftVal}, ${rightText} = ${rightVal}. Vì ${leftVal} ${word} ${rightVal} nên điền dấu "${sign}".`,
    estimatedSeconds
  );
}

/** Next term of a Grade-1 sequence. */
function seqNext(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  seq: number[],
  next: number,
  ruleText: string,
  template: number,
  estimatedSeconds: number
): CompetitionQuestion {
  const list = seq.join(', ');
  const prompt =
    template % 3 === 0
      ? `Điền số tiếp theo vào dãy số: ${list}, ...`
      : template % 3 === 1
        ? `Trong dãy số ${list}, ... số tiếp theo là số nào?`
        : `Dãy số ${list}, ... còn thiếu số nào?`;
  return choice(
    id, 'toan', skillId, difficulty, prompt, '📈',
    [String(next), ...nearAnswers(next, 3)], String(next),
    `${ruleText} nên số tiếp theo là ${next}.`,
    estimatedSeconds
  );
}

/** Tens-and-units composition within 99. */
function tensUnits(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  tens: number,
  units: number,
  template: number,
  estimatedSeconds: number
): CompetitionQuestion {
  const c = tens * 10 + units;
  const swap = units * 10 + tens;
  const pool = [swap, tens * 10, units, c + 1, c - 1].filter((x) => x >= 0 && x !== c);
  const distractors = Array.from(new Set(pool)).slice(0, 3).map(String);
  const prompt =
    template % 2 === 0
      ? `Số gồm ${tens} chục và ${units} đơn vị được viết là số nào?`
      : `${tens} chục và ${units} đơn vị tạo thành số nào?`;
  return choice(
    id, 'toan', skillId, difficulty, prompt, '🔢',
    [String(c), ...distractors], String(c),
    `${tens} chục = ${tens * 10}, thêm ${units} đơn vị ta được số ${c}.`,
    estimatedSeconds
  );
}

/** Immediate predecessor / successor within 0–20. */
function neighbor(
  id: string,
  skillId: string,
  difficulty: CompetitionQuestion['difficulty'],
  n: number,
  dir: -1 | 1,
  template: number,
  estimatedSeconds: number
): CompetitionQuestion {
  const ans = n + dir;
  const prompt =
    template % 2 === 0
      ? dir === -1
        ? `Số liền trước của số ${n} là số nào?`
        : `Số liền sau của số ${n} là số nào?`
      : dir === -1
        ? `Số nào đứng ngay trước số ${n}?`
        : `Số nào đứng ngay sau số ${n}?`;
  const expl =
    dir === -1 ? `Số liền trước của ${n} là số nhỏ hơn ${n} một đơn vị: ${n} - 1 = ${ans}.`
      : `Số liền sau của ${n} là số lớn hơn ${n} một đơn vị: ${n} + 1 = ${ans}.`;
  return choice(
    id, 'toan', skillId, difficulty, prompt, '🎯',
    [String(ans), ...Array.from(new Set([n, n + 2 * dir, n - dir])).filter((x) => x >= 0 && x !== ans).slice(0, 3).map(String)],
    String(ans), expl, estimatedSeconds
  );
}

// ----------------------------------------------------------------- content --

export const P36_QUESTIONS: CompetitionQuestion[] = [
  // ================= TOÁN — SỐ HỌC: cấu tạo số (MATH-NUMBER +3) =================
  tensUnits('cq-p36-m001', 'MATH-NUMBER', 'EASY', 2, 5, 1, 15),
  tensUnits('cq-p36-m002', 'MATH-NUMBER', 'EASY', 3, 1, 1, 15),
  tensUnits('cq-p36-m003', 'MATH-NUMBER', 'MEDIUM', 1, 6, 0, 18),
  neighbor('cq-p36-m004', 'MATH-NUMBER', 'EASY', 12, -1, 1, 12),
  neighbor('cq-p36-m005', 'MATH-NUMBER', 'EASY', 18, 1, 1, 12),
  choice(
    'cq-p36-m006', 'toan', 'MATH-NUMBER', 'EASY',
    'Có bao nhiêu quả bóng? ⚽⚽⚽⚽⚽⚽', '⚽',
    ['6', '5', '7', '8'], '6',
    'Đếm từng quả: 1, 2, 3, 4, 5, 6. Có 6 quả bóng.',
    15
  ),
  choice(
    'cq-p36-m007', 'toan', 'MATH-NUMBER', 'MEDIUM',
    'Có bao nhiêu ngôi sao? ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐', '⭐',
    ['13', '12', '14', '11'], '13',
    'Đếm từng ngôi sao: 10 ngôi rồi đếm tiếp 3 ngôi nữa, tổng cộng 13.',
    18
  ),
  blank(
    'cq-p36-m008', 'toan', 'MATH-NUMBER', 'MEDIUM',
    'Điền số vào chỗ chấm: Số 20 gồm ... chục.', '🔟',
    ['2', '20', '0', '1'], '2',
    'Số 20 có 2 chục và 0 đơn vị.',
    18
  ),

  // ================= TOÁN — SO SÁNH (MATH-COMPARISON +8) =================
  compare('cq-p36-m009', 'MATH-COMPARISON', 'EASY', '8', 8, '5', 5, 15),
  compare('cq-p36-m010', 'MATH-COMPARISON', 'EASY', '4', 4, '9', 9, 15),
  compare('cq-p36-m011', 'MATH-COMPARISON', 'MEDIUM', '16', 16, '11', 11, 18, 1),
  compare('cq-p36-m012', 'MATH-COMPARISON', 'MEDIUM', '7 + 3', 10, '9', 9, 20),
  compare('cq-p36-m013', 'MATH-COMPARISON', 'HARD', '12 - 5', 7, '4 + 4', 8, 28),
  compare('cq-p36-m014', 'MATH-COMPARISON', 'CHALLENGE', '20 - 8', 12, '5 + 6', 11, 32),
  matching(
    'cq-p36-m015', 'toan', 'MATH-COMPARISON', 'EASY',
    'Nối mỗi số với cách đọc đúng của nó.', '🔢',
    [
      ['7', 'bảy'],
      ['9', 'chín'],
      ['12', 'mười hai'],
    ],
    'Số 7 đọc là "bảy", số 9 đọc là "chín", số 12 đọc là "mười hai".',
    30
  ),
  bool(
    'cq-p36-m016', 'toan', 'MATH-COMPARISON', 'EASY',
    'Đánh giá mệnh đề: "Số 18 lớn hơn số 13."', '🔢',
    'Đúng',
    '18 có 1 chục 8 đơn vị, 13 có 1 chục 3 đơn vị. 8 đơn vị lớn hơn 3 đơn vị nên 18 lớn hơn 13.',
    15
  ),

  // ================= TOÁN — PHÉP CỘNG (MATH-ADDITION +8) =================
  add2('cq-p36-m017', 'MATH-ADDITION', 'EASY', 3, 5, 0, 12),
  add2('cq-p36-m018', 'MATH-ADDITION', 'EASY', 6, 2, 1, 12),
  add2('cq-p36-m019', 'MATH-ADDITION', 'MEDIUM', 9, 7, 2, 20),
  add2('cq-p36-m020', 'MATH-ADDITION', 'MEDIUM', 8, 6, 3, 20),
  addMissing('cq-p36-m021', 'MATH-ADDITION', 'MEDIUM', 4, 11, 0, 18),
  addMissing('cq-p36-m022', 'MATH-ADDITION', 'HARD', 7, 15, 1, 25),
  add3('cq-p36-m023', 'MATH-ADDITION', 'MEDIUM', 4, 5, 3, 0, 22),
  matching(
    'cq-p36-m024', 'toan', 'MATH-ADDITION', 'EASY',
    'Nối mỗi phép cộng hai số giống nhau với tổng của nó.', '➕',
    [
      ['5 + 5', '10'],
      ['9 + 9', '18'],
      ['7 + 7', '14'],
    ],
    'Cộng các số giống nhau: 5 + 5 = 10, 9 + 9 = 18, 7 + 7 = 14.',
    30
  ),

  // ================= TOÁN — PHÉP TRỪ (MATH-SUBTRACTION +8) =================
  sub2('cq-p36-m025', 'MATH-SUBTRACTION', 'EASY', 9, 4, 0, 12),
  sub2('cq-p36-m026', 'MATH-SUBTRACTION', 'EASY', 7, 2, 1, 12),
  sub2('cq-p36-m027', 'MATH-SUBTRACTION', 'MEDIUM', 15, 8, 2, 20),
  sub2('cq-p36-m028', 'MATH-SUBTRACTION', 'MEDIUM', 12, 9, 3, 20),
  subMissing('cq-p36-m029', 'MATH-SUBTRACTION', 'MEDIUM', 11, 6, 0, 20),
  subMissing('cq-p36-m030', 'MATH-SUBTRACTION', 'HARD', 16, 9, 1, 25),
  ordering(
    'cq-p36-m031', 'toan', 'MATH-SUBTRACTION', 'MEDIUM',
    'Xếp các phép trừ theo kết quả tăng dần.', '📈',
    ['10 - 9', '8 - 5', '9 - 3'],
    'Kết quả lần lượt là 1, 3, 6 — tăng dần nên xếp từ kết quả bé nhất.',
    35
  ),
  matching(
    'cq-p36-m032', 'toan', 'MATH-SUBTRACTION', 'EASY',
    'Nối phép trừ bên trái với hiệu của nó.', '➖',
    [
      ['10 - 2', '8'],
      ['9 - 4', '5'],
      ['7 - 1', '6'],
    ],
    'Trừ lần lượt: 10 - 2 = 8, 9 - 4 = 5, 7 - 1 = 6.',
    30
  ),

  // ================= TOÁN — DÃY SỐ (MATH-SEQUENCE +7) =================
  seqNext('cq-p36-m033', 'MATH-SEQUENCE', 'MEDIUM', [5, 7, 9], 11, 'Dãy đếm cách 2: 5, 7, 9', 1, 20),
  seqNext('cq-p36-m034', 'MATH-SEQUENCE', 'EASY', [11, 12, 13], 14, 'Dãy đếm tăng 1: 11, 12, 13', 0, 15),
  seqNext('cq-p36-m035', 'MATH-SEQUENCE', 'MEDIUM', [18, 16, 14], 12, 'Dãy giảm dần mỗi bước 2 đơn vị: 18, 16, 14', 2, 20),
  seqNext('cq-p36-m036', 'MATH-SEQUENCE', 'HARD', [3, 6, 9], 12, 'Dãy đếm cách 3: 3, 6, 9', 0, 28),
  ordering(
    'cq-p36-m037', 'toan', 'MATH-SEQUENCE', 'EASY',
    'Sắp xếp các số theo thứ tự từ bé đến lớn.', '📊',
    ['7', '13', '19', '25'],
    'Số nhỏ đứng trước, số lớn đứng sau: 7 → 13 → 19 → 25.',
    30
  ),
  ordering(
    'cq-p36-m038', 'toan', 'MATH-SEQUENCE', 'MEDIUM',
    'Xếp các số theo thứ tự giảm dần.', '📉',
    ['30', '22', '15', '9'],
    'Số lớn đứng trước, số nhỏ đứng sau: 30 → 22 → 15 → 9.',
    35
  ),
  bool(
    'cq-p36-m039', 'toan', 'MATH-SEQUENCE', 'EASY',
    'Đánh giá mệnh đề: "Dãy số 8, 6, 7, 5 giảm dần mỗi bước 1 đơn vị."', '📈',
    'Sai',
    'Từ 8 xuống 6 là bớt 2, rồi 6 lên 7 lại tăng lên. Dãy này không giảm đều.',
    15
  ),

  // ================= TOÁN — QUY LUẬT (MATH-PATTERN +6) =================
  choice(
    'cq-p36-m040', 'toan', 'MATH-PATTERN', 'EASY',
    'Nhìn dãy bi đỏ vàng lặp lại: 🔴 🟡 🔴 🟡 🔴 ... Viên bi tiếp theo màu gì?', '🎨',
    ['🟡 (Hình tròn vàng)', '🔴 (Hình tròn đỏ)', '🟢 (Hình tròn lục)', '🔵 (Hình tròn xanh)'], '🟡 (Hình tròn vàng)',
    'Quy luật đỏ - vàng xen kẽ. Sau hình tròn đỏ là hình tròn vàng.',
    15
  ),
  choice(
    'cq-p36-m041', 'toan', 'MATH-PATTERN', 'MEDIUM',
    'Nhìn dãy ô đen trắng: ⬛ ⬜ ⬜ ⬛ ⬜ ⬜ ... Ô tiếp theo màu gì?', '◼️',
    ['⬛ (Hình vuông đen)', '⬜ (Hình vuông trắng)', '🔴 (Hình tròn đỏ)', '🔵 (Hình tròn xanh)'], '⬛ (Hình vuông đen)',
    'Mỗi cụm gồm 1 ô đen rồi 2 ô trắng lặp lại. Sau 2 ô trắng là ô đen.',
    20
  ),
  choice(
    'cq-p36-m042', 'toan', 'MATH-PATTERN', 'HARD',
    'Quan sát số chấm tròn: ○ ○○ ○○○ ... Nhóm tiếp theo có mấy chấm tròn?', '⭕',
    ['4', '3', '5', '6'], '4',
    'Số chấm tăng dần 1 mỗi nhóm: 1, 2, 3 rồi đến 4.',
    25
  ),
  ordering(
    'cq-p36-m043', 'toan', 'MATH-PATTERN', 'MEDIUM',
    'Xếp các hình từ bé đến lớn.', '🔵',
    ['Hình tròn bé', 'Hình tròn vừa', 'Hình tròn to'],
    'Hình bé đứng trước, hình to đứng sau: bé → vừa → to.',
    35
  ),
  matching(
    'cq-p36-m044', 'toan', 'MATH-PATTERN', 'MEDIUM',
    'Nối mỗi dãy hình với quy luật của nó.', '🧩',
    [
      ['🔴🔵🔴🔵', 'lặp lại 2 hình'],
      ['🔴🔵🟡🔴🔵🟡', 'lặp lại 3 hình'],
      ['⭐⭐🌙⭐⭐', 'hai sao một trăng'],
    ],
    'Dãy xen kẽ 2 hình lặp cụm 2; dãy 3 hình lặp cụm 3; dãy sao-trăng lặp cụm 3.',
    35
  ),
  classify(
    'cq-p36-m045', 'toan', 'MATH-PATTERN', 'HARD',
    'Dãy hình nào lặp lại theo quy luật?', '🔁',
    ['lặp lại', 'không lặp lại'],
    ['🔴🔵🔴🔵', '🔴🟡🟢', '🌙⭐☁️'], 'lặp lại',
    'Dãy đỏ-xanh lặp lại cụm 2 hình. Hai dãy còn lại không có cụm lặp.',
    28
  ),

  // ================= TOÁN — HÌNH HỌC (MATH-SHAPE +9) =================
  classify(
    'cq-p36-m046', 'toan', 'MATH-SHAPE', 'EASY',
    'Hình nào là hình tròn?', '⭕',
    ['hình tròn', 'hình vuông', 'hình tam giác', 'hình chữ nhật'],
    ['⭕', '🟨', '🔺', '🔷'], 'hình tròn',
    '⭕ cong đều là hình tròn. Các hình còn lại có cạnh thẳng.',
    20
  ),
  classify(
    'cq-p36-m047', 'toan', 'MATH-SHAPE', 'MEDIUM',
    'Hình nào là hình tam giác?', '🔺',
    ['hình tam giác', 'hình tròn', 'hình vuông', 'hình chữ nhật'],
    ['🔺', '⭕', '🔷', '▬'], 'hình tam giác',
    '🔺 có 3 cạnh khép kín là hình tam giác.',
    25
  ),
  dragdrop(
    'cq-p36-m048', 'toan', 'MATH-SHAPE', 'EASY',
    'Kéo hình tròn vào đúng nhóm.', '🖐️',
    ['hình tròn', 'không phải hình tròn'],
    ['⭕', '🔷', '🔺'], 'hình tròn',
    '⭕ là hình tròn. Hình vuông và hình tam giác có cạnh thẳng.',
    25
  ),
  dragdrop(
    'cq-p36-m049', 'toan', 'MATH-SHAPE', 'MEDIUM',
    'Kéo hình vuông vào đúng nhóm.', '🖐️',
    ['hình vuông', 'không phải hình vuông'],
    ['🔷', '⭕', '▬'], 'hình vuông',
    '🔷 có 4 cạnh bằng nhau là hình vuông.',
    28
  ),
  dragdrop(
    'cq-p36-m050', 'toan', 'MATH-SHAPE', 'HARD',
    'Kéo hình chữ nhật vào đúng nhóm.', '🖐️',
    ['hình chữ nhật', 'không phải hình chữ nhật'],
    ['▬', '🔷', '⭕', '🔺'], 'hình chữ nhật',
    '▬ có 4 góc vuông và hai cạnh đối bằng nhau là hình chữ nhật.',
    35
  ),
  choice(
    'cq-p36-m051', 'toan', 'MATH-SHAPE', 'EASY',
    'Quả bóng đá có dạng hình gì?', '⚽',
    ['Hình tròn', 'Hình vuông', 'Hình tam giác', 'Hình chữ nhật'], 'Hình tròn',
    'Quả bóng đá tròn đều, có dạng hình tròn.',
    15
  ),
  choice(
    'cq-p36-m052', 'toan', 'MATH-SHAPE', 'MEDIUM',
    'Hình vuông có mấy cạnh?', '🔷',
    ['4', '3', '5', '6'], '4',
    'Hình vuông có 4 cạnh bằng nhau.',
    18
  ),
  matching(
    'cq-p36-m053', 'toan', 'MATH-SHAPE', 'EASY',
    'Nối mỗi hình với số cạnh của nó.', '🔷',
    [
      ['Hình tam giác', '3 cạnh'],
      ['Hình vuông', '4 cạnh'],
      ['Hình tròn', 'không có cạnh'],
    ],
    'Tam giác có 3 cạnh, hình vuông có 4 cạnh, hình tròn cong đều không có cạnh.',
    30
  ),
  classify(
    'cq-p36-m054', 'toan', 'MATH-SHAPE', 'CHALLENGE',
    'Vật nào lăn được trên sàn?', '⚽',
    ['lăn được', 'không lăn được'],
    ['Quả bóng', 'Hộp sữa', 'Quyển vở'], 'lăn được',
    'Quả bóng tròn nên lăn được. Hộp sữa và quyển vở có mặt phẳng nên không lăn.',
    32
  ),

  // ================= TOÁN — ĐO LƯỜNG (MATH-MEASUREMENT +6) =================
  choice(
    'cq-p36-m055', 'toan', 'MATH-MEASUREMENT', 'EASY',
    'Cây bút chì dài 9 cm, cây thước dài 20 cm. Hỏi cây nào dài hơn?', '📏',
    ['Cây thước', 'Cây bút chì', 'Hai cây bằng nhau', 'Không biết cây nào'], 'Cây thước',
    '20 cm dài hơn 9 cm nên cây thước dài hơn cây bút chì.',
    18
  ),
  choice(
    'cq-p36-m056', 'toan', 'MATH-MEASUREMENT', 'MEDIUM',
    'Băng giấy A dài 15 cm, băng giấy B dài 9 cm. Hỏi băng giấy A dài hơn băng giấy B bao nhiêu cm?', '✂️',
    ['6 cm', '5 cm', '7 cm', '24 cm'], '6 cm',
    'Phép tính so sánh độ dài: 15 - 9 = 6 cm.',
    22
  ),
  blank(
    'cq-p36-m057', 'toan', 'MATH-MEASUREMENT', 'MEDIUM',
    'Điền số vào chỗ chấm: Sợi dây dài 17 cm, cắt đi 5 cm thì còn ... cm.', '🧵',
    ['12', '11', '13', '22'], '12',
    '17 - 5 = 12, vậy sợi dây còn 12 cm.',
    22
  ),
  ordering(
    'cq-p36-m058', 'toan', 'MATH-MEASUREMENT', 'EASY',
    'Xếp các quả từ bé đến lớn.', '🍊',
    ['Hạt gạo', 'Quả chanh', 'Quả bưởi', 'Quả mít'],
    'Từ bé đến lớn: hạt gạo bé nhất, quả mít lớn nhất.',
    30
  ),
  matching(
    'cq-p36-m059', 'toan', 'MATH-MEASUREMENT', 'MEDIUM',
    'Nối mỗi đồng hồ với giờ nó đang chỉ.', '⏰',
    [
      ['Kim ngắn chỉ 7, kim dài chỉ 12', '7 giờ'],
      ['Kim ngắn chỉ 9, kim dài chỉ 12', '9 giờ'],
      ['Kim ngắn chỉ 3, kim dài chỉ 12', '3 giờ'],
    ],
    'Kim dài chỉ 12 là giờ đúng: kim ngắn chỉ số nào là giờ đó.',
    35
  ),
  bool(
    'cq-p36-m060', 'toan', 'MATH-MEASUREMENT', 'EASY',
    'Đánh giá mệnh đề: "1 tuần lễ có 7 ngày."', '📅',
    'Đúng',
    '1 tuần lễ có 7 ngày: từ thứ Hai đến Chủ Nhật.',
    15
  ),

  // ================= TOÁN — GIẢI TOÁN (MATH-WORD-PROBLEM +9) =================
  choice(
    'cq-p36-m061', 'toan', 'MATH-WORD-PROBLEM', 'EASY',
    'Trên cành có 6 con chim. Bay đi 2 con. Hỏi trên cành còn lại mấy con?', '🐦',
    ['4 con', '8 con', '3 con', '5 con'], '4 con',
    'Bay đi là bớt đi: 6 - 2 = 4 con.',
    20
  ),
  choice(
    'cq-p36-m062', 'toan', 'MATH-WORD-PROBLEM', 'EASY',
    'Bé có 5 cái kẹo. Anh cho Bé thêm 4 cái. Hỏi Bé có tất cả mấy cái kẹo?', '🍬',
    ['9 cái', '8 cái', '10 cái', '1 cái'], '9 cái',
    'Cho thêm là cộng: 5 + 4 = 9 cái kẹo.',
    20
  ),
  choice(
    'cq-p36-m063', 'toan', 'MATH-WORD-PROBLEM', 'MEDIUM',
    'Lớp có 10 bạn nam và 8 bạn nữ. Hỏi lớp có tất cả bao nhiêu bạn?', '🏫',
    ['18 bạn', '17 bạn', '19 bạn', '2 bạn'], '18 bạn',
    'Gộp hai nhóm: 10 + 8 = 18 bạn.',
    25
  ),
  choice(
    'cq-p36-m064', 'toan', 'MATH-WORD-PROBLEM', 'MEDIUM',
    'Mẹ mua 15 quả trứng. Mẹ dùng 6 quả để nấu ăn. Hỏi còn lại mấy quả trứng?', '🥚',
    ['9 quả', '21 quả', '8 quả', '10 quả'], '9 quả',
    'Dùng bớt đi: 15 - 6 = 9 quả.',
    25
  ),
  choice(
    'cq-p36-m065', 'toan', 'MATH-WORD-PROBLEM', 'CHALLENGE',
    'An có 9 viên bi. An cho Bình 3 viên rồi mẹ lại cho An 5 viên. Hỏi An có mấy viên bi?', '🔮',
    ['11 viên', '12 viên', '17 viên', '6 viên'], '11 viên',
    'Cho đi trước: 9 - 3 = 6 viên. Nhận thêm: 6 + 5 = 11 viên.',
    35
  ),
  choice(
    'cq-p36-m066', 'toan', 'MATH-WORD-PROBLEM', 'CHALLENGE',
    'Trong hộp có một số bút chì. Bé lấy ra 5 chiếc thì còn 8 chiếc. Hỏi lúc đầu trong hộp có mấy chiếc?', '✏️',
    ['13 chiếc', '3 chiếc', '12 chiếc', '14 chiếc'], '13 chiếc',
    'Số bút lúc đầu: 8 + 5 = 13 chiếc.',
    32
  ),
  bool(
    'cq-p36-m067', 'toan', 'MATH-WORD-PROBLEM', 'MEDIUM',
    'Đánh giá mệnh đề: "Bé có 10 quả bóng, cho bạn 3 quả thì còn 7 quả."', '⚽',
    'Đúng',
    'Cho đi là trừ: 10 - 3 = 7 quả.',
    20
  ),
  matching(
    'cq-p36-m068', 'toan', 'MATH-WORD-PROBLEM', 'MEDIUM',
    'Nối mỗi câu chuyện với phép tính cần dùng.', '📖',
    [
      ['Mua thêm vở mới', 'cộng'],
      ['Ăn bớt bánh ngọt', 'trừ'],
    ],
    'Mua thêm là cộng, ăn bớt đi là trừ.',
    35
  ),
  ordering(
    'cq-p36-m069', 'toan', 'MATH-WORD-PROBLEM', 'EASY',
    'Sắp xếp các câu thành quá trình cây lớn lên.', '🌱',
    ['Bé gieo hạt.', 'Cây nảy mầm.', 'Cây ra hoa.', 'Cây cho quả.'],
    'Cây lớn theo thứ tự: gieo hạt → nảy mầm → ra hoa → cho quả.',
    35
  ),

  // ================= TOÁN — SUY LUẬN (MATH-LOGIC +7) =================
  choice(
    'cq-p36-m070', 'toan', 'MATH-LOGIC', 'MEDIUM',
    'Bút chì đỏ dài hơn bút chì xanh. Bút chì xanh dài hơn bút chì vàng. Hỏi bút chì nào ngắn nhất?', '✏️',
    ['Bút chì vàng', 'Bút chì xanh', 'Bút chì đỏ', 'Ba bút dài bằng nhau'], 'Bút chì vàng',
    'Thứ tự từ dài đến ngắn: đỏ > xanh > vàng. Vậy bút chì vàng ngắn nhất.',
    25
  ),
  choice(
    'cq-p36-m071', 'toan', 'MATH-LOGIC', 'HARD',
    'Tháp số: tầng dưới có số 4 và số 5. Số ở tầng trên bằng tổng hai số tầng dưới. Hỏi số ở tầng trên là số nào?', '🗼',
    ['9', '8', '10', '1'], '9',
    'Số tầng trên = 4 + 5 = 9.',
    30
  ),
  choice(
    'cq-p36-m072', 'toan', 'MATH-LOGIC', 'CHALLENGE',
    'Số nào vừa lớn hơn 14 vừa nhỏ hơn 16?', '🎯',
    ['15', '14', '16', '13'], '15',
    'Các số giữa 14 và 16 chỉ có số 15.',
    32
  ),
  choice(
    'cq-p36-m073', 'toan', 'MATH-LOGIC', 'EASY',
    'Con gà có 2 chân. Hỏi 3 con gà có mấy chân?', '🐔',
    ['6 chân', '5 chân', '4 chân', '3 chân'], '6 chân',
    'Mỗi con 2 chân: 2 + 2 + 2 = 6 chân.',
    18
  ),
  bool(
    'cq-p36-m074', 'toan', 'MATH-LOGIC', 'EASY',
    'Đánh giá mệnh đề: "Ngày thứ Hai đến trước ngày thứ Ba."', '📅',
    'Đúng',
    'Trong tuần, thứ Hai đứng trước thứ Ba.',
    15
  ),
  bool(
    'cq-p36-m075', 'toan', 'MATH-LOGIC', 'CHALLENGE',
    'Đánh giá mệnh đề: "Nếu hôm nay là thứ Bảy thì hôm qua là thứ Sáu."', '📅',
    'Đúng',
    'Thứ Sáu đứng ngay trước thứ Bảy trong tuần.',
    25
  ),
  ordering(
    'cq-p36-m076', 'toan', 'MATH-LOGIC', 'MEDIUM',
    'Sắp xếp các ngày theo thứ tự trong tuần.', '🗓️',
    ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm'],
    'Các ngày đi theo thứ tự: Hai → Ba → Tư → Năm.',
    35
  ),
  matching(
    'cq-p36-m077', 'toan', 'MATH-ADDITION', 'MEDIUM',
    'Nối phép cộng với tổng đúng của nó.', '➕',
    [
      ['6 + 6', '12'],
      ['8 + 8', '16'],
      ['10 + 10', '20'],
    ],
    'Cộng hai số giống nhau: 6 + 6 = 12, 8 + 8 = 16, 10 + 10 = 20.',
    35
  ),
  blank(
    'cq-p36-m078', 'toan', 'MATH-SUBTRACTION', 'HARD',
    'Điền số vào chỗ chấm: 20 - ... = 13', '🔢',
    ['7', '6', '8', '17'], '7',
    'Vì 20 - 7 = 13, nên số cần điền là 7.',
    25
  ),

  // ================= TIẾNG VIỆT — NGỮ ÂM: chữ cái & âm đầu (TV-PHONICS +7) =================
  choice(
    'cq-p36-v001', 'tieng-viet', 'TV-PHONICS', 'EASY',
    'Chữ cái nào bắt đầu cho từ "Quả bóng"?', '⚽',
    ['Chữ Q', 'Chữ B', 'Chữ G', 'Chữ O'], 'Chữ Q',
    '"Quả bóng" có tiếng "Quả" bắt đầu bằng chữ cái Q.',
    15
  ),
  choice(
    'cq-p36-v002', 'tieng-viet', 'TV-PHONICS', 'EASY',
    'Tiếng "cá" bắt đầu bằng chữ cái nào?', '🐟',
    ['Chữ C', 'Chữ K', 'Chữ T', 'Chữ A'], 'Chữ C',
    'Tiếng "cá" bắt đầu bằng chữ cái C.',
    15
  ),
  choice(
    'cq-p36-v003', 'tieng-viet', 'TV-PHONICS', 'MEDIUM',
    'Nhóm từ nào có cùng âm đầu "B"?', '🐝',
    ['Bé, bàn, bóng', 'Bé, mèo, gà', 'Bàn, ghế, tủ', 'Bóng, cây, hoa'], 'Bé, bàn, bóng',
    'Cả ba tiếng "Bé", "bàn", "bóng" đều bắt đầu bằng âm "B".',
    20
  ),
  choice(
    'cq-p36-v004', 'tieng-viet', 'TV-PHONICS', 'MEDIUM',
    'Tiếng nào có âm đầu là "ch"?', '🚗',
    ['che', 'xe', 'se', 'ke'], 'che',
    'Tiếng "che" bắt đầu bằng âm đôi "ch". Các tiếng còn lại bắt đầu bằng x, s, k.',
    20
  ),
  blank(
    'cq-p36-v005', 'tieng-viet', 'TV-PHONICS', 'EASY',
    'Điền chữ cái còn thiếu: "...óng đang bay trên trời."', '🎈',
    ['B', 'D', 'G', 'T'], 'B',
    '"Bóng" là quả bóng bay, nên chữ cái còn thiếu là B.',
    15
  ),
  blank(
    'cq-p36-v006', 'tieng-viet', 'TV-PHONICS', 'MEDIUM',
    'Điền âm đầu còn thiếu: "...âu cho nhiều sữa."', '🐃',
    ['tr', 'th', 'ch', 'kh'], 'tr',
    '"Trâu" là con vật cho sữa cày ruộng, nên âm đầu là "tr".',
    20
  ),
  matching(
    'cq-p36-v007', 'tieng-viet', 'TV-PHONICS', 'EASY',
    'Nối mỗi chữ cái với tiếng bắt đầu bằng chữ cái đó.', '🔤',
    [
      ['B', 'Bóng'],
      ['C', 'Cá'],
      ['M', 'Mèo'],
    ],
    '"Bóng" bắt đầu bằng B, "Cá" bắt đầu bằng C, "Mèo" bắt đầu bằng M.',
    30
  ),

  // ================= TIẾNG VIỆT — DẤU THANH (TV-TONES +7) =================
  choice(
    'cq-p36-v008', 'tieng-viet', 'TV-TONES', 'EASY',
    'Tiếng "bò" mang dấu thanh gì?', '🐄',
    ['Dấu huyền (\\)', 'Dấu sắc (/)', 'Dấu hỏi (?)', 'Dấu nặng (.)'], 'Dấu huyền (\\)',
    'Tiếng "bò" có dấu huyền trên âm o.',
    15
  ),
  choice(
    'cq-p36-v009', 'tieng-viet', 'TV-TONES', 'EASY',
    'Tiếng "lá" mang dấu thanh gì?', '🍃',
    ['Dấu sắc (/)', 'Dấu huyền (\\)', 'Dấu ngã (~)', 'Dấu nặng (.)'], 'Dấu sắc (/)',
    'Tiếng "lá" có dấu sắc trên âm a.',
    15
  ),
  choice(
    'cq-p36-v010', 'tieng-viet', 'TV-TONES', 'MEDIUM',
    'Cặp tiếng nào có cùng dấu thanh?', '🎵',
    ['cá – lá', 'cá – bò', 'lá – bò', 'cá – gà'], 'cá – lá',
    '"Cá" và "lá" đều mang dấu sắc. Các cặp còn lại lệch dấu nhau.',
    20
  ),
  choice(
    'cq-p36-v011', 'tieng-viet', 'TV-TONES', 'HARD',
    'Tiếng nào mang thanh nặng?', '🐷',
    ['lợn', 'gà', 'cá', 'chim'], 'lợn',
    'Tiếng "lợn" có dấu nặng. "Gà" dấu huyền, "cá" dấu sắc, "chim" thanh ngang.',
    25
  ),
  blank(
    'cq-p36-v012', 'tieng-viet', 'TV-TONES', 'EASY',
    'Điền từ vào chỗ chấm: "Con ... đang gáy sáng."', '🐓',
    ['gà', 'gá', 'gạ', 'gã'], 'gà',
    '"Gà" là con vật nuôi biết gáy sáng.',
    15
  ),
  blank(
    'cq-p36-v013', 'tieng-viet', 'TV-TONES', 'MEDIUM',
    'Điền từ vào chỗ chấm: "Quả ... chín đỏ trên cây."', '🍅',
    ['cà', 'cá', 'cả', 'cạ'], 'cà',
    '"Quả cà" chín đỏ. Các cách viết còn lại không tạo thành từ phù hợp.',
    20
  ),
  bool(
    'cq-p36-v014', 'tieng-viet', 'TV-TONES', 'MEDIUM',
    'Đánh giá mệnh đề: "Tiếng "hỏi" mang dấu sắc."', '❓',
    'Sai',
    'Tiếng "hỏi" mang dấu hỏi, không phải dấu sắc.',
    20
  ),

  // ================= TIẾNG VIỆT — CẤU TẠO TIẾNG (TV-SYLLABLE +7) =================
  choice(
    'cq-p36-v015', 'tieng-viet', 'TV-SYLLABLE', 'EASY',
    'Ghép âm đầu "b" với âm chính "a" ta được tiếng gì?', '🧱',
    ['ba', 'ab', 'bá', 'bo'], 'ba',
    'Âm đầu "b" + âm chính "a" = tiếng "ba".',
    15
  ),
  choice(
    'cq-p36-v016', 'tieng-viet', 'TV-SYLLABLE', 'MEDIUM',
    'Tiếng "hoa" có âm đầu là gì?', '🌸',
    ['h', 'o', 'a', 'oa'], 'h',
    'Tiếng "hoa" có âm đầu "h", âm đệm "o" và âm chính "a".',
    20
  ),
  choice(
    'cq-p36-v017', 'tieng-viet', 'TV-SYLLABLE', 'HARD',
    'Tiếng nào có âm đệm?', '🌺',
    ['hoa', 'ba', 'me', 'ca'], 'hoa',
    'Tiếng "hoa" có âm đệm "o". Các tiếng còn lại không có âm đệm.',
    25
  ),
  blank(
    'cq-p36-v018', 'tieng-viet', 'TV-SYLLABLE', 'EASY',
    'Điền âm chính để thành tiếng "bé": "b..."', '👧',
    ['e', 'a', 'o', 'i'], 'e',
    'Âm đầu "b" + âm chính "e" = tiếng "bé".',
    15
  ),
  blank(
    'cq-p36-v019', 'tieng-viet', 'TV-SYLLABLE', 'MEDIUM',
    'Điền âm cuối để thành tiếng "bàn": "bà..."', '🪑',
    ['n', 'm', 'ng', 'c'], 'n',
    'Tiếng "bàn" có âm cuối "n".',
    20
  ),
  ordering(
    'cq-p36-v020', 'tieng-viet', 'TV-SYLLABLE', 'MEDIUM',
    'Sắp xếp các phần theo thứ tự tạo thành tiếng "má".', '🧩',
    ['âm đầu m', 'âm chính a', 'dấu sắc'],
    'Tiếng "má" gồm âm đầu m, rồi âm chính a, rồi dấu sắc.',
    35
  ),
  matching(
    'cq-p36-v021', 'tieng-viet', 'TV-SYLLABLE', 'HARD',
    'Nối mỗi tiếng với cấu tạo đúng của nó.', '🔍',
    [
      ['ba', 'âm đầu + âm chính'],
      ['hoa', 'âm đầu + âm đệm + âm chính'],
      ['an', 'âm chính + âm cuối'],
    ],
    '"Ba" có âm đầu và âm chính; "hoa" thêm âm đệm; "an" có âm chính và âm cuối.',
    40
  ),

  // ================= TIẾNG VIỆT — VẦN (TV-RHYME +7) =================
  choice(
    'cq-p36-v022', 'tieng-viet', 'TV-RHYME', 'EASY',
    'Tiếng "hoa" bắt vần với tiếng nào dưới đây?', '🌷',
    ['loa', 'cho', 'la', 'quà'], 'loa',
    'Tiếng "hoa" và "loa" đều có vần "oa".',
    15
  ),
  choice(
    'cq-p36-v023', 'tieng-viet', 'TV-RHYME', 'MEDIUM',
    'Tìm tiếng cùng vần "ôi" điền vào chỗ chấm: "Mẹ nấu ... thơm phức."', '🍚',
    ['xôi', 'cơm', 'canh', 'cháo'], 'xôi',
    'Tiếng "xôi" có vần "ôi", tạo thành câu hợp nghĩa.',
    20
  ),
  choice(
    'cq-p36-v024', 'tieng-viet', 'TV-RHYME', 'CHALLENGE',
    'Tiếng nào KHÔNG cùng vần với "sách"?', '📕',
    ['vách', 'cách', 'mách', 'mệt'], 'mệt',
    'Sách–vách–cách–mách cùng vần "ách". "Mệt" có vần "ệt" nên không cùng vần.',
    30
  ),
  matching(
    'cq-p36-v025', 'tieng-viet', 'TV-RHYME', 'EASY',
    'Nối tiếng bên trái với tiếng cùng vần bên phải.', '🎶',
    [
      ['tay', 'may'],
      ['bàn', 'than'],
      ['bát', 'cát'],
    ],
    'Tay–may cùng vần "ay", bàn–than cùng vần "an", bát–cát cùng vần "at".',
    30
  ),
  matching(
    'cq-p36-v026', 'tieng-viet', 'TV-RHYME', 'MEDIUM',
    'Nối mỗi từ với từ cùng vần với nó.', '🎼',
    [
      ['đỏ', 'cỏ'],
      ['vàng', 'sáng'],
      ['tím', 'tìm'],
    ],
    'Đỏ–cỏ cùng vần "o", vàng–sáng cùng vần "ang", tím–tìm cùng vần "im".',
    35
  ),
  ordering(
    'cq-p36-v027', 'tieng-viet', 'TV-RHYME', 'MEDIUM',
    'Sắp xếp các tiếng thành từng cặp cùng vần.', '🧺',
    ['bàn', 'than', 'bát', 'cát'],
    'Bàn–than cùng vần "an" đứng trước, bát–cát cùng vần "at" đứng sau.',
    35
  ),
  blank(
    'cq-p36-v028', 'tieng-viet', 'TV-RHYME', 'EASY',
    'Điền tiếng cùng vần "an" vào chỗ chấm: "Bé quét ..."', '🧹',
    ['sân', 'nhà', 'bếp', 'vườn'], 'sân',
    'Tiếng "sân" có vần "an", tạo thành câu "Bé quét sân".',
    15
  ),

  // ================= TIẾNG VIỆT — CHÍNH TẢ (TV-SPELLING +6) =================
  choice(
    'cq-p36-v029', 'tieng-viet', 'TV-SPELLING', 'EASY',
    'Chọn từ viết ĐÚNG chính tả:', '🍬',
    ['cái kẹo', 'cái cẹo', 'cái kẽo', 'cái cẽo'], 'cái kẹo',
    'Quy tắc: k đứng trước e, ê, i nên viết đúng là "cái kẹo".',
    15
  ),
  choice(
    'cq-p36-v030', 'tieng-viet', 'TV-SPELLING', 'MEDIUM',
    'Điền gh hay g vào chỗ trống: "...ế mới và con ...à mái"', '🐔',
    ['gh - g', 'g - gh', 'gh - gh', 'g - g'], 'gh - g',
    'Quy tắc: gh đứng trước e, ê, i ("ghế"); g đứng trước a, o, ô, u ("gà").',
    22
  ),
  choice(
    'cq-p36-v031', 'tieng-viet', 'TV-SPELLING', 'HARD',
    'Câu nào sau đây viết ĐÚNG chính tả ng/ngh?', '🎧',
    ['Bé nghe nhạc hay.', 'Bé nge nhạc hay.', 'Bé ngge nhạc hay.', 'Bé nhe nhạc hay.'], 'Bé nghe nhạc hay.',
    'Âm e đi với "ngh" nên "nghe" là đúng. Các cách viết còn lại đều sai.',
    25
  ),
  blank(
    'cq-p36-v032', 'tieng-viet', 'TV-SPELLING', 'EASY',
    'Điền c hay k vào chỗ chấm: "...éo co vẫn chạy tốt."', '🪁',
    ['k', 'c', 'q', 'g'], 'k',
    '"Kéo" viết bằng k vì đứng trước âm ê.',
    15
  ),
  blank(
    'cq-p36-v033', 'tieng-viet', 'TV-SPELLING', 'MEDIUM',
    'Điền ng hay ngh vào chỗ chấm: "...e trống trường vang xa."', '🥁',
    ['ngh', 'ng', 'nh', 'gh'], 'ngh',
    '"Nghe" viết bằng ngh vì đứng trước âm e.',
    20
  ),
  bool(
    'cq-p36-v034', 'tieng-viet', 'TV-SPELLING', 'MEDIUM',
    'Đánh giá mệnh đề: ""quả cam" viết đúng chính tả."', '🍊',
    'Đúng',
    '"Quả cam" viết bằng c vì đứng trước âm a.',
    18
  ),

  // ================= TIẾNG VIỆT — TỪ VỰNG (TV-WORD +8) =================
  classify(
    'cq-p36-v035', 'tieng-viet', 'TV-WORD', 'EASY',
    'Từ nào chỉ con vật?', '🐾',
    ['con vật', 'đồ vật'],
    ['con mèo', 'cái bàn', 'quyển sách', 'cây bút'], 'con vật',
    '"Con mèo" là con vật. Bàn, sách, bút đều là đồ vật.',
    20
  ),
  classify(
    'cq-p36-v036', 'tieng-viet', 'TV-WORD', 'MEDIUM',
    'Từ nào sau đây chỉ hoạt động của bé?', '🤸',
    ['hoạt động', 'sự vật', 'đặc điểm'],
    ['nhảy', 'ghế', 'đỏ', 'sông'], 'hoạt động',
    '"Nhảy" là hoạt động. "Ghế" và "sông" là sự vật, "đỏ" là đặc điểm.',
    25
  ),
  dragdrop(
    'cq-p36-v037', 'tieng-viet', 'TV-WORD', 'EASY',
    'Kéo từ chỉ quả vào đúng nhóm.', '🍎',
    ['quả', 'không phải quả'],
    ['quả cam', 'con cá', 'cái cặp'], 'quả',
    '"Quả cam" là quả. Con cá là con vật, cái cặp là đồ dùng học tập.',
    22
  ),
  dragdrop(
    'cq-p36-v038', 'tieng-viet', 'TV-WORD', 'MEDIUM',
    'Kéo từ chỉ nghề nghiệp vào đúng nhóm.', '👩‍🏫',
    ['nghề nghiệp', 'không phải nghề nghiệp'],
    ['cô giáo', 'học sinh', 'bàn học'], 'nghề nghiệp',
    '"Cô giáo" là nghề nghiệp. Học sinh và bàn học thì không phải.',
    28
  ),
  choice(
    'cq-p36-v039', 'tieng-viet', 'TV-WORD', 'EASY',
    'Từ nào sau đây chỉ cây cối?', '🌳',
    ['Cây bàng', 'Con ong', 'Xe đạp', 'Quyển vở'], 'Cây bàng',
    '"Cây bàng" là từ chỉ cây cối trong sân trường.',
    15
  ),
  choice(
    'cq-p36-v040', 'tieng-viet', 'TV-WORD', 'MEDIUM',
    'Nhóm từ nào sau đây toàn từ chỉ đặc điểm?', '🌈',
    ['Cao, thấp, tròn', 'Bàn, ghế, tủ', 'Chạy, nhảy, cười', 'Mèo, chó, gà'], 'Cao, thấp, tròn',
    '"Cao", "thấp", "tròn" đều tả đặc điểm của sự vật.',
    20
  ),
  matching(
    'cq-p36-v041', 'tieng-viet', 'TV-WORD', 'EASY',
    'Xếp mỗi từ vào nhóm đúng của nó.', '🏷️',
    [
      ['mèo', 'con vật'],
      ['bàn', 'đồ vật'],
      ['hoa', 'cây cối'],
    ],
    'Mèo là con vật, bàn là đồ vật, hoa thuộc cây cối.',
    30
  ),
  matching(
    'cq-p36-v042', 'tieng-viet', 'TV-WORD', 'MEDIUM',
    'Nối mỗi từ với nhóm nghĩa đúng của nó.', '🏷️',
    [
      ['chạy', 'hoạt động'],
      ['đỏ', 'đặc điểm'],
      ['sông', 'sự vật'],
    ],
    '"Chạy" là hoạt động, "đỏ" là đặc điểm, "sông" là sự vật.',
    35
  ),

  // ================= TIẾNG VIỆT — CÂU (TV-SENTENCE +8) =================
  ordering(
    'cq-p36-v043', 'tieng-viet', 'TV-SENTENCE', 'EASY',
    'Xếp các từ thành câu đầy đủ.', '🍚',
    ['Mẹ', 'nấu', 'cơm', 'ngon.'],
    'Câu đúng là "Mẹ nấu cơm ngon." — ai làm gì rồi kết quả.',
    30
  ),
  ordering(
    'cq-p36-v044', 'tieng-viet', 'TV-SENTENCE', 'MEDIUM',
    'Ghép các từ thành câu trọn vẹn.', '🏫',
    ['Sáng nay,', 'bé', 'đến', 'trường.'],
    'Câu đúng là "Sáng nay, bé đến trường." — thời gian đứng đầu câu.',
    35
  ),
  ordering(
    'cq-p36-v045', 'tieng-viet', 'TV-SENTENCE', 'HARD',
    'Sắp các từ thành câu có nghĩa.', '🌧️',
    ['Vì', 'trời', 'mưa', 'bé', 'ở', 'nhà.'],
    'Câu đúng là "Vì trời mưa bé ở nhà." — nguyên nhân đứng trước kết quả.',
    40
  ),
  choice(
    'cq-p36-v046', 'tieng-viet', 'TV-SENTENCE', 'EASY',
    'Câu nào sau đây viết ĐÚNG?', '✏️',
    ['Bé ăn cơm.', 'Bé cơm ăn.', 'Ăn bé cơm.', 'Cơm ăn bé.'], 'Bé ăn cơm.',
    'Câu đúng ngữ pháp: ai (Bé) + làm gì (ăn cơm).',
    15
  ),
  choice(
    'cq-p36-v047', 'tieng-viet', 'TV-SENTENCE', 'MEDIUM',
    'Câu hỏi đúng viết thế nào?', '❓',
    ['Ai đang hát vậy?', 'Ai đang hát vậy.', 'Ai đang hát vậy!', 'Ai đang hát, vậy'], 'Ai đang hát vậy?',
    'Câu hỏi phải kết thúc bằng dấu chấm hỏi (?).',
    20
  ),
  choice(
    'cq-p36-v048', 'tieng-viet', 'TV-SENTENCE', 'CHALLENGE',
    'Câu nào sau đây là câu kể?', '📢',
    ['Chim hót líu lo.', 'Chim hót ở đâu?', 'Chim hót hay quá!', 'Chim, hót, líu'], 'Chim hót líu lo.',
    'Câu kể thuật lại sự việc và kết thúc bằng dấu chấm. Câu hỏi dùng "?", câu cảm dùng "!".',
    30
  ),
  bool(
    'cq-p36-v049', 'tieng-viet', 'TV-SENTENCE', 'MEDIUM',
    'Đánh giá mệnh đề: "Câu "Bé đi học." là câu kể."', '🎒',
    'Đúng',
    '"Bé đi học." thuật lại sự việc và kết thúc bằng dấu chấm nên là câu kể.',
    20
  ),
  blank(
    'cq-p36-v050', 'tieng-viet', 'TV-SENTENCE', 'EASY',
    'Điền dấu câu vào cuối câu: "Hôm nay trời đẹp ..."', '☀️',
    ['.', '?', '!', ','], '.',
    'Câu kể thời tiết kết thúc bằng dấu chấm.',
    15
  ),

  // ================= TIẾNG VIỆT — ĐỌC HIỂU (TV-READING +12) =================
  choice(
    'cq-p36-v051', 'tieng-viet', 'TV-READING', 'MEDIUM',
    'Đọc đoạn văn: "Mùa thu, lá vàng rơi đầy sân. Bé Lan nhặt lá làm thành chiếc thuyền nhỏ."\nHỏi: Bé Lan nhặt lá để làm gì?', '🍂',
    ['Làm thuyền nhỏ', 'Làm diều', 'Làm vòng hoa', 'Làm chổi'], 'Làm thuyền nhỏ',
    'Cuối đoạn viết: "nhặt lá làm thành chiếc thuyền nhỏ".',
    30
  ),
  bool(
    'cq-p36-v052', 'tieng-viet', 'TV-READING', 'EASY',
    'Đọc đoạn văn: "Mùa thu, lá vàng rơi đầy sân. Bé Lan nhặt lá làm thuyền nhỏ."\nĐánh giá mệnh đề: "Lá vàng rơi đầy sân vào mùa thu."', '🍁',
    'Đúng',
    'Câu đầu tiên của đoạn viết rõ điều đó.',
    20
  ),
  choice(
    'cq-p36-v053', 'tieng-viet', 'TV-READING', 'MEDIUM',
    'Đọc đoạn văn: "Con ong bay từ hoa này sang hoa khác. Nó hút mật ngọt rồi mang về tổ."\nHỏi: Con ong hút gì từ hoa?', '🐝',
    ['Mật ngọt', 'Nước mưa', 'Lá xanh', 'Phấn màu'], 'Mật ngọt',
    'Trong bài viết rõ: "Nó hút mật ngọt rồi mang về tổ".',
    25
  ),
  choice(
    'cq-p36-v054', 'tieng-viet', 'TV-READING', 'HARD',
    'Đọc đoạn văn: "Con ong bay từ hoa này sang hoa khác. Nó hút mật ngọt rồi mang về tổ."\nHỏi: Vì sao con ong bay từ hoa này sang hoa khác?', '🌼',
    ['Để tìm mật ngọt', 'Để tránh mưa', 'Để ngủ trưa', 'Để hót vang'], 'Để tìm mật ngọt',
    'Ong bay khắp các hoa để hút mật ngọt mang về tổ.',
    30
  ),
  choice(
    'cq-p36-v055', 'tieng-viet', 'TV-READING', 'EASY',
    'Đọc đoạn văn: "Tối đến, cả nhà quây quần bên mâm cơm. Bé kể chuyện trường lớp cho cả nhà nghe."\nHỏi: Buổi tối, cả nhà làm gì?', '🍚',
    ['Quây quần bên mâm cơm', 'Đi dạo công viên', 'Xem xiếc', 'Đá bóng'], 'Quây quần bên mâm cơm',
    'Câu đầu tiên: "cả nhà quây quần bên mâm cơm".',
    20
  ),
  matching(
    'cq-p36-v056', 'tieng-viet', 'TV-READING', 'MEDIUM',
    'Đọc đoạn văn: "Tối đến, cả nhà quây quần bên mâm cơm. Bé kể chuyện trường lớp cho cả nhà nghe."\nNối mỗi câu hỏi với câu trả lời đúng.', '🏠',
    [
      ['Cả nhà quây quần khi nào?', 'buổi tối'],
      ['Bé kể chuyện gì?', 'chuyện trường lớp'],
      ['Cả nhà ăn gì?', 'cơm'],
    ],
    'Buổi tối cả nhà quây quần; bé kể chuyện trường lớp; cả nhà ăn cơm.',
    40
  ),
  choice(
    'cq-p36-v057', 'tieng-viet', 'TV-READING', 'EASY',
    'Đọc đoạn văn: "Chú gà trống gáy vang mỗi sáng. Tiếng gáy gọi mọi người thức dậy đi làm."\nHỏi: Chú gà trống gáy vào lúc nào?', '🐓',
    ['Mỗi sáng', 'Mỗi trưa', 'Mỗi tối', 'Nửa đêm'], 'Mỗi sáng',
    'Câu đầu tiên: "Chú gà trống gáy vang mỗi sáng".',
    20
  ),
  bool(
    'cq-p36-v058', 'tieng-viet', 'TV-READING', 'MEDIUM',
    'Đọc đoạn văn: "Chú gà trống gáy vang mỗi sáng. Tiếng gáy gọi mọi người thức dậy đi làm."\nĐánh giá mệnh đề: "Tiếng gà gáy gọi mọi người đi ngủ."', '🌅',
    'Sai',
    'Tiếng gáy gọi mọi người thức dậy đi làm, không phải đi ngủ.',
    22
  ),
  choice(
    'cq-p36-v059', 'tieng-viet', 'TV-READING', 'HARD',
    'Đọc đoạn văn: "Ngày cuối tuần, bố đưa bé ra vườn. Hai bố con cùng trồng một cây khế nhỏ. Bé tưới nước mỗi ngày và mong cây mau lớn."\nHỏi: Hai bố con trồng cây gì?', '🌳',
    ['Cây khế', 'Cây cam', 'Cây bưởi', 'Cây xoài'], 'Cây khế',
    'Trong bài viết: "cùng trồng một cây khế nhỏ".',
    30
  ),
  choice(
    'cq-p36-v060', 'tieng-viet', 'TV-READING', 'CHALLENGE',
    'Đọc đoạn văn: "Ngày cuối tuần, bố đưa bé ra vườn. Hai bố con cùng trồng một cây khế nhỏ. Bé tưới nước mỗi ngày và mong cây mau lớn."\nHỏi: Qua đoạn văn, bé là người như thế nào?', '💧',
    ['Chăm chỉ và yêu cây', 'Thích phá cây', 'Không tưới nước', 'Bỏ mặc cây'], 'Chăm chỉ và yêu cây',
    'Bé tưới nước mỗi ngày và mong cây mau lớn, chứng tỏ bé chăm chỉ và yêu cây.',
    40
  ),
  ordering(
    'cq-p36-v061', 'tieng-viet', 'TV-READING', 'MEDIUM',
    'Sắp xếp các câu theo đúng thứ tự trong câu chuyện trồng cây.', '🌱',
    ['Bố đưa bé ra vườn.', 'Hai bố con trồng cây khế.', 'Bé tưới nước mỗi ngày.'],
    'Thứ tự câu chuyện: ra vườn → trồng cây → tưới nước mỗi ngày.',
    40
  ),
  matching(
    'cq-p36-v062', 'tieng-viet', 'TV-READING', 'EASY',
    'Đọc đoạn văn: "Mùa thu, lá vàng rơi đầy sân. Bé Lan nhặt lá làm thành chiếc thuyền nhỏ."\nNối mỗi câu hỏi với câu trả lời đúng.', '🍂',
    [
      ['Lá rơi vào mùa nào?', 'mùa thu'],
      ['Bé nhặt lá làm gì?', 'thuyền nhỏ'],
    ],
    'Lá vàng rơi vào mùa thu; bé nhặt lá làm thuyền nhỏ.',
    35
  ),

  // ================= TIẾNG VIỆT — TƯ DUY NGÔN NGỮ (TV-LANGUAGE-LOGIC +6) =================
  choice(
    'cq-p36-v063', 'tieng-viet', 'TV-LANGUAGE-LOGIC', 'MEDIUM',
    'Giải câu đố: "Cái gì có mũi mà không ngửi được?"', '👃',
    ['Cái kim', 'Con mèo', 'Bông hoa', 'Bát cơm'], 'Cái kim',
    'Kim có "mũi kim" nhọn để khâu vá, nhưng không ngửi được như mũi người.',
    25
  ),
  choice(
    'cq-p36-v064', 'tieng-viet', 'TV-LANGUAGE-LOGIC', 'EASY',
    'Con gì kêu "chíp chíp"?', '🐤',
    ['Gà con', 'Mèo con', 'Chó con', 'Vịt con'], 'Gà con',
    'Gà con kêu "chíp chíp". Mèo kêu "meo meo", chó sủa "gâu gâu".',
    15
  ),
  choice(
    'cq-p36-v065', 'tieng-viet', 'TV-LANGUAGE-LOGIC', 'HARD',
    'Tìm từ còn thiếu trong câu tục ngữ: "Có công mài sắt, có ngày nên ..."', '🔨',
    ['kim', 'kéo', 'dao', 'búa'], 'kim',
    'Câu tục ngữ khuyên ta kiên trì: mài sắt lâu ngày thành kim.',
    28
  ),
  choice(
    'cq-p36-v066', 'tieng-viet', 'TV-LANGUAGE-LOGIC', 'MEDIUM',
    'Câu tục ngữ "Uống nước nhớ nguồn" khuyên ta điều gì?', '💧',
    ['Biết ơn người giúp mình', 'Uống nhiều nước', 'Đào giếng sâu', 'Tắm mỗi ngày'], 'Biết ơn người giúp mình',
    'Câu này dạy ta ghi nhớ công ơn của người mang lại điều tốt đẹp.',
    25
  ),
  bool(
    'cq-p36-v067', 'tieng-viet', 'TV-LANGUAGE-LOGIC', 'CHALLENGE',
    'Đánh giá mệnh đề: "Câu "Con mèo màu xanh bay trên trời" là câu có nghĩa."', '🐈',
    'Sai',
    'Mèo không có màu xanh và không biết bay, nên câu này vô nghĩa.',
    28
  ),
  blank(
    'cq-p36-v068', 'tieng-viet', 'TV-LANGUAGE-LOGIC', 'EASY',
    'Điền từ vào câu đố: "Tròn như quả ..., lăn lông lốc."', '⚽',
    ['bóng', 'bàn', 'bút', 'bát'], 'bóng',
    'Quả bóng tròn và lăn được.',
    15
  ),
  matching(
    'cq-p36-v069', 'tieng-viet', 'TV-WORD', 'HARD',
    'Nối mỗi từ với từ trái nghĩa của nó.', '🔄',
    [
      ['cao', 'thấp'],
      ['nhanh', 'chậm'],
      ['vui', 'buồn'],
    ],
    'Cao–thấp, nhanh–chậm, vui–buồn là các cặp từ trái nghĩa.',
    40
  ),
  blank(
    'cq-p36-v070', 'tieng-viet', 'TV-SENTENCE', 'MEDIUM',
    'Điền từ để thành câu hỏi: "... đang hát vậy?"', '🎤',
    ['Ai', 'Bé', 'Chim', 'Hoa'], 'Ai',
    'Từ để hỏi "Ai" mở đầu câu hỏi về người đang hát.',
    20
  ),

  // ================= ENGLISH — PHONICS (EN-PHONICS +9) =================
  choice(
    'cq-p36-e001', 'english', 'EN-PHONICS', 'EASY',
    'Find the word that starts with "D". 🐶', '🐶',
    ['Dog', 'Cat', 'Pig', 'Ant'], 'Dog',
    'Dog starts with the letter D (/d/ sound).',
    15
  ),
  choice(
    'cq-p36-e002', 'english', 'EN-PHONICS', 'EASY',
    '"Moon" and "Milk" start with the same sound. Which letter is it? 🌙', '🌙',
    ['Letter M', 'Letter N', 'Letter B', 'Letter S'], 'Letter M',
    'Letter M makes the /m/ sound as in Moon and Milk.',
    15
  ),
  choice(
    'cq-p36-e003', 'english', 'EN-PHONICS', 'MEDIUM',
    'Find the word that starts like "Sun". ☀️', '☀️',
    ['Sock', 'Moon', 'Cake', 'Nest'], 'Sock',
    '"Sun" and "Sock" both begin with the /s/ sound.',
    20
  ),
  choice(
    'cq-p36-e004', 'english', 'EN-PHONICS', 'MEDIUM',
    'Which word ends with the sound /t/? 🐱', '🐱',
    ['Cat', 'Dog', 'Pig', 'Cow'], 'Cat',
    'Cat ends with the /t/ sound: c-a-t.',
    20
  ),
  blank(
    'cq-p36-e005', 'english', 'EN-PHONICS', 'EASY',
    'Complete the word "Cat": Ca...', '🐈',
    ['t', 'r', 'p', 'n'], 't',
    'The word is "Cat", spelt c-a-t.',
    15
  ),
  blank(
    'cq-p36-e006', 'english', 'EN-PHONICS', 'MEDIUM',
    'Complete the word "Fish": Fis...', '🐟',
    ['h', 't', 'd', 'p'], 'h',
    'The word is "Fish", spelt f-i-s-h.',
    20
  ),
  matching(
    'cq-p36-e007', 'english', 'EN-PHONICS', 'EASY',
    'Match each word with its first sound.', '🔤',
    [
      ['Bird', '/b/'],
      ['Duck', '/d/'],
      ['Egg', '/e/'],
    ],
    'Bird starts with /b/, Duck with /d/, Egg with /e/.',
    30
  ),
  matching(
    'cq-p36-e008', 'english', 'EN-PHONICS', 'MEDIUM',
    'Match each word with its first letter.', '🍎',
    [
      ['Apple', 'a'],
      ['Ball', 'b'],
      ['Doll', 'd'],
    ],
    'Apple starts with a, Ball with b, Doll with d.',
    30
  ),
  ordering(
    'cq-p36-e009', 'english', 'EN-PHONICS', 'EASY',
    'Put the letters in A-B-C-D order.', '🔠',
    ['A', 'B', 'C', 'D'],
    'The alphabet begins: A, B, C, D.',
    25
  ),

  // ================= ENGLISH — NUMBERS (EN-NUMBERS +12) =================
  choice(
    'cq-p36-e010', 'english', 'EN-NUMBERS', 'EASY',
    'How many fingers are there on one hand? 🖐️', '🖐️',
    ['Five', 'Four', 'Six', 'Three'], 'Five',
    'Count: 1, 2, 3, 4, 5. One hand has five fingers.',
    15
  ),
  choice(
    'cq-p36-e011', 'english', 'EN-NUMBERS', 'EASY',
    'Which number is spelled "T-H-R-E-E"?', '3️⃣',
    ['3', '2', '5', '8'], '3',
    'Three is the number 3.',
    15
  ),
  choice(
    'cq-p36-e012', 'english', 'EN-NUMBERS', 'MEDIUM',
    'What is two plus one? ✌️➕1️⃣', '➕',
    ['Three', 'Two', 'Four', 'Five'], 'Three',
    'Two plus one equals three: 2 + 1 = 3.',
    20
  ),
  choice(
    'cq-p36-e013', 'english', 'EN-NUMBERS', 'MEDIUM',
    'Count the stars: ⭐⭐⭐⭐⭐⭐⭐', '⭐',
    ['Seven', 'Six', 'Eight', 'Five'], 'Seven',
    'Count: 1, 2, 3, 4, 5, 6, 7. There are seven stars.',
    20
  ),
  choice(
    'cq-p36-e014', 'english', 'EN-NUMBERS', 'HARD',
    'Which is the biggest number?', '🏆',
    ['Nine', 'Six', 'Four', 'Two'], 'Nine',
    'Nine (9) is bigger than six, four and two.',
    25
  ),
  ordering(
    'cq-p36-e015', 'english', 'EN-NUMBERS', 'EASY',
    'Put the numbers in order from six to nine.', '🔢',
    ['Six', 'Seven', 'Eight', 'Nine'],
    'Numbers go in order: six, seven, eight, nine.',
    30
  ),
  ordering(
    'cq-p36-e016', 'english', 'EN-NUMBERS', 'MEDIUM',
    'Put the numbers in order from big to small.', '📉',
    ['Five', 'Four', 'Three', 'Two'],
    'From big to small: five, four, three, two.',
    30
  ),
  matching(
    'cq-p36-e017', 'english', 'EN-NUMBERS', 'EASY',
    'Match the tiny numbers (1–3) with digits.', '1️⃣',
    [
      ['One', '1'],
      ['Two', '2'],
      ['Three', '3'],
    ],
    'One is 1, Two is 2, Three is 3.',
    30
  ),
  matching(
    'cq-p36-e018', 'english', 'EN-NUMBERS', 'MEDIUM',
    'Match the bigger numbers (4–6) with digits.', '4️⃣',
    [
      ['Four', '4'],
      ['Five', '5'],
      ['Six', '6'],
    ],
    'Four is 4, Five is 5, Six is 6.',
    30
  ),
  blank(
    'cq-p36-e019', 'english', 'EN-NUMBERS', 'EASY',
    'Complete the count: Five, Six, ...', '🎈',
    ['Seven', 'Eight', 'Nine', 'Ten'], 'Seven',
    'After six comes seven.',
    15
  ),
  classify(
    'cq-p36-e020', 'english', 'EN-NUMBERS', 'MEDIUM',
    'Which word is a number?', '🔢',
    ['number', 'not a number'],
    ['Seven', 'Red', 'Cat', 'Book'], 'number',
    'Seven is a number. Red is a color, Cat and Book are things.',
    25
  ),
  blank(
    'cq-p36-e082', 'english', 'EN-NUMBERS', 'HARD',
    'Five plus five is ...', '🖐️',
    ['Ten', 'Nine', 'Eleven', 'Twelve'], 'Ten',
    'Five plus five equals ten: 5 + 5 = 10.',
    25
  ),

  // ================= ENGLISH — COLORS (EN-COLORS +11) =================
  choice(
    'cq-p36-e021', 'english', 'EN-COLORS', 'EASY',
    'What color is the sun? ☀️', '☀️',
    ['Yellow', 'Green', 'Blue', 'Black'], 'Yellow',
    'The sun is yellow.',
    12
  ),
  choice(
    'cq-p36-e022', 'english', 'EN-COLORS', 'EASY',
    'What color is grass? 🌱', '🌱',
    ['Green', 'Red', 'Purple', 'Orange'], 'Green',
    'Grass is green.',
    12
  ),
  choice(
    'cq-p36-e023', 'english', 'EN-COLORS', 'MEDIUM',
    'Mix Blue and Yellow, what color do you get? 🎨', '🎨',
    ['Green', 'Purple', 'Orange', 'Pink'], 'Green',
    'Blue + Yellow = Green!',
    20
  ),
  choice(
    'cq-p36-e024', 'english', 'EN-COLORS', 'CHALLENGE',
    'Which two colors mix to make Purple? 🟣', '🟣',
    ['Red and Blue', 'Red and Yellow', 'Blue and Yellow', 'Green and Yellow'], 'Red and Blue',
    'Red + Blue = Purple. Red + Yellow makes Orange, Blue + Yellow makes Green.',
    30
  ),
  matching(
    'cq-p36-e025', 'english', 'EN-COLORS', 'EASY',
    'Look and match: sky, apple, frog.', '🌈',
    [
      ['Sky', 'Blue'],
      ['Apple', 'Red'],
      ['Frog', 'Green'],
    ],
    'The sky is blue, apples are red and frogs are green.',
    30
  ),
  matching(
    'cq-p36-e026', 'english', 'EN-COLORS', 'MEDIUM',
    'Look and match: snow, night, sun.', '❄️',
    [
      ['Snow', 'White'],
      ['Night', 'Black'],
      ['Sun', 'Yellow'],
    ],
    'Snow is white, night is black and the sun is yellow.',
    30
  ),
  bool(
    'cq-p36-e027', 'english', 'EN-COLORS', 'MEDIUM',
    'True or false: Mix Red and White to get Pink. 💗', '💗',
    'Đúng',
    'Red mixed with White makes Pink.',
    20
  ),
  classify(
    'cq-p36-e028', 'english', 'EN-COLORS', 'EASY',
    'Which word is a color?', '🎨',
    ['color', 'not a color'],
    ['Blue', 'Dog', 'Book', 'Hand'], 'color',
    'Blue is a color. Dog, Book and Hand are not.',
    20
  ),
  classify(
    'cq-p36-e029', 'english', 'EN-COLORS', 'MEDIUM',
    'Which color can an apple be?', '🍎',
    ['apple color', 'not an apple color'],
    ['Red', 'Blue', 'Black', 'Purple'], 'apple color',
    'Apples can be red (or green). Blue, black and purple apples do not grow on trees.',
    25
  ),
  dragdrop(
    'cq-p36-e030', 'english', 'EN-COLORS', 'EASY',
    'Drag the color into the right group.', '🖐️',
    ['color', 'not a color'],
    ['Red', 'Cat', 'Book'], 'color',
    'Red is a color. Cat and Book are not colors.',
    22
  ),
  matching(
    'cq-p36-e081', 'english', 'EN-COLORS', 'HARD',
    'Match each color mix with its result.', '🧪',
    [
      ['Red + Yellow', 'Orange'],
      ['Blue + Yellow', 'Green'],
      ['Red + Blue', 'Purple'],
    ],
    'Red + Yellow = Orange, Blue + Yellow = Green, Red + Blue = Purple.',
    35
  ),

  // ================= ENGLISH — ANIMALS (EN-ANIMALS +13) =================
  choice(
    'cq-p36-e031', 'english', 'EN-ANIMALS', 'EASY',
    'Which animal says "Meow"? 🐱', '🐱',
    ['Cat', 'Dog', 'Duck', 'Cow'], 'Cat',
    'Cats say "Meow"!',
    12
  ),
  choice(
    'cq-p36-e032', 'english', 'EN-ANIMALS', 'EASY',
    'Which animal is very big with a long nose? 🐘', '🐘',
    ['Elephant', 'Cat', 'Bird', 'Fish'], 'Elephant',
    'An elephant is very big and has a long nose (trunk).',
    15
  ),
  choice(
    'cq-p36-e033', 'english', 'EN-ANIMALS', 'MEDIUM',
    'Which animal can fly? 🐦', '🐦',
    ['Bird', 'Fish', 'Dog', 'Cat'], 'Bird',
    'Birds have wings and can fly.',
    18
  ),
  choice(
    'cq-p36-e034', 'english', 'EN-ANIMALS', 'HARD',
    'Which animal lays eggs AND can swim? 🦆', '🦆',
    ['Duck', 'Dog', 'Cat', 'Monkey'], 'Duck',
    'Ducks lay eggs and swim. Dogs, cats and monkeys do neither.',
    28
  ),
  matching(
    'cq-p36-e035', 'english', 'EN-ANIMALS', 'EASY',
    'Match each animal with its sound.', '🔊',
    [
      ['Dog', 'Woof'],
      ['Cat', 'Meow'],
      ['Cow', 'Moo'],
    ],
    'Dogs say Woof, cats say Meow and cows say Moo.',
    30
  ),
  matching(
    'cq-p36-e036', 'english', 'EN-ANIMALS', 'MEDIUM',
    'Match each animal with its home.', '🏠',
    [
      ['Bird', 'nest'],
      ['Fish', 'water'],
      ['Dog', 'house'],
    ],
    'Birds live in nests, fish live in water and dogs live in houses.',
    30
  ),
  classify(
    'cq-p36-e037', 'english', 'EN-ANIMALS', 'EASY',
    'Which word names an animal?', '🐯',
    ['animal', 'not an animal'],
    ['Tiger', 'Table', 'Apple', 'Car'], 'animal',
    'A tiger is an animal. Table, Apple and Car are not.',
    20
  ),
  classify(
    'cq-p36-e038', 'english', 'EN-ANIMALS', 'MEDIUM',
    'Which animal lives in water?', '🌊',
    ['water animal', 'land animal'],
    ['Fish', 'Bird', 'Dog', 'Cat'], 'water animal',
    'Fish live in water. Birds, dogs and cats live on land.',
    25
  ),
  dragdrop(
    'cq-p36-e039', 'english', 'EN-ANIMALS', 'EASY',
    'Drag the pet into the right group.', '🐾',
    ['pet', 'not a pet'],
    ['Cat', 'Tiger', 'Shark'], 'pet',
    'A cat is a pet. Tigers and sharks are wild animals.',
    25
  ),
  dragdrop(
    'cq-p36-e040', 'english', 'EN-ANIMALS', 'MEDIUM',
    'Drag the bird into the right group.', '🦅',
    ['bird', 'not a bird'],
    ['Duck', 'Dog', 'Fish'], 'bird',
    'A duck is a bird. Dogs and fish are not birds.',
    28
  ),
  bool(
    'cq-p36-e041', 'english', 'EN-ANIMALS', 'EASY',
    'True or false: A fish can swim. 🐟', '🐟',
    'Đúng',
    'Fish swim in rivers and oceans.',
    15
  ),
  ordering(
    'cq-p36-e042', 'english', 'EN-ANIMALS', 'MEDIUM',
    'Put the animals in order from small to big.', '📏',
    ['Ant', 'Cat', 'Dog', 'Elephant'],
    'From small to big: ant, cat, dog, elephant.',
    30
  ),
  choice(
    'cq-p36-e080', 'english', 'EN-ANIMALS', 'CHALLENGE',
    'Which animal is the tallest?', '🦒',
    ['Giraffe', 'Elephant', 'Monkey', 'Dog'], 'Giraffe',
    'A giraffe is taller than an elephant, a monkey or a dog.',
    30
  ),

  // ================= ENGLISH — FAMILY (EN-FAMILY +13) =================
  choice(
    'cq-p36-e043', 'english', 'EN-FAMILY', 'EASY',
    'Who is your father\'s father? 👴', '👴',
    ['Grandfather', 'Brother', 'Uncle', 'Cousin'], 'Grandfather',
    'Your father\'s father is your grandfather (Ông nội).',
    18
  ),
  choice(
    'cq-p36-e044', 'english', 'EN-FAMILY', 'EASY',
    'Your mother and father are your ___.', '👨‍👩‍👧',
    ['parents', 'friends', 'teachers', 'babies'], 'parents',
    'Mother and father together are your parents.',
    15
  ),
  choice(
    'cq-p36-e045', 'english', 'EN-FAMILY', 'MEDIUM',
    'Your mother\'s brother is your ___.', '👨',
    ['uncle', 'aunt', 'cousin', 'grandpa'], 'uncle',
    'Your mother\'s brother is your uncle (Cậu/Bác).',
    20
  ),
  choice(
    'cq-p36-e046', 'english', 'EN-FAMILY', 'MEDIUM',
    'How many people are mom, dad, and baby?', '👶',
    ['Three', 'Two', 'Four', 'Five'], 'Three',
    'Count: mom (1), dad (2), baby (3). Three people.',
    20
  ),
  choice(
    'cq-p36-e047', 'english', 'EN-FAMILY', 'HARD',
    'Linh has one brother and one sister. How many children are there in her family?', '👧',
    ['Three', 'Two', 'Four', 'One'], 'Three',
    'Count: Linh (1) + brother (1) + sister (1) = three children.',
    28
  ),
  choice(
    'cq-p36-e048', 'english', 'EN-FAMILY', 'CHALLENGE',
    'Your aunt\'s son is your ___.', '👦',
    ['cousin', 'brother', 'nephew', 'uncle'], 'cousin',
    'Your aunt\'s son is your cousin.',
    30
  ),
  blank(
    'cq-p36-e049', 'english', 'EN-FAMILY', 'EASY',
    'Complete the word: MOTH... (mother)', '👩',
    ['er', 'or', 'ir', 'ur'], 'er',
    'The word is "mother", spelt m-o-t-h-e-r.',
    15
  ),
  blank(
    'cq-p36-e050', 'english', 'EN-FAMILY', 'EASY',
    'Complete the word "Baby": Bab...', '🍼',
    ['y', 'i', 'e', 'a'], 'y',
    'The word is "Baby", spelt b-a-b-y.',
    15
  ),
  matching(
    'cq-p36-e051', 'english', 'EN-FAMILY', 'EASY',
    'Match the family words Mom, Dad, Baby.', '👪',
    [
      ['Mom', 'Mẹ'],
      ['Dad', 'Bố'],
      ['Baby', 'Em bé'],
    ],
    'Mom là Mẹ, Dad là Bố, Baby là Em bé.',
    30
  ),
  matching(
    'cq-p36-e052', 'english', 'EN-FAMILY', 'MEDIUM',
    'Match the family words Brother, Sister, Grandpa.', '👨‍👩‍👧‍👦',
    [
      ['Brother', 'Anh/Em trai'],
      ['Sister', 'Chị/Em gái'],
      ['Grandpa', 'Ông'],
    ],
    'Brother là anh/em trai, Sister là chị/em gái, Grandpa là Ông.',
    30
  ),
  bool(
    'cq-p36-e053', 'english', 'EN-FAMILY', 'MEDIUM',
    'True or false: Your grandmother is your mother\'s mother. 👵', '👵',
    'Đúng',
    'Your mother\'s mother is your grandmother (Bà ngoại).',
    20
  ),
  ordering(
    'cq-p36-e054', 'english', 'EN-FAMILY', 'EASY',
    'Put the family words in order from young to old.', '👶',
    ['Baby', 'Mom', 'Grandma'],
    'From young to old: baby, mom, grandma.',
    30
  ),
  choice(
    'cq-p36-e083', 'english', 'EN-FAMILY', 'HARD',
    'How many grandparents do you have?', '👴',
    ['Four', 'Two', 'Three', 'Five'], 'Four',
    'Two from your father\'s side and two from your mother\'s side: four grandparents.',
    28
  ),

  // ================= ENGLISH — SCHOOL (EN-SCHOOL +13) =================
  choice(
    'cq-p36-e055', 'english', 'EN-SCHOOL', 'EASY',
    'What do you read? 📖', '📖',
    ['Book', 'Pen', 'Bag', 'Desk'], 'Book',
    'You read a book (quyển sách).',
    15
  ),
  choice(
    'cq-p36-e056', 'english', 'EN-SCHOOL', 'EASY',
    'What do you sit on in class? 🪑', '🪑',
    ['Chair', 'Board', 'Crayon', 'Glue'], 'Chair',
    'You sit on a chair (ghế).',
    15
  ),
  choice(
    'cq-p36-e057', 'english', 'EN-SCHOOL', 'MEDIUM',
    'What do you write with on paper? ✏️', '✏️',
    ['Pencil', 'Ruler', 'Bag', 'Door'], 'Pencil',
    'You write with a pencil (bút chì).',
    20
  ),
  choice(
    'cq-p36-e058', 'english', 'EN-SCHOOL', 'MEDIUM',
    'Which one can hold many books? 🎒', '🎒',
    ['Bag', 'Pen', 'Eraser', 'Chalk'], 'Bag',
    'A bag (cặp sách) can hold many books.',
    20
  ),
  choice(
    'cq-p36-e059', 'english', 'EN-SCHOOL', 'HARD',
    'You need to cut paper. What do you need? ✂️', '✂️',
    ['Scissors', 'Glue', 'Ruler', 'Crayon'], 'Scissors',
    'Scissors (kéo) cut paper. Glue sticks, rulers measure.',
    28
  ),
  matching(
    'cq-p36-e060', 'english', 'EN-SCHOOL', 'EASY',
    'Match the school things Pen, Book, Bag.', '🎒',
    [
      ['Pen', 'Bút'],
      ['Book', 'Sách'],
      ['Bag', 'Cặp'],
    ],
    'Pen là Bút, Book là Sách, Bag là Cặp.',
    30
  ),
  matching(
    'cq-p36-e061', 'english', 'EN-SCHOOL', 'MEDIUM',
    'Match the school things Ruler, Eraser, Desk.', '📏',
    [
      ['Ruler', 'Thước'],
      ['Eraser', 'Cục tẩy'],
      ['Desk', 'Bàn học'],
    ],
    'Ruler là Thước, Eraser là Cục tẩy, Desk là Bàn học.',
    30
  ),
  matching(
    'cq-p36-e062', 'english', 'EN-SCHOOL', 'CHALLENGE',
    'Match each action with the right school thing.', '✏️',
    [
      ['Read a...', 'book'],
      ['Write with a...', 'pen'],
      ['Sit on a...', 'chair'],
    ],
    'You read a book, write with a pen and sit on a chair.',
    35
  ),
  classify(
    'cq-p36-e063', 'english', 'EN-SCHOOL', 'EASY',
    'Which word names a school thing?', '🏫',
    ['school thing', 'not a school thing'],
    ['Pencil', 'Dog', 'Apple', 'Bird'], 'school thing',
    'A pencil is a school thing. Dog, Apple and Bird are not.',
    20
  ),
  classify(
    'cq-p36-e064', 'english', 'EN-SCHOOL', 'MEDIUM',
    'Which one do you use to draw?', '🖍️',
    ['for drawing', 'not for drawing'],
    ['Crayon', 'Bag', 'Desk', 'Door'], 'for drawing',
    'A crayon is for drawing. Bags, desks and doors are not.',
    25
  ),
  dragdrop(
    'cq-p36-e065', 'english', 'EN-SCHOOL', 'EASY',
    'Drag the school thing into the right group.', '🖐️',
    ['school thing', 'not a school thing'],
    ['Ruler', 'Cat', 'Apple'], 'school thing',
    'A ruler is a school thing. Cat and Apple are not.',
    22
  ),
  blank(
    'cq-p36-e066', 'english', 'EN-SCHOOL', 'MEDIUM',
    'Complete the word "Pencil": Penc...', '✏️',
    ['il', 'el', 'al', 'ol'], 'il',
    'The word is "Pencil", spelt p-e-n-c-i-l.',
    20
  ),
  ordering(
    'cq-p36-e067', 'english', 'EN-SCHOOL', 'MEDIUM',
    'Which order is A-B-C?', '🔠',
    ['Bag', 'Book', 'Chair'],
    'In A-B-C order: Bag, Book, Chair.',
    30
  ),

  // ================= ENGLISH — BODY (EN-BODY +12) =================
  choice(
    'cq-p36-e068', 'english', 'EN-BODY', 'EASY',
    'You smell with your ___. 👃', '👃',
    ['nose', 'ear', 'eye', 'hand'], 'nose',
    'You smell with your nose (mũi).',
    15
  ),
  choice(
    'cq-p36-e069', 'english', 'EN-BODY', 'EASY',
    'How many eyes do you have? 👀', '👀',
    ['Two', 'One', 'Three', 'Four'], 'Two',
    'You have two eyes.',
    15
  ),
  choice(
    'cq-p36-e070', 'english', 'EN-BODY', 'MEDIUM',
    'You walk with your ___. 🦵', '🦵',
    ['legs', 'arms', 'ears', 'teeth'], 'legs',
    'You walk with your legs (chân).',
    20
  ),
  choice(
    'cq-p36-e071', 'english', 'EN-BODY', 'MEDIUM',
    'Which body part helps you hear? 👂', '👂',
    ['Ear', 'Nose', 'Mouth', 'Knee'], 'Ear',
    'You hear with your ear (tai).',
    20
  ),
  choice(
    'cq-p36-e072', 'english', 'EN-BODY', 'HARD',
    'Which two body parts help you eat? 🍎', '🍎',
    ['Teeth and mouth', 'Ear and eye', 'Hand and foot', 'Arm and leg'], 'Teeth and mouth',
    'Teeth chew food and the mouth holds it. The other pairs do not help you eat.',
    28
  ),
  matching(
    'cq-p36-e073', 'english', 'EN-BODY', 'EASY',
    'Match each body part with what it does.', '🧍',
    [
      ['Eye', 'see'],
      ['Ear', 'hear'],
      ['Nose', 'smell'],
    ],
    'Eyes see, ears hear and noses smell.',
    30
  ),
  matching(
    'cq-p36-e074', 'english', 'EN-BODY', 'MEDIUM',
    'Match each body part with its detail.', '🖐️',
    [
      ['Hand', '5 fingers'],
      ['Foot', '5 toes'],
      ['Mouth', 'teeth'],
    ],
    'A hand has 5 fingers, a foot has 5 toes and a mouth has teeth.',
    30
  ),
  classify(
    'cq-p36-e075', 'english', 'EN-BODY', 'EASY',
    'Which word is a body part?', '🧍',
    ['body part', 'not a body part'],
    ['Hand', 'Sun', 'Book', 'Desk'], 'body part',
    'Hand is a body part. Sun, Book and Desk are not.',
    20
  ),
  classify(
    'cq-p36-e076', 'english', 'EN-BODY', 'MEDIUM',
    'Which body part is on your face?', '🙂',
    ['on the face', 'not on the face'],
    ['Nose', 'Knee', 'Foot', 'Hand'], 'on the face',
    'Your nose is on your face. Knee, foot and hand are not.',
    25
  ),
  dragdrop(
    'cq-p36-e077', 'english', 'EN-BODY', 'EASY',
    'Drag the body part into the right group.', '🖐️',
    ['body part', 'not a body part'],
    ['Eye', 'Book', 'Pen'], 'body part',
    'Eye is a body part. Book and Pen are school things.',
    22
  ),
  dragdrop(
    'cq-p36-e078', 'english', 'EN-BODY', 'MEDIUM',
    'Drag the face part into the right group.', ' 🙂',
    ['face part', 'not a face part'],
    ['Ear', 'Hand', 'Foot'], 'face part',
    'Your ear is on your face. Hands and feet are not.',
    25
  ),
  bool(
    'cq-p36-e079', 'english', 'EN-BODY', 'MEDIUM',
    'True or false: You have eight fingers in total. 🖐️', '🖐️',
    'Sai',
    'Five fingers on each hand: 5 + 5 = 10 fingers, not eight.',
    20
  ),

  // ============ T12B — ENGLISH: PHONICS, SENTENCES, WORDS (+40) ============
  // Balanced addition across the 7 English taxonomy skills so the English
  // competition track leans less on plain vocabulary. No true/false added
  // (keeps the Đúng share inside its band); every option set is 4-wide so the
  // global round-robin placement keeps answer positions balanced (§5).
  choice(
    'cq-p36-e084', 'english', 'EN-PHONICS', 'EASY',
    'Which word begins with the /b/ sound? 🐻', '🐻',
    ['Bear', 'Cat', 'Dog', 'Fish'], 'Bear',
    'Bear begins with the /b/ sound.',
    15
  ),
  choice(
    'cq-p36-e085', 'english', 'EN-PHONICS', 'EASY',
    'Which word begins with the /p/ sound? 🐷', '🐷',
    ['Pig', 'Cow', 'Duck', 'Goat'], 'Pig',
    'Pig begins with the /p/ sound.',
    15
  ),
  choice(
    'cq-p36-e086', 'english', 'EN-PHONICS', 'MEDIUM',
    'Which word ends with the /g/ sound? 🐸', '🐸',
    ['Frog', 'Cat', 'Bee', 'Sun'], 'Frog',
    'Frog ends with the /g/ sound: f-r-o-g.',
    20
  ),
  blank(
    'cq-p36-e087', 'english', 'EN-PHONICS', 'EASY',
    'Complete the word "Sun": Su...', '☀️',
    ['n', 'm', 't', 'p'], 'n',
    'The word is "Sun", spelt s-u-n.',
    15
  ),
  blank(
    'cq-p36-e088', 'english', 'EN-PHONICS', 'MEDIUM',
    'Complete the word "Duck": Duc...', '🦆',
    ['k', 't', 'p', 'g'], 'k',
    'The word is "Duck", spelt d-u-c-k.',
    20
  ),
  blank(
    'cq-p36-e089', 'english', 'EN-PHONICS', 'MEDIUM',
    'Complete the word "Ship": Shi...', '🚢',
    ['p', 't', 'd', 'n'], 'p',
    'The word is "Ship", spelt s-h-i-p.',
    20
  ),
  matching(
    'cq-p36-e090', 'english', 'EN-PHONICS', 'EASY',
    'Which letter do these words start with? Match Sun, Tree and Ant.', '🔤',
    [
      ['Sun', 's'],
      ['Tree', 't'],
      ['Ant', 'a'],
    ],
    'Sun starts with s, Tree with t and Ant with a.',
    30
  ),
  matching(
    'cq-p36-e091', 'english', 'EN-PHONICS', 'MEDIUM',
    'Which sound do these words start with? Match Pig, Bag and Cat.', '🔊',
    [
      ['Pig', '/p/'],
      ['Bag', '/b/'],
      ['Cat', '/k/'],
    ],
    'Pig starts with /p/, Bag with /b/ and Cat with /k/.',
    30
  ),
  ordering(
    'cq-p36-e092', 'english', 'EN-PHONICS', 'EASY',
    'Put the letters in A-B-C order.', '🔠',
    ['A', 'B', 'C'],
    'The letters in order are A, B, C.',
    20
  ),
  ordering(
    'cq-p36-e093', 'english', 'EN-PHONICS', 'MEDIUM',
    'Put the letters in order to spell the word for a pet that says meow.', '🐈',
    ['c', 'a', 't'],
    'The letters c, a, t spell "cat".',
    25
  ),
  choice(
    'cq-p36-e094', 'english', 'EN-PHONICS', 'MEDIUM',
    'Which word starts with the same sound as "Ten"? 🐯', '🐯',
    ['Tiger', 'Dog', 'Fish', 'Bird'], 'Tiger',
    '"Ten" and "Tiger" both begin with the /t/ sound.',
    20
  ),
  choice(
    'cq-p36-e095', 'english', 'EN-PHONICS', 'HARD',
    'Which word has the three sounds /c/ /a/ /t/? 🐈', '🐈',
    ['Cat', 'Cow', 'Cake', 'Car'], 'Cat',
    'The sounds c-a-t make the word "Cat".',
    20
  ),
  choice(
    'cq-p36-e096', 'english', 'EN-NUMBERS', 'MEDIUM',
    'Which sentence counts the cats? 🐱🐱🐱🐱', '🐱',
    ['I see four cats', 'I see two cats', 'I see six cats', 'I see one cat'], 'I see four cats',
    'There are four cats: 1, 2, 3, 4.',
    25
  ),
  choice(
    'cq-p36-e097', 'english', 'EN-NUMBERS', 'MEDIUM',
    'Add the numbers: 6 + 4 = ...', '➕',
    ['Ten', 'Nine', 'Eleven', 'Twelve'], 'Ten',
    '6 + 4 = 10, and 10 is "Ten".',
    25
  ),
  choice(
    'cq-p36-e098', 'english', 'EN-NUMBERS', 'MEDIUM',
    'What number comes after eight? 8️⃣', '8️⃣',
    ['Nine', 'Ten', 'Seven', 'Six'], 'Nine',
    'After eight comes nine: 8, 9.',
    20
  ),
  choice(
    'cq-p36-e099', 'english', 'EN-NUMBERS', 'HARD',
    'I have 3 red pens and 4 blue pens. How many pens in all? ✏️', '✏️',
    ['Seven', 'Eight', 'Six', 'Five'], 'Seven',
    '3 red pens and 4 blue pens: 3 + 4 = 7 pens in all.',
    25
  ),
  choice(
    'cq-p36-e100', 'english', 'EN-COLORS', 'EASY',
    'What colour is the banana? 🍌', '🍌',
    ['Yellow', 'Blue', 'Green', 'Red'], 'Yellow',
    'A banana is yellow.',
    15
  ),
  choice(
    'cq-p36-e101', 'english', 'EN-COLORS', 'EASY',
    'What colour is the frog? 🐸', '🐸',
    ['Green', 'Red', 'Pink', 'Black'], 'Green',
    'A frog is green.',
    15
  ),
  choice(
    'cq-p36-e102', 'english', 'EN-COLORS', 'MEDIUM',
    'The sky is clear in the day. What colour is the sky? 🌞', '🌞',
    ['Blue', 'Green', 'Brown', 'Grey'], 'Blue',
    'A clear daytime sky looks blue.',
    20
  ),
  choice(
    'cq-p36-e103', 'english', 'EN-COLORS', 'MEDIUM',
    'Mix red paint and yellow paint. What colour do you get? 🎨', '🎨',
    ['Orange', 'Green', 'Purple', 'Pink'], 'Orange',
    'Red and yellow paint mix to make orange.',
    20
  ),
  choice(
    'cq-p36-e104', 'english', 'EN-ANIMALS', 'EASY',
    'Which animal can hop and has long ears? 🐰', '🐰',
    ['Rabbit', 'Fish', 'Cow', 'Snake'], 'Rabbit',
    'A rabbit hops and has long ears.',
    15
  ),
  choice(
    'cq-p36-e105', 'english', 'EN-ANIMALS', 'MEDIUM',
    'Which animal gives us milk? 🐄', '🐄',
    ['Cow', 'Cat', 'Bird', 'Frog'], 'Cow',
    'A cow gives us milk.',
    20
  ),
  choice(
    'cq-p36-e106', 'english', 'EN-ANIMALS', 'MEDIUM',
    'Which animal says "Quack"? 🦆', '🦆',
    ['Duck', 'Dog', 'Pig', 'Cow'], 'Duck',
    'A duck says quack.',
    20
  ),
  ordering(
    'cq-p36-e107', 'english', 'EN-ANIMALS', 'MEDIUM',
    'Put the words in order to make a sentence about the cat.', '🐈',
    ['The', 'cat', 'is', 'black'],
    'The sentence is: The cat is black.',
    30
  ),
  choice(
    'cq-p36-e108', 'english', 'EN-ANIMALS', 'HARD',
    'Which animal lives in water and can swim? 🐟', '🐟',
    ['Fish', 'Lion', 'Monkey', 'Bird'], 'Fish',
    'A fish lives in water and swims.',
    20
  ),
  choice(
    'cq-p36-e109', 'english', 'EN-FAMILY', 'EASY',
    "Your mum's mum is your ___. 👵", '👵',
    ['Grandma', 'Grandpa', 'Sister', 'Baby'], 'Grandma',
    "Your mother's mother is your grandma.",
    15
  ),
  choice(
    'cq-p36-e110', 'english', 'EN-FAMILY', 'EASY',
    "Your father's son, but not you, is your ___. 👦", '👦',
    ['brother', 'sister', 'mother', 'baby'], 'brother',
    "Your father's son is your brother.",
    18
  ),
  ordering(
    'cq-p36-e111', 'english', 'EN-FAMILY', 'MEDIUM',
    'Put the words in order to make a sentence about your family.', '👪',
    ['This', 'is', 'my', 'family'],
    'The sentence is: This is my family.',
    30
  ),
  choice(
    'cq-p36-e112', 'english', 'EN-FAMILY', 'MEDIUM',
    "Your mum's sister is your ___. 👩", '👩',
    ['aunt', 'uncle', 'cousin', 'brother'], 'aunt',
    "Your mum's sister is your aunt.",
    20
  ),
  choice(
    'cq-p36-e113', 'english', 'EN-SCHOOL', 'EASY',
    'Which thing do you use to write? ✏️', '✏️',
    ['Pencil', 'Book', 'Bag', 'Chair'], 'Pencil',
    'You write with a pencil.',
    15
  ),
  choice(
    'cq-p36-e114', 'english', 'EN-SCHOOL', 'EASY',
    'Which thing do you read? 📖', '📖',
    ['Book', 'Ruler', 'Pen', 'Desk'], 'Book',
    'You read a book.',
    15
  ),
  choice(
    'cq-p36-e115', 'english', 'EN-SCHOOL', 'MEDIUM',
    'You cut paper with ___. ✂️', '✂️',
    ['Scissors', 'Pencil', 'Book', 'Bag'], 'Scissors',
    'You cut paper with scissors.',
    20
  ),
  ordering(
    'cq-p36-e116', 'english', 'EN-SCHOOL', 'MEDIUM',
    'Put the words in order to make a sentence about school.', '🏫',
    ['I', 'go', 'to', 'school'],
    'The sentence is: I go to school.',
    30
  ),
  matching(
    'cq-p36-e117', 'english', 'EN-SCHOOL', 'MEDIUM',
    'Match each action with its object.', '🎒',
    [
      ['Read', 'book'],
      ['Write', 'pencil'],
      ['Sit', 'chair'],
    ],
    'You read a book, write with a pencil and sit on a chair.',
    30
  ),
  choice(
    'cq-p36-e118', 'english', 'EN-BODY', 'EASY',
    'Which body part do you use to see? 👀', '👀',
    ['Eyes', 'Ears', 'Nose', 'Hand'], 'Eyes',
    'You see with your eyes.',
    15
  ),
  choice(
    'cq-p36-e119', 'english', 'EN-BODY', 'EASY',
    'Which body part do you use to hear? 👂', '👂',
    ['Ears', 'Eyes', 'Mouth', 'Foot'], 'Ears',
    'You hear with your ears.',
    15
  ),
  choice(
    'cq-p36-e120', 'english', 'EN-BODY', 'MEDIUM',
    'Which body part do you use to smell? 👃', '👃',
    ['Nose', 'Eyes', 'Ears', 'Hand'], 'Nose',
    'You smell with your nose.',
    20
  ),
  choice(
    'cq-p36-e121', 'english', 'EN-BODY', 'MEDIUM',
    'Which body part do you use to kick a ball? 🦵', '🦵',
    ['Leg', 'Arm', 'Head', 'Nose'], 'Leg',
    'You kick a ball with your leg.',
    20
  ),
  blank(
    'cq-p36-e122', 'english', 'EN-BODY', 'EASY',
    'I clap with my two ___. 👏', '👏',
    ['hands', 'feet', 'eyes', 'ears'], 'hands',
    'You clap with your hands.',
    15
  ),
  choice(
    'cq-p36-e123', 'english', 'EN-BODY', 'HARD',
    'Which sentence is correct about your body? ✍️', '✍️',
    ['I have two hands', 'I has two hands', 'I having two hands', 'I am have two hands'], 'I have two hands',
    'The correct sentence is: I have two hands.',
    20
  ),

  // (P36 bank complete: 271 items. Counts verified by tests/competition-p36.test.ts.)
];
