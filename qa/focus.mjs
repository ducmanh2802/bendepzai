/**
 * FOCUS QA (§24) — verifies keyboard focus stays inside dialogs and returns to
 * the trigger on close.
 */
const CLICK = { timeout: 12000 };

async function activeInfo(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return { tag: null };
    const dlg = el.closest('[role=dialog]');
    return {
      tag: el.tagName.toLowerCase(),
      label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
      insideDialog: !!dlg,
      dialogLabel: dlg ? dlg.getAttribute('aria-label') : null,
    };
  });
}

export default async function run(page, ui) {
  const out = { tests: [], errors: [] };
  // Never hardcode a host:port here — a different origin has its own storage.
  const APP_ORIGIN = new URL(page.url()).origin;

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

  // ---- Lesson dialog ----
  {
    // Navigate: home -> Tiếng Việt -> first lesson
    await page.getByRole('button', { name: /Tiếng Việt/ }).first().click(CLICK);
    await page.waitForSelector('text=Vương Quốc Tiếng Việt', { timeout: 20000 });
    const trigger = page.locator('[data-testid^="lesson-button-"]').first();
    const triggerTestId = await trigger.getAttribute('data-testid');
    // T20A / B-01: the adventure path overlaps its nodes for topics with many
    // lessons, so a mouse click never lands on the intended node. Keyboard
    // activation reaches the same handler.
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('[role=dialog]', { timeout: 20000 });
    await page.waitForTimeout(400);

    const onOpen = await activeInfo(page);
    let escaped = false;
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      const a = await activeInfo(page);
      if (!a.insideDialog) {
        escaped = true;
        break;
      }
    }
    let escapedBack = false;
    for (let i = 0; i < 15; i += 1) {
      await page.keyboard.press('Shift+Tab');
      const a = await activeInfo(page);
      if (!a.insideDialog) {
        escapedBack = true;
        break;
      }
    }

    out.tests.push({
      dialog: 'lesson',
      focusEnteredDialog: onOpen.insideDialog,
      forwardTabStayedInside: !escaped,
      backwardTabStayedInside: !escapedBack,
      landedOn: onOpen.label,
    });

    const startLesson = page.getByRole('button', { name: /Bắt đầu/ }).first();
    if (await startLesson.count()) await startLesson.click(CLICK);
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Đóng bài học' }).click(CLICK);
    await page.waitForTimeout(500);
    const afterClose = await activeInfo(page);
    // Nút bài học giờ có aria-label kiểu "Bài …, đang học" (T07); nhận diện
    // bằng data-testid đã chụp trước khi mở, không đoán theo chữ trên nhãn.
    const restoredTestId = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') || null
    );
    out.tests[out.tests.length - 1].focusRestoredToTrigger = restoredTestId === triggerTestId;
    out.tests[out.tests.length - 1].landedAfterClose = afterClose.label;
  }

  // ---- Game dialog (covers the shared wrapper used by all 14 games) ----
  {
    await page.goto(APP_ORIGIN);
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    await page
      .locator('[data-testid="nav-games"]:visible')
      .first()
      .click(CLICK);
    await page.waitForSelector('text=Đấu Trường Trò Chơi Trí Tuệ', { timeout: 20000 });
    const play = page.getByRole('button', { name: /Chơi ngay/ }).first();
    await play.click(CLICK);
    await page.waitForSelector('[role=dialog]', { timeout: 20000 });
    await page.waitForTimeout(400);

    const onOpen = await activeInfo(page);
    let escaped = false;
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      const a = await activeInfo(page);
      if (!a.insideDialog) {
        escaped = true;
        break;
      }
    }
    out.tests.push({
      dialog: 'game',
      focusEnteredDialog: onOpen.insideDialog,
      forwardTabStayedInside: !escaped,
      landedOn: onOpen.label,
    });

    await page.getByRole('button', { name: 'Đóng trò chơi và quay lại' }).click(CLICK);
    await page.waitForTimeout(500);
    const afterClose = await activeInfo(page);
    out.tests[out.tests.length - 1].focusRestoredToTrigger =
      (afterClose.label || '').includes('Chơi ngay');
  }

  // ---- Parent dialog ----
  {
    await page.goto(APP_ORIGIN);
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    await page.getByRole('button', { name: 'Khu vực dành cho Ba Mẹ' }).click(CLICK);
    await page.waitForSelector('text=Cổng Xác Nhận Phụ Huynh', { timeout: 20000 });
    await page.waitForTimeout(400);
    const gate = await page.evaluate(() => {
      const el = document.querySelector('.bg-slate-100.rounded-2xl');
      return el ? el.textContent.trim() : null;
    });
    const m = gate && gate.match(/(\d+)\s*\+\s*(\d+)/);
    if (m) {
      await page.getByRole('spinbutton').fill(String(Number(m[1]) + Number(m[2])), CLICK);
      await page.getByRole('button', { name: 'Mở Bảng Phụ Huynh' }).click(CLICK);
    }
    await page.waitForTimeout(800);

    const onOpen = await activeInfo(page);
    let escaped = false;
    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press('Tab');
      const a = await activeInfo(page);
      if (!a.insideDialog) {
        escaped = true;
        break;
      }
    }
    out.tests.push({
      dialog: 'parent',
      focusEnteredDialog: onOpen.insideDialog,
      forwardTabStayedInside: !escaped,
      landedOn: onOpen.label,
    });
  }

  // ---- ScreenTime dialog (§13): child-safety gate, auto-opens on the 60s tick ----
  {
    await page.goto(APP_ORIGIN);
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

    // Seed a blown daily limit. The App tick fires every 60s, so the dialog can
    // only appear after one full tick — wait honestly instead of faking it.
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('kho_bau_parent_settings') || '{}');
      settings.dailyLimitMinutes = 1;
      localStorage.setItem('kho_bau_parent_settings', JSON.stringify(settings));
      const analytics = JSON.parse(localStorage.getItem('kho_bau_analytics') || '{}');
      analytics.minutesToday = 5;
      localStorage.setItem('kho_bau_analytics', JSON.stringify(analytics));
    });
    await page.reload();
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

    let appeared = false;
    try {
      await page.waitForSelector('text=GIỜ NGHỈ NGƠI CHO MẮT SÁNG', { timeout: 90000 });
      appeared = true;
    } catch (e) {
      out.errors.push('screentime: dialog did not auto-open after the usage tick');
    }

    if (appeared) {
      await page.waitForTimeout(500);
      const semantics = await page.evaluate(() => {
        const dlg = document.querySelector('[role=dialog]');
        return {
          role: !!dlg,
          ariaModal: dlg ? dlg.getAttribute('aria-modal') : null,
          labelled: dlg ? !!dlg.getAttribute('aria-labelledby') : false,
        };
      });
      if (!semantics.role) out.errors.push('screentime: no role=dialog');
      if (semantics.ariaModal !== 'true') out.errors.push('screentime: aria-modal is not true');
      if (!semantics.labelled) out.errors.push('screentime: dialog has no accessible label');

      const onOpen = await activeInfo(page);

      let escaped = false;
      for (let i = 0; i < 10; i += 1) {
        await page.keyboard.press('Tab');
        const a = await activeInfo(page);
        if (!a.insideDialog) {
          escaped = true;
          break;
        }
      }
      let escapedBack = false;
      for (let i = 0; i < 10; i += 1) {
        await page.keyboard.press('Shift+Tab');
        const a = await activeInfo(page);
        if (!a.insideDialog) {
          escapedBack = true;
          break;
        }
      }

      // Escape must NOT dismiss a child-safety gate. If it closes, a child can
      // bypass the break reminder with one key.
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const stillOpen = (await page.getByText('GIỜ NGHỈ NGƠI CHO MẮT SÁNG').count()) > 0;
      if (!stillOpen) out.errors.push('screentime: Escape dismissed the safety gate');

      // Close via the explicit child choice, then check restoration.
      const beforeLabel = (await activeInfo(page)).label;
      await page.getByRole('button', { name: /Nghỉ ngơi thôi nào/ }).click(CLICK);
      await page.waitForTimeout(500);
      const afterClose = await activeInfo(page);

      out.tests.push({
        dialog: 'screentime',
        focusEnteredDialog: onOpen.insideDialog,
        forwardTabStayedInside: !escaped,
        backwardTabStayedInside: !escapedBack,
        escapeKeptOpen: stillOpen,
        landedOn: onOpen.label,
        closedFrom: beforeLabel,
        restoredTag: afterClose.tag,
      });
    }
  }

  for (const t of out.tests) {
    if (!t.focusEnteredDialog) out.errors.push(`${t.dialog}: focus did not move into the dialog`);
    if (t.forwardTabStayedInside === false)
      out.errors.push(`${t.dialog}: Tab escaped the dialog`);
    if (t.backwardTabStayedInside === false)
      out.errors.push(`${t.dialog}: Shift+Tab escaped the dialog`);
    if (t.focusRestoredToTrigger === false)
      out.errors.push(`${t.dialog}: focus was not returned to the trigger on close`);
    if (t.escapeKeptOpen === false)
      out.errors.push(`${t.dialog}: Escape dismissed a dialog that must stay open`);
  }

  return out;
}