import { getAdminDb } from '@/lib/firebase-admin';
import type { Outcome } from '@/lib/types';
import { upsertRelationship, getRelationship } from './relationships';

const COL = 'outcomes';

export async function getOutcome(id: string, accountId: string): Promise<Outcome | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  if (!doc.exists) return null;
  const o = doc.data() as Outcome;
  if (o.account_id !== accountId) return null;
  return o;
}

/**
 * Outcomes for a specific relationship. The relationshipId already implies
 * a tenant (relationships are tenant-scoped) but we also denormalised
 * account_id onto each outcome doc so cross-tenant listing stays cheap
 * (no parent-doc join needed).
 */
export async function listOutcomesFor(relationshipId: string, accountId: string): Promise<Outcome[]> {
  const snap = await getAdminDb()
    .collection(COL)
    .where('relationship_id', '==', relationshipId)
    .where('account_id', '==', accountId)
    .get();
  return snap.docs.map(d => d.data() as Outcome);
}

export async function listAllOutcomes(accountId: string): Promise<Outcome[]> {
  const snap = await getAdminDb()
    .collection(COL)
    .where('account_id', '==', accountId)
    .get();
  return snap.docs.map(d => d.data() as Outcome);
}

export async function upsertOutcome(o: Outcome): Promise<void> {
  if (!o.account_id) {
    throw new Error('upsertOutcome: account_id required (multi-tenant isolation)');
  }
  await getAdminDb().collection(COL).doc(o.id).set(o);
  const r = await getRelationship(o.relationship_id, o.account_id);
  if (r && !r.outcomes.includes(o.id)) {
    r.outcomes.push(o.id);
    await upsertRelationship(r);
  }
}
