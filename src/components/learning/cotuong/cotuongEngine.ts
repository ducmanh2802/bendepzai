/**
 * Cờ tướng (Xiangqi) rules + bot.
 *
 * Board coordinates: row 0 = black home rank (top), row 9 = red home rank.
 * Red moves toward row 0, black toward row 9.
 *
 * The bot is a small negamax with alpha-beta. Two things matter for it to be
 * usable in a children's app:
 *  - evaluation must be cheap (no move generation inside), and
 *  - attack detection must not scan the whole board for every candidate move.
 * Both are handled below; `getBestMove` also carries a node budget so the UI
 * thread can never be blocked for long.
 */

export type PieceType = 'k' | 'a' | 'e' | 'h' | 'r' | 'c' | 'p';
export type Color = 'red' | 'black';
export interface Piece {
  type: PieceType;
  color: Color;
  /** Stable identity used by the 3-D board to animate a piece across squares. */
  id?: number;
}
export type Board = (Piece | null)[][];
export interface Move {
  from: [number, number];
  to: [number, number];
}

export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;
const ROWS = BOARD_ROWS;
const COLS = BOARD_COLS;

export const initialBoard = (): Board => {
  const b: Board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const backB: PieceType[] = ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r'];
  let id = 0;
  for (let c = 0; c < COLS; c++) {
    b[0][c] = { type: backB[c], color: 'black', id: ++id };
    b[9][c] = { type: backB[c], color: 'red', id: ++id };
  }
  b[2][1] = { type: 'c', color: 'black', id: ++id };
  b[2][7] = { type: 'c', color: 'black', id: ++id };
  b[7][1] = { type: 'c', color: 'red', id: ++id };
  b[7][7] = { type: 'c', color: 'red', id: ++id };
  for (let c = 0; c < COLS; c += 2) {
    b[3][c] = { type: 'p', color: 'black', id: ++id };
    b[6][c] = { type: 'p', color: 'red', id: ++id };
  }
  return b;
};

export const cloneBoard = (b: Board): Board =>
  b.map((row) => row.map((p) => (p ? { ...p } : null)));

export const inBounds = (r: number, c: number): boolean =>
  r >= 0 && r < ROWS && c >= 0 && c < COLS;

const at = (b: Board, r: number, c: number): Piece | null =>
  inBounds(r, c) ? b[r][c] : null;

const opp = (color: Color): Color => (color === 'red' ? 'black' : 'red');

function inPalace(color: Color, r: number, c: number): boolean {
  if (c < 3 || c > 5) return false;
  if (color === 'red') return r >= 7 && r <= 9;
  return r >= 0 && r <= 2;
}

function sameSide(color: Color, r: number): boolean {
  // elephants may never cross the river
  if (color === 'red') return r >= 5;
  return r <= 4;
}

const ORTHO: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIAG: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
const HORSE: ReadonlyArray<readonly [number, number]> = [
  [-2, -1],
  [-2, 1],
  [2, -1],
  [2, 1],
  [-1, -2],
  [1, -2],
  [-1, 2],
  [1, 2],
];

