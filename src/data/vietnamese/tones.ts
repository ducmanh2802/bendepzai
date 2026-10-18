import type { Lesson, Question } from '../../types';
import { vnQ, vnLesson } from './factory';

/**
 * T10A — Dấu thanh (spec T10 §2).
 *
 * Four lessons that move from recognising the five tones to applying the
 * current-SGK placement rule (dấu on the main vowel: hoà, khoẻ, thuỷ) and to
 * telling apart the easily-confused hỏi/ngã and huyền/nặng pairs.
 *
 * Tone-placement note: all toned syllables below follow the *current* textbook
 * style — the mark sits on the main vowel (a/e/y in oa/oe/uy), so "hoà",
 * "khoẻ", "thuỷ" (never "hòa"/"khỏe"/"thủy"). tests/vietnamese-curriculum.test.ts
 * guards this.
 */

const TOPIC = 'vn-dau-thanh';

type Q = Parameters<typeof vnQ>[1];

function choice(id: string, skillId: string, difficulty: 1 | 2 | 3, q: Omit<Q, 'id' | 'skillId' | 'difficulty' | 'type'>): Question {
  return vnQ(TOPIC, { ...q, id, skillId, difficulty, type: 'multiple-choice' });
}

function trueFalse(id: string, skillId: string, prompt: string, correct: 'Đúng' | 'Sai', hint: string, explanation: string, emoji?: string): Question {
  return vnQ(TOPIC, {
    id,
    skillId,
    difficulty: 2,
    type: 'true-false',
    prompt,
    options: ['Đúng', 'Sai'],
    correctAnswer: correct,
    mediaEmoji: emoji,
    hint,
    explanation,
  });
}

function imageChoice(id: string, skillId: string, prompt: string, emoji: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(TOPIC, {
    id,
    skillId,
    difficulty: 1,
    type: 'image-choice',
    prompt,
    mediaEmoji: emoji,
    options,
    correctAnswer: correct,
    hint,
    explanation,
  });
}

function fillBlank(id: string, skillId: string, prompt: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(TOPIC, {
    id,
    skillId,
    difficulty: 2,
    type: 'fill-blank',
    prompt,
    options,
    correctAnswer: correct,
    hint,
    explanation,
  });
}

// ---------------------------------------------------------------------------
// Bài 1 — Thanh ngang và thanh sắc
// ---------------------------------------------------------------------------

const t1Skill = 'vn_tone_ngang_sac';

