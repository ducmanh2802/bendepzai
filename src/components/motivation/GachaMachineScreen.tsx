import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChildProfile } from '../../types';
import { StorageService, GachaResult } from '../../services/storage';
import { STICKERS, STICKER_MAP } from '../../data/stickers';
import { sound } from '../../services/sound';
import { fireCelebrationConfetti } from '../../services/confetti';
import { ArrowLeft, Star, Sparkles, RotateCcw, Gift, Check, CheckCircle } from 'lucide-react';
import { KidButton, KidCard, Pill, SectionTitle } from '../ui';

interface GachaMachineScreenProps {
  profile: ChildProfile;
  onBack: () => void;
  onProfileUpdate: () => void;
}

const MAX_DAILY_DRAWS = 5;

export const GachaMachineScreen: React.FC<GachaMachineScreenProps> = ({
  profile,
  onBack,
  onProfileUpdate,
}) => {
  const [motivation, setMotivation] = useState(StorageService.getMotivationState());
  const [result, setResult] = useState<GachaResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [drawHistory, setDrawHistory] = useState<string[]>([]);
  const machineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMotivation(StorageService.getMotivationState());
  }, [profile.tickets]);

  const drawsToday = motivation.daily.gachaDraws;
  const drawsLeft = Math.max(0, MAX_DAILY_DRAWS - drawsToday);
  const canDraw = profile.tickets >= 1 && drawsLeft > 0;

  const handleDraw = useCallback(() => {
    if (!canDraw || isSpinning) return;

    setIsSpinning(true);
    sound.playClick();

    // Animate the machine
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Perform the actual draw
        const rng = () => Math.random();
        const drawResult = StorageService.drawGacha(rng);

        setResult(drawResult);
        setMotivation(StorageService.getMotivationState());
        onProfileUpdate();

        if (drawResult.ok && drawResult.stickerId) {
          setDrawHistory((prev) => [drawResult.stickerId!, ...prev].slice(0, 10));
          sound.playLevelUp();
          fireCelebrationConfetti();
        } else {
          sound.playWrong();
        }

        setIsSpinning(false);
        setShowResult(true);
      }
    };

    requestAnimationFrame(animate);
  }, [canDraw, isSpinning, onProfileUpdate]);

  const handleCloseResult = useCallback(() => {
    setShowResult(false);
    setResult(null);
  }, []);

  const getStickerById = (id: string) => STICKER_MAP.get(id);

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

      {/* Machine Header */}
      <KidCard subjectBorder="none" className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-2xl p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-wider text-amber-100/80">
                Máy Gắp Sticker
              </span>
              <h1 className="text-3xl md:text-4xl font-black font-display mt-1">
                🎰 Thử Vận May
              </h1>
              <p className="text-amber-50 text-sm md:text-base font-bold mt-2 max-w-md">
                1 vé = 1 lượt · Không trùng cho đến khi đủ 60 sticker · Mỗi 5 trùng tặng 2 sao an ủi
              </p>
            </div>

            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-2xl flex items-center justify-center text-5xl md:text-6xl animate-float-slow">
              🎰
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-3 mt-6 pt-4 border-t border-white/20">
            <Pill variant="star" size="sm" icon="🎟️" className="bg-white/20 border-white/30 text-white">
              <span className="tabular-nums">{profile.tickets}</span> Vé Còn Lại
            </Pill>
            <Pill variant="star" size="sm" icon="🎯" className={drawsLeft > 0 ? 'bg-emerald-500/20 border-emerald-300/50 text-white' : 'bg-rose-500/20 border-rose-300/50 text-white'}>
              Hôm nay: <span className="tabular-nums">{drawsToday}</span> / {MAX_DAILY_DRAWS} lượt
            </Pill>
            <Pill variant="star" size="sm" icon="✨" className="bg-white/20 border-white/30 text-white">
              Tổng lượt: <span className="tabular-nums">{motivation.gachaDrawsTotal}</span>
            </Pill>
          </div>
        </div>
      </KidCard>

      {/* Claw Machine Visualization */}
      <KidCard subjectBorder="none" className="relative">
        <div className="aspect-[4/3] md:aspect-[3/2] bg-gradient-to-b from-slate-50 to-amber-50 rounded-2xl border-3 border-amber-200 relative overflow-hidden flex items-center justify-center">
          {/* Machine body */}
          <div className="relative w-full h-full max-w-xl max-h-[400px] flex flex-col items-center justify-center">
            {/* Glass window */}
            <div className="relative w-full h-3/4 bg-white/80 rounded-xl border-4 border-amber-300 shadow-inner flex items-center justify-center p-4">
              {/* Stickers floating inside */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const radius = isSpinning ? 80 : 60;
                  const speed = isSpinning ? 3 : 0.5;
                  const currentAngle = angle + (Date.now() / 1000) * speed;
                  return (
                    <span
                      key={i}
                      className="absolute text-3xl md:text-4xl transition-all duration-300"
                      style={{
                        transform: `translate(${Math.cos(currentAngle) * radius}px, ${Math.sin(currentAngle) * radius}px)`,
                        opacity: isSpinning ? 0.7 : 1,
                      }}
                    >
                      {STICKERS[i % STICKERS.length].emoji}
                    </span>
                  );
                })}
              </div>

              {/* Claw */}
              <div
                ref={machineRef}
                className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 transition-all duration-500 ${
                  isSpinning ? 'animate-claw-drop' : ''
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-1 h-16 bg-amber-700 rounded-t" />
                  <div className="flex gap-1">
                    <span className="text-3xl transform rotate-12">🤏</span>
                    <span className="text-3xl transform -rotate-12">🤏</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Machine base with controls */}
            <div className="w-full h-1/4 bg-gradient-to-r from-amber-700 to-orange-700 rounded-xl border-2 border-amber-500 flex items-center justify-center gap-4 p-4 mt-2">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                <RotateCcw className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center text-white">
                <p className="text-xs font-bold uppercase tracking-wider">Máy Gắp Sticker</p>
                <p className="text-sm font-black">1 Vé / Lượt</p>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Draw button overlay */}
          <button
            onClick={handleDraw}
            disabled={!canDraw || isSpinning}
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${
              isSpinning
                ? 'bg-slate-400 text-slate-200 cursor-wait animate-pulse'
                : canDraw
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 active:scale-95'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
            style={{ minWidth: '200px' }}
          >
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 animate-spin" />
                Đang Gắp...
              </span>
            ) : canDraw ? (
              <span className="flex items-center gap-2">
                🎟️ Gắp Ngay ({drawsLeft} lượt còn lại)
              </span>
            ) : profile.tickets < 1 ? (
              <span className="flex items-center gap-2">Hết Vé! Học Bài Để Nhận Vé</span>
            ) : (
              <span className="flex items-center gap-2">Hết Lượt Hôm Nay! Mai Thử Lại</span>
            )}
          </button>
        </div>
      </KidCard>

      {/* Draw History */}
      {drawHistory.length > 0 && (
        <KidCard subjectBorder="none" className="space-y-3">
          <SectionTitle icon="📜" size="md">
            Lịch Sử Gần Đây
          </SectionTitle>
          <div className="flex flex-wrap gap-2 justify-center">
            {drawHistory.map((stickerId, idx) => {
              const sticker = getStickerById(stickerId);
              if (!sticker) return null;
              return (
                <button
                  key={`${stickerId}-${idx}`}
                  className="p-2 rounded-xl bg-white border-2 border-amber-200 shadow-xs flex items-center gap-1.5"
                  aria-label={`${sticker.name} (${sticker.rarity})`}
                >
                  <span className="text-2xl">{sticker.emoji}</span>
                  <span className="text-xs font-bold text-slate-700 hidden sm:inline">{sticker.name}</span>
                  {sticker.rarity === 'hiem' && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />}
                  {sticker.rarity === 'sieu-hiem' && <Sparkles className="w-3.5 h-3.5 text-rose-500" />}
                </button>
              );
            })}
          </div>
        </KidCard>
      )}

      {/* Result Modal */}
      {showResult && result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={handleCloseResult}
          role="dialog"
          aria-modal="true"
          aria-label="Kết quả máy gắp sticker"
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border-4 border-amber-200 animate-pop-in text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {result.ok ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">
                  {getStickerById(result.stickerId!)?.emoji ?? '🎁'}
                </div>
                <h2 className="text-2xl font-black font-display text-amber-950 mb-2">
                  {result.isNew ? 'Sticker Mới!' : 'Sticker Trùng'}
                </h2>
                <p className="text-lg font-bold text-slate-700 mb-4">
                  Bé nhận được <span className="text-amber-700">{getStickerById(result.stickerId!)?.name ?? 'Sticker'}</span>!
                </p>
                {result.consolationStars && result.consolationStars > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                    <span className="text-amber-700 font-black">+{result.consolationStars} Sao An Ủi (5 trùng = 2 sao)</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 mb-6">
                  {result.isNew && <CheckCircle className="w-8 h-8 text-emerald-500" />}
                  <span className={`${result.isNew ? 'text-emerald-700' : 'text-amber-700'} font-black`}>
                    {result.isNew ? 'Đã lưu vào Album!' : 'Đã cộng vào số lượng'}
                  </span>
                </div>
                <KidButton
                  variant="primary"
                  size="lg"
                  onClick={handleCloseResult}
                  className="min-w-[160px]"
                >
                  Tuyệt Vời!
                </KidButton>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😢</div>
                <h2 className="text-2xl font-black font-display text-rose-600 mb-2">
                  Không Thể Gắp
                </h2>
                <p className="text-lg font-bold text-slate-700 mb-4">
                  {result.reason === 'no-ticket'
                    ? 'Bé hết vé rồi. Hãy học bài để nhận thêm vé nhé!'
                    : 'Hôm nay bé đã gắp đủ 5 lượt. Mai hãy thử lại nhé!'}
                </p>
                <KidButton
                  variant="secondary"
                  size="lg"
                  onClick={handleCloseResult}
                  className="min-w-[160px]"
                >
                  Hiểu Rồi
                </KidButton>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};