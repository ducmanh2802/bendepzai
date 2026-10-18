import React, { useMemo, useState } from 'react';
import { KIDBOX_STEP_LABELS, KidBoxActivity, KidBoxUnit } from '../../types/kidBox';
import { getKidBoxCourse, getKidBoxContentReadiness, getKidBoxUnitLabel } from '../../data/kidBoxCurriculum';
import { buildUnitActivities } from '../../services/kidBoxActivities';
import {
  analyseEnglishProfile,
  buildDailyEnglishPlan,
  buildHomeworkPack,
  getContentSourceSummary,
  getCurrentUnit,
  getKnowledgeSnapshot,
  getStepProgress,
  getStepsMissingContent,
  listUnitsForChild,
} from '../../services/kidBoxEngine';
import { KidBoxStore } from '../../services/kidBoxStore';
import { getBritishVoiceCapability } from '../../services/britishSpeech';
import { sound } from '../../services/sound';
import { KidBoxActivityPlayer } from './KidBoxActivityPlayer';
import { ArrowLeft, ChevronRight, Home, Info, Lock, Sparkles } from 'lucide-react';

/** Level 1 targets 6–7 y/o, which drives the daily plan length (§19). */
const KIDBOX_PLAN_AGE = 6;

interface KidBoxCompanionScreenProps {
  onBack: () => void;
  onOpenParentMode: () => void;
}

/**
 * Learning OS → English → Kid's Box Companion (§4 / §36 golden path).
 *
 * The screen renders only what the mapping layer provides: unit cards, the §9
 * progression ladder and the §19 daily plan. Nothing about a textbook unit is
 * hardcoded here, so mapped content appears automatically and missing content
 * is reported as `CONTENT_SOURCE_REQUIRED` rather than invented.
 */
