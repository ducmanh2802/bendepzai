import { describe, it, expect } from 'vitest';
import { ENGLISH_TOPICS } from '../src/data/englishCurriculum';
import { getAllSkills } from '../src/data/curriculum';
import { KIDBOX_SKILLS, isKidBoxSkillId, getKidBoxSkillName } from '../src/data/kidBoxTaxonomy';
import {
  KIDBOX_BRIDGE_UNIT_ID,
  KIDBOX_COURSE_ID,
  getKidBoxContentReadiness,
  getKidBoxCourse,
  getKidBoxUnitLabel,
  getMappedKidBoxUnits,
} from '../src/data/kidBoxCurriculum';
import { BRIDGE_VOCABULARY } from '../src/data/kidBoxBridgePack';
import { ingestKidBoxSource, parseKidBoxSourceJson } from '../src/data/kidBoxIngest';
import { buildUnitActivities } from '../src/services/kidBoxActivities';
import { runKidBoxContentValidation } from '../src/services/kidBoxValidator';
import { KIDBOX_POLICY } from '../src/config/policy';
import { COMPETITION_SKILLS } from '../src/data/competitionTaxonomy';
import { EXAM_BLUEPRINTS } from '../src/data/competitionBlueprints';
import { COMPETITION_QUESTIONS } from '../src/data/competitionQuestions';

