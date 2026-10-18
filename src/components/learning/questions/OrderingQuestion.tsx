import React from 'react';
import type { Question } from '../../../types';

interface OrderingQuestionProps {
  question: Question;
  orderedList: string[];
  onToggleOrderItem: (item: string) => void;
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}

export const OrderingQuestion: React.FC<OrderingQuestionProps> = ({
  question,
  orderedList,
  onToggleOrderItem,
  isAnswerChecked,
  isCorrect,
  correctAnswer,
}) => {
  const items = question.orderingItems ?? question.options ?? [];

  return (
    <div className="space-y-4" data-testid="ordering-question">
      <div className="min-h-[56px] p-3 bg-slate-50 border-2 border-dashed border-amber-300 rounded-2xl flex flex-wrap items-center justify-center gap-2">
        {orderedList.length === 0 ? (
          <span className="text-xs text-slate-400 font-semibold">
            Chạm vào các từ bên dưới theo thứ tự đúng...
          </span>
        ) : (
          orderedList.map((word, i) => (
            <button
              key={`${word}-${i}`}
              onClick={() => !isAnswerChecked && onToggleOrderItem(word)}
              className="px-4 py-2 bg-amber-400 text-amber-950 font-black rounded-xl shadow-sm text-base animate-pop"
            >
              {i + 1}. {word}
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {items.map((word, i) => {
          const isUsed = orderedList.includes(word);
          return (
            <button
              key={i}
              data-testid="answer-option"
              onClick={() => !isAnswerChecked && onToggleOrderItem(word)}
              disabled={isUsed || isAnswerChecked}
              className={`px-4 py-2.5 rounded-xl font-black text-base border-2 transition-all ${
                isUsed
                  ? 'opacity-30 border-slate-200 bg-slate-100 cursor-not-allowed'
                  : 'bg-white hover:bg-amber-50 border-amber-300 shadow-sm active:scale-95 cursor-pointer'
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
};