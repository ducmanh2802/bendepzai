/**
 * T02C — build-time precache manifest for the service worker.
 *
 * `public/sw.js` ships a `__PRECACHE_MANIFEST__` placeholder. After Vite
 * finishes (including the public/ copy), the build plugin calls
 * `injectPrecacheManifest()` to replace the placeholder with the real list of
 * same-origin URLs: every emitted JS/CSS chunk plus fonts, icons and the
 * manifest. The worker then precaches them on install (best-effort), so a
 * lazily-loaded chunk that was fetched at least once while online keeps
 * working offline.
 *
 * Pure helpers are exported for unit tests; the CLI form patches dist/:
 *   node scripts/sw-precache.mjs [distDir]
 */

import fs from 'node:fs';
import path from 'node:path';

export const PRECACHE_PLACEHOLDER = '__PRECACHE_MANIFEST__';

/** Walks a directory recursively, returning posix-style relative paths. */
function walkFiles(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, base, out);
    } else {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

/**
 * Collects same-origin precache URLs from a finished build directory.
 * Deterministic: sorted, deduplicated, posix paths with a leading slash.
 */
export function collectPrecacheUrls(distDir) {
  const urls = new Set();
  urls.add('/index.html');
  urls.add('/manifest.webmanifest');

  if (!fs.existsSync(distDir)) return [...urls].sort();

  // 1) Emitted bundles: every JS chunk + CSS (hashed names change per build,
  //    which is exactly why the list must be generated, not hardcoded).
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    for (const file of walkFiles(assetsDir)) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        urls.add(`/assets/${file}`);
      }
    }
  }

  // 2) Self-hosted fonts (offline-first since T01).
  const fontsDir = path.join(distDir, 'fonts');
  if (fs.existsSync(fontsDir)) {
    for (const file of walkFiles(fontsDir)) {
      urls.add(`/fonts/${file}`);
    }
  }

  // 3) Icons + favicon + apple touch icon (top-level public files).
  for (const file of walkFiles(distDir)) {
    if (file.includes('/')) continue; // nested dirs handled above
    if (
      file === 'sw.js' ||
      file === 'index.html' ||
      file === 'manifest.webmanifest' ||
      /\.(png|svg|ico|webmanifest)$/i.test(file)
    ) {
      if (file !== 'sw.js') urls.add(`/${file}`);
    }
  }

  return [...urls].sort();
}

/**
 * Replaces the PRECACHE placeholder inside the built sw.js.
 * Returns the URL list that was injected. Throws when the placeholder or
 * the file is missing so a broken offline build fails loudly.
 */
export function injectPrecacheManifest(swPath, urls) {
  if (!fs.existsSync(swPath)) {
    throw new Error(`service worker not found at ${swPath}`);
  }
  const source = fs.readFileSync(swPath, 'utf8');
  if (!source.includes(PRECACHE_PLACEHOLDER)) {
    throw new Error(`placeholder ${PRECACHE_PLACEHOLDER} missing in ${swPath}`);
  }
  const patched = source.replaceAll(PRECACHE_PLACEHOLDER, JSON.stringify(urls));
  fs.writeFileSync(swPath, patched);
  return urls;
}

// CLI: node scripts/sw-precache.mjs [distDir]
const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('sw-precache.mjs');
if (isMain) {
  const distDir = path.resolve(process.argv[2] ?? 'dist');
  const urls = collectPrecacheUrls(distDir);
  injectPrecacheManifest(path.join(distDir, 'sw.js'), urls);
  console.log(`sw precache: injected ${urls.length} URLs into dist/sw.js`);
}
