import React, { useState, useEffect, useCallback } from 'react';
import { ActiveScreen, ChildProfile, DailyQuest, ReadingProfile, SubjectType } from '../../types';
import { sound } from '../../services/sound';
import { localDateKey } from '../../services/dateUtils';
import { fireCelebrationConfetti } from '../../services/confetti';
import { StorageService } from '../../services/storage';
import { GAMES_CATALOG } from '../../data/gamesCatalog';
import { NextBestActionCard } from '../learning/NextBestActionCard';
import { Star, Sparkles, Gift, Check, ArrowRight, BookOpen, Target, Trophy, Gamepad2, Sparkle, RotateCcw } from 'lucide-react';
import { KidButton, KidCard, Pill, SectionTitle } from '../ui';
import { CloudSyncBanner } from '../auth/CloudSyncBanner';
import type { DecisionRecommendation } from '../../types/decisionEngine';

interface HomeScreenProps {
  profile: ChildProfile;
  onNavigate: (screen: ActiveScreen) => void;
  onSelectSubject: (sub: SubjectType) => void;
  onOpenGames: () => void;
  onOpenDailyReview: () => void;
  onOpenWeeklyChallenge: () => void;
  onProfileUpdate: () => void;
}

interface SubjectCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  border: string;
  progressColor: string;
  variant: 'subject-viet' | 'subject-math' | 'subject-english' | 'subject-life';
  locked?: boolean;
  subjectType?: SubjectType; // Only for unlocked subjects
}

interface ShortcutCard {
  screen: ActiveScreen;
  label: string;
  icon: string;
  desc: string;
  gradient: string;
  border: string;
}

const SUBJECT_CARDS: readonly SubjectCard[] = [
  {
    id: 'tieng-viet',
    title: 'Tiếng Việt',
    subtitle: 'Chữ cái · Dấu thanh · Vần ghép · Đọc truyện',
    icon: '📚',
    gradient: 'from-amber-500 to-orange-500',
    border: 'border-amber-300',
    progressColor: 'amber',
    variant: 'subject-viet',
    subjectType: 'tieng-viet',
  },
  {
    id: 'toan',
    title: 'Toán Học',
    subtitle: 'Đếm số 0–100 · Cộng trừ · Hình học · Đo lường',
    icon: '🔢',
    gradient: 'from-blue-500 to-cyan-500',
    border: 'border-blue-300',
    progressColor: 'blue',
    variant: 'subject-math',
    subjectType: 'toan',
  },
  {
    id: 'english',
    title: 'Tiếng Anh',
    subtitle: 'Chữ cái · Số đếm · Màu sắc · Động vật',
    icon: '🇬🇧',
    gradient: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-300',
    progressColor: 'emerald',
    variant: 'subject-english',
    subjectType: 'english',
  },
  {
    id: 'em-cuoc-song',
    title: 'Em & Cuộc Sống',
    subtitle: 'Cảm xúc · An toàn · Kỹ năng sống · Nghệ thuật',
    icon: '💜',
    gradient: 'from-purple-500 to-violet-500',
    border: 'border-purple-300',
    progressColor: 'purple',
    variant: 'subject-life',
    locked: false,
    subjectType: 'cuoc-song',
  },
];

