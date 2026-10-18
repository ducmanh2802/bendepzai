import React from 'react';
import { sound } from '../../services/sound';

export type KidButtonVariant = 'primary' | 'secondary' | 'subject-viet' | 'subject-math' | 'subject-english' | 'subject-life' | 'subject-games';
export type KidButtonSize = 'md' | 'lg' | 'xl' | 'icon' | 'tile';

export interface KidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: KidButtonVariant;
  size?: KidButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  playClickSound?: boolean;
}

const variantClasses: Record<KidButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/40 border-0',
  secondary: 'bg-white hover:bg-amber-50 text-amber-950 border-3 border-amber-300 shadow-sm',
  'subject-viet': 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/40 border-4 border-amber-300',
  'subject-math': 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/40 border-4 border-blue-300',
  'subject-english': 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/40 border-4 border-emerald-300',
  'subject-life': 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/40 border-4 border-purple-300',
  'subject-games': 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/40 border-4 border-pink-300',
};

// Each size owns its padding AND its alignment. Tailwind v4 emits `px-*` after
// `p-*`, so a padding passed through `className` (e.g. `p-4`) can NOT beat the
// size's `px-8`: a 2-column subject card on a 375px phone kept 32px of side
// padding and only ~90px for its content. Buttons whose layout is not a single
// centred label therefore use a size with explicit padding instead:
//   icon — square 44px+ icon button (header, speaker)
//   tile — card/tile: stretches its content to the full width (no centring
//          overflow on both sides), compact padding on phones
const sizeClasses: Record<KidButtonSize, string> = {
  md: 'items-center justify-center min-h-[52px] px-4 sm:px-6 py-3 text-base',
  lg: 'items-center justify-center min-h-[60px] px-5 sm:px-8 py-3 sm:py-4 text-lg',
  xl: 'items-center justify-center min-h-[68px] px-6 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl',
  icon: 'items-center justify-center min-h-[44px] min-w-[44px] p-2.5 text-base',
  tile: 'flex-col items-stretch min-w-0 p-3 sm:p-4 text-base',
};

export const KidButton: React.FC<KidButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  playClickSound = true,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (playClickSound && !disabled && !isLoading) {
      sound.playClick();
    }
    // Bounce effect: briefly scale down then scale up
    const button = e.currentTarget as HTMLButtonElement;
    button.style.transition = 'transform 0.1s ease-in-out';
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 100);
    onClick?.(e);
  };

  const baseClasses = `
    kb-btn font-black rounded-2xl flex gap-2
    cursor-pointer
    focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-400
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    ${fullWidth ? 'w-full' : ''}
  `;

  // T20A / bug B-08 — `truncate` sets `white-space: nowrap`, so a KidButton
  // used as a CARD (subject cards on Home, whose children are block/flex
  // layout elements) forced all of its content onto one line: the Home
  // subject cards were ~24px wider than a 360px phone and the whole page
  // scrolled sideways. Text labels keep the ellipsis; anything richer gets a
  // shrinkable wrapper that is free to wrap.
  const isTextLabel = typeof children === 'string' || typeof children === 'number';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" stroke="currentColor" strokeWidth="4" cx="12" cy="12" r="10" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 0 0 12h4zm2 5.291A7.962 7.962 0 01-4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
          {isTextLabel ? (
            <span className="truncate">{children}</span>
          ) : size === 'tile' ? (
            <span className="min-w-0 w-full flex-1 flex flex-col">{children}</span>
          ) : (
            <span className="min-w-0">{children}</span>
          )}
          {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};