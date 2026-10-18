import {
  KIDBOX_LOCALE,
  KidBoxLanguagePattern,
  KidBoxPhonics,
  KidBoxReadingText,
  KidBoxUnit,
  KidBoxVocabulary,
} from '../types/kidBox';

/**
 * BRIDGE PACK — Level 1 practice content that the Kid's Box Companion engines
 * can run *today*, without pretending to be textbook content.
 *
 * §2 COPYRIGHT: nothing here is copied from Kid's Box. Every word, sound and
 * pattern below already ships inside this app's own English curriculum
 * (`data/englishCurriculum.ts`), and `tests/kidbox-curriculum.test.ts` fails if
 * a word ever stops existing there. Everything is original practice generated
 * from generic Level 1 concepts, labelled `sourceType: 'APP_BRIDGE'`.
 *
 * Its purpose is architectural: it exercises listening, speaking, phonics,
 * reading, games, evidence, spaced repetition and parent reporting end to end
 * while the real mapped units are still `CONTENT_SOURCE_REQUIRED`.
 */

export const KIDBOX_BRIDGE_UNIT_ID = 'unit-bridge-level1';

const BRIDGE_MAPPING_NOTE =
  'Gói luyện tập nền, chỉ dùng từ vựng đã có sẵn trong chương trình English của ứng dụng. KHÔNG phải nội dung giáo trình Kid\u2019s Box.';

/* ------------------------------------------------------------------ */
/* §10 VOCABULARY ENGINE                                               */
/* ------------------------------------------------------------------ */

type VocabSkill = KidBoxVocabulary['skillId'];

function vocab(
  id: string,
  word: string,
  meaningVi: string,
  pictureEmoji: string,
  topic: string,
  skillId: VocabSkill,
  difficulty: KidBoxVocabulary['difficulty'] = 1,
  examplePattern?: string,
): KidBoxVocabulary {
  return {
    kind: 'VOCABULARY',
    id: `kbv-${id}`,
    unitId: KIDBOX_BRIDGE_UNIT_ID,
    word,
    meaningVi,
    pictureEmoji,
    speakText: word,
    topic,
    skillId,
    difficulty,
    britishEnglish: KIDBOX_LOCALE,
    sourceType: 'APP_BRIDGE',
    estimatedSeconds: 20,
    examplePattern,
  };
}

