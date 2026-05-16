import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import NavInbox from './NavInbox';

export const metadata: Metadata = {
  title: 'Lattice — Autonomous Ecosystem Operations',
  description: 'Relationships that run themselves. An ecosystem that completes itself.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b border-neutral-800 px-6 py-3 flex items-center gap-6 text-sm">
          <Link href="/" className="font-semibold flex items-center gap-2">
            <span className="text-amber-400">◉</span> Lattice
          </Link>
          <div className="flex gap-1">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/graph">Graph</NavLink>
            <NavInbox />
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-emerald-900/30 border border-emerald-800/60 text-emerald-300">
              Programme Admin · Cradle Catalyst
            </span>
          </div>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
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
