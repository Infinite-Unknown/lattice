'use client';
import { useState } from 'react';
import Modal from '../components/Modal';

const TYPES = [
  { value: 'mentorship', label: 'Mentorship (mentor ↔ founder)' },
  { value: 'company_in_programme', label: 'Company in programme' },
  { value: 'partner_in_initiative', label: 'Partner in initiative' },
  { value: 'service_engagement', label: 'Service engagement' },
] as const;

type NodeOption = { id: string; name: string; type: string };

export default function AddRelationshipModal({
  open, onClose, onCreated, actors,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  actors: NodeOption[];
}) {
  const [type, setType] = useState<'mentorship' | 'company_in_programme' | 'partner_in_initiative' | 'service_engagement'>('mentorship');
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [focus, setFocus] = useState('');
  const [cadence, setCadence] = useState('bi-weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setType('mentorship'); setPartyA(''); setPartyB(''); setFocus(''); setCadence('bi-weekly'); setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type,
          parties: [partyA, partyB],
          focus: focus.split(',').map(s => s.trim()).filter(Boolean),
          cadence,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'failed');
      reset();
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Smart default ordering: for mentorship, suggest mentor first; for company-in-programme, company first; etc.
  const sortedActors = [...actors].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal open={open} onClose={onClose} title="Form a new relationship">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Relationship type">
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded text-sm"
          >
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Party 1">
            <ActorSelect value={partyA} onChange={setPartyA} actors={sortedActors} />
          </Field>
          <Field label="Party 2">
            <ActorSelect value={partyB} onChange={setPartyB} actors={sortedActors} />
          </Field>
        </div>

        <Field label="Focus tags" hint="comma-separated — what is this relationship about?">
          <input
            type="text"
            value={focus}
            onChange={e => setFocus(e.target.value)}
            placeholder="fintech, fundraising"
            className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono"
          />
        </Field>

        <Field label="Cadence" hint="how often the parties should engage">
          <input
            type="text"
            value={cadence}
            onChange={e => setCadence(e.target.value)}
            placeholder="bi-weekly | monthly | quarterly | as-needed"
            className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded text-sm"
          />
        </Field>

        <div className="text-xs text-neutral-500 border border-neutral-800 bg-neutral-900/40 rounded p-2">
          Default escalation + sunset policies will be applied. Edit them on the Policy tab of the new relationship if you want different triggers.
        </div>

        {error && (
          <div className="text-sm text-rose-300 border border-rose-900 bg-rose-950/30 rounded p-2">{error}</div>
        )}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-neutral-800 text-sm hover:bg-neutral-900">Cancel</button>
          <button
            type="submit"
            disabled={loading || !partyA || !partyB || partyA === partyB}
            className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Creating…' : 'Form relationship'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ActorSelect({ value, onChange, actors }: { value: string; onChange: (v: string) => void; actors: NodeOption[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      required
      className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded text-sm"
    >
      <option value="">— Select an actor —</option>
      {actors.map(a => (
        <option key={a.id} value={a.id}>
          {a.name} ({a.type})
        </option>
      ))}
    </select>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-300 mb-1 font-medium">{label}</div>
      {hint && <div className="text-xs text-neutral-500 mb-1">{hint}</div>}
      {children}
    </label>
  );
}
