import React, { useEffect, useCallback } from 'react';
import { LevelClaimResult } from '../../services/storage';
import { sound } from '../../services/sound';
import { fireCelebrationConfetti } from '../../services/confetti';
import { Star, Sparkles, Award, Gift, Ticket, CheckCircle } from 'lucide-react';
import { KidButton } from '../ui';

interface LevelUpCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: LevelClaimResult;
  currentLevel: number;
  levelTitle: string;
}

/**
 * T20A — one source of truth for "the celebration is really on screen".
 *
 * Both the reward effect and the early return must use the exact same
 * predicate, otherwise the fanfare can fire while nothing is shown (or the
 * modal can appear silently).
 */
export function shouldCelebrateLevelUp(isOpen: boolean, result: LevelClaimResult): boolean {
  return isOpen && result.claimed.length > 0;
}

/**
 * T20A — the reward fanfare, extracted so it can be unit-tested: this repo
 * ships no DOM renderer, so the effect itself cannot be mounted in tests.
 */
export function playLevelUpCelebration(): void {
  sound.playLevelUp();
  fireCelebrationConfetti();
}

export const LevelUpCelebrationModal: React.FC<LevelUpCelebrationModalProps> = ({
  isOpen,
  onClose,
  result,
  currentLevel,
  levelTitle,
}) => {
  useEffect(() => {
    if (shouldCelebrateLevelUp(isOpen, result)) {
      playLevelUpCelebration();
    }
  }, [isOpen, result]);

  // T20A / B-02 — Rules of Hooks: every hook must run on EVERY render. The
  // early return used to sit between useEffect and useCallback, so opening the
  // celebration (from a "render nothing" state) added a hook and React threw
  // #310 — which unmounted the whole app right after a lesson was completed.
  const handleClose = useCallback(() => {
    sound.playClick();
    onClose();
  }, [onClose]);

  if (!shouldCelebrateLevelUp(isOpen, result)) return null;

  const newLevels = result.claimed;
  const highestLevel = Math.max(...newLevels);
  const isNewTitle = highestLevel === currentLevel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Chúc mừng lên level"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border-4 border-amber-200 animate-pop-in text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background decoration */}
        <div className="absolute top-4 right-4 text-6xl opacity-20 pointer-events-none animate-pulse-slow">✨</div>
        <div className="absolute -bottom-4 -left-4 text-8xl opacity-15 pointer-events-none">⭐</div>

        {/* Level badge */}
        <div className="relative z-10 mb-6">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-3xl shadow-xl">
            <span className="text-3xl">🎉</span>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-wider">Level Mới</p>
              <p className="text-2xl font-black font-display">{highestLevel}</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-black font-display text-amber-950 mb-2 relative z-10">
          Chúc Mừng {isNewTitle ? 'Bé Đã Lên Cấp!' : 'Nhận Thưởng Level!'}
        </h2>

        {isNewTitle && (
          <p className="text-lg font-bold text-slate-700 mb-6 relative z-10">
            Danh hiệu mới: <span className="text-amber-700">{levelTitle}</span>
          </p>
        )}

        {/* Rewards */}
        <div className="relative z-10 space-y-3 mb-6">
          {(result.stars > 0 || result.tickets > 0 || result.stickerIds.length > 0) && (
            <div className="flex flex-col items-center gap-3">
              {result.stars > 0 && (
                <div className="flex items-center justify-center gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl w-full max-w-xs">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Nhận Thưởng</p>
                    <p className="text-xl font-black text-amber-950">+{result.stars} Sao Vàng</p>
                  </div>
                </div>
              )}

              {result.tickets > 0 && (
                <div className="flex items-center justify-center gap-3 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl w-full max-w-xs">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Ticket className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Nhận Thưởng</p>
                    <p className="text-xl font-black text-rose-950">+{result.tickets} Vé Máy Gắp</p>
                  </div>
                </div>
              )}

              {result.stickerIds.length > 0 && (
                <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl w-full max-w-xs">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sticker Mới</p>
                    <p className="text-xl font-black text-emerald-950">+{result.stickerIds.length} Sticker</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List of claimed levels */}
          {newLevels.length > 1 && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Các Level Vừa Nhận Thưởng
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {newLevels.map((level) => (
                  <span
                    key={level}
                    className={`px-3 py-1.5 rounded-full text-xs font-black ${
                      level === highestLevel
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Level {level} {level === highestLevel && '✨'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mascot celebration */}
        <div className="relative z-10 mb-6">
          <div className="text-7xl md:text-8xl animate-bounce">🐻</div>
          <p className="text-sm font-bold text-amber-700 mt-2">Gấu Bút Chì đang ăn mừng cùng bé! 🎉</p>
        </div>

        {/* Close button */}
        <KidButton
          variant="primary"
          size="xl"
          onClick={handleClose}
          className="min-w-[200px] relative z-10"
          rightIcon={<Sparkles className="w-5 h-5" />}
        >
          Tuyệt Vời!
        </KidButton>
      </div>
    </div>
  );
};