import { CompetitionQuestion } from '../types/competition';
import { COMPETITION_SKILLS } from '../data/competitionTaxonomy';
import { CompetitionEngine } from './competitionEngine';
import { normalizeForDuplicateCheck, semanticSimilarity } from './contentValidator';
import { CONTENT_POLICY, P36_BANK_POLICY } from '../config/policy';

/**
 * P36 COMPETITION QUALITY ENGINE (§5, §7–§11).
 *
 * Sits beside (never weakens) the P29 `contentValidator` contract checks:
 *  - §8  semantic duplicate detection via canonical signatures + threshold
 *  - §5  distribution quality (answer positions, types, difficulty, subjects)
 *  - §9  difficulty quality (word/time bands calibrated on the legacy bank)
 *  - §10 explanation quality (length, originality, answer-leak scan)
 *  - §11 content safety (Grade-1 allow-list approach: banned phrases only)
 *
 * Every finding is an ERROR (counts as a validator gap) unless named WARNING.
 */

export interface P36Issue {
  code: string;
  message: string;
  itemId?: string;
}

/** Curriculum topic registry: no invented topics (§4). Frozen from the legacy bank audit. */
export const P36_KNOWN_TOPICS = [
  'Ngữ âm',
  'Cấu tạo từ',
  'Chính tả',
  'Từ vựng',
  'Ngữ pháp',
  'Đọc hiểu',
  'Tư duy logic',
  'Số học',
  'Phép tính',
  'Hình học',
  'Đại lượng',
  'Giải toán',
  'Vocabulary',
  'Phonics',
] as const;

/**
 * Grade-1 safety screen. Every pattern was verified to have ZERO hits on the
 * 132-item legacy bank before freezing, so a hit always means genuinely new
 * risky content — never a legacy idiom like "Đánh giá mệnh đề" or "Grandma".
 * Word-boundary aware: bare substrings ("đánh", "ma") are NOT banned.
 */
export const P36_UNSAFE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /đánh nhau|đánh đập|đánh đòn|đòn roi/i, label: 'violence' },
  { pattern: /giết|chết người|chảy máu|máu me|vết thương|bị thương/i, label: 'injury' },
  { pattern: /bắt cóc|đuối nước|cháy nhà|lạc mẹ/i, label: 'unsafe-scenario' },
  { pattern: /ma quỷ|quái vật|kinh dị|ác mộng/i, label: 'frightening' },
  { pattern: /ngu ngốc|đồ ngu|dốt nát|kém cỏi|đáng phạt|hư đốn/i, label: 'shaming' },
  { pattern: /chơi với lửa|sờ ổ điện|uống thuốc bừa|ra đường một mình/i, label: 'unsafe-instruction' },
  { pattern: /\bkill\b|\bdie\b|\bblood\b|\bmonster\b|\bstupid\b|\bdumb\b|\bhate you\b/i, label: 'unsafe-english' },
];

const READING_SKILLS = new Set(['TV-READING']);

/** Canonical semantic signature (§8): prompt template + numbers + answer + skill + type. */
export function p36Signature(q: CompetitionQuestion): string {
  const norm = normalizeForDuplicateCheck(q.prompt).replace(/\d+/g, '#');
  const numbers = Array.from(q.prompt.match(/\d+/g) ?? []).map(Number).sort((a, b) => a - b);
  const answer = CompetitionEngine.normalizeAnswer(q.correctAnswer);
  return [q.skillId, q.questionType, norm, numbers.join(','), answer].join('::');
}

