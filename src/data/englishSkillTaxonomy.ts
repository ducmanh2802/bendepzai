/**
 * ENGLISH SKILL TAXONOMY & MAPPING MODEL — P32
 *
 * Bộ kỹ năng tiếng Anh chuẩn lớp 1, đối chiếu khung Cambridge Pre A1 Starters.
 * skillName là nhãn hiển thị trong bảng kỹ năng cho ba mẹ nên viết tiếng Việt;
 * machine key là skillId/category/subSkills (không đổi khi sửa nhãn).
 * - Alphabet: Nhận biết chữ cái, Âm của chữ cái, Đánh vần, Âm đầu của từ
 * - Numbers: Đếm số, Nhận biết số, So sánh số lượng
 * - Colors: Nhận biết màu, Từ vựng màu sắc
 * - Animals: Từ vựng động vật, Nhận biết động vật
 * - Family: Từ vựng gia đình
 * - School Supplies: Từ vựng đồ dùng học tập
 * - Body: Từ vựng về cơ thể
 * - Food: Từ vựng đồ ăn, Từ vựng trái cây
 * - Toys & Playground: Từ vựng đồ chơi, Từ vựng sân chơi
 * - Greetings: Nhận biết lời chào, Dùng lời chào
 * - Core Skills: Kỹ năng Nghe, Nói, Đọc, Viết
 */

import type { EnglishDifficultyLevel, EnglishSkillDescriptor, EnglishSkillType } from '../types/englishMastery';
import type { Question } from '../types';

