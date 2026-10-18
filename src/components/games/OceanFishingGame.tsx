import React, { useMemo, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { useGameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildFishRounds } from '../../data/games/ocean_fishing';
import type { FishItem, FishQuestion } from '../../data/games/ocean_fishing';

export { buildFishRounds };
export type { FishItem, FishQuestion };

export const OceanFishingGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => defaultRoundsPerTier(), []);
  const stage = useGameStage({ gameId: 'ocean_fishing', roundsPerTier, advanceDelayMs: 1400 });
  const [hookedFish, setHookedFish] = useState<number | null>(null);

  const rounds = useMemo(() => buildFishRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  const handleCatchFish = (val: number) => {
    if (stage.locked) return;
    if (val === current.ans) {
      sound.playCorrect();
      sound.speak(`Cắn câu rồi! ${current.expr} bằng ${current.ans}!`);
      setHookedFish(val);
      stage.submitCorrect();
      window.setTimeout(() => setHookedFish(null), 1400);
    } else {
      sound.playWrong();
      sound.speak(`Chú cá mang số ${val} chưa đúng phép tính rồi, bé thử lại nhé!`);
      stage.submitWrong();
    }
  };

  return (
    <GameModalWrapper
      gameId="ocean_fishing"
      title="Câu Cá Đại Dương Xanh"
      subtitle="Thả cần câu bắt chú cá mang kết quả đúng của phép trừ"
      mascotEmoji="🎣"
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
      instructions={`Tính phép trừ: ${current.expr} = ?`}
      audioInstruction={`${current.expr} bằng mấy`}
    >
      <div className="w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-sky-200 via-sky-400 to-blue-800 rounded-3xl p-4 md:p-6 border-3 border-blue-400 relative overflow-hidden select-none">
        {/* Boat on water surface */}
        <div className="w-full flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3 bg-white/95 px-5 py-2.5 rounded-2xl shadow-lg border-2 border-amber-300">
            <span className="text-3xl">⛵</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Thuyền Trưởng Cáo hỏi:</span>
              <span className="text-2xl md:text-3xl font-black text-amber-900 font-display">
                {current.expr} = ?
              </span>
            </div>
            <button
              onClick={() => sound.speak(`${current.expr} bằng mấy?`)}
              className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-full"
            >
              🔊
            </button>
          </div>

          <div className="text-2xl animate-float">☁️</div>
        </div>

        {/* Fishing Line */}
        <div className="absolute top-16 left-1/3 w-0.5 h-32 bg-amber-950/60 flex flex-col items-center justify-end">
          <span className="text-xl">🎣</span>
        </div>

        {/* Ocean Waves Decor */}
        <div className="absolute inset-x-0 top-24 text-center text-4xl text-blue-200/50">
          🌊 🌊 🌊 🌊 🌊 🌊
        </div>

        {/* Swimming Fish in Deep Water */}
        <div className="w-full flex-1 flex flex-wrap items-center justify-around gap-4 p-4 z-10">
          {current.fishPool.map((fish, idx) => (
            <button
              key={idx}
              onClick={() => handleCatchFish(fish.val)}
              disabled={stage.locked}
              className={`p-4 bg-white/90 hover:bg-white rounded-3xl shadow-xl border-3 border-blue-300 hover:border-amber-400 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer min-w-[110px] md:min-w-[130px] ${
                hookedFish === fish.val ? 'scale-125 -translate-y-8 bg-amber-100 border-amber-500' : 'hover:scale-105'
              } ${stage.locked ? 'opacity-80' : ''}`}
            >
              <span className="text-5xl md:text-6xl animate-pulse-subtle">{fish.emoji}</span>
              <span className={`px-3 py-1 bg-amber-400 text-amber-950 font-black text-xl rounded-xl shadow-sm ${fish.color}`}>
                Số {fish.val}
              </span>
              <span className="text-[10px] text-blue-700 font-bold">Chạm để câu</span>
            </button>
          ))}
        </div>

        {/* Sea floor decor */}
        <div className="w-full flex justify-between px-8 text-3xl opacity-80">
          <span>🌺</span>
          <span>🦀</span>
          <span>🐚</span>
          <span>🌿</span>
        </div>
      </div>
    </GameModalWrapper>
  );
};