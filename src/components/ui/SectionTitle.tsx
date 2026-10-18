import React from 'react';

export interface SectionTitleProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
  divider?: boolean;
  iconPosition?: 'left' | 'right';
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl md:text-2xl',
  lg: 'text-2xl md:text-3xl',
  xl: 'text-3xl md:text-4xl',
};

const iconSizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6 md:w-7 md:h-7',
  lg: 'w-8 h-8 md:w-9 md:h-9',
  xl: 'w-10 h-10 md:w-11 md:h-11',
};

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  icon,
  className = '',
  size = 'md',
  subtitle,
  divider = false,
  iconPosition = 'left',
}) => {
  return (
    <div className={`font-display font-black text-amber-950 ${className}`}>
      <div className={`flex items-center gap-2 ${iconPosition === 'right' ? 'justify-end' : ''}`}>
        {icon && iconPosition === 'left' && (
          <span className={iconSizeClasses[size]} aria-hidden="true">{icon}</span>
        )}
        <h2 className={sizeClasses[size]}>{children}</h2>
        {icon && iconPosition === 'right' && (
          <span className={iconSizeClasses[size]} aria-hidden="true">{icon}</span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-sm font-bold text-slate-600">{subtitle}</p>
      )}
      {divider && (
        <div className="mt-3 h-1 bg-gradient-to-r from-amber-200 via-amber-300 to-transparent rounded-full" />
      )}
    </div>
  );
};