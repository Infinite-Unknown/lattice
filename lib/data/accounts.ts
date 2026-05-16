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
  // Returns the first account if exactly one exists — used by the sign-in
  // form as a 'last-resort' fallback so the single-account install case
  // doesn't require the user to type an account name. When multiple accounts
  // exist, returns null and the caller must look up by name explicitly.
  const all = await listAccounts();
  return all.length === 1 ? all[0] : null;
}

/**
 * Find an account by name (case-insensitive exact match). Used by the IAM
 * sign-in tab to resolve `account name + username` into the synthetic email
 * Firebase Auth needs. Returns null if no match — the caller surfaces a
 * friendly error so we don't leak which accounts exist on this instance.
 */
export async function findAccountByName(name: string): Promise<Account | null> {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;
  const all = await listAccounts();
  return all.find(a => a.name.trim().toLowerCase() === trimmed) ?? null;
}
