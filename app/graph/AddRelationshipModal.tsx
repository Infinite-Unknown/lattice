'use client';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Spinner from '../components/Spinner';

const TYPES = [
  { value: 'mentorship', label: 'Mentorship (mentor ↔ founder)' },
  { value: 'company_in_programme', label: 'Company in programme' },
  { value: 'partner_in_initiative', label: 'Partner in initiative' },
  { value: 'service_engagement', label: 'Service engagement' },
] as const;

type NodeOption = { id: string; name: string; type: string };

const SELECT_CLASSES = 'block w-full h-12 px-4 text-base font-sans bg-input border border-border text-foreground focus:border-accent focus:outline-none transition-colors duration-150';

export default function AddRelationshipModal({
  open, onClose, onCreated, actors, prefilledPartyA,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  actors: NodeOption[];
  prefilledPartyA?: string;
}) {
  const [type, setType] = useState<'mentorship' | 'company_in_programme' | 'partner_in_initiative' | 'service_engagement'>('mentorship');
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [focus, setFocus] = useState('');
  const [cadence, setCadence] = useState('bi-weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && prefilledPartyA) setPartyA(prefilledPartyA);
  }, [open, prefilledPartyA]);

  function reset() {
    setType('mentorship');
    setPartyA(prefilledPartyA ?? '');
    setPartyB('');
    setFocus('');
    setCadence('bi-weekly');
    setError(null);
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

  const sortedActors = [...actors].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal open={open} onClose={onClose} title="Form a new relationship">
      <form onSubmit={onSubmit} className="space-y-6">
        <Field label="Relationship type">
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className={SELECT_CLASSES}
          >
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Party 01">
            <select
              value={partyA}
              onChange={e => setPartyA(e.target.value)}
              required
              className={SELECT_CLASSES}
            >
              <option value="">— Select —</option>
              {sortedActors.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </Field>
          <Field label="Party 02">
            <select
              value={partyB}
              onChange={e => setPartyB(e.target.value)}
              required
              className={SELECT_CLASSES}
            >
              <option value="">— Select —</option>
              {sortedActors.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Focus tags" hint="comma-separated · what is this relationship about?">
          <Input
            type="text"
            value={focus}
            onChange={e => setFocus(e.target.value)}
            placeholder="fintech, fundraising"
            className="font-mono"
          />
        </Field>

        <Field label="Cadence" hint="how often the parties should engage">
          <Input
            type="text"
            value={cadence}
            onChange={e => setCadence(e.target.value)}
            placeholder="bi-weekly | monthly | quarterly | as-needed"
          />
        </Field>

        <div className="border border-border bg-card p-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Default escalation + sunset policies applied · edit them on the new relationship's policy tab
        </div>

        {error && (
          <div className="border border-accent bg-accent/10 p-3 font-mono text-xs uppercase tracking-widest text-accent">
            {error}
          </div>
        )}

        <div className="flex items-center gap-8 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading || !partyA || !partyB || partyA === partyB}
            className="group inline-flex items-center gap-2 font-semibold uppercase tracking-wider text-sm text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />}
            <span className="relative">
              {loading ? 'Creating…' : 'Form relationship →'}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110 group-disabled:hidden"
                style={{ transformOrigin: 'left center' }}
              />
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      {hint && <div className="font-mono text-xs text-muted-foreground/60 normal-case tracking-normal mt-1">{hint}</div>}
      <div className="mt-3">{children}</div>
    </label>
  );
}
