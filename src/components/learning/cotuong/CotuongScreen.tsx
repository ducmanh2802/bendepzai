import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { sound } from '../../../services/sound';
import { CotuongGame } from './CotuongGame';

const PIECES = [
  { name: 'Tướng', symbol: '帥/將', moves: '1 ô trong cung', desc: 'Vua của bên mình, phải được bảo vệ.' },
  { name: 'Sĩ', symbol: '仕/士', moves: 'Chéo 1 ô trong cung', desc: 'Bảo vệ Tướng trong cung.' },
  { name: 'Tượng', symbol: '相/象', moves: 'Chéo 2 ô', desc: 'Không qua sông; có thể bị cản mắt.' },
  { name: 'Mã', symbol: '馬', moves: 'Hình chữ L', desc: 'Có thể bị cản chân.' },
  { name: 'Xe', symbol: '車', moves: 'Ngang/dọc', desc: 'Đi xa nếu đường thông.' },
  { name: 'Pháo', symbol: '炮', moves: 'Ngang/dọc; ăn phải có ngòi', desc: 'Ăn quân khi có đúng 1 quân làm ngòi.' },
  { name: 'Tốt/Binh', symbol: '兵/卒', moves: 'Thẳng 1 ô; qua sông đi ngang', desc: 'Không đi lùi.' },
];

export const CotuongScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<'pieces' | 'rules' | 'play'>('pieces');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => { sound.playClick(); onBack(); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h1 className="text-2xl font-black font-display text-slate-900">♟ Học Cờ Tướng</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['pieces', 'rules', 'play'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { sound.playClick(); setTab(t); }}
            className={`px-4 py-2 rounded-xl font-bold ${tab === t ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {t === 'pieces' ? 'Quân cờ' : t === 'rules' ? 'Luật chơi' : 'Chơi với máy'}
          </button>
        ))}
      </div>

      {tab === 'pieces' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PIECES.map((p) => (
            <div key={p.name} className="p-4 rounded-2xl bg-white border-2 border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{p.symbol}</span>
                <div>
                  <h3 className="font-black text-lg">{p.name}</h3>
                  <p className="text-sm text-slate-600">{p.moves} — {p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'rules' && (
        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Mục tiêu: chiếu hết Tướng đối thủ.</li>
            <li>Tướng và Sĩ chỉ đi trong cung.</li>
            <li>Tượng không qua sông; có thể bị cản mắt.</li>
            <li>Mã đi chữ L; có thể bị cản chân.</li>
            <li>Pháo ăn quân khi có đúng một quân làm ngòi.</li>
            <li>Tốt qua sông được đi ngang; không đi lùi.</li>
            <li>Hai Tướng không được nhìn thẳng mặt nhau.</li>
            <li>Không được để Tướng mình bị chiếu.</li>
          </ul>
        </div>
      )}

      {tab === 'play' && <CotuongGame onBack={() => setTab('pieces')} />}
    </div>
  );
};

export default CotuongScreen;
