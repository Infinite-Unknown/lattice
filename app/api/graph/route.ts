import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { listActors } from '@/lib/data/actors';
import { listRelationships } from '@/lib/data/relationships';
import { listOpenProposals } from '@/lib/data/proposals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireUser(['graph.read']);
  if ('error' in auth) return auth.error;
  const accountId = auth.user.account_id;

  const [actors, rels, proposals] = await Promise.all([
    listActors(accountId),
    listRelationships(accountId),
    listOpenProposals(accountId),
  ]);
  const nameOf = new Map(actors.map(a => [a.id, a.name]));
  const nodes = actors.map(a => ({ id: a.id, name: a.name, type: a.type }));

  const links = rels.map(r => ({
    id: r.id,
    source: r.parties[0],
    target: r.parties[1],
    state: r.state,
    type: r.type,
    focus: r.focus,
    cadence: r.cadence,
    outcomes_count: r.outcomes.length,
    label: r.parties.map(p => nameOf.get(p) ?? p).join(' ↔ '),
  }));

  const proposedLinks = proposals.flatMap(p =>
    p.candidate_parties.length >= 2
      ? [{
          id: p.id,
          source: p.candidate_parties[0],
          target: p.candidate_parties[1],
          state: 'proposed' as const,
          type: p.type,
          focus: [],
          cadence: '',
          outcomes_count: 0,
          label: p.candidate_parties.map(a => nameOf.get(a) ?? a).join(' ↔ '),
        }]
      : []
  );

  return NextResponse.json({ nodes, links: [...links, ...proposedLinks] });
}
