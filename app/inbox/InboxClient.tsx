'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import Spinner from '../components/Spinner';
import { SkeletonRows } from '../components/Skeleton';
import { CitationChipList, type ChipCitation } from '../components/CitationChip';
import { humaniseLabel } from '@/lib/format';
import ApprovalResultModal, { type ApprovalResult } from './ApprovalResultModal';

type InboxData = {
  pendingActions: Array<{
    kind: 'steward';
    relationshipId: string; relationshipLabel: string; timestamp: string;
    action: string;
    reasoning: string;
    citations: ChipCitation[];
    confidence: number;
  }>;
  gaps: Array<{
    kind: 'proposal';
    proposalId: string; gapType: string; candidates: string[];
    reasoning: string;
    citations: ChipCitation[];
    impact: string; confidence: number;
  }>;
};

export default function InboxClient() {
  const { can, user } = useAuth();
  const canRun = can('steward.run');
  const canScan = can('cartographer.run');
  const canApprove = can('approve.write');
  const [data, setData] = useState<InboxData | null>(null);
  const [tab, setTab] = useState<'steward' | 'cartographer'>('steward');
  const [tickingAll, setTickingAll] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'info' | 'error'; message: string; href?: string } | null>(null);
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  async function refresh() {
    const r = await fetch('/api/inbox', { cache: 'no-store' });
    setData(await r.json());
  }
  useEffect(() => { refresh(); }, []);

  async function tickAll() {
    if (tickingAll) return;
    setTickingAll(true);
    try {
      const rels = data?.pendingActions ?? [];
      const ids = Array.from(new Set(rels.map(r => r.relationshipId)));
      if (ids.length === 0) {
        const all = await (await fetch('/api/graph')).json();
        for (const link of (all.links ?? []).slice(0, 5)) {
          await fetch('/api/steward/tick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ relationshipId: link.id }) });
        }
      } else {
        for (const id of ids) {
          await fetch('/api/steward/tick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ relationshipId: id }) });
        }
      }
      await refresh();
    } finally {
      setTickingAll(false);
    }
  }

  async function scanGaps() {
    if (scanning) return;
    setScanning(true);
    try {
      await fetch('/api/cartographer/scan', { method: 'POST' });
      await refresh();
    } finally {
      setScanning(false);
    }
  }

  async function decideSteward(
    action: InboxData['pendingActions'][number],
    decision: 'approve' | 'dismiss',
  ) {
    const key = `s:${action.relationshipId}:${action.timestamp}:${decision}`;
    setBusyId(key);
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: decision === 'approve' ? 'steward-log' : 'dismiss-steward',
          relationshipId: action.relationshipId,
          timestamp: action.timestamp,
        }),
      });
      const j = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setToast({ kind: 'error', message: j.error ?? `Failed (${res.status})` });
      } else if (decision === 'dismiss') {
        setToast({
          kind: 'info',
          message: `Dismissed "${humaniseLabel(action.action)}" for ${action.relationshipLabel}.`,
        });
      } else {
        const bits: string[] = [`Approved "${humaniseLabel(action.action)}" for ${action.relationshipLabel}.`];
        if (j.stateChanged && j.newState) {
          bits.push(`State auto-transitioned to ${j.newState}.`);
        }
        if (j.todoId) {
          bits.push(`Added to your todo list.`);
        }
        setToast({
          kind: 'success',
          message: bits.join(' '),
          href: j.todoId ? '/todos' : undefined,
        });
      }
      await refresh();
    } catch (e: any) {
      setToast({ kind: 'error', message: e?.message ?? 'Network error' });
    } finally {
      setBusyId(null);
    }
  }

  async function decideProposal(
    proposal: InboxData['gaps'][number],
    decision: 'approve' | 'dismiss',
  ) {
    const proposalId = proposal.proposalId;
    const key = `p:${proposalId}:${decision}`;
    setBusyId(key);
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: decision === 'approve' ? 'proposal' : 'dismiss-proposal', proposalId }),
      });
      const j = await res.json().catch(() => ({}));
      if (decision === 'approve' && res.ok) {
        setApprovalResult({
          proposal: {
            proposalId: proposal.proposalId,
            gapType: proposal.gapType,
            candidates: proposal.candidates,
            reasoning: proposal.reasoning,
            impact: proposal.impact,
          },
          response: {
            ok: !!j.ok,
            materialized: !!j.materialized,
            relationshipId: j.relationshipId ?? null,
            message: j.message ?? 'Proposal approved.',
            relationship: j.relationship,
          },
          remainingProposals: Math.max(0, (data?.gaps.length ?? 1) - 1),
        });
      } else if (decision === 'dismiss' && res.ok) {
        setToast({ kind: 'info', message: 'Proposal dismissed.' });
      } else if (!res.ok) {
        setToast({ kind: 'error', message: j.error ?? `Failed (${res.status})` });
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 md:mb-12 pb-8 border-b border-border">
        <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
          Inbox / Decisions awaiting you
        </div>
        <h1 className="font-sans font-bold text-4xl md:text-6xl leading-none tracking-tighter">
          Approve.<br /><span className="text-muted-foreground">Or dismiss.</span>
        </h1>
      </header>

      {!data && <SkeletonRows count={4} />}
      {data && (
        <>
          {/* Tabs + run buttons */}
          <div className="flex flex-wrap items-end justify-between gap-6 mb-8 pb-4 border-b border-border">
            <div className="flex">
              <TabButton active={tab === 'steward'} onClick={() => setTab('steward')}>
                Steward
                <span className="ml-2 text-foreground/70">/ {data.pendingActions.length}</span>
              </TabButton>
              <TabButton active={tab === 'cartographer'} onClick={() => setTab('cartographer')}>
                Cartographer
                <span className="ml-2 text-foreground/70">/ {data.gaps.length}</span>
              </TabButton>
            </div>
            <div className="flex items-center gap-8">
              <RunButton
                onClick={tickAll}
                disabled={!canRun || tickingAll}
                title={canRun ? undefined : `Your role (${user?.role ?? 'unknown'}) lacks steward.run`}
                busy={tickingAll}
              >
                {tickingAll ? 'Running ticks…' : 'Run Steward tick →'}
              </RunButton>
              <RunButton
                onClick={scanGaps}
                disabled={!canScan || scanning}
                title={canScan ? undefined : `Your role (${user?.role ?? 'unknown'}) lacks cartographer.run`}
                busy={scanning}
              >
                {scanning ? 'Scanning ecosystem…' : 'Run Cartographer scan →'}
              </RunButton>
            </div>
          </div>

          {!canRun && !canApprove && (
            <div className="mb-6 border border-border bg-card p-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Read-only role · <span className="text-foreground">{user?.role}</span> · actions disabled
            </div>
          )}

          {toast && (
            <div
              className={`mb-6 p-4 border flex items-start justify-between gap-3 animate-fade-in ${
                toast.kind === 'success' ? 'border-accent bg-accent/10' :
                toast.kind === 'error' ? 'border-accent bg-accent/10' :
                'border-border bg-card'
              }`}
            >
              <div className="flex-1 font-sans text-sm">
                <span className={toast.kind === 'success' || toast.kind === 'error' ? 'text-accent' : 'text-foreground'}>
                  {toast.message}
                </span>
                {toast.href && (
                  <> · <a href={toast.href} className="underline underline-offset-4 decoration-1 hover:text-accent transition-colors duration-150">
                    {toast.href.startsWith('/todos') ? 'Open todo list →' : toast.href.startsWith('/relationships') ? 'Open relationship →' : 'Open →'}
                  </a></>
                )}
              </div>
              <button onClick={() => setToast(null)} className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors" aria-label="Dismiss">
                Close
              </button>
            </div>
          )}

          {tab === 'steward' && (
            <div className="space-y-px bg-border">
              {data.pendingActions.length === 0 && (
                <div className="bg-background p-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  No pending Steward actions · click 'Run Steward tick' to generate some
                </div>
              )}
              {data.pendingActions.map(a => {
                const approveKey = `s:${a.relationshipId}:${a.timestamp}:approve`;
                const dismissKey = `s:${a.relationshipId}:${a.timestamp}:dismiss`;
                const approveBusy = busyId === approveKey;
                const dismissBusy = busyId === dismissKey;
                return (
                  <div key={a.timestamp + a.relationshipId} className="bg-background p-6 md:p-8">
                    <div className="flex justify-between gap-6 flex-wrap mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
                          {humaniseLabel(a.action)} · confidence {a.confidence.toFixed(2)}
                        </div>
                        <h3 className="font-sans font-bold text-xl md:text-2xl leading-tight tracking-tight">
                          {a.relationshipLabel}
                        </h3>
                      </div>
                      <div className="flex gap-6 shrink-0">
                        <DecisionButton
                          variant="dismiss"
                          onClick={() => decideSteward(a, 'dismiss')}
                          disabled={!canApprove || !!busyId}
                          title={canApprove ? 'Dismiss this proposal' : `Your role (${user?.role}) lacks approve.write`}
                          busy={dismissBusy}
                        >
                          Dismiss
                        </DecisionButton>
                        <DecisionButton
                          variant="approve"
                          onClick={() => decideSteward(a, 'approve')}
                          disabled={!canApprove || !!busyId}
                          title={canApprove ? 'Approve — auto-transitions state for taper/sunset/escalate' : `Your role (${user?.role}) lacks approve.write`}
                          busy={approveBusy}
                        >
                          Approve →
                        </DecisionButton>
                      </div>
                    </div>
                    <p className="font-sans text-base text-foreground leading-relaxed max-w-3xl">{a.reasoning}</p>
                    <div className="mt-4">
                      <CitationChipList citations={a.citations} />
                    </div>
                    {(a.action === 'taper' || a.action === 'sunset' || a.action === 'escalate') && (
                      <div className="mt-4 font-mono text-xs uppercase tracking-widest text-accent">
                        ⚠ Approving auto-transitions state to <span className="font-bold">{a.action === 'taper' ? 'tapered' : a.action === 'sunset' ? 'closed' : 'escalated'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'cartographer' && (
            <div className="space-y-px bg-border">
              {data.gaps.length === 0 && (
                <div className="bg-background p-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  No open gaps · click 'Run Cartographer scan' to find some
                </div>
              )}
              {data.gaps.map(g => {
                const approveKey = `p:${g.proposalId}:approve`;
                const dismissKey = `p:${g.proposalId}:dismiss`;
                const approveBusy = busyId === approveKey;
                const dismissBusy = busyId === dismissKey;
                return (
                  <div key={g.proposalId} className="bg-background p-6 md:p-8 relative">
                    <span className="absolute top-0 left-0 w-12 h-1 bg-accent" />
                    <div className="flex justify-between gap-6 flex-wrap mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                          Structural gap · confidence {g.confidence.toFixed(2)}
                        </div>
                        <h3 className="font-sans font-bold text-xl md:text-2xl leading-tight tracking-tight text-accent mb-2">
                          {humaniseLabel(g.gapType)}
                        </h3>
                        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                          Candidates · <span className="text-foreground normal-case tracking-normal">{g.candidates.join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex gap-6 shrink-0">
                        <DecisionButton
                          variant="dismiss"
                          onClick={() => decideProposal(g, 'dismiss')}
                          disabled={!canApprove || !!busyId}
                          title={canApprove ? 'Dismiss this gap' : `Your role (${user?.role}) lacks approve.write`}
                          busy={dismissBusy}
                        >
                          Dismiss
                        </DecisionButton>
                        <DecisionButton
                          variant="approve"
                          onClick={() => decideProposal(g, 'approve')}
                          disabled={!canApprove || !!busyId}
                          title={canApprove ? 'Approve — materialises a Relationship between the candidates' : `Your role (${user?.role}) lacks approve.write`}
                          busy={approveBusy}
                        >
                          Approve →
                        </DecisionButton>
                      </div>
                    </div>
                    <p className="font-sans text-base text-foreground leading-relaxed max-w-3xl">{g.reasoning}</p>
                    <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Expected impact · <span className="text-foreground normal-case tracking-normal">{g.impact}</span>
                    </p>
                    <div className="mt-4">
                      <CitationChipList citations={g.citations} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ApprovalResultModal
        result={approvalResult}
        onClose={() => setApprovalResult(null)}
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

function RunButton({
  onClick, disabled, title, busy, children,
}: {
  onClick: () => void; disabled?: boolean; title?: string; busy?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="group inline-flex items-center gap-2.5 font-semibold uppercase tracking-wider text-xs text-foreground py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {busy && <Spinner />}
      <span className="relative">
        {children}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-foreground transition-transform duration-150 ease-crisp group-hover:scale-x-110 group-disabled:hidden"
          style={{ transformOrigin: 'left center' }}
        />
      </span>
    </button>
  );
}

function DecisionButton({
  variant, onClick, disabled, title, busy, children,
}: {
  variant: 'approve' | 'dismiss';
  onClick: () => void; disabled?: boolean; title?: string; busy?: boolean; children: React.ReactNode;
}) {
  const color = variant === 'approve' ? 'text-accent' : 'text-muted-foreground hover:text-foreground';
  const underline = variant === 'approve' ? 'bg-accent' : 'bg-foreground';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`group inline-flex items-center gap-2 font-semibold uppercase tracking-wider text-xs py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
    >
      {busy && <Spinner />}
      <span className="relative">
        {children}
        <span
          aria-hidden="true"
          className={`absolute -bottom-1 left-0 right-0 h-0.5 ${underline} ${variant === 'approve' ? 'scale-x-100' : 'scale-x-0'} transition-transform duration-150 ease-crisp group-hover:scale-x-110 group-disabled:hidden`}
          style={{ transformOrigin: 'left center' }}
        />
      </span>
    </button>
  );
}
