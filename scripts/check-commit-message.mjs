/**
 * Conventional Commits gate for the commit-msg hook.
 *
 * Accepted shape: <type>[(scope)][!]: <subject>
 *   type   feat | fix | docs | test | refactor | perf | chore | build | ci | revert
 *   scope  [a-z0-9._-]+   (optional)
 *   !      marks a breaking change (optional)
 *   subject>=3 chars, imperative, no trailing period
 *
 * Merge/revert/fixup bookkeeping lines written by git itself are allowed so the
 * hook never blocks an interactive rebase.
 *
 * Usage: node scripts/check-commit-message.mjs .git/COMMIT_EDITMSG
 */
const TYPES = ['feat', 'fix', 'docs', 'test', 'refactor', 'perf', 'chore', 'build', 'ci', 'revert'];
const PATTERN = new RegExp(`^(?:${TYPES.join('|')})(?:\\([a-z0-9._-]+\\))?!?: \\S.{2,}$`);
const TRAILING_DOT = new RegExp(`^(?:${TYPES.join('|')})(?:\\([a-z0-9._-]+\\))?!?: .*[.]$`);
const PASSTHROUGH = /^(merge |revert |fixup! |squash! |amend! |initial commit|i18n: )/i;

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/check-commit-message.mjs <path-to-message-file>');
  process.exit(2);
}

const { readFileSync } = await import('node:fs');
let message;
try {
  message = readFileSync(file, 'utf8');
} catch {
  // Nothing to read (e.g. hook fired without a message file) — do not block.
  process.exit(0);
}

const lines = message
  .split(/\r?\n/)
  .filter((l) => l.trim() !== '' && !l.startsWith('#') && !l.startsWith('diff --git'));

const subject = lines[0] || '';

if (subject === '' || PASSTHROUGH.test(subject)) {
  process.exit(0);
}
if (PATTERN.test(subject) && !TRAILING_DOT.test(subject)) {
  process.exit(0);
}

console.error(
  [
    '✖ Commit message does not follow Conventional Commits.',
    `  received: ${subject}`,
    '',
    '  format:   <type>[(scope)][!]: <mô tả>',
    `  types:    ${TYPES.join(', ')}`,
    '',
    '  examples:',
    '    feat(games): thêm trò Nối Số Tô Màu',
    '    fix(cotuong): sửa quân Pháo ăn nhảy qua cản',
    '    docs(sdlc): viết lại quy trình release',
    '    refactor(games)!: đổi registry trò chơi sang lazy load',
  ].join('\n')
);
process.exit(1);