export const BRIDGE_VOCABULARY: KidBoxVocabulary[] = [
  // COLORS
  vocab('color-red', 'red', 'màu đỏ', '🔴', 'COLORS', 'EN-VOCAB-RECOGNITION', 1, 'It is red.'),
  vocab('color-blue', 'blue', 'màu xanh dương', '🔵', 'COLORS', 'EN-VOCAB-RECOGNITION', 1, 'It is blue.'),
  vocab('color-green', 'green', 'màu xanh lá', '🟢', 'COLORS', 'EN-VOCAB-RECOGNITION', 1, 'It is green.'),
  vocab('color-yellow', 'yellow', 'màu vàng', '🟡', 'COLORS', 'EN-VOCAB-RECOGNITION', 1, 'It is yellow.'),
  vocab('color-pink', 'pink', 'màu hồng', '💗', 'COLORS', 'EN-VOCAB-RECOGNITION', 2, 'It is pink.'),
  vocab('color-purple', 'purple', 'màu tím', '🟣', 'COLORS', 'EN-VOCAB-RECOGNITION', 2, 'It is purple.'),

  // ANIMALS
  vocab('animal-dog', 'dog', 'con chó', '🐶', 'ANIMALS', 'EN-VOCAB-RECOGNITION', 1, 'It is a dog.'),
  vocab('animal-cat', 'cat', 'con mèo', '🐱', 'ANIMALS', 'EN-VOCAB-RECOGNITION', 1, 'It is a cat.'),
  vocab('animal-bird', 'bird', 'con chim', '🐦', 'ANIMALS', 'EN-VOCAB-RECOGNITION', 1, 'It is a bird.'),
  vocab('animal-duck', 'duck', 'con vịt', '🦆', 'ANIMALS', 'EN-VOCAB-RECOGNITION', 1, 'It is a duck.'),
  vocab('animal-fish', 'fish', 'con cá', '🐟', 'ANIMALS', 'EN-VOCAB-RECOGNITION', 1, 'It is a fish.'),
  vocab('animal-lion', 'lion', 'con sư tử', '🦁', 'ANIMALS', 'EN-VOCAB-RECOGNITION', 2, 'It is a lion.'),
  vocab('animal-monkey', 'monkey', 'con khỉ', '🐵', 'ANIMALS', 'EN-VOCAB-RECOGNITION', 2, 'It is a monkey.'),

  // FAMILY
  vocab('family-mom', 'mom', 'mẹ', '👩', 'FAMILY', 'EN-VOCAB-MEANING', 1, 'This is my mom.'),
  vocab('family-dad', 'dad', 'bố', '👨', 'FAMILY', 'EN-VOCAB-MEANING', 1, 'This is my dad.'),
  vocab('family-brother', 'brother', 'anh hoặc em trai', '👦', 'FAMILY', 'EN-VOCAB-MEANING', 2, 'This is my brother.'),
  vocab('family-sister', 'sister', 'chị hoặc em gái', '👧', 'FAMILY', 'EN-VOCAB-MEANING', 2, 'This is my sister.'),
  vocab('family-baby', 'baby', 'em bé', '👶', 'FAMILY', 'EN-VOCAB-MEANING', 2, 'This is my baby.'),

  // SCHOOL
  vocab('school-book', 'book', 'quyển sách', '📖', 'SCHOOL', 'EN-VOCAB-MEANING', 1, 'It is a book.'),
  vocab('school-pen', 'pen', 'cây bút', '🖊️', 'SCHOOL', 'EN-VOCAB-MEANING', 1, 'It is a pen.'),
  vocab('school-pencil', 'pencil', 'bút chì', '✏️', 'SCHOOL', 'EN-VOCAB-MEANING', 1, 'It is a pencil.'),
  vocab('school-ruler', 'ruler', 'thước kẻ', '📏', 'SCHOOL', 'EN-VOCAB-MEANING', 2, 'It is a ruler.'),
  vocab('school-bag', 'bag', 'cặp sách', '🎒', 'SCHOOL', 'EN-VOCAB-MEANING', 1, 'It is a bag.'),

  // BODY
  vocab('body-eye', 'eye', 'con mắt', '👁️', 'BODY', 'EN-VOCAB-MEANING', 1, 'I have two eyes.'),
  vocab('body-ear', 'ear', 'con tai', '👂', 'BODY', 'EN-VOCAB-MEANING', 1, 'I have two ears.'),
  vocab('body-nose', 'nose', 'cái mũi', '👃', 'BODY', 'EN-VOCAB-MEANING', 1, 'I have one nose.'),
  vocab('body-mouth', 'mouth', 'cái miệng', '👄', 'BODY', 'EN-VOCAB-MEANING', 1, 'I have one mouth.'),
  vocab('body-hand', 'hand', 'bàn tay', '✋', 'BODY', 'EN-VOCAB-MEANING', 1, 'I have two hands.'),

  // FOOD
  vocab('food-apple', 'apple', 'quả táo', '🍎', 'FOOD', 'EN-VOCAB-RECOGNITION', 1, 'I like apples.'),
  vocab('food-banana', 'banana', 'quả chuối', '🍌', 'FOOD', 'EN-VOCAB-RECOGNITION', 1, 'I like bananas.'),
  vocab('food-milk', 'milk', 'sữa', '🥛', 'FOOD', 'EN-VOCAB-MEANING', 1, 'I like milk.'),
  vocab('food-bread', 'bread', 'bánh mì', '🍞', 'FOOD', 'EN-VOCAB-MEANING', 2, 'I like bread.'),
  vocab('food-water', 'water', 'nước', '💧', 'FOOD', 'EN-VOCAB-MEANING', 1, 'I like water.'),

  // TOYS
  vocab('toy-ball', 'ball', 'quả bóng', '⚽', 'TOYS', 'EN-VOCAB-RECOGNITION', 1, 'I like my ball.'),
  vocab('toy-car', 'car', 'ô tô đồ chơi', '🚗', 'TOYS', 'EN-VOCAB-RECOGNITION', 1, 'I like my car.'),
  vocab('toy-kite', 'kite', 'con diều', '🪁', 'TOYS', 'EN-VOCAB-RECOGNITION', 1, 'I like my kite.'),
  vocab('toy-doll', 'doll', 'búp bê', '🎎', 'TOYS', 'EN-VOCAB-RECOGNITION', 2, 'I like my doll.'),
  vocab('toy-robot', 'robot', 'con robot', '🤖', 'TOYS', 'EN-VOCAB-RECOGNITION', 2, 'I like my robot.'),

  // GREETINGS
  vocab('greet-hello', 'hello', 'xin chào', '👋', 'GREETINGS', 'EN-VOCAB-LISTENING', 1, 'Hello! Good morning.'),
  vocab('greet-goodbye', 'goodbye', 'tạm biệt', '🖐️', 'GREETINGS', 'EN-VOCAB-LISTENING', 1, 'Goodbye! See you.'),
  vocab('greet-thankyou', 'thank you', 'cảm ơn', '🙏', 'GREETINGS', 'EN-VOCAB-LISTENING', 1, 'Thank you very much.'),
  vocab('greet-sorry', 'sorry', 'xin lỗi', '😟', 'GREETINGS', 'EN-VOCAB-RECALL', 2, 'Sorry! I am sorry.'),
];

