import React, { useMemo, useState } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2, CheckCircle2 } from 'lucide-react';
import { useGameStage } from '../../hooks/useGameStage';
import { getTierMeta } from '../../data/gameLevels';
import {
  INITIAL_OPTIONS,
  POOL_BY_TIER,
  SYLLABLE_ROUNDS_PER_TIER,
  TONE_OPTIONS,
  VOWEL_OPTIONS,
  buildSyllableRounds,
} from '../../data/games/syllable_builder';
import type { SyllablePuzzle, SyllableSeed } from '../../data/games/syllable_builder';

export { INITIAL_OPTIONS, POOL_BY_TIER, SYLLABLE_ROUNDS_PER_TIER, VOWEL_OPTIONS, buildSyllableRounds };
export type { SyllablePuzzle, SyllableSeed };

export const SyllableBuilderGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const roundsPerTier = useMemo(() => SYLLABLE_ROUNDS_PER_TIER.slice(), []);
  const stage = useGameStage({ gameId: 'syllable_builder', roundsPerTier, advanceDelayMs: 1500 });
  const [selectedInitial, setSelectedInitial] = useState<string>('');
  const [selectedVowel, setSelectedVowel] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const rounds = useMemo(() => buildSyllableRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];


  const handleCheck = () => {
    if (stage.locked) return;
    if (!selectedInitial || !selectedVowel || !selectedTone) {
      sound.speak('Bé hãy chọn đủ âm đầu, vần và dấu thanh nhé!');
      return;
    }

    if (
      selectedInitial === current.initial &&
      selectedVowel === current.vowel &&
      selectedTone === current.tone
    ) {
      sound.playCorrect();
      sound.speak(current.readAloud);
      setFeedback(`Đúng rồi! ${current.word.toUpperCase()}!`);
      setSelectedInitial('');
      setSelectedVowel('');
      setSelectedTone('');
      stage.submitCorrect();
      window.setTimeout(() => setFeedback(null), 1500);
    } else {
      sound.playWrong();
      sound.speak(`Chưa đúng rồi! Bé thử chọn lại nhé.`);
      setFeedback('Chưa đúng rồi, bé thử lại nào!');
      stage.submitWrong();
      window.setTimeout(() => setFeedback(null), 1200);
    }
  };

  return (
    <GameModalWrapper
      gameId="syllable_builder"
      title="Xưởng Ghép Tiếng Lớp 1"
      subtitle="Ghép các mảnh âm đầu, vần và dấu thanh để tạo thành từ đúng"
      mascotEmoji="🦊"
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
      instructions={`Bé hãy ghép thành từ: "${current.word}"`}
      audioInstruction={`Hãy ghép thành từ ${current.word}`}
    >
      <div className="w-full max-w-2xl bg-white/90 rounded-3xl p-4 md:p-6 shadow-xl border-3 border-amber-300 flex flex-col items-center">
        {/* Target Image & Word */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl p-3 bg-amber-100 rounded-2xl shadow-inner border border-amber-200">
            {current.emoji}
          </div>
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Từ cần ghép:</span>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black text-amber-900 font-display">{current.word}</span>
              <button
                onClick={() => sound.speak(current.word)}
                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full"
                title="Nghe từ"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Builder Workbench Slots */}
        <div className="flex items-center justify-center gap-2 md:gap-4 my-3 p-3 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-300 w-full max-w-lg">
          {/* Initial slot */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-500 mb-1">Âm đầu</span>
            <div className="w-16 h-16 bg-white rounded-2xl border-2 border-blue-400 flex items-center justify-center text-2xl font-black text-blue-700 shadow-sm">
              {selectedInitial || '?'}
            </div>
          </div>

          <span className="text-2xl font-black text-amber-500">+</span>

          {/* Vowel slot */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-500 mb-1">Nguyên âm</span>
            <div className="w-16 h-16 bg-white rounded-2xl border-2 border-emerald-400 flex items-center justify-center text-2xl font-black text-emerald-700 shadow-sm">
              {selectedVowel || '?'}
            </div>
          </div>

          <span className="text-2xl font-black text-amber-500">+</span>

          {/* Tone slot */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-500 mb-1">Dấu thanh</span>
            <div className="w-16 h-16 bg-white rounded-2xl border-2 border-rose-400 flex items-center justify-center text-2xl font-black text-rose-700 shadow-sm">
              {TONE_OPTIONS.find((t) => t.val === selectedTone)?.sym || '?'}
            </div>
          </div>
        </div>

        {/* Selection Options */}
        <div className="w-full space-y-3 mt-2">
          {/* Step 1: Initial */}
          <div>
            <span className="text-xs font-bold text-blue-700 block mb-1">1. Chọn âm đầu:</span>
            <div className="flex flex-wrap gap-2">
              {INITIAL_OPTIONS.map((char) => (
                <button
                  key={char}
                  onClick={() => {
                    sound.playClick();
                    setSelectedInitial(char);
                  }}
                  className={`w-11 h-11 rounded-xl font-black text-lg border-2 transition-all active:scale-95 ${
                    selectedInitial === char
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-105'
                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Vowel */}
          <div>
            <span className="text-xs font-bold text-emerald-700 block mb-1">2. Chọn nguyên âm:</span>
            <div className="flex flex-wrap gap-2">
              {VOWEL_OPTIONS.map((char) => (
                <button
                  key={char}
                  onClick={() => {
                    sound.playClick();
                    setSelectedVowel(char);
                  }}
                  className={`w-11 h-11 rounded-xl font-black text-lg border-2 transition-all active:scale-95 ${
                    selectedVowel === char
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-105'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Tone */}
          <div>
            <span className="text-xs font-bold text-rose-700 block mb-1">3. Chọn dấu thanh:</span>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.val}
                  onClick={() => {
                    sound.playClick();
                    setSelectedTone(t.val);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs md:text-sm border-2 transition-all active:scale-95 ${
                    selectedTone === t.val
                      ? 'bg-rose-600 text-white border-rose-700 shadow-md scale-105'
                      : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="mt-3 text-sm font-black text-emerald-700 animate-bounce flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {feedback}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleCheck}
          disabled={stage.locked}
          className="mt-4 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base md:text-lg rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
        >
          Kiểm tra kết quả 🎯
        </button>
      </div>
    </GameModalWrapper>
  );
};