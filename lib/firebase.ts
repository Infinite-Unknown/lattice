import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let clientAuth: Auth | null = null;

function ensureApp(): FirebaseApp {
  if (app) return app;
  app = getApps()[0] ?? initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  return app;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(ensureApp());
  return db;
}

export function getClientAuth(): Auth {
  if (!clientAuth) clientAuth = getAuth(ensureApp());
  return clientAuth;
}
