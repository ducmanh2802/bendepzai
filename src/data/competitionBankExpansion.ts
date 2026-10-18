import { CompetitionQuestion } from '../types/competition';

/**
 * COMPETITION BANK — EXPANSION 2
 *
 * Purpose: deepen coverage of the Grade-1 competition bank.
 *  - lifts the six skills that only had 2 items
 *  - adds question-type variety to skills that were multiple-choice only
 *    (ordering for patterns/sequences/measurement, matching for phonics/rhyme)
 *  - adds CHALLENGE-difficulty items across every subject, which the previous
 *    bank was almost entirely missing
 *
 * SAFETY: canonical answers for matching / ordering / classify are COMPUTED by
 * the builders below, never hand-typed. An earlier hand-written matching item
 * shipped with a truncated answer key; generating them makes that class of bug
 * structurally impossible.
 */

// ---------------------------------------------------------------- builders --

type Pair = [left: string, right: string];

// P36 §5 — deterministic answer-position rebalancing for builder-made items.
// Legacy hand-written items in this file clustered the correct answer at
// options[0] ("always pick A" exploit). Each choice builder below rotates its
// options so the correct answer lands on a round-robin target position,
// per options-length class, in file order. Pure permutation: grading (which
// is value-based) and explanations are untouched.
const positionCounters: Record<number, number> = {};

function placeAnswer(options: string[], answer: string): string[] {
  const n = options.length;
  const current = options.indexOf(answer);
  if (current < 0 || n < 2) return [...options];
  const target = (positionCounters[n] ?? 0) % n;
  positionCounters[n] = (positionCounters[n] ?? 0) + 1;
  const shift = (current - target + n) % n;
  return options.map((_, i) => options[(i + shift) % n]);
}

function base(
  id: string,
  skillId: string,
  topic: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  explanation: string,
  estimatedSeconds: number
) {
  return { id, skillId, topic, difficulty, prompt, explanation, estimatedSeconds } as const;
}

