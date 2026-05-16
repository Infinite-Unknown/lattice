import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getAccount } from '@/lib/data/accounts';
import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';
import { toPublicUser } from '@/lib/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  const account = await getAccount(user.account_id);
  return NextResponse.json({
    user: toPublicUser(user),
    account: account ? { id: account.id, name: account.name } : null,
    permissions: ROLE_PERMISSIONS[user.role] ?? [],
  });
}
