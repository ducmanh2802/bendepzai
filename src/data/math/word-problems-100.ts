import type { Lesson, Question } from '../../types';
import { mathQ, mathLesson } from './factory';

/**
 * T11C — Mục 5 (spec T11 §5): Bài toán có lời văn 1 bước (thêm, bớt, gộp)
 * trong 100, KHÔNG nhớ.
 *
 * Nối thêm câu vào math-les-10 (giữ id cũ) và thêm math-les-21.
 * Hai câu cũ có phép tính có nhớ (14+9, 50 − 18) được sửa thành không nhớ
 * để đúng GDPT 2018 (giữ nguyên id, ghi trong báo cáo).
 */

/** math-les-10 "Toán thêm vào và bớt đi" — 4 câu cũ + 6 câu mới = 10 câu. */
export const MATH_LES10_EXTRA: Question[] = [
    mathQ('math-loi-van', {
      id: 'math-q10-5',
      type: 'true-false',
      difficulty: 2,
      skillId: 'math_word_problems',
      prompt:
        'Bạn có 20 que tính 📏. Mẹ cho thêm 15 que nữa. Bé có tất cả 35 que tính. Đúng hay Sai?',
      audioPrompt:
        'Bạn có hai mươi que tính. Mẹ cho thêm mười lăm que nữa. Bé có tất cả ba mươi lăm que tính. Đúng hay sai?',
      mediaEmoji: '📏',
      options: ['Đúng', 'Sai'],
      correctAnswer: 'Đúng',
      hint: 'Thử tính: 20 + 15 = 35.',
      explanation: 'Đúng rồi! 20 + 15 = 35 que tính.',
      calc: { a: 20, op: '+', b: 15 },
    }),
  mathQ('math-loi-van', {
    id: 'math-q10-6',
    type: 'multiple-choice',
    difficulty: 2,
    skillId: 'math_word_problems',
    prompt:
      'Trong vườn có 36 bông hoa 🌷. Em hái 16 bông để tặng cô. Còn lại mấy bông hoa?',
    audioPrompt:
      'Trong vườn có ba mươi sáu bông hoa. Em hái mười sáu bông để tặng cô. Còn lại mấy bông hoa?',
    mediaEmoji: '🌷',
    options: ['20 bông hoa', '22 bông hoa', '16 bông hoa', '30 bông hoa'],
    correctAnswer: '20 bông hoa',
    hint: 'Thấy "còn lại" thì làm phép trừ 36 − 16.',
    explanation: 'Đúng rồi! 36 − 16 = 20 bông hoa.',
    calc: { a: 36, op: '-', b: 16 },
  }),
  mathQ('math-loi-van', {
    id: 'math-q10-7',
    type: 'multiple-choice',
    difficulty: 3,
    skillId: 'math_word_problems',
    prompt:
      'Bà nội 45 quả trứng 🥚. Mẹ đem 15 quả để làm bánh. Còn lại mấy quả trứng?',
    audioPrompt:
      'Bà nội có bốn mươi lăm quả trứng. Mẹ đem mười lăm quả để làm bánh. Còn lại mấy quả trứng?',
    mediaEmoji: '🥚',
    options: ['30 quả trứng', '28 quả trứng', '35 quả trứng', '25 quả trứng'],
    correctAnswer: '30 quả trứng',
    hint: 'Lấy 45 trừ 15.',
    explanation: 'Chính xác! 45 − 15 = 30 quả trứng.',
    calc: { a: 45, op: '-', b: 15 },
  }),
  mathQ('math-loi-van', {
    id: 'math-q10-8',
    type: 'multiple-choice',
    difficulty: 3,
    skillId: 'math_word_problems',
    prompt:
      'Lớp 1A có 28 bạn 👫. Có 15 bạn thể dục ở sân, các bạn còn lại ngồi xem. Hỏi có mấy bạn ngồi xem?',
    audioPrompt:
      'Lớp 1A có hai mươi tám bạn. Có mười lăm bạn thể dục ở sân, các bạn còn lại ngồi xem. Hỏi có mấy bạn ngồi xem?',
    mediaEmoji: '👫',
    options: ['13 bạn', '14 bạn', '15 bạn', '12 bạn'],
    correctAnswer: '13 bạn',
    hint: 'Lấy 28 trừ 15.',
    explanation: 'Rất giỏi! 28 − 15 = 13 bạn.',
    calc: { a: 28, op: '-', b: 15 },
  }),
  mathQ('math-loi-van', {
    id: 'math-q10-9',
    type: 'fill-blank',
    difficulty: 3,
    skillId: 'math_word_problems',
    prompt:
      'Điền số: tổng sách trong hộp có 40 cuốn 📚. Hùng lấy ra 10 cuốn. Trong hộp còn ... cuốn sách.',
    audioPrompt:
      'Tổng sách trong hộp có bốn mươi cuốn. Hùng lấy ra mười cuốn. Trong hộp còn mấy cuốn sách?',
    mediaEmoji: '📚',
    options: ['30 cuốn sách', '28 cuốn sách', '32 cuốn sách', '20 cuốn sách'],
    correctAnswer: '30 cuốn sách',
    hint: 'Lấy 40 trừ 10.',
    explanation: 'Đúng! 40 − 10 = 30 cuốn sách.',
    calc: { a: 40, op: '-', b: 10 },
  }),
  mathQ('math-loi-van', {
    id: 'math-q10-10',
    type: 'multiple-choice',
    difficulty: 3,
    skillId: 'math_word_problems',
    prompt:
      'Mẹ mua 25 quả cam 🍊. Gia đình ăn 15 quả. Còn lại mấy quả cam?',
    audioPrompt: 'Mẹ mua hai mươi lăm quả cam. Gia đình ăn mười lăm quả. Còn lại mấy quả cam?',
    mediaEmoji: '🍊',
    options: ['10 quả cam', '12 quả cam', '15 quả cam', '20 quả cam'],
    correctAnswer: '10 quả cam',
    hint: 'Lấy 25 trừ 15.',
    explanation: 'Tuyệt! 25 − 15 = 10 quả cam.',
    calc: { a: 25, op: '-', b: 15 },
  }),
];

