import React, { useMemo } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { useGameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { BASKETS, SHAPE_POOL, buildShapeRounds } from '../../data/games/shape_sorting';
import type { ShapeCategory, ShapeItem } from '../../data/games/shape_sorting';

export { SHAPE_POOL, buildShapeRounds };
export type { ShapeCategory, ShapeItem };

export const ShapeSortingGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => defaultRoundsPerTier(), []);
  const stage = useGameStage({ gameId: 'shape_sorting', roundsPerTier, advanceDelayMs: 1200 });

  const items = useMemo(() => buildShapeRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const currentItem = items[stage.roundIdx];

  const handleBasketTap = (cat: ShapeCategory) => {
    if (stage.locked) return;
    if (cat === currentItem.category) {
      sound.playCorrect();
      sound.speak(`Đúng rồi! ${currentItem.name} thuộc dạng ${BASKETS.find((b) => b.category === cat)?.title}!`);
      stage.submitCorrect();
    } else {
      sound.playWrong();
      sound.speak(`Chưa đúng rồi! ${currentItem.hint}, bé chọn lại rổ nhé!`);
      stage.submitWrong();
    }
  };

  return (
    <GameModalWrapper
      gameId="shape_sorting"
      title="Phân Loại Hình Học Vui Nhộn"
      subtitle="Xếp các đồ vật quen thuộc vào đúng giỏ hình học"
      mascotEmoji="📦"
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
      instructions={`Hãy xếp "${currentItem.name}" vào chiếc giỏ hình học đúng!`}
      audioInstruction={`Hãy xếp ${currentItem.name} vào chiếc giỏ hình học đúng`}
    >
      <div className="w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 rounded-3xl p-4 md:p-6 border-2 border-amber-300 relative select-none">
        {/* Conveyor Belt with Current Item */}
        <div className="flex flex-col items-center my-auto">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            Đồ vật cần phân loại ({stage.roundNumber}/{stage.roundTotal}):
          </span>

          <div className="p-6 bg-white rounded-3xl shadow-xl border-4 border-amber-400 flex flex-col items-center animate-pop">
            <span className="text-7xl md:text-8xl mb-2">{currentItem.emoji}</span>
            <span className="text-xl md:text-2xl font-black text-amber-950 font-display">
              {currentItem.name}
            </span>
            {stage.tier <= 3 && (
              <span className="text-xs text-slate-500 font-semibold mt-1">({currentItem.hint})</span>
            )}
          </div>
        </div>

        {/* 4 Baskets at the bottom */}
        <div className="w-full max-w-2xl">
          <span className="text-xs font-bold text-slate-600 block text-center mb-2">
            Chạm vào chiếc giỏ phù hợp:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BASKETS.map((b) => (
              <button
                key={b.category}
                onClick={() => handleBasketTap(b.category)}
                disabled={stage.locked}
                className={`p-3 rounded-2xl border-3 shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95 hover:scale-105 cursor-pointer ${b.color} ${stage.locked ? 'opacity-80' : ''}`}
              >
                <span className="text-3xl">{b.emoji}</span>
                <span className="text-sm font-black font-display">{b.title}</span>
                <span className="text-[10px] font-bold opacity-75">Bỏ vào giỏ 🧺</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </GameModalWrapper>
  );
};