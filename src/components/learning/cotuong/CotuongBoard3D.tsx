import React from 'react';
import * as E from './cotuongEngine';

/**
 * CSS-3D cờ tướng board. No WebGL: a single perspective plane with layered
 * wooden pieces keeps the bundle light and still gives real depth (pieces lift
 * on selection, shadows sit on the board, the plate can be tilted or flattened).
 *
 * Geometry: pieces sit on intersections like a real xiangqi board. The SVG
 * viewBox is in "cell" units with a margin M so border pieces are not clipped.
 */
const M = 0.95;
const VW = 8 + M * 2;
const VH = 9 + M * 2;

const xPct = (c: number) => ((M + c) / VW) * 100;
const yPct = (r: number) => ((M + r) / VH) * 100;

const CELL_W_PCT = (1 / VW) * 100;
const PIECE_W_PCT = CELL_W_PCT * 0.92;
const DOT_PCT = CELL_W_PCT * 0.26;
const RING_PCT = CELL_W_PCT * 0.98;

export const PIECE_CHAR: Record<string, string> = {
  'red-k': '帥',
  'red-a': '仕',
  'red-e': '相',
  'red-h': '馬',
  'red-r': '車',
  'red-c': '炮',
  'red-p': '兵',
  'black-k': '將',
  'black-a': '士',
  'black-e': '象',
  'black-h': '馬',
  'black-r': '車',
  'black-c': '砲',
  'black-p': '卒',
};

const PIECE_NAME: Record<E.PieceType, string> = {
  k: 'Tướng',
  a: 'Sĩ',
  e: 'Tượng',
  h: 'Mã',
  r: 'Xe',
  c: 'Pháo',
  p: 'Tốt',
};

export interface CaptureFx {
  r: number;
  c: number;
  key: number;
}

interface Props {
  board: E.Board;
  selected: [number, number] | null;
  legal: E.Move[];
  lastMove: E.Move | null;
  checkAt: [number, number] | null;
  captureFx: CaptureFx | null;
  flat: boolean;
  disabled: boolean;
  gameKey: number;
  onSquareClick: (r: number, c: number) => void;
}

function gridMarks(r: number, c: number): string {
  const o = 0.15;
  const l = 0.12;
  let d = '';
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const x = c + sx * o;
    const y = r + sy * o;
    d += `M${x},${y - sy * l} L${x},${y} L${x - sx * l},${y} `;
  }
  return d;
}

const MARKS: Array<[number, number]> = [
  [2, 1], [2, 7], [7, 1], [7, 7],
  [3, 0], [3, 2], [3, 4], [3, 6], [3, 8],
  [6, 0], [6, 2], [6, 4], [6, 6], [6, 8],
];

const BoardSvg: React.FC = () => {
  const lines: React.ReactNode[] = [];
  for (let r = 0; r <= 9; r++) {
    lines.push(
      <line
        key={`h${r}`}
        x1={0}
        y1={r}
        x2={8}
        y2={r}
        className={r === 0 || r === 9 ? 'ct-border' : undefined}
      />
    );
  }
  for (let c = 0; c <= 8; c++) {
    if (c === 0 || c === 8) {
      lines.push(<line key={`v${c}`} x1={c} y1={0} x2={c} y2={9} className="ct-border" />);
    } else {
      lines.push(<line key={`vt${c}`} x1={c} y1={0} x2={c} y2={4} />);
      lines.push(<line key={`vb${c}`} x1={c} y1={5} x2={c} y2={9} />);
    }
  }
  return (
    <svg className="ct-grid" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true" focusable="false">
      {lines}
      <path d="M3,0 L5,2 M5,0 L3,2" />
      <path d="M3,7 L5,9 M5,7 L3,9" />
      {MARKS.map(([r, c]) => (
        <path key={`m${r}-${c}`} d={gridMarks(r, c)} className="ct-mark" />
      ))}
    </svg>
  );
};

