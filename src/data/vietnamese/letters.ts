import type { Lesson, Question } from '../../types';
import { vnQ, vnLesson, upper, lower } from './factory';

/**
 * T10A — Bảng chữ cái (spec T10 §1, "29 chữ cái", nhóm 4–5 chữ/bài).
 *
 * Each lesson is generated from a small table of letter→example-word pairs so the
 * pedagogy stays consistent while every prompt keeps a distinct phrasing. Each
 * lesson owns its own skill id, which also keeps the near-duplicate scanner
 * (same subject+skill only) from comparing unrelated templates.
 */

/** Thứ tự bảng chữ cái tiếng Việt (29 chữ cái, GDPT 2018). */
export const VIETNAMESE_ALPHABET = [
  'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g', 'h', 'i', 'k',
  'l', 'm', 'n', 'o', 'ô', 'ơ', 'p', 'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y',
] as const;

export interface LetterExample {
  letter: string;
  word: string;
  emoji: string;
}

function rank(letter: string): number {
  return VIETNAMESE_ALPHABET.indexOf(letter as (typeof VIETNAMESE_ALPHABET)[number]);
}

function pickDistractors(correct: string, examples: LetterExample[], count: number): string[] {
  const seen = new Set([correct]);
  const pool: string[] = [];
  for (const letter of VIETNAMESE_ALPHABET) {
    if (letter === correct || seen.has(letter)) continue;
    pool.push(letter);
    if (pool.length >= count + 2) break;
  }
  // Prefer letters that do NOT appear in this lesson so options can't imply meaning.
  const lessonLetters = new Set(examples.map((e) => e.letter));
  const neutral = pool.filter((l) => !lessonLetters.has(l));
  const source = neutral.length >= count ? neutral : pool;
  return source.slice(0, count);
}

function wordOptions(correctWord: string, examples: LetterExample[], count = 4): string[] {
  const options = [correctWord];
  for (const e of examples) {
    if (e.word !== correctWord && !options.includes(e.word)) options.push(e.word);
    if (options.length >= count) break;
  }
  return options;
}

