import { CompetitionQuestion, ExamBlueprint } from '../types/competition';
import { COMPETITION_QUESTIONS, COMPETITION_BANK_VERSION } from '../data/competitionQuestions';
import { COMPETITION_SKILLS } from '../data/competitionTaxonomy';
import { EXAM_BLUEPRINTS } from '../data/competitionBlueprints';
import { READING_QUESTIONS, READING_PASSAGES, READING_SKILLS } from '../data/readingContent';
import { CONTENT_POLICY, CURRICULUM_POLICY } from '../config/policy';
import { getAllQuestions as getCurriculumQuestions } from '../data/curriculum';
import type { Question } from '../types';
import { runKidBoxContentValidation } from './kidBoxValidator';

export type ValidationSeverity = 'ERROR' | 'WARNING';

export interface ValidationIssue {
  severity: ValidationSeverity;
  /** Where the problem lives, e.g. "competition:cq-math-01". */
  scope: string;
  code: string;
  message: string;
}

export interface ValidationReport {
  generatedAtVersion: number;
  totals: {
    competitionQuestions: number;
    readingQuestions: number;
    readingPassages: number;
    curriculumQuestions: number;
    /** Kid's Box Companion track (§28) — same gate, one report. */
    kidBoxUnits: number;
    kidBoxActivities: number;
    errors: number;
    warnings: number;
  };
  issues: ValidationIssue[];
  coverage: CoverageReport;
}

export interface CoverageCell {
  topic: string;
  skills: Record<string, { total: number; byDifficulty: Record<string, number>; byType: Record<string, number> }>;
}

export interface CoverageReport {
  /** Skills declared in the taxonomy that have zero questions. */
  skillsWithoutQuestions: string[];
  /** Skills with fewer than the configured minimum. */
  underSuppliedSkills: string[];
  /** Question types present in the bank. */
  questionTypesPresent: string[];
  /** Question types declared by the app but missing from the bank. */
  questionTypesMissing: string[];
  /** Skills holding more than the configured share of the bank. */
  overConcentratedSkills: string[];
  /** Highest share (0-1) held by any single skill. */
  maxSkillShare: number;
  matrix: CoverageCell[];
}

const ALL_QUESTION_TYPES = [
  'multiple-choice',
  'true-false',
  'fill-blank',
  'matching',
  'ordering',
  'drag-drop',
  'classify',
];

/**
 * Normalises a prompt for duplicate detection.
 *
 * T02C — KEEPS Vietnamese diacritics (NFC): "má" ≠ "mà", "ăn" ≠ "ân".
 * Only case and punctuation/spacing are folded, so a true rewording with
 * different punctuation still matches while tone-different words never do.
 */
