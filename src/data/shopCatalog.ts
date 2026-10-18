/**
 * T18A — Shop: 43 món (mũ, kính, áo, ba lô, thú cưng, nền, khung avatar).
 * Món mở theo level của bé (`minLevel`); sao dùng để mua, vé dùng cho
 * máy gắp sticker. 12 món đầu giữ nguyên id/giá/trạng thái như trước
 * P42 để không mất đồ bé đã mở.
 */
import type { ShopItem } from '../types/motivation';

export const SHOP_CATALOG: readonly ShopItem[] = [
  // --- 12 món gốc (giữ nguyên id, giá, unlocked) ---
  { id: 'hat_cap', name: 'Mũ Lưỡi Trai Năng Động', type: 'hat', emoji: '🧢', priceStars: 5, minLevel: 1, unlocked: true },
  { id: 'hat_crown', name: 'Vương Miện Trạng Nguyên', type: 'hat', emoji: '👑', priceStars: 20, minLevel: 12, unlocked: false },
  { id: 'hat_party', name: 'Mũ Sinh Nhật Vui Vẻ', type: 'hat', emoji: '🥳', priceStars: 10, minLevel: 4, unlocked: false },
  { id: 'hat_scholar', name: 'Mũ Tiến Sĩ Nhí', type: 'hat', emoji: '🎓', priceStars: 25, minLevel: 15, unlocked: false },
  { id: 'glasses_cool', name: 'Kính Râm Siêu Ngầu', type: 'glasses', emoji: '🕶️', priceStars: 10, minLevel: 5, unlocked: false },
  { id: 'glasses_nerd', name: 'Kính Tròn Tri Thức', type: 'glasses', emoji: '👓', priceStars: 8, minLevel: 1, unlocked: true },
  { id: 'shirt_super', name: 'Áo Choàng Siêu Nhân', type: 'shirt', emoji: '🦸', priceStars: 15, minLevel: 7, unlocked: false },
  { id: 'shirt_space', name: 'Bộ Đồ Phi Hành Gia', type: 'shirt', emoji: '🧑‍🚀', priceStars: 30, minLevel: 16, unlocked: false },
  { id: 'bag_dino', name: 'Balo Khủng Long Xanh', type: 'backpack', emoji: '🎒', priceStars: 12, minLevel: 1, unlocked: true },
  { id: 'pet_cat', name: 'Mèo Miu Miu Đồng Hành', type: 'pet', emoji: '🐱', priceStars: 25, minLevel: 10, unlocked: false },
  { id: 'pet_puppy', name: 'Cún Con Thông Minh', type: 'pet', emoji: '🐶', priceStars: 25, minLevel: 10, unlocked: false },
  { id: 'pet_dragon', name: 'Rồng Con May Mắn', type: 'pet', emoji: '🐲', priceStars: 50, minLevel: 20, unlocked: false },
  // --- Mũ mới ---
  { id: 'hat_nonla', name: 'Nón Lá Quê Em', type: 'hat', emoji: '👒', priceStars: 8, minLevel: 3, unlocked: false },
  { id: 'hat_len', name: 'Mũ Len Ấm Áp', type: 'hat', emoji: '🧶', priceStars: 12, minLevel: 5, unlocked: false },
  { id: 'hat_cowboy', name: 'Mũ Cao Bồi Nhí', type: 'hat', emoji: '🤠', priceStars: 18, minLevel: 8, unlocked: false },
  { id: 'hat_explorer', name: 'Mũ Thám Hiểm Rừng Xanh', type: 'hat', emoji: '🎩', priceStars: 22, minLevel: 10, unlocked: false },
  // --- Kính mới ---
  { id: 'glasses_swim', name: 'Kính Bơi Xanh Mát', type: 'glasses', emoji: '🥽', priceStars: 6, minLevel: 2, unlocked: false },
  { id: 'glasses_star', name: 'Kính Mắt Ngôi Sao', type: 'glasses', emoji: '🤩', priceStars: 14, minLevel: 6, unlocked: false },
  { id: 'glasses_heart', name: 'Kính Mắt Trái Tim', type: 'glasses', emoji: '😍', priceStars: 16, minLevel: 7, unlocked: false },
  // --- Áo mới ---
  { id: 'shirt_yellow', name: 'Áo Thun Vàng Nắng', type: 'shirt', emoji: '👕', priceStars: 6, minLevel: 1, unlocked: false },
  { id: 'shirt_rainbow', name: 'Áo Cầu Vồng Rực Rỡ', type: 'shirt', emoji: '🌈', priceStars: 14, minLevel: 6, unlocked: false },
  { id: 'shirt_star', name: 'Áo Ngôi Sao May Mắn', type: 'shirt', emoji: '⭐', priceStars: 18, minLevel: 9, unlocked: false },
  { id: 'shirt_bear', name: 'Áo Gấu Dâu Dễ Thương', type: 'shirt', emoji: '🐻', priceStars: 20, minLevel: 10, unlocked: false },
  // --- Ba lô mới ---
  { id: 'bag_school', name: 'Cặp Sách Mới Tinh', type: 'backpack', emoji: '📚', priceStars: 10, minLevel: 4, unlocked: false },
  { id: 'bag_flower', name: 'Túi Vải Hoa Xinh', type: 'backpack', emoji: '🌸', priceStars: 8, minLevel: 3, unlocked: false },
  { id: 'bag_rocket', name: 'Ba Lô Tên Lửa Bay', type: 'backpack', emoji: '🚀', priceStars: 24, minLevel: 12, unlocked: false },
  // --- Thú cưng mới ---
  { id: 'pet_parrot', name: 'Vẹt Xanh Biết Nói', type: 'pet', emoji: '🦜', priceStars: 30, minLevel: 12, unlocked: false },
  { id: 'pet_goldfish', name: 'Cá Vàng Tung Tăng', type: 'pet', emoji: '🐠', priceStars: 20, minLevel: 8, unlocked: false },
  { id: 'pet_penguin', name: 'Chim Cánh Cụt Vui Vẻ', type: 'pet', emoji: '🐧', priceStars: 35, minLevel: 15, unlocked: false },
  { id: 'pet_panda', name: 'Gấu Trúc Hiền Lành', type: 'pet', emoji: '🐼', priceStars: 40, minLevel: 18, unlocked: false },
  // --- Nền trang chủ ---
  { id: 'bg_sea', name: 'Nền Biển Xanh Rì Rào', type: 'background', emoji: '🌊', priceStars: 15, minLevel: 5, unlocked: false },
  { id: 'bg_forest', name: 'Nền Rừng Xanh Mát', type: 'background', emoji: '🌳', priceStars: 15, minLevel: 5, unlocked: false },
  { id: 'bg_night', name: 'Nền Bầu Trời Đầy Sao', type: 'background', emoji: '🌟', priceStars: 25, minLevel: 10, unlocked: false },
  { id: 'bg_garden', name: 'Nền Vườn Hoa Rực Rỡ', type: 'background', emoji: '🌷', priceStars: 20, minLevel: 8, unlocked: false },
  { id: 'bg_mountain', name: 'Nền Núi Cao Mây Trắng', type: 'background', emoji: '⛰️', priceStars: 30, minLevel: 14, unlocked: false },
  { id: 'bg_rainbow', name: 'Nền Cầu Vồng Sau Mưa', type: 'background', emoji: '🌈', priceStars: 35, minLevel: 16, unlocked: false },
  // --- Khung avatar ---
  { id: 'frame_gold', name: 'Khung Vàng Lấp Lánh', type: 'frame', emoji: '⭐', priceStars: 10, minLevel: 4, unlocked: false },
  { id: 'frame_candy', name: 'Khung Bánh Kẹo Ngọt', type: 'frame', emoji: '🍬', priceStars: 12, minLevel: 5, unlocked: false },
  { id: 'frame_balloon', name: 'Khung Bong Bóng Bay', type: 'frame', emoji: '🎈', priceStars: 16, minLevel: 7, unlocked: false },
  { id: 'frame_flower', name: 'Khung Hoa Xinh Tươi', type: 'frame', emoji: '🌸', priceStars: 22, minLevel: 11, unlocked: false },
  { id: 'frame_shell', name: 'Khung Sao Biển Mát Lạnh', type: 'frame', emoji: '🐚', priceStars: 28, minLevel: 13, unlocked: false },
];

export const SHOP_MAP: ReadonlyMap<string, ShopItem> = new Map(SHOP_CATALOG.map((i) => [i.id, i]));
