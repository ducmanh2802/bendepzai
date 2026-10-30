import { describe, it, expect } from 'vitest';
import { defaultRoundsPerTier } from '../src/data/gameLevels';
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

  it('every round has 4 unique options including the answer', () => {
    const roundsPerTier = defaultRoundsPerTier();
    for (const tier of TIERS) {
      const rounds = buildShadowRounds(tier, 0);
      expect(rounds).toHaveLength(roundsPerTier[tier - 1]);
      for (const round of rounds) {
        expect(round.options).toHaveLength(4);
        expect(round.options).toContain(round.answer);
        expect(new Set(round.options.map((o) => o.id)).size).toBe(4);
        expect(round.id.length).toBeGreaterThan(0);
      }
      expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
    }
  });

  it('keeps easy tiers upright and only tilts/flips later', () => {
    for (const round of buildShadowRounds(1, 3)) {
      expect(round.tilt).toBe(0);
      expect(round.flip).toBe(false);
    }
    for (const round of buildShadowRounds(3, 3)) {
      expect(Math.abs(round.tilt)).toBeLessThanOrEqual(20);
      expect(round.flip).toBe(false);
    }
    for (const round of buildShadowRounds(6, 3)) {
      expect(Math.abs(round.tilt)).toBeLessThanOrEqual(20);
    }
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
    for (const tier of TIERS) {
      const rounds = buildMosaicRounds(tier, 0);
      expect(rounds).toHaveLength(MOSAIC_ROUNDS_PER_TIER[tier - 1]);
      const expectedSize = tier <= 2 ? 3 : tier <= 4 ? 4 : 5;
      for (const round of rounds) {
        expect(round.pattern.size).toBe(expectedSize);
        expect(round.palette.map((c) => c.key).sort()).toEqual(
          round.pattern.colors.map((c) => c.key).sort()
        );
        expect(round.showGhost).toBe(tier <= 2);
        expect(round.goal).toHaveLength(expectedSize);
      }
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
