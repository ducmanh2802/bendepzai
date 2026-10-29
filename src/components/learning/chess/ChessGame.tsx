import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Box, Grid, Undo2, Lightbulb, Trophy, Shield } from 'lucide-react';
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

interface HistorySnap {
  board: E.Board;
  turn: E.Color;
  moves: MoveRec[];
  lastMove: E.Move | null;
  capturedW: string[];
  capturedB: string[];
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
  const [hintMove, setHintMove] = useState<E.Move | null>(null);
  const [capturedW, setCapturedW] = useState<string[]>([]);
  const [capturedB, setCapturedB] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [history, setHistory] = useState<HistorySnap[]>([]);
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
    setHintMove(null);
    setCapturedW([]);
    setCapturedB([]);
    setHistory([]);
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
    // Save snapshot for Undo
    setHistory((prev) => [
      ...prev,
      {
        board: board.map((r) => [...r]),
        turn,
        moves: [...moves],
        lastMove,
        capturedW: [...capturedW],
        capturedB: [...capturedB],
      },
    ]);

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
    setHintMove(null);
    setLastMove(m);
    setMoves((arr) => [...arr, { from: m.from, to: m.to, piece: `${piece.color}-${piece.type}`, capture }]);
    setTurn(turn === 'w' ? 'b' : 'w');
  };

  // Bot AI Move Trigger
  useEffect(() => {
    if (turn !== 'b' || status) return;
    setThinking(true);
    const t = setTimeout(() => {
      const mv = E.getBestMove(board, 'b', DEPTH[difficulty]);
      if (mv) doMove(mv);
      setThinking(false);
    }, 420);
    return () => clearTimeout(t);
  }, [turn, board, status, difficulty]);

  // Handle Square/Piece click
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
      setHintMove(null);
      sound.playClick();
    } else {
      setSelected(null);
      setLegal([]);
    }
  };

  // Undo Move (takes back player + bot's last move)
  const handleUndo = () => {
    if (history.length === 0 || thinking) return;
    sound.playClick();

    // If it's player's turn, revert 2 moves (bot + player)
    // If it's bot's turn, revert 1 move
    const steps = turn === 'w' && history.length >= 2 ? 2 : 1;
    const targetIndex = Math.max(0, history.length - steps);
    const targetSnap = history[targetIndex];

    setBoard(targetSnap.board);
    setTurn(targetSnap.turn);
    setMoves(targetSnap.moves);
    setLastMove(targetSnap.lastMove);
    setCapturedW(targetSnap.capturedW);
    setCapturedB(targetSnap.capturedB);
    setSelected(null);
    setLegal([]);
    setHintMove(null);
    setStatus('');
    setHistory((prev) => prev.slice(0, targetIndex));
  };

  // Hint Move (finds best move for White and highlights it)
  const handleHint = () => {
    if (turn !== 'w' || status || thinking) return;
    sound.playClick();
    const best = E.getBestMove(board, 'w', 2);
    if (best) {
      setHintMove(best);
      setSelected(best.from);
      setLegal(E.legalMoves(board, best.from));
      sound.playCorrect?.();
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
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-5 space-y-3.5 text-slate-800">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="px-3.5 py-2 bg-white hover:bg-slate-100 border-2 border-slate-200 rounded-2xl font-black text-slate-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 flex items-center gap-2">
          <span>♟</span>
          <span>Đấu Cờ Vua 3D</span>
        </h1>

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

      {/* Control Bar: Difficulty, Undo, Hint & New Game */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-white p-2.5 sm:p-3 rounded-2xl border-2 border-slate-200 shadow-xs">
        {/* Difficulty Selection */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs sm:text-sm font-black text-slate-600 mr-0.5">Độ khó:</span>
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

        {/* Quick Game Actions: Hint, Undo, New Game */}
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {/* Hint Button */}
          <button
            onClick={handleHint}
            disabled={turn !== 'w' || thinking || Boolean(status)}
            title="Xem gợi ý nước đi tốt nhất"
            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 disabled:opacity-40 border border-sky-300 text-sky-900 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Lightbulb className="w-4 h-4 text-sky-600" />
            <span>Gợi ý</span>
          </button>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || thinking}
            title="Đi lại nước cờ trước"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 border border-slate-300 text-slate-700 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Undo2 className="w-4 h-4 text-slate-600" />
            <span>Đi lại</span>
          </button>

          {/* New Game Button */}
          <button
            onClick={reset}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Ván mới</span>
          </button>
        </div>
      </div>

      {/* Main Expansive 3D Board Arena (Full Screen Width) */}
      <div className="w-full flex flex-col items-center">
        {viewMode === '3d' ? (
          <Chess3DCanvas
            board={board}
            selected={selected}
            legalMoves={legal}
            lastMove={lastMove}
            hintMove={hintMove}
            turn={turn}
            status={status}
            isThinking={thinking}
            onSquareClick={onSquareClick}
          />
        ) : (
          /* 2D Fallback Board */
          <div className="w-full max-w-[500px] rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400 bg-amber-950 p-3">
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
                        <span className="w-4 h-4 rounded-full bg-emerald-600/80" />
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

        {/* Turn Pill Bar */}
        <div className="mt-3 flex items-center gap-3 px-5 py-2 rounded-full bg-white border-2 border-slate-200 shadow-xs text-xs sm:text-sm font-black">
          <span
            className={`w-3.5 h-3.5 rounded-full ${
              turn === 'w' ? 'bg-amber-400 ring-4 ring-amber-100' : 'bg-slate-800'
            }`}
          />
          <span>
            {turn === 'w' ? 'Lượt của bạn (Quân Trắng)' : 'Lượt của máy (Quân Đen)'}
          </span>
          {hintMove && (
            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-xs font-black">
              Đang hiện gợi ý
            </span>
          )}
        </div>
      </div>

      {/* Underneath Dock: Captured Pieces + Move History (Side-by-side or stacked on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {/* Captured Pieces Panel */}
        <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-xs flex flex-col gap-2.5">
          <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Quân cờ đã bắt</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-[11px] font-bold text-slate-500 block">Bạn bắt được:</span>
              <div className="text-xl tracking-wider text-slate-900 min-h-[28px] flex items-center flex-wrap">
                {capturedB.length > 0 ? (
                  capturedB.join(' ')
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Chưa bắt quân</span>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">Máy bắt được:</span>
              <div className="text-xl tracking-wider text-amber-900 min-h-[28px] flex items-center flex-wrap">
                {capturedW.length > 0 ? (
                  capturedW.join(' ')
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Chưa bắt quân</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Move History Panel */}
        <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>Lịch sử nước đi</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              {moves.length} nước
            </span>
          </div>

          <div className="max-h-28 overflow-y-auto space-y-1 text-xs pr-1 font-mono">
            {moves.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-2 text-center font-sans">
                Chạm trực tiếp vào quân cờ 3D để bắt đầu ván đấu!
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

      {/* Post-Game Analysis Card */}
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
            <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider">
              Lời khuyên của Huấn luyện viên:
            </h4>
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
