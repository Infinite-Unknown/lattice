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

const ACTION_COLOR: Record<string, string> = {
  approve_steward:               'text-emerald-300 bg-emerald-950/40 border-emerald-800/60',
  dismiss_steward:               'text-rose-300 bg-rose-950/40 border-rose-800/60',
  approve_proposal:              'text-emerald-300 bg-emerald-950/40 border-emerald-800/60',
  dismiss_proposal:              'text-rose-300 bg-rose-950/40 border-rose-800/60',
  create_actor:                  'text-blue-300 bg-blue-950/40 border-blue-800/60',
  create_relationship:           'text-blue-300 bg-blue-950/40 border-blue-800/60',
  transition_relationship_state: 'text-amber-300 bg-amber-950/40 border-amber-800/60',
  auto_state_transition:         'text-amber-300 bg-amber-950/40 border-amber-800/60',
  edit_policy:                   'text-amber-300 bg-amber-950/40 border-amber-800/60',
  create_iam_user:               'text-purple-300 bg-purple-950/40 border-purple-800/60',
  revoke_iam_user:               'text-rose-300 bg-rose-950/40 border-rose-800/60',
};

const ROLE_COLOR: Record<string, string> = {
  root: 'text-amber-300',
  admin: 'text-emerald-300',
  approver: 'text-blue-300',
  viewer: 'text-neutral-400',
};

export default function AuditClient() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine' | 'agents-related'>('all');

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
    if (filter === 'agents-related') return e.action.includes('steward') || e.action.includes('proposal') || e.action.includes('state');
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-2 font-medium">
          Audit log · Who did what when
        </div>
        <h1 className="text-2xl font-semibold mb-1">Governance history</h1>
        <p className="text-neutral-400 max-w-3xl">
          Every administrative action — approving or dismissing AI proposals, creating actors or
          relationships, transitioning state, editing policy, managing IAM users — is recorded here
          with the identity of the operator, role at the time, and the affected entity. This is the
          surface a compliance review (or post-incident investigation) inspects.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4 text-sm">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-sm"
        >
          <option value="all">All actions</option>
          <option value="agents-related">Agent-related only (approve/dismiss/state)</option>
        </select>
        <button
          onClick={refresh}
          className="ml-auto px-3 py-1.5 rounded text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="text-sm text-rose-300 border border-rose-900 bg-rose-950/30 rounded p-2 mb-4">{error}</div>
      )}

      {!entries ? (
        <SkeletonRows count={5} />
      ) : (
      <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
        {entries && entries.length === 0 && (
          <div className="p-4 text-neutral-500 text-sm">No audit entries yet. Perform an admin action (approve a Steward proposal, create an actor, transition state) to populate this log.</div>
        )}
        {filtered?.map(e => (
          <div key={e.id} className="p-3 hover:bg-neutral-900/50">
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="text-neutral-500 tabular-nums">
                {new Date(e.timestamp).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'medium' })}
              </span>
              <span className={`px-2 py-0.5 rounded border ${ACTION_COLOR[e.action] ?? 'text-neutral-300 bg-neutral-900 border-neutral-700'}`}>
                {e.action}
              </span>
              <span className="text-neutral-200">
                <span className={ROLE_COLOR[e.actor_role]}>{e.actor_role}</span> · {e.actor_name}
              </span>
              <span className="text-neutral-600">
                target: {e.target_kind}:{e.target_id}
              </span>
            </div>
            <div className="text-sm mt-1">{e.details}</div>
          </div>
        ))}
      </div>
      )}

      <div className="text-xs text-neutral-500 mt-4">
        Showing the latest {entries?.length ?? 0} entries · filter applied: {filter}
      </div>
    </div>
  );
}
