import {
  KidBoxActivity,
  KidBoxActivityItem,
  KidBoxActivityKind,
  KidBoxActivityMode,
  KidBoxProgressionStep,
  KidBoxSourceType,
  KidBoxUnit,
  KidBoxVocabulary,
} from '../types/kidBox';
import { KIDBOX_POLICY } from '../config/policy';
import { spokenWords } from './britishSpeech';

/**
 * §4 SOURCE-OF-TRUTH MODEL — the mapping layer.
 *
 * `UNIT + SKILL → ACTIVITY` happens here and nowhere else. No UI is allowed to
 * hardcode "unit X → question Y"; the UI asks this module for the activities of
 * a unit and renders whatever comes back. That is what makes mapped textbook
 * content droppable in later (§39) without touching a single screen.
 *
 * Selection is fully deterministic (no `Math.random`): activities must be
 * reproducible across reloads so evidence ids stay stable and tests stay
 * meaningful.
 */

const MAX_CHOICES = 4;

/** Stable 32-bit string hash, used to seed deterministic rotation. */
function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/**
 * Deterministic "rotation": takes `count` items starting at an offset derived
 * from `seed`, so two activities over the same unit get different (yet stable)
 * items.
 */
function rotate<T>(items: T[], count: number, seed: string): T[] {
  if (items.length === 0) return [];
  const take = Math.min(count, items.length);
  const offset = hashSeed(seed) % items.length;
  const out: T[] = [];
  for (let i = 0; i < take; i += 1) out.push(items[(offset + i) % items.length]);
  return out;
}

/** Deterministic distractor pick: same topic first, then any other item. */
function pickDistractors(pool: KidBoxVocabulary[], target: KidBoxVocabulary, count: number): KidBoxVocabulary[] {
  const sameTopic = pool.filter((v) => v.id !== target.id && v.topic === target.topic);
  const others = pool.filter((v) => v.id !== target.id && v.topic !== target.topic);
  return [...rotate(sameTopic, count, `same-${target.id}`), ...rotate(others, count, `other-${target.id}`)]
    .slice(0, count);
}

function estimateMinutes(estimatedSeconds: number): number {
  return Math.max(1, Math.round((estimatedSeconds / 60) * 10) / 10);
}

function baseActivity(params: {
  unit: KidBoxUnit;
  step: KidBoxProgressionStep;
  kind: KidBoxActivityKind;
  mode: KidBoxActivityMode;
  skillId: KidBoxActivity['skillId'];
  title: string;
  titleVi: string;
  instructionEn: string;
  instructionVi: string;
  items: KidBoxActivityItem[];
  explanation: string;
  estimatedSeconds: number;
  sourceType: KidBoxSourceType;
  difficulty: KidBoxActivity['difficulty'];
  lessonId?: string;
  allowReplay?: boolean;
  allowSlowReplay?: boolean;
  acceptsSpeechRecognition?: boolean;
}): KidBoxActivity {
  const perItem = Math.max(8, Math.round(params.estimatedSeconds / Math.max(1, params.items.length)));
  const estimatedSeconds = Math.min(
    KIDBOX_POLICY.MAX_ESTIMATED_SECONDS,
    Math.max(KIDBOX_POLICY.MIN_ESTIMATED_SECONDS, perItem * Math.max(1, params.items.length))
  );

  return {
    id: `${params.unit.id}-${params.step.toLowerCase()}-${params.kind.toLowerCase().replace(/_/g, '-')}`,
    unitId: params.unit.id,
    lessonId: params.lessonId,
    step: params.step,
    kind: params.kind,
    mode: params.mode,
    skillId: params.skillId,
    title: params.title,
    titleVi: params.titleVi,
    instructionEn: params.instructionEn,
    instructionVi: params.instructionVi,
    items: params.items,
    // §12 — replaying is always free and never counted against the child.
    allowReplay: params.allowReplay ?? true,
    allowSlowReplay: params.allowSlowReplay ?? true,
    acceptsSpeechRecognition: params.acceptsSpeechRecognition ?? false,
    difficulty: params.difficulty,
    sourceType: params.sourceType,
    britishEnglish: 'en-GB',
    explanation: params.explanation,
    estimatedSeconds,
    estimatedMinutes: estimateMinutes(estimatedSeconds),
    // §22 — nothing is locked: any step can be previewed at any time.
    previewable: true,
  };
}

/* ------------------------------------------------------------------ */
/* ITEM BUILDERS                                                        */
/* ------------------------------------------------------------------ */

function vocabToItem(v: KidBoxVocabulary, isCorrect: boolean): KidBoxActivityItem {
  return {
    id: v.id,
    speakText: v.speakText || v.word,
    captionEn: v.word,
    captionVi: v.meaningVi,
    pictureEmoji: v.pictureEmoji,
    word: v.word,
    meaningVi: v.meaningVi,
    isCorrect,
    skillId: v.skillId,
  };
}

