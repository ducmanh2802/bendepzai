import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

describe('T26 — bàn cờ không nhận thao tác ngoài trạng thái chơi', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const view = readFileSync(
    join(here, '..', 'src/components/learning/cotuong/CotuongPuzzlesView.tsx'),
    'utf8'
  );

  it('chặn chọn quân khi đang hiện nước chiếu suông hoặc đã giải', () => {
    expect(view).toMatch(/if \(status !== 'playing'\) return;/);
    expect(view).not.toMatch(/if \(status === 'solved'\) return;/);
  });

  it('trả bàn cờ sau nước chiếu suông thì xoá cả quân đang chọn và nước hợp lệ', () => {
    const timerStart = view.indexOf('revertTimer.current = window.setTimeout(');
    expect(timerStart).toBeGreaterThan(-1);
    const timer = view.slice(timerStart, view.indexOf('}, 1100);', timerStart));
    for (const reset of [
      'setBoard(activePuzzle.createBoard())',
      'setLastMove(null)',
      'setSelected(null)',
      'setLegal([])',
      'setMissNotice(false)',
      "setStatus('playing')",
    ]) {
      expect(timer, reset).toContain(reset);
    }
  });

  it('lời nhắc "chưa chiếu" chỉ hiện sau nước đi sai, không hiện lại sau nước chiếu suông', () => {
    const missRender = view.indexOf('{status === \'playing\' && missNotice && (');
    expect(missRender).toBeGreaterThan(-1);
    expect(view).not.toMatch(/status === 'playing' && misses > 0/);
    const timerStart = view.indexOf('revertTimer.current = window.setTimeout(');
    const timer = view.slice(timerStart, view.indexOf('}, 1100);', timerStart));
    expect(timer).not.toContain('setMissNotice(true)');
  });

  it('overlay báo đúng: giải lại thế đã giải thì không thêm XP', () => {
    expect(view).toContain('data-testid="ct-puzzle-reward"');
    expect(view).toContain('const [rewardedNow, setRewardedNow] = useState(false);');
    expect(view).toMatch(/const firstTime = StorageService\.markCotuongPuzzleSolved\(activePuzzle\.id\);\s*setRewardedNow\(firstTime\);/);
    expect(view).toContain('Đã giải trước đó — ôn lại không thêm XP');
  });
});

describe('T26 — lưới cờ thẳng với giao điểm quân', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const board = readFileSync(
    join(here, '..', 'src/components/learning/cotuong/CotuongBoard3D.tsx'),
    'utf8'
  );

  it('đường kẻ, cung Tướng và dấu mốc dùng cùng lề M với quân cờ', () => {
    const start = board.indexOf('<g transform={`translate(${M} ${M})`}>');
    expect(start).toBeGreaterThan(-1);
    const group = board.slice(start, board.indexOf('</g>', start));
    for (const part of ['{lines}', 'M3,0 L5,2 M5,0 L3,2', 'M3,7 L5,9 M5,7 L3,9', '{MARKS.map']) {
      expect(group, part).toContain(part);
    }
  });
});
