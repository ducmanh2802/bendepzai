import React, { useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildShadowRounds, type ShadowRound } from '../../data/games/shadow_match';

const ROUNDS_PER_TIER = defaultRoundsPerTier();

export const ShadowMatchGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'shadow_match', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1100 });
  const rounds = useMemo(() => buildShadowRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="shadow_match"
      title="Đoán Bóng Hình"
      subtitle="Nhìn bóng đen và tìm đúng hình"
      mascotEmoji="🔎"
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
      instructions="Bóng đen này là hình nào? Bé chạm vào hình đúng nhé!"
      audioInstruction="Nhìn bóng đen và chạm vào hình đúng"
      praiseSubject="MATH"
    >
      {current && <ShadowMatchStage key={current.id} stage={stage} round={current} />}
    </GameModalWrapper>
  );
};

const ShadowMatchStage: React.FC<{ stage: GameStage; round: ShadowRound }> = ({ stage, round }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const solved = pickedId === round.answer.id;

  const handlePick = (id: string) => {
    if (stage.locked || solved) return;
    const item = round.options.find((opt) => opt.id === id);
    if (!item) return;

    if (id === round.answer.id) {
      setPickedId(id);
      sound.playCorrect();
      window.setTimeout(() => sound.speak(`Chính xác! Đây là ${item.label}!`, 'vi-VN'), 250);
      reportCorrect(item.label);
      stage.submitCorrect();
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong(item.label, round.answer.label);
      stage.submitWrong();
      sound.speak('Chưa đúng rồi, bé nhìn kỹ đường viền của bóng nhé!', 'vi-VN');
    }
  };

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-3 select-none">
      <div className="relative w-full max-w-[300px] md:max-w-[340px] rounded-3xl bg-gradient-to-br from-slate-100 to-slate-300 border-4 border-slate-300 shadow-inner px-4 py-5 flex flex-col items-center gap-1">
        <span
          className="text-[70px] md:text-[88px] leading-none"
          role="img"
          aria-label={`Bóng của ${round.answer.label}`}
          style={{
            filter: 'brightness(0)',
            opacity: 0.82,
            transform: `rotate(${round.tilt}deg) scaleX(${round.flip ? -1 : 1})`,
          }}
        >
          {round.answer.emoji}
        </span>
        {solved ? (
          <span className="mt-1 text-sm md:text-base font-black text-emerald-700 animate-pop">
            <span aria-hidden="true">{round.answer.emoji} </span>
            {round.answer.label}
          </span>
        ) : (
          <span className="mt-1 text-xs md:text-sm font-black text-slate-500">
            Bóng bí ẩn · Bé đoán xem!
          </span>
        )}
      </div>

      <div key={shakeKey} className={`grid grid-cols-2 gap-2 md:gap-3 w-full max-w-[420px] ${shakeKey > 0 ? 'animate-shake' : ''}`}>
        {round.options.map((opt) => {
          const isAnswer = opt.id === round.answer.id;
          const highlight = solved && isAnswer;
          const showAsAnswer = showCorrectAnswer && isAnswer;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePick(opt.id)}
              disabled={stage.locked}
              data-testid="shadow-option"
              aria-label={opt.label}
              className={`min-h-[64px] md:min-h-[74px] rounded-2xl border-2 font-black text-base md:text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                highlight || showAsAnswer
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-900'
                  : 'bg-white border-amber-300 hover:border-amber-500 hover:scale-[1.03] text-slate-800 shadow-md'
              }`}
            >
              <span className="text-3xl md:text-4xl" aria-hidden="true">{opt.emoji}</span>
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs md:text-sm font-bold text-slate-500 text-center">
        🔎 Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal}
        {round.tilt !== 0 ? ' · Bóng đã được xoay đó!' : ''}
      </p>
    </div>
  );
};
