import {
  KIDBOX_LOCALE,
  KidBoxContentStatus,
  KidBoxCourse,
  KidBoxLanguagePattern,
  KidBoxPhonics,
  KidBoxReadingLevel,
  KidBoxReadingText,
  KidBoxReadingComprehension,
  KidBoxSkillId,
  KidBoxSourceType,
  KidBoxUnit,
  KidBoxValidationIssue,
  KidBoxVocabulary,
} from '../types/kidBox';
import { isKidBoxSkillId, KIDBOX_SKILLS } from './kidBoxTaxonomy';
import { KIDBOX_COURSE_ID, KIDBOX_LEVEL_ID, KIDBOX_SCHEMA_VERSION } from './kidBoxCurriculum';
import { localDateKey } from '../services/dateUtils';

/**
 * §27 CONTENT INGESTION — mapping workflow for teacher / parent supplied source
 * material.
 *
 * Design rules:
 *  - The mapper only *translates* supplied material into the app's schema. It
 *    never invents a unit title, a word or a phonics entry (§39).
 *  - Anything the packet does not provide is reported in `missingContent` and
 *    downgrades the unit's `contentStatus` instead of being silently filled.
 *  - Skill defaults are declared explicitly below so the mapping decision is
 *    auditable, not implicit.
 *  - §7 British English: US spellings are surfaced as a warning, never silently
 *    converted, so a human decides.
 */

/* ------------------------------------------------------------------ */
/* INPUT SHAPE (what a teacher / parent can hand over)                  */
/* ------------------------------------------------------------------ */

export interface KidBoxSourceVocabularyEntry {
  word: string;
  meaningVi?: string;
  pictureEmoji?: string;
  topic?: string;
  skillId?: string;
  difficulty?: 1 | 2 | 3;
  examplePattern?: string;
}

export interface KidBoxSourcePhonicsEntry {
  focusSound: string;
  grapheme?: string;
  exampleWord: string;
  exampleEmoji?: string;
  contrastWord?: string;
  skillId?: string;
  difficulty?: 1 | 2 | 3;
}

export interface KidBoxSourcePatternEntry {
  pattern: string;
  meaningVi?: string;
  question?: string;
  suggestedAnswer?: string;
  slots?: string[];
  pictureEmoji?: string;
  skillId?: string;
  difficulty?: 1 | 2 | 3;
}

export interface KidBoxSourceReadingEntry {
  text: string;
  textVi?: string;
  level?: KidBoxReadingLevel;
  skillId?: string;
  difficulty?: 1 | 2 | 3;
  comprehension?: {
    prompt: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }[];
}

export interface KidBoxSourceLessonEntry {
  title: string;
  learningObjective?: string;
  skills?: string[];
}

export interface KidBoxSourceUnitPacket {
  /** Anything the teacher calls the unit: "1", "unit-1", "Unit 1". */
  unitRef: string;
  title?: string;
  topic?: string;
  learningObjectives?: string[];
  lessons?: KidBoxSourceLessonEntry[];
  vocabulary?: KidBoxSourceVocabularyEntry[];
  phonics?: KidBoxSourcePhonicsEntry[];
  patterns?: KidBoxSourcePatternEntry[];
  readingTexts?: KidBoxSourceReadingEntry[];
  /** Free-text provenance, e.g. "photo bảng từ vựng Unit 1, giáo viên chụp". */
  sourceNote?: string;
  sourceType?: KidBoxSourceType;
}

export interface KidBoxSourcePacket {
  units: KidBoxSourceUnitPacket[];
  /** Which required artifact this packet satisfies (§27). */
  artifactId?: string;
  suppliedBy?: string;
}

export interface KidBoxIngestReport {
  ok: boolean;
  /** Units that are safe to publish (errors would keep `ok` false). */
  units: KidBoxUnit[];
  issues: KidBoxValidationIssue[];
  /** Plain-language list of what the packet still did not provide. */
  missingContent: string[];
  artifactId: string;
  unitsAccepted: number;
  unitsRejected: number;
}

