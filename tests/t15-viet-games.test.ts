/**
 * T15 — 3 trò chơi Tiếng Việt mới (tone_paint, rhyme_train, read_and_do).
 * Builder: đủ vòng mọi cấp, đáp án đúng, không trùng, NFC, không từ cấm,
 * độ khó tăng thật theo cấp, nonce xáo trộn. Component: kiểm tra tĩnh
 * (hợp đồng game mới: useGameStage + GameModalWrapper + QA hooks + bàn phím,
 * không setInterval cho chuyển động, data-correct chỉ khi ?qa=1).
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
  POOL_BY_TIER as TONE_POOLS,
  TONE_NAMES,
  buildToneRounds,
  vowelsOf,
} from '../src/data/games/tone_paint';
import {
  POOL_BY_TIER as TRAIN_POOLS,
  buildTrainRounds,
} from '../src/data/games/rhyme_train';
import {
  POOL_BY_TIER as READ_POOLS,
  buildReadRounds,
} from '../src/data/games/read_and_do';
import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import { LAUNCHABLE_GAME_IDS } from '../src/config/policy';

const SEEDS = Array.from({ length: 20 }, (_, i) => i);
const ROUNDS = defaultRoundsPerTier();
const NEW_IDS = ['tone_paint', 'rhyme_train', 'read_and_do'] as const;

/** Bỏ 5 dấu thanh (giữ mũ/móc) — kiểm tra `bare` thật sự "trần". */
function stripTonesOnly(s: string): string {
  return s.normalize('NFD').replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '').normalize('NFC');
}

function expectSpread(slots: number[], optionCount: number, label: string) {
  const distinct = new Set(slots);
  expect(distinct.size, `${label}: đáp án kẹt ở 1 ô`).toBeGreaterThan(1);
  expect(Math.max(...slots), label).toBeLessThan(optionCount);
}

