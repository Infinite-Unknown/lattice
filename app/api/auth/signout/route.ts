import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, clearedCookieAttrs, verifySessionCookie } from '@/lib/auth/sessions';
import { getAdminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    try {
      const decoded = await verifySessionCookie(token);
      // Revoke ALL refresh tokens for this user — kicks any other sessions / devices.
      await getAdminAuth().revokeRefreshTokens(decoded.uid);
    } catch { /* token already invalid — fine */ }
  }
  const res = NextResponse.json({ ok: true });
  res.headers.append('Set-Cookie', `${COOKIE_NAME}=; ${clearedCookieAttrs()}`);
  return res;
}
