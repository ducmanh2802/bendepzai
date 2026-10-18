/**
 * T17B — Nhà Khoa Học Nhí (little_scientist) data.
 * Pure TypeScript, no React imports.
 *
 * Phân loại vào 2 giỏ theo luật thay đổi mỗi vòng:
 * - T1 chìm/nổi (thả vào chậu nước), T2 sống/không sống,
 * - T3 ngày/đêm, T4 nóng/lạnh, T5 nam châm hút/không hút,
 * - T6 ôn tổng hợp (trộn cả 5 luật).
 * Mỗi đáp án có 1 câu giải thích ngắn (đọc bằng giọng nói trong game).
 * Kiến thức chuẩn lớp 1, khớp bài "Khoa Học Vui" (life-khoa-hoc).
 */

import { pickDistinct, roundsForTier, seededRng } from '../gameLevels';

export type SciRuleId = 'sinkfloat' | 'alive' | 'daynight' | 'hotcold' | 'magnet';
export type SciBucket = 'A' | 'B';

export interface SciRule {
  id: SciRuleId;
  /** Tên luật hiện trên bảng (ngắn, dễ đọc). */
  name: string;
  /** Câu hỏi luật cho bé (hiện mỗi vòng). */
  prompt: string;
  basketA: string;
  emojiA: string;
  basketB: string;
  emojiB: string;
}

export const SCI_RULES: Record<SciRuleId, SciRule> = {
  sinkfloat: {
    id: 'sinkfloat', name: 'Chìm hay nổi?',
    prompt: 'Thả vật vào chậu nước: vật này CHÌM hay NỔI?',
    basketA: 'Chìm xuống', emojiA: '🗿', basketB: 'Nổi lên', emojiB: '🎈',
  },
  alive: {
    id: 'alive', name: 'Sống hay không sống?',
    prompt: 'Vật này có SỐNG (lớn lên, cần ăn uống) không?',
    basketA: 'Vật sống', emojiA: '🐱', basketB: 'Không sống', emojiB: '🪑',
  },
  daynight: {
    id: 'daynight', name: 'Ngày hay đêm?',
    prompt: 'Bé thường thấy cảnh này vào ban NGÀY hay ban ĐÊM?',
    basketA: 'Ban ngày', emojiA: '☀️', basketB: 'Ban đêm', emojiB: '🌙',
  },
  hotcold: {
    id: 'hotcold', name: 'Nóng hay lạnh?',
    prompt: 'Chạm vào vật này, bé thấy NÓNG hay LẠNH?',
    basketA: 'Nóng ấm', emojiA: '🔥', basketB: 'Lạnh mát', emojiB: '🧊',
  },
  magnet: {
    id: 'magnet', name: 'Nam châm hút không?',
    prompt: 'Đưa nam châm lại gần: nam châm có HÚT vật này không?',
    basketA: 'Nam châm hút', emojiA: '🧲', basketB: 'Không hút', emojiB: '📄',
  },
};

export interface SciItem {
  name: string;
  emoji: string;
  rule: SciRuleId;
  bucket: SciBucket;
  /** 1 câu giải thích ngắn (game đọc to sau khi bé trả lời đúng). */
  why: string;
}

function it(name: string, emoji: string, rule: SciRuleId, bucket: SciBucket, why: string): SciItem {
  return { name, emoji, rule, bucket, why };
}

