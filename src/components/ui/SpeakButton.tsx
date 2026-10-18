import React from 'react';
import { sound } from '../../services/sound';
import { Volume2, VolumeX } from 'lucide-react';

export interface SpeakButtonProps {
  text: string;
  lang?: 'vi-VN' | 'en-GB';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  showText?: boolean;
  autoPlay?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

const sizeClasses = {
  sm: 'min-w-[40px] min-h-[40px] p-2',
  md: 'min-w-[44px] min-h-[44px] p-2.5',
  lg: 'min-w-[52px] min-h-[52px] p-3',
};

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text,
  lang = 'vi-VN',
  className = '',
  size = 'md',
  ariaLabel = 'Nghe nội dung',
  showText = false,
  autoPlay = false,
  onPlayStart,
  onPlayEnd,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handleClick = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    onPlayStart?.();
    sound.speak(text, lang);
    // Note: Web Speech API doesn't provide a reliable onend callback across all browsers
    // We'll use a timeout as a fallback to reset the playing state
    const estimatedDuration = Math.max(1000, text.length * 80);
    setTimeout(() => {
      setIsPlaying(false);
      onPlayEnd?.();
    }, estimatedDuration);
  };

  React.useEffect(() => {
    if (autoPlay && !isPlaying) {
      handleClick();
    }
  }, [autoPlay, text, lang]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isPlaying}
        aria-label={ariaLabel}
        aria-busy={isPlaying}
        className={`
          flex items-center justify-center rounded-xl
          bg-amber-100 hover:bg-amber-200 text-amber-900
          border-2 border-amber-300
          transition-all active:scale-95 disabled:opacity-60 disabled:cursor-wait
          ${sizeClasses[size]}
          ${className}
        `}
        title={ariaLabel}
      >
        {isPlaying ? (
          <VolumeX className="w-5 h-5 text-rose-500" aria-hidden="true" />
        ) : (
          <Volume2 className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
      {showText && (
        <span className="text-sm font-bold text-slate-700 hidden sm:inline">
          {text}
        </span>
      )}
    </div>
  );
};