export function normalizeForDuplicateCheck(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Token set of a prompt, computed ONCE per question (T02C perf). */
export function tokenizeForDuplicateCheck(text: string): Set<string> {
  return new Set(normalizeForDuplicateCheck(text).split(' ').filter(Boolean));
}

/** Jaccard similarity over precomputed token sets, in the 0-1 range. */
export function jaccardSimilaritySets(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  let intersection = 0;
  for (const t of small) if (big.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Jaccard similarity over word tokens, in the 0-1 range. */
export function semanticSimilarity(a: string, b: string): number {
  return jaccardSimilaritySets(tokenizeForDuplicateCheck(a), tokenizeForDuplicateCheck(b));
}

export interface DuplicateScanItem {
  id: string;
  prompt: string;
  /**
   * Comparisons run ONLY inside the same group (T02C perf + precision).
   * Convention: `${subject}::${skillId}`.
   */
  group: string;
}

export interface DuplicatePair {
  /** Earlier item in input order (the "previous" question). */
  aId: string;
  /** Later item in input order (the question being flagged). */
  bId: string;
  group: string;
  similarity: number;
  severity: 'ERROR' | 'WARNING';
}

/**
 * T02C — fast near-duplicate scan for thousands of questions.
 *
 * Each prompt is tokenized ONCE; comparisons run only inside the same
 * subject+skill group; inside a group an inverted token index restricts
 * pairs to questions sharing at least one token, with a length-ratio upper
 * bound (`min/max < warningThreshold` can never reach the threshold) pruning
 * the rest. Thresholds are unchanged: ERROR at
 * `CONTENT_POLICY.DUPLICATE_PROMPT_SIMILARITY`, WARNING at 0.75.
 *
 * Deterministic: input order in, pairs out in (aIndex, bIndex) order.
 */
export function findNearDuplicates(
  items: DuplicateScanItem[],
  opts?: { errorThreshold?: number; warningThreshold?: number }
): DuplicatePair[] {
  const errorAt = opts?.errorThreshold ?? CONTENT_POLICY.DUPLICATE_PROMPT_SIMILARITY;
  const warnAt = opts?.warningThreshold ?? 0.75;

  const tokens = items.map((item) => tokenizeForDuplicateCheck(item.prompt));

  const byGroup = new Map<string, number[]>();
  items.forEach((item, index) => {
    const list = byGroup.get(item.group);
    if (list) list.push(index);
    else byGroup.set(item.group, [index]);
  });

  const pairs: DuplicatePair[] = [];
  for (const indices of byGroup.values()) {
    if (indices.length < 2) continue;

    // Inverted index: token -> member positions (positions into `indices`).
    const postings = new Map<string, number[]>();
    indices.forEach((itemIndex, pos) => {
      for (const token of tokens[itemIndex]) {
        const list = postings.get(token);
        if (list) list.push(pos);
        else postings.set(token, [pos]);
      }
    });

    const seen = new Set<string>();
    indices.forEach((itemIndex, pos) => {
      const setA = tokens[itemIndex];
      if (setA.size === 0) return;
      // Candidate partners: members sharing ≥ 1 token with this question.
      const candidates = new Set<number>();
      for (const token of setA) {
        for (const otherPos of postings.get(token) ?? []) {
          if (otherPos > pos) candidates.add(otherPos);
        }
      }
      for (const otherPos of candidates) {
        const key = pos * indices.length + otherPos;
        if (seen.has(`${key}`)) continue;
        seen.add(`${key}`);
        const otherIndex = indices[otherPos];
        const setB = tokens[otherIndex];
        // Length-ratio upper bound for Jaccard: intersection ≤ min,
        // union ≥ max, so sim ≤ min/max. Skip when even that can't warn.
        const minSize = Math.min(setA.size, setB.size);
        const maxSize = Math.max(setA.size, setB.size);
        if (maxSize === 0 || minSize / maxSize < warnAt) continue;
        const sim = jaccardSimilaritySets(setA, setB);
        if (sim >= errorAt) {
          pairs.push({
            aId: items[itemIndex].id,
            bId: items[otherIndex].id,
            group: items[itemIndex].group,
            similarity: sim,
            severity: 'ERROR',
          });
        } else if (sim >= warnAt) {
          pairs.push({
            aId: items[itemIndex].id,
            bId: items[otherIndex].id,
            group: items[itemIndex].group,
            similarity: sim,
            severity: 'WARNING',
          });
        }
      }
    });
  }

  return pairs;
}

/**
 * Validates a single competition question against the full contract (§10, §15).
 * Type-aware: choice types require the answer inside the options, structured
 * types require their structural payload instead.
 */
export function validateCompetitionQuestion(q: CompetitionQuestion): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scope = `competition:${q.id}`;
  const push = (code: string, message: string, severity: ValidationSeverity = 'ERROR') =>
    issues.push({ severity, scope, code, message });

  if (!q.id || q.id.trim().length === 0) push('MISSING_ID', 'Câu hỏi thiếu id.');
  if (!q.topic || q.topic.trim().length === 0) push('MISSING_TOPIC', 'Câu hỏi thiếu topic.');
  if (!q.prompt || q.prompt.trim().length === 0) push('EMPTY_PROMPT', 'Câu hỏi thiếu nội dung.');
  if (!q.explanation || q.explanation.trim().length === 0)
    push('EMPTY_EXPLANATION', 'Câu hỏi thiếu giải thích.');
  if (!q.skillId) push('MISSING_SKILL', 'Câu hỏi thiếu skillId.');
  if (!COMPETITION_SKILLS.some((s) => s.skillId === q.skillId))
    push('UNKNOWN_SKILL', `skillId "${q.skillId}" không có trong taxonomy.`);
  if (!['EASY', 'MEDIUM', 'HARD', 'CHALLENGE'].includes(q.difficulty))
    push('BAD_DIFFICULTY', `difficulty "${q.difficulty}" không hợp lệ.`);
  if (!ALL_QUESTION_TYPES.includes(q.questionType))
    push('BAD_QUESTION_TYPE', `questionType "${q.questionType}" không hợp lệ.`);
  if (
    q.estimatedSeconds < CONTENT_POLICY.MIN_ESTIMATED_SECONDS ||
    q.estimatedSeconds > CONTENT_POLICY.MAX_ESTIMATED_SECONDS
  ) {
    push(
      'UNREALISTIC_ESTIMATE',
      `estimatedSeconds=${q.estimatedSeconds} nằm ngoài khoảng hợp lý ${CONTENT_POLICY.MIN_ESTIMATED_SECONDS}-${CONTENT_POLICY.MAX_ESTIMATED_SECONDS}s.`
    );
  }
  if (q.questionType !== 'true-false' && q.options.length < CONTENT_POLICY.MIN_OPTIONS)
    push('TOO_FEW_OPTIONS', `Cần tối thiểu ${CONTENT_POLICY.MIN_OPTIONS} phương án.`);
  if (q.options.length > CONTENT_POLICY.MAX_OPTIONS)
    push('TOO_MANY_OPTIONS', `Tối đa ${CONTENT_POLICY.MAX_OPTIONS} phương án cho lớp 1.`);
  if (new Set(q.options).size !== q.options.length)
    push('DUPLICATE_OPTIONS', 'Có phương án bị trùng nhau.');

  const accepted = [q.correctAnswer, ...(q.acceptedAnswers ?? [])];

  switch (q.questionType) {
    case 'multiple-choice':
    case 'true-false':
    case 'fill-blank': {
      if (!q.options.includes(q.correctAnswer))
        push('ANSWER_NOT_IN_OPTIONS', 'Đáp án đúng phải nằm trong danh sách phương án.');
      if (q.options.length !== 2 && q.options.length !== 4)
        push('OPTION_COUNT', 'Trắc nghiệm lớp 1 nên có 2 hoặc 4 phương án.', 'WARNING');
      break;
    }
    case 'matching': {
      if (!q.matchingPairs || q.matchingPairs.length < 2)
        push('MISSING_PAIRS', 'Câu nối hình cần ít nhất 2 cặp.');
      else {
        const lefts = q.matchingPairs.map((p) => p.left);
        if (new Set(lefts).size !== lefts.length)
          push('DUPLICATE_PAIR_LEFT', 'Có mục bên trái bị trùng nhau.');
        const expected = lefts.map((l) => `${l}=${q.matchingPairs!.find((p) => p.left === l)!.right}`).join('|');
        if (CompetitionEngineNormalize(q.correctAnswer) !== CompetitionEngineNormalize(expected))
          push('PAIR_ANSWER_MISMATCH', 'correctAnswer không khớp với matchingPairs.');
        for (const pair of q.matchingPairs) {
          if (!q.options.includes(pair.right))
            push('PAIR_OPTION_MISSING', `Phương án "${pair.right}" không có trong options.`);
        }
      }
      break;
    }
    case 'ordering': {
      const items = q.orderingItems ?? [];
      if (items.length < 2) push('MISSING_ORDER_ITEMS', 'Câu sắp xếp cần ít nhất 2 phần tử.');
      if (items.length !== q.options.length)
        push('ORDER_OPTIONS_MISMATCH', 'orderingItems và options phải cùng độ dài.');
      for (const item of items) {
        if (!q.options.includes(item)) push('ORDER_OPTION_MISSING', `Ô "${item}" không có trong options.`);
      }
      const canonical = q.correctAnswer.split('|').filter(Boolean);
      if (canonical.length !== items.length)
        push('ORDER_ANSWER_LENGTH', 'correctAnswer phải chứa đúng số phần tử của orderingItems.');
      if (new Set(canonical).size !== canonical.length)
        push('ORDER_ANSWER_DUPLICATE', 'correctAnswer của câu sắp xếp có phần tử lặp.');
      break;
    }
    case 'drag-drop':
    case 'classify': {
      if (!q.categoryBuckets || q.categoryBuckets.length < 2)
        push('MISSING_BUCKETS', 'Câu phân loại cần ít nhất 2 nhóm.');
      // Canonical answer for these formats is the BUCKET LABEL, not an option.
      if (!q.categoryBuckets?.includes(q.correctAnswer))
        push('ANSWER_NOT_IN_BUCKET', 'Đáp án đúng phải là một trong các nhóm đã khai báo.');
      break;
    }
    default:
      break;
  }

  if (accepted.some((a) => typeof a !== 'string' || a.trim().length === 0))
    push('EMPTY_ANSWER', 'Đáp án đúng không được rỗng.');

  return issues;
}

/** Local normaliser to avoid a circular import with the competition engine. */
function CompetitionEngineNormalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi');
}

function validateBlueprint(bp: ExamBlueprint): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scope = `blueprint:${bp.id}`;
  const push = (code: string, message: string, severity: ValidationSeverity = 'ERROR') =>
    issues.push({ severity, scope, code, message });

  if (!bp.title?.trim()) push('MISSING_TITLE', 'Blueprint thiếu tiêu đề.');
  if (bp.durationSeconds < 120)
    push('SHORT_DURATION', 'Thời lượng bài thi tối thiểu 120 giây cho lớp 1.');
  if (bp.questionCount < 4) push('TOO_FEW_QUESTIONS', 'Bài thi cần ít nhất 4 câu.');
  if (bp.rewardStars <= 0 || bp.rewardXp <= 0) push('BAD_REWARD', 'Phần thưởng phải lớn hơn 0.');
  if (!bp.sourceNote?.trim())
    push('MISSING_SOURCE_NOTE', 'Mỗi bộ đề phải ghi rõ nguồn/ghi chú nguồn gốc.');
  if (!bp.version || bp.version < 1) push('MISSING_VERSION', 'Blueprint phải có version.');
  if ((bp.maxScore ?? 10) <= 0) push('BAD_MAX_SCORE', 'maxScore phải lớn hơn 0.');

  if (bp.questionTypeDistribution) {
    const totalShare = Object.values(bp.questionTypeDistribution).reduce((a, b) => a + b, 0);
    if (Math.abs(totalShare - 1) > 0.001)
      push(
        'DISTRIBUTION_SUM',
        `questionTypeDistribution cộng lại ${totalShare.toFixed(2)} (phải bằng 1).`,
        'WARNING'
      );
  }

  if (bp.skillDistribution) {
    const requested = Object.values(bp.skillDistribution).reduce((a, b) => a + b, 0);
    if (requested > bp.questionCount)
      push(
        'SKILL_DISTRIBUTION_TOO_LARGE',
        `skillDistribution yêu cầu ${requested} câu > questionCount ${bp.questionCount}.`,
        'WARNING'
      );
    for (const skillId of Object.keys(bp.skillDistribution)) {
      if (!COMPETITION_SKILLS.some((s) => s.skillId === skillId))
        push('UNKNOWN_SKILL_IN_DISTRIBUTION', `skillDistribution tham chiếu skillId không tồn tại: ${skillId}`);
    }
    // A blueprint must never promise more items than the bank can supply (§16).
    for (const [skillId, count] of Object.entries(bp.skillDistribution)) {
      const available = COMPETITION_QUESTIONS.filter((q) => q.skillId === skillId).length;
      if (available < count)
        push(
          'SKILL_SUPPLY_SHORTFALL',
          `skillDistribution yêu cầu ${count} câu cho "${skillId}" nhưng ngân hàng chỉ có ${available} câu.`,
          'WARNING'
        );
    }
  }

  for (const section of bp.sections ?? []) {
    if (!section.title?.trim()) push('SECTION_NO_TITLE', `Phần "${section.id}" thiếu tiêu đề.`);
    for (const skillId of section.skillIds) {
      if (!COMPETITION_SKILLS.some((s) => s.skillId === skillId))
        push('SECTION_UNKNOWN_SKILL', `Phần "${section.id}" tham chiếu skillId không tồn tại: ${skillId}`);
    }
  }

  return issues;
}

