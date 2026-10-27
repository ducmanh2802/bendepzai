// src/services/firebase.ts
//
// Google authentication helpers.
//
// The application is local-first (see .env.example / GOOGLE_AI_STUDIO_RUNBOOK.md):
// cloud sync is an OPTIONAL enhancement. This module therefore exposes the
// auth entry points consumed by the UI but degrades gracefully when no real
// Firebase project is configured — the app keeps running entirely on
// localStorage. To enable real Google sign-in, install the `firebase` package
// and replace the placeholder values in `firebase-applet-config.json` with a
// real Firebase web app config.

export interface CloudUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Sign in with Google. Resolves when a real Firebase backend is wired up;
 * otherwise rejects so the caller can surface a friendly message instead of
 * silently pretending success.
 */
export async function signInWithGoogle(): Promise<CloudUser> {
  throw new Error(
    'Đăng nhập Google chưa được cấu hình trong bản build này. Tiến độ vẫn được lưu cục bộ trên máy.'
  );
}

/**
 * Sign out of the (optional) cloud account.
 */
export async function logOut(): Promise<void> {
  // No-op when cloud sync is disabled: there is nothing to sign out of.
  return;
}
