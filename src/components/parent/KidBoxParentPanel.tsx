import React, { useMemo, useState } from 'react';
import { KIDBOX_STRAND_LABELS, KidBoxStrand } from '../../types/kidBox';
import { getKidBoxCourse, getKidBoxUnitLabel } from '../../data/kidBoxCurriculum';
import { parseKidBoxSourceJson } from '../../data/kidBoxIngest';
import {
  analyseEnglishProfile,
  buildSkillStars,
  buildStrandStars,
  buildWeeklyReport,
  getContentSourceSummary,
  getKnowledgeSnapshot,
} from '../../services/kidBoxEngine';
import { KidBoxStore } from '../../services/kidBoxStore';
import { describeSpeakingMethod } from '../../services/britishSpeech';
import { sound } from '../../services/sound';
import { AlertTriangle, CalendarDays, CheckCircle, Sparkles, Upload } from 'lucide-react';

interface KidBoxParentPanelProps {
  onDataChanged?: () => void;
}

/**
 * §21 CURRENT UNIT + §23 PARENT DASHBOARD + §24 WEEKLY REPORT + §27 INGESTION.
 *
 * Everything on this panel is derived from recorded evidence or from content the
 * parent/teacher actually supplied. The panel never displays a pronunciation
 * score, never compares the child with other children, and labels demo data
 * honestly when present.
 */
