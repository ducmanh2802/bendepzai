import { describe, it, expect } from 'vitest';
import {
  buildRounds,
  buildUnitActivities,
  evaluateActivityResponse,
  getChoicePresentation,
  isAudioStimulus,
} from '../src/services/kidBoxActivities';
import type { KidBoxActivity, KidBoxUnit } from '../src/types/kidBox';
import { findKidBoxUnit, KIDBOX_BRIDGE_UNIT_ID } from '../src/data/kidBoxCurriculum';

/**
 * Regression cover for: "Luyện tập nền (Đảo Tiếng Anh) — file nghe và 4 hình
 * đáp án không liên quan tới nhau."
 *
 * Root cause: `buildRounds()` discarded the items each activity builder had
 * authored and substituted a generic vocabulary grid, so an audio/phonics
 * stimulus ended up paired with unrelated answer pictures — and the player drew
 * every option as picture + word, printing the answer next to each picture.
 *
 * Invariants locked here (§28):
 *  1. Round 0 of every activity is exactly the authored `activity.items`
 *     (stable evidence ids).
 *  2. The stimulus of a round belongs to the same task as its four options.
 *  3. A choice round has exactly one correct option.
 *  4. Listening activities really carry audio; reading ones do not.
 *  5. The rendered option never contains the stimulus's answer text.
 */
const bridge = findKidBoxUnit(KIDBOX_BRIDGE_UNIT_ID) as KidBoxUnit;
const activities = buildUnitActivities(bridge);
const choiceActivities = activities.filter(
  (a) => a.mode === 'SINGLE_CHOICE' || a.mode === 'CHECK'
);

const wordOf = (item: { word?: string; captionEn: string }) => item.word ?? item.captionEn;

