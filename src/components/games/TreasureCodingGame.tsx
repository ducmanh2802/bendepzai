import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import {
  DIR_METAS,
  buildCodingRounds,
  expandProgram,
  simulateProgram,
  solveLevel,
  type CodingRound,
  type Dir,
  type ProgToken,
} from '../../data/games/treasure_coding';
import { CodingControls, CodingGrid, ProgramBar } from './TreasureCodingParts';

export { buildCodingRounds };

const ROUNDS_PER_TIER = defaultRoundsPerTier();
const MAX_TOKENS = 20;
const STEP_MS = 380;

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export const TreasureCodingGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'treasure_coding', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1600 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildCodingRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="treasure_coding"
      title="Lập Trình Tìm Kho Báu"
      subtitle="Xếp mũi tên rồi bấm Chạy để đưa Gấu tới rương"
      mascotEmoji="🐻"
      score={stage.score}
      isGameOver={stage.isGameOver}
      phase={stage.phase}
      tier={stage.tier}
      tierMeta={stage.tierMeta}
      tierCount={stage.tierCount}
      roundNumber={stage.roundNumber}
      roundTotal={stage.roundTotal}
      starsEarned={stage.starsEarned}
      nextTierMeta={stage.tier + 1 <= stage.tierCount ? getTierMeta(stage.tier + 1) : undefined}
      onNextTier={stage.startNextTier}
      earnedXp={stage.xpEarned}
      earnedStars={stage.starsEarned}
      prevBestStars={stage.prevBestStars}
      onRestart={stage.restartGame}
      onExit={onExit}
      instructions="Bé xếp các mũi tên thành chương trình rồi bấm nút Chạy nhé!"
      audioInstruction="Bé xếp các mũi tên rồi bấm nút Chạy để đưa Gấu tới rương kho báu nhé!"
      audioLang="vi-VN"
      praiseSubject="MATH"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-rose-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">🗺️</span>
          <h3 className="text-2xl md:text-3xl font-black text-rose-900">Lập Trình Tìm Kho Báu</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Bé xếp các mũi tên ⬆️⬇️⬅️➡️ thành chương trình, rồi bấm ▶ Chạy
            để Gấu Bút Chì đi tới rương kho báu. Tránh đá và nước nhé!
          </p>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Màn cao có 🗝️ chìa khoá phải lấy trước và khối 🔁 ×2 đi 2 ô liền.
            Nút 👣 cho Gấu đi từng bước một.
          </p>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <CodingStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const CodingStage: React.FC<{ stage: GameStage; current: CodingRound }> = ({ stage, current }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [program, setProgram] = useState<ProgToken[]>([]);
  const [executed, setExecuted] = useState(0);
  const [repeatNext, setRepeatNext] = useState(false);
  const [judged, setJudged] = useState<'win' | 'fail' | null>(null);
  const [animating, setAnimating] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);
  const execRef = useRef(0);
  const rafRef = useRef(0);
  const lastT = useRef(0);

  const level = current.level;
  const solution = useMemo(() => solveLevel(level), [level]);
  const flatLen = expandProgram(program).length;
  const expectedNext: Dir | null = solution && flatLen < solution.length ? solution[flatLen] : null;

  const partial = useMemo(() => simulateProgram(level, program.slice(0, executed)), [level, program, executed]);
  const bear = partial.path[partial.path.length - 1];
  const canEdit = !stage.locked && !animating && !judged;

  useEffect(() => {
    setProgram([]);
    setExecuted(0);
    execRef.current = 0;
    setRepeatNext(false);
    setJudged(null);
    setAnimating(false);
    cancelAnimationFrame(rafRef.current);
  }, [current.id]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const resetAttempt = (next: ProgToken[]): void => {
    setProgram(next);
    setExecuted(0);
    execRef.current = 0;
    setJudged(null);
  };

  const judge = (ok: boolean): void => {
    if (judged) return;
    setJudged(ok ? 'win' : 'fail');
    setAnimating(false);
    cancelAnimationFrame(rafRef.current);
    if (ok) {
      sound.playCorrect();
      reportCorrect('tim kho bau');
      stage.submitCorrect();
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong('chuong trinh sai', 'ruong kho bau');
      stage.submitWrong();
    }
  };

  const finishRun = (prog: ProgToken[]): void => {
    const res = simulateProgram(level, prog);
    setExecuted(prog.length);
    execRef.current = prog.length;
    judge(res.success);
  };

  const runAll = (): void => {
    if (stage.locked || animating || program.length === 0 || judged) return;
    sound.playClick();
    const prog = program;
    if (reducedMotion() || document.hidden) {
      finishRun(prog);
      return;
    }
    setExecuted(0);
    execRef.current = 0;
    setJudged(null);
    setAnimating(true);
    lastT.current = performance.now();
    const tick = (t: number): void => {
      if (document.hidden) {
        finishRun(prog);
        return;
      }
      if (t - lastT.current >= STEP_MS) {
        lastT.current = t;
        const next = execRef.current + 1;
        execRef.current = next;
        setExecuted(next);
        const part = simulateProgram(level, prog.slice(0, next));
        if (part.crashed || next >= prog.length) {
          finishRun(prog);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stepOnce = (): void => {
    if (stage.locked || animating || judged || executed >= program.length || program.length === 0) return;
    sound.playClick();
    const next = executed + 1;
    setExecuted(next);
    execRef.current = next;
    const part = simulateProgram(level, program.slice(0, next));
    if (part.crashed || next >= program.length) {
      judge(!part.crashed && simulateProgram(level, program).success);
    }
  };

  const addDir = (d: Dir): void => {
    if (stage.locked || animating || judged || program.length >= MAX_TOKENS) return;
    sound.playClick();
    const token: ProgToken = { dir: d, repeat: repeatNext && level.allowLoop ? 2 : 1 };
    setRepeatNext(false);
    resetAttempt([...program, token]);
  };

  const undoOne = (): void => {
    if (stage.locked || animating || program.length === 0) return;
    sound.playClick();
    resetAttempt(program.slice(0, -1));
  };

  const clearAll = (): void => {
    if (stage.locked || animating || program.length === 0) return;
    sound.playClick();
    resetAttempt([]);
  };

  useEffect(() => {
    if (stage.locked) return;
    const onKey = (e: KeyboardEvent): void => {
      const map: Record<string, Dir> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
      };
      if (map[e.key]) {
        e.preventDefault();
        addDir(map[e.key]);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        runAll();
        return;
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && program.length > 0) {
        e.preventDefault();
        undoOne();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-2 md:gap-3">
      {/* Luoi ban do */}
      <CodingGrid level={level} bear={bear} crashed={partial.crashed} gotKey={partial.gotKey} shakeKey={shakeKey} />
      {level.key && (
        <p className="text-xs md:text-sm font-black text-amber-800 bg-amber-50 rounded-full px-4 py-1 border border-amber-200" aria-live="polite">
          {partial.gotKey ? '🗝️ Đã lấy chìa khoá! Tới rương 🎁 nào!' : '🗝️ Lấy chìa khoá trước rồi mới mở được rương!'}
        </p>
      )}

      {/* Chuong trinh cua be */}
      <ProgramBar program={program} executed={executed} onUndo={undoOne} onClear={clearAll} canEdit={canEdit} />

      {/* Nut mui ten + Chay + Tung buoc + Loa */}
      <CodingControls
        allowLoop={level.allowLoop}
        repeatNext={repeatNext}
        onToggleRepeat={() => { sound.playClick(); setRepeatNext((v) => !v); }}
        onAddDir={addDir}
        expectedNext={expectedNext}
        showHint={showCorrectAnswer}
        qa={qa}
        frozen={stage.locked || animating || !!judged}
        maxed={program.length >= MAX_TOKENS}
        empty={program.length === 0}
        stepDone={executed >= program.length}
        animating={animating}
        onRun={runAll}
        onStep={stepOnce}
        onSpeak={() => sound.speak(`Gấu đang ở hàng ${bear.x + 1} cột ${bear.y + 1}.`, 'vi-VN')}
      />

      <p className="text-xs md:text-sm font-bold text-slate-500">
        🗺️ Màn {stage.tier}/6 · Màn chơi {stage.roundNumber}/{stage.roundTotal} · Phím mũi tên để xếp, Enter để chạy
      </p>
    </div>
  );
};
