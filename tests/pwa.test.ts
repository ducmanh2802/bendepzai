import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { inspectPwaSupport, registerServiceWorker } from '../src/services/pwa';

const here = dirname(fileURLToPath(import.meta.url));
const SW_PATH = join(here, '..', 'public', 'sw.js');
const swSource = existsSync(SW_PATH) ? readFileSync(SW_PATH, 'utf8') : '';

describe('PWA support matrix (§25)', () => {
  const base = { isBrowser: true, hasServiceWorkerApi: true, isSecureContext: true, isProduction: true };

  it('registers in a production browser over https', () => {
    const s = inspectPwaSupport(base);
    expect(s.shouldRegister).toBe(true);
    expect(s.reason).toBe('ok');
  });

  it('never registers outside a browser', () => {
    expect(inspectPwaSupport({ ...base, isBrowser: false }).shouldRegister).toBe(false);
    expect(inspectPwaSupport({ ...base, isBrowser: false }).reason).toBe('not-a-browser');
  });

  it('never registers when the Service Worker API is missing', () => {
    const s = inspectPwaSupport({ ...base, hasServiceWorkerApi: false });
    expect(s.shouldRegister).toBe(false);
    expect(s.reason).toBe('no-service-worker-api');
  });

  it('never registers in an insecure context', () => {
    const s = inspectPwaSupport({ ...base, isSecureContext: false });
    expect(s.shouldRegister).toBe(false);
    expect(s.reason).toBe('insecure-context');
  });

  it('never registers in development (would fight Vite HMR)', () => {
    const s = inspectPwaSupport({ ...base, isProduction: false });
    expect(s.shouldRegister).toBe(false);
    expect(s.reason).toBe('development-mode');
  });

  it('does nothing when there is no DOM (node / SSR / prerender)', () => {
    // Vitest runs in node: no window.document, so this must be a no-op.
    expect(registerServiceWorker()).toBeNull();
  });
});

describe('Service worker contract (§25 offline safety)', () => {
  it('exists and is shipped from public/', () => {
    expect(existsSync(SW_PATH)).toBe(true);
    expect(swSource.length).toBeGreaterThan(0);
  });

  it('uses network-first for navigation so a stale shell can never break the app', () => {
    expect(swSource).toContain("request.mode === 'navigate'");
    expect(swSource).toContain('handleNavigation');
    // The navigation handler must try the network FIRST.
    const handler = swSource.slice(swSource.indexOf('async function handleNavigation'));
    const fetchPos = handler.indexOf('await fetch(request)');
    const cacheMatchPos = handler.indexOf('caches.match');
    expect(fetchPos).toBeGreaterThan(-1);
    expect(cacheMatchPos).toBeGreaterThan(fetchPos);
  });

  it('precaches the build-generated manifest (T02C: placeholder replaced at build)', () => {
    // public/sw.js ships a placeholder; the vite plugin replaces it with the
    // real URL list (every JS/CSS chunk, fonts, icons) in dist/sw.js.
    expect(swSource).toContain('__PRECACHE_MANIFEST__');
    expect(swSource).toContain('PRECACHE_MANIFEST');
    const install = swSource.slice(swSource.indexOf("addEventListener('install'"));
    expect(install).toContain('PRECACHE_MANIFEST');
    // A single versioned cache holds everything (T02C: kho-bau-v3).
    expect(swSource).toContain("const CACHE_VERSION = 'kho-bau-v3'");
    // The placeholder must be runtime-safe even when never replaced (dev).
    expect(swSource).toContain("typeof __PRECACHE_MANIFEST__ !== 'undefined'");
  });

  it('never caches non-GET requests', () => {
    expect(swSource).toContain("if (request.method !== 'GET') return;");
  });

  it('only caches real responses, tolerating opaque and failed ones', () => {
    expect(swSource).toContain("response.ok || response.type === 'opaque'");
    expect(swSource).toContain('.catch(');
  });

  it('versions its caches so a deploy purges the previous one', () => {
    expect(swSource).toMatch(/const CACHE_VERSION = '[^']+';/);
    expect(swSource).toContain('!key.startsWith(CACHE_VERSION)');
  });

  it('purges old caches on activate and claims clients', () => {
    const activate = swSource.slice(swSource.indexOf("addEventListener('activate'"));
    expect(activate).toContain('caches.delete');
    expect(activate).toContain('clients.claim');
  });

  it('never intercepts non-http protocols', () => {
    expect(swSource).toContain("url.protocol !== 'http:'");
    expect(swSource).toContain("url.protocol !== 'https:'");
  });

  it('broadcasts SW_UPDATED on activate so the page can offer a safe reload (§11)', () => {
    expect(swSource).toContain('SW_UPDATED');
    expect(swSource).toContain('postMessage');
    // The update path must never touch learning data (comment mentions don't count).
    expect(swSource).not.toContain('localStorage.');
    expect(swSource).not.toContain('indexedDB');
  });
});

