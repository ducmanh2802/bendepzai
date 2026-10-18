export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';
export interface Piece { type: PieceType; color: Color; }
export type Board = (Piece | null)[][];
export interface Move { from: [number, number]; to: [number, number]; promotion?: PieceType; }

const VAL: Record<PieceType, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

export function initialBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: back[c], color: 'b' };
    b[1][c] = { type: 'p', color: 'b' };
    b[6][c] = { type: 'p', color: 'w' };
    b[7][c] = { type: back[c], color: 'w' };
  }
  return b;
}

export function cloneBoard(b: Board): Board {
  return b.map((row) => row.map((p) => (p ? { ...p } : null)));
}

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function pseudoMoves(b: Board, from: [number, number]): Move[] {
  const [r, c] = from;
  const p = b[r][c];
  if (!p) return [];
  const moves: Move[] = [];
  const opp = p.color === 'w' ? 'b' : 'w';
  const addSlide = (dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const t = b[nr][nc];
      if (!t) { moves.push({ from, to: [nr, nc] }); }
      else { if (t.color === opp) moves.push({ from, to: [nr, nc] }); break; }
      nr += dr; nc += dc;
    }
  };
  switch (p.type) {
    case 'p': {
      const dir = p.color === 'w' ? -1 : 1;
      const start = p.color === 'w' ? 6 : 1;
      if (inBounds(r + dir, c) && !b[r + dir][c]) {
        moves.push({ from, to: [r + dir, c] });
        if (r === start && !b[r + 2 * dir][c]) moves.push({ from, to: [r + 2 * dir, c] });
      }
      for (const dc of [-1, 1]) {
        const nr = r + dir, nc = c + dc;
        if (inBounds(nr, nc)) {
          const t = b[nr][nc];
          if (t && t.color === opp) moves.push({ from, to: [nr, nc] });
        }
      }
      break;
    }
    case 'n': {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc)) {
          const t = b[nr][nc];
          if (!t || t.color === opp) moves.push({ from, to: [nr, nc] });
        }
      }
      break;
    }
    case 'b': {
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) addSlide(dr, dc);
      break;
    }
    case 'r': {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) addSlide(dr, dc);
      break;
    }
    case 'q': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) addSlide(dr, dc);
      break;
    }
    case 'k': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc)) {
          const t = b[nr][nc];
          if (!t || t.color === opp) moves.push({ from, to: [nr, nc] });
        }
      }
      break;
    }
  }
  // promotion
  for (const m of moves) {
    const [tr] = m.to;
    const pp = b[r][c];
    if (pp?.type === 'p' && (tr === 0 || tr === 7)) m.promotion = 'q';
  }
  return moves;
}

export function findKing(b: Board, color: Color): [number, number] | null {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p && p.type === 'k' && p.color === color) return [r, c];
    }
  return null;
}

export function isAttacked(b: Board, r: number, c: number, by: Color): boolean {
  for (let fr = 0; fr < 8; fr++)
    for (let fc = 0; fc < 8; fc++) {
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
  if (!k) return false;
  return isAttacked(b, k[0], k[1], color === 'w' ? 'b' : 'w');
}

export function legalMoves(b: Board, from: [number, number]): Move[] {
  const p = b[from[0]][from[1]];
  if (!p) return [];
  return pseudoMoves(b, from).filter((m) => {
    const nb = cloneBoard(b);
    const pp = nb[m.from[0]][m.from[1]]!;
    nb[m.to[0]][m.to[1]] = m.promotion ? { type: m.promotion, color: pp.color } : pp;
    nb[m.from[0]][m.from[1]] = null;
    return !inCheck(nb, p.color);
  });
}

export function allLegalMoves(b: Board, color: Color): Move[] {
  const out: Move[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p && p.color === color) out.push(...legalMoves(b, [r, c]));
    }
  return out;
}

export function applyMove(b: Board, m: Move): Board {
  const nb = cloneBoard(b);
  const p = nb[m.from[0]][m.from[1]]!;
  nb[m.to[0]][m.to[1]] = m.promotion ? { type: m.promotion, color: p.color } : p;
  nb[m.from[0]][m.from[1]] = null;
  return nb;
}

export function isGameOver(b: Board): { over: boolean; result: string } {
  for (const color of ['w', 'b'] as Color[]) {
    const moves = allLegalMoves(b, color);
    if (moves.length === 0) {
      if (inCheck(b, color)) {
        return { over: true, result: color === 'w' ? 'Đen thắng (chiếu hết)' : 'Trắng thắng (chiếu hết)' };
      }
      return { over: true, result: 'Hòa (bế tắc)' };
    }
  }
  return { over: false, result: '' };
}

const PST_PAWN = [
  [0,0,0,0,0,0,0,0],
  [50,50,50,50,50,50,50,50],
  [10,10,20,30,30,20,10,10],
  [5,5,10,25,25,10,5,5],
  [0,0,0,20,20,0,0,0],
  [5,-5,-10,0,0,-10,-5,5],
  [5,10,10,-20,-20,10,10,5],
  [0,0,0,0,0,0,0,0],
];
const PST_KNIGHT = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,0,0,0,0,-20,-40],
  [-30,0,10,15,15,10,0,-30],
  [-30,5,15,20,20,15,5,-30],
  [-30,0,15,20,20,15,0,-30],
  [-30,5,10,15,15,10,5,-30],
  [-40,-20,0,5,5,0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

function evaluate(b: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p) continue;
      const sign = p.color === 'w' ? 1 : -1;
      score += sign * VAL[p.type];
      if (p.type === 'p') {
        const rr = p.color === 'w' ? r : 7 - r;
        score += sign * PST_PAWN[rr][c] / 10;
      }
      if (p.type === 'n') {
        const rr = p.color === 'w' ? r : 7 - r;
        score += sign * PST_KNIGHT[rr][c] / 10;
      }
    }
  // mobility
  score += (allLegalMoves(b,'w').length - allLegalMoves(b,'b').length) * 2;
  return score;
}

export function getBestMove(b: Board, color: Color, depth: number): Move | null {
  const moves = allLegalMoves(b, color);
  if (moves.length === 0) return null;
  // move ordering: captures first
  moves.sort((a, bmv) => {
    const ta = b[a.to[0]][a.to[1]];
    const tb = b[bmv.to[0]][bmv.to[1]];
    return (tb ? VAL[tb.type] : 0) - (ta ? VAL[ta.type] : 0);
  });
  const maximizing = color === 'w';
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
  const over = isGameOver(b);
  if (over.over) {
    if (over.result.includes('chiếu hết')) return maximizing ? -100000 : 100000;
    return 0;
  }
  if (depth === 0) return evaluate(b);
  const color: Color = maximizing ? 'w' : 'b';
  const moves = allLegalMoves(b, color);
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
