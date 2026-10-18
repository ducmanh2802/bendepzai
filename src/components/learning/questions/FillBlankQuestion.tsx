import React, { useState, useMemo } from 'react';
import type { Question } from '../../../types';

interface FillBlankQuestionProps {
  question: Question;
  selectedAnswer: string | null;
  onSelect: (option: string) => void;
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}

const VIETNAMESE_KEYS = [
  ['a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê'],
  ['g', 'h', 'i', 'k', 'l', 'm', 'n', 'o', 'ô'],
  ['ơ', 'p', 'q', 'r', 's', 't', 'u', 'ư', 'v'],
  ['x', 'y', '←', '␣', 'OK'],
];

const NUMBER_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['0', '←', 'OK'],
];

export const FillBlankQuestion: React.FC<FillBlankQuestionProps> = ({
  question,
  selectedAnswer,
  onSelect,
  isAnswerChecked,
  isCorrect,
  correctAnswer,
}) => {
  const isMath = question.subject === 'toan';
  const keys = useMemo(() => (isMath ? NUMBER_KEYS : VIETNAMESE_KEYS), [isMath]);
  const [inputValue, setInputValue] = useState(selectedAnswer ?? '');

  const handleKeyPress = (key: string) => {
    if (isAnswerChecked) return;
    if (key === '←') {
      setInputValue((prev) => prev.slice(0, -1));
    } else if (key === '␣') {
      setInputValue((prev) => prev + ' ');
    } else if (key === 'OK') {
      onSelect(inputValue);
    } else {
      setInputValue((prev) => prev + key);
    }
  };

  const handleOptionSelect = (opt: string) => {
    if (isAnswerChecked) return;
    setInputValue(opt);
    onSelect(opt);
  };

  const displayValue = inputValue || '___';

  return (
    <div className="space-y-4" data-testid="fill-blank-question">
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center">
        <p className="text-lg md:text-xl font-black text-slate-800 font-display">
          {question.prompt}
        </p>
        <div className="mt-4 inline-block min-w-[120px] px-4 py-3 bg-white border-3 border-amber-300 rounded-xl font-black text-2xl text-center">
          {displayValue}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options?.map((opt, i) => {
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
              onClick={() => handleOptionSelect(opt)}
              disabled={isAnswerChecked}
              className={`min-h-[56px] p-4 rounded-2xl border-3 font-bold text-base md:text-lg flex items-center justify-center transition-all cursor-pointer ${stateStyle}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="bg-slate-50 rounded-2xl p-4">
        <div className="grid grid-cols-9 gap-1.5 sm:gap-2" role="application" aria-label={isMath ? 'Bàn phím số' : 'Bàn phím tiếng Việt'}>
          {keys.map((row, rowIdx) =>
            row.map((key, colIdx) => {
              const isWide = ['←', '␣', 'OK'].includes(key);
              return (
                <button
                  key={`${rowIdx}-${colIdx}`}
                  onClick={() => handleKeyPress(key)}
                  disabled={isAnswerChecked}
                  className={`min-h-[48px] px-3 py-2 rounded-xl font-black text-sm sm:text-base border-2 transition-all active:scale-95 ${
                    isWide
                      ? 'col-span-3 sm:col-span-2 bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300'
                  }`}
                  aria-label={key === '←' ? 'Xóa' : key === '␣' ? 'Space' : key === 'OK' ? 'Xác nhận' : key}
                >
                  {key}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};