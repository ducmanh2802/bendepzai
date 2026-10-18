import React, { useMemo, useState } from 'react';
import { sound } from '../../services/sound';
import { ArrowLeft, Play, Gamepad2, Star } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { GAME_LEVEL_POLICY } from '../../config/policy';
import { GAMES_CATALOG, type GameCategory, type GameInfo } from '../../data/gamesCatalog';
export { GAMES_CATALOG };
export type { GameCategory, GameInfo };
import { getTierMeta } from '../../data/gameLevels';
import { GAME_REGISTRY } from './registry';
import { KidButton, KidCard, Pill, SectionTitle, ProgressStars } from '../ui';

function GameProgressDots({ gameId }: { gameId: string }) {
  const progress = StorageService.getGameProgress(gameId);
  const maxTier = GAME_LEVEL_POLICY.MAX_TIER;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-1 text-sm text-slate-500 font-bold">
        <span>{getTierMeta(progress.unlockedTier).emoji}</span>
        <span>Màn {progress.unlockedTier}/{maxTier}</span>
        <span className="ml-auto flex items-center gap-0.5">
          ⭐ {Object.values(progress.starsByTier ?? {}).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0)}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: maxTier }, (_, i) => {
          const tierNo = i + 1;
          const stars = (progress.starsByTier as Record<number, number> | undefined)?.[tierNo] ?? 0;
          const unlocked = tierNo <= progress.unlockedTier;
          return (
            <div
              key={tierNo}
              title={`Màn ${tierNo}: ${stars} sao`}
              className="h-1.5 flex-1 rounded-full"
              style={{
                background: stars >= 3 ? '#f59e0b' : stars >= 1 ? '#fcd34d' : unlocked ? '#e2e8f0' : '#f1f5f9',
                opacity: unlocked ? 1 : 0.5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const categoryTabs = [
  { id: 'all' as GameCategory, label: 'Tất Cả', icon: '🌟' },
  { id: 'viet' as GameCategory, label: 'Tiếng Việt', icon: '📚' },
  { id: 'math' as GameCategory, label: 'Toán Học', icon: '🔢' },
  { id: 'english' as GameCategory, label: 'Tiếng Anh', icon: '🇬🇧' },
  { id: 'logic' as GameCategory, label: 'Logic & Khoa học', icon: '🔬' },
  { id: 'fun' as GameCategory, label: 'Giải Trí', icon: '🎨' },
];

export const GamesHubScreen: React.FC<{ onBack: () => void; onProfileUpdate: () => void }> = ({
  onBack,
  onProfileUpdate,
}) => {
  const [activeCategory, setActiveCategory] = useState<GameCategory>('all');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<GameCategory | 'total', number> = {
      total: GAMES_CATALOG.length,
      all: GAMES_CATALOG.length,
      viet: 0,
      math: 0,
      english: 0,
      logic: 0,
      fun: 0,
    };
    for (const g of GAMES_CATALOG) c[g.category] += 1;
    return c;
  }, []);

  const filteredGames =
    activeCategory === 'all'
      ? GAMES_CATALOG
      : GAMES_CATALOG.filter((g) => g.category === activeCategory);

  const recommendedGames = useMemo(() => {
    const ranked = GAMES_CATALOG.map((game) => {
      const progress = StorageService.getGameProgress(game.id);
      const stars = Object.values(progress.starsByTier ?? {}).reduce(
        (a: number, b: unknown) => a + (typeof b === 'number' ? b : 0),
        0
      );
      return { game, stars };
    }).sort((a, b) => a.stars - b.stars || a.game.id.localeCompare(b.game.id));
    return ranked.slice(0, 3).map((r) => r.game);
  }, []);

  const handleLaunchGame = (gameId: string) => {
    sound.playClick();
    setActiveGameId(gameId);
  };

  const handleCloseGame = () => {
    setActiveGameId(null);
    onProfileUpdate();
  };

  const ActiveGame = activeGameId ? GAME_REGISTRY[activeGameId] : null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <KidButton
          variant="secondary"
          size="md"
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Về Trang Chủ
        </KidButton>

        <Pill variant="default" size="md" icon={<Gamepad2 className="w-4 h-4 text-purple-600" aria-hidden="true" />}>
          {counts.total} Trò Chơi Giáo Dục Có Thể Chơi Ngay
        </Pill>
      </div>

      {/* Hero Games Banner */}
      <div className="relative overflow-hidden animate-gradient kb-hero-pattern bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-xl border-4 border-white/60 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center md:text-left">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center text-5xl md:text-6xl border-4 border-purple-200 animate-float shrink-0">
            🎪
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              Đấu Trường Trò Chơi Trí Tuệ
            </h1>
            <p className="text-sm md:text-sm text-purple-100 font-bold mt-1 max-w-lg leading-relaxed">
              Vừa chơi vừa học! 6 màn từ dễ đến Vua Trò Chơi 👑 — mỗi màn mở khóa màn tiếp theo, nhận Sao & XP.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 justify-center md:justify-start">
              {GAME_LEVEL_POLICY.TIERS.map((t) => (
                <Pill key={t.id} variant="default" size="sm" className="bg-white/20 backdrop-blur-xs">
                  {t.emoji} {t.name}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-2 bg-white/20 rounded-2xl text-sm font-black flex items-center gap-1.5 backdrop-blur-xs">
          <Star className="w-4 h-4 fill-amber-300 text-amber-200" />
          <span>⭐ Nhận Sao & XP sau mỗi màn</span>
        </div>
      </div>

      {/* Recommended for the child */}
      <div className="space-y-3" data-testid="recommended-games">
        <SectionTitle icon="🔥" size="lg" className="mb-1">
          Gợi ý cho bé
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recommendedGames.map((game) => (
            <KidCard key={game.id} hoverable subjectBorder="none" className="flex items-center gap-3">
              <span className="text-4xl shrink-0">{game.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-slate-900 font-display truncate">{game.title}</h3>
                <p className="text-sm text-slate-500 font-medium truncate">{game.skillTag}</p>
              </div>
              <KidButton
                variant="primary"
                size="md"
                className="min-h-[44px] shrink-0"
                onClick={() => handleLaunchGame(game.id)}
                leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
              >
                Chơi
              </KidButton>
            </KidCard>
          ))}
        </div>
      </div>

      {/* Category Tabs — counts computed dynamically */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 pb-2">
        {categoryTabs.map((tab) => {
          const count = counts[tab.id];
          return (
            <KidButton
              key={tab.id}
              variant={activeCategory === tab.id ? 'primary' : 'secondary'}
              size="md"
              className="whitespace-nowrap"
              onClick={() => {
                sound.playClick();
                setActiveCategory(tab.id);
              }}
              leftIcon={<span>{tab.icon}</span>}
            >
              {tab.label} ({count})
            </KidButton>
          );
        })}
      </div>

      {/* Games Catalog Grid */}
      <SectionTitle icon="🎮" size="lg" className="mb-4">
        Danh Sách Trò Chơi
      </SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 stagger">
        {filteredGames.map((game) => (
          <KidCard
            key={game.id}
            hoverable
            subjectBorder="none"
            className="flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="text-5xl group-hover:scale-110 transition-transform">
                  {game.emoji}
                </span>
                <div className="flex flex-col items-end gap-1">
                  <Pill variant="default" size="sm" className="bg-purple-50 text-purple-700 border-purple-200">
                    {game.categoryLabel}
                  </Pill>
                   {StorageService.isNewGame(game.id) && (
                     <Pill variant="default" size="sm" className="bg-rose-500 text-white animate-pulse-subtle">
                       ✨ Mới
                     </Pill>
                   )}
                </div>
              </div>

              <h3 className="text-base md:text-lg font-black text-slate-900 font-display">
                {game.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-2">
                {game.description}
              </p>

              <div className="mt-3">
                <Pill variant="default" size="sm" className="bg-amber-50 text-amber-800 border-amber-200">
                  🎯 {game.skillTag}
                </Pill>
                <GameProgressDots gameId={game.id} />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-400">{game.mascot}</span>
              <KidButton
                variant="primary"
                size="md"
                className="min-h-[44px]"
                onClick={() => handleLaunchGame(game.id)}
                leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
              >
                Chơi ngay
              </KidButton>
            </div>
          </KidCard>
        ))}
      </div>

      {/* Render Active Game via registry */}
      {ActiveGame && (
        <React.Suspense fallback={null}>
          <ActiveGame onExit={handleCloseGame} />
        </React.Suspense>
      )}
    </div>
  );
};