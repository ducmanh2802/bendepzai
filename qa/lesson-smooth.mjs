// T29 — bằng chứng nhìn thấy được cho "cảm giác học tập mượt".
// Trên bản build thật 390×844, mở bài Tiếng Việt đầu tiên và đo:
//   1. Thanh "Kiểm tra"/"Câu tiếp theo" có nằm ngoài vùng cuộn không (phải luôn thấy).
//   2. Sang câu mới thì vùng câu hỏi phải cuộn về đầu, không giữ vị trí câu trước.
//   3. Dải combo hiện ra không được đẩy nội dung câu hỏi xuống (nhảy bố cục).
//   4. Phản hồi đúng/sai phải nằm trong tầm nhìn sau khi bấm kiểm tra.
// Chạy: npm run build && node qa/run-one.mjs qa/lesson-smooth.mjs
import fs from 'node:fs';
import path from 'node:path';
import { waitForAppShell, openFirstLesson, dismissLevelUpCelebration } from './lib.mjs';

const OUT = path.resolve(process.env.TEMP || process.env.TMP || '.', 'shots-t29');
fs.mkdirSync(OUT, { recursive: true });

export default async function run(page) {
  const out = { errors: [], shots: [], facts: {}, steps: [] };
  const CLICK = { timeout: 15000 };

  const shot = async (name) => {
    const file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file, fullPage: false });
    out.shots.push(file);
  };
  const step = (name, detail) => out.steps.push({ step: name, ...detail });

  // Đo vị trí thanh hành động / vùng cuộn / câu hỏi trong khung hội thoại.
  const inspect = () =>
    page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { error: 'no-dialog' };
      const wanted = ['Kiểm tra câu trả lời', 'Câu tiếp theo', 'Xem kết quả bài học', 'Thử lại câu này'];
      const btn =
        Array.from(dialog.querySelectorAll('button')).find((b) =>
          wanted.some((t) => (b.textContent || '').includes(t))
        ) || null;
      const input = dialog.querySelector('[data-testid="question-input"]');
      let scroller = null;
      for (let el = input && input.parentElement; el && el !== dialog; el = el.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
          scroller = el;
          break;
        }
      }
      const dr = dialog.getBoundingClientRect();
      const br = btn ? btn.getBoundingClientRect() : null;
      const sr = scroller ? scroller.getBoundingClientRect() : null;
      const h4 = dialog.querySelector('h4');
      const hr = h4 ? h4.getBoundingClientRect() : null;
      const status = dialog.querySelector('[role="status"]');
      const str = status ? status.getBoundingClientRect() : null;
      const slot = dialog.querySelector('[data-testid="lesson-combo-slot"]');
      const slotr = slot ? slot.getBoundingClientRect() : null;
      return {
        scrollerFound: !!scroller,
        scrollerTop: sr ? Math.round(sr.top) : -1,
        scrollHeight: scroller ? Math.round(scroller.scrollHeight) : 0,
        clientHeight: scroller ? Math.round(scroller.clientHeight) : 0,
        scrollTop: scroller ? Math.round(scroller.scrollTop) : 0,
        barInsideScroller: !!(scroller && btn && scroller.contains(btn)),
        barTop: br ? Math.round(br.top) : -1,
        barBottom: br ? Math.round(br.bottom) : -1,
        dialogTop: Math.round(dr.top),
        dialogBottom: Math.round(dr.bottom),
        barVisible: !!(br && dr && br.top >= dr.top - 1 && br.bottom <= dr.bottom + 1),
        promptTop: hr ? Math.round(hr.top) : -1,
        promptVisibleInScroller: !!(hr && sr && hr.top >= sr.top - 1 && hr.bottom <= sr.bottom + 1),
        feedbackVisible: !!(str && dr && str.top >= dr.top - 1 && str.bottom <= dr.bottom + 1),
        feedbackInsideScroller: !!(str && sr && str.top >= sr.top - 1 && str.bottom <= sr.bottom + 1),
        comboSlotHeight: slotr ? Math.round(slotr.height) : -1,
      };
    });

  const scrollScrollerToBottom = () =>
    page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const input = dialog && dialog.querySelector('[data-testid="question-input"]');
      for (let el = input && input.parentElement; el && el !== dialog; el = el.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
          el.scrollTop = el.scrollHeight;
          return true;
        }
      }
      return false;
    });

  const options = () => page.locator('[data-testid="answer-option"]');
  const checkButton = () => page.getByRole('button', { name: /Kiểm tra câu trả lời/ }).first();
  const nextButton = () =>
    page.getByRole('button', { name: /Câu tiếp theo|Xem kết quả bài học/ }).first();
  const retryButton = () => page.getByRole('button', { name: /Thử lại câu này/ }).first();
  const comboEl = () => page.locator('[data-testid="lesson-combo"]').first();
  const readCombo = async () => {
    if ((await comboEl().count()) === 0) return 0;
    const raw = await comboEl().getAttribute('data-combo');
    return raw ? Number(raw) : 0;
  };
  const praiseOutcome = async () => {
    const el = page.locator('[data-testid="praise-caption"]').first();
    await el.waitFor({ state: 'visible', timeout: 8000 });
    return (await el.getAttribute('data-praise-outcome')) || '';
  };

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppShell(page);
    await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
    await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
    await openFirstLesson(page);
    await page.waitForSelector('text=Câu hỏi 1', { timeout: 20000 });
    await dismissLevelUpCelebration(page);
    await page.waitForTimeout(350);

    // 1) Khi mở câu hỏi: thanh hành động phải pin ngoài vùng cuộn và luôn thấy.
    const atOpen = await inspect();
    step('atOpen', atOpen);
    if (atOpen.error) throw new Error(atOpen.error);
    if (atOpen.barInsideScroller)
      out.errors.push('thanh "Kiểm tra/Câu tiếp theo" nằm trong vùng cuộn nên có thể cuộn mất');
    if (!atOpen.barVisible)
      out.errors.push(
        `thanh hành động không thấy khi mở câu (bar ${atOpen.barTop}..${atOpen.barBottom}, khung tới ${atOpen.dialogBottom})`
      );
    if (atOpen.comboSlotHeight !== 24)
      out.errors.push(
        `ô combo không giữ chiều cao cố định (${atOpen.comboSlotHeight}px, phải 24px để không đẩy đề bài)`
      );
    await shot('01-question-open');

    // 2) Cuộn hết nội dung: nếu thanh nằm trong vùng cuộn thì sẽ trôi khỏi khung.
    await scrollScrollerToBottom();
    await page.waitForTimeout(200);
    const atBottom = await inspect();
    step('atBottom', atBottom);
    if (atBottom.scrollHeight > atBottom.clientHeight + 8 && !atBottom.barVisible)
      out.errors.push(
        `cuộn xuống đáy thì mất thanh hành động (bar ${atBottom.barTop}..${atBottom.barBottom}, khung tới ${atBottom.dialogBottom})`
      );
    await shot('02-question-scrolled');

    // 3) Làm đúng liên tiếp để dải combo xuất hiện; đo bố cục có nhảy không.
    //    Đồng thời đo vị trí cuộn sau mỗi lần sang câu mới và phản hồi sau chấm.
    let comboShift = null;
    let barShift = null;
    let feedbackVisibleAfterCheck = null;
    let scrollTopAfterNext = null;
    let questionsTried = 0;
    let comboReached = 0;
    const onResult = async () =>
      (await page.getByText('CHÚC MỪNG BÉ HOÀN THÀNH!').count()) > 0;

    for (let q = 0; q < 8 && comboShift === null; q += 1) {
      if (await onResult()) break;
      const n = await options().count();
      if (n === 0) {
        step('skipNonChoiceQuestion', { question: q + 1 });
        break;
      }
      questionsTried += 1;
      const comboBefore = await readCombo();
      let answered = false;

      for (let i = 0; i < n; i += 1) {
        await options().nth(i).click(CLICK);
        const beforeCheck = await inspect();
        await checkButton().click(CLICK);
        const outcome = await praiseOutcome();
        // Chờ cuộn mượt đưa phản hồi vào tầm nhìn rồi mới đo.
        await page.waitForTimeout(400);
        const afterCheck = await inspect();
        if (feedbackVisibleAfterCheck === null)
          feedbackVisibleAfterCheck = afterCheck.feedbackVisible;

        if (outcome === 'CORRECT') {
          answered = true;
          const comboAfter = await readCombo();
          comboReached = Math.max(comboReached, comboAfter);
          if (comboBefore < 2 && comboAfter >= 2 && comboShift === null) {
            // Đo bố cục bằng đỉnh vùng cuộn: nó nằm ngay dưới dải combo, nên
            // nếu dải chèn thêm hàng thì vùng cuộn bị đẩy xuống (bản cũ: +24px).
            // Không dùng promptTop vì cuộn phản hồi làm đề trượt lên có chủ ý.
            comboShift = afterCheck.scrollerTop - beforeCheck.scrollerTop;
            barShift = afterCheck.barTop - beforeCheck.barTop;
            if (afterCheck.comboSlotHeight !== 24)
              out.errors.push(
                `ô combo đổi chiều cao khi có chuỗi (${afterCheck.comboSlotHeight}px, phải 24px)`
              );
            await shot('03-combo-visible');
          }
          break;
        }

        // Sai: bé bấm "Thử lại câu này" rồi thử phương án kế tiếp.
        if (await retryButton().count()) {
          await retryButton().click(CLICK);
          await page.waitForTimeout(150);
        }
      }

      if (!answered) {
        step('couldNotAnswerCorrectly', { question: q + 1 });
        break;
      }

      await nextButton().click(CLICK);
      await page.waitForTimeout(500);
      if (await onResult()) break;
      const afterNext = await inspect();
      scrollTopAfterNext = afterNext.scrollTop;
      step('afterNextQuestion', { question: q + 1, ...afterNext });
      if (afterNext.scrollTop > 4)
        out.errors.push(
          `sang câu mới vẫn giữ vị trí cuộn ${afterNext.scrollTop}px (câu mới bị cắt phần đầu)`
        );
      if (afterNext.promptTop >= 0 && !afterNext.promptVisibleInScroller)
        out.errors.push(
          `đề câu mới không nằm trong tầm nhìn vùng cuộn (prompt ${afterNext.promptTop})`
        );
      if (q === 0) await shot('04-next-question');
    }

    step('comboLayout', { comboShift, barShift, comboReached, questionsTried });
    if (comboShift !== null && Math.abs(comboShift) > 2)
      out.errors.push(`dải combo đẩy vùng câu hỏi xuống ${comboShift}px (phải ≤ 2px)`);
    if (barShift !== null && Math.abs(barShift) > 2)
      out.errors.push(`thanh hành động nhảy ${barShift}px khi có phản hồi`);
    if (feedbackVisibleAfterCheck === false)
      out.errors.push('phản hồi đúng/sai nằm ngoài tầm nhìn sau khi bấm kiểm tra');
    if (comboShift === null)
      step('comboNotObserved', { comboReached, note: 'không đủ 2 câu đúng liên tiếp trong lượt đo' });

    if (scrollTopAfterNext === null)
      out.errors.push('không đo được vị trí cuộn sau khi sang câu mới');

    // 4) Không tràn ngang ở màn 390px.
    const overflowPx = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    );
    out.facts = {
      ...out.facts,
      overflowPx,
      questionsTried,
      atOpenScroll: `${atOpen.scrollHeight}/${atOpen.clientHeight}`,
    };
    if (overflowPx > 2) out.errors.push(`tràn ngang ${overflowPx}px ở màn 390px`);
  } catch (e) {
    out.errors.push('EXCEPTION: ' + (e && e.message ? String(e.message).slice(0, 700) : String(e)));
    out.failedAt = out.steps.length ? out.steps[out.steps.length - 1].step : 'start';
    await shot('99-failure').catch(() => {});
  }

  out.ok = out.errors.length === 0;
  return out;
}
