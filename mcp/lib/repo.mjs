/**
 * Shared repo introspection for the MCP servers.
 *
 * Two rules shape everything here:
 *  1. Output is always bounded. An MCP tool result lands in an agent's context
 *     window, so a `npm run test` tail is capped and file reads are capped.
 *  2. Paths never leave the repo (or KBT_PROGRESS_DIR). Agents pass user text;
 *     that text must not become an arbitrary file read.
 */
import { spawn } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function clip(text, max = 6000) {
  const s = String(text ?? '');
  if (s.length <= max) return s;
  return `…(${s.length - max} bytes cắt bớt)…\n` + s.slice(-max);
}

/** Vitest/tsc colourise their output; ANSI codes only burn agent context. */
export function stripAnsi(text) {
  return String(text ?? '').replace(/\u001b\[[0-9;]*m/g, '');
}

/** Run a command, capture stdout+stderr, never hang forever. */
export function run(cmd, args, { timeoutMs = 120000, cwd = ROOT, env = {}, shell = false } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      shell,
      windowsHide: true,
    });

    let out = '';
    let err = '';
    let timedOut = false;

    const kill = () => {
      if (process.platform === 'win32' && shell) {
        // shell:true means the npm child lives under cmd.exe; killing the shell
        // alone leaves npm + vite running.
        run('taskkill', ['/pid', String(child.pid), '/T', '/F'], { timeoutMs: 10000, shell: false });
      } else {
        child.kill('SIGTERM');
      }
    };

    const timer = setTimeout(() => {
      timedOut = true;
      kill();
    }, timeoutMs);

    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ code: -1, out: '', err: String(e.message ?? e), ms: Date.now() - started, timedOut });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, out, err, ms: Date.now() - started, timedOut });
    });
  });
}

/**
 * `npm.cmd` cannot be spawned directly on the patched Node releases
 * (CVE-2024-27980 makes .cmd without a shell throw EINVAL), so Windows goes
 * through the shell. Script names come from a fixed whitelist, never user text.
 */
export const npmRun = (script, opts = {}) =>
  process.platform === 'win32'
    ? run('npm', ['run', script, '--silent'], { ...opts, shell: true })
    : run('npm', ['run', script, '--silent'], opts);

export const git = (args, opts) => run('git', args, { timeoutMs: 20000, ...opts });

/** Node 23.6+ strips types on import; older runtimes fall back to static scan. */
const importCache = new Map();
export async function importData(relPath) {
  if (importCache.has(relPath)) return importCache.get(relPath);
  const abs = insideRepo(relPath);
  let result;
  try {
    const mod = await import(pathToFileURL(abs).href);
    result = { ok: true, mod, error: null };
  } catch (e) {
    result = { ok: false, mod: null, error: String(e?.message ?? e).split('\n')[0] };
  }
  importCache.set(relPath, result);
  return result;
}

export function resolveInsideRepo(relPath) {
  const root = path.resolve(ROOT);
  const abs = path.resolve(root, String(relPath ?? ''));
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error(`Path escapes the repo: ${relPath}`);
  }
  return abs;
}
export { resolveInsideRepo as insideRepo };

/** Read a repo file as UTF-8, bounded. */
export function readSource(relPath, maxBytes = 200000) {
  const abs = resolveInsideRepo(relPath);
  if (!fs.existsSync(abs)) throw new Error(`Không có file: ${relPath}`);
  const stat = fs.statSync(abs);
  const fd = fs.openSync(abs, 'r');
  const len = Math.min(stat.size, maxBytes);
  const buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, 0);
  fs.closeSync(fd);
  return { text: buf.toString('utf8'), bytes: stat.size, truncated: stat.size > len };
}

export function listFiles(subDir, { extension = null, limit = 400 } = {}) {
  const abs = resolveInsideRepo(subDir);
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (!extension || full.endsWith(extension)) {
        found.push(path.relative(ROOT, full).split(path.sep).join('/'));
        if (found.length >= limit) return;
      }
    }
  };
  if (fs.existsSync(abs)) walk(abs);
  return found;
}

