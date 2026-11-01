import React from 'react';
import type { ReactNode } from 'react';

interface PieceInfo {
  name: string;
  symbol: string;
  moves: string;
  description: string;
}

const PIECES: PieceInfo[] = [
  { name: 'Tốt', symbol: '♙', moves: '1 ô thẳng, ăn chéo 1 ô', description: 'Đi thẳng phía trước 1 ô, nước đầu có thể đi 2 ô. Chỉ ăn quân theo đường chéo 1 ô.' },
  { name: 'Xe', symbol: '♖', moves: 'Ngang và dọc', description: 'Đi ngang hoặc dọc bất kỳ số ô, miễn là không bị quân khác chắn đường.' },
  { name: 'Tượng', symbol: '♗', moves: 'Đường chéo', description: 'Đi chéo bất kỳ số ô. Tượng luôn ở ô cùng màu với ô nó xuất phát.' },
  { name: 'Mã', symbol: '♘', moves: 'Chữ L (2 + 1)', description: 'Đi 2 ô theo hàng hoặc cột rồi lệch 1 ô. Mã là quân duy nhất nhảy được qua quân khác.' },
  { name: 'Hậu', symbol: '♕', moves: '8 hướng', description: 'Mạnh nhất: đi ngang, dọc và chéo như Xe cộng Tượng, không bị chắn thì đi bao xa cũng được.' },
  { name: 'Vua', symbol: '♔', moves: '1 ô mọi hướng', description: 'Chỉ đi được 1 ô mỗi nước. Vua bị bắt là hết ván, nên phải luôn có quân khác bảo vệ.' },
];

export const ChessTutorial: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Học Cờ Vua Tiếng Việt</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {PIECES.map((piece) => (
          <div key={piece.name} className="p-4 border rounded-2xl border-slate-200 hover:border-amber-400 transition-colors">
            <div className="text-4xl mb-2">{piece.symbol}</div>
            <h3 className="font-medium">{piece.name}</h3>
            <p className="text-sm text-slate-600">{piece.description}</p>
            <p className="text-xs text-amber-600">{piece.moves}</p>
          </div>
        ))}
      </div>

      <div className="prose max-w-none">
        <h3 className="text-xl font-bold mb-4">Luật cơ bản</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Mục tiêu: vây được Vua của đối thủ để kết thúc ván cờ</li>
          <li>Mỗi quân có cách đi riêng theo đúng luật cờ vua</li>
          <li>Không được đi xuyên qua quân của mình, trừ Mã</li>
          <li>Ăn quân là khi đi vào ô mà quân đối thủ đang đứng</li>
        </ul>
      </div>

      <div className="mt-8 text-center">
        <button className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors">
          Tiếp theo →
        </button>
      </div>
    </div>
  );
};

export default ChessTutorial;