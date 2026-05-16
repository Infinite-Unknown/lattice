'use client';
import { useState } from 'react';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Spinner from '../components/Spinner';

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
    <Modal open={open} onClose={onClose} title="Add actor">
      <form onSubmit={onSubmit} className="space-y-6">
        <Field label="Type" hint={selectedTypeHint}>
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="block w-full h-12 px-4 text-base font-sans bg-input border border-border text-foreground focus:border-accent focus:outline-none transition-colors duration-150"
          >
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>

        <Field label="Name">
          <Input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder={type === 'mentor' ? 'Aisha Rahman' : type === 'company' ? 'PayLane' : type === 'programme' ? 'Cradle Catalyst' : 'Maybank Ventures'}
          />
        </Field>

        <Field label="Short bio / focus" hint="single sentence shown in agent context">
          <Input
            type="text"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder={type === 'mentor' ? 'Ex-fintech VP, 12y operator' : ''}
          />
        </Field>

        <Field label="Expertise tags" hint="comma-separated — fintech, fundraising, seed-stage">
          <Input
            type="text"
            value={expertise}
            onChange={e => setExpertise(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="font-mono"
          />
        </Field>

        <Field label="Max capacity units" hint="how many active relationships this actor can sustain">
          <Input
            type="number"
            value={String(maxUnits)}
            onChange={e => setMaxUnits(Number(e.target.value))}
            required
            min={0}
          />
        </Field>

        {error && (
          <div className="border border-accent bg-accent/10 p-3 font-mono text-xs uppercase tracking-widest text-accent">
            {error}
          </div>
        )}

        <div className="flex items-center gap-8 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="group inline-flex items-center gap-2 font-semibold uppercase tracking-wider text-sm text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />}
            <span className="relative">
              {loading ? 'Creating…' : 'Add actor →'}
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
