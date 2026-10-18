export type PieceType = 'k' | 'a' | 'e' | 'h' | 'r' | 'c' | 'p';
export type Color = 'red' | 'black';
export interface Piece { type: PieceType; color: Color; }
export type Board = (Piece | null)[][];
export interface Move { from: [number, number]; to: [number, number]; }

const ROWS = 10;
const COLS = 9;

export const initialBoard = (): Board => {
  const b: Board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const backB: PieceType[] = ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r'];
  for (let c = 0; c < COLS; c++) {
    b[0][c] = { type: backB[c], color: 'black' };
    b[9][c] = { type: backB[c], color: 'red' };
  }
  // cannons
  b[2][1] = { type: 'c', color: 'black' };
  b[2][7] = { type: 'c', color: 'black' };
  b[7][1] = { type: 'c', color: 'red' };
  b[7][7] = { type: 'c', color: 'red' };
  // pawns
  for (let c = 0; c < COLS; c += 2) {
    b[3][c] = { type: 'p', color: 'black' };
    b[6][c] = { type: 'p', color: 'red' };
  }
  return b;
};

export const cloneBoard = (b: Board): Board => b.map((row) => row.map((p) => (p ? { ...p } : null)));

export const inBounds = (r: number, c: number): boolean => r >= 0 && r < ROWS && c >= 0 && c < COLS;

function inPalace(color: Color, r: number, c: number): boolean {
  if (c < 3 || c > 5) return false;
  if (color === 'red') return r >= 7 && r <= 9;
  return r >= 0 && r <= 2;
}

function sameSide(color: Color, r: number): boolean {
  // red stays rows 5-9 for elephant; black 0-4
  if (color === 'red') return r >= 5;
  return r <= 4;
}

function pseudoMoves(b: Board, from: [number, number]): Move[] {
  const [r, c] = from;
  const p = b[r][c];
  if (!p) return [];
  const moves: Move[] = [];
  const opp = p.color === 'red' ? 'black' : 'red';
  const add = (rr: number, cc: number) => {
    if (!inBounds(rr, cc)) return;
    const t = b[rr][cc];
    if (!t || t.color === opp) moves.push({ from, to: [rr, cc] });
  };
  const slide = (dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const t = b[nr][nc];
      if (!t) { moves.push({ from, to: [nr, nc] }); }
      else { if (t.color === opp) moves.push({ from, to: [nr, nc] }); break; }
      nr += dr; nc += dc;
    }
  };
  switch (p.type) {
    case 'k':
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc) && inPalace(p.color, nr, nc)) {
          const t = b[nr][nc];
          if (!t || t.color === opp) moves.push({ from, to: [nr, nc] });
        }
      }
      break;
    case 'a':
      for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc) && inPalace(p.color, nr, nc)) {
          const t = b[nr][nc];
          if (!t || t.color === opp) moves.push({ from, to: [nr, nc] });
        }
      }
      break;
    case 'e': {
      for (const [dr, dc] of [[-2, -2], [-2, 2], [2, -2], [2, 2]]) {
        const nr = r + dr, nc = c + dc;
        const mr = r + dr / 2, mc = c + dc / 2;
        if (inBounds(nr, nc) && sameSide(p.color, nr) && !b[mr][mc]) {
          const t = b[nr][nc];
          if (!t || t.color === opp) moves.push({ from, to: [nr, nc] });
        }
      }
      break;
    }
    case 'h': {
      const patterns: [number, number, number, number][] = [
        [-2, -1, -1, 0], [-2, 1, -1, 0],
        [2, -1, 1, 0], [2, 1, 1, 0],
        [-1, -2, 0, -1], [1, -2, 0, -1],
        [-1, 2, 0, 1], [1, 2, 0, 1],
      ];
      for (const [dr, dc, lr, lc] of patterns) {
        const nr = r + dr, nc = c + dc;
        const legR = r + lr, legC = c + lc;
        if (inBounds(nr, nc) && inBounds(legR, legC) && !b[legR][legC]) {
          const t = b[nr][nc];
          if (!t || t.color === opp) moves.push({ from, to: [nr, nc] });
        }
      }
      break;
    }
    case 'r':
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) slide(dr, dc);
      break;
    case 'c': {
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        // slide to empty
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc) && !b[nr][nc]) {
          moves.push({ from, to: [nr, nc] });
          nr += dr; nc += dc;
        }
        // capture with one screen
        if (inBounds(nr, nc)) {
          // skip first piece
          let sr = nr + dr, sc = nc + dc;
          while (inBounds(sr, sc)) {
            const t = b[sr][sc];
            if (t) {
              if (t.color === opp) moves.push({ from, to: [sr, sc] });
              break;
            }
            sr += dr; sc += dc;
          }
        }
      }
      break;
    }
    case 'p': {
      const dir = p.color === 'red' ? -1 : 1;
      const crossed = p.color === 'red' ? r <= 4 : r >= 5;
      // forward
      add(r + dir, c);
      if (crossed) {
        add(r, c - 1);
        add(r, c + 1);
      }
      break;
    }
  }
  return moves;
}

