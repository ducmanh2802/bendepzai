/**
 * P41 — VISUAL / FONT VERIFICATION PROBE (§2, §5).
 *
 * Runs against the PRODUCTION build in real Chromium and produces screenshots.
 * It answers the questions a string-level test cannot:
 *   - Do math expressions (`3 + 2 = ?`, `<`, `>`, `=`) render (no mojibake,
 *     no U+FFFD) on the Math screen?
 *   - Is the self-hosted Nunito actually the IN-USE font (with Vietnamese
 *     glyphs loaded), not a fallback?
 *   - Does anything overflow horizontally at 375×667?
 *   - Do the correct-answer and wrong-answer feedback flows render?
 *   - Does an image-choice question in a Vietnamese lesson show its emoji?
 *
 * Screenshots land in P41_SHOTS (default: temp dir). Exactly one probe run,
 * no fabrication: every asserted fact is measured from the live DOM.
 */

import { openFirstLesson } from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SHOTS =
  process.env.P41_SHOTS || path.join(os.tmpdir(), 'opencode', 'p41', 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const state = { ok: false, steps: [], errors: [], screenshots: [] };
const log = (name, detail = {}) => state.steps.push({ step: name, ...detail });
const fail = (msg) => state.errors.push(msg);

const CLICK = { timeout: 12000 };

/** Same detector as tests/p41-font-encoding.test.ts + contentValidator.ts. */
const MOJIBAKE_RE =
  /[\uFFFD\u00C4-\u00C6\u00D0\u00D1\u00D8\u00DE\u00DF\u20AC]|[\u00C2\u00C3\u00BB][\u0080-\u00BF\u2018-\u201F\u2020-\u2027\u2122\u02C6\u02DC\u2039\u203A]|[\u00A1\u00A6\u00A8\u00A9\u00AA\u00AC\u00AE\u00AF\u00B2\u00B3\u00B9\u00BA\u00BC\u00BD\u00BE\u00BF]/u;

async function shot(page, name) {
  const file = path.join(SHOTS, name);
  await page.screenshot({ path: file });
  state.screenshots.push(file);
  return file;
}

async function auditViewport(page, label) {
  await page.evaluate(() => document.fonts.ready);
  const result = await page.evaluate((patternSource) => {
    const re = new RegExp(patternSource, 'u');
    const text = document.body.innerText;
    const badLines = text
      .split('\n')
      .filter((l) => re.test(l))
      .slice(0, 5);
    const doc = document.documentElement;
    const main = document.querySelector('main') || document.body;
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      overflowPx: Math.max(0, doc.scrollWidth - window.innerWidth),
      bodyFont: getComputedStyle(main).fontFamily,
      vnGlyphsLoaded: document.fonts.check('700 20px "Nunito"', 'Ăâđêôơư ạ ế ỗ ỹ'),
      nunitoFaces: [...document.fonts]
        .filter((f) => /Nunito|Comfortaa/.test(f.family))
        .map((f) => `${f.family}:${f.status}`),
      mojibakeLines: badLines,
      replacementChars: (text.match(/\uFFFD/g) || []).length,
    };
  }, MOJIBAKE_RE.source);

  log(`audit:${label}`, result);
  if (result.mojibakeLines.length > 0) {
    fail(`[${label}] mojibake on screen: ${result.mojibakeLines.join(' | ').slice(0, 200)}`);
  }
  if (result.replacementChars > 0) fail(`[${label}] U+FFFD shown on screen`);
  if (result.overflowPx > 1) fail(`[${label}] horizontal overflow ${result.overflowPx}px`);
  if (!/Nunito/.test(result.bodyFont)) fail(`[${label}] Nunito not in body font stack: ${result.bodyFont}`);
  if (!result.vnGlyphsLoaded) fail(`[${label}] Vietnamese glyphs not loaded for Nunito`);
  return result;
}

/** Parent gate → unlock all lessons (real UI path), so the Math topic with
 *  `+` expressions is reachable in a clean profile. */
