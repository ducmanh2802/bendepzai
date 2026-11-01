import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KIDBOX_STEP_LABELS, KidBoxActivity, KidBoxActivityItem, KidBoxUnit } from '../../types/kidBox';
import { buildRounds, getChoicePresentation, KidBoxResponse } from '../../services/kidBoxActivities';
import { submitActivityResponse } from '../../services/kidBoxEngine';
import { KidBoxStore } from '../../services/kidBoxStore';
import { StorageService } from '../../services/storage';
import { sound } from '../../services/sound';
import {
  resolvePraise,
  speakPraise,
  type PraiseResult,
} from '../../services/praiseEngine';
import {
  BRITISH_LOCALE,
  describeSpeakingMethod,
  getBritishVoiceCapability,
  getSpeechRecognitionCapability,
  listenBritishOnce,
} from '../../services/britishSpeech';
import { KidBoxWordSafari } from './KidBoxWordSafari';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Hand, Mic, Volume2, X } from 'lucide-react';

interface KidBoxActivityPlayerProps {
  activity: KidBoxActivity;
  unit: KidBoxUnit;
  onClose: () => void;
  onCompleted: () => void;
}

type RecognitionState = 'IDLE' | 'LISTENING' | 'MATCHED' | 'NO_MATCH' | 'UNAVAILABLE';

/**
 * §9 activity runner for the Kid's Box Companion track.
 *
 * Accessibility (§32): audio is never the only channel (every spoken item has a
 * caption), replay is free and unlimited, buttons are large and keyboard
 * reachable, and the app's existing reduced-motion CSS hooks still apply.
 *
 * Honesty (§13, §14): speech recognition is optional, the UI always names the
 * method used, and no pronunciation score is ever shown.
 */
