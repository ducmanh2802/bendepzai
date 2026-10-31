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
import { formatElapsed, lessonRatingLabel, lessonStarRating } from './lessonEngagement';
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

// T29 — đồng hồ đếm trong component riêng: mỗi giây chỉ ô giờ cập nhật thay vì
// re-render cả đề bài, đáp án và phản hồi (bản cũ đặt interval ở modal).
const LessonClock: React.FC<{ startedAt: number | null; paused: boolean }> = ({
  startedAt,
  paused,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (paused || startedAt === null) return;
    const tick = () => setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, paused]);

  return <span data-testid="lesson-timer">{formatElapsed(seconds)}</span>;
};

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
  const [difficultyMode, setDifficultyMode] = useState<'standard' | 'challenge'>('standard');
  // T27 — combo, đồng hồ, danh sách câu sai và chế độ ôn lại câu sai.
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  // Thời lượng chốt lại khi bé vào màn kết quả; đồng hồ tự đếm ở LessonClock.
  const [elapsedSec, setElapsedSec] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(() => Date.now());
  const [missed, setMissed] = useState<{ id: string; prompt: string; answer: string }[]>([]);
  const [reviewIds, setReviewIds] = useState<string[] | null>(null);
  const resultScrollRef = useRef<HTMLDivElement | null>(null);
  const questionScrollRef = useRef<HTMLDivElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const activeQuestions = React.useMemo(() => {
    const base = (() => {
      if (difficultyMode === 'challenge') {
        const hardOnly = lesson.questions.filter((q) => q.difficulty >= 2);
        if (hardOnly.length >= 3) {
          return hardOnly;
        }
        return [...lesson.questions].sort((a, b) => b.difficulty - a.difficulty);
      }
      return lesson.questions;
    })();
    if (!reviewIds) return base;
    const reviewSet = new Set(reviewIds);
    const onlyMissed = base.filter((q) => reviewSet.has(q.id));
    return onlyMissed.length > 0 ? onlyMissed : base;
  }, [lesson.questions, difficultyMode, reviewIds]);

  const question: Question = activeQuestions[currentIdx] || activeQuestions[0];
  const progressPercent = Math.round(((currentIdx + 1) / activeQuestions.length) * 100);
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
    // T29 — câu mới phải bắt đầu từ đầu. Giữ scrollTop của câu trước thì đề mới
    // mở ra đã bị cắt mất phần trên (qa/lesson-smooth.mjs đo được).
    if (questionScrollRef.current) questionScrollRef.current.scrollTop = 0;

    if (!StorageService.getParentSettings().questionAutoplay) return;
    const timer = setTimeout(() => {
      playPromptAudio();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentIdx, question]);

  // T29 — phản hồi đúng/sai nằm cuối vùng cuộn; đưa vào tầm nhìn ngay sau khi
  // chấm để bé thấy lời khen/đáp án mà không phải tự kéo xuống.
  useEffect(() => {
    if (!isAnswerChecked) return;
    feedbackRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [isAnswerChecked]);

  // Màn kết quả: đưa tiêu điểm vào khung cuộn và về đầu trang, để bé luôn thấy
  // hàng sao trước. Không dùng autoFocus cho nút "Về bản đồ" vì trình duyệt sẽ
  // tự cuộn xuống đáy khi danh sách câu sai dài (T27).
  useEffect(() => {
    if (!isFinished) return;
    const el = resultScrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    el.focus({ preventScroll: true });
  }, [isFinished]);

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
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((best) => Math.max(best, nextCombo));
      // Chuỗi từ 2 câu đúng đổi sang tiếng "đi lên" cho bé thấy đà thắng.
      if (nextCombo >= 2) sound.playCombo();
      else sound.playCorrect();
      // Mốc 3 và 5 câu đúng liên tiếp: tung pháo giấy ăn mừng.
      if (nextCombo === 3 || nextCombo === 5) fireCelebrationConfetti();
      setScore((s) => s + 1);
      setMissed((list) => list.filter((m) => m.id !== question.id));
    } else {
      setCombo(0);
      sound.playWrong();
      setMissed((list) =>
        list.some((m) => m.id === question.id)
          ? list
          : [...list, { id: question.id, prompt: question.prompt, answer: correctAnswerStr }]
      );
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
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Rewards are saved right away; the result screen shows them.
      setElapsedSec(startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000));
      setIsFinished(true);
      finishedRef.current = true;
      sound.playLevelUp();
      fireCelebrationConfetti();
      const earnedXp = difficultyMode === 'challenge' ? Math.round(lesson.xpReward * 1.5) : lesson.xpReward;
      StorageService.completeLesson(lesson.id, lesson.subject, earnedXp, lesson.starReward);
    }
  };

  const handleFinishAndClose = () => {
    sound.playClick();
    notifyComplete();
    onClose();
  };

  // Bắt đầu một lượt mới (đổi độ khó, học lại, ôn câu sai): xoá sạch trạng thái
  // của lượt trước. Nếu chỉ reset điểm như trước, bấm đổi độ khó ở màn kết quả
  // sẽ để bé kẹt ở màn kết quả với "0 / N" và 1 sao (T27).
  const startRun = (mode: 'standard' | 'challenge', review: string[] | null = null) => {
    setDifficultyMode(mode);
    setReviewIds(review);
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
    setCombo(0);
    setBestCombo(0);
    setMissed([]);
    setElapsedSec(0);
    setStartedAt(Date.now());
    if (questionScrollRef.current) questionScrollRef.current.scrollTop = 0;
  };

  const handleRetryLesson = () => {
    sound.playClick();
    startRun(difficultyMode);
  };

  const handleReviewMissed = () => {
    sound.playClick();
    if (missed.length === 0) return;
    startRun(difficultyMode, missed.map((m) => m.id));
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
    // Gợi ý nằm dưới đề bài; đưa bé về đầu câu để đọc gợi ý.
    questionScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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

  const starRating = lessonStarRating(score, activeQuestions.length);

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
          {currentIdx + 1 < activeQuestions.length ? 'Câu tiếp theo' : 'Xem kết quả bài học'}
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
        {/* Top Header — 2 hàng ở điện thoại: hàng 1 là tên bài + đồng hồ + nút
            đóng, hàng 2 là chế độ + số câu đúng. Xếp hết vào một hàng thì nút
            đóng bị đẩy ra ngoài khung ở màn 390px (T27 đo được). */}
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0">
                {lesson.subject === 'tieng-viet' ? '🐻' : lesson.subject === 'toan' ? '🦊' : '🐰'}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-black text-amber-900 truncate max-w-[46vw] md:max-w-xs font-display">
                  {lesson.title}
                </h3>
                <p className="text-[11px] text-amber-700 font-bold">
                  Câu hỏi {currentIdx + 1} / {activeQuestions.length} · ⏱{' '}
                  <LessonClock startedAt={startedAt} paused={isFinished} />
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                notifyComplete();
                requestClose();
              }}
              aria-label="Đóng bài học"
              title="Đóng bài học (Esc)"
              data-testid="lesson-close"
              className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all active:scale-95"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            {/* Difficulty Toggle Pill */}
            <div className="flex items-center bg-amber-200/70 p-0.5 rounded-full border border-amber-300 text-[11px] font-black">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  startRun('standard');
                }}
                title="Chế độ học bình thường"
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  difficultyMode === 'standard'
                    ? 'bg-white text-amber-950 shadow-2xs font-extrabold'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                Chuẩn
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  startRun('challenge');
                }}
                title="Chế độ Thử thách Nâng cao: Đề khó hơn và tặng thêm +50% XP"
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-0.5 ${
                  difficultyMode === 'challenge'
                    ? 'bg-rose-500 text-white shadow-2xs font-extrabold'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <span>Nâng cao</span>
                <span className="text-[10px]">🔥</span>
              </button>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-200/80 rounded-full text-[11px] font-black text-amber-900">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>{score} đúng</span>
            </div>
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
          {/* T29 — ô combo cao cố định: hiện/ẩn dải không đẩy đề bài xuống
              (trước đây dải chèn thêm một hàng làm cả câu hỏi nhảy ~24px). */}
          <div
            data-testid="lesson-combo-slot"
            className={`h-6 shrink-0 overflow-hidden flex items-center justify-center ${
              combo >= 2 ? 'bg-orange-100 border-b border-orange-200' : ''
            }`}
          >
            {combo >= 2 && (
              <div
                data-testid="lesson-combo"
                data-combo={combo}
                className="flex items-center justify-center gap-1.5 text-xs font-black text-orange-800 animate-pop"
              >
                <span>🔥 Chuỗi {combo} câu đúng liên tiếp!</span>
                {combo >= 3 && <span>Bé siêu quá!</span>}
              </div>
            )}
          </div>
          <div ref={questionScrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* T27 — bé đang ôn lại đúng những câu đã làm sai */}
            {reviewIds && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs font-black text-sky-800">
                📚 Đang ôn lại {activeQuestions.length} câu chưa đúng — bé làm chậm thôi nhé!
              </div>
            )}

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
            <div ref={feedbackRef}>
              {bottomFeedback}
            </div>
          </div>

          {/*
            T29 — thanh hành động DÍNH ĐÁY modal, thực sự NẰM NGOÀI vùng cuộn.
            Bản trước đặt khối này bên trong `overflow-y-auto` dù chú thích nói
            ngược lại, nên nút "Kiểm tra" bị cuộn mất ở máy nhỏ.
          */}
          <div className="shrink-0 border-t-2 border-amber-200 bg-white/95 backdrop-blur px-4 md:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {submitButton}
          </div>
        </div>
        ) : (
          // Completion Result Screen — kept INSIDE this dialog (one dialog at a
          // time); onComplete fires when the child leaves it (handleFinishAndClose).
          <div
            ref={resultScrollRef}
            tabIndex={-1}
            className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6 text-center animate-pop focus:outline-none"
          >
            {/* my-auto: nội dung ngắn thì căn giữa, nội dung dài (danh sách câu
                sai) thì bắt đầu từ trên và cuộn được — justify-center sẽ cắt
                mất hàng sao ở đầu màn hình (T27). */}
            <div className="my-auto w-full flex flex-col items-center">
            <div
              className="flex items-center justify-center gap-1.5 mb-2"
              data-testid="lesson-stars"
              data-stars={starRating}
              role="img"
              aria-label={`${starRating} trên 3 sao`}
            >
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  className={
                    i <= starRating
                      ? 'w-11 h-11 md:w-12 md:h-12 fill-amber-400 text-amber-500 animate-pop'
                      : 'w-11 h-11 md:w-12 md:h-12 text-slate-300'
                  }
                  aria-hidden="true"
                />
              ))}
            </div>
            <p data-testid="lesson-rating-label" className="text-amber-700 font-black text-sm md:text-base mb-2">
              {lessonRatingLabel(starRating)}
            </p>

            <h3 className="text-2xl md:text-3xl font-black text-amber-950 font-display mb-1">
              CHÚC MỪNG BÉ HOÀN THÀNH!
            </h3>
            <p className="text-slate-600 text-sm md:text-base font-semibold mb-6">
              Bé đã làm đúng <span className="text-amber-600 font-black">{score}</span> /{' '}
              {activeQuestions.length} {reviewIds ? 'câu ôn tập' : 'câu hỏi của bài học'}:
              <br />
              <span className="text-slate-900 font-bold [overflow-wrap:anywhere]">{lesson.title}</span>
              {difficultyMode === 'challenge' && !reviewIds && (
                <span className="block mt-1 text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 py-1 px-3 rounded-full inline-block">
                  🔥 Thử Thách Nâng Cao Đã Chinh Phục!
                </span>
              )}
            </p>

            {/* T27 — đồng hồ, chuỗi dài nhất, số câu đúng */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-[11px] md:text-xs font-black">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                ⏱ {formatElapsed(elapsedSec)}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800">
                🔥 Chuỗi dài nhất {bestCombo}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800">
                🎯 Đúng {score}/{activeQuestions.length}
              </span>
            </div>

            {/* T27 — các câu cần ôn lại */}
            {missed.length > 0 && (
              <div className="w-full max-w-md text-left mb-4" data-testid="lesson-missed-list">
                <h4 className="font-black text-slate-800 text-sm mb-2">
                  Ôn lại {missed.length} câu chưa đúng 📚
                </h4>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {missed.map((m) => (
                    <li key={m.id} className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                      <p className="text-xs font-bold text-slate-800 [overflow-wrap:anywhere]">{m.prompt}</p>
                      <p className="text-[11px] font-black text-emerald-700 [overflow-wrap:anywhere]">
                        Đáp án đúng: {m.answer}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {missed.length > 0 && (
              <button
                onClick={handleReviewMissed}
                data-testid="lesson-review-missed"
                className="w-full max-w-sm min-h-[48px] mb-3 py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-black rounded-2xl shadow-lg transition-transform active:scale-95 text-sm"
              >
                Ôn lại {missed.length} câu chưa đúng 🔁
              </button>
            )}

            {/* Earned Rewards — wraps on a 360px phone. Lượt ôn chỉ được 5 XP
                luyện lại (StorageService.completeLesson), không cấp lại Sao/Vé. */}
            {reviewIds ? (
              <div
                data-testid="lesson-review-reward"
                className="flex flex-col items-center gap-1 py-3 px-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200 mb-6 max-w-full"
              >
                <div className="flex items-center gap-2 text-emerald-700 font-black text-base">
                  <Sparkles className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                  <span>Ôn tập xong! +5 XP luyện lại</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700">
                  Ôn lại không thêm Sao hay Vé — bé giữ thành tích bài đầu tiên nhé!
                </span>
              </div>
            ) : (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-3 px-4 bg-amber-50 rounded-2xl border-2 border-amber-200 mb-6 max-w-full">
              <div className="flex items-center gap-2 text-amber-700 font-black text-base">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" aria-hidden="true" />
                <span>+{lesson.starReward} Sao</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700 font-black text-base">
                <Sparkles className="w-6 h-6 text-purple-500" aria-hidden="true" />
                <span>+{lesson.xpReward} XP</span>
                {difficultyMode === 'challenge' && (
                  <span className="text-xs bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded-md font-extrabold">+50% Thử thách</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-blue-700 font-black text-base">
                <span aria-hidden="true">🎟️</span>
                <span>+1 Vé Chơi</span>
              </div>
            </div>
            )}

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
                className="flex-1 min-h-[48px] py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-lg transition-transform active:scale-95 text-sm"
              >
                <span>Về bản đồ</span>
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};