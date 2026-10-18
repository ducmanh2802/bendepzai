import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAnswer, normalizeMathExpression } from '../src/services/answerCheck';
import { getAllQuestions } from '../src/data/curriculum';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listTsFiles(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

const MATH_FILES = [
  join(root, 'src/data/mathCurriculum.ts'),
  ...listTsFiles(join(root, 'src/data/math')),
].sort();

const ALL_DATA_FILES = listTsFiles(join(root, 'src/data'));

/** Same rule as scripts/normalize-math-minus.mjs (must stay in sync). */
const ASCII_MINUS_RUN = /(\d)\s*-\s*(\d)/;
/** Lines that carry identifiers or module paths instead of display content. */
const STRUCTURAL_LINE =
  /^\s*(\w*[iI]d\s*:|(import|export)\b|\}\s*from\b|mathQ\(|'[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?: − [0-9]+)?',\s*$|'[a-z][a-z0-9]*(?:-[a-z0-9]+)*'\s*:)/;
/** Id-shaped quoted value that must never contain U+2212. */
const ID_STRING = /'([a-z][a-z0-9]*(?:-[a-z0-9]+)*) − ([0-9]+)'/g;

describe('P43 / p41 §2 — math typography', () => {
  it('uses U+2212 (not ASCII hyphen) for subtraction in math lesson data', () => {
    const offenders: string[] = [];
    for (const file of MATH_FILES) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, idx) => {
          if (STRUCTURAL_LINE.test(line)) return;
          if (ASCII_MINUS_RUN.test(line)) {
            offenders.push(`${file.replace(root + '\\', '')}:${idx + 1}: ${line.trim()}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it('keeps every id-shaped string and module specifier free of U+2212', () => {
    const offenders: string[] = [];
    for (const file of MATH_FILES) {
      ID_STRING.lastIndex = 0;
      if (ID_STRING.test(readFileSync(file, 'utf8'))) {
        offenders.push(file.replace(root + '\\', ''));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('contains no mojibake replacement characters anywhere in the content bank', () => {
    const offenders: string[] = [];
    for (const file of ALL_DATA_FILES) {
      const text = readFileSync(file, 'utf8');
      if (text.includes('\uFFFD')) offenders.push(file.replace(root + '\\', ''));
    }
    expect(offenders).toEqual([]);
  });

  it('uses the core math symbols (+, =, >, <, −) in the question bank', () => {
    const all = getAllQuestions();
    const joined = all.map((q) => `${q.prompt} ${String(q.correctAnswer)}`).join(' ');
    for (const symbol of ['+', '=', '>', '<', '\u2212']) {
      expect({ symbol, present: joined.includes(symbol) }).toEqual({ symbol, present: true });
    }
  });

  it('grades ASCII and typographic minus identically', () => {
    expect(normalizeMathExpression('9 − 4 = 5')).toBe(normalizeMathExpression('9-4=5'));
    expect(normalizeMathExpression('9 − 4 = 5')).toBe('9-4=5');

    const q = {
      id: 't',
      type: 'math-expression' as const,
      prompt: 'Tính: 9 − 4 = ?',
      correctAnswer: '9 − 4 = 5',
      options: ['9 − 4 = 5'],
      explanation: '9 − 4 = 5.',
      subject: 'toan' as const,
      skillId: 'math_add_sub',
      topicId: 'math-test',
      difficulty: 1 as const,
    };
    expect(checkAnswer(q, '9-4=5')).toBe(true);
    expect(checkAnswer(q, '9 − 4 = 5')).toBe(true);
    expect(checkAnswer(q, '9-4=6')).toBe(false);
  });

  it('ships self-hosted display fonts (Nunito/Comfortaa) with @font-face', () => {
    const css = readFileSync(join(root, 'src/index.css'), 'utf8');
    expect(css).toContain('@font-face');
    expect(css).toContain('Nunito');
    expect(css).toContain('Comfortaa');
    expect(css).toContain('--font-sans');
  });

  it('exposes the font files publicly for offline-first loading', () => {
    const css = readFileSync(join(root, 'src/index.css'), 'utf8');
    const urls = [...css.matchAll(/url\('\/fonts\/([^']+)'\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect({ url, exists: existsSync(join(root, 'public', 'fonts', url)) }).toEqual({
        url,
        exists: true,
      });
    }
  });
});
