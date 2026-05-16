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
    <html lang="en" className="bg-background text-foreground antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen font-sans">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
