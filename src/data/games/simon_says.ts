/**
 * T17A — Simon Says (simon_says) data. Pure TypeScript, no React imports.
 *
 * Gấu nói lệnh bằng British English, bé chạm đúng tranh.
 * - T1–T3: lệnh 1 bước, luôn có "Simon says" (body → actions → colours/objects).
 * - T4: lệnh 2 bước ("Clap your hands, then touch your nose!") — bé chạm
 *   2 tranh theo đúng thứ tự.
 * - T5–T6: trộn lệnh 2 bước + bẫy vui: vòng không có "Simon says" thì bé
 *   phải NHỊN, chạm thẻ 😴 Wait! mới đúng.
 *
 * Mọi chữ tiếng Anh đều là British English, khớp từ vựng Kid's Box 1
 * (body, colours, animals, school things). Gợi ý tiếng Việt chỉ để Ba Mẹ
 * hiểu, không hiện nghĩa ngay cạnh lệnh để bé phải nghe.
 */

import { pickDistinct, roundsForTier, seededRng, shuffleSeeded } from '../gameLevels';

export interface SimonPic {
  /** Emoji minh hoạ. */
  emoji: string;
  /** Nhãn tiếng Anh (Kid's Box). */
  label: string;
  /** Nghĩa tiếng Việt (gợi ý cho Ba Mẹ). */
  vi: string;
}

export interface SimonTarget {
  /** Lệnh đầy đủ (chưa có tiền tố "Simon says"). Luôn kết thúc bằng "!". */
  command: string;
  /** Nghĩa tiếng Việt của lệnh. */
  vi: string;
  /** Tranh đáp án theo đúng thứ tự (1 hoặc 2 bước). */
  answers: SimonPic[];
  /** 3 tranh mồi cùng nhóm. */
  decoys: SimonPic[];
  /** true = lệnh 2 bước; false = 1 bước. */
  twoStep: boolean;
  /** true = vòng bẫy: lệnh KHÔNG có "Simon says", đáp án là thẻ Wait. */
  trap: boolean;
}

export interface SimonRound {
  id: string;
  /** Lệnh hiển thị (đã gồm/không gồm "Simon says"). */
  command: string;
  /** true khi Gấu có nói "Simon says". */
  simonSays: boolean;
  twoStep: boolean;
  trap: boolean;
  /** 4 tranh đã xáo trộn (vòng bẫy gồm thẻ Wait). */
  options: SimonPic[];
  /** Đáp án theo đúng thứ tự. */
  answers: SimonPic[];
  vi: string;
}

/** Thẻ "đứng yên" cho vòng bẫy — bé phải nhịn, không làm theo. */
export const WAIT_CARD: SimonPic = { emoji: '😴', label: 'Wait!', vi: 'Đứng yên!' };

function pic(emoji: string, label: string, vi: string): SimonPic {
  return { emoji, label, vi };
}

// Từ vựng tranh dùng chung (Kid's Box 1).
const BODY_NOSE = pic('👃', 'nose', 'mũi');
const BODY_EAR = pic('👂', 'ear', 'tai');
const BODY_EYE = pic('👀', 'eye', 'mắt');
const BODY_MOUTH = pic('👄', 'mouth', 'miệng');
const BODY_HAND = pic('✋', 'hand', 'bàn tay');
const BODY_FOOT = pic('🦶', 'foot', 'bàn chân');
const BODY_TEETH = pic('🦷', 'teeth', 'răng');
const BODY_HEAD = pic('👦', 'head', 'cái đầu');

const ACT_CLAP = pic('👏', 'clap', 'vỗ tay');
const ACT_WAVE = pic('👋', 'wave', 'vẫy tay');
const ACT_JUMP = pic('🤸', 'jump', 'nhảy lên');
const ACT_TURN = pic('🌀', 'turn around', 'xoay một vòng');
const ACT_UP = pic('🧍', 'stand up', 'đứng lên');
const ACT_SIT = pic('🪑', 'sit down', 'ngồi xuống');
const ACT_STOMP = pic('🥁', 'stomp', 'giậm chân');
const ACT_BOOK = pic('📖', 'open your book', 'mở sách ra');

