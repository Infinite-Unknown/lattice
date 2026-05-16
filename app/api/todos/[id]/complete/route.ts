import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { getTodo, markTodoDone } from '@/lib/data/todos';
import { writeAuditEntry } from '@/lib/data/audit';

export const runtime = 'nodejs';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(['approve.write']);
  if ('error' in auth) return auth.error;
  const user = auth.user;

  const todo = await getTodo(params.id);
  if (!todo) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (todo.account_id !== user.account_id) {
    return NextResponse.json({ error: 'not in your account' }, { status: 403 });
  }
  if (todo.status === 'done') {
    return NextResponse.json({ error: 'already done' }, { status: 409 });
  }

  await markTodoDone(todo.id, user.name);
  await writeAuditEntry(
    user, 'complete_todo', 'todo', todo.id,
    `Marked todo done: "${todo.title}"`,
  );

  return NextResponse.json({ ok: true });
}
