import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  getBudgetReport,
  MAIN_CHUNK_BUDGET_BYTES,
  MAIN_CHUNK_GOAL_BYTES,
} from '../scripts/check-bundle-budget.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, '..', 'dist');
const hasDist = existsSync(join(DIST, 'assets'));

describe('T02C — bundle budget (first-load entry chunk)', () => {
  it.runIf(hasDist)('keeps the main chunk within the 600 kB budget', () => {
    const report = getBudgetReport(DIST);
    expect(report.mainChunk).toBeTruthy();
    expect(
      report.mainBytes,
      `main chunk ${report.mainChunk} is ${(report.mainBytes / 1024).toFixed(1)} kB (budget 600 kB)`
    ).toBeLessThanOrEqual(MAIN_CHUNK_BUDGET_BYTES);
  });

  it.runIf(hasDist)('ships react in its own vendor chunk (not inside main)', () => {
    const files = readdirSync(join(DIST, 'assets')).filter((f) => f.endsWith('.js'));
    expect(files.some((f) => f.startsWith('react-vendor-'))).toBe(true);
    const report = getBudgetReport(DIST);
    expect(report.meetsGoal).toBe(report.mainBytes <= MAIN_CHUNK_GOAL_BYTES);
  });

  it.runIf(hasDist)('precaches the whole build output in dist/sw.js', () => {
    const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
    expect(sw).not.toContain('__PRECACHE_MANIFEST__');
    expect(sw).toContain("const CACHE_VERSION = 'kho-bau-v3'");
    const report = getBudgetReport(DIST);
    // Every emitted JS chunk must be precached for offline lazy loading.
    for (const chunk of report.chunks) {
      expect(sw, `dist/sw.js precache misses ${chunk.file}`).toContain(chunk.file);
    }
  });
});
