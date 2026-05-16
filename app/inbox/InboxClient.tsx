'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import Spinner from '../components/Spinner';

type InboxData = {
  pendingActions: Array<{ kind: 'steward'; relationshipId: string; relationshipLabel: string; timestamp: string; action: string; reasoning: string; citations: string[]; confidence: number; }>;
  gaps: Array<{ kind: 'proposal'; proposalId: string; gapType: string; candidates: string[]; reasoning: string; citations: string[]; impact: string; confidence: number; }>;
};

export default function InboxClient() {
  const { can, user } = useAuth();
  const canRun = can('steward.run');
  const canScan = can('cartographer.run');
  const canApprove = can('approve.write');
  const [data, setData] = useState<InboxData | null>(null);
  const [tab, setTab] = useState<'steward' | 'cartographer'>('steward');
  const [tickingAll, setTickingAll] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'info' | 'error'; message: string; href?: string } | null>(null);

  // Auto-dismiss toast after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  async function refresh() {
    const r = await fetch('/api/inbox', { cache: 'no-store' });
    setData(await r.json());
  }
  useEffect(() => { refresh(); }, []);

  async function tickAll() {
    if (tickingAll) return;
    setTickingAll(true);
    try {
      const rels = data?.pendingActions ?? [];
      const ids = Array.from(new Set(rels.map(r => r.relationshipId)));
      if (ids.length === 0) {
        const all = await (await fetch('/api/graph')).json();
        for (const link of (all.links ?? []).slice(0, 5)) {
          await fetch('/api/steward/tick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ relationshipId: link.id }) });
        }
      } else {
        for (const id of ids) {
          await fetch('/api/steward/tick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ relationshipId: id }) });
        }
      }
      await refresh();
    } finally {
      setTickingAll(false);
    }
  }

  async function scanGaps() {
    if (scanning) return;
    setScanning(true);
    try {
      await fetch('/api/cartographer/scan', { method: 'POST' });
      await refresh();
    } finally {
      setScanning(false);
    }
  }

  async function decideSteward(relationshipId: string, timestamp: string, decision: 'approve' | 'dismiss') {
    const key = `s:${relationshipId}:${timestamp}:${decision}`;
    setBusyId(key);
    try {
      await fetch('/api/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: decision === 'approve' ? 'steward-log' : 'dismiss-steward', relationshipId, timestamp }),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function decideProposal(proposalId: string, decision: 'approve' | 'dismiss') {
    const key = `p:${proposalId}:${decision}`;
    setBusyId(key);
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: decision === 'approve' ? 'proposal' : 'dismiss-proposal', proposalId }),
      });
      const j = await res.json().catch(() => ({}));
      if (decision === 'approve' && res.ok) {
        setToast({
          kind: j.materialized ? 'success' : 'info',
          message: j.message ?? 'Proposal approved.',
          href: j.relationshipId ? `/relationships/${j.relationshipId}` : undefined,
        });
      } else if (decision === 'dismiss' && res.ok) {
        setToast({ kind: 'info', message: 'Proposal dismissed.' });
      } else if (!res.ok) {
        setToast({ kind: 'error', message: j.error ?? `Failed (${res.status})` });
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (!data) return <div className="text-neutral-500">Loading…</div>;

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setTab('steward')} className={`px-3 py-1.5 rounded ${tab === 'steward' ? 'bg-emerald-700' : 'bg-neutral-800'}`}>
          Steward proposals ({data.pendingActions.length})
        </button>
        <button onClick={() => setTab('cartographer')} className={`px-3 py-1.5 rounded ${tab === 'cartographer' ? 'bg-amber-700' : 'bg-neutral-800'}`}>
          Cartographer gaps ({data.gaps.length})
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={tickAll}
            disabled={!canRun || tickingAll}
            title={canRun ? undefined : `Your role (${user?.role ?? 'unknown'}) lacks steward.run`}
            className="px-3 py-1.5 rounded bg-emerald-900 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {tickingAll && <Spinner />}
            {tickingAll ? 'Running Steward ticks…' : 'Run Steward tick'}
          </button>
          <button
            onClick={scanGaps}
            disabled={!canScan || scanning}
            title={canScan ? undefined : `Your role (${user?.role ?? 'unknown'}) lacks cartographer.run`}
            className="px-3 py-1.5 rounded bg-amber-900 hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {scanning && <Spinner />}
            {scanning ? 'Scanning ecosystem…' : 'Run Cartographer scan'}
          </button>
        </div>
      </div>
      {!canRun && !canApprove && (
        <div className="mb-4 text-xs text-neutral-500 border border-neutral-800 rounded p-2">
          ◉ You&apos;re signed in as <span className="text-neutral-300 font-medium">{user?.role}</span>. This is a read-only role — actions are disabled.
        </div>
      )}

      {toast && (
        <div className={`mb-4 p-3 rounded border text-sm flex items-start justify-between gap-3 ${
          toast.kind === 'success' ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-200' :
          toast.kind === 'error' ? 'border-rose-900 bg-rose-950/30 text-rose-200' :
          'border-neutral-700 bg-neutral-900 text-neutral-200'
        }`}>
          <div className="flex-1">
            {toast.message}
            {toast.href && (
              <> · <a href={toast.href} className="underline">Open relationship →</a></>
            )}
          </div>
          <button onClick={() => setToast(null)} className="text-neutral-500 hover:text-neutral-200" aria-label="Dismiss">×</button>
        </div>
      )}

      {tab === 'steward' && (
        <div className="space-y-3">
          {data.pendingActions.length === 0 && <p className="text-neutral-500 text-sm">No pending Steward actions. Click &quot;Run Steward tick&quot; to generate some.</p>}
          {data.pendingActions.map(a => {
            const approveKey = `s:${a.relationshipId}:${a.timestamp}:approve`;
            const dismissKey = `s:${a.relationshipId}:${a.timestamp}:dismiss`;
            const approveBusy = busyId === approveKey;
            const dismissBusy = busyId === dismissKey;
            return (
              <div key={a.timestamp + a.relationshipId} className="border border-neutral-800 rounded p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-medium">{a.relationshipLabel}</div>
                    <div className="text-xs text-neutral-400">action: <span className="text-emerald-400">{a.action}</span> · confidence {a.confidence.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => decideSteward(a.relationshipId, a.timestamp, 'dismiss')}
                      disabled={!canApprove || !!busyId}
                      title={canApprove ? 'Dismiss this proposal' : `Your role (${user?.role}) lacks approve.write`}
                      className="px-3 py-1 rounded border border-rose-900/60 text-rose-300 hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                    >
                      {dismissBusy && <Spinner />}
                      Dismiss
                    </button>
                    <button
                      onClick={() => decideSteward(a.relationshipId, a.timestamp, 'approve')}
                      disabled={!canApprove || !!busyId}
                      title={canApprove ? 'Approve — auto-transitions state for taper/sunset/escalate' : `Your role (${user?.role}) lacks approve.write`}
                      className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                    >
                      {approveBusy && <Spinner />}
                      Approve
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm">{a.reasoning}</p>
                <div className="mt-1 text-xs text-neutral-500">citations: {a.citations.join(', ')}</div>
                {(a.action === 'taper' || a.action === 'sunset' || a.action === 'escalate') && (
                  <div className="mt-2 text-xs text-amber-400">
                    ⚠ Approving will auto-transition state to <span className="font-medium">{a.action === 'taper' ? 'tapered' : a.action === 'sunset' ? 'closed' : 'escalated'}</span>.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'cartographer' && (
        <div className="space-y-3">
          {data.gaps.length === 0 && <p className="text-neutral-500 text-sm">No open gaps. Click &quot;Run Cartographer scan&quot; to find some.</p>}
          {data.gaps.map(g => {
            const approveKey = `p:${g.proposalId}:approve`;
            const dismissKey = `p:${g.proposalId}:dismiss`;
            const approveBusy = busyId === approveKey;
            const dismissBusy = busyId === dismissKey;
            return (
              <div key={g.proposalId} className="border border-neutral-800 rounded p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-medium"><span className="text-amber-400">{g.gapType}</span></div>
                    <div className="text-xs text-neutral-400">candidates: {g.candidates.join(', ')} · confidence {g.confidence.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => decideProposal(g.proposalId, 'dismiss')}
                      disabled={!canApprove || !!busyId}
                      title={canApprove ? 'Dismiss this gap' : `Your role (${user?.role}) lacks approve.write`}
                      className="px-3 py-1 rounded border border-rose-900/60 text-rose-300 hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                    >
                      {dismissBusy && <Spinner />}
                      Dismiss
                    </button>
                    <button
                      onClick={() => decideProposal(g.proposalId, 'approve')}
                      disabled={!canApprove || !!busyId}
                      title={canApprove ? 'Approve — marks as recruited; create the actual relationship from the Graph page' : `Your role (${user?.role}) lacks approve.write`}
                      className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                    >
                      {approveBusy && <Spinner />}
                      Approve
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm">{g.reasoning}</p>
                <p className="mt-1 text-xs text-emerald-400">expected impact: {g.impact}</p>
                <div className="mt-1 text-xs text-neutral-500">citations: {g.citations.join(', ')}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
