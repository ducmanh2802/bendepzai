import React, { useEffect, useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { Volume2 } from 'lucide-react';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { buildReadRounds, type ReadDoRound } from '../../data/games/read_and_do';

export { buildReadRounds };

const ROUNDS_PER_TIER = defaultRoundsPerTier();

function isQaMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('qa');
  } catch {
    return false;
  }
}

export const ReadAndDoGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: 'read_and_do', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1200 });
  const [showIntro, setShowIntro] = useState(true);

  const rounds = useMemo(() => buildReadRounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="read_and_do"
      title="Đọc Câu Làm Theo"
      subtitle="Đọc câu rồi đưa đồ vật vào đúng chỗ"
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
      instructions="Bé hãy đọc câu, chọn đồ vật rồi chọn chỗ để nhé!"
      audioInstruction={current?.sentence}
      praiseSubject="VIETNAMESE"
    >
      {showIntro ? (
        <div className="w-full max-w-xl bg-white/95 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-orange-300 text-center flex flex-col items-center gap-4">
          <span className="text-6xl" aria-hidden="true">🙋</span>
          <h3 className="text-2xl md:text-3xl font-black text-orange-900">Đọc Câu Làm Theo</h3>
          <p className="text-base md:text-lg font-bold text-slate-700">
            Bé đọc câu trên bảng, bấm loa để nghe, rồi chạm vào đồ vật và
            chạm vào chỗ để trong tranh. Màn cao có câu 2 việc, màu sắc và số lượng!
          </p>
          <div className="px-4 py-2 bg-amber-100 rounded-2xl border-2 border-amber-300 text-base md:text-lg font-black text-amber-900">
            “Đặt quả bóng lên ghế.”
          </div>
          <button
            onClick={() => { sound.playClick(); setShowIntro(false); }}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-lg font-black rounded-2xl shadow-lg active:scale-95"
          >
            Bắt đầu ▶
          </button>
        </div>
      ) : (
        current && <ReadAndDoStage stage={stage} current={current} />
      )}
    </GameModalWrapper>
  );
};