const t1Questions: Question[] = [
  choice('vn-t1-1', t1Skill, 1, {
    prompt: 'Thêm dấu sắc vào tiếng “la” ta được tiếng nào?',
    options: ['lá', 'là', 'lả', 'lạ'],
    correctAnswer: 'lá',
    hint: 'Dấu sắc là nét xiên phải, đọc cao và nhẹ.',
    explanation: '“la” thêm dấu sắc thành “lá”.',
  }),
  choice('vn-t1-2', t1Skill, 1, {
    prompt: 'Tiếng “cá” có dấu thanh gì?',
    mediaEmoji: '🐟',
    options: ['Thanh sắc', 'Thanh huyền', 'Thanh ngang', 'Thanh nặng'],
    correctAnswer: 'Thanh sắc',
    hint: 'Nghe giọng đọc khi gọi tên con vật dưới nước.',
    explanation: '“cá” mang thanh sắc.',
  }),
  trueFalse(
    'vn-t1-3',
    t1Skill,
    'Tiếng “ba” và tiếng “bá” viết giống nhau hoàn toàn. Đúng hay sai?',
    'Sai',
    'Chú ý dấu thanh đặt trên chữ cái.',
    'Sai, vì “ba” không dấu còn “bá” có dấu sắc.'
  ),
  choice('vn-t1-4', t1Skill, 2, {
    prompt: 'Chọn tiếng mang dấu sắc:',
    options: ['lá', 'la', 'là', 'lạ'],
    correctAnswer: 'lá',
    hint: 'Tìm tiếng có nét xiên phải trên đầu chữ cái.',
    explanation: '“lá” mang dấu sắc.',
  }),
  vnQ(TOPIC, {
    id: 'vn-t1-5',
    skillId: t1Skill,
    difficulty: 2,
    type: 'matching',
    prompt: 'Nối tiếng chưa dấu với tiếng đã thêm dấu sắc:',
    options: ['bá', 'cá', 'lá', 'hoá'],
    correctAnswer: 'ba=bá|ca=cá|la=lá|hoa=hoá',
    matchingPairs: [
      { left: 'ba', right: 'bá' },
      { left: 'ca', right: 'cá' },
      { left: 'la', right: 'lá' },
      { left: 'hoa', right: 'hoá' },
    ],
    hint: 'Chạm tiếng bên trái rồi chạm tiếng có dấu sắc tương ứng.',
    explanation: 'ba–bá, ca–cá, la–lá, hoa–hoá.',
  }),
  imageChoice(
    'vn-t1-6',
    t1Skill,
    'Hình 🐟 ứng với tiếng nào?',
    '🐟',
    ['cá', 'cà', 'cả', 'cạ'],
    'cá',
    'Đọc tên con vật trong hình rồi chọn tiếng có dấu sắc.',
    'Hình con cá ứng với tiếng “cá”.'
  ),
  choice('vn-t1-7', t1Skill, 2, {
    prompt: 'Tiếng nào dưới đây KHÔNG có dấu thanh?',
    options: ['ba', 'bá', 'bà', 'bạ'],
    correctAnswer: 'ba',
    hint: 'Tìm tiếng không có nét dấu nào trên chữ cái.',
    explanation: '“ba” không có dấu thanh (thanh ngang).',
  }),
  trueFalse(
    'vn-t1-8',
    t1Skill,
    'Tiếng “cá” mang thanh sắc. Đúng hay sai?',
    'Đúng',
    'Đọc tiếng này và nghe giọng cao lên.',
    'Đúng, “cá” mang thanh sắc.',
    '🐟'
  ),
  choice('vn-t1-9', t1Skill, 2, {
    prompt: 'Tiếng “hoa” thêm dấu sắc thành tiếng nào?',
    options: ['hoá', 'hoà', 'hoả', 'hoạ'],
    correctAnswer: 'hoá',
    hint: 'Dấu thanh đặt trên nguyên âm chính của “oa”.',
    explanation: '“hoa” thêm dấu sắc thành “hoá” (dấu trên chữ a).',
  }),
  fillBlank(
    'vn-t1-10',
    t1Skill,
    'Điền tiếng còn thiếu: “Con ___ bơi dưới nước.”',
    ['cá', 'cà', 'cả', 'cạ'],
    'cá',
    'Con vật này bơi dưới nước và có dấu sắc.',
    'Điền “cá”: Con cá bơi dưới nước.'
  ),
];

const lessonT1: Lesson = vnLesson(
  TOPIC,
  'vn-les-t1',
  'Thanh ngang và thanh sắc',
  'Nhận biết tiếng không dấu và tiếng mang dấu sắc.',
  'Dấu sắc là nét xiên phải, đọc cao và nhẹ nhé!',
  t1Questions
);

// ---------------------------------------------------------------------------
// Bài 2 — Vị trí đặt dấu thanh (hoà, khoẻ, thuỷ)
// ---------------------------------------------------------------------------

const t2Skill = 'vn_tone_position';

