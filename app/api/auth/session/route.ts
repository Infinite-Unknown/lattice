import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getUser, upsertUser } from '@/lib/data/users';
import { createSessionCookieFromIdToken, COOKIE_NAME, sessionCookieAttrs } from '@/lib/auth/sessions';

export const runtime = 'nodejs';

/**
 * Trade a fresh Firebase ID token for a server-side session cookie.
 *
 * Flow:
 *  1. Client signs in via firebase/auth (signInWithEmailAndPassword), getting an idToken.
 *  2. Client POSTs the idToken here.
 *  3. We verify it via Admin SDK, mint a session cookie via createSessionCookie(),
 *     and set it HTTP-only on the response.
 *  4. Subsequent requests carry the cookie; middleware + requireUser() verify it.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const idToken = (body as { idToken?: string }).idToken;
  if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });

  const auth = getAdminAuth();
  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch (e: any) {
    return NextResponse.json({ error: 'invalid idToken: ' + (e?.message ?? 'unknown') }, { status: 401 });
  }

  // We only mint session cookies for users we've provisioned in our user store.
  // This means a stranger who somehow gets a Firebase token for an unrelated project
  // still can't enter Lattice.
  const user = await getUser(decoded.uid);
  if (!user) {
    return NextResponse.json({ error: 'no Lattice user for this Firebase identity' }, { status: 403 });
  }

  const cookie = await createSessionCookieFromIdToken(idToken);

  // Update last-login bookkeeping.
  user.last_login = new Date().toISOString();
  await upsertUser(user);

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, role: user.role, type: user.type, email: user.email, username: user.username },
  });
  res.headers.append('Set-Cookie', `${COOKIE_NAME}=${cookie}; ${sessionCookieAttrs()}`);
  return res;
}
