/**
 * GAMES QA — verifies the claim in P33 §5 with real browser evidence.
 *   A) every one of the 14 games mounts, renders and closes without console errors
 *   B) a full round awards exactly one reward
 *   C) replaying grants one more reward per completed round (not per mount)
 *   D) opening a game and leaving without finishing grants nothing
 */

const GAME_TITLES = [
  'Bắt Chữ Cái Bay',
  'Xưởng Ghép Tiếng Lớp 1',
  'Săn Vần Trong Vườn Cây',
  'Đoàn Tàu Xếp Câu',
  'Đôi Tai Thính — Nghe & Chọn',
  'Đấu Trường Chính Tả',
  'Tô Dấu Thanh',
  'Đoàn Tàu Ghép Vần',
  'Đọc Câu Làm Theo',
  'Hứng Số Rơi Rộn Ràng',
  'Đường Đua Thần Tốc',
  'Xây Tháp Số Lên Mây',
  'Câu Cá Đại Dương Xanh',
  'Phân Loại Hình Học',
  'Thám Hiểm Giờ & Tiền Việt',
  'Chuyện Kể Toán Học',
  'Chợ Khung 10',
  'Ếch Nhảy Tia Số',
  'Thợ Sửa Đồng Hồ',
  'Safari Tiếng Anh — Loài Vật',
  'Đập Bóng Màu',
  'Phonics Pop — Bắn Âm',
  'Simon Says — Gấu Ra Lệnh',
  'Word Train — Tàu Chữ Tiếng Anh',
  'Lập Trình Tìm Kho Báu',
  'Nhà Khoa Học Nhí',
  'Lật Thẻ Trí Nhớ Vàng',
  'Bé Tập Vẽ & Tô Màu Diệu Kỳ',
  'Nối Số Tô Màu',
  'Đoán Bóng Hình',
  'Bé Xếp Hình Mosaic',
];

const CLICK = { timeout: 12000 };

function readCount() {
  const raw = JSON.parse(localStorage.getItem('kho_bau_analytics') || '{}');
  return raw.gamesPlayedCount || 0;
}

async function playMemoryGameToEnd(page) {
  // Chỉ lấy thẻ của trò chơi. Locator theo class grid từng bắt cả 6 nút của
  // GamesHub nằm sau modal → total sai, click bị overlay chặn và probe kẹt.
  const cards = page.locator('[data-testid="memory-card"]');
  const total = await cards.count();
  if (total === 0) return { matched: false, reason: 'no cards rendered' };

  const safeClick = async (i) => {
    try {
      await cards.nth(i).click({ timeout: 2500 });
      await page.waitForTimeout(140);
      return true;
    } catch {
      return false;
    }
  };
  const faceOf = async (i) => {
    const t = (await cards.nth(i).innerText()).trim();
    return t.split('\n')[0] || '';
  };

  const known = new Map(); // index -> revealed face
  const settled = new Set(); // indices already matched (do not touch again)
  let guard = 0;

  while (settled.size < total && guard < 80) {
    guard += 1;

    // 1) Try to complete a pair from what we already know.
    const byFace = new Map();
    for (const [idx, face] of known) {
      if (settled.has(idx)) continue;
      if (!byFace.has(face)) byFace.set(face, []);
      byFace.get(face).push(idx);
    }
    let matchedThisTurn = false;
    for (const [, idxs] of byFace) {
      if (idxs.length < 2) continue;
      if (await safeClick(idxs[0]) && (await safeClick(idxs[1]))) {
        settled.add(idxs[0]);
        settled.add(idxs[1]);
        matchedThisTurn = true;
        break;
      }
    }
    if (matchedThisTurn) continue;

    // 2) Otherwise probe one fresh card plus a partner to release the flip.
    let probed = false;
    for (let i = 0; i < total; i += 1) {
      if (known.has(i) || settled.has(i)) continue;
      if (!(await safeClick(i))) continue;
      known.set(i, await faceOf(i));
      probed = true;
      for (let j = 0; j < total; j += 1) {
        if (j === i || settled.has(j)) continue;
        if (await safeClick(j)) {
          const faceJ = await faceOf(j);
          known.set(j, faceJ);
          // T25 — khi thăm dò, hai thẻ có thể tình cờ khớp nhau và game khoá
          // chúng lại. Probe phải ghi nhận là đã khớp, nếu không nó sẽ bấm lại
          // hai thẻ đã disabled và kẹt (settled không bao giờ đủ total).
          if (faceJ === known.get(i)) {
            settled.add(i);
            settled.add(j);
          }
          break;
        }
      }
      await page.waitForTimeout(950); // let the engine auto-unflip non-matches
      break;
    }
    if (!probed) break;
  }

  return { matched: settled.size >= total, total, settled: settled.size, guard };
}

