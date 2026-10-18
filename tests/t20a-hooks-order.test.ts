import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * T20A — Rules-of-Hooks regression guard for bug B-02.
 *
 * LevelUpCelebrationModal returned `null` BETWEEN `useEffect` and
 * `useCallback`, so opening the celebration added a hook on a render that
 * previously had fewer — React threw #310 and unmounted the whole app right
 * after a finished lesson. This repo ships no DOM renderer (and none may be
 * added), so the contract is checked on the source itself: inside one
 * component body, no hook call may come after the component's early return.
 *
 * The scanner is deliberately shallow — it only needs depth-1 statements of a
 * component function, so strings/comments are skipped and nested helper
 * functions (which legitimately `return null`) are ignored.
 */

const COMPONENT_ROOTS = ['src/components', 'src/App.tsx'].map((p) => join(process.cwd(), p));

function walk(target: string): string[] {
  if (!existsSync(target)) return [];
  if (statSync(target).isFile()) return target.endsWith('.tsx') ? [target] : [];
  return readdirSync(target).flatMap((entry) => walk(join(target, entry)));
}

interface Statement {
  kind: 'hook' | 'return-null';
  line: number;
}

/** Depth-1 statements of every component body in one file. */
function componentStatements(source: string): { name: string; statements: Statement[]; bodyStart: number }[] {
  const code = stripCommentsAndStrings(source);
  const arrow = /^(?:export )?const ([A-Z]\w*)[^;]*?=>\s*\{/gm;
  const fn = /^(?:export )?(?:default )?function ([A-Z]\w*)[^{]*\{/gm;
  const starts = [
    ...[...code.matchAll(arrow)].map((m) => ({ name: m[1], index: m.index ?? 0, bodyStart: (m.index ?? 0) + m[0].length - 1 })),
    ...[...code.matchAll(fn)].map((m) => ({ name: m[1], index: m.index ?? 0, bodyStart: (m.index ?? 0) + m[0].length - 1 })),
  ].sort((a, b) => a.index - b.index);

  const out: { name: string; statements: Statement[]; bodyStart: number }[] = [];
  for (const start of starts) {
    const end = findBodyEnd(code, start.bodyStart);
    const body = code.slice(start.bodyStart + 1, end);
    // Only components: a hook or a JSX early return anywhere in the body.
    if (!/\buse[A-Z]\w*\(/.test(body)) continue;
    const statements: Statement[] = [];
    // Depth 0 = statements that run directly in the component's own body
    // (its opening brace was consumed above); nested blocks raise it.
    let depth = 0;
    for (let i = 0; i < body.length; i += 1) {
      const ch = body[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      else if (depth === 0 && body.startsWith('use', i) && i > 0 && !/[\w$.]/.test(body[i - 1])) {
        if (/^use[A-Z]\w*\(/.test(body.slice(i))) statements.push({ kind: 'hook', line: lineOf(source, start.bodyStart + i) });
      } else if (depth === 0 && body.startsWith('return null', i)) {
        statements.push({ kind: 'return-null', line: lineOf(source, start.bodyStart + i) });
      }
    }
    out.push({ name: start.name, statements, bodyStart: start.bodyStart });
  }
  return out;
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function findBodyEnd(code: string, openBrace: number): number {
  let depth = 0;
  for (let i = openBrace; i < code.length; i += 1) {
    if (code[i] === '{') depth += 1;
    else if (code[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return code.length;
}

/** Replace comments and string/template contents with spaces (keeps offsets). */
function stripCommentsAndStrings(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }
    if (ch === '/' && next === '*') {
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        out += source[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      out += '  ';
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      out += ' ';
      i += 1;
      while (i < source.length && source[i] !== quote) {
        out += source[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      out += ' ';
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

describe('T20A — hooks always run before any early return (B-02)', () => {
  const files = COMPONENT_ROOTS.flatMap(walk).sort();

  it('scans the whole component tree', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('never places a hook call after an early return inside one component', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const component of componentStatements(source)) {
        const early = component.statements.find((s) => s.kind === 'return-null');
        if (!early) continue;
        const hookAfter = component.statements.find((s) => s.kind === 'hook' && s.line > early.line);
        if (hookAfter) {
          offenders.push(`${file}:${hookAfter.line} — ${component.name} calls a hook after its early return (line ${early.line})`);
        }
      }
    }
    expect(offenders, `Rules-of-Hooks violations:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('keeps the LevelUpCelebrationModal hooks above its early return', () => {
    const file = join(process.cwd(), 'src/components/motivation/LevelUpCelebrationModal.tsx');
    const source = readFileSync(file, 'utf8');
    const component = componentStatements(source)[0];
    expect(component.name).toBe('LevelUpCelebrationModal');
    const hooks = component.statements.filter((s) => s.kind === 'hook');
    const early = component.statements.find((s) => s.kind === 'return-null');
    expect(hooks.length, 'useEffect + useCallback both run on every render').toBe(2);
    expect(early, 'the celebration still renders nothing when there is no reward').toBeTruthy();
    expect(Math.max(...hooks.map((h) => h.line))).toBeLessThan(early!.line);
  });
});
