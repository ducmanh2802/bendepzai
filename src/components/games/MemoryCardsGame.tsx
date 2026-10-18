import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { useGameStage } from '../../hooks/useGameStage';
import { getTierMeta } from '../../data/gameLevels';
import {
  GOALS_PER_TIER,
  PAIR_POOL,
  buildMemoryDeck,
  shouldCountMemoryMistake,
} from '../../data/games/memory_cards';

export { GOALS_PER_TIER, shouldCountMemoryMistake };
interface CardItem {
  id: number;
  pairId: number;
  label: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ROUNDS_PER_TIER = GOALS_PER_TIER.map(() => 1);

export const MemoryCardsGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'memory_cards', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 900 });
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  // T02B/B12 — track individual CARD ids the child has flipped, not pair ids.
  const [seenCardIds, setSeenCardIds] = useState<number[]>([]);
  const submittedRef = useRef(false);

  const goalPairs = GOALS_PER_TIER[Math.min(stage.tier - 1, GOALS_PER_TIER.length - 1)];

  const initGame = () => {
    const deck: CardItem[] = buildMemoryDeck(stage.tier, stage.nonce).map((c) => ({
      ...c,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(deck);
    setFlippedIds([]);
    setMatchedPairs(0);
    setMoves(0);
    setSeenCardIds([]);
    submittedRef.current = false;
  };

  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.tier, stage.nonce]);

  const handleCardClick = (id: number) => {
    if (stage.locked || stage.phase !== 'playing') return;
    if (flippedIds.length === 2) return;
    const clickedCard = cards.find((c) => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    sound.playClick();
    const nextFlipped = [...flippedIds, id];
    setFlippedIds(nextFlipped);
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = nextFlipped;
      const first = cards.find((c) => c.id === firstId);
      const second = cards.find((c) => c.id === secondId);

      if (first && second && first.pairId === second.pairId) {
        sound.playCorrect();
        sound.speak(`Cặp ${first.label}!`);
        setSeenCardIds((prev) => Array.from(new Set([...prev, firstId, secondId])));
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          )
        );
        const newMatched = matchedPairs + 1;
        setMatchedPairs(newMatched);
        setFlippedIds([]);

        if (newMatched >= goalPairs && !submittedRef.current) {
          submittedRef.current = true;
          stage.submitCorrect();
        }
      } else if (first && second) {
        // T02B/B12 — first-time mismatches teach (no mistake); only a
        // mismatch of two ALREADY-SEEN cards counts against the stars.
        const counts = shouldCountMemoryMistake(seenCardIds, firstId, secondId);
        setSeenCardIds((prev) => Array.from(new Set([...prev, firstId, secondId])));
        if (counts) {
          sound.playWrong();
          sound.speak('Hai thẻ này bé đã thấy rồi mà! Nhớ lại xem nào.');
          stage.submitWrong();
        } else {
          sound.playClick();
          sound.speak('Chưa giống nhau, bé nhớ vị trí hai thẻ này nhé!');
        }
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
        }, 900);
      }
    }
  };

  return (
    <GameModalWrapper
      gameId="memory_cards"
      title="Lật Thẻ Trí Nhớ Vàng"
      subtitle="Tìm và ghép đúng các cặp hình giống nhau"
      mascotEmoji="🧠"
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
      instructions={`Bé hãy lật từng thẻ để tìm ${goalPairs} cặp hình giống hệt nhau nhé!`}
      audioInstruction={`Hãy lật các thẻ để tìm ${goalPairs} cặp hình giống nhau`}
    >
      <div className="w-full max-w-xl flex flex-col items-center justify-between p-2 md:p-4 select-none">
        {/* Moves Counter */}
        <div className="mb-3 px-4 py-1.5 bg-amber-100 rounded-full border border-amber-300 text-xs md:text-sm font-bold text-amber-900">
          Đã thử: <span className="font-black">{moves}</span> lượt · Đã tìm: <span className="font-black">{matchedPairs}/{goalPairs}</span> cặp
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full min-w-0" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {cards.map((card) => {
            const showFace = card.isFlipped || card.isMatched;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`h-24 md:h-28 rounded-2xl border-3 shadow-md flex flex-col items-center justify-center transition-all transform cursor-pointer ${
                  showFace
                    ? 'bg-white border-amber-400 rotate-0 scale-100'
                    : 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-600 hover:scale-105 active:scale-95'
                } ${card.isMatched ? 'opacity-70 bg-emerald-50 border-emerald-400' : ''}`}
              >
                {showFace ? (
                  <div className="flex flex-col items-center animate-pop">
                    <span className="text-3xl md:text-4xl">{card.emoji}</span>
                    <span className="text-[11px] font-black text-amber-900 mt-1">{card.label}</span>
                  </div>
                ) : (
                  <span className="text-3xl text-white font-black drop-shadow">?</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameModalWrapper>
  );
};