/**
 * Regex scan over repo text files. Returns file:line + the matched line.
 * Skips huge files so a tool call can't turn into a full-tree read.
 */
export function grepRepo(pattern, { dir = 'src', flags = 'g', limit = 40, maxFileBytes = 400000 } = {}) {
  const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  const hits = [];
  for (const rel of listFiles(dir, { limit: 2000 })) {
    if (!/\.(ts|tsx|mjs|js|json|md)$/.test(rel)) continue;
    let content;
    try {
      const abs = resolveInsideRepo(rel);
      if (fs.statSync(abs).size > maxFileBytes) continue;
      content = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      re.lastIndex = 0;
      if (re.test(lines[i])) {
        hits.push({ file: rel, line: i + 1, text: clip(lines[i].trim(), 220) });
        if (hits.length >= limit) return { hits, truncated: true };
      }
    }
  }
  return { hits, truncated: false };
}

/**
 * The four registration lists (docs/SDLC.md §3.1). Read statically so the check
 * works even when a runtime cannot import TypeScript.
 */
export function readRegistration() {
  const catalog = { ids: [], titles: {}, entries: [] };
  const registry = { ids: [] };
  const policy = { ids: [] };
  const qa = { titles: [] };
  const problems = [];

  try {
    const { text } = readSource('src/data/gamesCatalog.ts', 400000);
    const blockRe = /\{\s*\n?\s*id:\s*'([a-z0-9_]+)'[\s\S]*?\n {2}\}/g;
    let m;
    while ((m = blockRe.exec(text))) {
      const block = m[0];
      const title = (block.match(/title:\s*'([^']+)'/) || [])[1] || null;
      const category = (block.match(/category:\s*'([^']+)'/) || [])[1] || null;
      const emoji = (block.match(/emoji:\s*'([^']+)'/) || [])[1] || null;
      const skillIds = (block.match(/skillIds:\s*\[([^\]]*)\]/) || [])[1];
      const entry = {
        id: m[1],
        title,
        category,
        emoji,
        skillIds: skillIds
          ? skillIds
              .split(',')
              .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
              .filter(Boolean)
          : [],
      };
      catalog.entries.push(entry);
      catalog.ids.push(entry.id);
      if (title) catalog.titles[entry.id] = title;
    }
  } catch (e) {
    problems.push('gamesCatalog: ' + e.message);
  }

  try {
    const { text } = readSource('src/components/games/registry.ts');
    registry.ids = [...text.matchAll(/^\s*([a-z0-9_]+):\s*lazy\(/gm)].map((m) => m[1]);
  } catch (e) {
    problems.push('registry: ' + e.message);
  }

  try {
    const { text } = readSource('src/config/policy.ts');
    const block = text.match(/LAUNCHABLE_GAME_IDS\s*=\s*\[([\s\S]*?)\]/);
    policy.ids = block ? [...block[1].matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1]) : [];
    if (!block) problems.push('policy: không tìm thấy LAUNCHABLE_GAME_IDS');
  } catch (e) {
    problems.push('policy: ' + e.message);
  }

  try {
    const { text } = readSource('qa/games.mjs');
    const block = text.match(/GAME_TITLES\s*=\s*\[([\s\S]*?)\]/);
    qa.titles = block ? [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
    if (!block) problems.push('qa/games.mjs: không tìm thấy GAME_TITLES');
  } catch (e) {
    problems.push('qa/games.mjs: ' + e.message);
  }

  return { catalog, registry, policy, qa, problems };
}

export function diffLists(a, b) {
  return { onlyInA: a.filter((x) => !b.includes(x)), onlyInB: b.filter((x) => !a.includes(x)) };
}

/** One-line summary pulled from a file's leading block comment. */
export function fileSynopsis(relPath, maxLines = 6) {
  try {
    const { text } = readSource(relPath, 4000);
    const lines = text.split('\n').slice(0, maxLines);
    return clip(
      lines
        .map((l) => l.replace(/^\s*(\/\/|\/\*|\*)\s?/, '').trim())
        .filter(Boolean)
        .join(' · '),
      300
    );
  } catch {
    return '';
  }
}
