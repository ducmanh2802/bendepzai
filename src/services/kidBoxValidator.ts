import {
  KidBoxActivity,
  KidBoxUnit,
  KidBoxValidationIssue,
  KidBoxValidationReport,
} from '../types/kidBox';
import { getKidBoxCourse, KIDBOX_SCHEMA_VERSION } from '../data/kidBoxCurriculum';
import { isKidBoxSkillId } from '../data/kidBoxTaxonomy';
import { KIDBOX_POLICY } from '../config/policy';
import { buildUnitActivities, validateActivityItems } from './kidBoxActivities';
import { normalizeForDuplicateCheck, semanticSimilarity } from './contentValidator';

/**
 * §28 CONTENT VALIDATION for the Kid's Box Companion track.
 *
 * Reuses the repository's existing duplicate/normalisation helpers instead of
 * re-implementing them, and returns the same `{severity, scope, code, message}`
 * shape so the findings merge into `runContentValidation()` without a second,
 * parallel report format.
 *
 * Per item it checks: unit exists, skill exists, difficulty valid, answer
 * valid, no duplicates, no ambiguity, British English metadata, audio fallback,
 * explanation and estimated time.
 */

function push(
  issues: KidBoxValidationIssue[],
  severity: KidBoxValidationIssue['severity'],
  scope: string,
  code: string,
  message: string
) {
  issues.push({ severity, scope, code, message });
}

/** §7 — American spellings a British English course must not silently use. */
const US_SPELLING_HINTS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /\bcolor(s)?\b/i, suggestion: 'colour(s)' },
  { pattern: /\bfavorite\b/i, suggestion: 'favourite' },
  { pattern: /\bcenter\b/i, suggestion: 'centre' },
  { pattern: /\bgray\b/i, suggestion: 'grey' },
];

