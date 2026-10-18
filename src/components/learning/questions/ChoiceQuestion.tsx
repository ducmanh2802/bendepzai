import React from 'react';
import type { Question } from '../../../types';

interface ChoiceQuestionProps {
  question: Question;
  selectedAnswer: string | null;
  onSelect: (option: string) => void;
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}

export const ChoiceQuestion: React.FC<ChoiceQuestionProps> = ({
  question,
  selectedAnswer,
  onSelect,
  isAnswerChecked,
  isCorrect,
  correctAnswer,
}) => {
  const options = question.options ?? [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="choice-question">
      {options.map((opt, i) => {
        const isSelected = selectedAnswer === opt;
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
            {opt}
          </button>
        );
      })}
    </div>
  );
};