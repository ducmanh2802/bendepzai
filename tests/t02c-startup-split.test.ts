import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createEmptyReadingProfile } from '../src/services/readingDefaults';
import { ReadingEngine } from '../src/services/readingEngine';
import { seedDemoProfile } from '../src/services/demoSeed';

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel: string) => readFileSync(join(here, '..', rel), 'utf8');

describe('T02C — heavy content stays out of the first-load chunk', () => {
  it('storage.ts has no static import of competition/reading engines or banks', () => {
    const storage = src('src/services/storage.ts');
    expect(storage).not.toContain("from './competitionEngine'");
    expect(storage).not.toContain("from './readingEngine'");
    expect(storage).not.toContain("from '../data/competitionBlueprints'");
    expect(storage).not.toContain("from '../data/competitionQuestions'");
    expect(storage).not.toContain("from '../data/readingContent'");
    // The lightweight default-profile factory is allowed.
    expect(storage).toContain("from './readingDefaults'");
  });

  it('adaptive.ts uses the tiny reading taxonomy, not the full reading bank', () => {
    const adaptive = src('src/services/adaptive.ts');
    expect(adaptive).toContain("from '../data/readingTaxonomy'");
    expect(adaptive).not.toContain("from '../data/readingContent'");
  });

  it('NextBestActionCard loads the decision engine on demand', () => {
    const card = src('src/components/learning/NextBestActionCard.tsx');
    expect(card).not.toContain("from '../../services/decisionEngine'");
    expect(card).toContain("import('../../services/decisionEngine')");
    // QA hooks survive the async rewrite.
    expect(card).toContain('data-testid="decision-engine-card"');
    expect(card).toContain('data-testid="decision-recommendation"');
  });

  it('default reading profile is identical wherever it is built', () => {
    expect(createEmptyReadingProfile()).toEqual(ReadingEngine.emptyProfile());
  });

  it('demo seeder moved to its own module with the same contract', () => {
    expect(typeof seedDemoProfile).toBe('function');
  });

  it('reading taxonomy re-export keeps old import paths working', async () => {
    const content = await import('../src/data/readingContent');
    const taxonomy = await import('../src/data/readingTaxonomy');
    expect(content.READING_SKILLS).toBe(taxonomy.READING_SKILLS);
  });
});
