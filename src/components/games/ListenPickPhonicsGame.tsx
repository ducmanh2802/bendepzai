import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { THEMES, buildPhonicsRounds } from '../../data/games/listen_pick';
import { getGameItems, GameItem } from '../../services/gameContent';
import type { PhonicsCard, PhonicsRound } from '../../data/games/listen_pick';

export { THEMES, buildPhonicsRounds };

interface ListenPickItem extends GameItem {
  spokenPrompt: string;
  targetWord: string;
  cards: PhonicsCard[];
}

function buildRoundsFromGameItems(items: GameItem[], tier: number, seed: number): ListenPickItem[] {
  const rounds: ListenPickItem[] = [];
  for (const item of items) {
    const options = item.options.slice(0, 4);
    const cards: PhonicsCard[] = options.map(opt => ({
      word: opt,
      emoji: item.emoji || '❓',
      spokenText: item.audioText || opt,
    }));
    const targetIdx = options.indexOf(item.answer);
    const target = cards[targetIdx >= 0 ? targetIdx : 0];
    rounds.push({
      ...item,
      spokenPrompt: item.audioText || item.prompt,
      targetWord: item.answer,
      cards,
    });
  }
  return rounds;
}

export const ListenPickPhonicsGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => defaultRoundsPerTier(), []);
  const stage = useGameStage({ gameId: 'listen_pick', roundsPerTier, advanceDelayMs: 1200 });

  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [currentRound, setCurrentRound] = useState<ListenPickItem | null>(null);

  useEffect(() => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['word-picture', 'first-sound'],
      count: roundsPerTier[stage.tier - 1] || 5,
      tier: stage.tier,
      seed: stage.nonce,
    });
    setGameItems(items);
  }, [stage.tier, stage.nonce, roundsPerTier]);

  useEffect(() => {
    if (gameItems.length > 0) {
      const rounds = buildRoundsFromGameItems(gameItems, stage.tier, stage.nonce);
      if (rounds[stage.roundIdx]) {
        setCurrentRound(rounds[stage.roundIdx]);
      }
    }
  }, [gameItems, stage.tier, stage.nonce, stage.roundIdx]);

  return (
    <GameModalWrapper
      gameId="listen_pick"
      title="Đôi Tai Thính — Nghe & Chọn"
      subtitle="Lắng nghe âm thanh và chọn đúng hình ảnh tương ứng"
      mascotEmoji="🦉"
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
      instructions="Bé hãy bấm vào chiếc loa để nghe từ và chọn hình đúng!"
      audioInstruction="Hãy bấm vào chiếc loa để nghe và chọn hình đúng"
      praiseSubject="VIETNAMESE"
    >
      {currentRound && <ListenPickStage stage={stage} currentRound={currentRound} />}
    </GameModalWrapper>
  );
};

/**
 * Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được
 * useGameFeedback (T15: sửa crash "must be used within GameModalWrapper").
 */
const ListenPickStage: React.FC<{
  stage: ReturnType<typeof useGameStage>;
  currentRound: ListenPickItem;
}> = ({ stage, currentRound }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer, correctAnswer } = useGameFeedback();

  const playVoice = () => {
    sound.speak(currentRound.spokenPrompt);
  };

  useEffect(() => {
    const timer = setTimeout(() => playVoice(), 400);
    return () => clearTimeout(timer);
  }, [stage.tier, stage.roundIdx, currentRound]);

  const handlePick = (card: PhonicsCard) => {
    if (stage.locked) return;
    if (card.word === currentRound.targetWord) {
      sound.playCorrect();
      reportCorrect(card.word);
      stage.submitCorrect();
    } else {
      sound.playWrong();
      reportWrong(card.word, currentRound.targetWord);
      stage.submitWrong();
    }
  };

  return (
      <div className="w-full max-w-xl flex flex-col items-center justify-center p-4">
        {/* Giant Speaker Button */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={playVoice}
            disabled={stage.locked || !currentRound}
            className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-tr from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 rounded-full shadow-xl flex items-center justify-center border-4 border-white active:scale-95 transition-all cursor-pointer animate-pulse-subtle"
          >
            <Volume2 className="w-12 h-12 text-amber-950" />
          </button>
          <span className="text-xs md:text-sm font-black text-amber-900 mt-2 bg-white/80 px-4 py-1 rounded-full shadow-sm">
            Bấm vào loa để nghe lại 🔊
          </span>
        </div>

        {/* 4 Illustrated Cards */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {currentRound.cards.map((c, idx) => (
            <button
              key={idx}
              onClick={() => handlePick(c)}
              disabled={stage.locked}
              className={`p-4 bg-white hover:bg-amber-50 border-3 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                showCorrectAnswer && c.word === correctAnswer
                  ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 animate-pulse'
                  : 'border-amber-300 hover:border-amber-500'
              }`}
            >
              <span className="text-5xl md:text-6xl">{c.emoji}</span>
              <span className="text-base md:text-lg font-black text-slate-800 tracking-wide font-display">
                {c.word}
              </span>
              {showCorrectAnswer && c.word === correctAnswer && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">✓ Đúng</span>
              )}
            </button>
          ))}
        </div>
      </div>
  );
};