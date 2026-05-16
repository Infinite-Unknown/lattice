'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import NavInbox from './NavInbox';
import NavTodos from './NavTodos';

const ROLE_DOT: Record<string, string> = {
  root: 'bg-accent',
  admin: 'bg-foreground',
  approver: 'bg-muted-foreground',
  viewer: 'bg-muted-foreground',
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, account, can, loading, clear } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Public pages bring their own header — render bare here.
  const isPublicPage = pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up';
  if (isPublicPage) {
    return pathname === '/' ? <>{children}</> : <main className="p-6 md:p-12">{children}</main>;
  }

  async function signOut() {
    setMenuOpen(false);
    clear();
    try { await firebaseSignOut(getClientAuth()); } catch { /* ignore */ }
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <>
      <nav className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center gap-8">
          <Link
            href="/dashboard"
            className="font-sans font-bold text-base tracking-tight transition-colors duration-150 hover:text-accent"
          >
            LATTICE
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</NavLink>
            <NavLink href="/graph" active={pathname?.startsWith('/graph') ?? false}>Graph</NavLink>
            <NavInbox />
            <NavTodos />
            <NavLink href="/audit" active={pathname?.startsWith('/audit') ?? false}>Audit</NavLink>
            {!loading && can('iam.manage') && (
              <NavLink href="/iam" active={pathname?.startsWith('/iam') ?? false}>IAM</NavLink>
            )}
          </div>

          <div className="ml-auto relative">
            {user ? (
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2.5 py-1.5 transition-opacity duration-150 hover:opacity-70 active:translate-y-px"
              >
                <span className={`inline-block w-2 h-2 ${ROLE_DOT[user.role] ?? 'bg-muted-foreground'}`} />
                <span className="font-mono text-xs uppercase tracking-widest text-foreground">
                  {user.name}
                </span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  / {user.role}
                </span>
              </button>
            ) : (
              <Link
                href="/sign-in"
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                Sign in →
              </Link>
            )}

            {menuOpen && user && (
              <div
                className="absolute right-0 top-full mt-3 w-80 border border-border bg-card z-50 animate-scale-in"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="p-5 border-b border-border">
                  <div className="font-sans font-semibold text-base text-foreground">{user.name}</div>
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-2">
                    {user.type === 'root' ? 'Root' : 'IAM'} · {user.role}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground mt-1 normal-case tracking-normal">
                    {user.type === 'root' ? user.email : user.username}
                  </div>
                  {account && (
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-2">
                      Account · <span className="text-foreground">{account.name}</span>
                    </div>
                  )}
                </div>
                {!loading && can('iam.manage') && (
                  <Link
                    href="/iam"
                    onClick={() => setMenuOpen(false)}
                    className="block p-5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 border-b border-border"
                  >
                    Manage IAM users →
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="block w-full text-left p-5 font-mono text-xs uppercase tracking-widest text-accent hover:bg-muted transition-colors duration-150"
                >
                  Sign out →
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="p-6 md:p-10 lg:p-12">{children}</main>
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-150 relative ${
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {active && (
        <span aria-hidden="true" className="absolute left-4 right-4 -bottom-px h-0.5 bg-accent" />
      )}
    </Link>
  );
}
