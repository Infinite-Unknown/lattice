'use client';
import Link from 'next/link';
import Modal from '../components/Modal';
import { humaniseLabel } from '@/lib/format';

type MaterialisedRelationship = {
  id: string;
  type: string;
  cadence: string;
  focus: string[];
  parties: Array<{ id: string; name: string; type: string }>;
};

export type ApprovalResult = {
  proposal: {
    proposalId: string;
    gapType: string;
    candidates: string[];
    reasoning: string;
    impact: string;
  };
  response: {
    ok: boolean;
    materialized: boolean;
    relationshipId: string | null;
    message: string;
    relationship?: MaterialisedRelationship;
  };
  remainingProposals: number;
};

export default function ApprovalResultModal({
  result, onClose,
}: {
  result: ApprovalResult | null;
  onClose: () => void;
}) {
  if (!result) return null;
  const { proposal, response, remainingProposals } = result;
  const isMaterialised = response.materialized && response.relationshipId;
  const rel = response.relationship;

  return (
    <Modal
      open={!!result}
      onClose={onClose}
      title={isMaterialised
        ? 'Relationship materialised'
        : 'Proposal approved · manual follow-up needed'}
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Status line — bold serif because this is the headline moment */}
        <p className="font-display text-2xl leading-snug tracking-tight text-foreground">
          {isMaterialised
            ? <>The Cartographer&apos;s gap is now a <span className="text-accent">real relationship</span>.</>
            : <>The gap is closed, but a new entity is <span className="text-accent">required</span>.</>}
        </p>

        {/* Auto-configured details */}
        {isMaterialised && rel && (
          <section>
            <SectionLabel>What was set up</SectionLabel>
            <div className="space-y-px bg-border">
              <KvRow k="Parties">
                <span className="font-semibold text-foreground">{rel.parties[0]?.name}</span>
                <span className="text-muted-foreground"> · {rel.parties[0]?.type}</span>
                <span className="mx-2 text-accent">↔</span>
                <span className="font-semibold text-foreground">{rel.parties[1]?.name}</span>
                <span className="text-muted-foreground"> · {rel.parties[1]?.type}</span>
              </KvRow>
              <KvRow k="Type">{humaniseLabel(rel.type)}</KvRow>
              <KvRow k="State"><span className="text-foreground">Active</span></KvRow>
              <KvRow k="Cadence">{rel.cadence}</KvRow>
              <KvRow k="Focus">
                {rel.focus.length === 0 ? (
                  <span className="text-muted-foreground italic normal-case tracking-normal">model didn&apos;t suggest any</span>
                ) : (
                  rel.focus.map((f, i) => (
                    <span key={f}>
                      {i > 0 && <span className="text-muted-foreground"> · </span>}
                      <span className="text-foreground">{f}</span>
                    </span>
                  ))
                )}
              </KvRow>
              <KvRow k="Policies">
                <span className="font-sans text-xs text-muted-foreground normal-case tracking-normal">
                  Default escalation + sunset YAML · editable on the relationship&apos;s policy tab
                </span>
              </KvRow>
              <KvRow k="Audit">
                <span className="font-sans text-xs text-muted-foreground normal-case tracking-normal">
                  Two entries written · create_relationship + approve_proposal
                </span>
              </KvRow>
            </div>
          </section>
        )}

        {/* Original proposal */}
        <section>
          <SectionLabel>Cartographer reasoning</SectionLabel>
          <div className="border border-border bg-card p-4 relative">
            <span className="absolute top-0 left-0 w-12 h-1 bg-accent" />
            <div className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
              {humaniseLabel(proposal.gapType)}
            </div>
            <p className="font-sans text-sm text-foreground leading-relaxed">
              {proposal.reasoning}
            </p>
            {proposal.impact && (
              <div className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Expected impact · <span className="text-foreground normal-case tracking-normal">{proposal.impact}</span>
              </div>
            )}
          </div>
        </section>

        {!isMaterialised && (
          <section>
            <SectionLabel>What to do</SectionLabel>
            <ol className="space-y-3 font-sans text-sm">
              <Step n={1}>
                Cartographer suggested a gap that needs a new entity or hit an
                existing duplicate. The proposal is marked recruited in the audit log either way.
              </Step>
              <Step n={2}>
                If a new entity is needed:{' '}
                <Link href="/graph" className="text-accent underline underline-offset-4 decoration-1 hover:opacity-80 transition-opacity" onClick={onClose}>
                  open the Graph
                </Link>
                {' '}and use + Add entity, then form the relationship manually.
              </Step>
            </ol>
          </section>
        )}

        {isMaterialised && (
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {remainingProposals === 0
              ? 'Agents queue empty after this approval'
              : `${remainingProposals} more ${remainingProposals === 1 ? 'proposal' : 'proposals'} in the queue`}
          </div>
        )}

        {/* Action row */}
        <div className="flex gap-8 items-center pt-4 border-t border-border">
          {isMaterialised ? (
            <Link
              href={`/relationships/${response.relationshipId}`}
              onClick={onClose}
              className="group inline-flex items-center font-semibold uppercase tracking-wider text-sm text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px"
            >
              <span className="relative">
                Open new relationship →
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110"
                  style={{ transformOrigin: 'left center' }}
                />
              </span>
            </Link>
          ) : (
            <Link
              href="/graph"
              onClick={onClose}
              className="group inline-flex items-center font-semibold uppercase tracking-wider text-sm text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px"
            >
              <span className="relative">
                Open Graph →
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110"
                  style={{ transformOrigin: 'left center' }}
                />
              </span>
            </Link>
          )}
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Continue triaging
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex-shrink-0 font-mono text-xs uppercase tracking-widest text-accent pt-0.5">
        {String(n).padStart(2, '0')}
      </span>
      <span className="leading-relaxed text-foreground">{children}</span>
    </li>
  );
}

function KvRow({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="bg-background py-3 px-4 grid grid-cols-[100px_1fr] gap-4 items-baseline">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="font-sans text-sm">{children}</div>
    </div>
  );
}
