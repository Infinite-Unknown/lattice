/**
 * Sessions are now Firebase session cookies — opaque tokens minted by
 * Firebase Admin from a client-side idToken, set as HTTP-only cookies, and
 * verified server-side on every request.
 *
 * The Firebase Admin SDK handles signing, revocation, and expiry. We only
 * own the cookie attribute logic and the cookie name.
 */

import { getAdminAuth } from '@/lib/firebase-admin';

export const COOKIE_NAME = 'lattice_session';
const SESSION_TTL_DAYS = 7;

export function sessionTtlMs(): number {
  return SESSION_TTL_DAYS * 86400 * 1000;
}

export async function createSessionCookieFromIdToken(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: sessionTtlMs() });
}

export async function verifySessionCookie(cookie: string, checkRevoked = true) {
  return getAdminAuth().verifySessionCookie(cookie, checkRevoked);
}

export function sessionCookieAttrs(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_DAYS * 86400}${secure}`;
}

export function clearedCookieAttrs(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
