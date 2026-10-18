import type { Lesson, Question } from '../../types';
import { vnQ, vnLesson } from './factory';

/**
 * T10A — Chính tả nhỏ (spec T10 §6): dấu chấm, dấu hỏi, dấu chấm than và viết
 * hoa chữ đầu câu. Quy tắc c/k, g/gh, ng/ngh đã có ở bài cũ và bài chữ ghép,
 * phần này tập trung vào dấu câu và chữ hoa mở đầu — kỹ năng trẻ lớp 1 hay quên.
 *
 * Mỗi bài một kỹ năng riêng để bộ quét gần trùng chỉ so trong nội bộ bài.
 */

export const PUNCT_TOPIC = 'vn-dau-cau';

type Q = Parameters<typeof vnQ>[1];

function mc(id: string, skillId: string, difficulty: 1 | 2 | 3, q: Omit<Q, 'id' | 'skillId' | 'difficulty' | 'type'>): Question {
  return vnQ(PUNCT_TOPIC, { ...q, id, skillId, difficulty, type: 'multiple-choice' });
}
function tf(id: string, skillId: string, prompt: string, correct: 'Đúng' | 'Sai', hint: string, explanation: string): Question {
  return vnQ(PUNCT_TOPIC, { id, skillId, difficulty: 2, type: 'true-false', prompt, options: ['Đúng', 'Sai'], correctAnswer: correct, hint, explanation });
}
function fb(id: string, skillId: string, prompt: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(PUNCT_TOPIC, { id, skillId, difficulty: 2, type: 'fill-blank', prompt, options, correctAnswer: correct, hint, explanation });
}
function img(id: string, skillId: string, prompt: string, emoji: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(PUNCT_TOPIC, { id, skillId, difficulty: 1, type: 'image-choice', prompt, mediaEmoji: emoji, options, correctAnswer: correct, hint, explanation });
}
function match(id: string, skillId: string, prompt: string, pairs: { left: string; right: string }[], hint: string, explanation: string): Question {
  return vnQ(PUNCT_TOPIC, {
    id,
    skillId,
    difficulty: 2,
    type: 'matching',
    prompt,
    options: pairs.map((p) => p.right),
    correctAnswer: pairs.map((p) => `${p.left}=${p.right}`).join('|'),
    matchingPairs: pairs,
    hint,
    explanation,
  });
}
function order(id: string, skillId: string, prompt: string, correct: string[], hint: string, explanation: string): Question {
  const options = [...correct].reverse();
  return vnQ(PUNCT_TOPIC, {
    id,
    skillId,
    difficulty: 2,
    type: 'ordering',
    prompt,
    options,
    correctAnswer: correct.join('|'),
    orderingItems: correct,
    hint,
    explanation,
  });
}

// ---------------------------------------------------------------------------
// Bài 1 — Viết hoa chữ đầu câu
// ---------------------------------------------------------------------------

const p1 = 'vn_punct_capital';