const t2Questions: Question[] = [
  choice('vn-t2-1', t2Skill, 2, {
    prompt: 'Thêm dấu huyền vào tiếng “hoa”, cách viết đúng là:',
    options: ['hoà', 'hòa', 'hoá', 'hoả'],
    correctAnswer: 'hoà',
    hint: 'Với “oa”, dấu đặt trên nguyên âm chính là chữ a.',
    explanation: 'SGK hiện hành viết “hoà” — dấu huyền trên chữ a.',
  }),
  choice('vn-t2-2', t2Skill, 2, {
    prompt: 'Viết đúng chính tả: tiếng “khoe” thêm dấu hỏi thành từ nào?',
    options: ['khoẻ', 'khỏe', 'khoẽ', 'khoè'],
    correctAnswer: 'khoẻ',
    hint: 'Với “oe”, dấu đặt trên nguyên âm chính là chữ e.',
    explanation: 'SGK hiện hành viết “khoẻ” — dấu hỏi trên chữ e.',
  }),
  choice('vn-t2-3', t2Skill, 2, {
    prompt: 'Bé khoanh vào cách viết đúng của tiếng “thuy” khi thêm dấu hỏi:',
    options: ['thuỷ', 'thủy', 'thũy', 'thùy'],
    correctAnswer: 'thuỷ',
    hint: 'Với “uy”, dấu đặt trên nguyên âm chính là chữ y.',
    explanation: 'SGK hiện hành viết “thuỷ” — dấu hỏi trên chữ y.',
  }),
  trueFalse(
    'vn-t2-4',
    t2Skill,
    'Cách viết “hòa” là đúng theo sách giáo khoa hiện hành. Đúng hay sai?',
    'Sai',
    'Nhớ quy tắc đặt dấu ở nguyên âm chính.',
    'Sai, SGK hiện hành viết “hoà”.'
  ),
  choice('vn-t2-5', t2Skill, 2, {
    prompt: 'Trong tiếng “hoà”, dấu huyền được đặt ở chữ cái nào?',
    options: ['Chữ a', 'Chữ h', 'Chữ o', 'Không đặt ở chữ nào'],
    correctAnswer: 'Chữ a',
    hint: 'Nhìn kĩ vị trí dấu thanh trong từ đã cho.',
    explanation: 'Dấu huyền đặt trên chữ a: h-o-à.',
  }),
  vnQ(TOPIC, {
    id: 'vn-t2-6',
    skillId: t2Skill,
    difficulty: 2,
    type: 'matching',
    prompt: 'Nối tiếng gốc với cách viết đúng dấu thanh:',
    options: ['hoà', 'khoẻ', 'thuỷ'],
    correctAnswer: 'hoa=hoà|khoe=khoẻ|thuy=thuỷ',
    matchingPairs: [
      { left: 'hoa', right: 'hoà' },
      { left: 'khoe', right: 'khoẻ' },
      { left: 'thuy', right: 'thuỷ' },
    ],
    hint: 'Dấu thanh luôn đặt trên nguyên âm chính.',
    explanation: 'hoa–hoà, khoe–khoẻ, thuy–thuỷ.',
  }),
  choice('vn-t2-7', t2Skill, 1, {
    prompt: 'Tiếng “hoà” mang dấu thanh gì?',
    options: ['Dấu huyền', 'Dấu sắc', 'Dấu hỏi', 'Dấu ngã'],
    correctAnswer: 'Dấu huyền',
    hint: 'Quan sát nét dấu nằm trên chữ a.',
    explanation: '“hoà” mang dấu huyền.',
  }),
  trueFalse(
    'vn-t2-8',
    t2Skill,
    'Trong tiếng “khoẻ”, dấu hỏi đặt trên chữ e. Đúng hay sai?',
    'Đúng',
    'Nhìn vị trí dấu thanh trong từ đã cho.',
    'Đúng, dấu hỏi đặt trên chữ e.'
  ),
  choice('vn-t2-9', t2Skill, 1, {
    prompt: 'Khi bỏ dấu thanh, tiếng “khoẻ” trở thành:',
    options: ['khoe', 'khỏe', 'khoè', 'khòe'],
    correctAnswer: 'khoe',
    hint: 'Bỏ dấu thanh, giữ nguyên các chữ cái.',
    explanation: 'Bỏ dấu hỏi, “khoẻ” thành “khoe”.',
  }),
  choice('vn-t2-10', t2Skill, 3, {
    prompt: 'Câu nào viết đúng theo SGK hiện hành?',
    options: [
      'Bé hoà nhập cùng các bạn.',
      'Bé hòa nhập cùng các bạn.',
      'Bé hỏa nhập cùng các bạn.',
      'Bé hoạ nhập cùng các bạn.',
    ],
    correctAnswer: 'Bé hoà nhập cùng các bạn.',
    hint: 'Dấu huyền đặt trên nguyên âm chính a của “oa”.',
    explanation: 'Viết đúng là “hoà nhập”.',
  }),
];

const lessonT2: Lesson = vnLesson(
  TOPIC,
  'vn-les-t2',
  'Vị trí đặt dấu thanh',
  'Đặt dấu thanh trên nguyên âm chính: hoà, khoẻ, thuỷ.',
  'Dấu thanh luôn nằm trên nguyên âm chính nhé!',
  t2Questions
);

