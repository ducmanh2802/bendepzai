import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mobile layout guards (Home subject cards, header, bottom nav, update banner).
 * Verified in a real browser at 360/375/390/412/768/1280 with qa/mobile-home.mjs;
 * these checks keep the root causes from coming back.
 */
const here = dirname(fileURLToPath(import.meta.url));
const src = (p: string) => readFileSync(join(here, '..', p), 'utf8');

describe('KidButton sizes own padding + alignment', () => {
  const kb = src('src/components/ui/KidButton.tsx');

  it('has explicit "icon" and "tile" sizes', () => {
    expect(kb).toMatch(/icon:\s*'[^']*min-h-\[44px\] min-w-\[44px\]/);
    expect(kb).toMatch(/tile:\s*'[^']*flex-col items-stretch[^']*p-3/);
  });

  it('does not centre every button in the base classes (tiles must stretch)', () => {
    const base = kb.slice(kb.indexOf('const baseClasses'), kb.indexOf('const isTextLabel'));
    expect(base).not.toContain('items-center');
    expect(base).not.toContain('justify-center');
  });

  it('phone padding of md/lg/xl is smaller than the sm+ padding', () => {
    expect(kb).toMatch(/md:\s*'[^']*px-4 sm:px-6/);
    expect(kb).toMatch(/lg:\s*'[^']*px-5 sm:px-8/);
    expect(kb).toMatch(/xl:\s*'[^']*px-6 sm:px-10/);
  });
});

describe('Home subject cards fit a 360px phone', () => {
  const home = src('src/components/home/HomeScreen.tsx');
  const grid = home.slice(home.indexOf('Hôm Nay Bé Học Gì?'), home.indexOf('3. "NHIỆM VỤ HÔM NAY"'));

  it('2 equal columns of tile cards, title on its own row', () => {
    expect(grid).toContain('grid grid-cols-2');
    expect(grid).toContain('size="tile"');
    expect(grid).not.toContain('size="lg"');
    expect(grid).toContain('[overflow-wrap:anywhere]');
    expect(grid).toContain('line-clamp-3');
  });

  it('quest row is a 4-column grid instead of four fixed 80px tiles', () => {
    expect(home).toContain('grid grid-cols-4');
    expect(home).not.toContain('w-20 h-20 md:w-24 md:h-24 flex-shrink-0');
  });

  it('greeting speaker is a 44px icon button', () => {
    expect(home).toMatch(/size="icon"[\s\S]{0,80}playWelcomeVoice/);
  });
});

describe('Header + bottom navigation', () => {
  it('mascot paw is a row item (no absolute overlay on "Ba Mẹ", no render-time width check)', () => {
    const header = src('src/components/common/Header.tsx');
    // check class attributes / code, not the explanatory comments
    expect(header).not.toMatch(/className="[^"]*absolute top-2 right-2/);
    expect(header).not.toMatch(/window\.innerWidth\s*>=\s*375\s*&&/);
    expect(header).toMatch(/className="hidden min-\[375px\]:flex[^"]*w-11 h-11/);
  });

  it('content keeps the bottom-nav height + safe area free below lg', () => {
    const app = src('src/App.tsx');
    expect(app).toContain('pb-[calc(var(--kb-bottom-nav-h)+env(safe-area-inset-bottom))] lg:pb-6');
    expect(app).not.toContain('pb-16 md:pb-6');
    expect(src('src/index.css')).toMatch(/--kb-bottom-nav-h:\s*4\.75rem/);
  });

  it('bottom-nav labels wrap instead of being cut ("Trang C…")', () => {
    const app = src('src/App.tsx');
    const label = app.slice(app.indexOf('{tab.shortLabel}') - 200, app.indexOf('{tab.shortLabel}'));
    expect(label).not.toContain('truncate');
    expect(label).toContain('text-[14px]');
  });
});

describe('Update banner', () => {
  it('is not limited to half the viewport and sits above the bottom nav', () => {
    const banner = src('src/components/system/UpdateBanner.tsx');
    const cls = banner.match(/data-testid="update-banner"[\s\S]*?className="([^"]+)"/)?.[1] ?? '';
    expect(cls).not.toContain('left-1/2');
    expect(cls).toContain('inset-x-4 mx-auto w-fit');
    expect(cls).toContain('bottom-[calc(var(--kb-bottom-nav-h)+env(safe-area-inset-bottom)+0.5rem)]');
  });
});

describe('onServiceWorkerUpdate ignores the first install (claim() sets the controller before SW_UPDATED)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  function fakeBrowser(controllerAtStart: object | null) {
    const listeners: Array<(e: { data: unknown }) => void> = [];
    const serviceWorker = {
      controller: controllerAtStart,
      addEventListener: (type: string, fn: (e: { data: unknown }) => void) => {
        if (type === 'message') listeners.push(fn);
      },
      removeEventListener: () => {},
    };
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', { serviceWorker });
    return { serviceWorker, emit: (data: unknown) => listeners.forEach((fn) => fn({ data })) };
  }

  it('first visit: page started without a controller -> no banner even after claim()', async () => {
    const b = fakeBrowser(null);
    vi.resetModules();
    const { onServiceWorkerUpdate } = await import('../src/services/pwa');
    const seen: string[] = [];
    onServiceWorkerUpdate((v) => seen.push(v));
    b.serviceWorker.controller = {}; // clients.claim()
    b.emit({ type: 'SW_UPDATED', version: 'kho-bau-v9' });
    expect(seen).toEqual([]);
  });

  it('page running an old bundle under a worker -> banner with the new version', async () => {
    const b = fakeBrowser({});
    vi.resetModules();
    const { onServiceWorkerUpdate } = await import('../src/services/pwa');
    const seen: string[] = [];
    onServiceWorkerUpdate((v) => seen.push(v));
    b.emit({ type: 'SW_UPDATED', version: 'kho-bau-v9' });
    expect(seen).toEqual(['kho-bau-v9']);
  });
});