/**
 * Builds one choice round: the first entry is the target, the rest are
 * distractors, and every option comes from a *distinct* content item so ids and
 * captions can never collide (§28 duplicate + ambiguity gates).
 */
function choiceRound(entries: KidBoxVocabulary[]): KidBoxActivityItem[] {
  if (entries.length === 0) return [];
  // §28 — never offer the same word twice in one round.
  const seen = new Set<string>();
  const distinct = entries.filter((v) => {
    const key = v.word.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (distinct.length === 0) return [];
  const [target, ...rest] = distinct;
  return [vocabToItem(target, true), ...rest.map((v) => vocabToItem(v, false))].sort(
    (a, b) => hashSeed(`${a.id}-${b.id}`) - hashSeed(`${a.id}-${b.id}`)
  );
}

/* ------------------------------------------------------------------ */
/* STEP BUILDERS (§9 SEE → … → CHECK)                                   */
/* ------------------------------------------------------------------ */

/**
 * §9 STEP 1 — SEE: picture → word.
 *
 * One activity holds exactly one round; `buildRounds()` derives the follow-up
 * rounds from the same unit, so an activity never carries a mixed bag of items.
 */
function buildSeeActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const pool = unit.vocabulary.filter((v) => Boolean(v.pictureEmoji));
  if (pool.length < 2) return null;

  const items = choiceRound(rotate(pool, Math.min(MAX_CHOICES, pool.length), `see-${unit.id}`));

  return baseActivity({
    unit,
    step: 'SEE',
    kind: 'PICTURE_TO_WORD',
    mode: 'SINGLE_CHOICE',
    skillId: 'EN-VOCAB-RECOGNITION',
    title: 'Look and choose',
    titleVi: 'Nhìn hình, chọn từ đúng',
    instructionEn: 'Look at the picture. Choose the word.',
    instructionVi: 'Nhìn hình bên trái rồi chọn từ tiếng Anh đúng nhé.',
    items,
    explanation: 'Nhìn hình rồi chọn từ tương ứng. Đây là bước đầu tiên để bé làm quen với từ mới.',
    estimatedSeconds: unit.vocabulary.length * 12,
    sourceType: unit.sourceType,
    difficulty: 1,
  });
}

/** §12 STEP 2 — HEAR: British English audio → choose the picture. */
function buildHearActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const pool = unit.vocabulary.filter((v) => Boolean(v.pictureEmoji));
  if (pool.length < 2) return null;

  const items = choiceRound(rotate(pool, Math.min(MAX_CHOICES, pool.length), `hear-${unit.id}`));

  return baseActivity({
    unit,
    step: 'HEAR',
    kind: 'LISTEN_AND_CHOOSE',
    mode: 'SINGLE_CHOICE',
    skillId: 'EN-VOCAB-LISTENING',
    title: 'Listen and choose',
    titleVi: 'Nghe tiếng Anh, chọn hình đúng',
    instructionEn: 'Listen. Choose the picture you hear.',
    instructionVi: 'Bấm loa để nghe (nghe lại bao nhiêu lần cũng được), rồi chọn hình đúng.',
    items,
    explanation: 'Nghe giọng British English rồi chọn hình. Bé có thể nghe lại không giới hạn.',
    estimatedSeconds: unit.vocabulary.length * 18,
    sourceType: unit.sourceType,
    difficulty: 2,
  });
}

/** §12 — listen and act: an instruction the child performs physically. */
function buildListenAndActActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const body = unit.vocabulary.find((v) => v.pictureEmoji);
  if (!body) return null;

  const items: KidBoxActivityItem[] = [
    {
      id: `${unit.id}-act-1`,
      speakText: 'Touch your nose.',
      captionEn: 'Touch your nose.',
      captionVi: 'Chạm tay vào mũi.',
      pictureEmoji: '👃',
      word: 'nose',
      isCorrect: true,
      actionCueVi: 'Chạm tay vào mũi rồi báo "Xong!"',
      skillId: 'EN-LISTENING-INSTRUCTION',
    },
    {
      id: `${unit.id}-act-2`,
      speakText: 'Clap your hands.',
      captionEn: 'Clap your hands.',
      captionVi: 'Vỗ tay.',
      pictureEmoji: '👏',
      word: 'hands',
      isCorrect: true,
      actionCueVi: 'Vỗ tay rồi báo "Xong!"',
      skillId: 'EN-LISTENING-INSTRUCTION',
    },
  ];

  return baseActivity({
    unit,
    step: 'HEAR',
    kind: 'LISTEN_AND_ACT',
    mode: 'ACTION',
    skillId: 'EN-LISTENING-INSTRUCTION',
    title: 'Listen and do',
    titleVi: 'Nghe và làm theo',
    instructionEn: 'Listen and do what I say.',
    instructionVi: 'Nghe câu lệnh tiếng Anh rồi làm theo nhé.',
    items,
    explanation: 'Nghe câu lệnh và thực hiện đúng động tác. Đây là kỹ năng nghe mệnh lệnh.',
    estimatedSeconds: 40,
    sourceType: unit.sourceType,
    difficulty: 1,
  });
}

