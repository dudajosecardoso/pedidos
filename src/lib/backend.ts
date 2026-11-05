import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import type { Order, OrderData } from '../types';
import { slugify } from './storage';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const backendMode: 'online' | 'local' =
  config.apiKey && config.authDomain && config.projectId && config.appId ? 'online' : 'local';

const app = backendMode === 'online' ? (getApps().length ? getApp() : initializeApp(config)) : null;
const firestore = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

const INDEX_KEY = 'tonho:idx:orders';
const DOC_PREFIX = 'tonho:orders/';
const localSubscribers = new Set<(orders: Order[]) => void>();

function readLocalOrders(): Order[] {
  try {
    const ids = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]') as string[];
    return ids.flatMap((id) => {
      try {
        const value = localStorage.getItem(`${DOC_PREFIX}${id}`);
        const order = value ? (JSON.parse(value) as OrderData) : null;
        return order ? [{ ...order, id }] : [];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

function emitLocal(): void {
  const orders = readLocalOrders();
  localSubscribers.forEach((callback) => callback(orders));
}

function readLocalIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

export async function saveOrder(id: string, order: OrderData): Promise<void> {
  if (firestore) {
    await setDoc(doc(firestore, 'orders', id), order);
    return;
  }
  localStorage.setItem(`${DOC_PREFIX}${id}`, JSON.stringify(order));
  const ids = readLocalIds();
  if (!ids.includes(id)) localStorage.setItem(INDEX_KEY, JSON.stringify([...ids, id]));
  emitLocal();
}

export async function deleteOrder(id: string): Promise<void> {
  if (firestore) {
    await deleteDoc(doc(firestore, 'orders', id));
    return;
  }
  localStorage.removeItem(`${DOC_PREFIX}${id}`);
  localStorage.setItem(INDEX_KEY, JSON.stringify(readLocalIds().filter((item) => item !== id)));
  emitLocal();
}

export function subscribeOrders(
  listener: (orders: Order[]) => void,
  onError: (error: Error) => void,
): () => void {
  if (firestore) {
    return onSnapshot(
      collection(firestore, 'orders'),
      (snapshot) => {
        listener(snapshot.docs.map((snapshotDoc) => ({ ...(snapshotDoc.data() as unknown as OrderData), id: snapshotDoc.id })));
      },
      (error) => onError(error),
    );
  }

  localSubscribers.add(listener);
  const handler = (event: StorageEvent) => {
    if (event.key === INDEX_KEY || event.key?.startsWith(DOC_PREFIX)) emitLocal();
  };
  window.addEventListener('storage', handler);
  listener(readLocalOrders());
  return () => {
    localSubscribers.delete(listener);
    window.removeEventListener('storage', handler);
  };
}

const LEGACY_ADMIN_HASH = '4002a55b18e93de6f9e9d6d52c20618161e63c86f4beff9dcb2e72d027a65898';

async function legacyCredentialMatches(username: string, password: string): Promise<boolean> {
  if (!crypto.subtle) return false;
  const data = new TextEncoder().encode(`${slugify(username)}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(digest), (part) => part.toString(16).padStart(2, '0')).join('');
  return hash === LEGACY_ADMIN_HASH;
}

export async function loginAdmin(username: string, password: string): Promise<void> {
  if (auth) {
    const email = username.includes('@') ? username.trim() : `${slugify(username)}@almocotonho.app`;
    await signInWithEmailAndPassword(auth, email, password);
    return;
  }
  // Credenciais de demonstração apenas para o MODO LOCAL; não protegem dados no servidor.
  if ((slugify(username) === 'admin' && password === 'admin123') ||
      (await legacyCredentialMatches(username, password))) return;
  throw new Error('invalid-credentials');
}

export async function checkAdminSession(): Promise<boolean> {
  if (!auth) return true;
  return new Promise<boolean>((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => { unsubscribe(); resolve(Boolean(user)); },
      () => { unsubscribe(); resolve(false); },
    );
  });
}

export async function logoutAdmin(): Promise<void> {
  if (auth) await signOut(auth);
}
