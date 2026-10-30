/**
 * T16 — Chợ Khung 10 (ten_frame_market) data. Pure TypeScript, no React imports.
 *
 * Khách hàng (con vật) cần "đủ 10 quả" (rồi đến 20, đến 100, tiền hàng):
 * bé nhìn khung 10 ô đã có `have` quả, tính "cần thêm mấy quả?" (need).
 * - T1–T2: khung 10 đơn (have 0–9, target 10, cộng không nhớ).
 * - T3: 2 khung đến 20 (have 10–18, target 20).
 * - T4: chục–đơn vị với bó que tính (target 11–99, hỏi chục hoặc đơn vị còn thiếu).
 * - T5: tiền hàng chênh 14–38 đồng (bé có tròn chục đồng, trừ ra vẫn không mượn).
 * - T6: trộn 20 + chục–đơn vị + tiền hàng.
 *
 * Lớp 1 (GDPT 2018): mọi phép tính đều không nhớ/không mượn, số ≤ 100.
 */

import { numericOptions, pickDistinct, roundsForTier, seededRng, shuffleSeeded, tierOptionCount } from '../gameLevels';

export type MarketKind = 'ten' | 'twenty' | 'tensUnits' | 'money';

export interface MarketRound {
  id: string;
  kind: MarketKind;
  /** Tên khách hàng (con vật). */
  customer: string;
  customerEmoji: string;
  /** Loại quả/hàng. */
  fruit: string;
  fruitEmoji: string;
  /** Số quả/đồng bé đã có (hiển thị trên khung). */
  have: number;
  /** Số quả/đồng khách cần (đích). */
  target: number;
  /** Đáp án: cần thêm mấy (target − have, hoặc số chục ở vòng hỏi chục). */
  need: number;
  /** Câu đề cho bé (NFC). */
  prompt: string;
  /** Phương án số (đã xáo trộn, gồm need); số lượng tăng theo bậc. */
  options: number[];
  /** T4: số chục / số đơn vị của target (để vẽ bó que tính). */
  chuc?: number;
  donVi?: number;
  /** T4: hỏi phần nào còn thiếu. */
  askPart?: 'chuc' | 'donVi';
}

interface MarketTarget {
  kind: MarketKind;
  customer: string;
  customerEmoji: string;
  fruit: string;
  fruitEmoji: string;
  have: number;
  target: number;
  chuc?: number;
  donVi?: number;
  askPart?: 'chuc' | 'donVi';
  /** Đáp án ghi đè (vòng hỏi "mấy chục": đáp án là số chục, không phải số que). */
  need?: number;
}

function m(
  kind: MarketKind,
  customer: string,
  customerEmoji: string,
  fruit: string,
  fruitEmoji: string,
  have: number,
  target: number,
  extra?: { chuc?: number; donVi?: number; askPart?: 'chuc' | 'donVi'; need?: number },
): MarketTarget {
  return { kind, customer, customerEmoji, fruit, fruitEmoji, have, target, ...extra };
}

const CUST = {
  tho: ['Bạn Thỏ', '🐰'],
  meo: ['Bạn Mèo', '🐱'],
  gau: ['Bạn Gấu', '🐻'],
  ga: ['Bạn Gà', '🐤'],
  vit: ['Bạn Vịt', '🦆'],
  soc: ['Bạn Sóc', '🐿️'],
  ech: ['Bạn Ếch', '🐸'],
  khi: ['Bạn Khỉ', '🐵'],
} as const;

const FRUIT = {
  tao: ['quả táo', '🍎'],
  cam: ['quả cam', '🍊'],
  chuoi: ['quả chuối', '🍌'],
  dau: ['quả dâu', '🍓'],
  nho: ['chùm nho', '🍇'],
  xoai: ['quả xoài', '🥭'],
  dua: ['quả dưa', '🍉'],
  le: ['quả lê', '🍐'],
} as const;

function ten(customer: keyof typeof CUST, fruit: keyof typeof FRUIT, have: number): MarketTarget {
  const [c, ce] = CUST[customer];
  const [f, fe] = FRUIT[fruit];
  return m('ten', c, ce, f, fe, have, 10);
}

function twenty(customer: keyof typeof CUST, fruit: keyof typeof FRUIT, have: number): MarketTarget {
  const [c, ce] = CUST[customer];
  const [f, fe] = FRUIT[fruit];
  return m('twenty', c, ce, f, fe, have, 20);
}

/** T4: bó que tính — target = chuc chục + donVi đơn vị, hỏi phần còn thiếu. */
function sticks(
  customer: keyof typeof CUST,
  chuc: number,
  donVi: number,
  askPart: 'chuc' | 'donVi',
): MarketTarget {
  const [c, ce] = CUST[customer];
  const target = chuc * 10 + donVi;
  const have = askPart === 'donVi' ? chuc * 10 : donVi;
  // Hỏi "mấy chục" → đáp án là số chục (1–9, vừa sức lớp 1).
  const need = askPart === 'chuc' ? chuc : undefined;
  return m('tensUnits', c, ce, 'que tính', '🥢', have, target, { chuc, donVi, askPart, need });
}

/** T5: bé có tròn chục đồng, món hàng đắt hơn vài đồng (không mượn). */
function money(customer: keyof typeof CUST, haveTens: number, extra: number, item: string, emoji: string): MarketTarget {
  const [c, ce] = CUST[customer];
  const have = haveTens * 10;
  return m('money', c, ce, item, emoji, have, have + extra);
}

/**
 * POOL_BY_TIER — mỗi pool 8 mục (số vòng tối đa mỗi cấp là 8).
 * Đáp án 2–90 tuỳ bậc; bậc 5–6 chênh cả chục que tính/chục đồng.
 */
