import { loadFirebaseSdk, onAuthChange, type CloudUser } from './firebase';
import { StorageService } from './storage';
import type { ChildProfile } from '../types';

/**
 * T39 — "Thiết bị này từng đăng nhập" là một cờ boolean thuần tuý, không chứa
 * dữ liệu bài làm của bé. Nhờ nó, app chỉ nạp SDK Firebase (538 KiB) cho người
 * dùng cloud sync thật; bé học offline hoàn toàn không tải chunk đó.
 */
const CLOUD_SESSION_HINT = 'kho_bau_cloud_session_hint';

function readSessionHint(): boolean {
  try {
    return localStorage.getItem(CLOUD_SESSION_HINT) === '1';
  } catch {
    return false;
  }
}

function writeSessionHint(signedIn: boolean): void {
  try {
    if (signedIn) localStorage.setItem(CLOUD_SESSION_HINT, '1');
    else localStorage.removeItem(CLOUD_SESSION_HINT);
  } catch {
    // localStorage bị chặn (private mode): sync chỉ không tự bật, không hỏng gì khác.
  }
}

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
  private authStarted = false;

  constructor() {
    // Listen to local storage changes to trigger debounced auto-sync
    if (typeof window !== 'undefined') {
      window.addEventListener('kho_bau_storage_change', () => {
        if (this.state.user) {
          this.scheduleAutoSync();
        }
      });

      // Listen to Firebase Auth state — nhưng chỉ khi máy này đã từng đăng nhập.
      if (readSessionHint()) {
        this.start();
      }
    }
  }

  /**
   * Nạp SDK và theo dõi trạng thái đăng nhập. Idempotent: AccountModal gọi lúc
   * mở màn hình, constructor gọi lúc resume — không lần nào tải Firebase thừa.
   */
  public start(): void {
    if (this.authStarted || typeof window === 'undefined') return;
    this.authStarted = true;
    onAuthChange((user) => {
      writeSessionHint(!!user);
      void this.handleAuthChanged(user);
    });
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
    const sdk = await loadFirebaseSdk();
    const userDocRef = sdk.doc(sdk.db, 'users', uid);
    const snap = await sdk.getDoc(userDocRef);

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
      await sdk.setDoc(
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
      await sdk.setDoc(
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
      const sdk = await loadFirebaseSdk();
      const userDocRef = sdk.doc(sdk.db, 'users', uid);
      const profile = StorageService.getChildProfile();
      const analytics = StorageService.getAnalytics();

      await sdk.setDoc(
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
