/**
 * T18A — Album Sticker: 60 sticker chia 6 bộ, mỗi bộ 10 sticker.
 * Độ hiếm mỗi bộ: 6 thường + 3 hiếm + 1 siêu hiếm.
 *
 * Tên sticker: tiếng Việt đúng chính tả (chuẩn NFC, kiểu dấu mới:
 * hoà/khoẻ/thuỷ), vui và an toàn cho bé lớp 1. Mỗi sticker có đúng
 * 1 emoji thân thiện (không ma/quỷ/buồn/sợ).
 */
import type { Sticker, StickerRarity, StickerSet, StickerSetId } from '../types/motivation';

export const STICKER_SETS: readonly StickerSet[] = [
  { id: 'dong-vat', name: 'Con Vật Quanh Em', emoji: '🐮', description: 'Những người bạn bốn chân thân thiết' },
  { id: 'do-an-tet', name: 'Món Ngon Ngày Tết', emoji: '🍘', description: 'Mâm cỗ Tết ấm áp bên gia đình' },
  { id: 'phuong-tien', name: 'Xe Cộ Vui Nhộn', emoji: '🚗', description: 'Cùng Gấu Bút Chì đi khắp nơi' },
  { id: 'vu-tru', name: 'Vũ Trụ Diệu Kỳ', emoji: '🚀', description: 'Bay lên trời cao ngắm trăng sao' },
  { id: 'khung-long', name: 'Thế Giới Khủng Long', emoji: '🦕', description: 'Những chú khủng long hiền lành' },
  { id: 'nghe-nghiep', name: 'Nghề Nghiệp Quanh Em', emoji: '🩺', description: 'Lớn lên bé thích làm nghề gì?' },
];

interface StickerSeed {
  name: string;
  emoji: string;
  rarity: StickerRarity;
}

function buildSet(setId: StickerSetId, prefix: string, seeds: readonly StickerSeed[]): Sticker[] {
  return seeds.map((s, i) => ({
    id: `st_${prefix}_${i + 1}`,
    setId,
    name: s.name,
    emoji: s.emoji,
    rarity: s.rarity,
  }));
}

const DONG_VAT: readonly StickerSeed[] = [
  { name: 'Trâu Vàng Chăm Chỉ', emoji: '🐃', rarity: 'thuong' },
  { name: 'Bò Sữa Hiền Lành', emoji: '🐄', rarity: 'thuong' },
  { name: 'Gà Trống Gáy Sáng', emoji: '🐓', rarity: 'thuong' },
  { name: 'Vịt Con Vàng Ơi', emoji: '🦆', rarity: 'thuong' },
  { name: 'Chó Đốm Trung Thành', emoji: '🐶', rarity: 'thuong' },
  { name: 'Mèo Mướp Dễ Thương', emoji: '🐱', rarity: 'thuong' },
  { name: 'Heo Hồng Ham Ăn', emoji: '🐷', rarity: 'hiem' },
  { name: 'Voi Con Khéo Léo', emoji: '🐘', rarity: 'hiem' },
  { name: 'Khỉ Con Tinh Nghịch', emoji: '🐵', rarity: 'hiem' },
  { name: 'Cá Chép Vàng May Mắn', emoji: '🐟', rarity: 'sieu-hiem' },
];

const DO_AN_TET: readonly StickerSeed[] = [
  { name: 'Bánh Chưng Xanh', emoji: '🍘', rarity: 'thuong' },
  { name: 'Bánh Tét Dài', emoji: '🍙', rarity: 'thuong' },
  { name: 'Mứt Dừa Ngọt Ngào', emoji: '🥥', rarity: 'thuong' },
  { name: 'Hạt Dưa Đỏ Thắm', emoji: '🍉', rarity: 'thuong' },
  { name: 'Kẹo Lạc Giòn Tan', emoji: '🍬', rarity: 'thuong' },
  { name: 'Mứt Gừng Ấm Bụng', emoji: '🧄', rarity: 'thuong' },
  { name: 'Bánh Quy Bơ Thơm', emoji: '🍪', rarity: 'hiem' },
  { name: 'Ly Nước Mơ Mát Lạnh', emoji: '🧃', rarity: 'hiem' },
  { name: 'Chén Chè Đậu Xanh', emoji: '🍵', rarity: 'hiem' },
  { name: 'Củ Hành Muối Giòn', emoji: '🧅', rarity: 'sieu-hiem' },
];