function validateReadingQuestion(q: (typeof READING_QUESTIONS)[number]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scope = `reading:${q.id}`;
  const push = (code: string, message: string, severity: ValidationSeverity = 'ERROR') =>
    issues.push({ severity, scope, code, message });

  if (!READING_SKILLS.some((s) => s.skillId === q.skillId))
    push('UNKNOWN_SKILL', `skillId "${q.skillId}" không có trong reading taxonomy.`);
  if (!READING_PASSAGES.some((p) => p.id === q.passageId))
    push('UNKNOWN_PASSAGE', `passageId "${q.passageId}" không tồn tại.`);
  if (!q.options.includes(q.correctAnswer))
    push('ANSWER_NOT_IN_OPTIONS', 'Đáp án đúng phải nằm trong options.');
  if (new Set(q.options).size !== q.options.length) push('DUPLICATE_OPTIONS', 'Options bị trùng.');
  if (q.wordCount <= 0) push('BAD_WORD_COUNT', 'wordCount phải lớn hơn 0.');
  if (q.targetText && !q.options.includes(q.targetText))
    push('TARGET_NOT_IN_OPTIONS', 'targetText phải là một trong các options.');
  return issues;
}

/**
 * P41 — cp1258/CP1252 double-encoding (mojibake) detector, tuned so it never
 * flags legitimate content. Always corrupt: U+FFFD, U+00C4..U+00C6, U+00D0,
 * U+00D1, U+00D8, U+00DE, U+00DF, U+20AC, and the symbol leftovers U+00A1,
 * U+00A6, U+00A8..U+00AA, U+00AC, U+00AE, U+00AF, U+00B2, U+00B3, U+00B9,
 * U+00BA, U+00BC..U+00BF. U+00C2/U+00C3 (valid Vietnamese capitals) and
 * U+00BB (closing guillemet, e.g. `Man «Ten»`) only count when directly
 * followed by a mojibake continuation char. U+00B4, U+00B7, U+00B1, U+00A7,
 * U+00B0, U+00D7, U+00F7 and all precomposed Vietnamese letters stay allowed.
 */
