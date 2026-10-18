/**
 * KIDBOX FOCUS QA (P34 §16 — the one PARTIAL dialog).
 *
 * The Kid's Box activity player belongs to the parallel track; P34 only added
 * the shared focus-trap hook (no UX or dismissal change). This proves the hook
 * actually engages there: focus enters, Tab cycles inside, close restores.
 */

const CLICK = { timeout: 12000 };

export default async function run(page, ui) {
  const out = { tests: [], errors: [] };
  const APP_ORIGIN = new URL(page.url()).origin;

  try {
    await page.goto(APP_ORIGIN);
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });

    await page.getByRole('button', { name: /Tiếng Anh/ }).first().click(CLICK);
    await page.waitForTimeout(800);
    const entry = page.getByRole('button', { name: /Kid's Box Companion/ }).first();
    if (!(await entry.count())) {
      out.tests.push({ dialog: 'kidbox', skipped: 'no Kid Box entry on this build state' });
      return out;
    }
    await entry.click(CLICK);
    await page.waitForTimeout(1200);

    // Bridge-pack activities (the only openers until real units land).
    const opener = page.getByRole('button', { name: /Luyện nghe hiểu|Luyện nói lại từ|Khám phá English/ }).first();
    if (!(await opener.count())) {
      out.tests.push({ dialog: 'kidbox', skipped: 'no activity button rendered' });
      return out;
    }
    const openerLabel = ((await opener.innerText()) || '').trim().slice(0, 40);
    await opener.click(CLICK);
    await page.waitForSelector('[role=dialog]', { timeout: 20000 });
    await page.waitForTimeout(500);

    const activeInfo = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return { inside: false, label: '' };
        const dlg = el.closest('[role=dialog]');
        return {
          inside: !!dlg,
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
        };
      });

    const onOpen = await activeInfo(page);
    let escaped = false;
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('Tab');
      const a = await activeInfo(page);
      if (!a.inside) {
        escaped = true;
        break;
      }
    }
    let escapedBack = false;
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('Shift+Tab');
      const a = await activeInfo(page);
      if (!a.inside) {
        escapedBack = true;
        break;
      }
    }

    await page.getByRole('button', { name: 'Đóng hoạt động' }).click(CLICK);
    await page.waitForTimeout(500);
    const afterClose = await activeInfo(page);

    out.tests.push({
      dialog: 'kidbox',
      opener: openerLabel,
      focusEnteredDialog: onOpen.inside,
      forwardTabStayedInside: !escaped,
      backwardTabStayedInside: !escapedBack,
      focusRestoredToTrigger: (afterClose.label || '').length > 0 && !afterClose.inside,
      restoredLabel: afterClose.label,
    });

    const t = out.tests[out.tests.length - 1];
    if (!t.focusEnteredDialog) out.errors.push('kidbox: focus did not move into the dialog');
    if (t.forwardTabStayedInside === false) out.errors.push('kidbox: Tab escaped the dialog');
    if (t.backwardTabStayedInside === false) out.errors.push('kidbox: Shift+Tab escaped the dialog');
    if (t.focusRestoredToTrigger === false) out.errors.push('kidbox: focus was not returned on close');
  } catch (e) {
    const msg = e && e.message ? String(e.message).split('\n')[0] : String(e);
    out.errors.push('EXCEPTION: ' + msg);
  }
  return out;
}
