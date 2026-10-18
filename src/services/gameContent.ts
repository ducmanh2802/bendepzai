/**
 * T04 — Ngân hàng câu hỏi chung cho game (gameContent service).
 * Dùng lại nội dung từ chương trình học + ôn tập cho các game.
 */

import { Question, SubjectType } from '../types';
import { getAllQuestions, getAllSkills } from '../data/curriculum';
import { WORD_BANK, WordBankEntry, getWordsByRhyme, getWordsByTopic, getAllRhymes } from '../data/wordBank';
import { COMPETITION_QUESTIONS } from '../data/competitionQuestions';
import { seededRng, pickDistinct, shuffleSeeded } from '../data/gameLevels';

export type GameKind =
  | 'word-picture'
  | 'first-sound'
  | 'rhyme'
  | 'tone'
  | 'sentence'
  | 'arith'
  | 'compare'
  | 'count'
  | 'en-word'
  | 'en-phonics'
  | 'en-color'
  | 'en-animal'
  | 'shape'
  | 'time';

export interface GameItem {
  id: string;
  prompt: string;
  audioText?: string;
  emoji?: string;
  answer: string;
  options: string[];
  skillId: string;
  difficulty: 1 | 2 | 3 | 4 | 5 | 6;
  source: 'curriculum' | 'review' | 'game-pack';
}

export interface GetGameItemsOptions {
  subject?: SubjectType;
  skillIds?: string[];
  kinds?: GameKind[];
  count?: number;
  tier?: number;
  seed?: number;
  preferReview?: boolean;
}

/**
 * Map game kind to curriculum skill IDs.
 */
const KIND_TO_SKILLS: Record<GameKind, string[]> = {
  'word-picture': ['vn_alphabet_vowel', 'vn_alphabet_consonant', 'vn_vocab_objects', 'vn_vocab_people'],
  'first-sound': ['vn_alphabet_vowel', 'vn_alphabet_consonant', 'eng_letters_phonics'],
  'rhyme': ['vn_rhyme_an_at', 'vn_rhyme_on_ot', 'vn_rhyme_am_ap'],
  'tone': ['vn_tone_recognition', 'vn_tone_application'],
  'sentence': ['vn_sentence_ordering', 'vn_reading_comprehension'],
  'arith': ['math_addition_10', 'math_subtraction_10', 'math_calc_20'],
  'compare': ['math_comparison'],
  'count': ['math_counting_10', 'math_number_recognition', 'eng_numbers_10'],
  'en-word': ['eng_vocab_colors', 'eng_vocab_animals', 'eng_vocab_family', 'eng_vocab_school', 'eng_vocab_body', 'eng_vocab_food', 'eng_vocab_toys'],
  'en-phonics': ['eng_letters_phonics'],
  'en-color': ['eng_vocab_colors'],
  'en-animal': ['eng_vocab_animals'],
  'shape': ['math_geometry_shapes'],
  'time': ['math_measurement'],
};

/**
 * Map game kind to competition skill IDs.
 */
const KIND_TO_COMP_SKILLS: Record<GameKind, string[]> = {
  'word-picture': ['TV-PHONICS', 'TV-WORD'],
  'first-sound': ['TV-PHONICS'],
  'rhyme': ['TV-RHYME'],
  'tone': ['TV-TONES'],
  'sentence': ['TV-SENTENCE', 'TV-READING'],
  'arith': ['MATH-ARITH'],
  'compare': ['MATH-COMPARE'],
  'count': ['MATH-COUNT'],
  'en-word': ['ENG-VOCAB'],
  'en-phonics': ['ENG-PHONICS'],
  'en-color': ['ENG-VOCAB'],
  'en-animal': ['ENG-VOCAB'],
  'shape': ['MATH-GEOMETRY'],
  'time': ['MATH-MEASUREMENT'],
};

/**
 * Map subject to curriculum subject type.
 */
const SUBJECT_TO_CURRICULUM: Record<string, SubjectType> = {
  'tieng-viet': 'tieng-viet',
  'toan': 'toan',
  'english': 'english',
};

/**
 * Get difficulty range for a tier (1-6).
 */
function tierToDifficultyRange(tier: number): [number, number] {
  if (tier <= 2) return [1, 2];
  if (tier <= 4) return [2, 3];
  return [3, 4];
}

/**
 * Convert a curriculum Question to a GameItem.
 */