/** POOL_BY_TIER — mỗi pool 8 vật (số vòng tối đa mỗi cấp là 8). */
export const POOL_BY_TIER: SciItem[][] = [
  // T1 — chìm / nổi
  [
    it('Hòn đá', '🗿', 'sinkfloat', 'A', 'Đá nặng nên chìm xuống đáy chậu.'),
    it('Chiếc lá khô', '🍂', 'sinkfloat', 'B', 'Lá nhẹ nên nổi trên mặt nước.'),
    it('Thìa sắt', '🥄', 'sinkfloat', 'A', 'Thìa làm bằng sắt nặng nên chìm.'),
    it('Quả bóng nhựa', '⚽', 'sinkfloat', 'B', 'Bóng rỗng và nhẹ nên nổi lên.'),
    it('Khúc gỗ', '🌳', 'sinkfloat', 'B', 'Gỗ nhẹ nên nổi, thuyền gỗ cũng nổi.'),
    it('Đồng xu', '💰', 'sinkfloat', 'A', 'Đồng xu nhỏ mà nặng nên chìm.'),
    it('Thuyền giấy', '⛵', 'sinkfloat', 'B', 'Thuyền rỗng chứa không khí nên nổi.'),
    it('Chai nhựa đậy nắp', '🍶', 'sinkfloat', 'B', 'Chai đậy nắp chứa không khí nên nổi.'),
  ],
  // T2 — sống / không sống
  [
    it('Chú mèo', '🐱', 'alive', 'A', 'Mèo lớn lên và cần ăn mỗi ngày.'),
    it('Chậu cây xanh', '🌱', 'alive', 'A', 'Cây lớn lên khi được tưới nước.'),
    it('Chú chim', '🐦', 'alive', 'A', 'Chim biết bay và cần ăn thóc.'),
    it('Bông hoa', '🌸', 'alive', 'A', 'Hoa nở ra từ cây đang sống.'),
    it('Hòn đá', '🗿', 'alive', 'B', 'Đá không lớn lên, không cần ăn.'),
    it('Cái bàn', '🪑', 'alive', 'B', 'Bàn do người đóng, không phải vật sống.'),
    it('Xe đạp', '🚲', 'alive', 'B', 'Xe đạp chạy nhờ sức bé, không tự sống.'),
    it('Búp bê vải', '🧸', 'alive', 'B', 'Búp bê là đồ chơi, không cần ăn uống.'),
  ],
  // T3 — ngày / đêm
  [
    it('Mặt Trời', '☀️', 'daynight', 'A', 'Ban ngày trời sáng nhờ Mặt Trời.'),
    it('Mặt Trăng', '🌙', 'daynight', 'B', 'Ban đêm bé thấy Mặt Trăng trên trời.'),
    it('Những ngôi sao', '⭐', 'daynight', 'B', 'Sao chỉ hiện rõ khi trời tối.'),
    it('Cầu vồng', '🌈', 'daynight', 'A', 'Cầu vồng hiện sau mưa vào ban ngày.'),
    it('Đèn đường', '💡', 'daynight', 'B', 'Đèn đường bật sáng khi trời tối.'),
    it('Đám mây trắng', '☁️', 'daynight', 'A', 'Ban ngày bé thấy mây trời trên cao.'),
    it('Chú cú mèo', '🦉', 'daynight', 'B', 'Cú mèo thức đi kiếm ăn vào ban đêm.'),
    it('Chú gà trống', '🐓', 'daynight', 'A', 'Gà trống gáy vang khi trời sáng.'),
  ],
  // T4 — nóng / lạnh
  [
    it('Ngọn lửa', '🔥', 'hotcold', 'A', 'Lửa cháy rất nóng, bé đừng chạm vào.'),
    it('Nắng buổi trưa', '☀️', 'hotcold', 'A', 'Trưa nắng đừng ở lâu ngoài sân kẻo mệt.'),
    it('Bát canh nóng', '🍲', 'hotcold', 'A', 'Canh mới nấu còn nóng, bé thổi nguội rồi ăn.'),
    it('Bánh mì mới nướng', '🥖', 'hotcold', 'A', 'Bánh vừa ra lò vừa thơm vừa nóng.'),
    it('Viên nước đá', '🧊', 'hotcold', 'B', 'Đá lạnh buốt, cho vào nước cho mát.'),
    it('Que kem', '🍦', 'hotcold', 'B', 'Kem lạnh và ngọt, ăn chậm thôi nhé.'),
    it('Người tuyết', '⛄', 'hotcold', 'B', 'Tuyết chỉ có ở xứ lạnh, lạnh lắm.'),
    it('Miếng dưa hấu ướp lạnh', '🍉', 'hotcold', 'B', 'Dưa ướp lạnh ăn vào mùa nóng rất mát.'),
  ],
  // T5 — nam châm hút / không hút
  [
    it('Cây đinh sắt', '🔩', 'magnet', 'A', 'Đinh làm bằng sắt nên nam châm hút.'),
    it('Thìa sắt', '🥄', 'magnet', 'A', 'Thìa sắt bị nam châm hút dính.'),
    it('Chiếc kẹp giấy', '📎', 'magnet', 'A', 'Kẹp giấy bằng sắt nên hút mạnh.'),
    it('Ô tô sắt đồ chơi', '🚗', 'magnet', 'A', 'Ô tô làm bằng sắt nên nam châm hút.'),
    it('Thước kẻ gỗ', '📏', 'magnet', 'B', 'Gỗ không phải sắt nên không hút.'),
    it('Búp bê nhựa', '🧸', 'magnet', 'B', 'Nhựa không phải sắt nên không hút.'),
    it('Quyển vở giấy', '📖', 'magnet', 'B', 'Giấy mỏng nhẹ, nam châm không hút.'),
    it('Chiếc khăn vải', '🧣', 'magnet', 'B', 'Vải mềm nên nam châm không hút.'),
  ],
  // T6 — ôn tổng hợp (trộn cả 5 luật)
  [
    it('Quả bóng nhựa', '⚽', 'sinkfloat', 'B', 'Bóng rỗng và nhẹ nên nổi lên.'),
    it('Con cá vàng', '🐟', 'alive', 'A', 'Cá bơi lội và cần ăn mỗi ngày.'),
    it('Mặt Trăng', '🌙', 'daynight', 'B', 'Ban đêm bé thấy Mặt Trăng trên trời.'),
    it('Que kem dâu', '🍦', 'hotcold', 'B', 'Kem lạnh và ngọt, ăn chậm thôi nhé.'),
    it('Cây đinh sắt', '🔩', 'magnet', 'A', 'Đinh làm bằng sắt nên nam châm hút.'),
    it('Hòn đá cuội', '🗿', 'alive', 'B', 'Đá không lớn lên, không cần ăn.'),
    it('Cầu vồng sau mưa', '🌈', 'daynight', 'A', 'Cầu vồng hiện sau mưa vào ban ngày.'),
    it('Bát canh nóng hổi', '🍲', 'hotcold', 'A', 'Canh mới nấu còn nóng, bé thổi nguội rồi ăn.'),
  ],
];

