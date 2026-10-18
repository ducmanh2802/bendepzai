import React from 'react';

export interface KidCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padded?: boolean;
  bordered?: boolean;
  subjectBorder?: 'viet' | 'math' | 'english' | 'life' | 'games' | 'none';
  onClick?: () => void;
}

const subjectBorderClasses = {
  viet: 'border-4 border-amber-300',
  math: 'border-4 border-blue-300',
  english: 'border-4 border-emerald-300',
  life: 'border-4 border-purple-300',
  games: 'border-4 border-pink-300',
  none: 'border-2 border-amber-200',
};

export const KidCard: React.FC<KidCardProps> = ({
  children,
  className = '',
  hoverable = false,
  padded = true,
  bordered = true,
  subjectBorder = 'none',
  onClick,
}) => {
  const baseClasses = `
    bg-[var(--color-kb-card)]
    rounded-3xl
    shadow-[var(--shadow-soft)]
    transition-all duration-300
    ${bordered ? subjectBorderClasses[subjectBorder] : ''}
    ${hoverable ? 'kb-card-hover cursor-pointer' : ''}
    ${padded ? 'p-5 md:p-6' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <div
      className={baseClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }} : undefined}
    >
      {children}
    </div>
  );
};