export function buildLetterLesson(
  topicId: string,
  id: string,
  title: string,
  description: string,
  mascotTip: string,
  skillId: string,
  examples: LetterExample[]
): Lesson {
  const e0 = examples[0];
  const e1 = examples[1];
  const e2 = examples[2];
  const e3 = examples[3];
  const questions: Question[] = [];

  // 1. Nhận diện chữ cái mở đầu (multiple-choice).
  questions.push(
    vnQ(topicId, {
      id: `${id}-1`,
      type: 'multiple-choice',
      difficulty: 1,
      skillId,
      prompt: `Từ “${e0.word}” bắt đầu bằng chữ cái nào?`,
      mediaEmoji: e0.emoji,
      options: [upper(e0.letter), ...pickDistractors(e0.letter, examples, 3)].map((l) => `Chữ ${upper(l)}`),
      correctAnswer: `Chữ ${upper(e0.letter)}`,
      hint: `Đọc to từ “${e0.word}” rồi nghe âm đầu tiên.`,
      explanation: `${e0.word} mở đầu bằng ${lower(e0.letter)}.`,
    })
  );

  // 2. Từ chữ cái tìm từ (multiple-choice).
  questions.push(
    vnQ(topicId, {
      id: `${id}-2`,
      type: 'multiple-choice',
      difficulty: 1,
      skillId,
      prompt: `Chữ cái “${upper(e1.letter)}” mở đầu cho từ nào?`,
      options: wordOptions(e1.word, examples),
      correctAnswer: e1.word,
      hint: 'Đọc tên các từ rồi nghe từ nào có âm đầu giống chữ cái đã cho.',
      explanation: `Chữ ${upper(e1.letter)} mở đầu cho từ “${e1.word}”.`,
    })
  );

  // 3. Nghe và chọn chữ cái (audio-choice).
  questions.push(
    vnQ(topicId, {
      id: `${id}-3`,
      type: 'audio-choice',
      difficulty: 1,
      skillId,
      prompt: `Nghe và chọn chữ cái bắt đầu từ “${e2.word}”.`,
      mediaEmoji: e2.emoji,
      options: [upper(e2.letter), ...pickDistractors(e2.letter, examples, 3)].map((l) => `Chữ ${upper(l)}`),
      correctAnswer: `Chữ ${upper(e2.letter)}`,
      hint: 'Bấm loa để nghe rồi chọn chữ cái phát ra âm đầu.',
      explanation: `Từ “${e2.word}” mở đầu bằng ${lower(e2.letter)}.`,
    })
  );

  // 4. Điền chữ cái đầu (fill-blank).
  questions.push(
    vnQ(topicId, {
      id: `${id}-4`,
      type: 'fill-blank',
      difficulty: 2,
      skillId,
      prompt: `Điền chữ cái đầu cho từ: “…${e3.word.slice(1)}” (${e3.word}).`,
      mediaEmoji: e3.emoji,
      options: [lower(e3.letter), ...pickDistractors(e3.letter, examples, 3).map((l) => lower(l))],
      correctAnswer: lower(e3.letter),
      hint: 'Nhìn hình và đọc to từ để nghe âm đầu.',
      explanation: `Điền “${lower(e3.letter)}” ta được từ “${e3.word}”.`,
    })
  );

  // 5. Hình ảnh → chữ cái (image-choice).
  questions.push(
    vnQ(topicId, {
      id: `${id}-5`,
      type: 'image-choice',
      difficulty: 1,
      skillId,
      prompt: `Hình ${e0.emoji} có tên mở đầu bằng chữ cái nào?`,
      options: [upper(e0.letter), ...pickDistractors(e0.letter, examples, 3)].map((l) => `Chữ ${upper(l)}`),
      correctAnswer: `Chữ ${upper(e0.letter)}`,
      hint: 'Nhìn hình, gọi tên đồ vật rồi nghe âm đầu.',
      explanation: `Hình ${e0.emoji} là “${e0.word}”, mở đầu bằng ${lower(e0.letter)}.`,
    })
  );

  // 6. Nối chữ cái với từ (matching).
  const matchPool = examples.slice(0, 4);
  const pairs = matchPool.map((e) => ({ left: upper(e.letter), right: e.word }));
  questions.push(
    vnQ(topicId, {
      id: `${id}-6`,
      type: 'matching',
      difficulty: 2,
      skillId,
      prompt: 'Nối chữ cái với từ mở đầu bằng chữ cái đó:',
      options: pairs.map((p) => p.right),
      correctAnswer: pairs.map((p) => `${p.left}=${p.right}`).join('|'),
      matchingPairs: pairs,
      hint: 'Chạm chữ cái bên trái rồi chạm từ đúng bên phải.',
      explanation: pairs.map((p) => `${p.left} – ${p.right}`).join(', ') + '.',
    })
  );

  // 7. Đúng hay sai (true-false).
  questions.push(
    vnQ(topicId, {
      id: `${id}-7`,
      type: 'true-false',
      difficulty: 2,
      skillId,
      prompt: `Từ “${e1.word}” mở đầu bằng chữ cái “${upper(e1.letter)}”. Đúng hay sai?`,
      mediaEmoji: e1.emoji,
      options: ['Đúng', 'Sai'],
      correctAnswer: 'Đúng',
      hint: 'Đọc to từ rồi so với chữ cái đã cho.',
      explanation: `Đúng rồi! “${e1.word}” mở đầu bằng ${lower(e1.letter)}.`,
    })
  );

  // 8. Sắp xếp chữ cái theo bảng chữ cái (ordering).
  const orderLetters = Array.from(new Set(examples.map((e) => e.letter))).sort((a, b) => rank(a) - rank(b));
  questions.push(
    vnQ(topicId, {
      id: `${id}-8`,
      type: 'ordering',
      difficulty: 2,
      skillId,
      prompt: 'Sắp xếp các chữ cái theo đúng thứ tự trong bảng chữ cái:',
      options: [...orderLetters].reverse().map((l) => upper(l)),
      correctAnswer: orderLetters.map((l) => upper(l)).join('|'),
      orderingItems: orderLetters.map((l) => upper(l)),
      hint: 'Nghe lại bài hát bảng chữ cái trong đầu nhé.',
      explanation: `Thứ tự đúng là: ${orderLetters.map((l) => upper(l)).join(' – ')}.`,
    })
  );

  // 9. Tìm từ bắt đầu bằng chữ cái (multiple-choice).
  questions.push(
    vnQ(topicId, {
      id: `${id}-9`,
      type: 'multiple-choice',
      difficulty: 2,
      skillId,
      prompt: `Từ nào dưới đây mở đầu bằng chữ cái “${upper(e0.letter)}”?`,
      options: wordOptions(e0.word, examples),
      correctAnswer: e0.word,
      hint: 'Đọc lần lượt từng từ và nghe âm đầu.',
      explanation: `“${e0.word}” mở đầu bằng ${lower(e0.letter)}.`,
    })
  );

  // 10. Chữ hoa – chữ thường (multiple-choice).
  questions.push(
    vnQ(topicId, {
      id: `${id}-10`,
      type: 'multiple-choice',
      difficulty: 1,
      skillId,
      prompt: `Bé hãy chọn chữ ${upper(e2.letter)} viết thường.`,
      options: [lower(e2.letter), ...pickDistractors(e2.letter, examples, 3).map((l) => lower(l))],
      correctAnswer: lower(e2.letter),
      hint: 'Chữ thường nhỏ hơn chữ in hoa nhưng cùng tên.',
      explanation: `Chữ ${upper(e2.letter)} viết thường là “${lower(e2.letter)}”.`,
    })
  );

  return vnLesson(topicId, id, title, description, mascotTip, questions, 40, 3);
}

