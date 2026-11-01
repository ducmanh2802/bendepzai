// T33 — bằng chứng nhìn thấy được cho 5 lỗi hẹn giờ phản hồi:
//   A  Lời khen/gấu trong khung trò chơi phải thuộc về LƯỢT CHỐT gần nhất: trả lời
//      liên tiếp trong 2,5s thì bóng chữ không được biến mất giữa chừng.
//   B  Lật Thẻ Trí Nhớ: id thẻ trùng nhau giữa mọi màn, nên hẹn giờ "úp lại thẻ" còn
//      sót từ màn cũ làm mất lựa chọn ở màn mới — hai thẻ lật xuống không được tính lượt.
//   C  Luyện đọc: bấm "Đọc cả câu" hai lần thì ô sáng phải chạy một chiều, không nhảy lùi.
//   D  Đấu Trường Chính Tả: đáp án SAI không khoá bàn chơi, nên bấm sai liên tiếp
//      khiến hẹn giờ 900ms của lần trước tắt đèn highlight của lần sau.
//   E  Máy Gắp Sticker: rời màn giữa vòng quay rAF thì không được mất vé và không
//      được nổ confetti ngay trên trang chủ.
// Chạy: npm run build && node qa/run-one.mjs qa/t33-feedback-timers.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.env.TEMP || process.env.TMP || '.', 'shots-t33');
fs.mkdirSync(OUT, { recursive: true });

const CLICK = { timeout: 10000 };

const TITLES = {
  hop: 'Ếch Nhảy Tia Số',
  memory: 'Lật Thẻ Trí Nhớ Vàng',
  spelling: 'Đấu Trường Chính Tả',
};


// Testid là điểm neo ổn định cho tương lai; lớp màu để probe chạy được cả trên
// bản chưa có testid (dùng khi đối chứng red/green).
const TOAST = '[data-testid="praise-toast"], div[class*="from-emerald-100"]';
const OPTION = '[data-testid="answer-option"]';
const CARD = '[data-testid="memory-card"]';
const TIER_TRIGGER = 'button[title="Bấm để chọn màn hoặc tăng độ khó"]';
const KARAOKE = '[data-testid="karaoke-read-all"]';

