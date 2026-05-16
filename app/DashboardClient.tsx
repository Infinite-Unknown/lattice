'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';

type Stats = {
  actors_total: number;
  actors_by_type: { mentor: number; company: number; programme: number; partner: number };
  relationships_active: number;
  relationships_total: number;
  pending_proposals: number;
  pending_steward_actions: number;
  outcomes_total: number;
  recent_outcomes: Array<{ id: string; timestamp: string; type: string; evidence_text: string; relationship_id: string }>;
  runtime?: { gemini_chat_model: string; gemini_embed_model: string };
};

export default function DashboardClient() {
  const { user, account } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const r = await fetch('/api/stats', { cache: 'no-store' });
      if (!r.ok) throw new Error(`stats endpoint returned ${r.status}`);
      setStats(await r.json());
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'failed to load stats');
    }
  }

  useEffect(() => { refresh(); }, []);

  const pending = (stats?.pending_steward_actions ?? 0) + (stats?.pending_proposals ?? 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Persona context bar */}
      <div className="mb-6 flex items-center gap-3 text-sm flex-wrap">
        {user ? (
          <div className={`px-3 py-1.5 rounded-full border font-medium ${
            user.role === 'root' ? 'bg-amber-900/30 border-amber-800/60 text-amber-300'
            : user.role === 'admin' ? 'bg-emerald-900/30 border-emerald-800/60 text-emerald-300'
            : user.role === 'approver' ? 'bg-blue-900/30 border-blue-800/60 text-blue-300'
            : 'bg-neutral-900 border-neutral-700 text-neutral-300'
          }`}>
            ◉ Signed in as: {user.name} · {user.role}{account ? ` @ ${account.name}` : ''}
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500">
            Loading identity…
          </div>
        )}
        <div className="text-neutral-500">
          {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        {stats?.runtime && (
          <div
            className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 font-mono"
            title={`Chat: ${stats.runtime.gemini_chat_model} · Embeddings: ${stats.runtime.gemini_embed_model}`}
          >
            ⚙ {stats.runtime.gemini_chat_model}
          </div>
        )}
        <button
          onClick={refresh}
          className="ml-auto px-3 py-1 rounded text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat
          label="Actors managed"
          value={stats?.actors_total}
          hint={stats ? `${stats.actors_by_type.mentor} mentors · ${stats.actors_by_type.company} companies · ${stats.actors_by_type.programme} programmes · ${stats.actors_by_type.partner} partners` : '—'}
        />
        <Stat
          label="Active relationships"
          value={stats?.relationships_active}
          hint="each one is an AI Steward"
        />
        <Stat
          label="Decisions awaiting you"
          value={pending}
          hint={pending > 0 ? 'review them in the Inbox' : 'all caught up'}
          accent={pending > 0 ? 'amber' : undefined}
        />
        <Stat
          label="Outcomes captured"
          value={stats?.outcomes_total}
          hint="memory for future matching"
        />
      </section>

      {error && (
        <div className="mb-8 p-3 rounded border border-rose-900 bg-rose-950/30 text-rose-300 text-sm">
          {error} — have you run <code className="px-1 py-0.5 rounded bg-neutral-900">npm run seed</code> yet?
        </div>
      )}

      {/* Recent activity */}
      <section className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-3 font-medium">
          Recent ecosystem activity
        </div>
        <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
          {!stats && <div className="p-4 text-neutral-500 text-sm">Loading…</div>}
          {stats && stats.recent_outcomes.length === 0 && (
            <div className="p-4 text-neutral-500 text-sm">No outcomes yet. Approve a Steward action in the Inbox to populate this feed.</div>
          )}
          {stats?.recent_outcomes.map(o => (
            <Link
              key={o.id}
              href={`/relationships/${o.relationship_id}`}
              className="block p-3 hover:bg-neutral-900/50 transition-colors"
            >
              <div className="flex items-center gap-3 text-xs text-neutral-500 mb-1">
                <span>{new Date(o.timestamp).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span className="text-emerald-400">{o.type}</span>
                <span className="text-neutral-600">· in relationship {o.relationship_id}</span>
              </div>
              <div className="text-sm">{o.evidence_text}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid md:grid-cols-3 gap-3">
        <ActionCard
          title="See your ecosystem"
          body="Force-directed graph. Every line is an autonomous Steward."
          href="/graph"
          color="emerald"
        />
        <ActionCard
          title={`Review ${pending} AI proposal${pending === 1 ? '' : 's'}`}
          body="Per-relationship Steward actions + Cartographer structural gaps awaiting your approval."
          href="/inbox"
          color="amber"
          badge={pending > 0 ? String(pending) : undefined}
        />
        <ActionCard
          title="Edit a relationship's policy"
          body="Open any relationship from the graph. Change its escalation rules. Watch the next Steward tick reflect it."
          href="/graph"
          color="blue"
        />
      </section>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: number | undefined; hint: string; accent?: 'amber' }) {
  return (
    <div className={`border ${accent === 'amber' ? 'border-amber-800/60 bg-amber-950/10' : 'border-neutral-800 bg-neutral-900/30'} rounded-lg p-4`}>
      <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`text-3xl font-semibold mt-1 mb-1 ${accent === 'amber' ? 'text-amber-300' : ''}`}>
        {value ?? '—'}
      </div>
      <div className="text-xs text-neutral-500">{hint}</div>
    </div>
  );
}

function ActionCard({
  title, body, href, color, badge,
}: { title: string; body: string; href: string; color: 'emerald' | 'amber' | 'blue'; badge?: string }) {
  const borderColor = color === 'emerald' ? 'border-emerald-800/60 hover:bg-emerald-950/20'
                    : color === 'amber'   ? 'border-amber-800/60 hover:bg-amber-950/20'
                    : 'border-blue-800/60 hover:bg-blue-950/20';
  const badgeColor = color === 'emerald' ? 'bg-emerald-700' : color === 'amber' ? 'bg-amber-700' : 'bg-blue-700';
  return (
    <Link href={href} className={`block border ${borderColor} rounded-lg p-4 transition-colors`}>
      <div className="flex items-center justify-between mb-1">
        <div className="font-semibold">{title}</div>
        {badge && <span className={`text-xs px-2 py-0.5 rounded-full text-white ${badgeColor}`}>{badge}</span>}
      </div>
      <div className="text-sm text-neutral-400 leading-relaxed">{body}</div>
    </Link>
  );
}