function questionToGameItem(q: Question, rng: () => number): GameItem {
  const options = q.options && q.options.length > 0
    ? shuffleSeeded(q.options, rng)
    : [q.correctAnswer as string];

  // Ensure answer is in options
  if (!options.includes(q.correctAnswer as string)) {
    options[0] = q.correctAnswer as string;
  }

  return {
    id: q.id,
    prompt: q.prompt,
    audioText: q.audioPrompt,
    emoji: q.mediaEmoji,
    answer: q.correctAnswer as string,
    options,
    skillId: q.skillId,
    difficulty: q.difficulty as 1 | 2 | 3 | 4 | 5 | 6,
    source: 'curriculum',
  };
}

/**
 * Convert a competition question to a GameItem.
 */
function competitionToGameItem(cq: typeof COMPETITION_QUESTIONS[0], rng: () => number): GameItem {
  const options = cq.options && cq.options.length > 0
    ? shuffleSeeded(cq.options, rng)
    : [cq.correctAnswer];

  if (!options.includes(cq.correctAnswer)) {
    options[0] = cq.correctAnswer;
  }

  return {
    id: cq.id,
    prompt: cq.prompt,
    audioText: cq.explanation,
    emoji: cq.mediaEmoji,
    answer: cq.correctAnswer,
    options,
    skillId: cq.skillId,
    difficulty: cq.difficulty === 'EASY' ? 1 : cq.difficulty === 'MEDIUM' ? 2 : cq.difficulty === 'HARD' ? 3 : 4,
    source: 'game-pack',
  };
}

/**
 * Generate word-picture items from WORD_BANK.
 */
function generateWordPictureItems(count: number, rng: () => number, minDiff: number, maxDiff: number, topicFilter?: string): GameItem[] {
  let pool = WORD_BANK;
  if (topicFilter) {
    pool = getWordsByTopic(topicFilter);
  }
  if (pool.length === 0) pool = WORD_BANK;

  const items: GameItem[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count && i < pool.length * 2; i++) {
    const word = pickDistinct(pool, 1, rng)[0];
    if (used.has(word.word)) continue;
    used.add(word.word);

    // Create distractors from same topic
    const sameTopic = pool.filter(w => w.word !== word.word);
    const distractors = pickDistinct(sameTopic, 3, rng).map(w => w.word);

    const options = shuffleSeeded([word.word, ...distractors], rng);

    // Difficulty based on tier
    const difficulty = minDiff + Math.floor(rng() * (maxDiff - minDiff + 1));

    items.push({
      id: `wp-${word.word.replace(/\s+/g, '-')}-${rng() * 1000 | 0}`,
      prompt: `Hình nào là "${word.word}"?`,
      audioText: `Chọn hình ${word.word}`,
      emoji: word.emoji,
      answer: word.word,
      options,
      skillId: 'vn_vocab_objects',
      difficulty: difficulty as 1 | 2 | 3 | 4 | 5 | 6,
      source: 'game-pack',
    });
  }

  return items;
}

/**
 * Generate first-sound items from WORD_BANK.
 */
function generateFirstSoundItems(count: number, rng: () => number, subject: SubjectType, minDiff: number, maxDiff: number): GameItem[] {
  const pool = WORD_BANK.filter(w => subject === 'english' ? w.topic !== 'vần an' && w.topic !== 'vần at' && w.topic !== 'vần on' : true);
  const items: GameItem[] = [];

  for (let i = 0; i < count && i < pool.length; i++) {
    const word = pickDistinct(pool, 1, rng)[0];
    const onset = word.onset || word.word[0].toUpperCase();

    // Distractors: other onsets
    const otherOnsets = [...new Set(WORD_BANK.map(w => w.onset || w.word[0].toUpperCase()).filter(o => o !== onset))];
    const distractors = pickDistinct(otherOnsets, 3, rng);

    const options = shuffleSeeded([onset, ...distractors], rng);

    // Difficulty based on tier
    const difficulty = minDiff + Math.floor(rng() * (maxDiff - minDiff + 1));

    items.push({
      id: `fs-${word.word.replace(/\s+/g, '-')}-${rng() * 1000 | 0}`,
      prompt: `Chữ cái nào bắt đầu cho từ "${word.word}"?`,
      audioText: `Từ ${word.word} bắt đầu bằng âm ${onset}`,
      emoji: word.emoji,
      answer: onset,
      options,
      skillId: subject === 'english' ? 'eng_letters_phonics' : 'vn_alphabet_consonant',
      difficulty: difficulty as 1 | 2 | 3 | 4 | 5 | 6,
      source: 'game-pack',
    });
  }

  return items;
}