async function unlockAllLessonsViaParentGate(page) {
  await page.locator('[aria-label="Khu vực dành cho Ba Mẹ"]:visible').first().click(CLICK);
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 12000 });
  const gateText = await dialog.innerText();
  const m = gateText.match(/(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
  if (!m) throw new Error('parent gate equation not found');
  const answer = String(Number(m[1]) + Number(m[2]));
  await dialog.locator('input[type="number"]').fill(answer);
  await dialog.getByRole('button', { name: /Mở Bảng Phụ Huynh/ }).click(CLICK);
  await dialog.getByRole('button', { name: /Cài Đặt & Thời Gian/ }).click(CLICK);
  const toggle = dialog.locator('[data-testid="unlock-all-lessons-toggle"]');
  await toggle.waitFor({ state: 'visible', timeout: 12000 });
  const label = (await toggle.innerText()).trim();
  if (label === 'Tắt') await toggle.click(CLICK);
  await page.locator('[role="dialog"] button').first().click(CLICK); // X close
  log('unlockAllLessons', { gateAnswer: answer, toggleWas: label });
}

/** Walk the current lesson answering questions; captures feedback states. */
async function walkLesson(page, { maxQuestions, wantExpression, label }) {
  const found = {
    questions: 0,
    expressions: [],
    correctFeedback: false,
    wrongFeedback: false,
    imageChoiceSeen: false,
    imageChoiceHasEmoji: false,
    retryButtonSeen: false,
    retryWorks: false,
  };
  for (let i = 0; i < maxQuestions; i += 1) {
    const checkBtn = page.getByRole('button', { name: /Kiểm tra câu trả lời/ });
    if (!(await checkBtn.count())) break;
    found.questions += 1;

    const bodyText = await page.evaluate(() => document.body.innerText);

    if (wantExpression) {
      const exprs = bodyText.match(/\d+\s*[+\-−]\s*\d+/g) || [];
      for (const e of exprs) if (!found.expressions.includes(e)) found.expressions.push(e);
    }

    // Image-choice audit (Vietnamese pass): the option cards must show their
    // picture (emoji) somewhere inside the button.
    if (await page.locator('[data-testid="image-choice-question"]').count()) {
      found.imageChoiceSeen = true;
      if (!found.imageChoiceHasEmoji) {
        await page.waitForTimeout(350);
        await shot(page, `${label}-image-choice.png`);
        const audit = await page.evaluate(() => {
          const buttons = [...document.querySelectorAll('[data-testid="image-choice-question"] [data-testid="answer-option"]')];
          const emojiRe = /\p{Extended_Pictographic}/u;
          return {
            options: buttons.length,
            anyOptionHasEmoji: buttons.some((b) => emojiRe.test(b.textContent || '')),
            leadingSpanIsEmoji: buttons.every((b) => {
              const span = b.querySelector('span');
              return !!span && emojiRe.test(span.textContent || '');
            }),
            sample: buttons.slice(0, 2).map((b) => (b.textContent || '').trim().slice(0, 30)),
          };
        });
        found.imageChoiceHasEmoji = audit.anyOptionHasEmoji;
        log(`${label}-imageChoiceAudit`, audit);
      }
    }

    // Alternate first/second option so a correct and a wrong flow are both seen.
    const options = page.locator('[data-testid=answer-option]');
    const count = await options.count();
    if (count === 0) break;
    await options.nth(i % 2 === 0 ? 0 : 1).click(CLICK);
    await checkBtn.click(CLICK);
    const status = page.locator('[role=status]');
    await status.waitFor({ state: 'visible', timeout: 8000 });
    const cls = (await status.getAttribute('class')) || '';
    const isCorrect = cls.includes('bg-emerald-100');
    if (isCorrect && !found.correctFeedback) {
      found.correctFeedback = true;
      await shot(page, `${label}-feedback-correct.png`);
    }
    if (!isCorrect && !found.wrongFeedback) {
      found.wrongFeedback = true;
      await shot(page, `${label}-feedback-wrong.png`);

      // PHẦN 5 — "Làm lại": a wrong answer must offer "Thử lại câu này" and the
      // retry must actually reset the question (status gone, submit back).
      const retry = page.getByRole('button', { name: /Thử lại câu này/ });
      found.retryButtonSeen = (await retry.count()) > 0;
      if (found.retryButtonSeen) {
        await retry.first().click(CLICK);
        await page.waitForTimeout(250);
        const statusGone = (await page.locator('[role=status]').count()) === 0;
        const submitBack =
          (await page.getByRole('button', { name: /Kiểm tra câu trả lời/ }).count()) > 0;
        found.retryWorks = statusGone && submitBack;
        if (!found.retryWorks) fail(`[${label}] retry did not reset the question`);
        await page.locator('[data-testid=answer-option]').first().click(CLICK);
        await page.getByRole('button', { name: /Kiểm tra câu trả lời/ }).click(CLICK);
        await status.waitFor({ state: 'visible', timeout: 8000 });
      }
    }

    const next = page.getByRole('button', { name: /Câu tiếp theo|Xem kết quả bài học/ });
    if (await next.count()) await next.first().click(CLICK);
    await page.waitForTimeout(150);
    // T20B contract: the player auto-closes after the last question.
    if (!(await page.getByRole('button', { name: /Kiểm tra câu trả lời/ }).count())) break;
  }
  return found;
}

export default async function run(page, ui) {
  try {
    const origin = new URL(page.url()).origin;

    page.on('pageerror', (e) => fail('PAGEERROR: ' + String(e.message).split('\n')[0]));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (/font|favicon|net::ERR|Failed to load resource|manifest/i.test(text)) return;
      fail('CONSOLE_ERROR: ' + text.slice(0, 200));
    });

    // ---- Clean boot at 375×667 (primary mobile check) ----------------------
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(origin + '/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    await page.waitForTimeout(400); // let font-display: swap settle
    log('boot', { ok: true });
    await auditViewport(page, 'home-375');

    // ---- Parent gate → unlock all lessons → open "Cộng thêm quả ngọt" ------
    await unlockAllLessonsViaParentGate(page);

    await page.getByRole('button', { name: /Toán Học/ }).first().click(CLICK);
    await page.waitForSelector('text=Thành Phố Toán Học Lớp 1', { timeout: 20000 });
    const lessonBtn = page.locator('[data-testid^="lesson-button-"][aria-label*="Cộng thêm quả ngọt"]');
    if (!(await lessonBtn.count())) {
      fail('math lesson "Cộng thêm quả ngọt" not found after unlock');
      throw new Error('math lesson missing');
    }
    await lessonBtn.first().focus();
    await page.keyboard.press('Enter');
    const startBtn = page.getByRole('button', { name: /Bắt đầu/ }).first();
    if (await startBtn.count()) await startBtn.click(CLICK);
    await page.waitForSelector('text=Câu hỏi 1', { timeout: 20000 });
    log('mathLessonOpened', { ok: true });
    await page.waitForTimeout(700); // let intro animations settle before capture

    // First question at 375: screenshot + audit (math symbols on screen).
    await auditViewport(page, 'math-q1-375');
    await shot(page, 'math-q1-375.png');

    // Desktop rendering of the same question.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(250);
    const desktopAudit = await auditViewport(page, 'math-q1-desktop');
    await shot(page, 'math-q1-desktop.png');

    // P41 §4C — the 390×844 phone size must also be overflow-free.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    await auditViewport(page, 'math-q1-390');
    await shot(page, 'math-q1-390.png');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200);

    // Answer through the lesson (mix of correct/wrong) recording expressions.
    const math = await walkLesson(page, {
      maxQuestions: 12,
      wantExpression: true,
      label: 'math',
    });
    log('mathLessonWalk', math);
    if (math.questions === 0) fail('math lesson: no questions answered');
    if (math.expressions.length === 0) fail('math lesson: no arithmetic expression rendered');
    if (!math.correctFeedback) fail('math lesson: no correct feedback state captured');
    if (!math.wrongFeedback) fail('math lesson: no wrong feedback state captured');
    if (!math.retryButtonSeen) fail('math lesson: retry button missing on a wrong answer');
    if (math.retryButtonSeen && !math.retryWorks) fail('math lesson: retry did not reset the question');
    if (math.expressions.length && !desktopAudit.mojibakeLines.length) {
      log('mathExpressionsRendered', math.expressions.slice(0, 6));
    }

    // Progress must survive leaving the lesson (PHẦN 4B evidence), then a
    // reload resets the UX surface without losing the saved lesson state.
    const persisted = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}')
    );
    log('mathProgressPersisted', {
      completedLessons: (persisted.completedLessons || []).length,
      xp: persisted.xp ?? 0,
    });
    if (!(persisted.completedLessons || []).length) {
      fail('math progress not persisted to the child profile after the lesson');
    }
    await page.reload();
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

    // ---- Vietnamese lesson quick pass at 375 (diacritics + image-choice) ---
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator('[data-testid="nav-home"]:visible').first().click(CLICK);
    await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
    await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
    await openFirstLesson(page);
    await page.waitForSelector('text=Câu hỏi 1', { timeout: 20000 });
    await page.waitForTimeout(700); // settle intro animation before capture
    await auditViewport(page, 'viet-q1-375');
    await shot(page, 'viet-q1-375.png');
    const viet = await walkLesson(page, {
      maxQuestions: 8,
      wantExpression: false,
      label: 'viet',
    });
    log('vietLessonWalk', viet);
    if (viet.questions === 0) fail('vietnamese lesson: no questions answered');
    if (viet.imageChoiceSeen && !viet.imageChoiceHasEmoji) {
      fail('image-choice option rendered without its emoji');
    }

    state.ok = state.errors.length === 0;
  } catch (e) {
    state.errors.push('EXCEPTION: ' + (e && e.message ? String(e.message).split('\n')[0] : String(e)));
  }
  return state;
}
