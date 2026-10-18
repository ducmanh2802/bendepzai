/**
 * T02B/B9+A — Đấu Trường Chính Tả (SpellingDuel) data. Pure TypeScript.
 *
 * T02B/B9: "sách vở" bỏ nhiễu "xách vở" (từ đúng thứ hai) → "sách vỡ";
 * "nồi súp" bỏ "xúp" → "cúp"; "...ông bão" (giông/dông đều đúng) → câu
 * "Con ...ế mèn" (T02D: chỉ d đúng — "Cháu chào ...ạ cụ!" không tự nhiên);
 * "ghe" = thuyền nhỏ (sửa nghĩa gợi ý);
 * "nghiêng" = nghiêng đầu chào (sửa nghĩa); T3 "Điền vần" → "Điền chữ";
 * kéo ✏️→✂️, nghé 🌾→🐃, gấu 🐻→🧸; gợi ý không lộ chữ trong đáp án.
 */

export interface SpellingItem {
  prompt: string;
  emoji: string;
  options: string[];
  answer: string;
  hint: string;
}

export const POOLS: SpellingItem[][] = [
  // T1: c/k
  [
    { prompt: 'Điền chữ còn thiếu: ...on cá', emoji: '🐟', options: ['c', 'k', 'q'], answer: 'c', hint: 'Loài bơi dưới nước' },
    { prompt: 'Điền chữ còn thiếu: ...ẹo', emoji: '🍬', options: ['k', 'c', 'q'], answer: 'k', hint: 'Món ngọt ngào bé thích' },
    { prompt: 'Điền chữ còn thiếu: ...im', emoji: '🧵', options: ['k', 'c', 'h'], answer: 'k', hint: 'Dụng cụ may vá của mẹ' },
    { prompt: 'Điền chữ còn thiếu: ...ửa sổ', emoji: '🏠', options: ['c', 'k', 't'], answer: 'c', hint: 'Nhà nào cũng có để đón nắng' },
    { prompt: 'Điền chữ còn thiếu: ...ính', emoji: '👓', options: ['k', 'c', 'g'], answer: 'k', hint: 'Đeo lên mắt để nhìn rõ' },
    { prompt: 'Chọn từ viết đúng:', emoji: '✂️', options: ['cái kéo', 'kái kéo', 'qái kéo'], answer: 'cái kéo', hint: 'Dụng cụ cắt giấy' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🐱', options: ['con mèo', 'kon mèo', 'con mẻo'], answer: 'con mèo', hint: 'Kêu meo meo, thích bắt chuột' },
    { prompt: 'Điền chữ còn thiếu: ...a hát', emoji: '🎤', options: ['c', 'k', 'q'], answer: 'c', hint: 'Bé cầm mic và cất tiếng' },
  ],
  // T2: g/gh
  [
    { prompt: 'Điền chữ còn thiếu: ...ế gỗ', emoji: '🪑', options: ['gh', 'g', 'k'], answer: 'gh', hint: 'Đồ dùng để ngồi trong lớp' },
    { prompt: 'Điền chữ còn thiếu: ...à', emoji: '🐔', options: ['g', 'gh', 'k'], answer: 'g', hint: 'Gáy ò ó o mỗi sáng' },
    { prompt: 'Điền chữ còn thiếu: ...i nhớ', emoji: '📝', options: ['gh', 'g', 'h'], answer: 'gh', hint: 'Viết bài để thuộc lâu' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🧸', options: ['gấu bông', 'ghấu bông', 'gấu bung'], answer: 'gấu bông', hint: 'Bạn ôm đi ngủ êm mềm' },
    { prompt: 'Điền chữ còn thiếu: ...e đánh cá', emoji: '⛵', options: ['gh', 'g', 'k'], answer: 'gh', hint: 'Chiếc thuyền nhỏ đi trên sông' },
    { prompt: 'Điền chữ còn thiếu: ...ỗng', emoji: '🦢', options: ['ng', 'ngh', 'g'], answer: 'ng', hint: 'Con vật cổ dài kêu to' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🎁', options: ['quà tặng', 'qùa tặng', 'quà tăng'], answer: 'quà tặng', hint: 'Bé nhận vào sinh nhật' },
    { prompt: 'Điền chữ còn thiếu: ...i chép', emoji: '📒', options: ['gh', 'g', 'k'], answer: 'gh', hint: 'Vở viết bài hằng ngày' },
  ],
  // T3: ng/ngh
  [
    { prompt: 'Điền chữ còn thiếu: ...ỉ ngơi', emoji: '😴', options: ['ngh', 'ng', 'nh'], answer: 'ngh', hint: 'Nằm nhắm mắt cho khỏe' },
    { prompt: 'Điền chữ còn thiếu: ...ủ', emoji: '😴', options: ['ng', 'ngh', 'n'], answer: 'ng', hint: 'Nhắm mắt đi vào giấc' },
    { prompt: 'Điền chữ còn thiếu: ...ỉ hè', emoji: '☀️', options: ['ngh', 'ng', 'gh'], answer: 'ngh', hint: 'Kỳ vui chơi sau năm học' },
    { prompt: 'Điền chữ còn thiếu: ...à voi', emoji: '🐘', options: ['ng', 'ngh', 'n'], answer: 'ng', hint: 'Món quý lấy từ chú voi' },
    { prompt: 'Điền chữ còn thiếu: ...on nớt', emoji: '🐣', options: ['n', 'ng', 'ngh'], answer: 'n', hint: 'Chú chim mới nở yếu ớt' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🐃', options: ['nghé con', 'ngé con', 'nghé kon'], answer: 'nghé con', hint: 'Chú trâu nhỏ ngoài đồng' },
    { prompt: 'Điền chữ còn thiếu: ...iêng đầu chào', emoji: '🙇', options: ['ngh', 'ng', 'n'], answer: 'ngh', hint: 'Chào người lớn lễ phép' },
    { prompt: 'Điền chữ còn thiếu: ...ệ sĩ', emoji: '🎨', options: ['ngh', 'ng', 'nh'], answer: 'ngh', hint: 'Người vẽ tranh rất đẹp' },
  ],
  // T4: ôn tập c/k, g/gh, ng/ngh (không có ch/tr, s/x, d/gi/r)
  [
    { prompt: 'Điền chữ còn thiếu: ...ua', emoji: '🦀', options: ['c', 'k', 'q'], answer: 'c', hint: 'Con vật có càng' },
    { prompt: 'Điền chữ còn thiếu: ...ỗ', emoji: '🌳', options: ['g', 'gh', 'k'], answer: 'g', hint: 'Bàn ghế làm từ gì' },
    { prompt: 'Điền chữ còn thiếu: ...e', emoji: '👂', options: ['ngh', 'ng', 'nh'], answer: 'ngh', hint: 'Dùng tai để làm gì' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🐓', options: ['con gà', 'con ghà', 'kon gà'], answer: 'con gà', hint: 'Gáy ò ó o mỗi sáng' },
    { prompt: 'Điền chữ còn thiếu: ...áy', emoji: '💤', options: ['ng', 'ngh', 'nh'], answer: 'ng', hint: 'Điều bé phát ra khi say giấc' },
    { prompt: 'Điền chữ còn thiếu: ...i', emoji: '📝', options: ['gh', 'g', 'h'], answer: 'gh', hint: 'Viết chữ vào vở' },
    { prompt: 'Điền chữ còn thiếu: ...a', emoji: '🎤', options: ['c', 'k', 'q'], answer: 'c', hint: 'Hát một bài' },
    { prompt: 'Điền chữ còn thiếu: ...ề', emoji: '🧑‍🌾', options: ['ngh', 'ng', 'nh'], answer: 'ngh', hint: 'Công việc nuôi sống' },
  ],
  // T5: thử thách ch/tr, s/x
  [
    { prompt: 'Chọn từ viết đúng:', emoji: '🌳', options: ['cây tre', 'cây che', 'cây trè'], answer: 'cây tre', hint: 'Cây cao mọc thành bụi' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🐦', options: ['chim sẻ', 'trim sẻ', 'chim xẻ'], answer: 'chim sẻ', hint: 'Chú chim nhỏ hót hay' },
    { prompt: 'Chọn từ viết đúng:', emoji: '☀️', options: ['mặt trời', 'mặt chời', 'mặt tời'], answer: 'mặt trời', hint: 'Ông tỏa nắng ban ngày' },
    { prompt: 'Chọn từ viết đúng (đồ dùng học tập):', emoji: '🎒', options: ['sách vở', 'sách vỡ', 'sát vở'], answer: 'sách vở', hint: 'Mang đến trường mỗi ngày' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🧹', options: ['cái chổi', 'cái trổi', 'cái chỗi'], answer: 'cái chổi', hint: 'Dùng quét nhà sạch' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🍲', options: ['nồi súp', 'nồi cúp', 'nồi sup'], answer: 'nồi súp', hint: 'Món nước nóng thơm ngon' },
    { prompt: 'Điền chữ còn thiếu: ...ái cây', emoji: '🍎', options: ['tr', 'ch', 's'], answer: 'tr', hint: 'Ăn vào khỏe người' },
    { prompt: 'Điền chữ còn thiếu: ...e mưa', emoji: '🌧️', options: ['ch', 'tr', 'x'], answer: 'ch', hint: 'Giơ ô khi trời đổ' },
  ],
  // T6: thử thách d/gi/r + tổng hợp ("...ông bão" giông/dông đều đúng nên bỏ;
  // T02D: "Cháu chào ...ạ cụ!" không phải câu tự nhiên → "Con ...ế mèn")
  [
    { prompt: 'Chọn từ viết đúng:', emoji: '🍉', options: ['dưa hấu', 'giưa hấu', 'rưa hấu'], answer: 'dưa hấu', hint: 'Quả to ruột đỏ hạt đen' },
    { prompt: 'Chọn từ viết đúng:', emoji: '👩‍🏫', options: ['giáo viên', 'dáo viên', 'ráo viên'], answer: 'giáo viên', hint: 'Người dạy bé học' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🐍', options: ['con rắn', 'con dắn', 'con giắn'], answer: 'con rắn', hint: 'Loài bò sát dài trườn đi' },
    { prompt: 'Chọn từ viết đúng:', emoji: '🌧️', options: ['giọt mưa', 'dọt mưa', 'rọt mưa'], answer: 'giọt mưa', hint: 'Hạt nước rơi từ mây' },
    { prompt: 'Điền chữ còn thiếu: Con ...ế mèn', emoji: '🦗', options: ['d', 'gi', 'r'], answer: 'd', hint: 'Chú nhỏ kêu rỉ rả ngoài đồng' },
    { prompt: 'Điền chữ còn thiếu: ...ễ dàng', emoji: '😊', options: ['d', 'gi', 'r'], answer: 'd', hint: 'Làm một cái là xong' },
    { prompt: 'Điền chữ còn thiếu: ...ổ bánh', emoji: '🍞', options: ['r', 'd', 'gi'], answer: 'r', hint: 'Đựng bánh mới ra lò' },
    { prompt: 'Chọn câu viết đúng chính tả:', emoji: '🏫', options: ['Bé đến trường học bài', 'Bé đến chường học bài', 'Bé đến trường học bải'], answer: 'Bé đến trường học bài', hint: 'Câu nói về buổi sáng' },
  ],
];

export interface SpellingRound {
  item: SpellingItem;
  options: string[];
}

import { GAME_LEVEL_POLICY } from '../../config/policy';
import { seededRng, shuffleSeeded } from '../gameLevels';

export function buildSpellingRounds(tier: number, seed = 0): SpellingRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), POOLS.length);
  const pool = POOLS[safeTier - 1];
  const count = GAME_LEVEL_POLICY.ROUNDS_PER_TIER[Math.min(safeTier - 1, GAME_LEVEL_POLICY.ROUNDS_PER_TIER.length - 1)];
  const list = shuffleSeeded(pool, seededRng(safeTier * 1000 + 7 + seed * 101));
  const rounds: SpellingRound[] = [];
  for (let i = 0; i < count; i++) {
    const item = list[i % list.length];
    rounds.push({
      item,
      options: shuffleSeeded(item.options, seededRng(safeTier * 7919 + i * 131 + seed * 17)),
    });
  }
  return rounds;
}

export function buildRounds(tier: number, seed = 0): SpellingRound[] {
  return buildSpellingRounds(tier, seed);
}
