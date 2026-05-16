import { getAdminDb } from '@/lib/firebase-admin';
import type { Role, User } from '@/lib/auth/types';

const COL = 'audit_log';

export type AuditAction =
  | 'approve_steward'
  | 'dismiss_steward'
  | 'approve_proposal'
  | 'dismiss_proposal'
  | 'create_actor'
  | 'edit_actor'
  | 'create_relationship'
  | 'transition_relationship_state'
  | 'edit_policy'
  | 'create_iam_user'
  | 'revoke_iam_user'
  | 'auto_state_transition'
  | 'create_todo'
  | 'complete_todo'
  | 'dispatch_todo';

export type AuditTargetKind = 'relationship' | 'actor' | 'proposal' | 'iam_user' | 'steward_log_entry' | 'todo';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  account_id: string;
  actor_user_id: string;
  actor_name: string;
  actor_role: Role;
  action: AuditAction;
  target_kind: AuditTargetKind;
  target_id: string;
  details: string;
}

export async function writeAuditEntry(
  user: User,
  action: AuditAction,
  target_kind: AuditTargetKind,
  target_id: string,
  details: string,
): Promise<void> {
  const entry: AuditLogEntry = {
    id: `al_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    account_id: user.account_id,
    actor_user_id: user.id,
    actor_name: user.name,
    actor_role: user.role,
    action,
    target_kind,
    target_id,
    details,
  };
  await getAdminDb().collection(COL).doc(entry.id).set(entry);
}

export async function listAuditEntries(accountId: string, limit = 100): Promise<AuditLogEntry[]> {
  // We deliberately don't combine where(account_id) + orderBy(timestamp) here:
  // Firestore would require a composite index for that pair, and audit log
  // volume is small enough that sorting in memory is fine.
  const snap = await getAdminDb()
    .collection(COL)
    .where('account_id', '==', accountId)
    .get();
  const all = snap.docs.map(d => d.data() as AuditLogEntry);
  all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return all.slice(0, limit);
}
