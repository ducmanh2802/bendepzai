import React, { useState } from 'react';
import { Target, Star, Lightbulb, RotateCcw, ArrowRight, CheckCircle2, Trophy, HelpCircle } from 'lucide-react';
import { sound } from '../../../services/sound';
import { fireCelebrationConfetti } from '../../../services/confetti';
import { StorageService } from '../../../services/storage';
import * as E from './cotuongEngine';
import { CotuongBoard3D, type CotuongLabelMode, type CotuongTheme } from './CotuongBoard3D';
import { COTUONG_PUZZLES, type CotuongPuzzle } from './cotuongPuzzles';

export const CotuongPuzzlesView: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activePuzzle: CotuongPuzzle = COTUONG_PUZZLES[selectedIdx];

  const [board, setBoard] = useState<E.Board>(() => activePuzzle.createBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [legal, setLegal] = useState<E.Move[]>([]);
  const [lastMove, setLastMove] = useState<E.Move | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completedPuzzles, setCompletedPuzzles] = useState<Record<string, boolean>>({});
  const [gameKey, setGameKey] = useState(0);

  const resetPuzzle = (p = activePuzzle) => {
    setBoard(p.createBoard());
    setSelected(null);
    setLegal([]);
    setLastMove(null);
    setIsSuccess(false);
    setIsWrong(false);
    setShowHint(false);
    setGameKey((k) => k + 1);
  };

  const handleSelectPuzzle = (idx: number) => {
    sound.playClick();
    setSelectedIdx(idx);
    resetPuzzle(COTUONG_PUZZLES[idx]);
  };

  const onSquareClick = (r: number, c: number) => {
    if (isSuccess) return;

    if (selected) {
      const mv = legal.find((m) => m.to[0] === r && m.to[1] === c);
      if (mv) {
        setBoard(E.applyMove(board, mv));
        setLastMove(mv);
        setSelected(null);
        setLegal([]);

        // Check if this move matches expected winning move
        const exp = activePuzzle.expectedMove;
        if (mv.from[0] === exp.from[0] && mv.from[1] === exp.from[1] &&
            mv.to[0] === exp.to[0] && mv.to[1] === exp.to[1]) {
          setIsSuccess(true);
          setIsWrong(false);
          sound.playLevelUp?.();
          fireCelebrationConfetti();
          sound.speak('Chính xác! Bé đã giải được thế cờ!');
          setCompletedPuzzles((prev) => ({ ...prev, [activePuzzle.id]: true }));
          try {
            StorageService.recordGamePlayed(25, 2);
          } catch {
            // ignore
          }
        } else {
          setIsWrong(true);
          sound.playWrong?.();
          sound.speak('Chưa đúng rồi! Bé thử nước cờ khác nhé.');
        }
        return;
      }
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

  const handleNext = () => {
    sound.playClick();
    const nextIdx = (selectedIdx + 1) % COTUONG_PUZZLES.length;
    setSelectedIdx(nextIdx);
    resetPuzzle(COTUONG_PUZZLES[nextIdx]);
  };

  return (
    <div className="space-y-4">
      {/* Puzzles Horizontal Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {COTUONG_PUZZLES.map((pz, idx) => {
          const isActive = idx === selectedIdx;
          const isDone = completedPuzzles[pz.id];
          return (
            <button
              key={pz.id}
              onClick={() => handleSelectPuzzle(idx)}
              className={`px-3 py-2 rounded-2xl border-2 font-black text-xs md:text-sm whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
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
              <button
                onClick={() => {
                  sound.playClick();
                  setShowHint((h) => !h);
                }}
                className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-sky-600" />
                <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý'}</span>
              </button>
              <button
                onClick={() => resetPuzzle()}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Làm lại</span>
              </button>
            </div>
          </div>

          {/* Hint Card */}
          {showHint && (
            <div className="mb-3 p-3 rounded-2xl bg-sky-50 border-2 border-sky-200 text-xs text-sky-900 font-bold animate-pop flex items-start gap-2">
              <span className="text-base">💡</span>
              <p className="leading-relaxed">{activePuzzle.hint}</p>
            </div>
          )}

          {/* Wrong Alert Banner */}
          {isWrong && !isSuccess && (
            <div className="mb-3 p-2.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-xs text-rose-800 font-bold animate-shake flex items-center justify-between">
              <span>Nước cờ này chưa tối ưu để chiếu bí. Bé hãy làm lại nhé!</span>
              <button
                onClick={() => resetPuzzle()}
                className="px-2 py-0.5 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-900 font-black text-xs cursor-pointer ml-2"
              >
                Thử lại
              </button>
            </div>
          )}

          <CotuongBoard3D
            board={board}
            selected={selected}
            legal={legal}
            lastMove={lastMove}
            checkAt={isSuccess ? E.findKing(board, 'black') : null}
            captureFx={null}
            flat={false}
            disabled={isSuccess}
            gameKey={gameKey}
            labelMode="dual"
            boardTheme="rosewood"
            onSquareClick={onSquareClick}
          />

          {/* Success Overlay Modal */}
          {isSuccess && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-pop">
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
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs sm:text-sm cursor-pointer"
                  >
                    Xem lại thế cờ
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black shadow-lg text-xs sm:text-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Thế tiếp theo</span>
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
              Luyện tập các thế cờ thực chiến giúp các kiện tướng nhí rèn luyện nhãn quan chiến thuật, phát hiện đòn đánh quyết định để giành chiến thắng!
            </p>
            <div className="space-y-2">
              {COTUONG_PUZZLES.map((pz, idx) => (
                <button
                  key={pz.id}
                  onClick={() => handleSelectPuzzle(idx)}
                  className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                    selectedIdx === idx
                      ? 'border-amber-500 bg-amber-50/80 shadow-2xs'
                      : 'border-slate-100 bg-slate-50 hover:bg-amber-50/40'
                  }`}
                >
                  <div>
                    <div className="font-black text-xs text-slate-800">{pz.title}</div>
                    <div className="text-[11px] text-slate-500 font-bold">{pz.tacticName}</div>
                  </div>
                  {completedPuzzles[pz.id] ? (
                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Đã giải
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">Thử tài →</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
