import type { ActiveScreen } from '../types';

/**
 * SINGLE SOURCE OF TRUTH FOR NAVIGATION (T06).
 *
 * Exactly 5 destinations used by both:
 * - Top nav (Header.tsx) on desktop (≥1024px)
 * - Bottom nav (App.tsx) on mobile/tablet (<1024px)
 *
 * Order matters: Home → Map → Games → Reading → Achievements.
 * Other screens (Ôn tập, Đấu trường, Thử thách tuần, Shop) are reached from Home/Map.
 */

export interface NavItem {
  screen: ActiveScreen;
  label: string;        // Full label for aria-label / tooltip
  shortLabel: string;   // Compact label for bottom nav (fits 375px)
  icon: string;         // Emoji icon (28px)
  subjectColor?: string; // Tailwind color for active state (subject-themed)
}

export const NAVIGATION: readonly NavItem[] = [
  {
    screen: 'home',
    label: 'Trang Chủ',
    shortLabel: 'Trang Chủ',
    icon: '🏠',
    subjectColor: 'amber',
  },
  {
    screen: 'world_map',
    label: 'Bản Đồ',
    shortLabel: 'Bản Đồ',
    icon: '🗺️',
    subjectColor: 'blue',
  },
  {
    screen: 'games',
    label: 'Trò Chơi',
    shortLabel: 'Trò Chơi',
    icon: '🎮',
    subjectColor: 'purple',
  },
  {
    screen: 'reading_fluency',
    label: 'Luyện Đọc',
    shortLabel: 'Luyện Đọc',
    icon: '📖',
    subjectColor: 'emerald',
  },
  {
    screen: 'achievements',
    label: 'Vườn Sao',
    shortLabel: 'Vườn Sao',
    icon: '🌳',
    subjectColor: 'violet',
  },
] as const;

/** Screen order for keyboard navigation / focus management. */
export const NAV_SCREENS = NAVIGATION.map((n) => n.screen);

/** Find a nav item by screen. */
export function getNavItem(screen: ActiveScreen): NavItem | undefined {
  return NAVIGATION.find((n) => n.screen === screen);
}

/** Get the subject color for active state styling. */
export function getSubjectColor(screen: ActiveScreen): string {
  const item = getNavItem(screen);
  return item?.subjectColor ?? 'amber';
}