export const KidBoxParentPanel: React.FC<KidBoxParentPanelProps> = ({ onDataChanged }) => {
  const [store, setStore] = useState(() => KidBoxStore.get());
  const [homework, setHomework] = useState(store.courseState.centerHomework ?? '');
  const [ingestText, setIngestText] = useState('');
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);

  const course = getKidBoxCourse();
  const knowledge = useMemo(() => getKnowledgeSnapshot(), [store]);
  const stars = useMemo(() => buildSkillStars(knowledge), [knowledge]);
  const grouped = useMemo(() => buildStrandStars(stars), [stars]);
  const report = useMemo(() => buildWeeklyReport({ store, knowledge }), [store, knowledge]);
  const profile = useMemo(() => analyseEnglishProfile(knowledge), [knowledge]);
  const contentSummary = useMemo(() => getContentSourceSummary(), []);

  const refresh = () => {
    setStore(KidBoxStore.get());
    onDataChanged?.();
  };

  const handleUnitChange = (unitId: string) => {
    sound.playClick();
    KidBoxStore.setCourseState({ currentUnitId: unitId, currentLessonId: null });
    refresh();
  };

  const handleLessonChange = (lessonId: string) => {
    sound.playClick();
    KidBoxStore.setCourseState({ currentLessonId: lessonId || null });
    refresh();
  };

  const handleHomeworkSave = () => {
    sound.playStar();
    KidBoxStore.setCourseState({ centerHomework: homework.trim() || undefined });
    refresh();
  };

  const handleIngest = () => {
    const result = parseKidBoxSourceJson(ingestText);
    const summary = [
      result.ok ? 'Ánh xạ thành công' : 'Chưa ánh xạ được',
      `đơn vị nhận: ${result.unitsAccepted}/${result.unitsAccepted + result.unitsRejected}`,
      `lỗi: ${result.issues.filter((i) => i.severity === 'ERROR').length}`,
      `cảnh báo: ${result.issues.filter((i) => i.severity === 'WARNING').length}`,
    ].join(' · ');
    setIngestMessage(summary);
    sound.playClick();
  };

  const currentUnit = course.units.find((u) => u.id === store.courseState.currentUnitId) ?? course.units[0];

  return (
    <div className="space-y-5">
      {/* §21 CURRENT UNIT */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Bé Đang Học (Kid&apos;s Box Companion)
        </h4>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-700 space-y-1">
            <span>Current English Course</span>
            <input
              value={course.title}
              readOnly
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-black text-slate-800"
            />
          </label>

          <label className="text-xs font-bold text-slate-700 space-y-1">
            <span>Current Unit</span>
            <select
              value={currentUnit?.id ?? ''}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 bg-white text-xs font-black text-slate-800"
            >
              {course.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {getKidBoxUnitLabel(unit)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold text-slate-700 space-y-1">
            <span>Current Lesson (tuỳ chọn)</span>
            <select
              value={store.courseState.currentLessonId ?? ''}
              onChange={(e) => handleLessonChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 bg-white text-xs font-black text-slate-800"
            >
              <option value="">— Tất cả bài trong Unit —</option>
              {(currentUnit?.lessons ?? []).map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold text-slate-700 space-y-1">
            <span>Center homework (tuỳ chọn)</span>
            <div className="flex gap-2">
              <input
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder="VD: nghe lại Unit 1, đọc 3 câu"
                className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold"
              />
              <button
                onClick={handleHomeworkSave}
                className="px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] cursor-pointer"
              >
                Lưu
              </button>
            </div>
          </label>
        </div>
        <p className="text-[11px] font-bold text-slate-500">
          Đổi Unit ở đây sẽ khiến phần “English hôm nay” và gợi ý của hệ thống ưu tiên Unit mới.
        </p>
      </div>

      {/* §23 SKILL STARS — only where evidence exists */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Kỹ Năng Theo Bằng Chứng</h4>
        {(Object.keys(grouped) as KidBoxStrand[]).map((strand) => (
          <div key={strand}>
            <p className="text-xs font-black text-slate-700 mb-1.5">
              {KIDBOX_STRAND_LABELS[strand].emoji} {KIDBOX_STRAND_LABELS[strand].vi}
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {grouped[strand].map((star) => (
                <div
                  key={star.skillId}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <span className="text-[11px] font-bold text-slate-700 truncate">{star.skillName}</span>
                  <span className="text-xs shrink-0" title={`${star.label} · ${star.evidenceCount} lượt`}>
                    {star.hasEvidence
                      ? '⭐'.repeat(star.stars) + '☆'.repeat(5 - star.stars)
                      : '— chưa có dữ liệu'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-[11px] font-bold text-slate-500">
          Sao chỉ hiện khi có bằng chứng luyện tập thật. Sao rỗng = chưa đủ dữ liệu, không phải “yếu”.
        </p>
      </div>

      {/* §24 WEEKLY REPORT */}
      <div className="p-5 bg-sky-50 border border-sky-200 rounded-2xl space-y-3">
        <h4 className="text-sm font-black text-sky-950 uppercase tracking-wider flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-sky-600" />
          Báo Cáo Tuần ({report.fromDate} → {report.toDate})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Từ đã luyện', value: report.wordsPractised },
            { label: 'Buổi nghe', value: report.listeningSessions },
            { label: 'Lượt nói', value: report.speakingAttempts },
            { label: 'Lượt đọc', value: report.readingPractised },
            { label: 'Lượt ôn', value: report.reviewItems },
            { label: 'Lượt phonics', value: report.phonicsPractised },
            { label: 'Lượt mẫu câu', value: report.patternPractised },
            { label: 'Ngày có học', value: report.daysPractised },
          ].map((metric) => (
            <div key={metric.label} className="p-2.5 bg-white rounded-xl border border-sky-200">
              <p className="text-[10px] font-bold text-sky-800">{metric.label}</p>
              <p className="text-lg font-black font-display text-sky-950">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="p-3 bg-white rounded-xl border border-emerald-200">
            <p className="text-[11px] font-black text-emerald-900 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Mạnh nhất
            </p>
            {report.strongestSkills.length === 0 ? (
              <p className="text-[11px] font-bold text-slate-500">Chưa đủ dữ liệu.</p>
            ) : (
              <ul className="text-[11px] font-bold text-slate-700 space-y-0.5">
                {report.strongestSkills.map((s) => (
                  <li key={s.skillId}>
                    {s.skillName} · {s.accuracy}%
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-3 bg-white rounded-xl border border-amber-200">
            <p className="text-[11px] font-black text-amber-900 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Nên luyện thêm
            </p>
            {report.skillsToPractise.length === 0 ? (
              <p className="text-[11px] font-bold text-slate-500">Chưa có kỹ năng nào yếu rõ rệt.</p>
            ) : (
              <ul className="text-[11px] font-bold text-slate-700 space-y-0.5">
                {report.skillsToPractise.map((s) => (
                  <li key={s.skillId}>
                    {s.skillName} · {s.accuracy}%
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <ul className="text-[11px] font-bold text-sky-900 list-disc pl-5 space-y-0.5">
          {report.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="text-[11px] font-bold text-sky-800">
          Nhận giọng nói chỉ ghi nhận theo phương pháp “{describeSpeakingMethod('SPEECH_RECOGNITION_MATCH')}”. Ứng dụng
          không chấm điểm phát âm.
        </p>
        <p className="text-[11px] font-bold text-slate-600">
          Gợi ý hôm nay: {profile.explanation} (tổng {profile.totalAttempts} lượt có bằng chứng)
        </p>
      </div>

      {/* §27 CONTENT INGESTION */}
      <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
        <h4 className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4 text-amber-600" />
          Nội dung Nguồn Còn Thiếu
        </h4>
        <p className="text-[11px] font-bold text-amber-900">
          Trạng thái: <strong>{contentSummary.status}</strong> · đã ánh xạ {contentSummary.mappedUnits} Unit giáo trình.
        </p>
        <ul className="text-[11px] font-bold text-amber-900 list-disc pl-5 space-y-0.5">
          {contentSummary.missingArtifacts.map((a) => (
            <li key={a.label}>
              {a.label} → {a.unlocks}
            </li>
          ))}
        </ul>

        <label className="block text-[11px] font-black text-amber-950 space-y-1">
          <span>Dán nội dung giáo viên (JSON) để ánh xạ vào ứng dụng</span>
          <textarea
            value={ingestText}
            onChange={(e) => setIngestText(e.target.value)}
            rows={4}
            placeholder='{"units":[{"unitRef":"1","title":"...","vocabulary":[{"word":"...","meaningVi":"..."}]}]}'
            className="w-full px-3 py-2 rounded-xl border-2 border-amber-300 bg-white text-[11px] font-mono"
          />
        </label>
        <button
          onClick={handleIngest}
          className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] cursor-pointer"
        >
          Kiểm tra nội dung
        </button>
        {ingestMessage && (
          <p className="text-[11px] font-black text-amber-950 bg-white rounded-xl border border-amber-300 p-2">
            {ingestMessage}
          </p>
        )}
        <p className="text-[10px] font-bold text-amber-800">
          Bước kiểm tra chỉ báo cáo lỗi/cảnh báo và những phần còn thiếu. Nội dung giáo trình phải do người có
          giấy phép ánh xạ; ứng dụng không tự suy diễn từ giáo trình.
        </p>
      </div>
    </div>
  );
};
