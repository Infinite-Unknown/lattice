import { NextResponse } from 'next/server';
import { listActors } from '@/lib/data/actors';
import { listRelationships } from '@/lib/data/relationships';
import { listOpenProposals } from '@/lib/data/proposals';
import { listAllOutcomes } from '@/lib/data/outcomes';
import { listTodosForAccount } from '@/lib/data/todos';
import { requireUser } from '@/lib/auth/current-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // /api/stats is read-by-anyone-signed-in but we need the account id to
  // scope every list — otherwise a new tenant inherits the previous one's
  // stat strip.
  const auth = await requireUser(['graph.read']);
  if ('error' in auth) return auth.error;
  const accountId = auth.user.account_id;

  const [actors, rels, props, outcomes, todos] = await Promise.all([
    listActors(accountId),
    listRelationships(accountId),
    listOpenProposals(accountId),
    listAllOutcomes(accountId),
    listTodosForAccount(accountId),
  ]);

  // Mirror the inbox filter exactly — pending = neither approved nor
  // dismissed AND not a 'hold' (holds aren't user-actionable).
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
  const recentOutcomes = outcomes
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5)
    .map(o => ({
      id: o.id,
      timestamp: o.timestamp,
      type: o.type,
      evidence_text: o.evidence_text,
      relationship_id: o.relationship_id,
    }));

  const openTodos = todos.filter(t => t.status === 'open').length;

  return NextResponse.json({
    actors_total: actors.length,
    actors_by_type: actorsByType,
    relationships_active: activeRelationships,
    relationships_total: rels.length,
    pending_proposals: props.length,
    pending_steward_actions: pendingSteward,
    outcomes_total: outcomes.length,
    open_todos: openTodos,
    recent_outcomes: recentOutcomes,
    runtime: {
      gemini_chat_model: process.env.GEMINI_MODEL ?? 'gemini-2.5-pro',
      gemini_embed_model: process.env.GEMINI_EMBED_MODEL ?? 'gemini-embedding-001',
    },
  });
}
