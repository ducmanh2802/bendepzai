/**
 * T17A — 2 trò chơi Tiếng Anh mới (simon_says, word_builder_train).
 * Builder: đủ vòng mọi cấp, đáp án đúng, không trùng, NFC, không từ cấm,
 * British English (GREY, không GRAY), độ khó tăng thật theo cấp
 * (1 bước → 2 bước → bẫy Simon says; CVC → 4 chữ → sh/ch), nonce xáo trộn.
 * Component: kiểm tra tĩnh (hợp đồng game mới: useGameStage + GameModalWrapper
 * + QA hooks + bàn phím, không setInterval cho chuyển động,
 * data-correct chỉ khi ?qa=1, khen tiếng Anh + audioLang en-GB).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel: string) => readFileSync(join(here, '..', rel), 'utf-8');

import { defaultRoundsPerTier } from '../src/data/gameLevels';
import { containsBannedWord } from '../src/data/contentSafety';
import {
  POOL_BY_TIER as SIMON_POOLS,
  WAIT_CARD,
  buildSimonRounds,
} from '../src/data/games/simon_says';
import {
  POOL_BY_TIER as WORD_POOLS,
  buildWordTrainRounds,
} from '../src/data/games/word_builder_train';
import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import { LAUNCHABLE_GAME_IDS } from '../src/config/policy';

const SEEDS = Array.from({ length: 20 }, (_, i) => i);
const ROUNDS = defaultRoundsPerTier();
const NEW_IDS = ['simon_says', 'word_builder_train'] as const;

function expectSpread(slots: number[], optionCount: number, label: string) {
  const distinct = new Set(slots);
  expect(distinct.size, `${label}: đáp án kẹt ở 1 ô`).toBeGreaterThan(1);
  expect(Math.max(...slots), label).toBeLessThan(optionCount);
}

// ---------------------------------------------------------------------------
// simon_says
// ---------------------------------------------------------------------------
describe('T17A simon_says: vòng chơi', () => {
  it('pool mỗi cấp ≥ số vòng; builder đủ vòng, id và lệnh duy nhất', () => {
    for (let t = 1; t <= 6; t++) {
      expect(SIMON_POOLS[t - 1].length, `simon pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildSimonRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
        expect(new Set(rounds.map((r) => r.command)).size).toBe(rounds.length);
      }
    }
  });

  it('đáp án có mặt trong 4 tranh duy nhất, vị trí phân tán, NFC, lệnh "!"', () => {
    const slots: number[] = [];
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildSimonRounds(t, seed)) {
          expect(r.options).toHaveLength(4);
          expect(new Set(r.options.map((o) => o.label)).size).toBe(4);
          for (const a of r.answers) {
            expect(r.options.map((o) => o.label)).toContain(a.label);
          }
          slots.push(r.options.findIndex((o) => o.label === r.answers[0].label));
          expect(r.command).toBe(r.command.normalize('NFC'));
          expect(r.command.endsWith('!"'), r.command).toBe(true);
          expect(r.vi).toBe(r.vi.normalize('NFC'));
          for (const o of r.options) {
            expect(o.label).toBe(o.label.normalize('NFC'));
            expect(o.label.trim().length).toBeGreaterThan(0);
          }
          // 1 bước = 1 đáp án; 2 bước = 2 đáp án khác nhau.
          expect(r.twoStep ? r.answers.length : r.answers.length).toBe(r.twoStep ? 2 : 1);
          expect(new Set(r.answers.map((a) => a.label)).size).toBe(r.answers.length);
          // Cờ bẫy/không-bẫy nhất quán với tiền tố hiển thị.
          expect(r.simonSays).toBe(!r.trap);
          expect(r.command.startsWith('Simon says:'), r.command).toBe(r.simonSays);
        }
      }
    }
    expectSpread(slots, 4, 'simon_says');
  });

  it('vòng bẫy luôn có thẻ Wait! làm đáp án; mồi là động tác bị nhử', () => {
    let traps = 0;
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildSimonRounds(t, seed)) {
          if (!r.trap) continue;
          traps += 1;
          expect(r.answers).toHaveLength(1);
          expect(r.answers[0].label).toBe(WAIT_CARD.label);
          expect(r.answers[0].emoji).toBe(WAIT_CARD.emoji);
          expect(r.options.map((o) => o.label)).toContain(WAIT_CARD.label);
        }
      }
    }
    expect(traps, 'cấp cao phải có vòng bẫy').toBeGreaterThan(0);
  });

  it('độ khó tăng thật: T1–T3 chỉ 1 bước không bẫy; T4 có 2 bước; T5–T6 có bẫy', () => {
    for (const seed of SEEDS) {
      for (let t = 1; t <= 3; t++) {
        expect(buildSimonRounds(t, seed).every((r) => !r.twoStep && !r.trap)).toBe(true);
      }
      expect(buildSimonRounds(4, seed).some((r) => r.twoStep)).toBe(true);
      expect(buildSimonRounds(4, seed).every((r) => !r.trap)).toBe(true);
      expect(buildSimonRounds(5, seed).some((r) => r.twoStep)).toBe(true);
      expect(buildSimonRounds(5, seed).some((r) => r.trap)).toBe(true);
      expect(buildSimonRounds(6, seed).some((r) => r.trap)).toBe(true);
    }
  });

  it('nonce xáo trộn; không từ cấm (cả gợi ý Việt)', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        seen.add(buildSimonRounds(t, seed).map((r) => r.command).join('|'));
      }
    }
    expect(seen.size).toBeGreaterThan(6);
    for (const item of SIMON_POOLS.flat()) {
      expect(containsBannedWord(item.vi), item.vi).toBe(false);
      for (const a of item.answers) expect(containsBannedWord(a.vi), a.vi).toBe(false);
    }
  });

  it('British English: lệnh và nhãn không dính chính tả Mỹ', () => {
    const texts = [
      ...SIMON_POOLS.flat().map((s) => s.command),
      ...SIMON_POOLS.flat().flatMap((s) => [...s.answers, ...s.decoys].map((p) => p.label)),
    ].join('\n');
    for (const us of ['GRAY', 'COLOR', 'FAVOR', 'CENTER', 'TRAVELING', 'MOMMY']) {
      expect(texts.includes(us), us).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// word_builder_train
// ---------------------------------------------------------------------------
describe('T17A word_builder_train: vòng chơi', () => {
  it('pool mỗi cấp ≥ số vòng; builder đủ vòng, id và từ duy nhất', () => {
    for (let t = 1; t <= 6; t++) {
      expect(WORD_POOLS[t - 1].length, `word pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildWordTrainRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
        expect(new Set(rounds.map((r) => r.word)).size).toBe(rounds.length);
      }
    }
  });

  it('toa ghép đúng thứ tự ra đúng từ; đa tập toa giữ nguyên; NFC, A–Z', () => {
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildWordTrainRounds(t, seed)) {
          expect(r.cars.join(''), r.word).toBe(r.word);
          expect([...r.carriages].sort().join('|')).toBe([...r.cars].sort().join('|'));
          expect(r.word).toBe(r.word.normalize('NFC'));
          expect(r.word, `từ ${r.word} phải IN HOA A–Z`).toMatch(/^[A-Z]+$/);
          for (const car of r.cars) {
            expect(car, `toa ${car}`).toMatch(/^[A-Z]{1,2}$/);
          }
          expect(r.vi).toBe(r.vi.normalize('NFC'));
        }
      }
    }
  });

  it('độ khó tăng thật: T1–T3 từ 3 chữ đơn; T4 từ 4 chữ; T5–T6 có toa đôi sh/ch', () => {
    for (const seed of SEEDS) {
      for (let t = 1; t <= 3; t++) {
        for (const r of buildWordTrainRounds(t, seed)) {
          expect(r.cars).toHaveLength(3);
          for (const car of r.cars) expect(car).toHaveLength(1);
        }
      }
      for (const r of buildWordTrainRounds(4, seed)) {
        expect(r.cars).toHaveLength(4);
        for (const car of r.cars) expect(car).toHaveLength(1);
      }
      expect(buildWordTrainRounds(5, seed).some((r) => r.cars.some((c) => c.length === 2))).toBe(true);
      expect(buildWordTrainRounds(6, seed).some((r) => r.cars.some((c) => c.length === 2))).toBe(true);
      expect(buildWordTrainRounds(1, seed).every((r) => r.cars.every((c) => c.length === 1))).toBe(true);
    }
    const t5words = WORD_POOLS[4].map((x) => x.word);
    for (const w of ['SHIP', 'CHICK']) expect(t5words).toContain(w);
  });

  it('nonce xáo trộn thứ tự toa; không từ cấm; British GREY (không GRAY)', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        seen.add(buildWordTrainRounds(t, seed).map((r) => r.carriages.join('+')).join('|'));
      }
    }
    expect(seen.size).toBeGreaterThan(6);
    const words = WORD_POOLS.flat().map((x) => x.word);
    for (const w of words) expect(containsBannedWord(w), w).toBe(false);
    expect(words).toContain('GREY');
    expect(words).not.toContain('GRAY');
    for (const us of ['COLOR', 'FAVOR', 'CENTER']) {
      expect(words.join('\n').includes(us), us).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Đăng ký 3 nơi + hợp đồng component
// ---------------------------------------------------------------------------
describe('T17A đăng ký game', () => {
  it('catalog: 2 game mới thuộc Tiếng Anh, nhãn MỚI, đủ skillIds', () => {
    for (const id of NEW_IDS) {
      const g = GAMES_CATALOG.find((x) => x.id === id);
      expect(g, id).toBeDefined();
      expect(g!.category).toBe('english');
      expect(g!.categoryLabel).toBe('Tiếng Anh');
      expect(g!.isNew).toBe(true);
      expect(g!.title.trim().length).toBeGreaterThan(0);
      expect((g!.skillIds ?? []).length).toBeGreaterThan(0);
    }
    const ids = GAMES_CATALOG.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('LAUNCHABLE_GAME_IDS chứa 2 game mới', () => {
    for (const id of NEW_IDS) {
      expect(Array.from(LAUNCHABLE_GAME_IDS)).toContain(id);
    }
  });

  it('registry lazy + qa/games.mjs đủ 23 tựa (khớp thứ tự catalog)', () => {
    const reg = src('src/components/games/registry.ts');
    for (const id of NEW_IDS) {
      expect(reg, id).toContain(`${id}: lazy`);
      expect(reg, id).toContain(`./${{ simon_says: 'SimonSaysGame', word_builder_train: 'WordTrainGame' }[id]}`);
    }
    const qaGames = src('qa/games.mjs');
    for (const title of ['Simon Says — Gấu Ra Lệnh', 'Word Train — Tàu Chữ Tiếng Anh']) {
      expect(qaGames, title).toContain(`'${title}'`);
    }
    // Mọi tựa trong catalog đều có mặt trong qa/games.mjs.
    for (const g of GAMES_CATALOG) {
      expect(qaGames, g.id).toContain(`'${g.title}'`);
    }
  });
});

describe('T17A hợp đồng component game mới (kiểm tra tĩnh)', () => {
  const files = [
    'src/components/games/SimonSaysGame.tsx',
    'src/components/games/WordTrainGame.tsx',
  ];
  it('dùng useGameStage 6 cấp + GameModalWrapper + linh vật Gấu', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('useGameStage');
      expect(s, f).toContain('GameModalWrapper');
      expect(s, f).toContain('useGameFeedback');
      expect(s, f).toContain('defaultRoundsPerTier');
      expect(s, f).toContain('reportCorrect');
      expect(s, f).toContain('reportWrong');
      expect(s, f).toContain('mascotEmoji="🐻"');
      expect(s, f).toContain('praiseSubject="ENGLISH"');
    }
  });

  it('QA hooks: answer-option trên phương án, data-correct chỉ khi ?qa=1', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('data-testid="answer-option"');
      expect(s, f).toContain('data-correct');
      expect(s, f).toContain("has('qa')");
    }
  });

  it('chạy tốt chuột + cảm ứng + bàn phím; 375px (không cuộn ngang)', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('onClick');
      expect(s, f).toContain('keydown');
      expect(s, f).toContain('min-h-[44px]');
      expect(s, f).not.toContain('min-w-[100vw]');
    }
  });

  it('hoạt ảnh CSS thuần, không setInterval cho chuyển động, tôn trọng reduced-motion', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).not.toContain('setInterval');
      expect(s, f).toContain('motion-reduce');
    }
    const css = src('src/index.css');
    expect(css).toContain('animate-shake');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('useGameFeedback chỉ được gọi trong component con của GameModalWrapper', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('Stage: React.FC');
      expect(s, f).toContain('<GameModalWrapper');
      const hookPos = s.indexOf('useGameFeedback()');
      const wrapperPos = s.indexOf('<GameModalWrapper');
      const stagePos = s.indexOf('Stage: React.FC');
      expect(hookPos, `${f} thiếu useGameFeedback`).toBeGreaterThan(-1);
      // Lần gọi hook đầu tiên nằm SAU khai báo Stage (tức là trong component con).
      expect(hookPos, f).toBeGreaterThan(stagePos);
      expect(stagePos, f).toBeGreaterThan(-1);
      expect(wrapperPos, f).toBeGreaterThan(-1);
    }
  });

  it('màn hướng dẫn + phản hồi đúng/sai + loa en-GB (không tự đọc mới)', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('showIntro');
      expect(s, f).toContain('Bắt đầu ▶');
      expect(s, f).toContain('sound.speak');
      expect(s, f).toContain('playCorrect');
      expect(s, f).toContain('playWrong');
      expect(s, f).toContain("audioLang=\"en-GB\"");
      expect(s, f).toContain("'en-GB'");
    }
  });
});
