'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../AuthContext';
import Spinner from '../../components/Spinner';
import LatticeLoader from '../../components/LatticeLoader';
import { CitationChipList, type ChipCitation } from '../../components/CitationChip';
import { humaniseLabel } from '@/lib/format';

type StewardLogEntry = {
  timestamp: string;
  action: string;
  reasoning: string;
  reasoning_pretty?: string;
  citations: string[];
  citations_resolved?: ChipCitation[];
  confidence: number;
  approved: boolean;
  dismissed?: boolean;
  decided_by_name?: string;
  decided_at?: string;
};

type Data = {
  relationship: {
    id: string; type: string; state: string; focus: string[]; cadence: string;
    escalation_policy: string; sunset_policy: string;
    steward_state: { last_run: string | null; memory_summary: string };
    steward_log: StewardLogEntry[];
  };
  parties: Array<{ id: string; name: string }>;
  outcomes: Array<{ id: string; type: string; evidence_text: string; timestamp: string; source: string; verified: boolean }>;
};

const STATE_TONE: Record<string, string> = {
  active: 'text-foreground',
  escalated: 'text-accent',
  tapered: 'text-muted-foreground',
  closed: 'text-muted-foreground',
  proposed: 'text-accent',
};

export default function RelationshipClient({ id }: { id: string }) {
  const { can, user } = useAuth();
  const canRun = can('steward.run');
  const canEditPolicy = can('policy.write');
  const canWriteRelationship = can('relationship.write');
  const [data, setData] = useState<Data | null>(null);
  const [escalation, setEscalation] = useState('');
  const [sunset, setSunset] = useState('');
  const [tab, setTab] = useState<'timeline' | 'steward' | 'policy'>('timeline');
  const [stateBusy, setStateBusy] = useState(false);
  const [ticking, setTicking] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [notFound, setNotFound] = useState(false);

  async function refresh() {
    const r = await fetch(`/api/relationships/${id}`, { cache: 'no-store' });
    if (r.status === 404) { setNotFound(true); return; }
    const d: Data = await r.json();
    setData(d);
    setEscalation(d.relationship.escalation_policy);
    setSunset(d.relationship.sunset_policy);
  }
  useEffect(() => { refresh(); }, [id]);

  async function savePolicy() {
    if (savingPolicy) return;
    setSavingPolicy(true);
    try {
      await fetch(`/api/relationships/${id}/policy`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ escalation_policy: escalation, sunset_policy: sunset }),
      });
      await refresh();
    } finally {
      setSavingPolicy(false);
    }
  }
  async function tickSteward() {
    if (ticking) return;
    setTicking(true);
    try {
      await fetch('/api/steward/tick', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ relationshipId: id }),
      });
      await refresh();
    } finally {
      setTicking(false);
    }
  }
  async function transitionState(next: 'active' | 'tapered' | 'closed', confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    setStateBusy(true);
    try {
      await fetch(`/api/relationships/${id}/state`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state: next }),
      });
      await refresh();
    } finally {
      setStateBusy(false);
    }
  }

  if (notFound) return (
    <div className="max-w-3xl mx-auto py-16">
      <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
        Not yet a relationship
      </div>
      <h1 className="font-sans font-bold text-4xl md:text-5xl leading-none tracking-tighter mb-6">
        This edge is a<br /><span className="text-accent">proposal.</span>
      </h1>
      <p className="font-sans text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8">
        It's a Cartographer-detected gap that hasn't been approved yet.
        Approve it on the agents page and a real relationship gets materialised.
      </p>
      <Link
        href="/agents"
        className="group inline-flex items-center font-semibold uppercase tracking-wider text-sm text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px"
      >
        <span className="relative">
          Open agents · Cartographer tab →
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110"
            style={{ transformOrigin: 'left center' }}
          />
        </span>
      </Link>
    </div>
  );
  if (!data) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LatticeLoader size="lg" label="Loading relationship…" />
    </div>
  );

  const state = data.relationship.state;
  const stateColor = STATE_TONE[state] ?? 'text-muted-foreground';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <header className="mb-10 md:mb-12 pb-8 border-b border-border">
        <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
              Relationship / {humaniseLabel(data.relationship.type)}
            </div>
            <h1 className="font-sans font-bold text-3xl md:text-5xl lg:text-6xl leading-none tracking-tighter">
              {data.parties.map(p => p.name).join(' ↔ ')}
            </h1>
          </div>

          {canWriteRelationship && (
            <div className="flex gap-6 flex-wrap shrink-0">
              {state === 'active' && (
                <>
                  <StateButton onClick={() => transitionState('tapered', 'Taper this relationship? It will keep history but mark engagement as winding down.')} disabled={stateBusy}>
                    Taper
                  </StateButton>
                  <StateButton onClick={() => transitionState('closed', 'Close this relationship? You can reopen later.')} disabled={stateBusy} variant="danger">
                    Close
                  </StateButton>
                </>
              )}
              {state === 'tapered' && (
                <>
                  <StateButton onClick={() => transitionState('active', 'Reactivate this tapered relationship?')} disabled={stateBusy} variant="accent">
                    Reactivate
                  </StateButton>
                  <StateButton onClick={() => transitionState('closed', 'Close this relationship?')} disabled={stateBusy} variant="danger">
                    Close
                  </StateButton>
                </>
              )}
              {state === 'closed' && (
                <StateButton onClick={() => transitionState('active', 'Reopen this closed relationship?')} disabled={stateBusy} variant="accent">
                  Reopen
                </StateButton>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-px bg-border">
          <MetaCell label="State">
            <span className={stateColor}>{state}</span>
          </MetaCell>
          <MetaCell label="Type">
            <span className="text-foreground">{humaniseLabel(data.relationship.type)}</span>
          </MetaCell>
          <MetaCell label="Cadence">
            <span className="text-foreground">{data.relationship.cadence || '—'}</span>
          </MetaCell>
          <MetaCell label="Focus">
            <span className="text-foreground">{data.relationship.focus.join(', ') || '—'}</span>
          </MetaCell>
        </div>
      </header>

      {/* Tabs + run tick */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-4 border-b border-border">
        <div className="flex">
          <TabButton active={tab === 'timeline'} onClick={() => setTab('timeline')}>
            Timeline <span className="ml-2 text-foreground/70">/ {data.outcomes.length}</span>
          </TabButton>
          <TabButton active={tab === 'steward'} onClick={() => setTab('steward')}>
            Steward log <span className="ml-2 text-foreground/70">/ {data.relationship.steward_log.length}</span>
          </TabButton>
          <TabButton active={tab === 'policy'} onClick={() => setTab('policy')}>
            Policy
          </TabButton>
        </div>
        <button
          onClick={tickSteward}
          disabled={!canRun || ticking}
          title={canRun ? undefined : `Your role (${user?.role ?? 'unknown'}) lacks steward.run`}
          className="group inline-flex items-center gap-2.5 font-semibold uppercase tracking-wider text-xs text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {ticking && <Spinner />}
          <span className="relative">
            {ticking ? 'Steward thinking…' : 'Run Steward tick →'}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110 group-disabled:hidden"
              style={{ transformOrigin: 'left center' }}
            />
          </span>
        </button>
      </div>

      {tab === 'timeline' && (
        <div>
          {data.outcomes.length === 0 ? (
            <div className="border border-border bg-card p-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No outcomes yet · approve a Steward action to populate this timeline
            </div>
          ) : (
            <ol className="border-l border-border ml-2">
              {data.outcomes.map(o => (
                <li key={o.id} className="relative pl-8 pb-8 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-accent" />
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    {new Date(o.timestamp).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                    <span className="text-accent ml-3">{o.type}</span>
                    <span className="ml-3">{o.source}</span>
                    {o.verified && <span className="text-foreground ml-3">✓ verified</span>}
                  </div>
                  <div className="font-sans text-base md:text-lg text-foreground leading-snug max-w-3xl">
                    {o.evidence_text}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {tab === 'steward' && (
        <div className="space-y-px bg-border">
          {data.relationship.steward_log.length === 0 && (
            <div className="bg-background p-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No Steward runs yet · click 'Run Steward tick' above
            </div>
          )}
          {data.relationship.steward_log.slice().reverse().map(e => {
            const status = e.approved ? 'approved' : e.dismissed ? 'dismissed' : 'pending';
            const statusLabel =
              status === 'approved' ? '✓ Approved' :
              status === 'dismissed' ? '✗ Dismissed' :
              '⏳ Pending';
            const statusColor =
              status === 'approved' ? 'text-foreground' :
              status === 'dismissed' ? 'text-muted-foreground' :
              'text-accent';
            return (
              <div key={e.timestamp} className="bg-background p-6 md:p-8">
                <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {new Date(e.timestamp).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                    <span className="text-accent ml-3">{humaniseLabel(e.action)}</span>
                    <span className="ml-3">confidence {e.confidence.toFixed(2)}</span>
                  </div>
                  <div className={`font-mono text-xs uppercase tracking-widest ${statusColor}`}>
                    {statusLabel}
                    {e.decided_by_name && e.decided_at && (
                      <span className="text-muted-foreground"> · {e.decided_by_name}</span>
                    )}
                  </div>
                </div>
                <p className="font-sans text-base text-foreground leading-relaxed max-w-3xl mb-4">
                  {e.reasoning_pretty ?? e.reasoning}
                </p>
                <CitationChipList citations={e.citations_resolved ?? []} />
              </div>
            );
          })}
        </div>
      )}

      {tab === 'policy' && (
        <div className="space-y-8 max-w-4xl">
          {!canEditPolicy && (
            <div className="border border-border bg-card p-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Your role · <span className="text-foreground">{user?.role ?? 'unknown'}</span> · can't edit policy. Only root and admin can.
            </div>
          )}
          <PolicyEditor
            label="Escalation policy"
            hint="when the Steward should ask for an admin signal"
            value={escalation}
            onChange={setEscalation}
            disabled={!canEditPolicy}
          />
          <PolicyEditor
            label="Sunset policy"
            hint="when the Steward should propose closing or tapering"
            value={sunset}
            onChange={setSunset}
            disabled={!canEditPolicy}
          />

          <button
            onClick={savePolicy}
            disabled={!canEditPolicy || savingPolicy}
            title={canEditPolicy ? undefined : `Your role (${user?.role}) lacks policy.write`}
            className="group inline-flex items-center gap-2.5 font-semibold uppercase tracking-wider text-sm text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingPolicy && <Spinner />}
            <span className="relative">
              {savingPolicy ? 'Saving…' : 'Save policy →'}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110 group-disabled:hidden"
                style={{ transformOrigin: 'left center' }}
              />
            </span>
          </button>

          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Tip · <span className="normal-case tracking-normal text-foreground/80">edit a policy, save, then run a Steward tick — watch the next reasoning reflect your change</span>
          </p>
        </div>
      )}
    </div>
  );
}

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-background p-4">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </div>
      <div className="font-sans font-semibold text-base md:text-lg leading-snug">
        {children}
      </div>
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

function StateButton({
  onClick, disabled, variant = 'default', children,
}: {
  onClick: () => void; disabled?: boolean; variant?: 'default' | 'accent' | 'danger';
  children: React.ReactNode;
}) {
  const color =
    variant === 'accent' ? 'text-foreground' :
    variant === 'danger' ? 'text-accent' :
    'text-muted-foreground hover:text-foreground';
  const underline =
    variant === 'accent' ? 'bg-foreground' :
    variant === 'danger' ? 'bg-accent' :
    'bg-foreground';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center font-semibold uppercase tracking-wider text-xs py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
    >
      <span className="relative">
        {children}
        <span
          aria-hidden="true"
          className={`absolute -bottom-1 left-0 right-0 h-0.5 ${underline} ${variant === 'default' ? 'scale-x-0' : 'scale-x-100'} transition-transform duration-150 ease-crisp group-hover:scale-x-110 group-disabled:hidden`}
          style={{ transformOrigin: 'left center' }}
        />
      </span>
    </button>
  );
}

function PolicyEditor({
  label, hint, value, onChange, disabled,
}: { label: string; hint: string; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="font-mono text-xs text-muted-foreground/60 normal-case tracking-normal">
          {hint}
        </div>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        spellCheck={false}
        className="w-full px-4 py-3 font-mono text-sm bg-input border border-border text-foreground focus:border-accent focus:outline-none disabled:opacity-50 h-40 resize-none"
      />
    </div>
  );
}