function titlesFromGamesProbe() {
  const src = fs.readFileSync(new URL('./games.mjs', import.meta.url), 'utf8');
  const block = /const GAME_TITLES = \[([\s\S]*?)\];/.exec(src);
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** Thứ tự ô đang được tô sáng trong đoạn đọc (-1 = không ô nào). */
const highlightIndex = (page) =>
  page.evaluate(() => {
    const spans = [...document.querySelectorAll('p.text-2xl span')];
    const on = spans.findIndex((s) => s.className.includes('bg-amber-300'));
    return on;
  });

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

  const play = page.getByRole('button', { name: /Chơi ngay/ });
  const openGame = async (title) => {
    const i = titles.indexOf(title);
    if (i < 0) throw new Error('không tìm thấy trò trong hub: ' + title);
    await play.nth(i).click();
    await page.waitForTimeout(1000);
    if (await page.getByText('Bắt đầu ▶').count()) await page.getByText('Bắt đầu ▶').click();
    await page.waitForTimeout(500);
  };
  // Nút "Về Trang Chủ" của màn đang hiện. Header cũng có nút về trang chủ
  // (aria-label="Về trang chủ") nhưng nó nằm ngoài <main> nên không lẫn được.
  const goHome = async () => {
    await page.locator('main button:has-text("Về Trang Chủ")').first().click(CLICK);
    await page.waitForTimeout(600);
  };
  const closeGame = async () => {
    const c = page.getByRole('button', { name: 'Đóng trò chơi và quay lại' }).first();
    if (await c.count()) await c.click();
    await page.waitForTimeout(700);
  };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${ui.origin}/?qa`);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

  // Màn 4 cho Lật Thẻ: deck 8 cặp (16 thẻ, id 1..16) nhận hẹn giờ sót từ Màn 1 (id 1..6).
  await page.evaluate(() => {
    const games = {};
    for (const id of ['memory_cards']) {
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

  // ── A: lời khen ở lại đủ 2,5s tính từ LƯỢT CHỐT mới nhất ─────────────────
  await openGame(TITLES.hop);
  const toast = page.locator(TOAST);
  const right = page.locator(`${OPTION}[data-correct="true"]`).first();
  const wrongBtn = page.locator(`${OPTION}[data-correct="false"]`).first();
  if (!(await right.count()) || !(await wrongBtn.count())) {
    fail('A', 'không có phương án đúng/sai để bấm (thiếu ?qa?)');
  } else {
    await right.click({ timeout: 5000 });
    try {
      await toast.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      fail('A', 'bấm đáp án đúng mà không hiện bóng lời khen');
    }
    const tCorrect = Date.now();
    await page.waitForTimeout(300);
    // Lượt chốt thứ hai: phương án bị khoá 1,4s sau đáp án đúng nên click tự chờ.
    await wrongBtn.click({ timeout: 6000 }).catch((e) => fail('A', `bấm sai thất bại: ${e.message}`));
    const tWrong = Date.now();
    const gapMs = tWrong - tCorrect;
    // Hẹn giờ của lượt đúng còn sống tới tCorrect+2500; lượt mới phải "cướp" nó.
    const staleDeath = tCorrect + 2500 - tWrong;
    const samples = [];
    for (const at of [300, 800, 1200, 1800, 2300]) {
      const wait = at - (Date.now() - tWrong);
      if (wait > 0) await page.waitForTimeout(wait);
      samples.push({ at, visible: await toast.isVisible().catch(() => false) });
    }
    out.facts.praiseToast = { gapMs, staleDeath, samples };
    if (gapMs > 2400) {
      fail('A', `hai lượt cách nhau ${gapMs}ms — không kịp bắt hẹn giờ lượt cũ, phép thử vô nghĩa`);
    } else {
      const early = samples.find((s) => s.at > staleDeath + 150 && !s.visible);
      if (early) {
        fail(
          'A',
          `lời khen của lượt chốt biến mất ở ${early.at}ms (hẹn giờ lượt trước tắt tại ${staleDeath}ms) — lượt cũ xoá nội dung lượt mới`
        );
      } else {
        step(`A1: hai lượt cách nhau ${gapMs}ms → lời khen của lượt mới còn nguyên tới ${samples[samples.length - 1].at}ms`);
      }
    }
    await shot('a-praise-toast-late');

    // chọn lại màn phải dọn luôn hẹn giờ đang chờ
    await page.locator(TIER_TRIGGER).first().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Màn 1: ")').first().click();
    await page.waitForTimeout(400);
    out.facts.toastAfterTierSwitch = await toast.isVisible().catch(() => false);
    await closeGame();
  }

  // ── B: Lật Thẻ — hẹn giờ úp thẻ của màn cũ không được ăn cắp lựa chọn màn mới ──
  const pickTier = async (label, waitMs) => {
    await page.locator(TIER_TRIGGER).first().click();
    await page.waitForTimeout(waitMs);
    await page.locator(`button:has-text("${label}")`).first().click();
    await page.waitForTimeout(waitMs);
  };
  await openGame(TITLES.memory);
  const cards = page.locator(CARD);
  const moves = async () => {
    const t = await page.locator('text=/Đã thử:/').first().innerText().catch(() => '');
    return Number((t.match(/Đã thử:\s*(\d+)/) || [])[1] ?? -1);
  };
  if ((await cards.count()) < 4) {
    fail('B', 'không thấy bảng thẻ của "Lật Thẻ Trí Nhớ Vàng"');
  } else {
    let verdict = null;
    for (let attempt = 1; attempt <= 3 && !verdict; attempt++) {
      // Tìm một lượt lật SAI ở Màn 1 (hai thẻ khác hình) — hẹn giờ 900ms được bắn.
      let mismatch = null;
      for (const [a, b] of [[0, 1], [2, 3], [4, 5]]) {
        await cards.nth(a).click();
        await cards.nth(b).click();
        const la = await cards.nth(a).innerText();
        const lb = await cards.nth(b).innerText();
        if (la !== lb) {
          mismatch = { a, b, la, lb };
          break;
        }
        await page.waitForTimeout(950);
      }
      if (!mismatch) {
        await pickTier('Màn 1: ', 250);
        continue;
      }
      // Trong 900ms đó: sang Màn 4 (deck mới) rồi lật tiếp hai thẻ.
      await pickTier('Màn 4: ', 150);
      const flipped = [];
      await cards.nth(0).click();
      await cards.nth(1).click();
      await page.waitForTimeout(1200);
      for (const i of [0, 1]) flipped.push((await cards.nth(i).innerText()).trim() !== '?');
      const movesAfter = await moves();
      out.facts[`memoryAttempt${attempt}`] = {
        mismatch,
        movesAfterTwoFlips: movesAfter,
        faceUpAfterWindow: flipped,
      };
      if (movesAfter === 1 && flipped.filter(Boolean).length === 0) {
        verdict = 'pass';
        step(`B1: Màn 4 (lần thử ${attempt}) lật 2 thẻ sau khi màn cũ còn hẹn giờ úp thẻ → vẫn tính 1 lượt và hai thẻ tự úp đúng`);
      } else if (movesAfter === 0) {
        verdict = 'fail';
        fail(
          'B',
          `màn mới lật 2 thẻ nhưng bộ đếm vẫn 0 lượt (thẻ còn mở: ${flipped.filter(Boolean).join(',')}) — hẹn giờ màn cũ xoá lựa chọn đang dở`
        );
      }
      if (!verdict) await pickTier('Màn 1: ', 250);
    }
    if (!verdict) fail('B', 'không tái hiện được cửa sổ 900ms sau 3 lần thử');
    await shot('b-memory-fresh-round');
    await closeGame();
  }

  // ── C: luyện đọc — bấm "Đọc cả câu" hai lần, ô sáng không được nhảy lùi ─────
  await page.locator('[data-testid="nav-reading_fluency"]:visible').first().click();
  await page.waitForSelector('text=Thang Luyện Đọc Của Bé', { timeout: 20000 });
  const start = page.locator('button:has-text("Bắt đầu luyện"), button:has-text("Luyện lại bước này")').first();
  await start.click({ timeout: 10000 });
  await page.waitForSelector(KARAOKE, { timeout: 20000 });

  const karaoke = page.locator(KARAOKE);
  await karaoke.click();
  await page.waitForTimeout(650);
  await karaoke.click();
  await page.waitForTimeout(120);
  const trail = [];
  for (let i = 0; i < 26; i++) {
    trail.push(await highlightIndex(page));
    await page.waitForTimeout(90);
  }
  out.facts.karaokeTrail = trail;
  const seen = trail.filter((v) => v >= 0);
  if (seen.length < 4) {
    fail('C', `karaoke không chạy (chỉ thấy ${seen.length} lần có ô sáng)`);
  } else {
    let back = -1;
    for (let i = 1; i < trail.length; i++) {
      if (trail[i] >= 0 && trail[i - 1] >= 0 && trail[i] < trail[i - 1]) {
        back = i;
        break;
      }
    }
    if (back >= 0) {
      fail('C', `ô sáng nhảy lùi tại mẫu ${back}: ${trail.slice(Math.max(0, back - 3), back + 2).join('→')} — hai chuỗi hẹn giờ cùng chạy`);
    } else {
      step(`C1: bấm "Đọc cả câu" hai lần liên tiếp → ô sáng đi một chiều (${seen[0]}→${seen[seen.length - 1]})`);
    }
  }
  await shot('c-karaoke-monotone');

  // C2 — bấm "Thoát" giữa lúc đọc: chuỗi highlight và giọng đọc phải tắt theo.
  const voiceState = () =>
    page.evaluate(
      () =>
        'speechSynthesis' in window &&
        (window.speechSynthesis.speaking || window.speechSynthesis.pending)
    );
  const speakingDuringRead = await voiceState();
  await page.locator('[aria-label="Thoát buổi luyện đọc"]').first().click(CLICK);
  await page.waitForTimeout(250);
  const speakingAfterExit = await voiceState();
  out.facts.exitStopsVoice = { speakingDuringRead, speakingAfterExit };
  if (!speakingDuringRead) {
    step('C2: trình duyệt QA không giữ giọng đọc đang chạy nên không đo được — chỉ kiểm tra được luồng thoát');
  } else if (speakingAfterExit) {
    fail('C2', 'bấm "Thoát" giữa lúc đọc mà giọng đọc vẫn vang trên thang luyện đọc');
  } else {
    step('C2: bấm "Thoát" giữa lúc đọc → giọng đọc dừng ngay, không vọng sang màn khác');
  }
  await shot('c2-exit-reading');
  await goHome();

  // ── D: Đấu Trường Chính Tả — bấm sai liên tiếp, highlight lần sau không bị
  //     hẹn giờ 900ms của lần trước xoá (đáp án sai KHÔNG khoá bàn chơi). ──────
  await page.locator('[data-testid="nav-games"]:visible').first().click(CLICK);
  await page.waitForSelector('text=Đấu Trường Trò Chơi Trí Tuệ', { timeout: 20000 });
  await openGame(TITLES.spelling);
  const wrongOpts = page.locator(`${OPTION}[data-correct="false"]`);
  if ((await wrongOpts.count()) < 2) {
    fail('D', 'không có đủ 2 phương án sai để bấm liên tiếp (thiếu ?qa hay testid?)');
  } else {
    await wrongOpts.nth(0).click(CLICK);
    const t1 = Date.now();
    // Bấm phương án thứ hai trong lúc hẹn giờ 900ms của phương án đầu còn chờ.
    while (Date.now() - t1 < 500) await page.waitForTimeout(20);
    await wrongOpts.nth(1).click(CLICK);
    const t2 = Date.now();
    const samples = [];
    for (const since1 of [300, 700, 1100, 1300]) {
      const wait = since1 - (Date.now() - t1);
      if (wait > 0) await page.waitForTimeout(wait);
      samples.push({
        since1: Date.now() - t1,
        since2: Date.now() - t2,
        red: await page.locator('button.bg-rose-500').count(),
      });
    }
    out.facts.doubleWrong = { gapMs: t2 - t1, samples };
    // Hẹn giờ lượt thứ NHẤT hết hạn tại t1+900; lượt thứ hai còn sáng tới t2+900.
    const afterStale = samples.filter((s) => s.since1 > 950 && s.since2 < 880);
    const wiped = afterStale.find((s) => s.red === 0);
    if (wiped) {
      fail(
        'D',
        `phương án vừa bấm mất highlight ở ${wiped.since1}ms sau lượt trước (${wiped.since2}ms sau lượt này) — hẹn giờ 900ms của lượt trước xoá phản hồi lượt sau`
      );
    } else if (afterStale.length === 0) {
      fail('D', `cửa sổ đo không hợp lệ (khoảng cách 2 lượt ${t2 - t1}ms)`);
    } else {
      step(
        `D1: bấm sai 2 phương án cách nhau ${t2 - t1}ms → phương án thứ hai vẫn được tô đỏ qua mốc hẹn giờ lượt đầu (${afterStale.map((s) => s.since1).join('/')}ms)`
      );
    }
    await shot('d-double-wrong-highlight');
    await closeGame();
  }

  // ── E: Máy Gắp Sticker — rời màn giữa vòng quay thì không được kéo vé và nổ
  //     phần thưởng trên màn hình khác. ────────────────────────────────────────
  await page.evaluate(() => {
    const raw = localStorage.getItem('kho_bau_child_profile');
    const profile = raw ? JSON.parse(raw) : {};
    profile.tickets = Math.max(5, Number(profile.tickets) || 0);
    localStorage.setItem('kho_bau_child_profile', JSON.stringify(profile));
  });
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.locator('button:has-text("Máy Gắp")').first().click(CLICK);
  await page.waitForSelector('[data-testid="gacha-draw"]', { timeout: 20000 });
  const baseline = await page.evaluate(() => ({
    tickets: Number(JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}').tickets),
    canvases: document.querySelectorAll('canvas').length,
  }));
  await page.locator('[data-testid="gacha-draw"]').first().click(CLICK);
  await page.waitForTimeout(300);
  await goHome();
  // Vòng quay dài 2s: chờ qua mốc đó ở màn hình khác.
  await page.waitForTimeout(2600);
  const after = await page.evaluate(() => ({
    tickets: Number(JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}').tickets),
    canvases: document.querySelectorAll('canvas').length,
    onHome: Boolean(document.querySelector('[data-testid="nav-games"]')),
  }));
  out.facts.gachaAbort = { baseline, after };
  if (!after.onHome) {
    fail('E', 'bấm "Về Trang Chủ" giữa vòng quay mà vẫn không về được trang chủ');
  } else if (after.tickets !== baseline.tickets) {
    fail('E', `rời màn giữa lúc quay nhưng vé vẫn bị kéo (${baseline.tickets}→${after.tickets})`);
  } else if (after.canvases > baseline.canvases) {
    fail('E', `bắn confetti ${after.canvases} canvas ngay trên trang chủ (nền ${baseline.canvases}) — vòng quay rAF không bị huỷ`);
  } else {
    step('E1: bấm gắp rồi về Trang Chủ sau 300ms → không mất vé, không nổ âm thanh/confetti ở màn hình khác');
  }
  await shot('e-gacha-abort');

  return out;
}
