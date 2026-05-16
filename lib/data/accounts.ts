import { getAdminDb } from '@/lib/firebase-admin';
import type { Account } from '@/lib/auth/types';

const COL = 'accounts';

export async function getAccount(id: string): Promise<Account | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  return doc.exists ? (doc.data() as Account) : null;
}

export async function listAccounts(): Promise<Account[]> {
  const snap = await getAdminDb().collection(COL).get();
  return snap.docs.map(d => d.data() as Account);
}

export async function upsertAccount(a: Account): Promise<void> {
  await getAdminDb().collection(COL).doc(a.id).set(a);
}

export async function getDefaultAccount(): Promise<Account | null> {
  // Single-tenant for v1: there's at most one account.
  const all = await listAccounts();
  return all[0] ?? null;
}