const MOJIBAKE_RE =
  /[\uFFFD\u00C4-\u00C6\u00D0\u00D1\u00D8\u00DE\u00DF\u20AC]|[\u00C2\u00C3\u00BB][\u0080-\u00BF\u2018-\u201F\u2020-\u2027\u2122\u02C6\u02DC\u2039\u203A]|[\u00A1\u00A6\u00A8\u00A9\u00AA\u00AC\u00AE\u00AF\u00B2\u00B3\u00B9\u00BA\u00BC\u00BD\u00BE\u00BF]/u;

/** Emoji used by the app as images (mediaEmoji / image-choice options). */
const EMOJI_RE = /\p{Extended_Pictographic}/u;

/** Every human-readable string a curriculum question can carry. */
function collectQuestionStrings(q: Question): string[] {
  const out: string[] = [];
  const add = (v: unknown) => {
    if (typeof v === 'string' && v) out.push(v);
  };
  add(q.prompt);
  add(q.audioPrompt);
  add(q.mediaEmoji);
  add(q.hint);
  add(q.explanation);
  for (const opt of q.options ?? []) add(opt);
  if (Array.isArray(q.correctAnswer)) {
    for (const ans of q.correctAnswer) add(ans);
  } else {
    add(q.correctAnswer);
  }
  for (const pair of [...(q.pairs ?? []), ...(q.matchingPairs ?? [])]) {
    add(pair.left);
    add(pair.right);
  }
  for (const item of q.orderingItems ?? []) add(item);
  for (const bucket of q.categoryBuckets ?? []) add(bucket);
  return out;
}

