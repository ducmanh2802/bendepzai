/**
 * PWA / OFFLINE REGISTRATION
 *
 * Hard rules (§25, §32):
 *  - Registration must be **non-fatal**. Any failure (unsupported browser,
 *    insecure context, blocked by policy, quota) is swallowed.
 *  - Never register during development: a cached shell would fight Vite HMR
 *    and make local iteration look like "the app is broken".
 *  - Never register on a server or in a non-browser environment.
 */

const SERVICE_WORKER_URL = '/sw.js';

export type PwaSupport = {
  hasServiceWorkerApi: boolean;
  isSecureContext: boolean;
  shouldRegister: boolean;
  reason: string;
};

/** Inspects whether this environment can and should register a worker. */
export function inspectPwaSupport(
  env: {
    isBrowser: boolean;
    hasServiceWorkerApi: boolean;
    isSecureContext: boolean;
    isProduction: boolean;
  }
): PwaSupport {
  if (!env.isBrowser) {
    return { hasServiceWorkerApi: false, isSecureContext: false, shouldRegister: false, reason: 'not-a-browser' };
  }
  if (!env.hasServiceWorkerApi) {
    return { hasServiceWorkerApi: false, isSecureContext: env.isSecureContext, shouldRegister: false, reason: 'no-service-worker-api' };
  }
  if (!env.isSecureContext) {
    return { hasServiceWorkerApi: true, isSecureContext: false, shouldRegister: false, reason: 'insecure-context' };
  }
  if (!env.isProduction) {
    return { hasServiceWorkerApi: true, isSecureContext: true, shouldRegister: false, reason: 'development-mode' };
  }
  return { hasServiceWorkerApi: true, isSecureContext: true, shouldRegister: true, reason: 'ok' };
}

/**
 * Registers the service worker. Returns a promise that settles to the
 * registration (or `null` when registration failed), or `null` immediately when
 * registration is not applicable. Never throws.
 */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return null;

  const support = inspectPwaSupport({
    isBrowser: typeof window.document !== 'undefined',
    hasServiceWorkerApi: 'serviceWorker' in navigator,
    isSecureContext: window.isSecureContext === true,
    isProduction: import.meta.env.PROD === true,
  });
  if (!support.shouldRegister) return null;

  const start = (): Promise<ServiceWorkerRegistration | null> =>
    navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' }).catch(() => null);

  if (document.readyState === 'complete') {
    return start();
  }
  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(start()), { once: true });
  });
}

/**
 * Listens for the SW_UPDATED broadcast (§11) so the app can offer a reload at
 * a safe moment instead of forcing one mid-lesson. Safe to call anywhere: it is
 * a no-op (returns a no-op unsubscribe) outside a real browser. Never throws.
 *
 * T01B/7 — chỉ báo khi có SW MỚI THAY THẾ SW đang điều khiển trang: nếu
 * `navigator.serviceWorker.controller` là null thì trang chưa hề bị SW điều
 * khiển (lần mở đầu tiên / vừa cài đặt) → bỏ qua, không hiện banner.
 *
 * The controller must be read when the page STARTS: on a fresh install the new
 * worker runs `clients.claim()` before it broadcasts SW_UPDATED, so by the time
 * the message arrives the controller is already set and the "new version"
 * banner used to appear on the very first visit (QA `update-banner-hidden-first-load`).
 */
const PAGE_STARTED_CONTROLLED: boolean = (() => {
  try {
    return typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller;
  } catch {
    return false;
  }
})();

export function onServiceWorkerUpdate(callback: (version: string) => void): () => void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return () => {};
  if (!('serviceWorker' in navigator)) return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SW_UPDATED') {
      try {
        // First visit / fresh install: this page view never ran an old bundle
        // (no controller when it started) → not an update.
        if (!PAGE_STARTED_CONTROLLED || !navigator.serviceWorker.controller) return;
        callback(typeof event.data.version === 'string' ? event.data.version : 'unknown');
      } catch {
        /* A throwing subscriber must not break the listener. */
      }
    }
  };

  try {
    navigator.serviceWorker.addEventListener('message', handler);
  } catch {
    return () => {};
  }
  return () => {
    try {
      navigator.serviceWorker.removeEventListener('message', handler);
    } catch {
      /* Unsubscribe must never throw. */
    }
  };
}