// ---------------------------------------------------------------------------
// Bài 3 — Phân biệt thanh hỏi và thanh ngã
// ---------------------------------------------------------------------------

const t3Skill = 'vn_tone_hoi_nga';

const t3Questions: Question[] = [
  choice('vn-t3-1', t3Skill, 1, {
    prompt: 'Tiếng “sữa” (sữa bò) mang dấu thanh gì?',
    mediaEmoji: '🥛',
    options: ['Dấu ngã', 'Dấu hỏi', 'Dấu sắc', 'Dấu huyền'],
    correctAnswer: 'Dấu ngã',
    hint: 'Đây là thức uống màu trắng của con bò.',
    explanation: '“sữa” mang dấu ngã.',
  }),
  choice('vn-t3-2', t3Skill, 1, {
    prompt: 'Tiếng “sửa” (sửa xe) mang dấu thanh gì?',
    mediaEmoji: '🔧',
    options: ['Dấu hỏi', 'Dấu ngã', 'Dấu sắc', 'Dấu huyền'],
    correctAnswer: 'Dấu hỏi',
    hint: 'Dấu này trông như một móc câu nhỏ trên chữ.',
    explanation: '“sửa” mang dấu hỏi.',
  }),
  trueFalse(
    'vn-t3-3',
    t3Skill,
    'Hai từ “sữa bò” và “sửa xe” được viết cùng một dấu thanh. Đúng hay sai?',
    'Sai',
    'Đọc kĩ dấu thanh của hai từ.',
    'Sai: “sữa” dấu ngã, còn “sửa” dấu hỏi.'
  ),
  choice('vn-t3-4', t3Skill, 2, {
    prompt: 'Điền tiếng đúng vào chỗ trống: “Con bò cho bé ___.”',
    mediaEmoji: '🐄',
    options: ['sữa', 'sửa', 'sứa', 'sựa'],
    correctAnswer: 'sữa',
    hint: 'Đây là thức uống màu trắng, bổ dưỡng.',
    explanation: 'Con bò cho bé “sữa”.',
  }),
  choice('vn-t3-5', t3Skill, 2, {
    prompt: 'Điền tiếng đúng vào chỗ trống: “Bố ___ chiếc xe đạp cho bé.”',
    mediaEmoji: '🚲',
    options: ['sửa', 'sữa', 'sựa', 'sứa'],
    correctAnswer: 'sửa',
    hint: 'Nghĩa là làm cho chiếc xe chạy được.',
    explanation: 'Bố “sửa” chiếc xe đạp.',
  }),
  trueFalse(
    'vn-t3-6',
    t3Skill,
    'Hai tiếng “vỏ” và “võ” chỉ khác nhau ở dấu thanh. Đúng hay sai?',
    'Đúng',
    'So sánh hai tiếng gần giống nhau này.',
    'Đúng: “vỏ” dấu hỏi, “võ” dấu ngã.'
  ),
  vnQ(TOPIC, {
    id: 'vn-t3-7',
    skillId: t3Skill,
    difficulty: 2,
    type: 'matching',
    prompt: 'Nối tiếng với từ ghép có nghĩa đúng:',
    options: ['sữa bò', 'sửa xe', 'vỏ cây', 'võ thuật'],
    correctAnswer: 'sữa=sữa bò|sửa=sửa xe|vỏ=vỏ cây|võ=võ thuật',
    matchingPairs: [
      { left: 'sữa', right: 'sữa bò' },
      { left: 'sửa', right: 'sửa xe' },
      { left: 'vỏ', right: 'vỏ cây' },
      { left: 'võ', right: 'võ thuật' },
    ],
    hint: 'Chú ý dấu thanh để nối đúng nghĩa.',
    explanation: 'sữa–sữa bò, sửa–sửa xe, vỏ–vỏ cây, võ–võ thuật.',
  }),
  choice('vn-t3-8', t3Skill, 2, {
    prompt: 'Tiếng “ngã” mang dấu thanh gì?',
    options: ['Dấu ngã', 'Dấu hỏi', 'Dấu nặng', 'Dấu huyền'],
    correctAnswer: 'Dấu ngã',
    hint: 'Đọc tiếng này: giọng đi xuống rồi lên.',
    explanation: '“ngã” mang dấu ngã.',
  }),
  choice('vn-t3-9', t3Skill, 2, {
    prompt: 'Tiếng “hỏi” mang dấu thanh nào?',
    options: ['Dấu hỏi', 'Dấu ngã', 'Dấu sắc', 'Dấu nặng'],
    correctAnswer: 'Dấu hỏi',
    hint: 'Dấu này có nét cong giống móc câu.',
    explanation: '“hỏi” mang dấu hỏi.',
  }),
  imageChoice(
    'vn-t3-10',
    t3Skill,
    'Hình 🐄🍼 ứng với tiếng nào?',
    '🐄',
    ['sữa', 'sửa', 'sứa', 'sựa'],
    'sữa',
    'Đây là thức ăn của em bé.',
    'Hình bò và bình sữa ứng với tiếng “sữa”.'
  ),
];

