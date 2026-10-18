import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill in-memory localStorage for the Node test runner.
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import { ReadingEngine } from '../src/services/readingEngine';
import { StorageService } from '../src/services/storage';
import { READING_POLICY } from '../src/config/policy';
import {
  READING_QUESTIONS,
  READING_PASSAGES,
  READING_SKILLS,
  READING_STAGE_ITEM_IDS,
  T13_PASSAGE_IDS,
  T13_THEMES,
  getReadingQuestionById,
  getPassagesByTheme,
} from '../src/data/readingContent';
import { containsBannedWord } from '../src/data/contentSafety';
import type { ReadingProfile, ReadingResponse, ReadingStage } from '../src/types/reading';

const STAGES: ReadingStage[] = [...READING_POLICY.STAGES];

function makeResponse(
  questionId: string,
  correct: boolean,
  responseTimeMs: number
): ReadingResponse {
  const q = getReadingQuestionById(questionId)!;
  return {
    questionId: q.id,
    skillId: q.skillId,
    questionType: q.questionType,
    difficulty: q.difficulty,
    correct,
    responseTimeMs,
    wordsProcessed:
      q.questionType === 'read-aloud' || q.questionType === 'phrase-repeat' ? q.wordCount : 0,
    hesitation: responseTimeMs > READING_POLICY.HESITATION_SECONDS * 1000,
    answeredAt: responseTimeMs,
  };
}

describe('Reading Fluency content contract (§6.1, §10)', () => {
  it('declares every taxonomy skill from the specification', () => {
    const required = [
      'RF-WORD-RECOGNITION',
      'RF-SYLLABLE-FLUENCY',
      'RF-PHRASE-FLUENCY',
      'RF-SENTENCE-FLUENCY',
      'RF-READ-ALOUD-ACCURACY',
      'RF-READ-ALOUD-SPEED',
      'RF-PUNCTUATION-PAUSE',
      'RF-READING-COMPREHENSION',
      'RF-KEYWORD-FINDING',
      'RF-QUESTION-UNDERSTANDING',
      'RF-ANSWER-SELECTION-SPEED',
    ];
    const ids = READING_SKILLS.map((s) => s.skillId);
    for (const id of required) expect(ids).toContain(id);
  });

  it('gives every reading item a skillId, type, options, answer and explanation', () => {
    const validSkillIds = new Set(READING_SKILLS.map((s) => s.skillId));
    for (const q of READING_QUESTIONS) {
      expect(validSkillIds.has(q.skillId)).toBe(true);
      expect(q.questionType.length).toBeGreaterThan(0);
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options).toContain(q.correctAnswer);
      expect(q.wordCount).toBeGreaterThan(0);
      expect(q.estimatedSeconds).toBeGreaterThan(0);
    }
  });

  it('assigns at least one item to every ladder stage that needs coverage', () => {
    for (const stage of STAGES) {
      expect(READING_STAGE_ITEM_IDS[stage].length).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers all six comprehension question types', () => {
    const kinds = new Set(
      READING_QUESTIONS.map((q) => String(q.questionType)).filter((t) => t.startsWith('comprehension-'))
    );
    for (const t of ['who', 'what', 'where', 'when', 'why', 'how']) {
      expect(kinds.has(`comprehension-${t}`)).toBe(true);
    }
  });
});