export interface SciBasket {
  label: string;
  emoji: string;
  bucket: SciBucket;
}

export interface SciRound {
  id: string;
  rule: SciRule;
  item: SciItem;
  /** 2 giỏ đã xáo trộn (đáp án không kẹt ở 1 bên). */
  baskets: [SciBasket, SciBasket];
}

function basketsFor(rule: SciRule, rng: () => number): [SciBasket, SciBasket] {
  const pair: [SciBasket, SciBasket] = [
    { label: rule.basketA, emoji: rule.emojiA, bucket: 'A' },
    { label: rule.basketB, emoji: rule.emojiB, bucket: 'B' },
  ];
  const r = rng();
  return r < 0.5 ? pair : [pair[1], pair[0]];
}

/** Dựng các vòng cho 1 cấp: đủ vòng, id duy nhất, đáp án nằm trong 2 giỏ. */
export function buildScientistRounds(tier: number, seedOrNonce = 0): SciRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const rng = seededRng(1760 + safeTier * 419 + seedOrNonce * 1009);
  const picks = pickDistinct(pool, count, rng);
  return picks.map((item, i) => {
    const r = seededRng(1760 + safeTier * 419 + seedOrNonce * 1009 + i * 53 + 7);
    const rule = SCI_RULES[item.rule];
    const safeName = item.name
      .replace(/[^a-zA-Z0-9\u00C0-\u1EF9]+/gu, '-')
      .toLowerCase()
      .replace(/^-+|-+$/g, '')
      || `vat-${i}`;
    return {
      id: `ls-t${safeTier}-${i}-${safeName}`,
      rule,
      item,
      baskets: basketsFor(rule, r),
    };
  });
}

export function buildRounds(tier: number, seed = 0): SciRound[] {
  return buildScientistRounds(tier, seed);
}
