import React, { useState, useEffect, useCallback } from 'react';
import { ChildProfile } from '../../types';
import { StorageService } from '../../services/storage';
import { STICKERS, STICKER_SETS, getStickersBySet } from '../../data/stickers';
import { sound } from '../../services/sound';
import { fireCelebrationConfetti } from '../../services/confetti';
import { ArrowLeft, Star, Sparkles, ArrowRight, CheckCircle, Award } from 'lucide-react';
import { KidButton, KidCard, Pill, SectionTitle } from '../ui';

interface StickerAlbumScreenProps {
  profile: ChildProfile;
  onBack: () => void;
  onProfileUpdate: () => void;
}

const STICKERS_PER_PAGE = 10;

export const StickerAlbumScreen: React.FC<StickerAlbumScreenProps> = ({
  profile,
  onBack,
  onProfileUpdate,
}) => {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [showSetComplete, setShowSetComplete] = useState<string | null>(null);
  const [motivation, setMotivation] = useState(StorageService.getMotivationState());

  useEffect(() => {
    setMotivation(StorageService.getMotivationState());
  }, [profile.xp, profile.stars]);

  const currentSet = STICKER_SETS[currentSetIndex];
  const setStickers = getStickersBySet(currentSet.id);
  const ownedCount = setStickers.filter((s) => motivation.stickers[s.id] > 0).length;
  const isSetComplete = ownedCount === 10;

  const handlePrevSet = useCallback(() => {
    sound.playClick();
    setCurrentSetIndex((prev) => (prev === 0 ? STICKER_SETS.length - 1 : prev - 1));
  }, []);

  const handleNextSet = useCallback(() => {
    sound.playClick();
    setCurrentSetIndex((prev) => (prev === STICKER_SETS.length - 1 ? 0 : prev + 1));
  }, []);

  const handleSetComplete = useCallback((setId: string) => {
    sound.playLevelUp();
    fireCelebrationConfetti();
    setShowSetComplete(setId);
    setTimeout(() => setShowSetComplete(null), 3000);
  }, []);

  const goToGacha = useCallback(() => {
    sound.playClick();
    // Navigation will be handled by parent App
    // For now, we'll add a callback prop later
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-6 space-y-6 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-4 min-h-[44px] py-2 bg-white hover:bg-amber-50 border-2 border-amber-300 rounded-2xl font-bold text-xs md:text-sm text-amber-950 transition-all active:scale-95 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang Chủ</span>
        </button>

        <div className="flex items-center gap-3">
          <Pill variant="ticket" size="sm" icon="🎟️">
            <span className="tabular-nums">{profile.tickets}</span> Vé
          </Pill>
          <Pill variant="star" size="sm" icon="⭐">
            <span className="tabular-nums">{profile.stars}</span> Sao
          </Pill>
        </div>
      </div>

      {/* Album Cover / Header */}
      <KidCard subjectBorder="none" className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-wider text-amber-100/80">
                Album Sưu Tầm
              </span>
              <h1 className="text-3xl md:text-4xl font-black font-display mt-1">
                {currentSet.emoji} {currentSet.name}
              </h1>
              <p className="text-amber-50 text-sm md:text-base font-bold mt-2 max-w-md">
                {currentSet.description}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                <Pill variant="star" size="md" icon="⭐" className="bg-white/20 border-white/30 text-white">
                  <span className="tabular-nums">{ownedCount}</span> / 10 Sticker
                </Pill>
                {isSetComplete && (
                  <Pill variant="star" size="md" icon="🏵️" className="bg-emerald-500 border-emerald-300 text-white animate-pulse-subtle">
                    Đã Hoàn Thành Bộ!
                  </Pill>
                )}
              </div>
            </div>

            {/* Set mascot decoration */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white/10 rounded-3xl flex items-center justify-center text-6xl md:text-7xl animate-float-slow">
              {currentSet.emoji}
              {isSetComplete && (
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl animate-bounce">
                  ✓
                </span>
              )}
            </div>
          </div>

          {/* Page indicator dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {STICKER_SETS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sound.playClick();
                  setCurrentSetIndex(idx);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentSetIndex
                    ? 'bg-white w-6'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Bộ ${idx + 1}: ${STICKER_SETS[idx].name}`}
              />
            ))}
          </div>
        </div>
      </KidCard>

      {/* Sticker Grid - Page Flip Style */}
      <KidCard subjectBorder="none" className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="📄" size="md" className="mb-0">
            Trang {currentSetIndex + 1} / {STICKER_SETS.length}
          </SectionTitle>
          <div className="flex items-center gap-2">
            <KidButton
              variant="secondary"
              size="md"
              onClick={handlePrevSet}
              aria-label="Bộ trước"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            />
            <KidButton
              variant="secondary"
              size="md"
              onClick={handleNextSet}
              aria-label="Bộ sau"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            />
          </div>
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-5 gap-3"
          role="list"
          aria-label={`Sticker bộ ${currentSet.name}`}
        >
          {setStickers.map((sticker, index) => {
            const count = motivation.stickers[sticker.id] ?? 0;
            const isOwned = count > 0;
            const rarityColors = {
              thuong: 'border-slate-200 bg-slate-50',
              hiem: 'border-amber-200 bg-amber-50',
              'sieu-hiem': 'border-rose-200 bg-rose-50',
            };
            const rarityGlow = {
              thuong: '',
              hiem: 'shadow-amber-200/50',
              'sieu-hiem': 'shadow-rose-200/50',
            };

            return (
              <button
                key={sticker.id}
                disabled={!isOwned}
                className={`relative aspect-square rounded-2xl border-2 transition-all ${
                  isOwned
                    ? `${rarityColors[sticker.rarity]} shadow-md hover:shadow-lg hover:scale-105 cursor-pointer ${rarityGlow[sticker.rarity]}`
                    : 'border-dashed border-slate-200 bg-slate-50/50 cursor-default'
                }`}
                aria-label={isOwned ? `${sticker.name} (${count})` : `Chưa có: ${sticker.name}`}
                onClick={() => {
                  if (isOwned) sound.playClick();
                }}
              >
                {/* Empty slot shadow */}
                {!isOwned && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-4xl md:text-5xl opacity-20">{sticker.emoji}</span>
                  </div>
                )}

                {/* Sticker */}
                {isOwned && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <span className="text-4xl md:text-5xl mb-1 drop-shadow-sm">{sticker.emoji}</span>
                    <span className="text-[9px] md:text-[10px] font-black text-center text-slate-700 leading-tight px-1">
                      {sticker.name}
                    </span>
                    {count > 1 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-[10px] font-black">
                        x{count}
                      </span>
                    )}
                  </div>
                )}

                {/* Rarity indicator */}
                <div className="absolute bottom-1 left-1 flex gap-0.5">
                  {sticker.rarity === 'hiem' && (
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                  )}
                  {sticker.rarity === 'sieu-hiem' && (
                    <>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                      <Sparkles className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={isSetComplete ? 'h-full bg-emerald-500' : 'h-full bg-gradient-to-r from-amber-500 to-orange-500'}
              style={{ width: `${(ownedCount / 10) * 100}%` }}
              role="progressbar"
              aria-valuenow={ownedCount}
              aria-valuemin={0}
              aria-valuemax={10}
            />
          </div>
          <p className="text-xs text-slate-500 font-bold text-center mt-1">
            {isSetComplete ? '🎉 Bộ đã hoàn thành! Nhận huy hiệu!' : `Còn ${10 - ownedCount} sticker để hoàn thành bộ`}
          </p>
        </div>
      </KidCard>

      {/* Gacha Button */}
      <KidCard subjectBorder="none" className="space-y-3">
        <SectionTitle icon="🎰" size="md">
          Máy Gắp Sticker
        </SectionTitle>
        <p className="text-xs text-slate-500 font-bold text-center">
          1 vé / lượt · Không trùng tới khi đủ 60 sticker · Tối đa 5 lượt/ngày
        </p>
        <KidButton
          variant="primary"
          size="xl"
          fullWidth
          className="min-h-[56px] text-lg font-black gap-2"
          onClick={goToGacha}
          disabled={profile.tickets < 1}
          leftIcon="🎟️"
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Quay Máy Gắp ({profile.tickets} vé)
        </KidButton>
      </KidCard>

      {/* Set Complete Celebration Modal */}
      {showSetComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowSetComplete(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Chúc mừng hoàn thành bộ sticker"
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border-4 border-amber-200 animate-pop-in text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-4 animate-bounce">🏵️</div>
            <h2 className="text-2xl font-black font-display text-amber-950 mb-2">
              Chúc Mừng Bé!
            </h2>
            <p className="text-lg font-bold text-slate-700 mb-4">
              Đã hoàn thành bộ <span className="text-amber-700">{currentSet.name}</span>!
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Award className="w-8 h-8 text-amber-500" />
              <span className="text-amber-700 font-black">+ Huy hiệu bộ sưu tập</span>
            </div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-rose-500" />
              <span className="text-rose-600 font-black">Gấu Bút Chì đang ăn mừng! 🐻🎉</span>
            </div>
            <KidButton
              variant="primary"
              size="lg"
              onClick={() => setShowSetComplete(null)}
              className="min-w-[160px]"
            >
              Tuyệt Vời!
            </KidButton>
          </div>
        </div>
      )}
    </div>
  );
};