// src/services/cloudSync.ts
//
// Optional cloud synchronisation layer.
//
// The app is local-first: all learner progress lives in localStorage. This
// service exposes a small state machine + pub/sub that the header UI binds to
// and that can be upgraded to a real Firebase-backed implementation later.
// In the default (offline) build it reports `offline` and never touches the
// network, so the app keeps working without any backend or API key.

export type CloudSyncStatus = 'offline' | 'idle' | 'syncing' | 'synced' | 'error';

export interface CloudUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface CloudSyncState {
  status: CloudSyncStatus;
  user: CloudUser | null;
  lastSyncedAt: Date | null;
  error: string | null;
}

type Listener = (state: CloudSyncState) => void;

class CloudSyncServiceImpl {
  private state: CloudSyncState = {
    status: 'offline',
    user: null,
    lastSyncedAt: null,
    error: null,
  };

  private listeners = new Set<Listener>();

  getState(): CloudSyncState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    listener(this.state);
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async syncNow(): Promise<void> {
    this.setState({ status: 'offline', error: null });
  }

  setUser(user: CloudUser | null): void {
    this.setState({
      user,
      status: user ? 'idle' : 'offline',
      error: null,
    });
  }

  setSyncing(): void {
    this.setState({ status: 'syncing', error: null });
  }

  setSynced(): void {
    this.setState({ status: 'synced', lastSyncedAt: new Date(), error: null });
  }

  setError(message: string): void {
    this.setState({ status: 'error', error: message });
  }

  private setState(patch: Partial<CloudSyncState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const CloudSyncService = new CloudSyncServiceImpl();
