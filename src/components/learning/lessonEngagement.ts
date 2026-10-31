// T27 — số liệu vui của bài học: đồng hồ dễ đọc và xếp hạng 3 sao theo tỉ lệ
// câu đúng. Tách khỏi component để test được hành vi mà không cần render.

export function formatElapsed(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** 3 sao từ 80% câu đúng, 2 sao từ 50%, còn lại 1 sao (bé luôn có sao để vui). */
export function lessonStarRating(score: number, total: number): 1 | 2 | 3 {
  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return 1;
  const ratio = Math.max(0, Math.min(1, score / total));
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

export function lessonRatingLabel(stars: 1 | 2 | 3): string {
  if (stars === 3) return 'Ba sao! Bé học siêu quá!';
  if (stars === 2) return 'Hai sao! Bé học rất giỏi!';
  return 'Một sao! Bé thử lại cho chắc nhé!';
}
