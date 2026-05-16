import { NextResponse } from 'next/server';
import { getDefaultAccount, upsertAccount } from '@/lib/data/accounts';
import { findUserByEmail, newUserId, upsertUser } from '@/lib/data/users';
import { hashPassword } from '@/lib/auth/passwords';
import { createSession, COOKIE_NAME, sessionCookieAttrs } from '@/lib/auth/sessions';
import type { Account, User } from '@/lib/auth/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { account_name, name, email, password } = body as Record<string, string>;

  if (!account_name || !name || !email || !password) {
    return NextResponse.json({ error: 'account_name, name, email, password required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 });
  }

  // For v1 we allow exactly ONE account/root in the system.
  const existing = await getDefaultAccount();
  if (existing) {
    return NextResponse.json({
      error: 'A root account already exists for this Lattice instance. Ask the root user to create an IAM user for you.',
    }, { status: 409 });
  }

  const dup = await findUserByEmail(email.toLowerCase());
  if (dup) return NextResponse.json({ error: 'email already in use' }, { status: 409 });

  const now = new Date().toISOString();
  const accountId = 'acc_' + Math.random().toString(36).slice(2, 10);
  const userId = newUserId();

  const account: Account = {
    id: accountId,
    name: account_name,
    root_user_id: userId,
    created_at: now,
  };

  const user: User = {
    id: userId,
    account_id: accountId,
    type: 'root',
    email: email.toLowerCase(),
    name,
    password_hash: await hashPassword(password),
    role: 'root',
    created_at: now,
    last_login: now,
  };

  await upsertAccount(account);
  await upsertUser(user);

  const session = await createSession(user.id, account.id);

  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role, name: user.name }, account: { id: account.id, name: account.name } });
  res.headers.append('Set-Cookie', `${COOKIE_NAME}=${session.token}; ${sessionCookieAttrs()}`);
  return res;
}
