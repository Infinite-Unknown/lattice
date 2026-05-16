'use client';
import Link from 'next/link';
import { useAuth } from './AuthContext';

export default function LandingClient() {
  const { user, account, loading } = useAuth();
  const isSignedIn = !!user;

  return (
    <div>
      {/* Own minimal header — AppShell skips its nav for this route */}
      <header className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg flex items-center gap-2">
            <span className="text-amber-400">◉</span> Lattice
          </Link>
          <div className="flex items-center gap-3">
            {!loading && (
              isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-sm font-medium"
                >
                  Go to dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="text-sm text-neutral-300 hover:text-white">
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-4 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-sm font-medium"
                  >
                    Get started
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="mb-20">
          <div className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-4 font-medium">
            Lattice · Autonomous Ecosystem Operations OS
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold leading-tight mb-6">
            Relationships that run themselves.
            <br />
            <span className="text-neutral-500">An ecosystem that completes itself.</span>
          </h1>
          <p className="text-neutral-300 max-w-3xl text-lg leading-relaxed mb-8">
            Lattice is built for <span className="text-white font-medium">programme owners and ecosystem
            administrators</span> at accelerators, corporate venture arms, and agencies like Cradle.
            We turn every linkage in your ecosystem — mentor ↔ founder, company ↔ programme,
            partner ↔ initiative — into a <span className="text-emerald-400">first-class AI agent</span>
            {' '}that proposes its own next action. You stop coordinating. You start governing.
          </p>
          {!loading && (
            <div className="flex gap-3">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded bg-emerald-700 hover:bg-emerald-600 text-sm font-medium"
                >
                  Open your dashboard{account ? ` · ${account.name}` : ''}
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="px-5 py-2.5 rounded bg-amber-700 hover:bg-amber-600 text-sm font-medium"
                  >
                    Get started — bootstrap your account
                  </Link>
                  <Link
                    href="/sign-in"
                    className="px-5 py-2.5 rounded border border-neutral-700 hover:bg-neutral-900 text-sm font-medium"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          )}
        </section>

        {/* Why this matters → How Lattice answers */}
        <section className="mb-20">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4 font-medium">
            The Cradle problem · How Lattice solves each piece
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Pain
              problem="Complex Actor Networks"
              problemBody="Innovation ecosystems span companies, mentors, partners, and service providers across programmes and regions."
              solution="Live ecosystem graph"
              solutionBody="Every actor, every linkage, in one force-directed view. Click any edge to see its full memory and policy."
              color="emerald"
            />
            <Pain
              problem="Everything Is Manual Today"
              problemBody="Admins verify participants, match mentors, assign cohorts, and track engagement — every time, from scratch."
              solution="Autonomous Stewards"
              solutionBody="Each relationship has its own AI agent that proposes the next session, intro, or escalation — grounded in past outcomes and citation-validated. You approve or edit."
              color="amber"
            />
            <Pain
              problem="Growth Amplifies the Pain"
              problemBody="At scale, manual coordination breaks. Programmes can't share signal across cohorts or borders. Gaps go unnoticed."
              solution="Cartographer meta-agent"
              solutionBody="Scans the whole graph for structural gaps — over-allocated mentors, dormant partners, missing expertise — and proposes new linkages to fill them."
              color="amber"
            />
            <Pain
              problem="Lost Intelligence"
              problemBody="Past engagements never inform future matching. Each cohort restarts from zero. Insight evaporates between programmes."
              solution="Outcome-grounded reasoning"
              solutionBody="Every approved action becomes a citable outcome. The next Steward tick retrieves the most-relevant past outcomes via embeddings — the ecosystem learns from itself."
              color="emerald"
            />
          </div>
        </section>

        {/* Anatomy of a Lattice Relationship */}
        <section className="mb-20">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4 font-medium">
            What is a Lattice relationship?
          </div>
          <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/30">
            <p className="text-neutral-300 mb-5 max-w-3xl leading-relaxed">
              Today, a mentor-founder pairing is a row in a spreadsheet. In Lattice, it&apos;s a{' '}
              <span className="text-emerald-300 font-medium">first-class entity</span> with its own
              schema, its own AI agent, its own memory, and its own governance — defined, automated,
              governed, and reused across programmes.
            </p>

            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-6">
              <PartyCard color="#34d399" type="Party A" name="<actor>" sub="any type · profile · expertise tags · capacity" />
              <div className="text-center">
                <div className="px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-700/60 text-emerald-300 text-xs whitespace-nowrap inline-block">
                  ⟶ relationship ⟵
                </div>
                <div className="text-xs text-neutral-500 mt-1">cadence · focus tags</div>
              </div>
              <PartyCard color="#60a5fa" type="Party B" name="<actor>" sub="any type · profile · expertise tags · capacity" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <AnatomyBlock
                label="Schema"
                accent="emerald"
                body={
                  <div className="space-y-1 text-sm font-mono">
                    <KV k="type" v="mentorship | company_in_programme | partner_in_initiative | service_engagement" />
                    <KV k="state" v="active | escalated | tapered | closed" />
                    <KV k="focus" v="string[]" />
                    <KV k="cadence" v="string" />
                  </div>
                }
                hint="A typed, queryable record. Same shape across every account, every programme."
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
    - if: <metric>
      value: <threshold>
      action: <admin_signal>

sunset:
  triggers:
    - if: <event>
      value: <match>
      action: close | review`}</pre>
                }
                hint="Edit the YAML, save, and the next Steward tick obeys the new rule."
              />

              <AnatomyBlock
                label="Outcomes (memory)"
                accent="emerald"
                body={
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="text-neutral-300">
                      <span className="text-emerald-400">session_held</span>
                      <span className="text-neutral-500"> | </span>
                      <span className="text-emerald-400">intro_made</span>
                      <span className="text-neutral-500"> | </span>
                      <span className="text-emerald-400">milestone</span>
                    </div>
                    <div className="text-neutral-300">
                      <span className="text-emerald-400">issue</span>
                      <span className="text-neutral-500"> | </span>
                      <span className="text-emerald-400">closing_note</span>
                    </div>
                    <div className="text-neutral-500 text-[10px] pt-1">
                      each outcome: { '{ id, type, evidence_text, source, verified, timestamp }' }
                    </div>
                  </div>
                }
                hint="Every approval becomes citable evidence for the next tick."
              />
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mb-12 text-center">
          {!loading && (isSignedIn ? (
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 rounded bg-emerald-700 hover:bg-emerald-600 text-sm font-medium"
            >
              Go to your dashboard →
            </Link>
          ) : (
            <Link
              href="/sign-up"
              className="inline-block px-6 py-3 rounded bg-amber-700 hover:bg-amber-600 text-sm font-medium"
            >
              Bootstrap your Lattice account →
            </Link>
          ))}
        </section>

        {/* Footer */}
        <footer className="text-xs text-neutral-600 pt-6 border-t border-neutral-900">
          Built for Build with AI 2026 KL — MyHack · Cradle problem statement:
          <em> Automating Ecosystem Linkages Instead of Manual Coordination</em>.
          Powered by Gemini 3.1, Vertex AI embeddings, Firestore, Firebase Auth, and Cloud Run.
        </footer>
      </div>
    </div>
  );
}

function Pain({
  problem, problemBody, solution, solutionBody, color,
}: {
  problem: string; problemBody: string; solution: string; solutionBody: string;
  color: 'emerald' | 'amber';
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
        <div className="text-sm text-neutral-400 leading-relaxed">{solutionBody}</div>
      </div>
    </div>
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