export const KidBoxActivityPlayer: React.FC<KidBoxActivityPlayerProps> = ({
  activity,
  unit,
  onClose,
  onCompleted,
}) => {
  const rounds = useMemo(() => buildRounds(activity, unit), [activity, unit]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [usedReplay, setUsedReplay] = useState(false);
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('IDLE');
  const [methodLabel, setMethodLabel] = useState<string | null>(null);
  // P38 canonical praise: caption === TTS, always English (en-GB) in Kid's Box.
  const [praise, setPraise] = useState<PraiseResult | null>(null);
  const [praiseCorrect, setPraiseCorrect] = useState(false);
  const praiseEventRef = useRef(0);

  const startedAt = useRef(Date.now());
  const voice = useMemo(() => getBritishVoiceCapability(), []);
  const recognition = useMemo(() => getSpeechRecognitionCapability(), []);

  // P34 — containment + restoration. Mounted only while the activity is open
  // (conditional render in KidBoxCompanionScreen), so the hook captures the
  // opener at mount and hands focus back on unmount. No dismissal change:
  // Tab cycles inside; the explicit close button remains the only exit.
  const dialogRef = useFocusTrap<HTMLDivElement>(true);

  const isSpeaking = activity.mode === 'SPEAK';
  const isGame = activity.kind === 'MINI_GAME';
  const isAct = activity.mode === 'ACTION';
  const round: KidBoxActivityItem[] = rounds[Math.min(roundIndex, rounds.length - 1)];
  const target = round.find((i) => i.isCorrect);
  const isLastRound = roundIndex >= rounds.length - 1;
  const stepLabel = KIDBOX_STEP_LABELS[activity.step];

  useEffect(() => {
    setSelectedId(null);
    setFeedback(null);
    setPraise(null);
    setPraiseCorrect(false);
    setShowExplanation(false);
    setRecognitionState(isSpeaking && !recognition.supported ? 'UNAVAILABLE' : 'IDLE');
    startedAt.current = Date.now();
  }, [roundIndex, isSpeaking, recognition.supported]);

  // §12 — a listening activity announces itself as soon as it opens. The set
  // of listening activities comes from the mapping layer, so a new audio drill
  // is never silently silent (§28: audio and answers must belong to one task).
  const presentation = useMemo(() => getChoicePresentation(activity), [activity]);
  useEffect(() => {
    if (presentation.speaks && target) {
      const timer = setTimeout(() => sound.speak(target.speakText, BRITISH_LOCALE), 350);
      return () => clearTimeout(timer);
    }
  }, [presentation.speaks, target]);

  // Bé rời hoạt động khi lời đọc còn đang chờ → cắt tiếng, kẻo giọng Anh
  // vẫn đọc vang lên ở màn hình khác.
  useEffect(() => () => sound.stopSpeaking(), []);

  const submit = useCallback(
    (response: KidBoxResponse, responseKey: string, extra?: { speechUsed?: boolean }) => {
      const result = submitActivityResponse({
        activity,
        response,
        responseKey,
        startedAt: startedAt.current,
        usedReplay,
        speechRecognitionUsed: extra?.speechUsed ?? false,
        childProfileId: StorageService.getChildProfile().id,
      });
      setAttempted((n) => n + 1);
      if (result.outcome === 'CORRECT' || result.outcome === 'RECOGNITION_MATCH') {
        setCorrectCount((n) => n + 1);
        sound.playCorrect();
      } else if (result.outcome === 'INCORRECT') {
        sound.playWrong();
      } else {
        sound.playClick();
      }
      return result;
    },
    [activity, usedReplay]
  );

  /**
   * P38 — every Kid's Box praise moment resolves through the canonical
   * engine (English, en-GB). The SAME string is captioned and spoken, and
   * the eventId guarantees one logical event → one praise → max one TTS.
   */
  const praiseOutcome = (correct: boolean, roundKey: string): PraiseResult => {
    praiseEventRef.current += 1;
    const resolved = resolvePraise({
      subject: 'ENGLISH',
      kidBox: true,
      outcome: correct ? 'CORRECT' : 'ENCOURAGEMENT',
      eventId: `kidbox:${activity.id}:${roundKey}:n${praiseEventRef.current}`,
    });
    setPraise(resolved);
    setPraiseCorrect(correct);
    setFeedback(resolved.text);
    speakPraise(resolved);
    return resolved;
  };

  const handleChoice = (itemId: string) => {
    if (selectedId) return;
    setSelectedId(itemId);
    const result = submit({ type: 'CHOICE', itemId }, `round${roundIndex}-${itemId}`);
    praiseOutcome(
      result.outcome === 'CORRECT' || result.outcome === 'RECOGNITION_MATCH',
      `round${roundIndex}-${itemId}`
    );
    setShowExplanation(true);
  };

  const handleActionDone = (itemId: string) => {
    const result = submit({ type: 'ACTION_DONE', itemId }, `act-${roundIndex}-${itemId}`);
    praiseOutcome(result.outcome === 'CORRECT', `act-${roundIndex}-${itemId}`);
    setShowExplanation(true);
  };

  /** §13 — recognition when available, self-check when not. */
  const handleSpeak = async () => {
    if (!target) return;

    if (!recognition.supported) {
      setRecognitionState('UNAVAILABLE');
      setMethodLabel(describeSpeakingMethod('SELF_CHECK'));
      submit({ type: 'SPEAK', recognitionSupported: false, selfConfirmed: true }, `speak-${roundIndex}`);
      // Encouragement stays in English (P38); the Vietnamese self-check
      // guidance lives in the method chip above, not in the praise line.
      praiseOutcome(false, `speak-${roundIndex}`);
      setShowExplanation(true);
      return;
    }

    setRecognitionState('LISTENING');
    const match = await listenBritishOnce(target.speakText);
    if (!match) {
      setRecognitionState('NO_MATCH');
      setMethodLabel(describeSpeakingMethod('SELF_CHECK'));
      submit({ type: 'SPEAK', recognitionSupported: false, selfConfirmed: true }, `speak-${roundIndex}-fallback`);
      praiseOutcome(false, `speak-${roundIndex}-fallback`);
      setShowExplanation(true);
      return;
    }

    setRecognitionState(match.matched ? 'MATCHED' : 'NO_MATCH');
    setMethodLabel(describeSpeakingMethod('SPEECH_RECOGNITION_MATCH'));
    KidBoxStore.recordSpeakingAttempt({
      attemptId: `kidbox_speak_${activity.id}_${roundIndex}`,
      activityId: activity.id,
      unitId: unit.id,
      skillId: activity.skillId,
      at: Date.now(),
      mode: activity.kind === 'SPEAKING_QUESTION_ANSWER' ? 'QUESTION_ANSWER' : 'REPEAT',
      method: 'SPEECH_RECOGNITION_MATCH',
      transcript: match.transcript,
      matchedTarget: match.matched,
      pronunciationScored: false,
    });
    const result = submit(
      { type: 'SPEAK', itemId: target.id, transcript: match.transcript, recognitionSupported: true },
      `speak-${roundIndex}`,
      { speechUsed: true }
    );
    praiseOutcome(result.outcome === 'RECOGNITION_MATCH', `speak-${roundIndex}-match`);
    setShowExplanation(true);
  };

  const handleGameFinish = (taps: string[]) => {
    const result = submit({ type: 'TAPS', itemIds: taps }, `game-${taps.join('_')}`);
    praiseOutcome(result.outcome === 'CORRECT', `game-${taps.join('_')}`);
    setShowExplanation(true);
  };

  /** §12 — replay is free, unlimited, and never counted against the child. */
  const replay = (slow: boolean) => {
    if (!target) return;
    setUsedReplay(true);
    sound.speak(target.speakText, BRITISH_LOCALE);
    if (slow) sound.speakLater(target.speakText, BRITISH_LOCALE, 900);
  };

  const goNext = () => {
    if (isLastRound) {
      sound.playStar();
      onCompleted();
      return;
    }
    setRoundIndex((n) => n + 1);
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={activity.titleVi}
      tabIndex={-1}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-emerald-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-50">
              {stepLabel.emoji} {stepLabel.vi} · {activity.kind.replace(/_/g, ' ').toLowerCase()}
            </p>
            <h3 className="text-base md:text-lg font-black font-display truncate">{activity.titleVi}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng hoạt động"
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Instruction: always visible as text, never audio-only (§32) */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5">
            <p className="text-sm font-black text-emerald-950">{activity.instructionVi}</p>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5" lang="en">
              {activity.instructionEn}
            </p>
          </div>

          {/* §7 — honest voice status; never claims British audio it cannot play */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span
              className={`px-2.5 py-1 rounded-full border ${
                voice.canClaimBritishEnglish
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              🔊 {voice.label}
            </span>
            {voice.fallback === 'USE_TEXT_AND_CAPTIONS_ONLY' && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                Bài này có đủ chữ và hình, bé vẫn làm được không cần loa.
              </span>
            )}
            {recognitionState === 'UNAVAILABLE' && (
              <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                🎤 Máy chưa nhận giọng nói — bé tự đối chiếu cùng ba mẹ.
              </span>
            )}
            {methodLabel && (
              <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-900 border border-violet-300">
                Đã ghi nhận bằng: {methodLabel}
              </span>
            )}
          </div>

          {/* Listening controls — free replay (§12). Shown for every activity whose
              stimulus is audio, so a listening drill can never open in silence. */}
          {presentation.speaks && target && !isGame && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => replay(false)}
                className="min-h-[48px] px-4 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 text-amber-950 font-black text-sm flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
                Nghe lại
              </button>
              <button
                onClick={() => replay(true)}
                className="min-h-[48px] px-4 rounded-2xl bg-white border-2 border-amber-300 text-amber-900 font-black text-sm flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                🐢 Nghe chậm
              </button>
              <span className="text-[11px] font-bold text-slate-500">Nghe bao nhiêu lần cũng được, không bị trừ điểm.</span>
            </div>
          )}

          {/* GAME step */}
          {isGame && (
            <KidBoxWordSafari
              items={round}
              onFinished={handleGameFinish}
              onReplay={replay}
            />
          )}

          {/* LISTEN AND ACT */}
          {isAct && !isGame && (
            <div className="space-y-3">
              {round.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border-2 border-sky-200 bg-sky-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl" aria-hidden="true">
                      {item.pictureEmoji}
                    </span>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{item.captionEn}</p>
                      <p className="text-xs font-bold text-sky-800">{item.actionCueVi ?? item.captionVi}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleActionDone(item.id)}
                    className="min-h-[48px] px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Hand className="w-4 h-4" />
                    Bé đã làm rồi
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* SPEAK */}
          {isSpeaking && target && !isGame && (
            <div className="space-y-3">
              <div className="p-5 rounded-3xl bg-violet-50 border-2 border-violet-200 text-center">
                <p className="text-3xl font-black font-display text-violet-950" lang="en">
                  {target.captionEn}
                </p>
                {target.captionVi && <p className="text-sm font-bold text-violet-800 mt-1">{target.captionVi}</p>}
                <button
                  onClick={() => replay(false)}
                  className="mt-3 min-h-[48px] px-4 rounded-2xl bg-white border-2 border-violet-300 text-violet-900 font-black text-sm flex items-center gap-2 mx-auto active:scale-95 cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                  Nghe mẫu
                </button>
              </div>
              <button
                onClick={handleSpeak}
                disabled={recognitionState === 'LISTENING'}
                className="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-black text-base flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                {recognitionState === 'LISTENING'
                  ? 'Đang nghe…'
                  : recognitionState === 'UNAVAILABLE'
                    ? 'Mình đã nói xong (tự đối chiếu)'
                    : 'Mình nói theo'}
              </button>
              <p className="text-[11px] font-bold text-slate-500 text-center">
                Ứng dụng chỉ so khớp giọng nói, không chấm điểm phát âm.
              </p>
            </div>
          )}

          {/* CHOICE steps: SEE / HEAR / UNDERSTAND / PRACTICE / CHECK */}
          {!isGame && !isAct && !isSpeaking && (
            <div className="space-y-4">
              {/* The stimulus comes from the mapping layer, so it always matches
                  the four answers: a picture for SEE, a spoken word for the
                  listening drills, the English word for the reading drills. */}
              {presentation.stimulus === 'picture' && target?.pictureEmoji && (
                <div className="text-center">
                  <div className="inline-flex w-28 h-28 md:w-32 md:h-32 items-center justify-center text-6xl md:text-7xl bg-amber-50 border-4 border-amber-200 rounded-3xl">
                    <span aria-hidden="true">{target.pictureEmoji}</span>
                  </div>
                  <p className="sr-only">{target.captionEn}</p>
                </div>
              )}

              {presentation.stimulus === 'word' && target && (
                <div className="text-center p-5 rounded-3xl bg-amber-50 border-4 border-amber-200">
                  <p className="sr-only">{target.captionEn}</p>
                  <p className="text-4xl md:text-5xl font-black font-display text-slate-900 break-words" lang="en">
                    {target.word ?? target.captionEn}
                  </p>
                </div>
              )}

              {/* Audio is never the only channel (§32): the word being heard is
                  captioned so a voiceless/offline device still sees the task.
                  The free replay buttons live in the listening controls above. */}
              {presentation.stimulus === 'none' && target && (
                <p className="sr-only">{target.captionEn}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {round
                  .filter((item) => presentation.stimulus !== 'picture' || !item.isCorrect)
                  .map((item) => {
                    const isSelected = selectedId === item.id;
                    const isAnswer = Boolean(selectedId) && item.isCorrect;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleChoice(item.id)}
                        disabled={Boolean(selectedId)}
                        aria-label={item.captionEn}
                        className={`p-4 rounded-2xl border-2 font-black transition-all active:scale-95 disabled:cursor-default cursor-pointer ${
                          isSelected
                            ? 'border-blue-400 bg-blue-50'
                            : isAnswer
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {presentation.option === 'picture' && item.pictureEmoji && (
                          <span className="block text-4xl md:text-5xl" aria-hidden="true">
                            {item.pictureEmoji}
                          </span>
                        )}
                        <span
                          className="block text-sm md:text-base text-slate-900 mt-1 break-words"
                          lang={presentation.option === 'meaning' ? 'vi' : 'en'}
                        >
                          {presentation.option === 'meaning'
                            ? item.captionEn
                            : presentation.option === 'word'
                              ? item.word ?? item.captionEn
                              : ''}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Feedback + §28 explanation — caption === TTS (P38 parity) */}
          {feedback && (
            <div
              className={`rounded-2xl border-2 p-3.5 text-sm font-black ${
                praiseCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
              role="status"
              data-testid="praise-caption"
              data-praise-text={praise?.text ?? feedback}
              data-praise-tts={praise?.ttsText ?? feedback}
              data-praise-locale={praise?.locale ?? BRITISH_LOCALE}
              data-praise-language={praise?.language ?? 'en-GB'}
              data-praise-outcome={praise?.outcome ?? ''}
              lang="en"
            >
              {feedback}
              {showExplanation && <p className="text-xs font-semibold mt-1.5 opacity-90">{activity.explanation}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-[11px] font-black text-slate-600">
            Vòng {roundIndex + 1}/{rounds.length} · Đúng {correctCount}/{attempted || 0}
          </div>
          <div className="flex items-center gap-2">
            {roundIndex > 0 && (
              <button
                onClick={() => setRoundIndex((n) => n - 1)}
                className="min-h-[44px] px-4 rounded-2xl bg-white border-2 border-slate-300 text-slate-700 font-black text-xs active:scale-95 cursor-pointer"
              >
                Về vòng trước
              </button>
            )}
            <button
              onClick={goNext}
              className="min-h-[44px] px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-sm active:scale-95 cursor-pointer"
            >
              {isLastRound ? 'Xong' : 'Tiếp tục'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