/* ------------------------------------------------------------------ */
/* DECLARED MAPPING DEFAULTS                                            */
/* ------------------------------------------------------------------ */

/** Which skill an item contributes evidence to when the source omits it. */
export const KIDBOX_MAPPING_DEFAULTS = {
  vocabulary: 'EN-VOCAB-RECOGNITION',
  phonics: 'EN-PHONICS-SOUND',
  pattern: 'EN-LANGUAGE-PATTERN',
  reading: 'EN-READING-COMPREHENSION',
} as const satisfies Record<string, KidBoxSkillId>;

/** §7 — spelling hints that must be reviewed by a human, not auto-converted. */
const US_SPELLING_HINTS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /\bcolor\b/i, suggestion: 'colour' },
  { pattern: /\bcolors\b/i, suggestion: 'colours' },
  { pattern: /\bfavorite\b/i, suggestion: 'favourite' },
  { pattern: /\bcenter\b/i, suggestion: 'centre' },
  { pattern: /\bgray\b/i, suggestion: 'grey' },
  { pattern: /\btruck\b/i, suggestion: 'lorry' },
  { pattern: /\bvacation\b/i, suggestion: 'holiday' },
];

/* ------------------------------------------------------------------ */
/* HELPERS                                                              */
/* ------------------------------------------------------------------ */

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clampDifficulty(value: unknown, fallback: 1 | 2 | 3 = 1): 1 | 2 | 3 {
  if (value === 1 || value === 2 || value === 3) return value;
  return fallback;
}

function normaliseISODate(input: unknown): string {
  if (typeof input !== 'string') return localDateKey();
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return localDateKey();
  return localDateKey(parsed);
}

/* ------------------------------------------------------------------ */
/* MAPPING                                                              */
/* ------------------------------------------------------------------ */

function mapVocabulary(
  entries: KidBoxSourceVocabularyEntry[],
  unitId: string,
  sourceType: KidBoxSourceType,
  issues: KidBoxValidationIssue[],
): KidBoxVocabulary[] {
  return entries.map((entry, idx) => {
    const scope = `kidbox-ingest:${unitId}:vocab:${entry.word || idx}`;
    const skillId: KidBoxSkillId =
      entry.skillId && isKidBoxSkillId(entry.skillId)
        ? entry.skillId
        : KIDBOX_MAPPING_DEFAULTS.vocabulary;

    if (entry.skillId && !isKidBoxSkillId(entry.skillId)) {
      issues.push({
        severity: 'WARNING',
        scope,
        code: 'UNKNOWN_SKILL_FALLBACK',
        message: `skillId "${entry.skillId}" không có trong taxonomy; dùng mặc định ${KIDBOX_MAPPING_DEFAULTS.vocabulary}.`,
      });
    }

    if (!entry.word?.trim()) {
      issues.push({
        severity: 'ERROR',
        scope,
        code: 'MISSING_WORD',
        message: 'Từ vựng thiếu nội dung.',
      });
    }

    for (const hint of US_SPELLING_HINTS) {
      if (hint.pattern.test(entry.word ?? '')) {
        issues.push({
          severity: 'WARNING',
          scope,
          code: 'US_SPELLING',
          message: `"${entry.word}" có vẻ dùng chính tả Mỹ. British English thường dùng "${hint.suggestion}". Cần người có chứng chỉ kiểm tra lại.`,
        });
      }
    }

    if (!entry.meaningVi?.trim()) {
      issues.push({
        severity: 'WARNING',
        scope,
        code: 'MISSING_MEANING',
        message: `Từ "${entry.word}" chưa có nghĩa tiếng Việt.`,
      });
    }

    return {
      kind: 'VOCABULARY',
      id: `${unitId}-v${idx + 1}`,
      unitId,
      word: (entry.word ?? '').trim(),
      meaningVi: (entry.meaningVi ?? '').trim(),
      pictureEmoji: entry.pictureEmoji,
      speakText: (entry.word ?? '').trim(),
      topic: entry.topic ?? 'GENERAL',
      examplePattern: entry.examplePattern,
      skillId,
      difficulty: clampDifficulty(entry.difficulty),
      britishEnglish: KIDBOX_LOCALE,
      sourceType,
      estimatedSeconds: 20,
    } satisfies KidBoxVocabulary;
  });
}

