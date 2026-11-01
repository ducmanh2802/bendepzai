import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildHopRounds, type HopRound } from '../../data/games/number_line_hop';
import { NumberLine } from '../visuals/NumberLine';

export { buildHopRounds };

const ROUNDS_PER_TIER = defaultRoundsPerTier();

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

export const NumberHopGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'number_line_hop', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1400 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildHopRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="number_line_hop"
      title="Ếch Nhảy Tia Số"
      subtitle="Bấm ếch nhảy từng bước rồi tìm số đích"
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
      instructions="Bấm ếch nhảy từng bước rồi chạm đúng số đích nhé!"
      audioInstruction={current ? current.prompt : undefined}
      audioLang="vi-VN"
      praiseSubject="MATH"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-blue-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">🐸</span>
          <h3 className="text-2xl md:text-3xl font-black text-blue-900">Ếch Nhảy Tia Số</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Bạn Ếch đứng trên tia số! Đề “+3” nghĩa là ếch nhảy tới 3 bước.
            Bé bấm nút Nhảy từng bước, rồi chạm đúng số đích!
          </p>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Bé giỏi có thể chạm thẳng số đích luôn. Màn cao có nhảy lùi và nhảy theo chục!
          </p>
          <div className="flex items-center gap-2 text-lg font-black bg-blue-50 rounded-2xl px-4 py-2 border-2 border-blue-200" aria-hidden="true">
            <span>🐸 ở 2, đề +3</span>
            <span>→</span>
            <span className="text-blue-700">nhảy tới 5!</span>
          </div>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <NumberHopStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const NumberHopStage: React.FC<{ stage: GameStage; current: HopRound }> = ({ stage, current }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [preview, setPreview] = useState(current.start);
  const [hops, setHops] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);
  const doneRef = useRef(false);

  useEffect(() => {
    setPreview(current.start);
    setHops(0);
    doneRef.current = false;
    // "Chơi lại" đổi nonce nhưng id vòng có thể trùng → reset theo cả hai.
  }, [current.id, stage.nonce]);

  const answerRight = (value: number, how: string) => {
    if (stage.locked || doneRef.current) return;
    doneRef.current = true;
    sound.playCorrect();
    sound.speakLater(`Đúng rồi! Ếch tới số ${current.target}!`, 'vi-VN', 350);
    reportCorrect(how);
    stage.submitCorrect();
  };

  const handleHop = () => {
    if (stage.locked || doneRef.current) return;
    const next = preview + current.dir * current.step;
    const nextHops = hops + 1;
    setPreview(next);
    setHops(nextHops);
    if (next === current.target) {
      sound.playClick();
      answerRight(next, `nhảy ${nextHops} bước tới ${next}`);
    } else {
      sound.playClick();
    }
  };

  const handlePick = (opt: number) => {
    if (stage.locked || doneRef.current) return;
    if (opt === current.target) {
      answerRight(opt, `chạm số ${opt}`);
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong(String(opt), String(current.target));
      sound.speak('Chưa đúng, bé cho ếch nhảy lại nhé!', 'vi-VN');
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
      } else if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleHop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3 md:gap-4">
      <div className="flex items-center gap-3 bg-white/95 rounded-3xl px-5 py-2.5 shadow-md border-2 border-blue-200 max-w-full">
        <span className="text-4xl md:text-5xl font-black text-blue-700 shrink-0" aria-hidden="true">{current.task}</span>
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
        <p className="text-2xl font-black text-blue-900" aria-live="polite">
          <span aria-hidden="true">🐸</span> Ếch đang ở số {preview} {hops > 0 ? <span className="text-sm text-slate-500">(đã nhảy {hops})</span> : null}
        </p>
        <NumberLine start={current.lineStart} end={current.lineEnd} current={preview} step={current.step} />
        <button
          onClick={handleHop}
          disabled={stage.locked}
          aria-label="Cho ếch nhảy một bước"
          className="min-h-[44px] px-5 py-2 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-40 text-emerald-900 font-black rounded-2xl border-2 border-emerald-300 text-base active:scale-95 transition-all motion-reduce:transition-none"
        >
          🐸 Nhảy 1 bước {current.dir === 1 ? 'tới ▶' : '◀ lùi'}
        </button>
      </div>

      <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
        <p className="text-center text-sm md:text-base font-black text-blue-900 mb-2">
          Ếch tới số mấy? Bé chạm số đúng:
        </p>
        <div
          className={`grid gap-2 md:gap-3 ${current.options.length > 4 ? 'grid-cols-3' : 'grid-cols-4'}`}
          role="group"
          aria-label="Chọn số đích"
        >
          {current.options.map((opt, i) => (
            <button
              key={`${opt}-${i}`}
              onClick={() => handlePick(opt)}
              disabled={stage.locked}
              data-testid="answer-option"
              {...(qa ? { 'data-correct': opt === current.target } : {})}
              aria-label={`${opt}, phím ${i + 1}`}
              className={`min-w-[64px] min-h-[64px] px-3 py-2 rounded-2xl border-2 font-black text-2xl md:text-3xl transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                showCorrectAnswer && opt === current.target
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
        🐻 Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal} · Phím cách = nhảy, phím số = chọn đáp án
      </p>
    </div>
  );
};
