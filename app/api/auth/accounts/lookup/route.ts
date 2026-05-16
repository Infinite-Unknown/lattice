import { NextResponse } from 'next/server';
import { findAccountByName } from '@/lib/data/accounts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public lookup. Given an account name (case-insensitive exact match), return
 * { id, name } so the IAM sign-in form can compute the synthetic Firebase
 * email it needs. Returns 404 with a generic message if no match — never
 * lists which accounts DO exist.
 *
 *   GET /api/auth/accounts/lookup?name=Cradle%20Catalyst
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') ?? '';
  if (!name.trim()) {
    return NextResponse.json({ error: 'name query param required' }, { status: 400 });
  }
  const account = await findAccountByName(name);
  if (!account) {
    return NextResponse.json({ error: 'no account with that name' }, { status: 404 });
  }
  return NextResponse.json({ account: { id: account.id, name: account.name } });
}
