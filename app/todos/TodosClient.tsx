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

const ACTION_ICON: Record<string, string> = {
  'propose-session': '🗓',
  'draft-checkin': '✉',
  'propose-intro': '🤝',
  'escalate': '⚠',
};

export default function TodosClient() {
  const { can, user } = useAuth();
  const canAct = can('approve.write');

  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'open' | 'done' | 'all'>('open');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Dispatch modal state
  const [dispatchTarget, setDispatchTarget] = useState<{ id: string; title: string; channel: DispatchChannel } | null>(null);

  // Toast for dispatch confirmation
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
          ? `Marked done: “${todo.title}”`
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2 font-medium">
          Todos · Follow-up work spawned by approved Steward actions
        </div>
        <h1 className="text-2xl font-semibold mb-1">Your action queue</h1>
        <p className="text-neutral-400 max-w-3xl">
          Every approved Steward action that needs real-world execution
          (schedule a session, send a check-in, make an intro, address an escalation)
          shows up here as a todo. Notify the parties via Email / Calendar / Slack —
          or just mark done once the work is complete.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-neutral-800">
        <Tab active={tab === 'open'} onClick={() => setTab('open')}>
          Open <Badge>{openCount}</Badge>
        </Tab>
        <Tab active={tab === 'done'} onClick={() => setTab('done')}>
          Done <Badge>{doneCount}</Badge>
        </Tab>
        <Tab active={tab === 'all'} onClick={() => setTab('all')}>
          All <Badge>{todos?.length ?? 0}</Badge>
        </Tab>
        <button
          onClick={refresh}
          className="ml-auto px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-100"
        >
          ↻ Refresh
        </button>
      </div>

      {toast && (
        <div className="mb-4 p-3 rounded border border-emerald-800/60 bg-emerald-950/30 text-sm text-emerald-200 animate-fade-in">
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded border border-rose-900 bg-rose-950/30 text-sm text-rose-300">{error}</div>
      )}

      <div className="space-y-3">
        {!todos && <SkeletonRows count={3} />}
        {todos && filtered?.length === 0 && (
          <div className="border border-neutral-800 rounded p-6 text-sm text-neutral-500 text-center">
            {tab === 'open'
              ? 'No open todos. Approve a Steward proposal on /inbox to spawn one.'
              : tab === 'done'
                ? 'Nothing completed yet.'
                : 'No todos in this account yet.'}
          </div>
        )}
        {filtered?.map(t => {
          const isDone = t.status === 'done';
          const doneBusy = busyId === `${t.id}:done`;
          return (
            <div
              key={t.id}
              className={`border rounded-lg p-4 ${
                isDone
                  ? 'border-neutral-900 bg-neutral-950/50 opacity-70'
                  : 'border-neutral-800 bg-neutral-900/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-400 mb-1">
                    <span className="text-base">{ACTION_ICON[t.action] ?? '•'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-[11px] font-medium">
                      {humaniseLabel(t.action)}
                    </span>
                    <span>·</span>
                    <Link href={`/relationships/${t.relationship_id}`} className="text-emerald-300 hover:underline">
                      {t.party_names.join(' ↔ ')}
                    </Link>
                    <span>·</span>
                    <span>{new Date(t.created_at).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {isDone && (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[11px]">
                        ✓ done by {t.completed_by_name} · {t.completed_at && new Date(t.completed_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className={`font-medium text-base ${isDone ? 'line-through text-neutral-400' : 'text-neutral-100'}`}>
                    {t.title}
                  </div>
                  <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{t.description}</p>
                  {t.dispatched_via && (
                    <div className="text-xs text-blue-300 mt-2">
                      ↗ Dispatched via <span className="font-medium">{humaniseLabel(t.dispatched_via)}</span>
                      {t.dispatched_by_name && <> by {t.dispatched_by_name}</>}
                      {t.dispatched_at && <> on {new Date(t.dispatched_at).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</>}
                    </div>
                  )}
                </div>

                {!isDone && (
                  <div className="flex gap-1.5 shrink-0">
                    <DispatchButton
                      channel="email"
                      onClick={() => setDispatchTarget({ id: t.id, title: t.title, channel: 'email' })}
                      disabled={!canAct}
                      role={user?.role}
                    />
                    <DispatchButton
                      channel="calendar"
                      onClick={() => setDispatchTarget({ id: t.id, title: t.title, channel: 'calendar' })}
                      disabled={!canAct}
                      role={user?.role}
                    />
                    <DispatchButton
                      channel="slack"
                      onClick={() => setDispatchTarget({ id: t.id, title: t.title, channel: 'slack' })}
                      disabled={!canAct}
                      role={user?.role}
                    />
                    <button
                      onClick={() => markDone(t.id)}
                      disabled={!canAct || !!busyId}
                      title={canAct ? 'Mark this todo done' : `Your role (${user?.role}) lacks approve.write`}
                      className="ml-1 px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                    >
                      {doneBusy && <Spinner />}
                      Mark done
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DispatchModal
        todoId={dispatchTarget?.id ?? null}
        channel={dispatchTarget?.channel ?? null}
        todoTitle={dispatchTarget?.title ?? ''}
        onClose={() => setDispatchTarget(null)}
        onDispatched={(channel, message) => {
          setToast(message);
          refresh();
        }}
      />
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm border-b-2 transition-colors flex items-center gap-2 ${
        active ? 'border-emerald-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">{children}</span>;
}

const DISPATCH_META: Record<DispatchChannel, { icon: string; label: string }> = {
  email:    { icon: '📧', label: 'Email' },
  calendar: { icon: '📅', label: 'Calendar' },
  slack:    { icon: '💬', label: 'Slack' },
};

function DispatchButton({ channel, onClick, disabled, role }: {
  channel: DispatchChannel; onClick: () => void; disabled: boolean; role?: string;
}) {
  const meta = DISPATCH_META[channel];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `Your role (${role ?? 'unknown'}) can't dispatch` : `Send via ${meta.label} (placeholder)`}
      className="px-2.5 py-1.5 rounded border border-neutral-700 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      aria-label={`Send via ${meta.label}`}
    >
      {meta.icon}
    </button>
  );
}
