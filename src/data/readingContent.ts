import {
  ReadingQuestion,
  ReadingPassage,
  ReadingSkillId,
  ReadingStage,
  ReadingTheme,
} from '../types/reading';

// T02C — skill taxonomy lives in `./readingTaxonomy` (no question payload)
// so startup modules can import metadata without the full bank.
import { READING_SKILLS, getReadingSkillById } from './readingTaxonomy';
export { READING_SKILLS, getReadingSkillById } from './readingTaxonomy';

// T13 — 24 truyện mới sống trong `./reading/` (lazy chunk), gộp vào đây.
import { T13_PASSAGES, T13_QUESTIONS } from './reading/t13-index';
export { T13_PASSAGES, T13_QUESTIONS, T13_PASSAGE_IDS, T13_QUESTION_IDS, T13_THEMES, isT13PassageUnlockedByLevel } from './reading/t13-index';

/**
 * ORIGINAL READING PASSAGES written for this application.
 *
 * These are NOT copied from any official exam paper. They are short, original
 * Grade-1 texts with a picture bank so pre-readers can decode meaning first.
 *
 * T13 — 12 truyện gốc giữ nguyên tại đây; 24 truyện mới nằm trong
 * `./reading/t13-*.ts` và được gộp vào `READING_PASSAGES` bên dưới.
 */
