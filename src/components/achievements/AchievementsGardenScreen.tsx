import React, { useState } from 'react';
import { Achievement, ChildProfile } from '../../types';
import { StorageService } from '../../services/storage';
import { localDateKey } from '../../services/dateUtils';
import { sound } from '../../services/sound';
import { fireCelebrationConfetti } from '../../services/confetti';
import { ArrowLeft, Trophy, Star, Sparkles, Droplets, CheckCircle } from 'lucide-react';

interface AchievementsGardenScreenProps {
  onBack: () => void;
  onProfileUpdate: () => void;
}

export const AchievementsGardenScreen: React.FC<AchievementsGardenScreenProps> = ({
  onBack,
  onProfileUpdate,
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>(StorageService.getAchievements());
  const [profile, setProfile] = useState<ChildProfile>(StorageService.getChildProfile());
  const [waterCount, setWaterCount] = useState(0);
  // T01B/10 — confetti tưới cây tối đa 1 lần/ngày (giờ VN/máy qua localDateKey).
  const [wateredToday, setWateredToday] = useState(
    () => StorageService.getTreeWateredDate() === localDateKey()
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleWaterTree = () => {
    const today = localDateKey();
    if (StorageService.getTreeWateredDate() === today) {
      // Đã tưới hôm nay: vẫn vui (âm thanh + lời khen) nhưng KHÔNG confetti.
      sound.playStar();
      setWateredToday(true);
      sound.speak('Hôm nay bé đã tưới cây rồi! Ngày mai mình tưới tiếp nhé!');
      return;
    }
    sound.playStar();
    fireCelebrationConfetti();
    StorageService.setTreeWateredDate(today);
    setWateredToday(true);
    setWaterCount((c) => c + 1);
    sound.speak('Cây tri thức lớn thêm một chút rồi! Bé chăm chỉ quá!');
  };

  // T01/B13 — Tree growth stage based on completed lessons.
  // 0 lessons MUST show "Hạt giống" (previously even 0 showed "Đang Nở Hoa").
  const lessonCount = profile.completedLessons.length;
  const treeStageInfo =
    lessonCount <= 0
      ? { stage: 1, emoji: '🌱', label: 'Hạt giống' }
      : lessonCount <= 2
      ? { stage: 2, emoji: '🌿', label: 'Nảy mầm' }
      : lessonCount <= 4
      ? { stage: 3, emoji: '🌱', label: 'Cây non' }
      : lessonCount <= 7
      ? { stage: 4, emoji: '🌳', label: 'Cây lớn' }
      : { stage: 5, emoji: '🌲', label: 'Đang Nở Hoa 🌸' };
  const treeEmoji = treeStageInfo.emoji;

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

        <span className="text-xs font-black text-emerald-900 bg-emerald-100/80 px-4 py-1.5 rounded-full border border-emerald-300">
          Đã mở khóa: {unlockedCount} / {achievements.length} Huy Hiệu
        </span>
      </div>

      {/* The Magic Knowledge Tree Garden */}
      <div className="bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-100 rounded-3xl p-6 md:p-8 text-slate-800 shadow-xl border-4 border-emerald-300 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col items-center md:items-start text-center md:text-left z-10">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
            Khu Vườn Tri Thức Của Bé
          </span>
          <h1 className="text-2xl md:text-3xl font-black font-display text-emerald-950 mt-1">
            Cây Tri Thức Càng Học Càng Lớn
          </h1>
          <p className="text-xs md:text-sm text-emerald-900 font-bold mt-1 max-w-md">
            Mỗi bài học hoàn thành là một giọt nước mát lành nuôi dưỡng cây tri thức nở hoa thơm trái ngọt!
          </p>

          <button
            onClick={handleWaterTree}
            className="mt-4 px-5 min-h-[44px] py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs md:text-sm rounded-2xl shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer font-display"
          >
            <Droplets className="w-4 h-4" />
            <span>{wateredToday ? 'Đã tưới hôm nay 💧' : `Tưới Nước Cho Cây${waterCount > 0 ? ` (${waterCount} lần)` : ''}`}</span>
          </button>
        </div>

        {/* Tree Graphic */}
        <div className="flex flex-col items-center justify-center p-4 bg-white/60 rounded-3xl border-2 border-emerald-200 shadow-inner z-10 shrink-0 min-w-[200px]">
          <span className="text-7xl md:text-8xl animate-bounce mb-2">{treeEmoji}</span>
          <span className="text-xs font-black text-emerald-950 font-display">
            Cây Cấp {treeStageInfo.stage}: {treeStageInfo.label}
          </span>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5">
            {lessonCount} bài học tích lũy
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-3 border-amber-200 space-y-4">
        <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span>Bộ Sưu Tập Huy Hiệu Vinh Danh</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                ach.unlocked
                  ? 'bg-amber-50/60 border-amber-300 shadow-md'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-2 ${
                  ach.unlocked ? 'bg-white shadow-sm border border-amber-200' : 'bg-slate-200 grayscale'
                }`}
              >
                {ach.icon}
              </div>

              <h3 className="text-xs md:text-sm font-black text-slate-900 font-display">
                {ach.title}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                {ach.description}
              </p>

              <div className="mt-3 pt-2 border-t border-slate-200/60 w-full flex items-center justify-center gap-1 text-[11px] font-black">
                {ach.unlocked ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Đã đạt
                  </span>
                ) : (
                  <span className="text-purple-700 flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" />
                    +{ach.xpReward} XP
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
