import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { listTodosForAccount } from '@/lib/data/todos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireUser([]);
  if ('error' in auth) return auth.error;
  const todos = await listTodosForAccount(auth.user.account_id);
  return NextResponse.json({ todos });
}
