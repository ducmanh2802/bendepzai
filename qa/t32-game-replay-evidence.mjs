// T32 — bằng chứng nhìn thấy được cho 3 lỗi đã sửa trong khung trò chơi:
//   A+D  "Đọc Câu Làm Theo": mỗi lúc chỉ MỘT bước kế tiếp được tính, và chọn lại màn
//        phải xoá sạch dấu vết lượt cũ (đồ vật đã đặt + lựa chọn còn treo lại = soft-lock).
//   C    "Đường Đua Thần Tốc": đồng hồ phải NGỪNG đếm khi lớp phủ "Chọn Màn" che bảng chơi.
//   G    lớp phủ đó phải đóng được bằng nút ✕ có tên truy cập (trước đây chỉ là biểu tượng).
// Chạy: npm run build && node qa/run-one.mjs qa/t32-game-replay-evidence.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.env.TEMP || process.env.TMP || '.', 'shots-t32');
fs.mkdirSync(OUT, { recursive: true });

const TITLES = {
  readDo: 'Đọc Câu Làm Theo',
  race: 'Đường Đua Thần Tốc',
};

const OBJECTS = '[role="group"][aria-label="Các đồ vật"]';
const PLACES = '[role="group"][aria-label="Các chỗ để trong tranh"]';
const TIER_TRIGGER = 'button[title="Bấm để chọn màn hoặc tăng độ khó"]';
const OVERLAY_TITLE = 'text=Chọn Màn & Độ Khó';

