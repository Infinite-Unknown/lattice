import { NextResponse } from 'next/server';
import { getDefaultAccount } from '@/lib/data/accounts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public — returns the (single) account's id + name so the sign-in page
// can compute the synthetic IAM email. Pre-signup it returns null, which
// the UI uses to nudge first-time visitors to /sign-up.
export async function GET() {
  const account = await getDefaultAccount();
  if (!account) return NextResponse.json({ account: null });
  return NextResponse.json({ account: { id: account.id, name: account.name } });
}