/** §6 STEP 3 — UNDERSTAND: word ↔ meaning. */
function buildUnderstandActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const pool = unit.vocabulary.filter((v) => Boolean(v.pictureEmoji) && Boolean(v.meaningVi));
  if (pool.length < 2) return null;

  const items = meaningMatchRound(pool, `understand-${unit.id}`);

  return baseActivity({
    unit,
    step: 'UNDERSTAND',
    kind: 'MEANING_MATCH',
    mode: 'SINGLE_CHOICE',
    skillId: 'EN-VOCAB-MEANING',
    title: 'What does it mean?',
    titleVi: 'Từ này nghĩa là gì?',
    instructionEn: 'Look at the English word. Choose the meaning.',
    instructionVi: 'Nhìn từ tiếng Anh và chọn nghĩa đúng bằng tiếng Việt.',
    items,
    explanation: 'Ghép từ tiếng Anh với nghĩa tiếng Việt của nó.',
    estimatedSeconds: unit.vocabulary.length * 15,
    sourceType: unit.sourceType,
    difficulty: 1,
  });
}

/** §13 STEP 4 — REPEAT: listen, then say it back. */
function buildRepeatActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const targets = rotate(unit.vocabulary, Math.min(4, unit.vocabulary.length), `repeat-${unit.id}`);
  if (targets.length === 0) return null;

  const items = targets.map((v) => ({ ...vocabToItem(v, true), skillId: 'EN-SPEAKING-REPEAT' as const }));

  return baseActivity({
    unit,
    step: 'REPEAT',
    kind: 'SPEAKING_REPEAT',
    mode: 'SPEAK',
    skillId: 'EN-SPEAKING-REPEAT',
    title: 'Say it with me',
    titleVi: 'Nói lại theo mình',
    instructionEn: 'Listen, then say the word.',
    instructionVi: 'Nghe trước, rồi bé nói lại từ đó. Nói xong bấm "Mình đã nói".',
    items,
    explanation:
      'Nghe và nói lại. Nếu máy không nhận được giọng nói thì bé tự đối chiếu với ba mẹ — ứng dụng không chấm điểm phát âm.',
    estimatedSeconds: targets.length * 20,
    sourceType: unit.sourceType,
    difficulty: 1,
    acceptsSpeechRecognition: true,
  });
}

/** §9 STEP 5 — PRACTICE: recognition drill (word → picture). */
function buildRecognitionActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const pool = unit.vocabulary.filter((v) => Boolean(v.pictureEmoji));
  if (pool.length < 2) return null;

  const items = choiceRound(rotate(pool, Math.min(MAX_CHOICES, pool.length), `recognition-${unit.id}`));

  return baseActivity({
    unit,
    step: 'PRACTICE',
    kind: 'RECOGNITION',
    mode: 'SINGLE_CHOICE',
    skillId: 'EN-VOCAB-RECOGNITION',
    title: 'Word or picture?',
    titleVi: 'Chọn hình theo từ',
    instructionEn: 'Read the word. Choose the picture.',
    instructionVi: 'Đọc từ tiếng Anh rồi chọn hình đúng.',
    items,
    explanation: 'Luyện nhận diện từ đã học. Đây là phần củng cố, không phải phần mới.',
    estimatedSeconds: MAX_CHOICES * 14,
    sourceType: unit.sourceType,
    difficulty: 1,
  });
}

/** §8 STEP 5 — PRACTICE: hear a word from the unit's phonics chart, choose it. */
function buildPhonicsActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const items = phonicsChoiceRound(unit, `phonics-${unit.id}`);
  if (items.length < 2) return null;
  const target = unit.phonics.find((p) => items[0].id === `${p.id}-sound`);
  if (!target) return null;

  return baseActivity({
    unit,
    step: 'PRACTICE',
    kind: 'MISSING_WORD',
    mode: 'SINGLE_CHOICE',
    skillId: target.skillId,
    title: 'Which word do you hear?',
    titleVi: 'Nghe và chọn đúng từ',
    instructionEn: 'Listen to the word. Choose the word you hear.',
    instructionVi: 'Nghe từ tiếng Anh rồi chọn đúng từ đó. Nghe bao nhiêu lần cũng được nhé.',
    items,
    explanation: 'Nghe từ trong bảng âm của unit rồi chọn đúng từ đó. Luyện tai nghe và đọc từ vựng.',
    estimatedSeconds: items.length * 16,
    sourceType: unit.sourceType,
    difficulty: 2,
  });
}

