import * as E from './cotuongEngine';

export interface CotuongPuzzle {
  id: string;
  title: string;
  tacticName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  hint: string;
  explanation: string;
  createBoard: () => E.Board;
  expectedMove: { from: [number, number]; to: [number, number] };
}

function emptyBoard(): E.Board {
  return Array.from({ length: E.BOARD_ROWS }, () => Array(E.BOARD_COLS).fill(null));
}

/**
 * Mọi thế cờ ở đây phải là "chiếu bí một nước" thật: sau nước đáp án, Tướng Đen
 * vẫn nằm trên bàn, đang bị chiếu và không còn nước hợp lệ nào. Bất biến này được
 * khoá bằng `tests/t26-cotuong-puzzles.test.ts` vì thế cờ đổi một quân là hỏng ngay
 * (hai Tướng đối mặt, Pháo thiếu/hai ngòi, Xe bị Sĩ nhà chặn...).
 */
/**
 * Chấm một nước của bé bằng luật chứ không so toạ độ: bé tìm ra nước chiếu bí
 * khác đáp án mẫu (mỗi thế có thể có 2 nước) vẫn thắng.
 */
export type PuzzleMoveResult = 'mate' | 'check' | 'miss';

export function judgePuzzleMove(board: E.Board, move: E.Move): PuzzleMoveResult {
  const after = E.applyMove(board, move);
  if (!E.inCheck(after, 'black')) return 'miss';
  return E.allLegalMoves(after, 'black').length === 0 ? 'mate' : 'check';
}

