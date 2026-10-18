import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  collectPrecacheUrls,
  injectPrecacheManifest,
  PRECACHE_PLACEHOLDER,
} from '../scripts/sw-precache.mjs';

function makeDist(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-precache-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

describe('T02C — sw precache manifest builder', () => {
  it('collects shell, chunks, css, fonts and icons deterministically', () => {
    const dir = makeDist({
      'index.html': '<html></html>',
      'assets/index-abc123.js': 'x',
      'assets/react-vendor-def456.js': 'y',
      'assets/index-ghi789.css': 'z',
      'fonts/nunito-vietnamese.woff2': 'f',
      'icon-192.png': 'i',
      'favicon.svg': 's',
      'manifest.webmanifest': '{}',
      'sw.js': 'worker',
    });
    const urls = collectPrecacheUrls(dir);
    expect(urls).toContain('/index.html');
    expect(urls).toContain('/manifest.webmanifest');
    expect(urls).toContain('/assets/index-abc123.js');
    expect(urls).toContain('/assets/react-vendor-def456.js');
    expect(urls).toContain('/assets/index-ghi789.css');
    expect(urls).toContain('/fonts/nunito-vietnamese.woff2');
    expect(urls).toContain('/icon-192.png');
    expect(urls).toContain('/favicon.svg');
    // sw.js must never precache itself; sorted + deduplicated.
    expect(urls).not.toContain('/sw.js');
    expect([...urls].sort()).toEqual(urls);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('injects the manifest and fails loudly on a missing placeholder', () => {
    const dir = makeDist({ 'sw.js': `const M = ${PRECACHE_PLACEHOLDER};` });
    const swPath = path.join(dir, 'sw.js');
    const urls = injectPrecacheManifest(swPath, ['/index.html', '/assets/index-x.js']);
    expect(urls).toEqual(['/index.html', '/assets/index-x.js']);
    const patched = fs.readFileSync(swPath, 'utf8');
    expect(patched).not.toContain(PRECACHE_PLACEHOLDER);
    expect(patched).toContain('"/assets/index-x.js"');
    expect(() => injectPrecacheManifest(swPath, [])).toThrow();
    expect(() => injectPrecacheManifest(path.join(dir, 'missing.js'), [])).toThrow();
  });

  it('public/sw.js keeps the placeholder and a dev-safe typeof guard', () => {
    const source = fs.readFileSync(
      path.join(import.meta.dirname, '..', 'public', 'sw.js'),
      'utf8'
    );
    expect(source).toContain(PRECACHE_PLACEHOLDER);
    expect(source).toContain(`typeof ${PRECACHE_PLACEHOLDER} !== 'undefined'`);
    expect(source).toContain("const CACHE_VERSION = 'kho-bau-v3'");
    expect(source).toContain('!key.startsWith(CACHE_VERSION)');
  });
});
