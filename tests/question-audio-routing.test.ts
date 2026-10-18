import { describe, it, expect, vi } from 'vitest';
import {
  assertQuestionAudioTarget,
  buildQuestionAudioTarget,
  getQuestionAudioLang,
  resolveQuestionAudioText,
} from '../src/services/questionAudio';
import type { Question, QuestionType } from '../src/types';

function makeQuestion(overrides: Partial<Question> & { prompt: string }): Question {
  return {
    id: 'q-test',
    subject: 'toan',
    topicId: 't1',
    skillId: 's1',
    difficulty: 1,
    type: 'multiple-choice',
    options: ['A', 'B', 'C'],
    correctAnswer: 'A',
    ...overrides,
  } as Question;
}

/** Simulates the single LessonPlayerModal call-site: resolve → assert → speak. */
function speakResolvedQuestion(
  question: Question,
  speak: (text: string) => void,
  selectedAnswer: string | string[] | null = null
): string | null {
  const target = buildQuestionAudioTarget(question);
  if (!target) return null;
  assertQuestionAudioTarget({
    questionId: target.questionId,
    text: target.text,
    canonicalText: resolveQuestionAudioText(question) ?? '',
    options: question.options,
    correctAnswer: question.correctAnswer,
    selectedAnswer,
    explanation: question.explanation,
    hint: question.hint,
  });
  speak(target.text);
  return target.text;
}

