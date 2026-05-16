import { cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

export function getAdminDb(): Firestore {
  if (!adminApp) {
    const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
    if (!raw) throw new Error('FIREBASE_ADMIN_CREDENTIALS missing');
    adminApp = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(raw)) });
    adminDb = getFirestore(adminApp);
  }
  return adminDb;
}
