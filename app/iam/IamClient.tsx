'use client';
import { useEffect, useState } from 'react';

type PublicUser = {
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

const ROLE_DESCRIPTIONS: Record<string, string> = {
  root: 'Full access · manages IAM users · created at signup',
  admin: 'Full operational access · cannot manage IAM users',
  approver: 'Run agents and approve proposals · cannot edit policy or manage users',
  viewer: 'Read-only · cannot run agents or approve',
};

const ROLE_COLOR: Record<string, string> = {
  root: 'text-amber-300 bg-amber-950/40 border-amber-800',
  admin: 'text-emerald-300 bg-emerald-950/40 border-emerald-800',
  approver: 'text-blue-300 bg-blue-950/40 border-blue-800',
  viewer: 'text-neutral-300 bg-neutral-900 border-neutral-700',
};

export default function IamClient() {
  const [users, setUsers] = useState<PublicUser[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'approver' | 'viewer'>('approver');

  async function refresh() {
    const r = await fetch('/api/iam/users', { cache: 'no-store' });
    if (r.status === 403) { setForbidden(true); return; }
    const j = await r.json();
    setUsers(j.users);
  }
  useEffect(() => { refresh(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const r = await fetch('/api/iam/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, name, password, role }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'failed');
      setUsername(''); setName(''); setPassword(''); setRole('approver');
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function onRevoke(id: string, username: string | undefined) {
    if (!confirm(`Revoke IAM user "${username}"? They'll lose access immediately.`)) return;
    const r = await fetch(`/api/iam/users/${id}`, { method: 'DELETE' });
    if (r.ok) refresh();
  }

  if (forbidden) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <h1 className="text-2xl font-semibold mb-2">Forbidden</h1>
        <p className="text-neutral-400">
          Only the root user can manage IAM. If you need access to this page, ask the root user to grant you a role with
          <code className="px-1 py-0.5 mx-1 rounded bg-neutral-900">iam.manage</code> permission.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-2 font-medium">
          Identity &amp; Access · IAM users
        </div>
        <h1 className="text-2xl font-semibold mb-1">Manage who can do what in your ecosystem</h1>
        <p className="text-neutral-400 max-w-3xl">
          Like AWS, your Lattice account has one <span className="text-amber-300">root user</span> (you,
          right now) and any number of <span className="text-emerald-300">IAM users</span> with scoped roles.
          Grant <em>admin</em> for full operational access, <em>approver</em> for run-and-approve work, or
          <em> viewer</em> for read-only audit. Roles map to a fixed permission policy — Cradle&apos;s
          governance requirement, satisfied.
        </p>
      </div>

      {/* Create IAM user */}
      <section className="mb-8 border border-neutral-800 rounded-lg p-5 bg-neutral-900/30">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-medium">Create IAM user</div>
          <div className="text-xs text-neutral-500">No email needed — IAM identities sign in with a username scoped to this account.</div>
        </div>
        <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-3 items-end">
          <Field label="Username">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="aisha-mentor"
              className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm"
            />
          </Field>
          <Field label="Display name">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Aisha Rahman"
              className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm"
            />
          </Field>
          <Field label="Initial password">
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="≥ 8 chars"
              className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm font-mono"
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm"
            >
              <option value="admin">admin</option>
              <option value="approver">approver</option>
              <option value="viewer">viewer</option>
            </select>
          </Field>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-sm font-medium"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
          {error && (
            <div className="md:col-span-5 text-sm text-rose-300 border border-rose-900 bg-rose-950/30 rounded p-2">
              {error}
            </div>
          )}
        </form>
        <div className="mt-3 text-xs text-neutral-500">
          Selected role &mdash; <span className="text-neutral-300 font-medium">{role}</span>: {ROLE_DESCRIPTIONS[role]}
        </div>
      </section>

      {/* User list */}
      <section>
        <div className="text-xs uppercase tracking-wider text-neutral-400 mb-3 font-medium">All identities in this account</div>
        {!users && <div className="text-neutral-500 text-sm">Loading…</div>}
        {users && users.length === 0 && <div className="text-neutral-500 text-sm">No users yet.</div>}
        <div className="space-y-2">
          {users?.sort((a, b) => (a.type === 'root' ? -1 : b.type === 'root' ? 1 : 0)).map(u => (
            <div key={u.id} className="border border-neutral-800 rounded-lg p-4 flex items-center gap-4 bg-neutral-900/30">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded border ${ROLE_COLOR[u.role]}`}>{u.role}</span>
                  <span className="text-xs text-neutral-500">{u.type === 'root' ? 'root' : 'iam'}</span>
                  <span className="font-medium">{u.name}</span>
                </div>
                <div className="text-xs text-neutral-500">
                  {u.type === 'root' ? `email: ${u.email}` : `username: ${u.username}`}
                  <span className="mx-2">·</span>
                  created {new Date(u.created_at).toLocaleDateString()}
                  {u.last_login && (
                    <>
                      <span className="mx-2">·</span>
                      last login {new Date(u.last_login).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                    </>
                  )}
                </div>
              </div>
              {u.type === 'iam' && (
                <button
                  onClick={() => onRevoke(u.id, u.username)}
                  className="text-xs px-3 py-1.5 rounded border border-rose-900/60 text-rose-300 hover:bg-rose-950/30"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-300 mb-1 font-medium">{label}</div>
      {children}
    </label>
  );
}
