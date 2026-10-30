/**
 * T16 — 3 trò chơi Toán mới (ten_frame_market, number_line_hop, clock_builder).
 * Builder: đủ vòng mọi cấp, đáp án đúng, không trùng, NFC, không từ cấm,
 * lớp 1 (số ≤ 100, tia số hiện rõ không nhớ/không mượn, chỉ giờ đúng,
 * ngày 1–28), đáp án không lộ trong đề, độ khó tăng thật, nonce xáo trộn.
 */
import { describe, it, expect } from 'vitest';

import { defaultRoundsPerTier, tierOptionCount } from '../src/data/gameLevels';
import { containsBannedWord } from '../src/data/contentSafety';
import { isNoBorrowSub, isNoCarryAdd } from '../src/data/games/mathUtils';
import {
  POOL_BY_TIER as MARKET_POOLS,
  buildMarketRounds,
} from '../src/data/games/ten_frame_market';
import {
  POOL_BY_TIER as HOP_POOLS,
  buildHopRounds,
} from '../src/data/games/number_line_hop';
import {
  POOL_BY_TIER as CLOCK_POOLS,
  WEEKDAYS,
  buildClockRounds,
} from '../src/data/games/clock_builder';

const SEEDS = Array.from({ length: 20 }, (_, i) => i);
const ROUNDS = defaultRoundsPerTier();

function expectSpread(slots: number[], optionCount: number, label: string) {
  const distinct = new Set(slots);
  expect(distinct.size, `${label}: đáp án kẹt ở 1 ô`).toBeGreaterThan(1);
  expect(Math.max(...slots), label).toBeLessThan(optionCount);
}

/** Đề không được chứa đáp án rời (sau khi trừ các số đã cho trong đề). */
function expectNoLeak(prompt: string, answer: string, givens: number[]) {
  let masked = prompt;
  for (const g of givens) masked = masked.split(String(g)).join('§');
  const hit = masked.split(/[^0-9A-Za-zÀ-ỹ]+/).filter(Boolean);
  expect(hit, `lộ đáp án "${answer}" trong đề "${prompt}"`).not.toContain(answer);
}

