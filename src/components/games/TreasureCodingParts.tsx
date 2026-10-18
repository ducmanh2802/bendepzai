import React from 'react';
import { Volume2 } from 'lucide-react';
import { DIR_METAS, type Cell, type CodingLevel, type Dir, type ProgToken } from '../../data/games/treasure_coding';

/**
 * T17B — hien thi ban do luoi + thanh chuong trinh cua game Lap Trinh.
 * Tach rieng de file game chinh gon duoi 300 dong.
 */

const rockEmoji = (i: number): string => (i % 2 === 0 ? '🗿' : '🌊');

export const CodingGrid: React.FC<{
  level: CodingLevel;
  bear: Cell;
  crashed: boolean;
  gotKey: boolean;
  shakeKey: number;
}> = ({ level, bear, crashed, gotKey, shakeKey }) => {
  const isRock = (x: number, y: number): number =>
    level.rocks.findIndex((c) => c.x === x && c.y === y);
  return (
    <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
      <div
        className="grid gap-1 bg-emerald-100 rounded-2xl p-2 border-2 border-emerald-300 shadow-md"
        style={{ gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={`Bản đồ ${level.size} nhân ${level.size}`}
      >
        {Array.from({ length: level.size }, (_, y) =>
          Array.from({ length: level.size }, (_, x) => {
            const rockIdx = isRock(x, y);
            const isBear = bear.x === x && bear.y === y;
            const isStart = level.start.x === x && level.start.y === y;
            const isTreasure = level.treasure.x === x && level.treasure.y === y;
            const isKey = level.key !== null && level.key.x === x && level.key.y === y;
            return (
              <div
                key={`${x}-${y}`}
                role="gridcell"
                className={`aspect-square min-w-[40px] min-h-[40px] md:min-w-[52px] md:min-h-[52px] rounded-xl flex items-center justify-center text-2xl md:text-3xl border-2 transition-all motion-reduce:transition-none ${
                  isBear ? 'bg-amber-200 border-amber-500 scale-105' : 'bg-white border-emerald-200'
                }`}
              >
                {isBear ? (crashed ? '💥' : '🐻')
                  : rockIdx >= 0 ? rockEmoji(rockIdx)
                  : isTreasure ? (level.key && !gotKey ? '🔒' : '🎁')
                  : isKey && !gotKey ? '🗝️'
                  : isStart ? '🐾' : ''}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};

export const CodingControls: React.FC<{
  allowLoop: boolean;
  repeatNext: boolean;
  onToggleRepeat: () => void;
  onAddDir: (d: Dir) => void;
  expectedNext: Dir | null;
  showHint: boolean;
  qa: boolean;
  frozen: boolean;
  maxed: boolean;
  empty: boolean;
  stepDone: boolean;
  animating: boolean;
  onRun: () => void;
  onStep: () => void;
  onSpeak: () => void;
}> = ({
  allowLoop, repeatNext, onToggleRepeat, onAddDir, expectedNext, showHint, qa,
  frozen, maxed, empty, stepDone, animating, onRun, onStep, onSpeak,
}) => (
  <div className="flex flex-col items-center gap-2">
    {/* Nut mui ten */}
    <div className="flex items-center justify-center gap-2" role="group" aria-label="Thêm mũi tên">
      {DIR_METAS.map((m, i) => (
        <button
          key={m.id}
          onClick={() => onAddDir(m.id)}
          disabled={frozen || maxed}
          data-testid="answer-option"
          {...(qa && expectedNext === m.id ? { 'data-correct': true } : {})}
          aria-label={`Đi ${m.label} (phím ${i + 1})`}
          className={`min-w-[56px] min-h-[56px] px-3 py-2 rounded-2xl border-2 text-3xl font-black transition-all motion-reduce:transition-none active:scale-95 ${
            showHint && expectedNext === m.id
              ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50'
              : 'bg-white border-rose-300 hover:border-rose-500 hover:scale-105 shadow-md'
          }`}
        >
          {m.emoji}
        </button>
      ))}
      {allowLoop && (
        <button
          onClick={onToggleRepeat}
          disabled={frozen}
          aria-label="Nhân đôi bước tiếp theo"
          aria-pressed={repeatNext}
          className={`min-w-[56px] min-h-[56px] px-3 py-2 rounded-2xl border-2 text-xl font-black transition-all active:scale-95 ${
            repeatNext ? 'bg-violet-400 border-violet-600 text-white' : 'bg-violet-50 border-violet-300 text-violet-900'
          }`}
        >
          🔁×2
        </button>
      )}
    </div>

    {/* Chay + tung buoc + loa */}
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <button
        onClick={onRun}
        disabled={frozen || empty}
        className="min-h-[48px] px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-500 disabled:opacity-40 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
      >
        {animating ? '🐻 Đang đi…' : '▶ Chạy'}
      </button>
      <button
        onClick={onStep}
        disabled={frozen || empty || stepDone}
        aria-label="Cho Gấu đi từng bước một"
        className="min-h-[48px] px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-500 disabled:opacity-40 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
      >
        👣 Từng bước
      </button>
      <button
        onClick={onSpeak}
        aria-label="Nghe vị trí của Gấu"
        className="min-w-[44px] min-h-[44px] px-3 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-full text-sm"
      >
        <Volume2 className="w-5 h-5" aria-hidden="true" /> Nghe 🔊
      </button>
    </div>
  </div>
);

export const ProgramBar: React.FC<{
  program: ProgToken[];
  executed: number;
  onUndo: () => void;
  onClear: () => void;
  canEdit: boolean;
}> = ({ program, executed, onUndo, onClear, canEdit }) => (
  <div className="w-full bg-white/95 rounded-2xl px-3 py-2 shadow-md border-2 border-rose-200" aria-live="polite">
    <div className="flex items-center gap-1 flex-wrap min-h-[44px]">
      <span className="text-sm font-black text-slate-500">▶</span>
      {program.length === 0 && (
        <span className="text-sm font-bold text-slate-400">Bé bấm các mũi tên bên dưới…</span>
      )}
      {program.map((t, i) => (
        <span
          key={i}
          className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-lg font-black border-2 ${
            i < executed ? 'bg-emerald-400 border-emerald-600 text-white' : 'bg-rose-50 border-rose-300'
          }`}
        >
          {DIR_METAS.find((m) => m.id === t.dir)?.emoji}
          {t.repeat === 2 && <span className="text-[10px] text-rose-700 font-black">×2</span>}
        </span>
      ))}
      <span className="ml-auto flex gap-1">
        <button
          onClick={onUndo}
          disabled={!canEdit || program.length === 0}
          aria-label="Xoá bước cuối (phím Backspace)"
          className="min-w-[44px] min-h-[44px] px-2 rounded-xl bg-amber-100 hover:bg-amber-200 disabled:opacity-40 text-amber-800 text-xl font-black border-2 border-amber-200"
        >
          ⌫
        </button>
        <button
          onClick={onClear}
          disabled={!canEdit || program.length === 0}
          aria-label="Xoá hết chương trình"
          className="min-w-[44px] min-h-[44px] px-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 text-xl font-black border-2 border-slate-200"
        >
          🗑
        </button>
      </span>
    </div>
  </div>
);
