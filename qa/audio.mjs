/**
 * AUDIO QA (§21) — real browser, real SpeechSynthesis.
 *
 * Proves, instead of asserting from source:
 *   1. the question-audio button exposes a truthful state (IDLE/PLAYING/
 *      PLAYED/UNAVAILABLE) and moves when pressed;
 *   2. pressing twice does not stack uncontrolled utterances;
 *   3. questionAutoplay=OFF genuinely silences the automatic read;
 *   4. nothing crashes when the platform has no voices (headless Chromium
 *      usually has none — that path is the AUDIO_UNAVAILABLE evidence).
 */

import { openFirstLesson, openCompetitionHub } from './lib.mjs';
const CLICK = { timeout: 12000 };

export default async function run(page, ui) {
  const out = { steps: [], errors: [] };
  try {
    await body(page, ui, out);
  } catch (e) {
    const msg = e && e.message ? String(e.message).split('\n')[0] : String(e);
    out.errors.push('EXCEPTION: ' + msg);
    out.failedAt = out.steps.length ? out.steps[out.steps.length - 1].step : 'start';
  }
  return out;
}

async function body(page, ui, out) {
  const step = (k, v) => out.steps.push({ step: k, ...v });
  const APP_ORIGIN = new URL(page.url()).origin;

  const synth = () =>
    page.evaluate(() => ({
      present: 'speechSynthesis' in window,
      voices: (() => {
        try {
          return window.speechSynthesis.getVoices().length;
        } catch {
          return -1;
        }
      })(),
      speaking: (() => {
        try {
          return window.speechSynthesis.speaking;
        } catch {
          return null;
        }
      })(),
      pending: (() => {
        try {
          return window.speechSynthesis.pending;
        } catch {
          return null;
        }
      })(),
    }));

  await page.evaluate(() => localStorage.clear());
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

  step('synthesis', await synth());

  // ---- 1) Lesson question audio button ----
  await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
  await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
  await openFirstLesson(page);
  await page.waitForSelector('[role=dialog]', { timeout: 20000 });
  await page.waitForTimeout(1500); // let the (default-ON) autoplay settle

  const audioBtn = page.locator('[data-testid=question-audio]').first();
  if (!(await audioBtn.count())) {
    out.errors.push('lesson has no [data-testid=question-audio] button');
  } else {
    const initial = await audioBtn.getAttribute('data-audio-state');
    const initialLabel = await audioBtn.getAttribute('aria-label');
    step('questionAudioInitial', { state: initial, label: initialLabel });

    if (!['idle', 'playing', 'played', 'unavailable'].includes(initial || '')) {
      out.errors.push(`question audio has unknown state: ${initial}`);
    }
    if (!(initialLabel || '').trim()) {
      out.errors.push('question audio button has no accessible label');
    }

    // Press twice in a row: must not crash, must not stack the queue.
    await audioBtn.click(CLICK);
    await page.waitForTimeout(400);
    const afterFirst = await audioBtn.getAttribute('data-audio-state');
    await audioBtn.click(CLICK);
    await page.waitForTimeout(800);
    const afterSecond = await audioBtn.getAttribute('data-audio-state');
    const queue = await synth();
    step('questionAudioPressed', { afterFirst, afterSecond, queue });

    if (queue.pending !== null && queue.pending > 1) {
      out.errors.push(`utterances stacked in the queue (pending=${queue.pending})`);
    }
    if (!['idle', 'playing', 'played', 'unavailable'].includes(afterSecond || '')) {
      out.errors.push(`question audio ended in unknown state: ${afterSecond}`);
    }
    // Pressing an UNAVAILABLE button must be a safe no-op, not a crash.
    if (afterSecond === 'unavailable' && initial === 'unavailable') {
      step('audioUnavailable', { truthful: true });
    }
  }

  // ---- 2) Autoplay OFF is honoured ----
  await page.keyboard.press('Escape').catch(() => {});
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('kho_bau_parent_settings') || '{}');
    s.questionAutoplay = false;
    localStorage.setItem('kho_bau_parent_settings', JSON.stringify(s));
    try {
      window.speechSynthesis.cancel();
    } catch {}
  });
  await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
  await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
  await openFirstLesson(page);
  await page.waitForSelector('[role=dialog]', { timeout: 20000 });
  // The old code auto-spoke 300ms after every question; with the setting off
  // the synthesiser must stay untouched well past that window.
  await page.waitForTimeout(2500);
  const quiet = await synth();
  step('autoplayOff', quiet);
  if (quiet.speaking === true || (quiet.pending !== null && quiet.pending > 0)) {
    out.errors.push('questionAutoplay=OFF but the synthesiser is active — auto-play leaked');
  }

  // ---- 3) Reading passage audio ----
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  const readingNav = page.locator('[data-testid="nav-reading_fluency"]:visible');
  if (await readingNav.count()) {
    await readingNav.first().click(CLICK);
    await page.waitForSelector('text=Thang Luyện Đọc Của Bé', { timeout: 20000 });
    // Start the first available stage/session to reach a passage.
    const startBtn = page.getByRole('button', { name: /Bắt đầu luyện|Luyện lại bước này/ }).first();
    if (await startBtn.count()) {
      await startBtn.click(CLICK);
      await page.waitForTimeout(1500);
    }
    const passageBtn = page.locator('[data-testid=passage-audio]').first();
    if (await passageBtn.count()) {
      const before = await passageBtn.getAttribute('data-audio-state');
      await passageBtn.click(CLICK);
      await page.waitForTimeout(800);
      const after = await passageBtn.getAttribute('data-audio-state');
      step('passageAudio', { before, after });
      if (!['idle', 'playing', 'played', 'unavailable'].includes(after || '')) {
        out.errors.push(`passage audio ended in unknown state: ${after}`);
      }
    } else {
      step('passageAudio', { skipped: 'no passage button on this screen state' });
    }
  } else {
    step('passageAudio', { skipped: 'reading nav not found' });
  }

  // ---- 3b) Phép tính `+ - =` phải ĐỌC THÀNH LỜI (T24) ----
  // Kí hiệu toán học nằm trong văn bản đề thi ("Tính: 6 + 4 = ?"); giọng tiếng
  // Việt của nền tảng bỏ qua `+ - =` nên bé chỉ nghe "sáu bốn". Lớp toSpeechText
  // nối lời NGAY TRƯỚC utterance. Bằng chứng ở đây là văn bản thật sự được đưa
  // vào SpeechSynthesisUtterance — không phải văn bản hiển thị.
  await page.addInitScript(() => {
    window.__spokenTexts = [];
    const Real = window.SpeechSynthesisUtterance;
    if (!Real) return;
    function Recording(text, ...rest) {
      const u = new Real(text, ...rest);
      window.__spokenTexts.push(String(u.text));
      return u;
    }
    Recording.prototype = Real.prototype;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: Recording,
      configurable: true,
      writable: true,
    });
  });

  const SYMBOLIC = /[0-9]\s*[+\-−=]\s*[0-9]/;
  const WORDS = /(cộng|trừ|bằng|plus|minus|equals)/;
  // Văn bản giao cho utterance KHÔNG còn được chứa ký hiệu thô. `+`/`=`/`−` không
  // bao giờ là nội dung hợp lệ của một câu đọc; dấu `-` ASCII chỉ phạm lỗi khi làm
  // phép trừ giữa hai chữ số NGOÀI dãy ngoặc vuông — trong "[1 - 3 - 5]" nó là phân
  // cách dãy và app cố ý giữ nguyên (xem src/services/speechText.ts).
  const RAW_HARD = /[+=−]/;
  const RAW_MINUS = /\d\s*-\s*\d/;
  const outsideBrackets = (s) => s.replace(/\[[^\]]*\]/g, ' ');
  let symbolicSeen = 0;
  let symbolicSpoken = 0;
  const rawSpoken = [];
  const spokenSamples = [];

  // Hub Đấu Trường lọc theo môn, và các câu Toán ký hiệu chỉ hiện sau bộ lọc
  // "Môn Toán"/"Tiếng Anh" — đi hết môn mới chắc là phần đọc này được chạy thật.
  const SUBJECT_FILTERS = ['Môn Toán', 'Môn Tiếng Việt', 'Tiếng Anh'];
  let examsWalked = 0;

  outer: for (const subject of SUBJECT_FILTERS) {
    for (let e = 0; e < 2; e += 1) {
      await page.goto(APP_ORIGIN + '/');
      await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
      await openCompetitionHub(page);
      const filter = page.getByRole('button', { name: subject }).first();
      if (await filter.count()) {
        await filter.click(CLICK).catch(() => {});
        await page.waitForTimeout(250);
      }
      const starts = page.getByRole('button', { name: /Vào Thi Thử/ });
      if (e >= (await starts.count())) break;
      await starts.nth(e).click(CLICK);
      await page.waitForSelector('role=dialog', { timeout: 20000 });
      await page.waitForTimeout(700);
      examsWalked += 1;

      for (let q = 0; q < 12; q += 1) {
        const btn = page.locator('[data-testid=question-audio]').first();
        if (!(await btn.count())) break;
        await btn.click(CLICK).catch(() => {});
        await page.waitForTimeout(120);
        // Đọc SAU khi bấm: data-last-spoken chỉ được ghi khi nút được bấm.
        const canonical = (await btn.getAttribute('data-last-spoken')) || '';
        if (SYMBOLIC.test(canonical)) {
          symbolicSeen += 1;
          const spoken = await page.evaluate(() => {
            const list = window.__spokenTexts || [];
            return list.length ? String(list[list.length - 1]) : '';
          });
          const bare = outsideBrackets(spoken);
          if (RAW_HARD.test(spoken) || RAW_MINUS.test(bare) || !WORDS.test(spoken)) {
            rawSpoken.push({ canonical, spoken });
          } else {
            symbolicSpoken += 1;
            if (spokenSamples.length < 4) spokenSamples.push({ de: canonical, doc: spoken });
          }
        }
        const next = page.getByRole('button', { name: /^Câu tiếp$/ });
        if (await next.count()) {
          await next.click(CLICK).catch(() => {});
          await page.waitForTimeout(150);
          continue;
        }
        break;
      }
      if (symbolicSeen >= 8) break outer;
    }
  }

  step('mathOperatorsSpoken', { examsWalked, symbolicSeen, symbolicSpoken, rawSpoken, spokenSamples });
  if (symbolicSeen === 0) {
    out.errors.push('không gặp câu nào có ký hiệu + - = trong đề thi — probe không còn chạy được phần sửa lỗi T24');
  }
  for (const bad of rawSpoken) {
    out.errors.push(`đề "${bad.canonical}" vẫn được đọc nguyên ký hiệu: "${bad.spoken}"`);
  }

  // ---- 4) Voiceless device: the UNAVAILABLE branch, observed live ----
  // A platform without Web Speech must produce a truthful button, never a
  // crash and never a fake "played". The init script shadows the API before
  // any app code runs — the same legitimacy as offline simulation: the app
  // path is real, only the platform capability differs. Runs last: the shadow
  // persists for later navigations in this context.
  await page.addInitScript(() => {
    try {
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        configurable: true,
      });
    } catch {}
  });
  await page.goto(APP_ORIGIN);
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  const voiceless = await page.evaluate(() => ({
    apiType: typeof window.speechSynthesis,
  }));
  step('voicelessPlatform', voiceless);

  await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
  await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
  await openFirstLesson(page);
  await page.waitForSelector('[role=dialog]', { timeout: 20000 });
  await page.waitForTimeout(1200); // past the autoplay window — must stay silent

  const vlBtn = page.locator('[data-testid=question-audio]').first();
  if (!(await vlBtn.count())) {
    out.errors.push('voiceless: question audio button missing');
  } else {
    const vlState = await vlBtn.getAttribute('data-audio-state');
    const vlLabel = await vlBtn.getAttribute('aria-label');
    step('voicelessButton', { state: vlState, label: vlLabel });
    if (vlState !== 'unavailable') {
      out.errors.push(`voiceless: button claims "${vlState}" instead of unavailable`);
    }
    if (!(vlLabel || '').trim()) {
      out.errors.push('voiceless: unavailable button has no accessible label');
    }
    // Pressing it must be a safe no-op, not a crash and not a fake "played".
    await vlBtn.click(CLICK);
    await page.waitForTimeout(500);
    const afterPress = await vlBtn.getAttribute('data-audio-state');
    step('voicelessPressed', { state: afterPress });
    if (afterPress !== 'unavailable') {
      out.errors.push(`voiceless: press moved state to "${afterPress}" — fake playback`);
    }
    const stillAlive = await page.locator('[role=dialog]').count();
    if (!stillAlive) out.errors.push('voiceless: dialog died after pressing the audio button');
  }

  return out;
}
