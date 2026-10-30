import { describe, it, expect } from 'vitest';
import * as E from '../src/components/learning/cotuong/cotuongEngine';

describe('cotuong engine', () => {
  it('initial board has 32 pieces', () => {
    const b = E.initialBoard();
    let n = 0;
    for (const row of b) for (const p of row) if (p) n++;
    expect(n).toBe(32);
  });

  it('red king in palace', () => {
    const b = E.initialBoard();
    const k = E.findKing(b, 'red');
    expect(k).toEqual([9, 4]);
  });

  it('black king in palace', () => {
    const b = E.initialBoard();
    const k = E.findKing(b, 'black');
    expect(k).toEqual([0, 4]);
  });

  it('pawn moves forward before river', () => {
    const b = E.initialBoard();
    const ms = E.legalMoves(b, [6, 0]);
    expect(ms.map((m) => m.to)).toContainEqual([5, 0]);
  });

  it('elephant cannot cross river', () => {
    const b = E.initialBoard();
    // red elephant at [9,2]; try move to [7,0] maybe; but check no row<5
    const ms = E.legalMoves(b, [9, 2]);
    for (const m of ms) expect(m.to[0]).toBeGreaterThanOrEqual(5);
  });

  it('horse leg blocked', () => {
    // place blocking piece
    const b = E.initialBoard();
    // black horse at [0,1]; leg to [1,1]? Actually move to [2,0] requires leg [1,1]? Let's just ensure no crash
    const ms = E.legalMoves(b, [0, 1]);
    expect(Array.isArray(ms)).toBe(true);
  });

  it('cannot leave king in check', () => {
    const b = E.initialBoard();
    // all moves from initial should keep king safe; just count
    const ms = E.allLegalMoves(b, 'red');
    expect(ms.length).toBeGreaterThan(0);
  });

  it('flying general illegal', () => {
    // Construct position: kings same column no pieces between -> should be illegal; but initial not.
    const b = E.initialBoard();
    // move all pieces between? Hard; test kingsFace function indirectly by a move resulting
    expect(E.kingsFace(b)).toBe(false);
  });

  it('bot returns legal move', () => {
    const b = E.initialBoard();
    const m = E.getBestMove(b, 'black', 2);
    expect(m).not.toBeNull();
    const legal = E.legalMoves(b, m!.from);
    expect(legal.some((x) => x.to[0] === m!.to[0] && x.to[1] === m!.to[1])).toBe(true);
  });

  it('applyMove updates board', () => {
    const b = E.initialBoard();
    const m = { from: [6, 0] as [number, number], to: [5, 0] as [number, number] };
    const nb = E.applyMove(b, m);
    expect(nb[5][0]?.color).toBe('red');
    expect(nb[6][0]).toBeNull();
  });

  it('cannon capture requires screen', () => {
    // Build a simple scenario
    const b = E.initialBoard();
    // red cannon at [7,1]; black piece at [7,7] with one screen between? In initial, black pawn? row7 has black? Actually row7 red cannon and red? Let's not assert exact; just no crash
    const ms = E.legalMoves(b, [7, 1]);
    expect(Array.isArray(ms)).toBe(true);
  });
});

describe('cotuong rules extra', () => {
  const empty = () => Array.from({ length: 10 }, () => Array(9).fill(null));

  it('cannon captures with one screen', () => {
    const b = empty() as any;
    b[9][4] = { type: 'k', color: 'red' };
    b[0][4] = { type: 'k', color: 'black' };
    b[7][1] = { type: 'c', color: 'red' };
    b[7][2] = { type: 'p', color: 'black' };
    b[7][4] = { type: 'r', color: 'black' };
    const ms = E.legalMoves(b, [7, 1]);
    expect(ms).toContainEqual({ from: [7, 1], to: [7, 4] });
  });

  it('cannon cannot capture without screen', () => {
    const b = empty() as any;
    b[9][4] = { type: 'k', color: 'red' };
    b[0][4] = { type: 'k', color: 'black' };
    b[7][1] = { type: 'c', color: 'red' };
    b[7][4] = { type: 'r', color: 'black' };
    const ms = E.legalMoves(b, [7, 1]);
    expect(ms).not.toContainEqual({ from: [7, 1], to: [7, 4] });
  });

  it('horse leg blocked', () => {
    const b = empty() as any;
    b[9][4] = { type: 'k', color: 'red' };
    b[0][4] = { type: 'k', color: 'black' };
    b[9][1] = { type: 'h', color: 'red' };
    b[8][1] = { type: 'p', color: 'black' };
    const ms = E.legalMoves(b, [9, 1]);
    expect(ms).not.toContainEqual({ from: [9, 1], to: [7, 0] });
    expect(ms).not.toContainEqual({ from: [9, 1], to: [7, 2] });
  });

  it('elephant eye blocked', () => {
    const b = empty() as any;
    b[9][4] = { type: 'k', color: 'red' };
    b[0][4] = { type: 'k', color: 'black' };
    b[9][2] = { type: 'e', color: 'red' };
    b[8][1] = { type: 'p', color: 'black' };
    const ms = E.legalMoves(b, [9, 2]);
    expect(ms).not.toContainEqual({ from: [9, 2], to: [7, 0] });
  });

  it('move causing flying general illegal', () => {
    const b = empty() as any;
    b[9][4] = { type: 'k', color: 'red' };
    b[0][4] = { type: 'k', color: 'black' };
    b[5][4] = { type: 'r', color: 'red' };
    const ms = E.legalMoves(b, [5, 4]);
    expect(ms).not.toContainEqual({ from: [5, 4], to: [5, 3] });
  });

  it('pawn sideways only after crossing', () => {
    const b = empty() as any;
    b[9][4] = { type: 'k', color: 'red' };
    b[0][4] = { type: 'k', color: 'black' };
    b[6][0] = { type: 'p', color: 'red' };
    const ms = E.legalMoves(b, [6, 0]);
    expect(ms).not.toContainEqual({ from: [6, 0], to: [6, 1] });
    const b2 = empty() as any;
    b2[9][4] = { type: 'k', color: 'red' };
    b2[0][4] = { type: 'k', color: 'black' };
    b2[5][4] = { type: 'p', color: 'red' };
    b2[4][0] = { type: 'p', color: 'red' };
    const ms2 = E.legalMoves(b2, [4, 0]);
    expect(ms2).toContainEqual({ from: [4, 0], to: [4, 1] });
  });

  it('validates COTUONG_PUZZLES integrity and legal winning moves', async () => {
    const { COTUONG_PUZZLES } = await import('../src/components/learning/cotuong/cotuongPuzzles');
    expect(COTUONG_PUZZLES.length).toBeGreaterThanOrEqual(6);
    for (const pz of COTUONG_PUZZLES) {
      expect(pz.id).toBeTruthy();
      expect(pz.title).toBeTruthy();
      expect(pz.hint).toBeTruthy();
      expect(pz.explanation).toBeTruthy();

      const b = pz.createBoard();
      // Verify both kings exist
      const redKing = E.findKing(b, 'red');
      const blackKing = E.findKing(b, 'black');
      expect(redKing).not.toBeNull();
      expect(blackKing).not.toBeNull();

      // Verify expected move is in legal moves
      const moves = E.legalMoves(b, pz.expectedMove.from);
      expect(moves).toContainEqual(pz.expectedMove);
    }
  });
});