/** §6 STEP 6 — USE: build a sentence from the unit's language pattern. */
function buildPatternActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const pattern = unit.patterns[0];
  if (!pattern) return null;

  const chunks = pattern.slots.length > 0 ? pattern.slots : [pattern.suggestedAnswer];
  const items: KidBoxActivityItem[] = chunks.map((slot, idx) => ({
    id: `${pattern.id}-chunk${idx + 1}`,
    speakText: typeof slot === 'string' ? slot : slot.exampleAnswer,
    captionEn: typeof slot === 'string' ? slot : slot.exampleAnswer,
    captionVi: pattern.meaningVi,
    pictureEmoji: typeof slot === 'object' ? slot.pictureEmoji : pattern.pictureEmoji,
    isCorrect: true,
    chunkOrder: idx + 1,
    skillId: 'EN-LANGUAGE-PATTERN',
  }));

  return baseActivity({
    unit,
    step: 'USE',
    kind: 'PATTERN_BUILD',
    mode: 'BUILD',
    skillId: 'EN-LANGUAGE-PATTERN',
    title: pattern.pattern,
    titleVi: pattern.meaningVi,
    instructionEn: pattern.pattern,
    instructionVi: 'Xếp các mảnh câu lại thành câu đúng, rồi đọc to câu đó nhé.',
    items,
    explanation: 'Dùng mẫu câu của Unit để tự nói câu của bé.',
    estimatedSeconds: 45,
    sourceType: unit.sourceType,
    difficulty: pattern.difficulty,
  });
}

/** §6 STEP 6 — USE: guided speaking with a sentence frame. */
function buildGuidedSpeakingActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const pattern = unit.patterns[0];
  if (!pattern) return null;

  const items: KidBoxActivityItem[] = [
    {
      id: `${pattern.id}-speak`,
      speakText: pattern.suggestedAnswer,
      captionEn: pattern.suggestedAnswer,
      captionVi: pattern.meaningVi,
      pictureEmoji: pattern.pictureEmoji,
      isCorrect: true,
      skillId: 'EN-SPEAKING-PATTERN',
    },
  ];

  return baseActivity({
    unit,
    step: 'USE',
    kind: 'SPEAKING_QUESTION_ANSWER',
    mode: 'SPEAK',
    skillId: 'EN-SPEAKING-PATTERN',
    title: pattern.question,
    titleVi: `${pattern.question} — ${pattern.meaningVi}`,
    instructionEn: pattern.question,
    instructionVi: 'Nghe câu hỏi, rồi bé trả lời bằng câu mẫu.',
    items,
    explanation:
      'Bé trả lời bằng mẫu câu. Nếu không có nhận giọng nói, bé tự đối chiếu cùng ba mẹ.',
    estimatedSeconds: 40,
    sourceType: unit.sourceType,
    difficulty: pattern.difficulty,
    acceptsSpeechRecognition: true,
  });
}

/**
 * §9 STEP 7 — REVIEW: the same words, deliberately labelled as review.
 *
 * *When* a review is due is decided by the review engine (§25) and the daily
 * plan (§19); this activity is only the runner. Keeping it explicit means the
 * ladder never shows an empty step while the child still has words to revisit.
 */
function buildReviewActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const pool = unit.vocabulary.filter((v) => Boolean(v.pictureEmoji));
  if (pool.length < 2) return null;

  const items = choiceRound(rotate(pool, Math.min(MAX_CHOICES, pool.length), `review-${unit.id}`));

  return baseActivity({
    unit,
    step: 'REVIEW',
    kind: 'SPACED_REVIEW',
    mode: 'SINGLE_CHOICE',
    skillId: 'EN-VOCAB-RECALL',
    title: 'Let\u2019s review',
    titleVi: 'Ôn lại từ đã học',
    instructionEn: 'Let\u2019s review the words you learned.',
    instructionVi: 'Ôn lại mấy từ đã học để bé nhớ lâu hơn nhé.',
    items,
    explanation:
      'Ôn tập theo đường cong quên. Bé sai một lần vẫn giữ được tiến bộ, chỉ lần ôn tới gần hơn thôi.',
    estimatedSeconds: MAX_CHOICES * 14,
    sourceType: unit.sourceType,
    difficulty: 1,
  });
}

