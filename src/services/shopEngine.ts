/**
 * T18A — Logic mua đồ Shop (thuần hàm số): đủ sao + đủ level mới mua được,
 * mỗi món chỉ mua 1 lần, tiền sao trừ đúng giá. Storage ghi kết quả.
 */
import { SHOP_MAP } from '../data/shopCatalog';

export interface ShopBuyCheck {
  ok: boolean;
  reason: 'unknown-item' | 'already-owned' | 'level-locked' | 'not-enough-stars' | 'ok';
  /** Level còn thiếu (chỉ khi reason = 'level-locked'). */
  missingLevels?: number;
  /** Số sao còn thiếu (chỉ khi reason = 'not-enough-stars'). */
  missingStars?: number;
}

export function canBuyShopItem(
  itemId: string,
  ownedIds: readonly string[],
  stars: number,
  level: number
): ShopBuyCheck {
  const item = SHOP_MAP.get(itemId);
  if (!item) return { ok: false, reason: 'unknown-item' };
  if (ownedIds.includes(itemId)) return { ok: false, reason: 'already-owned' };
  if (level < item.minLevel) return { ok: false, reason: 'level-locked', missingLevels: item.minLevel - level };
  if (stars < item.priceStars) {
    return { ok: false, reason: 'not-enough-stars', missingStars: item.priceStars - stars };
  }
  return { ok: true, reason: 'ok' };
}

/** Các món đang mở bán cho bé ở level hiện tại (chưa sở hữu). */
export function visibleShopItems(ownedIds: readonly string[], level: number): string[] {
  const owned = new Set(ownedIds);
  return [...SHOP_MAP.values()]
    .filter((i) => !owned.has(i.id) && level >= i.minLevel)
    .map((i) => i.id);
}
