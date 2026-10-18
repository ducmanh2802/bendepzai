/**
 * MOBILE HOME LAYOUT — real browser, measured (not eyeballed).
 *
 * Phones 360/375/390/412 + tablets 768/1024 + desktop 1280. For each viewport:
 *  - no horizontal page overflow (documentElement.scrollWidth <= innerWidth)
 *  - nothing in <main> sticks out on the left (invisible to scrollWidth)
 *  - every button/tile in <main> keeps its text inside its own box
 *  - subject-card text never lands on a neighbouring card
 *  - header buttons stay on screen and do not overlap each other
 *  - bottom nav (below lg): items do not overlap, labels are not cut, the
 *    last content of the page can be scrolled fully above the nav
 *  - no "new version" banner on a first visit
 *
 * Run: npm run build && node qa/run-one.mjs qa/mobile-home.mjs
 */

const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740 },
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1280x800', width: 1280, height: 800 },
];

function measure() {
  const tol = 1;
  const vw = window.innerWidth;
  const rect = (el) => el.getBoundingClientRect();
  const textRects = (root) => {
    const out = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) out.push({ text: n.textContent.trim().slice(0, 24), l: r.left, r: r.right, t: r.top, b: r.bottom });
    }
    return out;
  };
  const hits = (a, b) => a.left < b.right - tol && a.right > b.left + tol && a.top < b.bottom - tol && a.bottom > b.top + tol;
  const m = { vw, scrollW: document.documentElement.scrollWidth };

  m.leftOverflow = [...document.querySelectorAll('main *')].filter((e) => {
    const r = rect(e);
    return r.width > 0 && r.left < -tol && getComputedStyle(e).position !== 'fixed';
  }).length;

  m.textOutsideTile = [...document.querySelectorAll('main button')]
    .filter((b) => rect(b).width > 0)
    .map((b) => {
      const br = rect(b);
      const out = textRects(b).filter((t) => t.l < br.left - tol || t.r > br.right + tol);
      return out.length ? `${b.getAttribute('aria-label') || b.textContent.trim().slice(0, 24)}: ${out[0].text}` : null;
    })
    .filter(Boolean);

  const cards = [...document.querySelectorAll('main button')].filter((b) => b.textContent.includes('Môn Học Lớp 1'));
  m.subjectCards = cards.length;
  m.cardTextOnNeighbour = 0;
  cards.forEach((a, i) => cards.forEach((b, j) => {
    if (i === j) return;
    const br = rect(b);
    for (const t of textRects(a)) if (hits({ left: t.l, right: t.r, top: t.t, bottom: t.b }, br)) m.cardTextOnNeighbour++;
  }));

  const headerBtns = [...document.querySelectorAll('header button')].filter((b) => rect(b).width > 0 && getComputedStyle(b).display !== 'none');
  m.headerOffscreen = headerBtns.filter((b) => rect(b).left < -tol || rect(b).right > vw + tol).length;
  m.headerOverlaps = [];
  headerBtns.forEach((a, i) => headerBtns.forEach((b, j) => {
    if (j > i && hits(rect(a), rect(b))) m.headerOverlaps.push(`${a.getAttribute('aria-label')} x ${b.getAttribute('aria-label')}`);
  }));

  const nav = document.querySelector('nav[aria-label="Điều hướng nhanh"]');
  m.bottomNav = !!nav && getComputedStyle(nav).display !== 'none';
  if (m.bottomNav) {
    const items = [...nav.querySelectorAll('button')];
    m.navItems = items.length;
    m.navOverlaps = 0;
    items.forEach((a, i) => items.forEach((b, j) => { if (j > i && hits(rect(a), rect(b))) m.navOverlaps++; }));
    m.navLabelsCut = items
      .map((b) => b.querySelector('span:last-child'))
      .filter((l) => l.scrollWidth > l.clientWidth + 1 || textRects(l.parentElement).some((t) => t.l < rect(l.parentElement).left - tol || t.r > rect(l.parentElement).right + tol))
      .map((l) => l.textContent);
    m.navMinTouch = Math.min(...items.map((b) => Math.min(rect(b).width, rect(b).height)));
  }
  m.updateBanner = document.querySelectorAll('[data-testid="update-banner"]').length;
  return m;
}

function lastContentGap() {
  window.scrollTo(0, document.documentElement.scrollHeight);
  const nav = document.querySelector('nav[aria-label="Điều hướng nhanh"]');
  if (!nav || getComputedStyle(nav).display === 'none') return null;
  const all = [...document.querySelectorAll('main *')].filter((e) => e.getBoundingClientRect().height > 0);
  const lastBottom = Math.max(...all.map((e) => e.getBoundingClientRect().bottom));
  return Math.round(nav.getBoundingClientRect().top - lastBottom);
}

export default async function run(page, ui) {
  const errors = [];
  const results = {};
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(ui.origin + '/');
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    await page.waitForTimeout(600);
    const m = await page.evaluate(measure);
    m.lastContentGap = await page.evaluate(lastContentGap);
    results[vp.name] = m;
    const e = (msg) => errors.push(`${vp.name}: ${msg}`);
    if (m.scrollW > m.vw) e(`horizontal overflow ${m.scrollW - m.vw}px`);
    if (m.leftOverflow) e(`${m.leftOverflow} element(s) stick out on the left`);
    if (m.textOutsideTile.length) e(`text outside its tile: ${m.textOutsideTile.join(' | ')}`);
    if (m.subjectCards !== 4) e(`expected 4 subject cards, found ${m.subjectCards}`);
    if (m.cardTextOnNeighbour) e(`subject-card text on a neighbouring card (${m.cardTextOnNeighbour})`);
    if (m.headerOffscreen) e(`${m.headerOffscreen} header button(s) off screen`);
    if (m.headerOverlaps.length) e(`header overlap: ${m.headerOverlaps.join(', ')}`);
    if (m.bottomNav) {
      if (m.navItems !== 5) e(`bottom nav has ${m.navItems} items`);
      if (m.navOverlaps) e(`bottom nav items overlap (${m.navOverlaps})`);
      if (m.navLabelsCut.length) e(`bottom nav labels cut: ${m.navLabelsCut.join(', ')}`);
      if (m.navMinTouch < 44) e(`bottom nav touch target ${m.navMinTouch}px < 44px`);
      if (m.lastContentGap === null || m.lastContentGap < 0) e(`last content hidden behind bottom nav (gap ${m.lastContentGap}px)`);
    }
    if (m.updateBanner) e('update banner shown on a first visit');
  }
  return { ok: errors.length === 0, errors, results };
}