/* ------------------------------------------------------------------ */
/* §6 PHONICS                                                          */
/* ------------------------------------------------------------------ */

function phonics(
  id: string,
  focusSound: string,
  grapheme: string,
  exampleWord: string,
  exampleEmoji: string,
  skillId: KidBoxPhonics['skillId'],
  difficulty: KidBoxPhonics['difficulty'] = 1,
  contrastWord?: string,
): KidBoxPhonics {
  return {
    kind: 'PHONICS',
    id: `kbp-${id}`,
    unitId: KIDBOX_BRIDGE_UNIT_ID,
    focusSound,
    grapheme,
    exampleWord,
    exampleEmoji,
    contrastWord,
    skillId,
    difficulty,
    britishEnglish: KIDBOX_LOCALE,
    sourceType: 'APP_BRIDGE',
    estimatedSeconds: 25,
  };
}

export const BRIDGE_PHONICS: KidBoxPhonics[] = [
  phonics('letter-a', 'a', 'A', 'apple', '🍎', 'EN-PHONICS-INITIAL'),
  phonics('letter-b', 'b', 'B', 'ball', '⚽', 'EN-PHONICS-INITIAL'),
  phonics('letter-c', 'c', 'C', 'cat', '🐱', 'EN-PHONICS-INITIAL'),
  phonics('letter-d', 'd', 'D', 'duck', '🦆', 'EN-PHONICS-INITIAL'),
  phonics('letter-p', 'p', 'P', 'pen', '🖊️', 'EN-PHONICS-SOUND', 2),
  phonics('letter-s', 's', 'S', 'school', '🏫', 'EN-PHONICS-SOUND', 2),
  // §8 discrimination: minimal pairs built from the repo's own cat/bat/hat/rat set.
  phonics('pair-cat-bat', 'a', 'cat', 'cat', '🐱', 'EN-PHONICS-DISCRIMINATION', 2, 'bat'),
  phonics('pair-bat-cat', 'a', 'bat', 'bat', '🦇', 'EN-PHONICS-DISCRIMINATION', 2, 'cat'),
  phonics('pair-hat-rat', 'a', 'hat', 'hat', '🎩', 'EN-PHONICS-DISCRIMINATION', 3, 'rat'),
  phonics('blend-c-a-t', 'c a t', 'CAT', 'cat', '🐱', 'EN-PHONICS-BLENDING', 2),
  phonics('blend-d-o-g', 'd o g', 'DOG', 'dog', '🐶', 'EN-PHONICS-BLENDING', 2),
];

