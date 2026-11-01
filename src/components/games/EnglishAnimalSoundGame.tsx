import React, { useEffect, useMemo } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { SAFARI_ANIMALS, buildAnimalRounds } from '../../data/games/animal_safari';
import type { AnimalRound, AnimalSafariItem } from '../../data/games/animal_safari';

export { SAFARI_ANIMALS, buildAnimalRounds };

export const EnglishAnimalSoundGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => defaultRoundsPerTier(), []);
  const stage = useGameStage({ gameId: 'animal_safari', roundsPerTier, advanceDelayMs: 1300 });

  const rounds = useMemo(() => buildAnimalRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  const playVoice = () => {
    sound.speak(current.target.englishName, 'en-GB');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      sound.speak(`Find the ${current.target.englishName}!`, 'en-GB');
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.tier, stage.roundIdx]);

  const handlePickAnimal = (item: AnimalSafariItem) => {
    if (stage.locked) return;
    if (item.englishName === current.target.englishName) {
      sound.playCorrect();
      sound.speak(`Great job! This is a ${item.englishName}!`, 'en-GB');
      stage.submitCorrect();
    } else {
      sound.playWrong();
      sound.speak(`No, this is a ${item.englishName}. Find the ${current.target.englishName}!`, 'en-GB');
      stage.submitWrong();
    }
  };

  return (
    <GameModalWrapper
      gameId="animal_safari"
      title="Safari Tiếng Anh — Loài Vật"
      subtitle="Lắng nghe tên loài vật bằng tiếng Anh và chạm đúng con thú"
      mascotEmoji="🦁"
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
      instructions={`Listen & find: [ ${current.target.englishName} ] (${current.target.vietnameseMeaning})`}
      audioInstruction={`Find the ${current.target.englishName}`}
      audioLang="en-GB"
    >
      <div className="w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-emerald-100 via-yellow-50 to-emerald-200 rounded-3xl p-4 md:p-6 border-3 border-emerald-400 select-none">
        {/* Top Prompt with pronunciation button */}
        <div className="flex flex-col items-center my-auto">
          <div className="flex items-center gap-3 bg-white/95 px-6 py-3 rounded-3xl shadow-lg border-2 border-emerald-400">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Tìm con vật:</span>
              <span className="text-3xl md:text-4xl font-black text-emerald-950 font-display">
                {current.target.englishName}
              </span>
              <span className="text-xs text-slate-500 font-semibold block">({current.target.vietnameseMeaning})</span>
            </div>
            <button
              onClick={playVoice}
              className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-md active:scale-95 transition-transform"
              title="Nghe phát âm"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Animal Options Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-xl">
          {current.options.map((animal, idx) => (
            <button
              key={idx}
              onClick={() => handlePickAnimal(animal)}
              disabled={stage.locked}
              className="p-4 bg-white/90 hover:bg-white border-3 border-emerald-200 hover:border-emerald-400 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="text-5xl md:text-6xl animate-pulse-subtle">{animal.emoji}</span>
              <span className="text-base font-black text-slate-800 font-display">
                {animal.englishName}
              </span>
              <span className="text-xs text-emerald-700 font-bold">{animal.vietnameseMeaning}</span>
            </button>
          ))}
        </div>
      </div>
    </GameModalWrapper>
  );
};