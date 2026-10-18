import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildWordTrainRounds, type WordTrainRound } from '../../data/games/word_builder_train';

export { buildWordTrainRounds };

const ROUNDS_PER_TIER = defaultRoundsPerTier();

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

export const WordTrainGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'word_builder_train', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1400 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildWordTrainRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="word_builder_train"
      title="Word Train — Tàu Chữ Tiếng Anh"
      subtitle="Chạm toa để nghe âm rồi xếp thành từ đúng"
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
      instructions="Bé chạm từng toa để nghe âm, rồi xếp các toa thành từ khớp với hình nhé!"
      audioInstruction={current ? `Spell the word: ${current.word.split('').join(' ')}` : undefined}
      audioLang="en-GB"
      praiseSubject="ENGLISH"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-lime-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">🚂</span>
          <h3 className="text-2xl md:text-3xl font-black text-lime-900">Word Train — Tàu Chữ Tiếng Anh</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Mỗi toa tàu là một chữ cái. Bé chạm vào toa để nghe âm (phonics),
            rồi xếp các toa theo đúng thứ tự để tạo thành từ tiếng Anh khớp với hình!
          </p>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Màn cao có từ 4 chữ và cụm chữ đôi <b>sh</b>, <b>ch</b> như SHIP, CHICK.
          </p>
          <div className="flex items-center gap-1 text-2xl font-black" aria-hidden="true">
            <span className="px-3 py-2 bg-lime-400 text-white rounded-xl">C</span>
            <span className="px-3 py-2 bg-lime-400 text-white rounded-xl">A</span>
            <span className="px-3 py-2 bg-lime-400 text-white rounded-xl">T</span>
            <span className="text-slate-400">=</span>
            <span className="px-3 py-2 bg-emerald-400 text-white rounded-xl">CAT 🐱</span>
          </div>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-lime-500 to-green-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <WordTrainStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const WordTrainStage: React.FC<{ stage: GameStage; current: WordTrainRound }> = ({ stage, current }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  /** Chỉ số toa (trong `carriages`) đã xếp, theo đúng thứ tự. */
  const [placed, setPlaced] = useState<number[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);

  useEffect(() => {
    setPlaced([]);
  }, [current.id]);

  const done = placed.length >= current.cars.length;
  const expectedNext = current.cars[placed.length];
  const usedSet = useMemo(() => new Set(placed), [placed]);

  const handleCarPick = (carIdx: number) => {
    if (stage.locked || done || usedSet.has(carIdx)) return;
    const car = current.carriages[carIdx];
    // Chạm toa luôn được nghe âm (học phonics), đúng/sai tính sau.
    sound.speak(car, 'en-GB');
    if (car === expectedNext) {
      const next = [...placed, carIdx];
      setPlaced(next);
      if (next.length === current.cars.length) {
        sound.playCorrect();
        window.setTimeout(() => {
          sound.speak(current.word, 'en-GB');
        }, 350);
        reportCorrect(current.word);
        stage.submitCorrect();
      } else {
        sound.playClick();
      }
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong(car, expectedNext);
      stage.submitWrong();
    }
  };

  const handleUndo = () => {
    if (stage.locked || placed.length === 0) return;
    sound.playClick();
    setPlaced((p) => p.slice(0, -1));
  };

  useEffect(() => {
    if (stage.locked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= current.carriages.length) {
        e.preventDefault();
        handleCarPick(n - 1);
        return;
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && placed.length > 0) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3 md:gap-4">
      {/* Hình mục tiêu + loa nghe cả từ */}
      <div className="flex items-center gap-3 bg-white/95 rounded-3xl px-5 py-2.5 shadow-md border-2 border-lime-200">
        <span className="text-5xl md:text-6xl" role="img" aria-label={current.word}>{current.emoji}</span>
        <div className="text-left">
          <p className="text-xs font-bold text-slate-500">{current.vi} · {current.cars.length} toa</p>
        </div>
        <button
          onClick={() => sound.speak(current.word, 'en-GB')}
          aria-label={`Nghe từ ${current.word}`}
          title="Bấm loa để nghe cả từ"
          className="min-w-[44px] min-h-[44px] px-3 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-full text-sm"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" /> Nghe 🔊
        </button>
      </div>

      {/* Tàu: đầu tàu + các ô đã xếp */}
      <div
        className="flex items-stretch justify-center gap-1 max-w-full overflow-x-hidden"
        aria-label={`Từ có ${current.cars.length} chữ cái, đã xếp ${placed.length}`}
        aria-live="polite"
      >
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-lime-500 to-green-600 text-white rounded-2xl px-3 md:px-4 py-2 shadow-lg border-2 border-green-700 shrink-0">
          <span className="text-3xl md:text-4xl" aria-hidden="true">🚂</span>
        </div>
        {current.cars.map((_car, slot) => {
          const filled = slot < placed.length;
          const carIdx = placed[slot];
          return (
            <button
              key={slot}
              onClick={() => {
                // Chạm ô cuối đã xếp để gỡ ra.
                if (slot === placed.length - 1) handleUndo();
              }}
              disabled={stage.locked}
              aria-label={filled ? `Đã xếp ${current.carriages[carIdx]}, chạm để gỡ` : `Ô trống thứ ${slot + 1}`}
              className={`flex flex-col items-center justify-center min-w-[52px] md:min-w-[60px] min-h-[64px] px-2 py-1 rounded-2xl shadow-lg border-2 transition-all motion-reduce:transition-none ${
                filled
                  ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 border-emerald-600 text-white animate-pop'
                  : slot === placed.length
                    ? 'bg-white border-dashed border-lime-400 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-300'
              }`}
            >
              <span className="text-xl md:text-2xl font-black tracking-wide">
                {filled ? current.carriages[carIdx] : '?'}
              </span>
              <span className="text-[10px] font-bold opacity-80">{slot + 1}</span>
            </button>
          );
        })}
        <button
          onClick={handleUndo}
          disabled={stage.locked || placed.length === 0}
          aria-label="Xoá chữ cuối (phím Backspace)"
          title="Xoá chữ cuối"
          className="min-w-[44px] min-h-[64px] px-2 rounded-2xl bg-amber-100 hover:bg-amber-200 disabled:opacity-40 text-amber-800 text-xl font-black border-2 border-amber-200 shrink-0"
        >
          ⌫
        </button>
      </div>

      {/* Các toa để chọn */}
      <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
        <p className="text-center text-sm md:text-base font-black text-lime-900 mb-2">
          Bé chạm toa có chữ <b>{expectedNext ?? '…'}</b> {done ? '— xong rồi! 🎉' : 'tiếp theo:'}
        </p>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3" role="group" aria-label="Chọn toa chữ">
          {current.carriages.map((car, i) => {
            const used = usedSet.has(i);
            const isNext = !used && car === expectedNext && !done;
            return (
              <button
                key={`${car}-${i}`}
                onClick={() => handleCarPick(i)}
                disabled={stage.locked || done || used}
                data-testid="answer-option"
                {...(qa ? { 'data-correct': isNext || (used && current.cars.includes(car)) } : {})}
                aria-label={`Toa chữ ${car}, phím ${i + 1}${used ? ' (đã xếp)' : ''}`}
                className={`min-w-[64px] min-h-[64px] px-4 py-2 rounded-2xl border-2 font-black flex flex-col items-center justify-center gap-0.5 transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                  used
                    ? 'opacity-30 bg-slate-100 border-slate-200 text-slate-400'
                    : showCorrectAnswer && isNext
                      ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'bg-lime-50 border-lime-300 hover:border-lime-500 hover:scale-105 text-lime-950 shadow-md'
                }`}
              >
                <span className="text-xl" aria-hidden="true">🚃</span>
                <span className="text-xl md:text-2xl">{car}</span>
                <span className="text-[10px] text-slate-400 font-bold">phím {i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs md:text-sm font-bold text-slate-500">
        🚂 Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal} · Bé dùng chuột, tay chạm hoặc phím số đều được
      </p>
    </div>
  );
};
