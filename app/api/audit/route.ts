import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { listAuditEntries } from '@/lib/data/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Any signed-in user can read the audit log for their account. Different
// roles will see the same entries — we don't filter by sensitivity because
// the audit log itself is the governance surface.
export async function GET(req: Request) {
  const auth = await requireUser([]);
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') ?? '100')));
  const entries = await listAuditEntries(auth.user.account_id, limit);
  return NextResponse.json({ entries });
}
