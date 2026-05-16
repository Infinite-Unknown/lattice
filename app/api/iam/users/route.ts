import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { findUserByUsername, listUsers, newUserId, upsertUser } from '@/lib/data/users';
import { hashPassword } from '@/lib/auth/passwords';
import { ASSIGNABLE_IAM_ROLES } from '@/lib/auth/permissions';
import { toPublicUser, type User, type Role } from '@/lib/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const r = await requireUser(['iam.manage']);
  if ('error' in r) return r.error;
  const users = await listUsers(r.user.account_id);
  return NextResponse.json({ users: users.map(toPublicUser) });
}

export async function POST(req: Request) {
  const r = await requireUser(['iam.manage']);
  if ('error' in r) return r.error;

  const body = await req.json().catch(() => ({}));
  const { username, name, password, role } = body as Record<string, string>;

  if (!username || !name || !password || !role) {
    return NextResponse.json({ error: 'username, name, password, role required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 });
  }
  if (!ASSIGNABLE_IAM_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: `role must be one of: ${ASSIGNABLE_IAM_ROLES.join(', ')}` }, { status: 400 });
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return NextResponse.json({ error: 'username must be 3-32 chars, lowercase alphanumeric or . _ -' }, { status: 400 });
  }

  const dup = await findUserByUsername(r.user.account_id, username.toLowerCase());
  if (dup) return NextResponse.json({ error: 'username already in use in this account' }, { status: 409 });

  const now = new Date().toISOString();
  const user: User = {
    id: newUserId(),
    account_id: r.user.account_id,
    type: 'iam',
    username: username.toLowerCase(),
    name,
    password_hash: await hashPassword(password),
    role: role as Role,
    created_at: now,
    last_login: null,
  };
  await upsertUser(user);

  return NextResponse.json({ user: toPublicUser(user) });
}
