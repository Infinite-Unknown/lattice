'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NavTodos() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch('/api/stats', { cache: 'no-store' });
        if (!r.ok) return;
        const s = await r.json();
        if (!cancelled) setCount(s.open_todos ?? 0);
      } catch { /* ignore */ }
    }
    load();
    const t = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <Link
      href="/todos"
      className="px-3 py-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-2"
    >
      Todos
      {count !== null && count > 0 && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-700 text-white min-w-[1.25rem] text-center">
          {count}
        </span>
      )}
    </Link>
  );
}
