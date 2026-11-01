import React from 'react';
import { ActiveScreen, SubjectType } from '../../types';
import { sound } from '../../services/sound';
import { GAMES_CATALOG } from '../../data/gamesCatalog';
import { getTopicsBySubject } from '../../data/curriculum';
import { StorageService } from '../../services/storage';
import { ArrowLeft, Compass, MapPin } from 'lucide-react';

interface WorldMapScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  onSelectSubject: (sub: SubjectType) => void;
}

interface Region {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  mascot: string;
  color: string;
  borderColor: string;
  action: () => void;
  x: number;
  y: number;
  percent: number;
}

export const WorldMapScreen: React.FC<WorldMapScreenProps> = ({
  onNavigate,
  onSelectSubject,
}) => {
  const profile = StorageService.getChildProfile();
  const gameStore = StorageService.getGameProgressStore();

  const subjectPercent = (subject: SubjectType): number => {
    const topics = getTopicsBySubject(subject);
    const lessons = topics.flatMap((t) => t.lessons);
    if (lessons.length === 0) return 0;
    const done = lessons.filter((l) => profile.completedLessons.includes(l.id)).length;
    return Math.round((done / lessons.length) * 100);
  };

  const gamesDone = GAMES_CATALOG.filter((g) => {
    const p = gameStore.games[g.id];
    return !!p && Object.values(p.starsByTier || {}).some((v) => Number(v) > 0);
  }).length;
  const gamesPercent = GAMES_CATALOG.length === 0
    ? 0
    : Math.round((gamesDone / GAMES_CATALOG.length) * 100);

  const regions: Region[] = [
    {
      id: 'viet',
      title: 'Vương Quốc Tiếng Việt',
      subtitle: 'Lâu đài Chữ cái & Thung lũng Âm vần',
      emoji: '🏰',
      mascot: '🐻 Gấu Bút Chì',
      color: 'from-amber-400 to-orange-500',
      borderColor: 'border-amber-300',
      action: () => onSelectSubject('tieng-viet'),
      x: 100,
      y: 250,
      percent: subjectPercent('tieng-viet'),
    },
    {
      id: 'toan',
      title: 'Thành Phố Toán Học',
      subtitle: 'Tòa tháp Phép tính & Công viên Hình khối',
      emoji: '🏙️',
      mascot: '🦊 Cáo Toán',
      color: 'from-blue-400 to-cyan-500',
      borderColor: 'border-blue-300',
      action: () => onSelectSubject('toan'),
      x: 390,
      y: 140,
      percent: subjectPercent('toan'),
    },
    {
      id: 'english',
      title: 'Đảo Thần Thoại Tiếng Anh',
      subtitle: 'Bến cảng Âm Chữ & Vườn Thú Loài Vật',
      emoji: '🏝️',
      mascot: '🐰 Thỏ Tiếng Anh',
      color: 'from-emerald-400 to-teal-500',
      borderColor: 'border-emerald-300',
      action: () => onSelectSubject('english'),
      x: 680,
      y: 280,
      percent: subjectPercent('english'),
    },
    {
      id: 'cuoc-song',
      title: 'Làng Cuộc Sống',
      subtitle: 'Cảm xúc · An toàn · Kỹ năng sống',
      emoji: '🏡',
      mascot: '🐻 Gấu Bút Chì',
      color: 'from-purple-500 to-violet-500',
      borderColor: 'border-purple-300',
      action: () => onSelectSubject('cuoc-song'),
      x: 920,
      y: 260,
      percent: subjectPercent('cuoc-song'),
    },
    {
      id: 'games',
      title: 'Đấu Trường Trò Chơi',
      subtitle: `${GAMES_CATALOG.length} trò chơi trí tuệ bổ ích`,
      emoji: '🎪',
      mascot: '🦉 Cú Thông Thái',
      color: 'from-purple-400 to-pink-500',
      borderColor: 'border-purple-300',
      action: () => onNavigate('games'),
      x: 970,
      y: 150,
      percent: gamesPercent,
    },
    {
      id: 'review',
      title: 'Hồ Nước Ôn Tập Thông Minh',
      subtitle: 'Luyện lại câu hỏi cần nhớ',
      emoji: '🌊',
      mascot: '💡 Ngọn Hải Đăng',
      color: 'from-yellow-400 to-amber-500',
      borderColor: 'border-yellow-300',
      action: () => onNavigate('daily_review'),
      x: 1260,
      y: 300,
      percent: 0,
    },
    {
      id: 'garden',
      title: 'Khu Vườn Thành Tích',
      subtitle: 'Huy hiệu, cúp vàng & cây tri thức',
      emoji: '🌳',
      mascot: '🌟 Ngôi Sao May Mắn',
      color: 'from-lime-400 to-green-600',
      borderColor: 'border-lime-300',
      action: () => onNavigate('achievements'),
      x: 1030,
      y: 420,
      percent: 0,
    },
  ];

  // The region the child is closest to learning next (first with progress < 100).
  const nearest = regions.find((r) => r.percent < 100 && (r.id === 'viet' || r.id === 'toan' || r.id === 'english' || r.id === 'cuoc-song' || r.id === 'games')) || regions[0];

  // Dotted connecting route across island centres.
  const routePoints = regions.map((r) => `${r.x + 50},${r.y + 40}`).join(' L ');
  const routeD = `M ${routePoints}`;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            onNavigate('home');
          }}
          className="flex items-center gap-1.5 px-4 min-h-[44px] py-2 bg-white hover:bg-amber-50 border-2 border-amber-300 rounded-2xl font-bold text-xs md:text-sm text-amber-950 transition-all active:scale-95 shadow-xs cursor-pointer"
          data-testid="world-map-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang Chủ</span>
        </button>

        <div className="flex items-center gap-2 bg-white/90 px-4 py-1.5 rounded-full border border-amber-200 shadow-xs">
          <Compass className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-black text-amber-900 font-display">
            Bản Đồ Xứ Sở Tri Thức
          </span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl md:text-4xl font-black text-amber-950 font-display">
          Cuộc Phiêu Lưu Khám Phá Lớp 1
        </h2>
        <p className="text-xs md:text-sm text-slate-700 font-bold mt-1">
          Bé hãy chọn một vùng đất diệu kỳ để bắt đầu chuyến hành trình học tập!
        </p>
      </div>

      {/* Scrollable map viewport (inner scroll only; no horizontal page overflow). */}
      <div
        className="relative rounded-3xl border-4 border-amber-300 shadow-2xl overflow-x-auto overflow-y-hidden snap-x snap-mandatory touch-pan-x"
        style={{ maxWidth: '100%' }}
        data-testid="world-map-viewport"
      >
        <div className="relative bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-100 min-w-[1500px] h-[520px]">
          {/* Sky / sea elements */}
          <div className="absolute top-4 left-10 text-4xl opacity-70 animate-float pointer-events-none">☁️</div>
          <div className="absolute top-8 right-16 text-5xl opacity-60 animate-float pointer-events-none" style={{ animationDelay: '1.2s' }}>☁️</div>
          <div className="absolute bottom-8 left-4 text-3xl opacity-40 pointer-events-none">⛵</div>
          <div className="absolute bottom-6 right-8 text-4xl opacity-60 pointer-events-none">🐬</div>

          {/* Dotted route */}
          <svg className="absolute left-0 top-0 w-full h-full pointer-events-none" viewBox="0 0 1500 520" preserveAspectRatio="none">
            <path
              d={routeD}
              stroke="#92400e"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="12 10"
              className="opacity-60"
            />
            {/* Bear marker at nearest region */}
            <g transform={`translate(${nearest.x + 100},${nearest.y - 10})`}>
              <text fontSize="36" textAnchor="middle">🐻</text>
            </g>
          </svg>

          {/* Region islands */}
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => {
                sound.playClick();
                region.action();
              }}
              className={`group absolute bg-white/95 hover:bg-white p-3 rounded-3xl shadow-xl hover:shadow-2xl border-4 ${region.borderColor} transition-all duration-300 hover:-translate-y-1 active:scale-95 text-left flex flex-col justify-between w-[190px] min-h-[120px] cursor-pointer snap-center`}
              style={{ left: `${region.x}px`, top: `${region.y}px` }}
              data-testid={`world-region-${region.id}`}
              aria-label={`${region.title}, hoàn thành ${region.percent}%`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-4xl group-hover:scale-110 transition-transform drop-shadow-sm">
                  {region.emoji}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-200 whitespace-nowrap">
                  {region.mascot}
                </span>
              </div>

              {/* Completion badge */}
              <span
                className="absolute -top-3 -right-3 min-w-[40px] h-[28px] px-2 bg-emerald-500 text-white rounded-full border-2 border-white shadow-md flex items-center justify-center text-[11px] font-black tabular-nums"
                data-testid={`world-region-badge-${region.id}`}
                aria-label={`Hoàn thành ${region.percent}%`}
              >
                {region.percent}%
              </span>

              <div className="mt-2">
                <h3 className="text-sm font-black text-slate-900 font-display mt-1 group-hover:text-amber-600 transition-colors leading-tight">
                  {region.title}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-snug">
                  {region.subtitle}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-black text-amber-700">
                  <span>Khám phá ngay</span>
                  <span>➔</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 text-center text-xs font-bold text-amber-900/80 bg-white/60 py-2 px-4 rounded-full max-w-md mx-auto relative z-10 shadow-xs">
        🧭 Học xong mỗi vùng đất sẽ tích lũy chìa khóa mở kho báu trí thức!
      </div>
    </div>
  );
};
