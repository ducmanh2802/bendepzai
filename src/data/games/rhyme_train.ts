/**
 * T15 — Đoàn Tàu Ghép Vần (rhyme_train) data. Pure TypeScript, no React imports.
 *
 * Đầu tàu mang âm đầu (cấp 1–4) hoặc tiếng thứ nhất (cấp 5–6),
 * các toa mang vần / tiếng thứ hai. Bé nối toa để tạo tiếng có nghĩa
 * khớp hình. Tàu chạy (tiếng còi) khi đúng.
 * Cấp cao: từ 2 tiếng, vần khó (oang, uyên…), có dấu thanh.
 */

import { pickDistinct, roundsForTier, seededRng, shuffleSeeded } from '../gameLevels';

export interface RhymeTrainTarget {
  /** Nhãn trên đầu tàu: âm đầu (T1–T4) hoặc tiếng 1 (T5–T6). */
  head: string;
  /** Toa đúng: vần có dấu (T1–T4) hoặc tiếng 2 (T5–T6). */
  tail: string;
  /** 3 toa mồi cùng cấp. */
  decoys: string[];
  /** Từ tạo thành (head + tail), đã NFC. */
  word: string;
  emoji: string;
}

export interface RhymeTrainRound {
  id: string;
  head: string;
  /** Các toa (đáp án + mồi) đã xáo trộn. */
  carOptions: string[];
  answerTail: string;
  word: string;
  emoji: string;
  /** true khi toa là tiếng thứ hai của từ 2 tiếng. */
  twoPart: boolean;
}

/**
 * POOL_BY_TIER — mỗi pool 8 mục (số vòng tối đa mỗi cấp là 8).
 * word luôn = head + tail (T1–T4) hoặc "head tail" (T5–T6), NFC.
 */
