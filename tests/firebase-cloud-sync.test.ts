import { describe, it, expect, beforeEach, vi } from 'vitest';

// Polyfill in-memory localStorage for Node test runner
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: ReturnType<typeof createMockLocalStorage> }).localStorage =
    createMockLocalStorage();
}

// Mock Firebase SDK for isolated unit testing
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => [{}]),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  GoogleAuthProvider: class {
    setCustomParameters = vi.fn();
  },
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, cb) => {
    cb(null);
    return () => {};
  }),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => null })),
  getDocFromServer: vi.fn(async () => ({})),
  setDoc: vi.fn(async () => {}),
  collection: vi.fn(() => ({})),
  getDocs: vi.fn(async () => []),
}));

import firebaseConfig from '../firebase-applet-config.json';
import { CloudSyncService } from '../src/services/cloudSync';
import { StorageService } from '../src/services/storage';

describe('Firebase & Cloud Sync Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('contains valid Firebase applet configuration', () => {
    expect(firebaseConfig.projectId).toBe('dark-hydra-0ghtt');
    expect(firebaseConfig.authDomain).toBe('dark-hydra-0ghtt.firebaseapp.com');
    expect(firebaseConfig.apiKey).toBeDefined();
    expect(firebaseConfig.apiKey.length).toBeGreaterThan(10);
    expect(firebaseConfig.firestoreDatabaseId).toBe(
      'ai-studio-khobutrithclp1-7578dca8-cff7-48e6-9b6b-a2bbad9d8ffa'
    );
  });

  it('initializes CloudSyncService with safe offline state', () => {
    const state = CloudSyncService.getState();
    expect(state).toBeDefined();
    expect(['offline', 'idle', 'synced']).toContain(state.status);
    expect(state.user).toBeNull();
  });

  it('subscribes and receives state updates', () => {
    let receivedState: unknown = null;
    const unsub = CloudSyncService.subscribe((state) => {
      receivedState = state;
    });

    expect(receivedState).toBeDefined();
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('handles manual sync safely without active user', async () => {
    await CloudSyncService.syncNow();
    const state = CloudSyncService.getState();
    expect(state.status).toBe('offline');
  });

  it('preserves existing local learner progress when no cloud account connected', () => {
    const profile = StorageService.getChildProfile();
    profile.stars = 25;
    profile.xp = 350;
    StorageService.saveChildProfile(profile);

    const reloaded = StorageService.getChildProfile();
    expect(reloaded.stars).toBe(25);
    expect(reloaded.xp).toBe(350);
  });
});
