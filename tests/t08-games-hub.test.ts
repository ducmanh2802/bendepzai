import { describe, it, expect } from 'vitest';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import { GAME_REGISTRY } from '../src/components/games/registry';
import { LAUNCHABLE_GAME_IDS } from '../src/config/policy';

describe('T08 games hub registry', () => {
  it('catalog, registry and LAUNCHABLE_GAME_IDS match', () => {
    const catalogIds = GAMES_CATALOG.map((g) => g.id).slice().sort();
    const registryIds = Object.keys(GAME_REGISTRY).slice().sort();
    const launchableIds = Array.from(LAUNCHABLE_GAME_IDS).slice().sort();
    expect(registryIds).toEqual(catalogIds);
    expect(launchableIds).toEqual(catalogIds);
  });

  it('every game has skillIds and a non-empty title', () => {
    for (const g of GAMES_CATALOG) {
      expect(g.skillIds).toBeDefined();
      expect((g.skillIds ?? []).length).toBeGreaterThan(0);
      expect(g.title.trim().length).toBeGreaterThan(0);
    }
  });
});
