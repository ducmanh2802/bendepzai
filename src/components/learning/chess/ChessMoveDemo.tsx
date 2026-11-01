import React, { useState, useEffect } from 'react';
import { sound } from '../../../services/sound';
import { ChessPieceSvg } from './ChessPieceSvg';
import type { PieceType } from './chessEngine';

const DEMOS: { type: PieceType; label: string; from: number[]; to: number[] }[] = [
  { type: 'r', label: 'Xe đi thẳng theo hàng/cột', from: [3, 3], to: [0, 3] },
  { type: 'n', label: 'Mã đi hình chữ L', from: [4, 3], to: [2, 4] },
  { type: 'b', label: 'Tượng đi theo đường chéo', from: [5, 2], to: [2, 5] },
  { type: 'q', label: 'Hậu đi mọi hướng', from: [4, 4], to: [1, 4] },
  { type: 'p', label: 'Tốt tiến lên 1 ô', from: [6, 4], to: [5, 4] },
  { type: 'k', label: 'Vua đi 1 ô mọi hướng', from: [7, 4], to: [6, 5] },
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
      <div className="relative mx-auto rounded-[22px] border-[5px] border-[#3f2817] bg-[#5b3a21] p-2" style={{ width: 'min(92vw, 330px)' }}>
        <div style={{ aspectRatio: '1' }} className="relative">
          <div className="grid grid-cols-8 w-full h-full border-[3px] border-[#241609] rounded-md overflow-hidden">
            {Array.from({ length: 64 }).map((_, i) => {
              const rr = Math.floor(i / 8), cc = i % 8;
              const dark = (rr + cc) % 2 === 1;
              return (
                <div
                  key={i}
                  className={`shadow-[inset_0_0_0_3px_rgba(36,22,9,1)] ${dark ? 'bg-[#7b4a26]' : 'bg-[#f5e6c8]'}`}
                />
              );
            })}
          </div>
          <div
            className="absolute transition-none pointer-events-none"
            style={{ left: `${c * 12.5}%`, top: `${r * 12.5}%`, width: '12.5%', height: '12.5%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChessPieceSvg type={d.type} color="w" className="w-[86%] h-[86%]" />
          </div>
          {/* ô xuất phát và ô đích */}
          <div className="absolute ring-4 ring-inset ring-sky-500" style={{ left: `${d.from[1] * 12.5}%`, top: `${d.from[0] * 12.5}%`, width: '12.5%', height: '12.5%' }} />
          <div className="absolute bg-[#7fb069]/60 ring-2 ring-inset ring-[#4e8b4a]" style={{ left: `${d.to[1] * 12.5}%`, top: `${d.to[0] * 12.5}%`, width: '12.5%', height: '12.5%' }} />
        </div>
      </div>
      <div className="text-xs text-slate-500 text-center">Ô viền xanh = bắt đầu, ô phủ xanh lá = kết thúc. Demo tự động chuyển quân.</div>
    </div>
  );
};

export default ChessMoveDemo;
