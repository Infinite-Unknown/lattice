import { cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuthFn, Auth as AdminAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: AdminAuth | null = null;

function ensureAdminApp(): App {
  if (adminApp) return adminApp;
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) throw new Error('FIREBASE_ADMIN_CREDENTIALS missing');
  adminApp = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(raw)) });
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminDb) adminDb = getFirestore(ensureAdminApp());
  return adminDb;
}

export function getAdminAuth(): AdminAuth {
  if (!adminAuth) adminAuth = getAdminAuthFn(ensureAdminApp());
  return adminAuth;
}