/* ------------------------------------------------------------------ */
/* §6 LANGUAGE PATTERNS — hear → understand → repeat → use             */
/* ------------------------------------------------------------------ */

function pattern(
  id: string,
  patternText: string,
  meaningVi: string,
  question: string,
  suggestedAnswer: string,
  slots: KidBoxLanguagePattern['slots'],
  skillId: KidBoxLanguagePattern['skillId'],
  difficulty: KidBoxLanguagePattern['difficulty'] = 1,
  pictureEmoji?: string,
): KidBoxLanguagePattern {
  return {
    kind: 'PATTERN',
    id: `kbp2-${id}`,
    unitId: KIDBOX_BRIDGE_UNIT_ID,
    pattern: patternText,
    meaningVi,
    question,
    suggestedAnswer,
    slots,
    skillId,
    difficulty,
    pictureEmoji,
    britishEnglish: KIDBOX_LOCALE,
    sourceType: 'APP_BRIDGE',
    estimatedSeconds: 30,
  };
}

export const BRIDGE_PATTERNS: KidBoxLanguagePattern[] = [
  pattern(
    'what-is-this',
    "What's this?  —  It's a book.",
    'Đây là cái gì? — Đây là một quyển sách.',
    "What's this?",
    'It is a book.',
    ['It is a', 'book'],
    'EN-LANGUAGE-PATTERN',
    1,
    '📖',
  ),
  pattern(
    'who-is-this',
    "Who's this?  —  This is my mom.",
    'Đây là ai? — Đây là mẹ của tôi.',
    "Who's this?",
    'This is my mom.',
    ['This is my', 'mom'],
    'EN-LANGUAGE-PATTERN',
    1,
    '👩',
  ),
  pattern(
    'i-like',
    'I like apples.  —  I don\u2019t like fish.',
    'Tôi thích táo. — Tôi không thích cá.',
    'Do you like bananas?',
    'Yes, I like bananas.',
    ['I like', 'apples'],
    'EN-GRAMMAR-IN-CONTEXT',
    2,
    '🍎',
  ),
  pattern(
    'can-you',
    'Can you jump?  —  Yes, I can.  No, I can\u2019t.',
    'Bạn có nhảy được không? — Có. — Không.',
    'Can you clap?',
    'Yes, I can.',
    ['Yes, I', 'can'],
    'EN-LANGUAGE-PATTERN',
    1,
    '👏',
  ),
];

/* ------------------------------------------------------------------ */
/* §15 READING — original text, never textbook content                 */
/* ------------------------------------------------------------------ */

