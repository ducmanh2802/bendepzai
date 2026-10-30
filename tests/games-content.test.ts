import { describe, it, expect } from 'vitest';
import { POOLS as SPELLING_POOLS } from '../src/components/games/SpellingDuelGame';
import { POOLS as STORY_POOLS } from '../src/components/games/WordStoryGame';
import { POOLS as CLOCK_POOLS } from '../src/components/games/ClockMoneyGame';
import { POOLS as PHONICS_POOLS } from '../src/components/games/PhonicsPopGame';
import {
  POOL_BY_TIER as SYLLABLE_POOLS,
  SYLLABLE_ROUNDS_PER_TIER,
  buildSyllableRounds,
  INITIAL_OPTIONS,
  VOWEL_OPTIONS,
} from '../src/components/games/SyllableBuilderGame';
import {
  buildFishRounds,
} from '../src/components/games/OceanFishingGame';
import {
  buildRhymeRounds,
  containsRhyme,
  RHYME_FAMILIES,
} from '../src/components/games/RhymeHunterGame';
import {
  SHAPE_POOL,
  buildShapeRounds,
} from '../src/components/games/ShapeSortingGame';
import { COLOR_TARGETS } from '../src/components/games/EnglishColorBalloonGame';
import { TIER_CONFIG as FALLING_TIERS } from '../src/components/games/FallingNumbersMathGame';
import { tierMaxValue } from '../src/data/games/mathUtils';
import { containsBannedWord } from '../src/data/contentSafety';
import { defaultRoundsPerTier } from '../src/data/gameLevels';

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-zà-ỹđêôơưăâî]+/u)
    .filter(Boolean);
}