export const CANONICAL_ENGLISH_SKILLS: readonly EnglishSkillDescriptor[] = [
  // --- Alphabet & Phonics ---
  {
    skillId: 'eng_alphabet_recognition',
    skillName: 'Nhận biết chữ cái',
    category: 'alphabet',
    topicId: 'eng-alphabet',
    description: 'Nhận biết mặt chữ cái tiếng Anh in hoa và in thường.',
    subSkills: ['letter_identification', 'case_matching'],
    benchmarkDifficulty: 1,
  },
  {
    skillId: 'eng_alphabet_sound',
    skillName: 'Âm của chữ cái',
    category: 'phonics',
    topicId: 'eng-alphabet',
    description: 'Nghe và nhận ra âm thanh đặc trưng của từng chữ cái.',
    subSkills: ['phoneme_matching', 'sound_isolation'],
    benchmarkDifficulty: 2,
  },
  {
    skillId: 'eng_alphabet_phonics',
    skillName: 'Đánh vần',
    category: 'phonics',
    topicId: 'eng-alphabet',
    description: 'Ghép âm và giải mã từ đơn giản CVC.',
    subSkills: ['cvc_blending', 'vowel_sounds'],
    benchmarkDifficulty: 3,
  },
  {
    skillId: 'eng_alphabet_initial_sound',
    skillName: 'Âm đầu của từ',
    category: 'phonics',
    topicId: 'eng-alphabet',
    description: 'Nhận biết âm đầu của từ vựng (ví dụ: A in Apple, B in Ball).',
    subSkills: ['initial_phoneme', 'alliteration'],
    benchmarkDifficulty: 2,
  },

  // --- Numbers & Counting ---
  {
    skillId: 'eng_numbers_counting',
    skillName: 'Đếm số',
    category: 'numbers',
    topicId: 'eng-numbers',
    description: 'Đếm số lượng đồ vật từ 1 đến 10 bằng tiếng Anh.',
    subSkills: ['one_to_ten_counting', 'subitizing'],
    benchmarkDifficulty: 2,
  },
  {
    skillId: 'eng_numbers_recognition',
    skillName: 'Nhận biết số',
    category: 'numbers',
    topicId: 'eng-numbers',
    description: 'Nhận diện chữ số và tên gọi tiếng Anh (One, Two, Three...).',
    subSkills: ['numeral_to_word', 'word_to_numeral'],
    benchmarkDifficulty: 1,
  },
  {
    skillId: 'eng_numbers_quantity',
    skillName: 'So sánh số lượng',
    category: 'numbers',
    topicId: 'eng-numbers',
    description: 'So khớp số lượng thực tế với số đếm và danh từ số nhiều.',
    subSkills: ['plural_forms', 'quantity_matching'],
    benchmarkDifficulty: 3,
  },

  // --- Colors ---
  {
    skillId: 'eng_colors_recognition',
    skillName: 'Nhận biết màu',
    category: 'colors',
    topicId: 'eng-colors',
    description: 'Nhận diện các màu sắc cơ bản qua hình ảnh trực quan.',
    subSkills: ['color_naming', 'color_matching'],
    benchmarkDifficulty: 1,
  },
  {
    skillId: 'eng_colors_vocabulary',
    skillName: 'Từ vựng màu sắc',
    category: 'colors',
    topicId: 'eng-colors',
    description: 'Vận dụng từ vựng chỉ màu sắc trong câu đơn miêu tả đồ vật.',
    subSkills: ['color_adjectives', 'noun_modifiers'],
    benchmarkDifficulty: 2,
  },

  // --- Animals ---
  {
    skillId: 'eng_animals_vocabulary',
    skillName: 'Từ vựng động vật',
    category: 'animals',
    topicId: 'eng-animals',
    description: 'Từ vựng các con vật quen thuộc (cat, dog, bird, duck, rabbit, etc.).',
    subSkills: ['pet_names', 'farm_animals'],
    benchmarkDifficulty: 1,
  },
  {
    skillId: 'eng_animals_recognition',
    skillName: 'Nhận biết động vật',
    category: 'animals',
    topicId: 'eng-animals',
    description: 'Nhận diện tiếng kêu và đặc điểm nhận dạng của loài vật.',
    subSkills: ['animal_sounds', 'action_verbs'],
    benchmarkDifficulty: 2,
  },

  // --- Family ---
  {
    skillId: 'eng_family_vocabulary',
    skillName: 'Từ vựng gia đình',
    category: 'family',
    topicId: 'eng-family',
    description: 'Từ vựng các thành viên gia đình (dad, mum, brother, sister, baby).',
    subSkills: ['family_members', 'pronouns_he_she'],
    benchmarkDifficulty: 2,
  },

  // --- School Supplies ---
  {
    skillId: 'eng_school_vocabulary',
    skillName: 'Từ vựng đồ dùng học tập',
    category: 'school',
    topicId: 'eng-school',
    description: 'Đồ dùng học tập (book, pencil, pen, eraser, ruler, school bag).',
    subSkills: ['classroom_objects', 'action_commands'],
    benchmarkDifficulty: 2,
  },

  // --- Body ---
  {
    skillId: 'eng_body_vocabulary',
    skillName: 'Từ vựng về cơ thể',
    category: 'body',
    topicId: 'eng-body',
    description: 'Các bộ phận cơ thể và khuôn mặt (eyes, ears, nose, mouth, hands, legs).',
    subSkills: ['facial_features', 'body_parts', 'plural_parts'],
    benchmarkDifficulty: 2,
  },

  // --- Food & Fruit ---
  {
    skillId: 'eng_food_vocabulary',
    skillName: 'Từ vựng đồ ăn',
    category: 'food',
    topicId: 'eng-food',
    description: 'Từ vựng đồ ăn, thức uống hàng ngày (bread, milk, water, rice, egg).',
    subSkills: ['daily_food', 'preferences_like_dislike'],
    benchmarkDifficulty: 2,
  },
  {
    skillId: 'eng_food_fruit',
    skillName: 'Từ vựng trái cây',
    category: 'food',
    topicId: 'eng-food',
    description: 'Từ vựng các loại trái cây thơm ngon (apple, banana, orange, mango).',
    subSkills: ['fruit_names', 'fruit_colors'],
    benchmarkDifficulty: 1,
  },

  // --- Toys & Playground ---
  {
    skillId: 'eng_toys_vocabulary',
    skillName: 'Từ vựng đồ chơi',
    category: 'toys',
    topicId: 'eng-toys',
    description: 'Từ vựng đồ chơi yêu thích (ball, doll, robot, teddy, car, kite).',
    subSkills: ['toy_items', 'possessives_my_your'],
    benchmarkDifficulty: 1,
  },
  {
    skillId: 'eng_playground_vocabulary',
    skillName: 'Từ vựng sân chơi',
    category: 'toys',
    topicId: 'eng-toys',
    description: 'Hoạt động và trò chơi sân chơi (slide, swing, see-saw, sandbox).',
    subSkills: ['playground_objects', 'play_actions'],
    benchmarkDifficulty: 2,
  },

  // --- Greetings ---
  {
    skillId: 'eng_greetings_recognition',
    skillName: 'Nhận biết lời chào',
    category: 'greetings',
    topicId: 'eng-greetings',
    description: 'Nhận biết lời chào hỏi căn bản (Hello, Hi, Goodbye, Bye bye).',
    subSkills: ['basic_greetings', 'courtesy_words'],
    benchmarkDifficulty: 1,
  },
  {
    skillId: 'eng_greetings_usage',
    skillName: 'Dùng lời chào',
    category: 'greetings',
    topicId: 'eng-greetings',
    description: 'Vận dụng câu chào và hỏi thăm theo thời điểm (Good morning, How are you?).',
    subSkills: ['time_based_greetings', 'feelings_response'],
    benchmarkDifficulty: 2,
  },

  // --- 4 Core Skills ---
  {
    skillId: 'eng_skill_listening',
    skillName: 'Kỹ năng Nghe',
    category: 'listening',
    topicId: 'eng-skills-listening',
    description: 'Nghe hiểu từ và câu chỉ dẫn đơn giản của giáo viên / người bản ngữ.',
    subSkills: ['word_listening', 'instruction_following'],
    benchmarkDifficulty: 3,
  },
  {
    skillId: 'eng_skill_speaking',
    skillName: 'Kỹ năng Nói',
    category: 'speaking',
    topicId: 'eng-skills-speaking',
    description: 'Nói lặp lại từ, gọi tên đồ vật và trả lời câu hỏi ngắn có hướng dẫn.',
    subSkills: ['pronunciation_echo', 'short_response'],
    benchmarkDifficulty: 3,
  },
  {
    skillId: 'eng_skill_reading',
    skillName: 'Kỹ năng Đọc',
    category: 'reading',
    topicId: 'eng-skills-reading',
    description: 'Đọc từ đơn, ghép từ với hình và đọc câu miêu tả ngắn.',
    subSkills: ['sight_words', 'sentence_reading'],
    benchmarkDifficulty: 4,
  },
  {
    skillId: 'eng_skill_writing',
    skillName: 'Kỹ năng Viết',
    category: 'writing',
    topicId: 'eng-skills-writing',
    description: 'Tập chép chữ cái, điền chữ còn thiếu vào từ vựng quen thuộc.',
    subSkills: ['missing_letter_fill', 'word_scramble'],
    benchmarkDifficulty: 4,
  },
] as const;

