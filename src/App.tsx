import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ActiveScreen, ChildProfile, SubjectType } from './types';
import { StorageService } from './services/storage';
import { Header } from './components/common/Header';
import { HomeScreen } from './components/home/HomeScreen';
import { ChessScreen } from './components/learning/chess/ChessScreen';
import { CotuongScreen } from './components/learning/cotuong/CotuongScreen';
import { EnglishIoeScreen } from './components/learning/englishIoe/EnglishIoeScreen';
import { NAVIGATION } from './config/navigation';

/**
 * CODE SPLITTING (P31)
 *
 * The home screen is the first paint and stays in the main chunk.
 * Everything a child reaches later (world map, subject screens, review,
 * mini-games, the competition hub, reading fluency, parent mode, shops)
 * is loaded on demand so first render does not pay for the whole app.
 */
const WorldMapScreen = lazy(() =>
  import('./components/world/WorldMapScreen').then((m) => ({ default: m.WorldMapScreen }))
);
const SubjectScreen = lazy(() =>
  import('./components/subject/SubjectScreen').then((m) => ({ default: m.SubjectScreen }))
);
const DailyReviewScreen = lazy(() =>
  import('./components/review/DailyReviewScreen').then((m) => ({ default: m.DailyReviewScreen }))
);
const GamesHubScreen = lazy(() =>
  import('./components/games/GamesHubScreen').then((m) => ({ default: m.GamesHubScreen }))
);
const WeeklyChallengeScreen = lazy(() =>
  import('./components/challenge/WeeklyChallengeScreen').then((m) => ({ default: m.WeeklyChallengeScreen }))
);
const AchievementsGardenScreen = lazy(() =>
  import('./components/achievements/AchievementsGardenScreen').then((m) => ({ default: m.AchievementsGardenScreen }))
);
const AvatarShopScreen = lazy(() =>
  import('./components/shop/AvatarShopScreen').then((m) => ({ default: m.AvatarShopScreen }))
);
const CompetitionHubScreen = lazy(() =>
  import('./components/competition/CompetitionHubScreen').then((m) => ({ default: m.CompetitionHubScreen }))
);
const ReadingFluencyScreen = lazy(() =>
  import('./components/reading/ReadingFluencyScreen').then((m) => ({ default: m.ReadingFluencyScreen }))
);
/** Kid's Box Companion (British English) — loaded on demand like the other tracks. */
const KidBoxCompanionScreen = lazy(() =>
  import('./components/english/KidBoxCompanionScreen').then((m) => ({ default: m.KidBoxCompanionScreen }))
);
const ParentDashboardModal = lazy(() =>
  import('./components/parent/ParentDashboardModal').then((m) => ({ default: m.ParentDashboardModal }))
);
const ScreenTimeModal = lazy(() =>
  import('./components/parent/ScreenTimeModal').then((m) => ({ default: m.ScreenTimeModal }))
);
const UpdateBanner = lazy(() =>
  import('./components/system/UpdateBanner').then((m) => ({ default: m.UpdateBanner }))
);

/** T18B — Motivation UI screens (lazy loaded). */
const StickerAlbumScreen = lazy(() =>
  import('./components/motivation/StickerAlbumScreen').then((m) => ({ default: m.StickerAlbumScreen }))
);
const GachaMachineScreen = lazy(() =>
  import('./components/motivation/GachaMachineScreen').then((m) => ({ default: m.GachaMachineScreen }))
);
const StreakCalendarScreen = lazy(() =>
  import('./components/motivation/StreakCalendarScreen').then((m) => ({ default: m.StreakCalendarScreen }))
);
const LevelUpCelebrationModal = lazy(() =>
  import('./components/motivation/LevelUpCelebrationModal').then((m) => ({ default: m.LevelUpCelebrationModal }))
);