function validateUnit(unit: KidBoxUnit, issues: KidBoxValidationIssue[]): KidBoxActivity[] {
  const scope = `kidbox:unit:${unit.id}`;

  if (!unit.britishEnglish || unit.britishEnglish !== 'en-GB') {
    push(issues, 'ERROR', scope, 'NOT_BRITISH_ENGLISH', 'Unit phải khai báo locale en-GB.');
  }
  if (unit.contentStatus === 'READY' && unit.missingContent.length > 0) {
    push(
      issues,
      'ERROR',
      scope,
      'STATUS_CONTRADICTS_CONTENT',
      `Unit đánh dấu READY nhưng vẫn thiếu: ${unit.missingContent.join(', ')}.`
    );
  }
  if (unit.sourceType !== 'APP_BRIDGE' && !unit.title) {
    push(
      issues,
      'WARNING',
      scope,
      'MISSING_VERIFIED_TITLE',
      'Chưa có tiêu đề Unit đã được xác minh. Ứng dụng sẽ hiển thị "chưa có nội dung nguồn" thay vì tự đặt tên.'
    );
  }
  for (const objective of unit.learningObjectives) {
    if (!objective.trim()) push(issues, 'WARNING', scope, 'EMPTY_OBJECTIVE', 'Có mục tiêu học tập rỗng.');
  }

  // ---- vocabulary (§28) ----
  const seenWords = new Map<string, string>();
  for (const v of unit.vocabulary) {
    const vScope = `${scope}:vocab:${v.id}`;
    if (v.unitId !== unit.id) push(issues, 'ERROR', vScope, 'WRONG_UNIT_ID', `unitId "${v.unitId}" không khớp Unit.`);
    if (!isKidBoxSkillId(v.skillId)) push(issues, 'ERROR', vScope, 'UNKNOWN_SKILL', `skillId "${v.skillId}" không có trong taxonomy.`);
    if (!v.word.trim()) push(issues, 'ERROR', vScope, 'EMPTY_WORD', 'Từ vựng rỗng.');
    if (!v.meaningVi.trim()) push(issues, 'WARNING', vScope, 'MISSING_MEANING', `Từ "${v.word}" thiếu nghĩa tiếng Việt.`);
    if (!v.pictureEmoji) push(issues, 'WARNING', vScope, 'MISSING_PICTURE', `Từ "${v.word}" chưa có hình.`);
    if (v.estimatedSeconds < KIDBOX_POLICY.MIN_ESTIMATED_SECONDS || v.estimatedSeconds > KIDBOX_POLICY.MAX_ESTIMATED_SECONDS) {
      push(issues, 'WARNING', vScope, 'BAD_ESTIMATE', `estimatedSeconds=${v.estimatedSeconds} ngoài ${KIDBOX_POLICY.MIN_ESTIMATED_SECONDS}-${KIDBOX_POLICY.MAX_ESTIMATED_SECONDS}s.`);
    }
    for (const hint of US_SPELLING_HINTS) {
      if (hint.pattern.test(v.word)) {
        push(issues, 'WARNING', vScope, 'US_SPELLING', `"${v.word}" có thể là chính tả Mỹ; British English dùng "${hint.suggestion}".`);
      }
    }

    const key = normalizeForDuplicateCheck(v.word);
    const previous = seenWords.get(key);
    if (previous) {
      push(issues, 'ERROR', vScope, 'DUPLICATE_WORD', `Từ "${v.word}" bị trùng với "${previous}" trong cùng Unit.`);
    } else {
      seenWords.set(key, v.word);
    }
  }

  // Duplicate *and* near-duplicate prompts, using the shared similarity helper.
  const wordEntries = unit.vocabulary.map((v) => ({ id: v.id, word: v.word }));
  for (let i = 0; i < wordEntries.length; i += 1) {
    for (let j = i + 1; j < wordEntries.length; j += 1) {
      const similarity = semanticSimilarity(wordEntries[i].word, wordEntries[j].word);
      if (similarity >= KIDBOX_POLICY.MAX_OPTION_SIMILARITY && wordEntries[i].word !== wordEntries[j].word) {
        push(
          issues,
          'WARNING',
          `${scope}:vocab:${wordEntries[j].id}`,
          'AMBIGUOUS_DISTRACTOR',
          `"${wordEntries[j].word}" quá giống "${wordEntries[i].word}" (${similarity.toFixed(2)}) — dễ gây nhầm lẫn.`
        );
      }
    }
  }

  // ---- phonics ----
  for (const p of unit.phonics) {
    const pScope = `${scope}:phonics:${p.id}`;
    if (!isKidBoxSkillId(p.skillId)) push(issues, 'ERROR', pScope, 'UNKNOWN_SKILL', `skillId "${p.skillId}" không có trong taxonomy.`);
    if (!p.focusSound.trim()) push(issues, 'ERROR', pScope, 'EMPTY_SOUND', 'Thiếu âm thanh.');
    if (!p.exampleWord.trim()) push(issues, 'ERROR', pScope, 'EMPTY_EXAMPLE', 'Thiếu từ ví dụ.');
    if (p.contrastWord && p.contrastWord === p.exampleWord) {
      push(issues, 'ERROR', pScope, 'CONTRAST_IDENTICAL', 'Từ đối chiếu trùng với từ ví dụ.');
    }
  }

  // ---- language patterns ----
  for (const pattern of unit.patterns) {
    const pScope = `${scope}:pattern:${pattern.id}`;
    if (!isKidBoxSkillId(pattern.skillId)) push(issues, 'ERROR', pScope, 'UNKNOWN_SKILL', `skillId "${pattern.skillId}" không có trong taxonomy.`);
    if (!pattern.pattern.trim()) push(issues, 'ERROR', pScope, 'EMPTY_PATTERN', 'Mẫu câu rỗng.');
    if (!pattern.question.trim()) push(issues, 'WARNING', pScope, 'MISSING_QUESTION', 'Mẫu câu chưa có câu hỏi để luyện nói.');
    if (pattern.slots.length === 0) {
      push(issues, 'WARNING', pScope, 'NO_SLOTS', 'Mẫu câu chưa có mảnh để bé xếp câu.');
    }
  }

  // ---- reading ----
  for (const text of unit.readingTexts) {
    const rScope = `${scope}:reading:${text.id}`;
    if (text.wordCount <= 0) push(issues, 'ERROR', rScope, 'BAD_WORD_COUNT', 'wordCount phải lớn hơn 0.');
    if (text.wordCount !== text.text.trim().split(/\s+/).filter(Boolean).length) {
      push(issues, 'WARNING', rScope, 'WORD_COUNT_MISMATCH', `wordCount=${text.wordCount} không khớp số từ thực tế.`);
    }
    for (const q of text.comprehension) {
      if (q.options.length < 2) push(issues, 'ERROR', `${rScope}:${q.id}`, 'TOO_FEW_OPTIONS', 'Câu hỏi đọc hiểu cần ít nhất 2 phương án.');
      if (!q.options.includes(q.correctAnswer)) {
        push(issues, 'ERROR', `${rScope}:${q.id}`, 'ANSWER_NOT_IN_OPTIONS', 'Đáp án đúng phải nằm trong options.');
      }
      if (new Set(q.options).size !== q.options.length) {
        push(issues, 'ERROR', `${rScope}:${q.id}`, 'DUPLICATE_OPTIONS', 'Phương án bị trùng nhau.');
      }
      if (!q.explanation.trim()) push(issues, 'WARNING', `${rScope}:${q.id}`, 'MISSING_EXPLANATION', 'Câu hỏi thiếu giải thích.');
    }
  }

  // ---- lessons ----
  const seenLessons = new Set<string>();
  for (const lesson of unit.lessons) {
    if (seenLessons.has(lesson.id)) push(issues, 'ERROR', `${scope}:lesson:${lesson.id}`, 'DUPLICATE_LESSON_ID', 'Bài học bị trùng id.');
    seenLessons.add(lesson.id);
    if (!lesson.learningObjective.trim()) {
      push(issues, 'WARNING', `${scope}:lesson:${lesson.id}`, 'MISSING_OBJECTIVE', 'Bài học chưa có mục tiêu học tập.');
    }
  }

  // ---- generated activities (§28: audio fallback + explanation + time) ----
  const activities = buildUnitActivities(unit);
  for (const activity of activities) {
    for (const problem of validateActivityItems(activity)) {
      push(issues, 'ERROR', `kidbox:activity:${activity.id}`, problem, `Hoạt động "${activity.id}" không hợp lệ (${problem}).`);
    }
    if (activity.estimatedSeconds < KIDBOX_POLICY.MIN_ESTIMATED_SECONDS) {
      push(issues, 'WARNING', `kidbox:activity:${activity.id}`, 'BAD_ESTIMATE', 'Thời lượng ước tính quá ngắn.');
    }
  }

  return activities;
}