const LEGACY_READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'rp-sun-morning',
    title: 'Buổi Sáng Của Bé',
    level: 1,
    subject: 'tieng-viet',
    mediaEmoji: '🌅',
    paragraphs: [
      'Nắng sớm chiếu qua cửa sổ.',
      'Bé Lan đánh răng, rửa mặt và mặc đồng phục.',
      'Mẹ cho Bé ăn cháo rồi đưa Bé đến trường.',
    ],
    pictureBank: [
      { emoji: '🌞', label: 'nắng sớm' },
      { emoji: '🦷', label: 'đánh răng' },
      { emoji: '🍚', label: 'ăn cháo' },
      { emoji: '🎒', label: 'đến trường' },
    ],
    questionIds: ['rq-01-1', 'rq-01-2', 'rq-01-3', 'rq-01-4'],
    wordCount: 24,
  },
  {
    id: 'rp-birds-nest',
    title: 'Chim Và Tổ',
    level: 1,
    subject: 'tieng-viet',
    mediaEmoji: '🐦',
    paragraphs: [
      'Trên cành cây, có một chiếc tổ nhỏ.',
      'Đó là tổ của gia đình chim sẻ.',
      'Chim bố và chim mẹ lấy cỏ khô và lông mềm để làm tổ.',
      'Sáng sớm, chim sẻ kêu líu lo khi đi kiếm ăn.',
    ],
    pictureBank: [
      { emoji: '🌳', label: 'cành cây' },
      { emoji: '🐦', label: 'tổ' },
      { emoji: '🌾', label: 'cỏ khô' },
      { emoji: '🐣', label: 'chim non' },
    ],
    questionIds: ['rq-02-1', 'rq-02-2', 'rq-02-3', 'rq-02-4'],
    wordCount: 32,
  },
  {
    id: 'rp-rain-puddle',
    title: 'Mưa Rào',
    level: 2,
    subject: 'tieng-viet',
    mediaEmoji: '🌧️',
    paragraphs: [
      'Trưa hôm, mây đen kéo đến che kín mặt trời.',
      'Mưa rào lại rào, hạt nước lăn trên mái nhà.',
      'Bé chạy ra sân, đưa tay hứng mưa rồi cười toe toét.',
      'Sau cơn mưa, vũng nước nhỏ lấp loáng dưới nắng.',
    ],
    pictureBank: [
      { emoji: '☁️', label: 'mây đen' },
      { emoji: '🌧️', label: 'mưa rào' },
      { emoji: '🤲', label: 'hứng mưa' },
      { emoji: '🌈', label: 'nắng sau mưa' },
    ],
    questionIds: ['rq-03-1', 'rq-03-2', 'rq-03-3', 'rq-03-4'],
    wordCount: 36,
  },
  {
    id: 'rp-helping-mother',
    title: 'Bé Giúp Mẹ',
    level: 2,
    subject: 'tieng-viet',
    mediaEmoji: '🧹',
    paragraphs: [
      'Cuối tuần, mẹ dọn nhà thấy tấm thảm bị bẩn.',
      'Bé Liên hỏi: "Mẹ ơi, con giúp mẹ lau thảm nhé!"',
      'Bé lấy khăn ướt lau dọc theo sọc của thảm.',
      'Mẹ khen: "Con làm việc chăm chí quá!"',
    ],
    pictureBank: [
      { emoji: '🧹', label: 'dọn nhà' },
      { emoji: '🧽', label: 'lau thảm' },
      { emoji: '🧻', label: 'khăn ướt' },
      { emoji: '👍', label: 'chăm chỉ' },
    ],
    questionIds: ['rq-04-1', 'rq-04-2', 'rq-04-3', 'rq-04-4'],
    wordCount: 37,
  },
  {
    id: 'rp-school-garden',
    title: 'Vườn Trường',
    level: 3,
    subject: 'tieng-viet',
    mediaEmoji: '🌻',
    paragraphs: [
      'Góc sân trường có một vườn nhỏ do các lớp cùng chăm sóc.',
      'Lớp Một trồng cà chua, lớp Hai trồng ớt, lớp Ba trồng đậu.',
      'Mỗi sáng, học sinh tưới cây rồi ghi vào sổ tay nhận việc.',
      'Đến cuối tháng, vườn xanh tốt và ai cũng háo hức khoe rau của lớp mình.',
    ],
    pictureBank: [
      { emoji: '🍅', label: 'cà chua' },
      { emoji: '🌶️', label: 'ớt' },
      { emoji: '🥜', label: 'đậu' },
      { emoji: '📓', label: 'sổ tay' },
    ],
    questionIds: ['rq-05-1', 'rq-05-2', 'rq-05-3', 'rq-05-4'],
    wordCount: 43,
  },
  {
    id: 'rp-cat-sun',
    title: 'Mèo Mướp Tắm Nắng',
    level: 1,
    subject: 'tieng-viet',
    mediaEmoji: '🐈',
    paragraphs: [
      'Nhà bé có chú mèo mướp lông xám tro.',
      'Buổi trưa mèo hay nằm sưởi nắng bên thềm.',
      'Bé vuốt lưng mèo, mèo kêu gừ gừ thích thú.',
    ],
    pictureBank: [
      { emoji: '🐈', label: 'mèo mướp' },
      { emoji: '☀️', label: 'tắm nắng' },
      { emoji: '🏠', label: 'bên thềm' },
      { emoji: '🤲', label: 'vuốt lưng' },
    ],
    questionIds: ['rq-06-1', 'rq-06-2', 'rq-06-3', 'rq-06-4'],
    wordCount: 26,
  },
  {
    id: 'rp-duck-pond',
    title: 'Đàn Vịt Con',
    level: 1,
    subject: 'tieng-viet',
    mediaEmoji: '🦆',
    paragraphs: [
      'Ao nhà có ba chú vịt con lông vàng óng.',
      'Sáng sớm vịt mẹ dẫn con ra ao tập bơi.',
      'Vịt con kêu cạp cạp rồi lặn ngụp vui vẻ.',
    ],
    pictureBank: [
      { emoji: '🦆', label: 'vịt con' },
      { emoji: '🟡', label: 'lông vàng' },
      { emoji: '🏊', label: 'tập bơi' },
      { emoji: '🌊', label: 'ao nước' },
    ],
    questionIds: ['rq-07-1', 'rq-07-2', 'rq-07-3', 'rq-07-4'],
    wordCount: 25,
  },
  {
    id: 'rp-tet-market',
    title: 'Chợ Tết Quê Em',
    level: 2,
    subject: 'tieng-viet',
    mediaEmoji: '🧧',
    paragraphs: [
      'Sắp Tết, mẹ đưa bé ra chợ quê mua lá dong.',
      'Chợ đông vui, có hoa đào, hoa mai khoe sắc.',
      'Bé chọn quả dưa hấu tròn to để bày mâm ngũ quả.',
      'Về nhà, cả nhà cùng gói bánh chưng xanh.',
    ],
    pictureBank: [
      { emoji: '🧧', label: 'chợ Tết' },
      { emoji: '🌸', label: 'hoa đào' },
      { emoji: '🍉', label: 'dưa hấu' },
      { emoji: '🍘', label: 'bánh chưng' },
    ],
    questionIds: ['rq-08-1', 'rq-08-2', 'rq-08-3', 'rq-08-4'],
    wordCount: 38,
  },
  {
    id: 'rp-paper-boat',
    title: 'Thuyền Giấy Mưa Rào',
    level: 2,
    subject: 'tieng-viet',
    mediaEmoji: '⛵',
    paragraphs: [
      'Mưa rào ập đến, sân trường thành dòng sông nhỏ.',
      'Cả lớp ùa ra, thả những chiếc thuyền giấy đủ màu.',
      'Thuyền của bé Lan chạy nhanh nhất, cả lớp reo hò.',
      'Tạnh mưa, cầu vồng hiện ra, ai cũng cười toe toét.',
    ],
    pictureBank: [
      { emoji: '🌧️', label: 'mưa rào' },
      { emoji: '⛵', label: 'thuyền giấy' },
      { emoji: '👧', label: 'bé Lan' },
      { emoji: '🌈', label: 'cầu vồng' },
    ],
    questionIds: ['rq-09-1', 'rq-09-2', 'rq-09-3', 'rq-09-4'],
    wordCount: 39,
  },
  {
    id: 'rp-grandma-garden',
    title: 'Vườn Bà Ngoại',
    level: 2,
    subject: 'tieng-viet',
    mediaEmoji: '👵',
    paragraphs: [
      'Cuối tuần bé về thăm bà ngoại ở quê.',
      'Vườn bà có cam chín mọng, chuối trĩu buồng.',
      'Bà hái cho bé chùm nhãn ngọt lịm.',
      'Bé ôm bà, hứa sẽ chăm ngoan, học giỏi.',
    ],
    pictureBank: [
      { emoji: '👵', label: 'bà ngoại' },
      { emoji: '🍊', label: 'cam chín' },
      { emoji: '🍌', label: 'chuối' },
      { emoji: '🤗', label: 'ôm bà' },
    ],
    questionIds: ['rq-10-1', 'rq-10-2', 'rq-10-3', 'rq-10-4'],
    wordCount: 34,
  },
  {
    id: 'rp-lantern-night',
    title: 'Đêm Hội Trăng Rằm',
    level: 3,
    subject: 'tieng-viet',
    mediaEmoji: '🏮',
    paragraphs: [
      'Trung thu, sân đình treo đầy đèn lồng đỏ rực.',
      'Bé rước đèn ông sao, miệng hát líu lo.',
      'Mâm cỗ có bánh nướng, bánh dẻo và bưởi tỉa hoa.',
      'Trăng rằm tròn vành vạnh, chú Cuội như đang cười với bé.',
    ],
    pictureBank: [
      { emoji: '🏮', label: 'đèn lồng' },
      { emoji: '⭐', label: 'đèn ông sao' },
      { emoji: '🥮', label: 'bánh nướng' },
      { emoji: '🌕', label: 'trăng rằm' },
    ],
    questionIds: ['rq-11-1', 'rq-11-2', 'rq-11-3', 'rq-11-4'],
    wordCount: 42,
  },
  {
    id: 'rp-ant-bridge',
    title: 'Cây Cầu Kiến Nhỏ',
    level: 3,
    subject: 'tieng-viet',
    mediaEmoji: '🐜',
    paragraphs: [
      'Sau mưa, đàn kiến nhỏ muốn qua vũng nước lớn.',
      'Kiến đầu đàn nghĩ ra cách nối nhau thành cầu.',
      'Từng chú bám chặt nhau, cả đàn lần lượt bò qua.',
      'Qua được bờ, đàn kiến reo vui vì đã đoàn kết giúp nhau.',
    ],
    pictureBank: [
      { emoji: '🐜', label: 'đàn kiến' },
      { emoji: '🌧️', label: 'vũng nước' },
      { emoji: '🌉', label: 'cầu kiến' },
      { emoji: '🎉', label: 'reo vui' },
    ],
    questionIds: ['rq-12-1', 'rq-12-2', 'rq-12-3', 'rq-12-4'],
    wordCount: 44,
  },
];