export function pseudoMoves(b: Board, from: [number, number]): Move[] {
  const [r, c] = from;
  const p = b[r][c];
  if (!p) return [];
  const moves: Move[] = [];
  const enemy = opp(p.color);
  const add = (rr: number, cc: number) => {
    if (!inBounds(rr, cc)) return;
    const t = b[rr][cc];
    if (!t || t.color === enemy) moves.push({ from, to: [rr, cc] });
  };
  const slide = (dr: number, dc: number) => {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const t = b[nr][nc];
      if (!t) moves.push({ from, to: [nr, nc] });
      else {
        if (t.color === enemy) moves.push({ from, to: [nr, nc] });
        break;
      }
      nr += dr;
      nc += dc;
    }
  };
  switch (p.type) {
    case 'k':
      for (const [dr, dc] of ORTHO) {
        const nr = r + dr, nc = c + dc;
        if (inPalace(p.color, nr, nc)) add(nr, nc);
      }
      break;
    case 'a':
      for (const [dr, dc] of DIAG) {
        const nr = r + dr, nc = c + dc;
        if (inPalace(p.color, nr, nc)) add(nr, nc);
      }
      break;
    case 'e':
      for (const [dr, dc] of DIAG) {
        const nr = r + dr * 2, nc = c + dc * 2;
        if (inBounds(nr, nc) && sameSide(p.color, nr) && !b[r + dr][c + dc]) add(nr, nc);
      }
      break;
    case 'h':
      for (const [dr, dc] of HORSE) {
        const legR = r + (Math.abs(dr) === 2 ? dr / 2 : 0);
        const legC = c + (Math.abs(dc) === 2 ? dc / 2 : 0);
        if (inBounds(r + dr, c + dc) && !b[legR][legC]) add(r + dr, c + dc);
      }
      break;
    case 'r':
      for (const [dr, dc] of ORTHO) slide(dr, dc);
      break;
    case 'c': {
      for (const [dr, dc] of ORTHO) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc) && !b[nr][nc]) {
          moves.push({ from, to: [nr, nc] });
          nr += dr;
          nc += dc;
        }
        // the first piece is the screen; the next one can be captured
        if (inBounds(nr, nc)) {
          let sr = nr + dr, sc = nc + dc;
          while (inBounds(sr, sc)) {
            const t = b[sr][sc];
            if (t) {
              if (t.color === enemy) moves.push({ from, to: [sr, sc] });
              break;
            }
            sr += dr;
            sc += dc;
          }
        }
      }
      break;
    }
    case 'p': {
      const dir = p.color === 'red' ? -1 : 1;
      const crossed = p.color === 'red' ? r <= 4 : r >= 5;
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
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = b[r][c];
      if (p && p.type === 'k' && p.color === color) return [r, c];
    }
  }
  return null;
}

export function kingsFace(b: Board): boolean {
  const rk = findKing(b, 'red');
  const bk = findKing(b, 'black');
  if (!rk || !bk || rk[1] !== bk[1]) return false;
  const col = rk[1];
  const from = Math.min(rk[0], bk[0]) + 1;
  const to = Math.max(rk[0], bk[0]);
  for (let r = from; r < to; r++) if (b[r][col]) return false;
  return true;
}

/**
 * Does `by` attack the square (r, c)? Reverse attack detection: instead of
 * generating every enemy move (O(90 × moves)) we look outward from the target
 * square — a handful of ray walks and jumps.
 */
export function isAttacked(b: Board, r: number, c: number, by: Color): boolean {
  // Pawns: red advances toward row 0, black toward row 9.
  const pawnFrom = by === 'red' ? at(b, r + 1, c) : at(b, r - 1, c);
  if (pawnFrom && pawnFrom.color === by && pawnFrom.type === 'p') return true;
  const pawnCrossed = by === 'red' ? r <= 4 : r >= 5;
  if (pawnCrossed) {
    for (const dc of [-1, 1]) {
      const p = at(b, r, c + dc);
      if (p && p.color === by && p.type === 'p') return true;
    }
  }

  // King / advisor, adjacent.
  for (const [dr, dc] of ORTHO) {
    const p = at(b, r + dr, c + dc);
    if (p && p.color === by && p.type === 'k') return true;
  }
  for (const [dr, dc] of DIAG) {
    const p = at(b, r + dr, c + dc);
    if (p && p.color === by && p.type === 'a') return true;
  }

  // Elephant, two diagonals away with a clear eye.
  for (const [dr, dc] of DIAG) {
    const p = at(b, r + dr * 2, c + dc * 2);
    if (p && p.color === by && p.type === 'e' && !at(b, r + dr, c + dc)) return true;
  }

  // Horse: attacker at (r + hr, c + hc), its leg square must be empty.
  for (const [hr, hc] of HORSE) {
    const p = at(b, r + hr, c + hc);
    if (!p || p.color !== by || p.type !== 'h') continue;
    const legR = r + hr - (Math.abs(hr) === 2 ? Math.sign(hr) : 0);
    const legC = c + hc - (Math.abs(hc) === 2 ? Math.sign(hc) : 0);
    if (!at(b, legR, legC)) return true;
  }

  // Rook / cannon / adjacent king along the four rays.
  for (const [dr, dc] of ORTHO) {
    let rr = r + dr, cc = c + dc, dist = 1;
    let screen: Piece | null = null;
    while (inBounds(rr, cc)) {
      const p = b[rr][cc];
      if (p) {
        if (!screen) {
          if (p.color === by) {
            if (p.type === 'r') return true;
            if (p.type === 'k' && dist === 1) return true;
          }
          screen = p;
        } else if (p.color === by && p.type === 'c') {
          return true;
        } else {
          break;
        }
      }
      rr += dr;
      cc += dc;
      dist++;
    }
  }
  return false;
}