export const POOL_BY_TIER: MarketTarget[][] = [
  // T1 — khung 10, have 4–8 (need 2–6, dễ nhẩm)
  [
    ten('tho', 'tao', 6),
    ten('meo', 'cam', 7),
    ten('ga', 'dau', 5),
    ten('vit', 'nho', 8),
    ten('soc', 'chuoi', 4),
    ten('ech', 'le', 6),
    ten('khi', 'xoai', 7),
    ten('gau', 'dua', 5),
  ],
  // T2 — khung 10 đủ biên (have 1–9, có have = 9 → need 1)
  [
    ten('tho', 'cam', 3),
    ten('meo', 'tao', 9),
    ten('ga', 'chuoi', 2),
    ten('vit', 'dau', 8),
    ten('soc', 'le', 1),
    ten('ech', 'nho', 7),
    ten('khi', 'dua', 4),
    ten('gau', 'xoai', 6),
  ],
  // T3 — 2 khung đến 20 (have 11–18)
  [
    twenty('tho', 'tao', 14),
    twenty('meo', 'cam', 16),
    twenty('ga', 'dau', 12),
    twenty('vit', 'nho', 17),
    twenty('soc', 'chuoi', 11),
    twenty('ech', 'le', 15),
    twenty('khi', 'xoai', 18),
    twenty('gau', 'dua', 13),
  ],
  // T4 — bó que tính chục–đơn vị (target 12–96, hỏi chục hoặc đơn vị)
  [
    sticks('tho', 2, 4, 'donVi'),
    sticks('meo', 3, 7, 'donVi'),
    sticks('ga', 4, 0, 'donVi'),
    sticks('vit', 1, 8, 'chuc'),
    sticks('soc', 5, 3, 'donVi'),
    sticks('ech', 2, 0, 'chuc'),
    sticks('khi', 6, 5, 'donVi'),
    sticks('gau', 3, 0, 'chuc'),
  ],
  // T5 — tiền hàng: giá chênh 14–38 đồng (tròn chục trừ đi vẫn không mượn)
  [
    money('tho', 2, 15, 'gói bánh', '🍪'),
    money('meo', 3, 27, 'quyển vở', '📒'),
    money('ga', 1, 14, 'cái cặp', '🎒'),
    money('vit', 4, 22, 'quả bóng', '⚽'),
    money('soc', 2, 38, 'hộp bút', '✏️'),
    money('ech', 5, 33, 'cuốn truyện', '📖'),
    money('khi', 3, 26, 'cái mũ', '🧢'),
    money('gau', 4, 19, 'hộp sữa', '🥛'),
  ],
  // T6 — trộn 20 + chục–đơn vị + tiền hàng
  [
    twenty('tho', 'nho', 16),
    sticks('meo', 4, 6, 'donVi'),
    sticks('ga', 5, 3, 'donVi'),
    twenty('vit', 'tao', 12),
    sticks('soc', 7, 2, 'chuc'),
    money('ech', 5, 25, 'tô phở', '🍜'),
    sticks('khi', 8, 4, 'donVi'),
    sticks('gau', 9, 7, 'donVi'),
  ],
];

function promptFor(t: MarketTarget, need: number): string {
  void need;
  if (t.kind === 'ten') {
    return `${t.customer} cần đủ 10 ${t.fruit}. Khay đã có ${t.have} ${t.fruit}. Cần thêm mấy ${t.fruit}?`;
  }
  if (t.kind === 'twenty') {
    return `${t.customer} cần đủ 20 ${t.fruit}. Hai khay đã có ${t.have} ${t.fruit}. Cần thêm mấy ${t.fruit}?`;
  }
  if (t.kind === 'tensUnits') {
    const target = (t.chuc ?? 0) * 10 + (t.donVi ?? 0);
    if (t.askPart === 'chuc') {
      return `${t.customer} cần ${target} que tính (${t.chuc} chục và ${t.donVi} đơn vị). Bé đã có ${t.have} que lẻ. Cần thêm mấy chục?`;
    }
    return `${t.customer} cần ${target} que tính (${t.chuc} chục và ${t.donVi} đơn vị). Bé đã có ${t.have} que. Cần thêm mấy que lẻ?`;
  }
  return `${t.customer} bán ${t.fruit} giá ${t.target} đồng. Bé có ${t.have} đồng. Cần thêm mấy đồng?`;
}

/**
 * Dựng các vòng chơi cho 1 cấp: đủ vòng, đáp án = target - have,
 * phương án số duy nhất đã xáo trộn theo seed (4 → 6 tuỳ bậc).
 */
export function buildMarketRounds(tier: number, seedOrNonce = 0): MarketRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const rng = seededRng(1600 + safeTier * 307 + seedOrNonce * 1009);
  const picks = pickDistinct(pool, count, rng);
  return picks.map((t, i) => {
    const r = seededRng(1600 + safeTier * 307 + seedOrNonce * 1009 + i * 61 + 7);
    const need = t.need ?? t.target - t.have;
    const options = numericOptions(need, tierOptionCount(safeTier), r, 0, Math.max(t.target, 10));
    const shuffled = shuffleSeeded(options, r);
    return {
      id: `tm-t${safeTier}-${i}-${t.have}-${t.target}`,
      kind: t.kind,
      customer: t.customer,
      customerEmoji: t.customerEmoji,
      fruit: t.fruit,
      fruitEmoji: t.fruitEmoji,
      have: t.have,
      target: t.target,
      need,
      prompt: promptFor(t, need),
      options: shuffled,
      chuc: t.chuc,
      donVi: t.donVi,
      askPart: t.askPart,
    };
  });
}

export function buildRounds(tier: number, seed = 0): MarketRound[] {
  return buildMarketRounds(tier, seed);
}
