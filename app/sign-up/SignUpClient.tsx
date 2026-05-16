'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInAsRoot } from '@/lib/auth/client-flow';
import { useAuth } from '../AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

export default function SignUpClient() {
  const router = useRouter();
  const { refresh: refreshAuth } = useAuth();
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

      await signInAsRoot(email, password);
      await refreshAuth();
      router.push('/dashboard');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] grid lg:grid-cols-2 -m-6 md:-m-12">
      {/* Left — editorial */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 border-r border-border bg-background relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -left-12 select-none pointer-events-none font-display font-black text-[16rem] leading-none text-muted opacity-50"
        >
          01
        </div>
        <Link href="/" className="relative font-sans font-bold text-xl tracking-tight hover:text-accent transition-colors duration-150">
          LATTICE
        </Link>
        <div className="relative">
          <span className="block w-16 h-1 bg-accent mb-8" />
          <h1 className="font-sans font-bold text-5xl xl:text-6xl leading-none tracking-tighter mb-6">
            One account.
            <br />
            <span className="text-muted-foreground">One root.</span>
            <br />
            <span className="text-accent">Many IAMs.</span>
          </h1>
          <p className="font-sans text-lg text-muted-foreground max-w-md leading-relaxed">
            Like AWS — bootstrap your account once, then provision scoped
            IAM users for your team. Root is god-mode; use it sparingly.
          </p>
        </div>
        <div className="relative font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Build with AI 2026 KL · MyHack
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
            New account
          </div>
          <h2 className="font-sans font-bold text-3xl md:text-4xl leading-none tracking-tighter mb-10">
            Create your<br />account.
          </h2>

          <form onSubmit={onSubmit} className="space-y-6">
            <Field
              label="Ecosystem name"
              hint="e.g. Cradle Catalyst, GDG KL Accelerator"
            >
              <Input
                type="text"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                required
              />
            </Field>
            <Field label="Your name">
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Faiz Hassan"
                autoComplete="name"
              />
            </Field>
            <Field
              label="Root email"
              hint="becomes the login identity"
            >
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Password" hint="minimum 8 characters">
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>

            {error && (
              <div className="border border-accent bg-accent/10 p-4 font-mono text-xs uppercase tracking-widest text-accent">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" disabled={loading}>
                {loading ? 'Creating…' : 'Create root account →'}
              </Button>
            </div>
          </form>

          <div className="mt-10 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-foreground hover:text-accent transition-colors duration-150 underline underline-offset-4 decoration-1">
              Sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      {hint && <div className="font-mono text-xs text-muted-foreground/60 normal-case tracking-normal mt-1">{hint}</div>}
      <div className="mt-3">{children}</div>
    </label>
  );
}
