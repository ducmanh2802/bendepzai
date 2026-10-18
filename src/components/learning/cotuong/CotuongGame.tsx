import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { sound } from '../../../services/sound';
import * as E from './cotuongEngine';

const PIECE_CHAR: Record<string, string> = {
  'red-k': '帥', 'red-a': '仕', 'red-e': '相', 'red-h': '馬', 'red-r': '車', 'red-c': '炮', 'red-p': '兵',
  'black-k': '將', 'black-a': '士', 'black-e': '象', 'black-h': '馬', 'black-r': '車', 'black-c': '炮', 'black-p': '卒',
};

const DEPTH: Record<string, number> = { easy: 2, medium: 3, hard: 4, expert: 4 };

interface MoveRec { from: [number, number]; to: [number, number]; piece: string; capture: boolean; }

export const CotuongGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [board, setBoard] = useState<E.Board>(() => E.initialBoard());
  const [turn, setTurn] = useState<E.Color>('red');
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [legal, setLegal] = useState<E.Move[]>([]);
  const [difficulty, setDifficulty] = useState('easy');
  const [status, setStatus] = useState('');
  const [thinking, setThinking] = useState(false);
  const [moves, setMoves] = useState<MoveRec[]>([]);
  const [lastMove, setLastMove] = useState<E.Move | null>(null);
  const startedAt = useRef(Date.now());

  const reset = () => {
    setBoard(E.initialBoard());
    setTurn('red');
    setSelected(null);
    setLegal([]);
    setStatus('');
    setMoves([]);
    setLastMove(null);
    startedAt.current = Date.now();
  };

  useEffect(() => {
    const over = E.isGameOver(board, turn);
    if (over.over) setStatus(over.result);
  }, [board, turn]);

  const doMove = (m: E.Move) => {
    const piece = board[m.from[0]][m.from[1]]!;
    const capture = !!board[m.to[0]][m.to[1]];
    const nb = E.applyMove(board, m);
    setBoard(nb);
    setSelected(null);
    setLegal([]);
    setLastMove(m);
    setMoves((arr) => [...arr, { from: m.from, to: m.to, piece: `${piece.color}-${piece.type}`, capture }]);
    setTurn(turn === 'red' ? 'black' : 'red');
  };

  useEffect(() => {
    if (turn !== 'black' || status) return;
    setThinking(true);
    const t = setTimeout(() => {
      const mv = E.getBestMove(board, 'black', DEPTH[difficulty]);
      if (mv) doMove(mv);
      setThinking(false);
    }, 200);
    return () => clearTimeout(t);
  }, [turn, board, status, difficulty]);

  const onSquareClick = (r: number, c: number) => {
    if (status || thinking || turn !== 'red') return;
    if (selected) {
      const mv = legal.find((m) => m.to[0] === r && m.to[1] === c);
      if (mv) { sound.playClick(); doMove(mv); return; }
    }
    const p = board[r][c];
    if (p && p.color === 'red') {
      setSelected([r, c]);
      setLegal(E.legalMoves(board, [r, c]));
      sound.playClick();
    } else {
      setSelected(null);
      setLegal([]);
    }
  };

  const isLegalTarget = (r: number, c: number) => legal.some((m) => m.to[0] === r && m.to[1] === c);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { sound.playClick(); onBack(); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h1 className="text-2xl font-black font-display text-slate-900">♟ Cờ Tướng — Chơi với máy</h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-slate-600">Độ khó:</span>
        {['easy', 'medium', 'hard', 'expert'].map((d) => (
          <button
            key={d}
            onClick={() => { sound.playClick(); setDifficulty(d); reset(); }}
            className={`px-3 py-1 rounded-xl font-bold text-sm ${difficulty === d ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {d === 'easy' ? 'Dễ' : d === 'medium' ? 'Trung bình' : d === 'hard' ? 'Khó' : 'Siêu khó'}
          </button>
        ))}
        <button onClick={() => { sound.playClick(); reset(); }} className="ml-auto px-3 py-1 bg-slate-200 rounded-xl font-bold text-sm flex items-center gap-1">
          <RotateCcw className="w-4 h-4" /> Ván mới
        </button>
      </div>

      {status && <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-300 font-bold text-center">{status}</div>}
      {thinking && <div className="text-center text-slate-500 font-bold">Máy đang nghĩ…</div>}

      <div className="overflow-auto">
        <div className="mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700" style={{ width: 'min(95vw, 520px)' }}>
          <div className="grid grid-cols-9">
            {board.map((row, r) =>
              row.map((p, c) => {
                const sel = selected && selected[0] === r && selected[1] === c;
                const target = isLegalTarget(r, c);
                const isLast = lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c));
                const isRiver = r === 4 || r === 5;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => onSquareClick(r, c)}
                    className={`aspect-square flex items-center justify-center text-xl sm:text-2xl transition-all border border-amber-900/20 ${sel ? 'ring-4 ring-yellow-400 z-10 bg-yellow-100' : ''} ${target ? 'ring-4 ring-emerald-400 bg-emerald-100' : ''} ${isLast ? 'bg-amber-200' : (isRiver ? 'bg-blue-50' : 'bg-amber-50')}`}
                  >
                    {p ? <span className={p.color === 'red' ? 'text-red-600 font-bold' : 'text-slate-900 font-bold'}>{PIECE_CHAR[`${p.color}-${p.type}`]}</span> : (target ? <span className="w-2 h-2 rounded-full bg-emerald-500" /> : null)}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-slate-500 font-bold">
        Bạn chơi quân Đỏ (đi trước). {turn === 'red' ? 'Lượt của bạn.' : 'Lượt của máy.'}
      </div>

      <div className="p-3 rounded-2xl bg-white border-2 border-slate-200 max-h-48 overflow-y-auto">
        <div className="font-black text-slate-700 mb-1">Lịch sử nước đi</div>
        <ol className="text-xs text-slate-600 space-y-0.5">
          {moves.map((m, i) => (
            <li key={i}>{i + 1}. {m.piece} ({m.from[0]},{m.from[1]}) → ({m.to[0]},{m.to[1]}){m.capture ? ' (bắt)' : ''}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default CotuongGame;