describe('T02/A spelling duel content', () => {
  it('every item: answer in options, unique options', () => {
    for (const tier of SPELLING_POOLS) {
      for (const item of tier) {
        expect(item.options, item.prompt).toContain(item.answer);
        expect(new Set(item.options).size, item.prompt).toBe(item.options.length);
        expect(item.options.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('hints never leak the answer', () => {
    for (const tier of SPELLING_POOLS) {
      for (const item of tier) {
        if (item.answer.length > 1) {
          expect(item.hint.includes(item.answer), `${item.prompt} :: ${item.hint}`).toBe(false);
        } else {
          expect(tokens(item.hint), `${item.prompt} :: ${item.hint}`).not.toContain(item.answer);
        }
      }
    }
  });

  it('tiers 1-4 contain no ch/tr/s/x/d/gi/r targets', () => {
    const advanced = new Set(['ch', 'tr', 's', 'x', 'd', 'gi', 'r']);
    for (let t = 0; t < 4; t++) {
      for (const item of SPELLING_POOLS[t]) {
        for (const opt of item.options) {
          expect(advanced.has(opt.trim().toLowerCase()), `T${t + 1} ${item.prompt} -> ${opt}`).toBe(false);
        }
      }
    }
  });

  it('audit-flagged answers are fixed', () => {
    const byEmoji = new Map<string, string[]>();
    for (const tier of SPELLING_POOLS) {
      for (const item of tier) {
        const list = byEmoji.get(item.emoji) ?? [];
        list.push(item.answer);
        byEmoji.set(item.emoji, list);
      }
    }
    expect(byEmoji.get('🙇')).toContain('ngh'); // …iêng đầu chào (was ng; T02B: 🙏→🙇 cho đúng nghĩa)
    expect(byEmoji.get('🐣')).toContain('n'); // …on nớt (was ng)
    expect(byEmoji.get('🦢')).toContain('ng'); // ngỗng (was g; 🦢 thay 🪿 thiếu glyph)
    expect(byEmoji.get('🍎')).toContain('tr'); // trái cây (was …ái bàn)
  });

  it('no joke distractors (doubled letters)', () => {
    const jokes = ['vàngg', 'mèok', 'xẻngg', 'họk', 'khuyếk', 'vuj', 'vởx', 'trea', 'trờj'];
    const allOptions = SPELLING_POOLS.flat().flatMap((i) => i.options);
    for (const j of jokes) {
      expect(allOptions.some((o) => o.includes(j))).toBe(false);
    }
  });
});

describe('T02/A ocean fishing: no negative subtraction', () => {
  it('tiers 1-6: a >= b, result >= 0 and in range', () => {
    for (let t = 1; t <= 6; t++) {
      const rounds = buildFishRounds(t, 0, 1234 + t);
      expect(rounds.length).toBeGreaterThan(0);
      for (const r of rounds) {
        const m = /^(\d+) - (\d+)$/.exec(r.expr);
        expect(m, r.expr).not.toBeNull();
        const a = Number(m![1]);
        const b = Number(m![2]);
        expect(a, r.expr).toBeGreaterThanOrEqual(b);
        expect(r.ans).toBe(a - b);
        expect(r.ans).toBeGreaterThanOrEqual(0);
        expect(r.ans).toBeLessThanOrEqual(tierMaxValue(t));
        expect(r.fishPool.map((f) => f.val)).toContain(r.ans);
        expect(new Set(r.fishPool.map((f) => f.val)).size).toBe(r.fishPool.length);
      }
    }
  });
});

describe('T02/A rhyme hunter: rhyme-based decoys, >= 5 rounds', () => {
  it('known targets contain their rhyme', () => {
    for (const fam of RHYME_FAMILIES) {
      for (const w of fam.words) {
        expect(containsRhyme(w, fam.rhyme), `${w} ~ ${fam.rhyme}`).toBe(true);
      }
    }
    // Old decoy bug: "con cá/con chó/con vịt" contain "on"
    expect(containsRhyme('con cá', 'on')).toBe(true);
  });

  it('tiers 1-6: >= 5 rounds, decoys rhyme-free', () => {
    for (let t = 1; t <= 6; t++) {
      const rounds = buildRhymeRounds(t, 0, 77 + t);
      expect(rounds.length, `tier ${t}`).toBeGreaterThanOrEqual(5);
      expect(rounds.length).toBe(defaultRoundsPerTier()[t - 1]);
      for (const r of rounds) {
        for (const f of r.fruits) {
          if (f.hasRhyme) {
            expect(containsRhyme(f.word, r.targetRhyme), f.word).toBe(true);
          } else {
            expect(containsRhyme(f.word, r.targetRhyme), `decoy "${f.word}" ~ ${r.targetRhyme}`).toBe(false);
          }
        }
      }
    }
  });
});

describe('T02/A syllable builder: safe words, big pools', () => {
  it('6 tiers x 12 items, pool du cho 1.5x so vong cao nhat (T25)', () => {
    expect(SYLLABLE_POOLS.length).toBe(6);
    const maxRounds = Math.max(...SYLLABLE_ROUNDS_PER_TIER);
    for (const pool of SYLLABLE_POOLS) {
      expect(pool.length).toBeGreaterThanOrEqual(Math.ceil(1.5 * maxRounds));
      expect(pool.length).toBeGreaterThanOrEqual(maxRounds);
    }
  });

  it('no banned words, valid initials/vowels, correct emoji', () => {
    const validTones = new Set(['ngang', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng']);
    for (const pool of SYLLABLE_POOLS) {
      for (const s of pool) {
        expect(containsBannedWord(s.w), s.w).toBe(false);
        expect(INITIAL_OPTIONS, s.w).toContain(s.i);
        expect(VOWEL_OPTIONS, s.w).toContain(s.v);
        expect(validTones.has(s.t), s.w).toBe(true);
      }
    }
    const byWord = new Map(SYLLABLE_POOLS.flat().map((s) => [s.w, s.emoji]));
    expect(byWord.get('cọ')).toBe('🖌️');
    expect(byWord.get('mò')).toBe('🦀');
    expect([...byWord.values()].some((e) => ['🛒', '🧹', '🎒', '🪦', '🪃'].includes(e))).toBe(false);
  });

  it('builder returns full rounds without cycling', () => {
    for (let t = 1; t <= 6; t++) {
      const rounds = buildSyllableRounds(t, 0, 999);
      expect(rounds.length).toBe(SYLLABLE_ROUNDS_PER_TIER[t - 1]);
      expect(new Set(rounds.map((r) => r.word)).size).toBe(rounds.length);
    }
  });
});

describe('T02/A shape sorting labels', () => {
  it('wrong labels are gone, categories valid', () => {
    const names = SHAPE_POOL.map((s) => s.name);
    expect(names).not.toContain('Cờ sina');
    expect(names).not.toContain('Hòn bi sắt');
    expect(names).not.toContain('Điểm an toàn');
    expect(names).not.toContain('Gói kẹo vuông');
    expect(names).not.toContain('Nón lá'); // T02D: 👒 là mũ tròn rộng vành, không phải tam giác → "Ngọn núi" ⛰️
    expect(names).toContain('Ngọn núi'); // T02D: chóp núi hình tam giác rõ ràng
    expect(names).toContain('Hòn bi ve');
    expect(names).toContain('Miếng bánh pizza');
    expect(names).toContain('Bánh chưng xanh');
    for (const s of SHAPE_POOL) {
      expect(['tron', 'vuong', 'tam-giac', 'chu-nhat']).toContain(s.category);
    }
  });

  it('builds enough distinct rounds', () => {
    for (let t = 1; t <= 6; t++) {
      const rounds = buildShapeRounds(t, 0, 555);
      expect(rounds.length).toBe(defaultRoundsPerTier()[t - 1]);
    }
  });
});

describe('T02/A phonics pop labels', () => {
  it('ONE/PHO/THIN/SCH fixed, answers in options', () => {
    const words = PHONICS_POOLS.flat().map((p) => p.word);
    expect(words).not.toContain('ONE');
    expect(words).not.toContain('PHO');
    expect(words).toContain('ORANGE');
    expect(words).toContain('PHONE');
    const school = PHONICS_POOLS.flat().find((p) => p.word === 'SCHOOL')!;
    expect(school.answer).toBe('S');
    const thin = PHONICS_POOLS.flat().find((p) => p.word === 'THIN')!;
    expect(thin.emoji).not.toBe('📏');
    for (const tier of PHONICS_POOLS) {
      for (const p of tier) {
        expect(p.options).toContain(p.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
      }
    }
  });
});

describe('T02/A color balloon palette', () => {
  it('only Grade-1 colours', () => {
    const names = COLOR_TARGETS.map((c) => c.name);
    expect(names).not.toContain('TURQUOISE');
    expect(names).not.toContain('LIME');
    expect(names).toContain('WHITE');
    const allowed = new Set(['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'BLACK', 'WHITE', 'BROWN', 'GREY']); // T02B: GREY (Anh–Anh)
    for (const n of names) expect(allowed.has(n)).toBe(true);
  });
});

describe('T02/A6 word story tiers 4-6: no-carry, <= 100', () => {
  it('additions never carry, subtractions never borrow', () => {
    for (let t = 3; t < 6; t++) {
      for (const item of STORY_POOLS[t]) {
        const m = /(\d+)\s*([+-])\s*(\d+)\s*=\s*(\d+)/.exec(item.hint);
        expect(m, `${item.story} :: ${item.hint}`).not.toBeNull();
        const a = Number(m![1]);
        const b = Number(m![3]);
        const r = Number(m![4]);
        for (const n of [a, b, r]) expect(n).toBeLessThanOrEqual(100);
        expect(item.options).toContain(item.answer);
        if (m![2] === '+') {
          expect(((a % 10) + (b % 10)) <= 9, item.hint).toBe(true);
          expect(a + b).toBe(r);
        } else {
          expect((a % 10) >= (b % 10), item.hint).toBe(true);
          expect(a - b).toBe(r);
          expect(a).toBeGreaterThanOrEqual(b);
        }
      }
    }
  });
});

describe('T02/A6 clock & money: grade-1 only', () => {
  it('no km/dm/30-phut/half-hour, answers in options', () => {
    const joined = CLOCK_POOLS.flat().map((i) => `${i.prompt} ${i.options.join(' ')}`.toLowerCase());
    const bad = ['km', 'dm', '30 phút', 'rưỡi', '1000m'];
    for (const text of joined) {
      const toks = new Set(tokens(text.replace(/đ/g, ' dong ')));
      expect(toks.has('km'), text).toBe(false);
      expect(toks.has('dm'), text).toBe(false);
      expect(text.includes('30 phút')).toBe(false);
      expect(text.includes('rưỡi')).toBe(false);
      expect(text.includes('1000m')).toBe(false);
    }
    for (const tier of CLOCK_POOLS) {
      for (const i of tier) {
        expect(i.options).toContain(i.answer);
        expect(new Set(i.options).size).toBe(i.options.length);
      }
    }
  });
});

describe('T02/A6 falling numbers tiers', () => {
  it('no division concept; round tens + after-round-ten', () => {
    expect(FALLING_TIERS.length).toBe(6);
    expect(FALLING_TIERS.some((c) => c.condition.text.includes('CHIA HẾT'))).toBe(false);
    const t5 = FALLING_TIERS[4].condition;
    expect(t5.check(10)).toBe(true);
    expect(t5.check(20)).toBe(true);
    expect(t5.check(15)).toBe(false);
    const t6 = FALLING_TIERS[5].condition;
    expect(t6.check(11)).toBe(true);
    expect(t6.check(21)).toBe(true);
    expect(t6.check(10)).toBe(false);
    expect(t6.check(20)).toBe(false);
    for (const c of FALLING_TIERS) expect(c.maxVal).toBeLessThanOrEqual(100);
  });
});

describe('T02/A7 global banned-word scan', () => {
  it('no game pool contains a banned token', () => {
    const texts: string[] = [
      ...SPELLING_POOLS.flat().flatMap((i) => [i.prompt, ...i.options]),
      ...STORY_POOLS.flat().flatMap((i) => [i.story, i.question, ...i.options]),
      ...CLOCK_POOLS.flat().flatMap((i) => [i.prompt, ...i.options]),
      ...SYLLABLE_POOLS.flat().map((s) => s.w),
      ...SHAPE_POOL.map((s) => s.name),
    ];
    for (const t of texts) {
      expect(containsBannedWord(t), t).toBe(false);
    }
  });
});
