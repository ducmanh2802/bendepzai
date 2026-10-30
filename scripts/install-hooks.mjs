/**
 * Point git at the versioned hooks in scripts/hooks so every clone gets the same
 * local gates without copying files into .git/hooks (which git would overwrite).
 * Best-effort by design: a missing git binary or a non-repo checkout must never
 * break `npm install`, so the script always exits 0.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HOOKS_DIR = path.resolve('scripts', 'hooks');
// Git config always wants POSIX separators, even on Windows checkouts.
const HOOKS_DIR_POSIX = path.relative(process.cwd(), HOOKS_DIR).split(path.sep).join('/');

function silent(label, fn) {
  try {
    fn();
  } catch (e) {
    console.warn(`[hooks] ${label} skipped: ${String(e && e.message ? e.message : e).split('\n')[0]}`);
  }
}

if (!fs.existsSync(HOOKS_DIR) || !fs.existsSync('.git')) {
  // Cloud deployment or non-git environment — silently skip
  process.exit(0);
}

silent('core.hooksPath', () =>
  execFileSync('git', ['config', 'core.hooksPath', HOOKS_DIR_POSIX], { stdio: 'pipe' })
);

// Windows checkouts keep the exec bit off; git only honours it on POSIX hosts.
for (const hook of fs.readdirSync(HOOKS_DIR)) {
  const full = path.join(HOOKS_DIR, hook);
  if (!fs.statSync(full).isFile()) continue;
  silent(`chmod ${hook}`, () => fs.chmodSync(full, 0o755));
}

console.log('[hooks] git hooks -> scripts/hooks (pre-commit, commit-msg, pre-push)');