describe('question audio routing — canonical question text', () => {
  it('Test 1 — basic: reads the question, NOT the first answer', () => {
    const q = makeQuestion({
      id: 'q-basic',
      subject: 'tieng-viet',
      prompt: 'Con vật nào kêu meo meo?',
      options: ['Con mèo', 'Con chó', 'Con bò'],
      correctAnswer: 'Con mèo',
    });
    expect(resolveQuestionAudioText(q)).toBe('Con vật nào kêu meo meo?');
    expect(resolveQuestionAudioText(q)).not.toBe('Con mèo');
  });

  it('Test 2 — first answer resembles the question stem', () => {
    const q = makeQuestion({
      id: 'q-resemble',
      prompt: 'Chọn số lớn hơn 5.',
      options: ['8', '3', '4'],
      correctAnswer: '8',
    });
    expect(resolveQuestionAudioText(q)).toBe('Chọn số lớn hơn 5.');
  });

  it('Test 3 — correct answer is first: still reads the question', () => {
    const q = makeQuestion({
      id: 'q-correct-first',
      prompt: '2 + 2 bằng bao nhiêu?',
      options: ['4', '5', '6'],
      correctAnswer: '4',
    });
    const spoken = speakResolvedQuestion(q, () => {});
    expect(spoken).toBe('2 + 2 bằng bao nhiêu?');
    expect(spoken).not.toBe('4');
  });

  it('Test 4 — correct answer is NOT first: still reads the question', () => {
    const q = makeQuestion({
      id: 'q-correct-last',
      prompt: '2 + 2 bằng bao nhiêu?',
      options: ['5', '4', '6'],
      correctAnswer: '4',
    });
    const spoken = speakResolvedQuestion(q, () => {});
    expect(spoken).toBe('2 + 2 bằng bao nhiêu?');
  });

  it('Test 5 — a selected answer exists: must NOT read the selection', () => {
    const q = makeQuestion({
      id: 'q-selected',
      prompt: '2 + 2 bằng bao nhiêu?',
      options: ['5', '4', '6'],
      correctAnswer: '4',
    });
    const spoken = speakResolvedQuestion(q, () => {}, '4');
    expect(spoken).toBe('2 + 2 bằng bao nhiêu?');
    expect(spoken).not.toBe('4');
  });

  it('Test 6 — explanation exists: must NOT read the explanation', () => {
    const q = makeQuestion({
      id: 'q-expl',
      prompt: '2 + 2 bằng bao nhiêu?',
      options: ['5', '4', '6'],
      correctAnswer: '4',
      explanation: 'Vì 2 cộng 2 bằng 4.',
    });
    const spoken = speakResolvedQuestion(q, () => {});
    expect(spoken).toBe('2 + 2 bằng bao nhiêu?');
    expect(spoken).not.toBe('Vì 2 cộng 2 bằng 4.');
  });

  it('Test 7 — every supported lesson question type resolves to prompt', () => {
    const types: QuestionType[] = [
      'multiple-choice',
      'true-false',
      'matching',
      'ordering',
      'fill-blank',
      'image-choice',
      'audio-choice',
      'math-expression',
      'drag-drop',
    ];
    for (const type of types) {
      const q = makeQuestion({
        id: `q-type-${type}`,
        type,
        prompt: `Câu hỏi mẫu cho ${type}?`,
        audioPrompt: undefined,
        options: ['Đáp án A', 'Đáp án B'],
        correctAnswer: 'Đáp án A',
      });
      expect(resolveQuestionAudioText(q)).toBe(`Câu hỏi mẫu cho ${type}?`);
    }
  });

  it('authored audioPrompt wins (explicit TTS script, e.g. math phrasing)', () => {
    const q = makeQuestion({
      id: 'q-math-script',
      prompt: '5 + 3 bằng bao nhiêu?',
      audioPrompt: '5 cộng 3 bằng bao nhiêu?',
      options: ['8', '7', '9'],
      correctAnswer: '8',
    });
    expect(resolveQuestionAudioText(q)).toBe('5 cộng 3 bằng bao nhiêu?');
    expect(resolveQuestionAudioText(q)).not.toBe('8');
  });

  it('fail-safe: empty question text resolves to null — NEVER options[0]', () => {
    const q = makeQuestion({
      id: 'q-empty',
      prompt: '   ',
      audioPrompt: '  ',
      options: ['8', '7'],
      correctAnswer: '8',
    });
    expect(resolveQuestionAudioText(q)).toBeNull();
    expect(buildQuestionAudioTarget(q)).toBeNull();
  });

  it('null/undefined question resolves to null (AUDIO_UNAVAILABLE)', () => {
    expect(resolveQuestionAudioText(null)).toBeNull();
    expect(resolveQuestionAudioText(undefined)).toBeNull();
    expect(buildQuestionAudioTarget(undefined)).toBeNull();
  });

  it('target carries QUESTION semantics with the owning question id', () => {
    const q = makeQuestion({ id: 'q-sem', prompt: 'Đọc gì?' });
    expect(buildQuestionAudioTarget(q)).toEqual({
      type: 'QUESTION',
      text: 'Đọc gì?',
      questionId: 'q-sem',
    });
  });

  it('language routing: english → en-GB (P38), vietnamese/math → vi-VN', () => {
    expect(getQuestionAudioLang({ id: 'a', subject: 'english' })).toBe('en-GB');
    expect(getQuestionAudioLang({ id: 'b', subject: 'tieng-viet' })).toBe('vi-VN');
    expect(getQuestionAudioLang({ id: 'c', subject: 'toan' })).toBe('vi-VN');
  });
});

describe('assertQuestionAudioTarget — routing leak detector', () => {
  const canonical = {
    questionId: 'q-assert',
    text: '5 + 3 bằng bao nhiêu?',
    canonicalText: '5 + 3 bằng bao nhiêu?',
    options: ['8', '7', '9'],
    correctAnswer: '8',
    explanation: 'Vì 5 cộng 3 bằng 8.',
  };

  it('passes for a genuine question target', () => {
    expect(assertQuestionAudioTarget(canonical)).toBe(true);
  });

  it('FAILS when the target is answers[0] while the question differs', () => {
    expect(() =>
      assertQuestionAudioTarget({ ...canonical, text: '8' })
    ).toThrow(/ASSERT FAIL/);
  });

  it('FAILS when the target is the explanation', () => {
    expect(() =>
      assertQuestionAudioTarget({ ...canonical, text: 'Vì 5 cộng 3 bằng 8.' })
    ).toThrow(/ASSERT FAIL/);
  });

  it('FAILS when the target is the previously selected answer', () => {
    expect(() =>
      assertQuestionAudioTarget({
        ...canonical,
        text: '7',
        selectedAnswer: '7',
      })
    ).toThrow(/ASSERT FAIL/);
  });
});

