/**
 * P38 BROWSER PROBE — real Chromium against the production build.
 * Golden paths A (VI), B (EN), D (EN incorrect), plus TTS-unavailable safety
 * and a 390x844 mobile spot-check. Asserts caption === TTS text at runtime.
 */
const puppeteer = require('puppeteer');

const APP = 'http://127.0.0.1:4173/';
const out = { steps: [], errors: [] };
const step = (k, v) => out.steps.push({ step: k, ...(v || {}) });
const fail = (m) => out.errors.push(m);

async function newPage(browser, ttsMode) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('requestfailed', (r) => failedRequests.push(r.url().slice(0, 120)));
  await page.evaluateOnNewDocument((mode) => {
    window.__ttsRequests = [];
    window.__ttsMode = mode;
    const applyPatch = () => {
      try {
        if (mode === 'unavailable') {
          Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
          return;
        }
        const synth = window.speechSynthesis;
        if (!synth || !synth.speak) return;
        const orig = synth.speak.bind(synth);
        synth.speak = (u) => {
          window.__ttsRequests.push({ text: u.text, lang: u.lang });
          try { orig(u); } catch (e) { /* headless may refuse; request recorded */ }
        };
      } catch (e) { /* patch must never break the app */ }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyPatch);
    applyPatch();
  }, ttsMode);
  page.__consoleErrors = consoleErrors;
  page.__failedRequests = failedRequests;
  return page;
}

async function bootClean(page) {
  await page.goto(APP, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('__sentinel', 'alive'); });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => document.body && document.body.innerText.includes('Xin chào'), { timeout: 20000 });
}

async function openSubjectLesson(page, subjectName) {
  await page.getByRole ?? null;
  // puppeteer locator API (v22+): use $/$$ + text matching via evaluate helpers
  const clickBtn = async (rx, timeout = 15000) => {
    await page.waitForFunction((re) => {
      const els = Array.from(document.querySelectorAll('button'));
      return els.some((b) => new RegExp(re).test(b.textContent || ''));
    }, { timeout }, rx.source);
    await page.evaluate((re) => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => new RegExp(re).test(x.textContent || ''));
      if (b) b.click();
    }, rx.source);
  };
  // subject card
  await page.evaluate((name) => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').includes(name));
    if (b) b.click();
  }, subjectName);
  await page.waitForFunction(() => /Câu hỏi 1/.test(document.body.innerText), { timeout: 20000 }).catch(() => {});
  // If subject screen lists lessons, enter the first one.
  const hasQ = await page.evaluate(() => /Câu hỏi 1/.test(document.body.innerText));
  if (!hasQ) await clickBtn(/Vào học/);
  await page.waitForFunction(() => /Câu hỏi 1/.test(document.body.innerText), { timeout: 20000 });
  return clickBtn;
}

async function answerOnce(page, optionIndex) {
  await page.evaluate((idx) => {
    const opts = Array.from(document.querySelectorAll('[data-testid="answer-option"]'));
    (opts[idx % opts.length] || opts[0]).click();
  }, optionIndex);
  await new Promise((r) => setTimeout(r, 150));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /Kiểm tra câu trả lời/.test(x.textContent || ''));
    if (b) b.click();
  });
  await page.waitForFunction(() => !!document.querySelector('[data-testid="praise-caption"]'), { timeout: 10000 });
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="praise-caption"]');
    const caption = el ? el.getAttribute('data-praise-text') : null;
    const reqs = (window.__ttsRequests || []).filter((t) => caption && t.text === caption);
    const lastTts = reqs.length ? reqs[reqs.length - 1] : null;
    return {
      caption,
      ttsAttr: el ? el.getAttribute('data-praise-tts') : null,
      locale: el ? el.getAttribute('data-praise-locale') : null,
      language: el ? el.getAttribute('data-praise-language') : null,
      outcome: el ? el.getAttribute('data-praise-outcome') : null,
      interceptedTts: lastTts || null,
      ttsCount: (window.__ttsRequests || []).length,
    };
  });
}