const p1Q: Question[] = [
  mc('vn-p1-1', p1, 1, {
    prompt: 'Chữ cái mở đầu một câu thường được viết thế nào?',
    options: ['Viết hoa', 'Viết thường', 'Viết số', 'Không cần viết'],
    correctAnswer: 'Viết hoa',
    hint: 'Chữ mở đầu câu luôn đứng đầu và to hơn.',
    explanation: 'Chữ đầu câu luôn viết hoa.',
  }),
  mc('vn-p1-2', p1, 1, {
    prompt: 'Câu nào dưới đây em viết đúng?',
    options: ['Bé đi học.', 'bé đi học.', 'bé đi học', 'BÉ đi học'],
    correctAnswer: 'Bé đi học.',
    hint: 'Nhìn chữ mở đầu và dấu đặt ở cuối câu.',
    explanation: 'Đúng rồi: “Bé đi học.” viết hoa chữ B và có dấu chấm cuối câu.',
  }),
  img('vn-p1-3', p1, 'Hình 🌸 — chọn câu kể đúng chính tả:', '🌸', ['Hoa nở.', 'hoa nở', 'hoa Nở.', 'HOA nở'], 'Hoa nở.', 'Chữ mở đầu câu phải viết hoa.', 'Đúng rồi: “Hoa nở.”'),
  tf('vn-p1-4', p1, 'Câu “bé thích học.” đã viết hoa chữ đầu đúng chưa?', 'Sai', 'Nhìn chữ đầu tiên của câu.', 'Sai, chữ đầu “bé” phải viết hoa thành “Bé”.'),
  fb('vn-p1-5', p1, 'Điền chữ mở đầu cho câu: “___ yêu mẹ.”', ['Bé', 'bé', 'Be', 'Bẽ'], 'Bé', 'Chữ mở đầu câu phải viết hoa.', 'Điền “Bé”: Bé yêu mẹ.'),
  match('vn-p1-6', p1, 'Nối chữ thường với chữ in hoa của nó:', [
    { left: 'a', right: 'A' },
    { left: 'b', right: 'B' },
    { left: 'đ', right: 'Đ' },
    { left: 'ê', right: 'Ê' },
  ], 'Chữ in hoa và chữ thường cùng một tên gọi.', 'a–A, b–B, đ–Đ, ê–Ê.'),
  mc('vn-p1-7', p1, 2, {
    prompt: 'Tên riêng của bạn em nên viết thế nào?',
    options: ['Viết hoa chữ đầu', 'Viết thường tất cả', 'Viết số'], 
    correctAnswer: 'Viết hoa chữ đầu',
    hint: 'Tên bạn là tên riêng.',
    explanation: 'Tên riêng viết hoa chữ đầu, ví dụ: Lan, Nam.',
  }),
  tf('vn-p1-8', p1, 'Trong câu “Lan học bài.”, chữ “Lan” đã viết hoa. Đúng hay sai?', 'Đúng', 'Quan sát chữ mở đầu câu.', 'Đúng, “Lan” viết hoa vì đứng đầu câu và là tên riêng.'),
  order('vn-p1-9', p1, 'Sắp xếp các từ thành câu đúng:', ['Lan', 'đi', 'học'], 'Câu nói ai làm gì.', 'Câu đúng: Lan đi học.'),
  mc('vn-p1-10', p1, 2, {
    prompt: 'Câu nào có chữ đầu viết hoa đúng?',
    options: ['Mẹ nấu cơm.', 'mẹ nấu cơm.', 'mẹ Nấu cơm.'], 
    correctAnswer: 'Mẹ nấu cơm.',
    hint: 'Chỉ một chữ ở đầu câu cần viết hoa.',
    explanation: '“Mẹ nấu cơm.” viết hoa chữ M đầu câu.',
  }),
];

const lessonP1 = vnLesson(PUNCT_TOPIC, 'vn-les-p1', 'Viết hoa chữ đầu câu', 'Nhớ viết hoa chữ mở đầu câu và tên riêng.', 'Chữ mở đầu câu phải thật to và đẹp nhé!', p1Q);

// ---------------------------------------------------------------------------
// Bài 2 — Dấu chấm, dấu hỏi, dấu chấm than
// ---------------------------------------------------------------------------

const p2 = 'vn_punct_marks';

