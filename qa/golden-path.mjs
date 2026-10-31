/**
 * GOLDEN PATH QA (§31) — driven against the real production build.
 * NEW CHILD -> HOME -> VIETNAMESE -> READING FLUENCY -> READ + COMPREHENSION
 * -> COMPETITION -> TIMED TEST -> RESULT -> REVIEW -> PARENT MODE -> RELOAD -> PERSISTENCE
 */

import { openFirstLesson, describeBlocker, dismissLevelUpCelebration, openCompetitionHub } from './lib.mjs';
const state = { steps: [], errors: [] };

function log(name, detail) {
  state.steps.push({ step: name, ...detail });
}
function fail(msg) {
  state.errors.push(msg);
}

const CLICK = { timeout: 12000 };

async function snap(page, label, steps) {
  const v = await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}');
    const sentinel = localStorage.getItem('__sentinel');
    const comp = JSON.parse(localStorage.getItem('kho_bau_competition_history') || '{}');
    const rs = JSON.parse(localStorage.getItem('kho_bau_reading_store') || '{}');
    return {
      xp: profile.xp || 0,
      lessons: (profile.completedLessons || []).length,
      exams: (comp.examResults || []).length,
      reading: (rs.metrics || []).length,
      keys: Object.keys(localStorage).sort().join(','),
      origin: location.origin,
      sentinel: sentinel === null ? 'GONE' : sentinel,
    };
  });
  steps.push({ step: 'SNAP_' + label, ...v });
}

async function answerCurrentItem(page) {
  const opt = page.locator('[data-testid=answer-option]').first();
  if (await opt.count()) await opt.click(CLICK);
}

export default async function run(page, ui) {
  try {
    await body(page, ui);
  } catch (e) {
    const msg = e && e.message ? String(e.message).split('\n')[0] : String(e);
    state.errors.push('EXCEPTION: ' + msg);
    state.failedAt = state.steps.length ? state.steps[state.steps.length - 1].step : 'start';
  }
  return state;
}

