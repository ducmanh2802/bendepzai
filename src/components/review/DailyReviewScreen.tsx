import React, { useState } from 'react';
import { Lesson, Question } from '../../types';
import { AdaptiveService, SmartReviewSet } from '../../services/adaptive';
import { StorageService } from '../../services/storage';
import { sound } from '../../services/sound';
import { LessonPlayerModal } from '../learning/LessonPlayerModal';
import { ArrowLeft, Lightbulb, Play, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface DailyReviewScreenProps {
  onBack: () => void;
  onProfileUpdate: () => void;
}

export const DailyReviewScreen: React.FC<DailyReviewScreenProps> = ({
  onBack,
  onProfileUpdate,
}) => {
  const [reviewSet, setReviewSet] = useState<SmartReviewSet>(AdaptiveService.generateDailyReview());
  const [isReviewing, setIsReviewing] = useState(false);

  const handleStartReview = () => {
    sound.playClick();
    setIsReviewing(true);
  };

  const handleRegenerate = () => {
    sound.playClick();
    setReviewSet(AdaptiveService.generateDailyReview());
    sound.speak('Đã tạo một bộ câu hỏi ôn tập mới cho bé!');
  };

  // Convert review set into a temporary Lesson for LessonPlayerModal
  const reviewLesson: Lesson = {
    id: `daily-review-${Date.now()}`,
    topicId: 'adaptive-review',
    subject: 'tieng-viet',
    title: 'Ôn Tập Thông Minh Hôm Nay',
    description: 'Rèn luyện các câu hỏi dựa trên lịch sử làm bài của bé',
    mascotTip: 'Bé hãy bình tĩnh đọc kỹ từng câu để ghi nhớ lâu hơn nhé!',
    questions: reviewSet.questions,
    xpReward: 50,
    starReward: 5,
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 select-none">
      {/* Top Bar with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-4 min-h-[44px] py-2 bg-white hover:bg-amber-50 border-2 border-amber-300 rounded-2xl font-bold text-xs md:text-sm text-amber-950 transition-all active:scale-95 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang Chủ</span>
        </button>

        <button
          onClick={handleRegenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới bộ câu hỏi</span>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-3xl p-6 md:p-8 text-amber-950 shadow-xl border-4 border-amber-300 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center md:text-left">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center text-5xl border-4 border-amber-200 animate-float shrink-0">
            💡
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">
              Lộ Trình Cá Nhân Hóa Lớp 1
            </span>
            <h1 className="text-2xl md:text-3xl font-black font-display mt-0.5">
              Ôn Tập Thông Minh Hôm Nay
            </h1>
            <p className="text-xs md:text-sm text-amber-950/80 font-bold mt-1 max-w-md leading-relaxed">
              Hệ thống tự động chọn lọc các câu hỏi cần ôn lại để bé nhớ sâu, không quên bài!
            </p>
          </div>
        </div>

        <button
          onClick={handleStartReview}
          className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm md:text-base shadow-lg hover:shadow-xl transition-transform active:scale-95 flex items-center gap-2 cursor-pointer shrink-0 font-display"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Bắt đầu ôn tập ({reviewSet.questions.length} câu)</span>
        </button>
      </div>

      {/* Mastery Status Ticker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Needs review */}
        <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-lg">
            🔴
          </div>
          <div>
            <span className="text-xs text-rose-700 font-bold block">Kỹ năng cần ôn lại</span>
            <span className="text-xl font-black text-rose-950">
              {reviewSet.weakCount} kỹ năng
            </span>
          </div>
        </div>

        {/* Practicing */}
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-lg">
            🟡
          </div>
          <div>
            <span className="text-xs text-amber-700 font-bold block">Đang rèn luyện</span>
            <span className="text-xl font-black text-amber-950">
              {reviewSet.practicingCount} kỹ năng
            </span>
          </div>
        </div>

        {/* Mastered */}
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-lg">
            🟢
          </div>
          <div>
            <span className="text-xs text-emerald-700 font-bold block">Đã nắm vững vàng</span>
            <span className="text-xl font-black text-emerald-950">
              {reviewSet.masteredCount} kỹ năng
            </span>
          </div>
        </div>
      </div>

      {/* Selected Questions Preview */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-3 border-amber-200 space-y-4">
        <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
          <span>📋</span> Danh Sách Câu Hỏi Ôn Luyện Hôm Nay
        </h3>

        <div className="space-y-3">
          {reviewSet.questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-3.5 bg-amber-50/40 border border-amber-200 rounded-2xl flex items-center justify-between text-xs md:text-sm font-bold text-slate-800"
            >
              <div className="flex items-center gap-3 truncate">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-xs font-black shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate">{q.prompt}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 shrink-0 uppercase">
                {q.subject}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleStartReview}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 font-display"
        >
          <span>Luyện Tập Ngay Thôi Nào! ✨</span>
        </button>
      </div>

      {/* Player Modal */}
      {isReviewing && (
        <LessonPlayerModal
          lesson={reviewLesson}
          onClose={() => setIsReviewing(false)}
          onComplete={() => {
            // T01/B10 — a finished review counts toward ach_review_pro (5 days).
            StorageService.recordDailyReviewCompleted();
            // T18A — quest ôn tập + số câu đã ôn qua engine chung (không đếm trùng).
            StorageService.recordReviewQuestions(reviewSet.questions.length);
            onProfileUpdate();
          }}
        />
      )}
    </div>
  );
};