/** Accessible loading state for lazily loaded screens. */
const ScreenFallback: React.FC<{ label: string }> = ({ label }) => (
  <div
    role="status"
    aria-live="polite"
    className="w-full max-w-5xl mx-auto px-4 py-16 flex flex-col items-center gap-3 text-center"
  >
    <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-2xl">
      📚
    </div>
    <p className="text-sm font-bold text-slate-600">Đang mở {label}…</p>
  </div>
);

/** Quick-access destinations for the sticky bottom navigation bar (T06). */
const BOTTOM_NAV = NAVIGATION;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('home');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('tieng-viet');
  const [profile, setProfile] = useState<ChildProfile>(StorageService.getChildProfile());
  const [competitionStartMode, setCompetitionStartMode] = useState<'kid' | 'real'>('kid');

  // Night mode — apply data-theme="night" to document root
  useEffect(() => {
    const settings = StorageService.getParentSettings();
    if (settings.nightMode) {
      document.documentElement.setAttribute('data-theme', 'night');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [profile]); // re-run when profile changes (parent settings may have changed)

  // Parent modal state
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  // Screen time tracking
  const [isScreenTimeAlertOpen, setIsScreenTimeAlertOpen] = useState(false);
  const [minutesSpentToday, setMinutesSpentToday] = useState(
    StorageService.getAnalytics().minutesToday
  );

  // Screen time interval tracker (1 min ticks)
  useEffect(() => {
    const timer = setInterval(() => {
      StorageService.addMinutesSpent(1);
      const analytics = StorageService.getAnalytics();
      const settings = StorageService.getParentSettings();
      setMinutesSpentToday(analytics.minutesToday);

      if (
        settings.dailyLimitMinutes > 0 &&
        analytics.minutesToday >= settings.dailyLimitMinutes &&
        !isScreenTimeAlertOpen
      ) {
        setIsScreenTimeAlertOpen(true);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [isScreenTimeAlertOpen]);

  // T18B — Level up celebration modal state
  const [levelUpModal, setLevelUpModal] = useState<{
    isOpen: boolean;
    result: import('./services/storage').LevelClaimResult;
    currentLevel: number;
    levelTitle: string;
  }>({ isOpen: false, result: { claimed: [], stars: 0, tickets: 0, stickerIds: [] }, currentLevel: 1, levelTitle: '' });

  // Check for pending level rewards on profile change
  useEffect(() => {
    const motivation = StorageService.getMotivationState();
    const pending = StorageService.getLevelInfo().pending;
    if (pending.length > 0) {
      const levelInfo = StorageService.getLevelInfo();
      const rng = () => Math.random();
      const result = StorageService.claimLevelRewards(rng);
      if (result.claimed.length > 0) {
        setLevelUpModal({
          isOpen: true,
          result,
          currentLevel: levelInfo.level,
          levelTitle: levelInfo.title,
        });
        refreshProfile();
      }
    }
  }, [profile.xp]);

  const refreshProfile = () => {
    setProfile(StorageService.getChildProfile());
  };

  // T01B/4 — đổi màn hình cuộn về đầu trang (kẻo bé kẹt ở cuối trang cũ).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'instant' as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [currentScreen]);

  const handleSelectSubject = (sub: SubjectType) => {
    setSelectedSubject(sub);
    setCurrentScreen('subject');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-clip bg-gradient-to-b from-amber-50/60 via-orange-50/30 to-amber-100/40 text-slate-800 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        profile={profile}
        onOpenParent={() => setIsParentModalOpen(true)}
        onOpenShop={() => setCurrentScreen('avatar_shop')}
      />

      {/* Main Content Viewport */}
      {/* Below lg the fixed bottom nav covers the end of the page: keep its
          height + the safe-area inset free (pb-16 was shorter than the nav plus
          inset, and md:pb-6 left 768–1023px with 24px under a ~60px nav). */}
      <main className="flex-1 w-full max-w-full overflow-x-clip pb-[calc(var(--kb-bottom-nav-h)+env(safe-area-inset-bottom))] lg:pb-6">
        {currentScreen === 'home' && (
          <HomeScreen
            profile={profile}
            onNavigate={setCurrentScreen}
            onSelectSubject={handleSelectSubject}
            onOpenGames={() => setCurrentScreen('games')}
            onOpenDailyReview={() => setCurrentScreen('daily_review')}
            onOpenWeeklyChallenge={() => setCurrentScreen('weekly_challenge')}
            onProfileUpdate={refreshProfile}
          />
        )}

        {currentScreen === 'world_map' && (
          <WorldMapScreen
            onNavigate={setCurrentScreen}
            onSelectSubject={handleSelectSubject}
          />
        )}

        {currentScreen === 'subject' && (
          <SubjectScreen
            subject={selectedSubject}
            onBack={() => setCurrentScreen('world_map')}
            onProfileUpdate={refreshProfile}
            onOpenKidBox={() => setCurrentScreen('kidbox_companion')}
          />
        )}

        {currentScreen === 'kidbox_companion' && (
          <Suspense fallback={<ScreenFallback label="Kid's Box Companion" />}>
            <KidBoxCompanionScreen
              onBack={() => setCurrentScreen('subject')}
              onOpenParentMode={() => setIsParentModalOpen(true)}
            />
          </Suspense>
        )}

        {currentScreen === 'games' && (
          <Suspense fallback={<ScreenFallback label="Khu Trò Chơi" />}>
            <GamesHubScreen
              onBack={() => setCurrentScreen('home')}
              onProfileUpdate={refreshProfile}
            />
          </Suspense>
        )}

        {currentScreen === 'daily_review' && (
          <DailyReviewScreen
            onBack={() => setCurrentScreen('home')}
            onProfileUpdate={refreshProfile}
          />
        )}

        {currentScreen === 'reading_fluency' && (
          <Suspense fallback={<ScreenFallback label="chuyên đề Luyện Đọc" />}>
            <ReadingFluencyScreen
              onBack={() => setCurrentScreen('home')}
              onProfileUpdate={refreshProfile}
            />
          </Suspense>
        )}

        {currentScreen === 'weekly_challenge' && (
          <Suspense fallback={<ScreenFallback label="Thử Thách Tuần" />}>
            <WeeklyChallengeScreen
              onBack={() => setCurrentScreen('home')}
              onProfileUpdate={refreshProfile}
            />
          </Suspense>
        )}

        {currentScreen === 'competition' && (
          <Suspense fallback={<ScreenFallback label="Đấu Trường" />}>
            <CompetitionHubScreen
              onBack={() => {
                setCompetitionStartMode('kid');
                setCurrentScreen('home');
              }}
              onProfileUpdate={refreshProfile}
              initialMode={competitionStartMode}
            />
          </Suspense>
        )}

        {currentScreen === 'achievements' && (
          <Suspense fallback={<ScreenFallback label="Vườn Sao" />}>
            <AchievementsGardenScreen
              onBack={() => setCurrentScreen('home')}
              onProfileUpdate={refreshProfile}
            />
          </Suspense>
        )}

        {currentScreen === 'avatar_shop' && (
          <Suspense fallback={<ScreenFallback label="Tủ Đồ" />}>
            <AvatarShopScreen
              onBack={() => setCurrentScreen('home')}
              onProfileUpdate={refreshProfile}
            />
          </Suspense>
        )}

        {currentScreen === 'sticker_album' && (
          <Suspense fallback={<ScreenFallback label="Album Sticker" />}>
            <StickerAlbumScreen
              profile={profile}
              onBack={() => setCurrentScreen('home')}
              onProfileUpdate={refreshProfile}
            />
          </Suspense>
        )}

        {currentScreen === 'gacha_machine' && (
          <Suspense fallback={<ScreenFallback label="Máy Gắp Sticker" />}>
            <GachaMachineScreen
              profile={profile}
              onBack={() => setCurrentScreen('home')}
              onProfileUpdate={refreshProfile}
            />
          </Suspense>
        )}

        {currentScreen === 'streak_calendar' && (
          <Suspense fallback={<ScreenFallback label="Lịch Chuỗi Ngày" />}>
            <StreakCalendarScreen
              profile={profile}
              onBack={() => setCurrentScreen('home')}
              onProfileUpdate={refreshProfile}
            />
          </Suspense>
        )}

        {currentScreen === 'chess' && (
          <ChessScreen onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'cotuong' && (
          <CotuongScreen onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'english_ioe' && (
          <EnglishIoeScreen onBack={() => setCurrentScreen('home')} />
        )}
      </main>

      {/*
        T01/B11 + T06 — sticky bottom nav ONLY below lg (1024px). At lg+ the Header
        top nav is the single navigation. 5 compact tabs fit 375px without
        clipping: flex-1 + min-w-0, labels ≥ 14px, 44px+ touch targets.
        Active item uses subject-themed color (T06).
      */}
      <nav
        aria-label="Điều hướng nhanh"
        className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-amber-200 flex items-stretch gap-0.5 px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] z-30 shadow-lg"
      >
        {BOTTOM_NAV.map((tab) => {
          const activeColor = tab.subjectColor ?? 'amber';
          return (
            <button
              key={tab.screen}
              onClick={() => setCurrentScreen(tab.screen)}
              aria-current={currentScreen === tab.screen ? 'page' : undefined}
              // T01B/11 — QA hook thống nhất + accessible name đầy đủ.
              data-testid={`nav-${tab.screen}`}
              aria-label={tab.label}
              title={tab.label}
              className={`flex-1 min-w-0 min-h-[48px] flex flex-col items-center justify-center gap-0.5 font-bold rounded-xl transition-all px-0.5 ${
                currentScreen === tab.screen
                  ? `text-${activeColor}-600 font-black bg-${activeColor}-50`
                  : 'text-slate-500'
              }`}
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {tab.icon}
              </span>
              {/* Wraps onto 2 lines on 360px phones ("Trang / Chủ") instead of
                  being cut to "Trang C…"; 14px kept (T06). */}
              <span className="text-[14px] max-w-full leading-tight text-center [overflow-wrap:anywhere]">{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Parent Dashboard Modal */}
      <Suspense fallback={null}>
        <ParentDashboardModal
          isOpen={isParentModalOpen}
          onClose={() => setIsParentModalOpen(false)}
          onDataReset={refreshProfile}
          onOpenCompetitionReal={() => {
            setCompetitionStartMode('real');
            setIsParentModalOpen(false);
            setCurrentScreen('competition');
          }}
        />
      </Suspense>

      {/* Service-worker update notice (§11): reload offered, never forced. */}
      <Suspense fallback={null}>
        <UpdateBanner />
      </Suspense>

      {/* Daily Screen Time Break Reminder Modal */}
      <Suspense fallback={null}>
        <ScreenTimeModal
          isOpen={isScreenTimeAlertOpen}
          minutesSpent={minutesSpentToday}
          onTakeBreak={() => setIsScreenTimeAlertOpen(false)}
          onExtend={() => {
            setIsScreenTimeAlertOpen(false);
            // Allow extra 10 minutes
            const settings = StorageService.getParentSettings();
            StorageService.saveParentSettings({
              ...settings,
              dailyLimitMinutes: settings.dailyLimitMinutes + 10,
            });
          }}
        />
      </Suspense>

      {/* T18B — Level Up Celebration Modal */}
      <Suspense fallback={null}>
        <LevelUpCelebrationModal
          isOpen={levelUpModal.isOpen}
          onClose={() => setLevelUpModal((prev) => ({ ...prev, isOpen: false }))}
          result={levelUpModal.result}
          currentLevel={levelUpModal.currentLevel}
          levelTitle={levelUpModal.levelTitle}
        />
      </Suspense>
    </div>
  );
}
