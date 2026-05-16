'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignInClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';

  const [mode, setMode] = useState<'root' | 'iam'>('root');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode, email, username, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'sign-in failed');
      router.push(next);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2 font-medium">
        Sign in to Lattice
      </div>
      <h1 className="text-3xl font-semibold mb-6">Welcome back</h1>

      {/* Tab toggle, AWS-style root / IAM */}
      <div className="flex gap-2 mb-4 border-b border-neutral-800">
        <Tab active={mode === 'root'} onClick={() => setMode('root')}>
          Root user
        </Tab>
        <Tab active={mode === 'iam'} onClick={() => setMode('iam')}>
          IAM user
        </Tab>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 border border-neutral-800 rounded-lg p-5 bg-neutral-900/30">
        {mode === 'root' ? (
          <>
            <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-900 rounded p-2">
              ⚠️ Root has full god-mode. Prefer using IAM with a scoped role for day-to-day work.
            </div>
            <Field label="Root email">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm"
              />
            </Field>
          </>
        ) : (
          <>
            <div className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded p-2">
              IAM users sign in with a username (not email). Ask your root user for credentials.
            </div>
            <Field label="IAM username">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="e.g. aisha-mentor"
                className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm"
              />
            </Field>
          </>
        )}

        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm"
          />
        </Field>

        {error && (
          <div className="text-sm text-rose-300 border border-rose-900 bg-rose-950/30 rounded p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded text-sm font-medium disabled:opacity-50 ${
            mode === 'root' ? 'bg-amber-700 hover:bg-amber-600' : 'bg-emerald-700 hover:bg-emerald-600'
          }`}
        >
          {loading ? 'Signing in…' : mode === 'root' ? 'Sign in as Root' : 'Sign in as IAM user'}
        </button>
      </form>

      <div className="mt-6 text-sm text-neutral-500">
        First time here?{' '}
        <Link href="/sign-up" className="text-amber-400 hover:underline">Bootstrap a root account →</Link>
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm border-b-2 transition-colors ${
        active ? 'border-emerald-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
      }`}
    >
      {children}
    </button>
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
