/**
 * T02C — post-build bundle budget gate.
 *
 * Fails (exit 1) when the first-load entry chunk exceeds 600 kB, the hard
 * ceiling from the T02C task. The stretch goal is ≤ 450 kB (reported, not
 * enforced). Run after `npm run build`:
 *   npm run check:budget
 *
 * Exported `getBudgetReport()` is reused by tests/bundle-budget.test.ts so
 * the gate and the test can never drift apart.
 */

import fs from 'node:fs';
import path from 'node:path';

export const MAIN_CHUNK_BUDGET_BYTES = 600 * 1024;
export const MAIN_CHUNK_GOAL_BYTES = 450 * 1024;

/**
 * Reads dist/assets and reports per-chunk sizes. The main chunk is the
 * `index-*.js` entry (the file referenced by dist/index.html).
 */
export function getBudgetReport(distDir = 'dist') {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    return { ok: false, reason: 'no-dist', mainChunk: null, mainBytes: 0, chunks: [] };
  }

  const indexHtml = path.join(distDir, 'index.html');
  let entryFile = null;
  if (fs.existsSync(indexHtml)) {
    const html = fs.readFileSync(indexHtml, 'utf8');
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (match) entryFile = match[1].replace('/assets/', '');
  }

  const chunks = [];
  for (const file of fs.readdirSync(assetsDir)) {
    if (!file.endsWith('.js')) continue;
    const bytes = fs.statSync(path.join(assetsDir, file)).size;
    chunks.push({ file, bytes, isMain: file === entryFile });
  }
  chunks.sort((a, b) => b.bytes - a.bytes);

  const mainChunk = chunks.find((c) => c.isMain) ?? chunks.find((c) => /^index-.*\.js$/.test(c.file)) ?? null;
  if (!mainChunk) {
    return { ok: false, reason: 'no-entry-chunk', mainChunk: null, mainBytes: 0, chunks };
  }
  const mainBytes = mainChunk.bytes;
  return {
    ok: mainBytes <= MAIN_CHUNK_BUDGET_BYTES,
    reason: mainBytes <= MAIN_CHUNK_BUDGET_BYTES ? 'pass' : 'over-budget',
    mainChunk: mainChunk.file,
    mainBytes,
    mainKiloBytes: Math.round((mainBytes / 1024) * 10) / 10,
    meetsGoal: mainBytes <= MAIN_CHUNK_GOAL_BYTES,
    chunks,
  };
}

export function formatBudgetReport(report) {
  const lines = ['Bundle budget (T02C: main chunk must stay ≤ 600 kB, goal ≤ 450 kB):'];
  for (const c of report.chunks.slice(0, 12)) {
    lines.push(`  ${(c.bytes / 1024).toFixed(1).padStart(8)} kB  ${c.file}${c.isMain ? '  ← main' : ''}`);
  }
  if (report.chunks.length > 12) lines.push(`  ... +${report.chunks.length - 12} more chunks`);
  if (report.mainChunk) {
    lines.push(
      `Main chunk: ${report.mainChunk} = ${report.mainKiloBytes} kB → ` +
        (report.ok ? (report.meetsGoal ? 'PASS (meets 450 kB goal)' : 'PASS (within 600 kB budget)') : 'FAIL (over 600 kB budget)')
    );
  } else {
    lines.push(`FAIL: ${report.reason}`);
  }
  return lines.join('\n');
}

// CLI
const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('check-bundle-budget.mjs');
if (isMain) {
  const distDir = path.resolve(process.argv[2] ?? 'dist');
  const report = getBudgetReport(distDir);
  console.log(formatBudgetReport(report));
  process.exit(report.ok ? 0 : 1);
}
