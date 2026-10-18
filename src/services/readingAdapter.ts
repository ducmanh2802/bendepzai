import type { Question } from '../types';
import type { ReadingQuestion } from '../types/reading';

export function adaptReadingQuestion(readingQuestion: ReadingQuestion): Question {
  return {
    id: readingQuestion.id,
    subject: readingQuestion.subject,
    topicId: 'reading-fluency',
    skillId: readingQuestion.skillId,
    difficulty: readingQuestion.difficulty,
    type: 'multiple-choice',
    prompt: readingQuestion.prompt,
    audioPrompt: readingQuestion.prompt,
    mediaEmoji: readingQuestion.mediaEmoji,
    options: readingQuestion.options,
    correctAnswer: readingQuestion.correctAnswer,
    explanation: readingQuestion.explanation,
  };
}

export const readingQuestionToQuestion = adaptReadingQuestion;
export const readingQuestionToLessonQuestion = adaptReadingQuestion;
export const toQuestion = adaptReadingQuestion;
export const toLessonQuestion = adaptReadingQuestion;