// ---------------------------------------------------------------------------
// ten_frame_market
// ---------------------------------------------------------------------------
describe('T16 ten_frame_market: vòng chơi', () => {
  it('pool mỗi cấp ≥ số vòng; builder đủ vòng, id duy nhất', () => {
    for (let t = 1; t <= 6; t++) {
      expect(MARKET_POOLS[t - 1].length, `market pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildMarketRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
      }
    }
  });

  it('need đúng (target − have, vòng hỏi chục = số chục); số ≤ 100; phương án duy nhất theo bậc, vị trí phân tán', () => {
    const slotsByTier: number[][] = [[], [], [], [], [], []];
    for (let t = 1; t <= 6; t++) {
      const optionCount = tierOptionCount(t);
      for (const seed of SEEDS) {
        for (const r of buildMarketRounds(t, seed)) {
          if (r.kind === 'tensUnits' && r.askPart === 'chuc') {
            expect(r.need).toBe(r.chuc);
          } else {
            expect(r.need).toBe(r.target - r.have);
          }
          expect(r.have).toBeGreaterThanOrEqual(0);
          expect(r.target).toBeLessThanOrEqual(100);
          expect(r.need).toBeGreaterThanOrEqual(0);
          expect(r.need).toBeLessThanOrEqual(Math.max(r.target, 10));
          expect(r.options).toHaveLength(optionCount);
          expect(new Set(r.options).size).toBe(optionCount);
          expect(r.options).toContain(r.need);
          slotsByTier[t - 1].push(r.options.indexOf(r.need));
          for (const o of r.options) {
            expect(o).toBeGreaterThanOrEqual(0);
            expect(o).toBeLessThanOrEqual(Math.max(r.target, 10));
          }
          expect(r.prompt).toBe(r.prompt.normalize('NFC'));
          expect(r.prompt).toContain('mấy');
        }
      }
      expectSpread(slotsByTier[t - 1], optionCount, `ten_frame_market T${t}`);
    }
  });

  it('đề không lộ đáp án; chục–đơn vị khớp target; NFC, không từ cấm', () => {
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildMarketRounds(t, seed)) {
          // Số chục/đơn vị nêu trong đề là dữ kiện, không tính là lộ đáp án.
          const givens = r.kind === 'tensUnits' ? [r.have, r.target, r.chuc ?? -1, r.donVi ?? -1] : [r.have, r.target];
          expectNoLeak(r.prompt, String(r.need), givens);
          if (r.kind === 'tensUnits') {
            expect((r.chuc ?? 0) * 10 + (r.donVi ?? 0)).toBe(r.target);
          }
          for (const s of [r.prompt, r.customer, r.fruit]) {
            expect(s).toBe(s.normalize('NFC'));
            expect(containsBannedWord(s), s).toBe(false);
          }
        }
      }
    }
  });

  it('độ khó tăng thật: T1–T2 khung 10; T3 hai khung 20; T4 que tính; T5 tiền hàng', () => {
    for (const seed of SEEDS) {
      expect(buildMarketRounds(1, seed).every((r) => r.kind === 'ten')).toBe(true);
      expect(buildMarketRounds(2, seed).every((r) => r.kind === 'ten')).toBe(true);
      expect(buildMarketRounds(3, seed).every((r) => r.kind === 'twenty' && r.target === 20)).toBe(true);
      expect(buildMarketRounds(4, seed).every((r) => r.kind === 'tensUnits')).toBe(true);
      expect(buildMarketRounds(5, seed).every((r) => r.kind === 'money')).toBe(true);
      const kinds6 = new Set(buildMarketRounds(6, seed).map((r) => r.kind));
      expect(kinds6.size).toBeGreaterThan(1);
    }
  });

  it('nonce xáo trộn thứ tự vòng và phương án', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        seen.add(buildMarketRounds(t, seed).map((r) => `${r.have}-${r.target}:${r.options.join(',')}`).join('|'));
      }
    }
    expect(seen.size).toBeGreaterThan(6);
  });
});

// ---------------------------------------------------------------------------
// number_line_hop
// ---------------------------------------------------------------------------
describe('T16 number_line_hop: vòng chơi', () => {
  it('pool mỗi cấp ≥ số vòng; builder đủ vòng, id duy nhất', () => {
    for (let t = 1; t <= 6; t++) {
      expect(HOP_POOLS[t - 1].length, `hop pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildHopRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
      }
    }
  });

  it('đích = start + dir·hops·step trong cửa sổ tia; phương án duy nhất theo bậc, vị trí phân tán', () => {
    const slotsByTier: number[][] = [[], [], [], [], [], []];
    for (let t = 1; t <= 6; t++) {
      const optionCount = tierOptionCount(t);
      for (const seed of SEEDS) {
        for (const r of buildHopRounds(t, seed)) {
          expect(r.target).toBe(r.start + r.dir * r.hops * r.step);
          expect(r.target).toBeGreaterThanOrEqual(r.lineStart);
          expect(r.target).toBeLessThanOrEqual(r.lineEnd);
          expect(r.start).toBeGreaterThanOrEqual(r.lineStart);
          expect(r.start).toBeLessThanOrEqual(r.lineEnd);
          expect(r.lineEnd).toBeLessThanOrEqual(r.rangeEnd);
          expect(r.rangeEnd).toBeLessThanOrEqual(100);
          // Cửa sổ đủ rộng để sinh đủ phương án khác nhau.
          expect(r.lineEnd - r.lineStart + 1).toBeGreaterThanOrEqual(optionCount);
          expect(r.options).toHaveLength(optionCount);
          expect(new Set(r.options).size).toBe(optionCount);
          expect(r.options).toContain(r.target);
          slotsByTier[t - 1].push(r.options.indexOf(r.target));
          for (const o of r.options) {
            expect(o).toBeGreaterThanOrEqual(r.lineStart);
            expect(o).toBeLessThanOrEqual(r.lineEnd);
          }
          expect(r.prompt).toBe(r.prompt.normalize('NFC'));
        }
      }
      expectSpread(slotsByTier[t - 1], optionCount, `number_line_hop T${t}`);
    }
  });

  it('lớp 1: phép hiện rõ không nhớ/không mượn; đề bằng lời không lộ đáp án', () => {
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildHopRounds(t, seed)) {
          const amount = r.hops * r.step;
          if (r.dir === 1) {
            expect(isNoCarryAdd(r.start, amount), `${r.start}+${amount}`).toBe(true);
          } else {
            expect(isNoBorrowSub(r.start, amount), `${r.start}−${amount}`).toBe(true);
          }
          if (r.worded) {
            expectNoLeak(r.prompt, String(r.target), [r.start, amount]);
            expect(r.prompt).toMatch(/số mấy/);
          } else {
            expect(r.task).toMatch(/^[+＋\-−]\d+$/u);
          }
          expect(containsBannedWord(r.prompt), r.prompt).toBe(false);
        }
      }
    }
  });

  it('độ khó tăng thật: T1 chỉ cộng nhỏ; T2 có trừ; T3 tia 0–30; T4 nhảy chục 0–100; T5 đề bằng lời 0–70; T6 trộn', () => {
    for (const seed of SEEDS) {
      expect(buildHopRounds(1, seed).every((r) => r.dir === 1 && r.step === 1 && r.rangeEnd === 10)).toBe(true);
      expect(buildHopRounds(2, seed).some((r) => r.dir === -1)).toBe(true);
      expect(buildHopRounds(2, seed).every((r) => r.rangeEnd === 20)).toBe(true);
      expect(buildHopRounds(3, seed).every((r) => r.rangeEnd === 30 && r.hops * r.step >= 2)).toBe(true);
      expect(buildHopRounds(4, seed).every((r) => r.step === 10 && r.rangeEnd === 100)).toBe(true);
      expect(buildHopRounds(5, seed).every((r) => r.worded && r.rangeEnd === 70)).toBe(true);
      const t6 = buildHopRounds(6, seed);
      expect(t6.every((r) => r.rangeEnd === 100)).toBe(true);
      expect(t6.some((r) => r.step === 10)).toBe(true);
      expect(t6.some((r) => r.worded)).toBe(true);
      expect(t6.some((r) => r.dir === -1)).toBe(true);
    }
  });

  it('nonce xáo trộn', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        seen.add(buildHopRounds(t, seed).map((r) => `${r.start}-${r.target}:${r.options.join(',')}`).join('|'));
      }
    }
    expect(seen.size).toBeGreaterThan(6);
  });
});