function mapPhonics(
  entries: KidBoxSourcePhonicsEntry[],
  unitId: string,
  sourceType: KidBoxSourceType,
  issues: KidBoxValidationIssue[],
): KidBoxPhonics[] {
  return entries.map((entry, idx) => {
    const scope = `kidbox-ingest:${unitId}:phonics:${entry.exampleWord || idx}`;
    const skillId: KidBoxSkillId =
      entry.skillId && isKidBoxSkillId(entry.skillId)
        ? entry.skillId
        : KIDBOX_MAPPING_DEFAULTS.phonics;

    if (!entry.focusSound?.trim()) {
      issues.push({
        severity: 'ERROR',
        scope,
        code: 'MISSING_SOUND',
        message: 'Mục phonics thiếu âm thanh.',
      });
    }

    return {
      kind: 'PHONICS',
      id: `${unitId}-p${idx + 1}`,
      unitId,
      focusSound: (entry.focusSound ?? '').trim(),
      grapheme: (entry.grapheme ?? entry.focusSound ?? '').trim(),
      exampleWord: (entry.exampleWord ?? '').trim(),
      exampleEmoji: entry.exampleEmoji,
      contrastWord: entry.contrastWord,
      skillId,
      difficulty: clampDifficulty(entry.difficulty),
      britishEnglish: KIDBOX_LOCALE,
      sourceType,
      estimatedSeconds: 25,
    } satisfies KidBoxPhonics;
  });
}

function mapPatterns(
  entries: KidBoxSourcePatternEntry[],
  unitId: string,
  sourceType: KidBoxSourceType,
  issues: KidBoxValidationIssue[],
): KidBoxLanguagePattern[] {
  return entries.map((entry, idx) => {
    const scope = `kidbox-ingest:${unitId}:pattern:${entry.pattern || idx}`;
    const skillId: KidBoxSkillId =
      entry.skillId && isKidBoxSkillId(entry.skillId)
        ? entry.skillId
        : KIDBOX_MAPPING_DEFAULTS.pattern;

    if (!entry.pattern?.trim()) {
      issues.push({
        severity: 'ERROR',
        scope,
        code: 'MISSING_PATTERN',
        message: 'Mẫu câu thiếu nội dung.',
      });
    }

    return {
      kind: 'PATTERN',
      id: `${unitId}-t${idx + 1}`,
      unitId,
      pattern: (entry.pattern ?? '').trim(),
      meaningVi: (entry.meaningVi ?? '').trim(),
      question: (entry.question ?? entry.pattern ?? '').trim(),
      suggestedAnswer: (entry.suggestedAnswer ?? '').trim(),
      slots: (entry.slots ?? []).filter((s) => typeof s === 'string' && s.trim().length > 0),
      pictureEmoji: entry.pictureEmoji,
      skillId,
      difficulty: clampDifficulty(entry.difficulty),
      britishEnglish: KIDBOX_LOCALE,
      sourceType,
      estimatedSeconds: 30,
    } satisfies KidBoxLanguagePattern;
  });
}

