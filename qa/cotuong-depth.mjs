// T30 — bằng chứng nhìn thấy được: quân cờ phải NỔI trên mặt bàn.
// Bản lỗi: bóng tiếp đất nằm lọt trong lòng quân (inset 16% 8% -2% 8%) và đế
// cùng kích thước với mặt quân nên quân trông như dán phẳng lên mặt bàn.
// Probe đo 3 thứ trên bản build thật:
//   1. thứ tự vẽ: mặt quân phải nằm TRÊN lưới (lưới không cắt qua quân);
//   2. hình học: đế (thành quân) phải thò xuống dưới mặt quân;
//   3. pixel: ngay dưới quân phải tối hơn nền bàn ở phía trên cùng khoảng cách
//      — tức có bóng đổ, quân tách khỏi mặt bàn.
// Chạy: npm run build && node qa/run-one.mjs qa/cotuong-depth.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const OUT = path.resolve(process.env.TEMP || process.env.TMP || '.', 'shots-t30-cotuong-depth');
fs.mkdirSync(OUT, { recursive: true });

/** Đọc PNG 8-bit không interlace (ảnh chụp của Playwright: RGBA/RGB). */
function decodePng(buf) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8) throw new Error('chỉ hỗ trợ PNG 8-bit');
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!bpp) throw new Error(`colorType ${colorType} không hỗ trợ`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const row = y * stride;
    for (let x = 0; x < stride; x++) {
      const cur = raw[rp + x];
      const left = x >= bpp ? out[row + x - bpp] : 0;
      const up = y > 0 ? out[row - stride + x] : 0;
      const upLeft = y > 0 && x >= bpp ? out[row - stride + x - bpp] : 0;
      let val;
      if (filter === 0) val = cur;
      else if (filter === 1) val = cur + left;
      else if (filter === 2) val = cur + up;
      else if (filter === 3) val = cur + ((left + up) >> 1);
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        val = cur + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      } else throw new Error('filter lạ ' + filter);
      out[row + x] = val & 0xff;
    }
    rp += stride;
  }
  return { width, height, bpp, data: out };
}

/** Độ sáng trung bình (0–255) của một khung chữ nhật. */
function meanLuma(img, x0, y0, x1, y1) {
  let sum = 0;
  let n = 0;
  for (let y = Math.max(0, Math.round(y0)); y < Math.min(img.height, Math.round(y1)); y++) {
    for (let x = Math.max(0, Math.round(x0)); x < Math.min(img.width, Math.round(x1)); x++) {
      const i = (y * img.width + x) * img.bpp;
      sum += 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
      n++;
    }
  }
  return n ? sum / n : 0;
}

