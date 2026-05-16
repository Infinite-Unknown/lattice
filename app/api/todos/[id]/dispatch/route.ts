import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { getTodo, markTodoDispatched } from '@/lib/data/todos';
import { writeAuditEntry } from '@/lib/data/audit';
import type { DispatchChannel } from '@/lib/types';

const CHANNELS: DispatchChannel[] = ['email', 'calendar', 'slack'];

export const runtime = 'nodejs';

/**
 * Placeholder dispatch endpoint. Records that the admin notified the parties
 * via a given channel, but doesn't actually send anything yet — real
 * integration (Gmail / Google Calendar / Slack webhook) comes later.
 *
 * Marking dispatched is intentionally separate from completing the todo: an
 * admin may send a calendar invite (dispatched=calendar) and then complete
 * the todo only once the meeting actually happened.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(['approve.write']);
  if ('error' in auth) return auth.error;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  const channel = (body as { channel?: string }).channel as DispatchChannel | undefined;
  if (!channel || !CHANNELS.includes(channel)) {
    return NextResponse.json({ error: `channel must be one of: ${CHANNELS.join(', ')}` }, { status: 400 });
  }

  const todo = await getTodo(params.id);
  if (!todo) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (todo.account_id !== user.account_id) {
    return NextResponse.json({ error: 'not in your account' }, { status: 403 });
  }

  await markTodoDispatched(todo.id, channel, user.name);
  await writeAuditEntry(
    user, 'dispatch_todo', 'todo', todo.id,
    `Dispatched todo "${todo.title}" via ${channel} (placeholder — no message actually sent yet)`,
  );

  return NextResponse.json({
    ok: true,
    channel,
    message: `Recorded dispatch via ${channel}. (Real integration coming soon — no message was actually sent.)`,
  });
}