/** Vòng chơi thật — nằm TRONG GameModalWrapper nên mới dùng được useGameFeedback. */
const ReadAndDoStage: React.FC<{ stage: GameStage; current: ReadDoRound }> = ({ stage, current }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [doneMoves, setDoneMoves] = useState<number>(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [qa] = useState(isQaMode);

  useEffect(() => {
    setSelectedObject(null);
    setDoneMoves(0);
    // "Chơi lại" đổi nonce nhưng id vòng có thể trùng → reset theo cả hai.
  }, [current.id, stage.nonce]);

  const pendingMove = current.moves[doneMoves];
  const pendingObject = pendingMove
    ? current.objects.find((o) => o.id === pendingMove.objectId)
    : undefined;
  const roundDone = doneMoves >= current.moves.length;

  const handleObjectPick = (objectId: string) => {
    if (stage.locked || roundDone) return;
    sound.playClick();
    setSelectedObject(objectId);
    const obj = current.objects.find((o) => o.id === objectId);
    if (obj) sound.speak(obj.label, 'vi-VN');
  };

  // Câu 2 bước yêu cầu ĐÚNG THỨ TỰ: chỉ bước kế tiếp (pendingMove) mới được tính.
  const isCorrectDrop = (objectId: string, placeId: string) =>
    !!pendingMove && pendingMove.objectId === objectId && pendingMove.placeId === placeId;

  const dropObjectOnPlace = (objectId: string, placeId: string) => {
    if (stage.locked || roundDone) return;
    if (isCorrectDrop(objectId, placeId)) {
      sound.playCorrect();
      const finishedMoves = doneMoves + 1;
      setDoneMoves(finishedMoves);
      setSelectedObject(null);
      if (finishedMoves >= current.moves.length) {
        sound.playStar();
        sound.speak('Bé làm đúng rồi! Tuyệt vời!');
        reportCorrect(current.sentence);
        stage.submitCorrect();
      } else {
        sound.speak('Đúng rồi! Còn một việc nữa, bé đọc tiếp nhé!');
        reportCorrect(current.sentence);
      }
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      const obj = current.objects.find((o) => o.id === objectId);
      const place = current.places.find((p) => p.id === placeId);
      reportWrong(`${obj?.label ?? ''} tới ${place?.label ?? ''}`, current.sentence);
      sound.speak(`Chưa đúng rồi. Bé đọc lại nhé: ${current.sentence}`);
      stage.submitWrong();
    }
  };

  const handlePlacePick = (placeId: string) => {
    if (!selectedObject) {
      sound.speak('Bé hãy chọn một đồ vật trước, rồi chọn chỗ để nhé!');
      return;
    }
    dropObjectOnPlace(selectedObject, placeId);
  };

  useEffect(() => {
    if (stage.locked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1) return;
      e.preventDefault();
      if (selectedObject === null) {
        const obj = current.objects[n - 1];
        if (obj) handleObjectPick(obj.id);
      } else {
        const place = current.places[n - 1];
        if (place) handlePlacePick(place.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const placedObjectIds = new Set(current.moves.slice(0, doneMoves).map((m) => m.objectId));

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3">
      {/* Sentence board + speaker */}
      <div className="w-full bg-amber-900 rounded-3xl px-5 py-3 shadow-md border-4 border-amber-700 flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">{current.sceneEmoji}</span>
        <p className="flex-1 text-base md:text-xl font-black text-amber-50 leading-snug">
          {current.sentence}
          {current.moves.length > 1 && (
            <span className="block text-xs md:text-sm font-bold text-amber-200">
              Đã xong {doneMoves}/{current.moves.length} việc
            </span>
          )}
        </p>
        <button
          onClick={() => sound.speak(current.sentence, 'vi-VN')}
          aria-label="Nghe câu hướng dẫn"
          title="Bấm loa để nghe câu"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-full shrink-0"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Scene: decorative SVG + places */}
      <div className="w-full bg-gradient-to-b from-sky-200 to-emerald-100 rounded-3xl border-2 border-emerald-200 p-3">
        <svg viewBox="0 0 400 60" className="w-full h-10 mb-1" aria-hidden="true" focusable="false">
          <circle cx="350" cy="22" r="14" fill="#FDE047" />
          <circle cx="350" cy="22" r="20" fill="#FDE047" opacity="0.25" />
          <ellipse cx="70" cy="20" rx="26" ry="10" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="95" cy="24" rx="20" ry="8" fill="#FFFFFF" opacity="0.9" />
          <rect x="20" y="34" width="60" height="26" rx="4" fill="#FDBA74" />
          <polygon points="14,36 50,14 86,36" fill="#EF4444" />
          <rect x="42" y="44" width="16" height="16" rx="2" fill="#92400E" />
          <circle cx="200" cy="48" r="10" fill="#34D399" />
          <rect x="197" y="50" width="6" height="10" fill="#92400E" />
        </svg>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Các chỗ để trong tranh">
          {current.places.map((place, i) => {
            const filled = current.moves
              .slice(0, doneMoves)
              .filter((m) => m.placeId === place.id)
              .map((m) => current.objects.find((o) => o.id === m.objectId))
              .filter(Boolean);
            const isNextTarget = pendingMove?.placeId === place.id;
            return (
              <button
                key={place.id}
                onClick={() => handlePlacePick(place.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const objectId = e.dataTransfer.getData('text/read-do-object');
                  if (objectId) {
                    setSelectedObject(objectId);
                    dropObjectOnPlace(objectId, place.id);
                  }
                }}
                disabled={stage.locked || roundDone}
                data-testid="answer-option"
                {...(qa ? { 'data-correct': isNextTarget } : {})}
                aria-label={`Chỗ ${place.label}, phím ${i + 1}`}
                className={`min-h-[88px] rounded-2xl border-2 p-2 flex flex-col items-center justify-center gap-1 transition-all motion-reduce:transition-none active:scale-95 cursor-pointer ${
                  isNextTarget && selectedObject && showCorrectAnswer
                    ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50'
                    : selectedObject
                      ? 'bg-white border-dashed border-orange-500 hover:bg-orange-50 shadow-md'
                      : 'bg-white/80 border-emerald-300 text-slate-600'
                }`}
              >
                <span className="text-3xl md:text-4xl" aria-hidden="true">{place.emoji}</span>
                <span className="text-xs md:text-sm font-black text-slate-700">{place.label}</span>
                {filled.length > 0 && (
                  <span className="flex items-center gap-1 text-lg" aria-label={`Đã có ${filled.map((f) => f!.label).join(', ')}`}>
                    {filled.map((f) => (
                      <span key={f!.id} aria-hidden="true">{f!.emoji}</span>
                    ))}
                    <span className="text-emerald-600 font-black" aria-hidden="true">✓</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Objects */}
      <div key={shakeKey} className={`w-full ${shakeKey > 0 ? 'animate-shake' : ''}`}>
        <p className="text-center text-sm md:text-base font-black text-orange-900 mb-2">
          {selectedObject
            ? `Đã chọn “${current.objects.find((o) => o.id === selectedObject)?.label}” — bé chạm vào chỗ để nhé!`
            : pendingObject
              ? `Bé cần đưa: “${pendingObject.label}” — chạm vào vật này trước nhé!`
              : 'Bé chạm vào một đồ vật:'}
        </p>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Các đồ vật">
          {current.objects.map((obj, i) => {
            const placed = placedObjectIds.has(obj.id);
            const selected = selectedObject === obj.id;
            const isNext = pendingMove?.objectId === obj.id;
            return (
              <button
                key={obj.id}
                onClick={() => handleObjectPick(obj.id)}
                draggable={!placed && !stage.locked && !roundDone}
                onDragStart={(e) => e.dataTransfer.setData('text/read-do-object', obj.id)}
                disabled={placed || stage.locked || roundDone}
                data-testid="answer-option"
                {...(qa ? { 'data-correct': isNext } : {})}
                aria-label={`Vật ${obj.label}, phím ${i + 1}`}
                className={`min-h-[88px] rounded-2xl border-2 p-2 flex flex-col items-center justify-center gap-1 transition-all motion-reduce:transition-none active:scale-95 ${
                  placed
                    ? 'opacity-30 bg-slate-100 border-slate-200 cursor-default'
                    : selected
                      ? 'bg-amber-300 border-amber-600 scale-105 shadow-lg cursor-pointer'
                      : showCorrectAnswer && isNext
                        ? 'border-4 border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 cursor-pointer'
                        : 'bg-white border-orange-300 hover:border-orange-500 hover:scale-105 shadow-md cursor-pointer'
                }`}
              >
                <span className="text-3xl md:text-4xl" aria-hidden="true">{obj.emoji}</span>
                <span className="text-xs md:text-sm font-black text-slate-700 text-center leading-tight">{obj.label}</span>
                <span className="text-[10px] text-slate-400 font-bold">phím {i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs md:text-sm font-bold text-slate-500">
        🙋 Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal} · Chạm 2 lần, kéo-thả hoặc dùng phím số
      </p>
    </div>
  );
};
