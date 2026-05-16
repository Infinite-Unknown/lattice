'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import NavAgents from './NavAgents';
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
  const [personaOpen, setPersonaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer + persona dropdown on every route change so the
  // next page isn't covered by stale chrome.
  useEffect(() => {
    setPersonaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes the mobile drawer. Persona dropdown already has its own
  // mouseleave handler so this only targets the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Public pages bring their own header — render bare here.
  const isPublicPage = pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up';
  if (isPublicPage) {
    return pathname === '/' ? <>{children}</> : <main className="p-6 md:p-12">{children}</main>;
  }

  async function signOut() {
    setPersonaOpen(false);
    setMobileOpen(false);
    clear();
    try { await firebaseSignOut(getClientAuth()); } catch { /* ignore */ }
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <>
      <nav className="border-b border-border bg-background relative z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center gap-8">
          {/* Logo always routes to the public landing page — when signed in
              that page surfaces an 'Open dashboard' CTA, so / doubles as a
              home button and avoids the redundant 'I'm on /dashboard and
              the logo points to /dashboard' situation. */}
          <Link
            href="/"
            className="font-sans font-bold text-base tracking-tight transition-colors duration-150 hover:text-accent"
          >
            LATTICE
          </Link>

          {/* Desktop nav — hidden on mobile, replaced by hamburger drawer */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</NavLink>
            <NavLink href="/graph" active={pathname?.startsWith('/graph') ?? false}>Graph</NavLink>
            <NavAgents />
            <NavTodos />
            <NavLink href="/audit" active={pathname?.startsWith('/audit') ?? false}>Audit</NavLink>
            {!loading && can('iam.manage') && (
              <NavLink href="/iam" active={pathname?.startsWith('/iam') ?? false}>IAM</NavLink>
            )}
          </div>

          {/* Desktop persona — hidden on mobile, drawer carries it instead */}
          <div className="ml-auto relative hidden md:block">
            {user ? (
              <button
                onClick={() => setPersonaOpen(o => !o)}
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

            {personaOpen && user && (
              <div
                className="absolute right-0 top-full mt-3 w-80 border border-border bg-card z-50 animate-scale-in"
                onMouseLeave={() => setPersonaOpen(false)}
              >
                <PersonaCard user={user} account={account} />
                {!loading && can('iam.manage') && (
                  <Link
                    href="/iam"
                    onClick={() => setPersonaOpen(false)}
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

          {/* Mobile hamburger — replaces both the desktop nav and persona */}
          <button
            type="button"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="md:hidden ml-auto inline-flex flex-col items-end justify-center gap-1.5 p-2 -mr-2 transition-opacity duration-150 active:translate-y-px"
          >
            {/* Hamburger → X on open. Sharp dashes, no rounded ends — Bold
                Typography is allergic to rounded anything. */}
            <span
              aria-hidden="true"
              className={`block h-px bg-foreground transition-all duration-200 ease-crisp ${
                mobileOpen ? 'w-6 translate-y-[7px] rotate-45' : 'w-6'
              }`}
            />
            <span
              aria-hidden="true"
              className={`block h-px bg-foreground transition-all duration-200 ease-crisp ${
                mobileOpen ? 'w-6 opacity-0' : 'w-4'
              }`}
            />
            <span
              aria-hidden="true"
              className={`block h-px bg-foreground transition-all duration-200 ease-crisp ${
                mobileOpen ? 'w-6 -translate-y-[7px] -rotate-45' : 'w-5'
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer — slides down below the nav, full width, full height */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-[57px] z-30 bg-background animate-fade-in md:hidden overflow-y-auto"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="border-b border-border"
            onClick={e => e.stopPropagation()}
          >
            {/* Routes */}
            <div className="divide-y divide-border">
              <MobileNavLink href="/dashboard" active={pathname === '/dashboard'} onClose={() => setMobileOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink href="/graph" active={pathname?.startsWith('/graph') ?? false} onClose={() => setMobileOpen(false)}>
                Graph
              </MobileNavLink>
              <MobileNavLink href="/agents" active={pathname?.startsWith('/agents') ?? false} onClose={() => setMobileOpen(false)}>
                Agents
              </MobileNavLink>
              <MobileNavLink href="/todos" active={pathname?.startsWith('/todos') ?? false} onClose={() => setMobileOpen(false)}>
                Todos
              </MobileNavLink>
              <MobileNavLink href="/audit" active={pathname?.startsWith('/audit') ?? false} onClose={() => setMobileOpen(false)}>
                Audit
              </MobileNavLink>
              {!loading && can('iam.manage') && (
                <MobileNavLink href="/iam" active={pathname?.startsWith('/iam') ?? false} onClose={() => setMobileOpen(false)}>
                  IAM
                </MobileNavLink>
              )}
            </div>

            {/* Persona footer */}
            {user && (
              <div className="border-t-2 border-accent bg-card">
                <PersonaCard user={user} account={account} />
                <button
                  onClick={signOut}
                  className="block w-full text-left px-6 py-5 font-mono text-xs uppercase tracking-widest text-accent border-t border-border active:bg-muted transition-colors duration-150"
                >
                  Sign out →
                </button>
              </div>
            )}
            {!user && (
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="block px-6 py-5 font-mono text-xs uppercase tracking-widest text-accent border-t border-border"
              >
                Sign in →
              </Link>
            )}
          </div>
        </div>
      )}

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

function MobileNavLink({
  href, active, onClose, children,
}: {
  href: string; active: boolean; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`block px-6 py-5 font-sans font-bold text-2xl tracking-tight transition-colors duration-150 active:bg-muted relative ${
        active ? 'text-accent' : 'text-foreground'
      }`}
    >
      {children}
      {active && (
        <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
      )}
    </Link>
  );
}

function PersonaCard({ user, account }: { user: any; account: any }) {
  return (
    <div className="p-6">
      <div className="font-sans font-semibold text-lg text-foreground">{user.name}</div>
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-2">
        {user.type === 'root' ? 'Root' : 'IAM'} · {user.role}
      </div>
      <div className="font-mono text-xs text-muted-foreground mt-1 normal-case tracking-normal break-all">
        {user.type === 'root' ? user.email : user.username}
      </div>
      {account && (
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-3">
          Account · <span className="text-foreground">{account.name}</span>
        </div>
      )}
    </div>
  );
}