function titlesFromGamesProbe() {
  const src = fs.readFileSync(new URL('./games.mjs', import.meta.url), 'utf8');
  const block = /const GAME_TITLES = \[([\s\S]*?)\];/.exec(src);
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const timerText = (page) =>
  page.locator('[data-testid="race-timer"] p').last().innerText();
const secondsOf = (text) => Number((text.match(/(\d+)\s*giây/) || [])[1]);

export default async function run(page, ui) {
  const out = { steps: [], errors: [], facts: {}, failedAt: null, shots: [] };
  const titles = titlesFromGamesProbe();
  const step = (s) => out.steps.push(s);
  const fail = (at, msg) => {
    if (!out.failedAt) out.failedAt = at;
    out.errors.push(`${at}: ${msg}`);
  };
  const shot = async (name) => {
    const file = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: file });
    out.shots.push(file);
  };

  const markers = (group) =>
    page.locator(`${group} [data-testid="answer-option"][data-correct="true"]`);
  const labelsOf = async (group) =>
    (await markers(group).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') || '')))
      .join(' | ');

  const play = page.getByRole('button', { name: /Chơi ngay/ });
  const openGame = async (title) => {
    const i = titles.indexOf(title);
    if (i < 0) throw new Error('không tìm thấy trò trong hub: ' + title);
    await play.nth(i).click();
    await page.waitForTimeout(1000);
    if (await page.getByText('Bắt đầu ▶').count()) await page.getByText('Bắt đầu ▶').click();
    await page.waitForTimeout(600);
  };
  const closeGame = async () => {
    const c = page.getByRole('button', { name: 'Đóng trò chơi và quay lại' }).first();
    if (await c.count()) await c.click();
    await page.waitForTimeout(700);
  };
  const openTierPicker = async (tierLabel) => {
    await page.locator(TIER_TRIGGER).first().click();
    await page.waitForTimeout(400);
    await page.locator(`button:has-text("${tierLabel}")`).first().click();
    await page.waitForTimeout(900);
  };

  await page.setViewportSize({ width: 390, height: 844 });
  // ?qa làm DOM gắn data-correct — probe cần biết bước hợp lệ một cách tất định.
  await page.goto(`${ui.origin}/?qa`);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

  // Màn 4 là bậc đếm giờ sớm nhất của Đường Đua (3 bậc đầu cố ý không có đồng hồ).
  await page.evaluate(() => {
    const games = {};
    for (const id of ['read_and_do', 'speed_racing']) {
      games[id] = {
        unlockedTier: 4,
        starsByTier: {},
        bestScoreByTier: {},
        updatedAt: new Date().toISOString(),
      };
    }
    localStorage.setItem(
      'kho_bau_game_progress',
      JSON.stringify({ version: 1, games, updatedAt: new Date().toISOString() })
    );
  });
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.locator('[data-testid="nav-games"]:visible').first().click();
  await page.waitForSelector('text=Đấu Trường Trò Chơi Trí Tuệ', { timeout: 20000 });

  const hintLine = () =>
    page.locator('p', { hasText: /Đã chọn|Bé cần đưa|chạm vào một đồ vật/ }).first();

  // ── A: chọn lại màn phải xoá lựa chọn đang dở ───────────────────────────
  await openGame(TITLES.readDo);
  if ((await page.locator(OBJECTS).count()) === 0) {
    fail('A', 'không thấy bảng đồ vật của "Đọc Câu Làm Theo"');
  } else {
    await markers(OBJECTS).first().click({ timeout: 5000 });
    await page.waitForTimeout(300);
    const hintSelected = await hintLine().innerText();
    out.facts.hintAfterSelect = hintSelected;
    if (!/Đã chọn/.test(hintSelected)) {
      fail('A', `chạm đồ vật nhưng hướng dẫn không đổi lời: "${hintSelected}"`);
    } else {
      await openTierPicker('Màn 1: ');
      const hintReplay = await hintLine().innerText();
      const markersReplay = await markers(OBJECTS).count();
      out.facts.hintAfterReplay = hintReplay;
      out.facts.markersAfterReplay = markersReplay;
      if (/Đã chọn/.test(hintReplay)) {
        fail('A', `chọn lại Màn 1 nhưng lựa chọn dở còn treo lại: "${hintReplay}"`);
      } else if (markersReplay !== 1) {
        fail('A', `sau khi chơi lại, số bước hợp lệ là ${markersReplay} thay vì 1`);
      } else {
        step(`A1: bé đang chọn dở ("${hintSelected}") → chọn lại Màn 1 xoá sạch, bảng về 1 bước hợp lệ`);
      }
    }
    await shot('a-read-do-replay-reset');

    // ── D: mỗi lúc chỉ MỘT bước kế tiếp được tính (Màn 4 có câu 2 bước) ────
    await openTierPicker('Màn 4: ');
    let maxMarkers = 0;
    let maxPlacedWhilePending = 0;
    let rounds = 0;
    const seen = [];
    for (let i = 0; i < 8; i++) {
      const objCount = await markers(OBJECTS).count();
      const placeCount = await markers(PLACES).count();
      if (objCount === 0) break;
      rounds++;
      maxMarkers = Math.max(maxMarkers, objCount, placeCount);
      const placedNow = await page
        .locator(`${OBJECTS} [data-testid="answer-option"][disabled]`)
        .count();
      maxPlacedWhilePending = Math.max(maxPlacedWhilePending, placedNow);
      seen.push(`lượt ${rounds}: ${objCount} vật/${placeCount} chỗ, ${placedNow} đã đặt → ${await labelsOf(OBJECTS)}`);
      if (objCount > 1 || placeCount > 1) break;
      await markers(OBJECTS).first().click({ timeout: 5000 });
      await page.waitForTimeout(250);
      await markers(PLACES).first().click({ timeout: 5000 });
      await page.waitForTimeout(1200);
    }
    out.facts.readDoM4 = { rounds, maxCorrectMarkers: maxMarkers, maxPlacedWhilePending, seen };
    if (maxMarkers > 1) {
      fail('D', `có ${maxMarkers} bước cùng được đánh dấu đúng — trò chơi nhận sai thứ tự`);
    } else if (rounds === 0) {
      fail('D', 'không đọc được dấu bước hợp lệ ở Màn 4 (thiếu ?qa?)');
    } else {
      step(
        `D1: ${rounds} lượt ở Màn 4, luôn chỉ 1 bước hợp lệ${
          maxPlacedWhilePending > 0
            ? ` (có câu ${maxPlacedWhilePending + 1} bước: đặt xong bước 1 mới hiện bước 2)`
            : ''
        }`
      );
    }
    await shot('d-read-do-order-m4');

    // ── G: lớp phủ đóng bằng nút ✕ có tên truy cập ────────────────────────
    await page.locator(TIER_TRIGGER).first().click();
    await page.waitForTimeout(400);
    const xBtn = page.locator('button[aria-label="Đóng bảng chọn màn"]');
    if ((await xBtn.count()) === 0) {
      fail('G', 'lớp phủ chọn màn không có nút ✕ với tên truy cập');
    } else {
      await xBtn.first().click();
      await page.waitForTimeout(500);
      if ((await page.locator(OVERLAY_TITLE).count()) > 0) {
        fail('G', 'bấm ✕ nhưng lớp phủ chọn màn vẫn còn che bảng chơi');
      } else {
        step('G1: nút ✕ đóng lớp phủ chọn màn — người dùng bàn phím thoát ra được');
      }
    }
  }
  await closeGame();

  // ── C: đồng hồ ngừng đếm sau lớp phủ ────────────────────────────────────
  await openGame(TITLES.race);
  await openTierPicker("Màn 4: ");

  if ((await page.locator('[data-testid="race-timer"]').count()) === 0) {
    fail('C', 'Màn 4 không hiện đồng hồ đếm giờ');
  } else {
    await page.locator(TIER_TRIGGER).first().click();
    await page.waitForTimeout(300);
    const pausedA = secondsOf(await timerText(page));
    await page.waitForTimeout(3000);
    const pausedB = secondsOf(await timerText(page));
    out.facts.behindOverlay = { before: pausedA, after3s: pausedB };
    if (Number.isNaN(pausedA) || Number.isNaN(pausedB)) {
      fail('C', `không đọc được đồng hồ: "${pausedA}" / "${pausedB}"`);
    } else if (pausedB < pausedA) {
      fail('C', `đồng hồ vẫn lùi ${pausedA - pausedB} giây khi lớp phủ chọn màn đang che bảng chơi`);
    } else {
      step(`C1: mở lớp phủ 3 giây → đồng hồ giữ nguyên ${pausedA}s (bé không bị mất giờ oan)`);
    }
    await shot('c-timer-frozen-behind-overlay');

    // Đóng lớp phủ thì đồng hồ phải chạy tiếp, nếu không phép thử trên vô nghĩa.
    await page.locator('button[aria-label="Đóng bảng chọn màn"]').first().click();
    await page.waitForTimeout(2500);
    const resumed = secondsOf(await timerText(page));
    out.facts.afterClose = resumed;
    if (!Number.isNaN(pausedA) && !Number.isNaN(resumed) && resumed > pausedA) {
      fail('C', `đồng hồ không chạy lại sau khi đóng lớp phủ (${pausedA}s → ${resumed}s)`);
    } else {
      step(`C2: đóng lớp phủ → đồng hồ chạy tiếp (${pausedA}s → ${resumed}s)`);
    }
    await shot('c-timer-resumed');
  }
  await closeGame();

  out.ok = out.errors.length === 0;
  return out;
}
