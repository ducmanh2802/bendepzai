#!/usr/bin/env node
/**
 * MCP server: tài liệu dự án (kbt-docs).
 *
 * Repo này có hàng trăm file Markdown (docs/, docs/opencode/, .ai/, các file gốc);
 * số lượng thay đổi liên tục nên server đếm lúc chạy, không hardcode.
 * Agent thường tốn nhiều lượt chỉ để tìm "tài liệu nào nói về cái này". Server
 * này trả lời đúng câu đó: lập mục lục, tìm kiếm, đọc từng phần, và gom trạng
 * thái hiện tại (.ai/CURRENT.md + CHANGELOG + audit).
 *
 * Zero-dependency, chỉ đọc file trong repo, không chạy lệnh.
 */
import fs from 'node:fs';
import { startServer, obj, str, num, bool, en, arr } from './lib/server.mjs';
import { resolveInsideRepo, clip } from './lib/repo.mjs';

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', 'build', '.git', '.scaffold-backup']);
/** Báo cáo tự sinh (state/logs) là rác máy này, đã .gitignore — đừng đưa vào mục lục. */
const SKIP_PATHS = ['docs/opencode/state/', 'docs/opencode/logs/'];

function walk(relDir, { limit = 800 } = {}) {
  const out = [];
  const step = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(resolveInsideRepo(dir), { withFileTypes: true });
    } catch {
      return; // thư mục không tồn tại trong repo này — bỏ qua yên lặng
    }
    for (const e of entries) {
      if (out.length >= limit) return;
      if (SKIP_DIRS.has(e.name)) continue;
      const rel = dir === '.' ? e.name : `${dir}/${e.name}`;
      if (SKIP_PATHS.some((p) => rel.startsWith(p))) continue;
      if (e.isDirectory()) step(rel);
      else if (rel.endsWith('.md')) out.push(rel);
    }
  };
  step(relDir);
  return out;
}

function groupOf(rel) {
  if (rel.startsWith('.ai/')) return 'huong dan AI';
  if (/^(AGENTS|README|CONTRIBUTING|CHANGELOG)\.md$/.test(rel) || rel.startsWith('.github/')) return 'quy trinh';
  if (rel.startsWith('docs/opencode/')) return 'bao cao task';
  if (rel.startsWith('docs/')) return 'quy dinh';
  if (rel.startsWith('tests/')) return 'test plan';
  if (rel.startsWith('qa/')) return 'qa';
  return 'khac';
}