describe('Reading Fluency seeded determinism (§17)', () => {
  it('produces the identical session for the same seed', () => {
    const a = ReadingEngine.assembleStageItems('COMPREHENSION', 12345, 6);
    const b = ReadingEngine.assembleStageItems('COMPREHENSION', 12345, 6);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });

  it('never repeats a question inside one session', () => {
    for (const stage of STAGES) {
      const items = ReadingEngine.assembleStageItems(stage, 777, 6);
      const ids = items.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('produces a valid variation for a different seed', () => {
    const a = ReadingEngine.assembleStageItems('FLUENCY', 1, 6).map((q) => q.id);
    const b = ReadingEngine.assembleStageItems('FLUENCY', 2, 6).map((q) => q.id);
    expect(a).not.toEqual(b);
    expect(new Set([...a, ...b]).size).toBeGreaterThanOrEqual(a.length);
  });

  it('derives a stable calendar seed', () => {
    const d = new Date(2025, 4, 17);
    expect(ReadingEngine.seedForDate(d)).toBe(ReadingEngine.seedForDate(d));
    expect(ReadingEngine.seedForDate(d)).not.toBe(ReadingEngine.seedForDate(new Date(2025, 4, 18)));
  });
});

describe('Reading metrics (§8)', () => {
  it('computes accuracy, completion and response timing from real data', () => {
    const responses = [
      makeResponse('rq-01-1', true, 4000),
      makeResponse('rq-01-2', true, 6000),
      makeResponse('rq-01-3', false, 12000),
      makeResponse('rq-01-4', true, 5000),
    ];
    const metrics = ReadingEngine.computeMetrics('s1', 'ACCURACY', responses, 0, 27000);
    expect(metrics.itemsProcessed).toBe(4);
    expect(metrics.accuracy).toBe(75);
    expect(metrics.durationMs).toBe(27000);
    expect(metrics.averageResponseMs).toBe(6750);
    expect(metrics.hesitationCount).toBe(1);
    expect(metrics.hesitationRatio).toBeCloseTo(0.25, 2);
  });

  it('reports comprehension accuracy only from comprehension items (-1 when unmeasured)', () => {
    const noComprehension = [makeResponse('rq-01-1', true, 4000)];
    const m1 = ReadingEngine.computeMetrics('s2', 'ACCURACY', noComprehension, 0, 4000);
    expect(m1.comprehensionAccuracy).toBe(-1);

    const withComprehension = [makeResponse('rq-01-3', true, 9000), makeResponse('rq-02-2', false, 8000)];
    const m2 = ReadingEngine.computeMetrics('s3', 'COMPREHENSION', withComprehension, 0, 17000);
    expect(m2.comprehensionAccuracy).toBe(50);
  });

  it('measures words-per-minute only from items the learner actually read aloud', () => {
    // 12 words read in 12 s => 60 wpm; the comprehension tap must not contribute.
    const responses = [makeResponse('rq-05-1', true, 12000), makeResponse('rq-05-2', true, 3000)];
    const metrics = ReadingEngine.computeMetrics('s4', 'COMPETITION_SPEED', responses, 0, 15000);
    expect(metrics.wordsPerMinute).toBe(60);
  });

  it('breaks performance down by skill, question type and difficulty', () => {
    const responses = [
      makeResponse('rq-01-1', true, 4000),
      makeResponse('rq-01-3', false, 9000),
    ];
    const metrics = ReadingEngine.computeMetrics('s5', 'ACCURACY', responses, 0, 13000);
    expect(Object.keys(metrics.skillPerformance).length).toBe(2);
    expect(metrics.questionTypePerformance['word-recognition']).toEqual({ total: 1, correct: 1 });
    expect(metrics.difficultyBreakdown['1'].total).toBe(2);
    expect(metrics.errors.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Reading ladder gating (§7) and fairness (§9)', () => {
  it('keeps speed stages locked while accuracy is below the gate', () => {
    let profile: ReadingProfile = ReadingEngine.emptyProfile();
    const weak = [
      makeResponse('rq-01-1', false, 5000),
      makeResponse('rq-01-2', false, 5000),
      makeResponse('rq-01-3', false, 5000),
    ];
    profile = ReadingEngine.applySession(
      profile,
      ReadingEngine.computeMetrics('g1', 'ACCURACY', weak, 0, 15000)
    );
    expect(profile.stageStates.ACCURACY.isCompleted).toBe(false);
    expect(profile.stageStates.FLUENCY.isUnlocked).toBe(false);
    expect(profile.stageStates.PROCESSING_SPEED.isUnlocked).toBe(false);
    expect(profile.stageStates.COMPETITION_SPEED.isUnlocked).toBe(false);
  });

  it('unlocks comprehension only after the accuracy stage gate is met', () => {
    let profile = ReadingEngine.emptyProfile();
    const strong = [
      makeResponse('rq-01-1', true, 4000),
      makeResponse('rq-01-2', true, 4000),
      makeResponse('rq-01-3', true, 4000),
      makeResponse('rq-01-4', true, 4000),
    ];
    profile = ReadingEngine.applySession(
      profile,
      ReadingEngine.computeMetrics('g2', 'ACCURACY', strong, 0, 16000)
    );
    expect(profile.stageStates.ACCURACY.accuracy).toBe(100);
    expect(profile.stageStates.ACCURACY.isCompleted).toBe(true);
    expect(profile.stageStates.FLUENCY.isUnlocked).toBe(true);
  });

  it('treats SLOW + ACCURATE as strong (speed never reduces the index)', () => {
    let profile = ReadingEngine.emptyProfile();
    // Correct but deliberately slow: 20 s per item, well past the "swift" band.
    const slowButRight = [
      makeResponse('rq-04-1', true, 20000),
      makeResponse('rq-04-2', true, 21000),
      makeResponse('rq-04-3', true, 19000),
      makeResponse('rq-04-4', true, 20000),
    ];
    profile = ReadingEngine.applySession(
      profile,
      ReadingEngine.computeMetrics('fair-slow', 'FLUENCY', slowButRight, 0, 80000)
    );
    expect(profile.accuracyIndex).toBe(100);
    expect(profile.readingIndex).toBeGreaterThanOrEqual(85);
    // Supportive copy only.
    expect(profile.headline.toLowerCase()).not.toContain('chậm');
    expect(profile.headline.toLowerCase()).not.toContain('yếu');
  });

  it('treats FAST + INACCURATE as not strong (speed never creates mastery)', () => {
    let profile = ReadingEngine.emptyProfile();
    // 1.2 s per item but mostly wrong answers.
    const fastButWrong = [
      makeResponse('rq-05-1', false, 1200),
      makeResponse('rq-05-2', false, 1200),
      makeResponse('rq-05-3', false, 1200),
      makeResponse('rq-05-4', false, 1200),
    ];
    profile = ReadingEngine.applySession(
      profile,
      ReadingEngine.computeMetrics('fair-fast', 'COMPETITION_SPEED', fastButWrong, 0, 4800)
    );
    expect(profile.accuracyIndex).toBe(0);
    expect(profile.readingIndex).toBeLessThan(50);
    expect(profile.stageStates.COMPETITION_SPEED.isUnlocked).toBe(false);
  });

  it('does not unlock speed training when comprehension accuracy is low', () => {
    let profile = ReadingEngine.emptyProfile();
    // Pass accuracy + fluency gates first.
    const accuracyItems = [
      makeResponse('rq-01-1', true, 4000),
      makeResponse('rq-01-2', true, 4000),
      makeResponse('rq-01-3', true, 4000),
      makeResponse('rq-01-4', true, 4000),
    ];
    profile = ReadingEngine.applySession(
      profile,
      ReadingEngine.computeMetrics('g3', 'ACCURACY', accuracyItems, 0, 16000)
    );
    const fluencyItems = [
      makeResponse('rq-02-1', true, 4000),
      makeResponse('rq-02-2', true, 4000),
      makeResponse('rq-02-3', true, 4000),
      makeResponse('rq-02-4', true, 4000),
    ];
    profile = ReadingEngine.applySession(
      profile,
      ReadingEngine.computeMetrics('g4', 'FLUENCY', fluencyItems, 0, 16000)
    );
    // Comprehension stage attempted but answered badly.
    const badComprehension = [
      makeResponse('rq-01-3', false, 5000),
      makeResponse('rq-02-2', false, 5000),
      makeResponse('rq-02-3', false, 5000),
      makeResponse('rq-04-2', false, 5000),
    ];
    profile = ReadingEngine.applySession(
      profile,
      ReadingEngine.computeMetrics('g5', 'COMPREHENSION', badComprehension, 0, 20000)
    );
    expect(profile.stageStates.PROCESSING_SPEED.isUnlocked).toBe(false);
  });
});

describe('Reading persistence & idempotency (§18, §19)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists a finished session and survives a reload', () => {
    const responses = [
      makeResponse('rq-01-1', true, 4000),
      makeResponse('rq-01-2', true, 5000),
      makeResponse('rq-01-3', true, 6000),
      makeResponse('rq-01-4', true, 4000),
    ];
    const result = ReadingEngine.finishSession('persist-1', 'ACCURACY', responses, 0, 19000, true);

    const reloaded = StorageService.getReadingProfile();
    expect(reloaded.stageStates.ACCURACY.accuracy).toBe(result.metrics.accuracy);
    expect(StorageService.getReadingMetricsHistory().length).toBe(1);
  });

  it('never double-counts evidence when the same session is committed twice', () => {
    const responses = [
      makeResponse('rq-01-1', true, 4000),
      makeResponse('rq-01-2', true, 5000),
    ];
    const a = ReadingEngine.finishSession('dupe-1', 'ACCURACY', responses, 0, 9000, true);
    const knowledgeAfterFirst = StorageService.getKnowledgeStates();
    const attemptsFirst = Object.values(knowledgeAfterFirst).reduce((s, k) => s + k.attemptCount, 0);

    ReadingEngine.finishSession('dupe-1', 'ACCURACY', responses, 0, 9000, true);
    const attemptsSecond = Object.values(StorageService.getKnowledgeStates()).reduce(
      (s, k) => s + k.attemptCount,
      0
    );

    expect(attemptsSecond).toBe(attemptsFirst);
    expect(attemptsFirst).toBeGreaterThan(0);
    expect(a.metrics.itemsProcessed).toBe(2);
  });

  it('recovers from a corrupted reading store instead of crashing', () => {
    localStorage.setItem('kho_bau_reading_store', '<<<NOT JSON>>>');
    const profile = StorageService.getReadingProfile();
    expect(profile.currentStage).toBe('ACCURACY');
    expect(profile.readingIndex).toBe(0);
    expect(StorageService.getReadingMetricsHistory()).toEqual([]);
  });

  it('sanitizes hostile reading profile values', () => {
    localStorage.setItem(
      'kho_bau_reading_store',
      JSON.stringify({
        schemaVersion: 'P29-v2',
        profile: {
          currentStage: 'HACKED',
          readingIndex: 9999,
          accuracyIndex: -50,
          stageStates: { ACCURACY: { accuracy: 400, attempts: -9, isUnlocked: 'yes' } },
          skillStates: { 'RF-WORD-RECOGNITION': { accuracy: 'abc', attempts: 'x' } },
        },
      })
    );
    const profile = StorageService.getReadingProfile();
    expect(profile.currentStage).toBe('ACCURACY');
    expect(profile.readingIndex).toBe(100);
    expect(profile.accuracyIndex).toBe(0);
    expect(profile.stageStates.ACCURACY.accuracy).toBe(100);
    expect(profile.stageStates.ACCURACY.attempts).toBe(0);
    expect(profile.stageStates.ACCURACY.isUnlocked).toBe(true);
    expect(profile.skillStates['RF-WORD-RECOGNITION'].accuracy).toBe(0);
  });

  it('clears reading progress on a full parent reset', () => {
    const responses = [makeResponse('rq-01-1', true, 4000)];
    ReadingEngine.finishSession('reset-1', 'ACCURACY', responses, 0, 4000, true);
    StorageService.resetProgress();
    expect(StorageService.getReadingProfile().readingIndex).toBe(0);
    expect(StorageService.getReadingMetricsHistory()).toEqual([]);
  });
});

describe('T13 — 24 truyện mới (6 chủ đề x 4, ≥ 6 câu/truyện)', () => {
  const T13_IDS = new Set(T13_PASSAGE_IDS);
  const newPassages = READING_PASSAGES.filter((p) => T13_IDS.has(p.id));
  const newQuestions = READING_QUESTIONS.filter((q) => q.id.startsWith('rq-t13-'));

  const countWords = (s: string): number => s.split(/\s+/).filter(Boolean).length;
  const passageWordCount = (p: { paragraphs: string[] }): number =>
    p.paragraphs.reduce((n, s) => n + countWords(s), 0);
  const allNewStrings = (): { where: string; text: string }[] => {
    const out: { where: string; text: string }[] = [];
    for (const p of newPassages) {
      out.push({ where: `${p.id}:title`, text: p.title });
      p.paragraphs.forEach((s, i) => out.push({ where: `${p.id}:p${i}`, text: s }));
      p.pictureBank.forEach((b, i) => out.push({ where: `${p.id}:pic${i}`, text: b.label }));
    }
    for (const q of newQuestions) {
      out.push({ where: `${q.id}:prompt`, text: q.prompt });
      if (q.stimulus) out.push({ where: `${q.id}:stimulus`, text: q.stimulus });
      q.options.forEach((o, i) => out.push({ where: `${q.id}:opt${i}`, text: o }));
      out.push({ where: `${q.id}:answer`, text: q.correctAnswer });
      out.push({ where: `${q.id}:explanation`, text: q.explanation });
      if (q.targetText) out.push({ where: `${q.id}:target`, text: q.targetText });
    }
    return out;
  };

  it('đạt tổng ≥ 36 truyện và ≥ 180 câu hỏi (12 cũ + 24 mới, 48 + 144 câu)', () => {
    expect(newPassages.length).toBe(24);
    expect(newQuestions.length).toBe(144);
    expect(READING_PASSAGES.length).toBeGreaterThanOrEqual(36);
    expect(READING_QUESTIONS.length).toBeGreaterThanOrEqual(180);
  });

  it('giữ nguyên 12 truyện cũ (mỗi truyện đúng 4 câu như trước)', () => {
    const legacy = READING_PASSAGES.filter((p) => !T13_IDS.has(p.id));
    expect(legacy.length).toBe(12);
    for (const p of legacy) expect(p.questionIds.length).toBe(4);
  });

  it('phủ đủ 6 chủ đề x 4 truyện, phân bố cấp 8/9/7', () => {
    expect(T13_THEMES.length).toBe(6);
    for (const theme of T13_THEMES) {
      expect(getPassagesByTheme(theme).length).toBe(4);
    }
    const byLevel = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
    for (const p of newPassages) byLevel[p.level] += 1;
    expect(byLevel[1]).toBe(8);
    expect(byLevel[2]).toBe(9);
    expect(byLevel[3]).toBe(7);
  });

  it('mỗi truyện mới có theme, vần trọng tâm và ≥ 6 câu hỏi hợp lệ', () => {
    const validSkillIds = new Set(READING_SKILLS.map((s) => s.skillId));
    for (const p of newPassages) {
      expect(p.theme).toBeTruthy();
      expect(p.targetVowels!.length).toBeGreaterThan(0);
      expect(p.questionIds.length).toBeGreaterThanOrEqual(6);
      for (const qid of p.questionIds) {
        const q = getReadingQuestionById(qid);
        expect(q).toBeDefined();
        expect(q!.passageId).toBe(p.id);
        expect(validSkillIds.has(q!.skillId)).toBe(true);
        expect(q!.difficulty).toBe(p.level);
        expect(q!.options.length).toBe(4);
        expect(new Set(q!.options).size).toBe(4);
        expect(q!.options).toContain(q!.correctAnswer);
        if (q!.targetText) expect(q!.options).toContain(q!.targetText);
        expect(q!.wordCount).toBeGreaterThan(0);
        expect(q!.estimatedSeconds).toBeGreaterThanOrEqual(8);
        expect(q!.estimatedSeconds).toBeLessThanOrEqual(90);
        expect(q!.prompt.trim().length).toBeGreaterThan(0);
        expect(q!.explanation.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('mỗi truyện mới dùng ≥ 4 loại câu hỏi khác nhau (chỉ loại đọc đang có)', () => {
    const allowed = new Set([
      'word-recognition',
      'syllable-clap',
      'phrase-repeat',
      'sentence-order',
      'read-aloud',
      'punctuation-pause',
      'comprehension-who',
      'comprehension-what',
      'comprehension-where',
      'comprehension-when',
      'comprehension-why',
      'comprehension-how',
      'keyword-finding',
      'question-meaning',
    ]);
    for (const p of newPassages) {
      const kinds = new Set(
        p.questionIds.map((qid) => getReadingQuestionById(qid)!.questionType)
      );
      for (const k of kinds) expect(allowed.has(k)).toBe(true);
      expect(kinds.size).toBeGreaterThanOrEqual(4);
    }
  });

  it('số chữ đúng theo cấp (L1: 20–35, câu ≤ 6 chữ; L2: 35–60; L3: 60–90, có hội thoại)', () => {
    for (const p of newPassages) {
      const words = passageWordCount(p);
      expect(p.wordCount).toBe(words);
      if (p.level === 1) {
        expect(words).toBeGreaterThanOrEqual(20);
        expect(words).toBeLessThanOrEqual(35);
        const sentences = p.paragraphs
          .join(' ')
          .split(/[.!?…]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        expect(sentences.length).toBeGreaterThan(0);
        for (const s of sentences) expect(countWords(s)).toBeLessThanOrEqual(6);
      } else if (p.level === 2) {
        expect(words).toBeGreaterThanOrEqual(35);
        expect(words).toBeLessThanOrEqual(60);
      } else {
        expect(words).toBeGreaterThanOrEqual(60);
        expect(words).toBeLessThanOrEqual(90);
        expect(p.paragraphs.join(' ')).toContain('"');
      }
    }
  });

  it('nội dung mới không có từ cấm và chuẩn hoá NFC', () => {
    for (const { where, text } of allNewStrings()) {
      expect({ where, hit: containsBannedWord(text) }).toEqual({ where, hit: false });
      expect({ where, nfc: text === text.normalize('NFC') }).toEqual({ where, nfc: true });
    }
  });

  it('id mới không trùng, vị trí đáp án đúng xoay vòng (không lộ đáp án)', () => {
    const ids = READING_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    const passageIds = READING_PASSAGES.map((p) => p.id);
    expect(new Set(passageIds).size).toBe(passageIds.length);
    const positions: Record<number, number> = {};
    for (const q of newQuestions) {
      const idx = q.options.indexOf(q.correctAnswer);
      expect(idx).toBeGreaterThanOrEqual(0);
      positions[idx] = (positions[idx] ?? 0) + 1;
    }
    for (const idx of [0, 1, 2, 3]) {
      const share = (positions[idx] ?? 0) / newQuestions.length;
      expect(share).toBeGreaterThan(0);
      expect(share).toBeLessThanOrEqual(0.5);
    }
  });

  it('ngân hàng mới phủ cả 14 loại câu đọc và mọi kỹ năng đều có câu', () => {
    const typeCounts: Record<string, number> = {};
    const skillCounts: Record<string, number> = {};
    for (const q of newQuestions) {
      typeCounts[q.questionType] = (typeCounts[q.questionType] ?? 0) + 1;
      skillCounts[q.skillId] = (skillCounts[q.skillId] ?? 0) + 1;
    }
    expect(Object.keys(typeCounts).length).toBe(14);
    for (const [, n] of Object.entries(typeCounts)) expect(n).toBeGreaterThanOrEqual(2);
    for (const s of READING_SKILLS) {
      expect(skillCounts[s.skillId] ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
});
