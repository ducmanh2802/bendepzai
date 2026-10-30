import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * T23 — cổng cho lớp MCP trong `mcp/`.
 *
 * Năm server này là công cụ agent dùng mỗi ngày, nên phải giữ được ba điều:
 * chúng parse được bằng đúng Node (không thêm cú trình biên dịch), chúng
 * **zero-dependency** (đúng cam kết với người dùng), và helper đăng ký 4 danh
 * sách mà `check_game_registration` dựa vào vẫn đọc đúng repo.
 */

const ROOT = path.resolve(__dirname, '..');
const MCP_DIR = path.join(ROOT, 'mcp');

const serverFiles = readdirSync(MCP_DIR)
  .filter((f) => f.endsWith('.mjs') && f !== 'devclient.mjs')
  .sort();

const allMjs = [...serverFiles, ...readdirSync(path.join(MCP_DIR, 'lib')).map((f) => path.join('lib', f))];

describe('T23 — MCP servers', () => {
  it('đủ 5 server đã đăng ký trong mcp/README.md', () => {
    expect(serverFiles).toEqual(['curriculum.mjs', 'docs.mjs', 'progress.mjs', 'quality-gates.mjs', 'scaffold.mjs']);
    expect(existsSync(path.join(MCP_DIR, 'README.md'))).toBe(true);
  });

  it.each(allMjs)('%s parse được bằng Node trực tiếp (không cần build step)', (rel) => {
    const abs = path.join(MCP_DIR, rel);
    expect(() => execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' })).not.toThrow();
  });

  it.each(allMjs)('%s chỉ import node builtin hoặc lib nội bộ', (rel) => {
    const text = readFileSync(path.join(MCP_DIR, rel), 'utf8');
    // chỉ statement import thật ở đầu file — scaffold.mjs có template string chứa
    // `import React from 'react'` dành cho file nó sinh ra, không phải dependency của server
    const specifiers = [...text.matchAll(/^import\s[^;\n]*?from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    const external = specifiers.filter((s) => !s.startsWith('node:') && !s.startsWith('./') && !s.startsWith('../'));
    expect(external).toEqual([]);
  });

  it('mcp/lib/repo.mjs đọc đúng bất biến 4 danh sách trò chơi', async () => {
    const { readRegistration } = await import('../mcp/lib/repo.mjs' as string);
    const reg = readRegistration();
    expect(reg.problems).toEqual([]);
    expect(reg.catalog.ids.length).toBeGreaterThan(0);
    expect(reg.registry.ids.slice().sort()).toEqual(reg.catalog.ids.slice().sort());
    expect(reg.policy.ids.slice().sort()).toEqual(reg.catalog.ids.slice().sort());
    expect(reg.qa.titles.length).toBe(reg.catalog.ids.length);
  });

  it('fixture tiến độ là dữ liệu giả định có cờ isDemoData', () => {
    const fixture = JSON.parse(readFileSync(path.join(MCP_DIR, 'sample-export.json'), 'utf8'));
    expect(fixture.kho_bau_child_profile.isDemoData).toBe(true);
    // key thật của app, không phải key bịa ra cho test
    expect(Object.keys(fixture)).toContain('kho_bau_learning_os_store');
    expect(fixture.kho_bau_game_progress.games).toBeTypeOf('object');
  });

  it('progress/ phải bị .gitignore vì chứa dữ liệu của trẻ', () => {
    const ignore = readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    expect(ignore.split('\n').map((l) => l.trim())).toContain('progress/');
  });
});