/** Per-item validation (§7, §9, §10, §11). Returns ERROR-level gaps. */
export function validateP36Item(q: CompetitionQuestion): P36Issue[] {
  const issues: P36Issue[] = [];
  const at = (code: string, message: string) => issues.push({ code, message, itemId: q.id });

  if (!P36_KNOWN_TOPICS.includes(q.topic as (typeof P36_KNOWN_TOPICS)[number])) {
    at('UNKNOWN_TOPIC', `topic "${q.topic}" không có trong curriculum registry.`);
  }
  if (!COMPETITION_SKILLS.some((s) => s.skillId === q.skillId && s.subject === q.subject)) {
    at('SKILL_SUBJECT_MISMATCH', `skillId "${q.skillId}" không thuộc môn "${q.subject}".`);
  }

  // --- §10 explanation quality ---
  const explanation = q.explanation.trim();
  if (explanation.length < P36_BANK_POLICY.MIN_EXPLANATION_CHARS) {
    at('EXPLANATION_TOO_SHORT', `Giải thích quá ngắn (${explanation.length} ký tự).`);
  }
  const normPrompt = CompetitionEngine.normalizeAnswer(q.prompt);
  const normExpl = CompetitionEngine.normalizeAnswer(explanation);
  if (normExpl.length > 0 && normExpl === normPrompt) {
    at('EXPLANATION_IS_PROMPT_COPY', 'Giải thích chỉ sao chép lại đề bài.');
  }
  if (/\bngu\b|ngu ngốc|dốt|kém quá|phạt|hư quá|xấu hổ/i.test(explanation)) {
    at('EXPLANATION_SHAMING', 'Giải thích chứa lời lẽ chê bai bé.');
  }

  // --- §10 answer-leak scan (choice items, distinctive answers only) ---
  if (
    q.questionType === 'multiple-choice' &&
    !READING_SKILLS.has(q.skillId) &&
    q.correctAnswer.trim().length >= P36_BANK_POLICY.LEAK_MIN_ANSWER_CHARS
  ) {
    const normAnswer = CompetitionEngine.normalizeAnswer(q.correctAnswer);
    // A leak means the prompt singles out the answer: it names the correct
    // option while naming NO distractor (comparison setups like "quả bóng to
    // hay quả bóng nhỏ?" name both sides, so the child must still choose).
    const distractorsInPrompt = q.options
      .filter((o) => o !== q.correctAnswer)
      .filter((o) => o.trim().length >= P36_BANK_POLICY.LEAK_MIN_ANSWER_CHARS)
      .filter((o) => normPrompt.includes(CompetitionEngine.normalizeAnswer(o))).length;
    if (normPrompt.includes(normAnswer) && distractorsInPrompt < 1) {
      at('ANSWER_LEAK_IN_PROMPT', `Đề bài lộ đáp án "${q.correctAnswer}" mà không nhắc tới các phương án khác.`);
    }
  }

  // --- §11 content safety ---
  const haystack = `${q.prompt} ${q.options.join(' ')} ${q.explanation}`;
  for (const { pattern, label } of P36_UNSAFE_PATTERNS) {
    if (pattern.test(haystack)) at('UNSAFE_CONTENT', `Nội dung gắn cờ an toàn (${label}).`);
  }

  // --- §9 difficulty quality (bands calibrated on the legacy bank) ---
  const words = q.prompt.split(/\s+/).filter(Boolean).length;
  if (q.difficulty === 'EASY' && words > P36_BANK_POLICY.EASY_MAX_PROMPT_WORDS) {
    at('EASY_PROMPT_TOO_LONG', `EASY có ${words} từ (tối đa ${P36_BANK_POLICY.EASY_MAX_PROMPT_WORDS}).`);
  }
  const isChoice = q.questionType === 'multiple-choice' || q.questionType === 'true-false' || q.questionType === 'fill-blank';
  if (q.difficulty === 'EASY' && isChoice && q.estimatedSeconds > P36_BANK_POLICY.EASY_CHOICE_MAX_SECONDS) {
    at('EASY_TIME_TOO_HIGH', `EASY trắc nghiệm cần ≤ ${P36_BANK_POLICY.EASY_CHOICE_MAX_SECONDS}s.`);
  }
  if (
    q.difficulty === 'EASY' &&
    !isChoice &&
    q.estimatedSeconds > P36_BANK_POLICY.EASY_MANIPULATIVE_MAX_SECONDS
  ) {
    at('EASY_TIME_TOO_HIGH', `EASY thao tác cần ≤ ${P36_BANK_POLICY.EASY_MANIPULATIVE_MAX_SECONDS}s.`);
  }
  if (q.difficulty === 'MEDIUM' && q.estimatedSeconds > P36_BANK_POLICY.MEDIUM_MAX_SECONDS) {
    at('MEDIUM_TIME_TOO_HIGH', `MEDIUM cần ≤ ${P36_BANK_POLICY.MEDIUM_MAX_SECONDS}s.`);
  }
  if (
    (q.difficulty === 'HARD' || q.difficulty === 'CHALLENGE') &&
    q.estimatedSeconds < P36_BANK_POLICY.HARD_MIN_SECONDS
  ) {
    at('HARD_TIME_TOO_LOW', `HARD/CHALLENGE cần ≥ ${P36_BANK_POLICY.HARD_MIN_SECONDS}s suy luận.`);
  }

  return issues;
}