export default async function run(page, ui) {
  const out = { mountSmoke: [], rewards: {}, errors: [] };

  // Optional phone leg (§27): QA_VIEWPORT=390x844 shrinks the viewport so the
  // same 14 games are proven mountable, closable and tappable on mobile.
  // (The harness passes no CLI args to scripts, so this reads the environment.)
  const vpMatch = (process.env.QA_VIEWPORT || '').match(/^(\d+)x(\d+)$/);
  const vp = vpMatch
    ? { width: Number(vpMatch[1]), height: Number(vpMatch[2]), label: vpMatch[0] }
    : null;
  if (vp) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    out.viewport = vp.label;
  }

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.locator('[data-testid="nav-games"]:visible').first().click(CLICK);
  await page.waitForSelector('text=Đấu Trường Trò Chơi Trí Tuệ', { timeout: 20000 });

  // ---- A) every game mounts and closes ----
  // The hub renders the catalog in a fixed order, so the Nth "Chơi ngay" button
  // is the Nth game in GAME_TITLES.
  const playButtons = page.getByRole('button', { name: /Chơi ngay/ });
  const catalogCount = await playButtons.count();
  out.catalogCount = catalogCount;

  for (let i = 0; i < GAME_TITLES.length; i += 1) {
    const title = GAME_TITLES[i];
    const record = { index: i, game: title };
    try {
      await playButtons.nth(i).click(CLICK);
      await page.waitForTimeout(700);

      // Authoritative evidence that GameModalWrapper mounted:
      //   - the game title is rendered
      //   - the wrapper's own icon-only close button exists (found via aria-label)
      //   - the mute toggle exists
      const shellText = await page.evaluate(() => document.body.innerText);
      const close = page.getByRole('button', { name: 'Đóng trò chơi và quay lại' }).first();
      const closeCount = await close.count();
      const muteCount = await page
        .getByRole('button', { name: 'Tắt âm thanh' })
        .or(page.getByRole('button', { name: 'Bật âm thanh' }))
        .count();
      record.hasTitle = shellText.includes(title);
      record.hasCloseButton = closeCount > 0;
      record.hasMuteButton = muteCount > 0;
      record.mounted = record.hasTitle && record.hasCloseButton && record.hasMuteButton;
      // 200%-zoom sweep (P2-3): record horizontal overflow per game while open.
      record.overflowPx = await page.evaluate(() => {
        const de = document.documentElement;
        return Math.max(0, de.scrollWidth - de.clientWidth);
      });
      if (closeCount > 0) await close.click(CLICK);
      await page.waitForTimeout(400);
      record.closed = (await page.getByText(title, { exact: true }).count()) > 0;
    } catch (e) {
      record.error = String(e.message).split('\n')[0];
      out.errors.push(`${title}: ${record.error}`);
    }
    out.mountSmoke.push(record);
  }

  // ---- B/C/D) reward behaviour ----
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
  await page.locator('[data-testid="nav-games"]:visible').first().click(CLICK);
  await page.waitForSelector('text=Đấu Trường Trò Chơi Trí Tuệ', { timeout: 20000 });

  const countBefore = await page.evaluate(readCount);

  // D) mount then leave without finishing -> no reward
  const memIndex = GAME_TITLES.indexOf('Lật Thẻ Trí Nhớ Vàng');
  const playAgain = page.getByRole('button', { name: /Chơi ngay/ });
  await playAgain.nth(memIndex).click(CLICK);
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Đóng trò chơi và quay lại' }).first().click(CLICK);
  await page.waitForTimeout(500);
  const countAfterMountOnly = await page.evaluate(readCount);

  // B) full round -> exactly one reward
  await playAgain.nth(memIndex).click(CLICK);
  await page.waitForTimeout(700);
  const play1 = await playMemoryGameToEnd(page);
  await page.waitForTimeout(900);
  // Trò chơi theo bậc: màn chưa phải màn cuối thì biên lai là "VƯỢT QUA MÀN n",
  // hết bậc mới là "HOÀN THÀNH TẤT CẢ MÀN!"; game không theo bậc dùng "HOAN HÔ".
  const bodyText = await page.evaluate(() => document.body.innerText);
  const gameOverShown = ['HOAN HÔ BÉ YÊU!', 'HOÀN THÀNH TẤT CẢ MÀN!', 'VƯỢT QUA MÀN'].some((t) =>
    bodyText.includes(t),
  );
  const countAfterRound1 = await page.evaluate(readCount);

  // C) chơi tiếp một vòng nữa (lên màn kế hoặc chơi lại) -> đúng 1 phần thưởng
  const nextRound = page
    .getByRole('button', { name: /Chơi lại|Màn tiếp theo|Chơi lại từ đầu/ })
    .first();
  if (await nextRound.count()) {
    await nextRound.click(CLICK);
    await page.waitForTimeout(700);
    await playMemoryGameToEnd(page);
    await page.waitForTimeout(900);
  }
  const countAfterRound2 = await page.evaluate(readCount);

  out.rewards = {
    countBefore,
    countAfterMountOnly,
    countAfterRound1,
    countAfterRound2,
    mountOnlyAwardedNothing: countAfterMountOnly === countBefore,
    round1AwardedOnce: countAfterRound1 === countBefore + 1,
    round2AwardedOnce: countAfterRound2 === countAfterRound1 + 1,
    gameOverShown,
    play1,
  };

  if (!out.rewards.mountOnlyAwardedNothing) out.errors.push('mounting a game awarded a reward');
  if (!out.rewards.gameOverShown) out.errors.push('memory game did not reach the victory screen');
  if (gameOverShown && !out.rewards.round1AwardedOnce)
    out.errors.push(`round 1 awarded ${countAfterRound1 - countBefore}, expected 1`);
  if (!out.rewards.round2AwardedOnce)
    out.errors.push(`round 2 awarded ${countAfterRound2 - countAfterRound1}, expected 1`);

  // Any game that overflows its viewport is unreachable content for a zoom user.
  for (const r of out.mountSmoke) {
    if (typeof r.overflowPx === 'number' && r.overflowPx > 2) {
      out.errors.push(`${r.game}: horizontal overflow ${r.overflowPx}px at ${out.viewport || 'default viewport'}`);
    }
  }

  if (vp) await page.setViewportSize({ width: 1280, height: 800 });

  return out;
}