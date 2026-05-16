import { NextResponse } from 'next/server';
import { listActors } from '@/lib/data/actors';
import { listRelationships } from '@/lib/data/relationships';
import { listOpenProposals } from '@/lib/data/proposals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [actors, rels, proposals] = await Promise.all([listActors(), listRelationships(), listOpenProposals()]);
  const nodes = actors.map(a => ({ id: a.id, name: a.name, type: a.type }));
  const links = rels.map(r => ({ source: r.parties[0], target: r.parties[1], state: r.state, id: r.id }));
  const proposedLinks = proposals.flatMap(p => p.candidate_parties.length >= 2
    ? [{ source: p.candidate_parties[0], target: p.candidate_parties[1], state: 'proposed' as const, id: p.id }]
    : []);
  return NextResponse.json({ nodes, links: [...links, ...proposedLinks] });
}