function validateCurriculumQuestion(q: Question): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scope = `curriculum:${q.id}`;
  const push = (code: string, message: string, severity: ValidationSeverity = 'ERROR') =>
    issues.push({ severity, scope, code, message });

  // P41 / §2 — encoding & font safety: no replacement char, no double-encoded
  // (mojibake) text, and NFC so Vietnamese precomposed glyphs are used.
  for (const text of collectQuestionStrings(q)) {
    if (text.includes('\uFFFD')) {
      push('CORRUPTED_TEXT', `Chuỗi chứa ký tự hỏng U+FFFD: "${text.slice(0, 60)}".`);
    } else if (MOJIBAKE_RE.test(text)) {
      push('MOJIBAKE_TEXT', `Chuỗi bị mã hóa sai (mojibake): "${text.slice(0, 60)}".`);
    }
    if (text !== text.normalize('NFC')) {
      push('NON_NFC_TEXT', `Chuỗi chưa ở dạng Unicode NFC: "${text.slice(0, 60)}".`, 'WARNING');
    }
  }

  // P41 / §3 — an image-choice question MUST carry its image (inline emoji in
  // prompt/options, mediaEmoji, or a structured visual); otherwise the pupil
  // is asked to identify a picture that never renders.
  if (q.type === 'image-choice') {
    const hasImage =
      (q.mediaEmoji ? EMOJI_RE.test(q.mediaEmoji) : false) ||
      !!q.visual ||
      EMOJI_RE.test(q.prompt ?? '') ||
      (q.options ?? []).some((opt) => EMOJI_RE.test(opt));
    if (!hasImage) {
      push('IMAGE_MISSING', 'Câu hỏi image-choice không có hình minh họa (emoji/visual).');
    }
  }

  // P41 / §3 — audio questions without their TTS text would silently fall
  // back to the prompt (or stay mute); keep it explicit.
  if (q.type === 'audio-choice' && !q.audioPrompt?.trim()) {
    push(
      'AUDIO_PROMPT_MISSING',
      'Câu hỏi audio-choice thiếu audioPrompt (phải có nội dung đọc cho TTS).',
      'WARNING'
    );
  }

  if (!q.prompt?.trim()) push('EMPTY_PROMPT', 'Câu hỏi thiếu nội dung.');
  if (!q.skillId) push('MISSING_SKILL', 'Câu hỏi thiếu skillId.');
  if (![1, 2, 3].includes(q.difficulty)) push('INVALID_DIFFICULTY', `difficulty phải là 1, 2 hoặc 3, nhận được ${q.difficulty}.`);
  if (!q.explanation?.trim()) push('MISSING_EXPLANATION', 'Câu hỏi thiếu giải thích (explanation).', 'WARNING');
  if (!q.hint?.trim()) push('MISSING_HINT', 'Câu hỏi thiếu gợi ý (hint).', 'WARNING');

  // Answer leak detection: parenthetical in prompt containing the correct answer
  if (q.type === 'fill-blank' && q.prompt) {
    const leakMatch = q.prompt.match(/\(([^)]+)\)/);
    if (leakMatch && leakMatch[1].trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
      push('ANSWER_LEAK_IN_PROMPT', 'Prompt chứa đáp án đúng trong ngoặc đơn — học sinh có thể đoán được.', 'ERROR');
    }
  }

  // Hint revealing answer
  if (q.hint && q.correctAnswer) {
    const hintLower = q.hint.toLowerCase();
    const answerLower = String(q.correctAnswer).toLowerCase();
    if (hintLower.includes(answerLower) && answerLower.length > 1) {
      push('HINT_REVEALS_ANSWER', 'Gợi ý (hint) chứa đáp án đúng — hãy dùng gợi ý mang tính định hướng.', 'WARNING');
    }
  }

  // Type-specific validation
  switch (q.type) {
    case 'multiple-choice':
    case 'image-choice':
    case 'audio-choice':
    case 'true-false': {
      if (!q.options || q.options.length < 2) {
        push('TOO_FEW_OPTIONS', `Loại ${q.type} cần ít nhất 2 phương án.`);
      }
      if (q.options && new Set(q.options).size !== q.options.length) {
        push('DUPLICATE_OPTIONS', 'Options bị trùng.');
      }
      if (Array.isArray(q.correctAnswer)) {
        for (const item of q.correctAnswer) {
          if (!q.options?.includes(item)) push('ANSWER_NOT_IN_OPTIONS', `Đáp án "${item}" không có trong options.`);
        }
      } else if (!q.options?.includes(q.correctAnswer)) {
        push('ANSWER_NOT_IN_OPTIONS', 'Đáp án đúng phải nằm trong options.');
      }
      if (q.type !== 'true-false' && q.options && q.options.length < 3) {
        push('FEW_OPTIONS', `Loại ${q.type} nên có ít nhất 3 phương án (hiện có ${q.options.length}).`, 'WARNING');
      }
      break;
    }
    case 'fill-blank': {
      if (!q.options || q.options.length < 2) {
        push('TOO_FEW_OPTIONS', 'Câu điền chỗ trống cần ít nhất 2 phương án.');
      }
      if (q.options && new Set(q.options).size !== q.options.length) {
        push('DUPLICATE_OPTIONS', 'Options bị trùng.');
      }
      if (typeof q.correctAnswer === 'string' && !q.options?.includes(q.correctAnswer)) {
        push('ANSWER_NOT_IN_OPTIONS', 'Đáp án đúng phải nằm trong options.');
      }
      break;
    }
    case 'matching': {
      if (!q.matchingPairs || q.matchingPairs.length < 2) {
        push('MISSING_PAIRS', 'Câu nối cần ít nhất 2 cặp.');
      } else {
        const lefts = q.matchingPairs.map((p) => p.left);
        if (new Set(lefts).size !== lefts.length) {
          push('DUPLICATE_PAIR_LEFT', 'Có mục bên trái bị trùng nhau.');
        }
        const expected = lefts
          .map((l) => `${l}=${q.matchingPairs!.find((p) => p.left === l)!.right}`)
          .join('|');
        const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi');
        if (normalize(q.correctAnswer as string) !== normalize(expected)) {
          push('PAIR_ANSWER_MISMATCH', 'correctAnswer không khớp với matchingPairs.');
        }
        for (const pair of q.matchingPairs) {
          if (!q.options?.includes(pair.right)) {
            push('PAIR_OPTION_MISSING', `Phương án "${pair.right}" không có trong options.`);
          }
        }
      }
      break;
    }
    case 'ordering': {
      const items = q.orderingItems ?? [];
      if (items.length < 2) {
        push('MISSING_ORDER_ITEMS', 'Câu sắp xếp cần ít nhất 2 phần tử.');
      }
      if (q.options && items.length !== q.options.length) {
        push('ORDER_OPTIONS_MISMATCH', 'orderingItems và options phải cùng độ dài.');
      }
      for (const item of items) {
        if (!q.options?.includes(item)) {
          push('ORDER_OPTION_MISSING', `Ô "${item}" không có trong options.`);
        }
      }
      if (typeof q.correctAnswer === 'string') {
        const canonical = q.correctAnswer.split('|').filter(Boolean);
        if (canonical.length !== items.length) {
          push('ORDER_ANSWER_LENGTH', 'correctAnswer phải chứa đúng số phần tử của orderingItems.');
        }
        if (new Set(canonical).size !== canonical.length) {
          push('ORDER_ANSWER_DUPLICATE', 'correctAnswer của câu sắp xếp có phần tử lặp.');
        }
      }
      break;
    }
    case 'drag-drop':
    case 'classify': {
      if (!q.categoryBuckets || q.categoryBuckets.length < 2) {
        push('MISSING_BUCKETS', 'Câu phân loại/kéo thả cần ít nhất 2 nhóm.');
      }
      if (q.categoryBuckets && !q.categoryBuckets.includes(q.correctAnswer as string)) {
        push('ANSWER_NOT_IN_BUCKET', 'Đáp án đúng phải là một trong các nhóm đã khai báo.');
      }
      break;
    }
    case 'math-expression': {
      if (!q.options || q.options.length < 2) {
        push('TOO_FEW_OPTIONS', 'Câu biểu thức toán học cần ít nhất 2 phương án.');
      }
      if (q.options && new Set(q.options).size !== q.options.length) {
        push('DUPLICATE_OPTIONS', 'Options bị trùng.');
      }
      if (typeof q.correctAnswer === 'string' && !q.options?.includes(q.correctAnswer)) {
        push('ANSWER_NOT_IN_OPTIONS', 'Đáp án đúng phải nằm trong options.');
      }
      break;
    }
    default:
      break;
  }

  return issues;
}

