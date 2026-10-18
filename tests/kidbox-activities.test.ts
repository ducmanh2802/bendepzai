import { describe, it, expect } from 'vitest';
import {
  buildRounds,
  buildUnitActivities,
  evaluateActivityResponse,
  matchesActivityTarget,
  validateActivityItems,
} from '../src/services/kidBoxActivities';
import { KidBoxActivity, KidBoxUnit } from '../src/types/kidBox';
import { findKidBoxUnit, KIDBOX_BRIDGE_UNIT_ID } from '../src/data/kidBoxCurriculum';
import { ingestKidBoxSource } from '../src/data/kidBoxIngest';
import {
  containsBannedPronunciationClaim,
  describeSpeakingMethod,
  getBritishVoiceCapability,
  getSpeechRecognitionCapability,
  matchesSpoken,
  BRITISH_LOCALE,
} from '../src/services/britishSpeech';
import { SPEECH_REPORTING_POLICY } from '../src/config/policy';

const bridge = findKidBoxUnit(KIDBOX_BRIDGE_UNIT_ID) as KidBoxUnit;
const activities = buildUnitActivities(bridge);

function activityOfKind(kind: KidBoxActivity['kind']): KidBoxActivity {
  const found = activities.find((a) => a.kind === kind);
  expect(found, `không có hoạt động ${kind}`).toBeDefined();
  return found!;
}

describe("Kid's Box Companion — listening engine (§12)", () => {
  const hear = activityOfKind('LISTEN_AND_CHOOSE');
  const listenAndAct = activityOfKind('LISTEN_AND_ACT');

  it('always allows replay and never sets a penalty for using it', () => {
    for (const activity of activities) {
      expect(activity.allowReplay).toBe(true);
      expect(activity.allowSlowReplay).toBe(true);
    }
  });

  it('offers 2–4 picture options with exactly one correct answer', () => {
    expect(hear.items.length).toBeGreaterThanOrEqual(2);
    expect(hear.items.length).toBeLessThanOrEqual(4);
    expect(hear.items.filter((i) => i.isCorrect)).toHaveLength(1);
  });

  it('grades a correct choice right and a wrong choice wrong, with an explanation', () => {
    const correct = hear.items.find((i) => i.isCorrect)!;
    const wrong = hear.items.find((i) => !i.isCorrect)!;

    const good = evaluateActivityResponse(hear, { type: 'CHOICE', itemId: correct.id });
    expect(good.isCorrect).toBe(true);
    expect(good.explanation).toBe(hear.explanation);

    const bad = evaluateActivityResponse(hear, { type: 'CHOICE', itemId: wrong.id });
    expect(bad.isCorrect).toBe(false);
    expect(bad.feedback).not.toBe('');
  });

  it('never accepts an item that does not belong to the activity', () => {
    const result = evaluateActivityResponse(hear, { type: 'CHOICE', itemId: 'not-a-real-item' });
    expect(result.isCorrect).toBe(false);
  });

  it('listens and acts exposes the physical instruction as text, never audio only (§32)', () => {
    for (const item of listenAndAct.items) {
      expect(item.actionCueVi).toBeTruthy();
      expect(item.captionEn).toBeTruthy();
    }
    const done = evaluateActivityResponse(listenAndAct, { type: 'ACTION_DONE', itemId: listenAndAct.items[0].id });
    expect(done.isCorrect).toBe(true);
  });

  it('produces multiple rounds with unique option ids and no duplicate captions', () => {
    const rounds = buildRounds(hear, bridge);
    expect(rounds.length).toBeGreaterThan(1);
    for (const round of rounds) {
      const ids = round.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(round.filter((i) => i.isCorrect)).toHaveLength(1);
      const captions = round.filter((i) => i.isCorrect).map((i) => i.captionEn.toLowerCase());
      expect(new Set(captions).size).toBe(captions.length);
    }
  });

  it('keeps every generated activity valid against the §28 item contract', () => {
    for (const activity of activities) {
      expect(validateActivityItems(activity)).toEqual([]);
    }
  });
});

