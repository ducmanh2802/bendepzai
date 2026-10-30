import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Undo2, Lightbulb, Box, Square } from 'lucide-react';
import { sound } from '../../../services/sound';
import { fireCelebrationConfetti } from '../../../services/confetti';
import * as E from './cotuongEngine';
import { CotuongBoard3D, PIECE_CHAR, type CaptureFx, type CotuongLabelMode, type CotuongTheme } from './CotuongBoard3D';

const DEPTH: Record<string, number> = { easy: 2, medium: 3, hard: 4, expert: 4 };
const BOT: Record<string, E.BotOptions> = {
  easy: { maxNodes: 20000, softness: 150 },
  medium: { maxNodes: 60000, softness: 30 },
  hard: { maxNodes: 220000 },
  expert: { maxNodes: 420000 },
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Dễ',
  medium: 'Thường',
  hard: 'Khó',
  expert: 'Siêu khó',
};

const INITIAL_COUNTS: Record<E.PieceType, number> = { k: 1, a: 2, e: 2, h: 2, r: 2, c: 2, p: 5 };
const PIECE_ORDER: E.PieceType[] = ['r', 'c', 'h', 'e', 'a', 'p'];

interface MoveRec {
  from: [number, number];
  to: [number, number];
  piece: string;
  capture: boolean;
}

interface Snapshot {
  board: E.Board;
  moves: MoveRec[];
  lastMove: E.Move | null;
}

function missingPieces(board: E.Board): Record<E.Color, E.PieceType[]> {
  const alive: Record<E.Color, Record<E.PieceType, number>> = {
    red: { k: 0, a: 0, e: 0, h: 0, r: 0, c: 0, p: 0 },
    black: { k: 0, a: 0, e: 0, h: 0, r: 0, c: 0, p: 0 },
  };
  for (const row of board) {
    for (const p of row) if (p) alive[p.color][p.type] += 1;
  }
  const out: Record<E.Color, E.PieceType[]> = { red: [], black: [] };
  PIECE_ORDER.forEach((type) => {
    (['red', 'black'] as E.Color[]).forEach((color) => {
      const gone = Math.max(0, INITIAL_COUNTS[type] - alive[color][type]);
      for (let i = 0; i < gone; i++) out[color].push(type);
    });
  });
  return out;
}

const MiniDiscs: React.FC<{ pieces: E.PieceType[]; color: E.Color }> = ({ pieces, color }) => {
  if (pieces.length === 0) {
    return <span className="text-xs font-bold text-slate-400">Chưa bắt được quân nào</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {pieces.map((type, i) => (
        <span
          key={`${type}-${i}`}
          className={`ct-mini-disc ${color === 'red' ? 'ct-mini-disc--red' : 'ct-mini-disc--black'}`}
        >
          {PIECE_CHAR[`${color}-${type}`]}
        </span>
      ))}
    </div>
  );
};