/** §16 STEP 8 — GAME: evidence-emitting mini game over the unit's words. */
function buildGameActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const pool = unit.vocabulary.filter((v) => Boolean(v.pictureEmoji));
  if (pool.length < 2) return null;

  const targets = rotate(pool, Math.min(KIDBOX_POLICY.MAX_ITEMS_PER_ACTIVITY, pool.length), `game-${unit.id}`);
  // P0-3 fix — the child hears ONE word and must tap its picture, so exactly
  // one item is correct. (The old code marked every item correct, which made
  // the TAPS grader require catching the whole grid — the game could never be
  // won, and a correct tap was recorded as a learning-OS error.)
  const targetId = targets[0].id;
  const targetItem: KidBoxActivityItem = {
    ...vocabToItem(targets[0], true),
    skillId: 'EN-VOCAB-RECOGNITION' as const,
  };
  const decoys = targets
    .slice(1)
    .map((v) => ({ ...vocabToItem(v, false), skillId: 'EN-VOCAB-RECOGNITION' as const }));
  // Deterministic but varied grid slot — the answer never sits in one fixed
  // position the child could memorise.
  const targetSlot = hashSeed(`${unit.id}-safari-target`) % targets.length;
  const items = [...decoys.slice(0, targetSlot), targetItem, ...decoys.slice(targetSlot)];

  return baseActivity({
    unit,
    step: 'GAME',
    kind: 'MINI_GAME',
    mode: 'MULTI_SELECT',
    skillId: 'EN-VOCAB-RECOGNITION',
    title: 'Word Safari',
    titleVi: 'Săn từ vựng',
    instructionEn: 'Listen and catch the words you hear.',
    instructionVi: 'Nghe từ rồi bấm vào hình đúng. Điểm trò chơi không thay thế việc luyện tập.',
    items,
    explanation: 'Trò chơi tìm từ nghe được. Mỗi lượt bấm đúng vẫn được ghi nhận là bằng chứng học tập.',
    estimatedSeconds: targets.length * 12,
    sourceType: unit.sourceType,
    difficulty: 1,
  });
}

/** §9 STEP 9 — CHECK: short mixed assessment. */
function buildCheckActivity(unit: KidBoxUnit): KidBoxActivity | null {
  const pool = unit.vocabulary.filter((v) => Boolean(v.pictureEmoji));
  if (pool.length < 2) return null;

  const items = choiceRound(rotate(pool, Math.min(MAX_CHOICES, pool.length), `check-${unit.id}`));

  return baseActivity({
    unit,
    step: 'CHECK',
    kind: 'MINI_CHECK',
    mode: 'CHECK',
    skillId: 'EN-VOCAB-RECOGNITION',
    title: 'Mini check',
    titleVi: 'Kiểm tra nhanh',
    instructionEn: 'Quick check. Choose the right picture.',
    instructionVi: 'Kiểm tra nhanh thôi — sai cũng sao, mình luyện lại nhé.',
    items,
    explanation: 'Kiểm tra ngắn cuối bài. Điểm này KHÔNG phải điểm trò chơi và không quyết định kỹ năng.',
    estimatedSeconds: MAX_CHOICES * 15,
    sourceType: unit.sourceType,
    difficulty: 2,
  });
}

/* ------------------------------------------------------------------ */
/* ROUNDS (§12 — one activity is one round; the player chains them)    */
/* ------------------------------------------------------------------ */

/** How many follow-up rounds a choice-style activity may chain. */
const MAX_ROUNDS = 4;

/** A choice round whose options are plain vocabulary items (word + picture). */
function vocabChoiceRound(pool: KidBoxVocabulary[], seed: string): KidBoxActivityItem[] {
  if (pool.length < 2) return [];
  return choiceRound(rotate(pool, Math.min(MAX_CHOICES, pool.length), seed));
}

/**
 * A choice round for "What does it mean?".
 *
 * The stimulus is the ENGLISH WORD (`target.word`), and every option — the
 * target's own meaning included — renders `captionEn`, the Vietnamese MEANING.
 * The target therefore stays the single correct item while the options are the
 * meanings, so the child really has to know the word, and grading by item id
 * still resolves to the meaning the child actually clicked.
 */
function meaningMatchRound(pool: KidBoxVocabulary[], seed: string): KidBoxActivityItem[] {
  const usable = pool.filter((v) => Boolean(v.meaningVi));
  if (usable.length < 2) return [];
  const entries = rotate(usable, Math.min(MAX_CHOICES, usable.length), seed);
  const [target, ...rest] = entries;
  if (!target) return [];
  const asMeaning = (v: KidBoxVocabulary, isCorrect: boolean): KidBoxActivityItem => ({
    ...vocabToItem(v, isCorrect),
    captionEn: v.meaningVi,
    captionVi: v.word,
  });
  return [asMeaning(target, true), ...rest.map((v) => asMeaning(v, false))].sort(
    (a, b) => hashSeed(`${a.id}-${b.id}`) - hashSeed(`${a.id}-${b.id}`)
  );
}

/**
 * A choice round whose options are WORDS (no pictures) and whose stimulus is an
 * initial sound. Used by the phonics "Which word do you hear?" drill, where the
 * distractors must be other phonics examples, never random vocabulary.
 *
 * Returns an empty round when the unit has fewer than two usable phonics rows,
 * so a unit without a phonics chart simply has no phonics drill (§9).
 */
