import React, { useState } from 'react';
import { Lesson, Question } from '../../types';
import { getAllQuestions } from '../../data/curriculum';
import { sound } from '../../services/sound';
import { StorageService } from '../../services/storage';
import { LessonPlayerModal } from '../learning/LessonPlayerModal';
import { ArrowLeft, Trophy, Star, Sparkles, Flame, ShieldAlert, Award } from 'lucide-react';

interface WeeklyChallengeScreenProps {
  onBack: () => void;
  onProfileUpdate: () => void;
}

export const WeeklyChallengeScreen: React.FC<WeeklyChallengeScreenProps> = ({
  onBack,
  onProfileUpdate,
}) => {
  const profile = StorageService.getChildProfile();
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate 8 balanced cross-subject questions for the weekly battle
  const challengeQuestions: Question[] = React.useMemo(() => {
    const all = getAllQuestions();
    const viets = all.filter((q) => q.subject === 'tieng-viet');
    const maths = all.filter((q) => q.subject === 'toan');
    const engs = all.filter((q) => q.subject === 'english');

    return [
      ...viets.slice(0, 3),
      ...maths.slice(0, 3),
      ...engs.slice(0, 2),
    ];
  }, []);

  const challengeLesson: Lesson = {
    id: 'weekly-challenge-week-1',
    topicId: 'weekly-arena',
    subject: 'tieng-viet',
    title: 'Đấu Trường Trạng Nguyên Nhí — Tuần 1',
    description: 'Thử thách tổng hợp kiến thức Tiếng Việt, Toán và Tiếng Anh',
    mascotTip: 'Cú Thông Thái cổ vũ: Hãy tập trung tối đa để rinh Cúp Vàng Tuần nhé!',
    questions: challengeQuestions,
    xpReward: 100,
    starReward: 10,
  };

  const isCompletedThisWeek = profile.completedWeeklyChallenges.includes('weekly-challenge-week-1');

  const handleStart = () => {
    sound.playClick();
    setIsPlaying(true);
  };

  const handleComplete = () => {
    // T01/B10 — completing a weekly challenge unlocks ach_weekly_hero.
    StorageService.recordWeeklyChallengeCompleted('weekly-challenge-week-1');
    onProfileUpdate();
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

        <span className="text-xs font-black text-rose-800 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-rose-600" />
          <span>Thử Thách Tuần Này</span>
        </span>
      </div>

      {/* Hero Trophy Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-xl border-4 border-white/60 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center md:text-left">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center text-5xl md:text-6xl border-4 border-amber-200 animate-float shrink-0">
            🏆
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-rose-100">
              Đấu Trường Trí Tuệ Lớp 1
            </span>
            <h1 className="text-2xl md:text-3xl font-black font-display mt-0.5">
              Thử Thách Trạng Nguyên Tuần
            </h1>
            <p className="text-xs md:text-sm text-white/90 font-bold mt-1 max-w-md leading-relaxed">
              Vượt qua 8 câu hỏi kết hợp cả 3 môn học để rinh về Cúp Vàng Danh Dự và 10 Ngôi Sao lấp lánh!
            </p>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="px-6 py-3.5 bg-white hover:bg-amber-50 text-rose-950 font-black rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer shrink-0 font-display text-sm md:text-base"
        >
          <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
          <span>{isCompletedThisWeek ? 'Thi Lại Lấy Điểm Cao' : 'Bắt Đầu Thi Ngay!'}</span>
        </button>
      </div>

      {/* Reward Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border-2 border-amber-200 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">
            ⭐
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block">Phần thưởng Sao</span>
            <span className="text-lg font-black text-amber-900">+10 Sao Vàng</span>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-purple-200 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
            ✨
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block">Kinh nghiệm đạt được</span>
            <span className="text-lg font-black text-purple-900">+100 Điểm XP</span>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-emerald-200 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
            🏅
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block">Huy hiệu Vinh Danh</span>
            <span className="text-lg font-black text-emerald-900">Chiến Binh Tuần</span>
          </div>
        </div>
      </div>

      {/* Challenge Rules & Safety Notice */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-3 border-amber-200 space-y-3">
        <h3 className="text-base font-black text-slate-900 font-display">
          Luật Thi Đấu Lớp 1 Thân Thiện:
        </h3>
        <ul className="text-xs md:text-sm text-slate-600 font-medium space-y-2 list-disc pl-5 leading-relaxed">
          <li>Bài thi gồm 8 câu hỏi trắc nghiệm và sắp xếp chọn lọc.</li>
          <li>Không giới hạn áp lực thời gian: bé cứ bình tĩnh đọc kỹ và suy nghĩ.</li>
          <li>Có nút loa phát âm to rõ ràng cho từng câu hỏi.</li>
          <li>Bé có thể thi lại bất cứ lúc nào để cải thiện kỹ năng!</li>
        </ul>
      </div>

      {/* Player Modal */}
      {isPlaying && (
        <LessonPlayerModal
          lesson={challengeLesson}
          onClose={() => setIsPlaying(false)}
          onComplete={() => {
            handleComplete();
            setIsPlaying(false);
          }}
        />
      )}
    </div>
  );
};
