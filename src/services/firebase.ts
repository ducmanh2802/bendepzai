import type { Auth, GoogleAuthProvider, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export interface CloudUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * T39 — SDK Firebase nặng ~538 KiB (chunk `firebase-vendor`) và theo AGENTS §2
 * cloud sync là tuỳ chọn, chỉ dùng sau khi người lớn tự đăng nhập. Trước đây
 * module này gọi `initializeApp`/`getAuth` ngay trên đỉnh file, nên chỉ cần
 * `Header` render nút tài khoản là cả app đã tải Firebase lúc mở trang.
 * Vì vậy mọi import runtime thành `import type` (bị xoá khi build) và SDK chỉ
 * nạp khi `loadFirebaseSdk()` được gọi thật.
 */
export interface FirebaseSdk {
  auth: Auth;
  db: Firestore;
  provider: GoogleAuthProvider;
  signInWithPopup: (auth: Auth, provider: GoogleAuthProvider) => Promise<{ user: User | null }>;
  signOut: (auth: Auth) => Promise<void>;
  onAuthStateChanged: (auth: Auth, next: (user: User | null) => void) => () => void;
  doc: typeof import('firebase/firestore').doc;
  getDoc: typeof import('firebase/firestore').getDoc;
  setDoc: typeof import('firebase/firestore').setDoc;
}

let sdkPromise: Promise<FirebaseSdk> | null = null;

export function loadFirebaseSdk(): Promise<FirebaseSdk> {
  if (!sdkPromise) {
    sdkPromise = (async (): Promise<FirebaseSdk> => {
      const [appSdk, authSdk, fsSdk] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ]);
      const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
      const auth = authSdk.getAuth(app);
      const provider = new authSdk.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const db = firebaseConfig.firestoreDatabaseId
        ? fsSdk.getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : fsSdk.getFirestore(app);
      return {
        auth,
        db,
        provider,
        signInWithPopup: authSdk.signInWithPopup,
        signOut: authSdk.signOut,
        onAuthStateChanged: authSdk.onAuthStateChanged,
        doc: fsSdk.doc,
        getDoc: fsSdk.getDoc,
        setDoc: fsSdk.setDoc,
      };
    })().catch((err) => {
      // Không cache một lời hứa hỏng: đăng nhập lại lần sau phải thử nạp lại.
      sdkPromise = null;
      throw err;
    });
  }
  return sdkPromise;
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
    const sdk = await loadFirebaseSdk();
    const cred = await sdk.signInWithPopup(sdk.auth, sdk.provider);
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
  const sdk = await loadFirebaseSdk();
  await sdk.signOut(sdk.auth);
}

/**
 * Subscribe to Auth state changes. Trả về hàm huỷ đăng ký dùng được ngay cả khi
 * SDK vẫn đang nạp — người gọi không phải chờ chunk Firebase.
 */
export function onAuthChange(callback: (user: CloudUser | null) => void): () => void {
  let disposed = false;
  let unsubscribe: (() => void) | null = null;
  loadFirebaseSdk()
    .then((sdk) => {
      if (disposed) return;
      unsubscribe = sdk.onAuthStateChanged(sdk.auth, (user) => {
        callback(sanitizeUser(user));
      });
    })
    .catch(() => {
      if (!disposed) callback(null);
    });
  return () => {
    disposed = true;
    if (unsubscribe) unsubscribe();
  };
}
