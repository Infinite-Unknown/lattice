import { NextResponse } from 'next/server';
import { listRelationships } from '@/lib/data/relationships';
import { listOpenProposals } from '@/lib/data/proposals';
import { listActors } from '@/lib/data/actors';
import { resolveCitation, rewriteReasoning } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [rels, props, actors] = await Promise.all([listRelationships(), listOpenProposals(), listActors()]);
  const nameOf = new Map(actors.map(a => [a.id, a.name]));

  const pendingActions = rels.flatMap(r =>
    r.steward_log.filter(e => !e.approved && !e.dismissed && e.action !== 'hold').map(e => ({
      kind: 'steward' as const,
      relationshipId: r.id,
      relationshipLabel: r.parties.map(p => nameOf.get(p) ?? p).join(' ↔ '),
      timestamp: e.timestamp,
      action: e.action,                                       // raw machine value (for API logic / approve calls)
      reasoning: rewriteReasoning(e.reasoning, nameOf),       // prose rewritten for readability
      citations_raw: e.citations,
      citations: e.citations.map(c => resolveCitation(c, nameOf)), // resolved chip data
      confidence: e.confidence,
    })),
  );

  const gaps = props.map(p => ({
    kind: 'proposal' as const,
    proposalId: p.id,
    gapType: p.gap_type,
    candidates: p.candidate_parties.map(id => nameOf.get(id) ?? id),
    reasoning: rewriteReasoning(p.reasoning, nameOf),
    citations_raw: p.citations,
    citations: p.citations.map(c => resolveCitation(c, nameOf)),
    impact: p.expected_impact,
    confidence: p.confidence,
  }));

  return NextResponse.json({ pendingActions, gaps });
}
