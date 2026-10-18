/**
 * T02B/B4+A — Chuyện Kể Toán Học (WordStory) data. Pure TypeScript.
 * T02B/B4: TẤT CẢ các phép tính (kể cả tier 2–3) đều KHÔNG nhớ / KHÔNG mượn,
 * kết quả 0–100. Tier 4/5/6 có 7/8/8 item (đủ số vòng, không lặp câu).
 */

import { GAME_LEVEL_POLICY } from '../../config/policy';
import { seededRng, shuffleSeeded } from '../gameLevels';

export interface StoryItem {
  story: string;
  emoji: string;
  question: string;
  options: string[];
  answer: string;
  hint: string;
}

export const POOLS: StoryItem[][] = [
  [
    { story: 'Lan có 3 quả táo. Mẹ cho thêm 2 quả.', emoji: '🍎', question: 'Lan có tất cả mấy quả táo?', options: ['5 quả', '4 quả', '6 quả'], answer: '5 quả', hint: '3 + 2 = 5' },
    { story: 'Bé có 5 viên bi, cho bạn 1 viên.', emoji: '🔮', question: 'Bé còn mấy viên bi?', options: ['4 viên', '6 viên', '5 viên'], answer: '4 viên', hint: '5 - 1 = 4' },
    { story: 'Trên cành có 4 chú chim, bay đến thêm 3 chú.', emoji: '🐦', question: 'Có tất cả mấy chú chim?', options: ['7 chú', '6 chú', '5 chú'], answer: '7 chú', hint: '4 + 3 = 7' },
    { story: 'Hộp có 6 cái bánh, bé ăn 2 cái.', emoji: '🍪', question: 'Còn mấy cái bánh?', options: ['4 cái', '8 cái', '6 cái'], answer: '4 cái', hint: '6 - 2 = 4' },
    { story: 'Lớp có 5 bạn trai và 4 bạn gái.', emoji: '👫', question: 'Cả lớp có mấy bạn?', options: ['9 bạn', '8 bạn', '10 bạn'], answer: '9 bạn', hint: '5 + 4 = 9' },
    { story: 'Ao có 7 con cá, bắt đi 3 con.', emoji: '🐟', question: 'Còn mấy con cá?', options: ['4 con', '10 con', '5 con'], answer: '4 con', hint: '7 - 3 = 4' },
  ],
  // T02B/B4 — tier 2 rewritten: no-carry / no-borrow only.
  [
    { story: 'Vườn có 6 cây cam và 3 cây bưởi.', emoji: '🍊', question: 'Vườn có mấy cây?', options: ['9 cây', '8 cây', '10 cây'], answer: '9 cây', hint: '6 + 3 = 9' },
    { story: 'Bé gấp 8 con hạc, tặng bạn 5 con.', emoji: '🦩', question: 'Bé còn mấy con hạc?', options: ['3 con', '13 con', '5 con'], answer: '3 con', hint: '8 - 5 = 3' },
    { story: 'Xe buýt có 8 bạn, thêm 1 bạn lên xe.', emoji: '🚌', question: 'Xe có mấy bạn?', options: ['9 bạn', '8 bạn', '7 bạn'], answer: '9 bạn', hint: '8 + 1 = 9' },
    { story: 'Tủ có 12 quyển truyện, cho em 2 quyển.', emoji: '📚', question: 'Còn mấy quyển?', options: ['10 quyển', '14 quyển', '9 quyển'], answer: '10 quyển', hint: '12 - 2 = 10' },
    { story: 'Sân có 10 bông hoa, nở thêm 5 bông.', emoji: '🌸', question: 'Có mấy bông hoa?', options: ['15 bông', '14 bông', '16 bông'], answer: '15 bông', hint: '10 + 5 = 15' },
    { story: 'Mẹ mua 11 quả trứng, dùng 1 quả để rán.', emoji: '🥚', question: 'Còn mấy quả trứng?', options: ['10 quả', '12 quả', '9 quả'], answer: '10 quả', hint: '11 - 1 = 10' },
  ],
  // T02B/B4 — tier 3 rewritten: no-carry / no-borrow only.
  [
    { story: 'Bé Lan đọc 5 trang sáng, 3 trang chiều.', emoji: '📖', question: 'Cả ngày đọc mấy trang?', options: ['8 trang', '7 trang', '9 trang'], answer: '8 trang', hint: '5 + 3 = 8' },
    { story: 'Bình có 14 que tính, dùng 4 que xếp hình.', emoji: '🥢', question: 'Còn mấy que?', options: ['10 que', '18 que', '9 que'], answer: '10 que', hint: '14 - 4 = 10' },
    { story: 'Đàn gà có 8 con, nở thêm 1 con.', emoji: '🐔', question: 'Đàn gà có mấy con?', options: ['9 con', '8 con', '10 con'], answer: '9 con', hint: '8 + 1 = 9' },
    { story: 'Cửa hàng có 20 cái kẹo, bán 10 cái.', emoji: '🍬', question: 'Còn mấy cái kẹo?', options: ['10 cái', '30 cái', '9 cái'], answer: '10 cái', hint: '20 - 10 = 10' },
    { story: 'Tổ 1 trồng 11 cây, tổ 2 trồng 7 cây.', emoji: '🌳', question: 'Hai tổ trồng mấy cây?', options: ['18 cây', '17 cây', '19 cây'], answer: '18 cây', hint: '11 + 7 = 18' },
    { story: 'Bé có 16 sticker, dán hết 5 cái.', emoji: '⭐', question: 'Còn mấy sticker?', options: ['11 cái', '21 cái', '10 cái'], answer: '11 cái', hint: '16 - 5 = 11' },
  ],
  // T4: cộng/trừ KHÔNG nhớ trong 100 (7 items = 7 rounds)
  [
    { story: 'Hộp có 24 cái bánh, mẹ cho thêm 3 cái.', emoji: '🍪', question: 'Hộp có mấy cái bánh?', options: ['27 cái', '26 cái', '28 cái'], answer: '27 cái', hint: '24 + 3 = 27' },
    { story: 'Lớp có 31 bạn, thêm 5 bạn mới.', emoji: '🧒', question: 'Lớp có mấy bạn?', options: ['36 bạn', '35 bạn', '37 bạn'], answer: '36 bạn', hint: '31 + 5 = 36' },
    { story: 'Bé có 42 sticker, dán hết 11 cái.', emoji: '⭐', question: 'Còn mấy sticker?', options: ['31 cái', '32 cái', '30 cái'], answer: '31 cái', hint: '42 - 11 = 31' },
    { story: 'Sân có 56 bông hoa, héo 23 bông.', emoji: '🌸', question: 'Còn mấy bông tươi?', options: ['33 bông', '32 bông', '34 bông'], answer: '33 bông', hint: '56 - 23 = 33' },
    { story: 'Thư viện có 48 sách, cho mượn 15 sách.', emoji: '📚', question: 'Còn mấy sách?', options: ['33 sách', '32 sách', '34 sách'], answer: '33 sách', hint: '48 - 15 = 33' },
    { story: 'Bé chạy 12 vòng sáng, 11 vòng chiều.', emoji: '🏃', question: 'Cả ngày mấy vòng?', options: ['23 vòng', '22 vòng', '24 vòng'], answer: '23 vòng', hint: '12 + 11 = 23' },
    { story: 'Bé có 35 viên bi, được tặng thêm 24 viên.', emoji: '🔮', question: 'Bé có mấy viên bi?', options: ['59 viên', '58 viên', '60 viên'], answer: '59 viên', hint: '35 + 24 = 59' },
  ],
  // T5: cộng/trừ KHÔNG nhớ trong 100 (8 items = 8 rounds)
  [
    { story: 'Mẹ đi chợ với 50 nghìn, mua rau 10 nghìn.', emoji: '🥬', question: 'Còn mấy nghìn?', options: ['40 nghìn', '60 nghìn', '30 nghìn'], answer: '40 nghìn', hint: '50 - 10 = 40' },
    { story: 'Lớp 1A 32 bạn, lớp 1B 25 bạn.', emoji: '🏫', question: 'Hai lớp mấy bạn?', options: ['57 bạn', '56 bạn', '58 bạn'], answer: '57 bạn', hint: '32 + 25 = 57' },
    { story: 'Sân bay có 48 máy bay, cất cánh 16 chiếc.', emoji: '✈️', question: 'Còn mấy chiếc?', options: ['32 chiếc', '31 chiếc', '33 chiếc'], answer: '32 chiếc', hint: '48 - 16 = 32' },
    { story: 'Bé tiết kiệm 24 nghìn rồi thêm 35 nghìn.', emoji: '🐷', question: 'Có mấy nghìn?', options: ['59 nghìn', '58 nghìn', '60 nghìn'], answer: '59 nghìn', hint: '24 + 35 = 59' },
    { story: 'Vườn 65 hoa, héo 24 hoa.', emoji: '🌷', question: 'Còn mấy hoa tươi?', options: ['41 hoa', '40 hoa', '42 hoa'], answer: '41 hoa', hint: '65 - 24 = 41' },
    { story: 'Truyện 76 trang, đọc 34 trang.', emoji: '📖', question: 'Còn mấy trang?', options: ['42 trang', '41 trang', '43 trang'], answer: '42 trang', hint: '76 - 34 = 42' },
    { story: 'Thư viện có 43 sách, thêm 25 sách mới.', emoji: '📚', question: 'Có mấy sách?', options: ['68 sách', '67 sách', '69 sách'], answer: '68 sách', hint: '43 + 25 = 68' },
    { story: 'Sân có 87 quả bóng, cất đi 53 quả.', emoji: '⚽', question: 'Còn mấy quả?', options: ['34 quả', '33 quả', '35 quả'], answer: '34 quả', hint: '87 - 53 = 34' },
  ],
  // T6: cộng/trừ KHÔNG nhớ trong 100 (8 items = 8 rounds)
  [
    { story: 'Trại hè 52 bạn, thêm 34 bạn đăng ký.', emoji: '⛺', question: 'Có mấy bạn?', options: ['86 bạn', '85 bạn', '87 bạn'], answer: '86 bạn', hint: '52 + 34 = 86' },
    { story: 'Kho 96 thùng, xuất 52 thùng.', emoji: '📦', question: 'Còn mấy thùng?', options: ['44 thùng', '43 thùng', '45 thùng'], answer: '44 thùng', hint: '96 - 52 = 44' },
    { story: 'Bé có 23 bút chì và 24 bút màu.', emoji: '🖍️', question: 'Có mấy cái bút?', options: ['47 bút', '46 bút', '48 bút'], answer: '47 bút', hint: '23 + 24 = 47' },
    { story: 'Sách 89 trang, đọc 56 trang.', emoji: '📕', question: 'Còn mấy trang?', options: ['33 trang', '32 trang', '34 trang'], answer: '33 trang', hint: '89 - 56 = 33' },
    { story: 'Đội trống 34 bạn nam và 25 bạn nữ.', emoji: '🥁', question: 'Đội có mấy bạn?', options: ['59 bạn', '58 bạn', '60 bạn'], answer: '59 bạn', hint: '34 + 25 = 59' },
    { story: 'Siêu thị 78 kẹo, bán 45 kẹo.', emoji: '🏪', question: 'Còn mấy kẹo?', options: ['33 kẹo', '32 kẹo', '34 kẹo'], answer: '33 kẹo', hint: '78 - 45 = 33' },
    { story: 'Vườn có 61 hoa, nở thêm 37 hoa.', emoji: '🌷', question: 'Có mấy hoa?', options: ['98 hoa', '97 hoa', '99 hoa'], answer: '98 hoa', hint: '61 + 37 = 98' },
    { story: 'Kho có 95 thùng, xuất 43 thùng.', emoji: '📦', question: 'Còn mấy thùng?', options: ['52 thùng', '51 thùng', '53 thùng'], answer: '52 thùng', hint: '95 - 43 = 52' },
  ],
];

export interface WordStoryRound {
  item: StoryItem;
  options: string[];
}

/**
 * Deterministic per (tier, seed, roundIdx): item order + option order both
 * mix the seed (component passes stage.nonce). No repeats within a tier
 * while pool ≥ rounds (guaranteed by pool sizes above).
 */
export function buildWordStoryRounds(tier: number, seed = 0): WordStoryRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), POOLS.length);
  const pool = POOLS[safeTier - 1];
  const count = GAME_LEVEL_POLICY.ROUNDS_PER_TIER[Math.min(safeTier - 1, GAME_LEVEL_POLICY.ROUNDS_PER_TIER.length - 1)];
  const list = shuffleSeeded(pool, seededRng(safeTier * 4000 + 9 + seed * 101));
  const rounds: WordStoryRound[] = [];
  for (let i = 0; i < count; i++) {
    const item = list[i % list.length];
    rounds.push({
      item,
      options: shuffleSeeded(item.options, seededRng(safeTier * 331 + i * 91 + seed * 17)),
    });
  }
  return rounds;
}

export function buildRounds(tier: number, seed = 0): WordStoryRound[] {
  return buildWordStoryRounds(tier, seed);
}
