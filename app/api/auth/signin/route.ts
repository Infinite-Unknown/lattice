import { NextResponse } from 'next/server';
import { getDefaultAccount } from '@/lib/data/accounts';
import { findUserByEmail, findUserByUsername, upsertUser } from '@/lib/data/users';
import { verifyPassword } from '@/lib/auth/passwords';
import { createSession, COOKIE_NAME, sessionCookieAttrs } from '@/lib/auth/sessions';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { mode, email, username, password } = body as Record<string, string>;

  if (!password || !mode) {
    return NextResponse.json({ error: 'mode and password required' }, { status: 400 });
  }
  if (mode !== 'root' && mode !== 'iam') {
    return NextResponse.json({ error: 'mode must be "root" or "iam"' }, { status: 400 });
  }

  let user;
  if (mode === 'root') {
    if (!email) return NextResponse.json({ error: 'email required for root sign-in' }, { status: 400 });
    user = await findUserByEmail(email.toLowerCase());
    if (!user || user.type !== 'root') {
      return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
    }
  } else {
    if (!username) return NextResponse.json({ error: 'username required for IAM sign-in' }, { status: 400 });
    const account = await getDefaultAccount();
    if (!account) return NextResponse.json({ error: 'no Lattice account exists yet — root must sign up first' }, { status: 404 });
    user = await findUserByUsername(account.id, username.toLowerCase());
    if (!user || user.type !== 'iam') {
      return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
    }
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });

  user.last_login = new Date().toISOString();
  await upsertUser(user);

  const session = await createSession(user.id, user.account_id);
  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id, type: user.type, name: user.name, role: user.role,
      email: user.email, username: user.username,
    },
  });
  res.headers.append('Set-Cookie', `${COOKIE_NAME}=${session.token}; ${sessionCookieAttrs()}`);
  return res;
}