const docCache = new Map();
/** Đọc + metadata của một file .md, có cache theo mtime. */
function loadDoc(rel) {
  const abs = resolveInsideRepo(rel);
  const stat = fs.statSync(abs);
  const cacheKey = `${rel}@${stat.mtimeMs}`;
  const cached = docCache.get(rel);
  if (cached && cached.cacheKey === cacheKey) return cached;
  const text = fs.readFileSync(abs, 'utf8');
  const doc = {
    rel,
    cacheKey,
    abs,
    text,
    lines: text.split('\n'),
    bytes: stat.size,
    modified: new Date(stat.mtimeMs).toISOString().slice(0, 10),
    group: groupOf(rel),
    title: (text.match(/^#\s+(.+)$/m) || [])[1] ?? rel,
    headings: [...text.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1].trim()).slice(0, 40),
  };
  docCache.set(rel, doc);
  return doc;
}

function allDocs() {
  return walk('.');
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

startServer({
  name: 'kbt-docs',
  version: '1.0.0',
  instructions:
    'Tra cứu TÀI LIỆU DỰ ÁN (160+ file Markdown: quy trình, quy định nội dung, báo cáo task, trạng thái hiện tại). ' +
    'Thứ tự dùng: docs_for_topic để biết đọc file nào → read_doc để đọc → search_docs khi cần chính xác từng dòng. ' +
    'Tài liệu mô tả quyết định cũ có thể đã lỗi thời; trước khi dựa vào một con số/tên file, kiểm chứng lại bằng code hoặc kbt-quality-gates.',
  tools: [
    {
      name: 'list_docs',
      description: 'Mục lục tài liệu Markdown: đường dẫn, nhóm, tiêu đề, kích thước, ngày sửa.',
      inputSchema: obj({
        group: en('Lọc theo nhóm; bỏ trống = tất cả', [
          'huong dan AI',
          'quy trinh',
          'quy dinh',
          'bao cao task',
          'test plan',
          'qa',
          'khac',
        ]),
        sort: en('Thứ tự sắp xếp', ['modified', 'group', 'path']),
        limit: num('Số file trả về, mặc định 120', 120),
      }),
      handler({ group, sort = 'modified', limit = 120 }) {
        let rows = allDocs().map((rel) => {
          const d = loadDoc(rel);
          return { path: rel, group: d.group, title: d.title, bytes: d.bytes, modified: d.modified };
        });
        if (group) rows = rows.filter((r) => r.group === group);
        rows.sort((a, b) =>
          sort === 'path'
            ? a.path.localeCompare(b.path)
            : sort === 'group'
              ? a.group.localeCompare(b.group) || a.path.localeCompare(b.path)
              : b.modified.localeCompare(a.modified) || a.path.localeCompare(b.path)
        );
        const counts = {};
        for (const r of rows) counts[r.group] = (counts[r.group] || 0) + 1;
        return { total: rows.length, byGroup: counts, docs: rows.slice(0, Math.min(Number(limit) || 120, 400)) };
      },
    },

    {
      name: 'search_docs',
      description:
        'Tìm chuỗi/regex trong tài liệu Markdown, trả về file:line + câu chứa từ khoá. Mặc định không phân biệt hoa thường và tự escape regex.',
      inputSchema: obj({
        query: str('Từ khoá hoặc cụm cần tìm, vd "cờ tướng", "isDemoData", "bundle budget"'),
        regex: bool('Coi query là regex (mặc định false = tìm literal)', false),
        group: en('Giới hạn nhóm tài liệu', ['huong dan AI', 'quy trinh', 'quy dinh', 'bao cao task', 'test plan', 'qa', 'khac']),
        contains: arr('Chỉ trả file có ÍT NHẤT một dòng khớp mọi từ khoá này (AND)', { type: 'string' }),
        limit: num('Số kết quả, mặc định 40', 40),
        context: num('Số dòng trước/sau mỗi kết quả, mặc định 0 (tối đa 3)', 0),
      }, ['query']),
      handler({ query, regex = false, group, contains, limit = 40, context = 0 }) {
        if (!query || !String(query).trim()) throw new Error('query không được rỗng');
        const re = new RegExp(regex ? String(query) : escapeRe(String(query)), 'i');
        const andWords = (Array.isArray(contains) ? contains : []).map((w) => new RegExp(escapeRe(w), 'i'));
        const ctx = Math.max(0, Math.min(Number(context) || 0, 3));
        const hits = [];
        let scanned = 0;
        for (const rel of allDocs()) {
          const d = loadDoc(rel);
          if (group && d.group !== group) continue;
          scanned++;
          if (andWords.length && !d.lines.some((l) => andWords.every((w) => w.test(l)))) continue;
          for (let i = 0; i < d.lines.length; i++) {
            if (!re.test(d.lines[i])) continue;
            hits.push({
              path: rel,
              group: d.group,
              line: i + 1,
              text: clip(d.lines[i].trim(), 240),
              ...(ctx
                ? {
                    before: d.lines.slice(Math.max(0, i - ctx), i).map((l) => clip(l.trim(), 160)),
                    after: d.lines.slice(i + 1, i + 1 + ctx).map((l) => clip(l.trim(), 160)),
                  }
                : {}),
            });
            if (hits.length >= Math.min(Number(limit) || 40, 200)) {
              return { query, scannedDocs: scanned, hits, truncated: true };
            }
          }
        }
        return { query, scannedDocs: scanned, hits, truncated: false };
      },
    },

    {
      name: 'docs_for_topic',
      description:
        'Chủ đề này nằm ở tài liệu nào? Xếp hạng theo số lần nhắc — dùng trước khi mở file để biết phải đọc gì.',
      inputSchema: obj({
        topic: str('Chủ đề, vd "kidbox", "luyện đọc", "cờ tướng", "P42", "PWA"'),
        limit: num('Số tài liệu trả về, mặc định 12', 12),
      }, ['topic']),
      handler({ topic, limit = 12 }) {
        if (!topic || !String(topic).trim()) throw new Error('topic không được rỗng');
        const topicRe = (flags) => new RegExp(escapeRe(String(topic)), flags);
        const rows = [];
        for (const rel of allDocs()) {
          const d = loadDoc(rel);
          const bodyMatches = (d.text.match(topicRe('gi')) || []).length;
          if (!bodyMatches) continue;
          const inTitle = topicRe('i').test(d.title);
          rows.push({
            path: rel,
            group: d.group,
            title: d.title,
            mentions: bodyMatches,
            modified: d.modified,
            headingsMatching: d.headings.filter((h) => topicRe('i').test(h)).slice(0, 5),
            ...(inTitle ? { note: 'có trong tiêu đề' } : {}),
          });
        }
        rows.sort((a, b) => b.mentions - a.mentions || b.modified.localeCompare(a.modified));
        return {
          topic,
          docsFound: rows.length,
          top: rows.slice(0, Math.min(Number(limit) || 12, 60)),
          hint:
            rows.length === 0
              ? 'Không có tài liệu nào nhắc chủ đề này — có thể tính năng chưa được viết tài liệu; search_code/curriculum sẽ đáng tin hơn.'
              : undefined,
        };
      },
    },

    {
      name: 'read_doc',
      description: 'Đọc một tài liệu (toàn bộ hoặc theo khoảng dòng). Đường dẫn phải ở trong repo.',
      inputSchema: obj({
        path: str('Đường dẫn tương đối repo, vd "docs/SDLC.md"'),
        from_line: num('Dòng bắt đầu (1-based, mặc định 1)', 1),
        max_lines: num('Số dòng tối đa, mặc định 240', 240),
        outline: bool('Chỉ trả danh sách heading + số dòng, không trả nội dung', false),
      }, ['path']),
      handler({ path: rel, from_line = 1, max_lines = 240, outline = false }) {
        if (!rel) throw new Error('path không được rỗng');
        const d = loadDoc(rel);
        if (outline) {
          const marks = [];
          d.lines.forEach((l, i) => {
            const m = l.match(/^(#{1,4})\s+(.+)$/);
            if (m) marks.push({ line: i + 1, level: m[1].length, text: m[2].trim() });
          });
          return { path: rel, title: d.title, modified: d.modified, totalLines: d.lines.length, outline: marks };
        }
        const from = Math.max(1, Number(from_line) || 1);
        const count = Math.max(1, Math.min(Number(max_lines) || 240, 1200));
        const slice = d.lines.slice(from - 1, from - 1 + count);
        return {
          path: rel,
          title: d.title,
          modified: d.modified,
          fromLine: from,
          toLine: Math.min(d.lines.length, from + count - 1),
          totalLines: d.lines.length,
          truncated: from - 1 + count < d.lines.length,
          content: clip(slice.join('\n'), 16000),
        };
      },
    },

    {
      name: 'project_state',
      description:
        'Bức tranh hiện tại: ngày cập nhật .ai/CURRENT.md, các task gần nhất, [Unreleased] trong CHANGELOG, mục quy trình SDLC và dấu audit.',
      inputSchema: obj({
        tasks: num('Số dòng task P42/gần nhất lấy từ CURRENT.md, mặc định 12', 12),
      }),
      handler({ tasks = 12 }) {
        const read = (rel) => {
          try {
            return loadDoc(rel);
          } catch {
            return null;
          }
        };
        const current = read('.ai/CURRENT.md');
        const changelog = read('CHANGELOG.md');
        const sdlc = read('docs/SDLC.md');
        const audit = read('docs/AUDIT_REPORT.md');

        let auditState = null;
        try {
          auditState = JSON.parse(fs.readFileSync(resolveInsideRepo('docs/audit-state.json'), 'utf8'));
        } catch {
          // audit-state.json chưa tồn tại trên máy này — vẫn trả phần còn lại
        }

        const bulletLines = (doc) =>
          (doc?.lines ?? []).filter((l) => /^\s*-\s+\S/.test(l)).map((l) => l.trim().slice(0, 300));

        const unreleased = (() => {
          if (!changelog) return null;
          const start = changelog.lines.findIndex((l) => /^## \[Unreleased\]/i.test(l));
          if (start === -1) return null;
          const rest = changelog.lines.slice(start + 1);
          const end = rest.findIndex((l) => /^## \[/.test(l));
          return clip(rest.slice(0, end === -1 ? rest.length : end).join('\n').trim(), 3000);
        })();

        return {
          currentDoc: current
            ? {
                updated: (current.text.match(/\*\*Updated:\*\*\s*([^\n]+)/) || [])[1]?.trim() ?? null,
                modified: current.modified,
                headings: current.headings.slice(0, 12),
                latestTasks: bulletLines(current).slice(-Math.min(Number(tasks) || 12, 40)),
              }
            : 'thiếu .ai/CURRENT.md',
          changelogUnreleased: unreleased ?? 'thiếu CHANGELOG.md hoặc mục [Unreleased]',
          sdlcSections: sdlc ? sdlc.headings.slice(0, 14) : 'thiếu docs/SDLC.md',
          audit: auditState
            ? {
                lastAuditAt: auditState.lastAuditAt ?? null,
                filesTracked: Object.keys(auditState.files ?? {}).length,
                reportHeadings: audit ? audit.headings.slice(-6) : null,
              }
            : 'thiếu docs/audit-state.json',
        };
      },
    },

    {
      name: 'rules_digest',
      description:
        'Tổng hợp rule bắt buộc từ AGENTS.md, docs/SDLC.md và CONTRIBUTING.md thành một danh sách ngắn — gọi khi bắt đầu việc để không phá quy ước.',
      inputSchema: obj({
        include: arr('Chỉ lấy các nguồn này', { type: 'string' }),
      }),
      handler({ include }) {
        const wanted = Array.isArray(include) && include.length ? new Set(include) : null;
        const sources = [
          { key: 'AGENTS.md', rel: 'AGENTS.md', maxLines: 200 },
          { key: 'SDLC', rel: 'docs/SDLC.md', maxLines: 90 },
          { key: 'CONTRIBUTING', rel: 'CONTRIBUTING.md', maxLines: 90 },
          { key: 'OPENCODE_RULES', rel: 'docs/opencode/00_RULES.md', maxLines: 60 },
        ];
        const out = [];
        for (const s of sources) {
          if (wanted && !wanted.has(s.key)) continue;
          try {
            const d = loadDoc(s.rel);
            out.push({
              source: s.rel,
              title: d.title,
              modified: d.modified,
              sections: d.headings.slice(0, 18),
              digest: clip(d.lines.slice(0, s.maxLines).join('\n'), 4200),
            });
          } catch {
            out.push({ source: s.rel, missing: true });
          }
        }
        return { sources: out };
      },
    },
  ],
});
