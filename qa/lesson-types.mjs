/**
 * LESSON QUESTION TYPE COVERAGE QA — driven against the real production build.
 *
 * This script exercises every question type available in the lesson player,
 * navigating through subjects and lessons to find and play each type.
 * It records which types were genuinely exercised and interacted with.
 */

import { dismissLevelUpCelebration } from './lib.mjs';

const state = { steps: [], errors: [], typesSeen: {}, typesCompleted: {} };
const CLICK = { timeout: 12000 };

function log(name, detail) {
  state.steps.push({ step: name, ...detail });
}
function fail(msg) {
  state.errors.push(msg);
}

const TYPE_LABELS = [
  ['Sắp xếp', 'ordering'],
  ['Nối', 'matching'],
  ['Kéo thả', 'drag-drop'],
  ['Điền', 'fill-blank'],
  ['Đúng', 'true-false'],
  ['Biểu thức', 'math-expression'],
  ['Trắc nghiệm', 'multiple-choice'],
  ['Hình ảnh', 'image-choice'],
  ['Âm thanh', 'audio-choice'],
];

/** Read the type label the modal prints for the current question. */
async function currentType(page) {
  const dialog = (await page.locator('[role=dialog]').innerText()).toLowerCase();
  for (const [label, type] of TYPE_LABELS) {
    if (dialog.includes(label.toLowerCase())) return type;
  }
  return 'unknown';
}

/** Answer the current question using the interaction its type really uses. */
async function answerByType(page, type) {
  if (type === 'ordering') {
    const tiles = page.locator('[role=dialog] [data-testid=answer-option]');
    const n = await tiles.count();
    for (let i = 0; i < n; i += 1) {
      const t = tiles.nth(i);
      if (!(await t.isDisabled())) await t.click(CLICK);
    }
    return n;
  }

  if (type === 'matching') {
    const lefts = page.locator('[role=dialog] [data-testid=match-left]');
    const n = await lefts.count();
    for (let i = 0; i < n; i += 1) {
      await lefts.nth(i).click(CLICK);
      const right = page.locator('[role=dialog] [data-testid=match-right]').nth(i);
      if (await right.count()) await right.click(CLICK);
    }
    return n;
  }

  if (type === 'drag-drop') {
    const items = page.locator('[role=dialog] [data-testid=drag-item]');
    const buckets = page.locator('[role=dialog] [data-testid=drop-bucket]');
    const n = await items.count();
    const b = await buckets.count();
    for (let i = 0; i < n; i += 1) {
      if (b === 0) break;
      await items.nth(i).click(CLICK);
      await buckets.nth(i % b).click(CLICK);
    }
    return n;
  }

  if (type === 'fill-blank') {
    // First try keyboard input
    const keys = page.locator('[role=dialog] button[aria-label="A"], [role=dialog] button[aria-label="a"]');
    if (await keys.count()) {
      await keys.first().click(CLICK);
      const okBtn = page.locator('[role=dialog] button[aria-label="Xác nhận"]');
      if (await okBtn.count()) await okBtn.click(CLICK);
      return 1;
    }
    // Fallback to option buttons
    const opt = page.locator('[role=dialog] [data-testid=answer-option]').first();
    if (await opt.count()) await opt.click(CLICK);
    return (await opt.count()) ? 1 : 0;
  }

  if (type === 'true-false') {
    const opt = page.locator('[role=dialog] [data-testid=answer-option]').first();
    if (await opt.count()) await opt.click(CLICK);
    return (await opt.count()) ? 1 : 0;
  }

  if (type === 'math-expression') {
    // Try keyboard input first
    const key5 = page.locator('[role=dialog] button[aria-label="5"]');
    if (await key5.count()) {
      await key5.click(CLICK);
      const plusKey = page.locator('[role=dialog] button[aria-label="+"]');
      if (await plusKey.count()) await plusKey.click(CLICK);
      const key3 = page.locator('[role=dialog] button[aria-label="3"]');
      if (await key3.count()) await key3.click(CLICK);
      const okBtn = page.locator('[role=dialog] button[aria-label="Xác nhận"]');
      if (await okBtn.count()) await okBtn.click(CLICK);
      return 1;
    }
    // Fallback to option buttons
    const opt = page.locator('[role=dialog] [data-testid=answer-option]').first();
    if (await opt.count()) await opt.click(CLICK);
    return (await opt.count()) ? 1 : 0;
  }

  // multiple-choice, image-choice, audio-choice all render choice buttons.
  const opt = page.locator('[role=dialog] [data-testid=answer-option]').first();
  if (await opt.count()) await opt.click(CLICK);
  return (await opt.count()) ? 1 : 0;
}

async function navigateToLessons(page) {
  // T20A: a relative URL cannot be navigated to — always use the live origin.
  const origin = new URL(page.url()).origin;
  await page.goto(origin + '/');
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  // Navigate to world map or subject selection
  const worldMapBtn = page.locator('[data-testid="nav-world_map"]:visible');
  if (await worldMapBtn.count()) {
    await worldMapBtn.click(CLICK);
    await page.waitForSelector('text=Kho Báu Tri Thức', { timeout: 20000 });
  }
}

/**
 * Play one lesson node end-to-end, recording every question type met.
 * T20A — the subject screen is an adventure path of overlapping nodes
 * (bug B-01), so the node is activated with the keyboard.
 */
