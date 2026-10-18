import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import {
  TONE_SYMBOLS,
  buildToneRounds,
  type ToneName,
  type TonePaintRound,
} from '../../data/games/tone_paint';

export { buildToneRounds, TONE_SYMBOLS };
export type { ToneName };

const ROUNDS_PER_TIER = defaultRoundsPerTier();

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

export const TonePaintGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'tone_paint', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1200 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildToneRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="tone_paint"
      title="Tô Dấu Thanh"
      subtitle="Nghe tiếng, nhìn hình và tô đúng dấu thanh"
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
      instructions={
        current?.needsVowelPick
          ? 'Bé hãy tô đúng dấu, rồi chạm vào chữ mang dấu nhé!'
          : 'Bé hãy nghe và tô đúng dấu thanh nhé!'
      }
      audioInstruction={current ? `Hãy tô đúng dấu thanh của từ ${current.word}` : undefined}
      praiseSubject="VIETNAMESE"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-orange-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">🖌️</span>
          <h3 className="text-2xl md:text-3xl font-black text-orange-900">Tô Dấu Thanh</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Bé bấm loa để nghe tiếng, nhìn hình, rồi chọn đúng dấu thanh trong 6 dấu.
            Tiếng khó có 2 chữ, bé còn phải chạm đúng chữ mang dấu nữa!
          </p>
          <div className="flex items-center justify-center gap-2 text-2xl font-black text-orange-800" aria-hidden="true">
            {['—', '´', '`', '?', '~', '.'].map((s) => (
              <span key={s} className="w-10 h-10 flex items-center justify-center bg-orange-100 rounded-xl border-2 border-orange-300">{s}</span>
            ))}
          </div>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <TonePaintStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const TonePaintStage: React.FC<{ stage: GameStage; current: TonePaintRound }> = ({
  stage,
  current,
}) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [pickedTone, setPickedTone] = useState<ToneName | null>(null);
  const [toneOk, setToneOk] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);

  useEffect(() => {
    setPickedTone(null);
    setToneOk(false);
  }, [current.id]);

  const handleTonePick = (tone: ToneName) => {
    if (stage.locked || toneOk) return;
    if (tone === current.targetTone) {
      sound.playCorrect();
      setPickedTone(tone);
      if (current.needsVowelPick) {
        setToneOk(true);
        sound.speak(`Đúng dấu rồi! Giờ bé chạm vào chữ mang dấu trong tiếng ${current.bare} nhé!`);
      } else {
        finishRound();
      }
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong(`dấu ${tone}`, `dấu ${current.targetTone}`);
      sound.speak(`Chưa đúng rồi. Bé nghe lại nhé: ${current.word}. Dấu bật ra rồi, bé chọn lại nào!`);
      stage.submitWrong();
    }
  };

  const handleVowelPick = (vowel: string) => {
    if (stage.locked || !toneOk) return;
    if (vowel === current.vowelAnswer) {
      finishRound();
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong(`chữ ${vowel}`, `chữ ${current.vowelAnswer}`);
      sound.speak(`Chưa đúng chỗ rồi. Dấu ${current.targetTone} nằm ở chữ nào trong tiếng ${current.bare}? Bé nghe lại: ${current.word}.`);
      stage.submitWrong();
    }
  };

  const finishRound = () => {
    sound.playStar();
    sound.speak(current.word);
    reportCorrect(current.word);
    stage.submitCorrect();
  };

  useEffect(() => {
    if (stage.locked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const options = !toneOk ? current.toneOptions : (current.vowelOptions ?? []);
      if (Number.isInteger(n) && n >= 1 && n <= options.length) {
        e.preventDefault();
        if (!toneOk) handleTonePick(current.toneOptions[n - 1]);
        else if (current.vowelOptions) handleVowelPick(current.vowelOptions[n - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const step: 'tone' | 'vowel' = current.needsVowelPick && toneOk ? 'vowel' : 'tone';

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-4">
      {/* Picture + word */}
      <div className="flex items-center gap-4 bg-white/95 rounded-3xl px-5 py-3 shadow-md border-2 border-orange-200">
        <span className="text-5xl md:text-6xl" role="img" aria-label={current.word}>{current.emoji}</span>
        <div className="flex flex-col items-start gap-1">
          {current.syllables ? (
            <div className="flex items-center gap-2 text-3xl md:text-4xl font-black text-orange-950" aria-label={`Từ ${current.word}`}>
              {current.syllables.map((syl, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-xl ${i === current.focusIndex ? 'bg-amber-300 ring-4 ring-amber-500' : 'bg-slate-100 text-slate-400'}`}
                >
                  {i === current.focusIndex ? current.bare : syl}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-4xl md:text-5xl font-black text-orange-950 tracking-widest" aria-label={`Tiếng ${current.bare}`}>
              {current.bare.split('').map((ch, i) => (
                <span key={i} className="inline-block px-0.5">{ch}</span>
              ))}
              <span className="inline-block ml-1 text-orange-400" aria-hidden="true">?</span>
            </span>
          )}
          <button
            onClick={() => sound.speak(current.word, 'vi-VN')}
            aria-label={`Nghe từ ${current.word}`}
            title="Bấm loa để nghe"
            className="min-w-[44px] min-h-[44px] px-3 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-full text-sm"
          >
            <Volume2 className="w-5 h-5" aria-hidden="true" /> Nghe 🔊
          </button>
        </div>
      </div>

      {/* Step 1: tone choices */}
      <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
        <p className="text-center text-sm md:text-base font-black text-orange-900 mb-2">
          {step === 'tone' ? '1️⃣ Bé chọn đúng dấu thanh:' : '2️⃣ Dấu đúng rồi! Chạm vào chữ mang dấu:'}
        </p>
        {step === 'tone' ? (
          <div className="grid grid-cols-3 gap-2 md:gap-3" role="group" aria-label="Chọn dấu thanh">
            {current.toneOptions.map((tone, i) => {
              const isAnswer = tone === current.targetTone;
              const dimmed = toneOk && !isAnswer;
              return (
                <button
                  key={tone}
                  onClick={() => handleTonePick(tone)}
                  disabled={stage.locked || toneOk}
                  data-testid="answer-option"
                  {...(qa ? { 'data-correct': isAnswer } : {})}
                  aria-label={`Dấu ${tone}, phím ${i + 1}`}
                  className={`min-w-[88px] min-h-[64px] px-3 py-2 rounded-2xl border-2 font-black flex flex-col items-center justify-center gap-0.5 transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                    pickedTone === tone
                      ? 'bg-emerald-400 border-emerald-600 text-white scale-105'
                      : showCorrectAnswer && isAnswer
                        ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 text-emerald-900'
                        : dimmed
                          ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400'
                          : 'bg-white border-orange-300 hover:border-orange-500 hover:scale-105 text-orange-950 shadow-md'
                  }`}
                >
                  <span className="text-3xl leading-none" aria-hidden="true">{TONE_SYMBOLS[tone]}</span>
                  <span className="text-xs md:text-sm capitalize">{tone}</span>
                  <span className="text-[10px] text-slate-400 font-bold">phím {i + 1}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 md:gap-3" role="group" aria-label="Chọn chữ mang dấu">
            {(current.vowelOptions ?? []).map((vowel, i) => {
              const isAnswer = vowel === current.vowelAnswer;
              return (
                <button
                  key={`${vowel}-${i}`}
                  onClick={() => handleVowelPick(vowel)}
                  disabled={stage.locked}
                  data-testid="answer-option"
                  {...(qa ? { 'data-correct': isAnswer } : {})}
                  aria-label={`Chữ ${vowel}, phím ${i + 1}`}
                  className={`min-w-[64px] min-h-[64px] px-4 py-2 rounded-2xl border-2 text-3xl font-black transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                    showCorrectAnswer && isAnswer
                      ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'bg-white border-orange-300 hover:border-orange-500 hover:scale-105 text-orange-950 shadow-md'
                  }`}
                >
                  {vowel}
                  <span className="block text-[10px] text-slate-400 font-bold">phím {i + 1}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs md:text-sm font-bold text-slate-500">
        🖌️ Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal} · Bé dùng chuột, tay chạm hoặc phím số đều được
      </p>
    </div>
  );
};
