import crypto from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import type { Session } from './types';

const COL = 'sessions';
const COOKIE_NAME = 'lattice_session';
const TTL_DAYS = 7;

export { COOKIE_NAME };

export function newSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string, accountId: string): Promise<Session> {
  const token = newSessionToken();
  const now = new Date();
  const expires = new Date(now.getTime() + TTL_DAYS * 86400_000);
  const session: Session = {
    token,
    user_id: userId,
    account_id: accountId,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
  await getAdminDb().collection(COL).doc(token).set(session);
  return session;
}

export async function getSession(token: string): Promise<Session | null> {
  const doc = await getAdminDb().collection(COL).doc(token).get();
  if (!doc.exists) return null;
  const s = doc.data() as Session;
  if (new Date(s.expires_at).getTime() < Date.now()) {
    // expired — best-effort cleanup
    await doc.ref.delete().catch(() => {});
    return null;
  }
  return s;
}

export async function destroySession(token: string): Promise<void> {
  await getAdminDb().collection(COL).doc(token).delete().catch(() => {});
}

export function sessionCookieAttrs(): string {
  // 7 days, HTTP-only, same-site Lax. Secure flag flipped on in production.
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL_DAYS * 86400}${secure}`;
}

export function clearedCookieAttrs(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
