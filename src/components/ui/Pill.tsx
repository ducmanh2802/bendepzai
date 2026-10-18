import React from 'react';

export type PillVariant = 'star' | 'streak' | 'ticket' | 'level' | 'subject-viet' | 'subject-math' | 'subject-english' | 'subject-life' | 'subject-games' | 'default';

export interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  removable?: boolean;
  onRemove?: () => void;
}

const variantClasses: Record<PillVariant, string> = {
  star: 'bg-amber-50 text-amber-900 border-2 border-amber-200',
  streak: 'bg-orange-50 text-orange-900 border-2 border-orange-200',
  ticket: 'bg-purple-50 text-purple-900 border-2 border-purple-200',
  level: 'bg-sky-50 text-sky-900 border-2 border-sky-200',
  'subject-viet': 'bg-amber-50 text-amber-900 border-2 border-amber-200',
  'subject-math': 'bg-blue-50 text-blue-900 border-2 border-blue-200',
  'subject-english': 'bg-emerald-50 text-emerald-900 border-2 border-emerald-200',
  'subject-life': 'bg-purple-50 text-purple-900 border-2 border-purple-200',
  'subject-games': 'bg-pink-50 text-pink-900 border-2 border-pink-200',
  default: 'bg-slate-50 text-slate-900 border-2 border-slate-200',
};

const sizeClasses = {
  xs: 'px-2 py-0.5 text-[9px] gap-0.5',
  sm: 'px-2.5 py-1 text-[11px] gap-1',
  md: 'px-3 py-1.5 text-xs gap-1.5',
  lg: 'px-4 py-2 text-sm gap-2',
};

export const Pill: React.FC<PillProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
  iconPosition = 'left',
  removable = false,
  onRemove,
}) => {
  // T20A / bug B-06 — a display utility passed through `className` must win
  // over the base `inline-flex`. Tailwind emits `.hidden` BEFORE
  // `.inline-flex`, so `<Pill className="hidden md:flex">` never hid and the
  // header's stat pills stayed on screen at 360px, pushing the whole header
  // 179px past the viewport (horizontal scrolling on every phone).
  const hasDisplayUtility =
    /(?:^|\s)(?:hidden|block|inline|inline-block|inline-flex|flex|grid|table|contents)(?:\s|$)/.test(className);
  const baseClasses = hasDisplayUtility
    ? 'items-center font-black rounded-full border'
    : 'inline-flex items-center font-black rounded-full border';

  return (
    <span
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {iconPosition === 'left' && icon && <span aria-hidden="true">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
      {iconPosition === 'right' && icon && <span aria-hidden="true">{icon}</span>}
      {removable && onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Xóa"
        >
          ×
        </button>
      )}
    </span>
  );
};