import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { sound } from '../../../services/sound';
import { ChessGame } from './ChessGame';
import { ChessMoveDemo } from './ChessMoveDemo';
import { ChessPieceSvg } from './ChessPieceSvg';
import type { PieceType } from './chessEngine';

interface PieceInfo {
  name: string;
  type: PieceType;
  moves: string;
  description: string;
}

// Vẽ quân bằng ChessPieceSvg thay ký tự Unicode: bé nhìn thấy đúng hình quân cờ gỗ
// như trong bàn đấu, và hình không bị lỗi font trên máy cấu hình thấp.
const PIECES: PieceInfo[] = [
  { name: 'Xe', type: 'r', moves: 'Hàng / cột', description: 'Đi thẳng bất kỳ số ô theo hàng hoặc cột.' },
  { name: 'Mã', type: 'n', moves: 'Hình chữ L', description: '2 ô một hướng rồi 1 ô vuông góc.' },
  { name: 'Tượng', type: 'b', moves: 'Đường chéo', description: 'Đi chéo bất kỳ số ô.' },
  { name: 'Hậu', type: 'q', moves: 'Mọi hướng', description: 'Kết hợp Xe và Tượng.' },
  { name: 'Vua', type: 'k', moves: '1 ô', description: 'Di chuyển 1 ô theo mọi hướng.' },
  { name: 'Tốt', type: 'p', moves: 'Tiến 1 ô', description: 'Đi thẳng 1 ô; bắt chéo 1 ô.' },
];

