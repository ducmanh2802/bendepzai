import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const lp = readFileSync(join(here, '..', 'src/components/learning/LessonPlayerModal.tsx'), 'utf8');
const probe = readFileSync(join(here, '..', 'qa/lesson-smooth.mjs'), 'utf8');

/** True when the question scroller's closing tag comes before the action bar. */
function scrollerClosesBeforeActionBar(src: string): boolean {
  const start = src.indexOf('<div ref={questionScrollRef}');
  const bar = src.indexOf('{submitButton}');
  if (start < 0 || bar < 0) return false;
  let depth = 0;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > bar) return false;
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return true;
  }
  return false;
}

describe('T29 thanh hành động luôn thấy trong bài học', () => {
  it('nút "Kiểm tra/Câu tiếp theo" nằm ngoài vùng cuộn (sibling, không phải con)', () => {
    expect(lp).toContain('<div ref={questionScrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">');
    expect(scrollerClosesBeforeActionBar(lp)).toBe(true);
    // Thanh hành động vẫn là khối dính đáy có nền riêng.
    expect(lp).toContain('className="shrink-0 border-t-2 border-amber-200 bg-white/95 backdrop-blur');
  });

  it('câu mới và lượt mới đều cuộn vùng câu hỏi về đầu', () => {
    const resets = lp.match(/questionScrollRef\.current\.scrollTop = 0/g) ?? [];
    // Một lần khi đổi câu (effect reset) + một lần khi bắt đầu lượt mới (startRun).
    expect(resets.length).toBe(2);
  });

  it('phản hồi đúng/sai được đưa vào tầm nhìn sau khi chấm', () => {
    expect(lp).toContain('<div ref={feedbackRef}>');
    expect(lp).toContain("feedbackRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })");
    expect(lp).toMatch(/useEffect\(\(\) => \{\s*if \(!isAnswerChecked\) return;/);
  });
});

describe('T29 dải combo không làm nhảy bố cục', () => {
  it('combo nằm trong ô cao cố định, không phải hàng chèn thêm', () => {
    expect(lp).toContain('data-testid="lesson-combo-slot"');
    expect(lp).toContain('className={`h-6 shrink-0 overflow-hidden flex items-center justify-center');
    const slot = lp.indexOf('data-testid="lesson-combo-slot"');
    const banner = lp.indexOf('data-testid="lesson-combo"');
    const bar = lp.indexOf('{submitButton}');
    expect(slot).toBeGreaterThan(-1);
    expect(banner).toBeGreaterThan(slot);
    expect(bar).toBeGreaterThan(banner);
    // Kiểu cũ (dải nằm ngoài, chèn thêm một hàng) phải biến mất.
    expect(lp).not.toContain('combo >= 2 && !isFinished');
  });
});

describe('T29 đồng hồ không kéo cả modal re-render', () => {
  it('đồng hồ nằm trong component riêng và dừng ở màn kết quả', () => {
    expect(lp).toContain(
      'const LessonClock: React.FC<{ startedAt: number | null; paused: boolean }>'
    );
    expect(lp).toContain('<LessonClock startedAt={startedAt} paused={isFinished} />');
    // Không còn setState theo giây ở thành phần cha.
    expect(lp).not.toMatch(/setElapsedSec\(Math\.floor\(\(Date\.now/);
  });
});

describe('T29 probe có bằng chứng nhìn thấy được', () => {
  it('qa/lesson-smooth.mjs đo thanh pin, vị trí cuộn, ô combo và phản hồi', () => {
    expect(probe).toContain('barInsideScroller');
    expect(probe).toContain('lesson-combo-slot');
    expect(probe).toContain('scrollTopAfterNext');
    expect(probe).toContain('feedbackVisibleAfterCheck');
  });
});