describe('regression — spy ONLY the TTS boundary, never the question data', () => {
  function makeSpy() {
    // Captures SpeechSynthesisUtterance.text equivalent at the TTS boundary.
    const spoken: string[] = [];
    const speak = (text: string) => {
      spoken.push(text);
    };
    return { spoken, speak };
  }

  it('spokenText === canonicalQuestionText and !== answer[0]/selected/explanation', () => {
    const q = makeQuestion({
      id: 'q-spy',
      prompt: 'Con vật nào kêu meo meo?',
      options: ['Con mèo', 'Con chó', 'Con bò'],
      correctAnswer: 'Con mèo',
      explanation: 'Mèo kêu meo meo.',
    });
    const { spoken, speak } = makeSpy();
    const target = buildQuestionAudioTarget(q)!;
    speak(target.text);
    expect(spoken).toHaveLength(1);
    expect(spoken[0]).toBe('Con vật nào kêu meo meo?');
    expect(spoken[0]).not.toBe(q.options![0]);
    expect(spoken[0]).not.toBe(q.correctAnswer);
    expect(spoken[0]).not.toBe(q.explanation);
  });

  it('Case A — open question → read: QUESTION', () => {
    const q = makeQuestion({ id: 'q-a', prompt: 'Mấy cộng mấy bằng 4?' });
    const { spoken, speak } = makeSpy();
    speakResolvedQuestion(q, speak);
    expect(spoken[0]).toBe('Mấy cộng mấy bằng 4?');
  });

  it('Case B/C — select A/B → read: still QUESTION', () => {
    for (const picked of ['A', 'B']) {
      const q = makeQuestion({
        id: `q-bc-${picked}`,
        prompt: 'Mấy cộng mấy bằng 4?',
        options: ['A', 'B'],
        correctAnswer: 'A',
      });
      const { spoken, speak } = makeSpy();
      speakResolvedQuestion(q, speak, picked);
      expect(spoken[0]).toBe('Mấy cộng mấy bằng 4?');
      expect(spoken[0]).not.toBe(picked);
    }
  });

  it('Case E/F — read answer → read question → still QUESTION', () => {
    const q = makeQuestion({
      id: 'q-ef',
      prompt: 'Mấy cộng mấy bằng 4?',
      options: ['1 + 3', '2 + 5'],
      correctAnswer: '1 + 3',
      explanation: 'Vì 1 cộng 3 bằng 4.',
    });
    const { spoken, speak } = makeSpy();
    speak(q.options![0]); // answer audio channel (separate)
    speakResolvedQuestion(q, speak); // question audio channel
    speakResolvedQuestion(q, speak); // question again (Case F tail)
    expect(spoken[spoken.length - 1]).toBe('Mấy cộng mấy bằng 4?');
  });

  it('competition + reading shapes also resolve to canonical prompt', () => {
    const competition = { id: 'comp-1', prompt: '7 + 5 bằng mấy?', subject: 'toan' };
    const reading = { id: 'read-1', prompt: 'Ai câu cá?', subject: 'tieng-viet' };
    expect(resolveQuestionAudioText(competition)).toBe('7 + 5 bằng mấy?');
    expect(resolveQuestionAudioText(reading)).toBe('Ai câu cá?');
  });

  it('does not crash the suite when speech is spied repeatedly (no stacking assumption)', () => {
    const q = makeQuestion({ id: 'q-repeat', prompt: 'Đọc lại nhé?' });
    const speak = vi.fn();
    speakResolvedQuestion(q, speak);
    speakResolvedQuestion(q, speak);
    expect(speak).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenNthCalledWith(1, 'Đọc lại nhé?');
    expect(speak).toHaveBeenNthCalledWith(2, 'Đọc lại nhé?');
  });
});