const p2Q: Question[] = [
  mc('vn-p2-1', p2, 1, {
    prompt: 'Cuối câu hỏi, em đặt dấu gì?',
    options: ['Dấu hỏi', 'Dấu chấm', 'Dấu chấm than', 'Dấu phẩy'],
    correctAnswer: 'Dấu hỏi',
    hint: 'Câu dùng để hỏi ai đó.',
    explanation: 'Câu hỏi kết thúc bằng dấu hỏi (?).',
  }),
  mc('vn-p2-2', p2, 1, {
    prompt: 'Cuối câu kể bình thường, em đặt dấu nào?',
    options: ['Dấu chấm', 'Dấu hỏi', 'Dấu chấm than', 'Dấu hai chấm'],
    correctAnswer: 'Dấu chấm',
    hint: 'Câu kể lại một việc đã xảy ra.',
    explanation: 'Câu kể kết thúc bằng dấu chấm (.).',
  }),
  mc('vn-p2-3', p2, 1, {
    prompt: 'Câu “Bé thích quá!” kết thúc bằng dấu gì?',
    options: ['Dấu chấm than', 'Dấu chấm', 'Dấu hỏi', 'Dấu phẩy'],
    correctAnswer: 'Dấu chấm than',
    hint: 'Câu này bộc lộ cảm xúc vui.',
    explanation: 'Câu cảm thán kết thúc bằng dấu chấm than (!).',
  }),
  tf('vn-p2-4', p2, 'Câu “Bạn tên gì” cần dấu hỏi ở cuối. Đúng hay sai?', 'Đúng', 'Đây là câu dùng để hỏi.', 'Đúng, câu hỏi cần dấu hỏi ở cuối.'),
  tf('vn-p2-5', p2, 'Câu “Hôm nay trời đẹp.” là một câu hỏi. Đúng hay sai?', 'Sai', 'Câu này chỉ kể lại, không hỏi ai.', 'Sai, đây là câu kể nên dùng dấu chấm.'),
  fb('vn-p2-6', p2, 'Chọn dấu đặt cuối câu “Bé ăn cơm ___”', ['.', '?', '!', ','], '.', 'Câu kể lại việc bé ăn cơm.', 'Đặt dấu chấm: Bé ăn cơm.'),
  img('vn-p2-7', p2, 'Hình 🍎 — câu nào là câu hỏi?', '🍎', ['Quả táo có ngon không?', 'Quả táo rất ngon.', 'Quả táo ngon quá!'], 'Quả táo có ngon không?', 'Câu hỏi thường có từ để hỏi.', 'Câu hỏi: “Quả táo có ngon không?”'),
  match('vn-p2-8', p2, 'Nối câu với dấu câu thích hợp:', [
    { left: 'Bé đi học', right: 'Dấu chấm' },
    { left: 'Bạn tên gì', right: 'Dấu hỏi' },
    { left: 'Ôi, đẹp quá', right: 'Dấu chấm than' },
  ], 'Nghe ý câu rồi chọn dấu ở cuối.', 'Câu kể–chấm, câu hỏi–hỏi, câu cảm–chấm than.'),
  mc('vn-p2-9', p2, 2, {
    prompt: 'Câu “Hôm nay là thứ mấy.” đã dùng đúng dấu chưa?',
    options: ['Sai, phải dùng dấu hỏi', 'Đúng rồi', 'Sai, phải dùng dấu phẩy', 'Sai, phải dùng dấu hai chấm'],
    correctAnswer: 'Sai, phải dùng dấu hỏi',
    hint: 'Câu này đang hỏi điều gì?',
    explanation: 'Đây là câu hỏi nên phải dùng dấu hỏi: “Hôm nay là thứ mấy?”',
  }),
  order('vn-p2-10', p2, 'Sắp xếp các từ thành câu hỏi đúng:', ['Bạn', 'tên', 'gì?'], 'Câu hỏi bắt đầu bằng từ chỉ người.', 'Câu đúng: Bạn tên gì?'),
];

const lessonP2 = vnLesson(PUNCT_TOPIC, 'vn-les-p2', 'Dấu chấm, dấu hỏi, dấu chấm than', 'Phân biệt ba dấu câu quen thuộc ở cuối câu.', 'Nghe ý câu để chọn dấu cho đúng nhé!', p2Q);

// ---------------------------------------------------------------------------
// Bài 3 — Chọn câu viết đúng (ôn tập)
// ---------------------------------------------------------------------------

const p3 = 'vn_punct_review';