export const CotuongGame: React.FC<{ onBack: () => void; embedded?: boolean }> = ({
  onBack,
  embedded = false,
}) => {
  const [board, setBoard] = useState<E.Board>(() => E.initialBoard());
  const [turn, setTurn] = useState<E.Color>('red');
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [legal, setLegal] = useState<E.Move[]>([]);
  const [difficulty, setDifficulty] = useState('easy');
  const [thinking, setThinking] = useState(false);
  const [moves, setMoves] = useState<MoveRec[]>([]);
  const [lastMove, setLastMove] = useState<E.Move | null>(null);
  const [hintMove, setHintMove] = useState<E.Move | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [result, setResult] = useState<{ winner: E.Color; text: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [flat, setFlat] = useState(false);
  const [labelMode, setLabelMode] = useState<CotuongLabelMode>('dual');
  const [boardTheme, setBoardTheme] = useState<CotuongTheme>('rosewood');
  const [gameKey, setGameKey] = useState(0);
  const [captureFx, setCaptureFx] = useState<CaptureFx | null>(null);
  const fxTimer = useRef<number | null>(null);
  const startedAt = useRef(Date.now());

  const checkAt = useMemo<[number, number] | null>(() => {
    if (result) return null;
    if (!E.inCheck(board, turn)) return null;
    return E.findKing(board, turn);
  }, [board, turn, result]);

  // Voice check alert
  useEffect(() => {
    if (checkAt && !result) {
      sound.speak('Chiếu tướng!');
    }
  }, [checkAt, result]);

  const captured = useMemo(() => missingPieces(board), [board]);

  useEffect(() => {
    return () => {
      if (fxTimer.current) window.clearTimeout(fxTimer.current);
    };
  }, []);

  const clearSelection = () => {
    setSelected(null);
    setLegal([]);
    setHintMove(null);
  };

  const doMove = (m: E.Move) => {
    const piece = board[m.from[0]][m.from[1]];
    if (!piece) return;
    const target = board[m.to[0]][m.to[1]];
    setBoard(E.applyMove(board, m));
    setLastMove(m);
    setMoves((prev) => [
      ...prev,
      { from: m.from, to: m.to, piece: `${piece.color}-${piece.type}`, capture: !!target },
    ]);
    clearSelection();
    if (target) {
      sound.playPop();
      setCaptureFx({ r: m.to[0], c: m.to[1], key: Date.now() });
      if (fxTimer.current) window.clearTimeout(fxTimer.current);
      fxTimer.current = window.setTimeout(() => setCaptureFx(null), 700);
    } else {
      sound.playClick();
    }
    setTurn(turn === 'red' ? 'black' : 'red');
  };

  // Game-over detection runs on the real board state (not on the bot's view).
  useEffect(() => {
    const over = E.isGameOver(board, turn);
    if (!over.over) return;
    const winner = over.winner ?? (turn === 'red' ? 'black' : 'red');
    setResult({ winner, text: over.result });
    setShowResult(true);
    clearSelection();
    if (winner === 'red') {
      sound.playLevelUp();
      fireCelebrationConfetti();
      sound.speak('Tuyệt vời! Bé đã thắng ván cờ tướng!');
    } else {
      sound.playWrong();
      sound.speak('Máy thắng ván này rồi. Bé thử lại nhé!');
    }
  }, [board, turn]);

  // Bot turn.
  useEffect(() => {
    if (turn !== 'black' || result) return;
    setThinking(true);
    const timer = window.setTimeout(() => {
      const mv = E.getBestMove(board, 'black', DEPTH[difficulty], BOT[difficulty]);
      if (mv) doMove(mv);
      setThinking(false);
    }, 260);
    return () => {
      window.clearTimeout(timer);
      setThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, board, result, difficulty]);

  const reset = () => {
    if (fxTimer.current) window.clearTimeout(fxTimer.current);
    setBoard(E.initialBoard());
    setTurn('red');
    clearSelection();
    setMoves([]);
    setLastMove(null);
    setHintMove(null);
    setHistory([]);
    setResult(null);
    setShowResult(false);
    setThinking(false);
    setCaptureFx(null);
    setGameKey((k) => k + 1);
    startedAt.current = Date.now();
  };

  const changeDifficulty = (d: string) => {
    sound.playClick();
    setDifficulty(d);
    reset();
  };

  const pushSnapshot = () => {
    setHistory((h) => [...h.slice(-40), { board, moves, lastMove }]);
  };

  const undo = () => {
    if (thinking || result || history.length === 0) return;
    const snap = history[history.length - 1];
    setBoard(snap.board);
    setMoves(snap.moves);
    setLastMove(snap.lastMove);
    setHistory((h) => h.slice(0, -1));
    setTurn('red');
    clearSelection();
    setCaptureFx(null);
    sound.playClick();
  };

  const hint = () => {
    if (result || thinking || turn !== 'red') return;
    const mv = E.getBestMove(board, 'red', 2, { maxNodes: 40000 });
    if (!mv) return;
    setHintMove(mv);
    setSelected(mv.from);
    setLegal([mv]);
    sound.playClick();
  };

  const analysis = () => {
    const secs = Math.round((Date.now() - startedAt.current) / 1000);
    const redLost = result?.winner === 'black';
    const tips: string[] = [];

    if (redLost) {
      if (captured.red.length > captured.black.length) {
        tips.push('Bé đã để mất nhiều quân hơn máy. Hãy bảo vệ các quân chủ lực (Xe, Pháo, Mã) thật kỹ.');
      }
      tips.push('Luôn để ý giữ 2 Sĩ và 2 Tượng liên hoàn để che chắn cho Tướng an toàn trong cung.');
      tips.push('Đừng để Mã bị cản chân: quan sát kỹ các ô cản trước khi xuất kích.');
      tips.push('Tận dụng Pháo: hãy mượn quân làm ngòi để Pháo phát huy tối đa tầm bắn uy lực.');
    } else if (result?.winner === 'red') {
      tips.push('Bé điều quân rất chuẩn xác! Các đường Xe, Pháo, Mã phối hợp công thủ toàn diện và giành chiến thắng vẻ vang.');
    } else {
      tips.push('Ván cờ hòa cân não! Cả hai bên đều có thế phòng ngự rất chặt chẽ.');
    }
    return { secs, tips };
  };

  const onSquareClick = (r: number, c: number) => {
    if (result || thinking || turn !== 'red') return;
    if (selected) {
      const mv = legal.find((m) => m.to[0] === r && m.to[1] === c);
      if (mv) {
        pushSnapshot();
        doMove(mv);
        return;
      }
    }
    const p = board[r][c];
    if (p && p.color === 'red') {
      setSelected([r, c]);
      setLegal(E.legalMoves(board, [r, c]));
      sound.playClick();
    } else {
      clearSelection();
    }
  };

  const statusText = result
    ? result.text
    : thinking
      ? 'Máy đang nghĩ…'
      : checkAt
        ? 'Chiếu tướng! Bé hãy cứu Tướng ngay.'
        : turn === 'red'
          ? 'Lượt của bé — chọn một quân Đỏ.'
          : 'Lượt của máy.';

  return (
    <div className={embedded ? 'w-full' : 'max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6'}>
      {!embedded && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="px-4 py-2 bg-white/80 hover:bg-white rounded-xl font-bold text-slate-700 flex items-center gap-2 border-2 border-amber-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900">
            ♟️ Cờ Tướng 3D
          </h1>
        </div>
      )}

      <div className="rounded-3xl bg-white/70 backdrop-blur-sm border-2 border-amber-200 shadow-sm p-2.5 sm:p-3 mb-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Difficulty Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black text-slate-500 mr-0.5">Độ khó:</span>
            {(['easy', 'medium', 'hard', 'expert'] as const).map((d) => (
              <button
                key={d}
                onClick={() => changeDifficulty(d)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer ${
                  difficulty === d
                    ? 'bg-amber-500 text-white shadow'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                {DIFFICULTY_LABEL[d]}
              </button>
            ))}
          </div>

          {/* Quick Actions: Hint, Undo, New Game, 3D View */}
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            <button
              onClick={hint}
              disabled={!!result || thinking || turn !== 'red'}
              title="Xem gợi ý nước đi tối ưu"
              className="px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-violet-600" /> Gợi ý
            </button>
            <button
              onClick={undo}
              disabled={!!result || thinking || history.length === 0}
              title="Đi lại nước cờ trước"
              className="px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5 text-slate-600" /> Đi lại
            </button>
            <button
              onClick={() => {
                sound.playClick();
                reset();
              }}
              title="Bắt đầu ván cờ mới"
              className="px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" /> Ván mới
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setFlat((f) => !f);
              }}
              aria-pressed={flat}
              className="px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 flex items-center gap-1 cursor-pointer"
            >
              {flat ? <Box className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              {flat ? 'Góc 3D' : 'Góc 2D'}
            </button>
          </div>
        </div>

        {/* Board Customization Bar: Label Mode & Wood Theme */}
        <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Label Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Mặt quân:</span>
            <div className="flex bg-amber-100/80 p-0.5 rounded-xl border border-amber-200">
              <button
                onClick={() => {
                  sound.playClick();
                  setLabelMode('dual');
                }}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  labelMode === 'dual' ? 'bg-amber-500 text-white shadow-2xs font-extrabold' : 'text-amber-900 hover:text-black'
                }`}
              >
                Song ngữ 🀄
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setLabelMode('viet');
                }}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  labelMode === 'viet' ? 'bg-amber-500 text-white shadow-2xs font-extrabold' : 'text-amber-900 hover:text-black'
                }`}
              >
                Chữ Việt 🇻🇳
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setLabelMode('han');
                }}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  labelMode === 'han' ? 'bg-amber-500 text-white shadow-2xs font-extrabold' : 'text-amber-900 hover:text-black'
                }`}
              >
                Chữ Hán 🇨🇳
              </button>
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="font-bold text-slate-600">Bàn cờ:</span>
            <div className="flex bg-amber-100/80 p-0.5 rounded-xl border border-amber-200">
              <button
                onClick={() => {
                  sound.playClick();
                  setBoardTheme('rosewood');
                }}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  boardTheme === 'rosewood' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-900'
                }`}
              >
                Gỗ Hương 🪵
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setBoardTheme('ebony');
                }}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  boardTheme === 'ebony' ? 'bg-slate-800 text-white shadow-2xs' : 'text-amber-900'
                }`}
              >
                Gỗ Mun 🖤
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setBoardTheme('bamboo');
                }}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  boardTheme === 'bamboo' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-900'
                }`}
              >
                Gỗ Tre 🌾
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <div className="relative rounded-3xl bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 border-4 border-amber-200 shadow-xl p-2.5 sm:p-5 overflow-hidden">
          <div
            className={`mb-2 flex items-center gap-2 rounded-2xl px-3 py-2 font-bold text-sm ${
              result
                ? result.winner === 'red'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
                : checkAt
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-white/80 text-slate-700'
            }`}
            role="status"
            aria-live="polite"
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-white shadow-inner ${
                turn === 'red' ? 'bg-red-600' : 'bg-slate-800'
              }`}
              aria-hidden="true"
            >
              {turn === 'red' ? '帥' : '將'}
            </span>
            <span className="truncate">{statusText}</span>
            {hintMove && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-xs font-black">
                Đang hiện gợi ý
              </span>
            )}
            {thinking && (
              <span className="ml-auto flex gap-1" aria-hidden="true">
                <span className="ct-dot-wave" />
                <span className="ct-dot-wave" />
                <span className="ct-dot-wave" />
              </span>
            )}
          </div>

          <CotuongBoard3D
            board={board}
            selected={selected}
            legal={legal}
            lastMove={lastMove}
            checkAt={checkAt}
            captureFx={captureFx}
            flat={flat}
            disabled={!!result || thinking || turn !== 'red'}
            gameKey={gameKey}
            labelMode={labelMode}
            boardTheme={boardTheme}
            hintMove={hintMove}
            onSquareClick={onSquareClick}
          />

          {showResult && result && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 animate-pop">
              <div className="w-full max-w-md rounded-3xl bg-white border-4 border-amber-300 shadow-2xl p-6 text-center space-y-3.5 max-h-[90vh] overflow-y-auto">
                <div className="text-6xl animate-bounce">{result.winner === 'red' ? '🏆' : '🤖'}</div>
                <h3 className="text-2xl font-black font-display text-slate-900 mb-1">
                  {result.winner === 'red' ? 'Bé Thắng Rồi!' : 'Máy Thắng Ván Này'}
                </h3>
                <p className="text-sm font-bold text-slate-600">{result.text}</p>

                {/* Coach Tactical Analysis */}
                {(() => {
                  const a = analysis();
                  return (
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 border-2 border-amber-200 text-left space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>⏱️ Thời gian: <strong>{a.secs}s</strong></span>
                        <span>♟️ Nước đi: <strong>{moves.length}</strong></span>
                        <span>⭐ Đỏ bắt: <strong>{captured.black.length}</strong></span>
                      </div>
                      <div className="pt-1 text-xs text-slate-600 space-y-1">
                        <span className="font-black text-amber-900 block text-[11px] uppercase tracking-wider">
                          Lời khuyên của Huấn Luyện Viên:
                        </span>
                        <ul className="list-disc list-inside space-y-1">
                          {a.tips.map((t, idx) => (
                            <li key={idx} className="leading-relaxed">{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowResult(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-sm cursor-pointer"
                  >
                    Xem bàn cờ
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      reset();
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-lg text-sm cursor-pointer"
                  >
                    Ván mới
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl bg-white/80 border-2 border-amber-200 p-3">
            <h3 className="text-sm font-black text-slate-700 mb-2">Quân đã bắt</h3>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-red-600 mb-1">
                  Đỏ bắt được
                </p>
                <MiniDiscs pieces={captured.black} color="black" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-600 mb-1">
                  Đen bắt được
                </p>
                <MiniDiscs pieces={captured.red} color="red" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 border-2 border-amber-200 p-3">
            <h3 className="text-sm font-black text-slate-700 mb-2">Lịch sử nước đi</h3>
            {moves.length === 0 ? (
              <p className="text-xs font-bold text-slate-400">
                Bé đi nước đầu tiên nhé — quân Đỏ được đi trước.
              </p>
            ) : (
              <ol className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {moves.map((m, i) => {
                  const [pc, pt] = m.piece.split('-') as [E.Color, E.PieceType];
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600"
                    >
                      <span className="w-5 text-right text-slate-400">{i + 1}.</span>
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                          pc === 'red'
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-slate-300 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {PIECE_CHAR[`${pc}-${pt}`]}
                      </span>
                      <span>
                        ({m.from[0] + 1},{m.from[1] + 1}) → ({m.to[0] + 1},{m.to[1] + 1})
                      </span>
                      {m.capture && <span className="text-amber-600">ăn quân!</span>}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 border-2 border-violet-200 p-3">
            <h3 className="text-sm font-black text-violet-800 mb-1">Mẹo nhỏ</h3>
            <p className="text-xs font-bold text-violet-700 leading-relaxed">
              Xe đi ngang dọc rất mạnh, Pháo cần một quân làm ngòi mới ăn được. Nhớ giữ Tướng
              trong cung và để ý nước chiếu!
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CotuongGame;