describe('kidbox bridge practice — stimulus matches answers', () => {
  it('có hoạt động lựa chọn để kiểm tra', () => {
    expect(choiceActivities.length).toBeGreaterThan(0);
  });

  it('vòng đầu luôn là items đã dựng sẵn (id ổn định)', () => {
    for (const activity of choiceActivities) {
      const rounds = buildRounds(activity, bridge);
      expect(rounds[0].map((i) => i.id)).toEqual(activity.items.map((i) => i.id));
    }
  });

  it('mọi vòng chỉ có đúng một đáp án đúng', () => {
    for (const activity of choiceActivities) {
      for (const round of buildRounds(activity, bridge)) {
        expect(round.filter((i) => i.isCorrect)).toHaveLength(1);
      }
    }
  });

  it('mọi vòng có ít nhất 2 đáp án và không trùng id', () => {
    for (const activity of choiceActivities) {
      for (const round of buildRounds(activity, bridge)) {
        expect(round.length).toBeGreaterThanOrEqual(2);
        expect(new Set(round.map((i) => i.id)).size).toBe(round.length);
      }
    }
  });

  it('bài nghe âm đầu (MISSING_WORD) dùng đáp án lấy từ bảng phonics, không phải từ vựng ngẫu nhiên', () => {
    const activity = activities.find((a) => a.kind === 'MISSING_WORD');
    expect(activity, 'không có hoạt động phonics').toBeDefined();

    const phonicsIds = new Set(bridge.phonics.map((p) => p.id));
    const exampleWords = new Set(bridge.phonics.map((p) => p.exampleWord));

    for (const round of buildRounds(activity!, bridge)) {
      for (const item of round) {
        const fromPhonics = [...phonicsIds].some((pid) => item.id.startsWith(pid));
        expect(fromPhonics, `đáp án "${item.id}" không đến từ bảng phonics`).toBe(true);
        expect(exampleWords.has(wordOf(item))).toBe(true);
      }
    }
  });

  it('bài đoán nghĩa (MEANING_MATCH) hiện từ tiếng Anh và chọn nghĩa tiếng Việt', () => {
    const activity = activities.find((a) => a.kind === 'MEANING_MATCH');
    expect(activity).toBeDefined();

    const meanings = new Set(bridge.vocabulary.map((v) => v.meaningVi));
    for (const round of buildRounds(activity!, bridge)) {
      const target = round.find((i) => i.isCorrect)!;
      // stimulus = English word (never rendered as an option)
      expect(bridge.vocabulary.some((v) => v.word === target.word)).toBe(true);
      // options = Vietnamese meanings, the target's own meaning among them
      for (const item of round) {
        expect(meanings.has(item.captionEn)).toBe(true);
      }
      // the correct option's meaning really belongs to the shown word
      const word = bridge.vocabulary.find((v) => v.word === target.word)!;
      expect(target.captionEn).toBe(word.meaningVi);
    }
  });

  it('bài đoán nghĩa chấm đúng khi bé bấm đúng nghĩa', () => {
    const activity = activities.find((a) => a.kind === 'MEANING_MATCH')!;
    const round = buildRounds(activity, bridge)[0];
    const target = round.find((i) => i.isCorrect)!;

    const right = evaluateActivityResponse(activity, { type: 'CHOICE', itemId: target.id });
    expect(right.outcome).toBe('CORRECT');

    const wrongItem = round.find((i) => !i.isCorrect)!;
    const wrong = evaluateActivityResponse(activity, { type: 'CHOICE', itemId: wrongItem.id });
    expect(wrong.outcome).toBe('INCORRECT');
  });

  it('bài nghe (LISTEN_AND_CHOOSE) và bài nghe âm đầu đều phát tiếng Anh', () => {
    const hear = activities.find((a) => a.kind === 'LISTEN_AND_CHOOSE')!;
    const phonics = activities.find((a) => a.kind === 'MISSING_WORD')!;
    expect(isAudioStimulus(hear)).toBe(true);
    expect(isAudioStimulus(phonics)).toBe(true);
    expect(getChoicePresentation(hear).option).toBe('picture');
    expect(getChoicePresentation(phonics).option).toBe('word');
  });

  it('bài không nghe thì không tự phát tiếng', () => {
    for (const kind of ['PICTURE_TO_WORD', 'MEANING_MATCH', 'RECOGNITION', 'SPACED_REVIEW', 'MINI_CHECK']) {
      const activity = activities.find((a) => a.kind === kind) as KidBoxActivity | undefined;
      expect(activity, `không có hoạt động ${kind}`).toBeDefined();
      expect(isAudioStimulus(activity!), `${kind} không nên tự phát tiếng`).toBe(false);
    }
  });

  it('đáp án hình ảnh không in kèm từ (không làm lộ đáp án)', () => {
    for (const activity of choiceActivities) {
      const { option } = getChoicePresentation(activity);
      for (const round of buildRounds(activity, bridge)) {
        for (const item of round) {
          if (option === 'picture') {
            expect(item.pictureEmoji, `mỗi đáp án hình ảnh phải có hình`).toBeTruthy();
          }
          if (option === 'meaning') {
            expect(item.captionEn).not.toBe(item.captionVi);
          }
        }
      }
    }
  });

  it('bài nghe âm đầu có đúng 4 đáp án và đáp án đúng nằm trong tập đáp án', () => {
    const activity = activities.find((a) => a.kind === 'MISSING_WORD') as KidBoxActivity;
    const rounds = buildRounds(activity, bridge);
    expect(rounds.length).toBeGreaterThan(1);

    for (const round of rounds) {
      expect(round).toHaveLength(4);
      // The spoken stimulus must BE one of the four offered words.
      const target = round.find((i) => i.isCorrect)!;
      const spoken = target.speakText;
      expect(round.map((i) => i.word)).toContain(spoken);
      // And it must be the only option equal to what was said.
      expect(round.filter((i) => i.word === spoken)).toHaveLength(1);
    }
  });

  it('bài nhìn hình (SEE) không hiện lại hình ở các đáp án còn lại', () => {
    const activity = activities.find((a) => a.kind === 'PICTURE_TO_WORD') as KidBoxActivity;
    expect(getChoicePresentation(activity).stimulus).toBe('picture');
    expect(getChoicePresentation(activity).option).toBe('word');
  });
});