import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { getRelationship, upsertRelationship } from '@/lib/data/relationships';
import { upsertOutcome } from '@/lib/data/outcomes';
import { writeAuditEntry } from '@/lib/data/audit';
import type { RelationshipState } from '@/lib/types';

const TRANSITIONABLE_TO: RelationshipState[] = ['active', 'tapered', 'closed'];

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(['relationship.write']);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const next = (body as { state?: string }).state;
  if (!next || !TRANSITIONABLE_TO.includes(next as RelationshipState)) {
    return NextResponse.json({ error: `state must be one of: ${TRANSITIONABLE_TO.join(', ')}` }, { status: 400 });
  }

  const accountId = auth.user.account_id;
  const r = await getRelationship(params.id, accountId);
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const prevState = r.state;
  r.state = next as RelationshipState;
  await upsertRelationship(r);

  // Audit the transition by appending an outcome so the timeline shows it.
  await upsertOutcome({
    id: `o_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    account_id: accountId,
    relationship_id: r.id,
    type: next === 'closed' ? 'closing_note' : next === 'tapered' ? 'milestone' : 'milestone',
    evidence_text: `Admin transitioned state: ${prevState} → ${next} (by ${auth.user.name})`,
    source: 'admin',
    verified: true,
    timestamp: new Date().toISOString(),
  });

  await writeAuditEntry(
    auth.user, 'transition_relationship_state', 'relationship', r.id,
    `State ${prevState} → ${next}`,
  );

  return NextResponse.json({ ok: true, state: next });
}