interface QuizItem {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ: QuizItem[] = [
  { question: 'Quân nào đi hình chữ L?', options: ['Xe', 'Mã', 'Tượng', 'Hậu'], answer: 1 },
  { question: 'Quân nào đi theo đường chéo?', options: ['Xe', 'Mã', 'Tượng', 'Vua'], answer: 2 },
  { question: 'Mục tiêu của cờ vua là gì?', options: ['Bắt nhiều quân', 'Chiếu hết Vua đối', 'Chiếm trung tâm', 'Phong Tốt'], answer: 1 },
];

export const ChessScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<'pieces' | 'rules' | 'illustrate' | 'demo' | 'quiz' | 'play'>('pieces');
  const [selected, setSelected] = useState<PieceInfo | null>(PIECES[0]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const handlePick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === QUIZ[quizIndex].answer) {
      setScore((s) => s + 1);
      sound.playCorrect?.();
    } else {
      sound.playWrong?.();
    }
  };

  const nextQuiz = () => {
    setPicked(null);
    setQuizIndex((i) => (i + 1) % QUIZ.length);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => { sound.playClick(); onBack(); }}
          className="px-4 py-2 bg-white hover:bg-slate-100 border-2 border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 inline-flex">
            <ChessPieceSvg type="p" color="w" className="w-full h-full" />
          </span>
          <span>Cờ Vua 3D & Bài Học</span>
        </h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['play', 'pieces', 'rules', 'illustrate', 'demo', 'quiz'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { sound.playClick(); setTab(t); }}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              tab === t
                ? 'bg-amber-500 text-white shadow-md scale-105'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {t === 'play'
              ? '🎮 Đấu Cờ 3D'
              : t === 'pieces'
              ? 'Quân cờ'
              : t === 'rules'
              ? 'Luật chơi'
              : t === 'illustrate'
              ? 'Minh họa'
              : t === 'demo'
              ? 'Nước đi mẫu'
              : 'Câu đố'}
          </button>
        ))}
      </div>

      {tab === 'pieces' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PIECES.map((p) => (
            <button
              key={p.name}
              onClick={() => { sound.playClick(); setSelected(p); }}
              className={`p-4 rounded-2xl border-2 text-center ${selected?.name === p.name ? 'border-[#8b5a2b] bg-[#f7ecd6]' : 'border-slate-200 bg-white'}`}
            >
              <div className="mx-auto w-14 h-14">
                <ChessPieceSvg type={p.type} color="w" className="w-full h-full" />
              </div>
              <div className="font-bold mt-1">{p.name}</div>
              <div className="text-xs text-slate-500">{p.moves}</div>
            </button>
          ))}
          {selected && (
            <div className="col-span-full p-4 rounded-2xl bg-white border-2 border-slate-200">
              <div className="flex items-center gap-3">
                <span className="w-16 h-16 shrink-0 inline-flex">
                  <ChessPieceSvg type={selected.type} color="w" className="w-full h-full" />
                </span>
                <div>
                  <h3 className="font-black text-lg">{selected.name}</h3>
                  <p className="text-sm text-slate-600">{selected.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'rules' && (
        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Mục tiêu: chiếu hết Vua đối thủ.</li>
            <li>Mỗi quân có cách di chuyển riêng.</li>
            <li>Không đi xuyên qua quân của chính mình.</li>
            <li>Bắt quân khi di chuyển vào ô quân đối.</li>
            <li>Tốt có thể phong cấp khi đến hàng cuối.</li>
          </ul>
        </div>
      )}

      {tab === 'illustrate' && (
        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-4">
          <h3 className="font-black text-lg">Minh họa: Xe (Rook) đi được những ô nào?</h3>
          <div className="grid grid-cols-8 gap-[2px] p-[2px] rounded-lg bg-[#2f1d10] max-w-xs mx-auto">
            {Array.from({ length: 64 }).map((_, i) => {
              const r = Math.floor(i / 8), c = i % 8;
              const isRook = r === 3 && c === 3;
              const sameRow = r === 3 && c !== 3;
              const sameCol = c === 3 && r !== 3;
              const dark = (r + c) % 2 === 1;
              return (
                <div key={i} className={`relative aspect-square rounded-[2px] flex items-center justify-center ${isRook ? 'bg-[#5b3a21]' : dark ? 'bg-[#7b4a26]' : 'bg-[#f5e6c8]'}`}>
                  {(sameRow || sameCol) && (
                    <span className="absolute inset-[1px] rounded-[2px] bg-emerald-400/70 pointer-events-none" />
                  )}
                  {isRook && (
                    <span className="relative w-[80%] h-[80%] inline-flex">
                      <ChessPieceSvg type="r" color="w" className="w-full h-full" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-slate-600">Xe ở ô giữa (nâu) có thể đi tới các ô phủ xanh lá cùng hàng/cột.</p>

          <h3 className="font-black text-lg mt-4">Gợi ý nước đi tiếp theo</h3>
          <p className="text-sm text-slate-600">
            Nếu bạn đang có Hậu ở vị trí an toàn và đối thủ Vua ở trung tâm, hãy ưu tiên chiếu Vua hoặc bắt quân giá trị cao, đồng thời giữ an toàn cho Vua của mình.
          </p>
        </div>
      )}

      {tab === 'demo' && <ChessMoveDemo />}

      {tab === 'play' && <ChessGame onBack={() => setTab('pieces')} />}

      {tab === 'quiz' && (
        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-4">
          <div className="text-sm font-bold text-slate-500">Điểm: {score}/{QUIZ.length}</div>
          <h3 className="font-black text-lg">{QUIZ[quizIndex].question}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUIZ[quizIndex].options.map((opt, i) => {
              const isCorrect = picked !== null && i === QUIZ[quizIndex].answer;
              const isWrong = picked === i && i !== QUIZ[quizIndex].answer;
              return (
                <button
                  key={opt}
                  onClick={() => handlePick(i)}
                  disabled={picked !== null}
                  className={`p-3 rounded-xl border-2 font-bold flex items-center gap-2 ${
                    isCorrect ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  {picked !== null && (isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : isWrong ? <XCircle className="w-5 h-5 text-rose-600" /> : null)}
                  {opt}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <button onClick={nextQuiz} className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl">
              Tiếp theo →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChessScreen;