function phonicsChoiceRound(unit: KidBoxUnit, seed: string): KidBoxActivityItem[] {
  // §28 — options must be distinct. A unit's phonics chart can teach the same
  // example word under several rows (letter C, the cat/bat pair, the c-a-t
  // blend), and two identical options would make "which word do you hear?"
  // ambiguous — one of them would be marked correct and the other not.
  const seenWords = new Set<string>();
  const usable = unit.phonics.filter((p) => {
    const key = p.exampleWord.trim().toLowerCase();
    if (!key || seenWords.has(key)) return false;
    seenWords.add(key);
    return true;
  });
  if (usable.length < 2) return [];
  const entries = rotate(usable, Math.min(MAX_CHOICES, usable.length), seed);
  const [target, ...rest] = entries;
  if (!target) return [];
  return [
    {
      id: `${target.id}-sound`,
      speakText: target.exampleWord,
      captionEn: target.exampleWord,
      pictureEmoji: target.exampleEmoji,
      word: target.exampleWord,
      isCorrect: true,
      skillId: target.skillId,
    },
    ...rest.map((other) => ({
      id: `${other.id}-option`,
      speakText: other.exampleWord,
      captionEn: other.exampleWord,
      pictureEmoji: other.exampleEmoji,
      word: other.exampleWord,
      isCorrect: false,
      skillId: target.skillId,
    })),
  ];
}

/** How many rounds an activity kind can chain without repeating content. */
function roundsCountFor(activity: KidBoxActivity, pool: KidBoxVocabulary[]): number {
  if (activity.kind === 'MEANING_MATCH') {
    const meaningPool = pool.filter((v) => Boolean(v.meaningVi));
    return Math.min(MAX_ROUNDS, Math.ceil(meaningPool.length / MAX_CHOICES));
  }
  if (activity.kind === 'MISSING_WORD') {
    const phonicsCount = activity.items.length + MAX_CHOICES - 1;
    return Math.min(MAX_ROUNDS, Math.max(1, Math.ceil(phonicsCount / MAX_CHOICES)));
  }
  return Math.min(MAX_ROUNDS, Math.ceil(pool.length / MAX_CHOICES));
}

/**
 * Produces every round for an activity. Round 0 is ALWAYS the authored
 * `activity.items` so evidence ids stay stable; follow-up rounds are rebuilt
 * from the same unit with the SAME semantics as the authored ones.
 *
 * §28 invariant: the stimulus (picture / spoken sound / English word) and the
 * four options of a round must belong to the same task. A round is therefore
 * never allowed to substitute one task's options for another's — swapping a
 * phonics stimulus for a vocabulary grid is what made the audio and the answer
 * pictures unrelated.
 */
export function buildRounds(activity: KidBoxActivity, unit: KidBoxUnit): KidBoxActivityItem[][] {
  if (activity.mode !== 'SINGLE_CHOICE' && activity.mode !== 'CHECK') return [activity.items];

  const pool = unit.vocabulary.filter((v) => Boolean(v.pictureEmoji));
  if (pool.length < 2) return [activity.items];

  const rounds: KidBoxActivityItem[][] = [activity.items];
  const roundsCount = roundsCountFor(activity, pool);
  for (let i = 0; i < roundsCount; i += 1) {
    const seed = `${activity.id}-round${i + 1}`;
    const round =
      activity.kind === 'MEANING_MATCH'
        ? meaningMatchRound(pool, seed)
        : activity.kind === 'MISSING_WORD'
          ? phonicsChoiceRound(unit, seed)
          : vocabChoiceRound(pool, seed);
    if (round.length > 1) rounds.push(round);
  }
  return rounds;
}

/* ------------------------------------------------------------------ */
/* STIMULUS POLICY (§28 — what the child sees, hears and chooses)       */
/* ------------------------------------------------------------------ */

/**
 * How one choice round is presented. Keeping this in the mapping layer means
 * the UI never has to guess which channel carries the task:
 *
 * - `stimulus` — what is shown/said BEFORE the child chooses.
 * - `option`   — what each of the four answers renders as.
 * - `speaks`   — whether the round announces itself with British English.
 *
 * The answer must never be printed on the options: rendering word + picture on
 * every option made "listen and choose the picture" solvable by reading.
 */
export interface KidBoxChoicePresentation {
  stimulus: 'none' | 'picture' | 'word' | 'meaning';
  option: 'picture' | 'word' | 'meaning';
  speaks: boolean;
}

const CHOICE_PRESENTATION: Partial<Record<KidBoxActivityKind, KidBoxChoicePresentation>> = {
  PICTURE_TO_WORD: { stimulus: 'picture', option: 'word', speaks: false },
  LISTEN_AND_CHOOSE: { stimulus: 'none', option: 'picture', speaks: true },
  MEANING_MATCH: { stimulus: 'word', option: 'meaning', speaks: false },
  MISSING_WORD: { stimulus: 'none', option: 'word', speaks: true },
  RECOGNITION: { stimulus: 'word', option: 'picture', speaks: false },
  SPACED_REVIEW: { stimulus: 'word', option: 'picture', speaks: false },
  MINI_CHECK: { stimulus: 'word', option: 'picture', speaks: false },
};