// ---------------------------------------------------------------------------
// clock_builder
// ---------------------------------------------------------------------------
describe('T16 clock_builder: vòng chơi', () => {
  it('pool mỗi cấp ≥ số vòng; builder đủ vòng, id duy nhất', () => {
    for (let t = 1; t <= 6; t++) {
      expect(CLOCK_POOLS[t - 1].length, `clock pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildClockRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
      }
    }
  });

  it('giờ đúng 1–12; 4 phương án duy nhất gồm đáp án; NFC', () => {
    const slots: number[] = [];
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildClockRounds(t, seed)) {
          expect(r.options).toHaveLength(4);
          expect(new Set<string | number>(r.options).size).toBe(4);
          expect(r.prompt).toBe(r.prompt.normalize('NFC'));
          expect(r.answer).toBe(r.answer.normalize('NFC'));
          if (r.kind === 'clock') {
            expect(r.hour).toBeGreaterThanOrEqual(1);
            expect(r.hour).toBeLessThanOrEqual(12);
            expect((r.options as number[])).toContain(r.hour);
            slots.push((r.options as number[]).indexOf(r.hour));
            for (const o of r.options as number[]) {
              expect(o).toBeGreaterThanOrEqual(1);
              expect(o).toBeLessThanOrEqual(12);
            }
          } else {
            expect(r.options as (string | number)[]).toContain(r.answer);
          }
          expect(containsBannedWord(r.prompt), r.prompt).toBe(false);
        }
      }
    }
    expectSpread(slots, 4, 'clock_builder giờ');
  });

  it('thứ trong tuần đúng lịch; ngày 1–28 không tràn', () => {
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildClockRounds(t, seed)) {
          if (r.kind === 'weekday') {
            const i = WEEKDAYS.indexOf(r.today);
            expect(i).toBeGreaterThanOrEqual(0);
            expect(r.answer).toBe(WEEKDAYS[(i + r.offset + WEEKDAYS.length * 2) % WEEKDAYS.length]);
          }
          if (r.kind === 'date') {
            expect(r.day).toBeGreaterThanOrEqual(1);
            expect(r.day).toBeLessThanOrEqual(28);
            expect(r.answer).toBe(`ngày ${r.day + r.offset}`);
            expect(r.day + r.offset).toBeGreaterThanOrEqual(1);
            expect(r.day + r.offset).toBeLessThanOrEqual(28);
          }
        }
      }
    }
  });

  it('độ khó tăng thật: T1 giờ 1–6 sáng; T4+ có thứ; T5 có ngày; T6 trộn', () => {
    for (const seed of SEEDS) {
      const t1 = buildClockRounds(1, seed);
      expect(t1.every((r) => r.kind === 'clock' && r.hour <= 6 && r.amPm === 'sáng')).toBe(true);
      expect(buildClockRounds(4, seed).some((r) => r.kind === 'weekday')).toBe(true);
      expect(buildClockRounds(5, seed).some((r) => r.kind === 'date')).toBe(true);
      expect(buildClockRounds(5, seed).some((r) => r.kind === 'weekday')).toBe(true);
      const kinds6 = new Set(buildClockRounds(6, seed).map((r) => r.kind));
      expect(kinds6.size).toBeGreaterThan(1);
      const t3 = buildClockRounds(3, seed);
      expect(t3.every((r) => r.kind === 'clock')).toBe(true);
      expect(t3.filter((r) => r.amPm === 'chiều').length).toBeGreaterThan(0);
    }
  });

  it('nonce xáo trộn', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        seen.add(buildClockRounds(t, seed).map((r) => `${r.answer}:${[...r.options].join(',')}`).join('|'));
      }
    }
    expect(seen.size).toBeGreaterThan(6);
  });
});
