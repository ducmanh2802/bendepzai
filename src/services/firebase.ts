import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with specific database ID if present
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface CloudUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export function sanitizeUser(user: User | null): CloudUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Học viên',
    email: user.email,
    photoURL: user.photoURL,
  };
}

/**
 * Sign in with Google using popup
 */
export async function signInWithGoogle(): Promise<CloudUser> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = sanitizeUser(cred.user);
    if (!user) throw new Error('Không thể lấy thông tin tài khoản');
    return user;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Đã hủy đăng nhập Google.');
    }
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Lỗi kết nối mạng, vui lòng kiểm tra Internet.');
    }
    if (err.code === 'auth/unauthorized-domain') {
      throw new Error('Tên miền ứng dụng cần được ủy quyền trong Firebase Console.');
    }
    throw new Error(err.message || 'Đăng nhập Google không thành công.');
  }
}

/**
 * Log out from Firebase account
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Auth state changes
 */
export function onAuthChange(callback: (user: CloudUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(sanitizeUser(user));
  });
}