describe("Kid's Box Companion — curriculum mapping & content validation (§4, §27, §28, §39)", () => {
  const course = getKidBoxCourse();

  it('registers the British English course shell without inventing textbook units', () => {
    expect(course.courseId).toBe(KIDBOX_COURSE_ID);
    expect(course.variant).toBe('BRITISH_ENGLISH');
    expect(course.locale).toBe('en-GB');
    expect(course.levels.map((l) => l.levelId)).toEqual(['LEVEL_1']);

    // §39 — no unit may claim verified textbook content while no source exists.
    expect(getMappedKidBoxUnits()).toEqual([]);
    expect(getKidBoxContentReadiness().status).toBe('CONTENT_SOURCE_REQUIRED');
    for (const artifact of course.requiredArtifacts) {
      expect(artifact.label.length).toBeGreaterThan(10);
      expect(artifact.unlocks.length).toBeGreaterThan(10);
    }
  });

  it('labels the bridge pack honestly instead of passing it off as a textbook unit', () => {
    const bridge = course.units.find((u) => u.id === KIDBOX_BRIDGE_UNIT_ID)!;
    expect(bridge.sourceType).toBe('APP_BRIDGE');
    expect(bridge.mappingNote).toContain('KHÔNG phải nội dung giáo trình');
    expect(getKidBoxUnitLabel(bridge)).toContain('Luyện tập nền');
  });

  it('reuses only vocabulary that already ships inside the app English curriculum', () => {
    const existing = new Set<string>();
    const collect = (text: string) => {
      for (const token of text.toLowerCase().split(/[^a-z']+/)) {
        if (token.length > 1) existing.add(token);
      }
    };
    for (const topic of ENGLISH_TOPICS) {
      collect(topic.title);
      collect(topic.subtitle);
      for (const lesson of topic.lessons) {
        for (const q of lesson.questions) {
          collect(q.prompt);
          (q.options ?? []).forEach(collect);
        }
      }
    }

    // If this fails, the bridge pack started fabricating content (§2/§39).
    // A singular/plural variant of an existing word is the same content, which
    // is why the body-part words (eye/eyes) are accepted.
    for (const v of BRIDGE_VOCABULARY) {
      const lower = v.word.toLowerCase();
      const covered = lower
        .split(' ')
        .every((token) => existing.has(token) || existing.has(`${token}s`));
      expect({ word: v.word, covered }).toEqual({ word: v.word, covered: true });
    }
  });

  it('extends the existing skill taxonomy instead of creating a second one (§8)', () => {
    const catalogue = getAllSkills();
    for (const skill of KIDBOX_SKILLS) {
      const found = catalogue.find((s) => s.skillId === skill.skillId);
      expect(found, `thiếu skill ${skill.skillId} trong getAllSkills()`).toBeDefined();
      expect(found!.subject).toBe('english');
      expect(isKidBoxSkillId(skill.skillId)).toBe(true);
    }
    // §8 — Level 1 must stay light on grammar.
    expect(KIDBOX_SKILLS.filter((s) => s.strand === 'LANGUAGE_USE').length).toBeLessThanOrEqual(2);
  });

  it('never lets Kid\u2019s Box skills leak into the Vietnamese competition track (§26)', () => {
    const competitionSkillIds = COMPETITION_SKILLS.map((s) => s.skillId);
    for (const skill of KIDBOX_SKILLS) {
      expect(competitionSkillIds).not.toContain(skill.skillId);
    }
    for (const q of COMPETITION_QUESTIONS) {
      expect(isKidBoxSkillId(q.skillId)).toBe(false);
    }
    for (const bp of EXAM_BLUEPRINTS) {
      const referenced = [
        ...(bp.sections ?? []).flatMap((s) => s.skillIds),
        ...Object.keys(bp.skillDistribution ?? {}),
      ];
      for (const skillId of referenced) {
        expect(isKidBoxSkillId(skillId)).toBe(false);
      }
    }
    expect(KIDBOX_POLICY.COMPETITION_EXCLUDED).toBe(true);
  });

  it('passes the content validation gate with zero errors (§28)', () => {
    const report = runKidBoxContentValidation();
    const errors = report.issues.filter((i) => i.severity === 'ERROR');
    if (errors.length > 0) {
      throw new Error(
        `Kid's Box content errors:\n${errors.map((e) => `  [${e.scope}] ${e.code}: ${e.message}`).join('\n')}`
      );
    }
    expect(errors).toEqual([]);
    expect(report.totals.activities).toBeGreaterThan(0);
    expect(report.totals.vocabulary).toBeGreaterThan(0);
  });

  it('maps every content item onto an existing skill id and British English metadata', () => {
    for (const unit of course.units) {
      expect(unit.britishEnglish).toBe('en-GB');
      for (const item of [
        ...unit.vocabulary,
        ...unit.phonics,
        ...unit.patterns,
        ...unit.readingTexts,
      ]) {
        expect(isKidBoxSkillId(item.skillId)).toBe(true);
        expect(item.unitId).toBe(unit.id);
        expect(item.estimatedSeconds).toBeGreaterThanOrEqual(KIDBOX_POLICY.MIN_ESTIMATED_SECONDS);
        expect(item.estimatedSeconds).toBeLessThanOrEqual(KIDBOX_POLICY.MAX_ESTIMATED_SECONDS);
      }
    }
  });

  it('derives activities from unit content only, never from hardcoded UI logic (§4)', () => {
    const bridge = course.units.find((u) => u.id === KIDBOX_BRIDGE_UNIT_ID)!;
    const activities = buildUnitActivities(bridge);
    expect(activities.length).toBeGreaterThan(0);

    const ids = new Set(activities.map((a) => a.id));
    expect(ids.size).toBe(activities.length);
    for (const activity of activities) {
      expect(activity.britishEnglish).toBe('en-GB');
      expect(activity.instructionEn.length).toBeGreaterThan(0);
      expect(activity.instructionVi.length).toBeGreaterThan(0);
      expect(activity.explanation.length).toBeGreaterThan(0);
      expect(activity.allowReplay).toBe(true);
      expect(activity.previewable).toBe(true);
    }

    // A unit with no content produces no activities at all (nothing invented).
    const emptyUnit = { ...bridge, vocabulary: [], phonics: [], patterns: [], readingTexts: [] };
    expect(buildUnitActivities(emptyUnit)).toEqual([]);
  });

  it('gives every Kid\u2019s Box skill a human-friendly name', () => {
    for (const skill of KIDBOX_SKILLS) {
      expect(getKidBoxSkillName(skill.skillId)).toBe(skill.skillName);
      expect(skill.skillName.length).toBeGreaterThan(3);
    }
  });
});

describe("Kid's Box Companion — content ingestion (§27)", () => {
  const packet = {
    artifactId: 'unit-word-lists',
    units: [
      {
        unitRef: '1',
        title: 'Unit 1 (mapped from teacher notes)',
        topic: 'SCHOOL',
        learningObjectives: ['Gọi tên đồ dùng học tập'],
        lessons: [{ title: 'My school things', learningObjective: 'Nhận diện đồ dùng học tập' }],
        vocabulary: [
          { word: 'book', meaningVi: 'sách', pictureEmoji: '📕', topic: 'SCHOOL' },
          // Intentionally American: the mapper must flag it, never convert it.
          { word: 'color', meaningVi: 'màu', pictureEmoji: '🎨', topic: 'SCHOOL' },
        ],
        phonics: [{ focusSound: 'sh', exampleWord: 'ship', exampleEmoji: '🚢' }],
        patterns: [{ pattern: 'It is a book.', question: 'What is this?', suggestedAnswer: 'It is a book.' }],
        readingTexts: [{ text: 'This is my book.', textVi: 'Đây là sách của tôi.' }],
      },
    ],
  };

  it('maps supplied material without inventing anything', () => {
    const report = ingestKidBoxSource(packet);
    expect(report.ok).toBe(true);
    expect(report.unitsAccepted).toBe(1);

    const unit = report.units[0];
    expect(unit.title).toBe('Unit 1 (mapped from teacher notes)');
    expect(unit.contentStatus).toBe('READY');
    expect(unit.vocabulary).toHaveLength(2);
    expect(unit.vocabulary[0].skillId).toBe('EN-VOCAB-RECOGNITION');
    expect(unit.phonics[0].skillId).toBe('EN-PHONICS-SOUND');
    expect(unit.patterns[0].skillId).toBe('EN-LANGUAGE-PATTERN');
    expect(unit.missingContent).toEqual([]);
  });

  it('flags American spellings for a human instead of silently converting them (§7)', () => {
    const report = ingestKidBoxSource(packet);
    const usSpelling = report.issues.find((i) => i.code === 'US_SPELLING');
    expect(usSpelling).toBeDefined();
    expect(usSpelling!.message).toContain('colour');
  });

  it('reports missing content and downgrades the unit instead of filling the gaps (§39)', () => {
    const report = ingestKidBoxSource({
      units: [{ unitRef: '9', learningObjectives: [], vocabulary: [{ word: 'kite', meaningVi: 'diều' }] }],
    });
    const unit = report.units[0];
    expect(unit.contentStatus).toBe('PARTIAL');
    expect(unit.missingContent).toContain('Bảng âm (phonics) của Unit.');
    expect(unit.missingContent).toContain('Mẫu câu của Unit.');
    // No title was supplied, so none is invented.
    expect(unit.title).toBeUndefined();
    expect(getKidBoxUnitLabel(unit)).toContain('chưa có nội dung nguồn');
  });

  it('rejects an empty packet instead of producing empty units', () => {
    const report = ingestKidBoxSource({ units: [] });
    expect(report.ok).toBe(false);
    expect(report.units).toEqual([]);
    expect(report.issues[0].code).toBe('EMPTY_PACKET');
  });

  it('reports invalid JSON without throwing', () => {
    const report = parseKidBoxSourceJson('{not json');
    expect(report.ok).toBe(false);
    expect(report.issues[0].code).toBe('INVALID_JSON');
  });
});
