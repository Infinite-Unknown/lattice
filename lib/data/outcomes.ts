import { getAdminDb } from '@/lib/firebase-admin';
import type { Outcome } from '@/lib/types';
import { upsertRelationship, getRelationship } from './relationships';

const COL = 'outcomes';

export async function getOutcome(id: string): Promise<Outcome | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  return doc.exists ? (doc.data() as Outcome) : null;
}

export async function listOutcomesFor(relationshipId: string): Promise<Outcome[]> {
  const snap = await getAdminDb().collection(COL).where('relationship_id', '==', relationshipId).get();
  return snap.docs.map(d => d.data() as Outcome);
}

export async function upsertOutcome(o: Outcome): Promise<void> {
  await getAdminDb().collection(COL).doc(o.id).set(o);
  const r = await getRelationship(o.relationship_id);
  if (r && !r.outcomes.includes(o.id)) {
    r.outcomes.push(o.id);
    await upsertRelationship(r);
  }
}
