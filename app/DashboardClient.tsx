'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Stats = {
  actors_total: number;
  actors_by_type: { mentor: number; company: number; programme: number; partner: number };
  relationships_active: number;
  relationships_total: number;
  pending_proposals: number;
  pending_steward_actions: number;
  outcomes_total: number;
  recent_outcomes: Array<{ id: string; timestamp: string; type: string; evidence_text: string; relationship_id: string }>;
};

export default function DashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const r = await fetch('/api/stats', { cache: 'no-store' });
      if (!r.ok) throw new Error(`stats endpoint returned ${r.status}`);
      setStats(await r.json());
    } catch (e: any) {
      setError(e.message ?? 'failed to load stats');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const pending = (stats?.pending_steward_actions ?? 0) + (stats?.pending_proposals ?? 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <header className="mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-3 font-medium">
          Lattice · Autonomous Ecosystem Operations OS
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-4">
          Relationships that run themselves.
          <br />
          <span className="text-neutral-500">An ecosystem that completes itself.</span>
        </h1>
        <p className="text-neutral-300 max-w-3xl text-lg leading-relaxed">
          Lattice is built for <span className="text-white font-medium">programme owners and ecosystem
          administrators</span> at accelerators, corporate venture arms, and agencies like Cradle.
          We turn every linkage in your ecosystem — mentor ↔ founder, company ↔ programme,
          partner ↔ initiative — into a <span className="text-emerald-400">first-class AI agent</span>
          {' '}that proposes its own next action. You stop coordinating. You start governing.
        </p>
      </header>

      {/* Persona context bar */}
      <div className="mb-10 flex items-center gap-3 text-sm flex-wrap">
        <div className="px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-800/60 text-emerald-300 font-medium">
          ◉ Signed in as: Programme Admin · Cradle Catalyst
        </div>
        <div className="text-neutral-500">
          {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <button
          onClick={refresh}
          className="ml-auto px-3 py-1 rounded text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
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

      {/* Why this matters → How Lattice answers */}
      <section className="mb-12">
        <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4 font-medium">
          The Cradle problem · How Lattice solves each piece
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Pain
            problem="Complex Actor Networks"
            problemBody="Innovation ecosystems span companies, mentors, partners, and service providers across programmes and regions."
            solution="Live ecosystem graph"
            solutionBody="Every actor, every linkage, in one force-directed view. Click any edge to see its full memory and policy."
            cta="Open graph"
            href="/graph"
            color="emerald"
          />
          <Pain
            problem="Everything Is Manual Today"
            problemBody="Admins verify participants, match mentors, assign cohorts, and track engagement — every time, from scratch."
            solution="Autonomous Stewards"
            solutionBody="Each relationship has its own AI agent that proposes the next session, intro, or escalation — grounded in past outcomes and citation-validated. You approve or edit."
            cta="See inbox"
            href="/inbox"
            color="amber"
          />
          <Pain
            problem="Growth Amplifies the Pain"
            problemBody="At scale, manual coordination breaks. Programmes can't share signal across cohorts or borders. Gaps go unnoticed."
            solution="Cartographer meta-agent"
            solutionBody="Scans the whole graph for structural gaps — over-allocated mentors, dormant partners, missing expertise — and proposes new linkages to fill them."
            cta="Run a scan"
            href="/inbox"
            color="amber"
          />
          <Pain
            problem="Lost Intelligence"
            problemBody="Past engagements never inform future matching. Each cohort restarts from zero. Insight evaporates between programmes."
            solution="Outcome-grounded reasoning"
            solutionBody="Every approved action becomes a citable outcome. The next Steward tick retrieves the most-relevant past outcomes via embeddings — the ecosystem learns from itself."
            cta="See recent outcomes"
            href="/graph"
            color="emerald"
          />
        </div>
      </section>

      {/* Recent activity */}
      <section className="mb-12">
        <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-3 font-medium">
          Recent ecosystem activity
        </div>
        <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
          {!stats && <div className="p-4 text-neutral-500 text-sm">Loading…</div>}
          {stats && stats.recent_outcomes.length === 0 && (
            <div className="p-4 text-neutral-500 text-sm">No outcomes yet. Run the seed and approve a Steward action to populate this feed.</div>
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
      <section className="grid md:grid-cols-3 gap-3 mb-16">
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

      {/* Footer / attribution */}
      <footer className="text-xs text-neutral-600 pt-6 border-t border-neutral-900">
        Built for Build with AI 2026 KL — MyHack · Cradle problem statement:
        <em> Automating Ecosystem Linkages Instead of Manual Coordination</em>.
        Powered by Gemini 3.1, Vertex AI embeddings, Firestore, and Cloud Run.
      </footer>
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

function Pain({
  problem, problemBody, solution, solutionBody, cta, href, color,
}: {
  problem: string; problemBody: string; solution: string; solutionBody: string;
  cta: string; href: string; color: 'emerald' | 'amber';
}) {
  const accent = color === 'emerald' ? 'text-emerald-400' : 'text-amber-400';
  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <div className="p-4 bg-rose-950/10 border-b border-neutral-800">
        <div className="text-xs uppercase tracking-wider text-rose-400 mb-1 font-medium">The pain</div>
        <div className="font-semibold mb-1">{problem}</div>
        <div className="text-sm text-neutral-400 leading-relaxed">{problemBody}</div>
      </div>
      <div className="p-4">
        <div className={`text-xs uppercase tracking-wider ${accent} mb-1 font-medium`}>Lattice answers with</div>
        <div className="font-semibold mb-1">{solution}</div>
        <div className="text-sm text-neutral-400 leading-relaxed mb-3">{solutionBody}</div>
        <Link href={href} className={`text-sm ${accent} hover:underline`}>{cta} →</Link>
      </div>
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
