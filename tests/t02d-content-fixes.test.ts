/**
 * T02D — Sửa 2 lỗi nội dung nhỏ còn sót sau T02B (+ lỗi sót khi rà soát).
 *
 * 1. spelling_duel tier 6: "Cháu chào ...ạ cụ!" không phải câu tiếng Việt
 *    tự nhiên → "Con ...ế mèn" (chỉ d đúng).
 * 2. shape_sorting: "Nón lá" 👒 (mũ tròn rộng vành) xếp vào rổ tam giác →
 *    "Ngọn núi" ⛰️ (chóp tam giác rõ ràng).
 * 3. Rà soát: clock_money còn sót phương án "110cm" (> 100, T02B/B8 yêu cầu
 *    bỏ) → "10cm"; phonics_pop tier blend còn sót RED (chữ đơn) → CRAB.
 */
import { describe, it, expect } from 'vitest';
import { POOLS as SPELLING_POOLS } from '../src/data/games/spelling_duel';
import {
  SHAPE_POOL,
  type ShapeCategory,
} from '../src/data/games/shape_sorting';
import { POOLS as CLOCK_POOLS } from '../src/data/games/clock_money';
import { POOLS as PHONICS_POOLS } from '../src/data/games/phonics_pop';
import { containsBannedWord } from '../src/data/contentSafety';

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-zà-ỹđêôơưăâî]+/u)
    .filter(Boolean);
}

describe('T02D/1 spelling duel: cau d/e/r tu nhien, dung 1 dap an', () => {
  it('khong con cau "a cu" kem tu nhien', () => {
    const all = SPELLING_POOLS.flat();
    expect(all.some((i) => i.prompt.includes('ạ cụ'))).toBe(false);
    expect(all.some((i) => i.prompt.includes('dạ cụ'))).toBe(false);
  });

  it('cau moi "Con ...e men": chi d dung, goi y khong lo dap an', () => {
    const item = SPELLING_POOLS.flat().find((i) =>
      i.prompt.includes('ế mèn'),
    )!;
    expect(item).toBeDefined();
    expect(item.answer).toBe('d');
    expect([...item.options].sort()).toEqual(['d', 'gi', 'r']);
    expect(item.emoji).toBe('🦗');
    // Chỉ đáp án ghép thành đúng từ "dế"; các phương án khác vô nghĩa.
    const completions = new Map(
      item.options.map((o) => [o, item.prompt.replace('...', o)]),
    );
    expect(completions.get('d')).toContain('Con dế mèn');
    expect(completions.get('gi')).not.toContain('Con dế mèn');
    expect(completions.get('r')).not.toContain('Con dế mèn');
    // Gợi ý không chứa đáp án (đáp án 1 chữ → kiểm tra theo token).
    expect(tokens(item.hint)).not.toContain(item.answer);
    // Chuẩn hoá NFC, không từ cấm.
    expect(item.prompt.normalize('NFC')).toBe(item.prompt);
    expect(item.hint.normalize('NFC')).toBe(item.hint);
    expect(containsBannedWord(item.prompt)).toBe(false);
    expect(containsBannedWord(item.hint)).toBe(false);
  });

  it('tier 6 van du 8 cau, dap an nam trong options', () => {
    expect(SPELLING_POOLS[5].length).toBeGreaterThanOrEqual(8);
    for (const item of SPELLING_POOLS[5]) {
      expect(item.options).toContain(item.answer);
      expect(new Set(item.options).size).toBe(item.options.length);
    }
  });
});

describe('T02D/2 shape sorting: ro tam giac khong dung mu tron', () => {
  it('khong con "Non la" / emoji mu tron trong pool', () => {
    const names = SHAPE_POOL.map((s) => s.name);
    const emojis = SHAPE_POOL.map((s) => s.emoji);
    expect(names).not.toContain('Nón lá');
    expect(emojis).not.toContain('👒');
  });

  it('"Ngon nui" nam ro tam giac, emoji khop hinh chop', () => {
    const mountain = SHAPE_POOL.find((s) => s.name === 'Ngọn núi')!;
    expect(mountain).toBeDefined();
    expect(mountain.emoji).toBe('⛰️');
    expect(mountain.category).toBe('tam-giac');
    expect(mountain.name.normalize('NFC')).toBe(mountain.name);
    expect(containsBannedWord(mountain.name)).toBe(false);
  });

  it('moi vat tam giac deu co hinh chop ro rang', () => {
    const allowed: Record<ShapeCategory, string[]> = {
      tron: ['⚽', '🍪', '🏀', '⏰', '🍊', '🔮'],
      vuong: ['🎁', '🎲', '⬜', '🟩', '📦', '🍱'],
      'tam-giac': ['🍉', '⚠️', '🍕', '📐', '⛰️', '🏠'],
      'chu-nhat': ['📘', '🖼️', '📋', '🚪', '📓', '🧱'],
    };
    for (const s of SHAPE_POOL) {
      expect(allowed[s.category], `${s.name} ${s.emoji}`).toContain(s.emoji);
    }
  });
});

describe('T02D/3 ra soat: khong con 110cm, tier blend toan blend', () => {
  it('clock_money: moi so cm trong pham vi 0-100', () => {
    const joined = CLOCK_POOLS.flat().flatMap((i) => [i.prompt, ...i.options]);
    expect(joined.some((t) => t.includes('110cm'))).toBe(false);
    for (const text of joined) {
      for (const m of text.matchAll(/(\d+)\s*cm/g)) {
        expect(Number(m[1]), text).toBeLessThanOrEqual(100);
      }
    }
  });

  it('phonics_pop tier blend (T4): tat ca dap an + nhieu deu 2 chu', () => {
    for (const item of PHONICS_POOLS[3]) {
      expect(item.answer.length, item.word).toBe(2);
      for (const o of item.options) {
        expect(o.length, `${item.word} option ${o}`).toBe(2);
      }
    }
    const words = PHONICS_POOLS[3].map((p) => p.word);
    expect(words).toContain('CRAB');
    expect(words).not.toContain('RED');
  });
});