/**
 * Generate rhyme items from WORD_BANK.
 */
function generateRhymeItems(count: number, rng: () => number, minDiff: number, maxDiff: number): GameItem[] {
  const rhymes = getAllRhymes();
  const items: GameItem[] = [];

  for (let i = 0; i < count && i < rhymes.length; i++) {
    const rhyme = rhymes[i];
    const words = getWordsByRhyme(rhyme);
    if (words.length < 2) continue;

    const targetWords = pickDistinct(words, Math.min(4, words.length), rng);
    const distractors = pickDistinct(
      WORD_BANK.filter(w => w.rhyme !== rhyme),
      Math.max(2, 6 - targetWords.length),
      rng
    );

    const allWords = [...targetWords, ...distractors];
    const options = shuffleSeeded(allWords.map(w => w.word), rng);

    // Difficulty based on tier
    const difficulty = minDiff + Math.floor(rng() * (maxDiff - minDiff + 1));

    items.push({
      id: `rhyme-${rhyme}-${rng() * 1000 | 0}`,
      prompt: `Tìm các từ có vần "${rhyme.toUpperCase()}"`,
      audioText: `Tìm từ có vần ${rhyme}`,
      emoji: targetWords[0]?.emoji || '🍎',
      answer: targetWords.map(w => w.word).join(', '),
      options,
      skillId: 'vn_rhyme_an_at',
      difficulty: difficulty as 1 | 2 | 3 | 4 | 5 | 6,
      source: 'game-pack',
    });
  }

  return items;
}

/**
 * Generate tone items from WORD_BANK.
 */
