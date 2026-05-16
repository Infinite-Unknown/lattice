import { getAdminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/auth/types';

const COL = 'users';

export async function getUser(id: string): Promise<User | null> {
  const doc = await getAdminDb().collection(COL).doc(id).get();
  return doc.exists ? (doc.data() as User) : null;
}

export async function listUsers(accountId: string): Promise<User[]> {
  const snap = await getAdminDb().collection(COL).where('account_id', '==', accountId).get();
  return snap.docs.map(d => d.data() as User);
}

export async function upsertUser(u: User): Promise<void> {
  await getAdminDb().collection(COL).doc(u.id).set(u);
}

export async function deleteUser(id: string): Promise<void> {
  await getAdminDb().collection(COL).doc(id).delete();
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const snap = await getAdminDb()
    .collection(COL)
    .where('firebase_email', '==', email.toLowerCase())
    .limit(1)
    .get();
  return snap.empty ? null : (snap.docs[0].data() as User);
}

export async function findUserByUsername(accountId: string, username: string): Promise<User | null> {
  const snap = await getAdminDb()
    .collection(COL)
    .where('account_id', '==', accountId)
    .where('username', '==', username.toLowerCase())
    .limit(1)
    .get();
  return snap.empty ? null : (snap.docs[0].data() as User);
}
