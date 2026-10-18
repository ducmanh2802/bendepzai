/**
 * P41 — FONT & ENCODING REGRESSION GATE (§2, §5).
 *
 * The Math bank was hit by a cp1258 double-encoding incident (UTF-8 bytes
 * re-decoded as windows-1258 and re-encoded). These tests make that class of
 * corruption impossible to re-land silently:
 *
 *  1. No file under src/ may contain U+FFFD or cp1258/CP1252 mojibake
 *     characters (they never occur in clean Vietnamese/English content).
 *  2. The self-hosted font contract stays intact: variable weight ranges,
 *     Vietnamese precomposed coverage, U+2212 (minus), preloads, fallback.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/**
 * Cp1258/CP1252 double-encoding detector, tuned so it NEVER flags legitimate
 * Grade-1 content (verified across the whole repo):
 *  - always corrupt: U+FFFD, U+00C4..U+00C6, U+00D0, U+00D1, U+00D8, U+00DE,
 *    U+00DF, U+20AC, and symbol leftovers U+00A1, U+00A6, U+00A8..U+00AA,
 *    U+00AC, U+00AE, U+00AF, U+00B2, U+00B3, U+00B9, U+00BA, U+00BC..U+00BF
 *  - U+00C2/U+00C3 (valid Vietnamese capitals) and U+00BB (closing guillemet
 *    in `Màn «Tên»` UI strings) only when followed by a mojibake continuation
 *  - allowed: U+00B4 (sắc tone glyph), U+00B7 (separator), U+00B1 (math
 *    comments), U+00A7 (comments), U+00B0 (degrees), × ÷, all Vietnamese
 *    precomposed letters including Ã/Â/«/» standing alone.
 */
const MOJIBAKE_RE =
  /[\uFFFD\u00C4-\u00C6\u00D0\u00D1\u00D8\u00DE\u00DF\u20AC]|[\u00C2\u00C3\u00BB][\u0080-\u00BF\u2018-\u201F\u2020-\u2027\u2122\u02C6\u02DC\u2039\u203A]|[\u00A1\u00A6\u00A8\u00A9\u00AA\u00AC\u00AE\u00AF\u00B2\u00B3\u00B9\u00BA\u00BC\u00BD\u00BE\u00BF]/u;

function walkSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(full, out);
    } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('P41 — content encoding (§2)', () => {
  it('src/**/*.{ts,tsx,css} contain no U+FFFD or cp1258 mojibake characters', () => {
    const offenders: string[] = [];
    for (const file of walkSourceFiles(join(root, 'src'))) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (MOJIBAKE_RE.test(line)) {
          const rel = file.slice(root.length + 1).replace(/\\/g, '/');
          offenders.push(`${rel}:${idx + 1}: ${line.trim().slice(0, 80)}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('index.html contains no U+FFFD or mojibake characters', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    expect(MOJIBAKE_RE.test(html)).toBe(false);
  });
});

describe('P41 — self-hosted font contract (§2)', () => {
  const css = readFileSync(join(root, 'src', 'index.css'), 'utf8');
  const html = readFileSync(join(root, 'index.html'), 'utf8');

  it('ships all four woff2 subsets locally', () => {
    for (const name of [
      'nunito-latin.woff2',
      'nunito-vietnamese.woff2',
      'comfortaa-latin.woff2',
      'comfortaa-vietnamese.woff2',
    ]) {
      expect(existsSync(join(root, 'public', 'fonts', name)), `missing public/fonts/${name}`).toBe(true);
    }
  });

  it('declares variable weight ranges (no synthetic bold for Vietnamese)', () => {
    const nunito = css.match(/font-family:\s*'Nunito'[\s\S]*?font-weight:\s*([\d\s]+);/);
    const comfortaa = css.match(/font-family:\s*'Comfortaa'[\s\S]*?font-weight:\s*([\d\s]+);/);
    // Variable-range declarations like `200 1000` keep glyph shapes real
    // instead of letting the browser fake-bold diacritics.
    expect(nunito?.[1].trim()).toBe('200 1000');
    expect(comfortaa?.[1].trim()).toBe('300 700');
  });

  it('covers Vietnamese precomposed glyphs and U+2212 minus in unicode-range', () => {
    const ranges = [...css.matchAll(/unicode-range:\s*([^;]+);/g)].map((m) => m[1]);
    const vietnameseRanges = ranges.filter((r) => r.includes('U+1EA0-1EF9'));
    expect(vietnameseRanges.length).toBeGreaterThanOrEqual(2); // Nunito + Comfortaa
    for (const r of ranges.filter((r) => r.includes('U+0000-00FF'))) {
      expect(r).toContain('U+2212'); // proper minus sign, not hyphen
    }
  });

  it('preloads Nunito subsets and never fetches Google Fonts', () => {
    expect(html).toContain('/fonts/nunito-latin.woff2');
    expect(html).toContain('/fonts/nunito-vietnamese.woff2');
    expect(html).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
  });

  it('keeps a system fallback stack after the web fonts', () => {
    expect(css).toMatch(/font-family:\s*'Nunito',\s*-apple-system/);
    expect(css).toMatch(/font-family:\s*'Comfortaa',\s*'Nunito'/);
  });
});