/** Semantic duplicate detection (§8). Exact-signature collisions are gaps. */
export function findP36Duplicates(bank: CompetitionQuestion[]): {
  exact: string[][];
  near: { a: string; b: string; similarity: number }[];
} {
  const bySig = new Map<string, string[]>();
  for (const q of bank) {
    const sig = p36Signature(q);
    bySig.set(sig, [...(bySig.get(sig) ?? []), q.id]);
  }
  const exact = Array.from(bySig.values()).filter((ids) => ids.length > 1);

  // Near-duplicates: same skill + same canonical answer + prompt similarity
  // at/above the configured threshold (trivial rewordings, §8 example).
  const near: { a: string; b: string; similarity: number }[] = [];
  const normAns = new Map(bank.map((q) => [q.id, CompetitionEngine.normalizeAnswer(q.correctAnswer)]));
  for (let i = 0; i < bank.length; i += 1) {
    for (let j = i + 1; j < bank.length; j += 1) {
      const a = bank[i];
      const b = bank[j];
      if (a.skillId !== b.skillId) continue;
      if (normAns.get(a.id) !== normAns.get(b.id)) continue;
      const sim = semanticSimilarity(a.prompt, b.prompt);
      if (sim >= CONTENT_POLICY.DUPLICATE_PROMPT_SIMILARITY) {
        near.push({ a: a.id, b: b.id, similarity: Math.round(sim * 1000) / 1000 });
      }
    }
  }
  return { exact, near };
}

export interface P36Distribution {
  total: number;
  bySubject: Record<string, number>;
  byTopic: Record<string, number>;
  byDifficulty: Record<string, number>;
  byType: Record<string, number>;
  bySkill: Record<string, number>;
  /** Correct-answer position share per 4-option choice type. */
  answerPositions: Record<string, Record<number, number>>;
  trueFalseShare: { dung: number; sai: number };
  maxPositionShare: number;
}

/** Distribution snapshot (§5). Pure computation, no thresholds. */
export function p36Distribution(bank: CompetitionQuestion[]): P36Distribution {
  const bySubject: Record<string, number> = {};
  const byTopic: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const bySkill: Record<string, number> = {};
  const answerPositions: Record<string, Record<number, number>> = {};
  let dung = 0;
  let sai = 0;
  for (const q of bank) {
    bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1;
    byTopic[q.topic] = (byTopic[q.topic] ?? 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
    byType[q.questionType] = (byType[q.questionType] ?? 0) + 1;
    bySkill[q.skillId] = (bySkill[q.skillId] ?? 0) + 1;
    if ((q.questionType === 'multiple-choice' || q.questionType === 'fill-blank') && q.options.length === 4) {
      const idx = q.options.indexOf(q.correctAnswer);
      const key = q.questionType;
      answerPositions[key] = answerPositions[key] ?? {};
      answerPositions[key][idx] = (answerPositions[key][idx] ?? 0) + 1;
    }
    if (q.questionType === 'true-false') {
      if (q.correctAnswer === 'Đúng') dung += 1;
      else sai += 1;
    }
  }
  let maxPositionShare = 0;
  for (const positions of Object.values(answerPositions)) {
    const total = Object.values(positions).reduce((a, b) => a + b, 0);
    for (const count of Object.values(positions)) {
      maxPositionShare = Math.max(maxPositionShare, total > 0 ? count / total : 0);
    }
  }
  return {
    total: bank.length,
    bySubject,
    byTopic,
    byDifficulty,
    byType,
    bySkill,
    answerPositions,
    trueFalseShare: { dung, sai },
    maxPositionShare: Math.round(maxPositionShare * 1000) / 1000,
  };
}

export interface P36CoverageCell {
  subject: string;
  topic: string;
  skillId: string;
  skillName: string;
  total: number;
  byDifficulty: Record<string, number>;
  byType: Record<string, number>;
}

/** Machine-readable coverage matrix (§4): subject → topic → skill → difficulty/type. */
export function buildP36CoverageMatrix(bank: CompetitionQuestion[]): P36CoverageCell[] {
  return COMPETITION_SKILLS.map((skill) => {
    const items = bank.filter((q) => q.skillId === skill.skillId);
    const byDifficulty: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const q of items) {
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
      byType[q.questionType] = (byType[q.questionType] ?? 0) + 1;
    }
    const topics = Array.from(new Set(items.map((q) => q.topic)));
    return {
      subject: skill.subject,
      topic: topics.join(' / ') || '—',
      skillId: skill.skillId,
      skillName: skill.skillName,
      total: items.length,
      byDifficulty,
      byType,
    };
  });
}

