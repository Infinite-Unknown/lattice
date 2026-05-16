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
        ? 'Relationship created and auto-configured'
        : 'Proposal approved — manual follow-up needed'}
      width="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Status banner */}
        <div className={`rounded-lg border p-3 text-sm ${
          isMaterialised
            ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-200'
            : 'border-amber-800/60 bg-amber-950/30 text-amber-200'
        }`}>
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">
              {isMaterialised ? '✓' : 'ℹ'}
            </span>
            <span>{response.message}</span>
          </div>
        </div>

        {/* Auto-configured details — the headline section when materialised */}
        {isMaterialised && rel && (
          <section>
            <SectionLabel>What we set up automatically</SectionLabel>
            <div className="border border-emerald-900/40 rounded p-4 bg-emerald-950/10 text-sm space-y-3">
              <div className="grid grid-cols-[7rem_1fr] gap-y-2 items-baseline">
                <KvKey>Parties</KvKey>
                <KvValue>
                  <span className="text-neutral-100 font-medium">{rel.parties[0]?.name}</span>
                  <span className="text-neutral-500"> ({rel.parties[0]?.type})</span>
                  <span className="mx-2 text-neutral-500">↔</span>
                  <span className="text-neutral-100 font-medium">{rel.parties[1]?.name}</span>
                  <span className="text-neutral-500"> ({rel.parties[1]?.type})</span>
                </KvValue>

                <KvKey>Type</KvKey>
                <KvValue><Chip>{humaniseLabel(rel.type)}</Chip></KvValue>

                <KvKey>State</KvKey>
                <KvValue><Chip color="emerald">Active</Chip></KvValue>

                <KvKey>Cadence</KvKey>
                <KvValue><Chip>{rel.cadence}</Chip></KvValue>

                <KvKey>Focus</KvKey>
                <KvValue>
                  {rel.focus.length === 0 ? (
                    <span className="text-neutral-500 italic">none — model didn&apos;t suggest any</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {rel.focus.map(f => <Chip key={f} color="amber">{f}</Chip>)}
                    </div>
                  )}
                </KvValue>

                <KvKey>Policies</KvKey>
                <KvValue className="text-neutral-400 text-xs">
                  Default escalation + sunset YAML applied (editable on the relationship&apos;s Policy tab).
                </KvValue>

                <KvKey>Timeline</KvKey>
                <KvValue className="text-neutral-400 text-xs">
                  Provenance outcome appended — &quot;Created from Cartographer proposal {proposal.proposalId}&quot;.
                </KvValue>

                <KvKey>Audit log</KvKey>
                <KvValue className="text-neutral-400 text-xs">
                  Two entries written: <span className="font-mono">create_relationship</span> + <span className="font-mono">approve_proposal</span>.
                </KvValue>
              </div>
            </div>
          </section>
        )}

        {/* The original proposal — collapsed reference */}
        <section>
          <SectionLabel>Cartographer&apos;s reasoning</SectionLabel>
          <div className="border border-neutral-800 rounded p-3 bg-neutral-900/30 text-sm">
            <div className="text-xs text-amber-300 uppercase tracking-wider mb-1">
              {humaniseLabel(proposal.gapType)}
            </div>
            <div className="text-neutral-300 leading-relaxed">{proposal.reasoning}</div>
            {proposal.impact && (
              <div className="text-emerald-300 text-xs mt-2">
                <span className="text-emerald-400/80 uppercase tracking-wider text-[10px] mr-1">Expected impact</span>
                {proposal.impact}
              </div>
            )}
          </div>
        </section>

        {!isMaterialised && (
          <section>
            <SectionLabel>What to do</SectionLabel>
            <ol className="space-y-2.5 text-sm">
              <Step n={1}>
                Cartographer suggested a gap that needs a new actor or hit an existing duplicate. The proposal is marked <span className="font-mono text-xs">recruited</span> in the audit log either way.
              </Step>
              <Step n={2}>
                If a new actor is needed:{' '}
                <Link href="/graph" className="text-emerald-300 hover:underline" onClick={onClose}>open the Graph</Link> and use <span className="font-mono text-xs">+ Add actor</span>, then form the relationship manually.
              </Step>
            </ol>
          </section>
        )}

        {isMaterialised && (
          <div className="text-xs text-neutral-500 px-1">
            {remainingProposals === 0
              ? 'Inbox is empty after this approval.'
              : `${remainingProposals} more open ${remainingProposals === 1 ? 'proposal' : 'proposals'} in the queue.`}
          </div>
        )}

        {/* Action row */}
        <div className="flex gap-2 justify-end pt-2 border-t border-neutral-800">
          {isMaterialised ? (
            <Link
              href={`/relationships/${response.relationshipId}`}
              onClick={onClose}
              className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-sm font-medium"
            >
              Open new relationship →
            </Link>
          ) : (
            <Link
              href="/graph"
              onClick={onClose}
              className="px-4 py-2 rounded bg-amber-700 hover:bg-amber-600 text-sm font-medium"
            >
              Open Graph →
            </Link>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-neutral-700 hover:bg-neutral-900 text-sm"
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
    <div className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-2 font-medium">
      {children}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-medium">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

function KvKey({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wider text-neutral-500">{children}</div>;
}

function KvValue({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm text-neutral-200 ${className}`}>{children}</div>;
}

function Chip({ children, color = 'neutral' }: { children: React.ReactNode; color?: 'neutral' | 'emerald' | 'amber' }) {
  const styles =
    color === 'emerald' ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' :
    color === 'amber' ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' :
    'bg-neutral-900 border-neutral-700 text-neutral-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border font-medium ${styles}`}>
      {children}
    </span>
  );
}