export const ENGLISH_SKILL_MAP = new Map<string, EnglishSkillDescriptor>(
  CANONICAL_ENGLISH_SKILLS.map((s) => [s.skillId, s])
);

/**
 * Maps any question in the repository to a canonical English Skill
 */
export function resolveEnglishSkill(question: Question): EnglishSkillDescriptor {
  const rawSkill = (question.skillId || '').toLowerCase();
  const topicId = (question.topicId || '').toLowerCase();
  const qType = (question.type || '').toLowerCase();
  const prompt = (question.prompt || '').toLowerCase();

  // 1. Exact canonical match
  if (ENGLISH_SKILL_MAP.has(rawSkill)) {
    return ENGLISH_SKILL_MAP.get(rawSkill)!;
  }

  // 2. High priority skill types (Listening, Speaking, Writing, Reading)
  if (qType === 'audio-choice' || prompt.includes('listen') || question.audioPrompt) {
    if (rawSkill.includes('phonics') || prompt.includes('sound') || prompt.includes('letter')) {
      return ENGLISH_SKILL_MAP.get('eng_alphabet_sound')!;
    }
    if (qType === 'audio-choice' && (prompt.includes('listen and choose') || prompt.includes('hear'))) {
      return ENGLISH_SKILL_MAP.get('eng_skill_listening')!;
    }
  }

  if (qType === 'fill-blank' || prompt.includes('missing letter') || prompt.includes('spell')) {
    return ENGLISH_SKILL_MAP.get('eng_skill_writing')!;
  }

  if (prompt.includes('read') || prompt.includes('look and read') || prompt.includes('sentence')) {
    return ENGLISH_SKILL_MAP.get('eng_skill_reading')!;
  }

  // 3. Alphabet & Phonics
  if (
    rawSkill.includes('alphabet') ||
    rawSkill.includes('letter') ||
    rawSkill.includes('phonics') ||
    topicId.includes('alphabet')
  ) {
    if (prompt.includes('initial') || prompt.includes('starts with')) {
      return ENGLISH_SKILL_MAP.get('eng_alphabet_initial_sound')!;
    }
    if (prompt.includes('sound') || prompt.includes('phonics')) {
      return ENGLISH_SKILL_MAP.get('eng_alphabet_phonics')!;
    }
    return ENGLISH_SKILL_MAP.get('eng_alphabet_recognition')!;
  }

  // 4. Numbers
  if (rawSkill.includes('number') || rawSkill.includes('count') || topicId.includes('number')) {
    if (prompt.includes('how many') || prompt.includes('count')) {
      return ENGLISH_SKILL_MAP.get('eng_numbers_counting')!;
    }
    if (prompt.includes('plural') || prompt.includes('more than')) {
      return ENGLISH_SKILL_MAP.get('eng_numbers_quantity')!;
    }
    return ENGLISH_SKILL_MAP.get('eng_numbers_recognition')!;
  }

  // 5. Colors
  if (rawSkill.includes('color') || topicId.includes('color')) {
    if (prompt.includes('sentence') || prompt.includes('is') || prompt.includes('the')) {
      return ENGLISH_SKILL_MAP.get('eng_colors_vocabulary')!;
    }
    return ENGLISH_SKILL_MAP.get('eng_colors_recognition')!;
  }

  // 6. Animals
  if (rawSkill.includes('animal') || rawSkill.includes('pet') || topicId.includes('animal') || topicId.includes('pet')) {
    if (prompt.includes('sound') || prompt.includes('can') || prompt.includes('does')) {
      return ENGLISH_SKILL_MAP.get('eng_animals_recognition')!;
    }
    return ENGLISH_SKILL_MAP.get('eng_animals_vocabulary')!;
  }

  // 7. Family
  if (rawSkill.includes('family') || topicId.includes('family')) {
    return ENGLISH_SKILL_MAP.get('eng_family_vocabulary')!;
  }

  // 8. School Supplies
  if (rawSkill.includes('school') || topicId.includes('school')) {
    return ENGLISH_SKILL_MAP.get('eng_school_vocabulary')!;
  }

  // 9. Body & Face
  if (rawSkill.includes('body') || rawSkill.includes('face') || topicId.includes('body') || topicId.includes('face')) {
    return ENGLISH_SKILL_MAP.get('eng_body_vocabulary')!;
  }

  // 10. Food & Fruit
  if (rawSkill.includes('food') || topicId.includes('food') || topicId.includes('fruit')) {
    if (prompt.includes('fruit') || prompt.includes('apple') || prompt.includes('banana')) {
      return ENGLISH_SKILL_MAP.get('eng_food_fruit')!;
    }
    return ENGLISH_SKILL_MAP.get('eng_food_vocabulary')!;
  }

  // 11. Toys & Playground
  if (rawSkill.includes('toy') || topicId.includes('toy')) {
    if (prompt.includes('playground') || prompt.includes('swing') || prompt.includes('slide')) {
      return ENGLISH_SKILL_MAP.get('eng_playground_vocabulary')!;
    }
    return ENGLISH_SKILL_MAP.get('eng_toys_vocabulary')!;
  }

  // 12. Greetings
  if (rawSkill.includes('hello') || rawSkill.includes('greet') || topicId.includes('greet') || topicId.includes('hello')) {
    if (prompt.includes('morning') || prompt.includes('how are you') || prompt.includes('time to go')) {
      return ENGLISH_SKILL_MAP.get('eng_greetings_usage')!;
    }
    return ENGLISH_SKILL_MAP.get('eng_greetings_recognition')!;
  }

  // 13. Fallback based on question type
  if (qType === 'audio-choice') return ENGLISH_SKILL_MAP.get('eng_skill_listening')!;
  if (qType === 'fill-blank') return ENGLISH_SKILL_MAP.get('eng_skill_writing')!;

  // Default to Alphabet recognition or Reading
  return ENGLISH_SKILL_MAP.get('eng_alphabet_recognition')!;
}

/**
 * Categorizes a Question into D1–D5 difficulty level deterministically
 */
export function inferQuestionDifficulty(question: Question): EnglishDifficultyLevel {
  const explicitDiff = Number(question.difficulty);
  const qType = question.type;
  const prompt = question.prompt.toLowerCase();

  // If question already specifies difficulty 1..3, map as baseline:
  // Level 1: Recognition / simple choice
  // Level 2: Recall / ordering / fill-blank
  // Level 3: Application / complex question
  if (explicitDiff === 1) {
    if (qType === 'multiple-choice' || qType === 'image-choice') {
      return 1; // D1
    }
    return 2; // D2
  }

  if (explicitDiff === 2) {
    if (prompt.length > 50 || prompt.includes('read') || prompt.includes('story')) {
      return 4; // D4
    }
    return 3; // D3
  }

  if (explicitDiff >= 3) {
    if (prompt.includes('starters') || prompt.includes('challenge') || prompt.includes('look and read')) {
      return 5; // D5
    }
    return 4; // D4
  }

  return 1;
}
