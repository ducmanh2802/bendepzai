import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildMarketRounds, type MarketRound } from '../../data/games/ten_frame_market';
import { TenFrame } from '../visuals/TenFrame';
import { PlaceValueBlocks } from '../visuals/PlaceValueBlocks';

export { buildMarketRounds };

const ROUNDS_PER_TIER = defaultRoundsPerTier();

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

export const TenFrameMarketGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'ten_frame_market', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1400 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildMarketRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="ten_frame_market"
      title="Chợ Khung 10"
      subtitle="Giúp khách mua đủ quả, đủ que, đủ tiền"
      mascotEmoji="🐻"
      score={stage.score}
      isGameOver={stage.isGameOver}
      phase={stage.phase}
      tier={stage.tier}
      tierMeta={stage.tierMeta}
      tierCount={stage.tierCount}
      roundNumber={stage.roundNumber}
      roundTotal={stage.roundTotal}
      starsEarned={stage.starsEarned}
      nextTierMeta={stage.tier + 1 <= stage.tierCount ? getTierMeta(stage.tier + 1) : undefined}
      onNextTier={stage.startNextTier}
      earnedXp={stage.xpEarned}
      earnedStars={stage.starsEarned}
      prevBestStars={stage.prevBestStars}
      onRestart={stage.restartGame}
      onExit={onExit}
      instructions="Nhìn khay, tính xem khách còn thiếu mấy rồi chạm số đúng nhé!"
      audioInstruction={current ? current.prompt : undefined}
      audioLang="vi-VN"
      praiseSubject="MATH"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-blue-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">🧺</span>
          <h3 className="text-2xl md:text-3xl font-black text-blue-900">Chợ Khung 10</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Các bạn thú tới chợ mua hàng! Khay 10 ô đã có một ít quả —
            bé bấm thêm quả cho đủ, rồi trả lời “cần thêm mấy” nhé!
          </p>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Màn cao có 2 khay (đến 20), bó que tính chục–đơn vị và tiền hàng nữa đấy!
          </p>
          <div className="flex items-center gap-2 text-lg font-black bg-blue-50 rounded-2xl px-4 py-2 border-2 border-blue-200" aria-hidden="true">
            <span>🐰 cần 10 🍎, khay có 6</span>
            <span>→</span>
            <span className="text-blue-700">thêm 4!</span>
          </div>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <TenFrameMarketStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const TenFrameMarketStage: React.FC<{ stage: GameStage; current: MarketRound }> = ({ stage, current }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [added, setAdded] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);

  useEffect(() => {
    setAdded(0);
  }, [current.id]);

  const filled = Math.min(current.have + added, current.target);
  const showChuc = Math.floor(filled / 10);
  const showDonVi = filled % 10;

  const handleAdd = (step = 1) => {
    if (stage.locked) return;
    if (added < current.need) {
      setAdded((a) => Math.min(a + step, current.need));
      sound.playClick();
    }
  };

  const handlePick = (opt: number) => {
    if (stage.locked) return;
    if (opt === current.need) {
      sound.playCorrect();
      window.setTimeout(() => {
        sound.speak(`Đúng rồi! Cần thêm ${current.need}!`, 'vi-VN');
      }, 350);
      reportCorrect(String(opt));
      stage.submitCorrect();
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong(String(opt), String(current.need));
      sound.speak('Chưa đúng, bé đếm lại khay nhé!', 'vi-VN');
      stage.submitWrong();
    }
  };

  useEffect(() => {
    if (stage.locked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= current.options.length) {
        e.preventDefault();
        handlePick(current.options[n - 1]);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleAdd();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3 md:gap-4">
      <div className="flex items-center gap-3 bg-white/95 rounded-3xl px-5 py-2.5 shadow-md border-2 border-blue-200 max-w-full">
        <span className="text-5xl md:text-6xl shrink-0" aria-hidden="true">{current.customerEmoji}</span>
        <div className="min-w-0">
          <p className="text-base md:text-xl font-black text-blue-950 break-words" aria-live="polite">
            {current.prompt}
          </p>
        </div>
        <button
          onClick={() => sound.speak(current.prompt, 'vi-VN')}
          aria-label="Nghe lại đề"
          title="Bấm loa để nghe đề"
          className="min-w-[44px] min-h-[44px] px-3 shrink-0 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-full text-sm"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" /> Nghe 🔊
        </button>
      </div>

      <div className="bg-white/95 rounded-3xl px-5 py-3 shadow-md border-2 border-blue-200 flex flex-col items-center gap-2 max-w-full overflow-x-auto">
        {current.kind === 'tensUnits' ? (
          <>
            <PlaceValueBlocks chuc={showChuc} donVi={showDonVi} />
            <p className="text-xl md:text-2xl font-black text-blue-900" aria-live="polite">
              Bé có {filled} que tính
            </p>
          </>
        ) : current.kind === 'money' ? (
          <p className="text-2xl md:text-3xl font-black text-blue-900" aria-live="polite">
            Bé có {filled} đồng {added > 0 ? <span className="text-emerald-600">(+{added})</span> : null}
          </p>
        ) : (
          <TenFrame count={filled} />
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => handleAdd(1)}
            disabled={stage.locked || added >= current.need}
            aria-label={`Thêm một ${current.fruit} vào khay`}
            className="min-h-[44px] px-5 py-2 bg-amber-100 hover:bg-amber-200 disabled:opacity-40 text-amber-900 font-black rounded-2xl border-2 border-amber-300 text-base active:scale-95"
          >
            {current.fruitEmoji} Thêm 1 {added >= current.need ? '— đủ rồi!' : ''}
          </button>
          {/*need ≥ 10 — thêm theo chục để bé không phải bấm 38 lần, đồng thời
            đúng thao tác "thêm chục rồi thêm đơn vị" của lớp 1. */}
          {current.need >= 10 && (
            <button
              onClick={() => handleAdd(10)}
              disabled={stage.locked || added >= current.need}
              aria-label={`Thêm 10 ${current.fruit} vào khay`}
              className="min-h-[44px] px-5 py-2 bg-blue-100 hover:bg-blue-200 disabled:opacity-40 text-blue-900 font-black rounded-2xl border-2 border-blue-300 text-base active:scale-95"
            >
              {current.fruitEmoji} Thêm 10
            </button>
          )}
        </div>
      </div>

      <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
        <p className="text-center text-sm md:text-base font-black text-blue-900 mb-2">
          Khách cần thêm mấy? Bé chạm số đúng:
        </p>
        <div
          className={`grid gap-2 md:gap-3 ${current.options.length > 4 ? 'grid-cols-3' : 'grid-cols-4'}`}
          role="group"
          aria-label="Chọn số còn thiếu"
        >
          {current.options.map((opt, i) => (
            <button
              key={`${opt}-${i}`}
              onClick={() => handlePick(opt)}
              disabled={stage.locked}
              data-testid="answer-option"
              {...(qa ? { 'data-correct': opt === current.need } : {})}
              aria-label={`${opt}, phím ${i + 1}`}
              className={`min-w-[64px] min-h-[64px] px-3 py-2 rounded-2xl border-2 font-black text-2xl md:text-3xl transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                showCorrectAnswer && opt === current.need
                  ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 text-emerald-900'
                  : 'bg-white border-blue-300 hover:border-blue-500 hover:scale-105 text-slate-800 shadow-md'
              }`}
            >
              {opt}
              <span className="block text-[10px] text-slate-400 font-bold">phím {i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs md:text-sm font-bold text-slate-500">
        🐻 Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal} · Bé dùng chuột, tay chạm hoặc phím số đều được
      </p>
    </div>
  );
};
