// Auth identity model — AWS-style: 1 Account, 1 Root user, many IAM users.
// Single-tenant for v1: the Lattice instance == the Account.
// Backed by Firebase Auth: User.id is the Firebase UID.

export type Role = 'root' | 'admin' | 'approver' | 'viewer';

export type UserType = 'root' | 'iam';

export interface Account {
  id: string;
  name: string;             // e.g. "Cradle Catalyst"
  root_user_id: string;     // Firebase UID of the root user
  created_at: string;
}

export interface User {
  id: string;               // Firebase UID
  account_id: string;
  type: UserType;
  // root: email is the real login identity
  // iam:  username is the human-facing identifier; firebase_email holds the synthetic email
  email?: string;
  username?: string;
  firebase_email: string;   // what Firebase Auth actually uses (real for root, synthetic for IAM)
  name: string;
  role: Role;
  created_at: string;
  last_login: string | null;
}

// Slim version of User safe to ship to the client.
export interface UserPublic {
  id: string;
  account_id: string;
  type: UserType;
  email?: string;
  username?: string;
  name: string;
  role: Role;
  created_at: string;
  last_login: string | null;
}

export function toPublicUser(u: User): UserPublic {
  return {
    id: u.id,
    account_id: u.account_id,
    type: u.type,
    email: u.email,
    username: u.username,
    name: u.name,
    role: u.role,
    created_at: u.created_at,
    last_login: u.last_login,
  };
}
