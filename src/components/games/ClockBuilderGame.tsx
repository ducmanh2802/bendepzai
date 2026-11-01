import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildClockRounds, type ClockRound } from '../../data/games/clock_builder';
import { ClockFace } from '../visuals/ClockFace';

export { buildClockRounds };

const ROUNDS_PER_TIER = defaultRoundsPerTier();

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

export const ClockBuilderGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'clock_builder', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1400 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildClockRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="clock_builder"
      title="Thợ Sửa Đồng Hồ"
      subtitle="Chỉnh kim giờ đúng rồi xem thứ, xem ngày"
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
      instructions="Chỉnh kim giờ đúng theo tranh rồi trả lời thứ, ngày nhé!"
      audioInstruction={current ? current.prompt : undefined}
      audioLang="vi-VN"
      praiseSubject="MATH"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-blue-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">⏰</span>
          <h3 className="text-2xl md:text-3xl font-black text-blue-900">Thợ Sửa Đồng Hồ</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Bé làm thợ sửa đồng hồ! Nhìn tranh hoạt động trong ngày,
            chạm số giờ đúng để kim giờ chạy tới đó, rồi bấm “Chốt giờ”!
          </p>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Màn cao còn phải chọn buổi sáng/chiều và trả lời thứ, ngày trên tờ lịch!
          </p>
          <div className="flex items-center gap-2 text-lg font-black bg-blue-50 rounded-2xl px-4 py-2 border-2 border-blue-200" aria-hidden="true">
            <span>🍜 ăn sáng lúc 6 giờ</span>
            <span>→</span>
            <span className="text-blue-700">kim chỉ số 6!</span>
          </div>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <ClockBuilderStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const ClockBuilderStage: React.FC<{ stage: GameStage; current: ClockRound }> = ({ stage, current }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [pickedHour, setPickedHour] = useState<number | null>(null);
  const [pickedAmPm, setPickedAmPm] = useState<'sáng' | 'chiều'>('sáng');
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);

  useEffect(() => {
    setPickedHour(null);
    setPickedAmPm('sáng');
    // "Chơi lại" đổi nonce nhưng id vòng có thể trùng → reset theo cả hai.
  }, [current.id, stage.nonce]);

  // Màn 3+ mới hỏi buổi; màn 1–2 chỉ chấm giờ.
  const needsAmPm = stage.tier >= 3 && current.kind === 'clock';

  const correctSoFar =
    current.kind === 'clock'
      ? pickedHour === current.hour && (!needsAmPm || pickedAmPm === current.amPm)
      : false;

  const speakResult = (ok: boolean, text: string) => {
    if (ok) {
      sound.playCorrect();
      sound.speakLater(text, 'vi-VN', 350);
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      sound.speak('Chưa đúng, bé nhìn lại đề nhé!', 'vi-VN');
    }
  };

  const handleConfirmClock = () => {
    if (stage.locked || pickedHour === null) return;
    if (correctSoFar) {
      reportCorrect(current.answer);
      speakResult(true, `Đúng rồi! ${current.answer}!`);
      stage.submitCorrect();
    } else {
      reportWrong(`${pickedHour} giờ ${pickedAmPm}`, current.answer);
      speakResult(false, '');
      stage.submitWrong();
    }
  };

  const handlePickText = (opt: string | number) => {
    if (stage.locked) return;
    if (opt === current.answer) {
      reportCorrect(String(opt));
      speakResult(true, `Đúng rồi! ${current.answer}!`);
      stage.submitCorrect();
    } else {
      reportWrong(String(opt), current.answer);
      speakResult(false, '');
      stage.submitWrong();
    }
  };

  useEffect(() => {
    if (stage.locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (current.kind !== 'clock') {
        const n = Number(e.key);
        const opts = current.options as (string | number)[];
        if (Number.isInteger(n) && n >= 1 && n <= opts.length) {
          e.preventDefault();
          handlePickText(opts[n - 1]);
        }
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setPickedHour((h) => (((h ?? 12) % 12) + 1));
        sound.playClick();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setPickedHour((h) => (((((h ?? 12) + 10) % 12)) + 1));
        sound.playClick();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmClock();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3 md:gap-4">
      <div className="flex items-center gap-3 bg-white/95 rounded-3xl px-5 py-2.5 shadow-md border-2 border-blue-200 max-w-full">
        <span className="text-5xl md:text-6xl shrink-0" aria-hidden="true">{current.activityEmoji}</span>
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

      {current.kind === 'clock' ? (
        <div key={shakeKey} className={`bg-white/95 rounded-3xl px-5 py-3 shadow-md border-2 border-blue-200 flex flex-col items-center gap-2 max-w-full ${shakeKey > 0 ? 'animate-shake' : ''}`}>
          <ClockFace gio={pickedHour ?? 12} phut={0} amPm={pickedAmPm} size={150} />
          <p className="text-sm md:text-base font-black text-blue-900" aria-live="polite">
            {pickedHour === null ? 'Bé chạm số giờ đúng:' : `Bé chọn ${pickedHour} giờ${needsAmPm ? ` ${pickedAmPm}` : ''}`}
          </p>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Chọn giờ">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => { if (!stage.locked) { setPickedHour(num); sound.playClick(); } }}
                disabled={stage.locked}
                data-testid="answer-option"
                {...(qa ? { 'data-correct': num === current.hour } : {})}
                aria-label={`Giờ ${num}`}
                className={`min-w-[48px] min-h-[44px] px-2 py-1 rounded-2xl border-2 font-black text-xl transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                  pickedHour === num
                    ? 'bg-blue-500 border-blue-700 text-white scale-105'
                    : showCorrectAnswer && num === current.hour
                      ? 'border-4 border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'bg-white border-blue-300 hover:border-blue-500 text-slate-800'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          {needsAmPm ? (
            <div className="flex gap-2" role="group" aria-label="Chọn buổi">
              {(['sáng', 'chiều'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => { if (!stage.locked) { setPickedAmPm(b); sound.playClick(); } }}
                  disabled={stage.locked}
                  data-testid="answer-option"
                  {...(qa ? { 'data-correct': b === current.amPm } : {})}
                  aria-label={`Buổi ${b}`}
                  className={`min-h-[44px] px-5 py-1 rounded-2xl border-2 font-black text-lg transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                    pickedAmPm === b
                      ? 'bg-amber-400 border-amber-600 text-white'
                      : 'bg-white border-amber-300 hover:border-amber-500 text-slate-800'
                  }`}
                >
                  {b === 'sáng' ? '☀️ sáng' : '🌙 chiều'}
                </button>
              ))}
            </div>
          ) : null}
          <button
            onClick={handleConfirmClock}
            disabled={stage.locked || pickedHour === null}
            className="min-h-[44px] px-8 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:opacity-40 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Chốt giờ ✅
          </button>
        </div>
      ) : (
        <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
          <p className="text-center text-sm md:text-base font-black text-blue-900 mb-2">
            Bé chạm đáp án đúng:
          </p>
          <div className="grid grid-cols-2 gap-2 md:gap-3" role="group" aria-label="Chọn đáp án">
            {(current.options as (string | number)[]).map((opt, i) => (
              <button
                key={`${opt}-${i}`}
                onClick={() => handlePickText(opt)}
                disabled={stage.locked}
                data-testid="answer-option"
                {...(qa ? { 'data-correct': opt === current.answer } : {})}
                aria-label={`${opt}, phím ${i + 1}`}
                className={`min-w-[120px] min-h-[64px] px-4 py-2 rounded-2xl border-2 font-black text-xl md:text-2xl transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                  showCorrectAnswer && opt === current.answer
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
      )}

      <p className="text-xs md:text-sm font-bold text-slate-500">
        🐻 Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal} · Phím mũi tên = đổi giờ, Enter = chốt
      </p>
    </div>
  );
};
