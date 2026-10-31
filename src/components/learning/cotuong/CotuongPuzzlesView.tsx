import React, { useEffect, useRef, useState } from 'react';
import { Target, Star, Lightbulb, RotateCcw, ArrowRight, CheckCircle2, Trophy } from 'lucide-react';
import { sound } from '../../../services/sound';
import { fireCelebrationConfetti } from '../../../services/confetti';
import { StorageService } from '../../../services/storage';
import * as E from './cotuongEngine';
import { CotuongBoard3D } from './CotuongBoard3D';
import { COTUONG_PUZZLES, judgePuzzleMove, type CotuongPuzzle } from './cotuongPuzzles';

type PuzzleStatus = 'playing' | 'check' | 'solved';

const MISS_LIMIT_FOR_HINT = 2;

export const CotuongPuzzlesView: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activePuzzle: CotuongPuzzle = COTUONG_PUZZLES[selectedIdx];

  const [board, setBoard] = useState<E.Board>(() => activePuzzle.createBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [legal, setLegal] = useState<E.Move[]>([]);
  const [lastMove, setLastMove] = useState<E.Move | null>(null);
  const [status, setStatus] = useState<PuzzleStatus>('playing');
  const [misses, setMisses] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [solvedIds, setSolvedIds] = useState<string[]>(() => StorageService.getCotuongSolvedPuzzles());
  const [gameKey, setGameKey] = useState(0);
  // Nước "chiếu nhưng chưa bí" chỉ hiện trên bàn ~1 giây rồi trả lại thế cờ.
  const revertTimer = useRef<number | null>(null);

  const clearRevertTimer = () => {
    if (revertTimer.current !== null) {
      window.clearTimeout(revertTimer.current);
      revertTimer.current = null;
    }
  };

  useEffect(() => () => clearRevertTimer(), []);

  const resetPuzzle = (p: CotuongPuzzle = activePuzzle) => {
    clearRevertTimer();
    setBoard(p.createBoard());
    setSelected(null);
    setLegal([]);
    setLastMove(null);
    setStatus('playing');
    setMisses(0);
    setShowHint(false);
    setGameKey((k) => k + 1);
  };

  const handleSelectPuzzle = (idx: number) => {
    sound.playClick();
    setSelectedIdx(idx);
    resetPuzzle(COTUONG_PUZZLES[idx]);
  };

  const solve = () => {
    setStatus('solved');
    sound.playLevelUp();
    fireCelebrationConfetti();
    sound.speak('Chính xác! Bé đã chiếu bí Tướng Đen!');
    const firstTime = StorageService.markCotuongPuzzleSolved(activePuzzle.id);
    setSolvedIds(StorageService.getCotuongSolvedPuzzles());
    // Chỉ thưởng XP cho thế cờ giải lần đầu, tránh cày sao bằng cách giải lại.
    if (firstTime) StorageService.recordGamePlayed(25, 2, 'cotuong');
  };

  const onSquareClick = (r: number, c: number) => {
    if (status === 'solved') return;

    if (selected) {
      const mv = legal.find((m) => m.to[0] === r && m.to[1] === c);
      if (mv) {
        const verdict = judgePuzzleMove(board, mv);
        clearRevertTimer();
        setSelected(null);
        setLegal([]);
        if (verdict === 'mate') {
          setBoard(E.applyMove(board, mv));
          setLastMove(mv);
          solve();
          return;
        }
        if (verdict === 'check') {
          // Cho bé thấy nước chiếu (và đường thoát của Tướng) rồi trả lại bàn cờ.
          setBoard(E.applyMove(board, mv));
          setLastMove(mv);
          setStatus('check');
          setMisses((n) => n + 1);
          sound.playPop();
          revertTimer.current = window.setTimeout(() => {
            setBoard(activePuzzle.createBoard());
            setLastMove(null);
            setStatus('playing');
            setGameKey((k) => k + 1);
          }, 1100);
          return;
        }
        setStatus('playing');
        const nextMisses = misses + 1;
        setMisses(nextMisses);
        if (nextMisses >= MISS_LIMIT_FOR_HINT) setShowHint(true);
        sound.playWrong();
        return;
      }
    }

    const p = board[r][c];
    if (p && p.color === 'red') {
      clearRevertTimer();
      setStatus('playing');
      setSelected([r, c]);
      setLegal(E.legalMoves(board, [r, c]));
      sound.playClick();
    } else {
      setSelected(null);
      setLegal([]);
    }
  };

  const handleNext = () => {
    sound.playClick();
    const nextIdx = (selectedIdx + 1) % COTUONG_PUZZLES.length;
    setSelectedIdx(nextIdx);
    resetPuzzle(COTUONG_PUZZLES[nextIdx]);
  };

  const solvedCount = COTUONG_PUZZLES.filter((p) => solvedIds.includes(p.id)).length;
  const allSolved = solvedCount === COTUONG_PUZZLES.length;
  const kingAt = E.findKing(board, 'black');

  return (
    <div className="space-y-4">
      {/* Puzzles Horizontal Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {COTUONG_PUZZLES.map((pz, idx) => {
          const isActive = idx === selectedIdx;
          const isDone = solvedIds.includes(pz.id);
          return (
            <button
              key={pz.id}
              onClick={() => handleSelectPuzzle(idx)}
              data-testid={`ct-puzzle-tab-${pz.id}`}
              className={`min-h-[44px] px-3 py-2 rounded-2xl border-2 font-black text-xs md:text-sm whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
                isActive
                  ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                  : isDone
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white hover:border-amber-300 text-slate-700'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <Target className="w-4 h-4 text-amber-500" />
              )}
              <span>{pz.title}</span>
              {pz.difficulty === 'hard' && <span className="text-[10px] px-1 bg-rose-500 text-white rounded">Khó</span>}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        {/* Main Board Arena */}
        <div className="relative rounded-3xl bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 border-4 border-amber-300 shadow-xl p-3 sm:p-5 overflow-hidden">
          {/* Objective Banner */}
          <div className="mb-3 p-3 rounded-2xl bg-white/95 border-2 border-amber-200 shadow-xs flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <div>
                <h4 className="font-black text-sm text-slate-900 font-display">
                  {activePuzzle.title} — {activePuzzle.tacticName}
                </h4>
                <p className="text-xs text-amber-800 font-bold">{activePuzzle.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span
                data-testid="ct-puzzle-progress"
                className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-xs"
              >
                {solvedCount}/{COTUONG_PUZZLES.length} thế
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  setShowHint((h) => !h);
                }}
                className="min-h-[44px] px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-sky-600" />
                <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý'}</span>
              </button>
              <button
                onClick={() => resetPuzzle()}
                data-testid="ct-puzzle-reset"
                className="min-h-[44px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Làm lại</span>
              </button>
            </div>
          </div>

          {/* Hint Card */}
          {showHint && status !== 'solved' && (
            <div className="mb-3 p-3 rounded-2xl bg-sky-50 border-2 border-sky-200 text-xs text-sky-900 font-bold animate-pop flex items-start gap-2">
              <span className="text-base">💡</span>
              <p className="leading-relaxed">{activePuzzle.hint}</p>
            </div>
          )}

          {/* Miss / check feedback */}
          {status === 'check' && (
            <div
              data-testid="ct-puzzle-feedback"
              className="mb-3 p-2.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-xs text-amber-900 font-bold animate-pop"
            >
              Chiếu rồi! Nhưng Tướng Đen vẫn còn đường thoát — bé tìm nước chiếu bí nhé.
            </div>
          )}
          {status === 'playing' && misses > 0 && (
            <div
              data-testid="ct-puzzle-feedback"
              className="mb-3 p-2.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-xs text-rose-800 font-bold animate-shake"
            >
              Nước này chưa chiếu Tướng Đen. Bé thử quân khác nhé!
            </div>
          )}

          <CotuongBoard3D
            board={board}
            selected={selected}
            legal={legal}
            lastMove={lastMove}
            checkAt={status === 'solved' || status === 'check' ? kingAt : null}
            captureFx={null}
            flat={false}
            disabled={status === 'solved'}
            gameKey={gameKey}
            labelMode="dual"
            boardTheme="rosewood"
            onSquareClick={onSquareClick}
          />

          {/* Success Overlay Modal */}
          {status === 'solved' && (
            <div
              data-testid="ct-puzzle-success"
              className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-pop"
            >
              <div className="w-full max-w-sm rounded-3xl bg-white border-4 border-amber-400 shadow-2xl p-6 text-center space-y-3">
                <div className="text-6xl animate-bounce">🏆</div>
                <h3 className="text-2xl font-black font-display text-slate-900">
                  CHIẾU BÍ THÀNH CÔNG!
                </h3>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs sm:text-sm text-emerald-900 font-bold text-left leading-relaxed">
                  {activePuzzle.explanation}
                </div>
                <div className="flex items-center justify-center gap-3 py-2 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 font-black text-sm">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  <span>+25 XP Thử Thách Cờ Tướng</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => resetPuzzle()}
                    className="min-h-[44px] flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs sm:text-sm cursor-pointer"
                  >
                    Xem lại thế cờ
                  </button>
                  <button
                    onClick={handleNext}
                    data-testid="ct-puzzle-next"
                    className="min-h-[44px] flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black shadow-lg text-xs sm:text-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{solvedCount === COTUONG_PUZZLES.length ? 'Học lại từ đầu' : 'Thế tiếp theo'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tactical Playbook Guide Sidebar */}
        <div className="space-y-3.5">
          <div className="p-4 rounded-3xl bg-white border-2 border-amber-200 shadow-xs space-y-3">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Bí Kíp Sát Pháp Cờ Tướng</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Mỗi thế cờ là một đòn chiếu bí một nước. Bé hãy tìm quân nào chiếu Tướng Đen mà
              Tướng không còn ô nào để chạy!
            </p>
            <div className="space-y-2">
              {COTUONG_PUZZLES.map((pz, idx) => (
                <button
                  key={pz.id}
                  onClick={() => handleSelectPuzzle(idx)}
                  className={`w-full min-h-[44px] p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                    selectedIdx === idx
                      ? 'border-amber-500 bg-amber-50/80 shadow-2xs'
                      : 'border-slate-100 bg-slate-50 hover:bg-amber-50/40'
                  }`}
                >
                  <div>
                    <div className="font-black text-xs text-slate-800">{pz.title}</div>
                    <div className="text-[11px] text-slate-500 font-bold">{pz.tacticName}</div>
                  </div>
                  {solvedIds.includes(pz.id) ? (
                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Đã giải
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">Thử tài →</span>
                  )}
                </button>
              ))}
            </div>
            {allSolved && (
              <p className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 animate-pop">
                🎉 Bé đã giải hết 6 thế cờ! Giỏi quá, thử chơi cờ 3D với máy nhé!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotuongPuzzlesView;
