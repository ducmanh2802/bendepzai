import React, { useEffect, useState, useCallback } from 'react';
import { ActiveScreen, ChildProfile } from '../../types';
import { StorageService } from '../../services/storage';
import { sound } from '../../services/sound';
import { Star, Sparkles, Flame, Volume2, VolumeX, Shield, ShoppingBag } from 'lucide-react';
import { KidButton, Pill } from '../ui';
import { NAVIGATION, getSubjectColor } from '../../config/navigation';

interface HeaderProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  profile: ChildProfile;
  onOpenParent: () => void;
  onOpenShop: () => void;
}

const getTimeOfDay = (): 'sáng' | 'chiều' | 'tối' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'sáng';
  if (hour >= 11 && hour < 18) return 'chiều';
  return 'tối';
};

const getEncouragementPhrase = (timeOfDay: 'sáng' | 'chiều' | 'tối', hasStreak: boolean): string => {
  const phrases: Record<'sáng' | 'chiều' | 'tối', string> = {
    sáng: 'Chào buổi sáng bé oir!',
    chiều: 'Bé làm tốt lắm!',
    tối: 'Ngủ gật đi bé, gấu sẽ chờ bé mai!',
  };
  if (hasStreak) {
    return 'Bền bỉ lắm bé!';
  }
  return phrases[timeOfDay];
};

