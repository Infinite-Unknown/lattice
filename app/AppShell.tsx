'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import NavInbox from './NavInbox';

const ROLE_COLOR: Record<string, string> = {
  root: 'bg-amber-900/40 border-amber-700/60 text-amber-200',
  admin: 'bg-emerald-900/40 border-emerald-700/60 text-emerald-200',
  approver: 'bg-blue-900/40 border-blue-700/60 text-blue-200',
  viewer: 'bg-neutral-800 border-neutral-700 text-neutral-300',
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, account, can, loading, clear } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Public pages bring their own header — render bare here.
  const isPublicPage = pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up';
  if (isPublicPage) {
    // Landing has its own internal padding; auth forms need outer p-6.
    return pathname === '/' ? <>{children}</> : <main className="p-6">{children}</main>;
  }

  async function signOut() {
    setMenuOpen(false);
    // 1. CLEAR THE CLIENT-CACHED IDENTITY SYNCHRONOUSLY.
    //    Critical to avoid the data-leak window where the next user briefly
    //    sees the previous user's chrome (admin nav links, enabled buttons)
    //    while /api/auth/me round-trips for their fresh identity.
    clear();
    // 2. Clear Firebase Auth client state too, so the next sign-in form
    //    doesn't silently re-use a cached credential.
    try { await firebaseSignOut(getClientAuth()); } catch { /* ignore */ }
    // 3. Clear the server-side session cookie + revoke Firebase refresh tokens.
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <>
      <nav className="border-b border-neutral-800 px-6 py-3 flex items-center gap-6 text-sm">
        <Link href="/dashboard" className="font-semibold flex items-center gap-2">
          <span className="text-amber-400">◉</span> Lattice
        </Link>
        <div className="flex gap-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/graph">Graph</NavLink>
          <NavInbox />
          <NavLink href="/audit">Audit</NavLink>
          {/* Only render IAM link once we're confident in the identity —
              prevents flashing 'admin' chrome to a viewer mid-handoff. */}
          {!loading && can('iam.manage') && <NavLink href="/iam">IAM</NavLink>}
        </div>

        <div className="ml-auto relative">
          {user ? (
            <button
              onClick={() => setMenuOpen(o => !o)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${ROLE_COLOR[user.role]}`}
            >
              <span className="font-medium">{user.name}</span>
              <span className="opacity-70">·</span>
              <span>{user.role}</span>
              <span className="opacity-50">▾</span>
            </button>
          ) : (
            <Link href="/sign-in" className="text-emerald-400 hover:underline text-xs">Sign in</Link>
          )}

          {menuOpen && user && (
            <div className="absolute right-0 top-full mt-2 w-72 border border-neutral-800 bg-neutral-950 rounded-lg shadow-xl z-50 text-xs overflow-hidden">
              <div className="p-3 border-b border-neutral-800">
                <div className="font-medium text-sm text-neutral-100">{user.name}</div>
                <div className="text-neutral-500 mt-0.5">
                  {user.type === 'root' ? `Root · ${user.email}` : `IAM · ${user.username}`}
                </div>
                <div className="text-neutral-500 mt-0.5">
                  Role: <span className="text-neutral-200">{user.role}</span>
                </div>
                {account && (
                  <div className="text-neutral-500 mt-0.5">
                    Account: <span className="text-neutral-200">{account.name}</span>
                  </div>
                )}
              </div>
              {!loading && can('iam.manage') && (
                <Link href="/iam" onClick={() => setMenuOpen(false)} className="block p-3 hover:bg-neutral-900 text-neutral-300">
                  ⚙ Manage IAM users
                </Link>
              )}
              <button
                onClick={signOut}
                className="block w-full text-left p-3 hover:bg-neutral-900 text-rose-300 border-t border-neutral-800"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
    >
      {children}
    </Link>
  );
}