// ---------------------------------------------------------------------------
// tone_paint
// ---------------------------------------------------------------------------
describe('T15 tone_paint: vòng chơi', () => {
  it('pool mỗi cấp ≥ số vòng; builder đủ vòng, id duy nhất', () => {
    for (let t = 1; t <= 6; t++) {
      expect(TONE_POOLS[t - 1].length, `tone pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildToneRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
        expect(new Set(rounds.map((r) => r.word)).size).toBe(rounds.length);
      }
    }
  });

  it('đáp án dấu ∈ 6 phương án duy nhất, vị trí phân tán, NFC, bare không dấu', () => {
    const slots: number[] = [];
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildToneRounds(t, seed)) {
          expect(r.toneOptions).toHaveLength(6);
          expect(new Set(r.toneOptions).size).toBe(6);
          expect(r.toneOptions).toContain(r.targetTone);
          slots.push(r.toneOptions.indexOf(r.targetTone));
          expect(r.word).toBe(r.word.normalize('NFC'));
          expect(r.bare).toBe(r.bare.normalize('NFC'));
          expect(stripTonesOnly(r.bare), `${r.word} bare còn dấu`).toBe(r.bare);
          expect(TONE_NAMES).toContain(r.targetTone);
        }
      }
    }
    expectSpread(slots, 6, 'tone_paint');
  });

  it('vị trí dấu: vowelAnswer ∈ vowelOptions; từ 2 tiếng có focusIndex hợp lệ', () => {
    let vowelRounds = 0;
    let twoPartRounds = 0;
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildToneRounds(t, seed)) {
          if (r.needsVowelPick) {
            vowelRounds += 1;
            expect(r.vowelOptions).toBeDefined();
            expect(r.vowelOptions!.length).toBeGreaterThanOrEqual(2);
            expect(r.vowelOptions).toContain(r.vowelAnswer);
            expect(new Set(r.vowelOptions!).size).toBe(r.vowelOptions!.length);
            expect(vowelsOf(r.bare)).toContain(r.vowelAnswer);
          }
          if (r.syllables) {
            twoPartRounds += 1;
            expect(r.focusIndex).toBeDefined();
            expect(r.syllables[r.focusIndex!]).toBeDefined();
          }
        }
      }
    }
    expect(vowelRounds, 'không có vòng chọn vị trí nào').toBeGreaterThan(0);
    expect(twoPartRounds, 'cấp 5–6 phải có từ 2 tiếng').toBeGreaterThan(0);
  });

  it('độ khó tăng thật: cấp 3+ có chọn vị trí, cấp 5+ có từ 2 tiếng', () => {
    for (const seed of SEEDS) {
      expect(buildToneRounds(3, seed).some((r) => r.needsVowelPick)).toBe(true);
      expect(buildToneRounds(4, seed).some((r) => r.needsVowelPick)).toBe(true);
      expect(buildToneRounds(5, seed).some((r) => r.syllables)).toBe(true);
      expect(buildToneRounds(6, seed).some((r) => r.syllables)).toBe(true);
      expect(buildToneRounds(1, seed).every((r) => !r.syllables)).toBe(true);
    }
  });

  it('nonce xáo trộn thứ tự vòng', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        seen.add(buildToneRounds(t, seed).map((r) => r.word).join('|'));
      }
    }
    expect(seen.size).toBeGreaterThan(6);
  });

  it('không từ cấm, đúng chính tả mẫu (hoà/khoẻ/thửa/lưỡi)', () => {
    const words = TONE_POOLS.flat().map((s) => s.w);
    for (const w of words) expect(containsBannedWord(w), w).toBe(false);
    for (const good of ['hoà', 'khoẻ', 'thửa', 'lưỡi', 'quả cam', 'quyển sách']) {
      expect(words, good).toContain(good);
    }
    // Kiểu đặt dấu SGK hiện hành, không phải "hòa/khỏe".
    for (const bad of ['hòa', 'khỏe', 'thủy chung']) {
      expect(words, bad).not.toContain(bad);
    }
  });
});

// ---------------------------------------------------------------------------
// rhyme_train
// ---------------------------------------------------------------------------
describe('T15 rhyme_train: vòng chơi', () => {
  it('pool mỗi cấp ≥ số vòng; builder đủ vòng, id duy nhất', () => {
    for (let t = 1; t <= 6; t++) {
      expect(TRAIN_POOLS[t - 1].length, `train pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildTrainRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
        expect(new Set(rounds.map((r) => r.word)).size).toBe(rounds.length);
      }
    }
  });

  it('toa đúng ghép ra đúng từ; mồi không tạo ra từ mục tiêu; 4 toa duy nhất', () => {
    const slots: number[] = [];
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildTrainRounds(t, seed)) {
          expect(r.carOptions).toHaveLength(4);
          expect(new Set(r.carOptions).size).toBe(4);
          expect(r.carOptions).toContain(r.answerTail);
          slots.push(r.carOptions.indexOf(r.answerTail));
          const formed = r.twoPart ? `${r.head} ${r.answerTail}` : `${r.head}${r.answerTail}`;
          expect(formed.normalize('NFC')).toBe(r.word);
          expect(r.word).toBe(r.word.normalize('NFC'));
          for (const car of r.carOptions) {
            if (car === r.answerTail) continue;
            const decoyFormed = r.twoPart ? `${r.head} ${car}` : `${r.head}${car}`;
            expect(decoyFormed.normalize('NFC'), `mồi tạo đúng từ ${r.word}`).not.toBe(r.word);
          }
        }
      }
    }
    expectSpread(slots, 4, 'rhyme_train');
  });

  it('cấp 5–6 là từ 2 tiếng, cấp 1–4 là 1 tiếng', () => {
    for (const seed of SEEDS) {
      for (let t = 1; t <= 4; t++) {
        expect(buildTrainRounds(t, seed).every((r) => !r.twoPart)).toBe(true);
      }
      for (let t = 5; t <= 6; t++) {
        expect(buildTrainRounds(t, seed).every((r) => r.twoPart)).toBe(true);
      }
    }
  });

  it('nonce xáo trộn; không từ cấm', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) seen.add(buildTrainRounds(t, seed).map((r) => r.word).join('|'));
    }
    expect(seen.size).toBeGreaterThan(6);
    for (const item of TRAIN_POOLS.flat()) {
      expect(containsBannedWord(item.word), item.word).toBe(false);
      expect(containsBannedWord(item.tail), item.tail).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// read_and_do
// ---------------------------------------------------------------------------
describe('T15 read_and_do: vòng chơi', () => {
  it('pool mỗi cấp 8 câu; builder đủ vòng, câu duy nhất', () => {
    for (let t = 1; t <= 6; t++) {
      expect(READ_POOLS[t - 1].length, `read pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildReadRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
        expect(new Set(rounds.map((r) => r.sentence)).size).toBe(rounds.length);
      }
    }
  });

  it('mọi nước đi trỏ tới vật/chỗ có thật; id vật/chỗ duy nhất; NFC', () => {
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildReadRounds(t, seed)) {
          const oIds = new Set(r.objects.map((o) => o.id));
          const pIds = new Set(r.places.map((p) => p.id));
          expect(oIds.size).toBe(r.objects.length);
          expect(pIds.size).toBe(r.places.length);
          expect(r.moves.length).toBeGreaterThanOrEqual(1);
          for (const m of r.moves) {
            expect(oIds.has(m.objectId), `${r.sentence} vật ${m.objectId}`).toBe(true);
            expect(pIds.has(m.placeId), `${r.sentence} chỗ ${m.placeId}`).toBe(true);
          }
          expect(r.sentence).toBe(r.sentence.normalize('NFC'));
          for (const o of r.objects) {
            expect(o.label).toBe(o.label.normalize('NFC'));
            expect(containsBannedWord(o.label), o.label).toBe(false);
          }
          for (const p of r.places) {
            expect(p.label).toBe(p.label.normalize('NFC'));
          }
          expect(containsBannedWord(r.sentence), r.sentence).toBe(false);
        }
      }
    }
  });

  it('câu chứa từ chỉ vị trí; cấp 5–6 có câu 2 vế', () => {
    const positions = ['trên', 'dưới', 'cạnh', 'trong'];
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildReadRounds(t, seed)) {
          const lower = r.sentence.toLowerCase();
          const hasPos =
            lower.includes('lên') ||
            lower.includes('vào') ||
            positions.some((p) => lower.includes(p));
          expect(hasPos, r.sentence).toBe(true);
        }
      }
    }
    for (const seed of SEEDS) {
      expect(buildReadRounds(5, seed).some((r) => r.moves.length === 2)).toBe(true);
      expect(buildReadRounds(6, seed).some((r) => r.moves.length === 2)).toBe(true);
      expect(buildReadRounds(1, seed).every((r) => r.moves.length === 1)).toBe(true);
    }
  });

  it('câu nêu vật + chỗ: tên vật/chỗ xuất hiện trong câu', () => {
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildReadRounds(t, seed)) {
          const lower = ` ${r.sentence.toLowerCase()} `;
          for (const m of r.moves) {
            const obj = r.objects.find((o) => o.id === m.objectId)!;
            const place = r.places.find((p) => p.id === m.placeId)!;
            // Từ khóa cuối của tên vật/chỗ phải có trong câu (bỏ số lượng/màu ở đầu).
            const objKey = obj.label.split(' ').slice(-1)[0];
            const placeKey = place.label.split(' ').slice(-1)[0];
            expect(lower.includes(objKey.toLowerCase()), `${r.sentence} thiếu ${objKey}`).toBe(true);
            expect(lower.includes(placeKey.toLowerCase()), `${r.sentence} thiếu ${placeKey}`).toBe(true);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Đăng ký 3 nơi + hợp đồng component
// ---------------------------------------------------------------------------
describe('T15 đăng ký game', () => {
  it('catalog: 3 game mới thuộc Tiếng Việt, nhãn MỚI, đủ skillIds', () => {
    for (const id of NEW_IDS) {
      const g = GAMES_CATALOG.find((x) => x.id === id);
      expect(g, id).toBeDefined();
      expect(g!.category).toBe('viet');
      expect(g!.categoryLabel).toBe('Tiếng Việt');
      expect(g!.isNew).toBe(true);
      expect(g!.title.trim().length).toBeGreaterThan(0);
      expect((g!.skillIds ?? []).length).toBeGreaterThan(0);
    }
    const ids = GAMES_CATALOG.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('LAUNCHABLE_GAME_IDS chứa 3 game mới', () => {
    for (const id of NEW_IDS) {
      expect(Array.from(LAUNCHABLE_GAME_IDS)).toContain(id);
    }
  });

  it('registry lazy + qa/games.mjs đủ 21 tựa (khớp thứ tự catalog)', () => {
    const reg = src('src/components/games/registry.ts');
    for (const id of NEW_IDS) {
      expect(reg, id).toContain(`${id}: lazy`);
      expect(reg, id).toContain(`./${{ tone_paint: 'TonePaintGame', rhyme_train: 'RhymeTrainGame', read_and_do: 'ReadAndDoGame' }[id]}`);
    }
    const qaGames = src('qa/games.mjs');
    for (const title of ['Tô Dấu Thanh', 'Đoàn Tàu Ghép Vần', 'Đọc Câu Làm Theo']) {
      expect(qaGames, title).toContain(`'${title}'`);
    }
    // Mọi tựa trong catalog đều có mặt trong qa/games.mjs.
    for (const g of GAMES_CATALOG) {
      expect(qaGames, g.id).toContain(`'${g.title}'`);
    }
  });
});

describe('T15 hợp đồng component game mới (kiểm tra tĩnh)', () => {
  const files = [
    'src/components/games/TonePaintGame.tsx',
    'src/components/games/RhymeTrainGame.tsx',
    'src/components/games/ReadAndDoGame.tsx',
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
      expect(s, f).toContain('praiseSubject="VIETNAMESE"');
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
    // ReadAndDo hỗ trợ thêm kéo-thả; Rhyme/Tone dùng chạm.
    expect(src('src/components/games/ReadAndDoGame.tsx')).toContain('draggable');
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
    // P0 T15: gọi useGameFeedback cùng component render provider sẽ crash
    // "must be used within GameModalWrapper" — mỗi game phải có Stage con.
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
    // 3 game cũ từng crash theo cách này cũng đã được sửa cùng pattern.
    for (const f of [
      'src/components/games/RhymeHunterGame.tsx',
      'src/components/games/ListenPickPhonicsGame.tsx',
      'src/components/games/CatchFallingLettersGame.tsx',
    ]) {
      const s = src(f);
      expect(s, f).toContain('Stage: React.FC');
      expect(s.indexOf('useGameFeedback()'), f).toBeGreaterThan(s.indexOf('Stage: React.FC'));
    }
  });

  it('màn hướng dẫn + phản hồi đúng/sai + nút loa (không tự đọc mới)', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('showIntro');
      expect(s, f).toContain('Bắt đầu ▶');
      expect(s, f).toContain('sound.speak');
      expect(s, f).toContain('playCorrect');
      expect(s, f).toContain('playWrong');
    }
  });
});
