'use client';
import Link from 'next/link';
import Modal from '../components/Modal';
import { humaniseLabel } from '@/lib/format';

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

  return (
    <Modal
      open={!!result}
      onClose={onClose}
      title={isMaterialised ? 'Cartographer proposal approved — new relationship created' : 'Approved — no new relationship materialised'}
      width="max-w-xl"
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

        {/* What was approved */}
        <section>
          <SectionLabel>The proposal you approved</SectionLabel>
          <div className="border border-neutral-800 rounded p-3 bg-neutral-900/30 text-sm space-y-1.5">
            <div>
              <span className="text-xs text-amber-300 uppercase tracking-wider mr-2">{humaniseLabel(proposal.gapType)}</span>
            </div>
            <div className="text-neutral-300">
              <span className="text-neutral-500 text-xs">Candidates: </span>
              {proposal.candidates.join(', ')}
            </div>
            <div className="text-neutral-300 leading-relaxed pt-1">{proposal.reasoning}</div>
            {proposal.impact && (
              <div className="text-emerald-300 text-xs pt-1">
                <span className="text-emerald-400/80 uppercase tracking-wider text-[10px] mr-1">Expected impact</span>
                {proposal.impact}
              </div>
            )}
          </div>
        </section>

        {/* Next steps — different for materialised vs not */}
        <section>
          <SectionLabel>{isMaterialised ? 'What to do next' : 'Why nothing materialised — and what to do'}</SectionLabel>
          <ol className="space-y-2.5 text-sm">
            {isMaterialised ? (
              <>
                <Step n={1}>
                  <Link href={`/relationships/${response.relationshipId}`} className="text-emerald-300 hover:underline" onClick={onClose}>
                    Open the new relationship
                  </Link>{' '}
                  to set <span className="font-mono text-xs">focus</span> tags. Future Steward proposals will be much more specific once focus is set.
                </Step>
                <Step n={2}>
                  Run a <span className="font-medium">Steward tick</span> on the new relationship to generate its first AI-proposed action.
                </Step>
                <Step n={3}>
                  Or close this dialog and continue triaging — there {remainingProposals === 1 ? 'is' : 'are'}{' '}
                  <span className="font-medium">{remainingProposals}</span> more open {remainingProposals === 1 ? 'proposal' : 'proposals'} in the queue.
                </Step>
              </>
            ) : (
              <>
                <Step n={1}>
                  This typically means the proposal referenced fewer than 2 existing actors, or the suggested pair already has an active relationship.
                </Step>
                <Step n={2}>
                  If a new actor is needed:{' '}
                  <Link href="/graph" className="text-emerald-300 hover:underline" onClick={onClose}>open the Graph</Link> and use <span className="font-mono text-xs">+ Add actor</span>, then form the relationship manually.
                </Step>
                <Step n={3}>
                  The proposal has been marked <span className="font-mono text-xs">recruited</span> in the audit log either way, so it won&apos;t reappear.
                </Step>
              </>
            )}
          </ol>
        </section>

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
