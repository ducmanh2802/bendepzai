import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Question, SubjectType } from '../../types';
import { sound } from '../../services/sound';
import {
  resolvePraise,
  speakPraise,
  toPraiseSubject,
  type PraiseResult,
} from '../../services/praiseEngine';
import { fireCelebrationConfetti } from '../../services/confetti';
import { StorageService } from '../../services/storage';
import { checkAnswer } from '../../services/answerCheck';
import {
  applyMatchingTap,
  buildMatchingCanonical,
  isMatchingComplete,
} from '../../services/answerCheck';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useModalHistory } from '../../hooks/useModalHistory';
import { useSpeak } from '../../hooks/useSpeak';
import {
  assertQuestionAudioTarget,
  buildQuestionAudioTarget,
  getQuestionAudioLang,
  logQuestionAudioTarget,
  resolveQuestionAudioText,
} from '../../services/questionAudio';
import {
  Volume2,
  X,
  Star,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  ChoiceQuestion,
  ImageChoiceQuestion,
  TrueFalseQuestion,
  MatchingQuestion,
  DragDropQuestion,
  FillBlankQuestion,
  OrderingQuestion,
  MathExpressionQuestion,
} from './questions';
import { QuestionVisualForQuestion } from '../visuals/QuestionVisual';

interface LessonPlayerModalProps {
  lesson: Lesson;
  onClose: () => void;
  onComplete?: () => void;
}

type MatchingState = Record<string, string>;