export const BRIDGE_READING: KidBoxReadingText[] = [
  {
    kind: 'READING',
    id: 'kbr-bridge-1',
    unitId: KIDBOX_BRIDGE_UNIT_ID,
    level: 'SHORT_TEXT',
    // Original four-line text written for this app from Level 1 concepts.
    text: 'This is Sam. Sam is my friend. We have a red ball and a blue kite. I like my ball. We can play in the park.',
    textVi: 'Đây là Sam. Sam là bạn của tôi. Chúng tôi có một quả bóng màu đỏ và một con diều màu xanh. Tôi thích quả bóng của mình. Chúng tôi có thể chơi trong công viên.',
    wordCount: 28,
    skillId: 'EN-READING-COMPREHENSION',
    difficulty: 2,
    britishEnglish: KIDBOX_LOCALE,
    sourceType: 'APP_BRIDGE',
    estimatedSeconds: 60,
    comprehension: [
      {
        id: 'kbr-bridge-1-q1',
        prompt: 'Who is Sam?',
        options: ['Sam is my friend.', 'Sam is my cat.', 'Sam is my book.'],
        correctAnswer: 'Sam is my friend.',
        explanation: 'Câu “Sam is my friend.” nói rõ Sam là bạn của tôi.',
      },
      {
        id: 'kbr-bridge-1-q2',
        prompt: 'What colour is the ball?',
        options: ['The ball is red.', 'The ball is blue.', 'The ball is green.'],
        correctAnswer: 'The ball is red.',
        explanation: 'Câu “We have a red ball and a blue kite.” → bóng màu đỏ, diều màu xanh.',
      },
    ],
  },
  {
    kind: 'READING',
    id: 'kbr-bridge-2',
    unitId: KIDBOX_BRIDGE_UNIT_ID,
    level: 'SENTENCE',
    text: 'I have two eyes and two ears.',
    textVi: 'Tôi có hai con mắt và hai con tai.',
    wordCount: 8,
    skillId: 'EN-READING-SENTENCE',
    difficulty: 1,
    britishEnglish: KIDBOX_LOCALE,
    sourceType: 'APP_BRIDGE',
    estimatedSeconds: 30,
    comprehension: [
      {
        id: 'kbr-bridge-2-q1',
        prompt: 'How many ears?',
        options: ['Two.', 'One.', 'Three.'],
        correctAnswer: 'Two.',
        explanation: 'Câu “I have two eyes and two ears.” → hai con tai.',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* THE BRIDGE UNIT                                                     */
/* ------------------------------------------------------------------ */

export const BRIDGE_UNIT: KidBoxUnit = {
  id: KIDBOX_BRIDGE_UNIT_ID,
  courseId: 'kids-box-new-generation-1',
  levelId: 'LEVEL_1',
  index: 0,
  title: 'Luyện tập nền (English Island)',
  topicLabel: 'BRIDGE',
  sourceType: 'APP_BRIDGE',
  contentStatus: 'READY',
  britishEnglish: KIDBOX_LOCALE,
  learningObjectives: [
    'Nhận diện và gọi tên các từ vựng Level 1 đã có trong ứng dụng.',
    'Nghe và hiểu giọng British English (en-GB) kèm phụ đề tiếng Việt.',
    'Nói lại từ và câu ngắn bằng chế độ nghe – lặp lại – tự đánh giá.',
    'Phân biệt âm đầu và âm gần giống trong các từ đơn giản.',
  ],
  skills: [
    'EN-VOCAB-RECOGNITION',
    'EN-VOCAB-MEANING',
    'EN-VOCAB-LISTENING',
    'EN-VOCAB-RECALL',
    'EN-PHONICS-SOUND',
    'EN-PHONICS-INITIAL',
    'EN-PHONICS-DISCRIMINATION',
    'EN-PHONICS-BLENDING',
    'EN-LISTENING-RECOGNITION',
    'EN-LISTENING-INSTRUCTION',
    'EN-SPEAKING-REPEAT',
    'EN-SPEAKING-PATTERN',
    'EN-READING-SENTENCE',
    'EN-READING-COMPREHENSION',
    'EN-LANGUAGE-PATTERN',
    'EN-GRAMMAR-IN-CONTEXT',
  ],
  lessons: [
    {
      id: 'kb-bridge-lesson-1',
      unitId: KIDBOX_BRIDGE_UNIT_ID,
      index: 1,
      title: 'Words we can see and hear',
      learningObjective: 'Gọi tên đúng các từ vựng quen thuộc sau khi nghe giọng British English.',
      skills: ['EN-VOCAB-RECOGNITION', 'EN-VOCAB-LISTENING'],
      mascotTip: 'Bấm loa nghe thật chăm chỉ, rồi chọn đúng hình nhé!',
    },
    {
      id: 'kb-bridge-lesson-2',
      unitId: KIDBOX_BRIDGE_UNIT_ID,
      index: 2,
      title: 'Sounds and patterns',
      learningObjective: 'Nghe phân biệt âm đầu và dùng được mẫu câu ngắn.',
      skills: ['EN-PHONICS-DISCRIMINATION', 'EN-LANGUAGE-PATTERN'],
      mascotTip: 'Nghe âm đầu, rồi ghép câu ngắn thật dễ thôi!',
    },
  ],
  vocabulary: BRIDGE_VOCABULARY,
  phonics: BRIDGE_PHONICS,
  patterns: BRIDGE_PATTERNS,
  readingTexts: BRIDGE_READING,
  missingContent: [],
  mappingNote: BRIDGE_MAPPING_NOTE,
};
