/**
 * T16 — đăng ký 3 game Toán mới + hợp đồng component game mới (kiểm tra tĩnh).
 * 3 nơi: gamesCatalog.ts, registry.ts, LAUNCHABLE_GAME_IDS (test T08 khớp).
 * Hợp đồng T15: useGameStage 6 cấp + GameModalWrapper (+ Stage con giữ
 * useGameFeedback) + QA hooks + bàn phím + reduced-motion + khen MATH.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel: string) => readFileSync(join(here, '..', rel), 'utf-8');

import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import { LAUNCHABLE_GAME_IDS } from '../src/config/policy';

const NEW_IDS = ['ten_frame_market', 'number_line_hop', 'clock_builder'] as const;
const NEW_TITLES = ['Chợ Khung 10', 'Ếch Nhảy Tia Số', 'Thợ Sửa Đồng Hồ'] as const;

describe('T16 đăng ký game', () => {
  it('catalog: 3 game mới thuộc Toán Học, nhãn MỚI, đủ skillIds', () => {
    for (const id of NEW_IDS) {
      const g = GAMES_CATALOG.find((x) => x.id === id);
      expect(g, id).toBeDefined();
      expect(g!.category).toBe('math');
      expect(g!.categoryLabel).toBe('Toán Học');
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

  it('registry lazy + qa/games.mjs đủ tựa mới (khớp thứ tự catalog)', () => {
    const reg = src('src/components/games/registry.ts');
    const files: Record<string, string> = {
      ten_frame_market: 'TenFrameMarketGame',
      number_line_hop: 'NumberHopGame',
      clock_builder: 'ClockBuilderGame',
    };
    for (const id of NEW_IDS) {
      expect(reg, id).toContain(`${id}: lazy`);
      expect(reg, id).toContain(`./${files[id]}`);
    }
    const qaGames = src('qa/games.mjs');
    for (const title of NEW_TITLES) {
      expect(qaGames, title).toContain(`'${title}'`);
    }
    for (const g of GAMES_CATALOG) {
      expect(qaGames, g.id).toContain(`'${g.title}'`);
    }
  });
});

describe('T16 hợp đồng component game mới (kiểm tra tĩnh)', () => {
  const files = [
    'src/components/games/TenFrameMarketGame.tsx',
    'src/components/games/NumberHopGame.tsx',
    'src/components/games/ClockBuilderGame.tsx',
  ];

  it('dùng useGameStage 6 cấp + GameModalWrapper + linh vật Gấu + khen MATH', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('useGameStage');
      expect(s, f).toContain('GameModalWrapper');
      expect(s, f).toContain('useGameFeedback');
      expect(s, f).toContain('defaultRoundsPerTier');
      expect(s, f).toContain('reportCorrect');
      expect(s, f).toContain('reportWrong');
      expect(s, f).toContain('mascotEmoji="🐻"');
      expect(s, f).toContain('praiseSubject="MATH"');
      expect(s, f).toContain('audioLang="vi-VN"');
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
      const stagePos = s.indexOf('Stage: React.FC');
      expect(hookPos, `${f} thiếu useGameFeedback`).toBeGreaterThan(-1);
      expect(hookPos, f).toBeGreaterThan(stagePos);
    }
  });

  it('màn hướng dẫn + phản hồi đúng/sai + loa vi-VN (không tự đọc mới)', () => {
    for (const f of files) {
      const s = src(f);
      expect(s, f).toContain('showIntro');
      expect(s, f).toContain('Bắt đầu ▶');
      expect(s, f).toContain('sound.speak');
      expect(s, f).toContain('playCorrect');
      expect(s, f).toContain('playWrong');
      expect(s, f).toContain("'vi-VN'");
    }
  });

  it('dùng visuals T11 (TenFrame, NumberLine, ClockFace, PlaceValueBlocks)', () => {
    expect(src('src/components/games/TenFrameMarketGame.tsx')).toContain('TenFrame');
    expect(src('src/components/games/TenFrameMarketGame.tsx')).toContain('PlaceValueBlocks');
    expect(src('src/components/games/NumberHopGame.tsx')).toContain('NumberLine');
    const clock = src('src/components/games/ClockBuilderGame.tsx');
    expect(clock).toContain('ClockFace');
    expect(clock).toContain('phut={0}');
  });
});
