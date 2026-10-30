/**
 * Prints one CHANGELOG.md section so `gh release create --notes-file` gets
 * human-written notes instead of a raw commit dump.
 *
 * Usage: node scripts/release-notes.mjs 1.2.3
 *   - looks for `## [1.2.3]` (or `## 1.2.3`) and stops at the next `## `
 *   - falls back to `## [Unreleased]` when the version is not listed yet
 *   - always exits 0; the CI step appends the commit log as a safety net
 */
import fs from 'node:fs';

const version = (process.argv[2] || '').replace(/^v/, '').trim();
const file = process.argv[3] || 'CHANGELOG.md';

function section(matches) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const start = lines.findIndex((l) => matches(l.trim()));
  if (start === -1) return null;
  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) break;
    body.push(lines[i]);
  }
  return body.join('\n').trim();
}

let text = null;
if (fs.existsSync(file)) {
  if (version) {
    text = section((l) => l.startsWith(`## [${version}]`) || l === `## ${version}`);
  }
  text = text || section((l) => l.startsWith('## [Unreleased]'));
}

if (!text) {
  console.log(
    version
      ? `Release ${version} — xem danh sách commit trong GitHub Releases.`
      : 'Chưa có ghi chú release.'
  );
} else {
  console.log(text);
}
