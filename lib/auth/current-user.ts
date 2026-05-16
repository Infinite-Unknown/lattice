import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, getSession } from './sessions';
import { getUser } from '@/lib/data/users';
import { hasPermission, type Permission } from './permissions';
import type { User } from './types';

export async function getCurrentUser(): Promise<User | null> {
  const c = cookies().get(COOKIE_NAME)?.value;
  if (!c) return null;
  const session = await getSession(c);
  if (!session) return null;
  return getUser(session.user_id);
}

/**
 * Returns the current user IF they have ALL the required permissions.
 * Returns a NextResponse with 401/403 otherwise — call sites should `return` that.
 */
export async function requireUser(perms: Permission[] = []): Promise<{ user: User } | { error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) };
  }
  for (const p of perms) {
    if (!hasPermission(user.role, p)) {
      return { error: NextResponse.json({ error: 'forbidden', missing_permission: p, your_role: user.role }, { status: 403 }) };
    }
  }
  return { user };
}