export function inCheck(b: Board, color: Color): boolean {
  const k = findKing(b, color);
  if (!k) return true;
  if (isAttacked(b, k[0], k[1], opp(color))) return true;
  return kingsFace(b);
}

/** Pure helper: legal moves for the piece on `from` (never mutates `b`). */
export function legalMoves(b: Board, from: [number, number]): Move[] {
  const p = b[from[0]][from[1]];
  if (!p) return [];
  const work = cloneBoard(b);
  const piece = work[from[0]][from[1]]!;
  const out: Move[] = [];
  for (const m of pseudoMoves(work, from)) {
    const [fr, fc] = m.from;
    const [tr, tc] = m.to;
    const cap = work[tr][tc];
    work[tr][tc] = work[fr][fc];
    work[fr][fc] = null;
    if (!inCheck(work, p.color)) out.push(m);
    work[fr][fc] = piece;
    work[tr][tc] = cap;
  }
  return out;
}

function collectLegal(b: Board, color: Color, out: Move[]): void {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = b[r][c];
      if (!p || p.color !== color) continue;
      for (const m of pseudoMoves(b, [r, c])) {
        const [fr, fc] = m.from;
        const [tr, tc] = m.to;
        const cap = b[tr][tc];
        b[tr][tc] = b[fr][fc];
        b[fr][fc] = null;
        if (!inCheck(b, color)) out.push(m);
        b[fr][fc] = b[tr][tc];
        b[tr][tc] = cap;
      }
    }
  }
}

export function allLegalMoves(b: Board, color: Color): Move[] {
  const work = cloneBoard(b);
  const out: Move[] = [];
  collectLegal(work, color, out);
  return out;
}

export function applyMove(b: Board, m: Move): Board {
  const nb = cloneBoard(b);
  const p = nb[m.from[0]][m.from[1]];
  if (!p) return nb;
  nb[m.to[0]][m.to[1]] = p;
  nb[m.from[0]][m.from[1]] = null;
  return nb;
}

/** Result of a finished game. In xiangqi, no legal move = loss even without check. */
export function isGameOver(
  b: Board,
  sideToMove?: Color
): { over: boolean; result: string; winner?: Color } {
  const sides: Color[] = sideToMove ? [sideToMove] : ['red', 'black'];
  for (const color of sides) {
    if (allLegalMoves(b, color).length === 0) {
      const winner: Color = opp(color);
      return {
        over: true,
        winner,
        result: winner === 'red' ? 'Đỏ thắng — chiếu hết Tướng Đen!' : 'Đen thắng — chiếu hết Tướng Đỏ!',
      };
    }
  }
  return { over: false, result: '' };
}

// ---------------------------------------------------------------- evaluation

const VAL: Record<PieceType, number> = { k: 30000, r: 900, c: 450, h: 400, e: 200, a: 220, p: 100 };

/** Static evaluation, positive = good for red. Deliberately allocation-free. */
export function evaluate(b: Board): number {
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = b[r][c];
      if (!p) continue;
      const sign = p.color === 'red' ? 1 : -1;
      let v = VAL[p.type];
      if (p.type === 'p') {
        const crossed = p.color === 'red' ? r <= 4 : r >= 5;
        v += crossed ? 40 + (p.color === 'red' ? 9 - r : r) * 6 : (p.color === 'red' ? 9 - r : r) * 4;
      } else if (p.type === 'h' || p.type === 'r') {
        v += (4 - Math.abs(c - 4)) * 4;
        v += (p.color === 'red' ? 9 - r : r) * 2;
      } else if (p.type === 'c') {
        v += (4 - Math.abs(c - 4)) * 2;
      }
      score += sign * v;
    }
  }
  return score;
}