const SHORTCUT_CARDS: readonly ShortcutCard[] = [
  {
    screen: 'games',
    label: 'Trò Chơi',
    icon: '🎮',
    desc: `${GAMES_CATALOG.length} trò vui`,
    gradient: 'from-purple-500 to-indigo-600',
    border: 'border-purple-300',
  },
  {
    screen: 'reading_fluency',
    label: 'Luyện Đọc',
    icon: '📖',
    desc: 'Đọc trôi chảy',
    gradient: 'from-sky-500 to-cyan-600',
    border: 'border-sky-300',
  },
  {
    screen: 'english_ioe',
    label: 'Tiếng Anh IOE',
    icon: '🇬🇧',
    desc: 'Luyện IOE lớp 1',
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-300',
  },
  {
    screen: 'chess',
    label: 'Cờ Vua 3D',
    icon: '♟',
    desc: 'Đấu trí 3D siêu đẹp',
    gradient: 'from-amber-600 to-yellow-600',
    border: 'border-amber-300',
  },
  {
    screen: 'cotuong',
    label: 'Cờ Tướng',
    icon: '🪖',
    desc: 'Vương quốc cờ tướng',
    gradient: 'from-red-500 to-orange-600',
    border: 'border-red-300',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  onNavigate,
  onSelectSubject,
  onOpenGames,
  onOpenDailyReview,
  onOpenWeeklyChallenge,
  onProfileUpdate,
}) => {
  const [quests, setQuests] = useState<DailyQuest[]>(StorageService.getDailyQuests());
  const [reading, setReading] = useState<ReadingProfile>(() => StorageService.getReadingProfile());
  const [chestClaimed, setChestClaimed] = useState(
    profile.dailyChestClaimedDate === localDateKey()
  );
  const [nextBestAction, setNextBestAction] = useState<DecisionRecommendation | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(true);

  const completedQuestsCount = quests.filter((q) => q.completed).length;
  const canClaimChest = completedQuestsCount >= 3 && !chestClaimed;

  const handleClaimChest = useCallback(() => {
    if (!canClaimChest) return;
    // T18A — rương ngày qua storage chung (+10 sao, +50 XP, đếm rương + quest vui).
    if (!StorageService.claimDailyChest()) return;
    sound.playLevelUp();
    fireCelebrationConfetti();
    setChestClaimed(true);
    onProfileUpdate();
    sound.speak('Bé đã mở rương kho báu thành công! Nhận thêm mười sao vàng!');
  }, [canClaimChest, onProfileUpdate]);

  const playWelcomeVoice = useCallback(() => {
    sound.speak(`Xin chào ${profile.name}! Hôm nay mình tìm kho báu nào nào?`);
  }, [profile.name]);

  // Load next best action from DecisionEngine (async, non-blocking)
  useEffect(() => {
    let live = true;
    import('../../services/decisionEngine')
      .then((m) => {
        if (!live) return;
        try {
          const decision = m.DecisionEngine.decide();
          if (decision.nextBestAction) {
            setNextBestAction(decision.nextBestAction);
          }
        } catch {
          // Silently fail — the card is a recommendation, never a blocker
        } finally {
          setDecisionLoading(false);
        }
      })
      .catch(() => {
        if (live) setDecisionLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const handleNextBestAction = useCallback(() => {
    if (!nextBestAction?.launchRoute) return;
    sound.playClick();
    onNavigate(nextBestAction.launchRoute);
  }, [nextBestAction, onNavigate]);

  const handleShortcutClick = useCallback((screen: ActiveScreen) => {
    sound.playClick();
    onNavigate(screen);
  }, [onNavigate]);

  const handleSubjectClick = useCallback((subject: SubjectCard) => {
    if (subject.locked || !subject.subjectType) {
      sound.speak('Môn học này sắp mở. Bé hãy kiên nhẫn chờ nhé!');
      return;
    }
    sound.playClick();
    onSelectSubject(subject.subjectType);
  }, [onSelectSubject]);

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 md:py-6 space-y-5 sm:space-y-6 overflow-x-clip">
      {/* 1. HERO: Gấu Bút Chì (wave) + greeting bubble + 3 pills */}
      <div className="relative animate-gradient kb-hero-pattern bg-gradient-to-r from-amber-700 via-orange-700 to-rose-700 rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl text-white overflow-hidden border-4 border-amber-200">
        {/* Background decorative shapes */}
        <div className="absolute top-2 right-4 text-6xl opacity-20 pointer-events-none animate-pulse-slow">✨</div>
        <div className="absolute -bottom-4 -left-4 text-8xl opacity-15 pointer-events-none">⭐</div>

        {/* Side by side only from lg: at md (768px) the "Học tiếp" button cannot
            shrink (~360px), which left ~170px for the greeting (one word per line). */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5">
          {/* Left: Mascot + Greeting + Stats */}
          {/* min-w-0 flex-1: next to the "Học tiếp" button (lg+) this block takes
              the remaining width instead of being squeezed. */}
          <div className="min-w-0 flex-1 flex flex-col min-[340px]:flex-row items-center gap-4 md:gap-5 text-center min-[340px]:text-left md:text-left">
            {/* Mascot Avatar with wave pose */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-white/95 rounded-3xl shadow-xl flex items-center justify-center text-5xl sm:text-6xl md:text-7xl border-4 border-amber-200 animate-float">
                {profile.avatarBase === 'bear' ? '🐻' : profile.avatarBase === 'fox' ? '🦊' : '🐰'}
              </div>
              {/* Wave animation indicator */}
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs animate-bounce" aria-hidden="true">👋</span>
              <span className="absolute -top-1 -left-1 px-2 py-0.5 bg-amber-900 text-amber-100 text-[9px] font-black rounded-full shadow-sm">
                Lớp 1
              </span>
            </div>

            {/* min-w-0: the greeting column may shrink next to the mascot; the
                speaker is a fixed 44px icon button (size "md" carried 24px side
                padding and squeezed "Chào Bé Minh!" to one word per line). */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="min-w-0 text-2xl md:text-3xl leading-tight font-black font-display tracking-tight text-white drop-shadow-sm [overflow-wrap:anywhere]">
                  Chào {profile.name}! 👋
                </h1>
                <KidButton
                  variant="secondary"
                  size="icon"
                  className="shrink-0"
                  onClick={playWelcomeVoice}
                  aria-label="Nghe lời chào"
                  leftIcon="🔊"
                />
              </div>

              <p className="text-amber-50 text-xs md:text-sm font-bold mt-1 max-w-md">
                Hôm nay mình tìm kho báu nào nào?
              </p>

              {/* Stats pills */}
              <div className="flex flex-wrap items-center gap-2 mt-3 justify-center md:justify-start">
                <Pill variant="star" size="sm" icon="⭐">
                  <span className="tabular-nums">{profile.stars}</span> Sao
                </Pill>
                <Pill variant="streak" size="sm" icon="🔥">
                  Chuỗi <span className="tabular-nums">{profile.streak}</span> ngày
                </Pill>
                <Pill variant="ticket" size="sm" icon="🎟️">
                  <span className="tabular-nums">{profile.tickets}</span> Vé
                </Pill>
              </div>
            </div>
          </div>

          {/* Right: Giant "Học tiếp" button */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col items-stretch lg:items-end gap-2">
            <KidButton
              variant="primary"
              size="xl"
              fullWidth={false}
              className="min-h-[56px] md:min-h-[60px] min-w-[200px] text-base md:text-lg font-black gap-2 animate-pulse-subtle"
              onClick={handleNextBestAction}
              disabled={decisionLoading || !nextBestAction?.launchRoute}
              rightIcon={<ArrowRight className="w-6 h-6" />}
              aria-label={nextBestAction ? `Bắt đầu: ${nextBestAction.title}` : 'Đang tải gợi ý...'}
            >
              {decisionLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Đang tải...
                </span>
              ) : nextBestAction ? (
                <>
                  ▶ {nextBestAction.title}
                </>
              ) : (
                'Học tiếp'
              )}
            </KidButton>
            {/* "Vì sao?" link to Parent Dashboard */}
            {nextBestAction && (
              <button
                onClick={() => {
                  sound.playClick();
                  onNavigate('home'); // Parent modal will be opened from header
                }}
                // T20A / B-07 — 00_RULES §7: every tappable target ≥ 44px.
                // This text link was 16px tall (min-w/44 + py-1 keeps the
                // inline look while giving the finger a real target).
                className="min-h-[44px] px-1 py-2 inline-flex items-center text-xs md:text-sm font-bold text-amber-100 hover:text-white underline underline-offset-2"
                aria-label="Xem lý do gợi ý này ở Bảng Phụ Huynh"
              >
                Vì sao gợi ý này?
              </button>
            )}
            {decisionLoading && (
              <p className="text-amber-50 text-[11px] font-medium text-center lg:text-right">
                Đang tìm hoạt động tốt nhất cho bé...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Sync & Google Account Banner (prominent on Home Screen) */}
      <CloudSyncBanner profile={profile} />

      {/* 2. 4 SUBJECT CARDS with progress rings */}
      <div>
        <SectionTitle icon="🎯" size="lg">
          Hôm Nay Bé Học Gì?
        </SectionTitle>

        {/* Mobile: 2 equal columns (grid-cols-2 = repeat(2, minmax(0, 1fr))).
            Cards use KidButton size "tile": explicit 12px padding on phones
            (size "lg" forced 32px side padding, leaving ~90px for content at
            375px) and content stretched to the card width instead of centred,
            so nothing can spill over both edges into the neighbouring card. */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {SUBJECT_CARDS.map((subject) => (
            <KidButton
              key={subject.id}
              variant={subject.variant}
              size="tile"
              fullWidth
              className={`min-h-[140px] md:min-h-[150px] text-left ${
                subject.locked ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              onClick={() => handleSubjectClick(subject)}
              disabled={subject.locked}
              aria-disabled={subject.locked}
            >
              {/* Label + icon share the first row; the title gets the full card
                  width below them, so "Tiếng Việt" / "Toán Học" stay on one line
                  on a 360px phone instead of being squeezed next to the icon.
                  T20A / B-08 — `min-w-0` lets the label shrink below its
                  longest word (it used to push the cards wider than 360px). */}
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 text-[10px] sm:text-[11px] uppercase font-black tracking-wide sm:tracking-widest text-white/80">
                  Môn Học Lớp 1
                </span>
                <span className="text-3xl sm:text-4xl md:text-5xl leading-none group-hover:scale-110 transition-transform shrink-0" aria-hidden="true">{subject.icon}</span>
              </div>
              <h3 className="text-lg sm:text-xl leading-tight font-black font-display mt-1 [overflow-wrap:anywhere]">
                {subject.title}
                {subject.locked && (
                  <span className="inline-block ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">🔒 Sắp mở</span>
                )}
              </h3>

              <div className="mt-auto pt-2">
                <p className="text-xs leading-snug text-white/90 font-bold mb-2 line-clamp-3 sm:line-clamp-none [overflow-wrap:anywhere]">{subject.subtitle}</p>
                {/* Progress ring placeholder */}
                <div className="flex items-center gap-2">
                  <div className="relative w-11 h-11 sm:w-14 sm:h-14 flex-shrink-0" aria-hidden="true">
                    <svg className="w-11 h-11 sm:w-14 sm:h-14 transform -rotate-90" viewBox="0 0 28 28">
                      <circle
                        cx="14"
                        cy="14"
                        r="12"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeOpacity="0.2"
                      />
                      <circle
                        cx="14"
                        cy="14"
                        r="12"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeDasharray="75.4"
                        strokeDashoffset="37.7"
                        strokeLinecap="round"
                        className="text-white"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                      50%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: '50%' }}
                      />
                    </div>
                    <p className="text-[10px] leading-tight text-white/80 font-bold mt-1">Tiến độ: 50%</p>
                  </div>
                </div>
              </div>
            </KidButton>
          ))}
        </div>
      </div>

      {/* 3. "NHIỆM VỤ HÔM NAY" - 3 round quest icons + treasure chest */}
      <KidCard subjectBorder="none" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <SectionTitle icon="🎯" size="md" className="mb-0">
              Nhiệm Vụ Hôm Nay
            </SectionTitle>
            <p className="text-xs text-slate-500 font-bold">
              Hoàn thành 3 nhiệm vụ để mở Rương Kho Báu (+10 Sao, +50 XP)!
            </p>
          </div>

          {/* Treasure chest button */}
          <KidButton
            variant={chestClaimed ? 'secondary' : canClaimChest ? 'primary' : 'secondary'}
            size="md"
            disabled={!canClaimChest && chestClaimed}
            className={`min-h-[44px] ${chestClaimed ? '' : canClaimChest ? 'animate-bounce' : 'opacity-60 cursor-not-allowed'}`}
            leftIcon={<Gift className="w-5 h-5" />}
            onClick={handleClaimChest}
          >
            {chestClaimed
              ? 'Đã Nhận Rương'
              : canClaimChest
              ? 'Mở Rương Kho Báu!'
              : `Mở Rương (${completedQuestsCount}/3)`}
          </KidButton>
        </div>

        {/* Quest icons row - exactly 3 round icons + chest. A 4-column grid of
            square cells (max 96px): four fixed 80px tiles + gaps (356px) were
            wider than the card on a 360px phone and spilled out on both sides. */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-md mx-auto">
          {quests.slice(0, 3).map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {}}
              disabled={q.completed}
              className={`relative w-full max-w-24 aspect-square mx-auto min-w-0 flex flex-col items-center justify-center gap-1 rounded-2xl border-3 transition-all ${
                q.completed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 cursor-default'
                  : 'bg-amber-50 border-amber-200 text-slate-700 hover:border-amber-400 hover:shadow-md cursor-pointer'
              }`}
              aria-label={q.completed ? `Nhiệm vụ ${idx + 1}: ${q.title} - đã hoàn thành` : `Nhiệm vụ ${idx + 1}: ${q.title}`}
            >
              <span className="text-2xl min-[400px]:text-3xl md:text-4xl leading-none" aria-hidden="true">
                {q.completed ? '✅' : idx === 0 ? '📚' : idx === 1 ? '🎮' : '📖'}
              </span>
              <span className="max-w-full text-[10px] md:text-[11px] font-black text-center leading-tight px-1 [overflow-wrap:anywhere]">
                {q.title.length > 10 ? q.title.slice(0, 10) + '…' : q.title}
              </span>
              <Pill variant="star" size="xs" className="absolute -top-1 -right-1">
                <span className="text-[9px]">+{q.rewardStars}</span>
              </Pill>
            </button>
          ))}
          {/* Treasure chest as 4th item when all 3 done or always show */}
          <button
            onClick={handleClaimChest}
            disabled={!canClaimChest || chestClaimed}
            className={`relative w-full max-w-24 aspect-square mx-auto min-w-0 flex flex-col items-center justify-center gap-1 rounded-2xl border-3 transition-all ${
              chestClaimed
                ? 'bg-amber-50 border-amber-200 text-slate-500 cursor-default'
                : canClaimChest
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-white animate-bounce cursor-pointer shadow-lg hover:shadow-xl'
                : 'bg-amber-50 border-amber-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
            aria-label={chestClaimed ? 'Rương kho báu đã nhận hôm nay' : canClaimChest ? 'Mở rương kho báu nhận thưởng' : `Rương kho báu - cần ${3 - completedQuestsCount} nhiệm vụ nữa`}
          >
            <span className="text-2xl min-[400px]:text-3xl md:text-4xl leading-none" aria-hidden="true">
              {chestClaimed ? '🎁' : canClaimChest ? '🧨' : '🔒'}
            </span>
            <span className="max-w-full text-[10px] md:text-[11px] font-black text-center leading-tight px-1 [overflow-wrap:anywhere]">
              {chestClaimed ? 'Đã mở' : 'Rương'}
            </span>
            {!chestClaimed && canClaimChest && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-[9px] font-black animate-pulse">
                +
              </span>
            )}
          </button>
        </div>
      </KidCard>

      {/* 4. HORIZONTAL 3 SHORTCUTS: Trò chơi · Luyện đọc · Thử thách tuần */}
      <div>
        <SectionTitle icon="⚡" size="md">
          Lối Tắt Nhanh
        </SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mt-3">
          {SHORTCUT_CARDS.map((shortcut) => (
            <KidButton
              key={shortcut.screen}
              variant="primary"
              size="tile"
              fullWidth
              className={`min-h-[100px] text-center bg-gradient-to-br ${shortcut.gradient} ${shortcut.border} border-3 hover:scale-[1.02] active:scale-95 text-white`}
              onClick={() => handleShortcutClick(shortcut.screen)}
            >
              <div className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0">
                <span className="text-2xl min-[400px]:text-3xl md:text-4xl leading-none" aria-hidden="true">{shortcut.icon}</span>
                <h4 className="font-black text-sm md:text-base leading-tight font-display [overflow-wrap:anywhere]">{shortcut.label}</h4>
                <p className="text-[11px] leading-snug font-semibold opacity-90 [overflow-wrap:anywhere]">{shortcut.desc}</p>
              </div>
            </KidButton>
          ))}
        </div>
      </div>

      {/* 5. HỆ THỐNG ĐỘNG LỨC: Album · Máy Gắp · Lịch Chuỗi */}
      <div>
        <SectionTitle icon="🎁" size="md">
          Hệ Thống Động Lực
        </SectionTitle>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <KidButton
            variant="primary"
            size="tile"
            fullWidth
            className="min-h-[100px] text-center bg-gradient-to-br from-amber-500 to-orange-500 border-3 border-amber-300 hover:scale-[1.02] active:scale-95 text-white"
            onClick={() => onNavigate('sticker_album')}
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0">
              <span className="text-2xl min-[400px]:text-3xl md:text-4xl leading-none" aria-hidden="true">📚</span>
              <h4 className="font-black text-sm md:text-base leading-tight font-display [overflow-wrap:anywhere]">Bộ Sưu Tập Sticker</h4>
              <p className="text-[11px] leading-snug font-semibold opacity-90 [overflow-wrap:anywhere]">Sưu tầm 60 sticker</p>
            </div>
          </KidButton>
          <KidButton
            variant="primary"
            size="tile"
            fullWidth
            className="min-h-[100px] text-center bg-gradient-to-br from-rose-500 to-pink-500 border-3 border-rose-300 hover:scale-[1.02] active:scale-95 text-white"
            onClick={() => onNavigate('gacha_machine')}
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0">
              <span className="text-2xl min-[400px]:text-3xl md:text-4xl leading-none" aria-hidden="true">🎰</span>
              <h4 className="font-black text-sm md:text-base leading-tight font-display [overflow-wrap:anywhere]">Máy Gắp</h4>
              <p className="text-[11px] leading-snug font-semibold opacity-90 [overflow-wrap:anywhere]">Dùng vé quay sticker</p>
            </div>
          </KidButton>
          <KidButton
            variant="primary"
            size="tile"
            fullWidth
            className="min-h-[100px] text-center bg-gradient-to-br from-emerald-500 to-teal-500 border-3 border-emerald-300 hover:scale-[1.02] active:scale-95 text-white"
            onClick={() => onNavigate('streak_calendar')}
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0">
              <span className="text-2xl min-[400px]:text-3xl md:text-4xl leading-none" aria-hidden="true">📅</span>
              <h4 className="font-black text-sm md:text-base leading-tight font-display [overflow-wrap:anywhere]">Lịch Chuỗi</h4>
              <p className="text-[11px] leading-snug font-semibold opacity-90 [overflow-wrap:anywhere]">Dấu chân Gấu Bút Chì</p>
            </div>
          </KidButton>
        </div>
      </div>

      {/* 6. NEXT BEST ACTION CARD (from DecisionEngine) - compact version for Home */}
      <NextBestActionCard onNavigate={onNavigate} />

      {/* 6. DAILY QUESTS LIST (compact, below the fold on mobile) */}
      <KidCard subjectBorder="none" className="space-y-3">
        <SectionTitle icon="📋" size="md">
          Danh Sách Nhiệm Vụ
        </SectionTitle>
        <div className="space-y-2">
          {quests.map((q) => (
            <div
              key={q.id}
              className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
                q.completed
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/40 border-amber-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    q.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {q.completed ? <Check className="w-4 h-4" /> : '•'}
                </div>
                <span className="text-xs font-bold">{q.title}</span>
              </div>

              <Pill variant="star" size="sm" className="gap-1">
                <span>+{q.rewardStars}</span>
              </Pill>
            </div>
          ))}
        </div>
      </KidCard>
    </div>
  );
};