export default async function run(page) {
  const out = { errors: [], shots: [], facts: {}, steps: [] };
  const CLICK = { timeout: 15000 };
  const step = (name, detail) => out.steps.push({ step: name, ...detail });
  const shot = async (name, clip) => {
    const file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file, fullPage: false, ...(clip ? { clip } : {}) });
    out.shots.push(file);
  };

  // Quân để đo: Pháo Đen ở giao điểm (2,1) — phía trên và dưới đều là ô trống,
  // nên khung đối chứng phía trên không dính quân khác.
  const findTarget = () =>
    page.evaluate(() => {
      const pieces = [...document.querySelectorAll('.ct-piece')];
      const target = document.querySelector('.ct-piece[data-piece="black-c"]');
      if (!target) return null;
      const face = target.querySelector('.ct-piece__face');
      const base = target.querySelector('.ct-piece__base');
      const shadow = target.querySelector('.ct-piece__shadow');
      const rb = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.y + r.height, right: r.x + r.width };
      };
      return { piece: rb(target), face: rb(face), base: rb(base), shadow: shadow ? rb(shadow) : null };
    });

  const measureDepth = async () => {
    const geo = await findTarget();
    if (!geo) return { missing: true };
    await page.locator('.ct-piece').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const fresh = await findTarget();
    const img = decodePng(await page.screenshot({ fullPage: false }));
    const cx = fresh.piece.x + fresh.piece.w / 2;
    const top = fresh.face.y;
    const bottom = fresh.face.bottom;
    // Hai cửa sổ hai bên trục giữa để tránh đường kẻ dọc và dấu mốc ở góc ô.
    const win = [
      [cx - fresh.piece.w * 0.42, cx - fresh.piece.w * 0.22],
      [cx + fresh.piece.w * 0.22, cx + fresh.piece.w * 0.42],
    ];
    const band = (y0, y1) =>
      (meanLuma(img, win[0][0], y0, win[0][1], y1) + meanLuma(img, win[1][0], y0, win[1][1], y1)) / 2;
    const above = (band(top - 12, top - 6) + band(top - 10, top - 4)) / 2;
    const below = (band(bottom + 5, bottom + 11) + band(bottom + 7, bottom + 13)) / 2;
    const faceLuma = meanLuma(
      img,
      cx - fresh.piece.w * 0.3,
      top + fresh.piece.h * 0.16,
      cx - fresh.piece.w * 0.14,
      top + fresh.piece.h * 0.34
    );
    return {
      pieceW: Math.round(fresh.piece.w),
      faceBottom: Math.round(fresh.face.bottom),
      baseBottom: Math.round(fresh.base.bottom),
      rimBelowFacePx: Math.round(fresh.base.bottom - fresh.face.bottom),
      shadowBottom: fresh.shadow ? Math.round(fresh.shadow.bottom) : null,
      boardAbove: Math.round(above),
      boardBelow: Math.round(below),
      contactShadowDelta: Math.round(above - below),
      faceLuma: Math.round(faceLuma),
    };
  };

  try {
    await page.setViewportSize({ width: 900, height: 1100 });
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('[data-testid="nav-home"]:visible', { timeout: 20000 });
    await page.locator('button:has-text("Cờ Tướng")').first().click(CLICK);
    await page.locator('h1:has-text("Vương Quốc Cờ Tướng")').first().waitFor({ timeout: 20000 });
    await page.locator('button:has-text("Chơi 3D")').first().click(CLICK);
    await page.waitForSelector('[data-testid="ct-cell-9-4"]', { timeout: 20000 });
    await page.waitForTimeout(800);
    await shot('00-board-3d');

    // 1) Lưới không được vẽ đè lên quân. Quân có pointer-events: none nên phải
    // tạm bật hit-test cho quân + lưới mới hỏi được thứ tự vẽ.
    const order = await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent =
        '.ct-grid{pointer-events:auto !important}.ct-grid line,.ct-grid path{pointer-events:stroke !important}' +
        '.ct-piece,.ct-piece *{pointer-events:auto !important}';
      document.head.appendChild(style);
      const piece = document.querySelector('.ct-piece[data-piece="black-c"]') || document.querySelector('.ct-piece');
      const r = piece.getBoundingClientRect();
      const stack = document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2).map((el) => {
        const cls = typeof el.className === 'string' ? el.className : el.getAttribute?.('class') || '';
        return el.tagName.toLowerCase() + (cls ? '.' + cls.trim().split(/\s+/).join('.') : '');
      });
      const idx = (needle) => stack.findIndex((s) => s.includes(needle));
      style.remove();
      return { grid: idx('svg.ct-grid'), face: idx('ct-piece__face'), base: idx('ct-piece__base') };
    });
    step('paintOrder', order);
    if (order.face < 0) out.errors.push('không thấy mặt quân trong chồng lớp tại tâm quân');
    if (order.grid >= 0 && order.grid < order.face)
      out.errors.push(`lưới vẽ đè lên mặt quân (grid #${order.grid} < face #${order.face})`);

    // 2 + 3) Độ dày thành quân và bóng tiếp đất, ở cả chế độ 3D lẫn 2D.
    const tilt = await measureDepth();
    step('depth3d', tilt);
    await shot('01-piece-3d');
    if (tilt.missing) out.errors.push('không tìm thấy quân Pháo Đen để đo');
    else {
      if (tilt.rimBelowFacePx < 2)
        out.errors.push(`thành quân chỉ thò ${tilt.rimBelowFacePx}px dưới mặt quân (cần ≥ 2px)`);
      if (tilt.contactShadowDelta < 8)
        out.errors.push(
          `nền bàn ngay dưới quân chỉ tối hơn ${tilt.contactShadowDelta} mức sáng — thiếu bóng tiếp đất`
        );
      if (tilt.faceLuma < 150)
        out.errors.push(`mặt quân quá tối (luma ${tilt.faceLuma}) — nghi đo sai vùng`);
    }

    const flatBtn = page.locator('button:has-text("Góc 2D")').first();
    if (await flatBtn.count()) {
      await flatBtn.click(CLICK);
      await page.waitForTimeout(700);
      const isFlat = await page.evaluate(() => !!document.querySelector('.ct-scene.is-flat'));
      const flat = await measureDepth();
      step('depth2d', { isFlat, ...flat });
      await shot('02-piece-2d');
      if (!isFlat) out.errors.push('bấm "Góc 2D" nhưng bàn cờ không chuyển sang mặt phẳng');
      if (!flat.missing) {
        if (flat.rimBelowFacePx < 2)
          out.errors.push(`chế độ 2D: thành quân chỉ thò ${flat.rimBelowFacePx}px dưới mặt quân`);
        if (flat.contactShadowDelta < 8)
          out.errors.push(
            `chế độ 2D: nền bàn ngay dưới quân chỉ tối hơn ${flat.contactShadowDelta} mức sáng — quân dán phẳng`
          );
      }
      await page.locator('button:has-text("Góc 3D")').first().click(CLICK).catch(() => {});
      await page.waitForTimeout(400);
    }
  } catch (e) {
    out.errors.push('EXCEPTION: ' + (e && e.message ? String(e.message).slice(0, 900) : String(e)));
    out.failedAt = out.steps.length ? out.steps[out.steps.length - 1].step : 'start';
    await shot('99-failure').catch(() => {});
  }

  out.ok = out.errors.length === 0;
  return out;
}