function mapReading(
  entries: KidBoxSourceReadingEntry[],
  unitId: string,
  sourceType: KidBoxSourceType,
  issues: KidBoxValidationIssue[],
): KidBoxReadingText[] {
  return entries.map((entry, idx) => {
    const scope = `kidbox-ingest:${unitId}:reading:${entry.text?.slice(0, 24) || idx}`;
    const skillId: KidBoxSkillId =
      entry.skillId && isKidBoxSkillId(entry.skillId)
        ? entry.skillId
        : KIDBOX_MAPPING_DEFAULTS.reading;

    const text = (entry.text ?? '').trim();
    const wordCount = text.length === 0 ? 0 : text.split(/\s+/).length;

    if (wordCount === 0) {
      issues.push({ severity: 'ERROR', scope, code: 'EMPTY_TEXT', message: 'Bài đọc thiếu nội dung.' });
    }

    const comprehension: KidBoxReadingComprehension[] = (entry.comprehension ?? []).map((c, cIdx) => {
      const cScope = `${scope}:q${cIdx + 1}`;
      const options = Array.isArray(c.options) ? c.options.filter((o) => typeof o === 'string') : [];

      if (options.length < 2) {
        issues.push({
          severity: 'ERROR',
          scope: cScope,
          code: 'TOO_FEW_OPTIONS',
          message: 'Câu hỏi đọc hiểu cần ít nhất 2 phương án.',
        });
      }
      if (!options.includes(c.correctAnswer)) {
        issues.push({
          severity: 'ERROR',
          scope: cScope,
          code: 'ANSWER_NOT_IN_OPTIONS',
          message: 'Đáp án đúng phải nằm trong danh sách phương án.',
        });
      }
      if (!c.explanation?.trim()) {
        issues.push({
          severity: 'WARNING',
          scope: cScope,
          code: 'MISSING_EXPLANATION',
          message: 'Câu hỏi đọc hiểu nên có giải thích cho phụ huynh.',
        });
      }

      return {
        id: `${unitId}-r${idx + 1}-q${cIdx + 1}`,
        prompt: c.prompt ?? '',
        options,
        correctAnswer: c.correctAnswer ?? '',
        explanation: (c.explanation ?? '').trim(),
      } satisfies KidBoxReadingComprehension;
    });

    return {
      kind: 'READING',
      id: `${unitId}-r${idx + 1}`,
      unitId,
      level: entry.level ?? (wordCount <= 4 ? 'WORD' : wordCount <= 8 ? 'PHRASE' : wordCount <= 14 ? 'SENTENCE' : 'SHORT_TEXT'),
      text,
      textVi: (entry.textVi ?? '').trim(),
      wordCount,
      comprehension,
      skillId,
      difficulty: clampDifficulty(entry.difficulty, 2),
      britishEnglish: KIDBOX_LOCALE,
      sourceType,
      estimatedSeconds: Math.min(90, Math.max(20, wordCount * 2)),
    } satisfies KidBoxReadingText;
  });
}

/**
 * Derives a `contentStatus` from what the packet actually provided.
 * READY requires every content family the app can teach; anything less is
 * PARTIAL, and an empty unit stays `CONTENT_SOURCE_REQUIRED`.
 */
function deriveContentStatus(unit: KidBoxUnit): KidBoxContentStatus {
  const families = [
    unit.vocabulary.length > 0,
    unit.phonics.length > 0,
    unit.patterns.length > 0,
    unit.readingTexts.length > 0,
    unit.lessons.length > 0,
  ];
  if (families.every(Boolean)) return 'READY';
  if (families.some(Boolean)) return 'PARTIAL';
  return 'CONTENT_SOURCE_REQUIRED';
}

/**
 * Maps one supplied packet into a `KidBoxUnit`. Pure: it never mutates the
 * course and never touches storage, so it can be unit-tested and re-run.
 */
