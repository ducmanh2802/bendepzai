/**
 * Generic QA runner (P41).
 *
 * The qa/*.mjs probes export `default async run(page, ui)` and historically
 * relied on an external harness. This runner makes them executable locally and
 * on CI: it builds nothing (expects `dist/`), boots `vite preview`, launches
 * Chromium (explicit PW_CHROME → this machine's cached build → the Playwright
 * registry), invokes one probe and prints its JSON result.
 *
 * Exit code is non-zero only when the probe records errors or declares
 * `ok: false` — many probes never set `ok`, so a missing `ok` is not a failure.
 *
 * Usage:
 *   npm run build && node qa/run-one.mjs qa/golden-path.mjs
 * Env:
 *   PW_CHROME  override chromium executable path
 *   PORT       preview port (default 4173)
 *   CI         adds --no-sandbox when set
 */

import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const DEFAULT_CHROME =
  'C:/Users/Windows/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node qa/run-one.mjs <qa/probe.mjs>');
  process.exit(2);
}

const port = Number(process.env.PORT || 4173);
const origin = `http://localhost:${port}`;
// Prefer an explicit override, then the cached Windows build, then whatever
// chromium `npx playwright install` placed in the Playwright registry.
const chromePath = process.env.PW_CHROME || (fs.existsSync(DEFAULT_CHROME) ? DEFAULT_CHROME : undefined);

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {
        /* not ready yet */
      }
      if (Date.now() - start > timeoutMs) return reject(new Error('preview server did not start'));
      setTimeout(tick, 400);
    };
    tick();
  });
}

async function main() {
  if (!fs.existsSync('dist')) {
    console.error('dist/ not found — run `npm run build` first.');
    process.exit(2);
  }

  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const server = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    { stdio: 'ignore' }
  );

  let browser;
  try {
    await waitForServer(origin);

    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      executablePath: chromePath,
      // CI containers usually cannot start a sandboxed chromium.
      args: process.env.CI ? ['--no-sandbox'] : [],
    });
    const page = await browser.newPage();
    // Probes assume they start on the app origin (localStorage access).
    await page.goto(origin + '/');

    const mod = await import(pathToFileURL(path.resolve(target)).href);
    const ui = { origin };
    const state = await mod.default(page, ui);

    console.log(JSON.stringify(state, null, 2));
    // A probe passes when it recorded no errors. Some probes (golden-path) never
    // set `ok`, so only an explicit `ok: false` counts as a self-declared failure.
    const errors = Array.isArray(state.errors) ? state.errors : [];
    const failed = errors.length > 0 || state.ok === false;
    if (failed) {
      console.error(`QA FAIL — ${errors.length} error(s)` + (state.failedAt ? ` at ${state.failedAt}` : ''));
    } else {
      console.error(`QA PASS — ${(state.steps || []).length} step(s), 0 errors`);
    }
    process.exitCode = failed ? 1 : 0;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill();
  }
}

main().catch((e) => {
  console.error('RUNNER_ERROR', e && e.stack ? e.stack : e);
  process.exit(1);
});
