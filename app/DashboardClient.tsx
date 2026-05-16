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

      {/* Anatomy of a Lattice Relationship */}
      <section className="mb-12">
        <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-3 font-medium">
          What is a Lattice relationship?
        </div>
        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/30">
          <p className="text-neutral-300 mb-5 max-w-3xl leading-relaxed">
            Today, a mentor-founder pairing is a row in a spreadsheet. In Lattice, it&apos;s a{' '}
            <span className="text-emerald-300 font-medium">first-class entity</span> with its own
            schema, its own AI agent, its own memory, and its own governance — defined, automated,
            governed, and reused across programmes.
          </p>

          {/* Visual anatomy */}
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-6">
            {/* Left party */}
            <PartyCard color="#34d399" type="Mentor" name="Aisha Rahman" sub="fintech · fundraising · seed" />
            {/* Edge label */}
            <div className="text-center">
              <div className="px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-700/60 text-emerald-300 text-xs whitespace-nowrap inline-block">
                ⟶ mentorship ⟵
              </div>
              <div className="text-xs text-neutral-500 mt-1">bi-weekly · seed-stage</div>
            </div>
            {/* Right party */}
            <PartyCard color="#60a5fa" type="Company" name="PayLane" sub="seed · B2B payments" />
          </div>

          {/* The relationship's first-class attributes */}
          <div className="grid md:grid-cols-2 gap-4">
            <AnatomyBlock
              label="Schema"
              accent="emerald"
              body={
                <div className="space-y-1 text-sm">
                  <KV k="type" v="mentorship" />
                  <KV k="state" v="active" accent="emerald" />
                  <KV k="focus" v="['fintech', 'fundraising']" />
                  <KV k="cadence" v="bi-weekly" />
                </div>
              }
              hint="A typed, queryable record — not free text."
            />

            <AnatomyBlock
              label="Steward (AI agent)"
              accent="emerald"
              body={
                <div className="text-sm text-neutral-300 space-y-1.5">
                  <div>↻ reads recent outcomes + retrieves similar past ones via embeddings</div>
                  <div>↻ reasons with Gemini, picks one action from a 7-action whitelist</div>
                  <div>↻ cites every claim (outcome:id, profile:actor.field)</div>
                  <div>↻ surfaces a proposal — never executes without your nod</div>
                </div>
              }
              hint="Per-relationship AI that runs autonomously."
            />

            <AnatomyBlock
              label="Policy (programmable)"
              accent="amber"
              body={
                <pre className="text-xs text-neutral-300 bg-neutral-950 rounded p-2 overflow-x-auto whitespace-pre-wrap">{`escalation:
  triggers:
    - if: nps_below
      value: 7
      action: notify_admin

sunset:
  triggers:
    - if: outcome_logged
      value: closing_note
      action: close`}</pre>
              }
              hint="Edit the YAML, save, and the next Steward tick obeys the new rule."
            />

            <AnatomyBlock
              label="Outcomes (memory)"
              accent="emerald"
              body={
                <div className="space-y-1.5 text-xs">
                  <OutcomeRow type="session_held" text="Series A deck review" age="2 mo ago" />
                  <OutcomeRow type="intro_made" text="Intro to Maybank Ventures" age="3.5 mo ago" />
                  <OutcomeRow type="milestone" text="Closed $800k pre-seed" age="4 mo ago" verified />
                </div>
              }
              hint="Every approval becomes citable evidence for the next tick."
            />
          </div>
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

function PartyCard({ color, type, name, sub }: { color: string; type: string; name: string; sub: string }) {
  return (
    <div className="border border-neutral-800 rounded-lg p-3 bg-neutral-900/50 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 mb-1">
        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
        {type}
      </div>
      <div className="font-medium text-neutral-100">{name}</div>
      <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>
    </div>
  );
}

function AnatomyBlock({ label, accent, body, hint }: { label: string; accent: 'emerald' | 'amber'; body: React.ReactNode; hint: string }) {
  const labelColor = accent === 'emerald' ? 'text-emerald-400' : 'text-amber-400';
  return (
    <div className="border border-neutral-800 rounded-lg p-3 bg-neutral-950/40">
      <div className={`text-xs uppercase tracking-wider ${labelColor} mb-2 font-medium`}>{label}</div>
      <div className="mb-2">{body}</div>
      <div className="text-xs text-neutral-500 italic">{hint}</div>
    </div>
  );
}

function KV({ k, v, accent }: { k: string; v: string; accent?: 'emerald' }) {
  return (
    <div className="flex gap-2">
      <span className="text-neutral-500">{k}:</span>
      <span className={accent === 'emerald' ? 'text-emerald-400' : 'text-neutral-200'}>{v}</span>
    </div>
  );
}

function OutcomeRow({ type, text, age, verified }: { type: string; text: string; age: string; verified?: boolean }) {
  return (
    <div className="border-l-2 border-emerald-800/60 pl-2">
      <div className="flex items-center gap-2 text-neutral-500">
        <span className="text-emerald-400">{type}</span>
        <span>·</span>
        <span>{age}</span>
        {verified && <span className="text-amber-400">✓ verified</span>}
      </div>
      <div className="text-neutral-300">{text}</div>
    </div>
  );
}