export function ingestKidBoxUnit(
  packet: KidBoxSourceUnitPacket,
  index: number,
  issues: KidBoxValidationIssue[]
): KidBoxUnit {
  const unitId = `kb-${slug(packet.unitRef) || `unit-${index + 1}`}`;
  const sourceType: KidBoxSourceType = packet.sourceType ?? 'TEACHER_NOTES';
  const scope = `kidbox-ingest:${unitId}`;

  const vocabulary = mapVocabulary(packet.vocabulary ?? [], unitId, sourceType, issues);
  const phonics = mapPhonics(packet.phonics ?? [], unitId, sourceType, issues);
  const patterns = mapPatterns(packet.patterns ?? [], unitId, sourceType, issues);
  const readingTexts = mapReading(packet.readingTexts ?? [], unitId, sourceType, issues);

  if (!packet.title?.trim()) {
    issues.push({
      severity: 'WARNING',
      scope,
      code: 'MISSING_UNIT_TITLE',
      message:
        'Chưa có tiêu đề Unit trong nguồn. Ứng dụng sẽ hiển thị "Unit N (chưa có nội dung nguồn)" thay vì tự đặt tên.',
    });
  }

  const lessons = (packet.lessons ?? []).map((lesson, lessonIdx) => {
    const skills = (lesson.skills ?? []).filter(isKidBoxSkillId);
    if (!lesson.learningObjective?.trim()) {
      issues.push({
        severity: 'WARNING',
        scope: `${scope}:lesson${lessonIdx + 1}`,
        code: 'MISSING_LEARNING_OBJECTIVE',
        message: `Bài "${lesson.title}" chưa có mục tiêu học tập.`,
      });
    }
    return {
      id: `${unitId}-l${lessonIdx + 1}`,
      unitId,
      index: lessonIdx + 1,
      title: lesson.title,
      learningObjective: lesson.learningObjective ?? '',
      skills: skills.length > 0 ? skills : [KIDBOX_MAPPING_DEFAULTS.vocabulary],
      mascotTip: 'Nghe kỹ rồi làm theo nhé, bé làm được!',
    };
  });

  const skills = Array.from(
    new Set<KidBoxSkillId>([
      ...vocabulary.map((v) => v.skillId),
      ...phonics.map((p) => p.skillId),
      ...patterns.map((p) => p.skillId),
      ...readingTexts.map((r) => r.skillId),
    ])
  );

  const missingContent: string[] = [];
  if (vocabulary.length === 0) missingContent.push('Danh sách từ vựng của Unit.');
  if (phonics.length === 0) missingContent.push('Bảng âm (phonics) của Unit.');
  if (patterns.length === 0) missingContent.push('Mẫu câu của Unit.');
  if (readingTexts.length === 0) missingContent.push('Gợi ý bài đọc của Unit.');
  if (lessons.length === 0) missingContent.push('Danh sách bài (lesson) của Unit.');

  const unit: KidBoxUnit = {
    id: unitId,
    courseId: KIDBOX_COURSE_ID,
    levelId: KIDBOX_LEVEL_ID,
    index: index + 1,
    title: packet.title?.trim() || undefined,
    topicLabel: packet.topic?.trim() || undefined,
    sourceType,
    contentStatus: 'CONTENT_SOURCE_REQUIRED',
    britishEnglish: KIDBOX_LOCALE,
    learningObjectives: (packet.learningObjectives ?? []).map((o) => o.trim()).filter(Boolean),
    skills: skills.length > 0 ? skills : [KIDBOX_MAPPING_DEFAULTS.vocabulary],
    lessons,
    vocabulary,
    phonics,
    patterns,
    readingTexts,
    missingContent,
    mappingNote: packet.sourceNote?.trim() || undefined,
  };

  unit.contentStatus = deriveContentStatus(unit);

  if (unit.learningObjectives.length === 0) {
    issues.push({
      severity: 'WARNING',
      scope,
      code: 'MISSING_LEARNING_OBJECTIVES',
      message: 'Unit chưa có mục tiêu học tập nào được cung cấp.',
    });
  }

  return unit;
}

/**
 * Maps a whole packet. Returns both the mapped units and everything that is
 * still missing, so the caller can publish only what is safe and show the rest.
 */
