import React, { useMemo, useState } from 'react';
import { KidBoxActivityItem } from '../../types/kidBox';
import { sound } from '../../services/sound';
import { BRITISH_LOCALE } from '../../services/britishSpeech';
import { Volume2 } from 'lucide-react';

interface KidBoxWordSafariProps {
  items: KidBoxActivityItem[];
  onFinished: (tappedIds: string[]) => void;
  onReplay: (slow: boolean) => void;
}

/**
 * §16 "Word Safari" — a Kid's Box mini game.
 *
 * The child hears a British English word and taps the matching picture. Unlike
 * the legacy arcade games, this one reports which items were caught, and the
 * player turns that into a real Learning OS evidence event — a game score is
 * never treated as mastery (§17).
 *
 * Tapping is free of punishment: a wrong tap simply highlights and lets the
 * child try again, and the round is only reported once.
 */
export const KidBoxWordSafari: React.FC<KidBoxWordSafariProps> = ({ items, onFinished, onReplay }) => {
  const [tapped, setTapped] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const targetId = useMemo(() => items.find((i) => i.isCorrect)?.id, [items]);
  const target = useMemo(() => items.find((i) => i.id === targetId), [items, targetId]);

  const handleTap = (itemId: string) => {
    if (revealed) return;
    if (itemId === targetId) {
      sound.playCorrect();
      setTapped((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
      setRevealed(true);
      onFinished([...tapped, itemId]);
      return;
    }
    // §31 — encouraging, never harsh, and never counted as mastery.
    sound.playWrong();
    setWrongId(itemId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => onReplay(false)}
          className="min-h-[48px] px-4 rounded-2xl bg-amber-400 text-amber-950 font-black text-sm flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Volume2 className="w-5 h-5" />
          Nghe từ
        </button>
        <button
          onClick={() => onReplay(true)}
          className="min-h-[48px] px-4 rounded-2xl bg-white border-2 border-amber-300 text-amber-900 font-black text-sm active:scale-95 cursor-pointer"
        >
          🐢 Nghe chậm
        </button>
      </div>

      {target && (
        <p className="text-center text-xs font-bold text-slate-500">
          {revealed ? `Đã bắt được: ${target.word ?? target.captionEn}` : 'Nghe rồi bấm vào hình đúng nhé!'}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const isWrong = wrongId === item.id;
          const isCaught = tapped.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleTap(item.id)}
              disabled={revealed}
              aria-label={item.word ?? item.captionEn}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all active:scale-95 disabled:cursor-default cursor-pointer ${
                isCaught
                  ? 'border-emerald-400 bg-emerald-50'
                  : isWrong
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <span className="text-4xl" aria-hidden="true">
                {item.pictureEmoji ?? '❓'}
              </span>
              {revealed && <span className="text-xs font-black text-slate-700">{item.word ?? item.captionEn}</span>}
            </button>
          );
        })}
      </div>

      {revealed && (
        <button
          onClick={() => sound.speak(target?.speakText ?? '', BRITISH_LOCALE)}
          className="w-full min-h-[44px] rounded-2xl bg-slate-100 border-2 border-slate-300 text-slate-700 font-black text-xs active:scale-95 cursor-pointer"
        >
          Nghe lại từ vừa bắt được
        </button>
      )}
    </div>
  );
};
