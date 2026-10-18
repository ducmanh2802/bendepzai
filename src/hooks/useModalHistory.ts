import { useEffect, useRef } from 'react';

/**
 * T01B/1 — Esc + nút Back của trình duyệt/điện thoại đóng modal game & bài học.
 *
 * Khi modal mở, đẩy 1 entry vào history. Nhấn Back (popstate) hoặc Esc sẽ gọi
 * `onExit`. Nút đóng trong modal nên gọi `requestClose()` trả về để tự bóc
 * entry đã đẩy (tránh kẹt 1 entry thừa trong history).
 *
 * An toàn khi không có DOM (test/node): mọi truy cập window/history được guard.
 */
export function useModalHistory(onExit: () => void) {
  const exitRef = useRef(onExit);
  exitRef.current = onExit;
  const pushedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.history === 'undefined') return;
    try {
      window.history.pushState({ kbModal: true }, '');
      pushedRef.current = true;
    } catch {
      pushedRef.current = false;
    }

    const handlePopState = () => {
      // Chỉ phản ứng khi chính entry của modal bị bóc.
      pushedRef.current = false;
      exitRef.current();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        // Đi qua history để entry được bóc gọn, popstate sẽ gọi onExit.
        if (pushedRef.current) {
          try {
            window.history.back();
            return;
          } catch {
            /* rớt xuống gọi trực tiếp */
          }
        }
        pushedRef.current = false;
        exitRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      // Modal tự đóng mà không qua history (ví dụ nút "Tiếp tục học" gọi
      // onExit trực tiếp) mà entry còn: bóc entry để nút Back sau này không
      // phải bấm 2 lần. Trường hợp đóng qua Back/Esc/X thì pushedRef đã
      // false nên không back() lần nữa.
      if (pushedRef.current) {
        pushedRef.current = false;
        try {
          window.history.back();
        } catch {
          /* bỏ qua: entry thừa vô hại */
        }
      }
    };
  }, []);

  /**
   * Dùng cho nút đóng (X) của modal: bóc entry history để popstate gọi onExit.
   * Nếu history không dùng được thì gọi onExit trực tiếp.
   */
  const requestClose = () => {
    if (typeof window !== 'undefined' && pushedRef.current) {
      try {
        window.history.back();
        return;
      } catch {
        /* rớt xuống gọi trực tiếp */
      }
    }
    pushedRef.current = false;
    exitRef.current();
  };

  return { requestClose };
}
