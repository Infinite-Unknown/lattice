'use client';
import { useEffect, useState } from 'react';

type InboxData = {
  pendingActions: Array<{ kind: 'steward'; relationshipId: string; relationshipLabel: string; timestamp: string; action: string; reasoning: string; citations: string[]; confidence: number; }>;
  gaps: Array<{ kind: 'proposal'; proposalId: string; gapType: string; candidates: string[]; reasoning: string; citations: string[]; impact: string; confidence: number; }>;
};

export default function InboxClient() {
  const [data, setData] = useState<InboxData | null>(null);
  const [tab, setTab] = useState<'steward' | 'cartographer'>('steward');

  async function refresh() {
    const r = await fetch('/api/inbox', { cache: 'no-store' });
    setData(await r.json());
  }
  useEffect(() => { refresh(); }, []);

  async function tickAll() {
    const rels = data?.pendingActions ?? [];
    const ids = Array.from(new Set(rels.map(r => r.relationshipId)));
    if (ids.length === 0) {
      const all = await (await fetch('/api/graph')).json();
      for (const link of all.links.slice(0, 5)) {
        await fetch('/api/steward/tick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ relationshipId: link.id }) });
      }
    } else {
      for (const id of ids) {
        await fetch('/api/steward/tick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ relationshipId: id }) });
      }
    }
    refresh();
  }

  async function scanGaps() {
    await fetch('/api/cartographer/scan', { method: 'POST' });
    refresh();
  }

  async function approveSteward(relationshipId: string, timestamp: string) {
    await fetch('/api/approve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'steward-log', relationshipId, timestamp }) });
    refresh();
  }

  async function approveProposal(proposalId: string) {
    await fetch('/api/approve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'proposal', proposalId }) });
    refresh();
  }

  if (!data) return <div className="text-neutral-500">Loading…</div>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('steward')} className={`px-3 py-1.5 rounded ${tab === 'steward' ? 'bg-emerald-700' : 'bg-neutral-800'}`}>Steward proposals ({data.pendingActions.length})</button>
        <button onClick={() => setTab('cartographer')} className={`px-3 py-1.5 rounded ${tab === 'cartographer' ? 'bg-amber-700' : 'bg-neutral-800'}`}>Cartographer gaps ({data.gaps.length})</button>
        <div className="ml-auto flex gap-2">
          <button onClick={tickAll} className="px-3 py-1.5 rounded bg-emerald-900 hover:bg-emerald-800">Run Steward tick</button>
          <button onClick={scanGaps} className="px-3 py-1.5 rounded bg-amber-900 hover:bg-amber-800">Run Cartographer scan</button>
        </div>
      </div>

      {tab === 'steward' && (
        <div className="space-y-3">
          {data.pendingActions.length === 0 && <p className="text-neutral-500">No pending Steward actions. Click "Run Steward tick" to generate some.</p>}
          {data.pendingActions.map(a => (
            <div key={a.timestamp + a.relationshipId} className="border border-neutral-800 rounded p-4">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{a.relationshipLabel}</div>
                  <div className="text-xs text-neutral-400">action: <span className="text-emerald-400">{a.action}</span> · confidence {a.confidence.toFixed(2)}</div>
                </div>
                <button onClick={() => approveSteward(a.relationshipId, a.timestamp)} className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-sm">Approve</button>
              </div>
              <p className="mt-2 text-sm">{a.reasoning}</p>
              <div className="mt-1 text-xs text-neutral-500">citations: {a.citations.join(', ')}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'cartographer' && (
        <div className="space-y-3">
          {data.gaps.length === 0 && <p className="text-neutral-500">No open gaps. Click "Run Cartographer scan" to find some.</p>}
          {data.gaps.map(g => (
            <div key={g.proposalId} className="border border-neutral-800 rounded p-4">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium"><span className="text-amber-400">{g.gapType}</span></div>
                  <div className="text-xs text-neutral-400">candidates: {g.candidates.join(', ')} · confidence {g.confidence.toFixed(2)}</div>
                </div>
                <button onClick={() => approveProposal(g.proposalId)} className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-sm">Approve</button>
              </div>
              <p className="mt-2 text-sm">{g.reasoning}</p>
              <p className="mt-1 text-xs text-emerald-400">expected impact: {g.impact}</p>
              <div className="mt-1 text-xs text-neutral-500">citations: {g.citations.join(', ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
