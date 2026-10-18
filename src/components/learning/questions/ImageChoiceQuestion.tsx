import React from 'react';
import type { Question } from '../../../types';

interface ImageChoiceQuestionProps {
  question: Question;
  selectedAnswer: string | null;
  onSelect: (option: string) => void;
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}

const EMOJI_IN_OPTION = /\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}]*/u;

function splitOptionEmoji(opt: string): { emoji: string | null; label: string } {
  const match = opt.match(EMOJI_IN_OPTION);
  if (!match || match.index === undefined) {
    return { emoji: null, label: opt.trim() };
  }
  const label = (opt.slice(0, match.index) + opt.slice(match.index + match[0].length)).trim();
  return { emoji: match[0], label };
}

export const ImageChoiceQuestion: React.FC<ImageChoiceQuestionProps> = ({
  question,
  selectedAnswer,
  onSelect,
  isAnswerChecked,
  isCorrect,
  correctAnswer,
}) => {
  const options = question.options ?? [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="image-choice-question">
      {options.map((opt, i) => {
        const isSelected = selectedAnswer === opt;
        const { emoji, label } = splitOptionEmoji(opt);
        let stateStyle = 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/50';

        if (isAnswerChecked) {
          if (opt === correctAnswer) {
            stateStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900';
          } else if (isSelected) {
            stateStyle = 'bg-rose-50 border-rose-500 text-rose-900';
          } else {
            stateStyle = 'opacity-40 border-slate-200';
          }
        } else if (isSelected) {
          stateStyle = 'bg-amber-100 border-amber-500 text-amber-950 shadow-md scale-[1.02]';
        }

        return (
          <button
            key={i}
            data-testid="answer-option"
            onClick={() => onSelect(opt)}
            disabled={isAnswerChecked}
            className={`p-4 rounded-2xl border-3 font-bold text-base md:text-lg flex items-center justify-center transition-all cursor-pointer text-center ${stateStyle}`}
          >
            {emoji ? (
              <>
                <span className="text-2xl mr-2" aria-hidden="true">{emoji}</span>
                <span>{label || <span className="sr-only">{opt}</span>}</span>
              </>
            ) : (
              <span>{label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};