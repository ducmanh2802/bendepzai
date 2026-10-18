#!/usr/bin/env node
/**
 * audit-snapshot — audit tăng dần thay vì audit toàn bộ dự án.
 *
 * Cách dùng:
 *   node scripts/audit-snapshot.mjs              # so sánh & tự lưu lại
 *   node scripts/audit-snapshot.mjs --baseline   # đánh dấu "toàn bộ hiện tại đã audit"
 *   node scripts/audit-snapshot.mjs --label "Nội dung thay đổi"
 *
 * Cơ chế: hash mọi file mã nguồn/tests/data; đối chiếu với docs/audit-state.json
 * (kết quả audit lần trước). File mới/sửa/xóa → chỉ audit phần đó. Sau khi chạy,
 * snapshot MỚI được ghi lại → lần kế tiếp chỉ cần audit phần vừa đổi.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE_FILE = path.join(ROOT, 'docs', 'audit-state.json');
const REPORT_FILE = path.join(ROOT, 'docs', 'AUDIT_REPORT.md');

const SCAN_PATHS = ['src', 'tests', 'scripts', 'qa', 'public', 'index.html', 'vite.config.ts', 'tsconfig.json', 'package.json'];
const IGNORE = new Set(['node_modules', 'dist', 'dist-ssr', 'coverage', '.git', 'audit-snapshot.mjs']);
const EXT_HASH = ['.ts', '.tsx', '.mjs', '.cjs', '.js', '.json', '.html', '.css', '.webmanifest', '.svg', '.woff2'];

function walk(rel, out) {
  const abs = path.join(ROOT, rel);
  let entries;
  try {
    entries = readdirSync(abs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const child = rel ? `${rel}/${e.name}` : e.name;
    if (IGNORE.has(e.name)) continue;
    if (e.isDirectory()) walk(child, out);
    else if (EXT_HASH.some((x) => e.name.endsWith(x))) out.push(child);
  }
}

function hashFile(rel) {
  const abs = path.join(ROOT, rel);
  try {
    return createHash('sha256').update(readFileSync(abs)).digest('hex');
  } catch {
    return 'MISSING';
  }
}

function currentTree() {
  const files = [];
  for (const p of SCAN_PATHS) {
    const abs = path.join(ROOT, p);
    if (!existsSync(abs)) continue;
    if (statSync(abs).isFile()) files.push(p);
    else walk(p, files);
  }
  const map = {};
  for (const f of files) map[f] = hashFile(f);
  return map;
}

function diff(current, previous) {
  const added = [], modified = [], removed = [];
  for (const [f, h] of Object.entries(current)) {
    if (!(f in previous)) added.push(f);
    else if (previous[f] !== h) modified.push(f);
  }
  for (const f of Object.keys(previous)) if (!(f in current)) removed.push(f);
  return { added, modified, removed };
}

const args = process.argv.slice(2);
const isBaseline = args.includes('--baseline');
const labelIdx = args.indexOf('--label');
const label = labelIdx >= 0 ? args[labelIdx + 1] : '';

const current = currentTree();
const now = new Date();
const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

if (isBaseline || !existsSync(STATE_FILE)) {
  writeFileSync(STATE_FILE, JSON.stringify({ lastAuditAt: stamp, files: current }, null, 2), 'utf8');
  console.log(`✅ BASELINE đã lưu: ${Object.keys(current).length} file → docs/audit-state.json (tại ${stamp}).`);
  console.log('   Từ giờ chạy lại lệnh này sau mỗi đợt sửa code để biết cần audit phần nào.');
  process.exit(0);
}

const previous = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
const { added, modified, removed } = diff(current, previous.files ?? {});
const total = added.length + modified.length + removed.length;

writeFileSync(STATE_FILE, JSON.stringify({ lastAuditAt: stamp, files: current }, null, 2), 'utf8');

console.log(`\n📸 Snapshot ${stamp} — ${total} file thay đổi (${modified.length} sửa, ${added.length} mới, ${removed.length} xóa)`);
console.log('   → ĐÃ TỰ LƯU lại docs/audit-state.json. Lần audit sau chỉ so với snap này.\n');
if (total > 0) console.log('🟡 FILE CẦN AUDIT LẦN NÀY:');
for (const f of modified) console.log(`   ~ ${f}`);
for (const f of added) console.log(`   + ${f} (mới)`);
for (const f of removed) console.log(`   - ${f} (đã xóa — xác nhận chủ đích, không còn được tham chiếu)`);
if (total === 0) {
  console.log('✅ Không có thay đổi mã nguồn kể từ lần audit trước — KHÔNG cần audit.');
}

const rowLabel = label || (total === 0 ? 'Không có thay đổi mã nguồn' : `${modified.length} sửa / ${added.length} mới / ${removed.length} xóa`);
const names = [...added, ...modified].slice(0, 8).join(', ') + (added.length + modified.length > 8 ? ', …' : '');
const verdict = total === 0 ? '✅ Sạch' : '🟡 Cần audit phần liệt kê';
try {
  let report = readFileSync(REPORT_FILE, 'utf8');
  report = report.trimEnd() + `\n| ${stamp} | ${names || rowLabel} | ${verdict}${label ? ` — ${label}` : ''} |\n`;
  writeFileSync(REPORT_FILE, report, 'utf8');
  console.log('📖 Đã append vào Nhật ký ở docs/AUDIT_REPORT.md');
} catch {
  console.log('⚠️ Không ghi được AUDIT_REPORT.md (bỏ qua)');
}
