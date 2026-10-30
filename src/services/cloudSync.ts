import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, onAuthChange, type CloudUser } from './firebase';
import { StorageService } from './storage';
import type { ChildProfile } from '../types';

export type CloudSyncStatus = 'offline' | 'idle' | 'syncing' | 'synced' | 'error';

export interface CloudSyncState {
  status: CloudSyncStatus;
  user: CloudUser | null;
  lastSyncedAt: Date | null;
  error: string | null;
}

type SyncListener = (state: CloudSyncState) => void;

/**
 * Strips all undefined fields recursively so Firestore never throws
 * "Unsupported field value: undefined"
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return null as unknown as T;
  }
  return JSON.parse(JSON.stringify(data));
}

class CloudSyncManager {
  private state: CloudSyncState = {
    status: 'offline',
    user: null,
    lastSyncedAt: null,
    error: null,
  };

  private listeners = new Set<SyncListener>();
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Listen to Firebase Auth state
    if (typeof window !== 'undefined') {
      onAuthChange((user) => {
        this.handleAuthChanged(user);
      });

      // Listen to local storage changes to trigger debounced auto-sync
      window.addEventListener('kho_bau_storage_change', () => {
        if (this.state.user) {
          this.scheduleAutoSync();
        }
      });
    }
  }

  public getState(): CloudSyncState {
    return this.state;
  }

  public subscribe(listener: SyncListener): () => void {
    listener(this.state);
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private async handleAuthChanged(user: CloudUser | null) {
    if (!user) {
      this.state = {
        status: 'offline',
        user: null,
        lastSyncedAt: null,
        error: null,
      };
      this.notify();
      return;
    }

    this.state = {
      ...this.state,
      user,
      status: 'syncing',
      error: null,
    };
    this.notify();

    try {
      // Pull and merge with Firestore
      await this.pullAndMergeCloudData(user.uid);
      this.state = {
        ...this.state,
        status: 'synced',
        lastSyncedAt: new Date(),
        error: null,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi đồng bộ đám mây';
      this.state = {
        ...this.state,
        status: 'error',
        error: msg,
      };
    }
    this.notify();
  }

  private scheduleAutoSync() {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    this.syncDebounceTimer = setTimeout(() => {
      this.syncNow().catch(() => {});
    }, 2000);
  }

  /**
   * Pulls existing cloud document, merges with local state, and pushes back to cloud
   */
  private async pullAndMergeCloudData(uid: string): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    const localProfile = StorageService.getChildProfile();
    const localAnalytics = StorageService.getAnalytics();

    if (snap.exists()) {
      const cloudData = snap.data();
      const cloudProfile = (cloudData?.profile as Partial<ChildProfile>) || {};

      // Merge intelligent resolution: highest stars, highest XP, union of lessons
      const mergedStars = Math.max(localProfile.stars || 0, cloudProfile.stars || 0);
      const mergedXp = Math.max(localProfile.xp || 0, cloudProfile.xp || 0);
      const mergedStreak = Math.max(localProfile.streak || 0, cloudProfile.streak || 0);
      const mergedTickets = Math.max(localProfile.tickets || 0, cloudProfile.tickets || 0);

      const localLessons = localProfile.completedLessons || [];
      const cloudLessons = cloudProfile.completedLessons || [];
      const mergedLessons = Array.from(new Set([...localLessons, ...cloudLessons]));

      const mergedLessonStars = {
        ...(cloudProfile.lessonStars || {}),
        ...(localProfile.lessonStars || {}),
      };

      const mergedProfile: ChildProfile = {
        ...localProfile,
        stars: mergedStars,
        xp: mergedXp,
        streak: mergedStreak,
        tickets: mergedTickets,
        completedLessons: mergedLessons,
        lessonStars: mergedLessonStars,
        name: cloudProfile.name || localProfile.name,
      };

      StorageService.saveChildProfile(mergedProfile);

      // Push merged back to cloud
      await setDoc(
        userDocRef,
        sanitizeForFirestore({
          profile: mergedProfile,
          analytics: localAnalytics,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    } else {
      // First cloud save for this account
      await setDoc(
        userDocRef,
        sanitizeForFirestore({
          profile: localProfile,
          analytics: localAnalytics,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );
    }
  }

  /**
   * Triggers immediate manual sync
   */
  public async syncNow(): Promise<void> {
    const user = this.state.user;
    if (!user) {
      this.state.status = 'offline';
      this.notify();
      return;
    }

    this.state = { ...this.state, status: 'syncing', error: null };
    this.notify();

    try {
      const uid = user.uid;
      const userDocRef = doc(db, 'users', uid);
      const profile = StorageService.getChildProfile();
      const analytics = StorageService.getAnalytics();

      await setDoc(
        userDocRef,
        sanitizeForFirestore({
          profile,
          analytics,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );

      this.state = {
        ...this.state,
        status: 'synced',
        lastSyncedAt: new Date(),
        error: null,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu lên đám mây';
      this.state = {
        ...this.state,
        status: 'error',
        error: msg,
      };
      throw err;
    } finally {
      this.notify();
    }
  }
}

export const CloudSyncService = new CloudSyncManager();
