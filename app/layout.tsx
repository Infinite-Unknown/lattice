import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lattice',
  description: 'Relationships that run themselves. An ecosystem that completes itself.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b border-neutral-800 px-6 py-3 flex gap-4 text-sm">
          <a href="/" className="font-semibold">Lattice</a>
          <a href="/graph" className="hover:text-white text-neutral-400">Graph</a>
          <a href="/inbox" className="hover:text-white text-neutral-400">Inbox</a>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