export function findKing(b: Board, color: Color): [number, number] | null {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = b[r][c];
      if (p && p.type === 'k' && p.color === color) return [r, c];
    }
  return null;
}

export function kingsFace(b: Board): boolean {
  const rk = findKing(b, 'red');
  const bk = findKing(b, 'black');
  if (!rk || !bk) return false;
  if (rk[1] !== bk[1]) return false;
  const col = rk[1];
  const minR = Math.min(rk[0], bk[0]) + 1;
  const maxR = Math.max(rk[0], bk[0]);
  for (let r = minR; r < maxR; r++) {
    if (b[r][col]) return false;
  }
  return true;
}

export function isAttacked(b: Board, r: number, c: number, by: Color): boolean {
  for (let fr = 0; fr < ROWS; fr++)
    for (let fc = 0; fc < COLS; fc++) {
      const p = b[fr][fc];
      if (p && p.color === by) {
        const ms = pseudoMoves(b, [fr, fc]);
        if (ms.some((m) => m.to[0] === r && m.to[1] === c)) return true;
      }
    }
  return false;
}

export function inCheck(b: Board, color: Color): boolean {
  const k = findKing(b, color);
  if (!k) return true;
  const opp = color === 'red' ? 'black' : 'red';
  if (isAttacked(b, k[0], k[1], opp)) return true;
  if (kingsFace(b)) return true;
  return false;
}

export function legalMoves(b: Board, from: [number, number]): Move[] {
  const p = b[from[0]][from[1]];
  if (!p) return [];
  return pseudoMoves(b, from).filter((m) => {
    const nb = cloneBoard(b);
    const pp = nb[m.from[0]][m.from[1]]!;
    nb[m.to[0]][m.to[1]] = pp;
    nb[m.from[0]][m.from[1]] = null;
    return !inCheck(nb, p.color);
  });
}

export function allLegalMoves(b: Board, color: Color): Move[] {
  const out: Move[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = b[r][c];
      if (p && p.color === color) out.push(...legalMoves(b, [r, c]));
    }
  return out;
}

export function applyMove(b: Board, m: Move): Board {
  const nb = cloneBoard(b);
  const p = nb[m.from[0]][m.from[1]]!;
  nb[m.to[0]][m.to[1]] = p;
  nb[m.from[0]][m.from[1]] = null;
  return nb;
}

export function isGameOver(b: Board, sideToMove?: Color): { over: boolean; result: string } {
  const sides: Color[] = sideToMove ? [sideToMove] : ['red', 'black'];
  for (const color of sides) {
    const moves = allLegalMoves(b, color);
    if (moves.length === 0) {
      return { over: true, result: color === 'red' ? 'Đen thắng' : 'Đỏ thắng' };
    }
  }
  return { over: false, result: '' };
}

// ---- evaluation & bot ----
const VAL: Record<PieceType, number> = { k: 0, a: 20, e: 20, h: 40, r: 90, c: 45, p: 10 };

function evaluate(b: Board): number {
  let score = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = b[r][c];
      if (!p) continue;
      const sign = p.color === 'red' ? 1 : -1;
      let v = VAL[p.type];
      // pawn value increases after crossing river
      if (p.type === 'p') {
        const crossed = p.color === 'red' ? r <= 4 : r >= 5;
        if (crossed) v = 20;
        // progress toward promotion? no promotion in xiangqi; forward progress bonus
        v += p.color === 'red' ? (9 - r) : r;
      }
      // centrality for horses/rooks
      if (p.type === 'h' || p.type === 'r') v += (4 - Math.abs(c - 4)) * 0.5;
      score += sign * v;
    }
  // mobility
  score += (allLegalMoves(b, 'red').length - allLegalMoves(b, 'black').length) * 0.3;
  // king safety: penalize exposed king? skip
  return score;
}

export function getBestMove(b: Board, color: Color, depth: number): Move | null {
  const moves = allLegalMoves(b, color);
  if (moves.length === 0) return null;
  moves.sort((a, mv) => {
    const ta = b[a.to[0]][a.to[1]];
    const tb = b[mv.to[0]][mv.to[1]];
    return (tb ? VAL[tb.type] : 0) - (ta ? VAL[ta.type] : 0);
  });
  const maximizing = color === 'red';
  let best: Move | null = null;
  let bestScore = maximizing ? -Infinity : Infinity;
  for (const m of moves) {
    const nb = applyMove(b, m);
    const sc = minimax(nb, depth - 1, -Infinity, Infinity, !maximizing);
    if (maximizing ? sc > bestScore : sc < bestScore) {
      bestScore = sc;
      best = m;
    }
  }
  return best;
}

function minimax(b: Board, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  const color: Color = maximizing ? 'red' : 'black';
  const moves = allLegalMoves(b, color);
  if (moves.length === 0) {
    return maximizing ? -100000 : 100000;
  }
  if (depth === 0) return evaluate(b);
  if (moves.length === 0) return maximizing ? -100000 : 100000;
  if (maximizing) {
    let maxEval = -Infinity;
    for (const m of moves) {
      const ev = minimax(applyMove(b, m), depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      const ev = minimax(applyMove(b, m), depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