export const CotuongBoard3D: React.FC<Props> = ({
  board,
  selected,
  legal,
  lastMove,
  checkAt,
  captureFx,
  flat,
  disabled,
  gameKey,
  onSquareClick,
}) => {
  const pieces: Array<{ piece: E.Piece; r: number; c: number; key: string }> = [];
  for (let r = 0; r < E.BOARD_ROWS; r++) {
    for (let c = 0; c < E.BOARD_COLS; c++) {
      const p = board[r][c];
      if (p) pieces.push({ piece: p, r, c, key: `${gameKey}-${p.id ?? `p${r}-${c}`}` });
    }
  }
  // Painter order: lower rows are nearer the viewer once the plate is tilted.
  pieces.sort((a, b) => a.r - b.r);

  const isTarget = (r: number, c: number) => legal.some((m) => m.to[0] === r && m.to[1] === c);
  const isSelected = (r: number, c: number) => !!selected && selected[0] === r && selected[1] === c;
  const isLast = (r: number, c: number) =>
    !!lastMove &&
    ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c));

  return (
    <div className={`ct-scene ${flat ? 'is-flat' : ''}`}>
      <div className="ct-plate" style={{ aspectRatio: `${VW} / ${VH}` }}>
        <div className="ct-board" aria-hidden="true" />
        <div className="ct-surface">
            <BoardSvg />
            <span
              className="ct-river-label"
              style={{ left: `${xPct(2)}%`, top: `${yPct(4.5)}%` }}
              aria-hidden="true"
            >
              楚 河
            </span>
            <span
              className="ct-river-label"
              style={{ left: `${xPct(6)}%`, top: `${yPct(4.5)}%` }}
              aria-hidden="true"
            >
              漢 界
            </span>

            {lastMove && (
              <>
                <span
                  className="ct-last ct-last-from"
                  style={{ left: `${xPct(lastMove.from[1])}%`, top: `${yPct(lastMove.from[0])}%` }}
                />
                <span
                  className="ct-last ct-last-to"
                  style={{ left: `${xPct(lastMove.to[1])}%`, top: `${yPct(lastMove.to[0])}%` }}
                />
              </>
            )}

            {legal.map((m) => {
              const occupied = !!board[m.to[0]][m.to[1]];
              return (
                <span
                  key={`t${m.to[0]}-${m.to[1]}`}
                  className={occupied ? 'ct-target-ring' : 'ct-dot'}
                  style={{
                    left: `${xPct(m.to[1])}%`,
                    top: `${yPct(m.to[0])}%`,
                    width: `${occupied ? RING_PCT : DOT_PCT}%`,
                  }}
                />
              );
            })}

            {selected && (
              <span
                className="ct-sel-ring"
                style={{ left: `${xPct(selected[1])}%`, top: `${yPct(selected[0])}%` }}
              />
            )}

            {pieces.map(({ piece, r, c, key }) => (
              <div
                key={key}
                className={`ct-piece ${isSelected(r, c) ? 'is-selected' : ''}`}
                data-color={piece.color}
                style={{
                  left: `${xPct(c)}%`,
                  top: `${yPct(r)}%`,
                  width: `${PIECE_W_PCT}%`,
                }}
                aria-hidden="true"
              >
                <span className="ct-piece__shadow" />
                <span className="ct-piece__base" />
                <span className="ct-piece__face">
                  <span className="ct-piece__char">
                    {PIECE_CHAR[`${piece.color}-${piece.type}`]}
                  </span>
                </span>
              </div>
            ))}

            {checkAt && (
              <span
                className="ct-check"
                style={{ left: `${xPct(checkAt[1])}%`, top: `${yPct(checkAt[0])}%` }}
              />
            )}

            {captureFx && (
              <span
                key={`fx${captureFx.key}`}
                className="ct-boom"
                style={{ left: `${xPct(captureFx.c)}%`, top: `${yPct(captureFx.r)}%` }}
                aria-hidden="true"
              >
                💥
              </span>
            )}

            <div
              className="ct-cells"
              style={{
                top: `${(M / VH) * 100}%`,
                bottom: `${(M / VH) * 100}%`,
                left: `${(M / VW) * 100}%`,
                right: `${(M / VW) * 100}%`,
              }}
            >
              {Array.from({ length: E.BOARD_ROWS }, (_, r) =>
                Array.from({ length: E.BOARD_COLS }, (_, c) => {
                  const p = board[r][c];
                  const target = isTarget(r, c);
                  const label = p
                    ? `${PIECE_NAME[p.type]} ${p.color === 'red' ? 'đỏ' : 'đen'}, hàng ${r + 1}, cột ${c + 1}`
                    : `Ô trống hàng ${r + 1}, cột ${c + 1}`;
                  return (
                    <button
                      key={`c${r}-${c}`}
                      type="button"
                      className={`ct-cell ${isLast(r, c) ? 'is-last' : ''} ${target ? 'is-target' : ''}`}
                      onClick={() => onSquareClick(r, c)}
                      disabled={disabled}
                      aria-label={label}
                      data-testid={`ct-cell-${r}-${c}`}
                    />
                  );
                })
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default CotuongBoard3D;
