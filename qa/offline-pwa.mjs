import { openFirstLesson } from './lib.mjs';
/**
 * OFFLINE / PWA QA (§25)
 *
 * Proves in a real browser that:
 *   1. the service worker registers in the production build
 *   2. the shell + hashed bundles land in the cache
 *   3. the app still loads and works with the network switched OFF
 *   4. it recovers when the network comes back
 */
export default async function run(page, ui) {
  const out = { steps: [], errors: [] };
  // Never hardcode a host:port: each origin has its own service-worker scope.
  const APP_ORIGIN = new URL(page.url()).origin;
  const step = (k, v) => out.steps.push({ step: k, ...v });

  // 1) Load once online so the worker installs and caches the shell.
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 30000 });

  await page.waitForFunction(
    async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    },
    { timeout: 20000 }
  );
  step('registered', { ok: true });

  // Give the worker a moment to claim clients and finish precaching.
  await page.waitForTimeout(1500);

  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      scope: reg ? reg.scope : null,
      active: !!(reg && reg.active),
      controller: !!navigator.serviceWorker.controller,
    };
  });
  step('workerState', swState);
  if (!swState.active) out.errors.push('service worker never became active');

  // 1b) Manifest icons: every PNG reference must fetch with the right MIME type
  // and decode to the declared dimensions. A renamed non-PNG or a broken link
  // fails here, not on a user's home screen.
  const iconCheck = await page.evaluate(async () => {
    const res = await fetch('/manifest.webmanifest');
    if (!res.ok) return { manifestOk: false, icons: [] };
    const manifest = await res.json();
    const icons = [];
    for (const icon of manifest.icons || []) {
      if (icon.type !== 'image/png') {
        icons.push({ src: icon.src, skipped: 'not-png' });
        continue;
      }
      try {
        const r = await fetch(icon.src);
        const blob = await r.blob();
        const bmp = await createImageBitmap(blob);
        icons.push({
          src: icon.src,
          status: r.status,
          mime: r.headers.get('content-type'),
          width: bmp.width,
          height: bmp.height,
          declared: icon.sizes,
          ok:
            r.ok &&
            (r.headers.get('content-type') || '').includes('image/png') &&
            `${bmp.width}x${bmp.height}` === icon.sizes,
        });
        bmp.close();
      } catch (e) {
        icons.push({ src: icon.src, ok: false, error: String(e).slice(0, 120) });
      }
    }
    return { manifestOk: true, icons };
  });
  step('manifestIcons', iconCheck);
  if (!iconCheck.manifestOk) out.errors.push('manifest.webmanifest did not load');
  for (const icon of iconCheck.icons || []) {
    if (icon.skipped) continue;
    if (!icon.ok) out.errors.push(`manifest icon failed: ${icon.src} (${icon.error || `${icon.width}x${icon.height} mime=${icon.mime}`})`);
  }

  // 2) Reload once more so every hashed bundle passes through the worker.
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 30000 });
  await page.waitForTimeout(2500);

  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const detail = {};
    for (const n of names) {
      const c = await caches.open(n);
      detail[n] = (await c.keys()).map((r) => new URL(r.url).pathname);
    }
    return { names, detail };
  });
  step('caches', cached);

  const allCached = Object.values(cached.detail).flat();
  const hasShell = allCached.some((p) => p.endsWith('/index.html') || p === '/');
  const hasJs = allCached.some((p) => p.startsWith('/assets/') && p.endsWith('.js'));
  step('cacheContents', {
    hasShell,
    hasJs,
    assetCount: allCached.filter((p) => p.startsWith('/assets/')).length,
  });
  if (!hasShell) out.errors.push('app shell was not cached');
  if (!hasJs) out.errors.push('no JS bundle was cached');

  // 3) Go OFFLINE and reload.
  await page.context().setOffline(true);
  await page.reload();
  let offlineRendered = false;
  try {
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    offlineRendered = true;
  } catch (e) {
    out.errors.push('app did not render while offline');
  }
  step('offlineReload', { rendered: offlineRendered });

  if (offlineRendered) {
    const offlineText = await page.evaluate(() => document.body.innerText);
    step('offlineContent', {
      hasGreeting: /Chào|Xin chào/.test(offlineText),
      hasReadingCard: offlineText.includes('Luyện Đọc'),
      hasCompetitionCard: offlineText.includes('Đấu Trường'),
      hasNextBestAction: /Hôm Nay Bé Nên Học Gì|Bé Nên Làm Gì Tiếp Theo/.test(offlineText),
    });

    // Core learning must still work offline: complete a question's feedback loop.
    await page.getByRole('button', { name: /Tiếng Việt/ }).first().click({ timeout: 12000 });
    await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
    await openFirstLesson(page, { timeout: 12000 });
    await page.waitForSelector('text=Câu hỏi 1', { timeout: 20000 });
    const opt = page.locator('[data-testid=answer-option]').first();
    if (await opt.count()) await opt.click({ timeout: 12000 });
    await page.getByRole('button', { name: /Kiểm tra câu trả lời/ }).click({ timeout: 12000 });
    await page.waitForTimeout(500);
    const feedback = await page.evaluate(() => document.body.innerText);
    step('offlineAnswering', {
      showedFeedback: /Đúng rồi|Đáp án đúng là|Chưa đúng/.test(feedback),
    });
    if (!/Đúng rồi|Đáp án đúng là|Chưa đúng/.test(feedback))
      out.errors.push('answer feedback did not appear while offline');

    await page.getByRole('button', { name: 'Đóng bài học' }).click({ timeout: 12000 }).catch(() => {});
  }

  // 4) Back online — network-first must recover cleanly.
  await page.context().setOffline(false);
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 30000 });
  const onlineAgain = await page.evaluate(() => /Chào|Xin chào/.test(document.body.innerText));
  step('backOnline', { rendered: onlineAgain });
  if (!onlineAgain) out.errors.push('app failed to recover after going back online');

  // 5) §30 — service-worker cache operations must never touch learning data.
  // Learn something, wipe every cache through the worker's own channel, reload,
  // and prove progress survived. If a cache clear ever ate localStorage, this
  // is where it would show up.
  const xpBefore = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}').xp || 0;
    } catch {
      return -1;
    }
  });
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.active) reg.active.postMessage({ type: 'CLEAR_CACHES' });
  });
  await page.waitForTimeout(1500);
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 30000 });
  const survived = await page.evaluate(() => {
    let xp = -1;
    try {
      xp = JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}').xp || 0;
    } catch {}
    return { xp };
  });
  step('cacheWipeSurvival', { xpBefore, xpAfter: survived.xp });
  if (survived.xp !== xpBefore) {
    out.errors.push(`learning data changed across cache wipe+reload (xp ${xpBefore} -> ${survived.xp})`);
  }

  return out;
}
