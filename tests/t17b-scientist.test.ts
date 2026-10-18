/**
 * T17B (phan 2) — Nha Khoa Hoc Nhi (little_scientist) + dang ky Hub.
 * Builder: du vong moi cap, dap an dung, khong trung, NFC, khong tu cam,
 * kien thuc khoa hoc chuan lop 1 (da chim, go noi, vat song, ngay/dem,
 * nong/lanh, nam cham hut sat), luat theo cap, nonce xao tron.
 * Dang ky: GameCategory 'logic' + tab Hub, tong 28 game.
 * Component: kiem tra tinh (hop dong game moi nhu T15-T17A).
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
  POOL_BY_TIER as SCI_POOLS,
  SCI_RULES,
  buildScientistRounds,
} from '../src/data/games/little_scientist';
import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import { LAUNCHABLE_GAME_IDS } from '../src/config/policy';

const SEEDS = Array.from({ length: 20 }, (_, i) => i);
const ROUNDS = defaultRoundsPerTier();
const NEW_IDS = ['treasure_coding', 'little_scientist'] as const;

function expectSpread(slots: number[], optionCount: number, label: string) {
  const distinct = new Set(slots);
  expect(distinct.size, `${label}: dap an ket o 1 o`).toBeGreaterThan(1);
  expect(Math.max(...slots), label).toBeLessThan(optionCount);
}

// ---------------------------------------------------------------------------
// little_scientist: luat phan loai + giai thich
// ---------------------------------------------------------------------------
describe('T17B little_scientist: vong choi', () => {
  it('pool moi cap >= so vong; builder du vong, id duy nhat', () => {
    for (let t = 1; t <= 6; t++) {
      expect(SCI_POOLS[t - 1].length, `sci pool tier ${t}`).toBeGreaterThanOrEqual(ROUNDS[t - 1]);
      for (const seed of SEEDS) {
        const rounds = buildScientistRounds(t, seed);
        expect(rounds.length).toBe(ROUNDS[t - 1]);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(rounds.length);
      }
    }
  });

  it('dap an nam trong 2 gio duy nhat, vi tri phan tan, NFC', () => {
    const slots: number[] = [];
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        for (const r of buildScientistRounds(t, seed)) {
          expect(r.baskets).toHaveLength(2);
          expect(new Set(r.baskets.map((b) => b.bucket)).size).toBe(2);
          expect(r.baskets.map((b) => b.bucket)).toContain(r.item.bucket);
          expect(r.baskets.map((b) => b.label)).toContain(
            r.item.bucket === 'A' ? r.rule.basketA : r.rule.basketB,
          );
          slots.push(r.baskets.findIndex((b) => b.bucket === r.item.bucket));
          expect(r.item.name).toBe(r.item.name.normalize('NFC'));
          expect(r.item.why).toBe(r.item.why.normalize('NFC'));
          expect(r.rule.prompt).toBe(r.rule.prompt.normalize('NFC'));
          expect(r.item.why.trim().length).toBeGreaterThan(8);
        }
      }
    }
    expectSpread(slots, 2, 'little_scientist');
  });

  it('luat theo cap: T1 chim/noi ... T5 nam cham, T6 tron >= 3 luat', () => {
    const want = ['sinkfloat', 'alive', 'daynight', 'hotcold', 'magnet', 'mixed'] as const;
    for (let t = 1; t <= 5; t++) {
      for (const seed of SEEDS) {
        for (const r of buildScientistRounds(t, seed)) {
          expect(r.rule.id, `tier ${t}`).toBe(want[t - 1]);
          expect(r.item.rule).toBe(want[t - 1]);
        }
      }
    }
    for (const seed of SEEDS) {
      const rules = new Set(buildScientistRounds(6, seed).map((r) => r.rule.id));
      expect(rules.size, 'T6 phai tron luat').toBeGreaterThanOrEqual(3);
      // Vat thuoc dung luat cua no.
      for (const r of buildScientistRounds(6, seed)) {
        expect(r.rule.id).toBe(r.item.rule);
      }
    }
    expect(Object.keys(SCI_RULES).sort()).toEqual(['alive', 'daynight', 'hotcold', 'magnet', 'sinkfloat']);
  });

  it('kien thuc dung khoa hoc (diem chuan lop 1)', () => {
    const all = SCI_POOLS.flat();
    const find = (name: string) => all.find((x) => x.name === name);
    expect(find('Hòn đá')!.bucket).toBe('A'); // chim
    expect(find('Khúc gỗ')!.bucket).toBe('B'); // noi
    expect(find('Chú mèo')!.bucket).toBe('A'); // song
    expect(find('Cái bàn')!.bucket).toBe('B'); // khong song
    expect(find('Mặt Trời')!.bucket).toBe('A'); // ngay
    expect(find('Mặt Trăng')!.bucket).toBe('B'); // dem
    expect(find('Ngọn lửa')!.bucket).toBe('A'); // nong
    expect(find('Viên nước đá')!.bucket).toBe('B'); // lanh
    expect(find('Cây đinh sắt')!.bucket).toBe('A'); // hut
    expect(find('Thước kẻ gỗ')!.bucket).toBe('B'); // khong hut
    // Moi vat co giai thich rieng, ngan (1 cau), khong trung ten trong pool.
    for (const pool of SCI_POOLS) {
      expect(new Set(pool.map((x) => x.name)).size).toBe(pool.length);
      for (const x of pool) {
        expect(x.why.endsWith('.'), x.name).toBe(true);
        expect(x.why.length, x.name).toBeLessThanOrEqual(60);
      }
    }
  });

  it('nonce xao tron; khong tu cam (ca ten va giai thich)', () => {
    const seen = new Set<string>();
    for (let t = 1; t <= 6; t++) {
      for (const seed of SEEDS) {
        seen.add(buildScientistRounds(t, seed).map((r) => r.id).join('|'));
      }
    }
    expect(seen.size).toBeGreaterThan(6);
    for (const x of SCI_POOLS.flat()) {
      expect(containsBannedWord(x.name), x.name).toBe(false);
      expect(containsBannedWord(x.why), x.why).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Dang ky 4 noi + GameCategory logic + tong 28 game
// ---------------------------------------------------------------------------
describe('T17B dang ky game', () => {
  it('catalog: 2 game moi thuoc Logic & Khoa hoc, nhan MOI, du skillIds', () => {
    for (const id of NEW_IDS) {
      const g = GAMES_CATALOG.find((x) => x.id === id);
      expect(g, id).toBeDefined();
      expect(g!.category).toBe('logic');
      expect(g!.categoryLabel).toBe('Logic & Khoa học');
      expect(g!.isNew).toBe(true);
      expect(g!.title.trim().length).toBeGreaterThan(0);
      expect((g!.skillIds ?? []).length).toBeGreaterThan(0);
    }
    // little_scientist gan skill mon Em & Cuoc song.
    const sci = GAMES_CATALOG.find((x) => x.id === 'little_scientist')!;
    expect(sci.skillIds).toContain('life_science_sinkfloat');
    expect(sci.skillIds).toContain('life_science_living');
    const ids = GAMES_CATALOG.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tong so game trong Hub >= 28', () => {
    expect(GAMES_CATALOG.length).toBeGreaterThanOrEqual(28);
  });

  it('LAUNCHABLE_GAME_IDS chua 2 game moi', () => {
    for (const id of NEW_IDS) {
      expect(Array.from(LAUNCHABLE_GAME_IDS)).toContain(id);
    }
  });

  it('registry lazy + qa/games.mjs du tua (khop thu tu catalog)', () => {
    const reg = src('src/components/games/registry.ts');
    for (const id of NEW_IDS) {
      expect(reg, id).toContain(`${id}: lazy`);
      expect(reg, id).toContain(`./${{ treasure_coding: 'TreasureCodingGame', little_scientist: 'LittleScientistGame' }[id]}`);
    }
    const qaGames = src('qa/games.mjs');
    for (const title of ['Lập Trình Tìm Kho Báu', 'Nhà Khoa Học Nhí']) {
      expect(qaGames, title).toContain(`'${title}'`);
    }
    for (const g of GAMES_CATALOG) {
      expect(qaGames, g.id).toContain(`'${g.title}'`);
    }
  });

  it('Hub co tab Logic & Khoa hoc (GameCategory logic)', () => {
    const cat = src('src/data/gamesCatalog.ts');
    expect(cat).toContain(`'logic'`);
    const hub = src('src/components/games/GamesHubScreen.tsx');
    expect(hub).toContain('Logic & Khoa học');
    expect(hub).toContain(`'logic'`);
  });
});

describe('T17B hop dong component game moi (kiem tra tinh)', () => {
  const files = [
    'src/components/games/TreasureCodingGame.tsx',
    'src/components/games/LittleScientistGame.tsx',
  ];
  // Markup nut bam cua game lap trinh nam trong file Parts (tach cho gon):
  // gop source theo game roi kiem tra.
  const gameSources = [
    src('src/components/games/TreasureCodingGame.tsx')
      + src('src/components/games/TreasureCodingParts.tsx'),
    src('src/components/games/LittleScientistGame.tsx'),
  ];
  it('dung useGameStage 6 cap + GameModalWrapper + linh vat Gau', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('useGameStage');
      expect(s, f).toContain('GameModalWrapper');
      expect(s, f).toContain('useGameFeedback');
      expect(s, f).toContain('defaultRoundsPerTier');
      expect(s, f).toContain('reportCorrect');
      expect(s, f).toContain('reportWrong');
      expect(s, f).toContain('mascotEmoji="🐻"');
    }
  });

  it('QA hooks: answer-option tren phuong an, data-correct chi khi ?qa=1', () => {
    for (const s of gameSources) {
      expect(s).toContain('data-testid="answer-option"');
      expect(s).toContain('data-correct');
      expect(s).toContain("has('qa')");
    }
  });

  it('chay tot chuot + cam ung + ban phim; nut >= 44px', () => {
    for (const s of gameSources) {
      expect(s).toContain('onClick');
      expect(s).toContain('keydown');
      expect(s).toContain('min-h-[44px]');
      expect(s).not.toContain('min-w-[100vw]');
    }
  });

  it('hoat anh CSS/rAF, khong setInterval cho chuyen dong, ton trong reduced-motion', () => {
    for (const s of gameSources) {
      expect(s).not.toContain('setInterval');
      expect(s).toContain('motion-reduce');
    }
    const css = src('src/index.css');
    expect(css).toContain('animate-shake');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('useGameFeedback chi duoc goi trong component con cua GameModalWrapper', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('Stage: React.FC');
      expect(s, f).toContain('<GameModalWrapper');
      const hookPos = s.indexOf('useGameFeedback()');
      const stagePos = s.indexOf('Stage: React.FC');
      expect(hookPos, `${f} thieu useGameFeedback`).toBeGreaterThan(-1);
      expect(hookPos, f).toBeGreaterThan(stagePos);
    }
  });

  it('man huong dan + phan hoi dung/sai + loa (khong tu doc moi)', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('showIntro');
      expect(s, f).toContain('Bắt đầu ▶');
      expect(s, f).toContain('sound.speak');
      expect(s, f).toContain('playCorrect');
      expect(s, f).toContain('playWrong');
      expect(s, f).toContain('audioLang="vi-VN"');
    }
  });

  it('diem rieng T17B: nut chay tung buoc + giai thich co giong doc', () => {
    const code = gameSources[0];
    expect(code).toContain('Từng bước');
    expect(code).toContain('requestAnimationFrame');
    expect(code).toContain('document.hidden');
    const sci = gameSources[1];
    expect(sci).toContain('Vì sao?');
    expect(sci).toContain('Nghe 🔊');
  });
});