/** Single-choice question. `answer` must be one of `options`. */
function choice(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  options: string[],
  answer: string,
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  return {
    ...base(id, skillId, topic, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'multiple-choice',
    version: 1,
    mediaEmoji,
    options: placeAnswer(options, answer),
    correctAnswer: answer,
  };
}

/** True/False question. */
function bool(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  answer: 'Đúng' | 'Sai',
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  return {
    ...base(id, skillId, topic, difficulty, prompt, explanation, estimatedSeconds),
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
  topic: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  options: string[],
  answer: string,
  accepted: string[] | undefined,
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  return {
    ...base(id, skillId, topic, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'fill-blank',
    version: 1,
    mediaEmoji,
    options: placeAnswer(options, answer),
    correctAnswer: answer,
    ...(accepted ? { acceptedAnswers: accepted } : {}),
  };
}

/** Matching question. The answer key is derived from `pairs`, so it cannot drift. */
function matching(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  pairs: Pair[],
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  return {
    ...base(id, skillId, topic, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'matching',
    version: 1,
    mediaEmoji,
    options: pairs.map(([, right]) => right),
    matchingPairs: pairs.map(([left, right]) => ({ left, right })),
    correctAnswer: pairs.map(([left, right]) => `${left}=${right}`).join('|'),
  };
}

/**
 * Ordering question. `order` is the correct sequence; the visible tiles are a
 * deterministic rotation of it, so tiles and answer key always agree.
 */
function ordering(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  order: string[],
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  const shift = order.length > 2 ? 2 : 1;
  const tiles = [...order.slice(shift), ...order.slice(0, shift)];
  return {
    ...base(id, skillId, topic, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'ordering',
    version: 1,
    mediaEmoji,
    options: tiles,
    orderingItems: [...order],
    correctAnswer: order.join('|'),
  };
}

/** Classify / drag-and-drop question. The answer is always a bucket label. */
function classify(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: string,
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  mediaEmoji: string,
  buckets: string[],
  options: string[],
  answer: string,
  explanation: string,
  estimatedSeconds: number
): CompetitionQuestion {
  return {
    ...base(id, skillId, topic, difficulty, prompt, explanation, estimatedSeconds),
    subject,
    questionType: 'classify',
    version: 1,
    mediaEmoji,
    options,
    categoryBuckets: buckets,
    correctAnswer: answer,
  };
}

// ----------------------------------------------------------------- content --

export const EXPANSION_QUESTIONS: CompetitionQuestion[] = [
  // ======================= TOÁN — GIẢI TOÁN (từ 2 → 7) =======================
  ordering(
    'cq-math-w01',
    'toan',
    'MATH-WORD-PROBLEM',
    'Giải toán',
    'EASY',
    'Sắp xếp các câu thành một bài toán có lời văn đúng trình tự.',
    '🧩',
    [
      'Lan có 5 viên kẹo.',
      'Mẹ cho Lan thêm 3 viên kẹo.',
      'Lan ăn 2 viên kẹo.',
      'Lan còn 6 viên kẹo.',
    ],
    'Bài toán bắt đầu bằng số đang có, rồi tăng thêm, rồi bớt đi, cuối cùng mới cho kết quả: 5 + 3 - 2 = 6.',
    45
  ),
  choice(
    'cq-math-w02',
    'toan',
    'MATH-WORD-PROBLEM',
    'Giải toán',
    'HARD',
    'Thùng có 12 chai nước. Bé lấy ra 5 chai để phát cho các bạn. Hỏi thùng còn bao nhiêu chai?',
    '🥤',
    ['7 chai', '5 chai', '17 chai', '8 chai'],
    '7 chai',
    'Bài toán nói "lấy ra" nghĩa là bớt đi: 12 - 5 = 7 chai.',
    30
  ),
  bool(
    'cq-math-w03',
    'toan',
    'MATH-WORD-PROBLEM',
    'Giải toán',
    'MEDIUM',
    'Đánh giá mệnh đề: "Bé có 8 quyển sách, mượn thêm 3 quyển thì bé có 5 quyển sách."',
    '📚',
    'Sai',
    'Mượn thêm là tăng lên: 8 + 3 = 11 quyển, không phải 5 quyển.',
    22
  ),
  matching(
    'cq-math-w04',
    'toan',
    'MATH-WORD-PROBLEM',
    'Giải toán',
    'MEDIUM',
    'Nối mỗi câu toán có lời văn với phép tính cần dùng.',
    '🔢',
    [
      ['Bé có 4 bút chì, mua thêm 4 bút chì', '+'],
      ['Trên cây có 9 chim, 3 chim bay đi', '-'],
    ],
    'Có thêm thì cộng, bớt đi thì trừ.',
    40
  ),
  choice(
    'cq-math-w05',
    'toan',
    'MATH-WORD-PROBLEM',
    'Giải toán',
    'CHALLENGE',
    'Một số quả cam, bớt đi 4 quả thì còn 7 quả. Hỏi lúc đầu có bao nhiêu quả cam?',
    '🍊',
    ['11 quả', '3 quả', '10 quả', '12 quả'],
    '11 quả',
    'Bớt đi 4 quả còn 7 quả, vậy lúc đầu có 7 + 4 = 11 quả.',
    35
  ),

  // ======================= TOÁN — QUY LUẬT (từ 2 → 6) =======================
  ordering(
    'cq-math-p01',
    'toan',
    'MATH-PATTERN',
    'Tư duy logic',
    'CHALLENGE',
    'Sắp xếp quy luật theo thứ tự đúng: mỗi lần thêm một hình mới vào cuối dãy.',
    '🔺',
    ['🔺', '⭐', '🔺 ⭐', '⭐ ⭐', '🔺 ⭐ ⭐', '⭐ ⭐ ⭐'],
    'Dãy dài dần theo quy luật: mỗi bước thêm một hình, nên vị trí sau luôn dài hơn vị trí trước.',
    45
  ),
  matching(
    'cq-math-p02',
    'toan',
    'MATH-PATTERN',
    'Tư duy logic',
    'MEDIUM',
    'Nối mỗi quy luật với hình tiếp theo của nó.',
    '🎨',
    [
      ['🔴 🔵', '🔴'],
      ['🟢 🟢 🟡', '🟢'],
      ['⭐ 🌙 ⭐', '🌙'],
    ],
    'Mỗi quy luật lặp lại cụm của nó: cặp thì về đầu, bộ ba thì về đầu, xen kẽ thì đổi chỗ.',
    40
  ),
  choice(
    'cq-math-p03',
    'toan',
    'MATH-PATTERN',
    'Tư duy logic',
    'EASY',
    'Quy luật: ⭐ ⭐ 🌙 ⭐ ⭐ ... Hình tiếp theo là gì?',
    '⭐',
    ['🌙', '⭐', '⭐ ⭐', '🌙 🌙'],
    '🌙',
    'Mỗi cụm gồm 2 ngôi sao rồi 1 trăng, lặp lại: ⭐ ⭐ 🌙. Sau hai ngôi sao là trăng.',
    20
  ),
  choice(
    'cq-math-p04',
    'toan',
    'MATH-PATTERN',
    'Tư duy logic',
    'HARD',
    'Quy luật số: 1, 3, 5, 7, ... Số tiếp theo là số nào?',
    '📈',
    ['9', '8', '11', '10'],
    '9',
    'Dãy số lẻ tăng dần 2 đơn vị mỗi lần: 1, 3, 5, 7, 9.',
    20
  ),

  // ======================= TOÁN — DÃY SỐ (từ 2 → 5) =======================
  ordering(
    'cq-math-s01',
    'toan',
    'MATH-SEQUENCE',
    'Số học',
    'MEDIUM',
    'Sắp xếp các số theo thứ tự tăng dần.',
    '📊',
    ['10', '20', '30', '40', '50'],
    'Số nhỏ đứng trước, số lớn đứng sau: 10 → 20 → 30 → 40 → 50.',
    35
  ),
  matching(
    'cq-math-s02',
    'toan',
    'MATH-SEQUENCE',
    'Số học',
    'MEDIUM',
    'Nối mỗi dãy số với số tiếp theo của dãy đó.',
    '🔁',
    [
      ['2, 4, 6', '8'],
      ['10, 9, 8', '7'],
      ['1, 2, 3, 4', '5'],
    ],
    'Dãy cộng 2 đi tiếp; dãy trừ 1 đi tiếp; dãy đếm tăng 1.',
    35
  ),
  bool(
    'cq-math-s03',
    'toan',
    'MATH-SEQUENCE',
    'Số học',
    'EASY',
    'Đánh giá mệnh đề: "Dãy số 20, 18, 16, 14 giảm dần mỗi bước 2 đơn vị."',
    '📉',
    'Đúng',
    '20 → 18 → 16 → 14, mỗi bước bớt 2 đơn vị nên dãy giảm dần.',
    18
  ),

  // ======================= TOÁN — ĐO LƯỜNG (từ 3 → 7) =======================
  ordering(
    'cq-math-me01',
    'toan',
    'MATH-MEASUREMENT',
    'Đại lượng',
    'EASY',
    'Sắp xếp các đồ vật theo thứ tự từ ngắn đến dài.',
    '📏',
    ['Cục tẩy', 'Bút chì', 'Thước kẻ', 'Cán cửa'],
    'Từ nhỏ đến lớn: cục tẩy ngắn nhất, cán cửa dài nhất.',
    35
  ),
  matching(
    'cq-math-me02',
    'toan',
    'MATH-MEASUREMENT',
    'Đại lượng',
    'MEDIUM',
    'Nối mỗi đồ vật với cách đo phù hợp của nó.',
    '⚖️',
    [
      ['Bàn học dài', 'gang tay'],
      ['Sân trường rộng', 'bước chân'],
      ['Bút chì ngắn', 'xentimét'],
    ],
    'Bàn học đo bằng gang tay, sân trường đo bằng bước chân, bút chì đo bằng xentimét.',
    35
  ),
  bool(
    'cq-math-me03',
    'toan',
    'MATH-MEASUREMENT',
    'Đại lượng',
    'EASY',
    'Đánh giá mệnh đề: "1 mét dài hơn 50 xentimét."',
    '📐',
    'Đúng',
    '1 mét = 100 xentimét, mà 100 xentimét lớn hơn 50 xentimét.',
    18
  ),
  choice(
    'cq-math-me04',
    'toan',
    'MATH-MEASUREMENT',
    'Đại lượng',
    'CHALLENGE',
    'Gói muối cân nặng 1 ki-lô-gam, gói đường cân nặng 2 ki-lô-gam. Hỏi gói muối nặng hơn hay nhẹ hơn gói đường?',
    '🍞',
    ['Nhẹ hơn', 'Nặng hơn', 'Bằng nhau', 'Không biết'],
    'Nhẹ hơn',
    '1 ki-lô-gam nhẹ hơn 2 ki-lô-gam, nên gói muối nhẹ hơn gói đường.',
    30
  ),

  // ======================= TOÁN — HÌNH HỌC (từ 3 → 5) =======================
  matching(
    'cq-math-sh01',
    'toan',
    'MATH-SHAPE',
    'Hình học',
    'EASY',
    'Nối mỗi hình với tên gọi đúng.',
    '🔺',
    [
      ['🔺', 'tam giác'],
      ['⬛', 'hình vuông'],
      ['⭕', 'hình tròn'],
      ['▬', 'hình chữ nhật'],
    ],
    'Ba cạnh khép kín là tam giác; bốn cạnh bằng nhau là hình vuông; méo cong đều là hình tròn.',
    30
  ),
  choice(
    'cq-math-sh02',
    'toan',
    'MATH-SHAPE',
    'Hình học',
    'HARD',
    'Hình nào có 4 cạnh và 4 góc vuông, trong đó hai cạnh đối bằng nhau nhưng không phải cả bốn?',
    '🟨',
    ['Hình chữ nhật', 'Hình vuông', 'Hình tròn', 'Hình tam giác'],
    'Hình chữ nhật',
    'Hình vuông có cả bốn cạnh bằng nhau. Hình chữ nhật chỉ có hai cạnh đối bằng nhau.',
    25
  ),

  // ======================= TOÁN — SỐ HỌC / SO SÁNH (top-up) =======================
  blank(
    'cq-math-n01',
    'toan',
    'MATH-NUMBER',
    'Số học',
    'MEDIUM',
    'Điền số vào chỗ chấm: số gồm 1 chục và 4 đơn vị là số ...',
    '🔟',
    ['14', '41', '4', '40'],
    '14',
    undefined,
    '1 chục = 10, thêm 4 đơn vị ta được số 14.',
    18
  ),
  choice(
    'cq-math-c01',
    'toan',
    'MATH-COMPARISON',
    'Số học',
    'CHALLENGE',
    'Chọn dấu thích hợp để điền vào chỗ chấm: 15 - 6 ... 3 + 7',
    '⚖️',
    ['<', '=', '>', 'Không so sánh được'],
    '<',
    '15 - 6 = 9 và 3 + 7 = 10. Vì 9 nhỏ hơn 10 nên dấu thích hợp là "<".',
    30
  ),

  // ======================= TOÁN — PHÉP CỘNG / PHÉP TRỪ =======================
  matching(
    'cq-math-a01',
    'toan',
    'MATH-ADDITION',
    'Phép tính',
    'EASY',
    'Nối mỗi phép cộng với kết quả đúng của nó.',
    '➕',
    [
      ['3 + 4', '7'],
      ['5 + 5', '10'],
      ['6 + 2', '8'],
      ['1 + 8', '9'],
    ],
    'Cộng lần lượt: 3 + 4 = 7, 5 + 5 = 10, 6 + 2 = 8, 1 + 8 = 9.',
    30
  ),
  ordering(
    'cq-math-a02',
    'toan',
    'MATH-ADDITION',
    'Phép tính',
    'HARD',
    'Sắp xếp các phép tính theo kết quả từ bé đến lớn.',
    '📈',
    ['1 + 1', '2 + 3', '3 + 4', '5 + 5'],
    'Kết quả lần lượt là 2, 5, 7, 10 — tăng dần nên xếp từ kết quả bé nhất.',
    40
  ),
  choice(
    'cq-math-a03',
    'toan',
    'MATH-ADDITION',
    'Phép tính',
    'MEDIUM',
    'Bé có 7 quả táo, mẹ cho thêm 5 quả. Hỏi bé có tổng cộng bao nhiêu quả táo?',
    '🍎',
    ['12 quả', '11 quả', '2 quả', '13 quả'],
    '12 quả',
    'Cho thêm là cộng: 7 + 5 = 12 quả.',
    20
  ),
  matching(
    'cq-math-sub01',
    'toan',
    'MATH-SUBTRACTION',
    'Phép tính',
    'EASY',
    'Nối mỗi phép trừ với kết quả đúng của nó.',
    '➖',
    [
      ['9 - 3', '6'],
      ['8 - 5', '3'],
      ['7 - 2', '5'],
      ['6 - 4', '2'],
    ],
    'Trừ lần lượt: 9 - 3 = 6, 8 - 5 = 3, 7 - 2 = 5, 6 - 4 = 2.',
    30
  ),
  choice(
    'cq-math-sub02',
    'toan',
    'MATH-SUBTRACTION',
    'Phép tính',
    'CHALLENGE',
    'Trong chuồng có 14 con gà. Mẹ mua thêm 4 con gà nữa bỏ vào chuồng. Hỏi chuồng có tất cả bao nhiêu con?',
    '🐔',
    ['18 con', '10 con', '20 con', '11 con'],
    '18 con',
    '"Mua thêm" là cộng: 14 + 4 = 18 con.',
    30
  ),
  blank(
    'cq-math-sub03',
    'toan',
    'MATH-SUBTRACTION',
    'Phép tính',
    'MEDIUM',
    'Điền số vào chỗ chấm: 13 - 4 = ...',
    '🔢',
    ['9', '8', '7', '17'],
    '9',
    ['9', '9.'],
    '13 trừ 4: mượn 1 chục thành 3, 3 trừ 4 không trừ được nên 3 + 10 = 13 trừ 4 = 9.',
    20
  ),

  // ======================= TIẾNG VIỆT — NGỮ PHÁP / PHONEM (thêm dạng) =======================
  ordering(
    'cq-vn-se01',
    'tieng-viet',
    'TV-SENTENCE',
    'Ngữ pháp',
    'MEDIUM',
    'Sắp xếp các từ thành một câu có nghĩa.',
    '🐦',
    ['Con', 'chim', 'bay', 'lên', 'cành', 'cao.'],
    'Câu "Con chim bay lên cành cao." đúng trật tự chủ ngữ rồi vị ngữ rồi dấu kết thúc.',
    30
  ),
  bool(
    'cq-vn-se02',
    'tieng-viet',
    'TV-SENTENCE',
    'Ngữ pháp',
    'HARD',
    'Đánh giá mệnh đề: "Câu "Bàn ghế chạy nhảy" là một câu có nghĩa."',
    '🌳',
    'Sai',
    '"Bàn ghế" là đồ vật, không thể "chạy nhảy" như con người nên câu này vô nghĩa.',
    28
  ),
  choice(
    'cq-vn-ph01',
    'tieng-viet',
    'TV-PHONICS',
    'Ngữ âm',
    'MEDIUM',
    'Tiếng nào có âm đầu là "tr"?',
    '🚂',
    ['trâu', 'te', 'tư', 'thơ'],
    'trâu',
    'Tiếng "trâu" bắt đầu bằng âm đôi "tr". "Te" và "tư" chỉ có âm đầu "t", "thơ" có âm đầu "th".',
    25
  ),
  blank(
    'cq-vn-ph02',
    'tieng-viet',
    'TV-PHONICS',
    'Ngữ âm',
    'EASY',
    'Điền âm đầu thích hợp vào chỗ chấm: ...èo đang ngủ.',
    '🐈',
    ['M', 'C', 'G', 'T'],
    'M',
    undefined,
    '"Mèo" là mèo, nên âm đầu là chữ M viết hoa.',
    18
  ),

  // ======================= TƯ DUY LOGIC — BỔ SUNG =======================
  choice(
    'cq-math-l01',
    'toan',
    'MATH-LOGIC',
    'Tư duy logic',
    'HARD',
    'Bé có 3 hộp bánh. Mẹ cho Bé thêm 4 hộp bánh. Hỏi Bé có tất cả bao nhiêu hộp bánh?',
    '🥐',
    ['7 hộp', '6 hộp', '8 hộp', '12 hộp'],
    '7 hộp',
    'Tổng số hộp bánh: 3 + 4 = 7 hộp.',
    35
  ),
  bool(
    'cq-math-l02',
    'toan',
    'MATH-LOGIC',
    'Tư duy logic',
    'CHALLENGE',
    'Đánh giá mệnh đề: "Nếu hôm nay là thứ Hai thì ngày mai là thứ Sáu."',
    '📅',
    'Sai',
    'Sau thứ Hai là thứ Ba, không phải thứ Sáu.',
    22
  ),

  // ======================= TIẾNG VIỆT — VẦN (từ 2 → 5) =======================
  matching(
    'cq-vn-rh01',
    'tieng-viet',
    'TV-RHYME',
    'Cấu tạo từ',
    'EASY',
    'Nối tiếng ở cột trái với tiếng cùng vần ở cột phải.',
    '🎵',
    [
      ['mèo', 'nheo'],
      ['bếp', 'kép'],
      ['vàng', 'sáng'],
      ['đi', 'kì'],
    ],
    'Các tiếng cùng vần có phần vần giống nhau: mèo–nheo (vần eo), bếp–kép (vần ép), vàng–sáng (vần ang), đi–kì (vần i).',
    35
  ),
  ordering(
    'cq-vn-rh02',
    'tieng-viet',
    'TV-RHYME',
    'Cấu tạo từ',
    'MEDIUM',
    'Sắp xếp các từ thành câu đúng.',
    '🌳',
    ['Bé', 'Lan', 'quét', 'bàn.'],
    'Câu "Bé Lan quét bàn." đúng trật tự chủ ngữ rồi vị ngữ rồi dấu kết thúc.',
    35
  ),
  choice(
    'cq-vn-rh03',
    'tieng-viet',
    'TV-RHYME',
    'Cấu tạo từ',
    'CHALLENGE',
    'Tiếng nào KHÔNG cùng vần với "bát"?',
    '🍚',
    ['Cát', 'Hát', 'Nắng', 'Mát'],
    'Nắng',
    'Bát–cát–hát–mát cùng vần "at". "Nắng" có vần "ăng" nên không cùng vần.',
    30
  ),

  // ======================= TIẾNG VIỆT — ĐỌC HIỂU (từ 5 → 9) =======================
  bool(
    'cq-vn-r4',
    'tieng-viet',
    'TV-READING',
    'Đọc hiểu',
    'MEDIUM',
    'Đọc đoạn văn: "Chú chó vàng chạy nhanh trên bãi cỏ. Chú sủa vui và đuổi bóng bay."\nĐánh giá mệnh đề: "Chú chó vàng đuổi theo con mèo."',
    '🐕',
    'Sai',
    'Đoạn văn viết chú chó đuổi "bóng bay", không phải con mèo.',
    25
  ),
  matching(
    'cq-vn-r5',
    'tieng-viet',
    'TV-READING',
    'Đọc hiểu',
    'MEDIUM',
    'Đọc đoạn văn: "Cô Lan hái rau trong vườn. Hái xong cô rửa sạch rau và đem vào bếp nấu ăn."\nNối mỗi câu hỏi với câu trả lời đúng.',
    '🥬',
    [
      ['Cô Lan hái gì?', 'rau'],
      ['Cô Lan làm gì sau khi hái?', 'rửa rau'],
      ['Rau được đem đi đâu?', 'vào bếp'],
    ],
    'Câu 1 đáp "rau", câu 2 đáp "rửa rau", câu 3 đáp "vào bếp".',
    40
  ),
  choice(
    'cq-vn-r6',
    'tieng-viet',
    'TV-READING',
    'Đọc hiểu',
    'CHALLENGE',
    'Đọc đoạn văn: "Trời mưa. Bé Lan ngồi cạnh cửa sổ nhìn mưa rơi lên kính. Rồi mẹ mời Bé vẽ tranh về những giọt mưa."\nHỏi: Vì sao mẹ mời Bé vẽ tranh?',
    '🌧️',
    [
      'Vì Bé thích vẽ',
      'Vì mưa làm Bé buồn',
      'Vì Bé thấy mưa thú vị và muốn ghi lại',
      'Vì mẹ muốn Bé ngủ'
    ],
    'Vì Bé thấy mưa thú vị và muốn ghi lại',
    'Bé ngồi nhìn mưa thích thú rồi mẹ mời vẽ lại giọt mưa — Bé thấy cảnh đó thú vị.',
    40
  ),
  choice(
    'cq-vn-r7',
    'tieng-viet',
    'TV-READING',
    'Đọc hiểu',
    'MEDIUM',
    'Đọc đoạn văn: "Con mèo nhỏ ngủ trên chiếc ghế ấm. Nó thỉnh thoảng mở mắt nhìn chú chim đang hót ngoài cửa sổ."\nHỏi: Con mèo ngủ ở đâu?',
    '🐱',
    ['Trên chiếc ghế ấm', 'Dưới gầm bàn', 'Trên cây', 'Trong chuồng'],
    'Trên chiếc ghế ấm',
    'Câu đầu tiên: "Con mèo nhỏ ngủ trên chiếc ghế ấm."',
    25
  ),

  // ======================= TIẾNG VIỆT — CHÍNH TẢ (từ 4 → 6) =======================
  blank(
    'cq-vn-sp01',
    'tieng-viet',
    'TV-SPELLING',
    'Chính tả',
    'MEDIUM',
    'Điền chữ vào chỗ chấm cho đúng chính tả: "Bé dùng ... để vẽ bức tranh."',
    '🖍️',
    ['bút', 'mụt', 'mít', 'mất'],
    'bút',
    undefined,
    'Chỉ có "bút" tạo thành câu có nghĩa: "Bé dùng bút để vẽ bức tranh."',
    20
  ),
  choice(
    'cq-vn-sp02',
    'tieng-viet',
    'TV-SPELLING',
    'Chính tả',
    'CHALLENGE',
    'Từ nào viết ĐÚNG chính tả?',
    '📝',
    ['con dao', 'con đao', 'con dâp', 'con dáp'],
    'con dao',
    'Sau tiếng "con" là danh từ "dao", viết bằng hai chữ d và a.',
    30
  ),

  // ======================= TIẾNG VIỆT — NGỮ ÂM / CẤU TẠO TỪ (top-up) =======================
  choice(
    'cq-vn-to01',
    'tieng-viet',
    'TV-TONES',
    'Ngữ âm',
    'CHALLENGE',
    'Tiếng "chè" mang dấu thanh gì?',
    '🍵',
    ['Dấu huyền (\\)', 'Dấu sắc (/)', 'Dấu hỏi (?)', 'Dấu ngang'],
    'Dấu huyền (\\)',
    'Tiếng "chè" có dấu huyền trên âm ê.',
    18
  ),
  choice(
    'cq-vn-sy01',
    'tieng-viet',
    'TV-SYLLABLE',
    'Cấu tạo từ',
    'CHALLENGE',
    'Tiếng nào có âm đầu là "ngh"?',
    '🌾',
    ['nghè', 'ngô', 'ngoáy', 'ngoang'],
    'nghè',
    'Tiếng "nghè" bắt đầu bằng âm đôi "ngh". Các tiếng còn lại chỉ có âm đầu "ng".',
    25
  ),

  // ======================= TIẾNG VIỆT — TƯ DUY NGÔN NGỮ (từ 2 → 4) =======================
  choice(
    'cq-vn-lg01',
    'tieng-viet',
    'TV-LANGUAGE-LOGIC',
    'Tư duy logic',
    'MEDIUM',
    'Giải câu đố: "Trắng trắng thơm thơm, Ai đem xuống dưới ao?"',
    '🥛',
    ['Cánh cò', 'Cánh bồ câu', 'Bông tuyết', 'Con cá'],
    'Cánh bồ câu',
    'Cánh bồ câu trắng, thơm, thường bay xuống ao tìm thức ăn.',
    25
  ),
  bool(
    'cq-vn-lg02',
    'tieng-viet',
    'TV-LANGUAGE-LOGIC',
    'Tư duy logic',
    'CHALLENGE',
    'Đánh giá mệnh đề: "Tục ngữ "Ăn quả nhớ kẻ trồng cây" khuyên ta biết ơn người đã giúp mình."',
    '🌳',
    'Đúng',
    'Câu này dạy ta ghi nhớ và biết ơn kẻ đã trồng cây cho ta hái quả.',
    25
  ),

  // ======================= ENGLISH — PHONICS (từ 2 → 5) =======================
  matching(
    'cq-eng-ph01',
    'english',
    'EN-PHONICS',
    'Phonics',
    'EASY',
    'Match each word with the sound its first letter makes.',
    '🔤',
    [
      ['Cat', '/k/'],
      ['Sun', '/s/'],
      ['Moon', '/m/'],
      ['Pig', '/p/'],
    ],
    'Cat starts with /k/, Sun with /s/, Moon with /m/, Pig with /p/.',
    30
  ),
  blank(
    'cq-eng-ph02',
    'english',
    'EN-PHONICS',
    'Phonics',
    'EASY',
    'Complete the word: Do... (dog / doy)',
    '🐕',
    ['g', 'y', 'n', 't'],
    'g',
    undefined,
    'The word is "dog", spelt d-o-g.',
    20
  ),
  choice(
    'cq-eng-ph03',
    'english',
    'EN-PHONICS',
    'Phonics',
    'MEDIUM',
    'Which word has the same first sound as "Fish"?',
    '🐟',
    ['Fan', 'Nest', 'Sun', 'Cow'],
    'Fan',
    '"Fish" and "Fan" both begin with the /f/ sound.',
    25
  ),

  // ======================= ENGLISH — VOCABULARY (thêm CHALLENGE & đa dạng) =======================
  ordering(
    'cq-eng-nu01',
    'english',
    'EN-NUMBERS',
    'Vocabulary',
    'EASY',
    'Put the numbers in the correct order from one to five.',
    '🔢',
    ['One', 'Two', 'Three', 'Four', 'Five'],
    'Numbers go in order: one, two, three, four, five.',
    30
  ),
  bool(
    'cq-eng-co01',
    'english',
    'EN-COLORS',
    'Vocabulary',
    'MEDIUM',
    'True or false: The colour of a leaf is usually green. 🍃',
    '🍃',
    'Đúng',
    'Most leaves are green because of the chlorophyll inside them.',
    20
  ),
  classify(
    'cq-eng-an01',
    'english',
    'EN-ANIMALS',
    'Vocabulary',
    'MEDIUM',
    'Which word names a farm animal?',
    '🐄',
    ['farm animal', 'pet', 'wild animal'],
    ['Pig', 'Cat', 'Tiger'],
    'farm animal',
    'A pig lives on a farm. A cat is a pet and a tiger is a wild animal.',
    28
  ),
  choice(
    'cq-eng-fa01',
    'english',
    'EN-FAMILY',
    'Vocabulary',
    'CHALLENGE',
    'Your father\'s sister is your ___.',
    '👨‍👩‍👧',
    ['aunt', 'uncle', 'cousin', 'sister'],
    'aunt',
    'Your father\'s sister is your aunt. Your father\'s brother is your uncle.',
    30
  ),
  choice(
    'cq-eng-sc01',
    'english',
    'EN-SCHOOL',
    'Vocabulary',
    'MEDIUM',
    'What do you use to colour a picture with a pencil?',
    '🖍️',
    ['A crayon', 'A ruler', 'An eraser', 'A glue stick'],
    'A crayon',
    'A crayon is used to colour. A ruler measures, an eraser rubs out.',
    28
  ),
  choice(
    'cq-eng-bo01',
    'english',
    'EN-BODY',
    'Vocabulary',
    'CHALLENGE',
    'Which two words both name parts of your face?',
    '🖐️',
    ['Eye and nose', 'Hand and foot', 'Knee and ear', 'Arm and leg'],
    'Eye and nose',
    'Eyes and nose are both on your face. The other pairs mix face and limb parts.',
    32
  ),
];