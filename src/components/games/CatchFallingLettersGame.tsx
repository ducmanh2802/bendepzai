import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { useGameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { BUBBLE_COLORS, TIER_CONFIG, buildRounds, poolForTier } from '../../data/games/catch_letters';
import { getGameItems } from '../../services/gameContent';

export { TIER_CONFIG, buildRounds };

interface FallingBubble {
  id: number;
  char: string;
  x: number;
  y: number;
  speed: number;
  color: string;
}

export const CatchFallingLettersGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => defaultRoundsPerTier(), []);
  const stage = useGameStage({ gameId: 'catch_letters', roundsPerTier, advanceDelayMs: 1000 });
  const [targetChar, setTargetChar] = useState<string>('A');
  const [targetPool, setTargetPool] = useState<string[]>([]);
  const [bubbles, setBubbles] = useState<FallingBubble[]>([]);
  const nextId = useRef(1);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);

  const config = TIER_CONFIG[Math.min(stage.tier - 1, TIER_CONFIG.length - 1)];

  useEffect(() => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['first-sound'],
      count: roundsPerTier[stage.tier - 1] || 8,
      tier: stage.tier,
      seed: stage.nonce,
    });
    const letters = [...new Set(items.flatMap(item => item.options))].filter(l => l.length === 1);
    const pool = letters.length > 0 ? letters : config.pool;
    setTargetPool(pool);
    // Bảng chữ mới chỉ có sau bước nạp ở trên, nên chữ đầu tiên lấy thẳng từ pool —
    // nếu để pickNewTarget chạy ở effect khác nó đọc pool cũ và đổi chữ lung tung.
    setTargetChar(pool[0] ?? config.pool[0]);
    setBubbles([]);
    setCurrentRoundIdx(0);
  }, [stage.tier, stage.nonce, roundsPerTier]);

  const pickNewTarget = () => {
    const pool = targetPool.length > 0 ? targetPool : config.pool;
    const randomChar = pool[Math.floor(Math.random() * pool.length)];
    setTargetChar(randomChar);
    sound.speak(`Hãy tìm và bắt chữ ${randomChar} nhé!`);
  };

  useEffect(() => {
    if (stage.phase !== 'playing') return;
    const pool = targetPool.length > 0 ? targetPool : config.pool;
    const spawnTimer = setInterval(() => {
      const isTarget = Math.random() < 0.45;
      const char = isTarget
        ? targetChar
        : pool[Math.floor(Math.random() * pool.length)];
      const newBubble: FallingBubble = {
        id: nextId.current++,
        char,
        x: Math.floor(Math.random() * 75) + 10,
        y: -10,
        speed: Math.random() * (config.speedMax - config.speedMin) + config.speedMin,
        color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      };
      setBubbles((prev) => [...prev.slice(-12), newBubble]);
    }, config.spawnMs);

    return () => clearInterval(spawnTimer);
  }, [stage.phase, stage.tier, targetChar, config, targetPool]);

  useEffect(() => {
    if (stage.phase !== 'playing') return;

    const animTimer = setInterval(() => {
      setBubbles((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y + b.speed }))
          .filter((b) => b.y < 105)
      );
    }, 40);

    return () => clearInterval(animTimer);
  }, [stage.phase, stage.tier]);

  return (
    <GameModalWrapper
      gameId="catch_letters"
      title="Bắt Chữ Cái Bay"
      subtitle="Bé nhanh tay chạm vào đúng chữ cái được yêu cầu nhé!"
      mascotEmoji="🐻"
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
      instructions={`Bé ơi! Hãy chạm vào các bóng bóng mang chữ: [ ${targetChar} ]`}
      audioInstruction={`Hãy chạm vào các bong bóng mang chữ ${targetChar}`}
      praiseSubject="VIETNAMESE"
    >
      <CatchFallingStage
        stage={stage}
        targetChar={targetChar}
        bubbles={bubbles}
        setBubbles={setBubbles}
        pickNewTarget={pickNewTarget}
      />
    </GameModalWrapper>
  );
};

/**
 * Vùng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được
 * useGameFeedback (T15: sửa crash "must be used within GameModalWrapper").
 */
const CatchFallingStage: React.FC<{
  stage: ReturnType<typeof useGameStage>;
  targetChar: string;
  bubbles: FallingBubble[];
  setBubbles: React.Dispatch<React.SetStateAction<FallingBubble[]>>;
  pickNewTarget: () => void;
}> = ({ stage, targetChar, bubbles, setBubbles, pickNewTarget }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer, correctAnswer } = useGameFeedback();

  const handleBubbleClick = (bubble: FallingBubble) => {
    if (stage.locked || stage.phase !== 'playing') return;
    if (bubble.char === targetChar) {
      sound.playCorrect();
      reportCorrect(bubble.char);
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      if ((stage.roundNumber + 1) % 2 === 0) {
        pickNewTarget();
      }
      stage.submitCorrect();
    } else {
      sound.playWrong();
      reportWrong(bubble.char, targetChar);
      sound.speak(`Đây là chữ ${bubble.char}, bé tìm chữ ${targetChar} nhé!`);
      stage.submitWrong();
    }
  };

  return (
      <div className="w-full h-full relative rounded-2xl bg-gradient-to-b from-sky-200 via-sky-100 to-amber-100 overflow-hidden border-2 border-sky-300 select-none">
        <div className="absolute top-4 left-6 text-4xl opacity-70 animate-float">☁️</div>
        <div className="absolute top-10 right-10 text-5xl opacity-60 animate-float" style={{ animationDelay: '1.5s' }}>☁️</div>
        <div className="absolute bottom-2 left-0 right-0 h-14 bg-gradient-to-t from-emerald-400 to-emerald-300 rounded-b-xl flex items-center justify-around text-2xl">
          <span>🌻</span>
          <span>🌳</span>
          <span>🌷</span>
          <span>🏡</span>
          <span>🌻</span>
        </div>

        <div className="absolute top-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-0.75rem)] bg-white/95 px-3 md:px-6 py-2 rounded-2xl shadow-lg border-2 border-amber-300 flex items-center gap-2 md:gap-3 z-10">
          <span className="text-xs md:text-sm font-bold text-amber-900 whitespace-nowrap">Bé cần bắt chữ:</span>
          <span className={`w-10 h-10 md:w-12 md:h-12 bg-amber-400 text-amber-950 font-black text-2xl md:text-3xl rounded-xl flex items-center justify-center shadow-md animate-pulse-subtle shrink-0 ${
            showCorrectAnswer ? 'border-4 border-emerald-500 ring-2 ring-emerald-500' : ''
          }`}>
            {targetChar}
          </span>
          <button
            onClick={() => sound.speak(`Bắt chữ ${targetChar}`)}
            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 min-h-[44px] rounded-lg font-bold shrink-0"
          >
            🔊 Nghe
          </button>
        </div>

        {bubbles.map((b) => (
          <button
            key={b.id}
            onClick={() => handleBubbleClick(b)}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              transition: 'transform 0.15s ease',
            }}
            className={`absolute w-14 h-14 md:w-16 md:h-16 ${b.color} text-white font-black text-2xl md:text-3xl rounded-full shadow-lg flex items-center justify-center border-4 border-white/80 active:scale-125 cursor-pointer transform -translate-x-1/2 ${
              showCorrectAnswer && b.char === correctAnswer
                ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 animate-pulse'
                : ''
            }`}
          >
            {b.char}
            {showCorrectAnswer && b.char === correctAnswer && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-full">✓ Đúng</span>
            )}
          </button>
        ))}
      </div>
  );
};