const lessonT3: Lesson = vnLesson(
  TOPIC,
  'vn-les-t3',
  'Phân biệt thanh hỏi và thanh ngã',
  'Nghe và phân biệt hai thanh dễ lẫn: hỏi và ngã.',
  'Thanh hỏi đọc xuống nhẹ, thanh ngã đọc xuống rồi lên nhé!',
  t3Questions
);

// ---------------------------------------------------------------------------
// Bài 4 — Thanh huyền và thanh nặng
// ---------------------------------------------------------------------------

const t4Skill = 'vn_tone_huyen_nang';

const t4Questions: Question[] = [
  choice('vn-t4-1', t4Skill, 1, {
    prompt: 'Tiếng “bàn” (cái bàn) mang dấu thanh gì?',
    mediaEmoji: '🪑',
    options: ['Dấu huyền', 'Dấu nặng', 'Dấu sắc', 'Dấu hỏi'],
    correctAnswer: 'Dấu huyền',
    hint: 'Dấu này là một nét xiên trái trên chữ.',
    explanation: '“bàn” mang dấu huyền.',
  }),
  choice('vn-t4-2', t4Skill, 1, {
    prompt: 'Tiếng “bạn” (bạn bè) mang dấu thanh gì?',
    mediaEmoji: '👫',
    options: ['Dấu nặng', 'Dấu huyền', 'Dấu sắc', 'Dấu ngã'],
    correctAnswer: 'Dấu nặng',
    hint: 'Dấu này là một chấm nhỏ dưới chữ.',
    explanation: '“bạn” mang dấu nặng.',
  }),
  trueFalse(
    'vn-t4-3',
    t4Skill,
    'Hai tiếng “cà” và “cạ” khác nhau ở dấu thanh. Đúng hay sai?',
    'Đúng',
    'Đọc và so sánh hai tiếng này.',
    'Đúng: “cà” dấu huyền, “cạ” dấu nặng.'
  ),
  choice('vn-t4-4', t4Skill, 2, {
    prompt: 'Điền tiếng đúng vào chỗ trống: “Mẹ mua ___ chua.”',
    mediaEmoji: '🍆',
    options: ['cà', 'cá', 'cạ', 'cả'],
    correctAnswer: 'cà',
    hint: 'Loại quả màu tím dùng để nấu ăn.',
    explanation: 'Mẹ mua “cà” chua.',
  }),
  choice('vn-t4-5', t4Skill, 2, {
    prompt: 'Điền tiếng đúng vào chỗ trống: “Bé không được lại gần ___ lửa.”',
    mediaEmoji: '🔥',
    options: ['lò', 'lọ', 'lỏ', 'lõ'],
    correctAnswer: 'lò',
    hint: 'Nơi đốt lửa để nấu ăn.',
    explanation: 'Bé không được lại gần “lò” lửa.',
  }),
  trueFalse(
    'vn-t4-6',
    t4Skill,
    'Tiếng “là” mang dấu huyền. Đúng hay sai?',
    'Đúng',
    'Quan sát nét dấu trên chữ a.',
    'Đúng, “là” mang dấu huyền.'
  ),
  vnQ(TOPIC, {
    id: 'vn-t4-7',
    skillId: t4Skill,
    difficulty: 2,
    type: 'matching',
    prompt: 'Nối tiếng với từ ghép có nghĩa đúng:',
    options: ['bàn học', 'bạn bè', 'cà tím', 'cạnh bàn'],
    correctAnswer: 'bàn=bàn học|bạn=bạn bè|cà=cà tím|cạ=cạnh bàn',
    matchingPairs: [
      { left: 'bàn', right: 'bàn học' },
      { left: 'bạn', right: 'bạn bè' },
      { left: 'cà', right: 'cà tím' },
      { left: 'cạ', right: 'cạnh bàn' },
    ],
    hint: 'Chú ý dấu thanh để nối đúng nghĩa.',
    explanation: 'bàn–bàn học, bạn–bạn bè, cà–cà tím, cạ–cạnh bàn.',
  }),
  choice('vn-t4-8', t4Skill, 1, {
    prompt: 'Tiếng “gà” (con gà) mang dấu thanh gì?',
    mediaEmoji: '🐔',
    options: ['Dấu huyền', 'Dấu nặng', 'Dấu hỏi', 'Dấu ngã'],
    correctAnswer: 'Dấu huyền',
    hint: 'Đọc tên con vật và nghe giọng xuống nhẹ.',
    explanation: '“gà” mang dấu huyền.',
  }),
  choice('vn-t4-9', t4Skill, 2, {
    prompt: 'Tiếng nào dưới đây mang dấu nặng?',
    options: ['lạ', 'la', 'là', 'lá'],
    correctAnswer: 'lạ',
    hint: 'Tìm tiếng có chấm nhỏ dưới chữ.',
    explanation: '“lạ” mang dấu nặng.',
  }),
  imageChoice(
    'vn-t4-10',
    t4Skill,
    'Hình 👵 ứng với tiếng nào?',
    '👵',
    ['bà', 'bá', 'bả', 'bạ'],
    'bà',
    'Người phụ nữ lớn tuổi trong gia đình.',
    'Hình bà ứng với tiếng “bà”.'
  ),
];

