import React, { useMemo, useRef, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { getTierMeta } from '../../data/gameLevels';
import {
  MOSAIC_ROUNDS_PER_TIER,
  buildMosaicRounds,
  isMosaicComplete,
  type MosaicColor,
  type MosaicRound,
} from '../../data/games/pixel_mosaic';

export const PixelMosaicGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({
    gameId: 'pixel_mosaic',
    roundsPerTier: MOSAIC_ROUNDS_PER_TIER,
    advanceDelayMs: 1300,
  });
  const rounds = useMemo(() => buildMosaicRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="pixel_mosaic"
      title="Bé Xếp Hình Mosaic"
      subtitle="Chọn màu và ghép từng ô cho giống tranh mẫu"
      mascotEmoji="🧩"
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
      instructions={
        current
          ? `Bé chọn màu rồi chạm từng ô để ghép bức tranh ${current.pattern.name} giống hình mẫu nhé!`
          : 'Bé chọn màu rồi chạm từng ô để ghép bức tranh giống hình mẫu nhé!'
      }
      audioInstruction="Chọn một màu, rồi chạm vào các ô để ghép bức tranh giống hình mẫu"
      praiseSubject="MATH"
    >
      {current && <PixelMosaicStage key={`${current.id}-${stage.nonce}`} stage={stage} round={current} />}
    </GameModalWrapper>
  );
};

function colorOf(round: MosaicRound, key: string | null): MosaicColor | undefined {
  if (!key) return undefined;
  return round.palette.find((c) => c.key === key);
}

const PixelMosaicStage: React.FC<{ stage: GameStage; round: MosaicRound }> = ({ stage, round }) => {
  const { reportCorrect, reportWrong } = useGameFeedback();
  const size = round.pattern.size;
  const [filled, setFilled] = useState<(string | null)[][]>(() =>
    round.goal.map((row) => row.map(() => null))
  );
  const [selectedKey, setSelectedKey] = useState(round.palette[0]?.key ?? '');
  const [wrongCell, setWrongCell] = useState<string | null>(null);
  const wrongTimer = useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (wrongTimer.current) window.clearTimeout(wrongTimer.current);
    };
  }, []);

  const totalCells = round.goal.reduce(
    (sum, row) => sum + row.filter((cell) => cell !== null).length,
    0
  );
  const filledCells = filled.reduce(
    (sum, row) => sum + row.filter((cell) => cell !== null).length,
    0
  );
  const complete = isMosaicComplete(round.goal, filled);

  const handleCell = (r: number, c: number) => {
    const target = round.goal[r][c];
    if (!target || stage.locked || filled[r]?.[c]) return;

    if (target === selectedKey) {
      const next = filled.map((row, ri) =>
        row.map((value, ci) => (ri === r && ci === c ? target : value))
      );
      setFilled(next);
      if (isMosaicComplete(round.goal, next)) {
        sound.playCorrect();
        sound.speakLater(`Tuyệt vời! Bé đã ghép xong bức tranh ${round.pattern.name}!`, 'vi-VN', 250);
        reportCorrect(round.pattern.name);
        stage.submitCorrect();
      } else {
        sound.playPop();
      }
      return;
    }

    const chosen = colorOf(round, selectedKey);
    const expected = colorOf(round, target);
    sound.playWrong();
    reportWrong(chosen?.label ?? 'màu này', expected?.label ?? 'màu khác');
    stage.submitWrong();
    setWrongCell(`${r}-${c}`);
    if (wrongTimer.current) window.clearTimeout(wrongTimer.current);
    wrongTimer.current = window.setTimeout(() => setWrongCell(null), 500);
  };

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-2 md:gap-3 select-none">
      <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white rounded-2xl border-2 border-teal-200 px-3 py-1.5 shadow-sm">
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            aria-hidden="true"
          >
            {round.goal.flatMap((row, r) =>
              row.map((cell, c) => {
                const color = colorOf(round, cell);
                return (
                  <span
                    key={`preview-${r}-${c}`}
                    className="rounded-[2px]"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: color ? color.hex : '#f1f5f9',
                    }}
                  />
                );
              })
            )}
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-bold text-slate-500">Tranh mẫu</p>
            <p className="text-sm font-black text-teal-800">
              <span aria-hidden="true">{round.pattern.emoji} </span>
              {round.pattern.name}
            </p>
          </div>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-white border-2 border-slate-200 text-sm font-black text-slate-700">
          Đã ghép {filledCells}/{totalCells}
        </span>
      </div>

      <div
        className="grid gap-1 md:gap-1.5 p-2 rounded-3xl bg-gradient-to-br from-white to-teal-50 border-4 border-teal-200 shadow-lg"
        style={{ width: 'min(80vw, 320px)', gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={`Bức tranh ${round.pattern.name}`}
      >
        {round.goal.flatMap((row, r) =>
          row.map((target, c) => {
            const value = filled[r][c];
            const color = colorOf(round, value);
            const ghost = !value && round.showGhost ? colorOf(round, target) : undefined;
            const isWrong = wrongCell === `${r}-${c}`;
            const empty = target === null;

            if (empty) {
              return (
                <span
                  key={`cell-${r}-${c}`}
                  className="aspect-square rounded-md bg-slate-100/80"
                  aria-hidden="true"
                />
              );
            }

            return (
              <button
                key={`cell-${r}-${c}`}
                type="button"
                onClick={() => handleCell(r, c)}
                disabled={stage.locked || !!value}
                data-testid="mosaic-cell"
                aria-label={
                  value
                    ? `Ô hàng ${r + 1} cột ${c + 1} đã ghép màu ${color?.label ?? ''}`
                    : `Ô hàng ${r + 1} cột ${c + 1}`
                }
                className={`aspect-square rounded-md border-2 transition-all duration-150 flex items-center justify-center ${
                  value
                    ? 'border-white/70 shadow-inner cursor-default'
                    : 'bg-white border-dashed border-slate-300 hover:border-teal-400 hover:scale-[1.04] active:scale-95'
                } ${isWrong ? 'animate-shake ring-4 ring-rose-400' : ''}`}
                style={{
                  backgroundColor: value && color ? color.hex : ghost ? `${ghost.hex}38` : undefined,
                }}
              >
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap" role="group" aria-label="Bảng màu">
        {round.palette.map((color) => {
          const active = color.key === selectedKey;
          return (
            <button
              key={color.key}
              type="button"
              onClick={() => {
                sound.playClick();
                setSelectedKey(color.key);
              }}
              aria-pressed={active}
              aria-label={`Màu ${color.label}`}
              className={`min-h-[44px] px-3 py-1.5 rounded-2xl border-2 flex items-center gap-2 font-black text-sm transition-all active:scale-95 ${
                active
                  ? 'border-teal-500 ring-2 ring-teal-300 bg-teal-50 text-teal-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
              }`}
            >
              <span
                className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: color.hex }}
                aria-hidden="true"
              />
              {color.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[24px] text-center" aria-live="polite">
        {complete ? (
          <p className="text-sm md:text-base font-black text-emerald-700 animate-pop">
            <span aria-hidden="true">🎉 </span>
            Bé đã ghép xong bức tranh {round.pattern.name}!
          </p>
        ) : round.showGhost ? (
          <p className="text-xs md:text-sm font-bold text-slate-500">
            Ô mờ cho biết màu cần tô · Màn cao hơn sẽ tự nhìn tranh mẫu nhé!
          </p>
        ) : (
          <p className="text-xs md:text-sm font-bold text-slate-500">
            Nhìn tranh mẫu rồi ghép thật khéo nhé!
          </p>
        )}
      </div>
    </div>
  );
};
