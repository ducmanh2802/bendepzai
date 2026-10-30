import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Gamepad2, Lightbulb, Target } from 'lucide-react';
import { sound } from '../../../services/sound';
import { CotuongGame } from './CotuongGame';
import { CotuongPuzzlesView } from './CotuongPuzzlesView';

const PIECES = [
  {
    name: 'Tướng',
    symbol: '帥 / 將',
    moves: 'Đi 1 ô trong cung',
    desc: 'Là vua của bên mình. Tướng bị chiếu hết là thua, nên phải luôn được bảo vệ.',
  },
  {
    name: 'Sĩ',
    symbol: '仕 / 士',
    moves: 'Đi chéo 1 ô trong cung',
    desc: 'Người hộ vệ trung thành, chỉ loanh quanh trong cung để che cho Tướng.',
  },
  {
    name: 'Tượng',
    symbol: '相 / 象',
    moves: 'Đi chéo 2 ô',
    desc: 'Không được qua sông. Nếu có quân ở giữa (mắt tượng) thì không đi được.',
  },
  {
    name: 'Mã',
    symbol: '馬',
    moves: 'Đi hình chữ L',
    desc: 'Nhảy 2 ô thẳng + 1 ô ngang. Nếu có quân chặn ở chân mã thì không nhảy được.',
  },
  {
    name: 'Xe',
    symbol: '車',
    moves: 'Đi ngang hoặc dọc',
    desc: 'Đi xa bao nhiêu ô cũng được miễn là đường thông. Quân mạnh nhất bàn cờ.',
  },
  {
    name: 'Pháo',
    symbol: '炮 / 砲',
    moves: 'Đi như Xe, ăn cần ngòi',
    desc: 'Muốn ăn quân phải nhảy qua đúng 1 quân làm ngòi. Đi không thì như Xe.',
  },
  {
    name: 'Tốt / Binh',
    symbol: '兵 / 卒',
    moves: 'Tiến 1 ô, qua sông đi ngang',
    desc: 'Không bao giờ đi lùi. Khi đã qua sông thì được đi ngang nữa.',
  },
];

const RULES = [
  { icon: '🎯', text: 'Mục tiêu: chiếu hết Tướng của đối phương.' },
  { icon: '🏯', text: 'Tướng và Sĩ chỉ được đi trong cung (ô vuông 3×3 ở mỗi bên).' },
  { icon: '🌊', text: 'Tượng không qua sông; Mã có thể bị chặn chân, Tượng bị chặn mắt.' },
  { icon: '💥', text: 'Pháo ăn quân khi có đúng một quân làm ngòi ở giữa.' },
  { icon: '👣', text: 'Tốt qua sông được đi ngang, nhưng không bao giờ đi lùi.' },
  { icon: '👀', text: 'Hai Tướng không được nhìn thẳng mặt nhau khi giữa không có quân.' },
  { icon: '🛡️', text: 'Không được đi nước khiến Tướng mình bị chiếu.' },
];

const TABS = [
  { id: 'pieces' as const, label: 'Quân cờ', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'rules' as const, label: 'Luật chơi', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'play' as const, label: 'Chơi 3D', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'puzzles' as const, label: 'Luyện thế cờ', icon: <Target className="w-4 h-4" /> },
];

export const CotuongScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<'pieces' | 'rules' | 'play' | 'puzzles'>('pieces');

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
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
          ♟️ Vương Quốc Cờ Tướng
        </h1>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 sm:p-7 text-white shadow-xl border-4 border-white/60">
        <div className="absolute -right-6 -top-8 text-[8rem] opacity-20 select-none" aria-hidden="true">
          帥
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-display">Học cờ — Chơi cờ 3D</h2>
        <p className="mt-1 max-w-xl text-sm sm:text-base font-bold text-white/90">
          Bàn cờ gỗ nổi 3D, quân cờ có chiều dày, có gợi ý và đi lại khi lỡ tay. Bé chơi quân Đỏ
          và được đi trước!
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm font-black">
          <span className="rounded-full bg-white/20 px-3 py-1">🧠 4 mức độ</span>
          <span className="rounded-full bg-white/20 px-3 py-1">💡 Nút gợi ý</span>
          <span className="rounded-full bg-white/20 px-3 py-1">↩️ Đi lại</span>
          <span className="rounded-full bg-white/20 px-3 py-1">🎉 Hiệu ứng chiến thắng</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              sound.playClick();
              setTab(t.id);
            }}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${
              tab === t.id
                ? 'bg-amber-500 text-white shadow'
                : 'bg-white/80 text-slate-700 border-2 border-amber-200 hover:bg-amber-50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'pieces' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
          {PIECES.map((p) => (
            <div
              key={p.name}
              className="flex items-start gap-3 p-4 rounded-2xl bg-white/85 border-2 border-amber-200 shadow-sm kb-card-hover"
            >
              <span
                className="ct-mini-disc shrink-0"
                style={{ width: 48, height: 48, fontSize: 24 }}
              >
                {p.symbol.split(' ')[0]}
              </span>
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {p.name}{' '}
                  <span className="text-xs font-bold text-slate-400">{p.symbol}</span>
                </h3>
                <p className="text-sm font-bold text-amber-700">{p.moves}</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'rules' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/85 border-2 border-amber-200 shadow-sm">
          <ul className="space-y-3">
            {RULES.map((r) => (
              <li key={r.text} className="flex items-start gap-3 text-sm sm:text-base font-bold text-slate-700">
                <span className="text-xl leading-none" aria-hidden="true">
                  {r.icon}
                </span>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              sound.playClick();
              setTab('play');
            }}
            className="mt-5 w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-lg"
          >
            Hiểu rồi — Chơi thử 3D ▶
          </button>
        </div>
      )}

      {tab === 'play' && <CotuongGame embedded onBack={() => setTab('pieces')} />}
      {tab === 'puzzles' && <CotuongPuzzlesView />}
    </div>
  );
};

export default CotuongScreen;
