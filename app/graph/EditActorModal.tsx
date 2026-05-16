'use client';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Spinner from '../components/Spinner';

type Entity = {
  id: string;
  type: 'mentor' | 'company' | 'programme' | 'partner';
  name: string;
  profile: { bio?: string } & Record<string, unknown>;
  expertise: string[];
  capacity: { allocated_units: number; max_units: number };
  status: 'active' | 'archived';
};

type DeletePreview = {
  willCloseCount: number;
  alreadyClosedCount: number;
  willClose: Array<{ id: string; type: string; state: string; other_party: string }>;
};

export default function EditActorModal({
  open, actorId, onClose, onSaved,
}: {
  open: boolean;
  actorId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete flow runs in two stages: previewing what cascade would close,
  // then actually deleting. `deletePreview === null` means we haven't asked
  // for the preview yet; once set, the form is replaced by the confirm.
  const [deletePreview, setDeletePreview] = useState<DeletePreview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [maxUnits, setMaxUnits] = useState(0);

  useEffect(() => {
    if (!open || !actorId) return;
    setError(null);
    setEntity(null);
    setDeletePreview(null);
    setLoading(true);
    fetch(`/api/actors/${actorId}`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error ?? `failed to load (${r.status})`);
        }
        const j = await r.json();
        const a: Entity = j.actor;
        setEntity(a);
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
    if (!entity) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/actors/${entity.id}`, {
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

  async function onClickDelete() {
    if (!entity) return;
    setError(null);
    setDeleting(true);
    try {
      // Dry-run: get the cascade preview so we can show the user exactly
      // what closes before they confirm.
      const r = await fetch(`/api/actors/${entity.id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `preview failed (${r.status})`);
      setDeletePreview({
        willCloseCount: j.willCloseCount,
        alreadyClosedCount: j.alreadyClosedCount,
        willClose: j.willClose,
      });
    } catch (e: any) {
      setError(e.message ?? 'delete preview failed');
    } finally {
      setDeleting(false);
    }
  }

  async function confirmDelete() {
    if (!entity) return;
    setError(null);
    setDeleting(true);
    try {
      const r = await fetch(`/api/actors/${entity.id}?confirm=true`, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `delete failed (${r.status})`);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'delete failed');
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={entity ? `Edit ${entity.type}` : 'Edit entity'}>
      {loading && (
        <div className="py-8 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Spinner /> Loading entity…
        </div>
      )}

      {!loading && error && !entity && (
        <div className="border border-accent bg-accent/10 p-4 font-mono text-xs uppercase tracking-widest text-accent">
          {error}
        </div>
      )}

      {/* Delete confirmation view — replaces the edit form once preview loads */}
      {!loading && entity && deletePreview && (
        <div className="space-y-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
              Confirm delete
            </div>
            <p className="font-sans text-base text-foreground leading-relaxed">
              Delete <span className="font-semibold">{entity.name}</span>{' '}
              ({entity.type})?
            </p>
          </div>

          {deletePreview.willCloseCount > 0 ? (
            <div className="border border-accent bg-accent/10 p-4 space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-accent">
                Cascade · {deletePreview.willCloseCount} relationship{deletePreview.willCloseCount === 1 ? '' : 's'} will close
              </div>
              <ul className="space-y-1.5">
                {deletePreview.willClose.slice(0, 8).map(r => (
                  <li key={r.id} className="font-mono text-xs text-foreground normal-case tracking-normal">
                    · {r.state} {r.type.replace(/_/g, ' ')} ↔ {r.other_party}
                  </li>
                ))}
                {deletePreview.willClose.length > 8 && (
                  <li className="font-mono text-xs text-muted-foreground normal-case tracking-normal">
                    · …and {deletePreview.willClose.length - 8} more
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <div className="border border-border bg-card p-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No active relationships to cascade-close
              {deletePreview.alreadyClosedCount > 0 && ` · ${deletePreview.alreadyClosedCount} already closed`}
            </div>
          )}

          <p className="font-mono text-xs text-muted-foreground/80 normal-case tracking-normal leading-relaxed">
            This is permanent. The {entity.type} doc and any cascade-closed
            relationships will retain audit history but stop appearing in
            the live graph.
          </p>

          {error && (
            <div className="border border-accent bg-accent/10 p-3 font-mono text-xs uppercase tracking-widest text-accent">
              {error}
            </div>
          )}

          <div className="flex items-center gap-8 pt-4 border-t border-border">
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="group inline-flex items-center gap-2 font-semibold uppercase tracking-wider text-sm text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting && <Spinner />}
              <span className="relative">
                {deleting ? 'Deleting…' : 'Delete permanently →'}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110 group-disabled:hidden"
                  style={{ transformOrigin: 'left center' }}
                />
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setDeletePreview(null); setError(null); }}
              disabled={deleting}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              ← Back to edit
            </button>
          </div>
        </div>
      )}

      {/* Standard edit form */}
      {!loading && entity && !deletePreview && (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-px bg-border">
            <ReadOnlyCell label="Type">{entity.type}</ReadOnlyCell>
            <ReadOnlyCell label="ID">{entity.id}</ReadOnlyCell>
            <ReadOnlyCell label="Status">{entity.status}</ReadOnlyCell>
            <ReadOnlyCell label="Allocated">
              {entity.capacity.allocated_units} / {entity.capacity.max_units}
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
              placeholder={entity.type === 'mentor' ? 'Ex-fintech VP, 12y operator' : ''}
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
            hint={`currently allocated · ${entity.capacity.allocated_units}`}
          >
            <Input
              type="number"
              value={String(maxUnits)}
              onChange={e => setMaxUnits(Number(e.target.value))}
              required
              min={entity.capacity.allocated_units}
            />
          </Field>

          {error && (
            <div className="border border-accent bg-accent/10 p-3 font-mono text-xs uppercase tracking-widest text-accent">
              {error}
            </div>
          )}

          <div className="flex items-center gap-8 pt-4 border-t border-border flex-wrap">
            <button
              type="submit"
              disabled={saving || deleting}
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
              disabled={deleting}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClickDelete}
              disabled={saving || deleting}
              className="ml-auto group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Delete this entity and cascade-close its relationships"
            >
              {deleting && <Spinner />}
              <span className="relative">
                Delete entity
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 right-0 h-px bg-accent scale-x-0 transition-transform duration-150 ease-crisp group-hover:scale-x-100"
                  style={{ transformOrigin: 'left center' }}
                />
              </span>
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
