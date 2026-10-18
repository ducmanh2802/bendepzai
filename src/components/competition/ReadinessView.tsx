import React from 'react';
import { ReadinessAssessment } from '../../types/competition';
import { Trophy, CheckCircle, Zap, Shield, Sparkles, BookOpen } from 'lucide-react';

interface ReadinessViewProps {
  readiness: ReadinessAssessment;
  onTakeMockExam: () => void;
}

export const ReadinessView: React.FC<ReadinessViewProps> = ({
  readiness,
  onTakeMockExam,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-amber-200/80 shadow-xs space-y-6">
      {/* Top Banner with Level */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 rounded-2xl border border-amber-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
            {readiness.overallLevel === 'READY_FOR_MOCK'
              ? '👑'
              : readiness.overallLevel === 'STRONG'
              ? '⭐'
              : readiness.overallLevel === 'PRACTICING'
              ? '🚀'
              : '🌱'}
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider block">
              Mức Độ Sẵn Sàng Chinh Phục
            </span>
            <h3 className="text-base md:text-xl font-black text-amber-950 font-display">
              {readiness.overallLabel}
            </h3>
          </div>
        </div>

        <button
          onClick={onTakeMockExam}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Trophy className="w-4 h-4" />
          <span>Vào Thi Thử Ngay</span>
        </button>
      </div>

      {/* 4 Pillars of Readiness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Knowledge */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600" />
              Kiến Thức & Chuẩn Xác
            </span>
            <span className="font-black text-sky-700">{readiness.knowledgeScore}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-700"
              style={{ width: `${readiness.knowledgeScore}%` }}
            />
          </div>
        </div>

        {/* Speed */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              Tốc Độ & Phản Xạ
            </span>
            <span className="font-black text-amber-700">{readiness.speedScore}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${readiness.speedScore}%` }}
            />
          </div>
        </div>

        {/* Consistency */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              Độ Ổn Định
            </span>
            <span className="font-black text-emerald-700">{readiness.consistencyScore}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${readiness.consistencyScore}%` }}
            />
          </div>
        </div>

        {/* Skill Coverage */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              Độ Bao Phủ Kỹ Năng
            </span>
            <span className="font-black text-indigo-700">{readiness.skillCoverageScore}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${readiness.skillCoverageScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
        <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Lời Khuyên Sư Phạm Cho Bé & Ba Mẹ
        </h4>
        <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
          {readiness.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-500 font-bold shrink-0">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
