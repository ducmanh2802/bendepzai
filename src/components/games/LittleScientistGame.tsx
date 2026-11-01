import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildScientistRounds, type SciRound } from '../../data/games/little_scientist';

export { buildScientistRounds };

const ROUNDS_PER_TIER = defaultRoundsPerTier();

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

export const LittleScientistGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'little_scientist', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 2600 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildScientistRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="little_scientist"
      title="Nhà Khoa Học Nhí"
      subtitle="Thả vật vào chậu nước và phân loại cùng Gấu"
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
      instructions="Bé nhìn vật rồi bỏ vào đúng giỏ theo luật của Gấu nhé!"
      audioInstruction={current ? `${current.rule.prompt} ${current.item.name}.` : undefined}
      audioLang="vi-VN"
      praiseSubject="VIETNAMESE"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-teal-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">🔬</span>
          <h3 className="text-2xl md:text-3xl font-black text-teal-900">Nhà Khoa Học Nhí</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Gấu Bút Chì đưa ra một luật mới mỗi vòng: vật nào chìm, vật nào
            nổi? Vật nào sống? Thấy vào ngày hay đêm? Nóng hay lạnh?
            Nam châm có hút không?
          </p>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Bé bỏ vật vào đúng giỏ 🧺, Gấu sẽ kể vì sao lại thế!
          </p>
          <div className="flex items-center gap-2 text-3xl" aria-hidden="true">
            <span className="px-4 py-2 bg-sky-100 rounded-2xl border-2 border-sky-300">🎈</span>
            <span className="text-slate-400">+</span>
            <span className="px-4 py-2 bg-amber-100 rounded-2xl border-2 border-amber-300">🧸</span>
            <span className="text-slate-400">=</span>
            <span className="text-xl font-black text-teal-800">🧺🧺</span>
          </div>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <ScientistStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const ScientistStage: React.FC<{ stage: GameStage; current: SciRound }> = ({ stage, current }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [picked, setPicked] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);

  useEffect(() => {
    setPicked(null);
    // "Chơi lại" đổi nonce nhưng id vòng có thể trùng → reset theo cả hai.
  }, [current.id, stage.nonce]);

  const done = picked !== null;

  const handlePick = (bucket: 'A' | 'B'): void => {
    if (stage.locked || done) return;
    if (bucket === current.item.bucket) {
      setPicked(bucket);
      sound.playCorrect();
      sound.speakLater(current.item.why, 'vi-VN', 350);
      reportCorrect(current.item.name);
      stage.submitCorrect();
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      const right = current.baskets.find((b) => b.bucket === current.item.bucket);
      reportWrong(bucket, right ? right.label : '');
      stage.submitWrong();
    }
  };

  useEffect(() => {
    if (stage.locked) return;
    const onKey = (e: KeyboardEvent): void => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= current.baskets.length) {
        e.preventDefault();
        handlePick(current.baskets[n - 1].bucket);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const isAnswer = (bucket: 'A' | 'B'): boolean => bucket === current.item.bucket;

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3 md:gap-4">
      {/* Luật của vòng + loa */}
      <div className="flex items-center gap-3 bg-white/95 rounded-3xl px-5 py-2.5 shadow-md border-2 border-teal-200 max-w-full">
        <span className="text-5xl md:text-6xl shrink-0" aria-hidden="true">🐻</span>
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-black text-teal-700">🔬 {current.rule.name}</p>
          <p className="text-lg md:text-2xl font-black text-teal-950 break-words" aria-live="polite">
            {current.rule.prompt}
          </p>
        </div>
        <button
          onClick={() => sound.speak(`${current.rule.prompt} ${current.item.name}.`, 'vi-VN')}
          aria-label="Nghe lại luật chơi"
          title="Bấm loa để nghe luật"
          className="min-w-[44px] min-h-[44px] px-3 shrink-0 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-full text-sm"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" /> Nghe 🔊
        </button>
      </div>

      {/* Vật cần phân loại */}
      <div className="flex items-center gap-3 bg-white rounded-3xl px-6 py-3 shadow-lg border-2 border-amber-200">
        <span className="text-6xl md:text-7xl" role="img" aria-label={current.item.name}>
          {current.item.emoji}
        </span>
        <div className="text-left">
          <p className="text-xl md:text-2xl font-black text-slate-900">{current.item.name}</p>
          <p className="text-xs md:text-sm font-bold text-slate-500">Bé bỏ vào giỏ nào?</p>
        </div>
      </div>

      {/* 2 giỏ */}
      <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
        <div className="grid grid-cols-2 gap-3 md:gap-4" role="group" aria-label="Chọn giỏ">
          {current.baskets.map((b, i) => {
            const chosen = picked === b.bucket;
            const answer = isAnswer(b.bucket);
            return (
              <button
                key={`${b.bucket}-${i}`}
                onClick={() => handlePick(b.bucket)}
                disabled={stage.locked || done}
                data-testid="answer-option"
                {...(qa ? { 'data-correct': answer } : {})}
                aria-label={`Giỏ ${b.label}, phím ${i + 1}`}
                className={`min-w-[120px] min-h-[96px] px-4 py-3 rounded-3xl border-2 font-black flex flex-col items-center justify-center gap-1 transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                  chosen
                    ? 'bg-teal-400 border-teal-600 text-white scale-105'
                    : showCorrectAnswer && answer
                      ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 text-emerald-900'
                      : done
                        ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-amber-50 border-amber-300 hover:border-amber-500 hover:scale-105 text-slate-800 shadow-md'
                }`}
              >
                <span className="text-5xl md:text-6xl" aria-hidden="true">🧺{b.emoji}</span>
                <span className="text-base md:text-lg">{b.label}</span>
                <span className="text-[10px] text-slate-400 font-bold">phím {i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Giải thích sau khi đúng */}
      {done && (
        <div className="w-full bg-emerald-50 rounded-2xl px-4 py-2.5 border-2 border-emerald-300 text-center animate-pop" aria-live="polite">
          <p className="text-base md:text-lg font-black text-emerald-900">💡 Vì sao? {current.item.why}</p>
        </div>
      )}

      <p className="text-xs md:text-sm font-bold text-slate-500">
        🔬 Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal} · Bé dùng chuột, tay chạm hoặc phím số đều được
      </p>
    </div>
  );
};
