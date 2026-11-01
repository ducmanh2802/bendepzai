import { useCallback, useEffect, useRef } from 'react';

/**
 * T33 — mỗi lượt chơi chỉ được có MỘT hẹn giờ phản hồi còn sống.
 *
 * Vì sao cần: đáp án SAI không khoá bàn chơi (`submitWrong` chỉ đếm lỗi), nên bé
 * bấm tiếp ngay sau đó vài trăm ms. `setTimeout` trần của lần bấm trước vẫn chạy
 * và gọi `setPicked(null)` — phương án bé vừa chọn mất highlight, trông như app
 * chưa nhận nên bé bấm thêm lần nữa, mỗi lần bấm lại cộng thêm một lỗi và sao
 * tụt 3→2→1 trên cùng một câu. Hẹn giờ cũ cũng sống sót khi sang lượt/màn mới
 * hoặc khi đóng bảng chơi (hiệu ứng của câu trước rò sang câu sau).
 *
 * `reset` chạy khi đổi lượt/màn để trạng thái trực quan của câu trước bị dọn
 * ngay, không chờ hẹn giờ muộn của nó.
 */
export function useRoundFeedbackTimer(reset: () => void, resetKeys: unknown[] = []) {
  const timerRef = useRef<number | null>(null);
  const resetRef = useRef(reset);
  resetRef.current = reset;

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Lên lịch phản hồi mới: cướp chỗ hẹn giờ còn đang chờ của lượt trước. */
  const schedule = useCallback(
    (action: () => void, ms: number) => {
      cancel();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        action();
      }, ms);
    },
    [cancel]
  );

  useEffect(() => {
    cancel();
    resetRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancel, ...resetKeys]);

  // Bảng chơi đóng khi hẹn giờ còn chờ → đừng bắn state vào màn hình kế tiếp.
  useEffect(() => () => cancel(), [cancel]);

  return { schedule, cancel };
}
