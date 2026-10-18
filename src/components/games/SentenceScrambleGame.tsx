import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { RotateCcw } from 'lucide-react';
import { useGameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import {
  SENTENCE_POOL,
  buildScrambleRounds,
  scrambleWords,
} from '../../data/games/sentence_scramble';
import type { SentenceLevel } from '../../data/games/sentence_scramble';

export { SENTENCE_POOL, buildScrambleRounds };

export const SentenceScrambleGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => defaultRoundsPerTier(), []);
  const stage = useGameStage({ gameId: 'sentence_scramble', roundsPerTier, advanceDelayMs: 2000 });
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [trainDriving, setTrainDriving] = useState(false);

  const rounds = useMemo(() => buildScrambleRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const currentLevel = rounds[stage.roundIdx];

  useEffect(() => {
    setAssembledWords([]);
    setTrainDriving(false);
  }, [stage.tier, stage.roundIdx]);

  // T02B/B2 — seeded scramble (mixes play nonce): never the correct order
  // and never the plain reverse that children could game right-to-left.
  const availableWords = React.useMemo(
    () => scrambleWords(currentLevel.correctWords, stage.tier, stage.nonce, stage.roundIdx),
    [currentLevel, stage.tier, stage.nonce, stage.roundIdx]
  );

  const handleWordTap = (word: string) => {
    if (stage.locked || trainDriving) return;
    sound.playClick();
    const nextAssembled = [...assembledWords, word];
    setAssembledWords(nextAssembled);

      if (nextAssembled.length === currentLevel.correctWords.length) {
      if (nextAssembled.join(' ') === currentLevel.correctWords.join(' ')) {
        sound.playCorrect();
        sound.speak(`Hoan hô! "${nextAssembled.join(' ')}"`);
        setTrainDriving(true);
        stage.submitCorrect();
      } else {
        // T02B/B2 — a wrong assembly counts as a real mistake (stars).
        sound.playWrong();
        sound.speak('Chưa đúng thứ tự rồi, bé bấm nút xếp lại nhé!');
        stage.submitWrong();
      }
    }
  };

  const handleRemoveWord = (idx: number) => {
    if (trainDriving) return;
    sound.playClick();
    setAssembledWords((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleResetAssembled = () => {
    sound.playClick();
    setAssembledWords([]);
  };

  // Words that are still in pool
  const poolWords = availableWords.filter((w) => {
    const totalCount = availableWords.filter((x) => x === w).length;
    const usedCount = assembledWords.filter((x) => x === w).length;
    return usedCount < totalCount;
  });

  return (
    <GameModalWrapper
      gameId="sentence_scramble"
      title="Đoàn Tàu Xếp Câu"
      subtitle="Bấm các toa tàu theo đúng thứ tự để tạo thành câu hoàn chỉnh"
      mascotEmoji="🚂"
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
      instructions="Bé hãy chạm vào từng từ theo đúng thứ tự để đoàn tàu lăn bánh!"
      audioInstruction="Hãy chạm vào từng từ theo đúng thứ tự để đoàn tàu lăn bánh"
    >
      <div className="w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-sky-100 to-amber-100 rounded-3xl p-4 md:p-6 border-2 border-sky-300 relative overflow-hidden">
        {/* Train Racetrack Area */}
        <div
          className={`w-full flex items-center justify-start gap-2 py-4 px-2 overflow-x-auto transition-transform duration-1000 ${
            trainDriving ? 'translate-x-full opacity-60' : 'translate-x-0'
          }`}
        >
          {/* Engine */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-5xl md:text-6xl animate-bounce">🚂</span>
            <span className="text-[10px] font-bold text-slate-500">Đầu tàu</span>
          </div>

          {/* Assembled train cars */}
          {currentLevel.correctWords.map((_, idx) => {
            const word = assembledWords[idx];
            return (
              <button
                key={idx}
                onClick={() => word && handleRemoveWord(idx)}
                disabled={!word || trainDriving}
                title={word ? 'Chạm để gỡ từ này' : undefined}
                className={`w-20 md:w-28 h-16 md:h-20 rounded-2xl border-4 flex flex-col items-center justify-center font-black text-sm md:text-lg shadow-md transition-all shrink-0 ${
                  word
                    ? 'bg-amber-400 border-amber-500 text-amber-950 scale-100 hover:bg-amber-300 cursor-pointer active:scale-95'
                    : 'bg-white/60 border-dashed border-amber-300 text-slate-300 cursor-default'
                }`}
              >
                <span>{word || `Toa ${idx + 1}`}</span>
                {word && <span className="text-[9px] text-amber-900 font-bold opacity-75">✕ Gỡ</span>}
              </button>
            );
          })}
        </div>

        {/* Railway tracks */}
        <div className="w-full h-3 bg-amber-800 rounded-full flex items-center justify-around my-1 opacity-70">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1.5 h-5 bg-amber-950" />
          ))}
        </div>

        {/* Meaning hint */}
        <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600">
          <span>{currentLevel.emoji}</span>
          <span>{currentLevel.meaning}</span>
        </div>

        {/* Word Options Pool */}
        <div className="flex-1 flex flex-col items-center justify-center my-4 w-full">
          <span className="text-xs font-bold text-slate-600 mb-2">Chạm vào các từ bên dưới:</span>
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg">
            {poolWords.map((word, idx) => (
              <button
                key={idx}
                onClick={() => handleWordTap(word)}
                disabled={stage.locked}
                className="px-5 py-3 bg-white hover:bg-amber-50 border-3 border-amber-400 text-amber-950 font-black text-lg md:text-xl rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom controls & reset */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAssembled}
            disabled={trainDriving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs md:text-sm active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Xếp lại từ đầu
          </button>
        </div>
      </div>
    </GameModalWrapper>
  );
};