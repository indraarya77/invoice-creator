import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  collection,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Invoice, Customer, Service, SenderInfo } from '../types';

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
  };
}

// Check if configuration has been completed by the user
export const isFirebaseActive = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 0);

let app;
let db: any = null;
let auth: any = null;

if (isFirebaseActive) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.error('Failed to initialize Firebase applet configuration:', err);
  }
}

export { db, auth };

// Generic Firestore Error Handler based strictly on Skill Guidelines
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed Info: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth API helper
export async function loginWithGoogle(): Promise<User | null> {
  if (!auth) return null;
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Sign-Out failed:', error);
  }
}

// ----------------------------------------------------
// Firestore DB Operations for Invoices, Customers, etc.
// ----------------------------------------------------

export async function docWrite<T extends { id: string }>(
  collectionName: string, 
  item: T
): Promise<void> {
  if (!db) return;
  const path = `${collectionName}/${item.id}`;
  try {
    await setDoc(doc(db, collectionName, item.id), item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function docDelete(collectionName: string, id: string): Promise<void> {
  if (!db) return;
  const path = `${collectionName}/${id}`;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchAllDocs<T>(collectionName: string): Promise<T[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as T);
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }
}

export async function saveSenderInfo(sender: SenderInfo): Promise<void> {
  if (!db) return;
  const path = 'senderInfo/default';
  try {
    await setDoc(doc(db, 'senderInfo', 'default'), sender);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchSenderInfo(): Promise<SenderInfo | null> {
  if (!db) return null;
  const path = 'senderInfo/default';
  try {
    const docSnap = await getDoc(doc(db, 'senderInfo', 'default'));
    if (docSnap.exists()) {
      return docSnap.data() as SenderInfo;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