export const COTUONG_PUZZLES: CotuongPuzzle[] = [
  {
    id: 'ct-pz-1',
    title: 'Thế 1: Mã Ngọa Tào',
    tacticName: 'Sát pháp Ngọa Tào Mã',
    difficulty: 'easy',
    description: 'Bé cầm quân Đỏ đi trước: nhảy Mã vào sát cung Tướng Đen để chiếu bí!',
    hint: 'Xe Đỏ đã canh sẵn hàng 1. Mã nhảy hình chữ L từ [4, 2] lên ô [2, 3] là chiếu bí!',
    explanation:
      'Xuất sắc! Mã đứng ở [2, 3] chiếu thẳng Tướng Đen. Hai quân Sĩ đen tự nhốt Tướng ở hai bên, còn Xe Đỏ canh hàng 1 nên Tướng không xuống được — hết đường chạy!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Tướng Đen bị hai Sĩ nhà chặn hai bên.
      b[0][4] = { type: 'k', color: 'black', id: ++id };
      b[0][3] = { type: 'a', color: 'black', id: ++id };
      b[0][5] = { type: 'a', color: 'black', id: ++id };
      // Tướng Đỏ lệch cột 4: hai Tướng cùng cột thông nhau thì mọi nước Đỏ đều
      // bất hợp pháp (luật "tướng đối mặt").
      b[9][3] = { type: 'k', color: 'red', id: ++id };
      // Mã chờ sẵn, chân mã [3, 2] trống nên lên [2, 3] được.
      b[4][2] = { type: 'h', color: 'red', id: ++id };
      // Xe canh hàng 1: chặn ô [1, 4] — ô thoát duy nhất của Tướng Đen.
      b[1][8] = { type: 'r', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [4, 2], to: [2, 3] },
  },
  {
    id: 'ct-pz-2',
    title: 'Thế 2: Pháo Lồng Sát Cục',
    tacticName: 'Song Pháo Liên Hoàn',
    difficulty: 'easy',
    description: 'Bé cầm quân Đỏ: hai quân Pháo xếp thẳng cột, Pháo trước làm ngòi cho Pháo sau!',
    hint: 'Pháo trước đã đứng sát Tướng ở [1, 4]. Đưa Pháo [3, 0] sang [3, 4] để bắn xuyên qua ngòi!',
    explanation:
      'Tuyệt diệu! Pháo sau mượn Pháo trước làm ngòi bắn thẳng cung Tướng. Tốt Đỏ ở [1, 3] giữ chặt Pháo trước nên Tướng Đen không ăn được, Sĩ đen ăn vào cũng vẫn còn ngòi — chiếu bí!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Tướng Đen kẹp giữa hai Sĩ: chỉ còn ô [1, 4] để chạy.
      b[0][4] = { type: 'k', color: 'black', id: ++id };
      b[0][3] = { type: 'a', color: 'black', id: ++id };
      b[0][5] = { type: 'a', color: 'black', id: ++id };
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // Pháo trước đứng sát Tướng (chưa chiếu vì không có ngòi).
      b[1][4] = { type: 'c', color: 'red', id: ++id };
      // Pháo sau sẽ sang cột 4, lấy Pháo trước làm ngòi.
      b[3][0] = { type: 'c', color: 'red', id: ++id };
      // Tốt giữ Pháo trước: Tướng Đen ăn Pháo thì tự bước vào ô Tốt canh.
      b[1][3] = { type: 'p', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [3, 0], to: [3, 4] },
  },
  {
    id: 'ct-pz-3',
    title: 'Thế 3: Xe Đâm Đáy Chiếu Bí',
    tacticName: 'Thiết Môn Khảm',
    difficulty: 'easy',
    description: 'Bé cầm quân Đỏ: Xe Đỏ cắm xuống hàng đáy, Tốt giữ chặt ô thoát!',
    hint: 'Đưa Xe [3, 0] thẳng xuống đáy [0, 0]. Tốt Đỏ ở [2, 3] đã canh ô [1, 3]!',
    explanation:
      'Chính xác! Xe đâm xuống hàng đáy chiếu dọc đường biên. Tướng Đen chỉ còn ô [1, 3] để chạy nhưng Tốt Đỏ đã đứng canh, còn [0, 4] thì Sĩ nhà chắn mất — chiếu bí!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Tướng Đen trong góc cung; Sĩ ở [0, 4] chặn ô bên cạnh.
      b[0][3] = { type: 'k', color: 'black', id: ++id };
      b[0][4] = { type: 'a', color: 'black', id: ++id };
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // Xe chờ ở cột 0, đâm thẳng xuống đáy.
      b[3][0] = { type: 'r', color: 'red', id: ++id };
      // Tốt canh ô [1, 3] — ô thoát duy nhất của Tướng Đen.
      b[2][3] = { type: 'p', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [3, 0], to: [0, 0] },
  },
  {
    id: 'ct-pz-4',
    title: 'Thế 4: Binh Nhập Cung',
    tacticName: 'Tốt Đỏ Lập Công',
    difficulty: 'medium',
    description: 'Bé cầm quân Đỏ: Tốt Đỏ đã qua sông, tiến vào cung kết liễu trận đấu!',
    hint: 'Tốt [2, 3] tiến lên [1, 3] là chiếu Tướng. Xe và Mã phía sau đã giữ đủ đường!',
    explanation:
      'Quá siêu! Tốt tiến sát mặt Tướng. Tướng Đen không ăn được Tốt vì Xe ở [4, 3] và Mã ở [2, 5] đều bảo vệ, còn ô [0, 4] thì Mã đã canh — chiếu bí bằng Tốt!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Tướng Đen ở góc cung, Sĩ đứng [1, 4].
      b[0][3] = { type: 'k', color: 'black', id: ++id };
      b[1][4] = { type: 'a', color: 'black', id: ++id };
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // Tốt Đỏ đã qua sông, tiến vào cung.
      b[2][3] = { type: 'p', color: 'red', id: ++id };
      // Xe giữ cột 3 (bảo vệ Tốt), Mã canh ô [0, 4].
      b[4][3] = { type: 'r', color: 'red', id: ++id };
      b[2][5] = { type: 'h', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [2, 3], to: [1, 3] },
  },
  {
    id: 'ct-pz-5',
    title: 'Thế 5: Mã Hậu Pháo',
    tacticName: 'Hiệp đồng Mã - Pháo',
    difficulty: 'medium',
    description: 'Bé cầm quân Đỏ: Mã nhảy vào chiếu, Pháo phía sau đã khoá sẵn ô thoát!',
    hint: 'Mã [4, 5] nhảy lên [2, 6] là chiếu Tướng. Pháo [1, 0] đã canh ô [1, 5]!',
    explanation:
      'Thần sầu! Mã nhảy vào [2, 6] chiếu Tướng Đen. Ô thoát [1, 5] bị Pháo bắn xuyên qua Tốt làm ngòi, còn [0, 4] thì Sĩ nhà chắn — chiếu bí!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Tướng Đen ở góc phải cung, Sĩ chắn ô [0, 4].
      b[0][5] = { type: 'k', color: 'black', id: ++id };
      b[0][4] = { type: 'a', color: 'black', id: ++id };
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // Mã chờ sẵn, chân mã [3, 5] trống nên lên [2, 6] được.
      b[4][5] = { type: 'h', color: 'red', id: ++id };
      // Pháo hàng 1, Tốt làm ngòi để canh ô [1, 5].
      b[1][0] = { type: 'c', color: 'red', id: ++id };
      b[1][2] = { type: 'p', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [4, 5], to: [2, 6] },
  },
  {
    id: 'ct-pz-6',
    title: 'Thế 6: Song Xe Lưỡng Long',
    tacticName: 'Song Xe Tảo Cung',
    difficulty: 'hard',
    description: 'Bé cầm quân Đỏ: hai quân Xe phối hợp đánh sập phòng tuyến cuối cùng của Đen!',
    hint: 'Xe [0, 0] đã khoá hàng đáy. Xe [1, 0] bay sang [1, 5] chiếu Tướng — Tốt [2, 5] giữ Xe!',
    explanation:
      'Chiến thắng vẻ vang! Xe thứ hai sang [1, 5] chiếu thẳng Tướng. Tướng ăn Xe thì Tốt [2, 5] phạt, Sĩ ăn Xe thì Xe [0, 0] chiếu bí — đúng thế Song Xe Tảo Cung!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Tướng Đen, Sĩ chắn ô [0, 4]; Tượng ở [2, 4] để Đen còn nước đi hợp lệ
      // trước khi Đỏ ra tay (không có thì thế cờ đã "chết" sẵn). Tượng không
      // cứu được chiếu vì mắt tượng [1, 5] chính là ô Xe chiếm.
      b[0][5] = { type: 'k', color: 'black', id: ++id };
      b[0][4] = { type: 'a', color: 'black', id: ++id };
      b[2][4] = { type: 'e', color: 'black', id: ++id };
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // Xe thứ nhất khoá hàng đáy phía sau Sĩ.
      b[0][0] = { type: 'r', color: 'red', id: ++id };
      // Xe thứ hai sang cột 5 chiếu, Tốt ở [2, 5] bảo vệ.
      b[1][0] = { type: 'r', color: 'red', id: ++id };
      b[2][5] = { type: 'p', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [1, 0], to: [1, 5] },
  },
];
