import { getAdminDb } from '@/lib/firebase-admin';
import type { Actor } from '@/lib/types';

const COL = 'actors';

export async function getActor(id: string): Promise<Actor | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  return doc.exists ? (doc.data() as Actor) : null;
}

export async function listActors(): Promise<Actor[]> {
  const snap = await getAdminDb().collection(COL).get();
  return snap.docs.map(d => d.data() as Actor);
}

export async function upsertActor(a: Actor): Promise<void> {
  await getAdminDb().collection(COL).doc(a.id).set(a);
}