export function ingestKidBoxSource(packet: KidBoxSourcePacket): KidBoxIngestReport {
  const issues: KidBoxValidationIssue[] = [];
  const missingContent = new Set<string>();

  if (!packet || !Array.isArray(packet.units) || packet.units.length === 0) {
    issues.push({
      severity: 'ERROR',
      scope: 'kidbox-ingest',
      code: 'EMPTY_PACKET',
      message: 'Gói nguồn không có Unit nào. Không thể ánh xạ nội dung.',
    });
    return {
      ok: false,
      units: [],
      issues,
      missingContent: ['Bảng mục lục và nội dung ít nhất một Unit.'],
      artifactId: packet?.artifactId ?? 'unknown',
      unitsAccepted: 0,
      unitsRejected: 0,
    };
  }

  const units = packet.units.map((unitPacket, idx) => {
    const unitIssues: KidBoxValidationIssue[] = [];
    const unit = ingestKidBoxUnit(unitPacket, idx, unitIssues);
    issues.push(...unitIssues);
    unit.missingContent.forEach((m) => missingContent.add(m));

    const hasErrors = unitIssues.some((i) => i.severity === 'ERROR');
    if (hasErrors) {
      unit.contentStatus = 'CONTENT_SOURCE_REQUIRED';
    }
    return unit;
  });

  const seenIds = new Set<string>();
  for (const unit of units) {
    if (seenIds.has(unit.id)) {
      issues.push({
        severity: 'ERROR',
        scope: `kidbox-ingest:${unit.id}`,
        code: 'DUPLICATE_UNIT_ID',
        message: `unitId "${unit.id}" bị trùng trong gói nguồn.`,
      });
    }
    seenIds.add(unit.id);
  }

  const unitsAccepted = units.filter((u) => u.contentStatus !== 'CONTENT_SOURCE_REQUIRED').length;
  const unitsRejected = units.length - unitsAccepted;

  return {
    ok: !issues.some((i) => i.severity === 'ERROR') && unitsAccepted > 0,
    units,
    issues,
    missingContent: Array.from(missingContent),
    artifactId: packet.artifactId ?? 'unknown',
    unitsAccepted,
    unitsRejected,
  };
}

/** Convenience for the parent panel: paste JSON, get a validated mapping. */
export function parseKidBoxSourceJson(raw: string): KidBoxIngestReport {
  try {
    const parsed = JSON.parse(raw) as KidBoxSourcePacket;
    return ingestKidBoxSource(parsed);
  } catch (error) {
    return {
      ok: false,
      units: [],
      issues: [
        {
          severity: 'ERROR',
          scope: 'kidbox-ingest',
          code: 'INVALID_JSON',
          message: `Không đọc được JSON: ${error instanceof Error ? error.message : 'lỗi không xác định'}.`,
        },
      ],
      missingContent: [],
      artifactId: 'unknown',
      unitsAccepted: 0,
      unitsRejected: 0,
    };
  }
}

/** True when a course holds at least one unit mapped from a real source. */
export function hasMappedSourceContent(course: KidBoxCourse): boolean {
  return course.units.some((u) => u.sourceType !== 'APP_BRIDGE' && u.contentStatus !== 'CONTENT_SOURCE_REQUIRED');
}

/** Exposed for docs and the parent panel: the mapping default table. */
export function describeMappingDefaults(): { artifact: string; defaultSkillId: KidBoxSkillId }[] {
  return [
    { artifact: 'vocabulary', defaultSkillId: KIDBOX_MAPPING_DEFAULTS.vocabulary },
    { artifact: 'phonics', defaultSkillId: KIDBOX_MAPPING_DEFAULTS.phonics },
    { artifact: 'pattern', defaultSkillId: KIDBOX_MAPPING_DEFAULTS.pattern },
    { artifact: 'reading', defaultSkillId: KIDBOX_MAPPING_DEFAULTS.reading },
  ];
}

/** Every taxonomy skill id, for ingestion UIs that offer a picker. */
export function listMappableSkillIds(): KidBoxSkillId[] {
  return KIDBOX_SKILLS.map((s) => s.skillId);
}

/** Today, in the app's canonical day format. */
export function kidBoxToday(): string {
  return normaliseISODate(new Date());
}

export const KIDBOX_CONTENT_SCHEMA_VERSION = KIDBOX_SCHEMA_VERSION;