/** Whole-bank gates (§25 hard certification inputs). */
export function validateP36Bank(bank: CompetitionQuestion[]): P36Issue[] {
  const issues: P36Issue[] = [];
  const at = (code: string, message: string) => issues.push({ code, message });
  const dist = p36Distribution(bank);

  if (dist.total < P36_BANK_POLICY.MIN_BANK_ITEMS) {
    at('BANK_TOO_SMALL', `Ngân hàng có ${dist.total} câu (tối thiểu ${P36_BANK_POLICY.MIN_BANK_ITEMS}).`);
  }
  for (const skill of COMPETITION_SKILLS) {
    const n = dist.bySkill[skill.skillId] ?? 0;
    if (n < P36_BANK_POLICY.MIN_ITEMS_PER_SKILL) {
      at('THIN_SKILL', `Kỹ năng ${skill.skillId} chỉ có ${n} câu (tối thiểu ${P36_BANK_POLICY.MIN_ITEMS_PER_SKILL}).`);
    }
  }
  for (const type of ['multiple-choice', 'true-false', 'fill-blank', 'matching', 'ordering', 'drag-drop', 'classify']) {
    const n = dist.byType[type] ?? 0;
    if (n < P36_BANK_POLICY.MIN_ITEMS_PER_TYPE) {
      at('THIN_TYPE', `Dạng bài ${type} chỉ có ${n} câu (tối thiểu ${P36_BANK_POLICY.MIN_ITEMS_PER_TYPE}).`);
    }
  }
  for (const diff of ['EASY', 'MEDIUM', 'HARD', 'CHALLENGE']) {
    const n = dist.byDifficulty[diff] ?? 0;
    if (n < P36_BANK_POLICY.MIN_ITEMS_PER_DIFFICULTY) {
      at('THIN_DIFFICULTY', `Độ khó ${diff} chỉ có ${n} câu (tối thiểu ${P36_BANK_POLICY.MIN_ITEMS_PER_DIFFICULTY}).`);
    }
  }
  for (const subject of ['tieng-viet', 'toan', 'english']) {
    const n = dist.bySubject[subject] ?? 0;
    if (n < P36_BANK_POLICY.MIN_ITEMS_PER_SUBJECT) {
      at('THIN_SUBJECT', `Môn ${subject} chỉ có ${n} câu (tối thiểu ${P36_BANK_POLICY.MIN_ITEMS_PER_SUBJECT}).`);
    }
  }
  if (dist.maxPositionShare > P36_BANK_POLICY.MAX_ANSWER_POSITION_SHARE) {
    at(
      'ANSWER_POSITION_BIAS',
      `Vị trí đáp án đúng lệch ${(dist.maxPositionShare * 100).toFixed(1)}% (tối đa ${(P36_BANK_POLICY.MAX_ANSWER_POSITION_SHARE * 100).toFixed(0)}%).`
    );
  }
  const tfTotal = dist.trueFalseShare.dung + dist.trueFalseShare.sai;
  if (tfTotal > 0) {
    const share = dist.trueFalseShare.dung / tfTotal;
    if (share < P36_BANK_POLICY.TF_MIN_SHARE || share > P36_BANK_POLICY.TF_MAX_SHARE) {
      at('TF_IMBALANCE', `Tỉ lệ Đúng/Sai mất cân bằng (${dist.trueFalseShare.dung}/${tfTotal} Đúng).`);
    }
  }

  const { exact, near } = findP36Duplicates(bank);
  for (const ids of exact) {
    at('SEMANTIC_DUPLICATE', `Chữ ký ngữ nghĩa trùng nhau: ${ids.join(', ')}.`);
  }
  for (const pair of near) {
    at('NEAR_DUPLICATE', `Cặp gần trùng (${pair.similarity}): ${pair.a} vs ${pair.b}.`);
  }

  return issues;
}
