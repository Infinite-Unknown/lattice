'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import Spinner from '../../components/Spinner';
import { CitationChipList, type ChipCitation } from '../../components/CitationChip';
import { humaniseLabel } from '@/lib/format';

type StewardLogEntry = {
  timestamp: string;
  action: string;
  reasoning: string;
  reasoning_pretty?: string;
  citations: string[];
  citations_resolved?: ChipCitation[];
  confidence: number;
  approved: boolean;
  dismissed?: boolean;
  decided_by_name?: string;
  decided_at?: string;
};

type Data = {
  relationship: {
    id: string; type: string; state: string; focus: string[]; cadence: string;
    escalation_policy: string; sunset_policy: string;
    steward_state: { last_run: string | null; memory_summary: string };
    steward_log: StewardLogEntry[];
  };
  parties: Array<{ id: string; name: string }>;
  outcomes: Array<{ id: string; type: string; evidence_text: string; timestamp: string; source: string; verified: boolean }>;
};

export default function RelationshipClient({ id }: { id: string }) {
  const { can, user } = useAuth();
  const canRun = can('steward.run');
  const canEditPolicy = can('policy.write');
  const canWriteRelationship = can('relationship.write');
  const [data, setData] = useState<Data | null>(null);
  const [escalation, setEscalation] = useState('');
  const [sunset, setSunset] = useState('');
  const [tab, setTab] = useState<'timeline' | 'steward' | 'policy'>('timeline');
  const [stateBusy, setStateBusy] = useState(false);
  const [ticking, setTicking] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [notFound, setNotFound] = useState(false);

  async function refresh() {
    const r = await fetch(`/api/relationships/${id}`, { cache: 'no-store' });
    if (r.status === 404) { setNotFound(true); return; }
    const d: Data = await r.json();
    setData(d);
    setEscalation(d.relationship.escalation_policy);
    setSunset(d.relationship.sunset_policy);
  }
  useEffect(() => { refresh(); }, [id]);

  async function savePolicy() {
    if (savingPolicy) return;
    setSavingPolicy(true);
    try {
      await fetch(`/api/relationships/${id}/policy`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ escalation_policy: escalation, sunset_policy: sunset }),
      });
      await refresh();
    } finally {
      setSavingPolicy(false);
    }
  }
  async function tickSteward() {
    if (ticking) return;
    setTicking(true);
    try {
      await fetch('/api/steward/tick', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ relationshipId: id }),
      });
      await refresh();
    } finally {
      setTicking(false);
    }
  }
  async function transitionState(next: 'active' | 'tapered' | 'closed', confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    setStateBusy(true);
    try {
      await fetch(`/api/relationships/${id}/state`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state: next }),
      });
      await refresh();
    } finally {
      setStateBusy(false);
    }
  }

  if (notFound) return (
    <div className="text-neutral-400 max-w-xl">
      <h1 className="text-2xl font-semibold mb-2 text-neutral-100">Not a real relationship yet</h1>
      <p>This edge is a Cartographer <span className="text-amber-400">proposal</span> — it doesn&apos;t exist as an active relationship until approved.</p>
      <p className="mt-2">Head to <a href="/inbox" className="text-emerald-400 underline">Inbox → Cartographer</a> to approve it.</p>
    </div>
  );
  if (!data) return <div className="text-neutral-500">Loading…</div>;

  const state = data.relationship.state;
  const stateColor =
    state === 'active' ? 'text-emerald-400' :
    state === 'escalated' ? 'text-rose-400' :
    state === 'tapered' ? 'text-neutral-400' :
    state === 'closed' ? 'text-neutral-500' :
    'text-amber-400';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2 font-medium">
            Managed autonomously by a Steward agent
          </div>
          <h1 className="text-2xl font-semibold mb-1">{data.parties.map(p => p.name).join(' ↔ ')}</h1>
          <div className="text-sm text-neutral-400">
            {data.relationship.type} · state: <span className={stateColor}>{state}</span> · focus: {data.relationship.focus.join(', ') || '—'} · cadence: {data.relationship.cadence}
          </div>
        </div>

        {canWriteRelationship && (
          <div className="flex gap-2 flex-wrap justify-end">
            {state === 'active' && (
              <>
                <button
                  onClick={() => transitionState('tapered', `Taper this relationship? It will keep history but mark engagement as winding down.`)}
                  disabled={stateBusy}
                  className="px-3 py-1.5 rounded text-sm border border-neutral-700 hover:bg-neutral-900 disabled:opacity-50"
                >
                  Taper
                </button>
                <button
                  onClick={() => transitionState('closed', `Close this relationship? You can reopen it later.`)}
                  disabled={stateBusy}
                  className="px-3 py-1.5 rounded text-sm border border-rose-900/60 text-rose-300 hover:bg-rose-950/30 disabled:opacity-50"
                >
                  Close
                </button>
              </>
            )}
            {state === 'tapered' && (
              <>
                <button
                  onClick={() => transitionState('active', `Reactivate this tapered relationship?`)}
                  disabled={stateBusy}
                  className="px-3 py-1.5 rounded text-sm border border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/30 disabled:opacity-50"
                >
                  Reactivate
                </button>
                <button
                  onClick={() => transitionState('closed', `Close this relationship?`)}
                  disabled={stateBusy}
                  className="px-3 py-1.5 rounded text-sm border border-rose-900/60 text-rose-300 hover:bg-rose-950/30 disabled:opacity-50"
                >
                  Close
                </button>
              </>
            )}
            {state === 'closed' && (
              <button
                onClick={() => transitionState('active', `Reopen this closed relationship?`)}
                disabled={stateBusy}
                className="px-3 py-1.5 rounded text-sm border border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/30 disabled:opacity-50"
              >
                Reopen
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('timeline')} className={`px-3 py-1.5 rounded ${tab === 'timeline' ? 'bg-neutral-700' : 'bg-neutral-900'}`}>Timeline</button>
        <button onClick={() => setTab('steward')} className={`px-3 py-1.5 rounded ${tab === 'steward' ? 'bg-emerald-700' : 'bg-neutral-900'}`}>Steward log</button>
        <button onClick={() => setTab('policy')} className={`px-3 py-1.5 rounded ${tab === 'policy' ? 'bg-amber-700' : 'bg-neutral-900'}`}>Policy</button>
        <button
          onClick={tickSteward}
          disabled={!canRun || ticking}
          title={canRun ? undefined : `Your role (${user?.role ?? 'unknown'}) lacks steward.run`}
          className="ml-auto px-3 py-1.5 rounded bg-emerald-900 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {ticking && <Spinner />}
          {ticking ? 'Steward thinking…' : 'Run Steward tick'}
        </button>
      </div>

      {tab === 'timeline' && (
        <ol className="space-y-2">
          {data.outcomes.map(o => (
            <li key={o.id} className="border-l-2 border-neutral-800 pl-3 py-1">
              <div className="text-xs text-neutral-500">{new Date(o.timestamp).toLocaleString()} · {o.type} · {o.source}{o.verified ? ' · verified' : ''}</div>
              <div className="text-sm">{o.evidence_text}</div>
            </li>
          ))}
        </ol>
      )}

      {tab === 'steward' && (
        <div className="space-y-3">
          {data.relationship.steward_log.length === 0 && <p className="text-neutral-500 text-sm">No Steward runs yet. Click &quot;Run Steward tick&quot;.</p>}
          {data.relationship.steward_log.slice().reverse().map(e => {
            const status = e.approved ? 'approved' : e.dismissed ? 'dismissed' : 'pending';
            const statusColor =
              status === 'approved' ? 'text-emerald-400' :
              status === 'dismissed' ? 'text-rose-400' :
              'text-amber-400';
            return (
              <div key={e.timestamp} className={`border rounded p-3 ${
                status === 'dismissed' ? 'border-rose-900/40 bg-rose-950/10' :
                status === 'approved' ? 'border-emerald-900/40 bg-emerald-950/10' :
                'border-neutral-800'
              }`}>
                <div className="text-xs text-neutral-500 flex items-center gap-2 flex-wrap">
                  <span>{new Date(e.timestamp).toLocaleString()}</span>
                  <span>·</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-[11px] font-medium">
                    {humaniseLabel(e.action)}
                  </span>
                  <span>conf {e.confidence.toFixed(2)}</span>
                  <span>·</span>
                  <span className={statusColor}>
                    {status === 'approved' && '✓ approved'}
                    {status === 'dismissed' && '✗ dismissed'}
                    {status === 'pending' && '⏳ pending'}
                  </span>
                  {e.decided_by_name && e.decided_at && (
                    <span className="text-neutral-500">
                      by <span className="text-neutral-300">{e.decided_by_name}</span> at {new Date(e.decided_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="text-sm mt-2 leading-relaxed">{e.reasoning_pretty ?? e.reasoning}</div>
                <CitationChipList citations={e.citations_resolved ?? []} />
              </div>
            );
          })}
        </div>
      )}

      {tab === 'policy' && (
        <div className="space-y-4">
          {!canEditPolicy && (
            <div className="text-xs text-amber-300 border border-amber-900 bg-amber-950/30 rounded p-2">
              ◉ Your role (<span className="font-medium">{user?.role ?? 'unknown'}</span>) can&apos;t edit policy.
              Only <span className="font-medium">root</span> and <span className="font-medium">admin</span> have <code className="px-1 rounded bg-neutral-900">policy.write</code>.
            </div>
          )}
          <div>
            <label className="text-sm text-neutral-400">Escalation policy (YAML)</label>
            <textarea
              value={escalation}
              onChange={e => setEscalation(e.target.value)}
              disabled={!canEditPolicy}
              className="w-full mt-1 p-3 font-mono text-sm bg-neutral-900 border border-neutral-800 rounded h-40 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-400">Sunset policy (YAML)</label>
            <textarea
              value={sunset}
              onChange={e => setSunset(e.target.value)}
              disabled={!canEditPolicy}
              className="w-full mt-1 p-3 font-mono text-sm bg-neutral-900 border border-neutral-800 rounded h-40 disabled:opacity-50"
            />
          </div>
          <button
            onClick={savePolicy}
            disabled={!canEditPolicy || savingPolicy}
            title={canEditPolicy ? undefined : `Your role (${user?.role}) lacks policy.write`}
            className="px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {savingPolicy && <Spinner />}
            {savingPolicy ? 'Saving…' : 'Save policy'}
          </button>
          <p className="text-xs text-neutral-500">Tip: edit a policy, save, then click &quot;Run Steward tick&quot; — watch the agent reflect your change.</p>
        </div>
      )}
    </div>
  );
}
