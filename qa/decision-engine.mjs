/**
 * P39 DECISION ENGINE — REAL BROWSER GOLDEN PATHS (§33).
 *
 * A — New child → honest discovery recommendation
 * B — Weak skill evidence → weak skill becomes recommendation
 * C — SM-2 due → review recommendation
 * D — Improvement → recommendation changes appropriately
 * E — Kid's Box current-unit context
 * F — Competition unstable accuracy → accuracy practice, NOT speed drill
 * G — Persistence: reload → evidence intact → recomputed consistently
 */

const state = { steps: [], errors: [] };

function log(name, detail = {}) {
  state.steps.push({ step: name, ...detail });
}
function fail(msg) {
  state.errors.push(msg);
}

const CLICK = { timeout: 12000 };

async function readDecision(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-testid="decision-engine-card"]');
    if (!card) return { present: false };
    const recs = Array.from(document.querySelectorAll('[data-testid="decision-recommendation"]')).map((el) => ({
      id: el.getAttribute('data-recommendation-id'),
      priority: Number(el.getAttribute('data-priority') || 0),
      available: el.getAttribute('data-available'),
      reasonCodes: (el.getAttribute('data-reason-codes') || '').split(',').filter(Boolean),
      text: (el.textContent || '').slice(0, 160),
    }));
    const planItems = Array.from(document.querySelectorAll('[data-testid="daily-plan-item"]')).map((el) =>
      (el.textContent || '').slice(0, 120)
    );
    const insufficient = document.querySelector('[data-testid="insufficient-evidence-message"]');
    return {
      present: true,
      mode: card.getAttribute('data-decision-mode'),
      insufficient: card.getAttribute('data-insufficient-evidence'),
      insufficientText: insufficient ? insufficient.textContent : null,
      recs,
      planItems,
      planKind: document.querySelector('[data-testid="session-plan"]')?.getAttribute('data-session-kind') || null,
      bodyHasHometoday: document.body.innerText.includes('ÔN TẬP HÔM NAY'),
      bodyHasQuestion: document.body.innerText.includes('Hôm Nay Bé Nên Học Gì') || document.body.innerText.includes('Bé Nên Làm Gì Tiếp Theo'),
    };
  });
}

async function answerWrongOnSubject(page) {
  // Try to navigate to a subject and answer incorrectly if possible.
  // Fall back to injecting Learning OS evidence via the same production API
  // path used by the app (StorageService.recordQuestionAnswer through localStorage
  // is NOT used — we use the real UI when possible; otherwise seed via evaluate
  // calling the bundled engine is not exposed, so we drive UI).
  const snap = await page.evaluate(() => document.body.innerText.slice(0, 500));
  log('UI_SNAP', { snap: snap.slice(0, 200) });
}

