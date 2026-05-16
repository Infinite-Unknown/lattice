'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { useCountUp } from './hooks/useCountUp';
import { SkeletonStats } from './components/Skeleton';

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

  const actorCount = useCountUp(stats?.actors_total ?? 0);
  const relCount = useCountUp(stats?.relationships_active ?? 0);
  const pendingCount = useCountUp(pending);
  const outcomesCount = useCountUp(stats?.outcomes_total ?? 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header — editorial */}
      <header className="mb-12 md:mb-16 flex items-end justify-between flex-wrap gap-6">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Dashboard / {account?.name ?? 'Lattice'}
          </div>
          <h1 className="font-sans font-bold text-4xl md:text-6xl lg:text-7xl leading-none tracking-tighter">
            {user ? <>Good to see you,<br /><span className="text-muted-foreground">{user.name}.</span></> : <>Your<br /><span className="text-muted-foreground">ecosystem.</span></>}
          </h1>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <span>{new Date().toLocaleDateString('en-MY', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          {stats?.runtime && (
            <span title={`Chat: ${stats.runtime.gemini_chat_model} · Embeddings: ${stats.runtime.gemini_embed_model}`}>
              · <span className="text-foreground">{stats.runtime.gemini_chat_model}</span>
            </span>
          )}
          <button
            onClick={refresh}
            className="text-muted-foreground hover:text-foreground transition-colors duration-150 underline underline-offset-4 decoration-1"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* Stat strip — poster numbers */}
      {stats ? (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mb-12 animate-fade-in">
          <StatCell label="Actors" value={actorCount} hint={`${stats.actors_by_type.mentor} mentors · ${stats.actors_by_type.company} companies · ${stats.actors_by_type.programme} programmes · ${stats.actors_by_type.partner} partners`} />
          <StatCell label="Active relationships" value={relCount} hint="each one is an AI Steward" />
          <StatCell label="Awaiting decision" value={pendingCount} hint={pending > 0 ? 'review them on the agents page' : 'all caught up'} accent={pending > 0} />
          <StatCell label="Outcomes captured" value={outcomesCount} hint="memory for future matching" />
        </section>
      ) : (
        <SkeletonStats className="mb-12" />
      )}

      {error && (
        <div className="mb-12 border border-accent bg-accent/10 p-4 font-mono text-xs uppercase tracking-widest text-accent">
          {error} — have you run npm run seed yet?
        </div>
      )}

      {/* Recent activity — editorial list */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between border-b border-border pb-4 mb-0">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Recent ecosystem activity
          </div>
          <Link href="/audit" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors duration-150">
            Full audit log →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {!stats && (
            <div className="py-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Loading…
            </div>
          )}
          {stats && stats.recent_outcomes.length === 0 && (
            <div className="py-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No outcomes yet · approve a Steward action to populate this feed
            </div>
          )}
          {stats?.recent_outcomes.map(o => (
            <Link
              key={o.id}
              href={`/relationships/${o.relationship_id}`}
              className="block py-5 group hover:bg-muted transition-colors duration-150 -mx-4 px-4"
            >
              <div className="flex items-center gap-5 font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                <span>{new Date(o.timestamp).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span className="text-accent">{o.type}</span>
                <span>in relationship {o.relationship_id}</span>
              </div>
              <div className="font-sans text-base md:text-lg leading-snug">{o.evidence_text}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions — editorial cards on bg-border gap */}
      <section className="mb-16">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6 border-b border-border pb-4">
          Where next
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border">
          <ActionCard n="01" title="See your ecosystem" body="Force-directed graph. Every line is an autonomous Steward." href="/graph" />
          <ActionCard
            n="02"
            title={pending > 0 ? `Review ${pending} proposal${pending === 1 ? '' : 's'}` : 'Agents queue is empty'}
            body="Per-relationship Steward actions and Cartographer structural gaps awaiting your approval."
            href="/agents"
            highlight={pending > 0}
            badge={pending > 0 ? String(pending) : undefined}
          />
          <ActionCard n="03" title="Edit a policy" body="Open any relationship from the graph. Change its escalation rules. Watch the next Steward tick reflect it." href="/graph" />
        </div>
      </section>
    </div>
  );
}

function StatCell({ label, value, hint, accent }: { label: string; value: number; hint: string; accent?: boolean }) {
  return (
    <div className={`p-6 md:p-8 ${accent ? 'bg-card' : 'bg-background'} relative`}>
      {accent && <span className="absolute top-0 left-0 w-12 h-1 bg-accent" />}
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
        {label}
      </div>
      <div className={`font-sans font-bold text-5xl md:text-7xl leading-none tracking-tighter mb-4 ${accent ? 'text-accent' : 'text-foreground'}`}>
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground leading-relaxed">
        {hint}
      </div>
    </div>
  );
}

function ActionCard({
  n, title, body, href, highlight, badge,
}: { n: string; title: string; body: string; href: string; highlight?: boolean; badge?: string }) {
  return (
    <Link
      href={href}
      className={`relative block p-6 md:p-8 ${highlight ? 'bg-card hover:bg-muted' : 'bg-background hover:bg-muted'} transition-colors duration-150 group`}
    >
      {highlight && <span className="absolute top-0 left-0 w-12 h-1 bg-accent" />}
      <div className="flex items-baseline justify-between mb-6">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {n}
        </div>
        {badge && (
          <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 bg-accent text-accent-foreground font-bold">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-sans font-bold text-xl md:text-2xl leading-tight tracking-tight mb-4 group-hover:text-accent transition-colors duration-150">
        {title} →
      </h3>
      <p className="font-sans text-sm md:text-base text-muted-foreground leading-relaxed">
        {body}
      </p>
    </Link>
  );
}
