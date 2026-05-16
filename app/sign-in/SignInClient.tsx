'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInAsRoot, signInAsIam } from '@/lib/auth/client-flow';
import { useAuth } from '../AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

export default function SignInClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';
  const { refresh: refreshAuth } = useAuth();

  const [mode, setMode] = useState<'root' | 'iam'>('root');
  // The single-tenant fallback: if exactly one account exists, we can
  // pre-fill the IAM tab's account-name field for convenience.
  const [defaultAccountName, setDefaultAccountName] = useState<string | null>(null);
  const [accountNameInput, setAccountNameInput] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/account').then(r => r.json()).then(j => {
      if (j.account) {
        setDefaultAccountName(j.account.name);
        setAccountNameInput(j.account.name);
      }
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'root') {
        // Root uses a real email — Firebase Auth identifies the user
        // globally and the user doc's account_id tells us the tenant.
        await signInAsRoot(email, password);
      } else {
        // IAM is scoped to a specific account. Look up the account by
        // name to get its id, then mint the synthetic IAM email.
        const accountName = accountNameInput.trim();
        if (!accountName) throw new Error('Enter an account name to sign in as an IAM user.');
        const r = await fetch(`/api/auth/accounts/lookup?name=${encodeURIComponent(accountName)}`);
        if (r.status === 404) throw new Error('No account by that name. Check spelling, or ask your root user.');
        if (!r.ok) throw new Error(`account lookup failed (${r.status})`);
        const j = await r.json();
        const accountId = j.account?.id as string | undefined;
        if (!accountId) throw new Error('account lookup returned no id');
        await signInAsIam(accountId, username, password);
      }
      await refreshAuth();
      router.push(next);
      router.refresh();
    } catch (e: any) {
      setError(humanizeAuthError(e?.code ?? e?.message ?? 'sign-in failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] grid lg:grid-cols-2 -m-6 md:-m-12">
      {/* Left — editorial pitch */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 border-r border-border bg-background relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -bottom-12 -left-12 select-none pointer-events-none font-display font-black text-[20rem] leading-none text-muted opacity-50"
        >
          ◉
        </div>
        <Link href="/" className="relative font-sans font-bold text-xl tracking-tight hover:text-accent transition-colors duration-150">
          LATTICE
        </Link>
        <div className="relative">
          <span className="block w-16 h-1 bg-accent mb-8" />
          <h1 className="font-sans font-bold text-5xl xl:text-6xl leading-none tracking-tighter mb-6">
            Welcome
            <br />
            <span className="text-muted-foreground">back.</span>
          </h1>
          <p className="font-sans text-lg text-muted-foreground max-w-md leading-relaxed">
            Sign in to your ecosystem. Stewards have been working.
          </p>
        </div>
        <div className="relative font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {defaultAccountName ? <>Account · <span className="text-foreground">{defaultAccountName}</span></> : <>Build with AI 2026 KL</>}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center p-6 md:p-12 lg:p-16">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden mb-10">
            <Link href="/" className="font-sans font-bold text-xl tracking-tight hover:text-accent transition-colors duration-150">
              LATTICE
            </Link>
          </div>

          <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Sign in
          </div>
          <h2 className="font-sans font-bold text-3xl md:text-4xl leading-none tracking-tighter mb-10">
            Pick up where the<br />Stewards left off.
          </h2>

          {/* Mode toggle */}
          <div className="flex border-b border-border mb-8">
            <TabButton active={mode === 'root'} onClick={() => setMode('root')}>
              Root user
            </TabButton>
            <TabButton active={mode === 'iam'} onClick={() => setMode('iam')}>
              IAM user
            </TabButton>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {mode === 'root' ? (
              <>
                <div className="border border-accent/30 bg-accent/5 p-4 font-mono text-xs uppercase tracking-widest text-accent">
                  Root has god-mode. Prefer IAM for daily work.
                </div>
                <Field label="Root email">
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </Field>
              </>
            ) : (
              <>
                <div className="border border-border bg-muted p-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  IAM users sign in with a username scoped to their account.
                </div>
                <Field label="Account name">
                  <Input
                    type="text"
                    value={accountNameInput}
                    onChange={e => setAccountNameInput(e.target.value)}
                    required
                    placeholder="Cradle Catalyst"
                    autoComplete="organization"
                  />
                </Field>
                <Field label="Username">
                  <Input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    placeholder="aisha-mentor"
                    autoComplete="username"
                  />
                </Field>
              </>
            )}

            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>

            {error && (
              <div className="border border-accent bg-accent/10 p-4 font-mono text-xs uppercase tracking-widest text-accent">
                {error}
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-8">
              <Button type="submit" variant="primary" size="lg" disabled={loading}>
                {loading ? 'Signing in…' : mode === 'root' ? 'Sign in as root →' : 'Sign in as IAM →'}
              </Button>
            </div>
          </form>

          <div className="mt-10 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            First time?{' '}
            <Link href="/sign-up" className="text-foreground hover:text-accent transition-colors duration-150 underline underline-offset-4 decoration-1">
              Bootstrap a new account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function humanizeAuthError(code: string): string {
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Invalid credentials.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Try again in a few minutes.';
  }
  if (code.includes('network-request-failed')) {
    return 'Network error reaching Firebase Auth.';
  }
  return code;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-150 border-b-2 -mb-px ${
        active ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
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
