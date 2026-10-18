import React, { useState, useEffect } from 'react';
import { sound } from '../../../services/sound';

const DEMOS = [
  { piece: '♜', label: 'Xe đi thẳng theo hàng/cột', from: [3, 3], to: [0, 3] },
  { piece: '♞', label: 'Mã đi hình chữ L', from: [4, 3], to: [2, 4] },
  { piece: '♝', label: 'Tượng đi theo đường chéo', from: [5, 2], to: [2, 5] },
  { piece: '♛', label: 'Hậu đi mọi hướng', from: [4, 4], to: [1, 4] },
  { piece: '♟', label: 'Tốt tiến lên 1 ô', from: [6, 4], to: [5, 4] },
  { piece: '♚', label: 'Vua đi 1 ô mọi hướng', from: [7, 4], to: [6, 5] },
];

export const ChessMoveDemo: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const [t, setT] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setT((prev) => {
        if (prev >= 1) {
          setIdx((i) => (i + 1) % DEMOS.length);
          return 0;
        }
        return prev + 0.02;
      });
    }, 30);
    return () => clearInterval(id);
  }, []);

  const d = DEMOS[idx];
  const r = d.from[0] + (d.to[0] - d.from[0]) * t;
  const c = d.from[1] + (d.to[1] - d.from[1]) * t;

  return (
    <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-3">
      <h3 className="font-black text-lg">Demo nước đi: {d.label}</h3>
      <div className="relative mx-auto" style={{ width: 'min(90vw, 320px)', aspectRatio: '1' }}>
        <div className="grid grid-cols-8 w-full h-full border-2 border-slate-700 rounded-lg overflow-hidden">
          {Array.from({ length: 64 }).map((_, i) => {
            const rr = Math.floor(i / 8), cc = i % 8;
            const dark = (rr + cc) % 2 === 1;
            return <div key={i} className={dark ? 'bg-[#769656]' : 'bg-[#eeeed2]'} />;
          })}
        </div>
        <div
          className="absolute text-3xl transition-none pointer-events-none"
          style={{ left: `${c * 12.5}%`, top: `${r * 12.5}%`, width: '12.5%', height: '12.5%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="text-white drop-shadow-md">{d.piece}</span>
        </div>
        {/* start/end markers */}
        <div className="absolute border-2 border-yellow-400" style={{ left: `${d.from[1] * 12.5}%`, top: `${d.from[0] * 12.5}%`, width: '12.5%', height: '12.5%' }} />
        <div className="absolute border-2 border-emerald-400" style={{ left: `${d.to[1] * 12.5}%`, top: `${d.to[0] * 12.5}%`, width: '12.5%', height: '12.5%' }} />
      </div>
      <div className="text-xs text-slate-500 text-center">Ô vàng = bắt đầu, ô xanh = kết thúc. Demo tự động chuyển quân.</div>
    </div>
  );
};

export default ChessMoveDemo;
