/**
 * ICON GENERATOR — zero dependency.
 *
 * Why this exists instead of a rasterizer:
 *   - public/favicon.svg contains a <text> element, so rasterizing the SVG would
 *     depend on a font being installed. The PNG must be identical on every
 *     machine, so the artwork is drawn from geometry here instead.
 *   - adding sharp / resvg / canvas would add a native build step to a project
 *     that currently installs 62 packages in ~18s with no native deps. Not worth
 *     it for four icons.
 *
 * PNG is written by hand: signature + IHDR + IDAT (zlib from Node core) + IEND.
 * Artwork is supersampled 4x per axis and box-filtered down, which is what gives
 * the edges their antialiasing without any library.
 *
 * Run: node scripts/generate-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public');

// ------------------------------------------------------------- PNG encoder --

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Encode RGBA bytes (size*size*4) as a PNG buffer. */
function encodePng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: truecolour with alpha
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Each scanline is prefixed with filter byte 0 (None).
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- geometry --

/** Signed distance to a rounded rectangle centred at (cx,cy). Negative = inside. */
function roundedRect(x, y, cx, cy, halfW, halfH, r) {
  const qx = Math.abs(x - cx) - (halfW - r);
  const qy = Math.abs(y - cy) - (halfH - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r;
}

function inPolygon(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 5-pointed star, flat side down, matching the SVG artwork. */
function starPoints(cx, cy, outer, inner, rotation = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/**
 * Numeral "1" built from a flag quad, a stem and a base bar — the shape a child
 * reads as "lớp 1", without shipping a font.
 */
function numeralOnePoints(cx, cy, w, h) {
  const hw = w / 2;
  const hh = h / 2;
  const stem = w * 0.17;
  return [
    // flag
    [cx - stem, cy - hh],
    [cx - w * 0.34, cy - hh + h * 0.3],
    [cx - w * 0.34, cy - hh + h * 0.5],
    [cx - stem, cy - hh + h * 0.34],
    // stem
    [cx - stem, cy + hh - h * 0.22],
    [cx + stem, cy + hh - h * 0.22],
    [cx + stem, cy - hh],
    // base
    [cx - hw, cy + hh - h * 0.22],
    [cx - hw, cy + hh],
    [cx + hw, cy + hh],
    [cx + hw, cy + hh - h * 0.22],
  ];
}

const lerp = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------------ render --

/**
 * @param {number} size
 * @param {object} opts
 * @param {boolean} opts.maskable  full-bleed background, content inside the 80% safe zone
 * @param {boolean} opts.squared   opaque square (Apple touch icons must not be transparent)
 */
function renderIcon(size, { maskable = false, squared = false } = {}) {
  const SS = 4; // supersample factor per axis
  const big = size * SS;
  const acc = new Float32Array(size * size * 4);

  const star = starPoints(0.5, maskable ? 0.42 : 0.44, maskable ? 0.2 : 0.235, maskable ? 0.085 : 0.1);
  const one = numeralOnePoints(0.5, maskable ? 0.72 : 0.775, maskable ? 0.3 : 0.34, maskable ? 0.26 : 0.28);

  for (let by = 0; by < big; by += 1) {
    const fy = (by + 0.5) / big;
    for (let bx = 0; bx < big; bx += 1) {
      const fx = (bx + 0.5) / big;

      // --- background -------------------------------------------------
      const corner = maskable || squared ? 0 : 0.22;
      const bg = roundedRect(fx, fy, 0.5, 0.5, 0.5, 0.5, corner);
      if (bg > 0) continue;

      // amber vertical gradient, matching the brand #f59e0b family
      let r = lerp(0xfb, 0xf5, fy);
      let g = lerp(0xbf, 0x9e, fy);
      let b = lerp(0x24, 0x0b, fy);
      let a = 255;

      // inner hairline border, inset 7%
      const border = roundedRect(fx, fy, 0.5, 0.5, 0.43, 0.43, Math.max(0, corner - 0.03));
      if (border > 0) {
        const edge = 1 - Math.min(1, Math.abs(border) / 0.012);
        if (edge > 0) {
          r = lerp(r, 0xff, edge * 0.7);
          g = lerp(g, 0xf7, edge * 0.7);
          b = lerp(b, 0xed, edge * 0.7);
        }
      }

      // --- foreground: star + "1" -------------------------------------
      if (inPolygon(fx, fy, star) || inPolygon(fx, fy, one)) {
        r = 0xff;
        g = 0xfb;
        b = 0xeb;
      }

      // accumulate into the downsampled pixel
      const px = (bx / SS) | 0;
      const py = (by / SS) | 0;
      const o = (py * size + px) * 4;
      acc[o] += r;
      acc[o + 1] += g;
      acc[o + 2] += b;
      acc[o + 3] += a;
    }
  }

  const samples = SS * SS;
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size * 4; i += 4) {
    out[i] = Math.round(acc[i] / samples);
    out[i + 1] = Math.round(acc[i + 1] / samples);
    out[i + 2] = Math.round(acc[i + 2] / samples);
    out[i + 3] = Math.round(acc[i + 3] / samples);
  }
  return encodePng(size, out);
}

// -------------------------------------------------------------------- main --

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-192.png', size: 192, opts: { maskable: true } },
  { file: 'icon-maskable-512.png', size: 512, opts: { maskable: true } },
  { file: 'apple-touch-icon.png', size: 180, opts: { squared: true } },
];

for (const t of targets) {
  const png = renderIcon(t.size, t.opts || {});
  writeFileSync(resolve(OUT_DIR, t.file), png);
  const kb = (png.length / 1024).toFixed(1);
  console.log(`${t.file.padEnd(26)} ${t.size}x${t.size}  ${kb} KB`);
}

console.log('\nPNG icons written to public/ with zero dependencies.');
