import { NextResponse } from 'next/server';
import { getRelationship } from '@/lib/data/relationships';
import { listOutcomesFor } from '@/lib/data/outcomes';
import { listActors } from '@/lib/data/actors';
import { resolveCitation, rewriteReasoning } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const [r, outcomes, actors] = await Promise.all([
    getRelationship(params.id),
    listOutcomesFor(params.id),
    listActors(),
  ]);
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const nameOf = new Map(actors.map(a => [a.id, a.name]));

  // Decorate each steward_log entry with pretty reasoning + resolved citation chips.
  const stewardLog = r.steward_log.map(e => ({
    ...e,
    reasoning_pretty: rewriteReasoning(e.reasoning, nameOf),
    citations_resolved: e.citations.map(c => resolveCitation(c, nameOf)),
  }));

  return NextResponse.json({
    relationship: { ...r, steward_log: stewardLog },
    parties: r.parties.map(id => ({ id, name: nameOf.get(id) ?? id })),
    outcomes: outcomes.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  });
}
