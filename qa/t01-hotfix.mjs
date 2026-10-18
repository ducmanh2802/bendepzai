/**
 * T01 screenshots: Home + Games Hub at 1280px and 375px.
 * Saves to docs/opencode/reports/img/T01_*.
 * Probe-style export for qa/run-one.mjs, plus standalone mode.
 */
import path from 'node:path';
import fs from 'node:fs';

const IMG_DIR = path.resolve('docs/opencode/reports/img');

async function shot(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(800);
  const file = path.join(IMG_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

export default async function run(page, ui) {
  const errors = [];
  try {
    fs.mkdirSync(IMG_DIR, { recursive: true });

    // Desktop 1280 — Home
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ui.origin + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await shot(page, 'T01_home_1280.png', { width: 1280, height: 900 });

    // Check hero gradient visible: hero banner should have gradient bg class
    const heroBg = await page.evaluate(() => {
      const el = document.querySelector('.kb-hero-pattern');
      if (!el) return 'NO_HERO';
      const cs = getComputedStyle(el);
      return cs.backgroundImage.slice(0, 120);
    });
    console.log('hero backgroundImage:', heroBg);
    if (heroBg === 'NO_HERO' || heroBg === 'none') errors.push('hero pattern missing');

    // Go to Games Hub through the navigation bar (T20A: the home screen no
    // longer carries a "Chơi ngay" shortcut button).
    const hubBtn = page.locator('[data-testid="nav-games"]:visible').first();
    if ((await hubBtn.count()) > 0) {
      await hubBtn.click();
      await page.waitForTimeout(1200);
    } else {
      errors.push('games hub nav button not found');
    }
    await shot(page, 'T01_hub_1280.png', { width: 1280, height: 900 });

    // Mobile 375 — Home
    await page.goto(ui.origin + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot(page, 'T01_home_375.png', { width: 375, height: 667 });

    // Mobile 375 — Hub
    const hubBtn2 = page.locator('[data-testid="nav-games"]:visible').first();
    if ((await hubBtn2.count()) > 0) {
      await hubBtn2.click();
      await page.waitForTimeout(1200);
    }
    await shot(page, 'T01_hub_375.png', { width: 375, height: 667 });

    // Bottom nav check: visible on mobile, hidden on desktop
    await page.setViewportSize({ width: 375, height: 667 });
    const navVisibleMobile = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Điều hướng nhanh"]');
      if (!nav) return false;
      const cs = getComputedStyle(nav);
      return cs.display !== 'none';
    });
    console.log('bottom nav visible @375:', navVisibleMobile);
    if (!navVisibleMobile) errors.push('bottom nav hidden on mobile');

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(400);
    const navVisibleDesktop = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Điều hướng nhanh"]');
      if (!nav) return false;
      const r = nav.getBoundingClientRect();
      const cs = getComputedStyle(nav);
      return cs.display !== 'none' && r.width > 0 && r.height > 0;
    });
    console.log('bottom nav visible @1280:', navVisibleDesktop);
    if (navVisibleDesktop) errors.push('bottom nav should be hidden on desktop (>=1024)');

    // Console errors collection is done by harness; here just report
    return { ok: errors.length === 0, errors };
  } catch (e) {
    return { ok: false, errors: [...errors, String(e && e.stack ? e.stack : e)] };
  }
}

// Standalone: node qa/t01-hotfix.mjs
if (process.argv[1] && process.argv[1].endsWith('t01-hotfix.mjs')) {
  const { spawn } = await import('node:child_process');
  const { chromium } = await import('playwright');
  const port = Number(process.env.PORT || 4174);
  const origin = `http://localhost:${port}`;
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  const waitFor = async () => {
    const start = Date.now();
    for (;;) {
      try {
        const r = await fetch(origin);
        if (r.ok) break;
      } catch {}
      if (Date.now() - start > 60000) throw new Error('preview did not start');
      await new Promise((r) => setTimeout(r, 400));
    }
  };
  let browser;
  try {
    await waitFor();
    browser = await chromium.launch({
      executablePath: 'C:/Users/Windows/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
    });
    const page = await browser.newPage();
    await page.goto(origin + '/');
    const state = await run(page, { origin });
    console.log(JSON.stringify(state, null, 2));
    process.exitCode = state.ok ? 0 : 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill();
  }
}
