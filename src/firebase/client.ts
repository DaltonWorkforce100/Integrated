import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const typedConfig = firebaseConfig as typeof firebaseConfig & { firestoreDatabaseId?: string };
export const db = typedConfig.firestoreDatabaseId
  ? getFirestore(app, typedConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const adminGoogleProvider = new GoogleAuthProvider();
adminGoogleProvider.setCustomParameters({ prompt: 'select_account' });
export const googleProvider = new GoogleAuthProvider();

export const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'] as const;
for (const scope of SHEETS_SCOPES) {
  googleProvider.addScope(scope);
}

// Strict in-memory cache for OAuth access tokens (never stored in localStorage or sessionStorage)
let cachedGoogleAccessToken: string | null = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedGoogleAccessToken = null;
  }
});

export async function signInWithGoogleAdmin(): Promise<User> {
  const result = await signInWithPopup(auth, adminGoogleProvider);
  return result.user;
}

export async function signInWithGoogleSheets(): Promise<{
  user: User;
  accessToken: string | null;
}> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  cachedGoogleAccessToken = credential?.accessToken ?? null;
  return { user: result.user, accessToken: cachedGoogleAccessToken };
}

export function getGoogleAccessToken(): string | null {
  return cachedGoogleAccessToken;
}

export function clearGoogleAccessToken(): void {
  cachedGoogleAccessToken = null;
}

export const BOOTSTRAPPED_ADMIN_EMAIL = 'allidavid473@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
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

void testConnection();
