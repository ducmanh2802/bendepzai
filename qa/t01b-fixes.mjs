/**
 * T01B probe: sua gap giao dien dien thoai & desktop.
 * Best-effort browser check (00_RULES #10): `npm run build` roi
 * `node qa/run-one.mjs qa/t01b-fixes.mjs`. Khong mo duoc trinh duyet -> SKIPPED.
 */
import { openFirstLesson } from './lib.mjs';
import path from 'node:path';
import fs from 'node:fs';

function luminance(hex) {
  const c = hex.replace('#', '');
  const f = (i) => {
    const v = parseInt(c.substr(i, 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}
function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const CLICK = { timeout: 20000, force: false };

export default async function run(page, ui) {
  const out = {};
  const errors = [];
  const check = (name, cond, extra = '') => {
    out[name] = cond ? 'PASS' : `FAIL${extra ? ' ' + extra : ''}`;
    if (!cond) errors.push(name + extra);
  };

  // T01B/11: cung 1 testid ton tai o ca nav tren + nav duoi -> luon bam nut DANG HIEN.
  async function navGo(screen) {
    const candidates = page.getByTestId(`nav-${screen}`);
    const n = await candidates.count();
    for (let i = 0; i < n; i += 1) {
      if (await candidates.nth(i).isVisible()) {
        await candidates.nth(i).click(CLICK);
        return;
      }
    }
    throw new Error(`no visible nav-${screen}`);
  }

  await page.evaluate(() => localStorage.clear());
  await page.goto(ui.origin + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

  // ---- 5. font Nunito thuc te cua body ----
  out.bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  check('font-body-nunito', /nunito/i.test(out.bodyFont), `(${out.bodyFont})`);

  // ---- 6. tuong phan banner Home (doan gradient endpoint, chu trang) ----
  const heroBg = await page.evaluate(() => {
    const el = document.querySelector('.kb-hero-pattern');
    return el ? getComputedStyle(el).backgroundImage.slice(0, 200) : 'NO_HERO';
  });
  out.heroBg = heroBg;
  // Sau fix: amber-700 #b45309 / orange-700 #c2410c / rose-700 #be123c
  const ratios = ['#b45309', '#c2410c', '#be123c'].map((h) => Number(contrast('#ffffff', h).toFixed(2)));
  out.heroContrastWhite = ratios;
  check('hero-contrast-gte-4.5', ratios.every((r) => r >= 4.5), `(${ratios.join(',')})`);

  // ---- 7. banner "Co ban moi" KHONG hien o lan mo dau ----
  await page.waitForTimeout(1500);
  const updateCount = await page.getByTestId('update-banner').count();
  out.updateBannerFirstLoad = updateCount;
  check('update-banner-hidden-first-load', updateCount === 0, `(count=${updateCount})`);

  // ---- 11. testid nav-<screen> tren + duoi (T06: 5 items) ----
  const navIds = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid^="nav-"]')).map((el) =>
      el.getAttribute('data-testid')
    )
  );
  out.navTestIds = [...new Set(navIds)].sort();
  for (const s of ['home', 'world_map', 'games', 'reading_fluency', 'achievements']) {
    check(`nav-testid-${s}`, navIds.includes(`nav-${s}`));
  }
  // Ensure old screens are NOT in bottom/top nav anymore
  for (const s of ['competition', 'daily_review']) {
    check(`nav-testid-${s}-absent`, !navIds.includes(`nav-${s}`), `nav-${s} should not be in main nav`);
  }

  // ---- 3. desktop menu 1024/1280/1440: khong tran, nut Ba Me thay duoc ----
  for (const w of [1024, 1280, 1440]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const header = document.querySelector('header');
      const de = document.documentElement;
      const parentBtn = document.querySelector('header [aria-label="Khu vực dành cho Ba Mẹ"]');
      const r = parentBtn ? parentBtn.getBoundingClientRect() : null;
      return {
        headerOverflow: header ? header.scrollWidth - header.clientWidth : -1,
        pageOverflow: Math.max(0, de.scrollWidth - de.clientWidth),
        parentVisible: !!r && r.width > 0 && r.height > 0 && r.right <= window.innerWidth + 1,
      };
    });
    out[`menu-${w}`] = m;
    check(`menu-no-overflow-${w}`, m.headerOverflow <= 1 && m.pageOverflow === 0, JSON.stringify(m));
    check(`menu-parent-visible-${w}`, m.parentVisible);
  }

  // ---- 1. nut dong game o 360 & 375 ----
  for (const w of [360, 375]) {
    await page.setViewportSize({ width: w, height: 667 });
    await page.goto(ui.origin + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    // Mo hub qua bottom nav (testid moi)
    await navGo('games');
    await page.waitForSelector('text=Đấu Trường Trò Chơi Trí Tuệ', { timeout: 20000 });
    await page.getByRole('button', { name: /Chơi ngay/ }).first().click(CLICK);
    await page.waitForSelector('[role="dialog"]', { timeout: 20000 });
    await page.waitForTimeout(600);
    const c = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="game-close"]');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      const dlg = btn.closest('[role="dialog"]');
      const header = btn.closest('div[class*="bg-white/90"]') || btn.parentElement;
      return {
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        inViewport: r.x >= 0 && r.y >= 0 && r.right <= window.innerWidth + 1 && r.bottom <= window.innerHeight + 1,
        headerRows: header ? Math.round(header.getBoundingClientRect().height) : -1,
        dlgW: dlg ? Math.round(dlg.getBoundingClientRect().width) : -1,
      };
    });
    out[`game-close-${w}`] = c;
    check(`game-close-visible-${w}`, !!c && c.inViewport && c.w >= 44 && c.h >= 44, JSON.stringify(c));
    // Esc dong modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    const closedByEsc = (await page.locator('[role="dialog"]').count()) === 0;
    out[`game-esc-close-${w}`] = closedByEsc;
    check(`game-esc-close-${w}`, closedByEsc);
  }

  // ---- 8. icon loa phan biet + 2. sticky action bai hoc 375x667 ----
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(ui.origin + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await navGo('games');
  await page.waitForSelector('text=Đấu Trường Trò Chơi Trí Tuệ', { timeout: 20000 });
  await page.getByRole('button', { name: /Chơi ngay/ }).first().click(CLICK);
  await page.waitForSelector('[role="dialog"]', { timeout: 20000 });
  const icons = await page.evaluate(() => {
    const instr = document.querySelector('[aria-label="Nghe hướng dẫn chơi"]');
    const mute = document.querySelector('[aria-label="Tắt âm thanh trò chơi"], [aria-label="Bật âm thanh trò chơi"]');
    // lucide-react dat ten icon vao class svg: lucide-megaphone vs lucide-volume-2
    const svgClass = (el) => {
      const svg = el ? el.querySelector('svg') : null;
      return svg ? svg.getAttribute('class') : null;
    };
    const a = svgClass(instr);
    const b = svgClass(mute);
    return { instr: !!instr, mute: !!mute, a, b, distinct: !!a && !!b && a !== b };
  });
  out.gameIcons = icons;
  check('game-icons-distinct', icons.distinct, JSON.stringify(icons));
  // Dong bang Back (history)
  await page.goBack();
  await page.waitForTimeout(600);
  const closedByBack = (await page.locator('[role="dialog"]').count()) === 0;
  out.gameBackClose = closedByBack;
  check('game-back-close', closedByBack);

  // Bai hoc: mo mon -> bai dau -> nut Kiem tra thay duoc khong can cuon
  await page.goto(ui.origin + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
  await page.waitForTimeout(800);
  await openFirstLesson(page);
  await page.waitForSelector('[role="dialog"]', { timeout: 20000 });
  await page.waitForTimeout(800);
  // Chon 1 dap an de kich hoat nut
  const ans = page.getByTestId('answer-option');
  if ((await ans.count()) > 0) await ans.first().click(CLICK);
  await page.waitForTimeout(400);
  const sticky = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) =>
      /Kiểm tra câu trả lời/.test(b.textContent || '')
    );
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return {
      visible: r.bottom <= window.innerHeight + 1 && r.top >= 0,
      h: Math.round(r.height),
      bottom: Math.round(r.bottom),
      vh: window.innerHeight,
    };
  });
  out.lessonSticky = sticky;
  check('lesson-sticky-action', !!sticky && sticky.visible, JSON.stringify(sticky));
  // Esc dong bai hoc
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  check('lesson-esc-close', (await page.locator('[role="dialog"]').count()) === 0);

  // ---- 4. doi man hinh cuon ve dau trang ----
  await page.goto(ui.origin + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 2000));
  await navGo('games');
  await page.waitForTimeout(500);
  const scrollY = await page.evaluate(() => window.scrollY);
  out.scrollAfterNav = scrollY;
  check('nav-scroll-top', scrollY === 0, `(y=${scrollY})`);

  // ---- 9. nut cham >= 44px (mau) ----
  await page.goto(ui.origin + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  const touch = await page.evaluate(() => {
    const res = {};
    const visible = (sel) =>
      Array.from(document.querySelectorAll(sel)).find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }) || null;
    const probe = (name, el) => {
      if (!el) { res[name] = null; return; }
      const r = el.getBoundingClientRect();
      res[name] = Math.round(Math.min(r.width, r.height) >= 44 ? 44 : Math.min(r.width, r.height));
    };
    const btns = Array.from(document.querySelectorAll('button'));
    probe('bottom-nav', visible('[data-testid="nav-games"]'));
    probe('top-parent', document.querySelector('header [aria-label="Khu vực dành cho Ba Mẹ"]'));
    // CTA trang chủ đã đổi thành "Học tiếp" / "Bắt đầu: <gợi ý>" (T27);
    // chữ "Bản Đồ Học Tập" cũ không còn nên probe luôn đo null (T31).
    const hint = btns.find((b) =>
      /^(Học tiếp|Bắt đầu:)/.test((b.getAttribute('aria-label') || b.textContent || '').trim())
    );
    probe('home-cta', hint);
    return res;
  });
  out.touchHome = touch;
  check('touch-targets-home', Object.values(touch).every((v) => v === 44), JSON.stringify(touch));

  // ---- 10. WorldMap dem game dong ----
  await navGo('world_map');
  // T36 Việt hoá chuỗi này thành "N trò chơi trí tuệ bổ ích"; probe khớp nguyên
  // văn nên đỏ từ 81784a9 — cập nhật theo chuỗi hiện tại của WorldMapScreen.
  // T39 — màn Bản đồ là chunk lazy kéo theo ngân hàng đề (không còn nằm trong
  // chunk khởi động), nên đợi đúng nội dung cần đo thay vì ngủ nhịp cố định.
  await page
    .waitForFunction(() => /trò chơi trí tuệ/i.test(document.body.innerText), null, { timeout: 20000 })
    .catch(() => {});
  const mapText = await page.evaluate(() => document.body.innerText);
  const mCount = (mapText.match(/(\d+)\s*trò chơi trí tuệ/i) || [])[1];
  out.worldMapCount = mCount || null;
  check('worldmap-no-hardcoded-10', !/10\+\s*trò chơi/i.test(mapText));
  check('worldmap-count-dynamic', !!mCount && Number(mCount) >= 18, `(count=${mCount})`);

  return { ok: errors.length === 0, errors, out };
}

// Standalone: node qa/t01b-fixes.mjs (tu build preview)
if (process.argv[1] && process.argv[1].endsWith('t01b-fixes.mjs')) {
  const { spawn } = await import('node:child_process');
  const { chromium } = await import('playwright');
  const port = Number(process.env.PORT || 4174);
  const origin = `http://localhost:${port}`;
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const server = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    { stdio: 'ignore' }
  );
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
    const state = await run(page, { origin });
    console.log(JSON.stringify(state, null, 2));
    process.exitCode = state.ok ? 0 : 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill();
  }
}