const CHOICE_LIKE_CURRICULUM_TYPES = [
  'multiple-choice',
  'image-choice',
  'audio-choice',
  'fill-blank',
  'true-false',
  'math-expression',
];

export interface CurriculumPositionStat {
  total: number;
  positions: Record<number, number>;
  maxShare: number;
}

export interface CurriculumPositionReport {
  bySubject: Record<string, CurriculumPositionStat>;
  overall: CurriculumPositionStat;
}

/**
 * P41 §5 — answer-position distribution across the whole lesson bank. Before the
 * optionBalance agent this read 80/84 at index 0 (95%); the gate now keeps every
 * subject under CURRICULUM_POLICY.MAX_ANSWER_POSITION_SHARE.
 */
export function buildCurriculumAnswerPositionReport(): CurriculumPositionReport {
  const subjects = ['tieng-viet', 'toan', 'english', 'cuoc-song'];
  const bySubject: Record<string, CurriculumPositionStat> = {};
  const overall: Record<number, number> = {};
  let overallTotal = 0;

  for (const subject of subjects) {
    const positions: Record<number, number> = {};
    let total = 0;
    for (const q of getCurriculumQuestions()) {
      if (q.subject !== subject) continue;
      if (!CHOICE_LIKE_CURRICULUM_TYPES.includes(q.type)) continue;
      if (typeof q.correctAnswer !== 'string') continue;
      if (!q.options) continue;
      const idx = q.options.indexOf(q.correctAnswer);
      if (idx < 0) continue;
      positions[idx] = (positions[idx] ?? 0) + 1;
      overall[idx] = (overall[idx] ?? 0) + 1;
      total += 1;
      overallTotal += 1;
    }
    bySubject[subject] = { total, positions, maxShare: maxShareOf(positions, total) };
  }

  return { bySubject, overall: { total: overallTotal, positions: overall, maxShare: maxShareOf(overall, overallTotal) } };
}

function maxShareOf(positions: Record<number, number>, total: number): number {
  if (total === 0) return 0;
  const max = Math.max(...Object.values(positions));
  return Math.round((max / total) * 100) / 100;
}

