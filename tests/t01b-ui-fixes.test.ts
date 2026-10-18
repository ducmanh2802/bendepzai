import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof (globalThis as Record<string, unknown>).localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import { StorageService } from '../src/services/storage';
import { GAMES_CATALOG } from '../src/data/gamesCatalog';

const here = dirname(fileURLToPath(import.meta.url));
const src = (p: string) => readFileSync(join(here, '..', p), 'utf8');

/** WCAG relative luminance + contrast, same math as qa/t01b-fixes.mjs. */
function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const f = (i: number) => {
    const v = parseInt(c.substr(i, 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}
function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe('T01B/5 font Nunito thang font-sans', () => {
  it('khai bao --font-sans Nunito trong @theme (Tailwind v4)', () => {
    const css = src('src/index.css');
    expect(css).toContain('@theme');
    expect(css).toMatch(/--font-sans:[^;]*Nunito/);
  });

  it('App van dung font-sans (giờ đã là Nunito) và body giữ Nunito', () => {
    expect(src('src/App.tsx')).toContain('font-sans');
    expect(src('src/index.css')).toMatch(/body\s*\{[^}]*Nunito/);
  });
});

describe('T01B/6 tuong phan banner Home >= 4.5:1', () => {
  const stops = ['#b45309', '#c2410c', '#be123c']; // amber-700/orange-700/rose-700

  it('chu trang tren moi diem dung gradient moi deu >= 4.5:1', () => {
    for (const h of stops) {
      expect(contrast('#ffffff', h)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gradient cu (400, chi 1.7–2.7:1) khong con o hero Home', () => {
    const home = src('src/components/home/HomeScreen.tsx');
    expect(home).toContain('from-amber-700');
    expect(home).toContain('via-orange-700');
    expect(home).toContain('to-rose-700');
    expect(home).not.toContain('from-amber-400 via-orange-400 to-rose-400');
  });

  it('pill thong ke dung nen den mo (chu trang moi dat chuan) - Pill component', () => {
    expect(src('src/components/home/HomeScreen.tsx')).toContain('<Pill');
    expect(src('src/components/home/HomeScreen.tsx')).toContain('variant="star"');
    expect(src('src/components/home/HomeScreen.tsx')).toContain('variant="streak"');
    expect(src('src/components/home/HomeScreen.tsx')).toContain('variant="ticket"');
  });
});

describe('T01B/1 header game 1 dong + Esc/Back', () => {
  const wrapper = () => src('src/components/games/GameModalWrapper.tsx');

  it('nut dong dung DAU, truoc ten game, co testid', () => {
    const w = wrapper();
    const closeAt = w.indexOf('data-testid="game-close"');
    // Tieu de header (the h2 truncate), khong phai prop/aria-label o dau file.
    const h2At = w.indexOf('<h2');
    expect(closeAt).toBeGreaterThan(-1);
    expect(h2At).toBeGreaterThan(-1);
    expect(closeAt).toBeLessThan(h2At);
  });

  it('ten game truncate 1 dong + tien do gon dang icon', () => {
    const w = wrapper();
    expect(w).toContain('truncate');
    expect(w).toContain('min-w-0');
    expect(w).toContain('Màn {tier}/{tierCount}');
  });

  it('icon huong dan (loa phong thanh) KHAC icon tat tieng + aria-label ro', () => {
    const w = wrapper();
    expect(w).toMatch(/import[^;]*Megaphone[^;]*from 'lucide-react'/);
    expect(w).toContain('aria-label="Nghe hướng dẫn chơi"');
    expect(w).toContain('Tắt âm thanh trò chơi');
    expect(w).toContain('Bật âm thanh trò chơi');
    expect(w).not.toContain('aria-label="Đọc hướng dẫn bằng giọng nói"');
  });

  it('dung useModalHistory (pushState + popstate + Escape)', () => {
    expect(wrapper()).toContain('useModalHistory');
    const hook = src('src/hooks/useModalHistory.ts');
    expect(hook).toContain('pushState');
    expect(hook).toContain('popstate');
    expect(hook).toContain("event.key === 'Escape'");
    expect(hook).toContain('history.back()');
  });

  it('LessonPlayer cung Esc/Back + nut dong qua history', () => {
    const lesson = src('src/components/learning/LessonPlayerModal.tsx');
    expect(lesson).toContain('useModalHistory');
    expect(lesson).toContain('requestClose');
    expect(lesson).toContain('data-testid="lesson-close"');
  });
});

describe('T01B/2 thanh hanh dong bai hoc dinh day', () => {
  it('footer nam NGOAI vung cuon, co border-t + padding safe-area', () => {
    const lesson = src('src/components/learning/LessonPlayerModal.tsx');
    expect(lesson).toContain('shrink-0 border-t-2 border-amber-200');
    expect(lesson).toContain('env(safe-area-inset-bottom)');
    expect(lesson).toContain('flex-1 overflow-y-auto');
  });
});

describe('T01B/3 desktop nav khong tran + T01B/11 testid', () => {
  it('lg–2xl icon-only ca 7 muc, 2xl+ day du; XP an duoi xl', () => {
    const header = src('src/components/common/Header.tsx');
    expect(header).toContain('iconOnly');
    expect(header).toContain('hidden lg:flex 2xl:hidden');
    expect(header).toContain('hidden 2xl:flex');
    // XP counter now uses Pill component with hidden xl:flex
    expect(header).toContain('hidden xl:flex');
  });

  it('moi muc dieu huong tren + duoi co data-testid="nav-<screen>"', () => {
    const header = src('src/components/common/Header.tsx');
    expect(header).toContain('data-testid={`nav-${item.screen}`}');
    const app = src('src/App.tsx');
    expect(app).toContain('data-testid={`nav-${tab.screen}`}');
    // Bottom nav giu ten day du cho QA/script cu qua aria-label.
    expect(app).toContain('aria-label={tab.label}');
  });
});

describe('T01B/4 doi man hinh cuon ve dau', () => {
  it('App scrollTo(0) khi currentScreen doi', () => {
    const app = src('src/App.tsx');
    expect(app).toContain('window.scrollTo');
    expect(app).toMatch(/\[\s*currentScreen\s*\]/);
  });
});

describe('T01B/7 banner cap nhat chi khi SW moi thay SW cu', () => {
  it('pwa.ts bo qua SW_UPDATED khi chua co controller (lan mo dau)', () => {
    const pwa = src('src/services/pwa.ts');
    expect(pwa).toContain('SW_UPDATED');
    expect(pwa).toContain('navigator.serviceWorker.controller');
  });

  it('sw.js chi bao cho client dang duoc dieu khien', () => {
    const sw = src('public/sw.js');
    expect(sw).toContain('SW_UPDATED');
    expect(sw).not.toContain('includeUncontrolled: true');
  });
});

describe('T01B/9 nut cham >= 44px', () => {
  const files = [
    'src/components/games/GamesHubScreen.tsx',
    'src/components/subject/SubjectScreen.tsx',
    'src/components/shop/AvatarShopScreen.tsx',
    'src/components/world/WorldMapScreen.tsx',
    'src/components/achievements/AchievementsGardenScreen.tsx',
    'src/components/review/DailyReviewScreen.tsx',
    'src/components/challenge/WeeklyChallengeScreen.tsx',
    'src/components/competition/CompetitionHubScreen.tsx',
    'src/components/learning/LessonPlayerModal.tsx',
    'src/components/games/GameModalWrapper.tsx',
  ];

  it('khong con nut hanh dong nho: Chơi ngay / Vào học / Mở khóa / tab deu min-h-44', () => {
    expect(src('src/components/games/GamesHubScreen.tsx')).toContain('min-h-[44px]');
    expect(src('src/components/subject/SubjectScreen.tsx')).toContain('min-h-[44px]');
    const shop = src('src/components/shop/AvatarShopScreen.tsx');
    expect(shop).toContain('Mở khóa');
    expect(shop).toContain('min-h-[44px]');
  });

  it('mọi màn hình trong danh sách đều có min-h-[44px]', () => {
    for (const f of files) {
      expect(src(f), f).toContain('min-h-[44px]');
    }
  });

  it('"Bé cần gợi ý?" và "Nghe lại" du 44px', () => {
    expect(src('src/components/learning/LessonPlayerModal.tsx')).toContain('min-h-[44px]');
    const wrapper = src('src/components/games/GameModalWrapper.tsx');
    expect(wrapper).toContain('aria-label="Nghe lại hướng dẫn chơi"');
    expect(wrapper).toContain('min-h-[44px]');
  });
});

describe('T01B/10 WorldMap dem dong + tuoi cay 1 lan/ngay', () => {
  it('subtitle lay tu GAMES_CATALOG.length, khong ghi cung', () => {
    const map = src('src/components/world/WorldMapScreen.tsx');
    expect(map).toContain('GAMES_CATALOG.length');
    expect(map).not.toContain('10+ Mini-Game');
  });

  it('catalog co >= 18 game, id duy nhat', () => {
    expect(GAMES_CATALOG.length).toBeGreaterThanOrEqual(18);
    const ids = GAMES_CATALOG.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('storage: ngay tuoi cay co sanitizer YYYY-MM-DD, tien do cu nguyen ven', () => {
    expect(StorageService.getTreeWateredDate()).toBeNull();
    StorageService.setTreeWateredDate('2026-10-14');
    expect(StorageService.getTreeWateredDate()).toBe('2026-10-14');
    StorageService.setTreeWateredDate('hom-nay');
    expect(StorageService.getTreeWateredDate()).toBe('2026-10-14');
  });

  it('man hinh vuon kiem tra ngay truoc khi ban confetti', () => {
    const garden = src('src/components/achievements/AchievementsGardenScreen.tsx');
    const guardAt = garden.indexOf('getTreeWateredDate() === today');
    const confettiAt = garden.indexOf('fireCelebrationConfetti()');
    expect(guardAt).toBeGreaterThan(-1);
    expect(confettiAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(confettiAt);
  });
});

describe('T01B/11 QA hooks', () => {
  it('probe t01b-fixes.mjs ton tai va bao het 11 muc', () => {
    const probePath = join(here, '..', 'qa', 't01b-fixes.mjs');
    expect(existsSync(probePath)).toBe(true);
    const probe = src('qa/t01b-fixes.mjs');
    for (const key of ['game-close-', 'lesson-sticky', 'menu-no-overflow', 'nav-testid', 'hero-contrast', 'update-banner-hidden-first-load', 'touch-targets-home', 'worldmap']) {
      expect(probe, key).toContain(key);
    }
  });

  it('answer-option testid van giu (00_RULES #11)', () => {
    // Check in choice-style question renderer components
    const choiceComponents = [
      'src/components/learning/questions/ChoiceQuestion.tsx',
      'src/components/learning/questions/ImageChoiceQuestion.tsx',
      'src/components/learning/questions/TrueFalseQuestion.tsx',
      'src/components/learning/questions/FillBlankQuestion.tsx',
      'src/components/learning/questions/OrderingQuestion.tsx',
      'src/components/learning/questions/MathExpressionQuestion.tsx',
    ];
    for (const comp of choiceComponents) {
      expect(src(comp), comp).toContain('data-testid="answer-option"');
    }
    // MatchingQuestion uses match-left and match-right
    expect(src('src/components/learning/questions/MatchingQuestion.tsx'), 'MatchingQuestion').toContain('data-testid="match-left"');
    expect(src('src/components/learning/questions/MatchingQuestion.tsx'), 'MatchingQuestion').toContain('data-testid="match-right"');
    // DragDropQuestion uses drag-item and drop-bucket
    expect(src('src/components/learning/questions/DragDropQuestion.tsx'), 'DragDropQuestion').toContain('data-testid="drag-item"');
    expect(src('src/components/learning/questions/DragDropQuestion.tsx'), 'DragDropQuestion').toContain('data-testid="drop-bucket"');
  });
});