export const KidBoxCompanionScreen: React.FC<KidBoxCompanionScreenProps> = ({
  onBack,
  onOpenParentMode,
}) => {
  const [store, setStore] = useState(() => KidBoxStore.get());
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<KidBoxActivity | null>(null);
  const [showHomework, setShowHomework] = useState(false);

  const knowledge = useMemo(() => getKnowledgeSnapshot(), [store]);
  const profile = useMemo(() => analyseEnglishProfile(knowledge), [knowledge]);
  const units = useMemo(() => listUnitsForChild(store), [store]);
  const course = getKidBoxCourse();
  const readiness = getKidBoxContentReadiness();
  const voice = useMemo(() => getBritishVoiceCapability(), []);

  const selectedUnit: KidBoxUnit =
    units.find((u) => u.unit.id === selectedUnitId)?.unit ?? getCurrentUnit(store);

  const activities = useMemo(() => buildUnitActivities(selectedUnit), [selectedUnit]);
  const steps = useMemo(() => getStepProgress(store, selectedUnit), [store, selectedUnit]);
  const missingSteps = useMemo(() => getStepsMissingContent(selectedUnit), [selectedUnit]);
  const plan = useMemo(
    () =>
      buildDailyEnglishPlan({
        store,
        knowledge,
        ageYears: KIDBOX_PLAN_AGE,
        isFatigued: false,
      }),
    [store, knowledge]
  );
  const homework = useMemo(() => buildHomeworkPack({ unitId: selectedUnit.id }), [selectedUnit.id]);
  const contentSummary = useMemo(() => getContentSourceSummary(), []);

  const refresh = () => setStore(KidBoxStore.get());

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-emerald-50 border-2 border-emerald-300 rounded-2xl font-bold text-xs md:text-sm text-emerald-950 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay Lại
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHomework((v) => !v)}
            className="px-3 py-2 bg-white border-2 border-emerald-300 rounded-2xl font-black text-[11px] text-emerald-900 flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Ôn ở nhà
          </button>
          <button
            onClick={onOpenParentMode}
            className="px-3 py-2 bg-slate-900 text-white rounded-2xl font-black text-[11px] flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            Phụ huynh
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 md:p-7 text-white shadow-xl border-4 border-white/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl flex items-center justify-center text-4xl md:text-5xl border-4 border-emerald-200 shrink-0">
              🐰
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-50">
                English · British English · {course.levels[0].label}
              </p>
              <h1 className="text-xl md:text-2xl font-black font-display">Kid&apos;s Box Companion</h1>
              <p className="text-xs font-bold text-emerald-50 mt-1">
                Unit hiện tại: {getKidBoxUnitLabel(getCurrentUnit(store))}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <span className="px-3 py-1.5 rounded-full bg-white/20 text-[11px] font-black text-center">
              🔊 {voice.label}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/20 text-[11px] font-black text-center">
              {readiness.status === 'READY' ? '✅ Đủ nội dung' : '📋 CONTENT_SOURCE_REQUIRED'}
            </span>
          </div>
        </div>
      </section>

      {/* §27 — say exactly what is missing, never fake it */}
      {contentSummary.missingArtifacts.length > 0 && (
        <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
          <h2 className="text-sm font-black text-amber-950 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Nội dung giáo trình còn cần bổ sung (không tự bịa)
          </h2>
          <p className="text-xs font-semibold text-amber-900">
            Ứng dụng chưa có nội dung Unit thật của Kid&apos;s Box trong kho dữ liệu. Dưới đây là những gì cần có để
            ánh xạ — khi có, nội dung sẽ xuất hiện ngay mà không phải sửa engine.
          </p>
          <ul className="text-[11px] font-bold text-amber-900 list-disc pl-5 space-y-0.5">
            {contentSummary.missingArtifacts.map((a) => (
              <li key={a.label}>
                {a.label} → {a.unlocks}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* §19 English hôm nay */}
      <section className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            English hôm nay
          </h2>
          <span className="text-[11px] font-black text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            ~{plan.estimatedMinutes} phút
          </span>
        </div>
        <p className="text-xs font-bold text-slate-600">{profile.explanation}</p>
        <ul className="space-y-2">
          {plan.items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  const activity = activities.find((a) => a.id === item.activityId);
                  if (activity) {
                    sound.playClick();
                    setActiveActivity(activity);
                  }
                }}
                className="w-full text-left p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center gap-3 active:scale-[0.99] cursor-pointer"
              >
                <span className="text-2xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                  <p className="text-[11px] font-semibold text-slate-600">{item.childExplanation}</p>
                </div>
                <span className="text-[11px] font-black text-amber-800 shrink-0">~{item.estimatedMinutes}p</span>
                <ChevronRight className="w-4 h-4 text-amber-600 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* §22 Unit rail — current unit first, nothing locked */}
      <section className="space-y-3">
        <h2 className="text-base font-black text-slate-900 font-display">Chọn Unit</h2>
        <div className="flex flex-wrap gap-2">
          {units.map(({ unit, isCurrent }) => (
            <button
              key={unit.id}
              onClick={() => {
                sound.playClick();
                setSelectedUnitId(unit.id);
              }}
              className={`px-3.5 py-2 rounded-2xl font-black text-xs border-2 active:scale-95 cursor-pointer ${
                unit.id === selectedUnit.id
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              {isCurrent && '📍 '}
              {getKidBoxUnitLabel(unit)}
            </button>
          ))}
        </div>
      </section>

      {/* §9 progression ladder */}
      <section className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-black text-slate-900 font-display">{getKidBoxUnitLabel(selectedUnit)}</h2>
          {selectedUnit.sourceType === 'APP_BRIDGE' && (
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
              Nội dung luyện tập nền — KHÔNG phải nội dung giáo trình
            </span>
          )}
        </div>

        {selectedUnit.contentStatus === 'CONTENT_SOURCE_REQUIRED' && (
          <p className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-xl p-3">
            Unit này chưa có nội dung nguồn. Cần bổ sung: {selectedUnit.missingContent.join(' · ')}
          </p>
        )}

        <ul className="space-y-2">
          {steps.map((entry) => {
            const stepActivities = activities.filter((a) => a.step === entry.step);
            const isMissing = missingSteps.includes(entry.step) && stepActivities.length === 0;
            return (
              <li
                key={entry.step}
                className={`rounded-2xl border-2 p-3 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  entry.progress.status === 'DONE' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-2xl shrink-0" aria-hidden="true">
                  {entry.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900">
                    {entry.step} · {entry.label}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600">
                    {isMissing
                      ? 'Chưa có nội dung nguồn cho bước này (CONTENT_SOURCE_REQUIRED)'
                      : entry.progress.evidenceCount > 0
                        ? `Đã luyện ${entry.progress.evidenceCount} lượt có ghi nhận`
                        : `${stepActivities.length} hoạt động sẵn sàng`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {stepActivities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => {
                        sound.playClick();
                        setActiveActivity(activity);
                      }}
                      className="min-h-[44px] px-3.5 rounded-2xl bg-white border-2 border-emerald-300 text-emerald-900 font-black text-[11px] flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      {KIDBOX_STEP_LABELS[activity.step].emoji} {activity.titleVi}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* §20 Ôn ở nhà */}
      {showHomework && (
        <section className="bg-sky-50 border-2 border-sky-300 rounded-3xl p-5 space-y-3">
          <h2 className="text-base font-black text-sky-950 font-display">Ôn ở nhà · {homework.scopeLabel}</h2>
          {store.courseState.centerHomework && (
            <p className="text-xs font-bold text-sky-900 bg-white rounded-xl border border-sky-200 p-2.5">
              Bài tập trung tâm: {store.courseState.centerHomework}
            </p>
          )}
          <ul className="space-y-2">
            {homework.sections.map((section) => (
              <li key={section.sectionId} className="bg-white rounded-2xl border border-sky-200 p-3">
                <p className="text-sm font-black text-slate-900">
                  {section.emoji} {section.title} · ~{section.estimatedMinutes} phút
                </p>
                <p className="text-[11px] font-semibold text-slate-600">{section.note}</p>
              </li>
            ))}
            {homework.sections.length === 0 && (
              <li className="text-xs font-bold text-sky-900">Chưa có hoạt động nào để giao cho nhà.</li>
            )}
          </ul>
          <p className="text-[11px] font-bold text-sky-800">
            Ba mẹ không cần nhập điểm. Chỉ cần cho bé làm cùng, rồi xem báo cáo tuần trong chế độ phụ huynh.
          </p>
        </section>
      )}

      {activeActivity && (
        <KidBoxActivityPlayer
          activity={activeActivity}
          unit={selectedUnit}
          onClose={() => setActiveActivity(null)}
          onCompleted={() => {
            setActiveActivity(null);
            refresh();
          }}
        />
      )}
    </div>
  );
};