/** T13 — toàn bộ ngân hàng = 12 truyện gốc + 24 truyện mới. */
export const READING_PASSAGES: ReadingPassage[] = [...LEGACY_READING_PASSAGES, ...T13_PASSAGES];

export function getReadingPassageById(id: string): ReadingPassage | undefined {
  return READING_PASSAGES.find((p) => p.id === id);
}

export function getPassagesByLevel(level: 1 | 2 | 3): ReadingPassage[] {
  return READING_PASSAGES.filter((p) => p.level === level);
}

/** T13 — truyện theo chủ đề (truyện cũ không có theme nên không xuất hiện). */
export function getPassagesByTheme(theme: ReadingTheme): ReadingPassage[] {
  return READING_PASSAGES.filter((p) => p.theme === theme);
}

/**
 * READING ITEMS — one per passage per stage, mixing word/accuracy work,
 * fluency work, comprehension (who/what/where/when/why/how), keyword finding
 * and question-understanding items.
 *
 * T13 — 48 câu gốc giữ nguyên tại đây; 144 câu mới nằm trong
 * `./reading/t13-*.ts` và được gộp vào `READING_QUESTIONS` bên dưới.
 */
const LEGACY_READING_QUESTIONS: ReadingQuestion[] = [
  // ---------- rp-sun-morning (level 1) ----------
  {
    id: 'rq-01-1',
    passageId: 'rp-sun-morning',
    subject: 'tieng-viet',
    skillId: 'RF-WORD-RECOGNITION',
    questionType: 'word-recognition',
    difficulty: 1,
    prompt: 'Đọc to từ này giúp mình nhé:',
    stimulus: 'trường',
    mediaEmoji: '🎒',
    options: ['trường', 'trương', 'trèng', 'trưởng'],
    correctAnswer: 'trường',
    wordCount: 1,
    explanation: '"Trường" là nơi bé đến học chung với các bạn. Tiếng ương trong "trường" nghe như tiếng "iêu" nhẹ.',
    estimatedSeconds: 12,
  },
  {
    id: 'rq-01-2',
    passageId: 'rp-sun-morning',
    subject: 'tieng-viet',
    skillId: 'RF-SYLLABLE-FLUENCY',
    questionType: 'syllable-clap',
    difficulty: 1,
    prompt: 'Từ này có mấy tiếng? Bé đếm tiếng cho mình nhé:',
    stimulus: 'nắng',
    options: ['1 tiếng', '2 tiếng', '3 tiếng', '4 tiếng'],
    correctAnswer: '1 tiếng',
    wordCount: 1,
    explanation: '"Nắng" là tiếng đơn vì chỉ có một âm: n + ắ + ng.',
    estimatedSeconds: 12,
  },
  {
    id: 'rq-01-3',
    passageId: 'rp-sun-morning',
    subject: 'tieng-viet',
    skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-who',
    difficulty: 1,
    prompt: 'Ai đánh răng và mặc đồng phục trong đoạn đọc?',
    options: ['Bé Lan', 'Bé Mít', 'Cô giáo', 'Mẹ'],
    correctAnswer: 'Bé Lan',
    wordCount: 3,
    explanation: 'Đoạn đọc ghi: "Bé Lan đánh răng, rửa mặt và mặc đồng phục."',
    estimatedSeconds: 25,
  },
  {
    id: 'rq-01-4',
    passageId: 'rp-sun-morning',
    subject: 'tieng-viet',
    skillId: 'RF-KEYWORD-FINDING',
    questionType: 'keyword-finding',
    difficulty: 2,
    prompt: 'Từ nào trong đoạn đọc chỉ đồ ăn sáng?',
    options: ['cháo', 'đồng phục', 'cửa sổ', 'trường'],
    correctAnswer: 'cháo',
    wordCount: 1,
    explanation: 'Câu "Mẹ cho Bé ăn cháo" cho biết món ăn sáng là cháo.',
    estimatedSeconds: 22,
  },

  // ---------- rp-birds-nest (level 1) ----------
  {
    id: 'rq-02-1',
    passageId: 'rp-birds-nest',
    subject: 'tieng-viet',
    skillId: 'RF-PHRASE-FLUENCY',
    questionType: 'phrase-repeat',
    difficulty: 1,
    prompt: 'Đọc cụm từ này thật mượt nhé:',
    stimulus: 'cành cây',
    options: ['cành cây', 'cành cảy', 'cánh cây', 'cang cây'],
    correctAnswer: 'cành cây',
    wordCount: 2,
    explanation: '"Cành cây" là chỗ trên cao có cành để chim đậu và làm tổ.',
    estimatedSeconds: 12,
  },
  {
    id: 'rq-02-2',
    passageId: 'rp-birds-nest',
    subject: 'tieng-viet',
    skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-where',
    difficulty: 1,
    prompt: 'Chiếc tổ chim sẻ nằm ở đâu?',
    options: ['trên cành cây', 'dưới gốc cây', 'trong nhà', 'trên bờ hồ'],
    correctAnswer: 'trên cành cây',
    wordCount: 2,
    explanation: 'Câu đầu tiên: "Trên cành cây, có một chiếc tổ nhỏ."',
    estimatedSeconds: 22,
  },
  {
    id: 'rq-02-3',
    passageId: 'rp-birds-nest',
    subject: 'tieng-viet',
    skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-what',
    difficulty: 2,
    prompt: 'Chim bố và chim mẹ dùng gì để làm tổ?',
    options: ['cỏ khô và lông mềm', 'lá cây và dây', 'đất và sỏi', 'vải và len'],
    correctAnswer: 'cỏ khô và lông mềm',
    wordCount: 4,
    explanation: 'Câu thứ ba: "Chim bố và chim mẹ lấy cỏ khô và lông mềm để làm tổ."',
    estimatedSeconds: 25,
  },
  {
    id: 'rq-02-4',
    passageId: 'rp-birds-nest',
    subject: 'tieng-viet',
    skillId: 'RF-PUNCTUATION-PAUSE',
    questionType: 'punctuation-pause',
    difficulty: 1,
    prompt: 'Chỗ nào trong câu này phải nghỉ hơi một chút khi đọc?',
    stimulus: 'Trời vừa rạng sáng, trời sáng rõ.',
    options: ['sau chữ "sáng"', 'sau chữ "Trời"', 'sau chữ "vừa"', 'ở cuối câu thứ nhất'],
    correctAnswer: 'sau chữ "sáng"',
    wordCount: 6,
    explanation: 'Dấu phẩy nằm ngay sau chữ "sáng", nên đến đó bé dừng hơi một nhịp rồi đọc tiếp.',
    estimatedSeconds: 25,
  },

  // ---------- rp-rain-puddle (level 2) ----------
  {
    id: 'rq-03-1',
    passageId: 'rp-rain-puddle',
    subject: 'tieng-viet',
    skillId: 'RF-SENTENCE-FLUENCY',
    questionType: 'sentence-order',
    difficulty: 2,
    prompt: 'Bé dựng lại câu cho đúng ngữ pháp:',
    stimulus: 'Sau cơn mưa, vũng nước nhỏ lấp loáng dưới nắng.',
    options: [
      'Sau cơn mưa, vũng nước nhỏ lấp loáng dưới nắng.',
      'vũng nước nhỏ Sau cơn mưa, lấp loáng dưới nắng.',
      'lấp loáng dưới nắng, vũng nước nhỏ Sau cơn mưa.',
      'Sau mưa cơn, nước nhỏ vũng lấp loáng dưới nắng.',
    ],
    correctAnswer: 'Sau cơn mưa, vũng nước nhỏ lấp loáng dưới nắng.',
    wordCount: 9,
    explanation: 'Câu bắt đầu bằng cụm "Sau cơn mưa," rồi đến chủ ngữ "vũng nước nhỏ", cuối cùng là vị ngữ "lấp loáng dưới nắng".',
    estimatedSeconds: 28,
  },
  {
    id: 'rq-03-2',
    passageId: 'rp-rain-puddle',
    subject: 'tieng-viet',
    skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-when',
    difficulty: 2,
    prompt: 'Cơn mưa trong đoạn đọc rơi vào lúc nào?',
    options: ['trưa hôm', 'sáng sớm', 'chiều tà', 'nửa đêm'],
    correctAnswer: 'trưa hôm',
    wordCount: 2,
    explanation: 'Câu đầu: "Trưa hôm, mây đen kéo đến che kín mặt trời."',
    estimatedSeconds: 24,
  },
  {
    id: 'rq-03-3',
    passageId: 'rp-rain-puddle',
    subject: 'tieng-viet',
    skillId: 'RF-QUESTION-UNDERSTANDING',
    questionType: 'question-meaning',
    difficulty: 2,
    prompt: 'Câu hỏi "Bé chạy ra sân để làm gì?" muốn tìm thông tin gì?',
    options: ['Việc bé làm', 'Nơi bé ở', 'Bé thích món gì', 'Thời gian bé dậy'],
    correctAnswer: 'Việc bé làm',
    wordCount: 3,
    explanation: '"Để làm gì" là câu hỏi tìm hành động, nên bé tìm đoạn nói bé chạy ra hứng mưa.',
    estimatedSeconds: 26,
  },
  {
    id: 'rq-03-4',
    passageId: 'rp-rain-puddle',
    subject: 'tieng-viet',
    skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-how',
    difficulty: 3,
    prompt: 'Bé cảm thấy thế nào khi hứng được nước mưa?',
    options: ['Vui vẻ, cười toe toét', 'Buồn, khóc', 'Sợ hãi', 'Buồn ngủ'],
    correctAnswer: 'Vui vẻ, cười toe toét',
    wordCount: 3,
    explanation: 'Đoạn đọc viết Bé "cười toe toét", đó là dấu hiệu Bé rất vui.',
    estimatedSeconds: 25,
  },

  // ---------- rp-helping-mother (level 2) ----------
  {
    id: 'rq-04-1',
    passageId: 'rp-helping-mother',
    subject: 'tieng-viet',
    skillId: 'RF-READ-ALOUD-ACCURACY',
    questionType: 'read-aloud',
    difficulty: 2,
    prompt: 'Đọc to câu này cho mình nghe nào!',
    stimulus: 'Bé Liên hỏi: Mẹ ơi, con giúp mẹ lau thảm nhé!',
    options: [
      'Bé Liên hỏi: Mẹ ơi, con giúp mẹ lau thảm nhé!',
      'Bé Liên hỏi: Mẹ ơi, con giúp mẹ lau thảm nhẹ!',
      'Bé Liên hỏi: Mẹ ơi, con giúp mẹ lâu thảm nhé!',
      'Bé Liên hở: Mẹ ơi, con giúp mẹ lau thảm nhé!',
    ],
    correctAnswer: 'Bé Liên hỏi: Mẹ ơi, con giúp mẹ lau thảm nhé!',
    targetText: 'Bé Liên hỏi: Mẹ ơi, con giúp mẹ lau thảm nhé!',
    wordCount: 10,
    explanation: 'Câu đúng là "Bé Liên hỏi: Mẹ ơi, con giúp mẹ lau thảm nhé!"',
    estimatedSeconds: 25,
  },
  {
    id: 'rq-04-2',
    passageId: 'rp-helping-mother',
    subject: 'tieng-viet',
    skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-who',
    difficulty: 1,
    prompt: 'Trong đoạn đọc, ai là người lau thảm?',
    options: ['Bé Liên', 'Bé Lan', 'Mẹ', 'Cô giáo'],
    correctAnswer: 'Bé Liên',
    wordCount: 2,
    explanation: 'Câu: "Bé lấy khăn ướt lau dọc theo sọc của thảm." Đó là hành động của Bé Liên.',
    estimatedSeconds: 22,
  },
  {
    id: 'rq-04-3',
    passageId: 'rp-helping-mother',
    subject: 'tieng-viet',
    skillId: 'RF-KEYWORD-FINDING',
    questionType: 'keyword-finding',
    difficulty: 2,
    prompt: 'Từ nào trong đoạn đọc chỉ dụng cụ để lau?',
    options: ['khăn ướt', 'thảm', 'nhà', 'sổ tay'],
    correctAnswer: 'khăn ướt',
    wordCount: 2,
    explanation: '"Khăn ướt" là dụng cụ bé dùng để lau thảm.',
    estimatedSeconds: 22,
  },
  {
    id: 'rq-04-4',
    passageId: 'rp-helping-mother',
    subject: 'tieng-viet',
    skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-why',
    difficulty: 3,
    prompt: 'Vì sao mẹ khen Bé Liên?',
    options: ['Vì Bé làm việc chăm chí', 'Vì Bé hát hay', 'Vì Bé chạy nhanh', 'Vì Bé ngủ dậy sớm'],
    correctAnswer: 'Vì Bé làm việc chăm chí',
    wordCount: 4,
    explanation: 'Câu cuối: Mẹ khen "Con làm việc chăm chí quá!"',
    estimatedSeconds: 25,
  },

  // ---------- rp-school-garden (level 3) ----------
  {
    id: 'rq-05-1',
    passageId: 'rp-school-garden',
    subject: 'tieng-viet',
    skillId: 'RF-READ-ALOUD-SPEED',
    questionType: 'read-aloud',
    difficulty: 3,
    prompt: 'Đọc câu này thật nhanh nhưng vẫn rõ ràng nhé!',
    stimulus: 'Mỗi sáng, học sinh tưới cây rồi ghi vào sổ tay nhận việc.',
    options: [
      'Mỗi sáng, học sinh tưới cây rồi ghi vào sổ tay nhận việc.',
      'Mỗi sáng, học sinh tưới cây rồi ghi vào sổ nhận việc.',
      'Mỗi sáng, học sinh tưới cây rồi ghi sổ tay nhận việc.',
      'Mỗi sáng, học sinh tưới rồi ghi cây vào sổ tay nhận việc.',
    ],
    correctAnswer: 'Mỗi sáng, học sinh tưới cây rồi ghi vào sổ tay nhận việc.',
    targetText: 'Mỗi sáng, học sinh tưới cây rồi ghi vào sổ tay nhận việc.',
    wordCount: 12,
    explanation: 'Câu đúng là "Mỗi sáng, học sinh tưới cây rồi ghi vào sổ tay nhận việc."',
    estimatedSeconds: 22,
  },
  {
    id: 'rq-05-2',
    passageId: 'rp-school-garden',
    subject: 'tieng-viet',
    skillId: 'RF-ANSWER-SELECTION-SPEED',
    questionType: 'question-meaning',
    difficulty: 3,
    prompt: 'Chọn nhanh đáp án đúng: Lớp Hai trồng cây gì?',
    options: ['ớt', 'cà chua', 'đậu', 'bắp cải'],
    correctAnswer: 'ớt',
    wordCount: 2,
    explanation: 'Câu thứ hai: "Lớp Một trồng cà chua, lớp Hai trồng ớt, lớp Ba trồng đậu."',
    estimatedSeconds: 15,
  },
  {
    id: 'rq-05-3',
    passageId: 'rp-school-garden',
    subject: 'tieng-viet',
    skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-what',
    difficulty: 3,
    prompt: 'Các bạn học sinh làm gì mỗi sáng ở vườn trường?',
    options: ['Tưới cây rồi ghi vào sổ tay', 'Thu hoạch rau rồi về nhà', 'Quét sân rồi ăn sáng', 'Đọc truyện dưới gốc cây'],
    correctAnswer: 'Tưới cây rồi ghi vào sổ tay',
    wordCount: 5,
    explanation: 'Câu thứ ba nói rõ học sinh tưới cây rồi ghi vào sổ tay nhận việc.',
    estimatedSeconds: 26,
  },
  {
    id: 'rq-05-4',
    passageId: 'rp-school-garden',
    subject: 'tieng-viet',
    skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-how',
    difficulty: 3,
    prompt: 'Các lớp cùng chăm sóc vườn bằng cách nào?',
    options: ['Mỗi lớp trồng một loại rau khác nhau', 'Mỗi lớp tưới một giờ khác nhau', 'Chỉ lớp Một chăm vườn', 'Các lớp trồng chung một loài'],
    correctAnswer: 'Mỗi lớp trồng một loại rau khác nhau',
    wordCount: 6,
    explanation: 'Đoạn đọc liệt kê: lớp Một trồng cà chua, lớp Hai trồng ớt, lớp Ba trồng đậu — mỗi lớp một loại.',
    estimatedSeconds: 28,
  },
  // ---------- rp-cat-sun (level 1) ----------
  {
    id: 'rq-06-1', passageId: 'rp-cat-sun', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-where', difficulty: 1, prompt: 'Chú mèo hay nằm ở đâu vào buổi trưa?',
    mediaEmoji: '🏠', options: ['Bên thềm', 'Ngoài vườn', 'Trong bếp', 'Trên mái'],
    correctAnswer: 'Bên thềm', wordCount: 2,
    explanation: 'Bài viết mèo hay nằm sưởi nắng bên thềm vào buổi trưa.',
    estimatedSeconds: 14,
  },
  {
    id: 'rq-06-2', passageId: 'rp-cat-sun', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-who', difficulty: 1, prompt: 'Chú mèo có bộ lông màu gì?',
    options: ['Xám tro', 'Vàng óng', 'Trắng muốt', 'Đen tuyền'], correctAnswer: 'Xám tro', wordCount: 2,
    explanation: 'Câu đầu nói mèo mướp lông xám tro.', estimatedSeconds: 15,
  },
  {
    id: 'rq-06-3', passageId: 'rp-cat-sun', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-when', difficulty: 1, prompt: 'Mèo nằm sưởi nắng lúc nào?',
    options: ['Buổi trưa', 'Buổi sáng', 'Buổi tối', 'Nửa đêm'], correctAnswer: 'Buổi trưa', wordCount: 2,
    explanation: 'Bài viết buổi trưa mèo nằm sưởi nắng bên thềm.', estimatedSeconds: 15,
  },
  {
    id: 'rq-06-4', passageId: 'rp-cat-sun', subject: 'tieng-viet', skillId: 'RF-KEYWORD-FINDING',
    questionType: 'keyword-finding', difficulty: 2, prompt: 'Bé làm gì khiến mèo kêu gừ gừ?',
    options: ['Vuốt lưng mèo', 'Cho mèo ăn', 'Tắm cho mèo', 'Chải lông mèo'], correctAnswer: 'Vuốt lưng mèo', wordCount: 3,
    explanation: 'Bé vuốt lưng mèo nên mèo kêu gừ gừ thích thú.', estimatedSeconds: 18,
  },
  // ---------- rp-duck-pond (level 1) ----------
  {
    id: 'rq-07-1', passageId: 'rp-duck-pond', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-how', difficulty: 1, prompt: 'Đàn vịt con có bộ lông màu gì?',
    options: ['Vàng óng', 'Trắng muốt', 'Xám tro', 'Nâu đất'], correctAnswer: 'Vàng óng', wordCount: 2,
    explanation: 'Bài nói ba chú vịt con lông vàng óng.', estimatedSeconds: 15,
  },
  {
    id: 'rq-07-2', passageId: 'rp-duck-pond', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-how', difficulty: 1, prompt: 'Ao nhà có mấy chú vịt con?',
    options: ['Ba chú', 'Hai chú', 'Bốn chú', 'Năm chú'], correctAnswer: 'Ba chú', wordCount: 2,
    explanation: 'Bài nói ao có ba chú vịt con lông vàng óng.', estimatedSeconds: 15,
  },
  {
    id: 'rq-07-3', passageId: 'rp-duck-pond', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-what', difficulty: 1, prompt: 'Vịt mẹ dẫn con ra ao để làm gì?',
    options: ['Tập bơi', 'Kiếm ăn', 'Tắm nắng', 'Ngủ trưa'], correctAnswer: 'Tập bơi', wordCount: 2,
    explanation: 'Vịt mẹ dẫn con ra ao tập bơi vào sáng sớm.', estimatedSeconds: 15,
  },
  {
    id: 'rq-07-4', passageId: 'rp-duck-pond', subject: 'tieng-viet', skillId: 'RF-KEYWORD-FINDING',
    questionType: 'keyword-finding', difficulty: 2, prompt: 'Vịt con kêu thế nào khi tập bơi?',
    options: ['Cạp cạp', 'Meo meo', 'Gâu gâu', 'Cục tác'], correctAnswer: 'Cạp cạp', wordCount: 2,
    explanation: 'Cuối bài: vịt con kêu cạp cạp rồi lặn ngụp vui vẻ.', estimatedSeconds: 18,
  },
  // ---------- rp-tet-market (level 2) ----------
  {
    id: 'rq-08-1', passageId: 'rp-tet-market', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-who', difficulty: 2, prompt: 'Ai đưa bé ra chợ quê?',
    options: ['Mẹ', 'Bố', 'Bà', 'Cô giáo'], correctAnswer: 'Mẹ', wordCount: 1,
    explanation: 'Câu đầu: mẹ đưa bé ra chợ mua lá dong.', estimatedSeconds: 18,
  },
  {
    id: 'rq-08-2', passageId: 'rp-tet-market', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-what', difficulty: 2, prompt: 'Bé chọn quả gì để bày mâm ngũ quả?',
    options: ['Dưa hấu tròn to', 'Quả cam nhỏ', 'Quả táo xanh', 'Quả lê vàng'], correctAnswer: 'Dưa hấu tròn to', wordCount: 3,
    explanation: 'Bé chọn quả dưa hấu tròn to bày mâm ngũ quả.', estimatedSeconds: 20,
  },
  {
    id: 'rq-08-3', passageId: 'rp-tet-market', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-what', difficulty: 2, prompt: 'Về nhà cả nhà cùng làm gì?',
    options: ['Gói bánh chưng xanh', 'Nấu cháo trắng', 'Rán nem chua', 'Luộc khoai lang'], correctAnswer: 'Gói bánh chưng xanh', wordCount: 4,
    explanation: 'Cuối bài: cả nhà cùng gói bánh chưng xanh.', estimatedSeconds: 20,
  },
  {
    id: 'rq-08-4', passageId: 'rp-tet-market', subject: 'tieng-viet', skillId: 'RF-QUESTION-UNDERSTANDING',
    questionType: 'question-meaning', difficulty: 2, prompt: 'Hoa nào KHÔNG có trong bài?',
    options: ['Hoa cúc', 'Hoa đào', 'Hoa mai', 'Cả đào và mai'], correctAnswer: 'Hoa cúc', wordCount: 2,
    explanation: 'Bài chỉ nhắc hoa đào và hoa mai khoe sắc.', estimatedSeconds: 20,
  },
  // ---------- rp-paper-boat (level 2) ----------
  {
    id: 'rq-09-1', passageId: 'rp-paper-boat', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-what', difficulty: 2, prompt: 'Mưa rào khiến sân trường thành gì?',
    options: ['Dòng sông nhỏ', 'Biển lớn', 'Sa mạc cát', 'Cánh đồng lúa'], correctAnswer: 'Dòng sông nhỏ', wordCount: 3,
    explanation: 'Sân thành dòng sông nhỏ sau mưa rào.', estimatedSeconds: 18,
  },
  {
    id: 'rq-09-2', passageId: 'rp-paper-boat', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-who', difficulty: 2, prompt: 'Thuyền của ai chạy nhanh nhất?',
    options: ['Bé Lan', 'Bé Minh', 'Bé Na', 'Bé Bin'], correctAnswer: 'Bé Lan', wordCount: 2,
    explanation: 'Thuyền bé Lan chạy nhanh nhất, cả lớp reo hò.', estimatedSeconds: 18,
  },
  {
    id: 'rq-09-3', passageId: 'rp-paper-boat', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-what', difficulty: 2, prompt: 'Sau khi tạnh mưa, điều gì hiện ra?',
    options: ['Cầu vồng', 'Ông mặt trời đỏ', 'Bầy chim én', 'Cơn bão lớn'], correctAnswer: 'Cầu vồng', wordCount: 2,
    explanation: 'Tạnh mưa cầu vồng hiện ra, ai cũng cười toe toét.', estimatedSeconds: 18,
  },
  {
    id: 'rq-09-4', passageId: 'rp-paper-boat', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-how', difficulty: 2, prompt: 'Cả lớp thả thuyền bằng gì?',
    options: ['Giấy đủ màu', 'Lá chuối xanh', 'Vỏ chai nhựa', 'Gỗ thông'], correctAnswer: 'Giấy đủ màu', wordCount: 3,
    explanation: 'Cả lớp thả thuyền giấy đủ màu.', estimatedSeconds: 20,
  },
  // ---------- rp-grandma-garden (level 2) ----------
  {
    id: 'rq-10-1', passageId: 'rp-grandma-garden', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-where', difficulty: 2, prompt: 'Bà ngoại sống ở đâu?',
    options: ['Ở quê', 'Ở phố', 'Ở chợ', 'Ở trường'], correctAnswer: 'Ở quê', wordCount: 2,
    explanation: 'Bé về thăm bà ngoại ở quê cuối tuần.', estimatedSeconds: 18,
  },
  {
    id: 'rq-10-2', passageId: 'rp-grandma-garden', subject: 'tieng-viet', skillId: 'RF-KEYWORD-FINDING',
    questionType: 'keyword-finding', difficulty: 2, prompt: 'Vườn bà có những quả gì?',
    options: ['Cam và chuối', 'Táo và nho', 'Lê và mận', 'Dâu và cherry'], correctAnswer: 'Cam và chuối', wordCount: 3,
    explanation: 'Vườn có cam chín mọng, chuối trĩu buồng.', estimatedSeconds: 20,
  },
  {
    id: 'rq-10-3', passageId: 'rp-grandma-garden', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-what', difficulty: 2, prompt: 'Bà hái cho bé quả gì?',
    options: ['Chùm nhãn ngọt', 'Chùm vải chua', 'Quả mít to', 'Quả sầu riêng'], correctAnswer: 'Chùm nhãn ngọt', wordCount: 3,
    explanation: 'Bà hái chùm nhãn ngọt lịm cho bé.', estimatedSeconds: 20,
  },
  {
    id: 'rq-10-4', passageId: 'rp-grandma-garden', subject: 'tieng-viet', skillId: 'RF-QUESTION-UNDERSTANDING',
    questionType: 'question-meaning', difficulty: 2, prompt: 'Bé hứa với bà điều gì?',
    options: ['Chăm ngoan, học giỏi', 'Ăn nhiều kẹo', 'Ngủ nướng', 'Xem ti vi'], correctAnswer: 'Chăm ngoan, học giỏi', wordCount: 3,
    explanation: 'Bé ôm bà, hứa chăm ngoan học giỏi.', estimatedSeconds: 20,
  },
  // ---------- rp-lantern-night (level 3) ----------
  {
    id: 'rq-11-1', passageId: 'rp-lantern-night', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-where', difficulty: 3, prompt: 'Đèn lồng được treo ở đâu?',
    options: ['Sân đình', 'Sân trường', 'Trước cổng', 'Trong nhà'], correctAnswer: 'Sân đình', wordCount: 2,
    explanation: 'Sân đình treo đầy đèn lồng đỏ rực đêm Trung thu.', estimatedSeconds: 22,
  },
  {
    id: 'rq-11-2', passageId: 'rp-lantern-night', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-what', difficulty: 3, prompt: 'Bé rước đèn gì?',
    options: ['Đèn ông sao', 'Đèn cá chép', 'Đèn tròn', 'Đèn hoa sen'], correctAnswer: 'Đèn ông sao', wordCount: 3,
    explanation: 'Bé rước đèn ông sao, miệng hát líu lo.', estimatedSeconds: 22,
  },
  {
    id: 'rq-11-3', passageId: 'rp-lantern-night', subject: 'tieng-viet', skillId: 'RF-KEYWORD-FINDING',
    questionType: 'keyword-finding', difficulty: 3, prompt: 'Mâm cỗ Trung thu KHÔNG có gì?',
    options: ['Bánh mì', 'Bánh nướng', 'Bánh dẻo', 'Bưởi tỉa hoa'], correctAnswer: 'Bánh mì', wordCount: 2,
    explanation: 'Mâm cỗ có bánh nướng, bánh dẻo và bưởi tỉa hoa.', estimatedSeconds: 24,
  },
  {
    id: 'rq-11-4', passageId: 'rp-lantern-night', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-how', difficulty: 3, prompt: 'Trăng rằm được tả thế nào?',
    options: ['Tròn vành vạnh', 'Khuyết một nửa', 'Mờ sau mây', 'Nhỏ như sao'], correctAnswer: 'Tròn vành vạnh', wordCount: 3,
    explanation: 'Trăng rằm tròn vành vạnh, chú Cuội như đang cười.', estimatedSeconds: 24,
  },
  // ---------- rp-ant-bridge (level 3) ----------
  {
    id: 'rq-12-1', passageId: 'rp-ant-bridge', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-why', difficulty: 3, prompt: 'Vì sao đàn kiến phải làm cầu?',
    options: ['Để qua vũng nước lớn', 'Để lên cây cao', 'Để về tổ nhanh', 'Để tránh nắng'], correctAnswer: 'Để qua vũng nước lớn', wordCount: 4,
    explanation: 'Sau mưa vũng nước lớn chắn đường nên kiến làm cầu.', estimatedSeconds: 24,
  },
  {
    id: 'rq-12-2', passageId: 'rp-ant-bridge', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-how', difficulty: 3, prompt: 'Đàn kiến làm cầu bằng cách nào?',
    options: ['Nối nhau thành cầu', 'Tha lá khô qua', 'Bơi qua từng chú', 'Nhảy qua vũng'], correctAnswer: 'Nối nhau thành cầu', wordCount: 4,
    explanation: 'Kiến nối nhau thành cầu, bám chặt rồi bò qua.', estimatedSeconds: 26,
  },
  {
    id: 'rq-12-3', passageId: 'rp-ant-bridge', subject: 'tieng-viet', skillId: 'RF-READING-COMPREHENSION',
    questionType: 'comprehension-why', difficulty: 3, prompt: 'Câu chuyện dạy bé điều gì?',
    options: ['Đoàn kết giúp nhau', 'Đi một mình nhanh hơn', 'Sợ nước là tốt', 'Không cần bạn bè'], correctAnswer: 'Đoàn kết giúp nhau', wordCount: 3,
    explanation: 'Nhờ đoàn kết mà đàn kiến qua được bờ.', estimatedSeconds: 26,
  },
  {
    id: 'rq-12-4', passageId: 'rp-ant-bridge', subject: 'tieng-viet', skillId: 'RF-ANSWER-SELECTION-SPEED',
    questionType: 'question-meaning', difficulty: 3, prompt: 'Chọn nhanh: Kiến đầu đàn làm gì đầu tiên?',
    options: ['Nghĩ ra cách làm cầu', 'Bỏ chạy trước', 'Ngủ một giấc', 'Kêu cứu to'], correctAnswer: 'Nghĩ ra cách làm cầu', wordCount: 5,
    explanation: 'Kiến đầu đàn nghĩ ra cách nối nhau thành cầu.', estimatedSeconds: 20,
  },
];

