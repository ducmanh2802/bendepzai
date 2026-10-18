/**
 * T18A — Máy gắp sticker: 1 vé/lượt, KHÔNG trùng tới khi đủ bộ.
 * Thuần hàm số + rng truyền vào nên test tất định; production truyền
 * Math.random. Không có yếu tố may rủi mua bằng tiền thật (offline).
 */
import { STICKERS, getStickersBySet } from '../data/stickers';
import type { StickerSetId } from '../types/motivation';

export type RandomFn = () => number;

export interface StickerDraw {
  stickerId: string;
  /** true khi đây là sticker bé chưa từng có. */
  isNew: boolean;
}

/**
 * Gắp 1 sticker: ưu tiên sticker bé chưa có (ngẫu nhiên trong số chưa có);
 * chỉ khi đã đủ cả 60 mới cho trùng (tăng số lượng để T18B khoe).
 */
export function drawSticker(
  owned: Readonly<Record<string, number>>,
  rng: RandomFn = Math.random
): StickerDraw {
  const unowned = STICKERS.filter((s) => !(owned[s.id] > 0));
  const pool = unowned.length > 0 ? unowned : [...STICKERS];
  const idx = Math.floor(rng() * pool.length) % pool.length;
  const picked = pool[idx];
  return { stickerId: picked.id, isNew: unowned.length > 0 };
}

/** Số sticker khác nhau bé đã có trong 1 bộ (0–10). */
export function setOwnedCount(owned: Readonly<Record<string, number>>, setId: StickerSetId): number {
  return getStickersBySet(setId).filter((s) => owned[s.id] > 0).length;
}

/** true khi bé đã đủ 10/10 sticker của bộ (được huy hiệu + Gấu ăn mừng ở T18B). */
export function isSetCompleted(owned: Readonly<Record<string, number>>, setId: StickerSetId): boolean {
  return setOwnedCount(owned, setId) >= 10;
}

/** Số bộ bé đã sưu tập đủ (dùng cho rule thành tựu). */
export function completedSetsCount(owned: Readonly<Record<string, number>>): number {
  const sets: StickerSetId[] = ['dong-vat', 'do-an-tet', 'phuong-tien', 'vu-tru', 'khung-long', 'nghe-nghiep'];
  return sets.filter((s) => isSetCompleted(owned, s)).length;
}

/** Số sticker khác nhau bé đã sở hữu (tối đa 60). */
export function ownedStickersCount(owned: Readonly<Record<string, number>>): number {
  return STICKERS.filter((s) => owned[s.id] > 0).length;
}
