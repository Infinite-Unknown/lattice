import { NextResponse } from 'next/server';
import { listActors } from '@/lib/data/actors';
import { listRelationships } from '@/lib/data/relationships';
import { listOpenProposals } from '@/lib/data/proposals';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [actors, rels, props, outSnap] = await Promise.all([
    listActors(),
    listRelationships(),
    listOpenProposals(),
    getAdminDb().collection('outcomes').get(),
  ]);

  const pendingSteward = rels.reduce(
    (acc, r) => acc + r.steward_log.filter(e => !e.approved && e.action !== 'hold').length,
    0,
  );

  const actorsByType = {
    mentor: actors.filter(a => a.type === 'mentor').length,
    company: actors.filter(a => a.type === 'company').length,
    programme: actors.filter(a => a.type === 'programme').length,
    partner: actors.filter(a => a.type === 'partner').length,
  };

  const activeRelationships = rels.filter(r => r.state === 'active').length;

  // Recent activity: last 5 outcomes by timestamp
  const outcomes = outSnap.docs.map(d => d.data() as { id: string; timestamp: string; type: string; evidence_text: string; relationship_id: string });
  const recentOutcomes = outcomes
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5);

  return NextResponse.json({
    actors_total: actors.length,
    actors_by_type: actorsByType,
    relationships_active: activeRelationships,
    relationships_total: rels.length,
    pending_proposals: props.length,
    pending_steward_actions: pendingSteward,
    outcomes_total: outSnap.size,
    recent_outcomes: recentOutcomes,
  });
}