const lessonT4: Lesson = vnLesson(
  TOPIC,
  'vn-les-t4',
  'Thanh huyền và thanh nặng',
  'Nghe và phân biệt thanh huyền với thanh nặng.',
  'Thanh huyền đọc xuống nhẹ, thanh nặng đọc xuống và nặng hơn nhé!',
  t4Questions
);

// ---------------------------------------------------------------------------
// Bài 5 — Thanh ngang (không dấu)
// ---------------------------------------------------------------------------

const t5Skill = 'vn_tone_ngang';

const t5Questions: Question[] = [
  choice('vn-t5-1', t5Skill, 1, {
    prompt: 'Tiếng nào dưới đây không mang dấu thanh?',
    options: ['ba', 'bà', 'bá', 'bạ'],
    correctAnswer: 'ba',
    hint: 'Nhìn xem chữ cái có nét dấu nào phía trên không.',
    explanation: '“ba” không có dấu thanh, gọi là thanh ngang.',
  }),
  choice('vn-t5-2', t5Skill, 1, {
    prompt: 'Thanh ngang có hình dạng như thế nào?',
    options: ['Không có dấu', 'Nét xiên phải', 'Nét xiên trái', 'Chấm nhỏ'],
    correctAnswer: 'Không có dấu',
    hint: 'Đọc thật nhẹ và đều giọng.',
    explanation: 'Thanh ngang là tiếng không mang dấu thanh nào.',
  }),
  trueFalse(
    'vn-t5-3',
    t5Skill,
    'Tiếng “mưa” không mang dấu thanh. Đúng hay sai?',
    'Đúng',
    'Đọc tiếng này rồi xem có nét dấu nào không.',
    'Đúng, “mưa” mang thanh ngang (không dấu).'
  ),
  choice('vn-t5-4', t5Skill, 1, {
    prompt: 'Chọn tiếng mang thanh ngang:',
    options: ['hoa', 'hoà', 'hoá', 'hoả'],
    correctAnswer: 'hoa',
    hint: 'Tìm tiếng không có nét dấu trên chữ cái.',
    explanation: '“hoa” mang thanh ngang vì không có dấu.',
  }),
  imageChoice(
    'vn-t5-5',
    t5Skill,
    'Hình 🌸 ứng với tiếng nào?',
    '🌸',
    ['hoa', 'hoà', 'hoá', 'hoả'],
    'hoa',
    'Loài cây nở bông đẹp nhiều màu.',
    'Hình bông hoa ứng với tiếng “hoa”.'
  ),
  vnQ(TOPIC, {
    id: 'vn-t5-6',
    skillId: t5Skill,
    difficulty: 2,
    type: 'matching',
    prompt: 'Nối mỗi tiếng với dấu thanh của nó:',
    options: ['không dấu', 'huyền', 'sắc', 'nặng'],
    correctAnswer: 'ba=không dấu|bà=huyền|bá=sắc|bạ=nặng',
    matchingPairs: [
      { left: 'ba', right: 'không dấu' },
      { left: 'bà', right: 'huyền' },
      { left: 'bá', right: 'sắc' },
      { left: 'bạ', right: 'nặng' },
    ],
    hint: 'Chạm tiếng bên trái rồi chạm tên dấu bên phải.',
    explanation: 'ba–không dấu, bà–huyền, bá–sắc, bạ–nặng.',
  }),
  trueFalse(
    'vn-t5-7',
    t5Skill,
    'Tiếng “tre” mang thanh ngang. Đúng hay sai?',
    'Đúng',
    'Đọc tiếng này rồi quan sát chữ cái.',
    'Đúng, “tre” mang thanh ngang.'
  ),
  choice('vn-t5-8', t5Skill, 2, {
    prompt: 'Tiếng “cà” và tiếng “ca” khác nhau ở điểm nào?',
    options: ['Dấu thanh', 'Chữ cái đầu', 'Số tiếng', 'Phần vần'],
    correctAnswer: 'Dấu thanh',
    hint: 'So sánh hai tiếng này thật kĩ.',
    explanation: '“cà” có dấu huyền, “ca” không dấu — khác ở dấu thanh.',
  }),
  fillBlank(
    'vn-t5-9',
    t5Skill,
    'Điền tiếng đúng: “Cây ___ cao vút.”',
    ['tre', 'trè', 'tré', 'trẹ'],
    'tre',
    'Cây này thân thẳng, mọc thành bụi.',
    'Điền “tre”: Cây tre cao vút.'
  ),
  vnQ(TOPIC, {
    id: 'vn-t5-10',
    skillId: t5Skill,
    difficulty: 2,
    type: 'ordering',
    prompt: 'Sắp xếp các tiếng thành từ ghép “cây tre”:',
    options: ['tre', 'cây'],
    correctAnswer: 'cây|tre',
    orderingItems: ['cây', 'tre'],
    hint: 'Từ ghép này chỉ một loài cây.',
    explanation: 'Thứ tự đúng: cây tre.',
  }),
];

