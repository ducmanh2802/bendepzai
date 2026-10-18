/**
 * T02B/B4+B8+A — Thám Hiểm Giờ & Tiền (ClockMoney) data. Pure TypeScript.
 *
 * T02B/B8: hint chỉ hiện khi bé bấm "Gợi ý" (component) và KHÔNG chứa đáp
 * án; đề không nêu sẵn đáp án; bỏ mét/dm/km (lớp 2), bỏ 110cm (> 100);
 * câu khoảng thời gian hỏi "bao lâu" (không hỏi "mấy giờ").
 * T02B/B4: mọi phép tính KHÔNG nhớ / KHÔNG mượn, kết quả 0–100.
 * T02B/B7: tier 4/5/6 có 7/8/8 item (đủ số vòng, không lặp câu).
 */

import { GAME_LEVEL_POLICY } from '../../config/policy';
import { seededRng, shuffleSeeded } from '../gameLevels';

export interface QuizItem {
  prompt: string;
  emoji: string;
  options: string[];
  answer: string;
  hint: string;
}

export const POOLS: QuizItem[][] = [
  [
    { prompt: 'Nhìn chiếc đồng hồ này, bé cho biết mấy giờ?', emoji: '🕖', options: ['7 giờ', '8 giờ', '6 giờ'], answer: '7 giờ', hint: 'Nhìn kim ngắn nhé!' },
    { prompt: 'Bé có 1 tờ 1000đ, mẹ cho thêm 1 tờ 1000đ. Có mấy?', emoji: '💵', options: ['2000đ', '1000đ', '3000đ'], answer: '2000đ', hint: 'Một nghìn thêm một nghìn' },
    { prompt: 'Cây bút chì dài khoảng mấy?', emoji: '✏️', options: ['15cm', '5cm', '50cm'], answer: '15cm', hint: 'Bằng một gang tay' },
    { prompt: 'Sáng bé đi học lúc nào?', emoji: '🌅', options: ['7 giờ sáng', '12 giờ đêm', '7 giờ tối'], answer: '7 giờ sáng', hint: 'Trời vừa sáng' },
    { prompt: 'Thứ Hai rồi đến thứ mấy?', emoji: '📅', options: ['Thứ Ba', 'Chủ Nhật', 'Thứ Bảy'], answer: 'Thứ Ba', hint: 'Hát các thứ trong tuần' },
    { prompt: 'Cái thước dài 20cm, cắt 5cm còn mấy?', emoji: '📏', options: ['15cm', '25cm', '10cm'], answer: '15cm', hint: 'Lấy phần dài trừ phần cắt' },
  ],
  [
    { prompt: 'Nhìn chiếc đồng hồ này, kim ngắn chỉ số mấy?', emoji: '🕛', options: ['12', '6', '3'], answer: '12', hint: 'Cả hai kim cùng một chỗ' },
    { prompt: 'Mẹ cho 5000đ, mua kẹo 2000đ còn mấy?', emoji: '🍬', options: ['3000đ', '7000đ', '2000đ'], answer: '3000đ', hint: 'Lấy tiền mẹ cho trừ tiền kẹo' },
    { prompt: 'Gang tay bé dài khoảng mấy?', emoji: '🤏', options: ['15cm', '5cm', '50cm'], answer: '15cm', hint: 'Mở bàn tay ra đo' },
    { prompt: 'Buổi tối bé ngủ lúc nào?', emoji: '🌙', options: ['9 giờ tối', '9 giờ sáng', '12 giờ trưa'], answer: '9 giờ tối', hint: 'Trời đã tối đen' },
    { prompt: 'Hôm nay thứ Tư, hôm qua là thứ mấy?', emoji: '📆', options: ['Thứ Ba', 'Thứ Năm', 'Thứ Hai'], answer: 'Thứ Ba', hint: 'Lùi lại một ngày' },
    { prompt: 'Đoạn dây 10cm nối thêm 4cm. Dài mấy?', emoji: '🧵', options: ['14cm', '6cm', '10cm'], answer: '14cm', hint: 'Nối vào thì dài thêm' },
  ],
  [
    { prompt: 'Nhìn chiếc đồng hồ này, kim ngắn cho biết mấy giờ?', emoji: '🕒', options: ['3 giờ', '12 giờ', '6 giờ'], answer: '3 giờ', hint: 'Nhìn kim ngắn nhé!' },
    { prompt: '2 tờ 2000đ với 1 tờ 1000đ. Tổng mấy?', emoji: '💰', options: ['5000đ', '4000đ', '6000đ'], answer: '5000đ', hint: 'Cộng từng tờ một' },
    { prompt: 'Quyển vở dài khoảng mấy?', emoji: '📓', options: ['20cm', '5cm', '2cm'], answer: '20cm', hint: 'Dài hơn gang tay một chút' },
    { prompt: 'Một tuần có mấy ngày?', emoji: '🗓️', options: ['7 ngày', '5 ngày', '10 ngày'], answer: '7 ngày', hint: 'Hát các thứ nhé!' },
    { prompt: 'Bé cao 95cm, bạn cao 90cm. Ai cao hơn?', emoji: '📐', options: ['Bé', 'Bạn', 'Bằng nhau'], answer: 'Bé', hint: 'Số nào lớn hơn?' },
    { prompt: 'Sáng 7 giờ, thêm 2 giờ nữa là lúc nào?', emoji: '⏰', options: ['9 giờ', '5 giờ', '10 giờ'], answer: '9 giờ', hint: 'Đếm thêm lên' },
  ],
  [
    { prompt: 'Nhìn chiếc đồng hồ này, bé cho biết mấy giờ?', emoji: '🕕', options: ['6 giờ', '12 giờ', '9 giờ'], answer: '6 giờ', hint: 'Nhìn kim ngắn nhé!' },
    { prompt: 'Mua vở 8000đ, đưa 10000đ, thối lại mấy?', emoji: '📒', options: ['2000đ', '18000đ', '8000đ'], answer: '2000đ', hint: 'Lấy tiền đưa trừ tiền vở' },
    { prompt: 'Sợi dây dài 30cm, cắt 10cm còn mấy?', emoji: '🧵', options: ['20cm', '40cm', '10cm'], answer: '20cm', hint: 'Lấy phần dài trừ phần cắt' },
    { prompt: 'Sau tháng 1 là tháng mấy?', emoji: '📅', options: ['Tháng 2', 'Tháng 12', 'Tháng 3'], answer: 'Tháng 2', hint: 'Đếm tháng tiếp theo' },
    { prompt: 'Mua bánh 3000đ, đưa 5000đ, thối lại mấy?', emoji: '🍞', options: ['2000đ', '8000đ', '3000đ'], answer: '2000đ', hint: 'Lấy tiền đưa trừ tiền bánh' },
    { prompt: 'Bé có 10 viên bi, cho bạn 3 viên còn mấy?', emoji: '🔮', options: ['7 viên', '13 viên', '3 viên'], answer: '7 viên', hint: 'Cho đi thì còn ít lại' },
    { prompt: 'Hôm nay thứ Hai, ngày mai là thứ mấy?', emoji: '📆', options: ['Thứ Ba', 'Chủ Nhật', 'Thứ Hai'], answer: 'Thứ Ba', hint: 'Ngày tiếp theo' },
  ],
  [
    { prompt: 'Nhìn chiếc đồng hồ này, bé cho biết mấy giờ?', emoji: '🕔', options: ['5 giờ', '12 giờ', '6 giờ'], answer: '5 giờ', hint: 'Nhìn kim ngắn nhé!' },
    { prompt: 'Bé có 3 tờ 2000đ. Tổng mấy?', emoji: '💵', options: ['6000đ', '5000đ', '7000đ'], answer: '6000đ', hint: 'Cộng từng tờ một' },
    { prompt: 'Cái bàn cao 70cm, ghế cao 40cm. Bàn hơn ghế mấy?', emoji: '🪑', options: ['30cm', '10cm', '20cm'], answer: '30cm', hint: 'Lấy chỗ cao trừ chỗ thấp' },
    { prompt: 'Hôm nay thứ Sáu, 2 ngày nữa là hôm nào?', emoji: '📆', options: ['Chủ Nhật', 'Thứ Bảy', 'Thứ Hai'], answer: 'Chủ Nhật', hint: 'Đếm tới hai ngày' },
    { prompt: 'Sợi dây nào dài nhất?', emoji: '📐', options: ['100cm', '90cm', '9cm'], answer: '100cm', hint: 'Số nào lớn nhất?' },
    { prompt: 'Lan có 6 quả cam, thêm 3 quả. Tất cả mấy?', emoji: '🍊', options: ['9 quả', '8 quả', '10 quả'], answer: '9 quả', hint: 'Cộng hai nhóm lại' },
    { prompt: 'Tờ 5000đ đổi được mấy tờ 1000đ?', emoji: '💰', options: ['5 tờ', '4 tờ', '6 tờ'], answer: '5 tờ', hint: 'Đếm từng nghìn một' },
    { prompt: 'Hôm nay Chủ Nhật, hôm qua là thứ mấy?', emoji: '📆', options: ['Thứ Bảy', 'Thứ Hai', 'Thứ Sáu'], answer: 'Thứ Bảy', hint: 'Lùi lại một ngày' },
  ],
  [
    { prompt: 'Từ 8 giờ sáng đến 11 giờ trưa là bao lâu?', emoji: '⏰', options: ['3 giờ', '19 giờ', '2 giờ'], answer: '3 giờ', hint: 'Lấy giờ sau trừ giờ trước' },
    { prompt: 'Mua bánh 4000đ, đưa 5000đ, thối lại mấy?', emoji: '🍰', options: ['1000đ', '9000đ', '4000đ'], answer: '1000đ', hint: 'Lấy tiền đưa trừ tiền bánh' },
    { prompt: 'Tờ 2000đ với tờ 1000đ. Tổng mấy?', emoji: '💰', options: ['3000đ', '2000đ', '4000đ'], answer: '3000đ', hint: 'Cộng hai tờ lại' },
    { prompt: 'Một năm có mấy tháng?', emoji: '🗓️', options: ['12 tháng', '10 tháng', '7 tháng'], answer: '12 tháng', hint: 'Hát các tháng nhé!' },
    { prompt: 'Bình có 18 que tính, dùng 5 que. Còn mấy?', emoji: '🥢', options: ['13 que', '23 que', '12 que'], answer: '13 que', hint: 'Lấy que có trừ que dùng' },
    { prompt: 'Tổ 1 có 10 bạn, tổ 2 có 9 bạn. Cả hai tổ mấy bạn?', emoji: '👫', options: ['19 bạn', '1 bạn', '20 bạn'], answer: '19 bạn', hint: 'Cộng hai tổ lại' },
    { prompt: 'Bé học từ 7 giờ đến 9 giờ. Bé học bao lâu?', emoji: '📖', options: ['2 giờ', '16 giờ', '1 giờ'], answer: '2 giờ', hint: 'Lấy giờ xong trừ giờ bắt đầu' },
    { prompt: 'Bé có 4000đ, mẹ cho thêm 5000đ. Có mấy?', emoji: '🐷', options: ['9000đ', '8000đ', '10000đ'], answer: '9000đ', hint: 'Cộng hai khoản lại' },
  ],
];

export interface ClockMoneyRound {
  item: QuizItem;
  options: string[];
}

export function buildClockMoneyRounds(tier: number, seed = 0): ClockMoneyRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), POOLS.length);
  const pool = POOLS[safeTier - 1];
  const count = GAME_LEVEL_POLICY.ROUNDS_PER_TIER[Math.min(safeTier - 1, GAME_LEVEL_POLICY.ROUNDS_PER_TIER.length - 1)];
  const list = shuffleSeeded(pool, seededRng(safeTier * 2000 + 11 + seed * 101));
  const rounds: ClockMoneyRound[] = [];
  for (let i = 0; i < count; i++) {
    const item = list[i % list.length];
    rounds.push({
      item,
      options: shuffleSeeded(item.options, seededRng(safeTier * 7919 + i * 57 + 3 + seed * 17)),
    });
  }
  return rounds;
}

export function buildRounds(tier: number, seed = 0): ClockMoneyRound[] {
  return buildClockMoneyRounds(tier, seed);
}