/** Builds the coverage matrix (Subject → Topic → Skill → Difficulty → Type). */
export function buildCoverageReport(): CoverageReport {
  const bySkill: Record<string, { total: number; byDifficulty: Record<string, number>; byType: Record<string, number> }> = {};
  const byTopic: Record<string, CoverageCell['skills']> = {};

  for (const q of COMPETITION_QUESTIONS) {
    if (!bySkill[q.skillId]) {
      bySkill[q.skillId] = { total: 0, byDifficulty: {}, byType: {} };
    }
    const cell = bySkill[q.skillId];
    cell.total += 1;
    cell.byDifficulty[q.difficulty] = (cell.byDifficulty[q.difficulty] ?? 0) + 1;
    cell.byType[q.questionType] = (cell.byType[q.questionType] ?? 0) + 1;

    byTopic[q.topic] = byTopic[q.topic] ?? {};
    byTopic[q.topic][q.skillId] = cell;
  }

  const total = COMPETITION_QUESTIONS.length;
  const skillShares = Object.entries(bySkill).map(([id, s]) => ({ id, share: s.total / Math.max(1, total) }));
  const maxSkillShare = skillShares.length ? Math.max(...skillShares.map((s) => s.share)) : 0;

  const typesPresent = Array.from(new Set<string>(COMPETITION_QUESTIONS.map((q) => q.questionType)));

  return {
    skillsWithoutQuestions: COMPETITION_SKILLS.filter((s) => !bySkill[s.skillId]).map((s) => s.skillId),
    underSuppliedSkills: skillShares
      .filter((s) => Math.round(s.share * total) < CONTENT_POLICY.MIN_QUESTIONS_PER_SKILL)
      .map((s) => s.id),
    questionTypesPresent: typesPresent,
    questionTypesMissing: ALL_QUESTION_TYPES.filter((t) => !typesPresent.includes(t)),
    overConcentratedSkills: skillShares
      .filter((s) => s.share > CONTENT_POLICY.MAX_SKILL_CONCENTRATION)
      .map((s) => s.id),
    maxSkillShare: Math.round(maxSkillShare * 100) / 100,
    matrix: Object.entries(byTopic).map(([topic, skills]) => ({ topic, skills })),
  };
}

/**
 * Full repository content audit (§15).
 * Returns every issue found; callers decide how to fail.
 */
