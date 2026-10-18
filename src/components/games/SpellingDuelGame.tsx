import React, { useMemo, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { useGameStage } from '../../hooks/useGameStage';
import { sound } from '../../services/sound';
import { GAME_LEVEL_POLICY } from '../../config/policy';
import { getTierMeta } from '../../data/gameLevels';
import { POOLS, buildSpellingRounds } from '../../data/games/spelling_duel';
import type { SpellingItem } from '../../data/games/spelling_duel';

export { POOLS };
export type { SpellingItem };

export const SpellingDuelGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => GAME_LEVEL_POLICY.ROUNDS_PER_TIER.slice() as unknown as number[], []);
  const stage = useGameStage({ gameId: 'spelling_duel', roundsPerTier });
  const [picked, setPicked] = useState<string | null>(null);

  const rounds = useMemo(
    () => buildSpellingRounds(stage.tier, stage.nonce),
    [stage.tier, stage.nonce]
  );
  const round = rounds[stage.roundIdx % rounds.length];
  const item = round.item;
  const options = round.options;

  const choose = (opt: string) => {
    if (stage.locked || stage.phase !== 'playing') return;
    setPicked(opt);
    if (opt === item.answer) {
      sound.playCorrect();
      sound.speak('Đúng rồi! Bé giỏi quá!', 'vi-VN');
      stage.submitCorrect();
      setTimeout(() => setPicked(null), 900);
    } else {
      sound.playWrong();
      sound.speak(`Chưa đúng. ${item.hint}`, 'vi-VN');
      stage.submitWrong();
      setTimeout(() => setPicked(null), 900);
    }
  };

  return (
    <GameModalWrapper
      gameId="spelling_duel"
      title="Đấu Trường Chính Tả"
      subtitle="Chinh phục c/k, g/gh, ng/ngh, ch/tr, s/x, d/gi/r"
      mascotEmoji="✏️"
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
      instructions={`${item.prompt}`}
      audioInstruction={item.prompt}
      audioLang="vi-VN"
    >
      <div className="w-full max-w-2xl mx-auto text-center space-y-4 kb-game-stage animate-rise">
        <div className="text-7xl animate-bounce-soft">{item.emoji}</div>
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-display">{item.prompt}</h3>
        <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 inline-block">
          💡 Mẹo: {item.hint}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`min-h-[56px] px-4 py-3 rounded-2xl font-black text-base md:text-lg border-3 transition-all active:scale-95 cursor-pointer ${
                picked === opt
                  ? opt === item.answer
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-rose-500 text-white border-rose-600'
                  : 'bg-white hover:bg-amber-50 text-slate-800 border-amber-300 shadow'
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
