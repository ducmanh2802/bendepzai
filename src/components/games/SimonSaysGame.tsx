import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildSimonRounds, type SimonPic, type SimonRound } from '../../data/games/simon_says';

export { buildSimonRounds };

const ROUNDS_PER_TIER = defaultRoundsPerTier();

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

/** Lời Gấu nói cho vòng hiện tại (luôn tiếng Anh). */
function spokenCommand(round: SimonRound): string {
  return round.simonSays ? `Simon says: ${stripQuotes(round.command)}` : stripQuotes(round.command);
}

function stripQuotes(command: string): string {
  return command.replace(/"/g, '');
}

export const SimonSaysGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'simon_says', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1400 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildSimonRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="simon_says"
      title="Simon Says — Gấu Ra Lệnh"
      subtitle="Nghe Gấu nói tiếng Anh và chạm đúng tranh"
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
      instructions="Nghe lệnh của Gấu Bút Chì rồi chạm đúng tranh nhé!"
      audioInstruction={current ? spokenCommand(current) : undefined}
      audioLang="en-GB"
      praiseSubject="ENGLISH"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-emerald-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">🐻</span>
          <h3 className="text-2xl md:text-3xl font-black text-emerald-900">Simon Says — Gấu Ra Lệnh</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Gấu nói lệnh bằng tiếng Anh, bé chạm đúng tranh! Màn cao có lệnh
            2 bước — bé chạm 2 tranh theo đúng thứ tự.
          </p>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Cẩn thận bẫy vui: Gấu KHÔNG nói “Simon says” thì bé phải NHỊN,
            chạm thẻ <span className="text-xl" aria-hidden="true">😴</span> Wait! mới đúng.
          </p>
          <div className="flex items-center gap-2 text-lg font-black bg-emerald-50 rounded-2xl px-4 py-2 border-2 border-emerald-200" aria-hidden="true">
            <span>🐻 “Simon says: Touch your nose!”</span>
            <span>→</span>
            <span className="text-3xl">👃</span>
          </div>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <SimonSaysStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const SimonSaysStage: React.FC<{ stage: GameStage; current: SimonRound }> = ({ stage, current }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [picked, setPicked] = useState<SimonPic[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);

  useEffect(() => {
    setPicked([]);
    // "Chơi lại" đổi nonce nhưng id vòng có thể trùng → reset theo cả hai.
  }, [current.id, stage.nonce]);

  const done = picked.length >= current.answers.length;

  const handlePick = (opt: SimonPic) => {
    if (stage.locked || done) return;
    const expected = current.answers[picked.length];
    if (opt.label === expected.label) {
      const next = [...picked, opt];
      setPicked(next);
      if (next.length === current.answers.length) {
        sound.playCorrect();
        sound.speakLater('Great job!', 'en-GB', 350);
        reportCorrect(current.command);
        stage.submitCorrect();
      } else {
        sound.playClick();
        sound.speakLater(opt.label, 'en-GB', 100);
      }
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong(opt.label, expected.label);
      sound.speak('Try again! Listen!', 'en-GB');
      stage.submitWrong();
    }
  };

  useEffect(() => {
    if (stage.locked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= current.options.length) {
        e.preventDefault();
        handlePick(current.options[n - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const isAnswer = (opt: SimonPic) => current.answers.some((a) => a.label === opt.label);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3 md:gap-4">
      {/* Lệnh của Gấu + loa */}
      <div className="flex items-center gap-3 bg-white/95 rounded-3xl px-5 py-2.5 shadow-md border-2 border-emerald-200 max-w-full">
        <span className="text-5xl md:text-6xl shrink-0" aria-hidden="true">🐻</span>
        <div className="min-w-0">
          <p className="text-lg md:text-2xl font-black text-emerald-950 break-words" aria-live="polite">
            {current.command}
          </p>
          <p className="text-xs md:text-sm font-bold text-slate-500">{current.vi}</p>
        </div>
        <button
          onClick={() => sound.speak(spokenCommand(current), 'en-GB')}
          aria-label="Nghe lại lệnh của Gấu"
          title="Bấm loa để nghe lệnh"
          className="min-w-[44px] min-h-[44px] px-3 shrink-0 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-full text-sm"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" /> Nghe 🔊
        </button>
      </div>

      {/* Tiến trình bước (lệnh 2 bước) / nhắc bẫy */}
      {current.twoStep ? (
        <p className="text-sm md:text-base font-black text-emerald-900" aria-live="polite">
          Bước 1 {picked.length >= 1 ? '✅' : '…'} → Bước 2 {picked.length >= 2 ? '✅' : '…'}
        </p>
      ) : stage.tier >= 5 ? (
        <p className="text-sm md:text-base font-black text-amber-800 bg-amber-50 rounded-full px-4 py-1 border border-amber-200">
          🤔 Gấu có nói “Simon says” không?
        </p>
      ) : null}

      {/* Tranh lựa chọn */}
      <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
        <p className="text-center text-sm md:text-base font-black text-emerald-900 mb-2">
          {current.trap
            ? 'Bé chọn thẻ 😴 Wait! vì Gấu không nói “Simon says”:'
            : current.twoStep
              ? 'Bé chạm 2 tranh theo đúng thứ tự Gấu nói:'
              : 'Bé chạm đúng tranh Gấu nói:'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3" role="group" aria-label="Chọn tranh">
          {current.options.map((opt, i) => {
            const chosen = picked.some((p) => p.label === opt.label);
            const answer = isAnswer(opt);
            return (
              <button
                key={`${opt.label}-${i}`}
                onClick={() => handlePick(opt)}
                disabled={stage.locked || done}
                data-testid="answer-option"
                {...(qa ? { 'data-correct': answer } : {})}
                aria-label={`${opt.label}, phím ${i + 1}`}
                className={`min-w-[72px] min-h-[64px] px-3 py-2 rounded-2xl border-2 font-black flex flex-col items-center justify-center gap-0.5 transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                  chosen
                    ? 'bg-emerald-400 border-emerald-600 text-white scale-105'
                    : showCorrectAnswer && answer
                      ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 text-emerald-900'
                      : done
                        ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-white border-emerald-300 hover:border-emerald-500 hover:scale-105 text-slate-800 shadow-md'
                }`}
              >
                <span className="text-4xl md:text-5xl" aria-hidden="true">{opt.emoji}</span>
                <span className="text-base md:text-lg">{opt.label}</span>
                <span className="text-[10px] text-slate-400 font-bold">phím {i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs md:text-sm font-bold text-slate-500">
        🐻 Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal} · Bé dùng chuột, tay chạm hoặc phím số đều được
      </p>
    </div>
  );
};
