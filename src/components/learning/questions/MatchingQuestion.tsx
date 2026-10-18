import React, { useState, useRef, useEffect } from 'react';
import type { Question } from '../../../types';

interface MatchingQuestionProps {
  question: Question;
  matchingState: Record<string, string>;
  onMatch: (side: 'left' | 'right', value: string) => void;
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}

interface Pair {
  left: string;
  right: string;
}

const SVG_WIDTH = 600;
const SVG_HEIGHT = 400;
const LEFT_X = 100;
const RIGHT_X = 500;
const TOP_MARGIN = 40;
const ITEM_HEIGHT = 60;

export const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  question,
  matchingState,
  onMatch,
  isAnswerChecked,
  isCorrect,
  correctAnswer,
}) => {
  const pairs = question.matchingPairs ?? [];
  const rightOptions = question.options ? [...question.options] : [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: SVG_WIDTH, height: SVG_HEIGHT });
  const [leftPositions, setLeftPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [rightPositions, setRightPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const height = container.offsetHeight;
    const leftX = 80;
    const rightX = container.offsetWidth - 80;

    const newLeftPositions: Record<string, { x: number; y: number }> = {};
    const newRightPositions: Record<string, { x: number; y: number }> = {};

    pairs.forEach((pair, index) => {
      const y = TOP_MARGIN + index * ITEM_HEIGHT + ITEM_HEIGHT / 2;
      newLeftPositions[pair.left] = { x: leftX, y };
      newRightPositions[pair.right] = { x: rightX, y };
    });

    setLeftPositions(newLeftPositions);
    setRightPositions(newRightPositions);
  }, [pairs, dimensions.width, dimensions.height]);

  const getLineColor = (leftValue: string) => {
    const stored = matchingState[`${question.id}::${leftValue}`];
    const paired = typeof stored === 'string' && stored.includes('=');
    if (paired) return isAnswerChecked ? (isCorrect ? '#10b981' : '#ef4444') : '#10b981';
    if (stored === `L:${leftValue}`) return '#f59e0b';
    return '#d1d5db';
  };

  const getLineWidth = (leftValue: string) => {
    const stored = matchingState[`${question.id}::${leftValue}`];
    const paired = typeof stored === 'string' && stored.includes('=');
    return paired ? 3 : 2;
  };

  const drawLine = (leftValue: string) => {
    const leftPos = leftPositions[leftValue];
    const stored = matchingState[`${question.id}::${leftValue}`];
    const paired = typeof stored === 'string' && stored.includes('=');
    const rightValue = paired ? stored.split('=')[1] : null;
    const rightPos = rightValue ? rightPositions[rightValue] : null;

    if (!leftPos || !rightPos) return null;

    const midX = (leftPos.x + rightPos.x) / 2;
    const path = `M ${leftPos.x} ${leftPos.y} C ${midX} ${leftPos.y}, ${midX} ${rightPos.y}, ${rightPos.x} ${rightPos.y}`;

    return (
      <path
        key={leftValue}
        d={path}
        stroke={getLineColor(leftValue)}
        strokeWidth={getLineWidth(leftValue)}
        fill="none"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    );
  };

  return (
    <div ref={containerRef} className="relative" data-testid="matching-question">
      <svg
        className="absolute inset-0 pointer-events-none z-0"
        width={dimensions.width}
        height={dimensions.height}
        style={{ maxWidth: '100%' }}
      >
        {pairs.map((pair) => drawLine(pair.left))}
      </svg>

      <div className="relative z-10 grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Chạm ô bên trái
          </p>
          {pairs.map((pair) => {
            const stored = matchingState[`${question.id}::${pair.left}`];
            const paired = typeof stored === 'string' && stored.includes('=');
            const rightValue = paired ? stored.split('=')[1] : null;

            return (
              <button
                key={pair.left}
                data-testid="match-left"
                onClick={() => !isAnswerChecked && onMatch('left', pair.left)}
                disabled={isAnswerChecked}
                aria-pressed={paired || stored === `L:${pair.left}`}
                className={`w-full min-h-[56px] px-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-between gap-2 active:scale-[0.99] ${
                  paired
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : stored === `L:${pair.left}`
                    ? 'bg-amber-100 border-amber-500 text-amber-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                }`}
              >
                <span>{pair.left}</span>
                {paired && <span className="text-xs font-black">{rightValue}</span>}
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Chạm ô bên phải
          </p>
          {rightOptions.map((opt) => {
            const isSelected = Object.values(matchingState).includes(`R:${opt}`);
            const isPaired = Object.values(matchingState).some(
              (v) => typeof v === 'string' && v.includes(`=${opt}`)
            );

            return (
              <button
                key={opt}
                data-testid="match-right"
                onClick={() => !isAnswerChecked && onMatch('right', opt)}
                disabled={isAnswerChecked || isPaired}
                aria-pressed={isSelected || isPaired}
                className={`w-full min-h-[56px] px-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center active:scale-[0.99] ${
                  isPaired
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 cursor-not-allowed'
                    : isSelected
                    ? 'bg-amber-100 border-amber-500 text-amber-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center mt-2 hidden sm:block">
        Chạm một ô bên trái, rồi chạm ô bên phải đúng để nối cặp.
      </p>
    </div>
  );
};