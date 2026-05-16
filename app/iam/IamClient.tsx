'use client';
import { useEffect, useState } from 'react';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import { SkeletonRows } from '../components/Skeleton';

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
  root: 'Full access · manages IAM · created at signup',
  admin: 'Full operational access · cannot manage IAM',
  approver: 'Run agents and approve · no policy edit',
  viewer: 'Read-only · no agent runs, no approvals',
};

const SELECT_CLASSES = 'block w-full h-12 px-4 text-base font-sans bg-input border border-border text-foreground focus:border-accent focus:outline-none transition-colors duration-150';

export default function IamClient() {
  const [users, setUsers] = useState<PublicUser[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="max-w-3xl mx-auto py-16">
        <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
          IAM / Forbidden
        </div>
        <h1 className="font-sans font-bold text-4xl md:text-5xl leading-none tracking-tighter mb-6">
          Root only.
        </h1>
        <p className="font-sans text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
          Only the root user can manage IAM. Ask the root user to grant you a role with the <span className="font-mono text-foreground">iam.manage</span> permission.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 md:mb-12 pb-8 border-b border-border">
        <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
          Identity / IAM
        </div>
        <h1 className="font-sans font-bold text-4xl md:text-6xl leading-none tracking-tighter mb-6">
          Who can do<br /><span className="text-muted-foreground">what.</span>
        </h1>
        <p className="font-sans text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
          One root user, plus any number of scoped IAM identities.
          Roles map to a fixed permission policy — Cradle&apos;s
          governance requirement, satisfied.
        </p>
      </header>

      <section className="mb-12 border-b border-border pb-12">
        <div className="flex items-baseline justify-between mb-6">
          <div className="font-mono text-xs uppercase tracking-widest text-accent">
            Create IAM user
          </div>
          <div className="font-mono text-xs text-muted-foreground/70 normal-case tracking-normal">
            IAM users sign in with a username, not email
          </div>
        </div>
        <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-4 items-end">
          <Field label="Username">
            <Input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="aisha-mentor"
              autoComplete="off"
            />
          </Field>
          <Field label="Display name">
            <Input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Aisha Rahman"
              autoComplete="off"
            />
          </Field>
          <Field label="Initial password">
            <Input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="≥ 8 chars"
              className="font-mono"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className={SELECT_CLASSES}
            >
              <option value="admin">admin</option>
              <option value="approver">approver</option>
              <option value="viewer">viewer</option>
            </select>
          </Field>
          <button
            type="submit"
            disabled={creating}
            className="group inline-flex items-center gap-2 font-semibold uppercase tracking-wider text-xs text-accent py-3 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating && <Spinner />}
            <span className="relative">
              {creating ? 'Creating…' : 'Create →'}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110 group-disabled:hidden"
                style={{ transformOrigin: 'left center' }}
              />
            </span>
          </button>
          {error && (
            <div className="md:col-span-5 border border-accent bg-accent/10 p-3 font-mono text-xs uppercase tracking-widest text-accent">
              {error}
            </div>
          )}
        </form>
        <div className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Role · <span className="text-foreground">{role}</span> · <span className="normal-case tracking-normal">{ROLE_DESCRIPTIONS[role]}</span>
        </div>
      </section>

      <section>
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
          All identities in this account
        </div>
        {!users && <SkeletonRows count={3} />}
        {users && users.length === 0 && (
          <div className="border border-border bg-card p-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            No users yet
          </div>
        )}
        {users && users.length > 0 && (
          <div className="space-y-px bg-border">
            {users.sort((a, b) => (a.type === 'root' ? -1 : b.type === 'root' ? 1 : 0)).map(u => (
              <div key={u.id} className="bg-background p-6 md:p-8 flex items-center gap-6 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    {u.type === 'root' ? <span className="text-accent">Root</span> : 'IAM'}
                    <span className="mx-3">·</span>
                    <span className="text-foreground">{u.role}</span>
                  </div>
                  <h3 className="font-sans font-bold text-xl md:text-2xl leading-tight tracking-tight mb-2">
                    {u.name}
                  </h3>
                  <div className="font-mono text-xs text-muted-foreground/70 normal-case tracking-normal">
                    {u.type === 'root' ? u.email : `@${u.username}`}
                    <span className="mx-2">·</span>
                    created {new Date(u.created_at).toLocaleDateString('en-MY')}
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
                    className="group inline-flex items-center font-semibold uppercase tracking-wider text-xs text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px"
                  >
                    <span className="relative">
                      Revoke
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent scale-x-0 transition-transform duration-150 ease-crisp group-hover:scale-x-100"
                        style={{ transformOrigin: 'left center' }}
                      />
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">{label}</div>
      {children}
    </label>
  );
}
