import { getAdminDb } from '@/lib/firebase-admin';
import type { Actor } from '@/lib/types';

const COL = 'actors';

/**
 * Fetch one actor. Caller MUST pass accountId — we return null if the
 * actor exists but belongs to a different tenant. This is the single
 * place we enforce per-tenant read isolation for actors; every API route
 * that loads an actor by id goes through here.
 */
export async function getActor(id: string, accountId: string): Promise<Actor | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  if (!doc.exists) return null;
  const actor = doc.data() as Actor;
  if (actor.account_id !== accountId) return null;
  return actor;
}

export async function listActors(accountId: string): Promise<Actor[]> {
  const snap = await getAdminDb()
    .collection(COL)
    .where('account_id', '==', accountId)
    .get();
  return snap.docs.map(d => d.data() as Actor);
}

export async function upsertActor(a: Actor): Promise<void> {
  if (!a.account_id) {
    throw new Error('upsertActor: account_id required (multi-tenant isolation)');
  }
  await getAdminDb().collection(COL).doc(a.id).set(a);
}