const p3Q: Question[] = [
  mc('vn-p3-1', p3, 2, {
    prompt: 'Câu nào viết đúng chính tả và dấu câu?',
    options: ['Trời mưa to.', 'trời mưa to', 'Trời mưa to', 'trời Mưa to.'],
    correctAnswer: 'Trời mưa to.',
    hint: 'Chú ý chữ mở đầu và dấu cuối câu.',
    explanation: '“Trời mưa to.” viết hoa chữ T và có dấu chấm.',
  }),
  mc('vn-p3-2', p3, 2, {
    prompt: 'Câu nào là câu hỏi đúng?',
    options: ['Em có thích đọc sách không?', 'Em có thích đọc sách không.', 'em có thích đọc sách không?', 'Em có thích đọc sách!'],
    correctAnswer: 'Em có thích đọc sách không?',
    hint: 'Câu hỏi viết hoa đầu và dấu hỏi cuối.',
    explanation: 'Câu hỏi đúng: “Em có thích đọc sách không?”',
  }),
  tf('vn-p3-3', p3, 'Câu “chúng em chăm học.” viết hoa đúng chính tả.', 'Sai', 'Xem chữ mở đầu câu.', 'Sai, phải viết “Chúng em chăm học.”'),
  tf('vn-p3-4', p3, 'Cuối câu cảm thán “A, mèo con!” ta dùng dấu chấm than.', 'Đúng', 'Câu này thể hiện sự vui thích.', 'Đúng, câu cảm thán dùng dấu chấm than.'),
  fb('vn-p3-5', p3, 'Điền dấu còn thiếu cuối câu: “Bạn có khỏe không ___”', ['?', '.', '!', ','], '?', 'Đây là câu hỏi thăm sức khỏe.', 'Đặt dấu hỏi: Bạn có khỏe không?'),
  img('vn-p3-6', p3, 'Hình ☀️ — câu nào kể đúng và viết hoa đúng?', '☀️', ['Mặt trời chiếu sáng.', 'mặt trời chiếu sáng', 'mặt Trời chiếu sáng.'], 'Mặt trời chiếu sáng.', 'Câu kể viết hoa chữ đầu và dấu chấm cuối.', 'Đúng rồi: “Mặt trời chiếu sáng.”'),
  match('vn-p3-7', p3, 'Nối câu với việc cần sửa:', [
    { left: 'bé đi học.', right: 'Viết hoa chữ đầu' },
    { left: 'Bạn tên gì.', right: 'Đổi thành dấu hỏi' },
    { left: 'A, đẹp quá.', right: 'Đổi thành dấu chấm than' },
  ], 'Mỗi câu có một lỗi nhỏ ở đầu hoặc cuối câu.', 'Sửa chữ hoa, sửa dấu hỏi, sửa dấu chấm than.'),
  mc('vn-p3-8', p3, 2, {
    prompt: 'Câu nào đặt dấu câu đúng nhất?',
    options: ['Con mèo đang ngủ.', 'Con mèo đang ngủ?', 'con mèo đang ngủ.', 'Con mèo đang ngủ!'],
    correctAnswer: 'Con mèo đang ngủ.',
    hint: 'Đây là câu kể lại, không hỏi và không cảm thán.',
    explanation: 'Câu kể: “Con mèo đang ngủ.”',
  }),
  order('vn-p3-9', p3, 'Sắp xếp các từ thành câu kể đúng:', ['Em', 'thích', 'vẽ', 'tranh.'], 'Câu nói em thích làm gì.', 'Câu đúng: Em thích vẽ tranh.'),
  mc('vn-p3-10', p3, 3, {
    prompt: 'Câu nào viết đúng cả chữ hoa và dấu câu?',
    options: ['Hôm nay em được điểm mười.', 'hôm nay em được điểm mười?', 'Hôm Nay em được điểm mười.', 'hôm nay em được điểm mười'],
    correctAnswer: 'Hôm nay em được điểm mười.',
    hint: 'Chỉ chữ đầu câu viết hoa, cuối câu là dấu chấm.',
    explanation: 'Câu đúng: “Hôm nay em được điểm mười.”',
  }),
];

const lessonP3 = vnLesson(PUNCT_TOPIC, 'vn-les-p3', 'Chọn câu viết đúng', 'Ôn lại viết hoa đầu câu và dấu câu ở cuối.', 'Soi từng chữ và từng dấu một nhé!', p3Q);

export const PUNCT_LESSONS: Lesson[] = [lessonP1, lessonP2, lessonP3];

export const PUNCT_SKILLS: string[] = [p1, p2, p3];
