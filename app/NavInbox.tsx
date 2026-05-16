'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NavInbox() {
  const pathname = usePathname();
  const active = pathname?.startsWith('/inbox') ?? false;
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch('/api/stats', { cache: 'no-store' });
        if (!r.ok) return;
        const s = await r.json();
        if (!cancelled) setCount((s.pending_steward_actions ?? 0) + (s.pending_proposals ?? 0));
      } catch { /* ignore */ }
    }
    load();
    const t = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <Link
      href="/inbox"
      className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-150 relative inline-flex items-center gap-2.5 ${
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      Inbox
      {count !== null && count > 0 && (
        <span className="font-mono text-[10px] px-2 py-0.5 bg-accent text-accent-foreground tracking-normal min-w-[1.5rem] text-center font-bold">
          {count}
        </span>
      )}
      {active && (
        <span aria-hidden="true" className="absolute left-4 right-4 -bottom-px h-0.5 bg-accent" />
      )}
    </Link>
  );
}
