import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, clearedCookieAttrs, destroySession } from '@/lib/auth/sessions';

export const runtime = 'nodejs';

export async function POST() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) await destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.headers.append('Set-Cookie', `${COOKIE_NAME}=; ${clearedCookieAttrs()}`);
  return res;
}