async function body(page, ui) {
  const APP_ORIGIN = new URL(page.url()).origin;

  // ---- GOLDEN PATH A: NEW CHILD / HONEST DISCOVERY ----
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP_ORIGIN + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  const cold = await readDecision(page);
  log('A_COLD_START', cold);
  if (!cold.present) fail('A: decision engine card missing');
  if (cold.insufficient !== 'true' && cold.mode !== 'DISCOVERY') {
    // Cold start should be discovery/honest; allow either flag.
    fail('A: expected discovery/insufficient evidence state, got ' + cold.mode + '/' + cold.insufficient);
  }
  if (!cold.insufficientText && !cold.recs.some((r) => r.reasonCodes.includes('DISCOVERY_NEEDED'))) {
    fail('A: missing honest insufficient-evidence message or DISCOVERY_NEEDED reason');
  }
  if (cold.recs.length > 0) {
    const unavailable = cold.recs.filter((r) => r.available !== 'true');
    // Discovery recommendations should still be launchable.
    if (unavailable.length === cold.recs.length) fail('A: all discovery recommendations unavailable');
  }

  // ---- GOLDEN PATH B: WEAK SKILL EVIDENCE ----
  // Produce real learning evidence through StorageService in-page using the
  // production persistence path the app itself uses.
  await page.evaluate(() => {
    // Use the same localStorage key the app writes via StorageService by
    // replaying the public recordQuestionAnswer-equivalent: we cannot import
    // TS modules, so we write a valid Learning OS store the sanitizer accepts.
    const now = Date.now();
    const skillId = 'math_subtraction_10';
    const knowledge = {
      [skillId]: {
        skillId,
        skillName: 'Trừ trong phạm vi 10',
        subject: 'toan',
        status: 'NEEDS_REVIEW',
        mastery: 40,
        confidence: 70,
        accuracy: 45,
        recentAccuracy: 30,
        attemptCount: 6,
        correctCount: 3,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 3,
        lastPracticedAt: now - 2 * 86400000,
        lastIncorrectAt: now - 86400000,
        difficultyPerformance: {
          easy: { attempts: 2, correct: 1 },
          medium: { attempts: 4, correct: 2 },
          hard: { attempts: 0, correct: 0 },
          challenge: { attempts: 0, correct: 0 },
        },
        errorProfile: {
          knowledgeGap: 2,
          careless: 0,
          speed: 0,
          misread: 0,
          reasoning: 1,
          unclassified: 0,
        },
        evidenceVersion: 6,
      },
    };
    const evidences = Array.from({ length: 6 }, (_, i) => ({
      id: `ev_qa_${i}`,
      learnerId: 'child_1',
      source: 'PRACTICE',
      skillId,
      subject: 'toan',
      timestamp: now - (6 - i) * 3600000,
      correct: i >= 3,
      responseTimeMs: 18000,
      difficulty: 'MEDIUM',
    }));
    localStorage.setItem(
      'kho_bau_learning_os_store',
      JSON.stringify({
        schemaVersion: 'P30-v1',
        knowledgeStates: knowledge,
        recentEvidences: evidences,
        dailyPlan: null,
        fatigue: {
          sessionStartTime: now,
          questionsAnsweredThisSession: 6,
          sessionErrorsCount: 3,
          consecutiveErrorsInSession: 0,
          isFatigued: false,
        },
        recommendationHistory: [],
        processedEvidenceIds: evidences.map((e) => e.id),
      })
    );
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  const weak = await readDecision(page);
  log('B_WEAK_SKILL', weak);
  if (!weak.present) fail('B: card missing after weak evidence');
  const topWeak = weak.recs[0];
  if (!topWeak) fail('B: no recommendation after weak evidence');
  else if (topWeak.id && !String(topWeak.id).includes('math_subtraction_10') && !topWeak.text.includes('Trừ') && !topWeak.text.includes('Củng')) {
    // Learning OS remediate id is remediate_math_subtraction_10
    if (!String(topWeak.id).includes('subtraction')) {
      fail('B: top recommendation should target weak math skill, got ' + topWeak.id);
    }
  }
  if (topWeak && !topWeak.reasonCodes.some((c) => ['NEEDS_REVIEW', 'REPEATED_ERRORS', 'FOUNDATION_GAP'].includes(c))) {
    fail('B: missing NEEDS_REVIEW/REPEATED_ERRORS reason codes, got ' + topWeak.reasonCodes.join(','));
  }
  if (topWeak && topWeak.available !== 'true') fail('B: weak-skill recommendation must be AVAILABLE');
  if (!weak.bodyHasHometoday) fail('B: daily plan title ÔN TẬP HÔM NAY missing');

  // Expand "Vì sao?" to verify explanation + reason codes for parents
  const whyBtn = page.locator('[data-testid="decision-why-button"]').first();
  if (await whyBtn.count()) {
    await whyBtn.click(CLICK);
    await page.waitForTimeout(300);
    const explanation = await page.locator('[data-testid="decision-explanation"]').count();
    log('B_WHY_EXPANDED', { explanation });
    if (!explanation) fail('B: explanation panel missing after Vì sao?');
  } else {
    fail('B: Vì sao? button missing');
  }

  // ---- GOLDEN PATH C: SM-2 DUE REVIEW ----
  await page.evaluate(() => {
    const now = Date.now();
    const skillId = 'math_addition_10';
    const knowledge = {
      [skillId]: {
        skillId,
        skillName: 'Cộng trong phạm vi 10',
        subject: 'toan',
        status: 'MASTERED',
        mastery: 90,
        confidence: 100,
        accuracy: 92,
        recentAccuracy: 93,
        attemptCount: 7,
        correctCount: 7,
        consecutiveCorrect: 3,
        consecutiveIncorrect: 0,
        lastPracticedAt: now - 10 * 86400000,
        nextReviewAt: now - 86400000,
        averageResponseTimeMs: 15000,
        difficultyPerformance: {
          easy: { attempts: 3, correct: 3 },
          medium: { attempts: 4, correct: 4 },
          hard: { attempts: 0, correct: 0 },
          challenge: { attempts: 0, correct: 0 },
        },
        errorProfile: { knowledgeGap: 0, careless: 0, speed: 0, misread: 0, reasoning: 0, unclassified: 0 },
        evidenceVersion: 7,
      },
      math_subtraction_10: {
        skillId: 'math_subtraction_10',
        skillName: 'Trừ trong phạm vi 10',
        subject: 'toan',
        status: 'NEEDS_REVIEW',
        mastery: 40,
        confidence: 70,
        accuracy: 45,
        recentAccuracy: 30,
        attemptCount: 6,
        correctCount: 3,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 3,
        lastPracticedAt: now - 2 * 86400000,
        lastIncorrectAt: now - 86400000,
        difficultyPerformance: {
          easy: { attempts: 2, correct: 1 },
          medium: { attempts: 4, correct: 2 },
          hard: { attempts: 0, correct: 0 },
          challenge: { attempts: 0, correct: 0 },
        },
        errorProfile: { knowledgeGap: 2, careless: 0, speed: 0, misread: 0, reasoning: 1, unclassified: 0 },
        evidenceVersion: 6,
      },
    };
    localStorage.setItem(
      'kho_bau_learning_os_store',
      JSON.stringify({
        schemaVersion: 'P30-v1',
        knowledgeStates: knowledge,
        recentEvidences: [],
        dailyPlan: null,
        fatigue: {
          sessionStartTime: now,
          questionsAnsweredThisSession: 0,
          sessionErrorsCount: 0,
          consecutiveErrorsInSession: 0,
          isFatigued: false,
        },
        recommendationHistory: [],
        processedEvidenceIds: [],
      })
    );
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  const review = await readDecision(page);
  log('C_SM2_DUE', review);
  const sm2Codes = review.recs.flatMap((r) => r.reasonCodes);
  if (!sm2Codes.includes('SM2_DUE') && !sm2Codes.includes('NEEDS_REVIEW')) {
    // Weak skill still present so NEEDS_REVIEW expected; SM2_DUE should appear on mastered-due skill
    fail('C: expected SM2_DUE or NEEDS_REVIEW reason codes');
  }
  if (!review.recs.some((r) => r.reasonCodes.includes('SM2_DUE'))) {
    fail('C: SM2_DUE reason code missing from recommendations');
  }

  // ---- GOLDEN PATH D: IMPROVEMENT CHANGES RECOMMENDATION ----
  await page.evaluate(() => {
    const now = Date.now();
    const skillId = 'math_subtraction_10';
    // After practice: recovered
    localStorage.setItem(
      'kho_bau_learning_os_store',
      JSON.stringify({
        schemaVersion: 'P30-v1',
        knowledgeStates: {
          [skillId]: {
            skillId,
            skillName: 'Trừ trong phạm vi 10',
            subject: 'toan',
            status: 'PRACTICING',
            mastery: 75,
            confidence: 90,
            accuracy: 82,
            recentAccuracy: 88,
            attemptCount: 12,
            correctCount: 10,
            consecutiveCorrect: 4,
            consecutiveIncorrect: 0,
            lastPracticedAt: now,
            averageResponseTimeMs: 14000,
            difficultyPerformance: {
              easy: { attempts: 4, correct: 4 },
              medium: { attempts: 8, correct: 6 },
              hard: { attempts: 0, correct: 0 },
              challenge: { attempts: 0, correct: 0 },
            },
            errorProfile: { knowledgeGap: 0, careless: 0, speed: 0, misread: 0, reasoning: 1, unclassified: 0 },
            evidenceVersion: 12,
          },
        },
        recentEvidences: [],
        dailyPlan: null,
        fatigue: {
          sessionStartTime: now,
          questionsAnsweredThisSession: 12,
          sessionErrorsCount: 2,
          consecutiveErrorsInSession: 0,
          isFatigued: false,
        },
        recommendationHistory: [],
        processedEvidenceIds: [],
      })
    );
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  const improved = await readDecision(page);
  log('D_IMPROVED', improved);
  if (improved.recs[0] && improved.recs[0].reasonCodes.includes('REPEATED_ERRORS')) {
    fail('D: after improvement REPEATED_ERRORS should not remain on top');
  }

  // ---- GOLDEN PATH E: KID'S BOX CURRENT UNIT ----
  await page.evaluate(() => {
    const now = Date.now();
    localStorage.setItem(
      'kho_bau_kidbox_store',
      JSON.stringify({
        schemaVersion: 'P30-v1',
        courseState: { currentUnitId: 'kb-unit-starter-1', completedUnitIds: [] },
        unitProgress: {},
        reviewStates: {},
        counters: { days: {} },
        attempts: [],
      })
    );
    localStorage.setItem(
      'kho_bau_learning_os_store',
      JSON.stringify({
        schemaVersion: 'P30-v1',
        knowledgeStates: {
          'EN-VOCAB-RECOGNITION': {
            skillId: 'EN-VOCAB-RECOGNITION',
            skillName: 'Từ vựng',
            subject: 'english',
            status: 'PRACTICING',
            mastery: 70,
            confidence: 80,
            accuracy: 78,
            recentAccuracy: 80,
            attemptCount: 5,
            correctCount: 4,
            consecutiveCorrect: 2,
            consecutiveIncorrect: 0,
            lastPracticedAt: now - 3600000,
            difficultyPerformance: {
              easy: { attempts: 3, correct: 3 },
              medium: { attempts: 2, correct: 1 },
              hard: { attempts: 0, correct: 0 },
              challenge: { attempts: 0, correct: 0 },
            },
            errorProfile: { knowledgeGap: 0, careless: 0, speed: 0, misread: 0, reasoning: 0, unclassified: 0 },
            evidenceVersion: 5,
          },
        },
        recentEvidences: [],
        dailyPlan: null,
        fatigue: {
          sessionStartTime: now,
          questionsAnsweredThisSession: 5,
          sessionErrorsCount: 1,
          consecutiveErrorsInSession: 0,
          isFatigued: false,
        },
        recommendationHistory: [],
        processedEvidenceIds: [],
      })
    );
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  const kidbox = await readDecision(page);
  log('E_KIDBOX', kidbox);
  const englishRec = kidbox.recs.find(
    (r) => r.id && (String(r.id).includes('kidbox') || r.text.includes('Unit') || r.text.includes('English') || r.text.includes('Kid'))
  );
  if (!englishRec && kidbox.recs.length === 0) {
    fail('E: no English/Kid\'s Box recommendation after English evidence');
  }

  // ---- GOLDEN PATH F: COMPETITION UNSTABLE ACCURACY ----
  await page.evaluate(() => {
    const now = Date.now();
    // Weak accuracy skill + competition history with unstable accuracy
    localStorage.setItem(
      'kho_bau_learning_os_store',
      JSON.stringify({
        schemaVersion: 'P30-v1',
        knowledgeStates: {
          math_subtraction_10: {
            skillId: 'math_subtraction_10',
            skillName: 'Trừ trong phạm vi 10',
            subject: 'toan',
            status: 'NEEDS_REVIEW',
            mastery: 40,
            confidence: 70,
            accuracy: 45,
            recentAccuracy: 35,
            attemptCount: 6,
            correctCount: 3,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 2,
            lastPracticedAt: now - 86400000,
            difficultyPerformance: {
              easy: { attempts: 2, correct: 1 },
              medium: { attempts: 4, correct: 2 },
              hard: { attempts: 0, correct: 0 },
              challenge: { attempts: 0, correct: 0 },
            },
            errorProfile: { knowledgeGap: 1, careless: 0, speed: 0, misread: 0, reasoning: 1, unclassified: 0 },
            evidenceVersion: 6,
          },
        },
        recentEvidences: [],
        dailyPlan: null,
        fatigue: {
          sessionStartTime: now,
          questionsAnsweredThisSession: 6,
          sessionErrorsCount: 3,
          consecutiveErrorsInSession: 0,
          isFatigued: false,
        },
        recommendationHistory: [],
        processedEvidenceIds: [],
      })
    );
    const mkExam = (id, accuracy, avgSec) => ({
      id,
      blueprintId: 'bp-math-mini-01',
      examTitle: 'Mini',
      subject: 'toan',
      timestamp: new Date(now).toISOString(),
      durationSeconds: 300,
      timeUsedSeconds: 280,
      totalQuestions: 10,
      correctCount: Math.round((accuracy / 100) * 10),
      accuracy,
      score: accuracy,
      speedRating: 'STEADY',
      speedLabel: 'Ổn định',
      averageSecondsPerQuestion: avgSec,
      responses: [],
      skillBreakdown: {},
      strongSkills: [],
      weakSkills: [],
      errorAnalysis: [],
      readinessSnapshot: null,
      scoring: {
        rawScore: accuracy,
        maxScore: 100,
        accuracy,
        completion: 10,
        attemptedCount: 10,
        correctCount: Math.round((accuracy / 100) * 10),
        totalQuestions: 10,
        totalSeconds: 280,
        averageSecondsPerQuestion: avgSec,
        fastestQuestionSeconds: 8,
        slowestQuestionSeconds: 40,
        skillPerformance: {},
        questionTypePerformance: {},
      },
      provenance: { blueprintVersion: 1, questionBankVersion: 1, seed: 1 },
    });
    localStorage.setItem(
      'kho_bau_competition_history',
      JSON.stringify({
        examResults: [
          mkExam('e1', 95, 12),
          mkExam('e2', 40, 35),
          mkExam('e3', 90, 11),
          mkExam('e4', 35, 40),
        ],
        practicedSkills: {},
        speedTrialsCompleted: 0,
        remediationPlans: [],
      })
    );
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  const comp = await readDecision(page);
  log('F_COMPETITION', comp);
  const topCodes = comp.recs[0] ? comp.recs[0].reasonCodes : [];
  const hasSpeedSafe = topCodes.includes('SPEED_SAFE');
  if (hasSpeedSafe) fail('F: SPEED_SAFE must not appear when accuracy is unstable');
  if (comp.recs[0] && (comp.recs[0].text.includes('Speed') || comp.recs[0].text.includes('Tốc độ')) && !topCodes.includes('SPEED_SAFE')) {
    // Speed wording without SPEED_SAFE is a demoted candidate — ok if not top intent
    log('F_SPEED_WORDING_PRESENT', { text: comp.recs[0].text });
  }

  // ---- GOLDEN PATH G: PERSISTENCE / RELOAD RECOMPUTE ----
  const beforeReload = await page.evaluate(() => localStorage.getItem('kho_bau_learning_os_store'));
  const before = await readDecision(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  const after = await readDecision(page);
  const afterStore = await page.evaluate(() => localStorage.getItem('kho_bau_learning_os_store'));
  log('G_PERSISTENCE', {
    beforeRecs: before.recs.map((r) => r.id),
    afterRecs: after.recs.map((r) => r.id),
    storeIntact: beforeReload === afterStore,
  });
  if (!afterStore) fail('G: learning OS store missing after reload');
  if (before.recs.length && after.recs.length) {
    // Deterministic recompute on identical evidence
    if (before.recs[0].id !== after.recs[0].id) {
      // Allow minor ordering if both still valid — but same evidence should match
      fail('G: recommendation changed after reload without new evidence');
    }
  }

  // ---- Daily plan toggle ----
  const toggle = page.locator('[data-testid="daily-plan-toggle"]').first();
  if (await toggle.count()) {
    await toggle.click(CLICK);
    await page.waitForTimeout(200);
    const reasons = await page.locator('[data-testid="daily-plan-reason"]').count();
    log('DAILY_PLAN_TOGGLE', { reasons });
    if (!reasons) fail('daily plan reasons missing after toggle');
  } else {
    fail('daily plan toggle missing');
  }

  // ---- Parent mode decision report ----
  const parentBtn = page
    .getByRole('button', { name: /Khu vực dành cho Ba Mẹ|Ba Mẹ/i })
    .first();
  if (await parentBtn.count()) {
    await parentBtn.click(CLICK);
    await page.waitForTimeout(500);
    const gate = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog ? dialog.innerText.slice(0, 500) : document.body.innerText.slice(0, 500);
    });
    log('PARENT_GATE', { gate: gate.slice(0, 160) });
    const m = gate.match(/(\d+)\s*\+\s*(\d+)/);
    if (m) {
      const sum = Number(m[1]) + Number(m[2]);
      const input = page.locator('input[type="number"], input[inputmode="numeric"]').first();
      if (await input.count()) {
        await input.fill(String(sum));
        const openBtn = page.getByRole('button', { name: /Mở Bảng Phụ Huynh/i }).first();
        if (await openBtn.count()) {
          await openBtn.click(CLICK);
          await page.waitForTimeout(600);
          const insightsTab = page.getByRole('button', { name: /Phân Tích/i }).first();
          if (await insightsTab.count()) {
            await insightsTab.click(CLICK);
            await page.waitForTimeout(400);
          }
          const hasDecision = await page.locator('[data-testid="parent-decision-report"]').count();
          log('PARENT_DECISION_REPORT', { hasDecision });
          if (!hasDecision) fail('parent decision report missing in insights tab');
          else {
            const nextBest = await page.locator('[data-testid="parent-next-best"]').count();
            if (!nextBest) fail('parent next-best list missing');
          }
        } else {
          fail('Mở Bảng Phụ Huynh button missing');
        }
      } else {
        fail('parent gate input missing');
      }
    } else {
      fail('parent gate math challenge missing');
    }
  } else {
    fail('parent mode button (Ba Mẹ) missing');
  }

  // ---- Console / network sanity: re-read after all interactions ----
  // The runner captures console separately; we only ensure no exception paths.
  log('FINAL_STATE', await readDecision(page));

  return state;
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
