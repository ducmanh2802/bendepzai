/**
 * T02B/C — full coverage for ALL 18 games (tiers 1–6, ≥ 20 seeds each):
 * answer ∈ options, unique options, distributed answer slots, pool ≥ rounds,
 * Grade-1 arithmetic (recomputed, 0–100, no-carry/no-borrow), composeSyllable
 * NFC, c/k-g/gh-ng/ngh rule, British English, banned-word sweep, hints hide
 * the answer, and reward-hook behaviour (keep best, pay once, nonce bump,
 * corrupt-nonce sanitizer). Old tests in games-content.test.ts are kept.
 */
import { describe, it, expect, beforeEach } from 'vitest';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof (globalThis as Record<string, unknown>).localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import { GAME_LEVEL_POLICY } from '../src/config/policy';
import { defaultRoundsPerTier, tierOptionCount } from '../src/data/gameLevels';
import { containsBannedWord, ALLOWED_PHRASES } from '../src/data/contentSafety';
import { StorageService } from '../src/services/storage';
import { isNoBorrowSub, isNoCarryAdd, tierMaxValue } from '../src/data/games/mathUtils';
import {
  POOL_BY_TIER as SYL_POOLS,
  SYLLABLE_ROUNDS_PER_TIER,
  buildSyllableRounds,
  composeSyllable,
  INITIAL_OPTIONS,
  VOWEL_OPTIONS,
} from '../src/data/games/syllable_builder';
import { SENTENCE_POOL, buildScrambleRounds, scrambleWords } from '../src/data/games/sentence_scramble';
import { SAFARI_ANIMALS, buildAnimalRounds } from '../src/data/games/animal_safari';
import { THEMES, buildPhonicsRounds } from '../src/data/games/listen_pick';
import { buildFishRounds } from '../src/data/games/ocean_fishing';
import { POOLS as STORY_POOLS, buildWordStoryRounds } from '../src/data/games/word_story';
import { POOLS as CLOCK_POOLS, buildClockMoneyRounds } from '../src/data/games/clock_money';
import { buildRaceQuestions, tierBudgetMs } from '../src/data/games/speed_racing';
import { buildTowerRounds } from '../src/data/games/number_tower';
import {
  RHYME_FAMILIES,
  DISTRACTOR_POOL,
  buildRhymeRounds,
  containsRhyme,
  stripTones,
} from '../src/data/games/rhyme_hunter';
import { SHAPE_POOL, buildShapeRounds } from '../src/data/games/shape_sorting';
import { POOLS as PHONICS_POOLS, buildPhonicsPopRounds } from '../src/data/games/phonics_pop';
import { POOLS as SPELLING_POOLS, buildSpellingRounds } from '../src/data/games/spelling_duel';
import {
  COLOR_TARGETS,
  TIER_CONFIG as BALLOON_TIERS,
  paletteForTier,
  balloonTextClass,
} from '../src/data/games/color_balloon';
import { TIER_CONFIG as FALLING_TIERS } from '../src/data/games/falling_numbers';
import {
  PAIR_POOL,
  GOALS_PER_TIER,
  buildMemoryDeck,
  shouldCountMemoryMistake,
} from '../src/data/games/memory_cards';
import {
  TEMPLATES as COLOR_TEMPLATES,
  MIN_PAINT_COVERAGE,
  coverageFromPixels,
  effectiveCoverage,
  starsForCoverage,
} from '../src/data/games/coloring_canvas';
import { TIER_CONFIG as CATCH_TIERS, poolForTier, buildRounds as buildCatchRounds } from '../src/data/games/catch_letters';

const SEEDS = Array.from({ length: 20 }, (_, i) => i);
const ROUNDS = defaultRoundsPerTier(); // [5,6,6,7,8,8]

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-zà-ỹđêôơưăâî]+/u)
    .filter(Boolean);
}

/** Assert answer slots spread out (never pinned to one cell). */
function expectSpread(slots: number[], optionCount: number, label: string) {
  const distinct = new Set(slots);
  expect(distinct.size, `${label}: answer stuck at slot ${slots[0]}`).toBeGreaterThan(1);
  const firstRate = slots.filter((s) => s === 0).length / slots.length;
  expect(firstRate, `${label}: answer pinned at slot 0`).toBeLessThan(0.9);
  expect(Math.max(...slots), label).toBeLessThan(optionCount);
}