const MATE = 100000;

interface SearchState {
  nodes: number;
  maxNodes: number;
  aborted: boolean;
}

function makeMove(b: Board, m: Move): Piece | null {
  const [fr, fc] = m.from;
  const [tr, tc] = m.to;
  const moving = b[fr][fc];
  const captured = b[tr][tc];
  b[tr][tc] = moving;
  b[fr][fc] = null;
  return captured;
}

function unmakeMove(b: Board, m: Move, captured: Piece | null): void {
  const [fr, fc] = m.from;
  const [tr, tc] = m.to;
  b[fr][fc] = b[tr][tc];
  b[tr][tc] = captured;
}

function orderMoves(b: Board, moves: Move[]): Move[] {
  return moves.sort((a, c) => scoreMove(b, c) - scoreMove(b, a));
}

function scoreMove(b: Board, m: Move): number {
  const target = b[m.to[0]][m.to[1]];
  if (!target) return 0;
  const mover = b[m.from[0]][m.from[1]];
  // MVV-LVA: prefer valuable victims taken by cheap attackers.
  return VAL[target.type] * 10 - (mover ? VAL[mover.type] : 0);
}

function evaluateFor(b: Board, color: Color): number {
  const red = evaluate(b);
  return color === 'red' ? red : -red;
}

function negamax(
  b: Board,
  depth: number,
  alpha: number,
  beta: number,
  color: Color,
  st: SearchState,
  ply: number
): number {
  st.nodes++;
  if (st.nodes > st.maxNodes) {
    st.aborted = true;
    return evaluateFor(b, color);
  }
  if (depth <= 0) return evaluateFor(b, color);

  const moves: Move[] = [];
  collectLegal(b, color, moves);
  if (moves.length === 0) return -MATE + ply; // mated (or stalemated) — always a loss

  orderMoves(b, moves);
  let best = -Infinity;
  for (const m of moves) {
    const cap = makeMove(b, m);
    const score = -negamax(b, depth - 1, -beta, -alpha, opp(color), st, ply + 1);
    unmakeMove(b, m, cap);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
    if (st.aborted) break;
  }
  return best;
}

export interface BotOptions {
  /** Hard cap on searched nodes — keeps the UI thread responsive. */
  maxNodes?: number;
  /**
   * Centipawn window: the bot picks randomly among root moves within this
   * distance of the best one. Used by the "Dễ" level so the child can win.
   */
  softness?: number;
  random?: () => number;
}

/** Best move for `color`, or null when the side has no legal move. */
export function getBestMove(
  b: Board,
  color: Color,
  depth: number,
  opts: BotOptions = {}
): Move | null {
  const rootMoves = allLegalMoves(b, color);
  if (rootMoves.length === 0) return null;
  if (depth <= 0) return rootMoves[0];

  const work = cloneBoard(b);
  const st: SearchState = {
    nodes: 0,
    maxNodes: opts.maxNodes ?? (depth >= 4 ? 260000 : 80000),
    aborted: false,
  };
  orderMoves(work, rootMoves);

  const scored: { move: Move; score: number }[] = [];
  let alpha = -Infinity;
  for (const m of rootMoves) {
    const cap = makeMove(work, m);
    const score = -negamax(work, depth - 1, -Infinity, -alpha, opp(color), st, 1);
    unmakeMove(work, m, cap);
    scored.push({ move: m, score });
    if (score > alpha) alpha = score;
    if (st.aborted) break;
  }

  scored.sort((a, c) => c.score - a.score);
  const softness = opts.softness ?? 0;
  if (softness > 0 && scored.length > 1) {
    const top = scored[0].score;
    const pool = scored.filter((s) => s.score >= top - softness);
    const rng = opts.random ?? Math.random;
    const pick = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
    return pick.move;
  }
  return scored[0].move;
}
