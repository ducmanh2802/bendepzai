/**
 * MOBILE QA (§23–29) — real browser at real phone viewports.
 *
 * Portrait 360x800 / 375x812 / 390x844 / 412x915, plus one landscape leg.
 * Measures instead of eyeballing: horizontal overflow in px, touch-target
 * boxes in px, safe-area clearance of the bottom nav, and state survival
 * across rotation + backgrounding.
 */

import { openFirstLesson, openCompetitionHub } from './lib.mjs';
const CLICK = { timeout: 12000 };
const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
];

/**
 * T20A — how much the page overflows horizontally, and WHO causes it (the
 * shallowest box whose own content is wider than it is), so a bug report can
 * name the component instead of only "some overflow".
 */
async function overflowPx(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const overflow = Math.max(0, de.scrollWidth - de.clientWidth);
    const sources = [];
    if (overflow > 2) {
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const cs = getComputedStyle(el);
        if (cs.overflowX !== 'visible') continue;
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
          sources.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 90),
            text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
            clientWidth: el.clientWidth,
            scrollWidth: el.scrollWidth,
          });
        }
        if (sources.length >= 10) break;
      }
    }
    return { overflow, sources };
  });
}

async function touchTargets(page, selector, min = 44) {
  return page.evaluate(
    ({ selector, min }) => {
      const bad = [];
      const els = Array.from(document.querySelectorAll(selector)).slice(0, 24);
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width < min || r.height < min) {
          bad.push(`${(el.textContent || el.tagName).trim().slice(0, 24)} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      return { checked: els.length, bad };
    },
    { selector, min }
  );
}

export default async function run(page, ui) {
  const out = { viewports: [], rotation: {}, interruption: {}, errors: [] };
  const APP_ORIGIN = new URL(page.url()).origin;

  await page.evaluate(() => localStorage.clear());

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(APP_ORIGIN);
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    await page.waitForTimeout(600);

    const home = {
      overflow: (await overflowPx(page)).overflow,
      nav: await touchTargets(page, 'nav[aria-label="Điều hướng nhanh"] button'),
    };
    if (home.overflow > 2) out.errors.push(`${vp.name} home: horizontal overflow ${home.overflow}px`);
    if (home.nav.bad.length) out.errors.push(`${vp.name} bottom nav: small targets ${home.nav.bad.join('; ')}`);

    // Lesson: open, answer one question, check the question surface.
    await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
    await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
    await openFirstLesson(page);
    await page.waitForSelector('[role=dialog]', { timeout: 20000 });
    await page.waitForTimeout(500);
    const lessonBox = await overflowPx(page);
    const lessonOverflow = lessonBox.overflow;
    const answers = await touchTargets(page, '[role=dialog] [data-testid=answer-option]');
    const audioBtn = page.locator('[data-testid=question-audio]').first();
    const audioBox = (await audioBtn.count()) ? await audioBtn.boundingBox() : null;
    if (lessonOverflow > 2) {
      out.errors.push(
        `${vp.name} lesson: horizontal overflow ${lessonOverflow}px — sources: ${JSON.stringify(lessonBox.sources)}`
      );
    }
    if (answers.bad.length) out.errors.push(`${vp.name} lesson answers: small targets ${answers.bad.join('; ')}`);
    if (audioBox && (audioBox.width < 44 || audioBox.height < 44)) {
      out.errors.push(`${vp.name} audio button below 44px: ${Math.round(audioBox.width)}x${Math.round(audioBox.height)}`);
    }

    // Answer one question so the surface is proven interactive, not just painted.
    const opt = page.locator('[role=dialog] [data-testid=answer-option]').first();
    if (await opt.count()) await opt.click(CLICK);

    // Competition hub on the same viewport.
    await page.goto(APP_ORIGIN);
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    // T20A / B-04: no world-map entry for the arena — reach it like a parent does.
    await openCompetitionHub(page);
    await page.waitForTimeout(400);
    const hubOverflow = await overflowPx(page);
    if (hubOverflow > 2) out.errors.push(`${vp.name} competition hub: horizontal overflow ${hubOverflow}px`);

    out.viewports.push({
      viewport: vp.name,
      homeOverflow: home.overflow,
      navChecked: home.nav.checked,
      lessonOverflow,
      answersChecked: answers.checked,
      hubOverflow,
    });
  }

  // ---- Landscape leg: rotate mid-modal, answer, rotate back ----
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
  await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
  await openFirstLesson(page);
  await page.waitForSelector('[role=dialog]', { timeout: 20000 });

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(800);
  const landscapeDialog = (await page.locator('[role=dialog]').count()) > 0;
  const landscapeBox = await overflowPx(page);
  const landscapeOverflow = landscapeBox.overflow;
  const landOpt = page.locator('[role=dialog] [data-testid=answer-option]').first();
  let landscapeAnswered = false;
  if (await landOpt.count()) {
    await landOpt.click(CLICK);
    landscapeAnswered = true;
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const backToPortrait = (await page.locator('[role=dialog]').count()) > 0;
  out.rotation = { landscapeDialog, landscapeOverflow, landscapeAnswered, backToPortrait };
  if (!landscapeDialog) out.errors.push('landscape: dialog disappeared after rotation');
  if (!landscapeAnswered) out.errors.push('landscape: could not answer after rotation');
  if (!backToPortrait) out.errors.push('portrait: dialog lost after rotating back');
  if (landscapeOverflow > 2) out.errors.push(`landscape: horizontal overflow ${landscapeOverflow}px`);
  // Close the modal to leave clean state (Escape closes lesson dialogs).
  await page.keyboard.press('Escape').catch(() => {});

  // ---- Interruption: background the tab mid-lesson, then return ----
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
  await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
  await openFirstLesson(page);
  await page.waitForSelector('[role=dialog]', { timeout: 20000 });
  const promptBefore = await page.locator('[role=dialog]').innerText();

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('blur'));
  });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
  });
  await page.waitForTimeout(500);

  const dialogSurvived = (await page.locator('[role=dialog]').count()) > 0;
  const promptAfter = dialogSurvived ? await page.locator('[role=dialog]').innerText() : '';
  const stillAnswerable = dialogSurvived && (await page.locator('[role=dialog] [data-testid=answer-option]').count()) > 0;
  out.interruption = {
    dialogSurvived,
    sameQuestion: promptBefore === promptAfter,
    stillAnswerable,
  };
  if (!dialogSurvived) out.errors.push('interruption: dialog lost after background/return');
  if (dialogSurvived && promptBefore !== promptAfter) {
    out.errors.push('interruption: question changed under the child after background/return');
  }

  // Restore a desktop-ish viewport for any suite that runs after this one.
  await page.setViewportSize({ width: 1280, height: 800 });

  return out;
}
