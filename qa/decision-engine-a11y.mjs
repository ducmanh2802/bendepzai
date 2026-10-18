export default async function run(page, ui) {
  const out = { errors: [] };

  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  out.mobile = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="decision-engine-card"]');
    const recs = document.querySelectorAll('[data-testid="decision-recommendation"]').length;
    const btns = Array.from(document.querySelectorAll('[data-testid="decision-engine-card"] button'));
    const tooSmall = btns.filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    }).length;
    return {
      cardVisible: !!card,
      cardWidth: card ? Math.round(card.getBoundingClientRect().width) : 0,
      viewport: window.innerWidth,
      recs,
      buttons: btns.length,
      buttonsUnder44px: tooSmall,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });

  // 200% zoom (emulate via CSS zoom / deviceScaleFactor-like: set viewport small)
  await page.setViewportSize({ width: 640, height: 480 }); // ≈200% of 1280×960 logical
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  out.zoom200 = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="decision-engine-card"]');
    return {
      cardVisible: !!card,
      recs: document.querySelectorAll('[data-testid="decision-recommendation"]').length,
      bodyChars: (document.body.innerText || '').trim().length,
    };
  });

  // Accessibility: roles / labels on decision surfaces
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="decision-engine-card"]', { timeout: 20000 });
  out.a11y = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="decision-engine-card"]');
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map((h) => ({
      tag: h.tagName,
      text: (h.textContent || '').trim().slice(0, 60),
    }));
    const whyBtn = document.querySelector('[data-testid="decision-why-button"]');
    const startBtns = Array.from(
      document.querySelectorAll('[data-testid="decision-recommendation"] button')
    );
    return {
      cardHasHeading: !!card?.querySelector('h1,h2,h3,h4,[role="heading"]'),
      whyButtonName: whyBtn ? (whyBtn.getAttribute('aria-label') || whyBtn.textContent || '').trim() : null,
      whyExpanded: whyBtn ? whyBtn.getAttribute('aria-expanded') : null,
      startButtonsNamed: startBtns.filter((b) =>
        ((b.getAttribute('aria-label') || b.textContent || '').trim().length > 0)
      ).length,
      startButtonsTotal: startBtns.length,
      headingCount: headings.length,
      sampleHeadings: headings.slice(0, 6),
      planHasTitle: (document.body.innerText || '').includes('ÔN TẬP HÔM NAY'),
    };
  });

  return out;
}
