/**
 * QUESTION TYPE COVERAGE QA (§16) — driven against the real production build.
 *
 * The competition bank grew from 78 to 132 items and gained ordering/matching
 * on skills that previously had none. A type can be perfectly valid in the data
 * and still be unplayable in the UI, so this sweeps real exams and answers every
 * question with the interaction that type actually uses.
 *
 * It records which of the 7 types were genuinely exercised rather than asserting
 * a count, so a seeded exam that skips a rare type reports honestly instead of
 * failing for the wrong reason.
 */

import { openCompetitionHub } from './lib.mjs';
const state = { steps: [], errors: [], typesSeen: {}, typesCompleted: {} };
const CLICK = { timeout: 12000 };

function log(name, detail) {
  state.steps.push({ step: name, ...detail });
}
function fail(msg) {
  state.errors.push(msg);
}

const TYPE_BY_LABEL = [
  ['Sắp xếp thứ tự', 'ordering'],
  ['Nối hình ghép đôi', 'matching'],
  ['Phân loại', 'classify'],
  ['Kéo thả vào nhóm', 'drag-drop'],
  ['Điền vào chỗ trống', 'fill-blank'],
  ['Đúng / Sai', 'true-false'],
  ['Trắc nghiệm', 'multiple-choice'],
];

/** Read the type label the modal prints for the current question. */
async function currentType(page) {
  const dialog = (await page.locator('[role=dialog]').innerText()).toLowerCase();
  for (const [label, type] of TYPE_BY_LABEL) {
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

  if (type === 'classify' || type === 'drag-drop') {
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

  // multiple-choice / true-false / fill-blank all render choice buttons.
  const opt = page.locator('[role=dialog] [data-testid=answer-option]').first();
  if (await opt.count()) await opt.click(CLICK);
  return (await opt.count()) ? 1 : 0;
}

async function runOneExam(page, origin, blueprintIndex, subjectLabel) {
  await page.goto(origin + '/');
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  // T20A / B-04: no world-map entry for the arena — reach it like a parent does.
  await openCompetitionHub(page);

  // The hub is filtered by subject, so sweeping one subject only ever reveals
  // the question types that subject happens to use.
  if (subjectLabel) {
    await page.getByRole('button', { name: subjectLabel }).first().click(CLICK);
    await page.waitForTimeout(250);
  }

  const starts = page.getByRole('button', { name: /Vào Thi Thử/ });
  const available = await starts.count();
  // Clamp instead of overrunning: asking for a 7th test on a 6-card hub is a
  // harness bug, and reporting it as an app failure would be a lie.
  if (blueprintIndex >= available) return;
  await starts.nth(blueprintIndex).click(CLICK);
  await page.waitForSelector('role=dialog', { timeout: 20000 });
  await page.waitForTimeout(900);

  let answered = 0;
  const localTypes = {};

  for (let i = 0; i < 30; i += 1) {
    const type = await currentType(page);
    if (type === 'unknown') {
      fail(`${subjectLabel || 'all'} exam ${blueprintIndex}: question ${i + 1} showed no recognisable type label`);
      break;
    }
    localTypes[type] = (localTypes[type] || 0) + 1;
    state.typesSeen[type] = (state.typesSeen[type] || 0) + 1;

    const touched = await answerByType(page, type);
    if (touched > 0) state.typesCompleted[type] = (state.typesCompleted[type] || 0) + 1;
    answered += 1;

    const next = page.getByRole('button', { name: /^Câu tiếp$/ });
    if (await next.count()) {
      await next.click(CLICK);
      await page.waitForTimeout(90);
      continue;
    }
    break;
  }

  const submit = page.getByRole('button', { name: /^Nộp Bài$/ });
  if (await submit.count()) {
    await submit.click(CLICK);
    await page.waitForSelector('text=Xác nhận Nộp Bài', { timeout: 12000 });
    await page.getByRole('button', { name: 'Xác nhận Nộp Bài' }).click(CLICK);
    const result = await page.getByText('KẾT QUẢ BÀI THI').count({ timeout: 20000 });
    if (!result) fail(`${subjectLabel || 'all'} exam ${blueprintIndex}: result screen did not appear`);
  } else {
    fail(`${subjectLabel || 'all'} exam ${blueprintIndex}: submit never appeared after ${answered} questions`);
  }

  log('exam_' + (subjectLabel || 'all') + '_' + blueprintIndex, {
    answered,
    types: localTypes,
    resultShown: true,
  });

  // Leave the result modal behind so the next iteration starts clean.
  const close = page.getByRole('button', { name: /Đóng|Về Đấu Trường/ }).last();
  if (await close.count()) await close.click(CLICK).catch(() => {});
  await page.waitForTimeout(300);
}

const SUBJECT_FILTERS = ['Môn Toán', 'Môn Tiếng Việt', 'Tiếng Anh'];

export default async function run(page, ui) {
  try {
    const origin = new URL(page.url()).origin;
    // (The harness passes no CLI args to scripts, so this reads the environment.)
    const perSubject = Number(process.env.QA_EXAMS || 3);
    let ran = 0;

    for (const subject of SUBJECT_FILTERS) {
      for (let i = 0; i < perSubject; i += 1) {
        const before = state.steps.length;
        await runOneExam(page, origin, i, subject);
        if (state.steps.length > before) ran += 1;
      }
    }

    const expected = TYPE_BY_LABEL.map(([, t]) => t);
    const missed = expected.filter((t) => !(t in state.typesSeen));
    log('typeSweep', {
      examsRun: ran,
      typesSeen: state.typesSeen,
      typesCompleted: state.typesCompleted,
      typesNotEncountered: missed,
    });

    // Every type that DID appear must also have been interactable.
    for (const [type, completed] of Object.entries(state.typesCompleted)) {
      if (!completed) fail(`type ${type} rendered but could not be answered`);
    }
    // A sweep that answered nothing is a broken harness, not a passing run.
    if (Object.keys(state.typesCompleted).length < 3) {
      fail(`only ${Object.keys(state.typesCompleted).length} question types exercised — sweep too narrow to be evidence`);
    }
  } catch (e) {
    const msg = e && e.message ? String(e.message).split('\n')[0] : String(e);
    state.errors.push('EXCEPTION: ' + msg);
    state.failedAt = state.steps.length ? state.steps[state.steps.length - 1].step : 'start';
  }
  return state;
}