interface LetterGroupSpec {
  id: string;
  skillId: string;
  title: string;
  description: string;
  mascotTip: string;
  examples: LetterExample[];
}

/**
 * Bảng chữ cái 29 chữ theo nhóm 4–5 chữ (SGK Tiếng Việt 1 — GDPT 2018).
 * Mỗi nhóm một kỹ năng riêng để bộ quét gần trùng chỉ so trong nhóm.
 */
const LETTER_GROUP_SPECS: LetterGroupSpec[] = [
  {
    id: 'vn-les-c1',
    skillId: 'vn_letters_1',
    title: 'Nhóm chữ a ă â b c',
    description: 'Làm quen chữ a (áo), ă (ăn), â (ấm), b (bò), c (cá).',
    mascotTip: 'Nhóm đầu tiên có cả ba chữ a, ă, â trông giống nhau mà đọc khác nhau đấy!',
    examples: [
      { letter: 'a', word: 'áo', emoji: '🧥' },
      { letter: 'ă', word: 'ăn', emoji: '🍚' },
      { letter: 'â', word: 'ấm', emoji: '🍵' },
      { letter: 'b', word: 'bò', emoji: '🐄' },
      { letter: 'c', word: 'cá', emoji: '🐟' },
    ],
  },
  {
    id: 'vn-les-c2',
    skillId: 'vn_letters_2',
    title: 'Nhóm chữ d đ e ê',
    description: 'Làm quen chữ d (dưa), đ (đèn), e (em), ê (ếch).',
    mascotTip: 'Chữ đ đội thêm chiếc mũ nhỏ, còn chữ ê thì có mũ cong xinh xắn!',
    examples: [
      { letter: 'd', word: 'dưa', emoji: '🍉' },
      { letter: 'đ', word: 'đèn', emoji: '💡' },
      { letter: 'e', word: 'em', emoji: '👶' },
      { letter: 'ê', word: 'ếch', emoji: '🐸' },
    ],
  },
  {
    id: 'vn-les-c3',
    skillId: 'vn_letters_3',
    title: 'Nhóm chữ g h i k',
    description: 'Làm quen chữ g (gà), h (hoa), i (in), k (kẹo).',
    mascotTip: 'Chữ k cong cong như cái kéo, nhớ chữ k ghép với e, ê, i nhé!',
    examples: [
      { letter: 'g', word: 'gà', emoji: '🐔' },
      { letter: 'h', word: 'hoa', emoji: '🌸' },
      { letter: 'i', word: 'in', emoji: '🖨️' },
      { letter: 'k', word: 'kẹo', emoji: '🍬' },
    ],
  },
  {
    id: 'vn-les-c4',
    skillId: 'vn_letters_4',
    title: 'Nhóm chữ l m n o',
    description: 'Làm quen chữ l (lá), m (mèo), n (nón), o (ong).',
    mascotTip: 'Chữ o tròn như quả trứng, chữ l cao như cái cột đó!',
    examples: [
      { letter: 'l', word: 'lá', emoji: '🍃' },
      { letter: 'm', word: 'mèo', emoji: '🐱' },
      { letter: 'n', word: 'nón', emoji: '👒' },
      { letter: 'o', word: 'ong', emoji: '🐝' },
    ],
  },
  {
    id: 'vn-les-c5',
    skillId: 'vn_letters_5',
    title: 'Nhóm chữ ô ơ p q',
    description: 'Làm quen chữ ô (ốc), ơ (ớt), p (pin), q (quạt).',
    mascotTip: 'Ô đội mũ, Ơ mang râu; q luôn có bạn u đi kèm thành qu!',
    examples: [
      { letter: 'ô', word: 'ốc', emoji: '🐌' },
      { letter: 'ơ', word: 'ớt', emoji: '🌶️' },
      { letter: 'p', word: 'pin', emoji: '🔋' },
      { letter: 'q', word: 'quạt', emoji: '🌀' },
    ],
  },
  {
    id: 'vn-les-c6',
    skillId: 'vn_letters_6',
    title: 'Nhóm chữ r s t u',
    description: 'Làm quen chữ r (rùa), s (sách), t (táo), u (uống).',
    mascotTip: 'Chữ t có nét ngang trên đầu, chữ r có móc câu nhỏ nhé!',
    examples: [
      { letter: 'r', word: 'rùa', emoji: '🐢' },
      { letter: 's', word: 'sách', emoji: '📚' },
      { letter: 't', word: 'táo', emoji: '🍎' },
      { letter: 'u', word: 'uống', emoji: '🥤' },
    ],
  },
  {
    id: 'vn-les-c7',
    skillId: 'vn_letters_7',
    title: 'Nhóm chữ ư v x y',
    description: 'Làm quen chữ ư (ướt), v (vịt), x (xe), y (yêu).',
    mascotTip: 'Chữ ư có râu như chữ ơ; chữ y dài như cái gậy đó!',
    examples: [
      { letter: 'ư', word: 'ướt', emoji: '💧' },
      { letter: 'v', word: 'vịt', emoji: '🦆' },
      { letter: 'x', word: 'xe', emoji: '🚗' },
      { letter: 'y', word: 'yêu', emoji: '❤️' },
    ],
  },
];

export const LETTER_LESSONS: Lesson[] = LETTER_GROUP_SPECS.map((spec) =>
  buildLetterLesson(
    'vn-chu-cai',
    spec.id,
    spec.title,
    spec.description,
    spec.mascotTip,
    spec.skillId,
    spec.examples
  )
);

export const LETTER_SKILLS: string[] = LETTER_GROUP_SPECS.map((spec) => spec.skillId);
