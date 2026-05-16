import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './AuthContext';
import AppShell from './AppShell';

export const metadata: Metadata = {
  title: 'Lattice — Autonomous Ecosystem Operations',
  description: 'Relationships that run themselves. An ecosystem that completes itself.',
  // Fonts are pulled by @import in globals.css. We could add preconnect
  // <link>s for a ~100ms fetch speedup on cold paint, but doing so via a
  // manual <head> element in this layout pulls Next into pages-router
  // _document territory and breaks `next build`. Leaving it for later via
  // a proper App Router metadata mechanism.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-background text-foreground antialiased">
      <body className="min-h-screen font-sans">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