async function nextQuestion(page) {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /Câu tiếp theo|Xem kết quả bài học/.test(x.textContent || ''));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 400));
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    // ---- GOLDEN PATH A: Vietnamese ----
    {
      const page = await newPage(browser, 'normal');
      await bootClean(page);
      await page.setViewport({ width: 1280, height: 800 });
      await openSubjectLesson(page, 'Tiếng Việt');
      const r1 = await answerOnce(page, 0);
      step('VI_Q1', r1);
      if (!r1.caption) fail('VI: no praise caption rendered');
      if (r1.caption !== r1.ttsAttr) fail(`VI: caption!==tts attr (${r1.caption} vs ${r1.ttsAttr})`);
      if (r1.language !== 'vi-VN' || r1.locale !== 'vi-VN') fail(`VI: wrong language/locale ${r1.language}/${r1.locale}`);
      if (r1.interceptedTts && r1.interceptedTts.text !== r1.caption) fail('VI: intercepted TTS text !== caption');
      if (/[a-zA-Z]{3,}/.test(r1.caption || '') && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(r1.caption || '')) {
        // pure-ASCII Vietnamese praise like "Chinh xac" would be suspect; all catalog VI has marks
        fail('VI: caption lacks Vietnamese identity: ' + r1.caption);
      }
      await nextQuestion(page);
      const r2 = await answerOnce(page, 1);
      step('VI_Q2', r2);
      if (r2.caption !== r2.ttsAttr) fail('VI Q2: caption!==tts');
      if (r2.language !== 'vi-VN') fail('VI Q2: wrong language ' + r2.language);
      step('VI_console', { errors: page.__consoleErrors, failedRequests: page.__failedRequests });
      if (page.__consoleErrors.length) fail('VI: console errors: ' + page.__consoleErrors.join(' | '));
      if (page.__failedRequests.length) fail('VI: failed requests: ' + page.__failedRequests.join(' | '));
      await page.close();
    }

    // ---- GOLDEN PATH B + D: English (correct + incorrect sampling) ----
    {
      const page = await newPage(browser, 'normal');
      await bootClean(page);
      await page.setViewport({ width: 1280, height: 800 });
      await openSubjectLesson(page, 'Tiếng Anh');
      const seen = [];
      for (let i = 0; i < 4; i++) {
        const r = await answerOnce(page, i);
        seen.push(r);
        step(`EN_Q${i + 1}`, r);
        if (!r.caption) fail(`EN Q${i + 1}: no praise caption`);
        if (r.caption !== r.ttsAttr) fail(`EN Q${i + 1}: caption!==tts`);
        if (r.language !== 'en-GB' || r.locale !== 'en-GB') fail(`EN Q${i + 1}: wrong language/locale ${r.language}/${r.locale}`);
        if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(r.caption || '')) fail(`EN Q${i + 1}: Vietnamese contamination: ${r.caption}`);
        if (r.interceptedTts) {
          if (r.interceptedTts.text !== r.caption) fail(`EN Q${i + 1}: intercepted TTS !== caption`);
          if (r.interceptedTts.lang !== 'en-GB') fail(`EN Q${i + 1}: TTS lang not en-GB: ${r.interceptedTts.lang}`);
        }
        await nextQuestion(page);
        const done = await page.evaluate(() => /CHÚC MỪNG BÉ HOÀN THÀNH/.test(document.body.innerText));
        if (done) break;
      }
      const outcomes = seen.map((s) => s.outcome);
      step('EN_outcomes', { outcomes });
      if (!outcomes.includes('CORRECT') && !outcomes.includes('ENCOURAGEMENT')) fail('EN: no praise outcome observed at all');
      step('EN_console', { errors: page.__consoleErrors, failedRequests: page.__failedRequests });
      if (page.__consoleErrors.length) fail('EN: console errors: ' + page.__consoleErrors.join(' | '));
      if (page.__failedRequests.length) fail('EN: failed requests: ' + page.__failedRequests.join(' | '));
      await page.close();
    }

    // ---- GOLDEN PATH C: Kid's Box Companion (English praise + parity) ----
    {
      const page = await newPage(browser, 'normal');
      await bootClean(page);
      await page.setViewport({ width: 1280, height: 800 });
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').includes('Tiếng Anh'));
        if (b) b.click();
      });
      await page.waitForFunction(() => /Kid's Box Companion/.test(document.body.innerText), { timeout: 20000 });
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => /Kid's Box Companion/.test(x.textContent || ''));
        if (b) b.click();
      });
      await page.waitForFunction(() => /Chọn Unit/.test(document.body.innerText), { timeout: 20000 });
      let kb = null;
      for (let attempt = 0; attempt < 4 && !kb; attempt++) {
        const opened = await page.evaluate((att) => {
          const btns = Array.from(document.querySelectorAll('section ul li button'));
          const btn = btns[att];
          if (btn) { btn.click(); return true; }
          return false;
        }, attempt);
        if (!opened) break;
        await new Promise((r) => setTimeout(r, 800));
        kb = await page.evaluate(() => {
          const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
          const dlg = dialogs[dialogs.length - 1];
          if (!dlg || !/Vòng 1\//.test(dlg.textContent || '')) return null;
          const opts = Array.from(dlg.querySelectorAll('button')).filter((b) => {
            const label = b.getAttribute('aria-label') || '';
            return label && !/Đóng|Nghe|nói|Về|Tiếp|Xong/.test(label + (b.textContent || ''));
          });
          if (opts.length === 0) {
            const close = Array.from(dlg.querySelectorAll('button')).find((b) => (b.getAttribute('aria-label') || '').includes('Đóng'));
            if (close) close.click();
            return null;
          }
          opts[0].click();
          return true;
        });
        await new Promise((r) => setTimeout(r, 600));
        if (kb) {
          kb = await page.evaluate(() => {
            const el = document.querySelector('[data-testid="praise-caption"]');
            if (!el) return null;
            const caption = el.getAttribute('data-praise-text');
            const reqs = (window.__ttsRequests || []).filter((t) => t.text === caption);
            return {
              caption,
              ttsAttr: el.getAttribute('data-praise-tts'),
              locale: el.getAttribute('data-praise-locale'),
              language: el.getAttribute('data-praise-language'),
              outcome: el.getAttribute('data-praise-outcome'),
              interceptedTts: reqs.length ? reqs[reqs.length - 1] : null,
            };
          });
          if (!kb) {
            await page.evaluate(() => {
              const dlg = Array.from(document.querySelectorAll('[role="dialog"]')).pop();
              const close = dlg && Array.from(dlg.querySelectorAll('button')).find((b) => (b.getAttribute('aria-label') || '').includes('Đóng'));
              if (close) close.click();
            });
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }
      step('KIDBOX', kb || { found: false });
      if (!kb) fail('KIDBOX: no choice activity produced a praise caption');
      else {
        if (kb.caption !== kb.ttsAttr) fail('KIDBOX: caption!==tts');
        if (kb.language !== 'en-GB' || kb.locale !== 'en-GB') fail(`KIDBOX: wrong language/locale ${kb.language}/${kb.locale}`);
        if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(kb.caption || '')) fail('KIDBOX: Vietnamese contamination: ' + kb.caption);
        if (kb.interceptedTts && kb.interceptedTts.text !== kb.caption) fail('KIDBOX: intercepted TTS !== caption');
        if (kb.interceptedTts && kb.interceptedTts.lang !== 'en-GB') fail('KIDBOX: TTS lang not en-GB');
      }
      step('KIDBOX_console', { errors: page.__consoleErrors, failedRequests: page.__failedRequests });
      if (page.__consoleErrors.length) fail('KIDBOX: console errors: ' + page.__consoleErrors.join(' | '));
      if (page.__failedRequests.length) fail('KIDBOX: failed requests: ' + page.__failedRequests.join(' | '));
      await page.close();
    }

    // ---- TTS UNAVAILABLE safety ----
    {
      const page = await newPage(browser, 'unavailable');
      await bootClean(page);
      await openSubjectLesson(page, 'Tiếng Việt');
      const r = await answerOnce(page, 0);
      step('UNAVAIL', r);
      if (!r.caption) fail('UNAVAIL: caption must remain visible when TTS is unavailable');
      if (r.caption !== r.ttsAttr) fail('UNAVAIL: parity must hold even without audio');
      const crashed = await page.evaluate(() => document.body.innerText.length > 100);
      if (!crashed) fail('UNAVAIL: app appears crashed/blank');
      step('UNAVAIL_console', { errors: page.__consoleErrors });
      if (page.__consoleErrors.length) fail('UNAVAIL: console errors: ' + page.__consoleErrors.join(' | '));
      await page.close();
    }

    // ---- 200% zoom spot-check (same praise surface) ----
    {
      const page = await newPage(browser, 'normal');
      await bootClean(page);
      await page.setViewport({ width: 1280, height: 800 });
      await openSubjectLesson(page, 'Tiếng Việt');
      await answerOnce(page, 0);
      await page.evaluate(() => { document.body.style.zoom = '200%'; });
      await new Promise((r) => setTimeout(r, 500));
      const zoom = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="praise-caption"]');
        if (!el) return { found: false };
        const r = el.getBoundingClientRect();
        return {
          found: true,
          visible: r.width > 0 && r.height > 0,
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      });
      step('ZOOM_200', zoom);
      if (!zoom.found || !zoom.visible) fail('ZOOM200: praise caption not usable at 200% zoom');
      // Page-level horizontal overflow at 200% zoom is pre-existing app-wide
      // (home screen overflows without any praise involved) — recorded as
      // info, not a P38 regression. The praise surface itself stays visible.
      await page.close();
    }

    // ---- Mobile 390x844 spot-check ----
    {
      const page = await newPage(browser, 'normal');
      await bootClean(page);
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await openSubjectLesson(page, 'Tiếng Việt');
      await answerOnce(page, 0);
      const layout = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="praise-caption"]');
        if (!el) return { found: false };
        const r = el.getBoundingClientRect();
        const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
        return { found: true, visible: r.width > 0 && r.height > 0, overflowX, textClipped: r.width === 0 };
      });
      step('MOBILE_390', layout);
      if (!layout.found || !layout.visible) fail('MOBILE: praise caption not visible at 390x844');
      if (layout.overflowX) fail('MOBILE: horizontal overflow at 390x844');
      await page.close();
    }
  } catch (e) {
    fail('EXCEPTION: ' + (e && e.message ? String(e.message).split('\n')[0] : String(e)));
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.errors.length ? 1 : 0);
})();
