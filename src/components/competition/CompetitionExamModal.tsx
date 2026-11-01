import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CompetitionExamResult,
  CompetitionQuestion,
  ExamBlueprint,
  QuestionResponse,
} from '../../types/competition';
import { CompetitionEngine, QUESTION_TYPE_LABELS } from '../../services/competitionEngine';
import { StorageService } from '../../services/storage';
import { sound } from '../../services/sound';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useSpeak } from '../../hooks/useSpeak';
import {
  assertQuestionAudioTarget,
  buildQuestionAudioTarget,
  getQuestionAudioLang,
  logQuestionAudioTarget,
  resolveQuestionAudioText,
} from '../../services/questionAudio';
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Volume2,
  X,
  Send,
  Info,
} from 'lucide-react';

interface CompetitionExamModalProps {
  blueprint: ExamBlueprint;
  questions: CompetitionQuestion[];
  /** Questions the blueprint asked for but the bank could not supply (§16). */
  shortfall?: number;
  isOpen: boolean;
  onClose: () => void;
  onFinish: (result: CompetitionExamResult) => void;
  /** Bé-friendly mode: hide countdown (timer still runs). */
  kidMode?: boolean;
}

type MatchingState = Record<string, string>;

/**
 * EXAM SESSION RUNNER
 *
 * Correctness is NEVER computed here: every verdict comes from
 * `CompetitionEngine.gradeAnswer` (§1.3 DOMAIN STATE → UI STATE).
 *
 * Reliability guarantees:
 *  - the timer is timestamp based, so background tabs and throttling are safe;
 *  - answers live in refs, so the auto-submit path can never read a stale
 *    closure (this previously wiped every answer on timeout);
 *  - submission is guarded by a one-shot ref, so double clicks, a confirm
 *    dialog plus a timer hit, or back/forward can never double-award rewards;
 *  - per-question durations are measured, never defaulted to a fake value.
 */
