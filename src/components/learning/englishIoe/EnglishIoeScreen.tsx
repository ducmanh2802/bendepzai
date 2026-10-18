import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { sound } from '../../../services/sound';
import { IOE_WEEKS, getAllIoeQuestions, type IoeQuestion } from '../../../data/englishIoe';

const STORAGE_KEY = 'kho_bau_ioe_store';

type MainTab = 'learn' | 'practice' | 'mock' | 'report';

interface IoeStore {
  answeredIds: string[];
  correctIds: string[];
  bySkill: Record<string, { total: number; correct: number }>;
  examScores: { at: string; score: number; total: number }[];
}

const emptyStore = (): IoeStore => ({ answeredIds: [], correctIds: [], bySkill: {}, examScores: [] });

function loadStore(): IoeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<IoeStore>;
    return { ...emptyStore(), ...parsed, bySkill: parsed.bySkill ?? {} };
  } catch {
    return emptyStore();
  }
}

function saveStore(store: IoeStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* lưu trữ bị chặn — vẫn học được, chỉ không giữ tiến độ */
  }
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function OptionButtons({
  question,
  picked,
  onPick,
  showResult,
}: {
  question: IoeQuestion;
  picked: number | null;
  onPick: (i: number) => void;
  showResult: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {question.options.map((opt, i) => {
        const isCorrect = showResult && i === question.answer;
        const isWrong = showResult && picked === i && i !== question.answer;
        return (
          <button
            key={opt}
            onClick={() => onPick(i)}
            disabled={picked !== null}
            className={`p-3 rounded-xl border-2 font-bold flex items-center gap-2 text-left ${isCorrect ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
          >
            {showResult &&
              (isCorrect ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              ) : isWrong ? (
                <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
              ) : null)}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** Bài học / luyện tập: có giải thích ngay sau mỗi câu. */
function PracticeQuiz({
  questions,
  onAnswer,
  footer,
}: {
  questions: IoeQuestion[];
  onAnswer: (q: IoeQuestion, ok: boolean) => void;
  footer?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  if (!q) return null;

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === q.answer;
    onAnswer(q, ok);
    if (ok) {
      setCorrect((c) => c + 1);
      sound.playCorrect();
    } else {
      sound.playWrong();
    }
  };

  const next = () => {
    setPicked(null);
    if (idx + 1 >= questions.length) setDone(true);
    else setIdx((i) => i + 1);
  };

  if (done) {
    const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    return (
      <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2 text-center">
        <div className="text-xl font-black">Điểm: {correct}/{questions.length} ({pct}%)</div>
        <p className="text-sm text-emerald-800 font-bold">
          {pct >= 80 ? 'Tuyệt vời! Bé học rất chắc.' : pct >= 50 ? 'Tốt! Hãy ôn lại phần còn sai.' : 'Chưa vội, hãy học lại từ bài 1 nhé.'}
        </p>
        <button
          onClick={() => {
            setIdx(0);
            setPicked(null);
            setCorrect(0);
            setDone(false);
          }}
          className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl"
        >
          Làm lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-3">
      <div className="text-sm font-bold text-slate-500">
        Câu {idx + 1}/{questions.length} · Đúng: {correct}
        {footer ? ` · ${footer}` : ''}
      </div>
      <h3 className="font-black text-lg">{q.prompt}</h3>
      <OptionButtons question={q} picked={picked} onPick={pick} showResult={picked !== null} />
      {picked !== null && (
        <div className="space-y-2">
          <div className="text-sm text-slate-600">💡 {q.explanation}</div>
          <button onClick={next} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl">
            {idx + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo →'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Bài thi thử: có đồng hồ, không hiện giải thích ngay. */
function MockExam({
  questions,
  secondsLeft,
  onAnswer,
  onScore,
}: {
  questions: IoeQuestion[];
  secondsLeft: number;
  onAnswer: (q: IoeQuestion, ok: boolean) => void;
  onScore: (score: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const scored = useRef(false);
  const expired = secondsLeft === 0;
  const q = questions[idx];

  const finish = (score: number) => {
    if (scored.current) return;
    scored.current = true;
    setDone(true);
    onScore(score);
  };

  useEffect(() => {
    if (expired) finish(correct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  if (!q) return null;

  const pick = (i: number) => {
    if (picked !== null || expired) return;
    setPicked(i);
    const ok = i === q.answer;
    onAnswer(q, ok);
    const nextScore = ok ? correct + 1 : correct;
    setCorrect(nextScore);
    if (ok) sound.playCorrect();
    else sound.playWrong();
    window.setTimeout(() => {
      if (idx + 1 >= questions.length) finish(nextScore);
      else {
        setPicked(null);
        setIdx((x) => x + 1);
      }
    }, 600);
  };

  if (done) {
    return (
      <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2 text-center">
        <div className="text-xl font-black">
          {expired ? '⏰ Hết giờ' : '🎉 Hoàn thành'}: {correct}/{questions.length}
        </div>
        <p className="text-sm text-emerald-800 font-bold">
          {expired ? 'Hết giờ nhưng điểm đã được ghi nhận.' : 'Xem tab Báo cáo để biết cần ôn kỹ năng nào.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-3">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="text-slate-500">
          Câu {idx + 1}/{questions.length}
        </span>
        <span className={secondsLeft < 60 ? 'text-rose-600' : 'text-emerald-600'}>
          ⏱ {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
        </span>
      </div>
      <h3 className="font-black text-lg">{q.prompt}</h3>
      <OptionButtons question={q} picked={picked} onPick={pick} showResult={false} />
    </div>
  );
}

export const EnglishIoeScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<MainTab>('learn');
  const [weekIdx, setWeekIdx] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [store, setStore] = useState<IoeStore>(() => loadStore());
  const [practiceKey, setPracticeKey] = useState(0);
  const [mockQuestions, setMockQuestions] = useState<IoeQuestion[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const timer = useRef<number | null>(null);

  const week = IOE_WEEKS[weekIdx];
  const lesson = week.lessons[Math.min(lessonIdx, week.lessons.length - 1)];

  const record = (q: IoeQuestion, isCorrect: boolean) => {
    setStore((prev) => {
      const next: IoeStore = {
        ...prev,
        answeredIds: prev.answeredIds.includes(q.id) ? prev.answeredIds : [...prev.answeredIds, q.id],
        correctIds: isCorrect && !prev.correctIds.includes(q.id) ? [...prev.correctIds, q.id] : prev.correctIds,
        bySkill: {
          ...prev.bySkill,
          [q.skill]: {
            total: (prev.bySkill[q.skill]?.total ?? 0) + 1,
            correct: (prev.bySkill[q.skill]?.correct ?? 0) + (isCorrect ? 1 : 0),
          },
        },
      };
      saveStore(next);
      return next;
    });
  };

  const practiceQuestions = useMemo(() => shuffle(getAllIoeQuestions()).slice(0, 8), [practiceKey]);

  useEffect(() => {
    if (tab !== 'mock' || mockQuestions.length === 0) return;
    timer.current = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [tab, mockQuestions.length]);

  const skillRows = Object.entries(store.bySkill);
  const totalAnswered = store.answeredIds.length;
  const totalCorrect = store.correctIds.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h1 className="text-2xl font-black font-display text-slate-900">🇬🇧 Tiếng Anh IOE</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(
          [
            { id: 'learn', label: 'Học bài' },
            { id: 'practice', label: 'Luyện tập' },
            { id: 'mock', label: 'Thi thử' },
            { id: 'report', label: 'Báo cáo' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => {
              sound.playClick();
              setTab(t.id);
            }}
            className={`px-4 py-2 rounded-xl font-bold ${tab === t.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'learn' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {IOE_WEEKS.map((w, i) => (
              <button
                key={w.id}
                onClick={() => {
                  sound.playClick();
                  setWeekIdx(i);
                  setLessonIdx(0);
                }}
                className={`px-3 py-1 rounded-xl font-bold text-sm ${weekIdx === i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Tuần {w.week}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
            <div className="font-black text-slate-800">{week.title}</div>
            <div className="text-sm text-slate-500">{week.topics.join(' · ')}</div>
            <div className="flex gap-2 flex-wrap mt-2">
              {week.lessons.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => {
                    sound.playClick();
                    setLessonIdx(i);
                  }}
                  className={`px-3 py-1 rounded-xl font-bold text-sm ${lessonIdx === i ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {l.title}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-3">
            <div className="font-black text-slate-800">{lesson.title}</div>
            <div className="text-sm text-slate-600">{lesson.objective}</div>
            <div className="flex gap-2 flex-wrap">
              {lesson.vocab.map((v) => (
                <span key={v.en} className="px-2 py-1 bg-slate-100 rounded-lg text-sm font-bold">
                  {v.emoji} {v.en} — {v.vi}
                </span>
              ))}
            </div>
          </div>

          <PracticeQuiz key={lesson.id} questions={lesson.questions} onAnswer={record} />
        </>
      )}

      {tab === 'practice' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-600">
              Luyện tập ngẫu nhiên 8 câu từ tất cả các tuần. Không giới hạn thời gian.
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setPracticeKey((k) => k + 1);
              }}
              className="px-3 py-2 bg-sky-500 text-white font-bold rounded-xl shrink-0"
            >
              Câu mới
            </button>
          </div>
          <PracticeQuiz key={practiceKey} questions={practiceQuestions} onAnswer={record} />
        </div>
      )}

      {tab === 'mock' && (
        <div className="space-y-3">
          {mockQuestions.length === 0 ? (
            <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 text-center space-y-3">
              <div className="text-3xl">📝</div>
              <div className="font-black text-lg">Bài thi mô phỏng</div>
              <p className="text-sm text-slate-600">
                15 câu ngẫu nhiên trong 5 phút. Đây là bài luyện tập do ứng dụng tạo, không phải đề thi chính thức của IOE.
              </p>
              <button
                onClick={() => {
                  sound.playClick();
                  setMockQuestions(shuffle(getAllIoeQuestions()).slice(0, 15));
                  setSecondsLeft(300);
                }}
                className="px-5 py-2 bg-emerald-500 text-white font-bold rounded-xl"
              >
                Bắt đầu thi thử
              </button>
            </div>
          ) : (
            <MockExam
              key={mockQuestions.map((q) => q.id).join(',')}
              questions={mockQuestions}
              secondsLeft={secondsLeft}
              onAnswer={record}
              onScore={(score) =>
                setStore((prev) => {
                  const next = {
                    ...prev,
                    examScores: [...prev.examScores, { at: new Date().toISOString(), score, total: mockQuestions.length }],
                  };
                  saveStore(next);
                  return next;
                })
              }
            />
          )}
        </div>
      )}

      {tab === 'report' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
            <div className="font-black text-slate-800">Tổng quan</div>
            {totalAnswered === 0 ? (
              <p className="text-sm text-slate-600">Chưa đủ dữ liệu đánh giá. Hãy làm vài câu trước nhé.</p>
            ) : (
              <>
                <div className="text-sm text-slate-700">
                  Đã làm <b>{totalAnswered}</b> câu · đúng <b>{totalCorrect}</b> (
                  {Math.round((totalCorrect / totalAnswered) * 100)}%)
                </div>
                <div className="space-y-1">
                  {skillRows.map(([skill, s]) => (
                    <div key={skill} className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-600 w-24">{skill}</span>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${s.total ? Math.round((s.correct / s.total) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {s.correct}/{s.total}
                      </span>
                    </div>
                  ))}
                </div>
                {skillRows.some(([, s]) => s.total >= 2 && s.correct / s.total < 0.6) && (
                  <p className="text-sm text-amber-700 font-bold">
                    💡 Gợi ý: ôn lại các kỹ năng dưới 60% trước khi làm đề mới.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
            <div className="font-black text-slate-800">Kết quả thi thử</div>
            {store.examScores.length === 0 ? (
              <p className="text-sm text-slate-600">Chưa có bài thi thử nào.</p>
            ) : (
              store.examScores
                .slice(-5)
                .reverse()
                .map((e, i) => (
                  <div key={i} className="text-sm text-slate-600">
                    {new Date(e.at).toLocaleString('vi-VN')} — {e.score}/{e.total} (
                    {Math.round((e.score / e.total) * 100)}%)
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnglishIoeScreen;