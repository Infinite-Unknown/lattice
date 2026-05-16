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
  | 'policy.write' | 'actor.write' | 'relationship.write'
  | 'iam.manage' | 'seed.run';

type MeResponse = {
  user: UserPublic | null;
  account: { id: string; name: string } | null;
  permissions: Permission[];
};

const EMPTY_STATE: MeResponse = { user: null, account: null, permissions: [] };

interface AuthValue {
  user: UserPublic | null;
  account: { id: string; name: string } | null;
  permissions: Permission[];
  /** True before / during the first /api/auth/me round-trip OR while a refresh is in flight. */
  loading: boolean;
  can: (p: Permission) => boolean;
  /** Re-fetch /api/auth/me. Use after sign-in to load the new identity. */
  refresh: () => Promise<void>;
  /** Wipe the cached identity synchronously. Use on sign-out so we never
   *  render the previous user's chrome to whoever logs in next. */
  clear: () => void;
}

const AuthCtx = createContext<AuthValue>({
  user: null, account: null, permissions: [], loading: true,
  can: () => false,
  refresh: async () => {},
  clear: () => {},
});

export function useAuth() { return useContext(AuthCtx); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MeResponse>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        setData({
          user: j.user ?? null,
          account: j.account ?? null,
          permissions: j.permissions ?? [],
        });
      } else {
        // Failure response = treat as unauthenticated rather than holding
        // onto stale cached data — better to under-grant than over-grant.
        setData(EMPTY_STATE);
      }
    } catch {
      setData(EMPTY_STATE);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(EMPTY_STATE);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // can() is permission-driven: an empty permissions array (loading or
  // cleared state) means false for everything, which is the safe default.
  const can = useCallback((p: Permission) => data.permissions.includes(p), [data.permissions]);

  return (
    <AuthCtx.Provider value={{
      user: data.user,
      account: data.account,
      permissions: data.permissions,
      loading,
      can,
      refresh,
      clear,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
