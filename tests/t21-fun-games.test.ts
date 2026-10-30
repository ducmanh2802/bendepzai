import { describe, it, expect } from 'vitest';
import { defaultRoundsPerTier, tierOptionCount } from '../src/data/gameLevels';
import {
  CONNECT_SHAPES,
  buildConnectRounds,
  shapesForTier,
} from '../src/data/games/connect_dots';
import { SHADOW_POOL, buildShadowRounds } from '../src/data/games/shadow_match';
import {
  MOSAIC_PATTERNS,
  MOSAIC_ROUNDS_PER_TIER,
  buildMosaicRounds,
  isMosaicComplete,
  mosaicGoal,
} from '../src/data/games/pixel_mosaic';
import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import { GAME_REGISTRY } from '../src/components/games/registry';
import { LAUNCHABLE_GAME_IDS } from '../src/config/policy';

const TIERS = [1, 2, 3, 4, 5, 6];

describe('Nối Số Tô Màu — connect the dots data', () => {
  it('shapes are well formed', () => {
    expect(CONNECT_SHAPES.length).toBeGreaterThanOrEqual(8);
    const ids = CONNECT_SHAPES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const shape of CONNECT_SHAPES) {
      expect(shape.name.trim().length).toBeGreaterThan(0);
      expect(shape.emoji.trim().length).toBeGreaterThan(0);
      expect(shape.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(shape.points.length).toBeGreaterThanOrEqual(4);
      for (const p of shape.points) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(100);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it('difficulty ramps the dot count per tier', () => {
    const easy = shapesForTier(1).map((s) => s.points.length);
    const hard = shapesForTier(6).map((s) => s.points.length);
    expect(Math.max(...easy)).toBeLessThanOrEqual(6);
    expect(Math.max(...hard)).toBeGreaterThanOrEqual(10);
    expect(shapesForTier(6).length).toBeGreaterThan(shapesForTier(1).length);
  });

  it('T25 — bậc 5–6 nối 16–18 chấm, các chấm mới vẫn đủ xa để bé chạm', () => {
    expect(Math.max(...shapesForTier(5).map((s) => s.points.length))).toBeGreaterThanOrEqual(16);
    expect(Math.max(...shapesForTier(6).map((s) => s.points.length))).toBeGreaterThanOrEqual(18);
    for (const id of ['star8', 'flower9', 'wheel14']) {
      const shape = CONNECT_SHAPES.find((s) => s.id === id)!;
      expect(shape.points.length).toBeGreaterThanOrEqual(14);
      for (let i = 0; i < shape.points.length; i++) {
        for (let j = i + 1; j < shape.points.length; j++) {
          const dist = Math.hypot(shape.points[i].x - shape.points[j].x, shape.points[i].y - shape.points[j].y);
          // 12 đơn vị ≈ 40px trên bàn 340px — sát trần nút 44px của AGENTS.md.
          expect(dist, `${id} ${i}↔${j}`).toBeGreaterThanOrEqual(12);
        }
      }
    }
  });

  it('builds the right number of rounds with sequential numbered dots', () => {
    const roundsPerTier = defaultRoundsPerTier();
    for (const tier of TIERS) {
      const rounds = buildConnectRounds(tier, 0);
      expect(rounds).toHaveLength(roundsPerTier[tier - 1]);
      for (const round of rounds) {
        expect(round.dots.map((d) => d.n)).toEqual(round.dots.map((_, i) => i + 1));
        for (const dot of round.dots) {
          expect(dot.x).toBeGreaterThanOrEqual(7);
          expect(dot.x).toBeLessThanOrEqual(93);
          expect(dot.y).toBeGreaterThanOrEqual(7);
          expect(dot.y).toBeLessThanOrEqual(93);
        }
      }
      expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
    }
  });

  it('is deterministic per (tier, seed) and reshuffles across plays', () => {
    expect(buildConnectRounds(3, 5)).toEqual(buildConnectRounds(3, 5));
    const a = buildConnectRounds(3, 1);
    const b = buildConnectRounds(3, 2);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

describe('Đoán Bóng Hình — shadow match data', () => {
  it('pool has unique items with child-facing labels', () => {
    const ids = SHADOW_POOL.map((i) => i.id);
    const emojis = SHADOW_POOL.map((i) => i.emoji);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(emojis).size).toBe(emojis.length);
    for (const item of SHADOW_POOL) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.emoji.trim().length).toBeGreaterThan(0);
    }
  });

  it('số phương án theo bậc (4 → 6), luôn có đáp án và không trùng', () => {
    const roundsPerTier = defaultRoundsPerTier();
    for (const tier of TIERS) {
      const optionCount = tierOptionCount(tier);
      const rounds = buildShadowRounds(tier, 0);
      expect(rounds).toHaveLength(roundsPerTier[tier - 1]);
      for (const round of rounds) {
        expect(round.options).toHaveLength(optionCount);
        expect(round.options).toContain(round.answer);
        expect(new Set(round.options.map((o) => o.id)).size).toBe(optionCount);
        expect(round.id.length).toBeGreaterThan(0);
      }
      expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
    }
    expect(tierOptionCount(6)).toBe(6);
  });

  it('giữ bậc 1–2 thẳng đứng, bậc càng cao bóng càng nghiêng (T25)', () => {
    for (const tier of [1, 2]) {
      for (const round of buildShadowRounds(tier, 3)) {
        expect(round.tilt).toBe(0);
        expect(round.flip).toBe(false);
      }
    }
    for (const round of buildShadowRounds(4, 3)) expect(Math.abs(round.tilt)).toBeLessThanOrEqual(35);
    for (const round of buildShadowRounds(6, 3)) {
      expect(Math.abs(round.tilt)).toBeLessThanOrEqual(50);
      expect(round.flip).toBeTypeOf('boolean');
    }
    // Bậc cao phải thật sự nghiêng mạnh hơn bậc 4 (không chỉ đổi nhãn).
    const tilt6 = Math.max(...buildShadowRounds(6, 3).map((r) => Math.abs(r.tilt)));
    const tilt4 = Math.max(...buildShadowRounds(4, 3).map((r) => Math.abs(r.tilt)));
    expect(tilt6).toBeGreaterThan(tilt4);
  });

  it('is deterministic per (tier, seed)', () => {
    expect(buildShadowRounds(4, 2)).toEqual(buildShadowRounds(4, 2));
  });
});

describe('Bé Xếp Hình Mosaic — pixel mosaic data', () => {
  it('patterns are rectangular and only use declared colors', () => {
    expect(MOSAIC_PATTERNS.length).toBeGreaterThanOrEqual(15);
    for (const pattern of MOSAIC_PATTERNS) {
      expect(pattern.rows).toHaveLength(pattern.size);
      for (const row of pattern.rows) {
        expect(row).toHaveLength(pattern.size);
        for (const ch of row) {
          if (ch === '.') continue;
          expect(pattern.colors.some((c) => c.key === ch), `${pattern.id}:${ch}`).toBe(true);
        }
      }
      expect(pattern.colors.length).toBeGreaterThanOrEqual(2);
      const hexes = pattern.colors.map((c) => c.hex);
      expect(new Set(hexes).size).toBe(hexes.length);
      const filled = pattern.rows.join('').split('').filter((ch) => ch !== '.').length;
      expect(filled).toBeGreaterThanOrEqual(5);
    }
  });

  it('difficulty ramps grid size and round counts stay sane', () => {
    expect(MOSAIC_ROUNDS_PER_TIER).toHaveLength(6);
    // T25: 3×3 → 4×4 (T3) → 5×5 (T4) → 6×6 (T5–6).
    const SIZE_BY_TIER = [3, 3, 4, 5, 6, 6];
    for (const tier of TIERS) {
      const expectedSize = SIZE_BY_TIER[tier - 1];
      const rounds = buildMosaicRounds(tier, 0);
      expect(rounds).toHaveLength(MOSAIC_ROUNDS_PER_TIER[tier - 1]);
      for (const round of rounds) {
        expect(round.pattern.size).toBe(expectedSize);
        expect(round.palette.map((c) => c.key).sort()).toEqual(
          round.pattern.colors.map((c) => c.key).sort()
        );
        expect(round.showGhost).toBe(tier <= 2);
        expect(round.goal).toHaveLength(expectedSize);
      }
      // Pool của cỡ lưới đó phải đủ tranh để không lặp trong cùng một bậc.
      const poolSize = MOSAIC_PATTERNS.filter((p) => p.size === expectedSize).length;
      expect(poolSize).toBeGreaterThanOrEqual(MOSAIC_ROUNDS_PER_TIER[tier - 1]);
    }
  });

  it('goal mapping keeps empty cells null', () => {
    const pattern = MOSAIC_PATTERNS[0];
    const goal = mosaicGoal(pattern);
    for (let r = 0; r < pattern.size; r++) {
      for (let c = 0; c < pattern.size; c++) {
        const expected = pattern.rows[r][c] === '.' ? null : pattern.rows[r][c];
        expect(goal[r][c]).toBe(expected);
      }
    }
  });

  it('isMosaicComplete ignores empty cells and requires every color', () => {
    const pattern = MOSAIC_PATTERNS.find((p) => p.id === 'house') ?? MOSAIC_PATTERNS[0];
    const goal = mosaicGoal(pattern);
    const empty = goal.map((row) => row.map(() => null));

    expect(isMosaicComplete(goal, empty)).toBe(false);

    const partial: (string | null)[][] = goal.map((row) => row.map(() => null));
    for (let r = 0; r < goal.length; r++) {
      if (goal[r][0] !== null) {
        partial[r][0] = goal[r][0];
        break;
      }
    }
    expect(isMosaicComplete(goal, partial)).toBe(false);

    expect(isMosaicComplete(goal, goal.map((row) => [...row]))).toBe(true);

    const wrong = goal.map((row) => [...row]);
    for (let r = 0; r < goal.length; r++) {
      const c = goal[r].findIndex((cell) => cell !== null);
      if (c >= 0) {
        wrong[r][c] = goal[r][c] === 'R' ? 'B' : 'R';
        break;
      }
    }
    expect(isMosaicComplete(goal, wrong)).toBe(false);
  });

  it('is deterministic per (tier, seed)', () => {
    expect(buildMosaicRounds(5, 1)).toEqual(buildMosaicRounds(5, 1));
  });
});

describe('new games are registered everywhere', () => {
  const newIds = ['connect_dots', 'shadow_match', 'pixel_mosaic'];

  it('catalog, registry and launchable list contain the new fun games', () => {
    for (const id of newIds) {
      const entry = GAMES_CATALOG.find((g) => g.id === id);
      expect(entry, id).toBeDefined();
      expect(entry?.category).toBe('fun');
      expect((entry?.skillIds ?? []).length).toBeGreaterThan(0);
      expect(GAME_REGISTRY[id], id).toBeDefined();
      expect(LAUNCHABLE_GAME_IDS as readonly string[]).toContain(id);
    }
  });
});
