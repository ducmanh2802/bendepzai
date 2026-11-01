// T25 — bằng chứng nhìn thấy được cho "nâng trần độ khó" ở nhóm Ngôn ngữ & Puzzle.
// Mở từng trò ở Màn 6 (ghi localStorage unlockedTier=6), đo số phương án/thẻ thực
// render trên màn hình ở 390×844, kiểm tra tràn ngang, chụp màn hình làm bằng chứng.
// Chạy: npm run build && node qa/run-one.mjs qa/tier6-ladder-evidence.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.env.TEMP || process.env.TMP || '.', 'shots-t26');
fs.mkdirSync(OUT, { recursive: true });

const TIER6_IDS = [
  'syllable_builder',
  'rhyme_hunter',
  'listen_pick',
  'animal_safari',
  'treasure_coding',
  'memory_cards',
  'connect_dots',
  'shadow_match',
  'pixel_mosaic',
];

function titlesFromGamesProbe() {
  const src = fs.readFileSync(new URL('./games.mjs', import.meta.url), 'utf8');
  const block = /const GAME_TITLES = \[([\s\S]*?)\];/.exec(src);
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const TITLES = {
  syllable_builder: 'Xưởng Ghép Tiếng Lớp 1',
  rhyme_hunter: 'Săn Vần Trong Vườn Cây',
  listen_pick: 'Đôi Tai Thính — Nghe & Chọn',
  animal_safari: 'Safari Tiếng Anh — Loài Vật',
  treasure_coding: 'Lập Trình Tìm Kho Báu',
  memory_cards: 'Lật Thẻ Trí Nhớ Vàng',
  connect_dots: 'Nối Số Tô Màu',
  shadow_match: 'Đoán Bóng Hình',
  pixel_mosaic: 'Bé Xếp Hình Mosaic',
};

export default async function run(page) {
  const out = { errors: [], shots: [], facts: {} };
  const titles = titlesFromGamesProbe();
  const idxOf = (t) => titles.indexOf(t);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate((ids) => {
    const games = {};
    for (const id of ids) {
      games[id] = {
        unlockedTier: 6,
        starsByTier: {},
        bestScoreByTier: {},
        updatedAt: new Date().toISOString(),
      };
    }
    localStorage.setItem(
      'kho_bau_game_progress',
      JSON.stringify({ version: 1, games, updatedAt: new Date().toISOString() }),
    );
  }, TIER6_IDS);
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.locator('[data-testid="nav-games"]:visible').first().click();
  await page.waitForSelector('text=Đấu Trường Trò Chơi Trí Tuệ', { timeout: 20000 });

  const play = page.getByRole('button', { name: /Chơi ngay/ });

  const open = async (id) => {
    const title = TITLES[id];
    const i = idxOf(title);
    if (i < 0) throw new Error('không tìm thấy trò trong hub: ' + title);
    await play.nth(i).click();
    await page.waitForTimeout(900);
    if (await page.getByText('Bắt đầu ▶').count()) await page.getByText('Bắt đầu ▶').click();
    await page.waitForTimeout(400);
  };
  const close = async () => {
    const c = page.getByRole('button', { name: 'Đóng trò chơi và quay lại' }).first();
    if (await c.count()) await c.click();
    await page.waitForTimeout(350);
  };
  const shot = async (name) => {
    const file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file, fullPage: false });
    out.shots.push(file);
  };

  // Số phương án lớn nhất trong một lưới button đang render (lưới chọn đáp án).
  const shellFacts = () =>
    page.evaluate(() => {
      const de = document.documentElement;
      const header = [...document.querySelectorAll('p')].map((p) => p.textContent.trim()).find((t) => /Màn \d/.test(t));
      const gridCounts = [...document.querySelectorAll('div.grid')]
        .map((g) => g.querySelectorAll(':scope > button').length)
        .filter((n) => n > 0);
      const byTestid = (sel) => document.querySelectorAll(sel).length;
      return {
        header: header || null,
        tier: header ? parseInt(/Màn (\d)/.exec(header)[1], 10) : null,
        roundTotal: header ? parseInt(/Câu \d+\/(\d+)/.exec(header || '')?.[1] ?? '0', 10) : 0,
        overflowPx: Math.max(0, de.scrollWidth - de.clientWidth),
        scrollOverflowPx: (() => {
          // Lưới đáp án = lưới nhiều button nhất; đo xem nó cuộn tới đâu và button
          // cuối có nằm ngoài màn hình 390×844 không (bé 6 tuổi không lướt dài).
          const grids = [...document.querySelectorAll('div.grid')]
            .map((g) => ({ g, n: g.querySelectorAll(':scope > button').length }))
            .sort((a, b) => b.n - a.n);
          const grid = grids.length ? grids[0].g : null;
          if (!grid) return { scrollPx: 0, belowFoldPx: 0, minButtonH: 0 };
          let node = grid;
          let scrollPx = 0;
          while (node) {
            const s = getComputedStyle(node);
            if (/auto|scroll/.test(s.overflowY))
              scrollPx = Math.max(scrollPx, node.scrollHeight - node.clientHeight);
            node = node.parentElement;
          }
          const btns = [...grid.querySelectorAll(':scope > button')];
          return {
            scrollPx,
            belowFoldPx: Math.max(
              0,
              Math.max(...btns.map((b) => b.getBoundingClientRect().bottom)) - window.innerHeight,
            ),
            minButtonH: btns.length ? Math.round(Math.min(...btns.map((b) => b.getBoundingClientRect().height))) : 0,
          };
        })(),
        maxGridButtons: gridCounts.length ? Math.max(...gridCounts) : 0,
        answerOptions: byTestid('[data-testid="answer-option"]'),
        shadowOptions: byTestid('[data-testid="shadow-option"]'),
        memoryCards: byTestid('[data-testid="memory-card"]'),
        mosaicCells: byTestid('[data-testid="mosaic-cell"]'),
        connectDots: byTestid('[data-testid="connect-dot"]'),
        mosaicCols: (() => {
          const g = document.querySelector('[role="grid"][aria-label^="Bức tranh"]');
          if (!g) return 0;
          return getComputedStyle(g).gridTemplateColumns.split(' ').length;
        })(),
        gridLabels: [...document.querySelectorAll('[role="grid"]')].map((g) => g.getAttribute('aria-label')),
        memoryCols: (() => {
          const g = document.querySelector('[data-testid="memory-card"]');
          if (!g || !g.parentElement) return 0;
          return getComputedStyle(g.parentElement).gridTemplateColumns.split(' ').length;
        })(),
      };
    });

  for (const id of TIER6_IDS) {
    await open(id);
    if (id === 'connect_dots') await page.waitForTimeout(600);
    const f = await shellFacts();
    out.facts[id] = f;
    await shot(`${id}-tier6`);
    if (f.tier !== 6) out.errors.push(`${id}: đang ở Màn ${f.tier}, phải là Màn 6`);
    if (f.overflowPx > 2) out.errors.push(`${id}: tràn ngang ${f.overflowPx}px ở 390px`);
    await close();
  }

  const F = out.facts;
  const need = (id, key, min, label) => {
    const got = F[id] ? F[id][key] : 0;
    if (got < min) out.errors.push(`${id}: ${label} = ${got}, phải ≥ ${min}`);
  };

  need('syllable_builder', 'roundTotal', 8, 'số câu bậc 6');
  need('rhyme_hunter', 'maxGridButtons', 12, 'số cây trái trên vườn');
  need('listen_pick', 'maxGridButtons', 6, 'số phương án');
  need('animal_safari', 'maxGridButtons', 6, 'số phương án');
  need('shadow_match', 'shadowOptions', 6, 'số bóng phương án');
  need('memory_cards', 'memoryCards', 24, 'số thẻ');
  need('pixel_mosaic', 'mosaicCells', 24, 'số ô phải tô');
  need('connect_dots', 'connectDots', 16, 'số điểm nối');

  if (F.pixel_mosaic && F.pixel_mosaic.mosaicCols !== 6)
    out.errors.push(`pixel_mosaic: lưới ${F.pixel_mosaic.mosaicCols} cột, phải là 6×6 ở Màn 6`);

  if (F.memory_cards && F.memory_cards.memoryCols < 5)
    out.errors.push(`memory_cards: lưới ${F.memory_cards.memoryCols} cột, phải ≥ 5 để 24 thẻ không tràn dọc`);
  if (!(F.treasure_coding.gridLabels || []).includes('Bản đồ 8 nhân 8'))
    out.errors.push(`treasure_coding: bàn cờ bậc 6 phải 8×8, thấy ${(F.treasure_coding.gridLabels || []).join('/')}`);

  for (const id of TIER6_IDS) {
    const f = F[id];
    if (!f || !f.maxGridButtons) continue;
    if (f.scrollOverflowPx.minButtonH < 44)
      out.errors.push(`${id}: ô bấm cao ${f.scrollOverflowPx.minButtonH}px, dưới chuẩn 44px cho bé chạm`);
    if (f.scrollOverflowPx.belowFoldPx > 150 && f.scrollOverflowPx.scrollPx < 40)
      out.errors.push(
        `${id}: phương án cuối thấp hơn màn hình ${f.scrollOverflowPx.belowFoldPx}px mà vùng chơi không cuộn (${f.scrollOverflowPx.scrollPx}px)`,
      );
  }

  out.ok = out.errors.length === 0;
  return out;
}