/** math-les-21 (mới) — Bài toán có lời văn trong 100 (không nhớ). */
export const MATH_LES21: Lesson = mathLesson(
  'math-loi-van',
  'math-les-21',
  'Bài toán trong 100',
  'Thêm, bớt, gộp trong phạm vi 100 không nhớ',
  'Gấu Bút Chì: Đọc kỹ "có tất cả" hay "còn lại" rồi chọn phép tính nhé!',
  [
    mathQ('math-loi-van', {
      id: 'math-q21-1',
      type: 'multiple-choice',
      difficulty: 2,
      skillId: 'math_word_problems',
      prompt:
        'An có 30 tem dán 🎴. Chị cho An thêm 25 tem nữa. An có tất cả mấy tem?',
      audioPrompt:
        'An có ba mươi tem dán. Chị cho An thêm hai mươi lăm tem nữa. An có tất cả mấy tem?',
      mediaEmoji: '🎴',
      options: ['55 tem', '45 tem', '65 tem', '50 tem'],
      correctAnswer: '55 tem',
      hint: 'Lấy 30 cộng 25.',
      explanation: 'Tuyệt! 30 + 25 = 55 tem.',
      calc: { a: 30, op: '+', b: 25 },
    }),
    mathQ('math-loi-van', {
      id: 'math-q21-2',
      type: 'multiple-choice',
      difficulty: 2,
      skillId: 'math_word_problems',
      prompt:
        'Xe buýt có 40 hành khách 🚌. Ở trạm xuống 20 người. Trên xe còn mấy hành khách?',
      audioPrompt:
        'Xe buýt có bốn mươi hành khách. Ở trạm xuống hai mươi người. Trên xe còn mấy hành khách?',
      mediaEmoji: '🚌',
      options: ['20 hành khách', '30 hành khách', '25 hành khách', '15 hành khách'],
      correctAnswer: '20 hành khách',
      hint: 'Lấy 40 trừ 20.',
      explanation: 'Đúng rồi! 40 − 20 = 20 hành khách.',
      calc: { a: 40, op: '-', b: 20 },
    }),
    mathQ('math-loi-van', {
      id: 'math-q21-3',
      type: 'multiple-choice',
      difficulty: 2,
      skillId: 'math_word_problems',
      prompt:
        'Bạn Hùng 35 viên bi 🔵. Cho bạn 12 viên. Hùng còn mấy viên bi?',
      audioPrompt: 'Bạn Hùng có ba mươi lăm viên bi. Cho bạn mười hai viên. Hùng còn mấy viên bi?',
      mediaEmoji: '🔵',
      options: ['23 viên bi', '25 viên bi', '32 viên bi', '13 viên bi'],
      correctAnswer: '23 viên bi',
      hint: 'Lấy 35 trừ 12.',
      explanation: 'Chính xác! 35 − 12 = 23 viên bi.',
      calc: { a: 35, op: '-', b: 12 },
    }),
    mathQ('math-loi-van', {
      id: 'math-q21-4',
      type: 'multiple-choice',
      difficulty: 3,
      skillId: 'math_word_problems',
      prompt:
        'Cửa hàng có 60 cái bánh 🍞. Sáng bán đi 20 cái. Chiều còn mấy cái bánh?',
      audioPrompt:
        'Cửa hàng có sáu mươi cái bánh. Sáng bán đi hai mươi cái. Chiều còn mấy cái bánh?',
      mediaEmoji: '🍞',
      options: ['40 cái bánh', '35 cái bánh', '45 cái bánh', '50 cái bánh'],
      correctAnswer: '40 cái bánh',
      hint: 'Lấy 60 trừ 20.',
      explanation: 'Đúng! 60 − 20 = 40 cái bánh.',
      calc: { a: 60, op: '-', b: 20 },
    }),
    mathQ('math-loi-van', {
      id: 'math-q21-5',
      type: 'multiple-choice',
      difficulty: 3,
      skillId: 'math_word_problems',
      prompt:
        'Lan mua 46 cây bút chì ✏️. Cho đi 16 cây. Lan còn mấy cây bút chì?',
      audioPrompt:
        'Lan mua bốn mươi sáu cây bút chì. Cho đi mười sáu cây. Lan còn mấy cây bút chì?',
      mediaEmoji: '✏️',
      options: ['30 cây bút chì', '36 cây bút chì', '26 cây bút chì', '20 cây bút chì'],
      correctAnswer: '30 cây bút chì',
      hint: 'Lấy 46 trừ 16.',
      explanation: 'Rất giỏi! 46 − 16 = 30 cây bút chì.',
      calc: { a: 46, op: '-', b: 16 },
    }),
    mathQ('math-loi-van', {
      id: 'math-q21-6',
      type: 'fill-blank',
      difficulty: 3,
      skillId: 'math_word_problems',
      prompt:
        'Điền số: tổ sách trên giá có 50 cuốn 📚. Cô giáo lấy xuống 20 cuốn. Trên giá còn ... cuốn sách.',
      audioPrompt:
        'Tổ sách trên giá có năm mươi cuốn. Cô giáo lấy xuống hai mươi cuốn. Trên giá còn mấy cuốn sách?',
      mediaEmoji: '📚',
      options: ['30 cuốn sách', '20 cuốn sách', '40 cuốn sách', '25 cuốn sách'],
      correctAnswer: '30 cuốn sách',
      hint: 'Lấy 50 trừ 20.',
      explanation: 'Đúng rồi! 50 − 20 = 30 cuốn sách.',
      calc: { a: 50, op: '-', b: 20 },
    }),
    mathQ('math-loi-van', {
      id: 'math-q21-7',
      type: 'multiple-choice',
      difficulty: 3,
      skillId: 'math_word_problems',
      prompt:
        'Bạn Tâm có 70 phong bì 💌. Gửi đi 30 phong bì. Còn lại mấy phong bì?',
      audioPrompt: 'Bạn Tâm có bảy mươi phong bì. Gửi đi ba mươi phong bì. Còn lại mấy phong bì?',
      mediaEmoji: '💌',
      options: ['40 phong bì', '35 phong bì', '45 phong bì', '50 phong bì'],
      correctAnswer: '40 phong bì',
      hint: 'Lấy 70 trừ 30.',
      explanation: 'Tuyệt! 70 − 30 = 40 phong bì.',
      calc: { a: 70, op: '-', b: 30 },
    }),
    mathQ('math-loi-van', {
      id: 'math-q21-8',
      type: 'true-false',
      difficulty: 3,
      skillId: 'math_word_problems',
      prompt: 'Hai chục cộng ba chục bằng năm mươi. Đúng hay Sai?',
      audioPrompt: 'Hai chục cộng ba chục bằng năm mươi. Đúng hay sai?',
      mediaEmoji: '➕',
      options: ['Đúng', 'Sai'],
      correctAnswer: 'Đúng',
      hint: 'Thử tính: 20 + 30 = 50.',
      explanation: 'Đúng rồi! 20 + 30 = 50.',
    }),
    mathQ('math-loi-van', {
      id: 'math-q21-9',
      type: 'multiple-choice',
      difficulty: 3,
      skillId: 'math_word_problems',
      prompt:
        'Lớp 1C có 55 bạn 👫. Có 30 bạn tham gia đội cờ, các bạn còn lại tham gia đội văn nghệ. Hỏi mấy bạn ở đội văn nghệ?',
      audioPrompt:
        'Lớp 1C có năm mươi lăm bạn. Có ba mươi bạn tham gia đội cờ, các bạn còn lại tham gia đội văn nghệ. Hỏi mấy bạn ở đội văn nghệ?',
      mediaEmoji: '👫',
      options: ['25 bạn', '30 bạn', '35 bạn', '20 bạn'],
      correctAnswer: '25 bạn',
      hint: 'Lấy 55 trừ 30.',
      explanation: 'Chính xác! 55 − 30 = 25 bạn.',
      calc: { a: 55, op: '-', b: 30 },
    }),
    mathQ('math-loi-van', {
      id: 'math-q21-10',
      type: 'multiple-choice',
      difficulty: 3,
      skillId: 'math_word_problems',
      prompt:
        'Bạn có 80 viên bi 🔵. Cho bạn 30 viên. Còn lại mấy viên bi?',
      audioPrompt: 'Bạn có tám mươi viên bi. Cho bạn ba mươi viên. Còn lại mấy viên bi?',
      mediaEmoji: '🔵',
      options: ['50 viên bi', '45 viên bi', '55 viên bi', '60 viên bi'],
      correctAnswer: '50 viên bi',
      hint: 'Lấy 80 trừ 30.',
      explanation: 'Xuất sắc! 80 − 30 = 50 viên bi.',
      calc: { a: 80, op: '-', b: 30 },
    }),
  ],
  50,
  3
);
