import React, { useEffect, useMemo, useState } from 'react';
import { ActiveScreen, LearningAction } from '../../types';
import type { DecisionOutput, DecisionRecommendation, SessionKind, SessionPhase } from '../../types';
// T02C — DecisionEngine (competition/Kid's Box/curriculum) is loaded on
// demand so Home's first paint does not pay for the whole content bank.
import { StorageService } from '../../services/storage';
import { sound } from '../../services/sound';
import { ChevronRight, Lightbulb, Target, Zap, Clock, ListChecks, Sparkles } from 'lucide-react';

interface NextBestActionCardProps {
  onNavigate: (screen: ActiveScreen) => void;
}

/** Maps a Learning OS action type onto the screen that can actually run it. */
function routeFor(action: LearningAction | DecisionRecommendation): ActiveScreen | null {
  const rec = action as DecisionRecommendation;
  if (rec.launchRoute) return rec.launchRoute;
  if (action.trackId) return 'kidbox_companion';

  switch (action.type) {
    case 'LEARN':
      return action.lessonId ? 'subject' : null;
    case 'PRACTICE':
    case 'REVIEW':
    case 'SPEED_PRACTICE':
      return action.skillId?.startsWith('rf_') ? 'reading_fluency' : 'daily_review';
    case 'COMPETITION':
    case 'MOCK_EXAM':
      return 'competition';
    case 'GAME':
      return 'games';
    default:
      return null;
  }
}

const TYPE_STYLES: Record<string, string> = {
  LEARN: 'bg-blue-50 border-blue-200 text-blue-800',
  PRACTICE: 'bg-amber-50 border-amber-200 text-amber-900',
  REVIEW: 'bg-violet-50 border-violet-200 text-violet-900',
  SPEED_PRACTICE: 'bg-orange-50 border-orange-200 text-orange-900',
  GAME: 'bg-purple-50 border-purple-200 text-purple-900',
  COMPETITION: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  MOCK_EXAM: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  MAINTENANCE: 'bg-slate-50 border-slate-200 text-slate-700',
};

const SESSION_BADGE: Record<SessionKind, string> = {
  QUICK: 'Nhanh ~5 phút',
  STANDARD: 'Chuẩn 10–15 phút',
  FULL: 'Đầy đủ 15–20 phút',
  RECOVERY: 'Phục hồi ngắn',
  DISCOVERY: 'Khám phá',
};

/** Nhãn pha của từng hoạt động trong kế hoạch phiên — bé đọc được, không phải mã máy. */
const PHASE_LABEL: Record<SessionPhase, string> = {
  WARM_UP: 'khởi động',
  REVIEW: 'ôn lại',
  PRACTICE: 'luyện tập',
  REINFORCEMENT: 'củng cố',
  CHECK: 'kiểm tra',
  DISCOVERY: 'khám phá',
  REST: 'nghỉ tay',
};

/**
 * "Hôm nay bé nên học gì tiếp theo?" — driven exclusively by the Decision
 * Engine, which consumes Learning OS evidence. Never by a single score, never
 * by AI, never by peer comparison.
 *
 * Child sees simple encouraging wording.
 * Parent can expand "Vì sao?" for evidence + machine-readable reason codes.
 */