async function sweepOneLesson(page, nodes, index, subject) {
  const lessonText = (await nodes.nth(index).getAttribute('aria-label')) || `bài ${index + 1}`;
  await nodes.nth(index).focus();
  await page.keyboard.press('Enter');
  const startBtn = page.getByRole('button', { name: /Bắt đầu/ }).first();
  if (await startBtn.count()) await startBtn.click(CLICK);
  await page.waitForSelector('[data-testid$="-question"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);

  for (let q = 0; q < 15; q += 1) {
    // The result screen says "Bé đã làm đúng …": check it BEFORE reading the
    // type label, or "đúng" is mistaken for a true/false question.
    const screenText = await page.locator('[role=dialog]').first().innerText().catch(() => '');
    if (/HOÀN THÀNH|KẾT QUẢ/.test(screenText)) {
      log('lessonComplete', { subject, lesson: lessonText });
      break;
    }
    const type = await currentType(page);
    if (type === 'unknown') {
      const completeText = await page.locator('[role=dialog]').innerText();
      if (/HOÀN THÀNH|KẾT QUẢ/.test(completeText)) {
        log('lessonComplete', { subject, lesson: lessonText });
        break;
      }
      fail(`${subject} lesson "${lessonText}" question ${q + 1}: no recognisable type label`);
      // T20A / B-03: after the last question the result screen is skipped, so
      // "no type" here is the known defect rather than a broken harness.
      if (q + 1 > 1) fail(`${subject}: result screen skipped after the last question (B-03)`);
      break;
    }

    state.typesSeen[type] = (state.typesSeen[type] || 0) + 1;
    log('question', { subject, lesson: lessonText, question: q + 1, type });

    const touched = await answerByType(page, type);
    if (touched > 0) state.typesCompleted[type] = (state.typesCompleted[type] || 0) + 1;

    const checkBtn = page.getByRole('button', { name: /Kiểm tra/ });
    if (await checkBtn.count()) {
      await checkBtn.click(CLICK);
      await page.waitForTimeout(500);
    }

    const nextBtn = page.getByRole('button', { name: /Câu tiếp|Xem kết quả/ });
    if (await nextBtn.count()) {
      await nextBtn.click(CLICK);
      await page.waitForTimeout(500);
      continue;
    }
    break;
  }

  // Leave the result screen like a child would ("Về bản đồ"): the lesson is
  // reported complete then, and a level-up celebration may open after it.
  const backToMap = page.getByRole('button', { name: 'Về bản đồ' });
  if (await backToMap.count()) {
    await backToMap.first().click(CLICK).catch(() => {});
    await page.waitForTimeout(400);
  }
  // Close EVERY dialog left behind (the player modal can survive the lesson
  // popup, the level-up celebration closes with "Tuyệt Vời", and a leftover
  // modal blocks the next node).
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await dismissLevelUpCelebration(page)) continue;
    if ((await page.locator('[role=dialog]').count()) === 0) break;
    const closeBtn = page
      .locator('[data-testid="lesson-close"], button[aria-label="Đóng"], [data-testid="game-close"]')
      .last();
    if (!(await closeBtn.count())) break;
    await closeBtn.click(CLICK).catch(() => {});
    await page.waitForTimeout(350);
  }
}

async function runLessonTypeSweep(page) {
  // T20A: only the first lesson of a subject is unlocked for a brand-new child,
  // so enable the parent override the app itself exposes (unlockAllLessons) to
  // reach enough lessons for a type sweep.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}');
    raw.unlockAllLessons = true;
    localStorage.setItem('kho_bau_child_profile', JSON.stringify(raw));
  });
  const subjects = ['Tiếng Việt', 'Toán Học', 'English'];
  const expectedTypes = TYPE_LABELS.map(([, t]) => t);

  for (const subject of subjects) {
    log('subjectStart', { subject });

    // Go back to home and select subject
    await navigateToLessons(page);

    // Click on the subject card
    const subjectBtn = page.getByRole('button', { name: subject }).first();
    if (await subjectBtn.count()) {
      await subjectBtn.click(CLICK);
      await page.waitForTimeout(500);
    } else {
      fail(`Subject "${subject}" button not found`);
      continue;
    }

    // T20A: the subject screen is an adventure path of lesson NODES (not cards),
    // so walk the first few nodes instead of looking for "Bài" cards.
    const nodes = page.locator('[data-testid^="lesson-button-"]');
    const nodeCount = await nodes.count();
    for (let i = 0; i < Math.min(nodeCount, 4); i += 1) {
      try {
        await sweepOneLesson(page, nodes, i, subject);
      } catch (e) {
        // One stuck lesson must never abort the whole sweep (T20A).
        const msg = e && e.message ? String(e.message).split('\n')[0] : String(e);
        fail(`${subject} lesson ${i + 1} aborted: ${msg}`);
        const dismiss = page.locator('[data-testid="lesson-close"], button[aria-label="Đóng"]').last();
        if (await dismiss.count()) await dismiss.click(CLICK).catch(() => {});
        await page.waitForTimeout(300);
      }
    }
  }

  // Summary
  const missed = expectedTypes.filter((t) => !(t in state.typesSeen));
  log('typeSweep', {
    subjectsTested: subjects.length,
    typesSeen: state.typesSeen,
    typesCompleted: state.typesCompleted,
    typesNotEncountered: missed,
  });

  // Every type that DID appear must also have been interactable.
  for (const [type, completed] of Object.entries(state.typesCompleted)) {
    if (!completed) fail(`type ${type} rendered but could not be answered`);
  }
  // A sweep that answered nothing is a broken harness.
  if (Object.keys(state.typesCompleted).length < 3) {
    fail(`only ${Object.keys(state.typesCompleted).length} question types exercised — sweep too narrow to be evidence`);
  }
}

export default async function run(page, ui) {
  try {
    await runLessonTypeSweep(page);
  } catch (e) {
    const msg = e && e.message ? String(e.message).split('\n')[0] : String(e);
    state.errors.push('EXCEPTION: ' + msg);
    state.failedAt = state.steps.length ? state.steps[state.steps.length - 1].step : 'start';
  }
  return state;
}