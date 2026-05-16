// Auth identity model — AWS-style: 1 Account, 1 Root user, many IAM users.
// Single-tenant for v1: the Lattice instance == the Account.

export type Role = 'root' | 'admin' | 'approver' | 'viewer';

export type UserType = 'root' | 'iam';

export interface Account {
  id: string;
  name: string;             // e.g. "Cradle Catalyst"
  root_user_id: string;
  created_at: string;
}

export interface User {
  id: string;
  account_id: string;
  type: UserType;
  // root: email is the login identity; iam: username is the login identity
  email?: string;
  username?: string;
  name: string;
  password_hash: string;
  role: Role;
  created_at: string;
  last_login: string | null;
}

export interface Session {
  token: string;            // random hex; primary key
  user_id: string;
  account_id: string;
  created_at: string;
  expires_at: string;
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
  const { password_hash, ...rest } = u;
  return rest;
}