function generateToneItems(count: number, rng: () => number, minDiff: number, maxDiff: number): GameItem[] {
  const tones: WordBankEntry['tone'][] = ['ngang', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng'];
  const items: GameItem[] = [];

  for (let i = 0; i < count; i++) {
    const tone = tones[i % tones.length];
    const wordsWithTone = WORD_BANK.filter(w => w.tone === tone);
    if (wordsWithTone.length === 0) continue;

    const word = pickDistinct(wordsWithTone, 1, rng)[0];
    const distractors = pickDistinct(
      tones.filter(t => t !== tone),
      3,
      rng
    ).map(t => ({
      name: t.charAt(0).toUpperCase() + t.slice(1),
      tone: t as WordBankEntry['tone'],
    }));

    const options = shuffleSeeded([
      `Dấu ${tone.charAt(0).toUpperCase() + tone.slice(1)}`,
      ...distractors.map(d => `Dấu ${d.name}`)
    ], rng);

    // Difficulty based on tier
    const difficulty = minDiff + Math.floor(rng() * (maxDiff - minDiff + 1));

    items.push({
      id: `tone-${tone}-${rng() * 1000 | 0}`,
      prompt: `Từ "${word.word}" mang dấu thanh gì?`,
      audioText: `Từ ${word.word} mang dấu ${tone}`,
      emoji: word.emoji,
      answer: `Dấu ${tone.charAt(0).toUpperCase() + tone.slice(1)}`,
      options,
      skillId: 'vn_tone_recognition',
      difficulty: difficulty as 1 | 2 | 3 | 4 | 5 | 6,
      source: 'game-pack',
    });
  }

  return items;
}

/**
 * Main function to get game items from multiple sources.
 */
export function getGameItems(options: GetGameItemsOptions = {}): GameItem[] {
  const {
    subject,
    skillIds = [],
    kinds = [],
    count = 10,
    tier = 1,
    seed = Date.now(),
    preferReview = false,
  } = options;

  const rng = seededRng(seed);
  const allItems: GameItem[] = [];
  const [minDiff, maxDiff] = tierToDifficultyRange(tier);
  // Use provided kinds, or default to supported game-pack kinds
  const targetKinds = kinds.length > 0 ? kinds : ['word-picture', 'first-sound', 'rhyme', 'tone'];
  // Filter to only supported game-pack kinds for generation
  const supportedGamePackKinds: GameKind[] = ['word-picture', 'first-sound', 'rhyme', 'tone'];
  const gamePackKinds = targetKinds.filter(k => supportedGamePackKinds.includes(k as GameKind));

  // 1. Curriculum questions
  const curriculumQuestions = getAllQuestions().filter(q => {
    if (subject && q.subject !== subject) return false;
    if (skillIds.length > 0 && !skillIds.includes(q.skillId)) return false;
    const kindSkills = targetKinds.flatMap(k => KIND_TO_SKILLS[k as GameKind] || []);
    if (kindSkills.length > 0 && !kindSkills.includes(q.skillId)) return false;
    const [minD, maxD] = tierToDifficultyRange(tier);
    return q.difficulty >= minD && q.difficulty <= maxD;
  });

  // Shuffle and take from curriculum
  const shuffledCurriculum = shuffleSeeded(curriculumQuestions, rng);
  for (const q of shuffledCurriculum.slice(0, Math.ceil(count * 0.4))) {
    allItems.push(questionToGameItem(q, rng));
  }

  // 2. Competition questions (easy/medium only)
  const compQuestions = COMPETITION_QUESTIONS.filter(cq => {
    if (subject && cq.subject !== subject) return false;
    if (skillIds.length > 0 && !skillIds.includes(cq.skillId)) return false;
    const kindCompSkills = targetKinds.flatMap(k => KIND_TO_COMP_SKILLS[k as GameKind] || []);
    if (kindCompSkills.length > 0 && !kindCompSkills.includes(cq.skillId)) return false;
    return cq.difficulty === 'EASY' || cq.difficulty === 'MEDIUM';
  });

  const shuffledComp = shuffleSeeded(compQuestions, rng);
  for (const cq of shuffledComp.slice(0, Math.ceil(count * 0.3))) {
    allItems.push(competitionToGameItem(cq, rng));
  }

  // 3. Game-pack generated items (word-bank based) - only for supported kinds
  const remainingCount = count - allItems.length;
  if (remainingCount > 0 && gamePackKinds.length > 0) {
    const gamePackItems: GameItem[] = [];

    for (const kind of gamePackKinds) {
      const kindCount = Math.ceil(remainingCount / gamePackKinds.length);

      switch (kind) {
        case 'word-picture':
          gamePackItems.push(...generateWordPictureItems(kindCount, rng, minDiff, maxDiff));
          break;
        case 'first-sound':
          gamePackItems.push(...generateFirstSoundItems(kindCount, rng, subject || 'tieng-viet', minDiff, maxDiff));
          break;
        case 'rhyme':
          gamePackItems.push(...generateRhymeItems(kindCount, rng, minDiff, maxDiff));
          break;
        case 'tone':
          gamePackItems.push(...generateToneItems(kindCount, rng, minDiff, maxDiff));
          break;
      }
    }

    allItems.push(...shuffleSeeded(gamePackItems, rng).slice(0, remainingCount));
  }

  // Final shuffle and limit
  const finalItems = shuffleSeeded(allItems, rng).slice(0, count);

  // Ensure unique IDs
  const seenIds = new Set<string>();
  return finalItems.map((item, idx) => {
    let uniqueId = item.id;
    let counter = 0;
    while (seenIds.has(uniqueId)) {
      uniqueId = `${item.id}-${++counter}`;
    }
    seenIds.add(uniqueId);
    return { ...item, id: uniqueId };
  });
}

/**
 * Get available item counts per kind for debugging/UI.
 */
export function getAvailableItemCounts(subject?: SubjectType): Record<GameKind, number> {
  const curriculumQuestions = getAllQuestions().filter(q => !subject || q.subject === subject);
  const compQuestions = COMPETITION_QUESTIONS.filter(cq => !subject || cq.subject === subject);

  const counts: Record<GameKind, number> = {} as Record<GameKind, number>;

  for (const kind of [
    'word-picture', 'first-sound', 'rhyme', 'tone', 'sentence',
    'arith', 'compare', 'count', 'en-word', 'en-phonics',
    'en-color', 'en-animal', 'shape', 'time'
  ] as GameKind[]) {
    const skillIds = KIND_TO_SKILLS[kind] || [];
    const compSkillIds = KIND_TO_COMP_SKILLS[kind] || [];

    const curriculumCount = curriculumQuestions.filter(q => skillIds.includes(q.skillId)).length;
    const compCount = compQuestions.filter(cq => compSkillIds.includes(cq.skillId)).length;
    const gamePackCount = kind === 'word-picture' || kind === 'first-sound' || kind === 'rhyme' || kind === 'tone'
      ? 50 : 0; // Estimated generatable items

    counts[kind] = curriculumCount + compCount + gamePackCount;
  }

  return counts;
}