const COL_RED = pic('🔴', 'red', 'màu đỏ');
const COL_BLUE = pic('🔵', 'blue', 'màu xanh dương');
const COL_GREEN = pic('🟢', 'green', 'màu xanh lá');
const COL_YELLOW = pic('🟡', 'yellow', 'màu vàng');
const OBJ_CAT = pic('🐱', 'cat', 'con mèo');
const OBJ_DOG = pic('🐶', 'dog', 'con chó');
const OBJ_BOOK = pic('📕', 'book', 'quyển sách');
const OBJ_PEN = pic('✏️', 'pen', 'cái bút');

function one(command: string, vi: string, answer: SimonPic, decoys: SimonPic[]): SimonTarget {
  return { command, vi, answers: [answer], decoys, twoStep: false, trap: false };
}

function two(command: string, vi: string, answers: [SimonPic, SimonPic], decoys: SimonPic[]): SimonTarget {
  return { command, vi, answers, decoys, twoStep: true, trap: false };
}

function trap(command: string, vi: string, bait: SimonPic, others: SimonPic[]): SimonTarget {
  return { command, vi, answers: [WAIT_CARD], decoys: [bait, ...others], twoStep: false, trap: true };
}

/**
 * POOL_BY_TIER — mỗi pool 8 mục (số vòng tối đa mỗi cấp là 8).
 * command KHÔNG chứa tiền tố "Simon says" (builder tự thêm khi dựng vòng).
 */