export const LessonPlayerModal: React.FC<LessonPlayerModalProps> = ({
  lesson,
  onClose,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null);
  const [orderedList, setOrderedList] = useState<string[]>([]);
  const [matchingState, setMatchingState] = useState<MatchingState>({});
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  // The result screen ("+N Sao") stays inside THIS dialog. The parent is told
  // the lesson is complete (onComplete → profile refresh → maybe the level-up
  // celebration) only when the child leaves the result screen, so the two
  // dialogs never stack (T20A / B-05) and the child always sees what they earned.
  const finishedRef = useRef(false);
  const completeNotifiedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const notifyComplete = () => {
    if (!finishedRef.current || completeNotifiedRef.current) return;
    completeNotifiedRef.current = true;
    onCompleteRef.current?.();
  };
  // Leaving by the back gesture / Esc after finishing still reports completion.
  useEffect(() => () => notifyComplete(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  const { requestClose } = useModalHistory(onClose);
  const { state: audioState, speak: speakQuestion } = useSpeak();
  const [lastSpoken, setLastSpoken] = useState<string | null>(null);
  const [praise, setPraise] = useState<PraiseResult | null>(null);
  const praiseAttemptRef = useRef(0);

  const question: Question = lesson.questions[currentIdx];
  const progressPercent = Math.round(((currentIdx + 1) / lesson.questions.length) * 100);
  const correctAnswerStr = Array.isArray(question.correctAnswer)
    ? question.correctAnswer.join('|')
    : question.correctAnswer;

  const playPromptAudio = () => {
    const target = buildQuestionAudioTarget(question);
    if (!target) return;
    if (import.meta.env.DEV) {
      assertQuestionAudioTarget({
        questionId: target.questionId,
        text: target.text,
        canonicalText: resolveQuestionAudioText(question) ?? '',
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: selectedAnswer,
        explanation: question.explanation,
        hint: question.hint,
      });
    }
    const lang = getQuestionAudioLang(question);
    logQuestionAudioTarget(target);
    setLastSpoken(target.text);
    speakQuestion(target.text, lang);
  };

  useEffect(() => {
    setSelectedAnswer(null);
    setLastSpoken(null);
    setPraise(null);
    setOrderedList([]);
    setMatchingState({});
    setDragItem(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setShowHint(false);

    if (!StorageService.getParentSettings().questionAutoplay) return;
    const timer = setTimeout(() => {
      playPromptAudio();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentIdx, question]);

  const handleSelectOption = (opt: string) => {
    if (isAnswerChecked) return;
    sound.playClick();
    setSelectedAnswer(opt);
  };

  const handleToggleOrderItem = (item: string) => {
    if (isAnswerChecked) return;
    sound.playClick();
    if (orderedList.includes(item)) {
      setOrderedList(orderedList.filter((i) => i !== item));
    } else {
      setOrderedList([...orderedList, item]);
    }
  };

  const handleMatch = (side: 'left' | 'right', value: string) => {
    if (isAnswerChecked) return;
    sound.playClick();
    // T14B — pure state machine in answerCheck (pairs can actually complete).
    const state = applyMatchingTap(matchingState, question.id, side, value);
    setMatchingState(state);

    const pairs = question.matchingPairs ?? [];
    setSelectedAnswer(buildMatchingCanonical(pairs, state, question.id));
  };

  const handleDragItem = (item: string) => {
    if (isAnswerChecked) return;
    sound.playClick();
    setDragItem(item);
  };

  const handleDropInto = (bucket: string) => {
    if (isAnswerChecked || !dragItem) return;
    sound.playClick();
    setSelectedAnswer(bucket);
    setDragItem(null);
  };

  const handleCheckAnswer = () => {
    if (isAnswerChecked) return;

    const userAnswer =
      question.type === 'ordering'
        ? orderedList
        : question.type === 'matching'
        ? selectedAnswer
        : question.type === 'drag-drop' || question.type === 'classify'
        ? selectedAnswer
        : selectedAnswer;

    const correct = checkAnswer(question, userAnswer);

    setIsAnswerChecked(true);
    setIsCorrect(correct);

    StorageService.recordQuestionAnswer(
      question.skillId,
      correct,
      question.id,
      question.prompt,
      question.subject
    );

    if (correct) {
      sound.playCorrect();
      setScore((s) => s + 1);
    } else {
      sound.playWrong();
    }

    praiseAttemptRef.current += 1;
    const resolved = resolvePraise({
      subject: toPraiseSubject(question.subject),
      outcome: correct ? 'CORRECT' : 'ENCOURAGEMENT',
      eventId: `${lesson.id}:${question.id}:attempt-${praiseAttemptRef.current}`,
    });
    setPraise(resolved);
    speakPraise(resolved);
  };

  const handleNextQuestion = () => {
    sound.playClick();
    if (currentIdx + 1 < lesson.questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Rewards are saved right away; the result screen shows them.
      setIsFinished(true);
      finishedRef.current = true;
      sound.playLevelUp();
      fireCelebrationConfetti();
      StorageService.completeLesson(lesson.id, lesson.subject, lesson.xpReward, lesson.starReward);
    }
  };

  const handleFinishAndClose = () => {
    sound.playClick();
    notifyComplete();
    onClose();
  };

  const handleRetryLesson = () => {
    sound.playClick();
    setCurrentIdx(0);
    setScore(0);
    setSelectedAnswer(null);
    setOrderedList([]);
    setMatchingState({});
    setDragItem(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setShowHint(false);
    setIsFinished(false);
  };

  const handleRetryCurrentQuestion = () => {
    sound.playClick();
    setSelectedAnswer(null);
    setOrderedList([]);
    setMatchingState({});
    setDragItem(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setShowHint(true);
    const retryPraise = resolvePraise({
      subject: toPraiseSubject(question.subject),
      outcome: 'ENCOURAGEMENT',
    });
    setPraise(retryPraise);
    speakPraise(retryPraise);
  };

  const renderQuestionInput = () => {
    const correctAnswerStr = Array.isArray(question.correctAnswer)
      ? question.correctAnswer.join('|')
      : question.correctAnswer;

    switch (question.type) {
      case 'ordering':
        return (
          <OrderingQuestion
            key={question.id}
            question={question}
            orderedList={orderedList}
            onToggleOrderItem={handleToggleOrderItem}
            isAnswerChecked={isAnswerChecked}
            isCorrect={isCorrect}
            correctAnswer={correctAnswerStr}
          />
        );
      case 'matching':
        return (
          <MatchingQuestion
            key={question.id}
            question={question}
            matchingState={matchingState}
            onMatch={handleMatch}
            isAnswerChecked={isAnswerChecked}
            isCorrect={isCorrect}
            correctAnswer={correctAnswerStr}
          />
        );
      case 'drag-drop':
      case 'classify':
        return (
          <DragDropQuestion
            key={question.id}
            question={question}
            dragItem={dragItem}
            onDragItem={handleDragItem}
            onDropInto={handleDropInto}
            isAnswerChecked={isAnswerChecked}
            isCorrect={isCorrect}
            correctAnswer={correctAnswerStr}
            selectedAnswer={selectedAnswer as string}
          />
        );
      case 'fill-blank':
        return (
          <FillBlankQuestion
            key={question.id}
            question={question}
            selectedAnswer={selectedAnswer as string}
            onSelect={handleSelectOption}
            isAnswerChecked={isAnswerChecked}
            isCorrect={isCorrect}
            correctAnswer={correctAnswerStr}
          />
        );
      case 'true-false':
        return (
          <TrueFalseQuestion
            key={question.id}
            question={question}
            selectedAnswer={selectedAnswer as string}
            onSelect={handleSelectOption}
            isAnswerChecked={isAnswerChecked}
            isCorrect={isCorrect}
            correctAnswer={correctAnswerStr}
          />
        );
      case 'math-expression':
        return (
          <MathExpressionQuestion
            key={question.id}
            question={question}
            selectedAnswer={selectedAnswer as string}
            onSelect={handleSelectOption}
            isAnswerChecked={isAnswerChecked}
            isCorrect={isCorrect}
            correctAnswer={correctAnswerStr}
          />
        );
      case 'image-choice':
        return (
          <ImageChoiceQuestion
            key={question.id}
            question={question}
            selectedAnswer={selectedAnswer as string}
            onSelect={handleSelectOption}
            isAnswerChecked={isAnswerChecked}
            isCorrect={isCorrect}
            correctAnswer={correctAnswerStr}
          />
        );
      case 'multiple-choice':
      case 'audio-choice':
      default:
        return (
          <ChoiceQuestion
            key={question.id}
            question={question}
            selectedAnswer={selectedAnswer as string}
            onSelect={handleSelectOption}
            isAnswerChecked={isAnswerChecked}
            isCorrect={isCorrect}
            correctAnswer={correctAnswerStr}
          />
        );
    }
  };

  const isSubmitDisabled = () => {
    if (isAnswerChecked) return false;
    switch (question.type) {
      case 'ordering':
        return orderedList.length === 0;
      case 'matching': {
        const pairs = question.matchingPairs ?? [];
        return pairs.length > 0 && !isMatchingComplete(pairs, matchingState, question.id);
      }
      case 'drag-drop':
      case 'classify':
        return !selectedAnswer;
      default:
        return !selectedAnswer;
    }
  };

  // Compute conditional content to avoid JSX parser issues with ternary operators
  const praiseContent = praise ? (
    <span
      data-testid="praise-caption"
      data-praise-text={praise.text}
      data-praise-tts={praise.ttsText}
      data-praise-locale={praise.locale}
      data-praise-language={praise.language}
      data-praise-outcome={praise.outcome}
      className="block text-sm md:text-base font-black mb-0.5"
    >
      {praise.characterEmoji} {praise.text}
    </span>
  ) : null;

  const feedbackContent = isCorrect
    ? question.explanation || 'Rất tuyệt vời! Bé đã trả lời chính xác!'
    : `Đáp án đúng là: ${correctAnswerStr}`;

  const bottomFeedback = isAnswerChecked ? (
    <div
      role="status"
      className={`p-3 rounded-2xl mb-3 flex items-center gap-3 animate-pop ${
        isCorrect
          ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
          : 'bg-rose-100 border border-rose-300 text-rose-900'
      }`}
    >
      {isCorrect ? (
        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
      ) : (
        <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
      )}
      <div className="text-xs md:text-sm font-bold flex-1">
        {praiseContent}
        {feedbackContent}
      </div>
    </div>
  ) : null;

  const submitButton = !isAnswerChecked ? (
    <button
      onClick={handleCheckAnswer}
      disabled={isSubmitDisabled()}
      className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white font-black text-base md:text-lg rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer font-display"
    >
      Kiểm tra câu trả lời ✨
    </button>
  ) : (
    <div className="flex items-center gap-3">
      {!isCorrect && (
        <button
          onClick={handleRetryCurrentQuestion}
          className="flex-1 py-3.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-sm md:text-base rounded-2xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-display"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Thử lại câu này 🔁</span>
        </button>
      )}
      <button
        onClick={handleNextQuestion}
        className={`${
          !isCorrect ? 'flex-1' : 'w-full'
        } py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base md:text-lg rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-display`}
      >
        <span>
          {currentIdx + 1 < lesson.questions.length ? 'Câu tiếp theo' : 'Xem kết quả bài học'}
        </span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/70 backdrop-blur-sm animate-pop select-none">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={lesson.title}
        tabIndex={-1}
        className="relative w-full max-w-2xl h-[92vh] max-h-[720px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-amber-300"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {lesson.subject === 'tieng-viet' ? '🐻' : lesson.subject === 'toan' ? '🦊' : '🐰'}
            </span>
            <div>
              {/* T20A / B-10 — 220px of title + score pill + close button did
                  not fit a 360px phone (25px of sideways scroll). */}
              <h3 className="text-sm md:text-base font-black text-amber-900 truncate max-w-[38vw] md:max-w-xs font-display">
                {lesson.title}
              </h3>
              <p className="text-[11px] text-amber-700 font-bold">
                Câu hỏi {currentIdx + 1} / {lesson.questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-amber-200/80 rounded-full text-xs font-black text-amber-900">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>{score} đúng</span>
            </div>
            <button
              onClick={() => {
                notifyComplete();
                requestClose();
              }}
              aria-label="Đóng bài học"
              title="Đóng bài học (Esc)"
              data-testid="lesson-close"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all active:scale-95"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-amber-100 h-2">
          <div
            className="bg-amber-500 h-full transition-all duration-300 rounded-r-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Area */}
        {!isFinished ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Prompt Card */}
            <div className="bg-amber-50/70 p-4 md:p-5 rounded-2xl border-2 border-amber-200 flex flex-col items-center text-center">
              {question.mediaEmoji && (
                <div className="text-5xl md:text-6xl mb-3 animate-pulse-subtle">
                  {question.mediaEmoji}
                </div>
              )}

              {/* T11C/T11B — hình trực quan (TenFrame/NumberLine/PlaceValueBlocks/Ruler/ClockFace). Single render via dispatcher (avoids double SVG); QuestionVisualForQuestion delegates to QuestionVisual. */}
              <QuestionVisualForQuestion question={question} />

              <div className="flex items-center justify-center gap-2 mb-1">
                <h4 className="text-lg md:text-xl font-black text-slate-800 font-display">
                  {question.prompt}
                </h4>
                <button
                  onClick={playPromptAudio}
                  data-testid="question-audio"
                  data-action="READ_QUESTION"
                  data-audio-state={audioState}
                  data-question-id={question.id}
                  data-last-spoken={lastSpoken ?? undefined}
                  className="p-2 min-w-[44px] min-h-[44px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full active:scale-95 shrink-0 flex items-center justify-center"
                  title="Đọc câu hỏi"
                  aria-label={
                    audioState === 'playing'
                      ? 'Đang đọc câu hỏi'
                      : audioState === 'played'
                      ? 'Đã đọc xong, chạm để nghe lại'
                      : audioState === 'unavailable'
                      ? 'Thiết bị không đọc được, hãy đọc cùng ba mẹ nhé'
                      : 'Đọc câu hỏi'
                  }
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Hint toggler */}
              {question.hint && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowHint(!showHint);
                    }}
                    className="min-h-[44px] px-4 text-xs text-amber-800 hover:text-amber-900 flex items-center gap-1 font-bold bg-amber-100/80 py-1 rounded-full"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Ẩn gợi ý' : 'Bé cần gợi ý?'}</span>
                  </button>
                  {showHint && (
                    <p className="text-xs text-amber-900 mt-1 bg-amber-200/60 px-3 py-1.5 rounded-xl font-medium animate-pop">
                      💡 {question.hint}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="my-4" data-testid="question-input">
              {renderQuestionInput()}
            </div>

            {/* Bottom Feedback (trong vùng cuộn) */}
            <div>
              {bottomFeedback}
            </div>

            {/*
              T01B/2 — thanh hành động DÍNH ĐÁY modal: nút "Kiểm tra"/"Câu tiếp
              theo" luôn thấy ở 375×667, không phải cuộn. Nằm ngoài vùng cuộn.
            */}
            <div className="shrink-0 border-t-2 border-amber-200 bg-white/95 backdrop-blur px-4 md:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {submitButton}
            </div>
          </div>
        </div>
        ) : (
          // Completion Result Screen — kept INSIDE this dialog (one dialog at a
          // time); onComplete fires when the child leaves it (handleFinishAndClose).
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4 md:p-6 text-center animate-pop">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Star className="w-12 h-12 fill-amber-400 text-amber-500" aria-hidden="true" />
            </div>

            <h3 className="text-2xl md:text-3xl font-black text-amber-950 font-display mb-1">
              CHÚC MỪNG BÉ HOÀN THÀNH!
            </h3>
            <p className="text-slate-600 text-sm md:text-base font-semibold mb-6">
              Bé đã làm đúng <span className="text-amber-600 font-black">{score}</span> /{' '}
              {lesson.questions.length} câu hỏi của bài học:
              <br />
              <span className="text-slate-900 font-bold [overflow-wrap:anywhere]">{lesson.title}</span>
            </p>

            {/* Earned Rewards — wraps on a 360px phone */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-3 px-4 bg-amber-50 rounded-2xl border-2 border-amber-200 mb-6 max-w-full">
              <div className="flex items-center gap-2 text-amber-700 font-black text-base">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" aria-hidden="true" />
                <span>+{lesson.starReward} Sao</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700 font-black text-base">
                <Sparkles className="w-6 h-6 text-purple-500" aria-hidden="true" />
                <span>+{lesson.xpReward} XP</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-700 font-black text-base">
                <span aria-hidden="true">🎟️</span>
                <span>+1 Vé Chơi</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full max-w-sm">
              <button
                onClick={handleRetryLesson}
                className="flex-1 min-h-[48px] py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 text-sm"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Học lại</span>
              </button>
              <button
                onClick={handleFinishAndClose}
                autoFocus
                className="flex-1 min-h-[48px] py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-lg transition-transform active:scale-95 text-sm"
              >
                <span>Về bản đồ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};