/** Full Kid's Box content audit (§28). */
export function runKidBoxContentValidation(): KidBoxValidationReport {
  const issues: KidBoxValidationIssue[] = [];
  const course = getKidBoxCourse();
  const contentStatus: KidBoxValidationReport['contentStatus'] = {};

  let vocabulary = 0;
  let phonics = 0;
  let patterns = 0;
  let readingTexts = 0;
  let lessons = 0;
  let activities = 0;

  const unitIds = new Set<string>();
  for (const unit of course.units) {
    if (unitIds.has(unit.id)) {
      push(issues, 'ERROR', `kidbox:unit:${unit.id}`, 'DUPLICATE_UNIT_ID', 'Unit bị trùng id.');
    }
    unitIds.add(unit.id);
    contentStatus[unit.id] = unit.contentStatus;
    vocabulary += unit.vocabulary.length;
    phonics += unit.phonics.length;
    patterns += unit.patterns.length;
    readingTexts += unit.readingTexts.length;
    lessons += unit.lessons.length;
    activities += validateUnit(unit, issues).length;
  }

  const errors = issues.filter((i) => i.severity === 'ERROR').length;
  const warnings = issues.filter((i) => i.severity === 'WARNING').length;

  return {
    schemaVersion: KIDBOX_SCHEMA_VERSION,
    courseId: course.courseId,
    totals: {
      units: course.units.length,
      lessons,
      vocabulary,
      phonics,
      patterns,
      readingTexts,
      activities,
      errors,
      warnings,
    },
    issues,
    contentStatus,
  };
}

/** Human-readable summary for the docs and the dev diagnostics panel. */
export function formatKidBoxValidationReport(report: KidBoxValidationReport): string {
  const lines: string[] = [];
  lines.push(`Kid's Box content schema: ${report.schemaVersion}`);
  lines.push(
    `Units: ${report.totals.units} | Vocabulary: ${report.totals.vocabulary} | Phonics: ${report.totals.phonics} | Patterns: ${report.totals.patterns} | Reading: ${report.totals.readingTexts} | Activities: ${report.totals.activities}`
  );
  lines.push(`ERROR: ${report.totals.errors} | WARNING: ${report.totals.warnings}`);
  const statuses = Object.entries(report.contentStatus);
  for (const [unitId, status] of statuses) lines.push(`Content status ${unitId}: ${status}`);
  for (const issue of report.issues) lines.push(`[${issue.severity}] ${issue.scope} ${issue.code}: ${issue.message}`);
  return lines.join('\n');
}
