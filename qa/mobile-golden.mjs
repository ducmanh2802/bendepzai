/**
 * MOBILE GOLDEN PATH (§43) — one condensed child journey at 390x844.
 *
 * HOME -> LESSON -> QUESTION -> ANSWER -> AUDIO -> GAME -> COMPETITION ->
 * RESULT -> PARENT MODE -> MODAL -> RELOAD. Asserts the journey completes with
 * zero overflow, tappable controls, and no errors — not just that each screen
 * paints in isolation.
 */

import { openFirstLesson, openCompetitionHub } from './lib.mjs';
const CLICK = { timeout: 12000 };

export default async function run(page, ui) {
  const out = { legs: [], errors: [] };
  const leg = (k, v) => out.legs.push({ leg: k, ...v });
  const APP_ORIGIN = new URL(page.url()).origin;

  // 200%-zoom leg (P2-3): QA_VIEWPORT=195x422 is exactly what 200% browser
  // zoom lays out on a 390px phone. Same journey, tighter CSS pixels.
  const vpMatch = (process.env.QA_VIEWPORT || '').match(/^(\d+)x(\d+)$/);
  const vp = vpMatch ? { width: Number(vpMatch[1]), height: Number(vpMatch[2]) } : { width: 390, height: 844 };
  await page.setViewportSize(vp);
  out.viewport = `${vp.width}x${vp.height}`;
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  leg('home', { ok: true });

  // LESSON -> QUESTION -> ANSWER
  await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
  await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
  await openFirstLesson(page);
  await page.waitForSelector('[role=dialog]', { timeout: 20000 });
  await page.waitForTimeout(800);
  const q = page.locator('[role=dialog] [data-testid=answer-option]').first();
  if (!(await q.count())) {
    out.errors.push('mobile: lesson showed no answer options');
  } else {
    await q.click(CLICK);
    const check = page.getByRole('button', { name: /Kiểm tra câu trả lời/ });
    if (await check.count()) {
      await check.click(CLICK);
      await page.waitForTimeout(500);
      const fb = await page.evaluate(() => document.body.innerText);
      const ok = /Đúng rồi|Đáp án đúng là|Chưa đúng/.test(fb);
      leg('lessonAnswer', { feedback: ok });
      if (!ok) out.errors.push('mobile: no answer feedback in lesson');
    }
  }

  // AUDIO (user-initiated, stateful)
  const audioBtn = page.locator('[data-testid=question-audio]').first();
  if (await audioBtn.count()) {
    await audioBtn.click(CLICK);
    await page.waitForTimeout(600);
    const st = await audioBtn.getAttribute('data-audio-state');
    leg('audio', { state: st });
    if (!['playing', 'played', 'unavailable'].includes(st || '')) {
      out.errors.push(`mobile: audio button in bad state ${st}`);
    }
  }
  await page.getByRole('button', { name: 'Đóng bài học' }).click(CLICK).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});

  // GAME (mount one, verify interactive, exit)
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.locator('[data-testid="nav-games"]:visible').first().click(CLICK);
  await page.waitForSelector('text=Đấu Trường Trò Chơi Trí Tuệ', { timeout: 20000 });
  await page.getByRole('button', { name: /Chơi ngay/ }).first().click(CLICK);
  await page.waitForTimeout(1500);
  const gameDialog = (await page.locator('[role=dialog]').count()) > 0;
  leg('gameMount', { open: gameDialog });
  if (!gameDialog) out.errors.push('mobile: game did not open');
  const gameOverflow = await page.evaluate(() => {
    const de = document.documentElement;
    return Math.max(0, de.scrollWidth - de.clientWidth);
  });
  if (gameOverflow > 2) out.errors.push(`mobile: game overflow ${gameOverflow}px`);
  const closeGame = page.getByRole('button', { name: /Đóng trò chơi|Thoát|Đóng/ }).first();
  if (await closeGame.count()) await closeGame.click(CLICK).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});

  // COMPETITION -> RESULT
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  // T20A / B-04: no world-map entry for the arena — reach it like a parent does.
  await openCompetitionHub(page);
  await page.getByRole('button', { name: /Vào Thi Thử/ }).first().click(CLICK);
  await page.waitForSelector('role=dialog', { timeout: 20000 });
  await page.waitForTimeout(800);
  for (let i = 0; i < 12; i += 1) {
    const o = page.locator('[role=dialog] [data-testid=answer-option]').first();
    const ml = page.locator('[role=dialog] [data-testid=match-left]').first();
    if (await o.count()) await o.click(CLICK).catch(() => {});
    else if (await ml.count()) {
      await ml.click(CLICK).catch(() => {});
      const mr = page.locator('[role=dialog] [data-testid=match-right]').first();
      if (await mr.count()) await mr.click(CLICK).catch(() => {});
    }
    const next = page.getByRole('button', { name: /^Câu tiếp$/ });
    if (await next.count()) {
      await next.click(CLICK);
      await page.waitForTimeout(90);
    } else break;
  }
  const submit = page.getByRole('button', { name: /^Nộp Bài$/ });
  if (await submit.count()) {
    await submit.click(CLICK);
    await page.getByRole('button', { name: 'Xác nhận Nộp Bài' }).click(CLICK);
    const result = await page.getByText('KẾT QUẢ BÀI THI').count({ timeout: 20000 });
    leg('competitionResult', { shown: result > 0 });
    if (!result) out.errors.push('mobile: competition result did not appear');
    const close = page.getByRole('button', { name: /Đóng|Về Đấu Trường/ }).last();
    if (await close.count()) await close.click(CLICK).catch(() => {});
  } else {
    out.errors.push('mobile: competition submit never appeared');
  }

  // PARENT MODE -> gate -> modal
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.getByRole('button', { name: 'Khu vực dành cho Ba Mẹ' }).click(CLICK);
  await page.waitForSelector('text=Cổng Xác Nhận Phụ Huynh', { timeout: 20000 });
  await page.waitForTimeout(400);
  const gate = await page.evaluate(() => {
    const el = document.querySelector('.bg-slate-100.rounded-2xl');
    return el ? el.textContent.trim() : null;
  });
  const m = gate && gate.match(/(\d+)\s*\+\s*(\d+)/);
  if (m) {
    await page.getByRole('spinbutton').fill(String(Number(m[1]) + Number(m[2])), CLICK);
    await page.getByRole('button', { name: 'Mở Bảng Phụ Huynh' }).click(CLICK);
  }
  await page.waitForTimeout(800);
  const parentOpen = (await page.locator('[role=dialog]').count()) > 0;
  leg('parentMode', { open: parentOpen });
  if (!parentOpen) out.errors.push('mobile: parent dashboard did not open');

  // RELOAD -> progress survives
  const before = await page.evaluate(() => ({
    xp: JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}').xp || 0,
  }));
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  const after = await page.evaluate(() => ({
    xp: JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}').xp || 0,
  }));
  leg('reloadPersistence', { xpBefore: before.xp, xpAfter: after.xp });
  if (after.xp < before.xp) out.errors.push('mobile: XP lost across reload');

  await page.setViewportSize({ width: 1280, height: 800 });

  return out;
}
