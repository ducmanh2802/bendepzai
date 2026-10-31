// T28 — bằng chứng nhìn thấy được cho máy gắp sticker (GachaMachineScreen).
// Trên bản build thật 390×844: mở Home → Máy Gắp, kiểm tra đống sticker xếp
// ngang khung kính (bản lỗi dồn 8 emoji vào giữa), bấm gắp và xác nhận hoạt
// hình claw/chạy đống sticker, rồi kết quả + lịch sử hiện ra.
// Chạy: npm run build && node qa/run-one.mjs qa/gacha-machine.mjs
import fs from 'node:fs';
import path from 'node:path';
import { dismissLevelUpCelebration } from './lib.mjs';

const OUT = path.resolve(process.env.TEMP || process.env.TMP || '.', 'shots-t28-gacha');
fs.mkdirSync(OUT, { recursive: true });

export default async function run(page) {
  const out = { errors: [], shots: [], facts: {}, steps: [] };
  const CLICK = { timeout: 15000 };
  const shot = async (name, opts = {}) => {
    const file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file, fullPage: false, ...opts });
    out.shots.push(file);
  };
  const step = (name, detail) => out.steps.push({ step: name, ...detail });

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem(
        'kho_bau_child_profile',
        JSON.stringify({ id: 'qa-gacha', name: 'Bé QA', xp: 0, stars: 50, tickets: 5, streak: 1 })
      );
    });
    await page.reload();
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    await page.locator('button:has-text("Máy Gắp")').first().click(CLICK);
    await page.waitForSelector('[data-testid="gacha-pile"]', { timeout: 20000 });
    await page.evaluate(() =>
      document.querySelector('[data-testid="gacha-window"]')?.scrollIntoView({ block: 'center' })
    );
    await page.waitForTimeout(400);

    const pile = await page.evaluate(() => {
      const win = document.querySelector('[data-testid="gacha-window"]').getBoundingClientRect();
      const rects = [...document.querySelectorAll('[data-testid="gacha-sticker"]')].map((el) =>
        el.getBoundingClientRect()
      );
      const xs = rects.map((r) => r.left + r.width / 2);
      const ys = rects.map((r) => r.top + r.height / 2);
      return {
        count: rects.length,
        winW: Math.round(win.width),
        winH: Math.round(win.height),
        spreadX: Math.round(Math.max(...xs) - Math.min(...xs)),
        spreadXRatio: Math.round(((Math.max(...xs) - Math.min(...xs)) / win.width) * 100),
        spreadYRatio: Math.round(((Math.max(...ys) - Math.min(...ys)) / win.height) * 100),
        outside: rects.filter(
          (r) =>
            r.left < win.left - 1 || r.right > win.right + 1 || r.top < win.top - 1 || r.bottom > win.bottom + 1
        ).length,
      };
    });
    step('pileLayout', pile);
    if (pile.count !== 10) out.errors.push(`có ${pile.count} sticker trong kính, phải 10`);
    if (pile.spreadXRatio < 55)
      out.errors.push(`đống sticker chỉ trải ${pile.spreadXRatio}% bề ngang kính (lỗi dồn cục giữa)`);
    if (pile.spreadYRatio < 15) out.errors.push(`đống sticker chỉ trải ${pile.spreadYRatio}% bề cao kính`);
    if (pile.outside > 0) out.errors.push(`${pile.outside} sticker tràn ra ngoài khung kính`);
    await shot('01-gacha-pile');

    await page.locator('[data-testid="gacha-draw"]').first().click(CLICK);
    await page.waitForTimeout(350);
    const anim = await page.evaluate(() => {
      const claw = document.querySelector('[data-testid="gacha-claw"]');
      const pileEl = document.querySelector('[data-testid="gacha-pile"]');
      return {
        claw: claw ? getComputedStyle(claw).animationName : null,
        pile: pileEl ? getComputedStyle(pileEl).animationName : null,
        spinningLabel: /Đang Gắp/.test(document.body.innerText),
      };
    });
    step('spinAnimation', anim);
    if (anim.claw !== 'claw-drop') out.errors.push(`claw không chạy hoạt hình claw-drop: "${anim.claw}"`);
    if (anim.pile !== 'gacha-jumble') out.errors.push(`đống sticker không rung khi gắp: "${anim.pile}"`);
    if (!anim.spinningLabel) out.errors.push('nút gắp không báo "Đang Gắp..." lúc quay');
    await shot('02-gacha-spinning');

    const dialog = page.locator('[role="dialog"][aria-label="Kết quả máy gắp sticker"]:visible');
    await dialog.waitFor({ state: 'visible', timeout: 10000 });
    const resultText = (await dialog.innerText()).replace(/\s+/g, ' ').trim();
    const ticketsLeft = await page.evaluate(
      () => JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}').tickets
    );
    step('drawResult', { resultText: resultText.slice(0, 160), ticketsLeft });
    if (!/Sticker/i.test(resultText)) out.errors.push(`hộp kết quả không nói sticker: "${resultText}"`);
    if (ticketsLeft !== 4) out.errors.push(`sau 1 lượt còn ${ticketsLeft} vé, phải 4`);
    await shot('03-gacha-result');

    // Gắp sticker có thể vừa đủ ngưỡng lên cấp → hộp chúc mừng phủ lên hộp kết
    // quả. Đóng nó trước rồi mới bấm nút của hộp kết quả (cùng chữ "Tuyệt Vời!").
    const levelUpShown = await dismissLevelUpCelebration(page);
    await dialog.locator('button:has-text("Tuyệt Vời!"), button:has-text("Hiểu Rồi")').first().click(CLICK);
    await page.waitForSelector('[data-testid="gacha-history"]', { timeout: 8000 });
    const historyCount = await page.locator('[data-testid="gacha-history"] > button').count();
    step('history', { historyCount, levelUpShown });
    if (historyCount < 1) out.errors.push('lịch sử gần đây không hiện sticker vừa gắp');
    await shot('04-gacha-history');

    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      return Math.max(0, de.scrollWidth - de.clientWidth);
    });
    out.facts.overflowPx = overflow;
    if (overflow > 2) out.errors.push(`tràn ngang ${overflow}px ở màn 390px`);
  } catch (e) {
    out.errors.push('EXCEPTION: ' + (e && e.message ? String(e.message).slice(0, 900) : String(e)));
    out.failedAt = out.steps.length ? out.steps[out.steps.length - 1].step : 'start';
    await shot('99-failure').catch(() => {});
  }

  out.ok = out.errors.length === 0;
  return out;
}
