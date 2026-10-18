import React from 'react';
import type { Question } from '../../../types';

interface DragDropQuestionProps {
  question: Question;
  dragItem: string | null;
  onDragItem: (item: string) => void;
  onDropInto: (bucket: string) => void;
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: string;
  selectedAnswer: string | null;
}

export const DragDropQuestion: React.FC<DragDropQuestionProps> = ({
  question,
  dragItem,
  onDragItem,
  onDropInto,
  isAnswerChecked,
  isCorrect,
  correctAnswer,
  selectedAnswer,
}) => {
  const buckets = question.categoryBuckets ?? [];
  const items = question.options ?? [];

  return (
    <div className="space-y-4" data-testid="drag-drop-question">
      <p className="text-xs text-slate-500 text-center font-semibold">
        Chạm một từ, rồi chạm vào nhóm đúng để thả từ đó vào.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {items.map((item) => {
          const isUsed = dragItem === item;
          const isThisItemCorrect = selectedAnswer === item && item === correctAnswer;
          const isThisItemWrong = selectedAnswer === item && item !== correctAnswer;

          let itemStyle = 'bg-white border-amber-300 hover:bg-amber-50 active:scale-95 cursor-pointer';
          if (isAnswerChecked) {
            if (isThisItemCorrect) {
              itemStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 cursor-not-allowed';
            } else if (isThisItemWrong) {
              itemStyle = 'bg-rose-50 border-rose-500 text-rose-900 cursor-not-allowed';
            } else {
              itemStyle = 'opacity-40 border-slate-200 cursor-not-allowed';
            }
          } else if (isUsed) {
            itemStyle = 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed';
          }

          return (
            <button
              key={item}
              data-testid="drag-item"
              onClick={() => !isAnswerChecked && onDragItem(item)}
              aria-pressed={isUsed}
              disabled={isAnswerChecked}
              className={`min-h-[52px] px-4 py-2.5 rounded-xl font-black text-sm border-2 transition-all ${itemStyle}`}
            >
              {item}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {buckets.map((bucket) => {
          const isTargetBucket = selectedAnswer === bucket;
          const isCorrectBucket = correctAnswer === bucket;
          let bucketStyle = 'border-slate-300 bg-slate-50 cursor-not-allowed';
          if (dragItem && !isAnswerChecked) {
            bucketStyle = 'border-emerald-400 bg-emerald-50/70 cursor-pointer hover:bg-emerald-100 active:scale-[0.99]';
          } else if (isAnswerChecked) {
            if (isTargetBucket && isCorrectBucket) {
              bucketStyle = 'border-emerald-500 bg-emerald-50';
            } else if (isTargetBucket && !isCorrectBucket) {
              bucketStyle = 'border-rose-500 bg-rose-50';
            } else if (isCorrectBucket) {
              bucketStyle = 'border-emerald-500 bg-emerald-50';
            }
          }

          return (
            <button
              key={bucket}
              data-testid="drop-bucket"
              onClick={() => !isAnswerChecked && dragItem && onDropInto(bucket)}
              disabled={!dragItem || isAnswerChecked}
              className={`min-h-[96px] rounded-2xl border-2 border-dashed p-3 flex flex-col items-center justify-center gap-1 transition-all ${bucketStyle}`}
            >
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                {bucket}
              </span>
              <span className="text-sm font-black text-emerald-950">
                {dragItem && !isAnswerChecked ? dragItem : selectedAnswer && isTargetBucket ? selectedAnswer : '—'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};