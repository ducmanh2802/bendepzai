import { describe, it, expect } from 'vitest';
import {
  applyMatchingTap,
  buildMatchingCanonical,
  checkAnswer,
  isMatchingComplete,
} from '../src/services/answerCheck';

const QID = 'life-q1-10';
const PAIRS = [
  { left: 'Vui', right: 'Chia sẻ niềm vui' },
  { left: 'Tức giận', right: 'Hít thở chậm' },
];

const QUESTION: Parameters<typeof checkAnswer>[0] = {
  id: QID,
  subject: 'cuoc-song',
  topicId: 'life-cam-xuc',
  skillId: 'life_emotions_recognition',
  difficulty: 2,
  type: 'matching',
  prompt: 'Nối cảm xúc với hành động phù hợp.',
  options: ['Chia sẻ niềm vui', 'Hít thở chậm'],
  correctAnswer: 'Vui=Chia sẻ niềm vui|Tức giận=Hít thở chậm',
  matchingPairs: PAIRS,
};

describe('T14B — lesson matching state machine', () => {
  it('completes a pair left-then-right and grades it correct', () => {
    let s: Record<string, string> = {};
    s = applyMatchingTap(s, QID, 'left', 'Vui');
    expect(s[`${QID}::Vui`]).toBe('L:Vui');
    expect(isMatchingComplete(PAIRS, s, QID)).toBe(false);
    s = applyMatchingTap(s, QID, 'right', 'Chia sẻ niềm vui');
    expect(s[`${QID}::Vui`]).toBe('Vui=Chia sẻ niềm vui');
    s = applyMatchingTap(s, QID, 'left', 'Tức giận');
    s = applyMatchingTap(s, QID, 'right', 'Hít thở chậm');
    expect(isMatchingComplete(PAIRS, s, QID)).toBe(true);
    const canonical = buildMatchingCanonical(PAIRS, s, QID);
    expect(canonical).toBe('Vui=Chia sẻ niềm vui|Tức giận=Hít thở chậm');
    expect(checkAnswer(QUESTION, canonical)).toBe(true);
  });

  it('also completes right-then-left', () => {
    let s: Record<string, string> = {};
    s = applyMatchingTap(s, QID, 'right', 'Hít thở chậm');
    s = applyMatchingTap(s, QID, 'left', 'Tức giận');
    expect(s[`${QID}::Tức giận`]).toBe('Tức giận=Hít thở chậm');
    expect(isMatchingComplete(PAIRS, s, QID)).toBe(false);
  });

  it('toggles a pending tap off when tapped twice', () => {
    let s = applyMatchingTap({}, QID, 'left', 'Vui');
    s = applyMatchingTap(s, QID, 'left', 'Vui');
    expect(s).toEqual({});
    s = applyMatchingTap({}, QID, 'right', 'X');
    s = applyMatchingTap(s, QID, 'right', 'X');
    expect(s).toEqual({});
  });

  it('keeps a single pending tap and never disturbs finished pairs', () => {
    let s = applyMatchingTap({}, QID, 'left', 'Vui');
    s = applyMatchingTap(s, QID, 'left', 'Tức giận');
    expect(s[`${QID}::Vui`]).toBeUndefined();
    expect(s[`${QID}::Tức giận`]).toBe('L:Tức giận');
    // Finish first pair, then start the second: the finished pair survives.
    s = applyMatchingTap({}, QID, 'left', 'Vui');
    s = applyMatchingTap(s, QID, 'right', 'Chia sẻ niềm vui');
    s = applyMatchingTap(s, QID, 'left', 'Tức giận');
    expect(s[`${QID}::Vui`]).toBe('Vui=Chia sẻ niềm vui');
  });

  it('grades a wrong pairing as incorrect', () => {
    let s = applyMatchingTap({}, QID, 'left', 'Vui');
    s = applyMatchingTap(s, QID, 'right', 'Hít thở chậm');
    s = applyMatchingTap(s, QID, 'left', 'Tức giận');
    s = applyMatchingTap(s, QID, 'right', 'Chia sẻ niềm vui');
    expect(isMatchingComplete(PAIRS, s, QID)).toBe(true);
    expect(checkAnswer(QUESTION, buildMatchingCanonical(PAIRS, s, QID))).toBe(false);
  });

  it('never mutates the input state', () => {
    const before: Record<string, string> = {};
    const after = applyMatchingTap(before, QID, 'left', 'Vui');
    expect(before).toEqual({});
    expect(after).not.toBe(before);
  });
});