export const CompetitionExamModal: React.FC<CompetitionExamModalProps> = ({
  blueprint,
  questions,
  shortfall = 0,
  isOpen,
  onClose,
  onFinish,
  kidMode = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [matching, setMatching] = useState<MatchingState>({});
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(blueprint.durationSeconds);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // --- Refs (authoritative state for the timer / submit paths) --------------
  const answersRef = useRef<Record<string, string>>({});
  const matchingRef = useRef<MatchingState>({});
  const startedAtRef = useRef<number>(Date.now());
  const deadlineRef = useRef<number>(Date.now() + blueprint.durationSeconds * 1000);
  const questionStartRef = useRef<number>(Date.now());
  const elapsedRef = useRef<Record<string, number>>({});
  const currentIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);
  const { state: questionAudioState, speak: speakQuestion } = useSpeak();
  // Last canonical question text handed toward TTS (test hook, also rendered
  // as data-last-spoken for isolated-world automation).
  const [lastQuestionSpoken, setLastQuestionSpoken] = useState<string | null>(null);

  // QUESTION AUDIO — single source of truth (audioPrompt || prompt).
  // Competition questions carry no audioPrompt field, so this always resolves
  // to the canonical prompt. NEVER options[0]/correctAnswer/explanation:
  // resolver returns null (AUDIO_UNAVAILABLE) instead of falling back.
  const playQuestionAudio = useCallback(() => {
    const question = questions[currentIndexRef.current];
    if (!question) return;
    const target = buildQuestionAudioTarget(question);
    if (!target) return;
    if (import.meta.env.DEV) {
      assertQuestionAudioTarget({
        questionId: target.questionId,
        text: target.text,
        canonicalText: resolveQuestionAudioText(question) ?? '',
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: answersRef.current[question.id] ?? null,
        explanation: question.explanation,
      });
    }
    speakQuestion(target.text, getQuestionAudioLang(question));
    logQuestionAudioTarget(target);
    setLastQuestionSpoken(target.text);
  }, [questions, speakQuestion]);

  const commitAnswers = useCallback((next: Record<string, string>) => {
    answersRef.current = next;
    setAnswers(next);
  }, []);

  const commitMatching = useCallback((next: MatchingState) => {
    matchingRef.current = next;
    setMatching(next);
  }, []);

  /** Accumulates real elapsed time for the question currently on screen. */
  const bankCurrentQuestionTime = useCallback(() => {
    const question = questions[currentIndexRef.current];
    if (!question) return;
    const now = Date.now();
    const delta = Math.max(0, now - questionStartRef.current);
    elapsedRef.current[question.id] = (elapsedRef.current[question.id] ?? 0) + delta;
    questionStartRef.current = now;
  }, [questions]);

  const submitRef = useRef<(autoTimedOut: boolean) => void>(() => {});

  const submitExam = useCallback(
    (autoTimedOut: boolean) => {
      // One-shot guard: the first call wins, every later call is a no-op.
      if (submittedRef.current) return;
      submittedRef.current = true;

      bankCurrentQuestionTime();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const now = Date.now();
      const timeUsedSeconds = Math.min(
        blueprint.durationSeconds,
        Math.max(1, Math.round((now - startedAtRef.current) / 1000))
      );

      const responses: QuestionResponse[] = questions.map((question) => {
        const userAnswer = answersRef.current[question.id] ?? null;
        return {
          questionId: question.id,
          userAnswer,
          isCorrect: CompetitionEngine.gradeAnswer(question, userAnswer),
          // Real measurement. Only genuinely untouched questions fall back to
          // the remaining exam time, never a fabricated per-question average.
          timeSpentSeconds: Math.max(
            0,
            Math.round((elapsedRef.current[question.id] ?? 0) / 1000)
          ),
        };
      });

      const history = StorageService.getCompetitionHistory().examResults;
      const scored = CompetitionEngine.scoreSession(
        blueprint,
        questions,
        responses,
        timeUsedSeconds,
        history
      );

      StorageService.recordCompetitionResult(scored, blueprint.rewardXp, blueprint.rewardStars);

      if (autoTimedOut) {
        sound.speak('Đã hết giờ làm bài! Cùng xem kết quả nhé.');
      }
      onFinish(scored);
    },
    [answersRef, bankCurrentQuestionTime, blueprint, questions, onFinish]
  );

  submitRef.current = submitExam;

  // --- Session lifecycle ---------------------------------------------------
  useEffect(() => {
    if (!isOpen || questions.length === 0) return;

    const now = Date.now();
    submittedRef.current = false;
    startedAtRef.current = now;
    deadlineRef.current = now + blueprint.durationSeconds * 1000;
    questionStartRef.current = now;
    elapsedRef.current = {};
    answersRef.current = {};
    matchingRef.current = {};
    currentIndexRef.current = 0;

    setAnswers({});
    setMatching({});
    setDragItem(null);
    setCurrentIndex(0);
    setSecondsRemaining(blueprint.durationSeconds);
    setShowSubmitConfirm(false);
    setShowExitConfirm(false);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        submitRef.current(true);
      }
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, blueprint, questions]);

  const handleSelectOption = (option: string) => {
    sound.playClick();
    const question = questions[currentIndex];
    if (!question) return;
    commitAnswers({ ...answersRef.current, [question.id]: option });
  };

  /** Ordering: tap tiles in the desired sequence, tap again to remove. */
  const handleToggleOrder = (token: string) => {
    sound.playClick();
    const question = questions[currentIndex];
    if (!question) return;
    const current = (answersRef.current[question.id] ?? '').split('|').filter(Boolean);
    const index = current.indexOf(token);
    if (index >= 0) current.splice(index, 1);
    else current.push(token);
    commitAnswers({ ...answersRef.current, [question.id]: current.join('|') });
  };

  /** Matching: pick a left item, then a right item. */
  const handleMatch = (side: 'left' | 'right', value: string) => {
    sound.playClick();
    const question = questions[currentIndex];
    if (!question) return;
    const state = { ...matchingRef.current };
    const key = `${question.id}::${value}`;
    if (side === 'left') {
      // Selecting a left item clears any previous choice for that left item.
      for (const k of Object.keys(state)) {
        if (k.startsWith(`${question.id}::`) && state[k] === `L:${value}`) delete state[k];
      }
      state[key] = `L:${value}`;
    } else {
      const leftKey = Object.keys(state).find(
        (k) => k.startsWith(`${question.id}::`) && state[k] === `R:${value}`
      );
      if (leftKey) {
        // Complete the pair: store it on the left item.
        const leftValue = leftKey.split('::')[1];
        delete state[leftKey];
        state[`${question.id}::${leftValue}`] = `${leftValue}=${value}`;
      } else {
        state[key] = `R:${value}`;
      }
    }
    commitMatching(state);

    // Canonicalise into the answer string as soon as every left item is paired.
    const pairs = question.matchingPairs ?? [];
    const complete = pairs.every((p) => {
      const stored = state[`${question.id}::${p.left}`];
      return typeof stored === 'string' && stored.includes('=');
    });
    if (complete) {
      const canonical = pairs
        .map((p) => `${p.left}=${state[`${question.id}::${p.left}`]}`)
        .join('|');
      commitAnswers({ ...answersRef.current, [question.id]: canonical });
    } else {
      const partial = Object.entries(state)
        .filter(([k, v]) => k.startsWith(`${question.id}::`) && v.includes('='))
        .map(([, v]) => v)
        .join('|');
      commitAnswers({ ...answersRef.current, [question.id]: partial });
    }
  };

  /** drag-and-drop: pick an item, then drop it into a bucket. */
  const handleDragItem = (item: string) => {
    sound.playClick();
    setDragItem(item);
  };

  const handleDropInto = (bucket: string) => {
    const question = questions[currentIndex];
    if (!question || !dragItem) return;
    sound.playClick();
    // Canonical answer for classify / drag-drop is the bucket label.
    commitAnswers({ ...answersRef.current, [question.id]: bucket });
    setDragItem(null);
  };

  const handleNavigate = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= questions.length) return;
    bankCurrentQuestionTime();
    currentIndexRef.current = newIndex;
    setDragItem(null);
    setLastQuestionSpoken(null);
    setCurrentIndex(newIndex);
  };

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const unansweredCount = questions.length - answeredCount;
  const currentSection = blueprint.sections?.find((s) =>
    s.skillIds.includes(currentQ.skillId)
  );

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLowTime = secondsRemaining <= 60;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={blueprint.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-slate-950/85 backdrop-blur-md select-none animate-pop"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-4xl h-[95vh] md:h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-slate-300"
      >
        {/* Top bar */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl md:text-2xl">{blueprint.badgeEmoji}</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                {currentSection?.title ??
                  (blueprint.subject === 'tieng-viet'
                    ? 'Tiếng Việt'
                    : blueprint.subject === 'toan'
                    ? 'Toán Học'
                    : 'Tiếng Anh')}
              </span>
              <h3 className="text-sm md:text-base font-black text-white truncate max-w-[220px] md:max-w-md">
                {blueprint.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!kidMode && (
              <div
                role="timer"
                aria-live={isLowTime ? 'assertive' : 'off'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-black text-sm md:text-base border transition-all ${
                  isLowTime
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-slate-800 text-amber-300 border-slate-700'
                }`}
              >
                <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-400' : 'text-amber-300'}`} />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}
            <button
              onClick={() => setShowExitConfirm(true)}
              aria-label="Thoát bài thi"
              className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress pills */}
        <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-200/80 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-bold text-amber-900 shrink-0">
            Câu {currentIndex + 1}/{questions.length}
          </span>
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => handleNavigate(idx)}
                  aria-label={`Đến câu ${idx + 1}${isAnswered ? ' (đã trả lời)' : ''}`}
                  className={`min-w-[36px] h-9 px-1 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500 text-white ring-2 ring-amber-400 ring-offset-1 scale-105'
                      : isAnswered
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="text-xs font-bold text-slate-500 shrink-0 hidden sm:block">
            Đã làm: {answeredCount}/{questions.length}
          </div>
        </div>

        {/* Question viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-center max-w-3xl mx-auto w-full">
          <div className="space-y-6">
            <div className="p-6 md:p-8 bg-amber-50/50 border-2 border-amber-200 rounded-3xl shadow-sm text-center space-y-3">
              {currentQ.mediaEmoji && (
                <div className="text-5xl md:text-6xl">{currentQ.mediaEmoji}</div>
              )}
              <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-white border border-amber-300 text-amber-800 rounded-full px-3 py-1">
                {QUESTION_TYPE_LABELS[currentQ.questionType]}
              </span>
              <h2 className="text-lg md:text-2xl font-black text-slate-800 font-display leading-relaxed">
                {currentQ.prompt}
              </h2>
              <div className="flex items-center justify-center">
                <button
                  onClick={playQuestionAudio}
                  data-testid="question-audio"
                  data-action="READ_QUESTION"
                  data-audio-state={questionAudioState}
                  data-question-id={currentQ.id}
                  data-last-spoken={lastQuestionSpoken ?? undefined}
                  title="Đọc câu hỏi"
                  aria-label={
                    questionAudioState === 'playing'
                      ? 'Đang đọc câu hỏi'
                      : questionAudioState === 'unavailable'
                        ? 'Thiết bị không đọc được, ba mẹ đọc cùng bé nhé'
                        : 'Đọc câu hỏi'
                  }
                  className="min-h-[44px] min-w-[44px] px-4 rounded-2xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs flex items-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4" />
                  Đọc câu hỏi
                </button>
              </div>
              {currentSection?.instruction && (
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  {currentSection.instruction}
                </p>
              )}
              {shortfall > 0 && (
                <p className="text-xs text-amber-800 bg-amber-100 border border-amber-300 rounded-xl px-3 py-2">
                  ⚠️ Ngân hàng câu hỏi hiện có {questions.length} câu cho dạng bài này (thấp hơn
                  {` ${shortfall} `} câu so với cấu hình). Đề vẫn chơi được và điểm được tính trên số
                  câu thực tế.
                </p>
              )}
            </div>

            <QuestionInput
              question={currentQ}
              value={answers[currentQ.id] ?? ''}
              matching={matching}
              dragItem={dragItem}
              onSelect={handleSelectOption}
              onToggleOrder={handleToggleOrder}
              onMatch={handleMatch}
              onDragItem={handleDragItem}
              onDropInto={handleDropInto}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 gap-2">
          <button
            onClick={() => handleNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className={`min-h-[48px] flex items-center gap-1.5 px-4 rounded-2xl font-bold text-xs md:text-sm border transition-all ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 cursor-pointer active:scale-95'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Câu trước</span>
          </button>

          <div className="flex items-center gap-2">
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => handleNavigate(currentIndex + 1)}
                className="min-h-[48px] flex items-center gap-1.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs md:text-sm active:scale-95 cursor-pointer"
              >
                <span>Câu tiếp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submittedRef.current}
              className="min-h-[48px] flex items-center gap-1.5 px-5 md:px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs md:text-sm active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Nộp Bài</span>
            </button>
          </div>
        </div>

        {/* Submit confirm */}
        {showSubmitConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-pop">
            <div
              role="alertdialog"
              aria-modal="true"
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-slate-200 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-3xl">
                📝
              </div>
              <h4 className="text-lg font-black text-slate-800">Bé đã sẵn sàng nộp bài chưa?</h4>
              {unansweredCount > 0 ? (
                <p className="text-xs md:text-sm text-rose-700 font-bold bg-rose-50 p-3 rounded-2xl border border-rose-200">
                  ⚠️ Bé còn {unansweredCount} câu chưa chọn đáp án! Bé có muốn quay lại kiểm tra không?
                </p>
              ) : (
                <p className="text-xs md:text-sm text-emerald-700 font-bold bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  ✨ Bé đã hoàn thành trả lời đủ {questions.length} câu hỏi!
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 min-h-[48px] bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Kiểm tra tiếp
                </button>
                <button
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    submitRef.current(false);
                  }}
                  className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md cursor-pointer"
                >
                  Xác nhận Nộp Bài
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exit confirm */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-pop">
            <div
              role="alertdialog"
              aria-modal="true"
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-slate-200 text-center space-y-3"
            >
              <h4 className="text-base font-black text-slate-800">Rời khỏi bài thi?</h4>
              <p className="text-xs text-slate-500 font-medium">
                Kết quả bài thi này sẽ không được lưu nếu bé dừng lại giữa chừng.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Làm tiếp
                </button>
                <button
                  onClick={() => {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    submittedRef.current = true;
                    onClose();
                  }}
                  className="flex-1 min-h-[48px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Thoát ra
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================================
// Per-format input renderer (presentation only)
// ==========================================================

const QuestionInput: React.FC<{
  question: CompetitionQuestion;
  value: string;
  matching: MatchingState;
  dragItem: string | null;
  onSelect: (option: string) => void;
  onToggleOrder: (token: string) => void;
  onMatch: (side: 'left' | 'right', value: string) => void;
  onDragItem: (item: string) => void;
  onDropInto: (bucket: string) => void;
}> = ({
  question,
  value,
  matching,
  dragItem: committedItem,
  onSelect,
  onToggleOrder,
  onMatch,
  onDragItem,
  onDropInto,
}) => {
  if (question.questionType === 'ordering') {
    const chosen = value.split('|').filter(Boolean);
    const tiles = question.orderingItems ?? question.options;
    return (
      <div className="space-y-4">
        <div className="min-h-[64px] p-3 bg-slate-50 border-2 border-dashed border-amber-300 rounded-2xl flex flex-wrap items-center justify-center gap-2">
          {chosen.length === 0 ? (
            <span className="text-xs text-slate-400 font-semibold">
              Chạm vào các ô bên dưới theo thứ tự đúng...
            </span>
          ) : (
            chosen.map((word, i) => (
              <button
                key={`${word}-${i}`}
                onClick={() => onToggleOrder(word)}
                className="min-h-[48px] px-4 py-2 bg-amber-400 text-amber-950 font-black rounded-xl shadow-sm text-base"
              >
                {i + 1}. {word}
              </button>
            ))
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tiles.map((word) => {
            const used = chosen.includes(word);
            return (
              <button
                key={word}
                data-testid="answer-option"
                onClick={() => onToggleOrder(word)}
                disabled={used}
                className={`min-h-[48px] px-4 py-2.5 rounded-xl font-black text-base border-2 transition-all ${
                  used
                    ? 'opacity-30 border-slate-200 bg-slate-100 cursor-not-allowed'
                    : 'bg-white hover:bg-amber-50 border-amber-300 shadow-sm active:scale-95 cursor-pointer'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.questionType === 'matching') {
    const pairs = question.matchingPairs ?? [];
    const rightOptions = [...question.options];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Chọn ô bên trái
          </p>
          {pairs.map((p) => {
            const stored = matching[`${question.id}::${p.left}`];
            const paired = typeof stored === 'string' && stored.includes('=');
            return (
              <button
                key={p.left}
                data-testid="match-left"
                onClick={() => onMatch('left', p.left)}
                aria-pressed={paired || stored === `L:${p.left}`}
                className={`w-full min-h-[56px] px-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-between gap-2 active:scale-[0.99] ${
                  paired
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : stored === `L:${p.left}`
                    ? 'bg-amber-100 border-amber-500 text-amber-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                }`}
              >
                <span>{p.left}</span>
                {paired && <span className="text-xs font-black">{stored.split('=')[1]}</span>}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Chọn ô bên phải
          </p>
          {rightOptions.map((opt) => {
            const isSelected = Object.values(matching).includes(`R:${opt}`);
            const isPaired = Object.values(matching).includes(`=${opt}`);
            return (
              <button
                key={opt}
                data-testid="match-right"
                onClick={() => onMatch('right', opt)}
                aria-pressed={isSelected || isPaired}
                className={`w-full min-h-[56px] px-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center active:scale-[0.99] ${
                  isPaired
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : isSelected
                    ? 'bg-amber-100 border-amber-500 text-amber-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.questionType === 'drag-drop' || question.questionType === 'classify') {
    const buckets = question.categoryBuckets ?? [];
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500 text-center font-semibold">
          Chạm một từ, rồi chạm vào nhóm đúng để thả từ đó vào.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {question.options.map((item) => {
            const isUsed = committedItem === item;
            return (
              <button
                key={item}
                data-testid="drag-item"
                onClick={() => onDragItem(item)}
                aria-pressed={isUsed}
                className={`min-h-[52px] px-4 py-2.5 rounded-xl font-black text-sm border-2 transition-all ${
                  isUsed
                    ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-amber-300 hover:bg-amber-50 active:scale-95 cursor-pointer'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {buckets.map((bucket) => (
            <button
              key={bucket}
              data-testid="drop-bucket"
              onClick={() => onDropInto(bucket)}
              disabled={!committedItem}
              className={`min-h-[96px] rounded-2xl border-2 border-dashed p-3 flex flex-col items-center justify-center gap-1 transition-all ${
                committedItem
                  ? 'border-emerald-400 bg-emerald-50/70 cursor-pointer hover:bg-emerald-100 active:scale-[0.99]'
                  : 'border-slate-300 bg-slate-50 cursor-not-allowed'
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                {bucket}
              </span>
              <span className="text-sm font-black text-emerald-950">{committedItem ?? '—'}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // multiple-choice | true-false | fill-blank
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      {question.options.map((option, optIdx) => {
        const isSelected = value === option;
        const letter = ['A', 'B', 'C', 'D', 'E', 'F'][optIdx] || '';
        return (
          <button
            key={optIdx}
            data-testid="answer-option"
            onClick={() => onSelect(option)}
            aria-pressed={isSelected}
            className={`min-h-[56px] p-4 rounded-2xl border-2 text-left font-bold text-sm md:text-base flex items-center gap-3 transition-all active:scale-[0.99] cursor-pointer ${
              isSelected
                ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-400/40'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {letter}
            </span>
            <span className="flex-1">{option}</span>
          </button>
        );
      })}
    </div>
  );
};
