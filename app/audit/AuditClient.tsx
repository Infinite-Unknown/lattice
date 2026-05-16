'use client';
import { useEffect, useState } from 'react';
import { SkeletonRows } from '../components/Skeleton';

type AuditEntry = {
  id: string;
  timestamp: string;
  actor_user_id: string;
  actor_name: string;
  actor_role: 'root' | 'admin' | 'approver' | 'viewer';
  action: string;
  target_kind: string;
  target_id: string;
  details: string;
};

// Action types fall into 4 semantic groups. Coloring conveys consequence,
// not category — accent for state-changing, foreground for create/manage,
// muted for the rest.
function actionTone(action: string): 'accent' | 'foreground' | 'muted' {
  if (action.includes('approve') || action.includes('transition') || action.includes('escalate')) return 'accent';
  if (action.includes('create') || action.includes('edit') || action.includes('iam')) return 'foreground';
  return 'muted';
}

export default function AuditClient() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'agents-related'>('all');

  async function refresh() {
    try {
      const r = await fetch('/api/audit?limit=200', { cache: 'no-store' });
      if (!r.ok) throw new Error(`status ${r.status}`);
      const j = await r.json();
      setEntries(j.entries);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = entries?.filter(e => {
    if (filter === 'all') return true;
    return e.action.includes('steward') || e.action.includes('proposal') || e.action.includes('state');
  });

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 md:mb-12 pb-8 border-b border-border">
        <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
          Audit / Governance
        </div>
        <h1 className="font-sans font-bold text-4xl md:text-6xl leading-none tracking-tighter mb-6">
          Every admin action.<br /><span className="text-muted-foreground">Recorded.</span>
        </h1>
        <p className="font-sans text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Every approval, dismissal, state transition, policy edit, and IAM
          change — with the identity of the operator, their role at the
          time, and the affected entity. The surface a compliance review
          inspects.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-4 border-b border-border">
        <div className="flex">
          <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
            All actions
          </FilterTab>
          <FilterTab active={filter === 'agents-related'} onClick={() => setFilter('agents-related')}>
            Agent-related
          </FilterTab>
        </div>
        <button
          onClick={refresh}
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150 underline underline-offset-4 decoration-1"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 border border-accent bg-accent/10 p-4 font-mono text-xs uppercase tracking-widest text-accent">
          {error}
        </div>
      )}

      {!entries ? (
        <SkeletonRows count={5} />
      ) : entries.length === 0 ? (
        <div className="border border-border bg-card p-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          No audit entries yet · perform an admin action to populate this log
        </div>
      ) : (
        <div className="border-t border-border">
          {filtered?.map(e => {
            const tone = actionTone(e.action);
            const actionColor =
              tone === 'accent' ? 'text-accent' :
              tone === 'foreground' ? 'text-foreground' :
              'text-muted-foreground';
            return (
              <div
                key={e.id}
                className="grid md:grid-cols-[160px_1fr_auto] gap-4 md:gap-6 py-5 border-b border-border hover:bg-muted transition-colors duration-150 group"
              >
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground tabular-nums">
                  {new Date(e.timestamp).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest mb-2">
                    <span className={actionColor}>{e.action}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-foreground">{e.actor_name}</span>
                    <span className="text-muted-foreground"> · {e.actor_role}</span>
                  </div>
                  <div className="font-sans text-sm md:text-base text-foreground leading-snug">
                    {e.details}
                  </div>
                </div>
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground md:text-right normal-case tracking-normal">
                  {e.target_kind}:{e.target_id}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Showing latest {entries?.length ?? 0} entries · filter · <span className="text-foreground">{filter}</span>
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 -mb-px font-mono text-xs uppercase tracking-widest transition-colors duration-150 border-b-2 ${
        active ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
