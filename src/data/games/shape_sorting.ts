/**
 * T02B/B6+A — Phân Loại Hình (ShapeSorting) data. Pure TypeScript.
 *
 * T02B/B6: vật có hình dạng rõ ràng, emoji khớp hình; bánh chưng không còn
 * trùng icon rổ (rổ chữ nhật dùng 💳); xoài bầu dục → bóng rổ; sô-cô-la
 * thanh/chăn dài/khăn choàng/gạch/bánh mì được thay bằng vật chuẩn hình.
 * T02D: "Nón lá" 👒 (mũ tròn rộng vành, dễ nhầm) → "Ngọn núi" ⛰️ (chóp
 * tam giác rõ ràng).
 */

import { defaultRoundsPerTier, pickDistinct, seededRng } from '../gameLevels';

export type ShapeCategory = 'tron' | 'vuong' | 'tam-giac' | 'chu-nhat';

export interface ShapeItem {
  name: string;
  emoji: string;
  category: ShapeCategory;
  hint: string;
}

export const SHAPE_POOL: ShapeItem[] = [
  // Hình tròn
  { name: 'Quả bóng đá', emoji: '⚽', category: 'tron', hint: 'Quả bóng lăn tròn lông lốc' },
  { name: 'Chiếc bánh quy tròn', emoji: '🍪', category: 'tron', hint: 'Bánh quy bơ tròn xoe' },
  { name: 'Quả bóng rổ', emoji: '🏀', category: 'tron', hint: 'Quả bóng rổ tròn xoe' },
  { name: 'Mặt đồng hồ', emoji: '⏰', category: 'tron', hint: 'Mặt đồng hồ tròn xoe' },
  { name: 'Quả cam', emoji: '🍊', category: 'tron', hint: 'Quả cam tròn xoe' },
  { name: 'Hòn bi ve', emoji: '🔮', category: 'tron', hint: 'Viên bi tròn xoe dễ lăn' },
  // Hình vuông
  { name: 'Hộp quà vuông', emoji: '🎁', category: 'vuong', hint: 'Hộp quà các mặt vuông vức' },
  { name: 'Xúc xắc', emoji: '🎲', category: 'vuong', hint: 'Con xúc xắc 6 mặt vuông' },
  { name: 'Khăn ăn vuông', emoji: '⬜', category: 'vuong', hint: 'Khăn ăn gấp 4 cạnh bằng nhau' },
  { name: 'Bánh chưng xanh', emoji: '🟩', category: 'vuong', hint: 'Bánh Tết 4 cạnh bằng nhau' },
  { name: 'Thùng giấy', emoji: '📦', category: 'vuong', hint: 'Thùng giấy cứng cáp' },
  { name: 'Hộp cơm', emoji: '🍱', category: 'vuong', hint: 'Hộp cơm vuông vức' },
  // Hình tam giác
  { name: 'Miếng dưa hấu', emoji: '🍉', category: 'tam-giac', hint: 'Lát dưa cắt 3 cạnh' },
  { name: 'Biển báo nguy hiểm', emoji: '⚠️', category: 'tam-giac', hint: 'Biển cảnh báo 3 cạnh' },
  { name: 'Miếng bánh pizza', emoji: '🍕', category: 'tam-giac', hint: 'Lát bánh 3 cạnh' },
  { name: 'Thước ê ke', emoji: '📐', category: 'tam-giac', hint: 'Thước vẽ góc 3 cạnh' },
  { name: 'Ngọn núi', emoji: '⛰️', category: 'tam-giac', hint: 'Ngọn núi cao hình chóp' },
  { name: 'Mái nhà', emoji: '🏠', category: 'tam-giac', hint: 'Mái nhà 3 cạnh' },
  // Hình chữ nhật
  { name: 'Cuốn sách bài tập', emoji: '📘', category: 'chu-nhat', hint: 'Sách hai cạnh dài hai cạnh ngắn' },
  { name: 'Cửa sổ lớp học', emoji: '🖼️', category: 'chu-nhat', hint: 'Cửa sổ khung dài' },
  { name: 'Cái bảng lớp', emoji: '📋', category: 'chu-nhat', hint: 'Bảng hai cạnh dài' },
  { name: 'Cánh cửa tủ', emoji: '🚪', category: 'chu-nhat', hint: 'Cánh cửa dài đứng' },
  { name: 'Quyển vở', emoji: '📓', category: 'chu-nhat', hint: 'Quyển vở dài' },
  { name: 'Viên gạch', emoji: '🧱', category: 'chu-nhat', hint: 'Viên gạch dài' },
];

export interface ShapeBasket {
  category: ShapeCategory;
  title: string;
  emoji: string;
  color: string;
}

/** T02B/B6 — rổ chữ nhật dùng 💳 để không trùng 🟩 của bánh chưng. */
export const BASKETS: ShapeBasket[] = [
  { category: 'tron', title: 'Hình Tròn', emoji: '🔴', color: 'border-red-400 bg-red-50 text-red-900' },
  { category: 'vuong', title: 'Hình Vuông', emoji: '🟦', color: 'border-blue-400 bg-blue-50 text-blue-900' },
  { category: 'tam-giac', title: 'Hình Tam Giác', emoji: '🔺', color: 'border-amber-400 bg-amber-50 text-amber-900' },
  { category: 'chu-nhat', title: 'Hình Chữ Nhật', emoji: '💳', color: 'border-emerald-400 bg-emerald-50 text-emerald-900' },
];

export function buildShapeRounds(tier: number, seedOrNonce = 0, seedOverride?: number): ShapeItem[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const roundsPerTier = defaultRoundsPerTier();
  const count = roundsPerTier[safeTier - 1];
  const rngSeed = seedOverride ?? 4500 + safeTier * 43 + seedOrNonce * 1009;
  const pool = safeTier <= 2 ? SHAPE_POOL.slice(0, 10) : SHAPE_POOL;
  return pickDistinct<ShapeItem>(pool, count, seededRng(rngSeed));
}

export function buildRounds(tier: number, seed = 0): ShapeItem[] {
  return buildShapeRounds(tier, seed);
}
