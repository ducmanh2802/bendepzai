import { describe, it, expect, beforeEach } from 'vitest';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import * as E from '../src/components/learning/cotuong/cotuongEngine';
import { COTUONG_PUZZLES, judgePuzzleMove } from '../src/components/learning/cotuong/cotuongPuzzles';
import { StorageService } from '../src/services/storage';

const isMate = (b: E.Board) => E.inCheck(b, 'black') && E.allLegalMoves(b, 'black').length === 0;

describe('T26 — thế cờ tướng là chiếu bí thật', () => {
  it('đủ 6 thế, id/tên/gợi ý không trùng và đều có nội dung', () => {
    expect(COTUONG_PUZZLES.length).toBe(6);
    expect(new Set(COTUONG_PUZZLES.map((p) => p.id)).size).toBe(6);
    for (const pz of COTUONG_PUZZLES) {
      expect(pz.title.length).toBeGreaterThan(4);
      expect(pz.tacticName.length).toBeGreaterThan(3);
      expect(pz.description.length).toBeGreaterThan(10);
      expect(pz.hint.length).toBeGreaterThan(10);
      expect(pz.explanation.length).toBeGreaterThan(10);
    }
  });

  it('thế cờ xuất phát còn chơi được: Tướng Đen chưa bị chiếu và Đen còn nước đi', () => {
    for (const pz of COTUONG_PUZZLES) {
      const b = pz.createBoard();
      expect(E.inCheck(b, 'black'), `${pz.id} Tướng Đen bị chiếu sẵn`).toBe(false);
      expect(E.isGameOver(b, 'black').over, `${pz.id} Đen đã chết sẵn`).toBe(false);
      expect(E.findKing(b, 'red'), pz.id).not.toBeNull();
      expect(E.findKing(b, 'black'), pz.id).not.toBeNull();
    }
  });

  it('nước đáp án là chiếu bí: Tướng Đen còn trên bàn, bị chiếu, không còn nước đi', () => {
    for (const pz of COTUONG_PUZZLES) {
      const b = pz.createBoard();
      const legal = E.legalMoves(b, pz.expectedMove.from);
      expect(
        legal.some((m) => m.to[0] === pz.expectedMove.to[0] && m.to[1] === pz.expectedMove.to[1]),
        `${pz.id} nước đáp án không hợp lệ`
      ).toBe(true);

      const after = E.applyMove(b, pz.expectedMove);
      // Không được là "ăn Tướng" — bé phải thấy chiếu bí chứ không thấy Tướng biến mất.
      expect(E.findKing(after, 'black'), `${pz.id} Tướng Đen bị ăn`).not.toBeNull();
      expect(E.inCheck(after, 'black'), `${pz.id} không chiếu`).toBe(true);
      expect(E.allLegalMoves(after, 'black').length, `${pz.id} Tướng còn đường thoát`).toBe(0);
      expect(isMate(after), pz.id).toBe(true);
      expect(judgePuzzleMove(b, pz.expectedMove), pz.id).toBe('mate');
    }
  });

  it('mỗi thế có 1–2 nước chiếu bí và đáp án mẫu nằm trong đó', () => {
    for (const pz of COTUONG_PUZZLES) {
      const b = pz.createBoard();
      const mates = E.allLegalMoves(E.cloneBoard(b), 'red').filter((m) => isMate(E.applyMove(b, m)));
      expect(mates.length, `${pz.id} số nước chiếu bí`).toBeGreaterThanOrEqual(1);
      expect(mates.length, `${pz.id} quá nhiều nước chiếu bí`).toBeLessThanOrEqual(2);
      expect(
        mates.some((m) => m.from[0] === pz.expectedMove.from[0] && m.from[1] === pz.expectedMove.from[1] && m.to[0] === pz.expectedMove.to[0] && m.to[1] === pz.expectedMove.to[1]),
        `${pz.id} đáp án mẫu không chiếu bí`
      ).toBe(true);
    }
  });

  it('judgePuzzleMove chấm bằng luật: bí = mate, chiếu suông = check, còn lại = miss', () => {
    for (const pz of COTUONG_PUZZLES) {
      const b = pz.createBoard();
      for (const m of E.allLegalMoves(E.cloneBoard(b), 'red')) {
        const after = E.applyMove(b, m);
        const expected = !E.inCheck(after, 'black')
          ? 'miss'
          : E.allLegalMoves(after, 'black').length === 0
          ? 'mate'
          : 'check';
        expect(judgePuzzleMove(b, m), `${pz.id} ${m.from}>${m.to}`).toBe(expected);
      }
    }
  });
});

describe('T26 — lưu tiến độ thế cờ', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('giải lần đầu trả true, giải lại trả false (không cày XP)', () => {
    expect(StorageService.getCotuongSolvedPuzzles()).toEqual([]);
    expect(StorageService.markCotuongPuzzleSolved('ct-pz-1')).toBe(true);
    expect(StorageService.markCotuongPuzzleSolved('ct-pz-1')).toBe(false);
    expect(StorageService.markCotuongPuzzleSolved('ct-pz-6')).toBe(true);
    expect(StorageService.getCotuongSolvedPuzzles()).toEqual(['ct-pz-1', 'ct-pz-6']);
  });

  it('bỏ id lạ và dữ liệu rác, giữ đúng dạng ct-pz-N', () => {
    expect(StorageService.markCotuongPuzzleSolved('hehe')).toBe(false);
    expect(StorageService.markCotuongPuzzleSolved('ct-pz-1; rm -rf')).toBe(false);
    localStorage.setItem('kho_bau_cotuong_puzzles', JSON.stringify(['ct-pz-2', 7, null, 'ct-pz-2', 'x']));
    expect(StorageService.getCotuongSolvedPuzzles()).toEqual(['ct-pz-2']);
    localStorage.setItem('kho_bau_cotuong_puzzles', '{not json');
    expect(StorageService.getCotuongSolvedPuzzles()).toEqual([]);
  });

  it('reset tiến độ của ba mẹ xoá luôn thế cờ đã giải', () => {
    StorageService.markCotuongPuzzleSolved('ct-pz-3');
    StorageService.resetProgress();
    expect(StorageService.getCotuongSolvedPuzzles()).toEqual([]);
  });
});
