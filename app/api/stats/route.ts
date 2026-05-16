import { NextResponse } from 'next/server';
import { listActors } from '@/lib/data/actors';
import { listRelationships } from '@/lib/data/relationships';
import { listOpenProposals } from '@/lib/data/proposals';
import { listTodosForAccount } from '@/lib/data/todos';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // We don't *require* a user here — /api/stats is read-by-everyone-signed-in
  // and the existing middleware already gates this route. But we need the
  // account id to scope todos correctly.
  const user = await getCurrentUser();
  const [actors, rels, props, outSnap, todos] = await Promise.all([
    listActors(),
    listRelationships(),
    listOpenProposals(),
    getAdminDb().collection('outcomes').get(),
    user ? listTodosForAccount(user.account_id) : Promise.resolve([]),
  ]);

  // Mirror the inbox's filter exactly — pending = neither approved nor
  // dismissed AND not a 'hold' (holds aren't user-actionable).
  // Without the dismissed check, the nav badge over-counted because it
  // included rejected entries that no longer appear in the inbox itself.
  const pendingSteward = rels.reduce(
    (acc, r) => acc + r.steward_log.filter(e => !e.approved && !e.dismissed && e.action !== 'hold').length,
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

  const openTodos = todos.filter(t => t.status === 'open').length;

  return NextResponse.json({
    actors_total: actors.length,
    actors_by_type: actorsByType,
    relationships_active: activeRelationships,
    relationships_total: rels.length,
    pending_proposals: props.length,
    pending_steward_actions: pendingSteward,
    outcomes_total: outSnap.size,
    open_todos: openTodos,
    recent_outcomes: recentOutcomes,
    // Runtime info — handy for governance + judges. Surfaces the actual
    // model identifier the Steward / Cartographer are calling right now.
    runtime: {
      gemini_chat_model: process.env.GEMINI_MODEL ?? 'gemini-2.5-pro',
      gemini_embed_model: process.env.GEMINI_EMBED_MODEL ?? 'gemini-embedding-001',
    },
  });
}