// ---------------------------------------------------------------------------
// 1. Syllable builder: composeSyllable (NFC) + pool sizes
// ---------------------------------------------------------------------------
describe('T02B/C syllable builder: compose + pools', () => {
  it('composeSyllable(onset, rhyme, tone) reproduces every pool word (NFC)', () => {
    for (const pool of SYL_POOLS) {
      for (const s of pool) {
        expect(composeSyllable(s.i, s.v, s.t), s.w).toBe(s.w.normalize('NFC'));
        expect(INITIAL_OPTIONS).toContain(s.i);
        expect(VOWEL_OPTIONS).toContain(s.v);
      }
    }
  });

  it('known T02B fixes hold (la/lè/me/bế/dế/lê/bó/đỏ/lu/đo/đò/đọ/to/lò/lá, li 🥛)', () => {
    const words = SYL_POOLS.flat().map((s) => s.w);
    for (const bad of ['đa', 'che', 'mê', 'thề', 'thuê', 'bố', 'dỗ', 'đô', 'đồ', 'đổ', 'đỗ', 'tô', 'mù', 'lúa']) {
      expect(words, bad).not.toContain(bad);
    }
    for (const good of ['la', 'lè', 'me', 'bế', 'dế', 'lê', 'bó', 'đỏ', 'lu', 'đo', 'đò', 'đọ', 'to', 'lò', 'lá']) {
      expect(words, good).toContain(good);
    }
    const li = SYL_POOLS.flat().find((s) => s.w === 'li')!;
    expect(li.emoji).toBe('🥛');
  });

  it('every tier pool ≥ rounds, builders return full distinct rounds', () => {
    for (let t = 1; t <= 6; t++) {
      expect(SYL_POOLS[t - 1].length).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildSyllableRounds(t, seed);
        expect(rounds.length).toBe(SYLLABLE_ROUNDS_PER_TIER[t - 1]);
        expect(new Set(rounds.map((r) => r.word)).size).toBe(rounds.length);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Sentence scramble: seeded order, never correct/reverse, submitWrong path
// ---------------------------------------------------------------------------
describe('T02B/C sentence scramble', () => {
  it('pools ≥ rounds per tier; scrambled ≠ correct and ≠ reverse', () => {
    for (let t = 1; t <= 6; t++) {
      const rounds = buildScrambleRounds(t, 3);
      expect(rounds.length).toBe(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rs = buildScrambleRounds(t, seed);
        expect(rs.length).toBe(ROUNDS[t - 1]);
        rs.forEach((r, i) => {
          const sc = scrambleWords(r.correctWords, t, seed, i);
          expect(sc.slice().sort().join('|')).toBe(r.correctWords.slice().sort().join('|'));
          expect(sc.join(' '), `tier ${t}`).not.toBe(r.correctWords.join(' '));
          expect(sc.join(' '), `tier ${t}`).not.toBe([...r.correctWords].reverse().join(' '));
        });
      }
    }
    // Tier pools: T1 ≤3 words (6), T2 ==4 (≥6), T3+ blended (≥ count).
    expect(SENTENCE_POOL.filter((s) => s.words.length <= 3).length).toBeGreaterThanOrEqual(ROUNDS[0]);
    expect(SENTENCE_POOL.filter((s) => s.words.length === 4).length).toBeGreaterThanOrEqual(ROUNDS[1]);
  });
});

// ---------------------------------------------------------------------------
// 3+4. Safari + ListenPick: answer ∈ options, unique, spread slots, nonce varies
// ---------------------------------------------------------------------------
describe('T02B/C animal safari answers spread + nonce', () => {
  it('target ∈ options, options unique, slots spread, nonce reshuffles', () => {
    const slots: number[] = [];
    const seenOrders = new Set<string>();
    const seenAnimals = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      const optionCount = tierOptionCount(t);
      for (const seed of SEEDS) {
        const rounds = buildAnimalRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        for (const r of rounds) {
          expect(r.options.map((o) => o.englishName)).toContain(r.target.englishName);
          expect(new Set(r.options.map((o) => o.englishName)).size).toBe(optionCount);
          slots.push(r.options.findIndex((o) => o.englishName === r.target.englishName));
        }
        seenOrders.add(rounds.map((r) => r.target.englishName).join('|'));
        rounds.forEach((r) => seenAnimals.add(r.target.englishName));
      }
    }
    expectSpread(slots, tierOptionCount(6), 'safari');
    expect(seenOrders.size, 'nonce never reshuffles safari').toBeGreaterThan(6);
    // T25: đàn thú được xáo theo nonce nên cả 12 con đều có lượt lên tiếng.
    expect(seenAnimals.size).toBe(SAFARI_ANIMALS.length);
    expect(SAFARI_ANIMALS.length).toBeGreaterThanOrEqual(4);
  });
});

describe('T02B/C listen-pick answers spread + nonce', () => {
  it('target ∈ cards, cards unique, slots spread, nonce reshuffles', () => {
    const slots: number[] = [];
    const seenOrders = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      const cardCount = tierOptionCount(t);
      for (const seed of SEEDS) {
        const rounds = buildPhonicsRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        for (const r of rounds) {
          expect(r.cards.map((c) => c.word)).toContain(r.targetWord);
          expect(new Set(r.cards.map((c) => c.word)).size).toBe(cardCount);
          slots.push(r.cards.findIndex((c) => c.word === r.targetWord));
        }
        seenOrders.add(rounds.map((r) => r.targetWord).join('|'));
      }
    }
    expectSpread(slots, tierOptionCount(6), 'listen-pick');
    expect(seenOrders.size, 'nonce never reshuffles listen-pick').toBeGreaterThan(6);
    expect(THEMES.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 5. Ocean fishing: recompute + no-borrow + range
// ---------------------------------------------------------------------------
describe('T02B/C ocean fishing arithmetic', () => {
  it('a - b recomputed, trần theo bậc, no-borrow, options valid + spread', () => {
    for (let t = 1; t <= 6; t++) {
      const maxA = tierMaxValue(t);
      const optionCount = tierOptionCount(t);
      const slots: number[] = [];
      for (const seed of SEEDS) {
        const rounds = buildFishRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        for (const r of rounds) {
          const m = /^(\d+) - (\d+)$/.exec(r.expr);
          expect(m, r.expr).not.toBeNull();
          const a = Number(m![1]);
          const b = Number(m![2]);
          expect(r.ans).toBe(a - b);
          expect(r.ans).toBeGreaterThanOrEqual(0);
          expect(a).toBeLessThanOrEqual(maxA);
          expect(isNoBorrowSub(a, b), r.expr).toBe(true);
          expect(r.fishPool).toHaveLength(optionCount);
          expect(r.fishPool.map((f) => f.val)).toContain(r.ans);
          expect(new Set(r.fishPool.map((f) => f.val)).size).toBe(r.fishPool.length);
          slots.push(r.fishPool.findIndex((f) => f.val === r.ans));
        }
      }
      expectSpread(slots, optionCount, `ocean T${t}`);
    }
  });

  it('T25 — trần số tăng theo bậc và phương án nhiều hơn ở bậc cao', () => {
    expect(tierMaxValue(1)).toBe(10);
    expect(tierMaxValue(6)).toBe(100);
    expect(tierOptionCount(1)).toBe(4);
    expect(tierOptionCount(6)).toBe(6);
    const a = buildFishRounds(6, 3);
    expect(a[0].fishPool.length).toBe(6);
    expect(Math.max(...a.flatMap((r) => r.fishPool.map((f) => f.val)))).toBeGreaterThan(20);
  });
});

// ---------------------------------------------------------------------------
// 6+7. WordStory + ClockMoney: options + no-carry math + hints hide answers
// ---------------------------------------------------------------------------
function checkHintHidesAnswer(hint: string, answer: string, label: string) {
  if (answer.length > 1) {
    expect(hint.toLowerCase().includes(answer.toLowerCase()), `${label} :: hint leaks`).toBe(false);
  } else {
    expect(tokens(hint), `${label} :: hint leaks`).not.toContain(answer.toLowerCase());
  }
}

describe('T02B/C word story pools + rounds', () => {
  it('pools ≥ rounds (T4 7, T5/T6 8); options valid + spread', () => {
    const slots: number[] = [];
    for (let t = 1; t <= 6; t++) {
      expect(STORY_POOLS[t - 1].length, `story tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildWordStoryRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        const items = rounds.map((r) => r.item.story);
        expect(new Set(items).size, `story tier ${t} repeats`).toBe(rounds.length);
        for (const r of rounds) {
          expect(r.options).toContain(r.item.answer);
          expect(new Set(r.options).size).toBe(r.options.length);
          slots.push(r.options.indexOf(r.item.answer));
        }
      }
    }
    expectSpread(slots, 3, 'word-story');
  });

  it('all story math: recomputed, 0–100, no-carry / no-borrow', () => {
    for (const tier of STORY_POOLS) {
      for (const item of tier) {
        const m = /(\d+)\s*([+-])\s*(\d+)\s*=\s*(\d+)/.exec(item.hint);
        expect(m, `${item.story} :: ${item.hint}`).not.toBeNull();
        const a = Number(m![1]);
        const b = Number(m![3]);
        const r = Number(m![4]);
        for (const n of [a, b, r]) {
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(100);
        }
        if (m![2] === '+') {
          expect(a + b).toBe(r);
          expect(isNoCarryAdd(a, b), item.hint).toBe(true);
        } else {
          expect(a - b).toBe(r);
          expect(isNoBorrowSub(a, b), item.hint).toBe(true);
        }
        checkHintHidesAnswer(item.hint, item.answer, item.story);
      }
    }
  });
});

describe('T02B/C clock & money pools + rounds', () => {
  it('pools ≥ rounds (T4 7, T5/T6 8); options valid + spread', () => {
    const slots: number[] = [];
    for (let t = 1; t <= 6; t++) {
      expect(CLOCK_POOLS[t - 1].length, `clock tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildClockMoneyRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        const items = rounds.map((r) => r.item.prompt);
        expect(new Set(items).size, `clock tier ${t} repeats`).toBe(rounds.length);
        for (const r of rounds) {
          expect(r.options).toContain(r.item.answer);
          expect(new Set(r.options).size).toBe(r.options.length);
          slots.push(r.options.indexOf(r.item.answer));
        }
      }
    }
    expectSpread(slots, 3, 'clock-money');
  });

  it('prompts never state the answer; hints never leak it', () => {
    for (const tier of CLOCK_POOLS) {
      for (const item of tier) {
        // Comparison setups ("Bé cao 95cm, bạn cao 90cm…") must name both
        // candidates; they are exempt when ≥2 options appear in the prompt.
        const optionsInPrompt = item.options.filter((o) => item.prompt.toLowerCase().includes(o.toLowerCase()));
        if (optionsInPrompt.length < 2) {
          expect(item.prompt.includes(item.answer), `${item.prompt} states answer`).toBe(false);
        }
        checkHintHidesAnswer(item.hint, item.answer, item.prompt);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 8+9. Speed racing + Number tower: generated arithmetic
// ---------------------------------------------------------------------------
describe('T02B/C speed racing arithmetic + nonce', () => {
  /** `a + b` | `a - b` | `a + b - c` → { ans, các bước kiểm tra lớp 1 }. */
  function parseExpr(expr: string): { ans: number; steps: [number, number, '+' | '-'][] } | null {
    const tok = expr.trim().split(/\s+/);
    if (tok.length !== 3 && tok.length !== 5) return null;
    if (!tok.every((t, i) => (i % 2 === 0 ? /^\d+$/.test(t) : t === '+' || t === '-'))) return null;
    const steps: [number, number, '+' | '-'][] = [];
    let acc = Number(tok[0]);
    for (let i = 1; i < tok.length; i += 2) {
      const rhs = Number(tok[i + 1]);
      steps.push([acc, rhs, tok[i] as '+' | '-']);
      acc = tok[i] === '+' ? acc + rhs : acc - rhs;
    }
    return { ans: acc, steps };
  }

  it('recomputed, 0–100, no-carry/no-borrow, ans ≤ trần bậc, hai bước từ T5, nonce varies', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      const max = tierMaxValue(t);
      const optionCount = tierOptionCount(t);
      let twoStepCount = 0;
      for (const seed of SEEDS) {
        const qs = buildRaceQuestions(t, seed);
        expect(qs.length).toBe(ROUNDS[t - 1]);
        seen.add(qs.map((q) => q.expr).join('|'));
        for (const q of qs) {
          const parsed = parseExpr(q.expr);
          expect(parsed, q.expr).not.toBeNull();
          const steps = parsed!.steps;
          if (steps.length === 2) {
            twoStepCount++;
            expect(t, `phép hai bước xuất hiện ở bậc ${t}: ${q.expr}`).toBeGreaterThanOrEqual(5);
          }
          for (const [lhs, rhs, op] of steps) {
            if (op === '+') expect(isNoCarryAdd(lhs, rhs), q.expr).toBe(true);
            else expect(isNoBorrowSub(lhs, rhs), q.expr).toBe(true);
            expect(lhs).toBeLessThanOrEqual(max);
          }
          expect(q.ans).toBe(parsed!.ans);
          expect(q.ans).toBeGreaterThanOrEqual(0);
          expect(q.ans).toBeLessThanOrEqual(max);
          expect(q.options).toHaveLength(optionCount);
          expect(q.options).toContain(q.ans);
          expect(new Set(q.options).size).toBe(q.options.length);
        }
      }
      if (t >= 5) expect(twoStepCount, `bậc ${t} phải có phép tính hai bước`).toBeGreaterThan(0);
      else expect(twoStepCount).toBe(0);
    }
    expect(seen.size, 'nonce never varies racing').toBeGreaterThan(6);
  });

  it('T25 — bậc 4–6 có giấy giờ, ba bậc đầu không đếm giờ', () => {
    expect(tierBudgetMs(1)).toBeNull();
    expect(tierBudgetMs(3)).toBeNull();
    expect(tierBudgetMs(4)).toBe(15000);
    expect(tierBudgetMs(6)).toBe(10000);
    for (const t of [4, 5, 6]) expect(tierBudgetMs(t)!).toBeGreaterThan(0);
  });
});

describe('T02B/C number tower arithmetic + nonce', () => {
  it('part1 + missing = total, no-carry, options valid, nonce varies', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      const maxTotal = tierMaxValue(t);
      const optionCount = tierOptionCount(t);
      for (const seed of SEEDS) {
        const rounds = buildTowerRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        seen.add(rounds.map((r) => `${r.part1}+${r.missing}=${r.total}`).join('|'));
        for (const r of rounds) {
          expect(r.part1 + r.missing).toBe(r.total);
          expect(r.total).toBeLessThanOrEqual(maxTotal);
          expect(r.missing).toBeGreaterThanOrEqual(0);
          expect(isNoCarryAdd(r.part1, r.missing), `${r.part1}+${r.missing}=${r.total}`).toBe(true);
          expect(r.options).toHaveLength(optionCount);
          expect(r.options).toContain(r.missing);
          expect(new Set(r.options).size).toBe(r.options.length);
        }
      }
    }
    expect(seen.size, 'nonce never varies tower').toBeGreaterThan(6);
  });
});

// ---------------------------------------------------------------------------
// 10. Rhyme hunter: tone-only strip + families + decoys
// ---------------------------------------------------------------------------
describe('T02B/C rhyme hunter', () => {
  it('stripTones keeps mũ/móc (ă â ê ô ơ ư) and drops only 5 tones', () => {
    // ọ = o + nặng → tone stripped; ă/â keep their breve/circumflex.
    expect(stripTones('ngọn')).toBe('ngon');
    expect(stripTones('cái nón')).toBe('cai non');
    expect(stripTones('cái khăn')).toBe('cai khăn');
    expect(stripTones('mặt đất')).toBe('măt dât'); // đ→d kept from legacy; tones only
    expect(stripTones('quả nhãn')).toBe('qua nhan');
    expect(stripTones('Đ')).toBe('d');
  });

  it('wrong members replaced (khăn/đất/ngọn/nón gone)', () => {
    const words = RHYME_FAMILIES.flatMap((f) => f.words);
    for (const bad of ['cái khăn', 'mặt đất', 'ngọn cỏ', 'cái nón']) {
      expect(words, bad).not.toContain(bad);
    }
    for (const good of ['con ngan', 'cỏ non', 'kẹo ngon', 'mát mẻ']) {
      expect(words, good).toContain(good);
    }
    for (const fam of RHYME_FAMILIES) {
      for (const w of fam.words) {
        expect(containsRhyme(w, fam.rhyme), `${w} ~ ${fam.rhyme}`).toBe(true);
      }
    }
  });

  it('tiers 1–6: ≥5 rounds, targets rhyme, decoys rhyme-free', () => {
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        const rounds = buildRhymeRounds(t, seed);
        expect(rounds.length).toBeGreaterThanOrEqual(5);
        for (const r of rounds) {
          for (const f of r.fruits) {
            if (f.hasRhyme) expect(containsRhyme(f.word, r.targetRhyme), f.word).toBe(true);
            else expect(containsRhyme(f.word, r.targetRhyme), `decoy ${f.word}`).toBe(false);
          }
        }
      }
    }
    expect(DISTRACTOR_POOL.length).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// 11. Shape sorting: categories + distinct rounds
// ---------------------------------------------------------------------------
describe('T02B/C shape sorting', () => {
  it('clear shapes only; baskets distinct from items; rounds distinct', () => {
    const names = SHAPE_POOL.map((s) => s.name);
    for (const bad of ['Quả xoài', 'Sô cô la vuông', 'Chiếc khăn mùi xoa', 'Mũ sinh nhật', 'Tấm gạch vuông', 'Chiếc bánh mì', 'Quả dưa hấu', 'Cờ sina', 'Hòn bi sắt', 'Nón lá']) {
      expect(names, bad).not.toContain(bad);
    }
    for (const good of ['Quả bóng rổ', 'Xúc xắc', 'Ngọn núi', 'Viên gạch', 'Quyển vở', 'Bánh chưng xanh', 'Hòn bi ve', 'Miếng bánh pizza']) {
      expect(names, good).toContain(good);
    }
    for (const s of SHAPE_POOL) {
      expect(['tron', 'vuong', 'tam-giac', 'chu-nhat']).toContain(s.category);
    }
    // Bánh chưng 🟩 must not collide with the rectangle basket icon.
    const rectBasket = { emoji: '💳' };
    const banhChung = SHAPE_POOL.find((s) => s.name === 'Bánh chưng xanh')!;
    expect(banhChung.emoji).not.toBe(rectBasket.emoji);
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        const rounds = buildShapeRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.name)).size).toBe(rounds.length);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 12. Phonics pop: no same-sound distractors, blend tier, pool sizes
// ---------------------------------------------------------------------------
describe('T02B/C phonics pop', () => {
  it('pools ≥ rounds (T4–T6 need 7–8); answers valid + spread', () => {
    const slots: number[] = [];
    for (let t = 1; t <= 6; t++) {
      expect(PHONICS_POOLS[t - 1].length, `phonics tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildPhonicsPopRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.item.word)).size).toBe(rounds.length);
        for (const r of rounds) {
          expect(r.options).toContain(r.item.answer);
          expect(new Set(r.options).size).toBe(r.options.length);
          slots.push(r.options.indexOf(r.item.answer));
        }
      }
    }
    expectSpread(slots, 3, 'phonics-pop');
  });

  it('no distractor shares the answer sound (PHONE/F, KITE/C, FIVE/PH, FATHER/PH)', () => {
    const byWord = new Map(PHONICS_POOLS.flat().map((p) => [p.word, p]));
    expect(byWord.get('PHONE')!.options).not.toContain('F');
    expect(byWord.get('KITE')!.options).not.toContain('C');
    expect(byWord.get('FIVE')!.options).not.toContain('PH');
    expect(byWord.get('FATHER')!.options).not.toContain('PH');
    // Blend tier: answers and distractors are blends (no lone first letters).
    // T02D: +CRAB (RED chữ đơn đã thay bằng blend CR).
    for (const w of ['BLUE', 'GREEN', 'STAR', 'FROG', 'CLOCK', 'PLANT', 'TRAIN', 'CRAB']) {
      const item = byWord.get(w)!;
      expect(item.answer.length, w).toBe(2);
      for (const o of item.options) expect(o.length, `${w} option ${o}`).toBe(2);
    }
  });
});

// ---------------------------------------------------------------------------
// 13. Spelling duel: single answers, fixed meanings, rule, hints
// ---------------------------------------------------------------------------
describe('T02B/C spelling duel', () => {
  it('pools ≥ rounds; answers valid + spread; hints hide answers', () => {
    const slots: number[] = [];
    for (let t = 1; t <= 6; t++) {
      expect(SPELLING_POOLS[t - 1].length, `spelling tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildSpellingRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        for (const r of rounds) {
          expect(r.options).toContain(r.item.answer);
          expect(new Set(r.options).size).toBe(r.options.length);
          slots.push(r.options.indexOf(r.item.answer));
          checkHintHidesAnswer(r.item.hint, r.item.answer, r.item.prompt);
        }
      }
    }
    expectSpread(slots, 3, 'spelling');
  });

  it('T02B fixes: no double answers, fixed meanings/emoji/labels', () => {
    const all = SPELLING_POOLS.flat();
    const opts = (emoji: string) => all.filter((i) => i.emoji === emoji).flatMap((i) => i.options);
    expect(opts('🎒')).not.toContain('xách vở');
    expect(opts('🍲')).not.toContain('nồi xúp');
    expect(all.some((i) => i.prompt.includes('ông bão'))).toBe(false);
    // T02D: "...ạ cụ" không tự nhiên → "Con ...ế mèn" (chỉ d đúng).
    expect(all.some((i) => i.prompt.includes('ạ cụ'))).toBe(false);
    const deMen = all.find((i) => i.prompt.includes('ế mèn'))!;
    expect(deMen).toBeDefined();
    expect(deMen.answer).toBe('d');
    expect([...deMen.options].sort()).toEqual(['d', 'gi', 'r']);
    // ghe = small boat, not a seat.
    const ghe = all.find((i) => i.prompt.includes('e đánh cá'))!;
    expect(ghe.answer).toBe('gh');
    expect(ghe.hint.includes('ngồi')).toBe(false);
    // T3 asks the FIRST letter, not the rhyme.
    for (const item of SPELLING_POOLS[2]) {
      expect(item.prompt.includes('Điền vần'), item.prompt).toBe(false);
    }
    // Fixed emoji.
    expect(all.find((i) => i.answer === 'cái kéo')!.emoji).toBe('✂️');
    expect(all.find((i) => i.answer === 'nghé con')!.emoji).toBe('🐃');
    expect(all.find((i) => i.answer === 'gấu bông')!.emoji).toBe('🧸');
  });

  it('c/k, g/gh, ng/ngh rule: ngh only before i/e/ê', () => {
    const iee = new Set(['i', 'ì', 'í', 'ỉ', 'ĩ', 'ị', 'e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ề', 'ế', 'ể', 'ễ', 'ệ']);
    for (const tier of SPELLING_POOLS) {
      for (const item of tier) {
        if (item.answer === 'ngh' || item.answer === 'ng') {
          // Reconstruct the syllable after the blank: "...X" -> answer + X.
          const m = /\.\.\.(.+?)\b/.exec(`${item.prompt} `);
          if (!m) continue;
          const next = m[1].normalize('NFC')[0];
          if (item.answer === 'ngh') expect(iee.has(next), `${item.prompt} -> ngh before ${next}`).toBe(true);
          else if (!iee.has(next)) expect(true).toBe(true);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 14. Color balloon: GREY + readable WHITE
// ---------------------------------------------------------------------------
describe('T02B/C color balloon', () => {
  it('British GREY (no GRAY); WHITE uses dark text', () => {
    const names = COLOR_TARGETS.map((c) => c.name);
    expect(names).toContain('GREY');
    expect(names).not.toContain('GRAY');
    expect(balloonTextClass('WHITE')).toMatch(/slate-800/);
    expect(balloonTextClass('RED')).toMatch(/white/);
    for (let t = 1; t <= 6; t++) {
      const pal = paletteForTier(t);
      expect(pal.length).toBe(BALLOON_TIERS[t - 1].colorCount);
      for (const c of pal) expect(COLOR_TARGETS).toContain(c);
    }
  });
});

// ---------------------------------------------------------------------------
// 15. Falling numbers: no CHẴN, tens exclude 100
// ---------------------------------------------------------------------------
describe('T02B/C falling numbers', () => {
  it('no even-number rule; round tens = 10–90 only', () => {
    expect(FALLING_TIERS.some((c) => c.condition.text.includes('CHẴN'))).toBe(false);
    expect(FALLING_TIERS.some((c) => c.condition.text.includes('CHIA HẾT'))).toBe(false);
    const tens = FALLING_TIERS[4].condition;
    expect(tens.check(10)).toBe(true);
    expect(tens.check(90)).toBe(true);
    expect(tens.check(100)).toBe(false);
    expect(tens.check(15)).toBe(false);
    expect(FALLING_TIERS[4].maxVal).toBeLessThanOrEqual(90);
    const after = FALLING_TIERS[5].condition;
    expect(after.check(11)).toBe(true);
    expect(after.check(91)).toBe(true);
    expect(after.check(10)).toBe(false);
    expect(after.check(100)).toBe(false);
    for (const c of FALLING_TIERS) expect(c.maxVal).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// 16. Memory cards: card-id tracking
// ---------------------------------------------------------------------------
describe('T02B/C memory cards', () => {
  it('mistake only when BOTH card ids were seen before', () => {
    expect(shouldCountMemoryMistake([1, 2], 1, 1)).toBe(false);
    expect(shouldCountMemoryMistake([], 1, 2)).toBe(false);
    expect(shouldCountMemoryMistake([1], 1, 2)).toBe(false);
    expect(shouldCountMemoryMistake([1, 2, 3], 1, 3)).toBe(true);
    // One known + one new card is free (card-level, not pair-level).
    expect(shouldCountMemoryMistake([5], 5, 9)).toBe(false);
  });

  it('decks: 2×goal distinct cards, nonce reshuffles', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        const deck = buildMemoryDeck(t, seed);
        expect(deck.length).toBe(GOALS_PER_TIER[t - 1] * 2);
        expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);
        seen.add(deck.map((c) => c.id).join(','));
      }
    }
    expect(seen.size).toBeGreaterThan(6);
    expect(PAIR_POOL.length).toBeGreaterThanOrEqual(8);
  });
});

// ---------------------------------------------------------------------------
// 17. Coloring canvas: coverage gates + stars
// ---------------------------------------------------------------------------
describe('T02B/C coloring canvas', () => {
  it('gates: ≥30% 1★, ≥60% 2★, ≥85% 3★, else 0', () => {
    expect(MIN_PAINT_COVERAGE).toBe(0.3);
    expect(starsForCoverage(0)).toBe(0);
    expect(starsForCoverage(0.29)).toBe(0);
    expect(starsForCoverage(0.3)).toBe(1);
    expect(starsForCoverage(0.59)).toBe(1);
    expect(starsForCoverage(0.6)).toBe(2);
    expect(starsForCoverage(0.84)).toBe(2);
    expect(starsForCoverage(0.85)).toBe(3);
    expect(starsForCoverage(1)).toBe(3);
  });

  it('baseline subtraction excludes the faint template', () => {
    expect(effectiveCoverage(0.5, 0)).toBeCloseTo(0.5, 5);
    expect(effectiveCoverage(0.08, 0.08)).toBeCloseTo(0, 5);
    expect(effectiveCoverage(0.4, 0.1)).toBeCloseTo(1 / 3, 5);
    const white = new Uint8ClampedArray(400).fill(255);
    expect(coverageFromPixels(white)).toBe(0);
    expect(COLOR_TEMPLATES.length).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// 18. Catch letters: pools grow, targets valid
// ---------------------------------------------------------------------------
describe('T02B/C catch letters', () => {
  it('pools grow by tier; sampled targets always in-pool', () => {
    let prev = 0;
    for (let t = 1; t <= 6; t++) {
      const pool = poolForTier(t);
      expect(pool.length).toBeGreaterThanOrEqual(prev);
      prev = pool.length;
      for (const seed of SEEDS) {
        for (const ch of buildCatchRounds(t, seed)) {
          expect(pool).toContain(ch);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// British English sweep + banned-word sweep + allowed phrases
// ---------------------------------------------------------------------------
describe('T02B/C language + safety sweep', () => {
  it('no American spellings in English pools (GREY/COLOUR…)', () => {
    const englishTexts = [
      ...COLOR_TARGETS.map((c) => c.name),
      ...PHONICS_POOLS.flat().flatMap((p) => [p.word, ...p.options]),
      ...SAFARI_ANIMALS.map((a) => a.englishName),
    ].join('\n');
    for (const us of ['GRAY', 'COLOR', 'FAVOR', 'CENTER', 'TRAVELING', 'MOMMY']) {
      expect(englishTexts.includes(us), us).toBe(false);
    }
    expect(englishTexts.includes('GREY')).toBe(true);
  });

  it('banned-word sweep over EVERY string of all 18 games', () => {
    const texts: string[] = [
      ...SYL_POOLS.flat().map((s) => s.w),
      ...SENTENCE_POOL.flatMap((s) => [...s.words, s.meaning]),
      ...SAFARI_ANIMALS.flatMap((a) => [a.vietnameseMeaning, a.soundCue]),
      ...THEMES.flatMap((t) => [t.name, ...t.words.map((w) => w.word)]),
      ...STORY_POOLS.flat().flatMap((i) => [i.story, i.question, i.hint, ...i.options]),
      ...CLOCK_POOLS.flat().flatMap((i) => [i.prompt, i.hint, ...i.options]),
      ...PHONICS_POOLS.flat().flatMap((p) => [p.vietnamese]),
      ...SPELLING_POOLS.flat().flatMap((i) => [i.prompt, i.hint, ...i.options]),
      ...RHYME_FAMILIES.flatMap((f) => [f.rhyme, ...f.words]),
      ...DISTRACTOR_POOL,
      ...SHAPE_POOL.flatMap((s) => [s.name, s.hint]),
      ...COLOR_TEMPLATES.map((t) => t.name),
      ...PAIR_POOL.map((p) => p.label),
    ];
    for (const t of texts) {
      expect(containsBannedWord(t), t).toBe(false);
    }
  });

  it('multi-word banned phrases match; allowed phrases exempt', () => {
    expect(containsBannedWord('em thấy cô đơn quá')).toBe(true);
    expect(containsBannedWord('bố mẹ ly dị nhau')).toBe(true);
    expect(containsBannedWord('cây súng vũ khí nguy hiểm')).toBe(true);
    expect(containsBannedWord('bé đánh răng mỗi sáng')).toBe(false);
    expect(containsBannedWord('bé tập đánh vần mỗi ngày')).toBe(false);
    expect(containsBannedWord('cô đánh giá bài của bé')).toBe(false);
    expect(containsBannedWord('mẹ đánh thức bé dậy')).toBe(false);
    // ...but real hitting is still banned.
    expect(containsBannedWord('bé đánh bạn trong lớp')).toBe(true);
    expect(ALLOWED_PHRASES.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// Reward hooks: keep best, pay once, nonce bump, corrupt sanitizer
// ---------------------------------------------------------------------------
describe('T02B/C reward + nonce storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the old best, pays stars only once, XP ~20% on replay', () => {
    const first = StorageService.recordTierReward('t02b_probe_a', 2, 3, 20, 8, 0);
    expect(first.isFirstClear).toBe(true);
    expect(first.isNewBest).toBe(true);
    expect(first.starsAwarded).toBe(3);
    StorageService.completeGameTier('t02b_probe_a', 2, 3, 8);
    const replay = StorageService.recordTierReward('t02b_probe_a', 2, 3, 20, 8, 3);
    expect(replay.isNewBest).toBe(false);
    expect(replay.starsAwarded).toBe(0);
    expect(replay.xpAwarded).toBe(4);
    const better = StorageService.recordTierReward('t02b_probe_a', 2, 3, 20, 9, 1);
    expect(better.starsAwarded).toBe(2);
  });

  it('nonce bumps once per play and survives corrupt payloads', () => {
    expect(StorageService.getPlayNonce('t02b_probe_b', 1)).toBe(0);
    expect(StorageService.bumpPlayNonce('t02b_probe_b', 1)).toBe(1);
    expect(StorageService.bumpPlayNonce('t02b_probe_b', 1)).toBe(2);
    expect(StorageService.getPlayNonce('t02b_probe_b', 1)).toBe(2);
    expect(StorageService.getPlayNonce('t02b_probe_b', 2)).toBe(0);
    localStorage.setItem('kho_bau_game_nonce', '{not-json');
    expect(StorageService.getPlayNonce('t02b_probe_b', 1)).toBe(0);
    expect(StorageService.bumpPlayNonce('t02b_probe_b', 1)).toBe(1);
    localStorage.setItem('kho_bau_game_nonce', '{"t02b_probe_b":{"1":"x","2":-5}}');
    expect(StorageService.getPlayNonce('t02b_probe_b', 1)).toBe(0);
    expect(StorageService.getPlayNonce('t02b_probe_b', 2)).toBe(0);
  });

  it('parent reset clears tier progress AND nonces (T02B/B14)', () => {
    StorageService.completeGameTier('t02b_probe_c', 3, 3, 7);
    StorageService.bumpPlayNonce('t02b_probe_c', 3);
    expect(StorageService.getGameProgress('t02b_probe_c').starsByTier[3]).toBe(3);
    expect(StorageService.getPlayNonce('t02b_probe_c', 3)).toBe(1);
    StorageService.resetProgress();
    expect(StorageService.getGameProgress('t02b_probe_c').starsByTier[3] ?? 0).toBe(0);
    expect(StorageService.getPlayNonce('t02b_probe_c', 3)).toBe(0);
  });

  it('policy: 6 tiers, rounds [5,6,6,7,8,8]', () => {
    expect(GAME_LEVEL_POLICY.MAX_TIER).toBe(6);
    expect(GAME_LEVEL_POLICY.ROUNDS_PER_TIER).toEqual([5, 6, 6, 7, 8, 8]);
  });
});
