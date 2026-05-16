'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../AuthContext';
import Spinner from '../components/Spinner';
import { SkeletonRows } from '../components/Skeleton';
import { humaniseLabel } from '@/lib/format';
import DispatchModal, { type DispatchChannel } from './DispatchModal';

type Todo = {
  id: string;
  relationship_id: string;
  steward_log_timestamp: string;
  action: string;
  title: string;
  description: string;
  party_names: string[];
  status: 'open' | 'done';
  created_at: string;
  created_by_name: string;
  completed_at?: string;
  completed_by_name?: string;
  dispatched_via?: DispatchChannel;
  dispatched_at?: string;
  dispatched_by_name?: string;
};

export default function TodosClient() {
  const { can, user } = useAuth();
  const canAct = can('approve.write');

  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'open' | 'done' | 'all'>('open');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [dispatchTarget, setDispatchTarget] = useState<{ id: string; title: string; channel: DispatchChannel } | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  async function refresh() {
    try {
      const r = await fetch('/api/todos', { cache: 'no-store' });
      if (!r.ok) throw new Error(`status ${r.status}`);
      const j = await r.json();
      setTodos(j.todos);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => { refresh(); }, []);

  async function markDone(id: string) {
    setBusyId(id + ':done');
    try {
      const todo = todos?.find(t => t.id === id);
      const res = await fetch(`/api/todos/${id}/complete`, { method: 'POST' });
      if (res.ok) {
        setToast(todo
          ? `Marked done: "${todo.title}"`
          : 'Marked done.');
      } else {
        const j = await res.json().catch(() => ({}));
        setToast(j.error ?? `Failed (${res.status})`);
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const filtered = todos?.filter(t =>
    tab === 'all' ? true : t.status === tab
  );
  const openCount = todos?.filter(t => t.status === 'open').length ?? 0;
  const doneCount = todos?.filter(t => t.status === 'done').length ?? 0;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 md:mb-12 pb-8 border-b border-border">
        <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
          Action queue / Approved Steward work
        </div>
        <h1 className="font-sans font-bold text-4xl md:text-6xl leading-none tracking-tighter mb-6">
          Your next<br /><span className="text-muted-foreground">actions.</span>
        </h1>
        <p className="font-sans text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Every approved Steward action that needs real-world execution
          shows up here. Notify the parties via Email · Calendar · Slack,
          or just mark done once the work is complete.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-4 border-b border-border">
        <div className="flex">
          <TabButton active={tab === 'open'} onClick={() => setTab('open')}>
            Open <span className="ml-2 text-foreground/70">/ {openCount}</span>
          </TabButton>
          <TabButton active={tab === 'done'} onClick={() => setTab('done')}>
            Done <span className="ml-2 text-foreground/70">/ {doneCount}</span>
          </TabButton>
          <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
            All <span className="ml-2 text-foreground/70">/ {todos?.length ?? 0}</span>
          </TabButton>
        </div>
        <button
          onClick={refresh}
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150 underline underline-offset-4 decoration-1"
        >
          ↻ Refresh
        </button>
      </div>

      {toast && (
        <div className="mb-6 p-4 border border-accent bg-accent/10 font-sans text-sm text-accent animate-fade-in">
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 border border-accent bg-accent/10 font-sans text-sm text-accent">{error}</div>
      )}

      {!todos && <SkeletonRows count={3} />}

      {todos && filtered?.length === 0 && (
        <div className="border border-border bg-card p-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {tab === 'open'
            ? "No open todos · approve a Steward proposal on /inbox to spawn one"
            : tab === 'done'
              ? "Nothing completed yet"
              : "No todos in this account yet"}
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="space-y-px bg-border">
          {filtered.map(t => {
            const isDone = t.status === 'done';
            const doneBusy = busyId === `${t.id}:done`;
            return (
              <div
                key={t.id}
                className={`p-6 md:p-8 ${isDone ? 'bg-card opacity-60' : 'bg-background'}`}
              >
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-4 flex-wrap font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                      <span className="text-accent">{humaniseLabel(t.action)}</span>
                      <Link href={`/relationships/${t.relationship_id}`} className="text-foreground hover:text-accent transition-colors duration-150 underline underline-offset-4 decoration-1">
                        {t.party_names.join(' ↔ ')}
                      </Link>
                      <span>{new Date(t.created_at).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {isDone && (
                        <span className="text-foreground">
                          ✓ done {t.completed_by_name && `by ${t.completed_by_name}`}
                        </span>
                      )}
                    </div>
                    <h3 className={`font-sans font-bold text-xl md:text-2xl leading-tight tracking-tight mb-3 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {t.title}
                    </h3>
                    <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-3xl">{t.description}</p>
                    {t.dispatched_via && (
                      <div className="mt-4 font-mono text-xs uppercase tracking-widest text-accent">
                        ↗ Dispatched via {humaniseLabel(t.dispatched_via)}
                        {t.dispatched_by_name && ` by ${t.dispatched_by_name}`}
                        {t.dispatched_at && ` on ${new Date(t.dispatched_at).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}`}
                      </div>
                    )}
                  </div>

                  {!isDone && (
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="flex items-center gap-3">
                        <DispatchLabel
                          label="Email"
                          onClick={() => setDispatchTarget({ id: t.id, title: t.title, channel: 'email' })}
                          disabled={!canAct}
                          role={user?.role}
                        />
                        <DispatchLabel
                          label="Calendar"
                          onClick={() => setDispatchTarget({ id: t.id, title: t.title, channel: 'calendar' })}
                          disabled={!canAct}
                          role={user?.role}
                        />
                        <DispatchLabel
                          label="Slack"
                          onClick={() => setDispatchTarget({ id: t.id, title: t.title, channel: 'slack' })}
                          disabled={!canAct}
                          role={user?.role}
                        />
                      </div>
                      <button
                        onClick={() => markDone(t.id)}
                        disabled={!canAct || !!busyId}
                        title={canAct ? 'Mark this todo done' : `Your role (${user?.role}) lacks approve.write`}
                        className="group inline-flex items-center gap-2 font-semibold uppercase tracking-wider text-xs text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {doneBusy && <Spinner />}
                        <span className="relative">
                          Mark done →
                          <span
                            aria-hidden="true"
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110"
                            style={{ transformOrigin: 'left center' }}
                          />
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DispatchModal
        todoId={dispatchTarget?.id ?? null}
        channel={dispatchTarget?.channel ?? null}
        todoTitle={dispatchTarget?.title ?? ''}
        onClose={() => setDispatchTarget(null)}
        onDispatched={(_channel, message) => {
          setToast(message);
          refresh();
        }}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 -mb-px font-mono text-xs uppercase tracking-widest transition-colors duration-150 border-b-2 ${
        active ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function DispatchLabel({
  label, onClick, disabled, role,
}: { label: string; onClick: () => void; disabled: boolean; role?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `Your role (${role ?? 'unknown'}) can't dispatch` : `Send via ${label} (placeholder)`}
      className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed underline underline-offset-4 decoration-1"
    >
      {label}
    </button>
  );
}
