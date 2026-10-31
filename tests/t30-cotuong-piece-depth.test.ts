import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

/** Lấy nguyên khối CSS của một selector cấp 1 (giữa `{` … `}` đầu tiên). */
const block = (css: string, selector: string): string => {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) throw new Error(`không thấy khối ${selector} trong index.css`);
  return css.slice(start, css.indexOf('}', start));
};

describe('T30 — quân cờ phải nổi trên mặt bàn', () => {
  const css = read('src/index.css');
  const board = read('src/components/learning/cotuong/CotuongBoard3D.tsx');

  it('bóng tiếp đất nằm dưới quân và tràn ra ngoài đĩa', () => {
    const shadow = block(css, '.ct-piece__shadow');
    expect(shadow).toContain('top: 54%');
    // đáy âm ⇒ bóng thò xuống dưới quân; bản lỗi nhốt bóng trong lòng quân
    expect(shadow).toContain('bottom: -24%');
    expect(shadow).toContain('filter: blur(');
    expect(shadow).toContain('translateZ(0.6px)');
    expect(css).not.toContain('inset: 16% 8% -2% 8%');
  });

  it('thành quân (đế) thò xuống dưới mặt quân để lộ vành gỗ', () => {
    const base = block(css, '.ct-piece__base');
    const inset = /inset:\s*([-\d.]+)%\s+([-\d.]+)%\s+([-\d.]+)%\s+([-\d.]+)%/.exec(base);
    expect(inset, 'thiếu inset 4 chiều cho đế').not.toBeNull();
    const [top, right, bottom, left] = inset!.slice(1).map(Number);
    expect(bottom).toBeLessThan(0); // dài xuống dưới mặt quân
    expect(top).toBeGreaterThan(0); // hẹp hơn mặt quân ở trên
    expect(left).toBeGreaterThan(0);
    expect(right).toBe(left);
    expect(base).toContain('translateZ(5px)');
  });

  it('mặt quân có viền tối dưới mép (thành nhìn thấy) và nổi cao hơn đế', () => {
    const face = block(css, '.ct-piece__face');
    const zBase = /translateZ\((\d+)px\)/.exec(block(css, '.ct-piece__base'))![1];
    const zFace = /translateZ\((\d+)px\)/.exec(face)![1];
    expect(Number(zFace)).toBeGreaterThan(Number(zBase));
    // bóng thường (không `inset`) ngay dưới mép = thành quân
    const outset = face
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^\d/.test(line));
    expect(outset.length, 'mặt quân không có bóng thường nào').toBeGreaterThanOrEqual(1);
    expect(outset.join(' ')).toContain('128, 86, 36');
  });

  it('quân đang chọn được nâng lên và vẫn giữ thành + viền vàng', () => {
    const selected = block(css, '.ct-piece.is-selected .ct-piece__face');
    const z = Number(/translateZ\((\d+)px\)/.exec(selected)![1]);
    expect(z).toBeGreaterThan(14);
    expect(selected).toContain('0 0 0 3px #fbbf24');
    expect(selected).toMatch(/0 3px 0 rgba\(\s*128, 86, 36/);
  });

  it('mỗi quân mang data-piece để test/probe chọn đúng quân, không dựa vào chữ Hán', () => {
    expect(board).toContain('data-piece={`${piece.color}-${piece.type}`}');
    expect(read('qa/cotuong-depth.mjs')).toContain('.ct-piece[data-piece="black-c"]');
  });

  it('ba lớp quân được render theo đúng thứ tự chồng', () => {
    const shadow = board.indexOf('ct-piece__shadow');
    const base = board.indexOf('ct-piece__base');
    const face = board.indexOf('ct-piece__face');
    expect(shadow).toBeGreaterThan(-1);
    expect(shadow).toBeLessThan(base);
    expect(base).toBeLessThan(face);
  });

  it('probe đo bóng tiếp đất bằng pixel và độ dày thành quân', () => {
    const probe = read('qa/cotuong-depth.mjs');
    expect(probe).toContain('contactShadowDelta');
    expect(probe).toContain('rimBelowFacePx');
    expect(probe).toContain('boardBelow');
    expect(probe).toContain('boardAbove');
    expect(probe).toContain('zlib.inflateSync');
    // phải đo cả chế độ 3D lẫn 2D: translateZ mất tác dụng khi phẳng
    expect(probe).toContain('Góc 2D');
    expect(probe).toContain('is-flat');
  });
});
