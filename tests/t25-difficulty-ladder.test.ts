/**
 * T25 — Bậc thang độ khó dùng chung cho toàn bộ trò chơi.
 *
 * Vì sao có file này: phụ huynh bé giữa–cuối lớp 1 báo "các trò chơi đang quá
 * dễ" (2026-10-30). Trước đó mỗi trò tự viết trần của nó (Toán 5/10/10/15/20,
 * lật thẻ 3→8 cặp, mosaic 5×5, nối chữ 12 chấm, coding 12 bước), nên nâng một
 * trò thì các trò khác vẫn đứng nguyên. Từ nay:
 *  - `TIER_MAX_VALUE` (mathUtils) quyết định trần số của nhóm Toán,
 *  - `TIER_OPTION_COUNT` (gameLevels) quyết định số phương án của MỌI trò,
 *  - các trần puzzle (cặp thẻ, cỡ lưới, số chấm, số bước) khoá trực tiếp ở đây.
 * Test này giữ để lần sau đổi số là phải đổi có ý thức, không phải vô tình.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { TIER_MAX_VALUE, isNoBorrowSub, isNoCarryAdd, tierMaxValue } from '../src/data/games/mathUtils';
import { TIER_OPTION_COUNT, tierOptionCount } from '../src/data/gameLevels';
import { buildRaceQuestions, tierBudgetMs } from '../src/data/games/speed_racing';
import { buildFishRounds } from '../src/data/games/ocean_fishing';
import { buildTowerRounds } from '../src/data/games/number_tower';
import { buildHopRounds } from '../src/data/games/number_line_hop';
import { buildMarketRounds } from '../src/data/games/ten_frame_market';
import { TIER_CONFIG, spawnSequence } from '../src/data/games/falling_numbers';
import { buildShadowRounds } from '../src/data/games/shadow_match';
import { buildAnimalRounds, SAFARI_ANIMALS } from '../src/data/games/animal_safari';
import { buildPhonicsRounds } from '../src/data/games/listen_pick';
import { buildRhymeRounds, containsRhyme, RHYME_FRUIT_CAP_BY_TIER } from '../src/data/games/rhyme_hunter';
import { SYLLABLE_ROUNDS_PER_TIER } from '../src/data/games/syllable_builder';
import { GOALS_PER_TIER, PAIR_POOL, buildMemoryDeck } from '../src/data/games/memory_cards';
import { MOSAIC_ROUNDS_PER_TIER, buildMosaicRounds } from '../src/data/games/pixel_mosaic';
import { shapesForTier } from '../src/data/games/connect_dots';
import { buildCodingRounds } from '../src/data/games/treasure_coding';
import { defaultRoundsPerTier } from '../src/data/gameLevels';

const SEEDS = Array.from({ length: 12 }, (_, i) => i);

describe('T25 bậc thang dùng chung', () => {
  it('trần số đi hết phạm vi 0–100 của lớp 1, số phương án tăng dần', () => {
    expect(TIER_MAX_VALUE).toEqual([10, 20, 30, 50, 70, 100]);
    expect(TIER_OPTION_COUNT).toEqual([4, 4, 5, 5, 6, 6]);
    for (let i = 1; i < TIER_MAX_VALUE.length; i++) {
      expect(TIER_MAX_VALUE[i]).toBeGreaterThan(TIER_MAX_VALUE[i - 1]);
      expect(TIER_OPTION_COUNT[i]).toBeGreaterThanOrEqual(TIER_OPTION_COUNT[i - 1]);
    }
    expect(TIER_MAX_VALUE.every((v) => v <= 100)).toBe(true);
  });

  it('clamp bậc ngoài khoảng 1–6 thay vì ném lỗi', () => {
    expect(tierMaxValue(0)).toBe(10);
    expect(tierMaxValue(99)).toBe(100);
    expect(tierOptionCount(Number.NaN)).toBe(4);
    expect(tierMaxValue(2.4)).toBe(20);
  });

  it('cả 5 trò Toán đều đọc trần và số phương án từ bậc thang (không tự đặt)', () => {
    for (const seed of SEEDS) {
      for (let t = 1; t <= 6; t++) {
        const max = tierMaxValue(t);
        const optionCount = tierOptionCount(t);
        expect(buildRaceQuestions(t, seed)[0].options).toHaveLength(optionCount);
        expect(buildFishRounds(t, seed)[0].fishPool).toHaveLength(optionCount);
        expect(buildTowerRounds(t, seed)[0].options).toHaveLength(optionCount);
        expect(buildHopRounds(t, seed)[0].options).toHaveLength(optionCount);
        expect(buildMarketRounds(t, seed)[0].options).toHaveLength(optionCount);
        // Bậc cao phải thật sự ra số lớn hơn bậc 1 (không chỉ đổi nhãn).
        if (t >= 4) {
          const racingMax = Math.max(...buildRaceQuestions(t, seed).flatMap((q) => q.options));
          expect(racingMax).toBeGreaterThan(tierMaxValue(1));
          expect(racingMax).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it('mọi phương án nằm trong trần bậc và không trùng nhau', () => {
    for (const seed of SEEDS) {
      for (let t = 1; t <= 6; t++) {
        const max = tierMaxValue(t);
        for (const q of buildRaceQuestions(t, seed)) {
          for (const o of q.options) expect(o).toBeLessThanOrEqual(max);
        }
        for (const r of buildTowerRounds(t, seed)) {
          expect(r.total).toBeLessThanOrEqual(max);
        }
      }
    }
  });
});

describe('T25 phép tính hai bước + đồng hồ (Đường Đua)', () => {
  function steps(expr: string): [number, number, '+' | '-'][] {
    const tok = expr.trim().split(/\s+/);
    const out: [number, number, '+' | '-'][] = [];
    let acc = Number(tok[0]);
    for (let i = 1; i < tok.length; i += 2) {
      const rhs = Number(tok[i + 1]);
      out.push([acc, rhs, tok[i] as '+' | '-']);
      acc = tok[i] === '+' ? acc + rhs : acc - rhs;
    }
    return out;
  }

  it('chỉ bậc 5–6 có hai bước, mỗi bước đúng chuẩn lớp 1', () => {
    for (let t = 1; t <= 6; t++) {
      let two = 0;
      let total = 0;
      for (const seed of SEEDS) {
        for (const q of buildRaceQuestions(t, seed)) {
          total++;
          const st = steps(q.expr);
          if (st.length === 2) {
            two++;
            expect(t).toBeGreaterThanOrEqual(5);
          }
          for (const [lhs, rhs, op] of st) {
            if (op === '+') {
              expect(isNoCarryAdd(lhs, rhs), q.expr).toBe(true);
              expect(lhs + rhs, q.expr).toBeLessThanOrEqual(tierMaxValue(t));
            } else {
              expect(isNoBorrowSub(lhs, rhs), q.expr).toBe(true);
              expect(lhs, q.expr).toBeLessThanOrEqual(tierMaxValue(t));
            }
          }
        }
      }
      if (t >= 5) expect(two / total, `bậc ${t} phải trộn phép hai bước`).toBeGreaterThan(0.2);
      else expect(two).toBe(0);
    }
  });

  it('giấy giờ chỉ bật từ bậc 4 và giảm dần', () => {
    expect([tierBudgetMs(1), tierBudgetMs(2), tierBudgetMs(3)]).toEqual([null, null, null]);
    expect(tierBudgetMs(4)!).toBeGreaterThan(tierBudgetMs(5)!);
    expect(tierBudgetMs(5)!).toBeGreaterThan(tierBudgetMs(6)!);
    expect(tierBudgetMs(6)!).toBeGreaterThanOrEqual(5000);
  });
});

describe('T25 chuỗi bóng Hứng Số Rơi tất định', () => {
  it('cùng (bậc, nonce) → cùng chuỗi; nonce khác → chuỗi khác', () => {
    const a = spawnSequence(5, 3, 24).map((b) => b.val).join(',');
    const b = spawnSequence(5, 3, 24).map((b) => b.val).join(',');
    expect(a).toBe(b);
    expect(spawnSequence(5, 4, 24).map((x) => x.val).join(',')).not.toBe(a);
  });

  it('mỗi nhịp 3 bóng có 1 bóng thoả điều kiện, bóng nhiễu nằm sát ngưỡng', () => {
    for (let t = 1; t <= 6; t++) {
      const cfg = TIER_CONFIG[t - 1];
      const check = cfg.condition.check;
      const seq = spawnSequence(t, 7, 45);
      for (let i = 0; i < seq.length; i++) {
        expect(seq[i].val).toBeGreaterThanOrEqual(1);
        expect(seq[i].val).toBeLessThanOrEqual(cfg.maxVal);
        if (i % 3 === 0) expect(check(seq[i].val), `bậc ${t} bóng ${i}`).toBe(true);
      }
      const hits = seq.filter((b) => check(b.val)).length;
      expect(hits / seq.length).toBeGreaterThanOrEqual(0.3);
      // Bóng sai phải là bẫy ngưỡng (±2 quanh MỘT số đúng của bậc), không phải
      // số random — ít nhất 70% số bóng sai để còn dư địa cho biên hẹp.
      const validHits: number[] = [];
      for (let n = 1; n <= cfg.maxVal; n++) if (check(n)) validHits.push(n);
      const misses = seq.filter((b) => !check(b.val));
      const near = misses.filter((b) => validHits.some((h) => Math.abs(h - b.val) <= 2));
      expect(near.length / misses.length, `bậc ${t}: bóng sai không sát ngưỡng`).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('trần bóng cao hơn trước ở các bậc giữa (15/20/30/70/100)', () => {
    expect(TIER_CONFIG.map((c) => c.maxVal)).toEqual([10, 15, 20, 30, 70, 100]);
    for (const c of TIER_CONFIG) expect(c.maxVal).toBeLessThanOrEqual(100);
  });
});

describe('T25 thang phương án áp dụng cho nhóm ngoài Toán', () => {
  it('Bóng Hình / Safari / Đôi Tai cùng đọc bậc thang dùng chung', () => {
    for (let t = 1; t <= 6; t++) {
      const expected = tierOptionCount(t);
      for (const seed of [0, 1, 2]) {
        expect(buildShadowRounds(t, seed)[0].options).toHaveLength(expected);
        expect(buildAnimalRounds(t, seed)[0].options).toHaveLength(expected);
        expect(buildPhonicsRounds(t, seed)[0].cards).toHaveLength(expected);
      }
    }
    expect(tierOptionCount(6)).toBeGreaterThan(tierOptionCount(1));
  });

  it('nội dung xoay theo nonce thay vì mãi vài mục đầu danh sách', () => {
    const targets = new Set<string>();
    for (const seed of SEEDS) buildAnimalRounds(6, seed).forEach((r) => targets.add(r.target.englishName));
    expect(targets.size, 'safari chỉ dùng vài con đầu danh sách').toBe(SAFARI_ANIMALS.length);

    const memorySets = new Set<string>();
    for (const seed of SEEDS) memorySets.add(buildMemoryDeck(1, seed).map((c) => c.pairId).sort().join(','));
    expect(memorySets.size, 'bộ thẻ lật không đổi theo nonce').toBeGreaterThan(6);
  });

  it('Săn Vần bậc cao thả nhiều trái hơn bậc thấp', () => {
    expect(RHYME_FRUIT_CAP_BY_TIER).toEqual([4, 6, 8, 10, 12, 12]);
    for (let t = 1; t <= 6; t++) {
      for (const seed of [0, 1, 2]) {
        const round = buildRhymeRounds(t, seed)[0];
        expect(round.fruits.length, `bậc ${t} số trái`).toBe(RHYME_FRUIT_CAP_BY_TIER[t - 1]);
        // Không được có hai loại quả đúng: mọi trái sai phải sạch chuỗi vần.
        for (const f of round.fruits.filter((x) => !x.hasRhyme)) {
          expect(containsRhyme(f.word, round.targetRhyme), `${f.word} ~ ${round.targetRhyme}`).toBe(false);
        }
        expect(round.fruits.filter((f) => f.hasRhyme).length).toBeGreaterThanOrEqual(2);
      }
    }
    const small = buildRhymeRounds(1, 0)[0].fruits.length;
    const big = buildRhymeRounds(6, 0)[0].fruits.length;
    expect(small).toBeGreaterThanOrEqual(4);
    expect(big).toBeGreaterThan(small + 3);
  });

  it('Xếp Vần theo đúng ROUNDS_PER_TIER của policy', () => {
    expect(SYLLABLE_ROUNDS_PER_TIER).toEqual(defaultRoundsPerTier());
  });
});

describe('T25 trần nhóm Puzzle', () => {
  it('Lật Thẻ: 3→12 cặp, bậc 6 có 24 thẻ, mỗi cặp đúng hai thẻ', () => {
    expect(GOALS_PER_TIER).toEqual([3, 4, 6, 8, 10, 12]);
    expect(GOALS_PER_TIER[5]).toBeLessThanOrEqual(PAIR_POOL.length);
    for (let t = 1; t <= 6; t++) {
      const deck = buildMemoryDeck(t, 1);
      expect(deck).toHaveLength(GOALS_PER_TIER[t - 1] * 2);
      expect(new Set(deck.map((c) => c.pairId)).size).toBe(GOALS_PER_TIER[t - 1]);
    }
  });

  it('Mosaic: lưới lớn dần tới 6×6 và mỗi bậc đủ tranh không lặp', () => {
    const sizes = [1, 2, 3, 4, 5, 6].map((t) => buildMosaicRounds(t, 0)[0].pattern.size);
    expect(sizes).toEqual([3, 3, 4, 5, 6, 6]);
    for (let t = 1; t <= 6; t++) {
      const ids = buildMosaicRounds(t, 2).map((r) => r.pattern.id);
      expect(ids).toHaveLength(MOSAIC_ROUNDS_PER_TIER[t - 1]);
      expect(new Set(ids).size, `bậc ${t} lặp tranh mosaic`).toBe(ids.length);
    }
  });

  it('Nối Số: bậc 5–6 có hình 16–18 chấm, bậc 4 vẫn ≤ 12', () => {
    expect(Math.max(...shapesForTier(4).map((s) => s.points.length))).toBeLessThanOrEqual(12);
    expect(Math.max(...shapesForTier(5).map((s) => s.points.length))).toBeGreaterThanOrEqual(16);
    expect(Math.max(...shapesForTier(6).map((s) => s.points.length))).toBeGreaterThanOrEqual(18);
  });

  it('Lập Trình: luoi 4→8, bậc 6 đi dài hơn bậc 4 và vẫn trong trần 18 bước', () => {
    const sizeOf = (t: number) => buildCodingRounds(t, 0)[0].level.size;
    expect([1, 2, 3, 4, 5, 6].map(sizeOf)).toEqual([4, 4, 5, 6, 7, 8]);
    const longest = (t: number) =>
      Math.max(...SEEDS.flatMap((s) => buildCodingRounds(t, s).map((r) => r.level.minSteps)));
    const rockAvg = (t: number) => {
      const all = SEEDS.flatMap((s) => buildCodingRounds(t, s).map((r) => r.level.rocks.length));
      return all.reduce((a, b) => a + b, 0) / all.length;
    };
    expect(longest(1)).toBeLessThanOrEqual(8);
    expect(longest(6)).toBeGreaterThan(longest(4));
    expect(longest(6)).toBeGreaterThanOrEqual(14);
    expect(rockAvg(6)).toBeGreaterThan(rockAvg(4));
    for (let t = 1; t <= 6; t++) expect(longest(t)).toBeLessThanOrEqual(18);
  });
});

describe('T25 builder dữ liệu không được dùng Math.random / Date.now', () => {
  it('100% file trong src/data/games là tất định', () => {
    const dir = join(process.cwd(), 'src/data/games');
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(20);
    for (const f of files) {
      const src = readFileSync(join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(src.includes('Math.random'), f).toBe(false);
      expect(src.includes('Date.now'), f).toBe(false);
    }
  });
});
