import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildTrainRounds, type RhymeTrainRound } from '../../data/games/rhyme_train';

export { buildTrainRounds };

const ROUNDS_PER_TIER = defaultRoundsPerTier();

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

export const RhymeTrainGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'rhyme_train', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1400 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildTrainRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="rhyme_train"
      title="Đoàn Tàu Ghép Vần"
      subtitle="Nối toa tàu để tạo tiếng có nghĩa khớp với hình"
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
      instructions="Bé hãy nối đúng toa vào đầu tàu để tạo tiếng khớp với hình nhé!"
      audioInstruction={current ? `Hãy nối toa để tạo thành từ ${current.word}` : undefined}
      praiseSubject="VIETNAMESE"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-orange-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">🚞</span>
          <h3 className="text-2xl md:text-3xl font-black text-orange-900">Đoàn Tàu Ghép Vần</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Đầu tàu mang chữ cái, các toa mang vần. Bé chạm vào toa đúng để
            ghép thành tiếng có nghĩa khớp với hình — tàu sẽ chạy và kêu
            “tu tu”! Màn cao có từ 2 tiếng và vần khó.
          </p>
          <div className="flex items-center gap-1 text-2xl font-black" aria-hidden="true">
            <span className="px-3 py-2 bg-red-400 text-white rounded-xl">b</span>
            <span className="text-slate-400">+</span>
            <span className="px-3 py-2 bg-sky-400 text-white rounded-xl">ò</span>
            <span className="text-slate-400">=</span>
            <span className="px-3 py-2 bg-emerald-400 text-white rounded-xl">bò 🐄</span>
          </div>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <RhymeTrainStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const RhymeTrainStage: React.FC<{ stage: GameStage; current: RhymeTrainRound }> = ({ stage, current }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [attached, setAttached] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);

  useEffect(() => {
    setAttached(null);
    // "Chơi lại" đổi nonce nhưng id vòng có thể trùng → reset theo cả hai.
  }, [current.id, stage.nonce]);

  const handleCarPick = (tail: string) => {
    if (stage.locked || attached) return;
    if (tail === current.answerTail) {
      sound.playCorrect();
      setAttached(tail);
      sound.playStar();
      sound.speakLater(current.word, 'vi-VN', 350);
      reportCorrect(current.word);
      stage.submitCorrect();
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong(tail, current.answerTail);
      sound.speak(`Toa này chưa đúng rồi. Bé nghe lại nhé: ${current.word}. Toa nào ghép với ${current.head} thành ${current.word}?`);
      stage.submitWrong();
    }
  };

  useEffect(() => {
    if (stage.locked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= current.carOptions.length) {
        e.preventDefault();
        handleCarPick(current.carOptions[n - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3 md:gap-4">
      {/* Target picture + speaker */}
      <div className="flex items-center gap-3 bg-white/95 rounded-3xl px-5 py-2.5 shadow-md border-2 border-orange-200">
        <span className="text-5xl md:text-6xl" role="img" aria-label={current.word}>{current.emoji}</span>
        <button
          onClick={() => sound.speak(current.word, 'vi-VN')}
          aria-label={`Nghe từ ${current.word}`}
          title="Bấm loa để nghe"
          className="min-w-[44px] min-h-[44px] px-3 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-full text-sm"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" /> Nghe 🔊
        </button>
      </div>

      {/* Train: engine + attached car */}
      <div
        className={`flex items-stretch justify-center gap-0 transition-transform duration-700 ease-out motion-reduce:transition-none ${
          attached ? 'translate-x-2 md:translate-x-6' : ''
        }`}
        aria-label={`Đầu tàu mang chữ ${current.head}`}
      >
        <div className="flex flex-col items-center bg-gradient-to-b from-red-400 to-red-500 text-white rounded-l-2xl rounded-tr-2xl px-4 md:px-6 py-3 shadow-lg border-2 border-red-600 min-w-[96px]">
          <span className="text-4xl" aria-hidden="true">🚂</span>
          <span className="text-2xl md:text-3xl font-black tracking-wide">{current.head}</span>
          <span className="text-[11px] font-bold opacity-90">đầu tàu</span>
        </div>
        <div
          className={`flex flex-col items-center justify-center px-4 md:px-6 py-3 rounded-r-2xl shadow-lg border-2 min-w-[96px] transition-colors motion-reduce:transition-none ${
            attached
              ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 border-emerald-600 text-white animate-pop'
              : 'bg-slate-100 border-dashed border-slate-300 text-slate-400'
          }`}
          aria-live="polite"
        >
          {attached ? (
            <>
              <span className="text-2xl md:text-3xl font-black tracking-wide">{attached}</span>
              <span className="text-[11px] font-bold opacity-90">tu tu! 🚞💨</span>
            </>
          ) : (
            <>
              <span className="text-2xl md:text-3xl font-black">?</span>
              <span className="text-[11px] font-bold">chờ toa…</span>
            </>
          )}
        </div>
      </div>

      {/* Formed word preview */}
      <p className="text-lg md:text-xl font-black text-orange-950" aria-live="polite">
        {current.head} + {attached ?? '…'} = {attached ? current.word : '…'}
      </p>

      {/* Cars */}
      <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
        <p className="text-center text-sm md:text-base font-black text-orange-900 mb-2">
          Bé chọn toa đúng để nối vào tàu:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3" role="group" aria-label="Chọn toa tàu">
          {current.carOptions.map((tail, i) => {
            const isAnswer = tail === current.answerTail;
            const chosen = attached === tail;
            return (
              <button
                key={`${tail}-${i}`}
                onClick={() => handleCarPick(tail)}
                disabled={stage.locked || attached !== null}
                data-testid="answer-option"
                {...(qa ? { 'data-correct': isAnswer } : {})}
                aria-label={`Toa ${tail}, phím ${i + 1}`}
                className={`min-w-[72px] min-h-[64px] px-3 py-2 rounded-2xl border-2 font-black flex flex-col items-center justify-center gap-0.5 transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                  chosen
                    ? 'bg-emerald-400 border-emerald-600 text-white scale-105'
                    : showCorrectAnswer && isAnswer
                      ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 text-emerald-900'
                      : attached
                        ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-sky-50 border-sky-300 hover:border-sky-500 hover:scale-105 text-sky-950 shadow-md'
                }`}
              >
                <span className="text-2xl md:text-3xl" aria-hidden="true">🚃</span>
                <span className="text-xl md:text-2xl">{tail}</span>
                <span className="text-[10px] text-slate-400 font-bold">phím {i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs md:text-sm font-bold text-slate-500">
        🚞 Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal} · Bé dùng chuột, tay chạm hoặc phím số đều được
      </p>
    </div>
  );
};
