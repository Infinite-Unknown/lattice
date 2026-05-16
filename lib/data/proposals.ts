import { getAdminDb } from '@/lib/firebase-admin';
import type { ProposedRelationship } from '@/lib/types';

const COL = 'proposals';

export async function listOpenProposals(accountId: string): Promise<ProposedRelationship[]> {
  const snap = await getAdminDb()
    .collection(COL)
    .where('account_id', '==', accountId)
    .where('status', '==', 'open')
    .get();
  return snap.docs.map(d => d.data() as ProposedRelationship);
}

export async function listAllProposals(accountId: string): Promise<ProposedRelationship[]> {
  const snap = await getAdminDb()
    .collection(COL)
    .where('account_id', '==', accountId)
    .get();
  return snap.docs.map(d => d.data() as ProposedRelationship);
}

export async function upsertProposal(p: ProposedRelationship): Promise<void> {
  if (!p.account_id) {
    throw new Error('upsertProposal: account_id required (multi-tenant isolation)');
  }
  await getAdminDb().collection(COL).doc(p.id).set(p);
}

export async function setProposalStatus(id: string, status: 'open' | 'recruited' | 'dismissed'): Promise<void> {
  await getAdminDb().collection(COL).doc(id).update({ status });
}

export async function setProposalRecruited(id: string, linkedRelationshipId?: string): Promise<void> {
  const patch: { status: 'recruited'; linked_relationship_id?: string } = { status: 'recruited' };
  if (linkedRelationshipId) patch.linked_relationship_id = linkedRelationshipId;
  await getAdminDb().collection(COL).doc(id).update(patch);
}

export async function getProposal(id: string, accountId: string): Promise<ProposedRelationship | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  if (!doc.exists) return null;
  const p = doc.data() as ProposedRelationship;
  if (p.account_id !== accountId) return null;
  return p;
}