/** Presentation for an activity; unknown kinds fall back to word → picture. */
export function getChoicePresentation(activity: KidBoxActivity): KidBoxChoicePresentation {
  return CHOICE_PRESENTATION[activity.kind] ?? { stimulus: 'word', option: 'picture', speaks: false };
}

/** True when the round's stimulus is carried by audio rather than on screen. */
export function isAudioStimulus(activity: KidBoxActivity): boolean {
  return getChoicePresentation(activity).speaks;
}

/* ------------------------------------------------------------------ */
/* PUBLIC API                                                           */
/* ------------------------------------------------------------------ */

/**
 * Builds the full §9 progression for a unit: every step the unit's own content
 * can support. Steps whose source content is missing are simply absent — the
 * hub then reports them as `CONTENT_SOURCE_REQUIRED` instead of inventing
 * exercises.
 */
export function buildUnitActivities(unit: KidBoxUnit): KidBoxActivity[] {
  const builders: (() => KidBoxActivity | null)[] = [
    () => buildSeeActivity(unit),
    () => buildHearActivity(unit),
    () => buildListenAndActActivity(unit),
    () => buildUnderstandActivity(unit),
    () => buildRepeatActivity(unit),
    () => buildRecognitionActivity(unit),
    () => buildPhonicsActivity(unit),
    () => buildPatternActivity(unit),
    () => buildGuidedSpeakingActivity(unit),
    () => buildReviewActivity(unit),
    () => buildGameActivity(unit),
    () => buildCheckActivity(unit),
  ];

  const activities = builders
    .map((build) => build())
    .filter((a): a is KidBoxActivity => a !== null)
    .filter((a) => a.items.length >= KIDBOX_POLICY.MIN_ITEMS_PER_ACTIVITY);

  return sortByProgression(activities);
}

/** Same order as §9 so the hub ladder always matches the data. */
export function sortByProgression(activities: KidBoxActivity[]): KidBoxActivity[] {
  const order: KidBoxProgressionStep[] = [
    'SEE',
    'HEAR',
    'UNDERSTAND',
    'REPEAT',
    'PRACTICE',
    'USE',
    'REVIEW',
    'GAME',
    'CHECK',
  ];
  return [...activities].sort(
    (a, b) => order.indexOf(a.step) - order.indexOf(b.step) || a.id.localeCompare(b.id)
  );
}

/** Activities the child may open right now (§22: nothing is ever blocked). */
export function getActivity(activityId: string, unit: KidBoxUnit): KidBoxActivity | undefined {
  return buildUnitActivities(unit).find((a) => a.id === activityId);
}

/* ------------------------------------------------------------------ */
/* ANSWER EVALUATION (§30 vocabulary answer validation)                 */
/* ------------------------------------------------------------------ */

/** What the child did, per activity mode. */
export type KidBoxResponse =
  /** SINGLE_CHOICE / CHECK: the item the child tapped. */
  | { type: 'CHOICE'; itemId: string }
  /** MATCHING / MEMORY: left item → right item. */
  | { type: 'PAIRS'; pairs: { leftId: string; rightId: string }[] }
  /** ORDERING / BUILD: the chosen items in the order the child placed them. */
  | { type: 'ORDER'; itemIds: string[] }
  /** ACTION: the child confirmed they performed the instruction. */
  | { type: 'ACTION_DONE'; itemId: string }
  /** SPEAK: what the platform recognised, when recognition was available. */
  | { type: 'SPEAK'; itemId?: string; transcript?: string; recognitionSupported: boolean; selfConfirmed?: boolean }
  /** MULTI_SELECT (game): every item the child tapped. */
  | { type: 'TAPS'; itemIds: string[] };

export interface KidBoxEvaluation {
  isCorrect: boolean;
  /** Item ids that were right, for per-item feedback. */
  correctItemIds: string[];
  wrongItemIds: string[];
  /** Short, encouraging Vietnamese message. */
  feedback: string;
  /** The activity's own explanation, shown after a wrong answer (§28). */
  explanation: string;
}

function compareKeys(a: string, b: string): number {
  return a.localeCompare(b, 'en');
}

