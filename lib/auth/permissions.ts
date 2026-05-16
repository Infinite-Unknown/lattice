// Role-based permission map. AWS-style: Root has god-mode by definition.
// IAM users get a single role (admin / approver / viewer) for v1.

import type { Role } from './types';

export type Permission =
  | 'graph.read'
  | 'inbox.read'
  | 'relationship.read'
  | 'steward.run'           // run a Steward tick
  | 'cartographer.run'      // run a Cartographer scan
  | 'approve.write'         // approve a steward log entry or a proposal
  | 'policy.write'          // edit a relationship's policy YAML
  | 'iam.manage'            // create/revoke IAM users
  | 'seed.run';             // (admin tool — out of UI scope for v1)

const READ_PERMS: Permission[] = ['graph.read', 'inbox.read', 'relationship.read'];
const RUN_PERMS: Permission[] = ['steward.run', 'cartographer.run', 'approve.write'];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  root:     [...READ_PERMS, ...RUN_PERMS, 'policy.write', 'iam.manage', 'seed.run'],
  admin:    [...READ_PERMS, ...RUN_PERMS, 'policy.write'],
  approver: [...READ_PERMS, ...RUN_PERMS],
  viewer:   [...READ_PERMS],
};

export function hasPermission(role: Role, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  root: 'Full access · manages IAM users · created at signup',
  admin: 'Full operational access · cannot manage IAM users',
  approver: 'Run agents and approve proposals · cannot edit policy or manage users',
  viewer: 'Read-only · cannot run agents or approve',
};

export const ASSIGNABLE_IAM_ROLES: Role[] = ['admin', 'approver', 'viewer'];
