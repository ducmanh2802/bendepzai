/**
 * P31 QA — responsive (§23), accessibility basics (§24), reduced motion (§24).
 * Runs against the real production build at six required viewports.
 */

const VIEWPORTS = [
  { name: '360x800 (phone)', width: 360, height: 800 },
  { name: '390x844 (phone)', width: 390, height: 844 },
  { name: '768x1024 (tablet)', width: 768, height: 1024 },
  { name: '1024x768 (tablet landscape)', width: 1024, height: 768 },
  { name: '1280x800 (laptop)', width: 1280, height: 800 },
  { name: '1440x900 (desktop)', width: 1440, height: 900 },
];

export default async function run(page, ui) {
  const out = { viewports: [], a11y: {}, reducedMotion: {}, errors: [] };

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

  // --- Responsive: horizontal overflow + touch target size ---
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(450);

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - doc.clientWidth;

      // Any element sticking out horizontally is a layout bug.
      const offenders = [];
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > doc.clientWidth + 2) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 80),
            text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
            right: Math.round(r.right),
          });
        }
        if (offenders.length >= 5) break;
      }

      // Who actually WIDENS the page: an element whose own content is wider
      // than its box and that does not clip/scroll it. Without this the
      // offender list only shows whoever happens to sit at the right edge.
      const wideSources = [];
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const cs = getComputedStyle(el);
        if (cs.overflowX !== 'visible' || cs.position === 'absolute' || cs.position === 'fixed') continue;
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
          wideSources.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 80),
            text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
            clientWidth: el.clientWidth,
            scrollWidth: el.scrollWidth,
          });
        }
        if (wideSources.length >= 6) break;
      }

      // Interactive targets below 44px on small screens (§23).
      const smallTargets = [];
      for (const el of Array.from(document.querySelectorAll('button, a, input, select'))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 44 || r.width < 44) {
          smallTargets.push({
            text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
        if (smallTargets.length >= 8) break;
      }
      return { overflow, offenders, smallTargets, wideSources };
    });

    out.viewports.push({
      viewport: vp.name,
      horizontalOverflowPx: metrics.overflow,
      overflowingElements: metrics.offenders.length,
      touchTargetsUnder44px: metrics.smallTargets.length,
      examples: metrics.smallTargets.slice(0, 4),
      // T20A — the offending elements themselves, so a bug report can name the
      // component that has to be fixed instead of only "some overflow".
      offenders: metrics.offenders,
      // T20A — and the box whose content is too wide (the real root cause).
      wideSources: metrics.wideSources,
    });
  }

  // --- Accessibility basics (§24) ---
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);

  out.a11y = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const unlabelled = buttons.filter((b) => {
      const name = (b.getAttribute('aria-label') || b.textContent || '').trim();
      return name.length === 0;
    });
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    const unlabelledInputs = inputs.filter((i) => {
      const id = i.getAttribute('id');
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      return !(hasLabel || i.getAttribute('aria-label') || i.closest('label'));
    });
    return {
      langAttr: document.documentElement.lang,
      hasMainLandmark: document.querySelectorAll('main').length,
      hasNavLandmark: document.querySelectorAll('nav').length,
      headingCount: document.querySelectorAll('h1,h2,h3').length,
      unlabelledButtons: unlabelled.length,
      unlabelledInputs: unlabelledInputs.length,
      imgsWithoutAlt: Array.from(document.querySelectorAll('img')).filter(
        (i) => !i.hasAttribute('alt')
      ).length,
    };
  });

  // --- Reduced motion (§24) ---
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.waitForTimeout(500);
  out.reducedMotion = await page.evaluate(() => {
    const el = document.querySelector('.animate-float') || document.querySelector('main *');
    const cs = el ? getComputedStyle(el) : null;
    return {
      heroAnimationDuration: cs ? cs.animationDuration : null,
      heroTransitionDuration: cs ? cs.transitionDuration : null,
      mediaQueryActive: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  await page.emulateMedia({ reducedMotion: null });

  // Report
  for (const v of out.viewports) {
    if (v.horizontalOverflowPx > 2) out.errors.push(`${v.viewport}: horizontal overflow ${v.horizontalOverflowPx}px`);
  }
  if (out.a11y.unlabelledButtons > 0)
    out.errors.push(`${out.a11y.unlabelledButtons} buttons have no accessible name`);
  if (out.a11y.unlabelledInputs > 0)
    out.errors.push(`${out.a11y.unlabelledInputs} form controls have no label`);
  if (!out.reducedMotion.mediaQueryActive)
    out.errors.push('prefers-reduced-motion not honoured');

  return out;
}
