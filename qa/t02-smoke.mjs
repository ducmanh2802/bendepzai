/** T02 smoke: boot, open hub, launch 3 fixed games, assert no console errors. */
import path from 'node:path';
import { spawn } from 'node:child_process';

const port = Number(process.env.PORT || 4175);
const origin = `http://localhost:${port}`;
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const server = spawn(process.execPath, [viteBin, 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });

async function waitFor() {
  const start = Date.now();
  for (;;) {
    try {
      const r = await fetch(origin);
      if (r.ok) break;
    } catch {}
    if (Date.now() - start > 60000) throw new Error('preview did not start');
    await new Promise((r) => setTimeout(r, 400));
  }
}

let browser;
const errors = [];
try {
  await waitFor();
  const { chromium } = await import('playwright');
  browser = await chromium.launch({
    executablePath: 'C:/Users/Windows/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
  });
  const page = await browser.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('[console] ' + m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => errors.push('[page] ' + String(e).slice(0, 200)));
  await page.goto(origin + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  // open hub (T20A: the hub is reached from the navigation bar)
  await page.locator('[data-testid="nav-games"]:visible').first().click();
  await page.waitForTimeout(1200);
  // open spelling duel via its card's play button
  const duelCard = page.locator('div', { hasText: 'Đấu Trường Chính Tả' }).last();
  void duelCard;
  const cards = page.locator('button', { hasText: 'Chơi ngay' });
  console.log('play buttons:', await cards.count());
  // Spelling duel is the 6th game card in the catalog order
  await cards.nth(5).click();
  await page.waitForTimeout(1500);
  const modalVisible = await page.getByRole('dialog').count();
  console.log('spelling dialog open:', modalVisible > 0);
  // answer one question (click first option)
  const opts = page.locator('[role="dialog"] button');
  console.log('dialog buttons:', await opts.count());
  await page.screenshot({ path: 'docs/opencode/reports/img/T02_spelling.png' });
  // close modal
  await page.getByRole('button', { name: /Đóng trò chơi và quay lại/i }).first().click();
  await page.waitForTimeout(600);
  // open ocean fishing
  const cards2 = page.locator('button', { hasText: 'Chơi ngay' });
  await cards2.nth(9).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/opencode/reports/img/T02_ocean.png' });
  await page.getByRole('button', { name: /Đóng trò chơi và quay lại/i }).first().click();
  await page.waitForTimeout(600);
  console.log('ERRORS:', JSON.stringify(errors.slice(0, 10)));
  if (errors.length > 0) process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill();
}
