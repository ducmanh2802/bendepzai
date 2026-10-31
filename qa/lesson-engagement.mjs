// T27 — bằng chứng nhìn thấy được cho "bài học hấp dẫn hơn".
// Trên bản build thật 390×844: mở bài Tiếng Việt đầu tiên và chơi 2 lượt.
// Lượt 1 cố tình chọn phương án cuối (sai) để xem chuỗi = 0, 1 sao, danh sách
// câu sai; bấm "Ôn lại N câu chưa đúng" rồi làm đúng từng câu để xem combo tăng,
// 3 sao và màn kết quả sạch câu sai. Đồng hồ phải chạy khi làm bài và dừng lại
// ở màn kết quả. Chạy: npm run build && node qa/run-one.mjs qa/lesson-engagement.mjs
import fs from 'node:fs';
import path from 'node:path';
import { waitForAppShell, openFirstLesson, dismissLevelUpCelebration } from './lib.mjs';

const OUT = path.resolve(process.env.TEMP || process.env.TMP || '.', 'shots-t27');
fs.mkdirSync(OUT, { recursive: true });

const toSeconds = (text) => {
  const m = /(\d+):(\d{2})/.exec(text || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
};

export default async function run(page) {
  const out = { errors: [], shots: [], facts: {}, steps: [] };
  const CLICK = { timeout: 15000 };

  const shot = async (name) => {
    const file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file, fullPage: false });
    out.shots.push(file);
  };
  const step = (name, detail) => out.steps.push({ step: name, ...detail });
  const timerText = () => page.locator('[data-testid="lesson-timer"]').first().innerText();
  const options = () => page.locator('[data-testid="answer-option"]');
  const promptText = () => page.locator('h4').first().innerText();
  const onResult = async () => (await page.getByText('CHÚC MỪNG BÉ HOÀN THÀNH!').count()) > 0;
  const nextButton = () =>
    page.getByRole('button', { name: /Câu tiếp theo|Xem kết quả bài học/ }).first();
  const checkButton = () => page.getByRole('button', { name: /Kiểm tra câu trả lời/ }).first();

  const answerAndCheck = async (pickIndex) => {
    const opts = options();
    const n = await opts.count();
    if (!n) return { picked: null, outcome: null, feedback: '' };
    const idx = pickIndex === 'last' ? n - 1 : Math.min(Math.max(0, pickIndex), n - 1);
    const picked = (await opts.nth(idx).innerText()).trim();
    await opts.nth(idx).click(CLICK);
    await checkButton().click(CLICK);
    const praise = page.locator('[data-testid="praise-caption"]').first();
    await praise.waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForTimeout(120);
    const outcome = await praise.getAttribute('data-praise-outcome');
    const feedback = (await page.locator('[role="status"]').first().innerText().catch(() => '')).trim();
    return { picked, outcome, feedback };
  };

  const clickOptionByText = async (text) => {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const wanted = norm(text);
    const opts = options();
    const n = await opts.count();
    for (let i = 0; i < n; i += 1) {
      const label = norm(await opts.nth(i).innerText());
      // True/False và một số dạng câu có icon/tiền tố trong nhãn nút, nên so khớp
      // chứa nhau thay vì đòi giống tuyệt đối.
      if (label === wanted || label.includes(wanted) || wanted.includes(label)) {
        await opts.nth(i).click(CLICK);
        return true;
      }
    }
    return false;
  };

  const readResult = async () => {
    const stars = Number(await page.locator('[data-testid="lesson-stars"]').first().getAttribute('data-stars'));
    const rating = (await page.locator('[data-testid="lesson-rating-label"]').first().innerText()).trim();
    const body = await page.evaluate(() => document.body.innerText);
    const score = /🎯 Đúng (\d+)\/(\d+)/.exec(body.replace(/\s+/g, ' ')) || /Đúng (\d+) \/ (\d+)/.exec(body.replace(/\s+/g, ' '));
    const best = /Chuỗi dài nhất (\d+)/.exec(body.replace(/\s+/g, ' '));
    const missedItems = await page.locator('[data-testid="lesson-missed-list"] li').count();
    const reviewButton = page.locator('[data-testid="lesson-review-missed"]');
    const reviewText = (await reviewButton.count()) ? (await reviewButton.first().innerText()).trim() : null;
    return {
      stars,
      rating,
      score: score ? Number(score[1]) : -1,
      total: score ? Number(score[2]) : -1,
      bestCombo: best ? Number(best[1]) : 0,
      missedItems,
      reviewText,
    };
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

    // 1) Đồng hồ phải chạy.
    const t0 = toSeconds(await timerText());
    await page.waitForTimeout(1400);
    const t1 = toSeconds(await timerText());
    step('timerRuns', { t0, t1 });
    if (t0 < 0 || t1 < 0) out.errors.push(`không đọc được đồng hồ (${t0}/${t1})`);
    if (t1 <= t0) out.errors.push(`đồng hồ không chạy: ${t0}s → ${t1}s`);
    await shot('01-question-with-timer');

    // 2) Lượt 1: chọn phương án cuối cho mọi câu (thường là sai) và ghi lại đáp
    //    án đúng mà app hiển thị để lượt sau làm đúng.
    const answers = [];
    for (let i = 0; i < 12; i += 1) {
      if (await onResult()) break;
      const prompt = (await promptText()).trim();
      const res = await answerAndCheck('last');
      if (res.picked === null) break;
      let answer = res.picked;
      if (res.outcome !== 'CORRECT') {
        const m = /Đáp án đúng là:\s*(.+)/.exec(res.feedback);
        answer = m ? m[1].trim() : res.picked;
      }
      answers.push({ prompt, answer, outcome: res.outcome });
      await nextButton().click(CLICK);
      await page.waitForTimeout(250);
    }
    await page.waitForSelector('[data-testid="lesson-stars"]', { timeout: 8000 });
    const r1 = await readResult();
    const timerBeforeFreeze = await timerText();
    await page.waitForTimeout(1300);
    const timerAfterFreeze = await timerText();
    // Hàng sao phải nằm trong màn hình ngay khi mở màn kết quả, kể cả khi
    // danh sách câu sai dài (lỗi autoFocus từng tự cuộn xuống đáy).
    await page.waitForTimeout(400);
    const starsBox = await page.evaluate(() => {
      const stars = document.querySelector('[data-testid="lesson-stars"]');
      if (!stars) return null;
      const r = stars.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), viewport: window.innerHeight };
    });
    if (!starsBox) out.errors.push('không tìm thấy hàng sao ở màn kết quả');
    else if (starsBox.top < 0 || starsBox.bottom > starsBox.viewport)
      out.errors.push(`hàng sao bị che khỏi màn hình: ${JSON.stringify(starsBox)}`);
    const ratio = r1.total > 0 ? r1.score / r1.total : 1;
    const expectedStars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    step('firstPassResult', { ...r1, answers: answers.length, timerBeforeFreeze, timerAfterFreeze });
    if (answers.length < 2) out.errors.push(`chỉ ghi được ${answers.length} câu hỏi, cần ≥ 2 để thử combo`);
    if (r1.total !== answers.length) out.errors.push(`màn kết quả báo ${r1.total} câu, lượt chơi có ${answers.length} câu`);
    if (r1.stars !== expectedStars)
      out.errors.push(`xếp hạng ${r1.stars} sao, theo tỉ lệ ${r1.score}/${r1.total} phải là ${expectedStars} sao`);
    if (r1.missedItems !== r1.total - r1.score)
      out.errors.push(`danh sách ôn lại có ${r1.missedItems} câu, phải bằng ${r1.total - r1.score}`);
    if (!/Ôn lại \d+ câu chưa đúng/.test(r1.reviewText || ''))
      out.errors.push(`không thấy nút ôn lại câu sai ("${r1.reviewText}")`);
    if (timerBeforeFreeze !== timerAfterFreeze)
      out.errors.push(`đồng hồ vẫn chạy ở màn kết quả: ${timerBeforeFreeze} → ${timerAfterFreeze}`);
    await shot('02-result-missed-questions');

    // 3) Ôn lại đúng các câu sai: combo phải hiện, kết quả phải 3 sao, không còn câu sai.
    if (r1.missedItems > 0) {
      await page.locator('[data-testid="lesson-review-missed"]').first().click(CLICK);
    } else {
      await page.getByRole('button', { name: /^Học lại$/ }).first().click(CLICK);
    }
    await page.waitForSelector('text=Câu hỏi 1', { timeout: 10000 });
    await page.waitForTimeout(300);
    const reviewBanner = await page.getByText(/Đang ôn lại \d+ câu chưa đúng/).count();
    if (r1.missedItems > 0 && !reviewBanner) out.errors.push('không thấy băng-rôn "Đang ôn lại câu chưa đúng"');

    let maxCombo = 0;
    let comboShot = false;
    for (let i = 0; i < 12; i += 1) {
      if (await onResult()) break;
      const prompt = (await promptText()).trim();
      const record = answers.find((a) => a.prompt === prompt);
      if (!record) {
        out.errors.push(`không tìm thấy đáp án đã ghi cho câu "${prompt.slice(0, 40)}"`);
        break;
      }
      // Dạng "sắp xếp thứ tự": đáp án đúng là một chuỗi nối bằng '|'; phải chạm
      // lần lượt từng thẻ theo đúng thứ tự, không phải chọn một thẻ.
      const ordering = (await page.locator('[data-testid="ordering-question"]').count()) > 0;
      if (ordering && record.answer.includes('|')) {
        for (const word of record.answer.split('|').map((w) => w.trim())) {
          const ok = await clickOptionByText(word);
          if (!ok) {
            out.errors.push(`không bấm được thẻ "${word}" khi sắp xếp lại câu "${prompt.slice(0, 40)}"`);
            break;
          }
          await page.waitForTimeout(80);
        }
      } else {
        const picked = await clickOptionByText(record.answer);
        if (!picked) {
          out.errors.push(`không bấm được phương án "${record.answer}" của câu "${prompt.slice(0, 40)}"`);
          break;
        }
      }
      await checkButton().click(CLICK);
      const praise = page.locator('[data-testid="praise-caption"]').first();
      await praise.waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(120);
      if ((await praise.getAttribute('data-praise-outcome')) !== 'CORRECT')
        out.errors.push(`đáp án đã ghi của câu "${prompt.slice(0, 40)}" bị chấm sai`);
      const comboEl = page.locator('[data-testid="lesson-combo"]');
      if (await comboEl.count()) {
        const c = Number(await comboEl.first().getAttribute('data-combo'));
        maxCombo = Math.max(maxCombo, c);
        if (c >= 2 && !comboShot) {
          comboShot = true;
          await shot('03-combo-streak');
        }
      }
      await nextButton().click(CLICK);
      await page.waitForTimeout(250);
    }

    await page.waitForSelector('[data-testid="lesson-stars"]', { timeout: 8000 });
    const r2 = await readResult();
    step('secondPassResult', { ...r2, maxCombo, comboShot });
    const expectedSecond = r1.missedItems > 0 ? r1.missedItems : answers.length;
    if (r2.score !== r2.total) out.errors.push(`lượt ôn lại đúng ${r2.score}/${r2.total}, phải đúng hết`);
    if (r2.total !== expectedSecond) out.errors.push(`lượt ôn lại có ${r2.total} câu, phải ${expectedSecond}`);
    if (r2.stars !== 3) out.errors.push(`lượt ôn lại được ${r2.stars} sao, phải 3 sao`);
    if (!/Ba sao/.test(r2.rating)) out.errors.push(`lời khen "${r2.rating}" không phải mức 3 sao`);
    if (r2.missedItems !== 0) out.errors.push(`lượt ôn lại vẫn còn ${r2.missedItems} câu sai trong danh sách`);
    if (maxCombo < 2) out.errors.push(`combo cao nhất chỉ ${maxCombo}, phải ≥ 2 khi đúng liên tiếp`);
    if (r2.bestCombo !== Math.max(maxCombo, 1))
      out.errors.push(`"Chuỗi dài nhất" hiện ${r2.bestCombo}, phải ${Math.max(maxCombo, 1)}`);
    await shot('04-result-three-stars');

    // 4) Bố cục điện thoại không tràn ngang.
    const overflowPx = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    );
    out.facts.overflowPx = overflowPx;
    if (overflowPx > 2) out.errors.push(`tràn ngang ${overflowPx}px ở màn 390px`);
  } catch (e) {
    out.errors.push('EXCEPTION: ' + (e && e.message ? String(e.message).slice(0, 700) : String(e)));
    out.failedAt = out.steps.length ? out.steps[out.steps.length - 1].step : 'start';
    await shot('99-failure').catch(() => {});
  }

  out.ok = out.errors.length === 0;
  return out;
}
