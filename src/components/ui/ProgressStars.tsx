import React from 'react';
import { Star } from 'lucide-react';

export interface ProgressStarsProps {
  current: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
  filledColor?: 'gold' | 'amber' | 'subject';
  subject?: 'viet' | 'math' | 'english' | 'life' | 'games';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

const filledColors = {
  gold: 'fill-amber-400 text-amber-500',
  amber: 'fill-amber-400 text-amber-500',
  subject: '', // will be set per subject
};

const subjectFilledColors = {
  viet: 'fill-amber-400 text-amber-500',
  math: 'fill-blue-400 text-blue-500',
  english: 'fill-emerald-400 text-emerald-500',
  life: 'fill-purple-400 text-purple-500',
  games: 'fill-pink-400 text-pink-500',
};

const subjectEmptyColors = {
  viet: 'text-amber-200',
  math: 'text-blue-200',
  english: 'text-emerald-200',
  life: 'text-purple-200',
  games: 'text-pink-200',
};

export const ProgressStars: React.FC<ProgressStarsProps> = ({
  current,
  max,
  size = 'md',
  showCount = false,
  className = '',
  filledColor = 'gold',
  subject,
}) => {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const filledClass = subject
    ? subjectFilledColors[subject]
    : filledColors[filledColor];
  const emptyClass = subject
    ? subjectEmptyColors[subject]
    : 'text-slate-200';

  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`${current} trên ${max} sao`}>
      {stars.map((star) => (
        <Star
          key={star}
          className={`
            ${sizeClasses[size]}
            ${star <= current ? filledClass : emptyClass}
            transition-all duration-300
          `}
          fill={star <= current ? 'currentColor' : 'none'}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      ))}
      {showCount && (
        <span className="ml-1.5 text-xs font-black tabular-nums text-slate-600">
          {current}/{max}
        </span>
      )}
    </div>
  );
};