export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({ onNavigate }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  // T02C — async decision: the engine chunk loads after first paint.
  const [decision, setDecision] = useState<DecisionOutput | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let live = true;
    import('../../services/decisionEngine')
      .then((m) => {
        if (!live) return;
        try {
          setDecision(m.DecisionEngine.decide());
        } catch {
          setLoadFailed(true);
        }
      })
      .catch(() => {
        if (live) setLoadFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const recommendations = useMemo(
    () => (decision ? decision.recommendations.slice(0, 3) : []),
    [decision]
  );
  const dailyPlan = decision?.dailyPlan;
  const sessionPlan = decision?.sessionPlan;

  const explanation = useMemo(() => {
    if (expanded === null) return null;
    const action = recommendations.find((a) => a.id === expanded);
    return action?.explanation ?? null;
  }, [expanded, recommendations]);

  // Engine failed to load (offline first visit with uncached chunk, etc.):
  // stay silent — the card is a recommendation, never a blocker.
  if (loadFailed) return null;
  // Still loading the engine chunk: stable skeleton keeps layout calm.
  if (!decision || !dailyPlan || !sessionPlan) {
    return (
      <section
        className="bg-white rounded-3xl p-5 md:p-6 border-2 border-blue-200 shadow-sm space-y-3"
        data-testid="decision-engine-loading"
        aria-busy="true"
      >
        <div className="h-5 w-48 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-16 rounded-2xl bg-slate-50 border-2 border-slate-100 animate-pulse" />
        <div className="h-16 rounded-2xl bg-slate-50 border-2 border-slate-100 animate-pulse" />
      </section>
    );
  }

  if (recommendations.length === 0 && dailyPlan.items.length === 0) return null;

  const insufficient = decision.insufficientEvidence;

  return (
    <section
      className="bg-white rounded-3xl p-5 md:p-6 border-2 border-blue-200 shadow-sm space-y-4"
      data-testid="decision-engine-card"
      data-decision-mode={decision.mode}
      data-insufficient-evidence={insufficient ? 'true' : 'false'}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Hôm Nay Bé Nên Học Gì?
        </h2>
        <span
          className="text-[11px] font-black text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
          data-testid="decision-evidence-badge"
        >
          Dựa trên {decision.evidenceSummary.totalAttempts} lượt luyện thật
        </span>
      </div>

      {insufficient && decision.insufficientEvidenceMessage && (
        <div
          className="rounded-2xl bg-sky-50 border-2 border-sky-200 p-3 text-xs md:text-sm text-sky-900 font-bold"
          data-testid="insufficient-evidence-message"
        >
          <p className="font-black mb-0.5">Chưa đủ dữ liệu nhé bé!</p>
          <p className="opacity-90">{decision.insufficientEvidenceMessage.vi}</p>
        </div>
      )}

      {/* Child-facing next best actions */}
      <ul className="space-y-2.5" data-testid="decision-recommendations">
        {recommendations.map((action, idx) => {
          const route = routeFor(action);
          const isOpen = expanded === action.id;
          const available = action.availability === 'AVAILABLE';
          return (
            <li
              key={action.id}
              className={`rounded-2xl border-2 ${TYPE_STYLES[action.type] ?? TYPE_STYLES.MAINTENANCE} ${
                available ? '' : 'opacity-60'
              }`}
              data-testid="decision-recommendation"
              data-recommendation-id={action.id}
              data-priority={action.priorityScore}
              data-available={available ? 'true' : 'false'}
              data-reason-codes={action.reasonCodes.join(',')}
            >
              <div className="p-3.5 flex items-start gap-3">
                <span className="text-2xl shrink-0" aria-hidden="true">
                  {action.badgeEmoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                      {idx === 0 ? 'Nên làm nhất' : `Ưu tiên ${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-black bg-white/70 rounded px-1.5 py-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{action.estimatedMinutes} phút
                    </span>
                  </div>
                  <h3 className="font-black text-sm md:text-base mt-0.5">{action.title}</h3>
                  <p className="text-xs md:text-sm font-medium opacity-90 mt-0.5">
                    {action.childExplanation}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setExpanded(isOpen ? null : action.id);
                      }}
                      aria-expanded={isOpen}
                      className="min-h-[44px] px-3 rounded-xl bg-white/80 hover:bg-white text-xs font-black flex items-center gap-1"
                      data-testid="decision-why-button"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Vì sao?
                    </button>
                    {route && available && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onNavigate(route);
                        }}
                        className="min-h-[44px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1"
                        data-testid="decision-start-button"
                      >
                        Bắt đầu
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!available && (
                      <span className="min-h-[44px] px-3 rounded-xl bg-white/60 text-xs font-black flex items-center opacity-70">
                        Chưa mở được
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isOpen && explanation && (
                <div className="px-3.5 pb-3.5" data-testid="decision-explanation">
                  <div className="rounded-xl bg-white/85 border border-black/5 p-3 text-xs space-y-1.5">
                    <p className="font-black">Vì sao: {explanation.why}</p>
                    <p className="font-bold opacity-80">
                      Thời lượng gợi ý: {explanation.howLong} phút
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 opacity-80">
                      {explanation.evidenceLines.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                    {explanation.reasonCodes.length > 0 && (
                      <p className="font-black flex items-center gap-1 pt-1 flex-wrap">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="opacity-70">Mã lý do (phụ huynh):</span>
                        {explanation.reasonCodes.map((code) => (
                          <span
                            key={code}
                            className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[10px]"
                          >
                            {code}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Daily plan — "ÔN TẬP HÔM NAY" as a real Decision Engine output */}
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-3.5" data-testid="daily-plan">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-black text-sm md:text-base text-amber-950 flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            ÔN TẬP HÔM NAY
            <span className="text-[10px] font-black bg-white/80 rounded px-1.5 py-0.5">
              {dailyPlan.items.length} mục · ~{dailyPlan.estimatedMinutes} phút
            </span>
          </h3>
          <button
            onClick={() => {
              sound.playClick();
              setPlanOpen((v) => !v);
            }}
            aria-expanded={planOpen}
            className="min-h-[44px] px-3 rounded-xl bg-white/80 hover:bg-white text-xs font-black"
            data-testid="daily-plan-toggle"
          >
            {planOpen ? 'Ẩn chi tiết' : 'Xem kế hoạch'}
          </button>
        </div>

        <ol className="mt-2 space-y-1.5" data-testid="daily-plan-items">
          {dailyPlan.items.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-start gap-2 rounded-xl bg-white/70 border border-amber-100 p-2"
              data-testid="daily-plan-item"
            >
              <span className="text-lg shrink-0" aria-hidden="true">
                {item.badgeEmoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs md:text-sm">
                  {idx + 1}. {item.title}
                </p>
                <p className="text-[11px] font-medium opacity-80">{item.childExplanation}</p>
                {planOpen && (
                  <p className="text-[11px] font-bold opacity-70 mt-0.5" data-testid="daily-plan-reason">
                    Lý do: {item.reason} · ~{item.estimatedMinutes} phút
                  </p>
                )}
              </div>
              {item.route && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onNavigate(item.route as ActiveScreen);
                  }}
                  className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black shrink-0"
                  data-testid="daily-plan-start"
                >
                  Học
                </button>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Session plan summary */}
      <div
        className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-3.5 space-y-1"
        data-testid="session-plan"
        data-session-kind={sessionPlan.kind}
      >
        <h3 className="font-black text-sm text-indigo-950 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Kế hoạch phiên học
          <span className="text-[10px] font-black bg-white/80 rounded px-1.5 py-0.5">
            {SESSION_BADGE[sessionPlan.kind]} · {sessionPlan.estimatedMinutes}/{sessionPlan.budgetMinutes} phút
          </span>
        </h3>
        <p className="text-xs font-bold opacity-80 text-indigo-900">{sessionPlan.explanation}</p>
        <ul className="space-y-0.5" data-testid="session-plan-items">
          {sessionPlan.items.map((item) => (
            <li key={item.id} className="text-[11px] font-semibold flex items-center gap-1.5">
              <span aria-hidden="true">{item.badgeEmoji}</span>
              <span className="opacity-90">
                {item.title} · ~{item.estimatedMinutes} phút
              </span>
              <span className="opacity-50">({PHASE_LABEL[item.phase]})</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
