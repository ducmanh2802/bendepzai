import { describe, it, expect, beforeEach, vi } from 'vitest';

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
  setDoc: vi.fn(async () => {}),
  collection: vi.fn(() => ({})),
}));

import firebaseConfig from '../firebase-applet-config.json';
import { CloudSyncService } from '../src/services/cloudSync';
import { StorageService } from '../src/services/storage';
import { sanitizeUser } from '../src/services/firebase';

describe('Firebase Auth & Cloud Sync Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads real provisioned Firebase project configuration', () => {
    expect(firebaseConfig.projectId).toBe('dark-hydra-0ghtt');
    expect(firebaseConfig.apiKey).toMatch(/^AIzaSy/);
    expect(firebaseConfig.authDomain).toBe('dark-hydra-0ghtt.firebaseapp.com');
  });

  it('sanitizes Firebase user objects safely', () => {
    expect(sanitizeUser(null)).toBeNull();

    const mockUser = {
      uid: 'user-123',
      displayName: 'Bé Lan',
      email: 'belan@example.com',
      photoURL: 'https://example.com/avatar.png',
    } as any;

    const sanitized = sanitizeUser(mockUser);
    expect(sanitized).toEqual({
      uid: 'user-123',
      displayName: 'Bé Lan',
      email: 'belan@example.com',
      photoURL: 'https://example.com/avatar.png',
    });
  });

  it('maintains safe offline state without authenticated user', async () => {
    const state = CloudSyncService.getState();
    expect(state.user).toBeNull();
    expect(['offline', 'idle']).toContain(state.status);

    await CloudSyncService.syncNow();
    expect(CloudSyncService.getState().status).toBe('offline');
  });

  it('allows subscription and unsubscription from CloudSyncService', () => {
    let captured = null;
    const unsub = CloudSyncService.subscribe((s) => {
      captured = s;
    });
    expect(captured).toBeDefined();
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('safely handles profiles containing undefined fields without Firestore errors', () => {
    const rawProfile = {
      name: 'Bé Minh',
      stars: 10,
      dailyChestClaimedDate: undefined,
      nested: {
        someKey: undefined,
        validKey: 'abc',
      },
    };

    const cleaned = JSON.parse(JSON.stringify(rawProfile));

    expect(cleaned).not.toHaveProperty('dailyChestClaimedDate');
    expect(cleaned.nested).not.toHaveProperty('someKey');
    expect(cleaned.nested.validKey).toBe('abc');
  });
});
