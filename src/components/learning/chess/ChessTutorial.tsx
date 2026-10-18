import React from 'react';
import type { ReactNode } from 'react';

interface PieceInfo {
  name: string;
  symbol: string;
  moves: string;
  description: string;
}

const PIECES: PieceInfo[] = [
  { name: 'Xe', symbol: '♜', moves: '4 hướng (hàng/cột)', description: 'Di chuyển bất kỳ số lượng ô nào theo hàng hoặc cột' },
  { name: ' Mã', symbol: '♞', moves: 'L-shaped (2+1)', description: '2 ô một hướng, 1 ô vuông góc rồi đi thẳng' },
  { name: 'Phủ', symbol: '♛', moves: 'Tất cả 8 hướng', description: 'Di chuyển theo đường chéo hoặc thẳng theo mọi khoảng cách' },
  { name: 'Nhất', symbol: '♕', moves: 'Tất cả 8 hướng + hàng/cột', description: 'Kết hợp quyền của Phủ và Nhất' },
  { name: 'Tốt', symbol: '♖', moves: '4 hướng (hàng/cột)', description: 'Giống Xe nhưng chỉ di chuyển sau khi Tốt qua được' },
  { name: 'Pháo', symbol: '♗', moves: 'Quan sát qua 1 ô', description: 'Di chuyển như Xe nhưng phải có quân cản để bắt' },
  { name: 'Sĩ', symbol: '♘', moves: '2 ô tiến, 1 ô lệch', description: 'Chỉ có thể đi tiến 2 ô, rồi lệch 1 ô bất kỳ hướng nào' },
  { name: 'Tốt phát', symbol: '♔', moves: '1 ô bất kỳ hướng nào', description: 'Vua có thể di chuyển 1 ô theo bất kỳ hướng nào' },
  { name: 'Vua đối', symbol: '♚', moves: '1 ô bất kỳ hướng nào', description: 'Vua đối trong cờ vua có cùng quyền di chuyển Vua phát' },
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
        <h3 className="text-xl font-bold mb-4">Quan điểm cơ bản</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Mục tiêu: Tấn công Vua đối (Vua đen) của đối thủ</li>
          <li>Mỗi quân có cách di chuyển riêng theo rules cờ vua chuẩn</li>
          <li>Không thể di chuyển xuyên qua quân của chính mình</li>
          <li>Bắt quân đối là khi di chuyển vào ô quân đối đang giữ</li>
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