export function evaluateActivityResponse(
  activity: KidBoxActivity,
  response: KidBoxResponse
): KidBoxEvaluation {
  const explain = (isCorrect: boolean): KidBoxEvaluation => ({
    isCorrect,
    correctItemIds: isCorrect ? activity.items.filter((i) => i.isCorrect).map((i) => i.id) : [],
    wrongItemIds: isCorrect ? [] : activity.items.filter((i) => i.isCorrect).map((i) => i.id),
    feedback: isCorrect
      ? 'Tuyệt vời! Bé làm đúng rồi.'
      : 'Chưa đúng, nhưng không sao — mình nghe lại rồi thử một lần nữa nhé.',
    explanation: activity.explanation,
  });

  switch (response.type) {
    case 'CHOICE': {
      const chosen = activity.items.find((i) => i.id === response.itemId);
      if (!chosen) return explain(false);
      return explain(chosen.isCorrect);
    }

    case 'PAIRS': {
      if (response.pairs.length === 0) return explain(false);
      // §11 — a pair counts as right only when both halves exist, both carry
      // the same pairKey, and the pair belongs to the target set.
      const byId = new Map(activity.items.map((i) => [i.id, i]));
      const allRight = response.pairs.every((pair) => {
        const left = byId.get(pair.leftId);
        const right = byId.get(pair.rightId);
        if (!left || !right || !left.pairKey || !right.pairKey) return false;
        if (left.pairKey !== right.pairKey) return false;
        return left.isCorrect && right.isCorrect;
      });
      return explain(allRight);
    }

    case 'ORDER': {
      const ordered = [...response.itemIds].sort(
        (a, b) => (activity.items.find((i) => i.id === a)?.chunkOrder ?? 0) - (activity.items.find((i) => i.id === b)?.chunkOrder ?? 0)
      );
      const expected = [...activity.items]
        .sort((a, b) => (a.chunkOrder ?? a.orderHint ?? 0) - (b.chunkOrder ?? b.orderHint ?? 0))
        .map((i) => i.id);
      const sameLength = ordered.length === expected.length;
      const sameOrder = sameLength && expected.every((id, idx) => ordered[idx] === id);
      return explain(sameOrder);
    }

    case 'ACTION_DONE': {
      const acted = activity.items.find((i) => i.id === response.itemId);
      return explain(Boolean(acted?.isCorrect));
    }

    case 'SPEAK': {
      // §14 — without a recognition engine there is no honest signal, so the
      // answer is never counted as correct or incorrect.
      if (!response.recognitionSupported) return explain(true);
      return explain(matchesActivityTarget(activity, response.transcript ?? '', response.itemId));
    }

    case 'TAPS': {
      const targets = activity.items.filter((i) => i.isCorrect).map((i) => i.id).sort(compareKeys);
      const tapped = [...new Set(response.itemIds)].sort(compareKeys);
      const exact =
        targets.length === tapped.length && targets.every((id, idx) => tapped[idx] === id);
      return explain(exact);
    }

    default:
      return explain(false);
  }
}

/**
 * §14 speech recognition match. Order-insensitive word containment, tolerant of
 * punctuation and accents, never a pronunciation score.
 *
 * A speaking activity has several items to repeat, so `itemId` scopes the check
 * to the word the child was actually asked to say. Without it, every target of
 * the activity must be present in the transcript.
 */
export function matchesActivityTarget(
  activity: KidBoxActivity,
  transcript: string,
  itemId?: string
): boolean {
  const said = spokenWords(transcript);
  if (said.length === 0) return false;

  const scoped = itemId ? activity.items.filter((i) => i.id === itemId) : activity.items.filter((i) => i.isCorrect);
  const targets = scoped.map((i) => spokenWords(i.speakText));
  if (targets.length === 0) return false;

  // Every word of the target must be spoken, in any order.
  return targets.every((wanted) => {
    const pool = [...said];
    for (const word of wanted) {
      const idx = pool.indexOf(word);
      if (idx < 0) return false;
      pool.splice(idx, 1);
    }
    return true;
  });
}

/**
 * Validates one activity's own item list (§28): ids unique, exactly the right
 * number of targets, British English metadata, audio text always present.
 */
export function validateActivityItems(activity: KidBoxActivity): string[] {
  const problems: string[] = [];
  const ids = activity.items.map((i) => i.id);

  if (new Set(ids).size !== ids.length) problems.push('DUPLICATE_ITEM_ID');
  if (activity.items.length < KIDBOX_POLICY.MIN_ITEMS_PER_ACTIVITY) problems.push('TOO_FEW_ITEMS');
  if (activity.items.length > KIDBOX_POLICY.MAX_ITEMS_PER_ACTIVITY * 2) problems.push('TOO_MANY_ITEMS');
  if (activity.britishEnglish !== 'en-GB') problems.push('NOT_BRITISH_ENGLISH');
  if (!activity.instructionEn.trim()) problems.push('MISSING_SPOKEN_INSTRUCTION');
  if (!activity.instructionVi.trim()) problems.push('MISSING_TEXT_INSTRUCTION');
  if (!activity.explanation.trim()) problems.push('MISSING_EXPLANATION');
  if (!activity.items.some((i) => i.isCorrect)) problems.push('NO_CORRECT_ITEM');
  for (const item of activity.items) {
    if (!item.speakText.trim()) problems.push(`MISSING_SPEAK_TEXT:${item.id}`);
    // §32 — audio must never be the only channel.
    if (!item.captionEn.trim()) problems.push(`MISSING_CAPTION:${item.id}`);
  }

  const words = activity.items.filter((i) => i.isCorrect).map((i) => (i.captionEn || '').toLowerCase());
  if (new Set(words).size !== words.length) problems.push('DUPLICATE_TARGET_TEXT');

  return Array.from(new Set(problems));
}
