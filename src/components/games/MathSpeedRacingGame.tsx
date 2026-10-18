import React, { useMemo, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Zap } from 'lucide-react';
import { useGameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildRaceQuestions } from '../../data/games/speed_racing';
import type { MathQuestion } from '../../data/games/speed_racing';

export { buildRaceQuestions };

export const MathSpeedRacingGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => defaultRoundsPerTier(), []);
  const stage = useGameStage({ gameId: 'speed_racing', roundsPerTier, advanceDelayMs: 1200 });
  const [turboActive, setTurboActive] = useState(false);

  const questions = useMemo(() => buildRaceQuestions(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = questions[stage.roundIdx];
  const carProgress = 10 + (Math.min(stage.roundNumber, stage.roundTotal) / stage.roundTotal) * 80;

  const handleSelectOption = (num: number) => {
    if (stage.locked) return;
    if (num === current.ans) {
      sound.playCorrect();
      sound.speak(`Chính xác! ${current.expr} bằng ${current.ans}!`);
      setTurboActive(true);
      window.setTimeout(() => setTurboActive(false), 700);
      stage.submitCorrect();
    } else {
      sound.playWrong();
      sound.speak(`Chưa đúng rồi! Bé thử tính lại nhé!`);
      stage.submitWrong();
    }
  };

  return (
    <GameModalWrapper
      gameId="speed_racing"
      title="Đường Đua Toán Học Thần Tốc"
      subtitle="Giải nhanh các phép tính để xe đua phóng vút về đích"
      mascotEmoji="🏎️"
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
      instructions="Bé hãy chọn kết quả đúng của phép tính để nạp năng lượng Nitro cho xe đua!"
      audioInstruction="Hãy chọn kết quả đúng của phép tính để xe đua phóng nhanh về đích"
    >
      <div className="w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-4 md:p-6 border-4 border-amber-400 text-white relative overflow-hidden select-none">
        {/* Racetrack View */}
        <div className="w-full relative h-28 bg-slate-700 rounded-2xl border-4 border-slate-600 overflow-hidden flex items-center shadow-inner">
          {/* Track Lines */}
          <div className="absolute inset-x-0 h-1 border-t-2 border-dashed border-white/40" />

          {/* Finish Line */}
          <div className="absolute right-6 inset-y-0 w-8 bg-repeat-y opacity-80" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)', backgroundSize: '16px 16px', backgroundColor: '#fff' }} />
          <div className="absolute right-8 top-1 text-2xl">🏁</div>

          {/* Player Racecar */}
          <div
            style={{ left: `${carProgress}%`, transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            className="absolute transform -translate-y-1/2 top-1/2 flex items-center"
          >
            <span className="text-5xl md:text-6xl drop-shadow-lg">🏎️</span>
            {turboActive && (
              <span className="text-3xl -ml-2 text-amber-400 animate-ping">🔥</span>
            )}
          </div>
        </div>

        {/* Current Math Question */}
        <div className="my-auto flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`w-6 h-6 ${turboActive ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span className="text-xs md:text-sm font-bold text-amber-300 uppercase tracking-widest">
              Vòng đua {stage.roundNumber} / {stage.roundTotal}
            </span>
          </div>

          <div className="px-8 py-4 bg-white/10 backdrop-blur-md rounded-3xl border-2 border-amber-400/50 shadow-2xl flex items-center gap-4">
            <span className="text-4xl md:text-6xl font-black text-amber-300 font-display">
              {current.expr} = ?
            </span>
            <button
              onClick={() => sound.speak(`${current.expr} bằng mấy?`)}
              className="p-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-full font-bold"
              title="Nghe phép tính"
            >
              🔊
            </button>
          </div>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-xl">
          {current.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelectOption(opt)}
              disabled={stage.locked}
              className={`py-4 px-6 bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-3xl rounded-2xl shadow-xl border-2 border-white/50 active:scale-95 transition-all cursor-pointer font-display ${
                stage.locked ? 'opacity-60' : ''
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </GameModalWrapper>
  );
};