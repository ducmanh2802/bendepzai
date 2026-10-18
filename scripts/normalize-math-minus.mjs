#!/usr/bin/env node
/**
 * P43 / p41 §2 — Math typography gate.
 *
 * Subtraction must be displayed with the typographic minus U+2212 ("−"),
 * never an ASCII hyphen-minus, so glyph metrics and meaning are correct.
 *
 * The rewrite is deliberately narrow: ONLY digit-hyphen-digit runs are
 * touched ("9-4" → "9−4", "9 - 4" → "9 − 4"). It therefore never matches:
 *  - ids ("math-new-q43", "vn_rhyme_an_at") — letters around the hyphen
 *  - structured calc ops (`op: '-'`) — quotes around the hyphen
 *  - prose dashes (–, —) — different code points
 *  - time ranges like "8h-9h" — letters between digits and hyphen
 *
 * Idempotent: a second run finds nothing to change.
 *
 * Usage:
 *   node scripts/normalize-math-minus.mjs           rewrite in place
 *   node scripts/normalize-math-minus.mjs --check    report only (exit 1 when ASCII runs remain)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MINUS = '\u2212';
const ASCII_RUN = /(\d) ?- ?(\d)/g;
// Identifiers (id, topicId, lessonId, skillId, ...) contain digit-hyphen-digit
// runs ("math-q4-6", "math-dem-0-10") — never rewrite those lines. Module
// specifiers reference files whose names contain them ("numbers-0-10"), so
// import/export lines are skipped too.
const ID_LINE = /^\s*\w*Id\s*:/;
const IMPORT_LINE = /^\s*(import|export)\b/;
/** Id-shaped quoted value: "math-dem-0-10", "math-les-51-100" — never U+2212. */
const ID_STRING = /'([a-z][a-z0-9]*(?:-[a-z0-9]+)*) − ([0-9]+)'/g;
/** Any id-shaped quoted identifier (ASCII form) — stripped before checking. */
const ID_SHAPE = /'[a-z][a-z0-9]*(?:-[a-z0-9]+)*'/g;

/**
 * Returns the display-content part of a line: structural lines (identifiers,
 * module specifiers) become empty, and id-shaped quoted values are blanked so
 * their digit-hyphen-digit runs are never flagged or rewritten.
 */
function contentPart(line) {
  if (ID_LINE.test(line) || IMPORT_LINE.test(line)) return '';
  return line.replace(ID_SHAPE, "''");
}

/** Identifiers and module specifiers stay untouched; every other line gets the minus rewrite. */
function rewriteLine(line) {
  if (ID_LINE.test(line) || IMPORT_LINE.test(line)) return line;
  const rewritten = line.replace(ASCII_RUN, `$1 ${MINUS} $2`);
  return rewritten.replace(ID_STRING, '$1-$2');
}

function listTsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listTsFiles(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  join(root, 'src/data/mathCurriculum.ts'),
  ...listTsFiles(join(root, 'src/data/math')),
].sort();

const checkOnly = process.argv.includes('--check');
let totalFiles = 0;
let totalRuns = 0;

for (const file of targets) {
  const source = readFileSync(file, 'utf8');
  ASCII_RUN.lastIndex = 0;
  if (!new RegExp(ASCII_RUN.source, 'g').test(source)) continue;
  const rewritten = source.split('\n').map(rewriteLine).join('\n');
  if (rewritten === source) continue;

  if (checkOnly) {
    source.split('\n').forEach((line, idx) => {
      ASCII_RUN.lastIndex = 0;
      if (new RegExp(ASCII_RUN.source, 'g').test(contentPart(line))) {
        totalRuns += 1;
        console.log(`${file.replace(root + '\\', '')}:${idx + 1}: ${line.trim().slice(0, 100)}`);
      }
    });
    continue;
  }

  const runs = (contentPart(source).match(new RegExp(ASCII_RUN.source, 'g')) || []).length;
  totalFiles += 1;
  totalRuns += runs;
  writeFileSync(file, rewritten, 'utf8');
  console.log(`rewrote ${runs} minus run(s) in ${file.replace(root + '\\', '')}`);
}

if (checkOnly) {
  if (totalRuns > 0) {
    console.log(`\nFAIL — ${totalRuns} ASCII digit-hyphen-digit run(s) remain.`);
    process.exit(1);
  }
  console.log('OK — no ASCII subtraction runs in math lesson data.');
} else {
  console.log(`\nDone — ${totalFiles} file(s), ${totalRuns} run(s).`);
}
