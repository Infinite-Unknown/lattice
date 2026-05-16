import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './AuthContext';
import AppShell from './AppShell';

export const metadata: Metadata = {
  title: 'Lattice — Autonomous Ecosystem Operations',
  description: 'Relationships that run themselves. An ecosystem that completes itself.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
