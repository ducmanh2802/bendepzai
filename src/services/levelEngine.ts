/**
 * T18A — Level của bé: XP → level 1–50, đường cong nhẹ (level đầu nhanh).
 * Thuần hàm số (không chạm localStorage) nên test nhanh và chắc.
 */

export const MAX_LEVEL = 50;

/** XP tích luỹ cần để ĐẠT level L (level 1 bắt đầu từ 0 XP). */
export function xpForLevel(level: number): number {
  const l = Math.min(Math.max(Math.round(level), 1), MAX_LEVEL);
  if (l <= 1) return 0;
  return Math.round((40 * Math.pow(l - 1, 1.55)) / 5) * 5;
}

/** Level hiện tại của bé từ tổng XP (1–50). */
export function xpToLevel(xp: number): number {
  const safe = typeof xp === 'number' && Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  let level = 1;
  for (let l = 2; l <= MAX_LEVEL; l += 1) {
    if (safe >= xpForLevel(l)) level = l;
    else break;
  }
  return level;
}

const LEVEL_TITLES: ReadonlyArray<{ from: number; title: string }> = [
  { from: 1, title: 'Thám Hiểm Nhí' },
  { from: 5, title: 'Thợ Săn Chữ' },
  { from: 10, title: 'Nhà Toán Học Nhí' },
  { from: 15, title: 'Ngôi Sao Tiếng Anh' },
  { from: 20, title: 'Nhà Đọc Sách Nhí' },
  { from: 25, title: 'Chiến Binh Sao Vàng' },
  { from: 30, title: 'Nhà Khoa Học Nhí' },
  { from: 35, title: 'Nghệ Sĩ Nhí' },
  { from: 40, title: 'Anh Hùng Tri Thức' },
  { from: 45, title: 'Trạng Nguyên Nhí' },
];

/** Danh hiệu của bé ở level hiện tại (mốc cao nhất bé đã vượt). */
export function levelTitle(level: number): string {
  const l = Math.min(Math.max(Math.round(level), 1), MAX_LEVEL);
  let title = LEVEL_TITLES[0].title;
  for (const band of LEVEL_TITLES) {
    if (l >= band.from) title = band.title;
    else break;
  }
  return title;
}

export interface LevelProgress {
  level: number;
  title: string;
  /** XP đã kiếm trong level hiện tại. */
  cur: number;
  /** XP cần để lên level tiếp theo (level 50: 0). */
  need: number;
  /** Phần trăm thanh XP (0–100). */
  pct: number;
}

/** Tiến trình thanh XP trong Header (T18B sẽ vẽ). */
export function levelProgress(xp: number): LevelProgress {
  const level = xpToLevel(xp);
  const title = levelTitle(level);
  if (level >= MAX_LEVEL) return { level, title, cur: 0, need: 0, pct: 100 };
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const safe = Math.max(0, Math.floor(xp));
  const cur = Math.max(0, safe - base);
  const need = Math.max(1, next - base);
  return { level, title, cur, need, pct: Math.min(100, Math.round((cur / need) * 100)) };
}

export interface LevelReward {
  stars: number;
  tickets: number;
  stickerDraws: number;
}

/** Quà lên level: sao + vé + lượt gắp sticker (T18 §2). */
export function rewardForLevel(level: number): LevelReward {
  const l = Math.min(Math.max(Math.round(level), 1), MAX_LEVEL);
  return {
    stars: 2 + Math.floor(l / 5),
    tickets: l % 5 === 0 ? 1 : 0,
    stickerDraws: l % 3 === 0 ? 1 : 0,
  };
}

/** Các level bé đã đạt nhưng chưa nhận thưởng (để màn ăn mừng T18B dùng). */
export function pendingLevels(xp: number, claimed: readonly number[]): number[] {
  const level = xpToLevel(xp);
  const claimedSet = new Set(claimed);
  const out: number[] = [];
  for (let l = 2; l <= level; l += 1) {
    if (!claimedSet.has(l)) out.push(l);
  }
  return out;
}
