import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Box, Grid } from 'lucide-react';
import { sound } from '../../../services/sound';
import * as E from './chessEngine';
import { Chess3DCanvas } from './chess3d/Chess3DCanvas';

const PIECE_UNICODE: Record<string, string> = {
  'w-p': '♟', 'w-n': '♞', 'w-b': '♝', 'w-r': '♜', 'w-q': '♛', 'w-k': '♚',
  'b-p': '♟', 'b-n': '♞', 'b-b': '♝', 'b-r': '♜', 'b-q': '♛', 'b-k': '♚',
};

const DEPTH: Record<string, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };

interface MoveRec {
  from: [number, number];
  to: [number, number];
  piece: string;
  capture: boolean;
}

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
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const startedAt = useRef(Date.now());

  const reset = () => {
    sound.playClick();
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
    if (over.over) {
      setStatus(over.result);
      if (over.result.includes('Trắng thắng')) {
        sound.playLevelUp?.();
      } else {
        sound.playWrong?.();
      }
    }
  }, [board]);

  const doMove = (m: E.Move) => {
    const piece = board[m.from[0]][m.from[1]]!;
    const capture = !!board[m.to[0]][m.to[1]];
    const capPiece = board[m.to[0]][m.to[1]];

    if (capture && capPiece) {
      const sym = PIECE_UNICODE[`${capPiece.color}-${capPiece.type}`];
      if (capPiece.color === 'w') setCapturedW((a) => [...a, sym]);
      else setCapturedB((a) => [...a, sym]);
      sound.playStar?.();
    } else {
      sound.playPop?.();
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
    }, 380);
    return () => clearTimeout(t);
  }, [turn, board, status, difficulty]);

  const onSquareClick = (r: number, c: number) => {
    if (status || thinking || turn !== 'w') return;
    if (selected) {
      const mv = legal.find((m) => m.to[0] === r && m.to[1] === c);
      if (mv) {
        doMove(mv);
        return;
      }
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
    const whiteMat = capturedB.length;
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
      tips.push('Tuyệt vời! Bạn đã tính toán rất chuẩn xác và giành chiến thắng vẻ vang.');
    } else {
      tips.push('Ván hòa cân não. Cả hai bên đều phòng thủ rất chặt chẽ.');
    }
    return { secs, whiteMat, blackMat, tips };
  };

  const a = status ? analysis() : null;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 text-slate-800">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="px-3.5 py-2 bg-white hover:bg-slate-100 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="flex items-center gap-2">
          {/* 3D / 2D View Switch */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1 shadow-xs">
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('3d');
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>3D Sống Động</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('2d');
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>2D Cổ Điển</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Difficulty & New Game */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs sm:text-sm font-black text-slate-600">Độ khó máy:</span>
          {(['easy', 'medium', 'hard', 'expert'] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                sound.playClick();
                setDifficulty(d);
                reset();
              }}
              className={`px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                difficulty === d
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d === 'easy' ? 'Dễ' : d === 'medium' ? 'Vừa' : d === 'hard' ? 'Khó' : 'Kiện tướng'}
            </button>
          ))}
        </div>

        <button
          onClick={reset}
          className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-amber-600" />
          <span>Ván mới</span>
        </button>
      </div>

      {/* Status banner */}
      {status && (
        <div className="p-3.5 rounded-2xl bg-amber-500 text-white font-black text-center shadow-md animate-bounce-subtle text-base">
          {status}
        </div>
      )}

      {/* Main Board Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Board (3D or 2D) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {viewMode === '3d' ? (
            <Chess3DCanvas
              board={board}
              selected={selected}
              legalMoves={legal}
              lastMove={lastMove}
              turn={turn}
              status={status}
              isThinking={thinking}
              onSquareClick={onSquareClick}
            />
          ) : (
            /* 2D Fallback Board */
            <div
              className="w-full max-w-[440px] rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400 bg-amber-950 p-2"
            >
              <div className="grid grid-cols-8 rounded-2xl overflow-hidden border-2 border-amber-900">
                {board.map((row, r) =>
                  row.map((p, c) => {
                    const dark = (r + c) % 2 === 1;
                    const sel = selected && selected[0] === r && selected[1] === c;
                    const target = isLegalTarget(r, c);
                    const isLast =
                      lastMove &&
                      ((lastMove.from[0] === r && lastMove.from[1] === c) ||
                        (lastMove.to[0] === r && lastMove.to[1] === c));
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => onSquareClick(r, c)}
                        className={`aspect-square flex items-center justify-center text-3xl sm:text-4xl transition-all cursor-pointer relative ${
                          dark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]'
                        } ${sel ? 'ring-4 ring-yellow-400 z-10' : ''} ${
                          isLast ? 'bg-[#f6f669]' : ''
                        }`}
                      >
                        {p ? (
                          <span
                            className={
                              p.color === 'w'
                                ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] font-bold'
                                : 'text-slate-950 font-bold'
                            }
                          >
                            {PIECE_UNICODE[`${p.color}-${p.type}`]}
                          </span>
                        ) : target ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600/70" />
                        ) : null}
                        {target && p && (
                          <span className="absolute inset-0 border-4 border-rose-500/80 rounded-sm" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Turn indicator */}
          <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs text-xs sm:text-sm font-black">
            <span
              className={`w-3 h-3 rounded-full ${
                turn === 'w' ? 'bg-amber-400 ring-2 ring-amber-200' : 'bg-slate-800'
              }`}
            />
            <span>
              {turn === 'w' ? 'Lượt của bạn (Quân Trắng)' : 'Lượt của máy (Quân Đen)'}
            </span>
          </div>
        </div>

        {/* Right Column: Captured pieces & Moves sidebar */}
        <div className="lg:col-span-4 w-full flex flex-col gap-3">
          {/* Captured Pieces Panel */}
          <div className="p-3.5 rounded-3xl bg-white border-2 border-slate-200 shadow-xs flex flex-col gap-2">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
              <span>🏆</span> Quân cờ đã bắt
            </h3>
            <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <span className="text-[11px] font-bold text-slate-500 block">Bạn bắt được:</span>
              <div className="text-xl tracking-wider text-slate-900 min-h-[28px] flex items-center flex-wrap">
                {capturedB.length > 0 ? capturedB.join(' ') : <span className="text-xs text-slate-400">Chưa bắt quân nào</span>}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">Máy bắt được:</span>
              <div className="text-xl tracking-wider text-amber-800 min-h-[28px] flex items-center flex-wrap">
                {capturedW.length > 0 ? capturedW.join(' ') : <span className="text-xs text-slate-400">Chưa bắt quân nào</span>}
              </div>
            </div>
          </div>

          {/* Move Log Panel */}
          <div className="p-3.5 rounded-3xl bg-white border-2 border-slate-200 shadow-xs flex flex-col gap-2">
            <h3 className="font-black text-sm text-slate-800 flex items-center justify-between">
              <span>📜 Lịch sử nước đi</span>
              <span className="text-xs font-mono font-bold text-slate-400">{moves.length} nước</span>
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1 text-xs pr-1 font-mono">
              {moves.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-2 text-center font-sans">
                  Chọn một quân cờ để bắt đầu đi nước đầu tiên!
                </p>
              ) : (
                moves.map((m, i) => (
                  <div
                    key={i}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 flex items-center justify-between border border-slate-100"
                  >
                    <span className="font-bold text-slate-500">#{i + 1}</span>
                    <span className="font-extrabold text-slate-800">
                      {PIECE_UNICODE[m.piece] || '♟'} {String.fromCharCode(97 + m.from[1])}
                      {8 - m.from[0]} → {String.fromCharCode(97 + m.to[1])}
                      {8 - m.to[0]}
                    </span>
                    {m.capture && (
                      <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black">
                        ăn
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post-Game Analysis Modal / Card */}
      {a && (
        <div className="p-5 rounded-3xl bg-white border-3 border-amber-300 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <h3 className="font-black text-lg text-slate-900 font-display">Phân Tích Sau Ván Đấu</h3>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm text-slate-700 font-bold flex items-center justify-between flex-wrap gap-2">
            <span>⏱️ Thời gian: <strong>{a.secs} giây</strong></span>
            <span>♟️ Tổng nước đi: <strong>{moves.length}</strong></span>
            <span>⭐ Bạn bắt: <strong>{a.whiteMat}</strong></span>
            <span>🛡️ Máy bắt: <strong>{a.blackMat}</strong></span>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider">Lời khuyên của Huấn luyện viên:</h4>
            <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1">
              {a.tips.map((tip, idx) => (
                <li key={idx} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={reset}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Chơi lại ván mới ngay →
          </button>
        </div>
      )}
    </div>
  );
};

export default ChessGame;
