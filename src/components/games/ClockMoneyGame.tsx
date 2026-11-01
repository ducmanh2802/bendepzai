import React, { useMemo, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { useGameStage } from '../../hooks/useGameStage';
import { useRoundFeedbackTimer } from '../../hooks/useRoundFeedbackTimer';
import { sound } from '../../services/sound';
import { GAME_LEVEL_POLICY } from '../../config/policy';
import { getTierMeta } from '../../data/gameLevels';
import { POOLS, buildClockMoneyRounds } from '../../data/games/clock_money';
import type { QuizItem } from '../../data/games/clock_money';

export { POOLS };
export type { QuizItem };

export const ClockMoneyGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => GAME_LEVEL_POLICY.ROUNDS_PER_TIER.slice() as unknown as number[], []);
  const stage = useGameStage({ gameId: 'clock_money', roundsPerTier });
  const [picked, setPicked] = useState<string | null>(null);
  // T02B/B8 — hint hidden until the child taps "Gợi ý".
  const [showHint, setShowHint] = useState(false);
  const { schedule: scheduleUnpick } = useRoundFeedbackTimer(
    () => setPicked(null),
    [stage.roundIdx, stage.tier, stage.nonce]
  );

  const rounds = useMemo(
    () => buildClockMoneyRounds(stage.tier, stage.nonce),
    [stage.tier, stage.nonce]
  );
  const round = rounds[stage.roundIdx % rounds.length];
  const item = round.item;
  const options = round.options;

  React.useEffect(() => {
    setShowHint(false);
  }, [stage.tier, stage.roundIdx]);

  const choose = (opt: string) => {
    if (stage.locked || stage.phase !== 'playing') return;
    setPicked(opt);
    if (opt === item.answer) {
      sound.playCorrect();
      sound.speak('Chính xác! Bé giỏi toán thực tế quá!', 'vi-VN');
      stage.submitCorrect();
      scheduleUnpick(() => setPicked(null), 900);
    } else {
      sound.playWrong();
      // T02B/B8 — never auto-reveal the hint; the child taps "Gợi ý".
      sound.speak('Chưa đúng rồi, bé thử lại nhé! Cần thì bấm nút Gợi ý.', 'vi-VN');
      stage.submitWrong();
      scheduleUnpick(() => setPicked(null), 900);
    }
  };

  return (
    <GameModalWrapper
      gameId="clock_money"
      title="Thám Hiểm Giờ & Tiền Việt"
      subtitle="Xem giờ, tiêu tiền, đo độ dài như người lớn"
      mascotEmoji="⏰"
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
      instructions={item.prompt}
      audioInstruction={item.prompt}
      audioLang="vi-VN"
    >
      <div className="w-full max-w-2xl mx-auto text-center space-y-4 kb-game-stage animate-rise">
        <div className="text-7xl animate-bounce-soft">{item.emoji}</div>
        <h3 className="text-lg md:text-2xl font-black text-slate-900 font-display leading-snug">{item.prompt}</h3>
        <div className="grid grid-cols-1 gap-3">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`min-h-[52px] px-4 py-3 rounded-2xl font-black text-base border-3 transition-all active:scale-95 cursor-pointer ${
                picked === opt
                  ? opt === item.answer
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-rose-500 text-white border-rose-600'
                  : 'bg-white hover:bg-sky-50 text-slate-800 border-sky-300 shadow'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <p className="text-[11px] font-bold text-sky-700">
          {!showHint ? (
            <button
              onClick={() => {
                sound.playClick();
                setShowHint(true);
              }}
              className="px-3 py-2 min-h-[44px] bg-sky-100 hover:bg-sky-200 rounded-xl"
            >
              💡 Gợi ý
            </button>
          ) : (
            <span>💡 {item.hint}</span>
          )}
        </p>
      </div>
    </GameModalWrapper>
  );
};
