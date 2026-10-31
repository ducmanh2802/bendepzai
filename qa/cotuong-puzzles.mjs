// T26 — bằng chứng nhìn thấy được cho chế độ "Luyện thế cờ" (cờ tướng).
// Trên bản build thật 390×844: mở Home → Cờ Tướng → Luyện thế cờ, thử một nước
// sai (phải báo "chưa chiếu"), giải 2 thế cờ đầu, kiểm tra tiến độ được lưu vào
// localStorage và còn nguyên sau khi tải lại trang. Chụp màn hình từng bước.
// Chạy: npm run build && node qa/run-one.mjs qa/cotuong-puzzles.mjs
import fs from 'node:fs';
import path from 'node:path';
import { dismissLevelUpCelebration } from './lib.mjs';

const OUT = path.resolve(process.env.TEMP || process.env.TMP || '.', 'shots-t26-cotuong');
fs.mkdirSync(OUT, { recursive: true });

export default async function run(page) {
  const out = { errors: [], shots: [], facts: {}, steps: [] };
  const CLICK = { timeout: 15000 };

  const shot = async (name) => {
    const file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file, fullPage: false });
    out.shots.push(file);
  };
  const step = (name, detail) => out.steps.push({ step: name, ...detail });

  const heading = page.locator('h1:has-text("Vương Quốc Cờ Tướng")').first();
  const openCotuong = async () => {
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    if (!(await heading.count())) {
      await page.locator('button:has-text("Cờ Tướng")').first().click(CLICK);
      await heading.waitFor({ state: 'visible', timeout: 20000 });
    }
    await page.locator('button:has-text("Luyện thế cờ")').first().click(CLICK);
    await page.waitForSelector('[data-testid="ct-cell-4-2"]', { timeout: 20000 });
  };

  const cell = (r, c) => page.locator(`[data-testid="ct-cell-${r}-${c}"]`).first();
  const progressText = async () =>
    (await page.locator('[data-testid="ct-puzzle-progress"]').first().innerText()).trim();
  const solvedIds = () =>
    page.evaluate(() => {
      try {
        const raw = JSON.parse(localStorage.getItem('kho_bau_cotuong_puzzles') || '[]');
        return Array.isArray(raw) ? raw : [];
      } catch {
        return 'PARSE_ERROR';
      }
    });
  const makeMove = async (from, to) => {
    await cell(from[0], from[1]).click(CLICK);
    await page.waitForTimeout(120);
    await cell(to[0], to[1]).click(CLICK);
    await page.waitForTimeout(250);
  };

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await openCotuong();

    const tabs = await page.locator('[data-testid^="ct-puzzle-tab-"]').count();
    const startProgress = await progressText();
    step('puzzlesOpened', { tabs, startProgress });
    if (tabs !== 6) out.errors.push(`có ${tabs} thẻ thế cờ, phải đủ 6`);
    if (startProgress !== '0/6 thế') out.errors.push(`tiến độ ban đầu "${startProgress}", phải "0/6 thế"`);
    await shot('01-puzzle-board');

    // 1) Nước hợp lệ nhưng không chiếu: Xe đỏ [1,8] → [1,6].
    await makeMove([1, 8], [1, 6]);
    const missBox = page.locator('[data-testid="ct-puzzle-feedback"]').first();
    const missShown = await missBox.count();
    const missText = missShown ? (await missBox.innerText()).trim() : '';
    step('missFeedback', { shown: missShown > 0, text: missText });
    if (!missShown) out.errors.push('nước không chiếu không hiện lời nhắc cho bé');
    if (!/chưa chiếu/i.test(missText)) out.errors.push(`lời nhắc nước sai lạ: "${missText}"`);
    await shot('02-miss-feedback');

    // 2) Làm lại rồi giải thế 1: Mã [4,2] → [2,3] chiếu bí.
    await page.locator('[data-testid="ct-puzzle-reset"]').first().click(CLICK);
    await page.waitForTimeout(200);
    await makeMove([4, 2], [2, 3]);
    const success = page.locator('[data-testid="ct-puzzle-success"]').first();
    await success.waitFor({ state: 'visible', timeout: 8000 });
    const s1 = await success.innerText();
    const progress1 = await progressText();
    const ids1 = await solvedIds();
    step('puzzle1Solved', { progress: progress1, ids: ids1, overlay: s1.replace(/\s+/g, ' ').slice(0, 120) });
    if (!/CHIẾU BÍ THÀNH CÔNG/.test(s1)) out.errors.push('không thấy màn chúc mừng chiếu bí');
    if (progress1 !== '1/6 thế') out.errors.push(`tiến độ sau thế 1 "${progress1}", phải "1/6 thế"`);
    if (!Array.isArray(ids1) || !ids1.includes('ct-pz-1'))
      out.errors.push(`localStorage chưa lưu ct-pz-1: ${JSON.stringify(ids1)}`);
    await shot('03-puzzle1-solved');

    // 3) Sang thế 2 và giải: Pháo sau [3,0] → [3,4] qua ngòi là Pháo [1,4].
    await page.locator('[data-testid="ct-puzzle-next"]').first().click(CLICK);
    await page.waitForTimeout(300);
    await makeMove([3, 0], [3, 4]);
    await page.locator('[data-testid="ct-puzzle-success"]').first().waitFor({ state: 'visible', timeout: 8000 });
    const progress2 = await progressText();
    const ids2 = await solvedIds();
    step('puzzle2Solved', { progress: progress2, ids: ids2 });
    if (progress2 !== '2/6 thế') out.errors.push(`tiến độ sau thế 2 "${progress2}", phải "2/6 thế"`);
    if (!Array.isArray(ids2) || !ids2.includes('ct-pz-2'))
      out.errors.push(`localStorage chưa lưu ct-pz-2: ${JSON.stringify(ids2)}`);
    await shot('04-puzzle2-solved');

    // 4) Tiến độ phải sống sót sau khi tải lại trang. 50 XP từ 2 thế cờ đủ mở
    // hộp quà lên level khi app khởi động lại — đó là hành vi đúng, phải đóng nó
    // trước khi bấm tiếp (giống qa/golden-path.mjs).
    await page.reload();
    const levelUp = page.locator('[role="dialog"][aria-label="Chúc mừng lên level"]:visible');
    const levelUpShown = await levelUp
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (levelUpShown) await dismissLevelUpCelebration(page);
    await openCotuong();
    const progressAfterReload = await progressText();
    const idsAfterReload = await solvedIds();
    const solvedBadges = await page.getByText('✓ Đã giải').count();
    step('persistedAfterReload', {
      progress: progressAfterReload,
      ids: idsAfterReload,
      solvedBadges,
      levelUpCelebration: levelUpShown,
    });
    if (progressAfterReload !== '2/6 thế')
      out.errors.push(`sau reload tiến độ còn "${progressAfterReload}", phải "2/6 thế"`);
    if (solvedBadges < 2) out.errors.push(`chỉ ${solvedBadges} thế hiện huy hiệu "Đã giải", phải ≥ 2`);
    await shot('05-after-reload');

    // 5) Bố cục điện thoại: không tràn ngang, nút bấm đủ lớn.
    const layout = await page.evaluate(() => {
      const de = document.documentElement;
      const btns = [
        ...document.querySelectorAll('[data-testid="ct-puzzle-reset"], [data-testid^="ct-puzzle-tab-"]'),
      ];
      return {
        overflowPx: Math.max(0, de.scrollWidth - de.clientWidth),
        minButtonH: btns.length ? Math.round(Math.min(...btns.map((b) => b.getBoundingClientRect().height))) : 0,
        cellCount: document.querySelectorAll('[data-testid^="ct-cell-"]').length,
      };
    });
    out.facts.layout = layout;
    if (layout.overflowPx > 2) out.errors.push(`tràn ngang ${layout.overflowPx}px ở màn 390px`);
    if (layout.cellCount !== 90) out.errors.push(`bàn cờ có ${layout.cellCount} ô bấm, phải 90`);
    if (layout.minButtonH < 44) out.errors.push(`nút điều khiển cao ${layout.minButtonH}px, dưới chuẩn 44px`);
  } catch (e) {
    out.errors.push('EXCEPTION: ' + (e && e.message ? String(e.message).slice(0, 900) : String(e)));
    out.failedAt = out.steps.length ? out.steps[out.steps.length - 1].step : 'start';
    out.facts.debug = await page
      .evaluate(() => ({
        dialogs: [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.offsetParent !== null).length,
        cotuongButtons: [...document.querySelectorAll('button')]
          .filter((b) => /Cờ Tướng/.test(b.textContent || ''))
          .map((b) => {
            const r = b.getBoundingClientRect();
            const mid = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return {
              w: Math.round(r.width),
              h: Math.round(r.height),
              top: Math.round(r.top),
              visible: b.offsetParent !== null,
              disabled: b.disabled,
              coveredBy: mid === b || b.contains(mid) ? null : (mid && (mid.textContent || '').trim().slice(0, 40)) || 'none',
            };
          }),
        text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 400),
      }))
      .catch(() => null);
    await shot('99-failure').catch(() => {});
  }

  out.ok = out.errors.length === 0;
  return out;
}
