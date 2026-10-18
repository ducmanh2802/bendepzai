/**
 * T17B (phan 1) — Lap Trinh Tim Kho Bau (treasure_coding).
 * Sinh man xac dinh + solver BFS kiem MOI man deu co loi giai,
 * mo phong chuong trinh (thang/thua/dam/chia khoa/vong lap x2),
 * luoi 4x4->6x6, do kho tang that, nonce xao tron.
 */
import { describe, it, expect } from 'vitest';

import { defaultRoundsPerTier } from '../src/data/gameLevels';
import {
  POOL_BY_TIER as CODE_POOLS,
  buildCodingRounds,
  expandProgram,
  generateLevel,
  simulateProgram,
  solveLevel,
  type ProgToken,
} from '../src/data/games/treasure_coding';

const SEEDS = Array.from({ length: 20 }, (_, i) => i);
const ROUNDS = defaultRoundsPerTier();

function toTokens(dirs: string[]): ProgToken[] {
  return dirs.map((d) => ({ dir: d as ProgToken['dir'], repeat: 1 as const }));
}

// ---------------------------------------------------------------------------
// treasure_coding: sinh man + solver BFS + mo phong
// ---------------------------------------------------------------------------
describe('T17B treasure_coding: man choi', () => {
  it('pool moi cap >= so vong; builder du vong, id duy nhat', () => {
    for (let t = 1; t <= 6; t++) {
      expect(CODE_POOLS[t - 1].length, `code pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildCodingRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
        expect(new Set(rounds.map((r) => r.level.id)).size).toBe(rounds.length);
      }
    }
  });

  it('solver BFS: MOI man moi cap deu co loi giai (nghiem thu chinh)', () => {
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildCodingRounds(t, seed)) {
          const sol = solveLevel(r.level);
          expect(sol, `man ${r.id} vo nghiem`).not.toBeNull();
          expect(sol!.length).toBeGreaterThan(0);
          // Loi giai BFS chay that phai thang.
          const res = simulateProgram(r.level, toTokens(sol!));
          expect(res.crashed, r.id).toBe(false);
          expect(res.success, r.id).toBe(true);
          expect(r.level.minSteps).toBe(sol!.length);
        }
      }
    }
  });

  it('luat thang/thua: chuong trinh rong thua; dam vao da thua; re trai tu goc thua', () => {
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildCodingRounds(t, seed)) {
          const lv = r.level;
          expect(simulateProgram(lv, []).success, `${r.id} rong`).toBe(false);
          // Start luon o cot trai (x=0) nen di trai la ra khoi luoi.
          expect(lv.start.x).toBe(0);
          const crash = simulateProgram(lv, [{ dir: 'left', repeat: 1 }]);
          expect(crash.crashed, `${r.id} dam tuong`).toBe(true);
          expect(crash.success, `${r.id} dam tuong`).toBe(false);
        }
      }
    }
  });

  it('chia khoa: chua lay thi khong mo duoc ruong (man tay dung cu the)', () => {
    const lv = {
      id: 'key-unit', size: 2,
      start: { x: 0, y: 0 }, treasure: { x: 1, y: 0 },
      key: { x: 0, y: 1 }, rocks: [], allowLoop: false, minSteps: 3,
    };
    const direct = simulateProgram(lv, toTokens(['right']));
    expect(direct.gotKey).toBe(false);
    expect(direct.success).toBe(false);
    const viaKey = simulateProgram(lv, toTokens(['down', 'up', 'right']));
    expect(viaKey.gotKey).toBe(true);
    expect(viaKey.success).toBe(true);
  });

  it('chia khoa: moi man T4+ co chia khoa nam giua duong, loi giai di qua', () => {
    for (let t = 4; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildCodingRounds(t, seed)) {
          const lv = r.level;
          expect(lv.key, `${r.id} thieu chia khoa`).not.toBeNull();
          expect(lv.key).not.toEqual(lv.start);
          expect(lv.key).not.toEqual(lv.treasure);
          const res = simulateProgram(lv, toTokens(solveLevel(lv)!));
          expect(res.gotKey, `${r.id} loi giai khong qua chia khoa`).toBe(true);
        }
      }
    }
    for (let t = 1; t <= 3; t++) {
      for (const seed of SEEDS) {
        for (const r of buildCodingRounds(t, seed)) {
          expect(r.level.key, `${r.id} cap thap khong co chia khoa`).toBeNull();
        }
      }
    }
  });

  it('vong lap x2: mo rong dung; chi cap cao co', () => {
    expect(expandProgram([
      { dir: 'up', repeat: 1 },
      { dir: 'right', repeat: 2 },
    ])).toEqual(['up', 'right', 'right']);
    for (let t = 1; t <= 4; t++) {
      for (const seed of SEEDS) {
        for (const r of buildCodingRounds(t, seed)) {
          expect(r.level.allowLoop, `${r.id}`).toBe(false);
        }
      }
    }
    for (let t = 5; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildCodingRounds(t, seed)) {
          expect(r.level.allowLoop, `${r.id}`).toBe(true);
        }
      }
    }
  });

  it('do kho tang that: luoi 4->6, loi giai vua suc (<=12 buoc), dai dan', () => {
    const sizes: number[] = [];
    const lens: number[][] = [[], [], [], [], [], []];
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildCodingRounds(t, seed)) {
          sizes.push(r.level.size);
          lens[t - 1].push(r.level.minSteps);
          expect(r.level.size).toBe([4, 4, 5, 5, 6, 6][t - 1]);
          expect(r.level.minSteps, `${r.id} qua dai`).toBeLessThanOrEqual(12);
          expect(r.level.minSteps, `${r.id} qua ngan`).toBeGreaterThanOrEqual(2);
          // Da nam trong luoi, khong de len o dac biet.
          for (const rock of r.level.rocks) {
            expect(rock.x).toBeGreaterThanOrEqual(0);
            expect(rock.x).toBeLessThan(r.level.size);
            expect(rock.y).toBeGreaterThanOrEqual(0);
            expect(rock.y).toBeLessThan(r.level.size);
            expect(rock).not.toEqual(r.level.start);
            expect(rock).not.toEqual(r.level.treasure);
            if (r.level.key) expect(rock).not.toEqual(r.level.key);
          }
        }
      }
    }
    expect(new Set(sizes).size).toBeGreaterThan(1);
    const avg = (a: number[]): number => a.reduce((x, y) => x + y, 0) / a.length;
    expect(avg(lens[5]), 'T6 phai kho hon T1').toBeGreaterThan(avg(lens[0]));
  });

  it('nonce xao tron man; generateLevel xac dinh theo seed', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        seen.add(buildCodingRounds(t, seed).map((r) => r.id).join('|'));
      }
    }
    expect(seen.size).toBeGreaterThan(6);
    const a = generateLevel(5, 2, 7);
    const b = generateLevel(5, 2, 7);
    expect(a).toEqual(b);
    expect(generateLevel(5, 2, 8).id).not.toBe(a.id);
  });
});
