'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type UserPublic = {
  id: string;
  account_id: string;
  type: 'root' | 'iam';
  email?: string;
  username?: string;
  name: string;
  role: 'root' | 'admin' | 'approver' | 'viewer';
  created_at: string;
  last_login: string | null;
};

export type Permission =
  | 'graph.read' | 'inbox.read' | 'relationship.read'
  | 'steward.run' | 'cartographer.run' | 'approve.write'
  | 'policy.write' | 'iam.manage' | 'seed.run';

type MeResponse = {
  user: UserPublic | null;
  account: { id: string; name: string } | null;
  permissions: Permission[];
};

interface AuthValue {
  user: UserPublic | null;
  account: { id: string; name: string } | null;
  permissions: Permission[];
  can: (p: Permission) => boolean;
  refresh: () => Promise<void>;
  loading: boolean;
}

const AuthCtx = createContext<AuthValue>({
  user: null, account: null, permissions: [], can: () => false, refresh: async () => {}, loading: true,
});

export function useAuth() { return useContext(AuthCtx); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MeResponse>({ user: null, account: null, permissions: [] });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const can = useCallback((p: Permission) => data.permissions.includes(p), [data.permissions]);

  return (
    <AuthCtx.Provider value={{ user: data.user, account: data.account, permissions: data.permissions, can, refresh, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}
