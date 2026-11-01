import React, { useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildConnectRounds, type ConnectRound } from '../../data/games/connect_dots';

const ROUNDS_PER_TIER = defaultRoundsPerTier();

export const ConnectDotsGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'connect_dots', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1200 });
  const rounds = React.useMemo(
    () => buildConnectRounds(stage.tier, stage.nonce),
    [stage.tier, stage.nonce]
  );
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="connect_dots"
      title="Nối Số Tô Màu"
      subtitle="Nối các chấm theo thứ tự để hiện ra hình vẽ"
      mascotEmoji="🖍️"
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
      instructions={
        current
          ? `Bé chạm các chấm theo thứ tự 1, 2, 3… để nối thành hình ${current.shape.name}!`
          : 'Bé chạm các chấm theo thứ tự để nối thành một hình thật đẹp!'
      }
      audioInstruction={
        current
          ? `Chạm các chấm theo thứ tự từ 1 đến ${current.dots.length} để nối hình ${current.shape.name}`
          : undefined
      }
      praiseSubject="MATH"
    >
      {current && <ConnectDotsStage key={`${current.id}-${stage.nonce}`} stage={stage} round={current} />}
    </GameModalWrapper>
  );
};

const ConnectDotsStage: React.FC<{ stage: GameStage; round: ConnectRound }> = ({ stage, round }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer, wrongAttempts } = useGameFeedback();
  const [progress, setProgress] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

  const dots = round.dots;
  const total = dots.length;
  const complete = progress >= total;
  const nextNumber = progress + 1;
  const revealHint = showCorrectAnswer || wrongAttempts > 0;

  const connectedPoints = dots
    .slice(0, progress)
    .map((d) => `${d.x},${d.y}`)
    .join(' ');
  const allPoints = dots.map((d) => `${d.x},${d.y}`).join(' ');

  const handleDotClick = (n: number) => {
    if (stage.locked || complete || n <= progress) return;

    if (n === nextNumber) {
      const next = progress + 1;
      setProgress(next);
      if (next === total) {
        sound.playCorrect();
        sound.speakLater(`Đã nối xong hình ${round.shape.name}!`, 'vi-VN', 300);
        reportCorrect(round.shape.name);
        stage.submitCorrect();
      } else {
        sound.playPop();
      }
      return;
    }

    sound.playWrong();
    setShakeKey((k) => k + 1);
    reportWrong(`chấm số ${n}`, `chấm số ${nextNumber}`);
    stage.submitWrong();
    sound.speak(`Chưa đúng rồi, bé tìm chấm số ${nextNumber} nhé!`, 'vi-VN');
  };

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-2 md:gap-3 select-none">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="px-4 py-1.5 rounded-full bg-sky-100 border-2 border-sky-300 text-sm md:text-base font-black text-sky-900">
          Nối từ chấm 1 → {total}
        </span>
        <span className="px-4 py-1.5 rounded-full bg-white border-2 border-slate-200 text-sm md:text-base font-black text-slate-700">
          Đã nối {progress}/{total}
        </span>
      </div>

      <div
        key={shakeKey}
        className={`relative w-full max-w-[340px] md:max-w-[400px] aspect-square rounded-3xl bg-gradient-to-br from-white to-sky-50 border-4 border-sky-200 shadow-xl p-2 ${
          shakeKey > 0 ? 'animate-shake' : ''
        }`}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)]" aria-hidden="true">
          <polygon
            points={allPoints}
            fill={round.shape.color}
            className="transition-opacity duration-700"
            style={{ opacity: complete ? 0.32 : 0 }}
          />
          {progress > 1 && (
            <polyline
              points={connectedPoints}
              fill="none"
              stroke={round.shape.color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        <div className="absolute inset-2">
          {dots.map((dot) => {
            const done = dot.n <= progress;
            const isNext = dot.n === nextNumber && !complete;
            return (
              <button
                key={dot.n}
                type="button"
                onClick={() => handleDotClick(dot.n)}
                disabled={stage.locked}
                aria-label={`Chấm số ${dot.n}${done ? ' đã nối' : ''}`}
                aria-pressed={done}
                data-testid="connect-dot"
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full border-2 font-black text-sm md:text-base flex items-center justify-center transition-all duration-200 active:scale-90 ${
                  done
                    ? 'text-white border-white/70 shadow-lg scale-95'
                    : 'bg-white text-slate-700 border-slate-300 shadow-md hover:scale-110'
                } ${isNext && revealHint ? 'ring-4 ring-amber-400 animate-pulse' : ''}`}
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  backgroundColor: done ? round.shape.color : undefined,
                }}
              >
                {done ? '✓' : dot.n}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[44px] flex items-center justify-center text-center" aria-live="polite">
        {complete ? (
          <p className="text-base md:text-lg font-black text-emerald-700 animate-pop">
            <span aria-hidden="true">{round.shape.emoji} </span>
            Tuyệt vời! Bé đã nối xong hình {round.shape.name}!
          </p>
        ) : (
          <p className="text-sm md:text-base font-bold text-slate-600">
            Bé chạm chấm số <span className="font-black text-sky-700">{nextNumber}</span> nhé!
          </p>
        )}
      </div>
    </div>
  );
};
