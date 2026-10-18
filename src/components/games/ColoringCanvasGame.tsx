import React, { useRef, useState, useEffect } from 'react';
import { GameModalWrapper } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Eraser, Trash2, CheckCircle, Palette } from 'lucide-react';
import { useGameStage } from '../../hooks/useGameStage';
import { getTierMeta } from '../../data/gameLevels';
import {
  COLORS,
  MIN_PAINT_COVERAGE,
  TEMPLATES,
  coverageFromPixels,
  effectiveCoverage,
  starsForCoverage,
  templateForTier,
} from '../../data/games/coloring_canvas';

export { MIN_PAINT_COVERAGE, coverageFromPixels, starsForCoverage };

export const ColoringCanvasGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [coverage, setCoverage] = useState(0);
  const [needMorePaint, setNeedMorePaint] = useState(false);
  // T02B/B13 — baseline snapshot right after the template outline is drawn,
  // so faint template pixels never count as the child's painting.
  const baselineRef = useRef(0);

  const ROUNDS_PER_TIER = TEMPLATES.map(() => 1);
  const stage = useGameStage({ gameId: 'coloring_canvas', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 900 });
  const missionTemplate = templateForTier(stage.tier);

  // Each tier is a new themed masterpiece.
  useEffect(() => {
    setSelectedTemplate(missionTemplate);
  }, [stage.tier, missionTemplate]);

  // Canvas context setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTemplateOutline(ctx, selectedTemplate.emoji);
    // T02B/B13 — snapshot the template-only coverage as baseline.
    try {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      baselineRef.current = coverageFromPixels(img.data);
    } catch {
      baselineRef.current = 0;
    }
    setCoverage(0);
    setNeedMorePaint(false);
  }, [selectedTemplate]);

  const drawTemplateOutline = (ctx: CanvasRenderingContext2D, emoji: string) => {
    ctx.font = '120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.25;
    ctx.fillText(emoji, 250, 180);
    ctx.globalAlpha = 1.0;
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#FFFFFF' : selectedColor;
    ctx.lineWidth = brushSize;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    refreshCoverage();
  };

  const refreshCoverage = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // T02B/B13 — effective coverage excludes the faint template baseline.
      setCoverage(effectiveCoverage(coverageFromPixels(img.data), baselineRef.current));
    } catch {
      // Canvas unavailable (tests): keep last value.
    }
  };

  const clearCanvas = () => {
    sound.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTemplateOutline(ctx, selectedTemplate.emoji);
    try {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      baselineRef.current = coverageFromPixels(img.data);
    } catch {
      baselineRef.current = 0;
    }
    setCoverage(0);
    setNeedMorePaint(false);
  };

  const stampIcon = (emoji: string) => {
    sound.playStar();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 100 + Math.random() * 300, 80 + Math.random() * 200);
    refreshCoverage();
  };

  const finishPainting = () => {
    if (stage.locked) return;
    refreshCoverage();
    const canvas = canvasRef.current;
    let ratio = coverage;
    try {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          ratio = effectiveCoverage(coverageFromPixels(img.data), baselineRef.current);
          setCoverage(ratio);
        }
      }
    } catch {
      // Fall through with last known coverage.
    }
    // T02/B3 — an (almost) blank canvas earns nothing.
    if (ratio < MIN_PAINT_COVERAGE) {
      setNeedMorePaint(true);
      sound.playClick();
      sound.speak(`Bé mới tô được ${Math.round(ratio * 100)} phần trăm. Bé tô thêm chút nữa cho tranh rực rỡ nhé!`);
      window.setTimeout(() => setNeedMorePaint(false), 2500);
      return;
    }
    setNeedMorePaint(false);
    sound.playCorrect();
    // T02B/B13 — stars from REAL coverage (≥30% 1★, ≥60% 2★, ≥85% 3★).
    const stars = starsForCoverage(ratio);
    sound.speak(
      stars >= 3
        ? 'Bức tranh của bé đẹp tuyệt vời!'
        : 'Bức tranh của bé đẹp lắm! Bé tô thêm cho rực rỡ hơn nhé!'
    );
    setSelectedColor(COLORS[0]);
    stage.submitCorrect(stars);
  };

  const restartGame = () => {
    stage.restartGame();
    clearCanvas();
  };

  return (
    <GameModalWrapper
      gameId="coloring_canvas"
      title="Bé Tập Vẽ & Tô Màu Diệu Kỳ"
      subtitle={`Mỗi màn là một tác phẩm mới — màn này: "${missionTemplate.name}"`}
      mascotEmoji="🎨"
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
      onRestart={restartGame}
      onExit={onExit}
      instructions={`Hãy tô màu cho "${missionTemplate.name}" (${missionTemplate.emoji}) thật đẹp rồi bấm Hoàn thành nhé!`}
      audioInstruction={`Hãy tô màu cho ${missionTemplate.name} rồi bấm Hoàn thành`}
    >
      <div className="w-full h-full flex flex-col justify-between items-center bg-amber-50/50 rounded-3xl p-3 md:p-5 select-none">
        {/* Template Picker & Tools Top Bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-white/90 p-2.5 rounded-2xl border border-amber-200 shadow-sm">
          {/* Template select */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Mẫu:</span>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => {
                  sound.playClick();
                  setSelectedTemplate(tpl);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  selectedTemplate.name === tpl.name
                    ? 'bg-amber-400 text-amber-950 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{tpl.emoji}</span>
                <span className="hidden sm:inline">{tpl.name}</span>
              </button>
            ))}
          </div>

          {/* Stamps */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Dán hình:</span>
            {['⭐', '💖', '🌈', '👑'].map((icon) => (
              <button
                key={icon}
                onClick={() => stampIcon(icon)}
                className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center justify-center text-lg active:scale-95 transition-transform"
                title="Dán hình"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Drawing Canvas Area */}
        <div className="my-auto relative rounded-2xl border-4 border-amber-300 shadow-xl overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={500}
            height={320}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full max-w-[500px] h-[260px] md:h-[300px] touch-none cursor-crosshair"
          />
        </div>

        {/* Colors and Brush Bottom Controls */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 bg-white/90 p-2.5 rounded-2xl border border-amber-200 shadow-sm">
          {/* Palette */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  sound.playClick();
                  setSelectedColor(c);
                  setIsEraser(false);
                }}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  !isEraser && selectedColor === c
                    ? 'border-amber-900 scale-125 shadow-md'
                    : 'border-white hover:scale-110'
                }`}
              />
            ))}
          </div>

          {/* Tools */}
          <div className="flex items-center gap-2">
            {/* Eraser */}
            <button
              onClick={() => {
                sound.playClick();
                setIsEraser(!isEraser);
              }}
              className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all ${
                isEraser
                  ? 'bg-rose-500 text-white border-rose-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span>Tẩy</span>
            </button>

            {/* Clear */}
            <button
              onClick={clearCanvas}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-xs font-bold"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa hết</span>
            </button>

            {/* Finish */}
            <button
              onClick={finishPainting}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-md font-black text-xs md:text-sm flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Hoàn thành tranh 🎨 ({Math.round(coverage * 100)}%)</span>
            </button>
          </div>
          {needMorePaint && (
            <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              Bé tô thêm chút nữa (cần {Math.round(MIN_PAINT_COVERAGE * 100)}% tranh) rồi hẵng bấm Hoàn thành nhé! 💪
            </p>
          )}
        </div>
      </div>
    </GameModalWrapper>
  );
};
