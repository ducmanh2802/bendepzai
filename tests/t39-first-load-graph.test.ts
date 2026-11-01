import { describe, it, expect, vi } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getBudgetReport, MAIN_CHUNK_GOAL_BYTES } from '../scripts/check-bundle-budget.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, '..', 'dist');
const hasDist = existsSync(join(DIST, 'assets'));
const read = (rel: string) => readFileSync(join(here, '..', rel), 'utf8');

if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

const sdkCalls = vi.hoisted(() => ({ app: 0, auth: 0, firestore: 0 }));

vi.mock('firebase/app', () => ({
  initializeApp: () => {
    sdkCalls.app++;
    return {};
  },
  getApps: () => [],
  getApp: () => ({}),
}));

vi.mock('firebase/auth', () => ({
  getAuth: () => {
    sdkCalls.auth++;
    return { currentUser: null };
  },
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
  signInWithPopup: async () => ({ user: null }),
  signOut: async () => {},
  onAuthStateChanged: (_auth: unknown, next: (u: null) => void) => {
    next(null);
    return () => {};
  },
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: () => {
    sdkCalls.firestore++;
    return {};
  },
  doc: (_db: unknown, ...parts: string[]) => ({ path: parts.join('/') }),
  getDoc: async () => ({ exists: () => false, data: () => null }),
  setDoc: async () => {},
}));

const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

describe('T39 — đồ thị tải lúc mở app (first-load graph)', () => {
  it.runIf(hasDist)('main chunk đạt trần mục tiêu 450 kB sau khi tách màn học + ngân hàng đề', () => {
    const report = getBudgetReport(DIST);
    expect(
      report.meetsGoal,
      `main chunk ${report.mainChunk} = ${(report.mainBytes / 1024).toFixed(1)} kB, goal ${MAIN_CHUNK_GOAL_BYTES / 1024} kB`
    ).toBe(true);
  });

  it.runIf(hasDist)('không tải Firebase / ngân hàng đề trước khi bé tương tác', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    const boot = [...html.matchAll(/assets\/[A-Za-z0-9_.-]+\.js/g)].map((m) => m[0]);
    expect(boot.some((f) => f.startsWith('firebase-vendor-'))).toBe(false);
    expect(boot.some((f) => f.startsWith('three-vendor-'))).toBe(false);
    expect(boot.some((f) => f.startsWith('math-bank-'))).toBe(false);
    expect(boot.some((f) => f.startsWith('english-bank-'))).toBe(false);
  });

  it.runIf(hasDist)('tổng dung lượng chặn lần vẽ đầu ≤ 500 kB', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    const boot = [...new Set([...html.matchAll(/assets\/[A-Za-z0-9_.-]+\.js/g)].map((m) => m[0]))];
    const files = readdirSync(join(DIST, 'assets'));
    let total = 0;
    for (const b of boot) {
      const name = b.replace('assets/', '');
      expect(files).toContain(name);
      total += readFileSync(join(DIST, 'assets', name)).length;
    }
    expect(total / 1024).toBeLessThanOrEqual(500);
  });

  it('Firebase chỉ được nạp qua SDK loader, không phải import tĩnh', () => {
    const runtimeImports = read('src/services/firebase.ts')
      .split('\n')
      .filter((l) => /^import /.test(l) && /from 'firebase\//.test(l) && !/^import type /.test(l));
    expect(runtimeImports).toHaveLength(0);
    expect(read('src/services/firebase.ts')).toContain('export function loadFirebaseSdk');
    expect(read('src/services/firebase.ts')).toContain("import('firebase/app')");
    expect(read('src/services/firebase.ts')).not.toMatch(/^const app = /m);
  });

  it('cloudSync không tự bật đăng nhập, và lưu đúng một cờ thiết bị (không lưu bài làm của bé)', () => {
    const cs = read('src/services/cloudSync.ts');
    expect(cs).toContain("import { loadFirebaseSdk, onAuthChange, type CloudUser } from './firebase';");
    expect(cs).toContain('if (readSessionHint()) {');
    expect(cs).toContain('public start(): void');
    expect(cs).toContain("const CLOUD_SESSION_HINT = 'kho_bau_cloud_session_hint'");
    expect(cs).toMatch(/localStorage\.setItem\(CLOUD_SESSION_HINT, '1'\)/);
    const modal = read('src/components/auth/AccountModal.tsx');
    expect(modal).toContain('CloudSyncService.start()');
  });

  it('thiết bị chưa từng đăng nhập: import cloudSync không đụng tới SDK Firebase', async () => {
    vi.resetModules();
    sdkCalls.app = 0;
    sdkCalls.auth = 0;
    localStorage.clear();
    // node env: không có window → constructor không đăng ký theo dõi auth.
    const { CloudSyncService } = await import('../src/services/cloudSync');
    await flush();
    expect(CloudSyncService.getState().user).toBeNull();
    expect(sdkCalls.app).toBe(0);
    expect(sdkCalls.auth).toBe(0);
  });

  it('thiết bị từng đăng nhập: có cờ là SDK mới được khởi tạo', async () => {
    vi.resetModules();
    sdkCalls.app = 0;
    sdkCalls.auth = 0;
    localStorage.clear();
    localStorage.setItem('kho_bau_cloud_session_hint', '1');
    const listeners: Array<() => void> = [];
    (globalThis as unknown as { window: unknown }).window = {
      addEventListener: (_type: string, fn: () => void) => {
        listeners.push(fn);
      },
    };
    const { CloudSyncService } = await import('../src/services/cloudSync');
    await flush();
    expect(sdkCalls.app).toBe(1);
    expect(sdkCalls.auth).toBe(1);
    expect(sdkCalls.firestore).toBe(1);
    expect(CloudSyncService.getState().status).toBe('offline');
    expect(listeners.length).toBe(1);
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it('ngân hàng đề tự gắn catalogue vào storage ngay khi được nạp', async () => {
    vi.resetModules();
    localStorage.clear();
    const { StorageService } = await import('../src/services/storage');
    expect(Object.keys(StorageService.getAnalytics().skillMastery)).toHaveLength(0);
    await import('../src/data/curriculum');
    const seeded = StorageService.getAnalytics().skillMastery;
    const ids = Object.keys(seeded);
    expect(ids.length).toBeGreaterThan(10);
    const first = seeded[ids[0]];
    expect(first.skillName).toBeTruthy();
    expect(first.attempts).toBe(0);
  });

  it('Cờ Tướng + IOE + prefetch curriculum nằm sau dynamic import trong App', () => {
    const app = read('src/App.tsx');
    expect(app).not.toMatch(/^import \{ CotuongScreen \}/m);
    expect(app).not.toMatch(/^import \{ EnglishIoeScreen \}/m);
    expect(app).toContain("import('./components/learning/cotuong/CotuongScreen')");
    expect(app).toContain("import('./components/learning/englishIoe/EnglishIoeScreen')");
    expect(app).toContain("import('./data/curriculum')");
    expect(app).toContain('<Suspense fallback={<ScreenFallback label="Vương Quốc Cờ Tướng" />}>');
  });
});
