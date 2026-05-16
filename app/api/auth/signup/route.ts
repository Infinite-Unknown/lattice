import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getDefaultAccount, upsertAccount } from '@/lib/data/accounts';
import { findUserByEmail, upsertUser } from '@/lib/data/users';
import type { Account, User } from '@/lib/auth/types';

export const runtime = 'nodejs';

/**
 * Bootstrap the Lattice instance with a root account.
 *
 * Creates:
 *  - a Firebase Auth user (so the client can sign in with email+password)
 *  - a Firestore `accounts` doc
 *  - a Firestore `users` doc whose id is the Firebase UID
 *  - Firebase custom claims { role, account_id, type } on the auth user
 *
 * Only the first signup succeeds — subsequent ones get 409 because v1 is
 * single-tenant. After signup the client immediately calls signInWithEmailAndPassword
 * and then POSTs the resulting idToken to /api/auth/session.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { account_name, name, email, password } = body as Record<string, string>;

  if (!account_name || !name || !email || !password) {
    return NextResponse.json({ error: 'account_name, name, email, password required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 });
  }

  // v1 is single-tenant — exactly one Account / Root.
  const existing = await getDefaultAccount();
  if (existing) {
    return NextResponse.json({
      error: 'A root account already exists for this Lattice instance. Ask the root user to create an IAM user for you.',
    }, { status: 409 });
  }

  const lowerEmail = email.toLowerCase();
  const dup = await findUserByEmail(lowerEmail);
  if (dup) return NextResponse.json({ error: 'email already in use' }, { status: 409 });

  const auth = getAdminAuth();
  let firebaseUser;
  try {
    firebaseUser = await auth.createUser({
      email: lowerEmail,
      password,
      displayName: name,
      emailVerified: false,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'firebase createUser failed' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const accountId = 'acc_' + Math.random().toString(36).slice(2, 10);

  const account: Account = {
    id: accountId,
    name: account_name,
    root_user_id: firebaseUser.uid,
    created_at: now,
  };

  const user: User = {
    id: firebaseUser.uid,
    account_id: accountId,
    type: 'root',
    email: lowerEmail,
    firebase_email: lowerEmail,
    name,
    role: 'root',
    created_at: now,
    last_login: null,
  };

  await upsertAccount(account);
  await upsertUser(user);

  // Custom claims propagate to Firebase ID tokens and Firestore security rules.
  await auth.setCustomUserClaims(firebaseUser.uid, {
    role: 'root',
    account_id: accountId,
    type: 'root',
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    account: { id: account.id, name: account.name },
  });
}
