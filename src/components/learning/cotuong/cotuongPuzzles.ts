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

export const COTUONG_PUZZLES: CotuongPuzzle[] = [
  {
    id: 'ct-pz-1',
    title: 'Thế 1: Mã Ngọa Tào',
    tacticName: 'Sát pháp Ngọa Tào Mã',
    difficulty: 'easy',
    description: 'Bé cầm quân Đỏ đi trước: Hãy nhảy quân Mã Đỏ vào vị trí hiểm hóc để chiếu bí Tướng Đen!',
    hint: 'Nhìn vào góc trên bên phải của cung Tướng Đen. Mã nhảy hình chữ L vào ô [1, 3]!',
    explanation: 'Xuất sắc! Mã nhảy vào Ngọa Tào (hàng 1 cột 3), vừa chiếu Tướng vừa khóa chặt đường di chuyển!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Black King trapped in palace
      b[0][4] = { type: 'k', color: 'black', id: ++id };
      b[0][3] = { type: 'a', color: 'black', id: ++id };
      b[0][5] = { type: 'a', color: 'black', id: ++id };
      // Red King — lệch cột 4 để hai Tướng không đối mặt nhau (luật "tướng đối
      // mặt" làm mọi nước Đỏ đều bất hợp pháp và thế cờ không chơi được).
      b[9][3] = { type: 'k', color: 'red', id: ++id };
      // Red Knight ready for Ngoa Tao: at [3, 2] -> jumps to [1, 3] (leg at [2, 2] is free)
      b[3][2] = { type: 'h', color: 'red', id: ++id };
      // Red Chariot supporting
      b[1][8] = { type: 'r', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [3, 2], to: [1, 3] },
  },
  {
    id: 'ct-pz-2',
    title: 'Thế 2: Pháo Lồng Sát Cục',
    tacticName: 'Song Pháo Liên Hoàn',
    difficulty: 'easy',
    description: 'Bé cầm quân Đỏ đi trước: Dùng sức mạnh của 2 Pháo xếp thẳng hàng chiếu hết Tướng Đen!',
    hint: 'Pháo sau mượn Pháo trước làm ngòi! Đưa Pháo [6, 4] tiến lên chiếu thẳng mặt Tướng.',
    explanation: 'Tuyệt diệu! Pháo trước làm ngòi cho Pháo sau chiếu, Tướng Đen không có đường thoát!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Black King and Advisors — Sĩ sang cột 3 để cột 4 chỉ còn đúng một ngòi
      // là Pháo trước; hai ngòi thì Pháo sau không được phép bắn xuyên.
      b[0][4] = { type: 'k', color: 'black', id: ++id };
      b[1][3] = { type: 'a', color: 'black', id: ++id };
      b[0][5] = { type: 'a', color: 'black', id: ++id };
      // Red King
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // Two Red Cannons aligned on column 4
      b[3][4] = { type: 'c', color: 'red', id: ++id };
      b[6][4] = { type: 'c', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [6, 4], to: [0, 4] },
  },
  {
    id: 'ct-pz-3',
    title: 'Thế 3: Xe Đâm Đáy Chiếu Bí',
    tacticName: 'Thiết Môn Khảm',
    difficulty: 'easy',
    description: 'Bé cầm quân Đỏ: Xe Đỏ uy dũng cắm xuống đường biên đáy bắt gọn Tướng Đen!',
    hint: 'Đưa Xe từ hàng 2 cắm thẳng xuống hàng 0 (hàng đáy) để chiếu dứt điểm.',
    explanation: 'Chính xác! Xe đâm đáy khóa toàn bộ cung điện, Tướng Đen bị chiếu hết ngay tức khắc.',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Black King in corner of palace — Sĩ dời sang cột 4 để cột 3 thông,
      // không có gì chặn thì Xe mới đâm xuống đáy được.
      b[0][3] = { type: 'k', color: 'black', id: ++id };
      b[1][4] = { type: 'a', color: 'black', id: ++id };
      // Red King
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // Red Chariot
      b[2][3] = { type: 'r', color: 'red', id: ++id };
      // Supporting Red Cannon controlling rank
      b[4][3] = { type: 'c', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [2, 3], to: [0, 3] },
  },
  {
    id: 'ct-pz-4',
    title: 'Thế 4: Binh Nhập Cung',
    tacticName: 'Tốt Đỏ Lập Công',
    difficulty: 'medium',
    description: 'Bé cầm quân Đỏ: Quân Tốt (Binh) đã qua sông dũng mãnh tiến vào kết liễu trận đấu!',
    hint: 'Tốt ở hàng 1 đã qua sông, có thể tiến hoặc đi ngang. Hãy tiến Tốt [1, 4] ăn thẳng vào [0, 4]!',
    explanation: 'Quá siêu! Tốt áp sát mặt Tướng với sự hỗ trợ của quân Xe phía sau, Tướng Đen không thể chống đỡ!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Black King
      b[0][4] = { type: 'k', color: 'black', id: ++id };
      b[0][3] = { type: 'a', color: 'black', id: ++id };
      // Red King
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // Red Pawn at [1, 4] supported by Chariot at [5, 4]
      b[1][4] = { type: 'p', color: 'red', id: ++id };
      b[5][4] = { type: 'r', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [1, 4], to: [0, 4] },
  },
  {
    id: 'ct-pz-5',
    title: 'Thế 5: Mã Hậu Pháo',
    tacticName: 'Hiệp đồng Mã - Pháo',
    difficulty: 'medium',
    description: 'Bé cầm quân Đỏ: Phối hợp nhịp nhàng giữa Mã làm ngòi và Pháo cắm chiếu hiểm hóc!',
    hint: 'Pháo Đỏ ở [7, 4] có thể dùng Mã Đỏ [2, 4] làm ngòi để nổ súng vào thẳng Tướng Đen [0, 4]!',
    explanation: 'Thần sầu! Pháo mượn lưng Mã làm ngòi bắn thẳng cung Tướng, tạo nên thế sát Mã Hậu Pháo vang danh!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Black King
      b[0][4] = { type: 'k', color: 'black', id: ++id };
      b[1][3] = { type: 'a', color: 'black', id: ++id };
      b[1][5] = { type: 'a', color: 'black', id: ++id };
      // Red King
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // Red Knight at [2, 4] acting as cannon screen
      b[2][4] = { type: 'h', color: 'red', id: ++id };
      // Red Cannon at [7, 4]
      b[7][4] = { type: 'c', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [7, 4], to: [0, 4] },
  },
  {
    id: 'ct-pz-6',
    title: 'Thế 6: Song Xe Lưỡng Long',
    tacticName: 'Song Xe Tảo Cung',
    difficulty: 'hard',
    description: 'Bé cầm quân Đỏ: Hai quân Xe Đỏ dũng mãnh phối hợp đánh sập hoàn toàn phòng tuyến Đen!',
    hint: 'Một Xe ép Tướng Đen dạt góc, Xe thứ hai [1, 0] bay ngang sang [1, 4] chiếu hết!',
    explanation: 'Chiến thắng vẻ vang! Chiến thuật Song Xe Tảo Cung kết liễu trận đấu đẹp mắt như trong sách cờ!',
    createBoard: () => {
      const b = emptyBoard();
      let id = 0;
      // Black King pinned in palace
      b[0][5] = { type: 'k', color: 'black', id: ++id };
      b[0][4] = { type: 'a', color: 'black', id: ++id };
      // Red King
      b[9][4] = { type: 'k', color: 'red', id: ++id };
      // First Chariot pinning king
      b[0][0] = { type: 'r', color: 'red', id: ++id };
      // Second Chariot delivering checkmate
      b[1][0] = { type: 'r', color: 'red', id: ++id };
      return b;
    },
    expectedMove: { from: [1, 0], to: [1, 5] },
  },
];
