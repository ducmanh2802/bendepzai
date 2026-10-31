import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (rel: string) => fs.readFileSync(path.resolve(rel), 'utf8');

describe('T31 — sửa lỗi tìm được khi quét toàn bộ probe', () => {
  describe('popup giới thiệu bài (SubjectScreen) phải là hộp thoại đúng nghĩa', () => {
    const src = read('src/components/subject/SubjectScreen.tsx');

    it('dùng useFocusTrap và gắn ref vào khối role=dialog', () => {
      expect(src).toContain("import { useFocusTrap } from '../../hooks/useFocusTrap'");
      expect(src).toMatch(/useFocusTrap<HTMLDivElement>\(!!showLessonPopup\)/);
      expect(src).toContain('ref={lessonPopupRef}');
      expect(src).toContain('tabIndex={-1}');
    });

    it('dialog có aria-label lấy từ tên bài và Esc đóng được', () => {
      expect(src).toContain('aria-label={showLessonPopup.title}');
      expect(src).toMatch(/event\.key === 'Escape'/);
      expect(src).toContain('setShowLessonPopup(null)');
    });
  });

  describe('header không đẩy nút Ba Mẹ ra ngoài màn hình', () => {
    it('nhãn chữ của AuthButton chỉ hiện từ xl (1280px), dưới đó là icon', () => {
      const auth = read('src/components/auth/AuthButton.tsx');
      expect(auth).toContain('hidden xl:inline text-amber-950 font-black whitespace-nowrap');
      expect(auth).not.toContain('min-[480px]:inline');
      expect(auth).not.toContain('min-[420px]:inline');
    });
  });

  describe('câu thoại của gấu là tiếng Việt thật và TTS đọc đúng câu', () => {
    const header = read('src/components/common/Header.tsx');
    const phraseBlock = header.slice(
      header.indexOf('const bearReactionPhrases'),
      header.indexOf('export const Header')
    );

    it('không còn ký tự Hàn hay câu tiếng Anh vô nghĩa', () => {
      expect(phraseBlock).not.toMatch(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/);
      expect(phraseBlock).not.toContain('Bouncing!');
      expect(phraseBlock).not.toContain('Hết lâu rưỡi!');
    });

    it('TTS đọc chính câu vừa chọn, không đọc "chanh"/"huh"', () => {
      expect(phraseBlock).toContain('sound.speak(phrase');
      expect(phraseBlock).not.toContain("'chanh'");
      expect(phraseBlock).not.toContain("'huh'");
      expect(phraseBlock).not.toContain('new SpeechSynthesisUtterance');
    });

    it('lời chào có dấu đúng, không còn "bé oir"', () => {
      expect(header).not.toContain('bé oir');
      expect(header).toContain('Chào buổi sáng, bé ơi!');
    });
  });

  describe('cờ vua 3D có đường lùi khi máy không có WebGL', () => {
    const canvas = read('src/components/learning/chess/chess3d/Chess3DCanvas.tsx');
    const game = read('src/components/learning/chess/ChessGame.tsx');

    it('kiểm tra context webgl trước khi dựng scene', () => {
      expect(canvas).toContain("getContext('webgl2') || probeCanvas.getContext('webgl')");
      expect(canvas).toMatch(/if \(!gl\) \{\s*onUnsupported\?\.\(\)/);
    });

    it('bắt lỗi khi tạo WebGLRenderer và chuyển sang bàn 2D', () => {
      expect(canvas).toMatch(/try \{\s*renderer = new THREE\.WebGLRenderer/);
      expect(canvas).toContain('onUnsupported?.();');
      expect(game).toContain("onUnsupported={() => setViewMode('2d')}");
    });

    it('giải phóng hình học của quân khi dựng lại thế cờ', () => {
      expect(canvas).toContain('child.geometry.dispose()');
    });
  });

  describe('probe đo đúng đại lượng, không đỏ giả', () => {
    it('mobile: so câu hỏi đã bỏ đồng hồ lesson-timer', () => {
      const src = read('qa/mobile.mjs');
      expect(src).toContain('data-testid="lesson-timer"');
      expect(src).toContain('const questionText = ()');
      expect(src).not.toMatch(/promptBefore = await page\.locator\('\[role=dialog\]'\)\.innerText/);
    });

    it('golden-path: chờ thẻ gợi ý nạp xong trước khi đọc', () => {
      const src = read('qa/golden-path.mjs');
      expect(src).toContain('data-testid="decision-engine-card"');
    });

    it('focus: nhận diện nút bài học bằng data-testid', () => {
      const src = read('qa/focus.mjs');
      expect(src).toContain('triggerTestId');
      expect(src).toContain("document.activeElement?.getAttribute('data-testid')");
    });

    it('t01b: CTA trang chủ dò theo nhãn hiện tại', () => {
      const src = read('qa/t01b-fixes.mjs');
      expect(src).toContain('Học tiếp|Bắt đầu:');
      expect(src).not.toContain('/Bản Đồ Học Tập/');
    });

    it('offline: poll trạng thái service worker thay vì đọc một lần', () => {
      const src = read('qa/offline-pwa.mjs');
      expect(src).toContain('for (let i = 0; i < 120; i += 1)');
      expect(src).toContain("reg.active.state === 'activated'");
    });

    it('p41 curriculum: chấp nhận màn kết quả còn mở sau câu cuối', () => {
      const src = read('qa/p41-curriculum-quality.mjs');
      expect(src).toContain('resultScreen');
      expect(src).toContain('!completion.lessonModalOpen || completion.resultScreen');
    });

    it('p41 font: đóng hộp mừng lên level trước khi bấm tiếp', () => {
      const src = read('qa/p41-font-visual.mjs');
      expect(src).toContain("name: 'Tuyệt Vời!'");
    });
  });
});