export const POOL_BY_TIER: RhymeTrainTarget[][] = [
  // T1 — âm đầu đơn + vần đơn, ngang/sắc/huyền
  [
    { head: 'b', tail: 'ò', decoys: ['á', 'ê', 'úc'], word: 'bò', emoji: '🐄' },
    { head: 'c', tail: 'á', decoys: ['ò', 'ê', 'úc'], word: 'cá', emoji: '🐟' },
    { head: 'm', tail: 'e', decoys: ['ò', 'á', 'úc'], word: 'me', emoji: '🐱' },
    { head: 'g', tail: 'à', decoys: ['e', 'ò', 'úc'], word: 'gà', emoji: '🐓' },
    { head: 'l', tail: 'á', decoys: ['e', 'ò', 'úc'], word: 'lá', emoji: '🍃' },
    { head: 'b', tail: 'ố', decoys: ['e', 'á', 'úc'], word: 'bố', emoji: '👨' },
    { head: 'c', tail: 'ô', decoys: ['á', 'e', 'úc'], word: 'cô', emoji: '👩' },
    { head: 'b', tail: 'é', decoys: ['á', 'ò', 'úc'], word: 'bé', emoji: '👧' },
  ],
  // T2 — thêm hỏi/ngã/nặng
  [
    { head: 'th', tail: 'ỏ', decoys: ['ữ', 'ận', 'út'], word: 'thỏ', emoji: '🐰' },
    { head: 'v', tail: 'ải', decoys: ['ỏ', 'ận', 'út'], word: 'vải', emoji: '🍒' },
    { head: 'c', tail: 'ỏ', decoys: ['ải', 'ận', 'út'], word: 'cỏ', emoji: '🌿' },
    { head: 's', tail: 'ữa', decoys: ['ỏ', 'ải', 'út'], word: 'sữa', emoji: '🥛' },
    { head: 'b', tail: 'út', decoys: ['ỏ', 'ải', 'ữa'], word: 'bút', emoji: '✏️' },
    { head: 'm', tail: 'ẹ', decoys: ['ỏ', 'ải', 'út'], word: 'mẹ', emoji: '👩' },
    { head: 'm', tail: 'ận', decoys: ['ỏ', 'ải', 'ẹ'], word: 'mận', emoji: '🍑' },
    { head: 'đ', tail: 'ũa', decoys: ['ỏ', 'ận', 'út'], word: 'đũa', emoji: '🥢' },
  ],
  // T3 — vần khó (oang, iên, uôi, oài…)
  [
    { head: 'ng', tail: 'oan', decoys: ['uyền', 'uối', 'oài'], word: 'ngoan', emoji: '😊' },
    { head: 'th', tail: 'uyền', decoys: ['oan', 'uối', 'oài'], word: 'thuyền', emoji: '⛵' },
    { head: 'ch', tail: 'uối', decoys: ['oan', 'uyền', 'oài'], word: 'chuối', emoji: '🍌' },
    { head: 'x', tail: 'oài', decoys: ['oan', 'uyền', 'uối'], word: 'xoài', emoji: '🥭' },
    { head: 's', tail: 'uối', decoys: ['oan', 'oài', 'uyền'], word: 'suối', emoji: '🏞️' },
    { head: 't', tail: 'uổi', decoys: ['oan', 'oài', 'uối'], word: 'tuổi', emoji: '🎂' },
    { head: 's', tail: 'ách', decoys: ['oan', 'uyền', 'uối'], word: 'sách', emoji: '📖' },
    { head: 'tr', tail: 'ăng', decoys: ['uyền', 'uối', 'oài'], word: 'trăng', emoji: '🌙' },
  ],
  // T4 — vần khó + dấu thanh
  [
    { head: 'kh', tail: 'oẻ', decoys: ['ưỡi', 'ạo', 'iển'], word: 'khoẻ', emoji: '💪' },
    { head: 'l', tail: 'ưỡi', decoys: ['oẻ', 'ạo', 'iển'], word: 'lưỡi', emoji: '👅' },
    { head: 'g', tail: 'ạo', decoys: ['oẻ', 'ưỡi', 'iển'], word: 'gạo', emoji: '🍚' },
    { head: 'k', tail: 'éo', decoys: ['oẻ', 'ạo', 'iển'], word: 'kéo', emoji: '🧶' },
    { head: 'ch', tail: 'ào', decoys: ['oẻ', 'ưỡi', 'iển'], word: 'chào', emoji: '👋' },
    { head: 'gh', tail: 'ế', decoys: ['oẻ', 'ạo', 'ưỡi'], word: 'ghế', emoji: '🪑' },
    { head: 'b', tail: 'iển', decoys: ['oẻ', 'ạo', 'éo'], word: 'biển', emoji: '🏖️' },
    { head: 'h', tail: 'oa', decoys: ['oẻ', 'ưỡi', 'iển'], word: 'hoa', emoji: '🌸' },
  ],
  // T5 — từ 2 tiếng quen thuộc (toa = tiếng thứ hai)
  [
    { head: 'xe', tail: 'đạp', decoys: ['độp', 'đập', 'đẹp'], word: 'xe đạp', emoji: '🚲' },
    { head: 'quả', tail: 'cam', decoys: ['com', 'cơm', 'cám'], word: 'quả cam', emoji: '🍊' },
    { head: 'con', tail: 'mèo', decoys: ['mào', 'mè', 'mẽo'], word: 'con mèo', emoji: '🐱' },
    { head: 'cái', tail: 'bàn', decoys: ['bán', 'bạn', 'bản'], word: 'cái bàn', emoji: '🪑' },
    { head: 'mặt', tail: 'trời', decoys: ['trăng', 'trống', 'tròn'], word: 'mặt trời', emoji: '☀️' },
    { head: 'cầu', tail: 'vồng', decoys: ['vòng', 'võng', 'vụng'], word: 'cầu vồng', emoji: '🌈' },
    { head: 'bông', tail: 'hoa', decoys: ['họa', 'hoả', 'hoà'], word: 'bông hoa', emoji: '🌸' },
    { head: 'con', tail: 'bò', decoys: ['bó', 'bọ', 'bỏ'], word: 'con bò', emoji: '🐄' },
  ],
  // T6 — từ 2 tiếng khó (oang, uyên, iếng…)
  [
    { head: 'quyển', tail: 'sách', decoys: ['sạch', 'sao', 'sâu'], word: 'quyển sách', emoji: '📖' },
    { head: 'vầng', tail: 'trăng', decoys: ['trắng', 'tròn', 'trống'], word: 'vầng trăng', emoji: '🌙' },
    { head: 'con', tail: 'thuyền', decoys: ['thuê', 'thổi', 'thơ'], word: 'con thuyền', emoji: '⛵' },
    { head: 'buổi', tail: 'sáng', decoys: ['sang', 'sáo', 'sữa'], word: 'buổi sáng', emoji: '🌅' },
    { head: 'tiếng', tail: 'hát', decoys: ['hạt', 'hay', 'hoa'], word: 'tiếng hát', emoji: '🎤' },
    { head: 'ánh', tail: 'nắng', decoys: ['nặng', 'nấm', 'nước'], word: 'ánh nắng', emoji: '☀️' },
    { head: 'hoa', tail: 'huệ', decoys: ['hồng', 'hẹ', 'hè'], word: 'hoa huệ', emoji: '🌷' },
    { head: 'con', tail: 'suối', decoys: ['súng', 'sữa', 'sâu'], word: 'con suối', emoji: '🏞️' },
  ],
];

/**
 * Dựng các vòng chơi cho 1 cấp: đủ vòng, toa đúng tạo đúng từ,
 * toa mồi không tạo ra từ mục tiêu, phương án phân tán theo seed.
 */
export function buildTrainRounds(tier: number, seedOrNonce = 0): RhymeTrainRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const twoPart = safeTier >= 5;
  const rng = seededRng(1500 + safeTier * 211 + seedOrNonce * 1009);
  const picks = pickDistinct(pool, count, rng);
  return picks.map((t, i) => {
    const r = seededRng(1500 + safeTier * 211 + seedOrNonce * 1009 + i * 53 + 11);
    const word = (twoPart ? `${t.head} ${t.tail}` : `${t.head}${t.tail}`).normalize('NFC');
    return {
      id: `rt-t${safeTier}-${word.replace(/\s+/g, '-')}-${i}`,
      head: t.head.normalize('NFC'),
      carOptions: shuffleSeeded(
        [t.tail, ...t.decoys].map((s) => s.normalize('NFC')),
        r,
      ),
      answerTail: t.tail.normalize('NFC'),
      word,
      emoji: t.emoji,
      twoPart,
    };
  });
}

export function buildRounds(tier: number, seed = 0): RhymeTrainRound[] {
  return buildTrainRounds(tier, seed);
}