/** T13 — toàn bộ câu hỏi = 48 câu gốc + 144 câu mới. */
export const READING_QUESTIONS: ReadingQuestion[] = [...LEGACY_READING_QUESTIONS, ...T13_QUESTIONS];

export function getReadingQuestionById(id: string): ReadingQuestion | undefined {
  return READING_QUESTIONS.find((q) => q.id === id);
}
export function getQuestionsByPassage(passageId: string): ReadingQuestion[] {
  return READING_QUESTIONS.filter((q) => q.passageId === passageId);
}

export function getQuestionsBySkill(skillId: ReadingSkillId): ReadingQuestion[] {
  return READING_QUESTIONS.filter((q) => q.skillId === skillId);
}

export function getQuestionsByStage(stage: ReadingStage): ReadingQuestion[] {
  return READING_QUESTIONS.filter(
    (q) => getReadingSkillById(q.skillId)?.stage === stage
  );
}

/** Question ids assigned to each ladder stage, in teaching order. */
export const READING_STAGE_ITEM_IDS: Record<ReadingStage, string[]> = (() => {
  const stages: Record<ReadingStage, string[]> = {
    ACCURACY: [],
    FLUENCY: [],
    COMPREHENSION: [],
    PROCESSING_SPEED: [],
    COMPETITION_SPEED: [],
  };
  for (const q of READING_QUESTIONS) {
    const stage = getReadingSkillById(q.skillId)?.stage;
    if (stage) stages[stage].push(q.id);
  }
  return stages;
})();
