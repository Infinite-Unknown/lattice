import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { findUserByUsername, listUsers, upsertUser } from '@/lib/data/users';
import { ASSIGNABLE_IAM_ROLES } from '@/lib/auth/permissions';
import { toPublicUser, type User, type Role } from '@/lib/auth/types';
import { syntheticEmailForIam } from '@/lib/auth/identity';
import { getAdminAuth } from '@/lib/firebase-admin';

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

  const lowerName = username.toLowerCase();
  const dup = await findUserByUsername(r.user.account_id, lowerName);
  if (dup) return NextResponse.json({ error: 'username already in use in this account' }, { status: 409 });

  // Mint a Firebase Auth user with a synthetic email so password sign-in works
  // even though IAM users don't have a real email of their own.
  const auth = getAdminAuth();
  const firebaseEmail = syntheticEmailForIam(r.user.account_id, lowerName);

  let firebaseUser;
  try {
    firebaseUser = await auth.createUser({
      email: firebaseEmail,
      password,
      displayName: name,
      emailVerified: false,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'firebase createUser failed' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const user: User = {
    id: firebaseUser.uid,
    account_id: r.user.account_id,
    type: 'iam',
    username: lowerName,
    firebase_email: firebaseEmail,
    name,
    role: role as Role,
    created_at: now,
    last_login: null,
  };
  await upsertUser(user);

  await auth.setCustomUserClaims(firebaseUser.uid, {
    role,
    account_id: r.user.account_id,
    type: 'iam',
  });

  return NextResponse.json({ user: toPublicUser(user) });
}
