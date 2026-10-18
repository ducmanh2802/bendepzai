import React, { useMemo, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { useGameStage } from '../../hooks/useGameStage';
import { sound } from '../../services/sound';
import { GAME_LEVEL_POLICY } from '../../config/policy';
import { getTierMeta } from '../../data/gameLevels';
import { POOLS, buildPhonicsPopRounds } from '../../data/games/phonics_pop';
import type { PhonicsItem } from '../../data/games/phonics_pop';

export { POOLS };
export type { PhonicsItem };

export const PhonicsPopGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => GAME_LEVEL_POLICY.ROUNDS_PER_TIER.slice() as unknown as number[], []);
  const stage = useGameStage({ gameId: 'phonics_pop', roundsPerTier, advanceDelayMs: 900 });
  const [picked, setPicked] = useState<string | null>(null);

  const rounds = useMemo(
    () => buildPhonicsPopRounds(stage.tier, stage.nonce),
    [stage.tier, stage.nonce]
  );
  const round = rounds[stage.roundIdx % rounds.length];
  const item = round.item;
  const options = round.options;

  const speakWord = () => sound.speak(item.word, 'en-GB');

  const choose = (opt: string) => {
    if (stage.locked || stage.phase !== 'playing') return;
    setPicked(opt);
    if (opt === item.answer) {
      sound.playCorrect();
      sound.speak(`Great! ${item.word}!`, 'en-GB');
      stage.submitCorrect();
      setTimeout(() => setPicked(null), 900);
    } else {
      sound.playWrong();
      sound.speak(`Listen again: ${item.word}`, 'en-GB');
      stage.submitWrong();
      setTimeout(() => setPicked(null), 900);
    }
  };

  return (
    <GameModalWrapper
      gameId="phonics_pop"
      title="Phonics Pop — Bắn Âm Tiếng Anh"
      subtitle="Nghe từ, chọn âm đầu đúng theo giọng Anh-Anh"
      mascotEmoji="🎈"
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
      instructions={`What is the beginning sound of "${item.word}" (${item.vietnamese})?`}
      audioInstruction={`What is the beginning sound of ${item.word}?`}
      audioLang="en-GB"
    >
      <div className="w-full max-w-2xl mx-auto text-center space-y-4 kb-game-stage animate-rise">
        <button onClick={speakWord} className="text-8xl hover:scale-110 transition-transform cursor-pointer" title="Nghe từ">
          {item.emoji}
        </button>
        <div>
          <p className="text-3xl font-black tracking-widest text-slate-900 font-display">{item.word}</p>
          <p className="text-sm font-bold text-slate-500">{item.vietnamese} • Bấm loa để nghe 🔊</p>
        </div>
        <p className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 rounded-xl px-3 py-1.5 inline-block">
          Chọn ÂM ĐẦU đúng — Beginning sound
        </p>
        <div className="grid grid-cols-3 gap-3">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`min-h-[64px] rounded-2xl font-black text-2xl border-3 transition-all active:scale-95 cursor-pointer ${
                picked === opt
                  ? opt === item.answer
                    ? 'bg-emerald-500 text-white border-emerald-600 scale-105'
                    : 'bg-rose-500 text-white border-rose-600'
                  : 'bg-gradient-to-b from-amber-300 to-orange-400 text-white border-orange-400 shadow-lg hover:scale-105'
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
