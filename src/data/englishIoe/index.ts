export interface IoeQuestion {
  id: string;
  skill: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface IoeLesson {
  id: string;
  title: string;
  objective: string;
  vocab: { en: string; vi: string; emoji: string }[];
  questions: IoeQuestion[];
}

export interface IoeWeek {
  id: string;
  week: number;
  title: string;
  topics: string[];
  lessons: IoeLesson[];
}

export const IOE_WEEKS: IoeWeek[] = [
  {
    id: 'ioe-w1',
    week: 1,
    title: 'Tuần 1 — Ôn từ vựng cơ bản',
    topics: ['Colors', 'Numbers 1–10', 'School things', 'Animals'],
    lessons: [
      {
        id: 'ioe-w1-l1',
        title: 'Bài 1: Màu sắc và số đếm',
        objective: 'Nhận biết màu sắc và số 1–10.',
        vocab: [
          { en: 'red', vi: 'màu đỏ', emoji: '🔴' },
          { en: 'blue', vi: 'màu xanh', emoji: '🔵' },
          { en: 'green', vi: 'màu xanh lá', emoji: '🟢' },
          { en: 'one', vi: 'một', emoji: '1️⃣' },
          { en: 'two', vi: 'hai', emoji: '2️⃣' },
        ],
        questions: [
          { id: 'ioe-w1-l1-q1', skill: 'vocabulary', difficulty: 1, prompt: 'What color is this? 🔴', options: ['red', 'blue', 'green'], answer: 0, explanation: '🔴 là màu đỏ: red.' },
          { id: 'ioe-w1-l1-q2', skill: 'vocabulary', difficulty: 1, prompt: 'What number is this? 3', options: ['one', 'two', 'three'], answer: 2, explanation: '3 là three.' },
          { id: 'ioe-w1-l1-q3', skill: 'spelling', difficulty: 2, prompt: 'Chọn từ đúng chính tả:', options: ['blu', 'blue', 'bloo'], answer: 1, explanation: 'blue là cách viết đúng.' },
          { id: 'ioe-w1-l1-q4', skill: 'reading', difficulty: 2, prompt: 'I have two red apples. Có mấy quả táo?', options: ['1', '2', '3'], answer: 1, explanation: 'two = 2.' },
        ],
      },
      {
        id: 'ioe-w1-l2',
        title: 'Bài 2: Đồ dùng học tập và động vật',
        objective: 'Nhận biết đồ dùng và động vật.',
        vocab: [
          { en: 'book', vi: 'sách', emoji: '📘' },
          { en: 'pen', vi: 'bút', emoji: '🖊️' },
          { en: 'cat', vi: 'mèo', emoji: '🐱' },
          { en: 'dog', vi: 'chó', emoji: '🐶' },
        ],
        questions: [
          { id: 'ioe-w1-l2-q1', skill: 'vocabulary', difficulty: 1, prompt: 'What is this? 📘', options: ['book', 'pen', 'cat'], answer: 0, explanation: '📘 là book.' },
          { id: 'ioe-w1-l2-q2', skill: 'vocabulary', difficulty: 1, prompt: 'What is this? 🐱', options: ['dog', 'cat', 'book'], answer: 1, explanation: '🐱 là cat.' },
          { id: 'ioe-w1-l2-q3', skill: 'grammar', difficulty: 2, prompt: 'Choose the correct sentence:', options: ['This is a book.', 'This are a book.', 'This is an book.'], answer: 0, explanation: 'This is a book.' },
          { id: 'ioe-w1-l2-q4', skill: 'spelling', difficulty: 2, prompt: 'Điền chữ còn thiếu: d_g', options: ['o', 'a', 'u'], answer: 0, explanation: 'dog.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w2',
    week: 2,
    title: 'Tuần 2 — Đánh vần và nhận diện từ',
    topics: ['Family', 'Toys', 'Body parts', 'Ôn từ tuần 1'],
    lessons: [
      {
        id: 'ioe-w2-l1',
        title: 'Bài 1: Gia đình',
        objective: 'Nhận biết từ về gia đình.',
        vocab: [
          { en: 'mother', vi: 'mẹ', emoji: '👩' },
          { en: 'father', vi: 'bố', emoji: '👨' },
          { en: 'sister', vi: 'chị/em gái', emoji: '👧' },
          { en: 'brother', vi: 'anh/em trai', emoji: '👦' },
        ],
        questions: [
          { id: 'ioe-w2-l1-q1', skill: 'vocabulary', difficulty: 1, prompt: 'Who is this? 👩', options: ['father', 'mother', 'sister'], answer: 1, explanation: '👩 là mother.' },
          { id: 'ioe-w2-l1-q2', skill: 'grammar', difficulty: 2, prompt: 'Choose: ___ is my father.', options: ['He', 'She', 'It'], answer: 0, explanation: 'father dùng He.' },
          { id: 'ioe-w2-l1-q3', skill: 'spelling', difficulty: 2, prompt: 'Sắp xếp chữ cái: r e h t o m', options: ['mother', 'father', 'brother'], answer: 0, explanation: 'mother.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w3',
    week: 3,
    title: 'Tuần 3 — Đại từ và động từ to be',
    topics: ['I am', 'You are', 'He/She/It is'],
    lessons: [
      {
        id: 'ioe-w3-l1',
        title: 'Bài 1: Chọn am/is/are',
        objective: 'Dùng am/is/are đúng đại từ.',
        vocab: [
          { en: 'I am', vi: 'tôi là', emoji: '🙋' },
          { en: 'you are', vi: 'bạn là', emoji: '🤝' },
          { en: 'he is', vi: 'cậu ấy là (nam)', emoji: '👦' },
          { en: 'she is', vi: 'cậu ấy là (nữ)', emoji: '👧' },
        ],
        questions: [
          { id: 'ioe-w3-l1-q1', skill: 'grammar', difficulty: 1, prompt: 'Choose: I ___ happy.', options: ['am', 'is', 'are'], answer: 0, explanation: 'I am.' },
          { id: 'ioe-w3-l1-q2', skill: 'grammar', difficulty: 1, prompt: 'Choose: She ___ a girl.', options: ['am', 'is', 'are'], answer: 1, explanation: 'She is.' },
          { id: 'ioe-w3-l1-q3', skill: 'grammar', difficulty: 2, prompt: 'Choose: They ___ friends.', options: ['am', 'is', 'are'], answer: 2, explanation: 'They are.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w4',
    week: 4,
    title: 'Tuần 4 — Cấu trúc câu cơ bản',
    topics: ['This is a…', 'It is a/an…', 'I have…'],
    lessons: [
      {
        id: 'ioe-w4-l1',
        title: 'Bài 1: This is / It is',
        objective: 'Dùng This is và It is.',
        vocab: [
          { en: 'This is a book.', vi: 'Đây là một quyển sách.', emoji: '📘' },
          { en: 'It is a pen.', vi: 'Đó là một cây bút.', emoji: '🖊️' },
        ],
        questions: [
          { id: 'ioe-w4-l1-q1', skill: 'grammar', difficulty: 1, prompt: 'Choose: ___ is a dog.', options: ['This', 'These', 'Those'], answer: 0, explanation: 'This is a dog.' },
          { id: 'ioe-w4-l1-q2', skill: 'grammar', difficulty: 2, prompt: 'Choose: I ___ two pencils.', options: ['has', 'have', 'am'], answer: 1, explanation: 'I have.' },
          { id: 'ioe-w4-l1-q3', skill: 'grammar', difficulty: 2, prompt: 'Chọn câu đúng:', options: ['It is an apple.', 'It is a apple.', 'It are an apple.'], answer: 0, explanation: 'a trước phụ âm, an trước nguyên âm.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w5',
    week: 5,
    title: 'Tuần 5 — Gia đình, trường học và hội thoại',
    topics: ['Family', 'Classroom', 'Food', 'Daily actions'],
    lessons: [
      {
        id: 'ioe-w5-l1',
        title: 'Bài 1: Hỏi và đáp ngắn',
        objective: 'Luyện What/Who/How many.',
        vocab: [
          { en: 'What is this?', vi: 'Đây là gì?', emoji: '❓' },
          { en: 'Who is he?', vi: 'Anh ấy là ai?', emoji: '👦' },
          { en: 'How many?', vi: 'Bao nhiêu?', emoji: '🔢' },
        ],
        questions: [
          { id: 'ioe-w5-l1-q1', skill: 'reading', difficulty: 1, prompt: 'What is this? 🍎', options: ['It is an apple.', 'It is a book.', 'It is a pen.'], answer: 0, explanation: '🍎 là apple.' },
          { id: 'ioe-w5-l1-q2', skill: 'reading', difficulty: 2, prompt: 'How many cats? 🐱🐱', options: ['One', 'Two', 'Three'], answer: 1, explanation: '2 con mèo.' },
          { id: 'ioe-w5-l1-q3', skill: 'grammar', difficulty: 2, prompt: 'Choose: ___ is this? (hỏi người)', options: ['What', 'Who', 'How'], answer: 1, explanation: 'Who hỏi người.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w6',
    week: 6,
    title: 'Tuần 6 — Đọc hiểu và nghe hiểu',
    topics: ['Đoạn văn ngắn', 'Chọn hình phù hợp', 'Đúng/sai'],
    lessons: [
      {
        id: 'ioe-w6-l1',
        title: 'Bài 1: Đọc hiểu ngắn',
        objective: 'Trả lời câu hỏi theo đoạn văn.',
        vocab: [
          { en: 'Tom has a red ball.', vi: 'Tom có một quả bóng đỏ.', emoji: '⚽' },
          { en: 'He plays in the park.', vi: 'Cậu ấy chơi ở công viên.', emoji: '🌳' },
        ],
        questions: [
          { id: 'ioe-w6-l1-q1', skill: 'reading', difficulty: 2, prompt: 'Tom has a red ball. Tom có gì?', options: ['a blue ball', 'a red ball', 'a green ball'], answer: 1, explanation: 'red ball.' },
          { id: 'ioe-w6-l1-q2', skill: 'reading', difficulty: 2, prompt: 'He plays in the park. Cậu ấy chơi ở đâu?', options: ['school', 'park', 'home'], answer: 1, explanation: 'park.' },
          { id: 'ioe-w6-l1-q3', skill: 'reading', difficulty: 3, prompt: 'Câu nào đúng theo đoạn văn?', options: ['Tom has a blue ball.', 'Tom plays in the park.', 'Tom has no ball.'], answer: 1, explanation: 'He plays in the park.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w7',
    week: 7,
    title: 'Tuần 7 — Luyện dạng bài IOE cơ bản',
    topics: ['Chọn đáp án', 'Hoàn thành từ', 'Sắp xếp từ', 'Ghép cặp'],
    lessons: [
      {
        id: 'ioe-w7-l1',
        title: 'Bài 1: Hoàn thành từ và sắp xếp',
        objective: 'Luyện chính tả và sắp xếp từ.',
        vocab: [
          { en: 'c_t', vi: 'cat', emoji: '🐱' },
          { en: 'd_g', vi: 'dog', emoji: '🐶' },
        ],
        questions: [
          { id: 'ioe-w7-l1-q1', skill: 'spelling', difficulty: 2, prompt: 'Điền chữ còn thiếu: c_t', options: ['a', 'o', 'u'], answer: 0, explanation: 'cat.' },
          { id: 'ioe-w7-l1-q2', skill: 'spelling', difficulty: 2, prompt: 'Điền chữ còn thiếu: d_g', options: ['o', 'a', 'u'], answer: 0, explanation: 'dog.' },
          { id: 'ioe-w7-l1-q3', skill: 'grammar', difficulty: 2, prompt: 'Sắp xếp: is / This / book / a', options: ['This is a book.', 'Is this a book.', 'Book a is this.'], answer: 0, explanation: 'This is a book.' },
          { id: 'ioe-w7-l1-q4', skill: 'reading', difficulty: 2, prompt: 'Ghép câu với hình: 🐱', options: ['This is a cat.', 'This is a dog.', 'This is a book.'], answer: 0, explanation: 'cat.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w8',
    week: 8,
    title: 'Tuần 8 — Luyện tổng hợp',
    topics: ['Từ vựng', 'Chính tả', 'Ngữ pháp', 'Đọc hiểu'],
    lessons: [
      {
        id: 'ioe-w8-l1',
        title: 'Bài 1: Tổng hợp',
        objective: 'Ôn tập nhiều kỹ năng.',
        vocab: [{ en: 'mixed', vi: 'tổng hợp', emoji: '🧩' }],
        questions: [
          { id: 'ioe-w8-l1-q1', skill: 'vocabulary', difficulty: 2, prompt: 'What color? 🟢', options: ['red', 'blue', 'green'], answer: 2, explanation: 'green.' },
          { id: 'ioe-w8-l1-q2', skill: 'grammar', difficulty: 2, prompt: 'Choose: They ___ students.', options: ['is', 'are', 'am'], answer: 1, explanation: 'They are.' },
          { id: 'ioe-w8-l1-q3', skill: 'spelling', difficulty: 2, prompt: 'Điền: b_ok', options: ['o', 'a', 'u'], answer: 0, explanation: 'book.' },
          { id: 'ioe-w8-l1-q4', skill: 'reading', difficulty: 3, prompt: 'I have 2 pens. Tôi có mấy cây bút?', options: ['1', '2', '3'], answer: 1, explanation: '2 pens.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w9',
    week: 9,
    title: 'Tuần 9 — Làm quen giới hạn thời gian',
    topics: ['Bài ngắn', 'Đồng hồ tùy chọn'],
    lessons: [
      {
        id: 'ioe-w9-l1',
        title: 'Bài 1: Luyện nhanh',
        objective: 'Làm bài ngắn có thời gian.',
        vocab: [{ en: 'quick', vi: 'nhanh', emoji: '⏱️' }],
        questions: [
          { id: 'ioe-w9-l1-q1', skill: 'vocabulary', difficulty: 2, prompt: 'What is this? ✏️', options: ['pen', 'book', 'cat'], answer: 0, explanation: 'pen.' },
          { id: 'ioe-w9-l1-q2', skill: 'grammar', difficulty: 2, prompt: 'Choose: It ___ a cat.', options: ['are', 'is', 'am'], answer: 1, explanation: 'It is.' },
          { id: 'ioe-w9-l1-q3', skill: 'reading', difficulty: 2, prompt: 'She has 1 dog. Cô ấy có mấy con chó?', options: ['1', '2', '3'], answer: 0, explanation: '1 dog.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w10',
    week: 10,
    title: 'Tuần 10 — Luyện đề mô phỏng',
    topics: ['Trộn kỹ năng', 'Bài thi mô phỏng'],
    lessons: [
      {
        id: 'ioe-w10-l1',
        title: 'Bài 1: Đề mô phỏng',
        objective: 'Làm bài thi mô phỏng.',
        vocab: [{ en: 'mock test', vi: 'đề mô phỏng', emoji: '📝' }],
        questions: [
          { id: 'ioe-w10-l1-q1', skill: 'vocabulary', difficulty: 2, prompt: 'What color? 🔵', options: ['red', 'blue', 'green'], answer: 1, explanation: 'blue.' },
          { id: 'ioe-w10-l1-q2', skill: 'grammar', difficulty: 2, prompt: 'Choose: I ___ a student.', options: ['am', 'is', 'are'], answer: 0, explanation: 'I am.' },
          { id: 'ioe-w10-l1-q3', skill: 'spelling', difficulty: 2, prompt: 'Điền: p_n', options: ['e', 'a', 'o'], answer: 0, explanation: 'pen.' },
          { id: 'ioe-w10-l1-q4', skill: 'reading', difficulty: 3, prompt: 'He has 2 books. Anh ấy có mấy quyển sách?', options: ['1', '2', '3'], answer: 1, explanation: '2 books.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w11',
    week: 11,
    title: 'Tuần 11 — Khắc phục điểm yếu',
    topics: ['Ôn từ vựng yếu', 'Ôn chính tả', 'Ôn ngữ pháp'],
    lessons: [
      {
        id: 'ioe-w11-l1',
        title: 'Bài 1: Ôn lại từ yếu',
        objective: 'Ôn từ đã học.',
        vocab: [{ en: 'review', vi: 'ôn tập', emoji: '🔁' }],
        questions: [
          { id: 'ioe-w11-l1-q1', skill: 'vocabulary', difficulty: 1, prompt: 'What is this? 🐶', options: ['cat', 'dog', 'book'], answer: 1, explanation: 'dog.' },
          { id: 'ioe-w11-l1-q2', skill: 'spelling', difficulty: 2, prompt: 'Điền: c_t', options: ['a', 'o', 'u'], answer: 0, explanation: 'cat.' },
          { id: 'ioe-w11-l1-q3', skill: 'grammar', difficulty: 2, prompt: 'Choose: She ___ happy.', options: ['am', 'is', 'are'], answer: 1, explanation: 'She is.' },
        ],
      },
    ],
  },
  {
    id: 'ioe-w12',
    week: 12,
    title: 'Tuần 12 — Đánh giá tiến bộ',
    topics: ['Bài đánh giá tổng hợp'],
    lessons: [
      {
        id: 'ioe-w12-l1',
        title: 'Bài 1: Đánh giá cuối kỳ',
        objective: 'Tổng hợp các kỹ năng đã học.',
        vocab: [{ en: 'final test', vi: 'bài đánh giá cuối', emoji: '🏁' }],
        questions: [
          { id: 'ioe-w12-l1-q1', skill: 'vocabulary', difficulty: 2, prompt: 'What color? 🔴', options: ['red', 'blue', 'green'], answer: 0, explanation: 'red.' },
          { id: 'ioe-w12-l1-q2', skill: 'grammar', difficulty: 2, prompt: 'Choose: I ___ a teacher.', options: ['am', 'is', 'are'], answer: 0, explanation: 'I am.' },
          { id: 'ioe-w12-l1-q3', skill: 'spelling', difficulty: 2, prompt: 'Điền: b_ok', options: ['o', 'a', 'u'], answer: 0, explanation: 'book.' },
          { id: 'ioe-w12-l1-q4', skill: 'reading', difficulty: 3, prompt: 'Tom has 2 cats. Tom có mấy con mèo?', options: ['1', '2', '3'], answer: 1, explanation: '2 cats.' },
        ],
      },
    ],
  },
];

export function getAllIoeQuestions() {
  return IOE_WEEKS.flatMap((w) => w.lessons.flatMap((l) => l.questions));
}
