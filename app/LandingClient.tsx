'use client';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { useReveal } from './hooks/useReveal';
import Button from './components/Button';

export default function LandingClient() {
  const { user, account, loading } = useAuth();
  const isSignedIn = !!user;

  const principleRef = useReveal<HTMLElement>();
  const anatomyRef = useReveal<HTMLElement>();
  const proofRef = useReveal<HTMLElement>();
  const pricingRef = useReveal<HTMLElement>();
  const ctaRef = useReveal<HTMLElement>();

  return (
    <div className="bg-background text-foreground">
      {/* Top bar — sharp, mono, minimal */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-5 flex items-center justify-between">
          <Link href="/" className="font-sans font-bold text-xl tracking-tight transition-colors hover:text-accent">
            LATTICE
          </Link>
          <nav className="flex items-center gap-8 text-xs font-mono uppercase tracking-widest">
            <Link href="/#what" className="hidden md:inline text-muted-foreground hover:text-foreground transition-colors duration-150">
              The product
            </Link>
            <Link href="/#how" className="hidden md:inline text-muted-foreground hover:text-foreground transition-colors duration-150">
              How it works
            </Link>
            <Link href="/#pricing" className="hidden md:inline text-muted-foreground hover:text-foreground transition-colors duration-150">
              Pricing
            </Link>
            {!loading && (
              isSignedIn ? (
                <Button as="link" href="/dashboard" variant="primary" size="sm">
                  Open dashboard →
                </Button>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                  >
                    Sign in
                  </Link>
                  <Button as="link" href="/sign-up" variant="primary" size="sm">
                    Get started
                  </Button>
                </>
              )
            )}
          </nav>
        </div>
      </header>

      {/* Hero — poster treatment */}
      <section className="relative border-b border-border overflow-hidden">
        {/* Decorative oversized number behind hero */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute -top-12 -right-16 lg:-right-24 select-none pointer-events-none font-display font-black text-[18rem] lg:text-[24rem] leading-none text-muted opacity-40"
        >
          01
        </div>

        {/* Ambient gradient drift behind hero */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-60 pointer-events-none animate-gradient-drift"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,61,0,0.08), transparent 60%)',
            backgroundSize: '200% 200%',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-24 md:py-32 lg:py-40">
          <div
            className="font-mono text-xs uppercase tracking-widest text-accent mb-8 animate-fade-in-up"
            style={{ animationDelay: '0ms' }}
          >
            Autonomous Ecosystem Operations
          </div>

          <h1
            className="font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-none tracking-tighter mb-10 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            Relationships
            <br />
            <span className="text-muted-foreground">that run</span>
            <br />
            <span className="text-accent">themselves.</span>
          </h1>

          <p
            className="font-sans text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            Every linkage in your ecosystem becomes a first-class AI agent that
            proposes its own next action. Stop coordinating. Start governing.
          </p>

          {!loading && (
            <div
              className="flex flex-wrap items-center gap-6 md:gap-10 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              {isSignedIn ? (
                <Button as="link" href="/dashboard" variant="primary" size="lg">
                  Open your dashboard →
                </Button>
              ) : (
                <>
                  <Button as="link" href="/sign-up" variant="primary" size="lg">
                    Bootstrap your account →
                  </Button>
                  <Button as="link" href="/sign-in" variant="ghost" size="md">
                    Sign in →
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Stat strip — editorial / poster numbers */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
            <Stat number="4" label="Relationship types" />
            <Stat number="7" label="Steward actions" />
            <Stat number="5" label="Gap classes" accent />
            <Stat number="0" label="Manual coordination" />
          </div>
        </div>
      </section>

      {/* The principle (pull quote) */}
      <section ref={principleRef} className="border-b border-border reveal-on-scroll">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-3">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Principle
              </div>
              <span className="block w-16 h-1 bg-accent" />
            </div>
            <blockquote className="lg:col-span-9">
              <p className="font-display text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight text-foreground">
                <span className="text-accent">"</span>
                A mentor-founder pairing isn't a row in a spreadsheet. It's a
                first-class entity with its own schema, its own AI agent, its
                own memory, and its own governance.
                <span className="text-accent">"</span>
              </p>
              <footer className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-8">
                — The Lattice thesis
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* What — the Cradle problems, restated as bold typographic posters */}
      <section id="what" ref={anatomyRef} className="border-b border-border reveal-on-scroll">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="mb-16 md:mb-24">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
              The Cradle problem
            </div>
            <h2 className="font-sans font-bold text-4xl md:text-6xl lg:text-7xl leading-none tracking-tighter">
              Manual coordination
              <br />
              <span className="text-muted-foreground">does not scale.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border">
            <ProblemBlock
              n="01"
              problem="Complex Actor Networks"
              answer="Live ecosystem graph"
              body="Every actor, every linkage, in one force-directed view. Click any edge to see its full memory and policy."
            />
            <ProblemBlock
              n="02"
              problem="Everything Is Manual"
              answer="Autonomous Stewards"
              body="Each relationship has its own AI agent that proposes the next session, intro, or escalation — grounded in past outcomes."
              highlight
            />
            <ProblemBlock
              n="03"
              problem="Growth Amplifies Pain"
              answer="Cartographer meta-agent"
              body="Scans the whole graph for structural gaps — over-allocated mentors, dormant partners, missing expertise — and proposes new linkages."
            />
            <ProblemBlock
              n="04"
              problem="Lost Intelligence"
              answer="Outcome-grounded reasoning"
              body="Every approved action becomes a citable outcome. The next Steward tick retrieves the most-relevant past outcomes via embeddings."
            />
          </div>
        </div>
      </section>

      {/* How — three-step process */}
      <section id="how" ref={proofRef} className="border-b border-border reveal-on-scroll">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="mb-16 md:mb-24">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
              How it works
            </div>
            <h2 className="font-sans font-bold text-4xl md:text-6xl lg:text-7xl leading-none tracking-tighter">
              Three loops.
              <br />
              <span className="text-muted-foreground">One ecosystem.</span>
            </h2>
          </div>

          <div className="space-y-px bg-border">
            <Step
              n="01"
              title="Steward proposes"
              body="Per-relationship AI reads recent outcomes, retrieves similar past ones via embeddings, picks one action from a 7-action whitelist, cites every claim."
            />
            <Step
              n="02"
              title="Cartographer detects"
              body="Graph-wide meta-agent finds structural gaps — overloaded mentors, dormant partners, missing expertise — and proposes new linkages with focus and cadence pre-committed."
            />
            <Step
              n="03"
              title="You approve"
              body="One click materialises the relationship. Audit log captures the decision. The ecosystem updates. The next tick learns from it."
            />
          </div>
        </div>
      </section>

      {/* Pricing — per-relationship SaaS model */}
      <section id="pricing" ref={pricingRef} className="border-b border-border reveal-on-scroll">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="mb-16 md:mb-20">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Pricing
            </div>
            <h2 className="font-sans font-bold text-4xl md:text-6xl lg:text-7xl leading-none tracking-tighter mb-10">
              Pay per<br /><span className="text-accent">relationship.</span>
            </h2>
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
              <p className="lg:col-span-7 font-sans text-base md:text-lg text-muted-foreground leading-relaxed">
                Billed monthly. Cost scales with the number of active
                relationships you actually run — not seats, not users.
                Add or remove a relationship, your next invoice reflects it.
                Unlimited admin seats at every paid tier.
              </p>
              <div className="lg:col-span-5 lg:text-right font-mono text-xs uppercase tracking-widest text-muted-foreground self-end">
                Billed monthly · no annual lock-in<br />cancel any time
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            <PricingTier
              name="Pilot"
              tagline="For one programme, one cohort"
              price="Free"
              priceSuffix="for 14 days · no card"
              priceFloor="Auto-pauses after the trial · upgrade any time"
              ctaLabel="Start free →"
              ctaHref={isSignedIn ? '/dashboard' : '/sign-up'}
              features={[
                'Up to 10 active relationships',
                'All Steward + Cartographer features',
                '1 admin seat',
                'Community support',
                'Audit log retained 30 days',
              ]}
            />
            <PricingTier
              name="Operator"
              tagline="For accelerators and corporate VCs"
              price="From $99"
              priceSuffix="per month · billed monthly"
              priceFloor="Includes 20 active relationships · then $5/mo each"
              ctaLabel="Start 14-day trial →"
              ctaHref="/sign-up"
              featured
              features={[
                'Unlimited active relationships',
                'Unlimited admin + IAM seats',
                'Email support · 24h SLA',
                'Audit log retained 7 years',
                'CSV + API export',
                'Custom escalation policies',
              ]}
            />
            <PricingTier
              name="Network"
              tagline="For multi-operator ecosystems"
              price="Custom"
              priceSuffix="annual contracts · talk to us"
              priceFloor="Starts at $999/mo · volume pricing above"
              ctaLabel="Contact sales →"
              ctaHref="mailto:hello@lattice.run"
              features={[
                'Everything in Operator',
                'BorderBridge cross-instance portability',
                'Verifiable Credentials for outcomes',
                'Multi-tenant isolation',
                'Dedicated success manager',
                'White-label option',
                'SSO + SCIM',
              ]}
            />
          </div>

          {/* Unit economics — what it costs us to run, not what you pay */}
          <div className="mt-16 pt-12 border-t border-border">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-8">
              Our cost to run · not your bill
            </div>
            <div className="grid md:grid-cols-3 gap-10 md:gap-6">
              <UnitEconomic
                n="01"
                label="Per-Steward COGS"
                value="≈ $0.001"
                hint="one Gemini call per heartbeat"
              />
              <UnitEconomic
                n="02"
                label="200-relationship ecosystem"
                value="≈ $6/mo"
                hint="daily heartbeats · LLM cost only"
              />
              <UnitEconomic
                n="03"
                label="Gross margin"
                value="≥ 95%"
                hint="Gemini + Firestore + Cloud Run · free-tier capable at small scale"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA — inverted (white on near-white) for maximum contrast */}
      <section ref={ctaRef} className="bg-foreground text-background reveal-on-scroll">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-24 md:py-40">
          <h2 className="font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-none tracking-tighter mb-12 max-w-3xl">
            Stop coordinating.
            <br />
            <span className="text-accent">Start governing.</span>
          </h2>
          {!loading && (
            <div className="flex flex-wrap items-center gap-10">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-3 font-semibold uppercase tracking-wider text-base text-accent py-4 transition-all duration-150 ease-crisp active:translate-y-px"
                >
                  <span className="relative">
                    Open your dashboard →
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110"
                      style={{ transformOrigin: 'left center' }}
                    />
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="group inline-flex items-center gap-3 font-semibold uppercase tracking-wider text-base text-accent py-4 transition-all duration-150 ease-crisp active:translate-y-px"
                  >
                    <span className="relative">
                      Bootstrap your account →
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110"
                        style={{ transformOrigin: 'left center' }}
                      />
                    </span>
                  </Link>
                  <Link
                    href="/sign-in"
                    className="font-semibold uppercase tracking-wider text-sm text-background/70 hover:text-background transition-colors duration-150"
                  >
                    Sign in →
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-16">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <Link href="/" className="font-sans font-bold text-xl tracking-tight">
                LATTICE
              </Link>
              <p className="font-sans text-sm text-muted-foreground mt-4 max-w-md leading-relaxed">
                Built for Build with AI 2026 KL — MyHack. Cradle problem
                statement: <em>Automating Ecosystem Linkages Instead of Manual
                Coordination</em>.
              </p>
            </div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground space-y-2 md:text-right">
              <div>Powered by</div>
              <div className="text-foreground">Gemini 3.1 · Firestore · Cloud Run</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ number, label, accent }: { number: string; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`font-sans font-bold text-6xl md:text-7xl leading-none tracking-tighter ${accent ? 'text-accent' : 'text-foreground'}`}>
        {number}
      </div>
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function ProblemBlock({
  n, problem, answer, body, highlight,
}: {
  n: string; problem: string; answer: string; body: string; highlight?: boolean;
}) {
  return (
    <div className={`relative p-8 md:p-10 lg:p-12 transition-colors duration-150 ${highlight ? 'bg-muted hover:bg-card' : 'bg-background hover:bg-muted'}`}>
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
        {n} / The pain
      </div>
      <h3 className="font-sans font-bold text-2xl md:text-3xl leading-tight tracking-tight mb-6">
        {problem}
      </h3>
      <div className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
        Lattice answers
      </div>
      <div className="font-sans font-semibold text-lg mb-4">
        {answer}
      </div>
      <p className="font-sans text-base text-muted-foreground leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-background p-8 md:p-10 lg:p-12 grid md:grid-cols-12 gap-6 md:gap-10 items-baseline group">
      <div className="md:col-span-1 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors duration-150 group-hover:text-accent">
        {n}
      </div>
      <h3 className="md:col-span-4 font-sans font-bold text-2xl md:text-3xl leading-tight tracking-tight">
        {title}
      </h3>
      <p className="md:col-span-7 font-sans text-base md:text-lg text-muted-foreground leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function PricingTier({
  name, tagline, price, priceSuffix, priceFloor, features, ctaLabel, ctaHref, featured,
}: {
  name: string;
  tagline: string;
  price: string;
  priceSuffix: string;
  priceFloor?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
}) {
  const isExternal = ctaHref.startsWith('mailto:') || ctaHref.startsWith('http');
  const featuredStyle = featured
    ? { boxShadow: 'inset 0 0 0 2px #FF3D00' }
    : undefined;
  const ctaContent = (
    <span className="relative">
      {ctaLabel}
      <span
        aria-hidden="true"
        className={`absolute -bottom-1 left-0 right-0 h-0.5 ${featured ? 'bg-accent' : 'bg-foreground'} ${featured ? 'scale-x-100' : 'scale-x-0'} transition-transform duration-150 ease-crisp group-hover:scale-x-110`}
        style={{ transformOrigin: 'left center' }}
      />
    </span>
  );
  const ctaClasses = `group inline-flex items-center font-semibold uppercase tracking-wider text-xs py-2 transition-all duration-150 ease-crisp active:translate-y-px ${featured ? 'text-accent' : 'text-foreground'}`;

  return (
    <div
      className="relative bg-background p-6 md:p-10 flex flex-col"
      style={featuredStyle}
    >
      {featured && (
        <span className="absolute -top-3 left-6 md:left-10 bg-accent text-accent-foreground font-mono text-[10px] uppercase tracking-widest px-3 py-1 font-bold">
          Most popular
        </span>
      )}

      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
          {tagline}
        </div>
        <h3 className={`font-sans font-bold text-3xl md:text-4xl leading-none tracking-tighter ${featured ? 'text-accent' : 'text-foreground'}`}>
          {name}
        </h3>
      </div>

      <div className="mb-8 pb-8 border-b border-border">
        <div className="font-sans font-bold text-5xl md:text-6xl leading-none tracking-tighter text-foreground mb-3">
          {price}
        </div>
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {priceSuffix}
        </div>
        {priceFloor && (
          <div className="font-mono text-xs text-muted-foreground/60 normal-case tracking-normal mt-2">
            {priceFloor}
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-10 flex-1">
        {features.map(f => (
          <li key={f} className="flex gap-3">
            <span className={`font-mono text-xs pt-0.5 ${featured ? 'text-accent' : 'text-muted-foreground'}`}>+</span>
            <span className="font-sans text-sm text-foreground leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      {isExternal ? (
        <a href={ctaHref} className={ctaClasses}>{ctaContent}</a>
      ) : (
        <Link href={ctaHref} className={ctaClasses}>{ctaContent}</Link>
      )}
    </div>
  );
}

function UnitEconomic({ n, label, value, hint }: { n: string; label: string; value: string; hint: string }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
        {n} · {label}
      </div>
      <div className="font-sans font-bold text-3xl md:text-4xl leading-none tracking-tighter text-foreground mb-2">
        {value}
      </div>
      <div className="font-mono text-xs text-muted-foreground/70 normal-case tracking-normal">
        {hint}
      </div>
    </div>
  );
}