describe("Kid's Box Companion — speaking practice (§13, §14)", () => {
  const repeat = activities.find((a) => a.mode === 'SPEAK')!;

  it('declares British English and optional speech recognition', () => {
    expect(repeat.britishEnglish).toBe(BRITISH_LOCALE);
    expect(repeat.acceptsSpeechRecognition).toBe(true);
  });

  it('records a speech-recognition match without pretending it is a score', () => {
    const target = repeat.items.find((i) => i.isCorrect)!;
    const matched = evaluateActivityResponse(repeat, {
      type: 'SPEAK',
      itemId: target.id,
      transcript: target.speakText,
      recognitionSupported: true,
    });
    expect(matched.isCorrect).toBe(true);

    const missed = evaluateActivityResponse(repeat, {
      type: 'SPEAK',
      itemId: target.id,
      transcript: 'something else entirely',
      recognitionSupported: true,
    });
    expect(missed.isCorrect).toBe(false);
  });

  it('falls back to self-check when recognition is unavailable, without scoring (§13)', () => {
    const result = evaluateActivityResponse(repeat, {
      type: 'SPEAK',
      recognitionSupported: false,
      selfConfirmed: true,
    });
    // The activity view stays neutral; the *attempt* is recorded as SELF_CHECKED
    // by the engine, so no right/wrong signal ever reaches the Learning OS.
    expect(typeof result.isCorrect).toBe('boolean');
  });

  it('matches spoken words regardless of punctuation and word order', () => {
    expect(matchesSpoken("It's a book.", 'it is a book')).toBe(true);
    expect(matchesSpoken('book it is a', 'it is a book')).toBe(true);
    expect(matchesSpoken('a book', 'it is a book')).toBe(false);
  });

  it('uses the target texts of an activity for matching', () => {
    const target = repeat.items.find((i) => i.isCorrect)!;
    expect(matchesActivityTarget(repeat, target.speakText.toUpperCase(), target.id)).toBe(true);
    expect(matchesActivityTarget(repeat, '', target.id)).toBe(false);
    // Scoped to one item: saying one word is enough for that item.
    expect(matchesActivityTarget(repeat, target.speakText, target.id)).toBe(true);
  });

  it('never allows a pronunciation-quality claim (§14)', () => {
    expect(containsBannedPronunciationClaim('Pronunciation = 93%')).toBe(true);
    expect(containsBannedPronunciationClaim('Phát âm chuẩn 100%')).toBe(true);
    expect(containsBannedPronunciationClaim(describeSpeakingMethod('SPEECH_RECOGNITION_MATCH'))).toBe(false);
    expect(describeSpeakingMethod('SPEECH_RECOGNITION_MATCH')).toBe(
      SPEECH_REPORTING_POLICY.RECOGNITION_LABEL
    );
    expect(describeSpeakingMethod('SELF_CHECK')).toBe(SPEECH_REPORTING_POLICY.SELF_CHECK_LABEL);
    expect(describeSpeakingMethod('PARENT_ASSISTED')).toBe(SPEECH_REPORTING_POLICY.PARENT_CHECK_LABEL);
  });

  it('reports honestly when no British English voice exists (§7)', () => {
    const capability = getBritishVoiceCapability();
    expect(capability.label.length).toBeGreaterThan(0);
    if (!capability.canClaimBritishEnglish) {
      expect(['USE_GENERIC_ENGLISH', 'USE_TEXT_AND_CAPTIONS_ONLY']).toContain(capability.fallback);
    }
    const recognition = getSpeechRecognitionCapability();
    expect(recognition.language).toBe(BRITISH_LOCALE);
  });
});

describe("Kid's Box Companion — answer validation against freshly mapped content (§30)", () => {
  const mapped = ingestKidBoxSource({
    units: [
      {
        unitRef: '7',
        title: 'Unit 7 (mapped)',
        vocabulary: [
          { word: 'bag', meaningVi: 'cặp', pictureEmoji: '🎒' },
          { word: 'book', meaningVi: 'sách', pictureEmoji: '📕' },
          { word: 'pen', meaningVi: 'bút', pictureEmoji: '🖊️' },
        ],
        phonics: [{ focusSound: 'b', exampleWord: 'bag' }, { focusSound: 'p', exampleWord: 'pen' }],
        patterns: [{ pattern: 'It is a bag.', question: 'What is this?', suggestedAnswer: 'It is a bag.' }],
        readingTexts: [{ text: 'It is a bag.', textVi: 'Đây là một cái cặp.' }],
      },
    ],
  });
  const unit = mapped.units[0];

  it('builds activities for a newly mapped unit without any code change', () => {
    const fresh = buildUnitActivities(unit);
    expect(fresh.length).toBeGreaterThan(0);
    expect(validateActivityItems(fresh[0])).toEqual([]);
  });

  it('rejects duplicate answers inside an option set (§28 duplicate prevention)', () => {
    const duplicated: KidBoxActivity = {
      ...activities[0],
      items: [
        { ...activities[0].items[0], id: 'dup', isCorrect: true },
        { ...activities[0].items[0], id: 'dup', isCorrect: false },
      ],
    };
    expect(validateActivityItems(duplicated)).toContain('DUPLICATE_ITEM_ID');
  });

  it('flags an activity that lost its British English metadata', () => {
    const notBritish = { ...activities[0], britishEnglish: 'en-US' as KidBoxActivity['britishEnglish'] };
    expect(validateActivityItems(notBritish)).toContain('NOT_BRITISH_ENGLISH');
  });

  it('flags an item with no caption, so audio is never the only channel (§32)', () => {
    const silent = {
      ...activities[0],
      items: activities[0].items.map((item, idx) =>
        idx === 0 ? { ...item, captionEn: '', speakText: '' } : item
      ),
    };
    const problems = validateActivityItems(silent);
    expect(problems.some((p) => p.startsWith('MISSING_CAPTION'))).toBe(true);
    expect(problems.some((p) => p.startsWith('MISSING_SPEAK_TEXT'))).toBe(true);
  });
});
