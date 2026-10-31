import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith('.tsx') ? [full] : [];
  });

const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

// Tailwind v4 sinh sẵn các lớp này từ theme.
const TAILWIND_BUILTIN = new Set([
  'animate-none',
  'animate-spin',
  'animate-ping',
  'animate-pulse',
  'animate-bounce',
]);

describe('T28 — audit UI: animation, máy gắp, QA cờ tướng', () => {
  it('mọi lớp animate-* dùng trong src/**/*.tsx đều được index.css định nghĩa', () => {
    const css = read('src/index.css');
    const defined = new Set([...css.matchAll(/^\.(animate-[a-z0-9_-]+)/gm)].map((m) => m[1]));

    const used = new Set<string>();
    for (const file of walk(join(root, 'src'))) {
      for (const m of readFileSync(file, 'utf8').matchAll(/\banimate-[a-z0-9_-]+/g)) used.add(m[0]);
    }

    const missing = [...used].filter((c) => !TAILWIND_BUILTIN.has(c) && !defined.has(c));
    expect(missing, `thiếu khai báo CSS cho: ${missing.join(', ')}`).toEqual([]);
  });

  it('máy gắp sticker xếp đống theo % khung, không còn xoay vòng px quanh tâm', () => {
    const gacha = read('src/components/motivation/GachaMachineScreen.tsx');

    expect(gacha).toContain('const PILE_SLOTS');
    const start = gacha.indexOf('const PILE_SLOTS');
    const slots = [...gacha.slice(start, gacha.indexOf('];', start)).matchAll(/left:\s*(\d+),\s*top:\s*(\d+)/g)];
    expect(slots.length).toBe(10);

    const xs = slots.map((m) => Number(m[1]));
    expect(new Set(xs).size).toBeGreaterThanOrEqual(6);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(60);

    expect(gacha).toContain('left: `${slot.left}%`');
    expect(gacha).toContain('top: `${slot.top}%`');
    expect(gacha).not.toMatch(/radius = isSpinning/);
    expect(gacha).not.toMatch(/Math\.(cos|sin)\(/);

    const css = read('src/index.css');
    expect(css).toContain('.gacha-shuffle');
    expect(css).toContain('.animate-claw-drop');
  });

  it('probe cờ tướng bấm "Chơi 3D" trước khi chụp bàn cờ đầy đủ', () => {
    const probe = read('qa/cotuong-puzzles.mjs');
    expect(probe.indexOf('button:has-text("Chơi 3D")')).toBeGreaterThan(-1);
    expect(probe.indexOf('button:has-text("Chơi 3D")')).toBeLessThan(
      probe.indexOf('[data-testid="ct-cell-9-4"]')
    );
  });
});
