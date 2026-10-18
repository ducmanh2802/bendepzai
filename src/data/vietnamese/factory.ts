import type { Lesson, Question, QuestionType } from '../../types';

/**
 * T10A — compact builders for the Vietnamese lesson bank.
 *
 * The lesson bank grew from 70 to 450+ questions in this task. Hand-writing every
 * object literal would bury the actual pedagogy in boilerplate, so new content is
 * authored through these two helpers. They only fill in shared defaults
 * (subject/topicId/audioPrompt) — every pedagogical field stays explicit in the
 * unit files, which keeps the data reviewable and validator-friendly.
 */
export interface QuestionInit {
  id: string;
  type: QuestionType;
  difficulty: 1 | 2 | 3;
  skillId: string;
  prompt: string;
  correctAnswer: string | string[];
  options?: string[];
  audioPrompt?: string;
  mediaEmoji?: string;
  hint?: string;
  explanation?: string;
  matchingPairs?: { left: string; right: string }[];
  orderingItems?: string[];
  categoryBuckets?: string[];
}

export function vnQ(topicId: string, init: QuestionInit): Question {
  const question: Question = {
    id: init.id,
    subject: 'tieng-viet',
    topicId,
    skillId: init.skillId,
    difficulty: init.difficulty,
    type: init.type,
    prompt: init.prompt,
    audioPrompt: init.audioPrompt ?? init.prompt,
    correctAnswer: init.correctAnswer,
  };
  if (init.options) question.options = init.options;
  if (init.mediaEmoji) question.mediaEmoji = init.mediaEmoji;
  if (init.hint) question.hint = init.hint;
  if (init.explanation) question.explanation = init.explanation;
  if (init.matchingPairs) question.matchingPairs = init.matchingPairs;
  if (init.orderingItems) question.orderingItems = init.orderingItems;
  if (init.categoryBuckets) question.categoryBuckets = init.categoryBuckets;
  return question;
}

export function vnLesson(
  topicId: string,
  id: string,
  title: string,
  description: string,
  mascotTip: string,
  questions: Question[],
  xpReward = 40,
  starReward = 3
): Lesson {
  return {
    id,
    topicId,
    subject: 'tieng-viet',
    title,
    description,
    mascotTip,
    questions,
    xpReward,
    starReward,
  };
}

/** NFC-normalise then upper/lower a Vietnamese letter for display. */
export function upper(letter: string): string {
  return letter.normalize('NFC').toUpperCase();
}

export function lower(letter: string): string {
  return letter.normalize('NFC').toLowerCase();
}
