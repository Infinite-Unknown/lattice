'use client';
import { useState } from 'react';
import Modal from '../components/Modal';

const TYPES = [
  { value: 'mentor', label: 'Mentor', hint: 'experienced operator (founder, exec, specialist)' },
  { value: 'company', label: 'Company', hint: 'founder / startup in your ecosystem' },
  { value: 'programme', label: 'Programme', hint: 'accelerator, cohort, or initiative' },
  { value: 'partner', label: 'Partner', hint: 'corporate, service provider, or network' },
] as const;

export default function AddActorModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<'mentor' | 'company' | 'programme' | 'partner'>('mentor');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [maxUnits, setMaxUnits] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setType('mentor'); setName(''); setBio(''); setExpertise(''); setMaxUnits(5); setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/actors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type,
          name,
          bio,
          expertise: expertise.split(',').map(s => s.trim()).filter(Boolean),
          max_units: maxUnits,
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

  const selectedTypeHint = TYPES.find(t => t.value === type)?.hint ?? '';

  return (
    <Modal open={open} onClose={onClose} title="Add actor to your ecosystem">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Type">
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded text-sm"
          >
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="text-xs text-neutral-500 mt-1">{selectedTypeHint}</div>
        </Field>

        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder={type === 'mentor' ? 'e.g. Aisha Rahman' : type === 'company' ? 'e.g. PayLane' : type === 'programme' ? 'e.g. Cradle Catalyst' : 'e.g. Maybank Ventures'}
            className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded text-sm"
          />
        </Field>

        <Field label="Short bio / focus" hint="optional — single sentence shown in agent context">
          <input
            type="text"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder={type === 'mentor' ? 'e.g. Ex-fintech VP, 12y operator' : ''}
            className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded text-sm"
          />
        </Field>

        <Field label="Expertise tags" hint="comma-separated — e.g. fintech, fundraising, seed-stage">
          <input
            type="text"
            value={expertise}
            onChange={e => setExpertise(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded text-sm font-mono"
          />
        </Field>

        <Field label="Max capacity units" hint="how many active relationships this actor can sustain">
          <input
            type="number"
            value={maxUnits}
            onChange={e => setMaxUnits(Number(e.target.value))}
            required
            min={0}
            className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded text-sm"
          />
        </Field>

        {error && (
          <div className="text-sm text-rose-300 border border-rose-900 bg-rose-950/30 rounded p-2">{error}</div>
        )}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-neutral-800 text-sm hover:bg-neutral-900">Cancel</button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Creating…' : 'Add actor'}
          </button>
        </div>
      </form>
    </Modal>
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
