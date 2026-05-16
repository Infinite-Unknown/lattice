import { getAdminDb } from '@/lib/firebase-admin';
import type { ProposedRelationship } from '@/lib/types';

const COL = 'proposals';

export async function listOpenProposals(): Promise<ProposedRelationship[]> {
  const snap = await getAdminDb().collection(COL).where('status', '==', 'open').get();
  return snap.docs.map(d => d.data() as ProposedRelationship);
}

export async function listAllProposals(): Promise<ProposedRelationship[]> {
  const snap = await getAdminDb().collection(COL).get();
  return snap.docs.map(d => d.data() as ProposedRelationship);
}

export async function upsertProposal(p: ProposedRelationship): Promise<void> {
  await getAdminDb().collection(COL).doc(p.id).set(p);
}

export async function setProposalStatus(id: string, status: 'open' | 'recruited' | 'dismissed'): Promise<void> {
  await getAdminDb().collection(COL).doc(id).update({ status });
}
