import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChildProfile } from '../../types';
import { StorageService } from '../../services/storage';
import { sound } from '../../services/sound';
import { localDateKey, parseDateKey, diffDateKeys } from '../../services/dateUtils';
import { ArrowLeft, Star, Flame, Shield, Award, Calendar, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { KidButton, KidCard, Pill, SectionTitle } from '../ui';

interface StreakCalendarScreenProps {
  profile: ChildProfile;
  onBack: () => void;
  onProfileUpdate: () => void;
}

const MILESTONES = [3, 7, 14, 30];
const VIETNAMESE_MONTHS = [
  'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
  'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
];
const VIETNAMESE_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const StreakCalendarScreen: React.FC<StreakCalendarScreenProps> = ({
  profile,
  onBack,
  onProfileUpdate,
}) => {
  const [motivation, setMotivation] = useState(StorageService.getMotivationState());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [showMilestone, setShowMilestone] = useState<number | null>(null);

  useEffect(() => {
    setMotivation(StorageService.getMotivationState());
  }, [profile.streak]);

  const today = localDateKey();
  const todayDate = parseDateKey(today);
  const streakDaysSet = new Set(motivation.streakDays);
  const shieldedDaysSet = new Set(motivation.shieldedDays);
  const shields = motivation.shields;

  const daysInMonth = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: (number | null)[] = [];

    // Previous month trailing days
    for (let i = startDay - 1; i >= 0; i -= 1) {
      days.push(prevMonthLastDay - i);
    }

    // Current month days
    for (let d = 1; d <= totalDays; d += 1) {
      days.push(d);
    }

    // Next month leading days
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d += 1) {
      days.push(d);
    }

    return { days, firstDay, lastDay, startDay, totalDays };
  }, [currentMonth]);

  const getDayKey = useCallback((day: number, isCurrentMonth: boolean) => {
    const { year, month } = currentMonth;
    const targetMonth = isCurrentMonth ? month : (day > 15 ? month - 1 : month + 1);
    const targetYear = targetMonth < 0 ? year - 1 : targetMonth > 11 ? year + 1 : year;
    const normalizedMonth = (targetMonth + 12) % 12;
    return `${targetYear}-${String(normalizedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, [currentMonth]);

  const isToday = useCallback((dayKey: string) => dayKey === today, [today]);

  const isStreakDay = useCallback((dayKey: string) => streakDaysSet.has(dayKey), [streakDaysSet]);
  const isShieldedDay = useCallback((dayKey: string) => shieldedDaysSet.has(dayKey), [shieldedDaysSet]);

  const handlePrevMonth = useCallback(() => {
    sound.playClick();
    setCurrentMonth((prev) => ({
      year: prev.month === 0 ? prev.year - 1 : prev.year,
      month: prev.month === 0 ? 11 : prev.month - 1,
    }));
  }, []);

  const handleNextMonth = useCallback(() => {
    sound.playClick();
    const maxMonth = todayDate ? { year: todayDate.getFullYear(), month: todayDate.getMonth() } : currentMonth;
    if (currentMonth.year < maxMonth.year || (currentMonth.year === maxMonth.year && currentMonth.month < maxMonth.month)) {
      setCurrentMonth((prev) => ({
        year: prev.month === 11 ? prev.year + 1 : prev.year,
        month: prev.month === 11 ? 0 : prev.month + 1,
      }));
    }
  }, [currentMonth, todayDate]);

  const handleMilestoneClose = useCallback((milestone: number) => {
    sound.playClick();
    setShowMilestone(null);
  }, []);

  const currentStreak = profile.streak;
  const streakBest = motivation.streakBest;
  const nextMilestone = MILESTONES.find((m) => m > currentStreak);
  const prevMilestone = [...MILESTONES].reverse().find((m) => m <= currentStreak);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-6 space-y-6 select-none">
      {/* Top Bar */}
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

        <div className="flex items-center gap-3">
          <Pill variant="streak" size="sm" icon="🔥">
            <span className="tabular-nums">{profile.streak}</span> Ngày
          </Pill>
          <Pill variant="star" size="sm" icon="⭐">
            <span className="tabular-nums">{profile.stars}</span> Sao
          </Pill>
        </div>
      </div>

      {/* Streak Header */}
      <KidCard subjectBorder="none" className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-wider text-amber-100/80">
                Lịch Chuỗi Ngày
              </span>
              <h1 className="text-3xl md:text-4xl font-black font-display mt-1">
                🐾 Dấu Chân Gấu Bút Chì
              </h1>
              <p className="text-amber-50 text-sm md:text-base font-bold mt-2 max-w-md">
                Mỗi ngày học để lại dấu chân. Nhìn thấy sự kiên trì của bé!
              </p>
            </div>

            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-2xl flex items-center justify-center text-5xl md:text-6xl animate-float-slow">
              🐻
            </div>
          </div>

          {/* Streak stats */}
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-3 mt-6 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 bg-white/20 border-white/30 rounded-xl px-4 py-2">
              <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
              <span className="font-black text-white">Chuỗi hiện tại: <span className="tabular-nums">{currentStreak}</span> ngày</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 border-white/30 rounded-xl px-4 py-2">
              <Award className="w-5 h-5 text-amber-300" />
              <span className="font-black text-white">Kỷ lục: <span className="tabular-nums">{streakBest}</span> ngày</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 border-white/30 rounded-xl px-4 py-2">
              <Shield className="w-5 h-5 text-amber-300" />
              <span className="font-black text-white">Khiên: <span className="tabular-nums">{shields}</span> / 2</span>
            </div>
          </div>
        </div>
      </KidCard>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <KidCard subjectBorder="none" className="space-y-3">
          <SectionTitle icon="🎯" size="md" className="mb-0">
            Mốc Tiếp Theo
          </SectionTitle>
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 max-w-xs">
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStreak / nextMilestone) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 font-bold text-center mt-1">
                {currentStreak} / {nextMilestone} ngày để nhận quà
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Award className="w-8 h-8 text-white" />
            </div>
          </div>
        </KidCard>
      )}

      {/* Calendar */}
      <KidCard subjectBorder="none" className="space-y-4">
        {/* Month header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-black font-display text-amber-950 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {VIETNAMESE_MONTHS[currentMonth.month]} {currentMonth.year}
          </h2>
          <div className="flex items-center gap-2">
            <KidButton
              variant="secondary"
              size="md"
              onClick={handlePrevMonth}
              disabled={!!(currentMonth.year < 2024 || (currentMonth.year === todayDate?.getFullYear() && currentMonth.month === 0))}
              aria-label="Tháng trước"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            />
            <KidButton
              variant="secondary"
              size="md"
              onClick={handleNextMonth}
              disabled={!!(todayDate && (currentMonth.year > todayDate.getFullYear() || (currentMonth.year === todayDate.getFullYear() && currentMonth.month >= todayDate.getMonth())))}
              aria-label="Tháng sau"
              rightIcon={<ChevronRight className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {VIETNAMESE_WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className="py-2 px-1 text-[11px] font-black uppercase text-slate-500"
              style={{ color: idx === 0 ? 'rgb(239 68 68)' : idx === 6 ? 'rgb(59 130 246)' : 'inherit' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;

            const isCurrentMonthDay = idx >= daysInMonth.startDay && idx < daysInMonth.startDay + daysInMonth.totalDays;
            const dayKey = getDayKey(day, isCurrentMonthDay);
            const dayDate = parseDateKey(dayKey);
            const isFuture = !!(dayDate && todayDate && dayDate > todayDate);
            const isStreak = isStreakDay(dayKey);
            const isShielded = isShieldedDay(dayKey);
            const isTodayDay = isToday(dayKey);

            const getDayClass = () => {
              if (!isCurrentMonthDay) return 'text-slate-300';
              if (isFuture) return 'text-slate-300';
              if (isTodayDay) return 'bg-amber-500 text-white';
              if (isStreak) return 'bg-emerald-100 text-emerald-900';
              if (isShielded) return 'bg-amber-100 text-amber-900';
              return 'text-slate-400';
            };

            return (
              <button
                key={dayKey}
                disabled={!isCurrentMonthDay || isFuture}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all min-h-[44px] ${
                  isCurrentMonthDay && !isFuture ? 'hover:shadow-md hover:scale-105 cursor-pointer' : 'cursor-default'
                } ${getDayClass()}`}
                onClick={() => {}}
                aria-label={isCurrentMonthDay ? `${day} ${VIETNAMESE_MONTHS[currentMonth.month]}: ${isStreak ? 'Đã học' : isShielded ? 'Đã dùng khiên' : 'Chưa học'}` : ''}
              >
                <span className="font-black text-base md:text-lg">{day}</span>

                {/* Paw print for streak days */}
                {isStreak && (
                  <span className="absolute bottom-1 text-xl animate-pop-in">🐾</span>
                )}

                {/* Shield icon for shielded days */}
                {isShielded && !isStreak && (
                  <span className="absolute bottom-1 text-lg">🛡️</span>
                )}

                {/* Today indicator */}
                {isTodayDay && isCurrentMonthDay && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-amber-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-amber-500" />
                  </span>
                )}

                {/* Weekend colors */}
                {idx % 7 === 0 && !isTodayDay && !isStreak && !isShielded && <span className="text-rose-500" />}
                {idx % 7 === 6 && !isTodayDay && !isStreak && !isShielded && <span className="text-blue-500" />}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">🐾</div>
            <span className="text-xs font-bold text-slate-600">Ngày đã học</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center text-lg">🛡️</div>
            <span className="text-xs font-bold text-slate-600">Ngày dùng khiên</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-600">Hôm nay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-slate-100 rounded-lg border border-slate-200" />
            <span className="text-xs font-bold text-slate-600">Chưa học</span>
          </div>
        </div>
      </KidCard>

      {/* Shield Info */}
      <KidCard subjectBorder="none" className="space-y-3 bg-amber-50 border-amber-200">
        <SectionTitle icon="🛡️" size="md" className="mb-0">
          Khiên Giữ Chuỗi
        </SectionTitle>
        <div className="flex items-center justify-center gap-4 text-center">
          <div className="flex-1">
            <div className="text-3xl font-black text-amber-700">{shields}</div>
            <div className="text-xs font-bold text-amber-600">Khiên Còn Lại</div>
          </div>
          <div className="w-px h-8 bg-amber-200" />
          <div className="flex-1">
            <div className="text-3xl font-black text-amber-700">{motivation.shieldsUsedTotal}</div>
            <div className="text-xs font-bold text-amber-600">Đã Dùng Tổng</div>
          </div>
          <div className="w-px h-8 bg-amber-200" />
          <div className="flex-1">
            <div className="text-3xl font-black text-amber-700">2</div>
            <div className="text-xs font-bold text-amber-600">Tối Đa/Tuần</div>
          </div>
        </div>
        <p className="text-xs text-amber-700 font-bold text-center">
          Mỗi tuần tự nhận 1 khiên (tối đa 2). Khiên vỡ thay bé khi nghỉ 1 ngày — bé không bị phạt vì bố mẹ bận!
        </p>
      </KidCard>

      {/* Milestone Rewards */}
      <KidCard subjectBorder="none" className="space-y-3">
        <SectionTitle icon="🏆" size="md">
          Quà Mốc Chuỗi Ngày
        </SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MILESTONES.map((milestone) => {
            const achieved = currentStreak >= milestone;
            const isCurrent = nextMilestone === milestone;
            const isPast = prevMilestone === milestone;

            return (
              <button
                key={milestone}
                onClick={() => {
                  sound.playClick();
                  if (achieved) setShowMilestone(milestone);
                }}
                disabled={!achieved}
                className={`p-4 rounded-2xl border-3 flex flex-col items-center text-center transition-all ${
                  achieved
                    ? isCurrent
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-white animate-pulse-subtle cursor-pointer shadow-lg'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900 cursor-pointer'
                    : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
                aria-label={achieved ? `Mốc ${milestone} ngày - đã đạt` : `Mốc ${milestone} ngày - cần ${milestone - currentStreak} ngày nữa`}
              >
                <div className="text-3xl mb-1">{achieved ? '🏆' : '🔒'}</div>
                <h4 className="font-black text-sm">{milestone} Ngày</h4>
                <p className="text-[10px] font-bold mt-1">
                  {achieved ? 'Đã nhận quà' : `Còn ${milestone - currentStreak} ngày`}
                </p>
              </button>
            );
          })}
        </div>
      </KidCard>

      {/* Milestone Modal */}
      {showMilestone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => handleMilestoneClose(showMilestone)}
          role="dialog"
          aria-modal="true"
          aria-label={`Quà mốc ${showMilestone} ngày`}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border-4 border-amber-200 animate-pop-in text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-2xl font-black font-display text-amber-950 mb-2">
              Mốc {showMilestone} Ngày!
            </h2>
            <p className="text-lg font-bold text-slate-700 mb-4">
              Bé đã kiên trì học liên tiếp {showMilestone} ngày!
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Award className="w-8 h-8 text-amber-500" />
              <span className="text-amber-700 font-black">Nhận quà đặc biệt!</span>
            </div>
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl mb-6">
              <p className="text-sm font-bold text-amber-800">
                🎁 Quà: Sao vàng + Sticker hiếm + Món Shop độc quyền
              </p>
            </div>
            <KidButton
              variant="primary"
              size="lg"
              onClick={() => handleMilestoneClose(showMilestone)}
              className="min-w-[160px]"
            >
              Tuyệt Vời!
            </KidButton>
          </div>
        </div>
      )}
    </div>
  );
};