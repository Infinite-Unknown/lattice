'use client';
import { useEffect, useState } from 'react';

type Data = {
  relationship: {
    id: string; type: string; state: string; focus: string[]; cadence: string;
    escalation_policy: string; sunset_policy: string;
    steward_state: { last_run: string | null; memory_summary: string };
    steward_log: Array<{ timestamp: string; action: string; reasoning: string; citations: string[]; confidence: number; approved: boolean }>;
  };
  parties: Array<{ id: string; name: string }>;
  outcomes: Array<{ id: string; type: string; evidence_text: string; timestamp: string; source: string; verified: boolean }>;
};

export default function RelationshipClient({ id }: { id: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [escalation, setEscalation] = useState('');
  const [sunset, setSunset] = useState('');
  const [tab, setTab] = useState<'timeline' | 'steward' | 'policy'>('timeline');

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
    await fetch(`/api/relationships/${id}/policy`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ escalation_policy: escalation, sunset_policy: sunset }) });
    refresh();
  }
  async function tickSteward() {
    await fetch('/api/steward/tick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ relationshipId: id }) });
    refresh();
  }

  if (notFound) return (
    <div className="text-neutral-400 max-w-xl">
      <h1 className="text-2xl font-semibold mb-2 text-neutral-100">Not a real relationship yet</h1>
      <p>This edge is a Cartographer <span className="text-amber-400">proposal</span> — it doesn&apos;t exist as an active relationship until approved.</p>
      <p className="mt-2">Head to <a href="/inbox" className="text-emerald-400 underline">Inbox → Cartographer</a> to approve it.</p>
    </div>
  );
  if (!data) return <div className="text-neutral-500">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2 font-medium">
        Managed autonomously by a Steward agent
      </div>
      <h1 className="text-2xl font-semibold mb-1">{data.parties.map(p => p.name).join(' ↔ ')}</h1>
      <div className="text-sm text-neutral-400 mb-4">
        {data.relationship.type} · state: <span className="text-emerald-400">{data.relationship.state}</span> · focus: {data.relationship.focus.join(', ')} · cadence: {data.relationship.cadence}
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('timeline')} className={`px-3 py-1.5 rounded ${tab === 'timeline' ? 'bg-neutral-700' : 'bg-neutral-900'}`}>Timeline</button>
        <button onClick={() => setTab('steward')} className={`px-3 py-1.5 rounded ${tab === 'steward' ? 'bg-emerald-700' : 'bg-neutral-900'}`}>Steward log</button>
        <button onClick={() => setTab('policy')} className={`px-3 py-1.5 rounded ${tab === 'policy' ? 'bg-amber-700' : 'bg-neutral-900'}`}>Policy</button>
        <button onClick={tickSteward} className="ml-auto px-3 py-1.5 rounded bg-emerald-900 hover:bg-emerald-800">Run Steward tick</button>
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
          {data.relationship.steward_log.length === 0 && <p className="text-neutral-500">No Steward runs yet. Click "Run Steward tick".</p>}
          {data.relationship.steward_log.slice().reverse().map(e => (
            <div key={e.timestamp} className="border border-neutral-800 rounded p-3">
              <div className="text-xs text-neutral-500">{new Date(e.timestamp).toLocaleString()} · action: <span className="text-emerald-400">{e.action}</span> · conf {e.confidence.toFixed(2)} · {e.approved ? '✓ approved' : 'pending'}</div>
              <div className="text-sm mt-1">{e.reasoning}</div>
              <div className="text-xs text-neutral-500 mt-1">citations: {e.citations.join(', ')}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'policy' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-neutral-400">Escalation policy (YAML)</label>
            <textarea value={escalation} onChange={e => setEscalation(e.target.value)}
              className="w-full mt-1 p-3 font-mono text-sm bg-neutral-900 border border-neutral-800 rounded h-40" />
          </div>
          <div>
            <label className="text-sm text-neutral-400">Sunset policy (YAML)</label>
            <textarea value={sunset} onChange={e => setSunset(e.target.value)}
              className="w-full mt-1 p-3 font-mono text-sm bg-neutral-900 border border-neutral-800 rounded h-40" />
          </div>
          <button onClick={savePolicy} className="px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600">Save policy</button>
          <p className="text-xs text-neutral-500">Tip: edit a policy, save, then click "Run Steward tick" — watch the agent reflect your change.</p>
        </div>
      )}
    </div>
  );
}