const NavLink: React.FC<{
  item: (typeof NAVIGATION)[number];
  current: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  /** T01B/3 — ở 1024–1280 chỉ hiện icon (vừa khít, không tràn). */
  iconOnly?: boolean;
}> = ({ item, current, onNavigate, iconOnly = false }) => {
  const activeColor = getSubjectColor(item.screen);
  return (
    <button
      onClick={() => {
        sound.playClick();
        onNavigate(item.screen);
      }}
      aria-current={current === item.screen ? 'page' : undefined}
      // T01B/11 — QA hook thống nhất cho mọi mục điều hướng.
      data-testid={`nav-${item.screen}`}
      aria-label={item.label}
      title={item.label}
      className={`min-h-[44px] ${iconOnly ? 'min-w-[44px] px-2.5 justify-center' : 'px-3'} rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
        current === item.screen
          ? `bg-${activeColor}-100 text-${activeColor}-950 font-black shadow-xs`
          : 'text-slate-600 hover:text-amber-950 hover:bg-amber-50/60'
      }`}
    >
      <span aria-hidden="true">{item.icon}</span>
      {iconOnly ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
    </button>
  );
};

const bearReactionPhrases = [
  'Gấu rất thích khi bé chơi với gấu!',
  'Bé đang làm tốt lắm, gấu đang 지켜 thu!',
  'Hết! Gấu cười lên!',
  'Bouncing!',
  'Hết lâu rưỡi!',
];

const bearRandomReaction = (
  setShowBearReaction: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  const randomIndex = Math.floor(Math.random() * bearReactionPhrases.length);
  const phrase = bearReactionPhrases[randomIndex];

  // Play corresponding sound
  if (typeof window !== 'undefined' && !sound.getMuted()) {
    try {
      if (randomIndex === 0) {
        // Laugh
        const utterance = new SpeechSynthesisUtterance('haha');
        utterance.rate = 0.8;
 utterance.pitch = 1.3;
        window.speechSynthesis.speak(utterance);
      } else if (randomIndex === 1) {
        // Encouragement
        const utterance = new SpeechSynthesisUtterance('chanh');
        utterance.rate = 0.7;
 utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      } else if (randomIndex === 2) {
        // Sneeze
        const utterance = new SpeechSynthesisUtterance('huh');
 utterance.rate = 0.5;
 utterance.pitch = 0.8;
        window.speechSynthesis.speak(utterance);
      } else {
        // Just play click
        sound.playClick();
      }
    } catch {}
  }

  // Show temporary visual feedback
  setShowBearReaction(true);
  setTimeout(() => setShowBearReaction(false), 2000);
};

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  profile,
  onOpenParent,
  onOpenShop,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());
  const [lastPhraseTime, setLastPhraseTime] = useState<number>(0);
  const [showBearReaction, setShowBearReaction] = useState(false);

  // Check days since last play using analytics todayDate
  useEffect(() => {
    const analytics = StorageService.getAnalytics();
    const today = new Date().toISOString().split('T')[0];
    const lastPlayedDate = analytics.todayDate;
    const daysSinceLastPlay = lastPlayedDate !== today && lastPlayedDate ? 1 : 0;
    // Just track if we played today, no complex day counting needed
  }, []);

  // Play contextual greeting when component mounts or time changes
  useEffect(() => {
    const timeOfDay = getTimeOfDay();
    const hasStreak = profile.streak > 0;
    const phrase = getEncouragementPhrase(timeOfDay, hasStreak);
    const now = Date.now();

    // Only play if enough time has passed (avoid spamming)
    if (now - lastPhraseTime > 24 * 60 * 60 * 1000) {
      // Don't play if muted
      if (!isMuted) {
        sound.speak(phrase, 'vi-VN');
      }
      setLastPhraseTime(now);
    }
  }, [isMuted]);

  // Handle bear touch reaction
  const handleBearClick = () => {
    sound.playClick();
    bearRandomReaction(setShowBearReaction);
    setShowBearReaction(true);
    setTimeout(() => setShowBearReaction(false), 2000);
  };

  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
    if (!next) sound.playClick();
  };

  // Use single navigation config (T06) — exactly 5 items
  const navItems = NAVIGATION;

  return (
    <header
      className="sticky top-0 z-40 w-full bg-[var(--color-kb-card)]/95 backdrop-blur-md border-b-2 border-amber-200/80 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Single text element wordmark */}
        <KidButton
          variant="secondary"
          size="icon"
          className="gap-2 text-left shrink-0 sm:justify-start sm:px-4"
          onClick={() => {
            sound.playClick();
            onNavigate('home');
          }}
          aria-label="Về trang chủ"
        >
          <span className="text-2xl" aria-hidden="true">🐻</span>
          <span className="hidden sm:inline text-lg xl:text-xl font-black text-amber-950 tracking-tight font-display truncate">
            Kho Báu Tri Thức
          </span>
          <span className="sm:hidden sr-only">Kho Báu Tri Thức — Về trang chủ</span>
        </KidButton>

        {/* Zone 2: navigation (T01/B11 + T01B/3 + T06).
          >= 1024px (lg) only the top nav shows; < 1024px only the bottom nav
          shows (see App.tsx). lg–2xl shows ALL 5 destinations as ICON-ONLY
          (hover/title + aria-label giữ tên đầy đủ) so the bar provably fits
          1024/1280/1440; 2xl+ shows the full set with labels.
        */}
        <nav aria-label="Điều hướng chính" className="hidden lg:flex 2xl:hidden items-center gap-1">
          {navItems.map((item) => (
            <NavLink key={item.screen} item={item} current={currentScreen} onNavigate={onNavigate} iconOnly />
          ))}
        </nav>
        <nav aria-label="Điều hướng chính (đầy đủ)" className="hidden 2xl:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink key={item.screen} item={item} current={currentScreen} onNavigate={onNavigate} />
          ))}
        </nav>

        {/* Zone 3: primary actions & kid profile stats */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          {/* Bear mascot touch reaction. It used to be `absolute top-2 right-2`
              on the header, i.e. painted on top of the "Ba Mẹ" button at the
              right edge, and was shown from a one-off `window.innerWidth`
              check at render time. Now it is a normal item of this row, shown
              by CSS from 375px. T20A / B-07 — 44px touch target kept. */}
          <button
            onClick={handleBearClick}
            aria-label="Phản ứng từ Linh thú Gấu"
            className="hidden min-[375px]:flex shrink-0 w-11 h-11 rounded-full bg-amber-100 border border-amber-200 items-center justify-center text-amber-600 text-xs font-bold transition-transform hover:bg-amber-200 active:scale-90"
          >
            🐾
          </button>

          {/* Streak indicator */}
          <Pill
            variant="streak"
            size="sm"
            icon={<Flame className="w-4 h-4 fill-orange-500 text-orange-500" aria-hidden="true" />}
            className="hidden md:flex"
          >
            <span className="tabular-nums">{profile.streak}</span>
            <span className="sr-only">ngày liên tiếp</span>
          </Pill>

          {/* Stars indicator */}
          <Pill
            variant="star"
            size="sm"
            icon={<Star className="w-4 h-4 fill-amber-400 text-amber-500" aria-hidden="true" />}
            className="hidden sm:flex"
          >
            <span className="tabular-nums">{profile.stars}</span>
            <span className="sr-only">ngôi sao</span>
          </Pill>

          {/* XP counter — T01B/3: chỉ hiện từ xl (1280+) để không tràn ở 1024 */}
          <Pill
            variant="level"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />}
            className="hidden xl:flex"
          >
            <span className="tabular-nums">{profile.xp} XP</span>
          </Pill>

          {/* Avatar Shop Button */}
          <KidButton
            variant="secondary"
            size="icon"
            className="shrink-0"
            onClick={() => {
              sound.playClick();
              onOpenShop();
            }}
            aria-label="Tủ đồ thời trang và Linh thú"
            leftIcon={<ShoppingBag className="w-4 h-4" aria-hidden="true" />}
          />

          {/* Sound Mute Toggle — hidden on extremely narrow widths (200% zoom):
              it duplicates the Parent Dashboard sound control and every game
              has its own mute toggle, so nothing becomes unreachable. */}
          <KidButton
            variant="secondary"
            size="icon"
            className="shrink-0 max-[300px]:hidden"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-pressed={isMuted}
            leftIcon={isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            )}
          />

          {/* Parent Mode Gate button */}
          <KidButton
            variant="primary"
            size="icon"
            className="shrink-0 lg:px-3"
            onClick={() => {
              sound.playClick();
              // T20A / B-05 — this used to read `onOpenParent;` (a no-op), so the
              // "Ba Mẹ" button opened nothing and the whole parent area was
              // unreachable from the header.
              onOpenParent();
            }}
            aria-label="Khu vực dành cho Ba Mẹ"
            leftIcon={<Shield className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />}
            rightIcon={<span className="hidden lg:inline">Ba Mẹ</span>}
          />
        </div>
      </div>
    </header>
  );
};