async function body(page, ui) {
  // Use whichever origin this run was launched against. A hardcoded host:port here
  // silently switches to a DIFFERENT origin, which has its own empty localStorage
  // and looks exactly like "the app wiped the child's progress".
  const APP_ORIGIN = new URL(page.url()).origin;

  // Trace any destructive storage operation back to its caller.
  const NL = String.fromCharCode(10);
  await page.addInitScript(() => {
    window.__removals = [];
    const record = (k) => {
      window.__removals.push({
        key: k,
        stack: String(new Error().stack)
          .split(String.fromCharCode(10))
          .slice(1, 6)
          .join(' ~ '),
      });
    };
    const rm = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (k) {
      record(k);
      return rm.call(this, k);
    };
    const cl = Storage.prototype.clear;
    Storage.prototype.clear = function () {
      record('*CLEAR*');
      return cl.call(this);
    };
  });

  // ---------- 1. NEW CHILD / HOME ----------
  await page.evaluate(() => {
    localStorage.clear();
    // Sentinel: survives unless the whole storage area is replaced/lost.
    localStorage.setItem('__sentinel', 'alive');
  });
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  // Thẻ gợi ý nạp engine bất đồng bộ (chunk riêng); đọc text ngay sau khi vào
  // trang sẽ thấy skeleton và báo thiếu thẻ (T31 — đỏ giả do timing).
  await page
    .waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 })
    .catch(() => {});

  const homeText = await page.evaluate(() => document.body.innerText);
  const nextBestAction = /Hôm Nay Bé Nên Học Gì|Bé Nên Làm Gì Tiếp Theo/.test(homeText);
  log('home', {
    readingCard: homeText.includes('Luyện Đọc'),
    competitionCard: homeText.includes('Đấu Trường'),
    nextBestAction,
    readingHeadline: /Bé đang|Bé đọc|Mình bắt đầu luyện đọc/.test(homeText),
  });
  if (!nextBestAction) fail('Next Best Action card missing on home');

  const xpBefore = await page.evaluate(
    () => JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}').xp
  );
  log('newChildIsClean', { xp: xpBefore === undefined ? 0 : xpBefore });
  if ((xpBefore || 0) !== 0) fail('new child should start at 0 XP, got ' + xpBefore);

  // ---------- 2. VIETNAMESE LESSON ----------
  await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
  await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
  const lessonButtons = await page.locator('[data-testid^="lesson-button-"]').count();
  log('vietnameseSubject', { lessonCount: lessonButtons });
  if (lessonButtons === 0) fail('no lessons listed for Vietnamese');

  await openFirstLesson(page);
  await page.waitForSelector('text=Câu hỏi 1', { timeout: 20000 });
  log('lessonOpened', { ok: true });

  let answered = 0;
  for (let i = 0; i < 12; i += 1) {
    const checkBtn = page.getByRole('button', { name: /Kiểm tra câu trả lời/ });
    if (!(await checkBtn.count())) break;
    await answerCurrentItem(page);
    await checkBtn.click(CLICK);
    answered += 1;
    await page.waitForTimeout(100);
    const next = page.getByRole('button', { name: /Câu tiếp theo|Xem kết quả bài học/ });
    if (await next.count()) await next.first().click(CLICK);
    await page.waitForTimeout(100);
    if (await page.getByText('CHÚC MỪNG BÉ HOÀN THÀNH!').count()) break;
  }

  const lessonDone = await page.getByText('CHÚC MỪNG BÉ HOÀN THÀNH!').count();
  log('lessonCompleted', { questionsAnswered: answered, completed: lessonDone > 0 });
  if (!lessonDone) fail('lesson did not reach the completion screen');

  const osAfterLesson = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('kho_bau_learning_os_store') || 'null');
    if (!raw) return null;
    return {
      schemaVersion: raw.schemaVersion,
      skillCount: Object.keys(raw.knowledgeStates || {}).length,
      evidenceCount: (raw.recentEvidences || []).length,
    };
  });
  log('evidenceRecorded', osAfterLesson || { none: true });
  if (!osAfterLesson || osAfterLesson.skillCount === 0)
    fail('Learning OS evidence was not persisted after the lesson');

  // T20A / B-03 (fixed in T20A): the lesson's own completion screen (rewards +
  // "Về bản đồ") must stay on screen so the child sees what they earned.
  // The level-up celebration now opens only AFTER the child leaves that screen
  // (one dialog at a time, B-05). Older builds stacked it on top — handle both.
  const celebrated = await dismissLevelUpCelebration(page);
  if (celebrated) log('levelUpCelebrationDismissed', { ok: true, stacked: true });
  const backToMap = page.getByRole('button', { name: 'Về bản đồ' });
  if (await backToMap.count()) {
    try {
      await backToMap.click(CLICK);
    } catch (e) {
      const blocker = await describeBlocker(page, '[role="dialog"] button');
      log('backToMapBlocked', { blocker });
      fail(`"Về bản đồ" click failed: ${e.message.split('\n')[0]}`);
      throw e;
    }
  } else {
    fail('lesson result screen skipped (B-03) — no "Về bản đồ" button after the last question');
    const lessonClose = page.locator('[data-testid="lesson-close"]');
    if (await lessonClose.count()) await lessonClose.first().click(CLICK).catch(() => {});
  }
  await page.waitForTimeout(300);
  const celebratedAfter = await dismissLevelUpCelebration(page);
  if (celebratedAfter) log('levelUpCelebrationDismissed', { ok: true, afterResultScreen: true });
  const dialogsLeft = await page.locator('[role="dialog"]:visible').count();
  if (dialogsLeft) fail(`${dialogsLeft} dialog(s) still open after leaving the lesson`);
  await page.waitForTimeout(300);

  // ---------- 3. READING FLUENCY ----------
  const readingNav = '[data-testid="nav-reading_fluency"]:visible';
  try {
    await page.locator(readingNav).first().click(CLICK);
  } catch (e) {
    // T20A — a click that times out is itself a finding: record WHAT covers the
    // navigation so the bug report can name the overlay.
    const blocker = await describeBlocker(page, '[data-testid="nav-reading_fluency"]');
    log('navigationBlocked', { selector: 'nav-reading_fluency', blocker });
    fail(`nav-reading_fluency click failed: ${e.message.split('\n')[0]}`);
    throw e;
  }
  await page.waitForSelector('text=Thang Luyện Đọc Của Bé', { timeout: 20000 });

  const ladderText = await page.evaluate(() => document.body.innerText);
  log('readingLadder', {
    hasStages: ladderText.includes('Đọc Chính Xác') && ladderText.includes('Đọc Lưu Loát'),
    allFiveStages:
      ladderText.includes('Đọc Chính Xác') &&
      ladderText.includes('Đọc Lưu Loát') &&
      ladderText.includes('Hiểu Nội Dung') &&
      ladderText.includes('Hiểu Nhanh') &&
      ladderText.includes('Tốc Độ Thi'),
    lockedStages: (ladderText.match(/Đang khóa/g) || []).length,
  });
  if (!ladderText.includes('Đọc Chính Xác')) fail('reading ladder stages missing');
  if (!ladderText.includes('Tốc Độ Thi')) fail('reading ladder is missing the speed stage');

  const lockedDisabled = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('button')).filter((b) =>
        (b.textContent || '').includes('Hoàn thành bước trước để mở')
      ).length
  );
  log('stageGating', { lockedStageButtons: lockedDisabled });
  if (lockedDisabled === 0) fail('speed stages should be locked for a new child');

  await page.getByRole('button', { name: /Bắt đầu luyện/ }).first().click(CLICK);
  await page.waitForSelector('text=Đoạn đọc:', { timeout: 20000 });
  const passageVisible = await page.getByText('Đoạn đọc:').count();
  log('readingPassageShown', { passages: passageVisible });
  if (passageVisible === 0) fail('reading passage panel did not render');

  let readingItems = 0;
  for (let i = 0; i < 12; i += 1) {
    const check = page.getByRole('button', { name: /Kiểm tra câu trả lời/ });
    if (!(await check.count())) break;
    await answerCurrentItem(page);
    await check.click(CLICK);
    readingItems += 1;
    await page.waitForTimeout(80);
    const next = page.getByRole('button', { name: /Câu tiếp theo|Xem kết quả/ });
    if (await next.count()) await next.first().click(CLICK);
    await page.waitForTimeout(80);
    if (await page.getByText('Kết quả luyện đọc').count()) break;
  }

  const readingResult = await page.getByText('Kết quả luyện đọc').count();
  log('readingSession', { itemsAnswered: readingItems, resultShown: readingResult > 0 });
  if (!readingResult) fail('reading session did not produce a result screen');

  const readingStore = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('kho_bau_reading_store') || 'null');
    if (!raw) return null;
    return {
      sessions: (raw.metrics || []).length,
      readingIndex: raw.profile && raw.profile.readingIndex,
      stageAccuracy: raw.profile && raw.profile.stageStates && raw.profile.stageStates.ACCURACY.accuracy,
    };
  });
  log('readingPersisted', readingStore || { none: true });
  if (!readingStore || readingStore.sessions === 0) fail('reading metrics were not persisted');

  await snap(page, 'afterReading', state.steps);

  // ---------- 4. COMPETITION ----------
  // T20A / B-04: no child-facing route leads to the arena — the world map only
  // has the 4 subjects + games + review, and the main nav has no "Đấu Trường"
  // item. The only entry left is the Parent Dashboard, so the probe reaches the
  // hub the same way a grown-up does (see openCompetitionHub in qa/lib.mjs).
  await openCompetitionHub(page);
  log('competitionHub', { ok: true });

  await page.getByRole('button', { name: /Vào Thi Thử/ }).first().click(CLICK);
  await page.waitForSelector('role=dialog', { timeout: 20000 });
  await page.waitForTimeout(1200);
  const dialogRaw = await page.locator('[role=dialog]').innerText();
  // innerText reflects CSS text-transform, so compare case-insensitively.
  const dialog = dialogRaw.toLowerCase();
  log('examDialog', {
    hasTimer: /\d\d:\d\d/.test(dialog),
    timerSample: (dialogRaw.match(/\d\d:\d\d/) || ['none'])[0],
    showsQuestionType:
      /trắc nghiệm|đúng \/ sai|điền vào chỗ trống|nối hình ghép đôi|sắp xếp thứ tự|kéo thả vào nhóm|phân loại/.test(
        dialog
      ),
    typeLabel: (
      dialog.match(
        /trắc nghiệm|đúng \/ sai|điền vào chỗ trống|nối hình ghép đôi|sắp xếp thứ tự|kéo thả vào nhóm|phân loại/
      ) || ['none']
    )[0],
  });
  if (!/\d\d:\d\d/.test(dialog)) fail('exam timer not visible');

  let examItems = 0;
  for (let i = 0; i < 24; i += 1) {
    await answerCurrentItem(page);
    examItems += 1;
    const next = page.getByRole('button', { name: /^Câu tiếp$/ });
    if (await next.count()) {
      await next.click(CLICK);
      await page.waitForTimeout(80);
      continue;
    }
    break;
  }
  log('examAnswered', { itemsAnswered: examItems });

  await page.getByRole('button', { name: /^Nộp Bài$/ }).click(CLICK);
  await page.waitForSelector('text=Xác nhận Nộp Bài', { timeout: 12000 });
  await page.getByRole('button', { name: 'Xác nhận Nộp Bài' }).click(CLICK);

  const resultTitle = await page.getByText('KẾT QUẢ BÀI THI').count({ timeout: 20000 });
  log('examResult', { shown: resultTitle > 0 });
  if (!resultTitle) fail('exam result modal did not appear');

  const resultText = (await page.evaluate(() => document.body.innerText)).toLowerCase();
  log('resultBreakdown', {
    hasScoreBreakdown: resultText.includes('bảng phân tích điểm'),
    hasTypeBreakdown: resultText.includes('kết quả theo dạng bài'),
    hasRemediation: resultText.includes('việc nên làm tiếp'),
    hasFairnessNote: resultText.includes('không bị trừ vì bé đọc chậm'),
  });
  if (!resultText.includes('bảng phân tích điểm')) fail('decomposed scoring panel missing');

  try {
    await dismissLevelUpCelebration(page);
      await page.getByRole('button', { name: 'Hoàn Tất' }).click(CLICK);
  } catch (e) {
    log('hoanTatBlocked', await describeBlocker(page, 'button'));
    fail(`"Hoàn Tất" click failed: ${e.message.split('\n')[0]}`);
    throw e;
  }
  await page.waitForTimeout(400);

  // ---------- 4b. WRONG-ANSWER PASS: prove error analysis + remediation render ----------
  {
    const again = page.getByRole('button', { name: /Vào Thi Thử/ }).first();
    if (await again.count()) {
      await again.click(CLICK);
      await page.waitForSelector('role=dialog', { timeout: 20000 });
      // Deliberately pick the LAST option everywhere to force mistakes.
      for (let i = 0; i < 24; i += 1) {
        const opts = page.locator('[data-testid=answer-option]');
        const n = await opts.count();
        if (n === 0) break;
        await opts.nth(n - 1).click(CLICK);
        const next = page.getByRole('button', { name: /^Câu tiếp$/ });
        if (await next.count()) {
          await next.click(CLICK);
          await page.waitForTimeout(70);
          continue;
        }
        break;
      }
      await page.getByRole('button', { name: /^Nộp Bài$/ }).click(CLICK);
      await page.waitForSelector('text=Xác nhận Nộp Bài', { timeout: 12000 });
      await page.getByRole('button', { name: 'Xác nhận Nộp Bài' }).click(CLICK);
      await page.getByText('KẾT QUẢ BÀI THI').count({ timeout: 20000 });

      const wrongText = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      log('errorAnalysisRendered', {
        hasMistakesHeading: wrongText.includes('xem lại các câu cần lưu ý'),
        hasCategoryLabel:
          wrongText.includes('chọn nhanh quá') ||
          wrongText.includes('cần suy luận nhiều bước') ||
          wrongText.includes('cần ôn lại kiến thức') ||
          wrongText.includes('chưa đọc kỹ câu hỏi'),
        hasRemediation: wrongText.includes('việc nên làm tiếp'),
        hasRemediationButton: wrongText.includes('luyện kỹ năng yếu ngay'),
        showsCorrectAnswer: wrongText.includes('đáp án đúng'),
      });
      if (!wrongText.includes('việc nên làm tiếp'))
        fail('error analysis did not render remediation for wrong answers');

      await dismissLevelUpCelebration(page);
    await page.getByRole('button', { name: 'Hoàn Tất' }).click(CLICK);
      await page.waitForTimeout(400);
    } else {
      log('errorAnalysisRendered', { skipped: 'no second exam button' });
    }
  }

  await snap(page, 'afterExams', state.steps);

  // ---------- 5. PARENT MODE ----------
  await page.getByRole('button', { name: /Ba Mẹ/ }).first().click(CLICK);
  await page.waitForSelector('text=Cổng Xác Nhận Phụ Huynh', { timeout: 20000 });
  log('parentGate', { shown: true });

  const gate = await page.evaluate(() => {
    const el = document.querySelector('.bg-slate-100.rounded-2xl');
    return el ? el.textContent.trim() : null;
  });
  const m = gate && gate.match(/(\d+)\s*\+\s*(\d+)/);
  if (!m) fail('could not read the parent gate arithmetic');
  await page.getByRole('spinbutton').fill(String(Number(m[1]) + Number(m[2])), CLICK);
  await page.getByRole('button', { name: 'Mở Bảng Phụ Huynh' }).click(CLICK);
  await page.waitForTimeout(800);
  log('parentUnlocked', { ok: true });

  // Scope to the parent modal so we never hit the app's own navigation.
  const parentModal = page.locator('.fixed.inset-0.z-50').last();
  const readingTabBtn = parentModal.getByRole('button', { name: 'Luyện Đọc', exact: true });
  await readingTabBtn.click(CLICK);
  await page.waitForTimeout(600);
  const readingTab = await page.evaluate(() => document.body.innerText);
  log('parentReadingTab', {
    hasIndex: readingTab.includes('Chỉ số đọc'),
    hasLadder: readingTab.includes('Tiến bộ theo bậc thang'),
    hasAdvice: readingTab.includes('Gợi ý cho ba mẹ về việc đọc'),
    hasDemoBanner: readingTab.includes('DỮ LIỆU THỬ NGHIỆM'),
  });
  if (!readingTab.includes('Tiến bộ theo bậc thang')) fail('parent reading ladder missing');
  if (readingTab.includes('DỮ LIỆU THỬ NGHIỆM')) fail('demo banner shown for a real profile');

  await parentModal.getByRole('button', { name: 'Đấu Trường Thi Thử', exact: true }).click(CLICK);
  await page.waitForTimeout(600);
  const compTab = await page.evaluate(() => document.body.innerText);
  log('parentCompetitionTab', {
    hasExamCount: compTab.includes('Bài thi đã làm'),
    hasLog: compTab.includes('Nhật Ký Các Lần Thi Thử'),
  });

  // ---------- 6. RELOAD + PERSISTENCE ----------
  const read = () =>
    page.evaluate(() => {
      const profile = JSON.parse(localStorage.getItem('kho_bau_child_profile') || '{}');
      const comp = JSON.parse(localStorage.getItem('kho_bau_competition_history') || '{}');
      const readStore = JSON.parse(localStorage.getItem('kho_bau_reading_store') || '{}');
      return {
        xp: profile.xp || 0,
        lessons: (profile.completedLessons || []).length,
        exams: (comp.examResults || []).length,
        readingSessions: (readStore.metrics || []).length,
      };
    });

  state.removals = await page.evaluate(() => window.__removals || []);
  await snap(page, 'afterParent', state.steps);
  const before = await read();
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  const after = await read();

  const persisted =
    JSON.stringify(before) === JSON.stringify(after) &&
    after.xp > 0 &&
    after.lessons > 0 &&
    after.exams > 0 &&
    after.readingSessions > 0;

  // Guard against the harness itself: a different host:port means a different
  // localStorage, which looks identical to "the app lost the child's progress".
  const guard = await page.evaluate(() => ({
    origin: location.origin,
    sentinel: localStorage.getItem('__sentinel'),
  }));
  log('harnessGuard', guard);
  if (guard.sentinel !== 'alive') {
    state.errors.push(
      `HARNESS BUG: storage sentinel lost (origin ${guard.origin}). ` +
        'Do not interpret this as an app persistence failure — the run navigated ' +
        'to a different origin than the one it cleared.'
    );
  } else {
    if (!persisted) fail('progress did not survive a reload');
  }
  log('persistenceAfterReload', { before, after, persisted });

  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  const afterSecond = await read();
  log('noDuplicateRewards', { xpBefore: after.xp, xpAfter: afterSecond.xp });
  if (afterSecond.xp !== after.xp) fail('XP changed on reload');
  if (afterSecond.exams !== after.exams) fail('exam count changed on reload');
}
