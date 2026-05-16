import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { deleteUser, getUser } from '@/lib/data/users';
import { getAdminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const r = await requireUser(['iam.manage']);
  if ('error' in r) return r.error;

  const target = await getUser(params.id);
  if (!target) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (target.account_id !== r.user.account_id) {
    return NextResponse.json({ error: 'not in your account' }, { status: 403 });
  }
  if (target.type === 'root') {
    return NextResponse.json({ error: 'cannot delete the root user' }, { status: 400 });
  }

  // Best-effort revoke any active sessions, then delete the Firebase Auth
  // identity, then drop our Firestore record. Order matters: if the auth
  // delete fails we don't want to orphan the Firestore row.
  try { await getAdminAuth().revokeRefreshTokens(params.id); } catch { /* ignore */ }
  try { await getAdminAuth().deleteUser(params.id); } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'firebase deleteUser failed' }, { status: 500 });
  }
  await deleteUser(params.id);
  return NextResponse.json({ ok: true });
}
