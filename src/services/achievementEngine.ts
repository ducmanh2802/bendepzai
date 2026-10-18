/**
 * T18A — Chấm rule thành tựu: mỗi rule là 1 ngưỡng trên ảnh chụp số liệu
 * (MotivationStats). Thuần hàm số nên mọi rule đều test trực tiếp được.
 */
import { ACHIEVEMENT_CATALOG } from '../data/achievementCatalog';
import type { MotivationStats } from '../types/motivation';

/** true khi ảnh chụp số liệu đạt rule của thành tựu. */
export function isRuleSatisfied(stats: MotivationStats, stat: keyof MotivationStats, atLeast: number): boolean {
  const value = stats[stat];
  return typeof value === 'number' && Number.isFinite(value) && value >= atLeast;
}

/**
 * Các id thành tựu vừa đủ điều kiện mở (chưa mở trước đó).
 * Không tự trao thưởng ở đây — storage trao XP để giữ 1 luồng ghi duy nhất.
 */
export function evaluateNewAchievements(
  stats: MotivationStats,
  unlockedIds: readonly string[]
): string[] {
  const unlocked = new Set(unlockedIds);
  const out: string[] = [];
  for (const def of ACHIEVEMENT_CATALOG) {
    if (unlocked.has(def.id)) continue;
    if (isRuleSatisfied(stats, def.rule.stat, def.rule.atLeast)) out.push(def.id);
  }
  return out;
}

/** XP thưởng kèm theo 1 đợt mở khoá (cộng dồn nhiều thành tựu cùng lúc). */
export function xpForUnlocks(unlockedIds: readonly string[]): number {
  const set = new Set(unlockedIds);
  return ACHIEVEMENT_CATALOG.filter((a) => set.has(a.id)).reduce((sum, a) => sum + a.xpReward, 0);
}