const lessonT5: Lesson = vnLesson(
  TOPIC,
  'vn-les-t5',
  'Thanh ngang',
  'Nhận biết tiếng không mang dấu thanh (thanh ngang).',
  'Tiếng không có dấu nào gọi là thanh ngang nhé!',
  t5Questions
);

// ---------------------------------------------------------------------------
// Bài 6 — Ôn tập dấu thanh
// ---------------------------------------------------------------------------

const t6Skill = 'vn_tone_review';

const t6Questions: Question[] = [
  choice('vn-t6-1', t6Skill, 1, {
    prompt: 'Dấu thanh nào đọc cao và nhẹ nhất?',
    options: ['Dấu sắc', 'Dấu huyền', 'Dấu hỏi', 'Dấu nặng'],
    correctAnswer: 'Dấu sắc',
    hint: 'Dấu này là một nét xiên phải trên chữ.',
    explanation: 'Dấu sắc đọc cao và nhẹ.',
  }),
  choice('vn-t6-2', t6Skill, 1, {
    prompt: 'Tiếng “vẽ” mang dấu thanh gì?',
    mediaEmoji: '🎨',
    options: ['Dấu ngã', 'Dấu hỏi', 'Dấu sắc', 'Dấu nặng'],
    correctAnswer: 'Dấu ngã',
    hint: 'Bé dùng bút màu để làm việc này.',
    explanation: '“vẽ” mang dấu ngã.',
  }),
  choice('vn-t6-3', t6Skill, 1, {
    prompt: 'Tiếng “vẹt” mang dấu thanh gì?',
    mediaEmoji: '🦜',
    options: ['Dấu nặng', 'Dấu hỏi', 'Dấu ngã', 'Dấu huyền'],
    correctAnswer: 'Dấu nặng',
    hint: 'Con chim này hay bắt chước tiếng người.',
    explanation: '“vẹt” mang dấu nặng.',
  }),
  trueFalse(
    'vn-t6-4',
    t6Skill,
    'Tiếng “mũ” mang dấu hỏi. Đúng hay sai?',
    'Sai',
    'Nhìn nét dấu trên chữ cái.',
    'Sai, “mũ” mang dấu ngã.'
  ),
  choice('vn-t6-5', t6Skill, 2, {
    prompt: 'Bỏ dấu thanh, tiếng “vẽ” trở thành tiếng nào?',
    options: ['ve', 'vè', 'vé', 'vẹ'],
    correctAnswer: 've',
    hint: 'Bỏ nét dấu, giữ nguyên các chữ cái.',
    explanation: 'Bỏ dấu ngã, “vẽ” thành “ve”.',
  }),
  vnQ(TOPIC, {
    id: 'vn-t6-6',
    skillId: t6Skill,
    difficulty: 2,
    type: 'matching',
    prompt: 'Nối mỗi tiếng với dấu thanh của nó:',
    options: ['nặng', 'sắc', 'huyền', 'ngã'],
    correctAnswer: 'mẹ=nặng|má=sắc|mà=huyền|vẽ=ngã',
    matchingPairs: [
      { left: 'mẹ', right: 'nặng' },
      { left: 'má', right: 'sắc' },
      { left: 'mà', right: 'huyền' },
      { left: 'vẽ', right: 'ngã' },
    ],
    hint: 'Chạm tiếng bên trái rồi chạm tên dấu bên phải.',
    explanation: 'mẹ–nặng, má–sắc, mà–huyền, vẽ–ngã.',
  }),
  imageChoice(
    'vn-t6-7',
    t6Skill,
    'Hình 🐟 ứng với tiếng nào?',
    '🐟',
    ['cá', 'cà', 'cả', 'cạ'],
    'cá',
    'Con vật này bơi dưới nước.',
    'Hình con cá ứng với tiếng “cá”.'
  ),
  choice('vn-t6-8', t6Skill, 2, {
    prompt: 'Thanh hỏi được đọc như thế nào?',
    options: ['Xuống nhẹ rồi lên', 'Đi xuống', 'Đi lên cao', 'Ngang bằng'],
    correctAnswer: 'Xuống nhẹ rồi lên',
    hint: 'Nghe cô đọc mẫu tiếng “hỏi”.',
    explanation: 'Thanh hỏi đọc xuống nhẹ rồi lên.',
  }),
  fillBlank(
    'vn-t6-9',
    t6Skill,
    'Điền tiếng đúng: “Bé rửa ___ trước khi ăn.”',
    ['mặt', 'mắt', 'mát', 'mạc'],
    'mặt',
    'Bộ phận này ở phía trước đầu em.',
    'Điền “mặt”: Bé rửa mặt trước khi ăn.'
  ),
  vnQ(TOPIC, {
    id: 'vn-t6-10',
    skillId: t6Skill,
    difficulty: 2,
    type: 'ordering',
    prompt: 'Sắp xếp các tiếng thành câu “Bé vẽ ông mặt trời”:',
    options: ['trời', 'Bé', 'mặt', 'vẽ', 'ông'],
    correctAnswer: 'Bé|vẽ|ông|mặt|trời',
    orderingItems: ['Bé', 'vẽ', 'ông', 'mặt', 'trời'],
    hint: 'Đầu câu là tên bạn nhỏ.',
    explanation: 'Câu đúng: Bé vẽ ông mặt trời.',
  }),
];

const lessonT6: Lesson = vnLesson(
  TOPIC,
  'vn-les-t6',
  'Ôn tập dấu thanh',
  'Ôn lại sáu thanh: ngang, huyền, sắc, hỏi, ngã, nặng.',
  'Cùng Gấu Bút Chì ôn lại tất cả các dấu thanh nhé!',
  t6Questions
);

export const TONE_LESSONS: Lesson[] = [lessonT1, lessonT2, lessonT3, lessonT4, lessonT5, lessonT6];

export const TONE_SKILLS: string[] = [t1Skill, t2Skill, t3Skill, t4Skill, t5Skill, t6Skill];
