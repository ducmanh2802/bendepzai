import type { Lesson, Question } from '../../types';
import { vnQ, vnLesson } from './factory';

/**
 * T10A — Chữ ghép (spec T10 §3 + §6 quy tắc c/k, g/gh, ng/ngh).
 *
 * Word-first design: the child meets each letter pair through real words. Every
 * lesson uses its own skill id and a distinct set of ten question phrasings, so
 * the near-duplicate scanner never sees two identical templates in one skill.
 */

export const COMPOUND_TOPIC = 'vn-chu-ghep';

type Q = Parameters<typeof vnQ>[1];

function mc(id: string, skillId: string, difficulty: 1 | 2 | 3, q: Omit<Q, 'id' | 'skillId' | 'difficulty' | 'type'>): Question {
  return vnQ(COMPOUND_TOPIC, { ...q, id, skillId, difficulty, type: 'multiple-choice' });
}
function tf(id: string, skillId: string, prompt: string, correct: 'Đúng' | 'Sai', hint: string, explanation: string, emoji?: string): Question {
  return vnQ(COMPOUND_TOPIC, { id, skillId, difficulty: 2, type: 'true-false', prompt, options: ['Đúng', 'Sai'], correctAnswer: correct, mediaEmoji: emoji, hint, explanation });
}
function fb(id: string, skillId: string, prompt: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(COMPOUND_TOPIC, { id, skillId, difficulty: 2, type: 'fill-blank', prompt, options, correctAnswer: correct, hint, explanation });
}
function img(id: string, skillId: string, prompt: string, emoji: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(COMPOUND_TOPIC, { id, skillId, difficulty: 1, type: 'image-choice', prompt, mediaEmoji: emoji, options, correctAnswer: correct, hint, explanation });
}
function match(id: string, skillId: string, prompt: string, pairs: { left: string; right: string }[], hint: string, explanation: string): Question {
  return vnQ(COMPOUND_TOPIC, {
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

// ---------------------------------------------------------------------------
// Bài 1 — Chữ ghép ch và nh
// ---------------------------------------------------------------------------

const g1 = 'vn_compound_ch_nh';
const g1Q: Question[] = [
  mc('vn-g1-1', g1, 1, {
    prompt: 'Từ nào dưới đây mở đầu bằng chữ ghép “ch”?',
    options: ['chó', 'nhà', 'nho', 'nhím'],
    correctAnswer: 'chó',
    hint: 'Đọc lần lượt các từ rồi nghe âm đầu.',
    explanation: '“chó” mở đầu bằng chữ ghép ch.',
  }),
  mc('vn-g1-2', g1, 1, {
    prompt: 'Chữ ghép “nh” là âm đầu của từ nào?',
    options: ['nhà', 'chó', 'chai', 'chợ'],
    correctAnswer: 'nhà',
    hint: 'Nơi gia đình em sinh sống.',
    explanation: '“nhà” mở đầu bằng chữ ghép nh.',
  }),
  fb('vn-g1-3', g1, 'Điền chữ ghép đầu cho từ “…ó” (con chó).', ['ch', 'nh', 'th', 'ph'], 'ch', 'Con vật nuôi trong nhà, sủa “gâu gâu”.', 'Điền “ch” được từ “chó”.'),
  img('vn-g1-4', g1, 'Hình 🏠 ứng với từ nào?', '🏠', ['nhà', 'nho', 'chó', 'chợ'], 'nhà', 'Nơi gia đình em ở.', 'Hình ngôi nhà ứng với từ “nhà”.'),
  tf('vn-g1-5', g1, 'Từ “chó” mở đầu bằng chữ ghép “ch”. Đúng hay sai?', 'Đúng', 'Đọc từ rồi nghe âm đầu tiên.', 'Đúng, “chó” mở đầu bằng ch.'),
  match('vn-g1-6', g1, 'Nối chữ ghép với từ mở đầu bằng chữ ghép đó:', [
    { left: 'ch', right: 'chó' },
    { left: 'nh', right: 'nhà' },
    { left: 'th', right: 'thỏ' },
    { left: 'ph', right: 'phở' },
  ], 'Chạm chữ ghép bên trái rồi chạm từ đúng bên phải.', 'ch–chó, nh–nhà, th–thỏ, ph–phở.'),
  mc('vn-g1-7', g1, 2, {
    prompt: 'Từ “nhím” mở đầu bằng chữ ghép nào?',
    options: ['Chữ ghép nh', 'Chữ ghép ch', 'Chữ ghép th', 'Chữ ghép ph'],
    correctAnswer: 'Chữ ghép nh',
    hint: 'Đọc từ và nghe âm đầu.',
    explanation: '“nhím” mở đầu bằng chữ ghép nh.',
  }),
  tf('vn-g1-8', g1, 'Cả “chai” và “chợ” đều bắt đầu bằng chữ ghép “ch”. Đúng hay sai?', 'Đúng', 'So sánh âm đầu của hai từ.', 'Đúng, cả hai từ đều mở đầu bằng ch.'),
  fb('vn-g1-9', g1, 'Điền từ còn thiếu: “Con ___ kêu gâu gâu.”', ['chó', 'nhà', 'nho', 'chợ'], 'chó', 'Con vật trông nhà giúp em.', 'Điền “chó”: Con chó kêu gâu gâu.'),
  mc('vn-g1-10', g1, 2, {
    prompt: 'Từ nào KHÔNG bắt đầu bằng “ch”?',
    options: ['nhà', 'chó', 'chai', 'chợ'],
    correctAnswer: 'nhà',
    hint: 'Ba từ cùng âm đầu, một từ khác thì không.',
    explanation: '“nhà” mở đầu bằng nh, còn lại mở đầu bằng ch.',
  }),
];
const lessonG1 = vnLesson(COMPOUND_TOPIC, 'vn-les-g1', 'Chữ ghép ch và nh', 'Nhận biết chữ ghép ch, nh qua các từ quen thuộc.', 'Nghe kĩ âm đầu để nhận ra ch hay nh nhé!', g1Q);

// ---------------------------------------------------------------------------
// Bài 2 — Chữ ghép ph và th
// ---------------------------------------------------------------------------

const g2 = 'vn_compound_ph_th';
const g2Q: Question[] = [
  mc('vn-g2-1', g2, 1, {
    prompt: 'Từ nào dưới đây mở đầu bằng chữ ghép “ph”?',
    options: ['phở', 'thỏ', 'thuyền', 'thơ'],
    correctAnswer: 'phở',
    hint: 'Đọc lần lượt các từ rồi nghe âm đầu.',
    explanation: '“phở” mở đầu bằng chữ ghép ph.',
  }),
  mc('vn-g2-2', g2, 1, {
    prompt: 'Chữ ghép “th” là âm đầu của từ nào?',
    options: ['thỏ', 'phở', 'phố', 'mèo'],
    correctAnswer: 'thỏ',
    hint: 'Con vật nhỏ, tai dài, thích ăn cà rốt.',
    explanation: '“thỏ” mở đầu bằng chữ ghép th.',
  }),
  fb('vn-g2-3', g2, 'Điền chữ ghép đầu cho từ “…ở” (bát phở).', ['ph', 'th', 'ch', 'nh'], 'ph', 'Món nước nóng với bánh và thịt.', 'Điền “ph” được từ “phở”.'),
  img('vn-g2-4', g2, 'Hình 🐰 ứng với từ nào?', '🐰', ['thỏ', 'phở', 'phố', 'thuyền'], 'thỏ', 'Con vật nhỏ, tai dài.', 'Hình con thỏ ứng với từ “thỏ”.'),
  tf('vn-g2-5', g2, 'Từ “phở” mở đầu bằng chữ ghép “ph”. Đúng hay sai?', 'Đúng', 'Đọc từ rồi nghe âm đầu tiên.', 'Đúng, “phở” mở đầu bằng ph.'),
  match('vn-g2-6', g2, 'Nối chữ ghép với từ mở đầu bằng chữ ghép đó:', [
    { left: 'ph', right: 'phở' },
    { left: 'th', right: 'thỏ' },
    { left: 'ch', right: 'chó' },
    { left: 'nh', right: 'nhà' },
  ], 'Chạm chữ ghép bên trái rồi chạm từ đúng bên phải.', 'ph–phở, th–thỏ, ch–chó, nh–nhà.'),
  mc('vn-g2-7', g2, 2, {
    prompt: 'Từ “thuyền” mở đầu bằng chữ ghép nào?',
    options: ['Chữ ghép th', 'Chữ ghép ph', 'Chữ ghép nh', 'Chữ ghép ch'],
    correctAnswer: 'Chữ ghép th',
    hint: 'Đọc từ và nghe âm đầu.',
    explanation: '“thuyền” mở đầu bằng chữ ghép th.',
  }),
  tf('vn-g2-8', g2, 'Cả “phở” và “phố” đều bắt đầu bằng chữ ghép “ph”. Đúng hay sai?', 'Đúng', 'So sánh âm đầu của hai từ.', 'Đúng, cả hai từ đều mở đầu bằng ph.'),
  fb('vn-g2-9', g2, 'Điền từ đúng vào chỗ trống: “Mẹ nấu ___ bò.”', ['phở', 'thỏ', 'phố', 'thuyền'], 'phở', 'Món nước nóng, dùng bánh và thịt.', 'Điền “phở”: Mẹ nấu phở bò.'),
  mc('vn-g2-10', g2, 2, {
    prompt: 'Từ nào KHÔNG bắt đầu bằng “ph”?',
    options: ['thỏ', 'phở', 'phố', 'phà'],
    correctAnswer: 'thỏ',
    hint: 'Ba từ cùng âm đầu, một từ khác thì không.',
    explanation: '“thỏ” mở đầu bằng th, còn lại mở đầu bằng ph.',
  }),
];
const lessonG2 = vnLesson(COMPOUND_TOPIC, 'vn-les-g2', 'Chữ ghép ph và th', 'Nhận biết chữ ghép ph, th qua các từ quen thuộc.', 'ph và th đều là chữ ghép hai chữ cái nhé!', g2Q);

// ---------------------------------------------------------------------------
// Bài 3 — Chữ ghép kh và gh (quy tắc gh + e, ê, i)
// ---------------------------------------------------------------------------

const g3 = 'vn_compound_kh_gh';
const g3Q: Question[] = [
  mc('vn-g3-1', g3, 1, {
    prompt: 'Từ nào dưới đây mở đầu bằng chữ ghép “kh”?',
    options: ['khỉ', 'ghế', 'ghẹ', 'mèo'],
    correctAnswer: 'khỉ',
    hint: 'Đọc lần lượt các từ rồi nghe âm đầu.',
    explanation: '“khỉ” mở đầu bằng chữ ghép kh.',
  }),
  mc('vn-g3-2', g3, 1, {
    prompt: 'Chữ ghép “gh” là âm đầu của từ nào?',
    options: ['ghế', 'khỉ', 'khế', 'hoa'],
    correctAnswer: 'ghế',
    hint: 'Đồ dùng để ngồi.',
    explanation: '“ghế” mở đầu bằng chữ ghép gh.',
  }),
  fb('vn-g3-3', g3, 'Điền chữ ghép đầu cho từ “…ỉ” (con khỉ).', ['kh', 'gh', 'ng', 'ngh'], 'kh', 'Con vật leo cây rất giỏi.', 'Điền “kh” được từ “khỉ”.'),
  img('vn-g3-4', g3, 'Hình 🐒 ứng với từ nào?', '🐒', ['khỉ', 'ghế', 'khế', 'ghẹ'], 'khỉ', 'Con vật leo cây rất giỏi.', 'Hình con khỉ ứng với từ “khỉ”.'),
  tf('vn-g3-5', g3, 'Từ “khỉ” mở đầu bằng chữ ghép “kh”. Đúng hay sai?', 'Đúng', 'Đọc từ rồi nghe âm đầu tiên.', 'Đúng, “khỉ” mở đầu bằng kh.'),
  match('vn-g3-6', g3, 'Nối chữ ghép với từ mở đầu bằng chữ ghép đó:', [
    { left: 'kh', right: 'khỉ' },
    { left: 'gh', right: 'ghế' },
    { left: 'ph', right: 'phở' },
    { left: 'th', right: 'thỏ' },
  ], 'Chạm chữ ghép bên trái rồi chạm từ đúng bên phải.', 'kh–khỉ, gh–ghế, ph–phở, th–thỏ.'),
  mc('vn-g3-7', g3, 2, {
    prompt: 'Từ “ghẹ” mở đầu bằng chữ ghép nào?',
    options: ['Chữ ghép gh', 'Chữ ghép kh', 'Chữ ghép th', 'Chữ ghép ph'],
    correctAnswer: 'Chữ ghép gh',
    hint: 'Đọc từ và nghe âm đầu.',
    explanation: '“ghẹ” mở đầu bằng chữ ghép gh.',
  }),
  tf('vn-g3-8', g3, 'Cả “khỉ” và “khế” đều bắt đầu bằng chữ ghép “kh”. Đúng hay sai?', 'Đúng', 'So sánh âm đầu của hai từ.', 'Đúng, cả hai từ đều mở đầu bằng kh.'),
  fb('vn-g3-9', g3, 'Điền từ đúng vào chỗ trống: “Bé ngồi trên ___.”', ['ghế', 'khỉ', 'khế', 'ghẹ'], 'ghế', 'Đồ dùng để ngồi.', 'Điền “ghế”: Bé ngồi trên ghế.'),
  mc('vn-g3-10', g3, 2, {
    prompt: 'Từ nào KHÔNG bắt đầu bằng “kh”?',
    options: ['ghế', 'khỉ', 'khế', 'khuya'],
    correctAnswer: 'ghế',
    hint: 'Ba từ cùng âm đầu, một từ khác thì không.',
    explanation: '“ghế” mở đầu bằng gh, còn lại mở đầu bằng kh.',
  }),
];
const lessonG3 = vnLesson(COMPOUND_TOPIC, 'vn-les-g3', 'Chữ ghép kh và gh', 'Nhận biết chữ ghép kh, gh và quy tắc gh + e, ê, i.', 'gh thường đứng trước e, ê, i nhé!', g3Q);

// ---------------------------------------------------------------------------
// Bài 4 — Chữ ghép gi, qu, tr
// ---------------------------------------------------------------------------

const g4 = 'vn_compound_gi_qu_tr';
const g4Q: Question[] = [
  mc('vn-g4-1', g4, 1, {
    prompt: 'Từ nào dưới đây mở đầu bằng chữ ghép “gi”?',
    options: ['giày', 'quả', 'trâu', 'quạ'],
    correctAnswer: 'giày',
    hint: 'Đọc lần lượt các từ rồi nghe âm đầu.',
    explanation: '“giày” mở đầu bằng chữ ghép gi.',
  }),
  mc('vn-g4-2', g4, 1, {
    prompt: 'Chữ ghép “qu” là âm đầu của từ nào?',
    options: ['quả', 'trâu', 'giày', 'gió'],
    correctAnswer: 'quả',
    hint: 'Trái cây chín ăn rất ngon.',
    explanation: '“quả” mở đầu bằng chữ ghép qu.',
  }),
  fb('vn-g4-3', g4, 'Điền chữ ghép đầu cho từ “…ày” (cái giày).', ['gi', 'qu', 'tr', 'nh'], 'gi', 'Đồ dùng đi ở chân.', 'Điền “gi” được từ “giày”.'),
  img('vn-g4-4', g4, 'Hình 🐃 ứng với từ nào?', '🐃', ['trâu', 'quạ', 'giày', 'giỏ'], 'trâu', 'Con vật to, có sừng, hay cày ruộng.', 'Hình con trâu ứng với từ “trâu”.'),
  tf('vn-g4-5', g4, 'Từ “giày” mở đầu bằng chữ ghép “gi”. Đúng hay sai?', 'Đúng', 'Đọc từ rồi nghe âm đầu tiên.', 'Đúng, “giày” mở đầu bằng gi.'),
  match('vn-g4-6', g4, 'Nối chữ ghép với từ mở đầu bằng chữ ghép đó:', [
    { left: 'gi', right: 'giày' },
    { left: 'qu', right: 'quả' },
    { left: 'tr', right: 'trâu' },
    { left: 'kh', right: 'khỉ' },
  ], 'Chạm chữ ghép bên trái rồi chạm từ đúng bên phải.', 'gi–giày, qu–quả, tr–trâu, kh–khỉ.'),
  mc('vn-g4-7', g4, 2, {
    prompt: 'Từ “giỏ” mở đầu bằng chữ ghép nào?',
    options: ['Chữ ghép gi', 'Chữ ghép qu', 'Chữ ghép tr', 'Chữ ghép nh'],
    correctAnswer: 'Chữ ghép gi',
    hint: 'Đồ đựng làm bằng mây tre.',
    explanation: '“giỏ” mở đầu bằng chữ ghép gi.',
  }),
  tf('vn-g4-8', g4, 'Cả “quả” và “quạ” đều bắt đầu bằng chữ ghép “qu”. Đúng hay sai?', 'Đúng', 'So sánh âm đầu của hai từ.', 'Đúng, cả hai từ đều mở đầu bằng qu.'),
  fb('vn-g4-9', g4, 'Điền từ đúng vào chỗ trống: “Chú ___ cày ruộng.”', ['trâu', 'quạ', 'giày', 'giỏ'], 'trâu', 'Con vật to, có sừng, giúp bác nông dân.', 'Điền “trâu”: Chú trâu cày ruộng.'),
  mc('vn-g4-10', g4, 2, {
    prompt: 'Từ nào KHÔNG bắt đầu bằng “gi”?',
    options: ['quả', 'giày', 'giỏ', 'già'],
    correctAnswer: 'quả',
    hint: 'Ba từ cùng âm đầu, một từ khác thì không.',
    explanation: '“quả” mở đầu bằng qu, còn lại mở đầu bằng gi.',
  }),
];
const lessonG4 = vnLesson(COMPOUND_TOPIC, 'vn-les-g4', 'Chữ ghép gi, qu, tr', 'Nhận biết chữ ghép gi, qu, tr qua các từ quen thuộc.', 'gi, qu, tr là ba chữ ghép hay gặp nhé!', g4Q);

// ---------------------------------------------------------------------------
// Bài 5 — Chữ ghép ng và ngh (quy tắc ngh + e, ê, i)
// ---------------------------------------------------------------------------

const g5 = 'vn_compound_ng_ngh';
const g5Q: Question[] = [
  mc('vn-g5-1', g5, 1, {
    prompt: 'Từ nào dưới đây mở đầu bằng chữ ghép “ng”?',
    options: ['ngựa', 'nghé', 'nghỉ', 'nghi'],
    correctAnswer: 'ngựa',
    hint: 'Đọc lần lượt các từ rồi nghe âm đầu.',
    explanation: '“ngựa” mở đầu bằng chữ ghép ng.',
  }),
  mc('vn-g5-2', g5, 1, {
    prompt: 'Chữ ghép “ngh” là âm đầu của từ nào?',
    options: ['nghé', 'ngựa', 'ngô', 'ngà'],
    correctAnswer: 'nghé',
    hint: 'Con bò còn nhỏ.',
    explanation: '“nghé” mở đầu bằng chữ ghép ngh.',
  }),
  fb('vn-g5-3', g5, 'Điền chữ ghép đầu cho từ “…ựa” (con ngựa).', ['ng', 'ngh', 'nh', 'kh'], 'ng', 'Con vật to, chạy nhanh, có bờm.', 'Điền “ng” được từ “ngựa”.'),
  img('vn-g5-4', g5, 'Hình 🌽 ứng với từ nào?', '🌽', ['ngô', 'ngựa', 'ngà', 'nghé'], 'ngô', 'Loại bắp vàng, luộc ăn rất ngon.', 'Hình bắp ngô ứng với từ “ngô”.'),
  tf('vn-g5-5', g5, 'Từ “ngựa” mở đầu bằng chữ ghép “ng”. Đúng hay sai?', 'Đúng', 'Đọc từ rồi nghe âm đầu tiên.', 'Đúng, “ngựa” mở đầu bằng ng.'),
  match('vn-g5-6', g5, 'Nối chữ ghép với từ mở đầu bằng chữ ghép đó:', [
    { left: 'ng', right: 'ngựa' },
    { left: 'ngh', right: 'nghé' },
    { left: 'nh', right: 'nhà' },
    { left: 'ch', right: 'chó' },
  ], 'Chạm chữ ghép bên trái rồi chạm từ đúng bên phải.', 'ng–ngựa, ngh–nghé, nh–nhà, ch–chó.'),
  mc('vn-g5-7', g5, 2, {
    prompt: 'Từ “nghỉ” mở đầu bằng chữ ghép nào?',
    options: ['Chữ ghép ngh', 'Chữ ghép ng', 'Chữ ghép nh', 'Chữ ghép ch'],
    correctAnswer: 'Chữ ghép ngh',
    hint: 'Đọc từ và nghe âm đầu.',
    explanation: '“nghỉ” mở đầu bằng chữ ghép ngh.',
  }),
  tf('vn-g5-8', g5, 'Cả “ngựa” và “ngô” đều bắt đầu bằng chữ ghép “ng”. Đúng hay sai?', 'Đúng', 'So sánh âm đầu của hai từ.', 'Đúng, cả hai từ đều mở đầu bằng ng.'),
  fb('vn-g5-9', g5, 'Điền từ đúng: “Cuối tuần, bé được ___ ngơi.”', ['nghỉ', 'nghi', 'nghé', 'ngà'], 'nghỉ', 'Được thư giãn, không phải học.', 'Điền “nghỉ”: Cuối tuần, bé được nghỉ ngơi.'),
  mc('vn-g5-10', g5, 2, {
    prompt: 'Từ nào KHÔNG bắt đầu bằng “ng”?',
    options: ['nghé', 'ngựa', 'ngô', 'ngà'],
    correctAnswer: 'nghé',
    hint: 'Ba từ cùng âm đầu, một từ khác thì không.',
    explanation: '“nghé” mở đầu bằng ngh, còn lại mở đầu bằng ng.',
  }),
];
const lessonG5 = vnLesson(COMPOUND_TOPIC, 'vn-les-g5', 'Chữ ghép ng và ngh', 'Nhận biết chữ ghép ng, ngh và quy tắc ngh + e, ê, i.', 'ngh đứng trước e, ê, i; ng đứng trước các âm còn lại nhé!', g5Q);

// ---------------------------------------------------------------------------
// Bài 6 — Ôn tập chữ ghép
// ---------------------------------------------------------------------------

const g6 = 'vn_compound_review';
const g6Q: Question[] = [
  mc('vn-g6-1', g6, 2, {
    prompt: 'Từ nào dưới đây mở đầu bằng chữ ghép “ch”?',
    options: ['chó', 'nhà', 'thỏ', 'phở'],
    correctAnswer: 'chó',
    hint: 'Đọc từ và nghe âm đầu.',
    explanation: '“chó” mở đầu bằng chữ ghép ch.',
  }),
  fb('vn-g6-2', g6, 'Điền chữ ghép đầu cho từ “…ế” (cái ghế).', ['gh', 'kh', 'ng', 'ngh'], 'gh', 'Đồ dùng để ngồi.', 'Điền “gh” được từ “ghế”.'),
  match('vn-g6-3', g6, 'Nối từ với chữ ghép mở đầu:', [
    { left: 'chó', right: 'ch' },
    { left: 'nhà', right: 'nh' },
    { left: 'thỏ', right: 'th' },
    { left: 'phở', right: 'ph' },
  ], 'Chạm từ bên trái rồi chạm chữ ghép đúng bên phải.', 'chó–ch, nhà–nh, thỏ–th, phở–ph.'),
  mc('vn-g6-4', g6, 2, {
    prompt: 'Chữ ghép “tr” là âm đầu của từ nào?',
    options: ['trâu', 'giày', 'quả', 'quạ'],
    correctAnswer: 'trâu',
    hint: 'Con vật to, có sừng, giúp bác nông dân.',
    explanation: '“trâu” mở đầu bằng chữ ghép tr.',
  }),
  tf('vn-g6-5', g6, 'Chữ ghép “gh” và “ngh” đều ghép với e, ê, i. Đúng hay sai?', 'Đúng', 'Nhớ quy tắc chính tả đã học.', 'Đúng: gh và ngh đi với e, ê, i.'),
  mc('vn-g6-6', g6, 2, {
    prompt: 'Từ “quả” và “quạ” cùng mở đầu bằng cặp chữ nào?',
    options: ['qu', 'gi', 'tr', 'ng'],
    correctAnswer: 'qu',
    hint: 'Đọc hai từ rồi nghe âm đầu.',
    explanation: '“quả”, “quạ” đều mở đầu bằng qu.',
  }),
  fb('vn-g6-7', g6, 'Điền chữ ghép đầu cho từ “…ày” (cái giày).', ['gi', 'qu', 'tr', 'nh'], 'gi', 'Đồ dùng đi ở chân.', 'Điền “gi” được từ “giày”.'),
  tf('vn-g6-8', g6, '“Nghé” mở đầu bằng chữ ghép “ng”. Đúng hay sai?', 'Sai', 'Đọc từ rồi nghe âm đầu tiên.', 'Sai, “nghé” mở đầu bằng ngh.'),
  mc('vn-g6-9', g6, 2, {
    prompt: 'Từ “ngựa” mở đầu bằng chữ ghép nào?',
    options: ['Chữ ghép ng', 'Chữ ghép ngh', 'Chữ ghép nh', 'Chữ ghép ch'],
    correctAnswer: 'Chữ ghép ng',
    hint: 'Đọc từ và nghe âm đầu.',
    explanation: '“ngựa” mở đầu bằng chữ ghép ng.',
  }),
  img('vn-g6-10', g6, 'Hình 🐦 ứng với từ nào?', '🐦', ['quạ', 'trâu', 'giày', 'ngựa'], 'quạ', 'Con chim màu đen, thường hay kêu to.', 'Hình con chim ứng với từ “quạ”.'),
];
const lessonG6 = vnLesson(COMPOUND_TOPIC, 'vn-les-g6', 'Ôn tập chữ ghép', 'Ôn lại các chữ ghép đã học: ch, nh, ph, th, kh, gh, gi, qu, tr, ng, ngh.', 'Cùng nhớ lại tất cả các chữ ghép nhé!', g6Q);

export const COMPOUND_LESSONS: Lesson[] = [lessonG1, lessonG2, lessonG3, lessonG4, lessonG5, lessonG6];

export const COMPOUND_SKILLS: string[] = [g1, g2, g3, g4, g5, g6];
