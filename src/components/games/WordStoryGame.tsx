import React, { useMemo, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { useGameStage } from '../../hooks/useGameStage';
import { useRoundFeedbackTimer } from '../../hooks/useRoundFeedbackTimer';
import { sound } from '../../services/sound';
import { GAME_LEVEL_POLICY } from '../../config/policy';
import { getTierMeta } from '../../data/gameLevels';
import { POOLS, buildWordStoryRounds } from '../../data/games/word_story';
import type { StoryItem } from '../../data/games/word_story';

export { POOLS };
export type { StoryItem };

export const WordStoryGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => GAME_LEVEL_POLICY.ROUNDS_PER_TIER.slice() as unknown as number[], []);
  const stage = useGameStage({ gameId: 'word_story', roundsPerTier });
  const [picked, setPicked] = useState<string | null>(null);
  const { schedule: scheduleUnpick } = useRoundFeedbackTimer(
    () => setPicked(null),
    [stage.roundIdx, stage.tier, stage.nonce]
  );

  const rounds = useMemo(
    () => buildWordStoryRounds(stage.tier, stage.nonce),
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
      sound.speak('Đúng rồi! Bé giải toán lời văn siêu giỏi!', 'vi-VN');
      stage.submitCorrect();
      scheduleUnpick(() => setPicked(null), 1000);
    } else {
      sound.playWrong();
      sound.speak(item.hint, 'vi-VN');
      stage.submitWrong();
      scheduleUnpick(() => setPicked(null), 1000);
    }
  };

  return (
    <GameModalWrapper
      gameId="word_story"
      title="Chuyện Kể Toán Học"
      subtitle="Đọc chuyện, giải toán lời văn như thám tử nhí"
      mascotEmoji="🔍"
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
      instructions={item.story + ' ' + item.question}
      audioInstruction={item.story + ' ' + item.question}
      audioLang="vi-VN"
    >
      <div className="w-full max-w-2xl mx-auto space-y-4 kb-game-stage animate-rise">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-5 text-center shadow">
          <div className="text-6xl mb-2">{item.emoji}</div>
          <p className="text-base md:text-lg font-bold text-slate-800 leading-relaxed">{item.story}</p>
          <p className="mt-2 text-lg md:text-xl font-black text-amber-950 font-display">{item.question}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`min-h-[56px] px-4 py-3 rounded-2xl font-black text-lg border-3 transition-all active:scale-95 cursor-pointer ${
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
