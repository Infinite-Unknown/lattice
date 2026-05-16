/**
 * Client-side auth flow helpers. The pattern is always:
 *   1. firebase/auth signInWithEmailAndPassword(...) — establishes Firebase Auth state
 *   2. user.getIdToken() — fresh ID token
 *   3. POST /api/auth/session — server mints HTTP-only session cookie
 *
 * For IAM users, the username is transformed into a synthetic email before
 * step 1 so Firebase Auth's email-based login still applies.
 */

'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { syntheticEmailForIam } from './identity';

export async function exchangeIdTokenForSessionCookie(idToken: string): Promise<void> {
  const r = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error ?? `session exchange failed: ${r.status}`);
  }
}

export async function signInAsRoot(email: string, password: string): Promise<void> {
  const cred = await signInWithEmailAndPassword(getClientAuth(), email, password);
  const idToken = await cred.user.getIdToken();
  await exchangeIdTokenForSessionCookie(idToken);
}

export async function signInAsIam(accountId: string, username: string, password: string): Promise<void> {
  const email = syntheticEmailForIam(accountId, username);
  const cred = await signInWithEmailAndPassword(getClientAuth(), email, password);
  const idToken = await cred.user.getIdToken();
  await exchangeIdTokenForSessionCookie(idToken);
}
