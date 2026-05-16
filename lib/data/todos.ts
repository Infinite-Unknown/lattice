import { getAdminDb } from '@/lib/firebase-admin';
import type { Todo, TodoStatus, DispatchChannel } from '@/lib/types';

const COL = 'todos';

export async function getTodo(id: string): Promise<Todo | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  return doc.exists ? (doc.data() as Todo) : null;
}

export async function listTodosForAccount(accountId: string): Promise<Todo[]> {
  // No composite index needed — filter by account_id, sort in memory.
  const snap = await getAdminDb().collection(COL).where('account_id', '==', accountId).get();
  const all = snap.docs.map(d => d.data() as Todo);
  all.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return all;
}

export async function upsertTodo(t: Todo): Promise<void> {
  await getAdminDb().collection(COL).doc(t.id).set(t);
}

export async function markTodoDone(id: string, by: string): Promise<void> {
  await getAdminDb().collection(COL).doc(id).update({
    status: 'done' as TodoStatus,
    completed_at: new Date().toISOString(),
    completed_by_name: by,
  });
}

export async function markTodoDispatched(id: string, channel: DispatchChannel, by: string): Promise<void> {
  await getAdminDb().collection(COL).doc(id).update({
    dispatched_via: channel,
    dispatched_at: new Date().toISOString(),
    dispatched_by_name: by,
  });
}

export function newTodoId(): string {
  return `td_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
