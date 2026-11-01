import React, { useState, useMemo } from 'react';
import { StorageService } from '../../services/storage';
import { seedDemoProfile } from '../../services/demoSeed';
import { AdaptiveService, ParentDiagnosticReport, ReadingProgressReport } from '../../services/adaptive';
import { DecisionEngine } from '../../services/decisionEngine';
import { adaptiveDifficulty, describeLevel } from '../../services/adaptiveDifficulty';
import type { DecisionOutput, KnowledgeState, SessionProfileKind } from '../../types';
import { ParentSettings } from '../../types';
import { sound } from '../../services/sound';
import { localDateKey } from '../../services/dateUtils';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  Lock,
  X,
  Clock,
  Timer,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Settings,
  Volume2,
  Trash2,
  Download,
  BarChart3,
  ShieldCheck,
  Trophy,
  Languages,
  Target,
  TrendingUp,
  History,
  Gift,
  RotateCcw,
} from 'lucide-react';
import { KidBoxParentPanel } from './KidBoxParentPanel';

interface ParentDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset?: () => void;
  onOpenCompetitionReal?: () => void;
}

export const ParentDashboardModal: React.FC<ParentDashboardModalProps> = ({
  isOpen,
  onClose,
  onDataReset,
  onOpenCompetitionReal,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gateQuestion, setGateQuestion] = useState({ a: 15, b: 18, ans: 33 });
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState(false);

  const [settings, setSettings] = useState<ParentSettings>(StorageService.getParentSettings());
  const [report, setReport] = useState<ParentDiagnosticReport | null>(null);
  const [readingReport, setReadingReport] = useState<ReadingProgressReport | null>(null);
  const [decisionReport, setDecisionReport] = useState<DecisionOutput | null>(null);
const [activeTab, setActiveTab] = useState<
    'progress' | 'reading' | 'insights' | 'competition' | 'kidbox' | 'settings'
  >('progress');
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);

  // Per-skill adaptive profiles for the insights tab
  const skillProfiles = useMemo(() => {
    const knowledgeMap = StorageService.getKnowledgeStates();
    const profiles: Record<string, ReturnType<typeof adaptiveDifficulty.getSkillProfile>> = {};
    for (const [skillId, state] of Object.entries(knowledgeMap)) {
      if (state.attemptCount > 0) {
        const profile = adaptiveDifficulty.getSkillProfile(skillId, knowledgeMap);
        if (profile) profiles[skillId] = profile;
      }
    }
    return profiles;
  }, [decisionReport, report]);

  /**
   * When the gate screen is replaced by the dashboard, the focused submit button
   * unmounts and the browser drops focus to <body>. Move focus back onto the
   * dialog so keyboard users are not dropped at the top of the page.
   */
  React.useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    dialogRef.current?.focus({ preventScroll: true });
  }, [isOpen, isAuthenticated, dialogRef]);

  // Regenerate gate challenge on open
  React.useEffect(() => {
    if (isOpen) {
      const a = Math.floor(Math.random() * 20) + 12;
      const b = Math.floor(Math.random() * 20) + 11;
      setGateQuestion({ a, b, ans: a + b });
      setGateInput('');
      setGateError(false);
      setIsAuthenticated(false);
      setSettings(StorageService.getParentSettings());
    }
  }, [isOpen]);

  const handleVerifyGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(gateInput, 10) === gateQuestion.ans) {
      sound.playCorrect();
      setIsAuthenticated(true);
      setReport(AdaptiveService.generateParentReport());
      setReadingReport(AdaptiveService.generateReadingReport());
      setDecisionReport(DecisionEngine.decide());
    } else {
      sound.playWrong();
      setGateError(true);
      setGateInput('');
    }
  };

  const handleUpdateLimit = (mins: number) => {
    const next = { ...settings, dailyLimitMinutes: mins };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.playClick();
  };

  const handleToggleVoice = () => {
    const next = { ...settings, voiceEnabled: !settings.voiceEnabled };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.setVoiceEnabled(next.voiceEnabled);
    sound.playClick();
  };

  const handleToggleSound = () => {
    const next = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.setMuted(!next.soundEnabled);
    sound.playClick();
  };

  const handleToggleAutoplay = () => {
    const next = { ...settings, questionAutoplay: !settings.questionAutoplay };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.playClick();
  };

  const handleUpdateSessionProfile = (profile: SessionProfileKind) => {
    const next = { ...settings, defaultSessionProfile: profile };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.playClick();
  };

  const handleToggleAdvancedQuestions = () => {
    const next = { ...settings, allowAdvancedQuestions: !settings.allowAdvancedQuestions };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.playClick();
  };

  const handleUpdateReviewIntensity = (intensity: 'light' | 'standard' | 'intensive') => {
    const next = { ...settings, reviewIntensity: intensity };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.playClick();
  };

  const handleToggleOptionalBreaks = () => {
    const next = { ...settings, optionalBreaks: !settings.optionalBreaks };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.playClick();
  };

  const handleUpdateMaxGachaPerDay = (value: number) => {
    const next = { ...settings, maxGachaPerDay: Math.max(0, Math.round(value)) };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.playClick();
  };

  const handleToggleRewardsEnabled = () => {
    const next = { ...settings, rewardsEnabled: !settings.rewardsEnabled };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.playClick();
  };

  const handleToggleNightMode = () => {
    const next = { ...settings, nightMode: !settings.nightMode };
    setSettings(next);
    StorageService.saveParentSettings(next);
    sound.playClick();
    // Apply immediately to document
    if (next.nightMode) {
      document.documentElement.setAttribute('data-theme', 'night');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const handleToggleUnlockAll = () => {
    const profile = StorageService.getChildProfile();
    profile.unlockAllLessons = !profile.unlockAllLessons;
    StorageService.saveChildProfile(profile);
    sound.playClick();
  };

  const handleExportData = () => {
    const profile = StorageService.getChildProfile();
    const analytics = StorageService.getAnalytics();
    const competitionHistory = StorageService.getCompetitionHistory();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ profile, analytics, competitionHistory }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `kho_bau_tri_thuc_report_${localDateKey()}.json`);
    dlAnchor.click();
    sound.playStar();
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Hai thao tác (đặt lại / nạp dữ liệu thử nghiệm) ghi vào cùng một dòng thông
  // báo. Không cắt hẹn giờ cũ thì bấm "nạp dữ liệu mẫu" ngay sau khi đặt lại làm
  // cảnh báo "đây là số liệu mẫu" biến mất sau ~1s thay vì đủ 6s.
  const resetNoticeTimerRef = React.useRef<number | null>(null);
  const showResetNotice = (message: string, ms: number) => {
    if (resetNoticeTimerRef.current !== null) window.clearTimeout(resetNoticeTimerRef.current);
    setResetSuccessMessage(message);
    resetNoticeTimerRef.current = window.setTimeout(() => {
      resetNoticeTimerRef.current = null;
      setResetSuccessMessage(null);
    }, ms);
  };
  React.useEffect(
    () => () => {
      if (resetNoticeTimerRef.current !== null) window.clearTimeout(resetNoticeTimerRef.current);
    },
    []
  );

  const handleConfirmReset = () => {
    StorageService.resetProgress();
    sound.playClick();
    showResetNotice('Đã đặt lại tiến độ về dữ liệu mới tinh ban đầu!', 3000);
    setShowResetConfirm(false);
    setReport(AdaptiveService.generateParentReport());
    setReadingReport(AdaptiveService.generateReadingReport());
    setDecisionReport(DecisionEngine.decide());
    if (onDataReset) onDataReset();
  };

  const handleSeedDemoData = () => {
    seedDemoProfile();
    sound.playStar();
    setShowSeedConfirm(false);
    showResetNotice(
      'Đã nạp DỮ LIỆU THỬ NGHIỆM. Các biểu đồ đang hiển thị là số liệu mẫu, không phải tiến bộ thật của bé.',
      6000
    );
    setReport(AdaptiveService.generateParentReport());
    setReadingReport(AdaptiveService.generateReadingReport());
    setDecisionReport(DecisionEngine.decide());
    if (onDataReset) onDataReset();
  };

  if (!isOpen) return null;

  const analytics = StorageService.getAnalytics();
  const profile = StorageService.getChildProfile();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/80 backdrop-blur-md animate-pop">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Khu vực dành cho phụ huynh"
        tabIndex={-1}
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg md:text-xl font-black tracking-wide font-display">
                Khu Vực Dành Cho Phụ Huynh
              </h2>
              <p className="text-xs text-slate-300">
                Theo dõi tiến độ, phân tích kỹ năng & kiểm soát thời gian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng bảng điều khiển phụ huynh"
            title="Đóng"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        {!isAuthenticated ? (
          // Parent Gate Screen (Simple Math calculation to verify adult presence)
          <div className="p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Cổng Xác Nhận Phụ Huynh</h3>
            <p className="text-sm text-slate-600 mb-6">
              Để bảo vệ an toàn cho bé, vui lòng trả lời phép tính dưới đây để truy cập trang quản lý:
            </p>

            <form onSubmit={handleVerifyGate} className="w-full space-y-4">
              <div className="p-4 bg-slate-100 rounded-2xl text-2xl font-black text-slate-800 tracking-wider">
                {gateQuestion.a} + {gateQuestion.b} = ?
              </div>

              <input
                type="number"
                value={gateInput}
                onChange={(e) => setGateInput(e.target.value)}
                placeholder="Nhập kết quả..."
                autoFocus
                className="w-full py-3 px-4 text-center text-xl font-bold border-2 border-slate-300 rounded-2xl focus:border-blue-600 focus:outline-none"
              />

              {gateError && (
                <p className="text-xs text-rose-600 font-bold">
                  Kết quả chưa chính xác, ba mẹ vui lòng tính lại nhé!
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95"
              >
                Mở Bảng Phụ Huynh
              </button>
            </form>
          </div>
        ) : (
          // Authenticated Parent Dashboard
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* DEMO DATA BANNER (§1.2): fabricated figures must never look real */}
            {report?.isDemoData && (
              <div
                role="status"
                className="px-6 py-2.5 bg-amber-100 border-b-2 border-amber-300 text-amber-950 text-xs font-bold flex items-start gap-2"
              >
                <span className="text-base leading-none pt-0.5" aria-hidden="true">
                  ⚠️
                </span>
                <span>
                  Đang hiển thị <strong>DỮ LIỆU THỬ NGHIỆM</strong> — các con số dưới đây là số
                  liệu mẫu để minh hoạ, không phải tiến bộ thật của bé. Bấm “Đặt lại tiến độ” để
                  xoá và bắt đầu bằng hồ sơ sạch.
                </span>
              </div>
            )}

            {/* Nav Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-6">
              <button
                onClick={() => setActiveTab('progress')}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'progress'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Tiến Độ & Năng Lực</span>
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'insights'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span>Phân Tích & Lời Khuyên</span>
              </button>
              <button
                onClick={() => setActiveTab('reading')}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'reading'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Luyện Đọc</span>
              </button>
              <button
                onClick={() => setActiveTab('competition')}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'competition'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Đấu Trường Thi Thử</span>
              </button>
              <button
                onClick={() => setActiveTab('kidbox')}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'kidbox'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Languages className="w-4 h-4" />
                <span>Kid&apos;s Box</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Cài Đặt & Thời Gian</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'progress' && (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                      <span className="text-xs text-blue-700 font-semibold block">Học hôm nay</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-2xl font-black text-blue-900">{analytics.minutesToday} phút</span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <span className="text-xs text-emerald-700 font-semibold block">Độ chính xác</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="text-2xl font-black text-emerald-900">
                          {analytics.totalQuestionsAnswered > 0 ? `${report?.overallAccuracy ?? 0}%` : 'Chưa có'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                      <span className="text-xs text-amber-700 font-semibold block">Bài học xong</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                        <span className="text-2xl font-black text-amber-900">
                          {profile.completedLessons.length} bài
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                      <span className="text-xs text-purple-700 font-semibold block">Chuỗi ngày học</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xl">🔥</span>
                        <span className="text-2xl font-black text-purple-900">{profile.streak} ngày</span>
                      </div>
                    </div>
                  </div>

                  {/* Subject Mastery Progress Bars */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Mức độ nắm vững kiến thức Lớp 1
                    </h4>

                    {/* Tiếng Việt */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span className="flex items-center gap-1">
                          <span>📚</span> Tiếng Việt (Chữ cái, vần, chính tả, đọc hiểu)
                        </span>
                        <span>
                          {report?.subjectMastery['tieng-viet'].percent ?? 0}% (
                          {report?.subjectMastery['tieng-viet'].label ?? 'Chưa làm bài'})
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${report?.subjectMastery['tieng-viet'].percent ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Toán */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span className="flex items-center gap-1">
                          <span>🔢</span> Toán Học (Đếm 0-20, cộng trừ, hình học, lời văn)
                        </span>
                        <span>
                          {report?.subjectMastery['toan'].percent ?? 0}% (
                          {report?.subjectMastery['toan'].label ?? 'Chưa làm bài'})
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${report?.subjectMastery['toan'].percent ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Tiếng Anh */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span className="flex items-center gap-1">
                          <span>🇬🇧</span> Tiếng Anh (Phonics, từ vựng, con vật, màu sắc)
                        </span>
                        <span>
                          {report?.subjectMastery['english'].percent ?? 0}% (
                          {report?.subjectMastery['english'].label ?? 'Chưa làm bài'})
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${report?.subjectMastery['english'].percent ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-4" data-testid="parent-decision-insights">
                  {/* P39 Decision Engine — Hôm nay · Điểm mạnh · Cần củng cố · Nên học tiếp */}
                  {decisionReport && (
                    <div
                      className="p-5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-4"
                      data-testid="parent-decision-report"
                      data-decision-mode={decisionReport.mode}
                      data-insufficient-evidence={decisionReport.insufficientEvidence ? 'true' : 'false'}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-600" />
                            Hôm Nay Bé Nên Học Gì?
                          </h4>
                          <p className="text-xs text-indigo-900 font-bold mt-1">
                            {decisionReport.parentReport.headline}
                          </p>
                        </div>
                        <span className="text-[11px] font-black bg-white/80 border border-indigo-200 rounded-lg px-2 py-1">
                          {decisionReport.evidenceSummary.totalAttempts} lượt luyện · chế độ{' '}
                          {decisionReport.mode}
                        </span>
                      </div>

                      {decisionReport.insufficientEvidence && decisionReport.insufficientEvidenceMessage && (
                        <p className="text-xs font-bold text-indigo-900 bg-white/70 border border-indigo-200 rounded-xl p-2.5">
                          {decisionReport.insufficientEvidenceMessage.vi}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white/80 border border-emerald-200 rounded-xl p-3">
                          <h5 className="text-xs font-black text-emerald-800 mb-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Điểm mạnh
                          </h5>
                          {decisionReport.parentReport.strengths.length > 0 ? (
                            <ul className="space-y-1">
                              {decisionReport.parentReport.strengths.map((s) => (
                                <li key={s.skillName} className="text-[11px] font-semibold">
                                  <strong>{s.skillName}</strong> — {s.detail}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-600 font-medium">
                              Chưa đủ dữ liệu để xác định điểm mạnh.
                            </p>
                          )}
                        </div>

                        <div className="bg-white/80 border border-rose-200 rounded-xl p-3">
                          <h5 className="text-xs font-black text-rose-800 mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Cần củng cố
                          </h5>
                          {decisionReport.parentReport.needsWork.length > 0 ? (
                            <ul className="space-y-1">
                              {decisionReport.parentReport.needsWork.map((n) => (
                                <li key={n.skillName} className="text-[11px] font-semibold">
                                  <strong>{n.skillName}</strong> — {n.detail}
                                  {n.reasonCodes.length > 0 && (
                                    <span className="block text-[10px] opacity-70 mt-0.5">
                                      {n.reasonCodes.join(' · ')}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-600 font-medium">
                              Chưa có kỹ năng nào cần củng cố khẩn cấp.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/80 border border-sky-200 rounded-xl p-3">
                        <h5 className="text-xs font-black text-sky-800 mb-1.5 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Đang tiến bộ
                        </h5>
                        {decisionReport.parentReport.improving.length > 0 ? (
                          <ul className="space-y-1">
                            {decisionReport.parentReport.improving.map((i) => (
                              <li key={i.skillName} className="text-[11px] font-semibold">
                                <strong>{i.skillName}</strong> — {i.detail}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-slate-600 font-medium">
                            Chưa đủ tín hiệu tiến bộ để báo cáo.
                          </p>
                        )}
                      </div>

                      <div className="bg-white/80 border border-amber-200 rounded-xl p-3">
                        <h5 className="text-xs font-black text-amber-900 mb-1.5">Nên học tiếp</h5>
                        <ul className="space-y-1.5" data-testid="parent-next-best">
                          {decisionReport.parentReport.nextBest.map((n) => (
                            <li key={n.title} className="text-[11px] font-semibold">
                              <strong>{n.title}</strong>
                              <span className="block opacity-85">
                                Vì sao: {n.why} · khoảng {n.howLong} phút
                              </span>
                              {n.reasonCodes.length > 0 && (
                                <span className="block text-[10px] opacity-65 mt-0.5">
                                  {n.reasonCodes.join(', ')}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-[10px] font-bold text-indigo-900/70">
                        Giá trị chỉ đến từ dữ liệu học tập thật của bé · thời gian hoạt động hôm nay:{' '}
                        {decisionReport.parentReport.activityMinutesToday} phút · số lượt:{' '}
                        {decisionReport.parentReport.totalAttempts}
                        {decisionReport.competitionReadinessLabel
                          ? ` · Đấu Trường: ${decisionReport.competitionReadinessLabel}`
                          : ''}
                      </p>
                    </div>
                  )}

                  {/* Per-Skill Adaptive Level Display */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                    <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Độ Khó Thích Ứng Theo Kỹ Năng
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Mỗi kỹ năng có độ khó riêng (L1–L5). Độ khó tăng khi bé trả lời ĐỘC LẬP đạt chuẩn; giảm tạm thời khi cần hỗ trợ.
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
{Object.entries(skillProfiles)
                        .filter(([, profile]) => profile !== null)
                        .map(([skillId, profile]) => {
                          const p = profile!;
                          return (
                            <div key={skillId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900">{p.skillName}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  p.currentLevel <= 2 ? 'bg-blue-100 text-blue-800' :
                                  p.currentLevel === 3 ? 'bg-amber-100 text-amber-800' :
                                  p.currentLevel === 4 ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  L{p.currentLevel} — {describeLevel(p.currentLevel)}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium text-slate-600">
                                <span>Độc lập: {p.independentAccuracy}% ({p.independentCorrect}/{p.independentAttempts})</span>
                                <span>Hỗ trợ: {p.assistedAccuracy}% ({p.assistedCorrect}/{p.assistedAttempts})</span>
                                <span>Gợi ý: {p.hintUsage}</span>
                                <span>Thử: {p.totalAttempts}</span>
                                <span>Giữ vững: {p.retentionEvidence.totalReviews > 0 ? Math.round((p.retentionEvidence.correctOnReview / p.retentionEvidence.totalReviews) * 100) : 0}%</span>
                              </div>
                            </div>
                          );
                        })}
                      {Object.keys(skillProfiles).length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4">Bé chưa có dữ liệu luyện tập nào. Hãy bắt đầu một bài học để xem phân tích!</p>
                      )}
                    </div>
                  </div>

                  {/* Pedagogical Advice */}
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <h4 className="text-sm font-black text-amber-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                      Gợi Ý Phương Pháp Cho Ba Mẹ
                    </h4>
                    <ul className="space-y-2 text-xs md:text-sm text-amber-950 font-medium list-disc pl-5">
                      {report?.adviceList.map((adv, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {adv}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weak Skills Overview */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                    <h4 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      Điểm Cần Cải Thiện Thêm
                    </h4>
                    {report && report.weakSkills.length > 0 ? (
                      <div className="space-y-2">
                        {report.weakSkills.map((sk) => (
                          <div
                            key={sk.skillId}
                            className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-rose-900">{sk.skillName}</span>
                            <span className="text-rose-700 font-semibold">
                              Làm đúng {sk.correctCount}/{sk.attempts} lần
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 font-medium">
                        Hiện tại bé chưa có kỹ năng nào bị yếu nghiêm trọng. Hệ thống sẽ tiếp tục theo dõi sát sao!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reading' && (
                <div className="space-y-5">
                  {readingReport && readingReport.totalSessions > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                          <span className="text-xs text-sky-700 font-semibold block">Chỉ số đọc</span>
                          <span className="text-2xl font-black text-sky-900 tabular-nums">
                            {readingReport.readingIndex}/100
                          </span>
                        </div>
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                          <span className="text-xs text-emerald-700 font-semibold block">
                            Đọc chính xác
                          </span>
                          <span className="text-2xl font-black text-emerald-900 tabular-nums">
                            {readingReport.accuracyIndex}%
                          </span>
                        </div>
                        <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                          <span className="text-xs text-violet-700 font-semibold block">
                            Hiểu nội dung
                          </span>
                          <span className="text-2xl font-black text-violet-900 tabular-nums">
                            {readingReport.comprehensionIndex}%
                          </span>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                          <span className="text-xs text-amber-700 font-semibold block">
                            Tốc độ đọc
                          </span>
                          <span className="text-2xl font-black text-amber-900 tabular-nums">
                            {readingReport.wordsPerMinute > 0
                              ? `${readingReport.wordsPerMinute} từ/phút`
                              : 'Chưa đo'}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 bg-sky-50 border border-sky-200 rounded-2xl">
                        <span className="font-black text-sky-950 block">{readingReport.headline}</span>
                        <span className="text-sm text-sky-900">{readingReport.encouragement}</span>
                        <p className="text-xs text-sky-800 mt-2">
                          Bước đang luyện: <strong>{readingReport.currentStageLabel}</strong> ·{' '}
                          {readingReport.totalSessions} lượt · chính xác trung bình{' '}
                          {readingReport.averageAccuracy}%
                        </p>
                      </div>

                      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                        <h4 className="text-sm font-black text-slate-900">Tiến bộ theo bậc thang</h4>
                        {readingReport.stageRows.map((row) => (
                          <div key={row.stage} className="text-xs">
                            <div className="flex items-center justify-between font-bold">
                              <span className={row.unlocked ? 'text-slate-800' : 'text-slate-400'}>
                                {row.completed ? '✅' : row.unlocked ? '🔓' : '🔒'} {row.label}
                              </span>
                              <span className="tabular-nums text-slate-600">
                                {row.accuracy}% / chuẩn {row.gate}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${row.completed ? 'bg-emerald-500' : 'bg-sky-500'}`}
                                style={{ width: `${Math.min(100, row.accuracy)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {readingReport.skillRows.length > 0 && (
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                          <h4 className="text-sm font-black text-slate-900">Kỹ năng đọc chi tiết</h4>
                          {readingReport.skillRows.map((row) => (
                            <div
                              key={row.skillId}
                              className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                            >
                              <span className="font-bold text-slate-700">{row.skillName}</span>
                              <span className="tabular-nums text-slate-600">
                                {row.accuracy}% ({row.attempts} lượt)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                        <h4 className="text-sm font-black text-amber-900 mb-2">
                          Gợi ý cho ba mẹ về việc đọc
                        </h4>
                        <ul className="space-y-2 text-xs md:text-sm text-amber-950 list-disc pl-5">
                          {readingReport.adviceList.map((adv, i) => (
                            <li key={i}>{adv}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      Bé chưa có lượt luyện đọc nào. Mời bé mở chuyên đề “Luyện Đọc” ở trang chủ và
                      đọc một đoạn văn ngắn để bắt đầu.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'competition' && (
                <div className="space-y-5">
                  {onOpenCompetitionReal && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenCompetitionReal();
                        onClose();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-2xl font-black text-sm shadow-md cursor-pointer"
                    >
                      Mở Đấu Trường Thi Thật (Trạng Nguyên)
                    </button>
                  )}
                  {/* Summary metric banner */}
                  {(() => {
                    const compStore = StorageService.getCompetitionHistory();
                    const exams = compStore.examResults;
                    const avgAcc =
                      exams.length > 0
                        ? Math.round(exams.reduce((sum, e) => sum + e.accuracy, 0) / exams.length)
                        : 0;

                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                            <span className="text-xs text-amber-700 font-bold block">Bài thi đã làm</span>
                            <span className="text-2xl font-black text-amber-950 font-display mt-0.5 block">
                              {exams.length} bài
                            </span>
                          </div>

                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                            <span className="text-xs text-emerald-700 font-bold block">Chính xác trung bình</span>
                            <span className="text-2xl font-black text-emerald-950 font-display mt-0.5 block">
                              {exams.length > 0 ? `${avgAcc}%` : 'Chưa thi'}
                            </span>
                          </div>

                          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl col-span-2 sm:col-span-1">
                            <span className="text-xs text-purple-700 font-bold block">Thử thách tốc độ</span>
                            <span className="text-2xl font-black text-purple-950 font-display mt-0.5 block">
                              {compStore.speedTrialsCompleted} lượt
                            </span>
                          </div>
                        </div>

                        {/* Recent Exam History */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-600" />
                            Nhật Ký Các Lần Thi Thử Của Bé
                          </h4>

                          {exams.length > 0 ? (
                            <div className="space-y-2">
                              {exams.map((ex, i) => (
                                <div
                                  key={i}
                                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800">{ex.examTitle}</span>
                                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-md font-semibold text-slate-600">
                                        {new Date(ex.timestamp).toLocaleDateString('vi-VN')}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500">
                                      Thời gian: {Math.floor(ex.timeUsedSeconds / 60)}m {ex.timeUsedSeconds % 60}s • {ex.speedLabel}
                                    </span>
                                  </div>

                                  <div className="text-right">
                                    <span className="font-black text-sm text-amber-900 block font-display">
                                      {ex.score}/10
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700">
                                      {ex.accuracy}% đúng
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">
                              Bé chưa tham gia bài thi thử nào trong Đấu Trường.
                            </p>
                          )}
                        </div>

                        {/* Psychological Guidance for Parents */}
                        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-1.5 text-xs text-sky-950">
                          <span className="font-black block text-sky-900">
                            💡 Định hướng thi thử lành mạnh cho học sinh lớp 1:
                          </span>
                          <p>
                            • Mục tiêu thi thử là giúp bé quen dần với dạng bài, rèn sự tập trung và biết cách phân bổ thời gian.
                          </p>
                          <p>
                            • Tuyệt đối không tạo áp lực điểm số hoặc so sánh thứ hạng với các bạn khác. Mỗi tiến bộ nhỏ của con đều đáng được ghi nhận!
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'kidbox' && (
                <KidBoxParentPanel onDataChanged={onDataReset} />
              )}

              {activeTab === 'settings' && (
                <div className="space-y-5">
                  {/* Daily Screen Time Limit */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h4 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Giới Hạn Thời Gian Học Hàng Ngày
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Khuyến nghị từ chuyên gia: Trẻ 6–7 tuổi chỉ nên học trên màn hình 15–20 phút/ngày để bảo vệ mắt.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {[10, 15, 20, 30, 0].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleUpdateLimit(mins)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            settings.dailyLimitMinutes === mins
                              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {mins === 0 ? 'Không giới hạn' : `${mins} phút`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sound & Voice Controls */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-indigo-600" />
                      Âm Thanh & Giọng Đọc
                    </h4>

                    <div className="flex items-center justify-between py-2 border-b border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Hiệu ứng âm thanh</span>
                        <span className="text-slate-500">Tiếng chuông khi trả lời đúng/sai</span>
                      </div>
                      <button
                        onClick={handleToggleSound}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                          settings.soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {settings.soundEnabled ? 'Bật' : 'Tắt'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Giọng đọc hỗ trợ (TTS)</span>
                        <span className="text-slate-500">Đọc to câu hỏi Tiếng Việt và Tiếng Anh</span>
                      </div>
                      <button
                        onClick={handleToggleVoice}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                          settings.voiceEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {settings.voiceEnabled ? 'Bật' : 'Tắt'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Tự đọc câu hỏi (§20)</span>
                        <span className="text-slate-500">
                          Mỗi câu hỏi mới tự đọc to cho bé nghe — cần thiết nếu bé chưa đọc thạo
                        </span>
                      </div>
                      <button
                        onClick={handleToggleAutoplay}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                          settings.questionAutoplay ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {settings.questionAutoplay ? 'Bật' : 'Tắt'}
                      </button>
                    </div>
                  </div>

                  {/* Night Mode (T03A) */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 text-purple-600" aria-hidden="true">🌙</span>
                      Chế Độ Ban Ngày / Ban Đêm
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Chế độ ban đêm dịu mắt cho bé học vào buổi tối. Tự động áp dụng khi bật.
                    </p>
                    <div className="flex items-center justify-between py-2 border-b border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Chế độ ban đêm</span>
                        <span className="text-slate-500">Nền tối, chữ sáng, giảm ánh sáng xanh</span>
                      </div>
                      <button
                        onClick={handleToggleNightMode}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                          settings.nightMode ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {settings.nightMode ? 'Bật' : 'Tắt'}
                      </button>
                    </div>
                  </div>

                  {/* Unlock All Lessons (T07) */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 text-emerald-600" aria-hidden="true">🔓</span>
                      Mở Khoá Tất Cả Bài Học
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Tạm thời mở tất cả bài học cho bé (bỏ qua gating theo thứ tự). Ảnh hưởng đến dữ liệu tiến độ thật.
                    </p>
                    <div className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Mở hết bài học</span>
                        <span className="text-slate-500">Bật/tắt theo ý phụ huynh</span>
                      </div>
                      <button
                        onClick={handleToggleUnlockAll}
                        data-testid="unlock-all-lessons-toggle"
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                          StorageService.getChildProfile().unlockAllLessons
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {StorageService.getChildProfile().unlockAllLessons ? 'Bật' : 'Tắt'}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                      <Timer className="w-5 h-5 text-amber-600" />
                      Cấu Hình Phiên Luyện Tập (Adaptive Learning)
                    </h4>
                    <p className="text-xs text-slate-500 mb-2">
                      Chọn độ dài mặc định của phiên học. Bé có thể chọn phiên ngắn hơn khi bắt đầu.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-slate-200 text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">Độ dài phiên mặc định</span>
                          <span className="text-slate-500">Số câu hỏi mỗi lần luyện tập</span>
                        </div>
                        <select
                          value={settings.defaultSessionProfile}
                          onChange={(e) => handleUpdateSessionProfile(e.target.value as SessionProfileKind)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-bold cursor-pointer"
                        >
                          <option value="QUICK">Nhanh (8-10 câu)</option>
                          <option value="STANDARD">Tiêu chuẩn (15-20 câu)</option>
                          <option value="DEEP">Sâu (25-30 câu)</option>
                          <option value="EXTENDED">Mở rộng (35-40 câu)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">Cho phép câu hỏi nâng cao (L4-L5)</span>
                          <span className="text-slate-500">Bật sau khi bé đã nắm vững cơ bản</span>
                        </div>
                        <button
                          onClick={handleToggleAdvancedQuestions}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                            settings.allowAdvancedQuestions ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {settings.allowAdvancedQuestions ? 'Bật' : 'Tắt'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">Cường độ ôn tập khoảng cách</span>
                          <span className="text-slate-500">Mức độ trộn câu hỏi ôn lại vào phiên</span>
                        </div>
                        <select
                          value={settings.reviewIntensity}
                          onChange={(e) => handleUpdateReviewIntensity(e.target.value as 'light' | 'standard' | 'intensive')}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-bold cursor-pointer"
                        >
                          <option value="light">Nhẹ (ít ôn tập hơn)</option>
                          <option value="standard">Tiêu chuẩn</option>
                          <option value="intensive">Tăng cường (nhiều ôn tập hơn)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">Cho phép nghỉ giải lao</span>
                          <span className="text-slate-500">Hiện nút tạm dừng trong phiên dài (không ép bé học liên tục)</span>
                        </div>
                        <button
                          onClick={handleToggleOptionalBreaks}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                            settings.optionalBreaks ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {settings.optionalBreaks ? 'Bật' : 'Tắt'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* T18C — Hệ Thống Động Lực: Shop, Máy Gắp, Phần Thưởng */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-amber-600" />
                      Hệ Thống Động Lực
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Kiểm soát lượt quay máy gắp, bật/tắt phần thưởng và xem lịch sử nhận thưởng.
                    </p>

                    <div className="flex items-center justify-between py-2 border-b border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Giới hạn lượt máy gắp/ngày</span>
                        <span className="text-slate-500">0 = không giới hạn (mặc định 5 lượt)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateMaxGachaPerDay(Math.max(0, settings.maxGachaPerDay - 1))}
                          disabled={settings.maxGachaPerDay <= 0}
                          className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Giảm giới hạn"
                        >
                          <span className="text-lg leading-none">−</span>
                        </button>
                        <span className="w-12 text-center font-bold text-slate-900">
                          {settings.maxGachaPerDay === 0 ? '∞' : settings.maxGachaPerDay}
                        </span>
                        <button
                          onClick={() => handleUpdateMaxGachaPerDay(settings.maxGachaPerDay + 1)}
                          className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                          aria-label="Tăng giới hạn"
                        >
                          <span className="text-lg leading-none">+</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Bật/Tắt Toàn Bộ Phần Thưởng</span>
                        <span className="text-slate-500">Sao, XP, vé, sticker, đồ Shop, quà level, quà nhiệm vụ</span>
                      </div>
                      <button
                        onClick={handleToggleRewardsEnabled}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                          settings.rewardsEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {settings.rewardsEnabled ? 'Bật' : 'Tắt'}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <h5 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                        <History className="w-3.5 h-3.5" /> Lịch Sử Phần Thưởng Gần Đây
                      </h5>
                      {settings.rewardHistory && settings.rewardHistory.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {settings.rewardHistory.slice(0, 20).map((entry, idx) => (
                            <div
                              key={`${entry.date}-${entry.type}-${idx}`}
                              className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-medium text-slate-700"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-800">{entry.date}</span>
                                <span className="text-slate-400">{entry.type}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <span>{entry.description}</span>
                                <span className="text-amber-700 font-black">+{entry.amount}</span>
                              </div>
                              {entry.itemId && (
                                <span className="text-[9px] text-slate-500">ID: {entry.itemId}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2 text-center">Chưa có lịch sử phần thưởng.</p>
                      )}
                    </div>
                  </div>

                  {/* Data & Safety Management */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-sm font-black text-slate-800 mb-2">Quản Lý Dữ Liệu</h4>

                    {resetSuccessMessage && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{resetSuccessMessage}</span>
                      </div>
                    )}

                    {showSeedConfirm ? (
                      <div className="p-3 bg-indigo-50 border border-indigo-300 rounded-xl text-xs space-y-2">
                        <p className="font-bold text-indigo-900">
                          ⚠️ Thao tác này sẽ GHI ĐÈ hồ sơ hiện tại bằng dữ liệu mẫu. Các số liệu mẫu sẽ
                          được ghi rõ là “dữ liệu thử nghiệm” trong mọi báo cáo để ba mẹ không bị nhầm
                          là tiến bộ thật của bé.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSeedDemoData}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Xác nhận nạp dữ liệu mẫu
                          </button>
                          <button
                            onClick={() => setShowSeedConfirm(false)}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {showResetConfirm ? (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs space-y-2">
                        <p className="font-bold text-rose-800">
                          ⚠️ Ba mẹ có chắc chắn muốn đặt lại toàn bộ tiến độ học tập của bé về ban đầu?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleConfirmReset}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Xác nhận đặt lại
                          </button>
                          <button
                            onClick={() => setShowResetConfirm(false)}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          onClick={handleExportData}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                          Xuất file (.json)
                        </button>

                        <button
                          onClick={() => setShowSeedConfirm(true)}
                          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 transition-all cursor-pointer"
                          title="Tạo hồ sơ học mẫu để xem đầy đủ biểu đồ và khuyến nghị sư phạm"
                        >
                          <BarChart3 className="w-4 h-4 text-indigo-500" />
                          Tạo dữ liệu thử nghiệm
                        </button>

                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 transition-all ml-auto cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Đặt lại tiến độ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