export function runContentValidation(): ValidationReport {
  const issues: ValidationIssue[] = [];

  // --- Competition bank ----------------------------------------------------
  const seenIds = new Set<string>();

  for (const q of COMPETITION_QUESTIONS) {
    if (seenIds.has(q.id)) {
      issues.push({
        severity: 'ERROR',
        scope: `competition:${q.id}`,
        code: 'DUPLICATE_ID',
        message: `id "${q.id}" bị trùng trong ngân hàng câu hỏi.`,
      });
    }
    seenIds.add(q.id);

    issues.push(...validateCompetitionQuestion(q));
  }

  // T02C — near-duplicate scan: tokenize once, compare only inside the same
  // subject+skill group, keep Vietnamese diacritics (má ≠ mà).
  for (const pair of findNearDuplicates(
    COMPETITION_QUESTIONS.map((q) => ({ id: q.id, prompt: q.prompt, group: `${q.subject}::${q.skillId}` }))
  )) {
    if (pair.severity === 'ERROR') {
      issues.push({
        severity: 'ERROR',
        scope: `competition:${pair.bId}`,
        code: 'SEMANTIC_DUPLICATE',
        message: `Câu trùng ý với "${pair.aId}" (độ tương đồng ${pair.similarity.toFixed(2)}).`,
      });
    } else {
      issues.push({
        severity: 'WARNING',
        scope: `competition:${pair.bId}`,
        code: 'NEAR_DUPLICATE',
        message: `Câu gần giống "${pair.aId}" (độ tương đồng ${pair.similarity.toFixed(2)}).`,
      });
    }
  }

  // --- Blueprints ----------------------------------------------------------
  for (const bp of EXAM_BLUEPRINTS) issues.push(...validateBlueprint(bp));

  // --- Reading bank --------------------------------------------------------
  const readingIds = new Set<string>();
  for (const q of READING_QUESTIONS) {
    if (readingIds.has(q.id)) {
      issues.push({
        severity: 'ERROR',
        scope: `reading:${q.id}`,
        code: 'DUPLICATE_ID',
        message: `id "${q.id}" bị trùng trong ngân hàng đọc hiểu.`,
      });
    }
    readingIds.add(q.id);
    issues.push(...validateReadingQuestion(q));
  }

  for (const passage of READING_PASSAGES) {
    if (passage.wordCount <= 0) {
      issues.push({
        severity: 'ERROR',
        scope: `reading-passage:${passage.id}`,
        code: 'BAD_WORD_COUNT',
        message: 'wordCount của đoạn đọc phải lớn hơn 0.',
      });
    }
    for (const qid of passage.questionIds) {
      if (!READING_QUESTIONS.some((q) => q.id === qid)) {
        issues.push({
          severity: 'ERROR',
          scope: `reading-passage:${passage.id}`,
          code: 'DANGLING_QUESTION_REF',
          message: `Tham chiếu câu hỏi không tồn tại: ${qid}`,
        });
      }
    }
  }

  // --- Curriculum bank -----------------------------------------------------
  const curriculumQuestions = getCurriculumQuestions();
  for (const q of curriculumQuestions) issues.push(...validateCurriculumQuestion(q));

  // Curriculum near-duplicate detection (within subject+skill — T02C).
  for (const pair of findNearDuplicates(
    curriculumQuestions.map((q) => ({ id: q.id, prompt: q.prompt, group: `${q.subject}::${q.skillId}` }))
  )) {
    if (pair.severity === 'ERROR') {
      issues.push({
        severity: 'ERROR',
        scope: `curriculum:${pair.bId}`,
        code: 'SEMANTIC_DUPLICATE',
        message: `Câu hỏi chương trình trùng ý với "${pair.aId}" (độ tương đồng ${pair.similarity.toFixed(2)}).`,
      });
    } else {
      issues.push({
        severity: 'WARNING',
        scope: `curriculum:${pair.bId}`,
        code: 'NEAR_DUPLICATE',
        message: `Câu hỏi chương trình gần giống "${pair.aId}" (độ tương đồng ${pair.similarity.toFixed(2)}).`,
      });
    }
  }

  // Curriculum skill depth check (each skill should have >= 2 questions)
  const skillCounts: Record<string, number> = {};
  for (const q of curriculumQuestions) {
    skillCounts[q.skillId] = (skillCounts[q.skillId] || 0) + 1;
  }
  for (const [skillId, count] of Object.entries(skillCounts)) {
    if (count < 2) {
      issues.push({
        severity: 'WARNING',
        scope: `curriculum:skill:${skillId}`,
        code: 'SKILL_UNDER_SUPPLIED',
        message: `Kỹ năng "${skillId}" chỉ có ${count} câu hỏi (khuyến nghị ≥ 2).`,
      });
    }
  }

  // Curriculum difficulty spread per subject
  // T14C: guard the lookup so a future/new subject can never crash the gate
  // with `undefined.add(...)` — unknown subjects get their own bucket.
  const subjectDifficulty: Record<string, Set<number>> = { 'tieng-viet': new Set(), toan: new Set(), english: new Set(), 'cuoc-song': new Set() };
  for (const q of curriculumQuestions) {
    if (!subjectDifficulty[q.subject]) subjectDifficulty[q.subject] = new Set();
    subjectDifficulty[q.subject].add(q.difficulty);
  }
  for (const [subject, diffs] of Object.entries(subjectDifficulty)) {
    if (!diffs.has(3)) {
      issues.push({
        severity: 'WARNING',
        scope: `curriculum:subject:${subject}`,
        code: 'MISSING_DIFFICULTY_3',
        message: `Môn ${subject} thiếu câu hỏi difficulty 3 (thử thách).`,
      });
    }
  }

  // Curriculum answer-position bias (P41 §5) — correct answer must not always
  // sit at the same option index. Kept as ERROR so the gate cannot regress.
  const positionReport = buildCurriculumAnswerPositionReport();
  for (const [subject, stat] of Object.entries(positionReport.bySubject)) {
    if (stat.total > 0 && stat.maxShare > CURRICULUM_POLICY.MAX_ANSWER_POSITION_SHARE) {
      issues.push({
        severity: 'ERROR',
        scope: `curriculum:subject:${subject}`,
        code: 'ANSWER_POSITION_BIAS',
        message: `Môn ${subject}: vị trí đáp án đúng tập trung ${(stat.maxShare * 100).toFixed(0)}% tại một ô (giới hạn ${(CURRICULUM_POLICY.MAX_ANSWER_POSITION_SHARE * 100).toFixed(0)}%).`,
      });
    }
  }

  // --- Kid's Box Companion (§28) ------------------------------------------
  // The companion track reuses this report format so there is exactly one
  // content gate for the whole repository.
  const kidBox = runKidBoxContentValidation();
  issues.push(
    ...kidBox.issues.map((i) => ({
      severity: i.severity,
      scope: i.scope,
      code: i.code,
      message: i.message,
    }))
  );

  const errors = issues.filter((i) => i.severity === 'ERROR').length;
  const warnings = issues.filter((i) => i.severity === 'WARNING').length;

  return {
    generatedAtVersion: COMPETITION_BANK_VERSION,
    totals: {
      competitionQuestions: COMPETITION_QUESTIONS.length,
      readingQuestions: READING_QUESTIONS.length,
      readingPassages: READING_PASSAGES.length,
      curriculumQuestions: getCurriculumQuestions().length,
      kidBoxUnits: kidBox.totals.units,
      kidBoxActivities: kidBox.totals.activities,
      errors,
      warnings,
    },
    issues,
    coverage: buildCoverageReport(),
  };
}

/** Human-readable summary used by docs and the dev diagnostics panel. */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push(`Question bank version: v${report.generatedAtVersion}`);
  lines.push(
    `Competition: ${report.totals.competitionQuestions} | Reading: ${report.totals.readingQuestions} (${report.totals.readingPassages} đoạn) | Curriculum: ${report.totals.curriculumQuestions} | Kid's Box: ${report.totals.kidBoxUnits} unit / ${report.totals.kidBoxActivities} hoạt động`
  );
  lines.push(`ERROR: ${report.totals.errors} | WARNING: ${report.totals.warnings}`);
  lines.push(
    `Coverage — dạng bài có mặt: ${report.coverage.questionTypesPresent.join(', ') || 'không có'}`
  );
  if (report.coverage.questionTypesMissing.length > 0) {
    lines.push(`Dạng bài còn thiếu: ${report.coverage.questionTypesMissing.join(', ')}`);
  }
  if (report.coverage.skillsWithoutQuestions.length > 0) {
    lines.push(`Kỹ năng chưa có câu: ${report.coverage.skillsWithoutQuestions.join(', ')}`);
  }
  if (report.coverage.underSuppliedSkills.length > 0) {
    lines.push(`Kỹ năng quá ít câu: ${report.coverage.underSuppliedSkills.join(', ')}`);
  }
  for (const issue of report.issues) {
    lines.push(`[${issue.severity}] ${issue.scope} ${issue.code}: ${issue.message}`);
  }
  return lines.join('\n');
}