const PHUONG_TIEN: readonly StickerSeed[] = [
  { name: 'Xe Đạp Của Bé', emoji: '🚲', rarity: 'thuong' },
  { name: 'Xe Máy Của Mẹ', emoji: '🛵', rarity: 'thuong' },
  { name: 'Ô Tô Con Màu Đỏ', emoji: '🚗', rarity: 'thuong' },
  { name: 'Xe Buýt Vàng', emoji: '🚌', rarity: 'thuong' },
  { name: 'Tàu Hoả Xình Xịch', emoji: '🚂', rarity: 'thuong' },
  { name: 'Thuyền Buồm Ra Khơi', emoji: '⛵', rarity: 'thuong' },
  { name: 'Máy Bay Lượn Cao', emoji: '✈️', rarity: 'hiem' },
  { name: 'Trực Thăng Cứu Hộ', emoji: '🚁', rarity: 'hiem' },
  { name: 'Xe Chữa Cháy Dũng Cảm', emoji: '🚒', rarity: 'hiem' },
  { name: 'Tàu Điện Trong Phố', emoji: '🚋', rarity: 'sieu-hiem' },
];

const VU_TRU: readonly StickerSeed[] = [
  { name: 'Mặt Trời Ấm Áp', emoji: '☀️', rarity: 'thuong' },
  { name: 'Mặt Trăng Tròn Xoe', emoji: '🌙', rarity: 'thuong' },
  { name: 'Ngôi Sao Vàng Lấp Lánh', emoji: '⭐', rarity: 'thuong' },
  { name: 'Sao Thổ Có Vành Đẹp', emoji: '🪐', rarity: 'thuong' },
  { name: 'Sao Hoả Màu Cam', emoji: '🔴', rarity: 'thuong' },
  { name: 'Tên Lửa Bay Lên', emoji: '🚀', rarity: 'thuong' },
  { name: 'Phi Hành Gia Dũng Cảm', emoji: '🧑‍🚀', rarity: 'hiem' },
  { name: 'Vệ Tinh Bay Quanh Đất', emoji: '🛰️', rarity: 'hiem' },
  { name: 'Trạm Vũ Trụ To Lớn', emoji: '🛸', rarity: 'hiem' },
  { name: 'Chú Cuội Ngồi Gốc Đa', emoji: '🌝', rarity: 'sieu-hiem' },
];

const KHUNG_LONG: readonly StickerSeed[] = [
  { name: 'Rex Con Khoẻ Mạnh', emoji: '🦖', rarity: 'thuong' },
  { name: 'Cổ Dài Ăn Lá Non', emoji: '🦕', rarity: 'thuong' },
  { name: 'Ba Sừng Hiền Hoà', emoji: '🦕', rarity: 'thuong' },
  { name: 'Cánh Bay Lượn Gió', emoji: '🦅', rarity: 'thuong' },
  { name: 'Vây Lưng Sặc Sỡ', emoji: '🦖', rarity: 'thuong' },
  { name: 'Chân To Đi Khắp Rừng', emoji: '🦕', rarity: 'thuong' },
  { name: 'Khủng Long Ăn Rau', emoji: '🌿', rarity: 'hiem' },
  { name: 'Khủng Long Con Mới Nở', emoji: '🐣', rarity: 'hiem' },
  { name: 'Trứng Khủng Long Đốm', emoji: '🥚', rarity: 'hiem' },
  { name: 'Hoá Thạch Ngàn Năm', emoji: '🦴', rarity: 'sieu-hiem' },
];

const NGHE_NGHIEP: readonly StickerSeed[] = [
  { name: 'Bác Sĩ Tốt Bụng', emoji: '🩺', rarity: 'thuong' },
  { name: 'Cô Giáo Hiền Hoà', emoji: '📚', rarity: 'thuong' },
  { name: 'Chú Bộ Đội Oai Phong', emoji: '🎖️', rarity: 'thuong' },
  { name: 'Cô Công An Tận Tuỵ', emoji: '🚓', rarity: 'thuong' },
  { name: 'Chú Lính Cứu Hoả', emoji: '🧑‍🚒', rarity: 'thuong' },
  { name: 'Bác Đầu Bếp Khéo Tay', emoji: '👨‍🍳', rarity: 'thuong' },
  { name: 'Bác Nông Dân Chăm Chỉ', emoji: '👨‍🌾', rarity: 'hiem' },
  { name: 'Chú Phi Công Lái Giỏi', emoji: '👨‍✈️', rarity: 'hiem' },
  { name: 'Bạn Hoạ Sĩ Vẽ Đẹp', emoji: '🎨', rarity: 'hiem' },
  { name: 'Bé Ca Sĩ Hát Hay', emoji: '🎤', rarity: 'sieu-hiem' },
];

export const STICKERS: readonly Sticker[] = [
  ...buildSet('dong-vat', 'dongvat', DONG_VAT),
  ...buildSet('do-an-tet', 'tet', DO_AN_TET),
  ...buildSet('phuong-tien', 'xe', PHUONG_TIEN),
  ...buildSet('vu-tru', 'vutru', VU_TRU),
  ...buildSet('khung-long', 'dino', KHUNG_LONG),
  ...buildSet('nghe-nghiep', 'nghe', NGHE_NGHIEP),
];

export const STICKER_MAP: ReadonlyMap<string, Sticker> = new Map(STICKERS.map((s) => [s.id, s]));

export function getStickersBySet(setId: StickerSetId): Sticker[] {
  return STICKERS.filter((s) => s.setId === setId);
}
