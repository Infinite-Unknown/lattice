'use client';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Spinner from '../components/Spinner';

type Actor = {
  id: string;
  type: 'mentor' | 'company' | 'programme' | 'partner';
  name: string;
  profile: { bio?: string } & Record<string, unknown>;
  expertise: string[];
  capacity: { allocated_units: number; max_units: number };
  status: 'active' | 'archived';
};

export default function EditActorModal({
  open, actorId, onClose, onSaved,
}: {
  open: boolean;
  actorId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields — kept separate from `actor` so we can compare for dirty
  // state without re-deriving on every render.
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [maxUnits, setMaxUnits] = useState(0);

  useEffect(() => {
    if (!open || !actorId) return;
    setError(null);
    setActor(null);
    setLoading(true);
    fetch(`/api/actors/${actorId}`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error ?? `failed to load (${r.status})`);
        }
        const j = await r.json();
        const a: Actor = j.actor;
        setActor(a);
        setName(a.name);
        setBio(typeof a.profile?.bio === 'string' ? a.profile.bio : '');
        setExpertise(a.expertise.join(', '));
        setMaxUnits(a.capacity.max_units);
      })
      .catch(e => setError(e.message ?? 'failed to load'))
      .finally(() => setLoading(false));
  }, [open, actorId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/actors/${actor.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          bio,
          expertise: expertise.split(',').map(s => s.trim()).filter(Boolean),
          max_units: maxUnits,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `failed (${r.status})`);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={actor ? `Edit ${actor.type}` : 'Edit actor'}>
      {loading && (
        <div className="py-8 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Spinner /> Loading actor…
        </div>
      )}

      {!loading && error && !actor && (
        <div className="border border-accent bg-accent/10 p-4 font-mono text-xs uppercase tracking-widest text-accent">
          {error}
        </div>
      )}

      {!loading && actor && (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-px bg-border">
            <ReadOnlyCell label="Type">{actor.type}</ReadOnlyCell>
            <ReadOnlyCell label="ID">{actor.id}</ReadOnlyCell>
            <ReadOnlyCell label="Status">{actor.status}</ReadOnlyCell>
            <ReadOnlyCell label="Allocated">
              {actor.capacity.allocated_units} / {actor.capacity.max_units}
            </ReadOnlyCell>
          </div>

          <Field label="Name">
            <Input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Short bio / focus" hint="single sentence shown in agent context">
            <Input
              type="text"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder={actor.type === 'mentor' ? 'Ex-fintech VP, 12y operator' : ''}
            />
          </Field>

          <Field label="Expertise tags" hint="comma-separated">
            <Input
              type="text"
              value={expertise}
              onChange={e => setExpertise(e.target.value)}
              placeholder="fintech, fundraising, seed-stage"
              className="font-mono"
            />
          </Field>

          <Field
            label="Max capacity units"
            hint={`currently allocated · ${actor.capacity.allocated_units}`}
          >
            <Input
              type="number"
              value={String(maxUnits)}
              onChange={e => setMaxUnits(Number(e.target.value))}
              required
              min={actor.capacity.allocated_units}
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
              disabled={saving}
              className="group inline-flex items-center gap-2 font-semibold uppercase tracking-wider text-sm text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving && <Spinner />}
              <span className="relative">
                {saving ? 'Saving…' : 'Save changes →'}
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
      )}
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

function ReadOnlyCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className="font-mono text-sm text-foreground">
        {children}
      </div>
    </div>
  );
}
