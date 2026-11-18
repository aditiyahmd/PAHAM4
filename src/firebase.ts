import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AppUser } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}

export interface GooglePopupAuthResult {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  idToken: string;
  firebaseUser: FirebaseUser;
}

/**
 * Triggers real Google OAuth sign-in in the browser via Firebase Auth signInWithPopup.
 */
export async function signInWithGooglePopup(): Promise<GooglePopupAuthResult> {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;
  const email = (user.email || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Akun Google tidak memiliki alamat email yang valid.');
  }
  const idToken = await user.getIdToken();
  return {
    uid: user.uid,
    email,
    displayName: user.displayName || email.split('@')[0],
    emailVerified: Boolean(user.emailVerified),
    idToken,
    firebaseUser: user
  };
}

export async function signOutFirebaseSession(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch {
    // Ignore sign-out errors if no active Firebase session
  }
}

/**
 * Reads user's Firestore profile metadata if signed in with Firebase Auth.
 */
export async function fetchFirestoreUserProfile(
  uid: string
): Promise<{ hasPassword?: boolean; nama?: string; role?: string } | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      hasPassword: Boolean(data.hasPassword),
      nama: typeof data.nama === 'string' ? data.nama : undefined,
      role: typeof data.role === 'string' ? data.role : undefined
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.GET, path);
    }
    return null;
  }
}

/**
 * Syncs non-secret user profile metadata into Firestore `/users/{uid}` when authenticated via Firebase.
 * Never writes plaintext passwords or password hashes into Firestore.
 */
export async function syncFirestoreUserProfile(
  uid: string,
  appUser: AppUser,
  hasPassword: boolean
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return;
  const path = `users/${uid}`;
  const docRef = doc(db, 'users', uid);

  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      const payload: Record<string, unknown> = {
        uid,
        email: appUser.email.trim().toLowerCase(),
        nama: appUser.nama || appUser.email,
        role: appUser.role || 'ACT-10',
        hasPassword: Boolean(hasPassword),
        statusAkun: appUser.statusAkun || 'Aktif',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (appUser.civitasType) {
        payload.civitasType = appUser.civitasType;
      }
      await setDoc(docRef, payload);
    } else if (hasPassword) {
      await updateDoc(docRef, {
        hasPassword: true,
        nama: appUser.nama || appUser.email,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}
