/*
 * SERVICE WORKER — Kho Báu Tri Thức Lớp 1
 *
 * Goals (§25): the app must keep working with the network unavailable.
 * Safety: this file must NEVER be able to break the app.
 *
 * T02C — one versioned cache (`kho-bau-v3`) + a build-generated precache
 * manifest. `__PRECACHE_MANIFEST__` is replaced with the real list of
 * same-origin URLs (every JS/CSS chunk, fonts, icons) by
 * `scripts/sw-precache.mjs` during `npm run build`. In environments where the
 * placeholder was never replaced (dev server), the `typeof` guard below
 * degrades to an empty list — the worker still installs and still caches
 * lazily at runtime.
 *
 * Strategy — deliberately conservative:
 *   - NAVIGATION  : network-first, fall back to the cached shell.
 *                   Network-first is the SAFE choice: a stale HTML file could
 *                   reference asset hashes that no longer exist, which would
 *                   hard-break the app. Preferring the network means updates
 *                   always land and stale HTML is never served while online.
 *   - STATIC ASSETS (hashed JS/CSS/fonts): stale-while-revalidate.
 *                   Filenames are content-hashed, so a cached hit can never be
 *                   wrong for the current build.
 *   - CROSS-ORIGIN: stale-while-revalidate, failures tolerated.
 *   - NEVER cache non-GET requests or anything that is not http(s).
 *
 * The cache name carries a version so a new deploy purges the previous cache.
 *
 * FIX offline-lazy (2026-10-30): `vite preview` (và có thể vài CDN) trả asset
 * kèm `Vary: Origin`. Trả lời đó được Cache API lưu theo khoá là request lúc
 * fetch — request precache từ SW KHÔNG có header `Origin`, còn request script
 * thật của trang THÌ CÓ (`Origin: http://localhost:4173`). Vì thế mọi
 * `cache.match()` mặc định trượt và chunk lazy chết `net::ERR_FAILED` khi tắt
 * mạng, dù manifest đã precache đủ. Trang mình chỉ lấy asset same-origin do
 * chính nó sinh (tên đã hash nội dung), nên bỏ qua Vary ở nhánh same-origin
 * là an toàn; nhánh cross-origin vẫn tôn trọng Vary.
 */

const CACHE_VERSION = 'kho-bau-v3';
const CACHE_NAME = CACHE_VERSION;
const SHELL_URL = '/index.html';

/** T02C — replaced at build time with every same-origin URL to precache. */
const PRECACHE_MANIFEST =
  typeof __PRECACHE_MANIFEST__ !== 'undefined' ? __PRECACHE_MANIFEST__ : [];

/** T01/B12 — self-hosted fonts precached for offline use (fallback when the
 *  build manifest is unavailable, e.g. an unpatched dev copy).
 *  FIX font-nhoe: 4 file variable thay cho 14 file per-weight cũ. */
const FONT_URLS = [
  '/fonts/nunito-latin.woff2',
  '/fonts/nunito-vietnamese.woff2',
  '/fonts/comfortaa-latin.woff2',
  '/fonts/comfortaa-vietnamese.woff2',
];

/** Asset extensions we are willing to cache. */
const CACHEABLE_DESTINATIONS = ['script', 'style', 'font', 'image', 'worker'];

self.addEventListener('install', (event) => {
  // Precache the build manifest (shell + every known chunk/font/icon).
  // Best-effort, never blocks: a failure must not block activation.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        const targets = (Array.isArray(PRECACHE_MANIFEST) && PRECACHE_MANIFEST.length > 0
          ? PRECACHE_MANIFEST
          : [SHELL_URL, ...FONT_URLS]
        ).map((u) => new Request(u, { cache: 'reload' }));
        return Promise.allSettled(targets.map((req) => cache.add(req))).then(() => undefined);
      })
      .catch(() => {
        /* Precache is best-effort: a failure must not block activation. */
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
      // §11 — safe update model. A new worker activates immediately (no user can
      // ever be trapped on an obsolete build), but the open page still runs the
      // old bundle. Tell it a new version is live so it can offer a reload at a
      // safe moment — never forced, and localStorage is never touched.
      // T01B/7 — chỉ báo cho các trang ĐANG bị SW điều khiển (bản mới thay thế
      // bản cũ). Trang mở lần đầu (uncontrolled) không nhận tin → không hiện
      // banner sai ở lần mở đầu tiên. Phía app (pwa.ts) cũng guard controller.
      .then(() =>
        self.clients.matchAll({ type: 'window' }).then((clients) => {
          for (const client of clients) {
            try {
              client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
            } catch (error) {
              /* One unreachable client must not break activation. */
            }
          }
        })
      )
      .catch(() => {
        /* Activation must never throw. */
      })
  );
});

self.addEventListener('message', (event) => {
  // Lets the app (and QA) ask the worker to drop caches and re-fetch.
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});

/** Network-first, falling back to the cached shell when offline. */
async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(SHELL_URL, fresh.clone());
    return fresh;
  } catch (error) {
    const cached = await caches.match(SHELL_URL, { ignoreSearch: true, ignoreVary: true });
    if (cached) return cached;
    throw error;
  }
}

/** Cache-first from a previous visit, refreshed in the background. */
async function staleWhileRevalidate(request, cacheName, matchOptions) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, matchOptions);

  const network = fetch(request)
    .then((response) => {
      // Only store real, complete responses. Opaque/font failures must not
      // poison the cache.
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    // Kick off a background refresh without blocking the response.
    network.catch(() => undefined);
    return cached;
  }

  const fresh = await network;
  if (fresh) return fresh;
  throw new Error('offline and not cached');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 1) App shell / any in-app navigation.
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // 2) Same-origin hashed assets: safe to serve from cache.
  //    `ignoreVary` — xem ghi chú đầu file: server có thể trả `Vary: Origin`,
  //    khiến khoá precache (không có Origin) không khớp request script của
  //    trang (có Origin). Tên file đã hash theo nội dung nên bỏ qua Vary an
  //    toàn; cross-origin vẫn giữ nguyên tắc tôn trọng Vary.
  if (url.origin === self.location.origin && CACHEABLE_DESTINATIONS.includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME, { ignoreVary: true }));
    return;
  }

  // 3) Cross-origin (Google Fonts): best-effort only.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      staleWhileRevalidate(request, CACHE_NAME).catch(() =>
        fetch(request).catch(() => Response.error())
      )
    );
  }
});
