import { getAdminDb } from '@/lib/firebase-admin';
import type { Relationship, StewardLogEntry } from '@/lib/types';

const COL = 'relationships';

/**
 * Fetch one relationship. Caller MUST pass accountId — returns null if
 * the relationship exists but belongs to a different tenant.
 */
export async function getRelationship(id: string, accountId: string): Promise<Relationship | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  if (!doc.exists) return null;
  const r = doc.data() as Relationship;
  if (r.account_id !== accountId) return null;
  return r;
}

export async function listRelationships(accountId: string): Promise<Relationship[]> {
  const snap = await getAdminDb()
    .collection(COL)
    .where('account_id', '==', accountId)
    .get();
  return snap.docs.map(d => d.data() as Relationship);
}

export async function upsertRelationship(r: Relationship): Promise<void> {
  if (!r.account_id) {
    throw new Error('upsertRelationship: account_id required (multi-tenant isolation)');
  }
  await getAdminDb().collection(COL).doc(r.id).set(r);
}

export async function appendStewardLog(id: string, accountId: string, entry: StewardLogEntry): Promise<void> {
  const r = await getRelationship(id, accountId);
  if (!r) throw new Error(`Relationship ${id} not found in account ${accountId}`);
  r.steward_log.push(entry);
  r.last_steward_run = entry.timestamp;
  r.steward_state.last_run = entry.timestamp;
  await upsertRelationship(r);
}

export async function updatePolicy(id: string, accountId: string, escalation: string, sunset: string): Promise<void> {
  const r = await getRelationship(id, accountId);
  if (!r) throw new Error(`Relationship ${id} not found in account ${accountId}`);
  r.escalation_policy = escalation;
  r.sunset_policy = sunset;
  await upsertRelationship(r);
}

/**
 * Return any non-closed relationship between these two actors. Scoped to
 * one account — used to prevent duplicate edges when materialising a
 * Cartographer proposal.
 */
export async function findActiveRelationshipBetween(accountId: string, idA: string, idB: string): Promise<Relationship | null> {
  const all = await listRelationships(accountId);
  return all.find(r =>
    r.state !== 'closed' &&
    r.parties.includes(idA) &&
    r.parties.includes(idB),
  ) ?? null;
}
