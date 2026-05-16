import { getAdminDb } from '@/lib/firebase-admin';
import type { Relationship, StewardLogEntry } from '@/lib/types';

const COL = 'relationships';

export async function getRelationship(id: string): Promise<Relationship | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  return doc.exists ? (doc.data() as Relationship) : null;
}

export async function listRelationships(): Promise<Relationship[]> {
  const snap = await getAdminDb().collection(COL).get();
  return snap.docs.map(d => d.data() as Relationship);
}

export async function upsertRelationship(r: Relationship): Promise<void> {
  await getAdminDb().collection(COL).doc(r.id).set(r);
}

export async function appendStewardLog(id: string, entry: StewardLogEntry): Promise<void> {
  const r = await getRelationship(id);
  if (!r) throw new Error(`Relationship ${id} not found`);
  r.steward_log.push(entry);
  r.last_steward_run = entry.timestamp;
  r.steward_state.last_run = entry.timestamp;
  await upsertRelationship(r);
}

export async function updatePolicy(id: string, escalation: string, sunset: string): Promise<void> {
  const r = await getRelationship(id);
  if (!r) throw new Error(`Relationship ${id} not found`);
  r.escalation_policy = escalation;
  r.sunset_policy = sunset;
  await upsertRelationship(r);
}

/**
 * Return any non-closed relationship that has both actors in its parties.
 * Used to prevent duplicate edges when materialising a Cartographer proposal.
 */
export async function findActiveRelationshipBetween(idA: string, idB: string): Promise<Relationship | null> {
  const all = await listRelationships();
  return all.find(r =>
    r.state !== 'closed' &&
    r.parties.includes(idA) &&
    r.parties.includes(idB),
  ) ?? null;
}