export const POOL_BY_TIER: SimonTarget[][] = [
  // T1 — bộ phận cơ thể, 1 bước
  [
    one('Touch your nose!', 'Chạm vào mũi của bé', BODY_NOSE, [BODY_EAR, BODY_EYE, BODY_MOUTH]),
    one('Touch your ear!', 'Chạm vào tai của bé', BODY_EAR, [BODY_NOSE, BODY_EYE, BODY_HAND]),
    one('Touch your eye!', 'Chạm vào mắt của bé', BODY_EYE, [BODY_NOSE, BODY_MOUTH, BODY_FOOT]),
    one('Touch your mouth!', 'Chạm vào miệng của bé', BODY_MOUTH, [BODY_EYE, BODY_HAND, BODY_TEETH]),
    one('Touch your hand!', 'Chạm vào bàn tay của bé', BODY_HAND, [BODY_FOOT, BODY_NOSE, BODY_HEAD]),
    one('Touch your foot!', 'Chạm vào bàn chân của bé', BODY_FOOT, [BODY_HAND, BODY_EAR, BODY_TEETH]),
    one('Show me your teeth!', 'Khoe hàm răng của bé', BODY_TEETH, [BODY_MOUTH, BODY_NOSE, BODY_HEAD]),
    one('Touch your head!', 'Chạm vào đầu của bé', BODY_HEAD, [BODY_HAND, BODY_EYE, BODY_EAR]),
  ],
  // T2 — hành động, 1 bước
  [
    one('Clap your hands!', 'Vỗ tay nào', ACT_CLAP, [ACT_WAVE, ACT_JUMP, ACT_TURN]),
    one('Wave hello!', 'Vẫy tay chào nào', ACT_WAVE, [ACT_CLAP, ACT_UP, ACT_SIT]),
    one('Jump up high!', 'Nhảy cao lên nào', ACT_JUMP, [ACT_TURN, ACT_STOMP, ACT_CLAP]),
    one('Turn around!', 'Xoay một vòng nào', ACT_TURN, [ACT_JUMP, ACT_WAVE, ACT_UP]),
    one('Stand up!', 'Đứng lên nào', ACT_UP, [ACT_SIT, ACT_CLAP, ACT_STOMP]),
    one('Sit down!', 'Ngồi xuống nào', ACT_SIT, [ACT_UP, ACT_BOOK, ACT_WAVE]),
    one('Stomp your feet!', 'Giậm chân nào', ACT_STOMP, [ACT_JUMP, ACT_TURN, ACT_SIT]),
    one('Open your book!', 'Mở sách ra nào', ACT_BOOK, [ACT_SIT, ACT_UP, ACT_CLAP]),
  ],
  // T3 — màu sắc + đồ vật quen thuộc, 1 bước
  [
    one('Show me something red!', 'Chỉ vào vật màu đỏ', COL_RED, [COL_BLUE, COL_GREEN, COL_YELLOW]),
    one('Show me something blue!', 'Chỉ vào vật màu xanh dương', COL_BLUE, [COL_RED, COL_YELLOW, COL_GREEN]),
    one('Show me something green!', 'Chỉ vào vật màu xanh lá', COL_GREEN, [COL_YELLOW, COL_RED, COL_BLUE]),
    one('Show me something yellow!', 'Chỉ vào vật màu vàng', COL_YELLOW, [COL_GREEN, COL_BLUE, COL_RED]),
    one('Find the cat!', 'Tìm bạn mèo', OBJ_CAT, [OBJ_DOG, OBJ_BOOK, OBJ_PEN]),
    one('Find the dog!', 'Tìm bạn chó', OBJ_DOG, [OBJ_CAT, OBJ_PEN, OBJ_BOOK]),
    one('Find the book!', 'Tìm quyển sách', OBJ_BOOK, [OBJ_PEN, OBJ_CAT, OBJ_DOG]),
    one('Find the pen!', 'Tìm cái bút', OBJ_PEN, [OBJ_BOOK, OBJ_DOG, OBJ_CAT]),
  ],
  // T4 — lệnh 2 bước (hành động + cơ thể)
  [
    two('Clap your hands, then touch your nose!', 'Vỗ tay rồi chạm vào mũi', [ACT_CLAP, BODY_NOSE], [BODY_EAR, ACT_WAVE]),
    two('Wave hello, then touch your ear!', 'Vẫy tay chào rồi chạm vào tai', [ACT_WAVE, BODY_EAR], [ACT_CLAP, BODY_NOSE]),
    two('Jump up high, then touch your head!', 'Nhảy cao rồi chạm vào đầu', [ACT_JUMP, BODY_HEAD], [ACT_TURN, BODY_HAND]),
    two('Turn around, then touch your foot!', 'Xoay một vòng rồi chạm vào bàn chân', [ACT_TURN, BODY_FOOT], [ACT_JUMP, BODY_MOUTH]),
    two('Stand up, then show me your teeth!', 'Đứng lên rồi khoe hàm răng', [ACT_UP, BODY_TEETH], [ACT_SIT, BODY_EYE]),
    two('Sit down, then touch your eye!', 'Ngồi xuống rồi chạm vào mắt', [ACT_SIT, BODY_EYE], [ACT_BOOK, BODY_NOSE]),
    two('Stomp your feet, then touch your hand!', 'Giậm chân rồi chạm vào bàn tay', [ACT_STOMP, BODY_HAND], [ACT_CLAP, BODY_FOOT]),
    two('Open your book, then touch your mouth!', 'Mở sách rồi chạm vào miệng', [ACT_BOOK, BODY_MOUTH], [ACT_SIT, BODY_EAR]),
  ],
  // T5 — 2 bước + bẫy (không có "Simon says" → chạm Wait!)
  [
    two('Clap your hands, then find the cat!', 'Vỗ tay rồi tìm bạn mèo', [ACT_CLAP, OBJ_CAT], [OBJ_DOG, ACT_WAVE]),
    two('Wave hello, then show me something red!', 'Vẫy tay chào rồi chỉ vật màu đỏ', [ACT_WAVE, COL_RED], [ACT_CLAP, COL_BLUE]),
    two('Jump up high, then find the book!', 'Nhảy cao rồi tìm quyển sách', [ACT_JUMP, OBJ_BOOK], [ACT_TURN, OBJ_PEN]),
    two('Turn around, then show me something blue!', 'Xoay một vòng rồi chỉ vật màu xanh dương', [ACT_TURN, COL_BLUE], [ACT_JUMP, COL_GREEN]),
    two('Stand up, then find the pen!', 'Đứng lên rồi tìm cái bút', [ACT_UP, OBJ_PEN], [ACT_SIT, OBJ_DOG]),
    two('Touch your nose, then touch your ear!', 'Chạm vào mũi rồi chạm vào tai', [BODY_NOSE, BODY_EAR], [BODY_EYE, BODY_HAND]),
    trap('Touch your toes!', 'Chạm vào ngón chân (nhưng Gấu KHÔNG nói "Simon says"!)', BODY_FOOT, [BODY_HAND, BODY_NOSE]),
    trap('Clap your hands!', 'Vỗ tay (nhưng Gấu KHÔNG nói "Simon says"!)', ACT_CLAP, [ACT_WAVE, ACT_JUMP]),
  ],
  // T6 — 2 bước khó + bẫy khó
  [
    two('Show me something green, then find the dog!', 'Chỉ vật màu xanh lá rồi tìm bạn chó', [COL_GREEN, OBJ_DOG], [COL_YELLOW, OBJ_CAT]),
    two('Find the pen, then sit down!', 'Tìm cái bút rồi ngồi xuống', [OBJ_PEN, ACT_SIT], [OBJ_BOOK, ACT_UP]),
    two('Stomp your feet, then show me something yellow!', 'Giậm chân rồi chỉ vật màu vàng', [ACT_STOMP, COL_YELLOW], [ACT_JUMP, COL_RED]),
    two('Open your book, then stand up!', 'Mở sách rồi đứng lên', [ACT_BOOK, ACT_UP], [ACT_SIT, ACT_WAVE]),
    two('Touch your head, then touch your foot!', 'Chạm vào đầu rồi chạm vào bàn chân', [BODY_HEAD, BODY_FOOT], [BODY_NOSE, BODY_TEETH]),
    trap('Jump up high!', 'Nhảy cao (nhưng Gấu KHÔNG nói "Simon says"!)', ACT_JUMP, [ACT_TURN, ACT_STOMP]),
    trap('Find the cat!', 'Tìm bạn mèo (nhưng Gấu KHÔNG nói "Simon says"!)', OBJ_CAT, [OBJ_DOG, OBJ_BOOK]),
    trap('Show me something red!', 'Chỉ vật màu đỏ (nhưng Gấu KHÔNG nói "Simon says"!)', COL_RED, [COL_BLUE, COL_GREEN]),
  ],
];

/**
 * Dựng các vòng chơi cho 1 cấp: đủ vòng, đáp án có mặt, 4 tranh duy nhất,
 * vị trí đáp án phân tán theo seed. Vòng bẫy luôn gồm thẻ Wait!.
 */
export function buildSimonRounds(tier: number, seedOrNonce = 0): SimonRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const rng = seededRng(1700 + safeTier * 311 + seedOrNonce * 1009);
  const picks = pickDistinct(pool, count, rng);
  return picks.map((t, i) => {
    const r = seededRng(1700 + safeTier * 311 + seedOrNonce * 1009 + i * 67 + 13);
    const simonSays = !t.trap;
    const command = simonSays ? `Simon says: "${t.command}"` : `"${t.command}"`;
    const options = shuffleSeeded([...t.answers, ...t.decoys], r);
    return {
      id: `ss-t${safeTier}-${i}-${t.command.replace(/[^a-z]+/gi, '-').toLowerCase()}`,
      command,
      simonSays,
      twoStep: t.twoStep,
      trap: t.trap,
      options,
      answers: t.answers,
      vi: t.vi,
    };
  });
}

export function buildRounds(tier: number, seed = 0): SimonRound[] {
  return buildSimonRounds(tier, seed);
}
