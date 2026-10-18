import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { useGameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildTowerRounds } from '../../data/games/number_tower';
import type { TowerRound } from '../../data/games/number_tower';

export { buildTowerRounds };

export const NumberTowerGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => defaultRoundsPerTier(), []);
  const stage = useGameStage({ gameId: 'number_tower', roundsPerTier, advanceDelayMs: 1200 });
  const [towerBlocks, setTowerBlocks] = useState<number[]>([]);

  const rounds = useMemo(() => buildTowerRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];
  const maxTotal = stage.tier <= 1 ? 5 : stage.tier <= 3 ? 10 : 20;

  useEffect(() => {
    setTowerBlocks([]);
  }, [stage.tier]);

  const handlePickBrick = (num: number) => {
    if (stage.locked) return;
    if (num === current.missing) {
      sound.playCorrect();
      sound.speak(`Đúng rồi! ${current.part1} cộng ${num} bằng ${current.total}!`);
      setTowerBlocks((prev) => [...prev, num]);
      stage.submitCorrect();
    } else {
      sound.playWrong();
      sound.speak(`Chưa đúng rồi! ${current.part1} cộng ${num} chưa bằng ${current.total}, bé tính lại nhé!`);
      stage.submitWrong();
    }
  };

  return (
    <GameModalWrapper
      gameId="number_tower"
      title="Xây Tháp Số Lên Mây"
      subtitle="Tìm viên gạch số còn thiếu để tháp số cao vút chạm cầu vồng"
      mascotEmoji="🏰"
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
      instructions={`Tìm viên gạch thích hợp: ${current.part1} + ? = ${current.total}`}
      audioInstruction={`${current.part1} cộng mấy để bằng ${current.total}`}
    >
      <div className="w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-sky-300 via-sky-100 to-amber-100 rounded-3xl p-4 md:p-6 border-2 border-sky-400 relative overflow-hidden select-none">
        {/* Rainbow & Cloud at top */}
        <div className="flex items-center gap-2 text-4xl">
          <span>🌈</span>
          <span>☁️</span>
          <span>🏰</span>
          <span>☁️</span>
        </div>

        {/* The Tower Stack View */}
        <div className="flex flex-col-reverse items-center justify-end my-2 flex-1 w-full max-w-xs">
          {/* Base foundation */}
          <div className="w-48 h-8 bg-amber-900 rounded-lg border-2 border-amber-950 flex items-center justify-center text-xs font-bold text-amber-100">
            Nền Móng Vững Chắc
          </div>

          {/* Built blocks */}
          {towerBlocks.map((val, idx) => (
            <div
              key={idx}
              className="w-40 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl border-3 border-amber-600 flex items-center justify-center font-black text-xl text-white shadow-md my-0.5 animate-pop"
            >
              Tầng {idx + 1} (+{val})
            </div>
          ))}

          {/* Current Target Block Outline */}
          <div className="w-40 h-14 bg-white/70 border-3 border-dashed border-amber-500 rounded-2xl flex items-center justify-center gap-2 px-3 shadow-inner my-1">
            <span className="text-xl font-black text-amber-900">
              {current.part1} + <span className="text-rose-600 underline">?</span> = {current.total}
            </span>
          </div>
        </div>

        {/* Choice of Bricks */}
        <div className="w-full max-w-md">
          <span className="text-xs font-bold text-slate-700 block text-center mb-2">
            Số trong khoảng 0–{maxTotal}. Chọn viên gạch số đúng để xếp lên tháp:
          </span>
          <div className="grid grid-cols-4 gap-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handlePickBrick(opt)}
                disabled={stage.locked}
                className={`py-3 border-3 border-amber-400 text-amber-950 font-black text-2xl rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer font-display ${
                  stage.locked ? 'opacity-50 bg-amber-50' : 'bg-white hover:bg-amber-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </GameModalWrapper>
  );
};