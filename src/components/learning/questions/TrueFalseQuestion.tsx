import React from 'react';
import type { Question } from '../../../types';

interface TrueFalseQuestionProps {
  question: Question;
  selectedAnswer: string | null;
  onSelect: (option: string) => void;
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}

export const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
  question,
  selectedAnswer,
  onSelect,
  isAnswerChecked,
  isCorrect,
  correctAnswer,
}) => {
  const options = question.options ?? ['Đúng', 'Sai'];

  return (
    <div className="grid grid-cols-2 gap-4" data-testid="true-false-question">
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

        const emoji = opt === 'Đúng' ? '✅' : '❌';

        return (
          <button
            key={i}
            data-testid="answer-option"
            onClick={() => onSelect(opt)}
            disabled={isAnswerChecked}
            className={`min-h-[80px] p-6 rounded-2xl border-3 font-black text-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${stateStyle}`}
          >
            <span className="text-4xl" aria-hidden="true">{emoji}</span>
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
};