describe('Service worker update listener', () => {
  it('is a safe no-op outside a real browser (node / SSR)', async () => {
    const { onServiceWorkerUpdate } = await import('../src/services/pwa');
    const off = onServiceWorkerUpdate(() => {
      throw new Error('must never be called in node');
    });
    expect(typeof off).toBe('function');
    off();
  });
});

describe('App boot order', () => {
  it('registers the worker after the app mounts, guarded by pwa.ts', () => {
    const main = readFileSync(join(here, '..', 'src', 'main.tsx'), 'utf8');
    const renderAt = main.indexOf('.render(<App />)');
    const registerAt = main.indexOf('registerServiceWorker()');
    expect(renderAt).toBeGreaterThan(-1);
    expect(registerAt).toBeGreaterThan(renderAt);
  });
});

describe('Manifest icons (§6 — real decodable PNGs, not renamed files)', () => {
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  /** Reads width/height from the IHDR chunk — no image library needed. */
  function pngDimensions(buf: Buffer): { width: number; height: number } {
    expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    const length = buf.readUInt32BE(8);
    const type = buf.subarray(12, 16).toString('ascii');
    expect(type).toBe('IHDR');
    expect(length).toBe(13);
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  const manifest = JSON.parse(readFileSync(join(here, '..', 'public', 'manifest.webmanifest'), 'utf8'));

  it('declares 192 + 512 PNGs for any and maskable purposes', () => {
    const icons: Array<{ src: string; sizes: string; type: string; purpose: string }> = manifest.icons;
    const key = (i: (typeof icons)[number]) => `${i.sizes}|${i.purpose}`;
    const have = new Set(icons.map(key));
    for (const want of ['192x192|any', '512x512|any', '192x192|maskable', '512x512|maskable']) {
      expect(have.has(want)).toBe(true);
    }
  });

  it('ships a file for every manifest PNG reference', () => {
    const icons: Array<{ src: string; sizes?: string }> = manifest.icons.filter(
      (i: { type: string }) => i.type === 'image/png'
    );
    expect(icons.length).toBeGreaterThanOrEqual(4);
    for (const icon of icons) {
      const file = icon.src.replace(/^\//, '');
      const full = join(here, '..', 'public', file);
      expect(existsSync(full), `manifest references ${icon.src} but no file ships`).toBe(true);
      const dims = pngDimensions(readFileSync(full));
      const declared = icon.sizes?.split('x').map(Number);
      if (declared && declared.length === 2) {
        expect([dims.width, dims.height]).toEqual(declared);
      }
    }
  });

  it('icons are reproducible from the zero-dependency generator, not binary blobs', () => {
    const generator = readFileSync(join(here, '..', 'scripts', 'generate-icons.mjs'), 'utf8');
    expect(generator).toContain('deflateSync');
    expect(generator).toContain('IHDR');
    const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    for (const imaging of ['sharp', 'jimp', 'canvas', 'resvg', 'pngjs']) {
      expect(deps[imaging], `heavy native dep ${imaging} must not be required for icons`).toBeUndefined();
    }
  });
});