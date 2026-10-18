import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { sound } from '../../../services/sound';
import * as E from './chessEngine';

const PIECE_UNICODE: Record<string, string> = {
  'w-p': '♟', 'w-n': '♞', 'w-b': '♝', 'w-r': '♜', 'w-q': '♛', 'w-k': '♚',
  'b-p': '♟', 'b-n': '♞', 'b-b': '♝', 'b-r': '♜', 'b-q': '♛', 'b-k': '♚',
};

const DEPTH: Record<string, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };

interface MoveRec { from: [number, number]; to: [number, number]; piece: string; capture: boolean; }

export const ChessGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [board, setBoard] = useState<E.Board>(() => E.initialBoard());
  const [turn, setTurn] = useState<E.Color>('w');
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [legal, setLegal] = useState<E.Move[]>([]);
  const [difficulty, setDifficulty] = useState('easy');
  const [status, setStatus] = useState('');
  const [thinking, setThinking] = useState(false);
  const [moves, setMoves] = useState<MoveRec[]>([]);
  const [lastMove, setLastMove] = useState<E.Move | null>(null);
  const [capturedW, setCapturedW] = useState<string[]>([]);
  const [capturedB, setCapturedB] = useState<string[]>([]);
  const startedAt = useRef(Date.now());

  const reset = () => {
    setBoard(E.initialBoard());
    setTurn('w');
    setSelected(null);
    setLegal([]);
    setStatus('');
    setMoves([]);
    setLastMove(null);
    setCapturedW([]);
    setCapturedB([]);
    startedAt.current = Date.now();
  };

  useEffect(() => {
    const over = E.isGameOver(board);
    if (over.over) setStatus(over.result);
  }, [board]);

  const doMove = (m: E.Move) => {
    const piece = board[m.from[0]][m.from[1]]!;
    const capture = !!board[m.to[0]][m.to[1]];
    const capPiece = board[m.to[0]][m.to[1]];
    if (capture && capPiece) {
      const sym = PIECE_UNICODE[`${capPiece.color}-${capPiece.type}`];
      if (capPiece.color === 'w') setCapturedW((a) => [...a, sym]);
      else setCapturedB((a) => [...a, sym]);
    }
    const nb = E.applyMove(board, m);
    setBoard(nb);
    setSelected(null);
    setLegal([]);
    setLastMove(m);
    setMoves((arr) => [...arr, { from: m.from, to: m.to, piece: `${piece.color}-${piece.type}`, capture }]);
    setTurn(turn === 'w' ? 'b' : 'w');
  };

  useEffect(() => {
    if (turn !== 'b' || status) return;
    setThinking(true);
    const t = setTimeout(() => {
      const mv = E.getBestMove(board, 'b', DEPTH[difficulty]);
      if (mv) doMove(mv);
      setThinking(false);
    }, 300);
    return () => clearTimeout(t);
  }, [turn, board, status, difficulty]);

  const onSquareClick = (r: number, c: number) => {
    if (status || thinking || turn !== 'w') return;
    if (selected) {
      const mv = legal.find((m) => m.to[0] === r && m.to[1] === c);
      if (mv) { sound.playClick(); doMove(mv); return; }
    }
    const p = board[r][c];
    if (p && p.color === 'w') {
      setSelected([r, c]);
      setLegal(E.legalMoves(board, [r, c]));
      sound.playClick();
    } else {
      setSelected(null);
      setLegal([]);
    }
  };

  const isLegalTarget = (r: number, c: number) => legal.some((m) => m.to[0] === r && m.to[1] === c);

  const analysis = () => {
    const secs = Math.round((Date.now() - startedAt.current) / 1000);
    const whiteMat = capturedB.length; // captured by white? capturedB are black pieces captured by white
    const blackMat = capturedW.length;
    const playerLost = status.includes('Đen thắng');
    const tips: string[] = [];
    if (playerLost) {
      if (capturedW.length > capturedB.length) tips.push('Bạn đã mất nhiều quân hơn máy. Hãy bảo vệ quân giá trị (Hậu, Xe) và tránh để bị bắt.');
      if (moves.length < 12) tips.push('Ván kết thúc khá nhanh. Hãy phát triển quân (Mã, Tượng) và kiểm soát trung tâm sớm.');
      tips.push('Kiểm tra an toàn Vua trước mỗi nước: nếu Vua bị chiếu, ưu tiên giải nguy.');
      tips.push('Hãy nghĩ trước 2-3 nước: "Nếu tôi đi đây, máy sẽ đi đâu?".');
      tips.push('Luyện tập chiến thuật: bắt quân treo, chiếu hết trong 1-2 nước.');
    } else if (status.includes('Trắng thắng')) {
      tips.push('Tốt! Bạn đã tận dụng tốt cơ hội. Hãy tiếp tục luyện nước chiếu hết.');
    } else {
      tips.push('Ván hòa. Hãy cố gắng tạo ưu thế quân hoặc chiếu hết ở ván sau.');
    }
    return { secs, whiteMat, blackMat, tips };
  };

  const a = status ? analysis() : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { sound.playClick(); onBack(); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h1 className="text-2xl font-black font-display text-slate-900">♟ Chơi với máy</h1>
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

      <div className="flex gap-4 items-start flex-col md:flex-row">
        <div className="flex-1">
          {status && <div className="mb-2 p-3 rounded-xl bg-amber-50 border-2 border-amber-300 font-bold text-center">{status}</div>}
          {thinking && <div className="mb-2 text-center text-slate-500 font-bold">Máy đang nghĩ…</div>}

          <div className="mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700" style={{ width: 'min(90vw, 440px)' }}>
            <div className="grid grid-cols-8">
              {board.map((row, r) =>
                row.map((p, c) => {
                  const dark = (r + c) % 2 === 1;
                  const sel = selected && selected[0] === r && selected[1] === c;
                  const target = isLegalTarget(r, c);
                  const isLast = lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c));
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => onSquareClick(r, c)}
                      className={`aspect-square flex items-center justify-center text-2xl sm:text-3xl transition-all ${dark ? 'bg-[#769656]' : 'bg-[#eeeed2]'} ${sel ? 'ring-4 ring-yellow-400 z-10' : ''} ${target ? 'ring-4 ring-[#baca44]' : ''} ${isLast ? 'bg-[#f6f669]' : ''}`}
                    >
                      {p ? <span className={p.color === 'w' ? 'text-white drop-shadow-md' : 'text-black'}>{PIECE_UNICODE[`${p.color}-${p.type}`]}</span> : (target ? <span className="w-3 h-3 rounded-full bg-[#baca44]/60" /> : null)}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-2 text-center text-sm text-slate-500 font-bold">
            Bạn chơi quân trắng. {turn === 'w' ? 'Lượt của bạn.' : 'Lượt của máy.'}
          </div>
        </div>

        <div className="w-full md:w-64 space-y-3">
          <div className="p-3 rounded-2xl bg-white border-2 border-slate-200">
            <div className="font-black text-slate-700 mb-1">Quân bị bắt</div>
            <div className="text-sm text-slate-500">Bạn bắt: {capturedB.join(' ') || '—'}</div>
            <div className="text-sm text-slate-500">Máy bắt: {capturedW.join(' ') || '—'}</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border-2 border-slate-200 max-h-64 overflow-y-auto">
            <div className="font-black text-slate-700 mb-1">Lịch sử nước đi</div>
            <ol className="text-xs text-slate-600 space-y-0.5">
              {moves.map((m, i) => (
                <li key={i}>{i + 1}. {m.piece} {String.fromCharCode(97 + m.from[1])}{8 - m.from[0]} → {String.fromCharCode(97 + m.to[1])}{8 - m.to[0]}{m.capture ? ' (bắt)' : ''}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {a && (
        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
          <h3 className="font-black text-lg">Phân tích sau trận</h3>
          <div className="text-sm text-slate-600">Thời gian: {a.secs}s · Số nước: {moves.length} · Quân bạn bắt: {a.whiteMat} · Máy bắt: {a.blackMat}</div>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            {a.tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
          <button onClick={reset} className="mt-2 px-4 py-2 bg-amber-500 text-white font-bold rounded-xl">Chơi lại</button>
        </div>
      )}
    </div>
  );
};

export default ChessGame;
