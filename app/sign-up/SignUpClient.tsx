'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpClient() {
  const router = useRouter();
  const [accountName, setAccountName] = useState('Cradle Catalyst');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ account_name: accountName, name, email, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'sign-up failed');
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-2 font-medium">
        Step 1 · Bootstrap your Lattice account
      </div>
      <h1 className="text-3xl font-semibold mb-2">Create the root user</h1>
      <p className="text-neutral-400 mb-6 text-sm leading-relaxed">
        Like AWS, your Lattice instance has exactly one <span className="text-amber-300">root user</span>.
        It has full god-mode access and is the only identity that can create new IAM users for your team.
        Use it sparingly — for day-to-day work, sign in as an IAM user with a scoped role.
      </p>

      <form onSubmit={onSubmit} className="space-y-4 border border-neutral-800 rounded-lg p-5 bg-neutral-900/30">
        <Field label="Ecosystem / organisation name" hint="e.g. Cradle Catalyst, GDG KL Accelerator">
          <input
            type="text"
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            required
            className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm"
          />
        </Field>
        <Field label="Your name">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Faiz Hassan"
            className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm"
          />
        </Field>
        <Field label="Root email" hint="this becomes the login identity for the root user">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-sm"
          />
        </Field>
        <Field label="Password" hint="minimum 8 characters">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
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
          className="w-full px-4 py-2 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Creating…' : 'Create root account'}
        </button>
      </form>

      <div className="mt-6 text-sm text-neutral-500">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-emerald-400 hover:underline">Sign in →</Link>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-300 mb-1 font-medium">{label}</div>
      {hint && <div className="text-xs text-neutral-500 mb-1">{hint}</div>}
      {children}
    </label>
  );
}
