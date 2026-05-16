import { NextResponse } from 'next/server';
import { getRelationship, upsertRelationship } from '@/lib/data/relationships';
import { upsertOutcome } from '@/lib/data/outcomes';
import { setProposalStatus } from '@/lib/data/proposals';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json();
  if (body.kind === 'steward-log') {
    const r = await getRelationship(body.relationshipId);
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const entry = r.steward_log.find(e => e.timestamp === body.timestamp);
    if (!entry) return NextResponse.json({ error: 'log entry not found' }, { status: 404 });
    entry.approved = true;
    await upsertRelationship(r);

    const outcomeId = `o_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    await upsertOutcome({
      id: outcomeId,
      relationship_id: r.id,
      type: entry.action === 'propose-session' ? 'session_held'
          : entry.action === 'propose-intro' ? 'intro_made'
          : entry.action === 'escalate' ? 'issue'
          : entry.action === 'sunset' ? 'closing_note'
          : 'milestone',
      evidence_text: `Approved Steward action: ${entry.action}. ${entry.reasoning}`,
      source: 'admin',
      verified: false,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, outcomeId });
  }
  if (body.kind === 'proposal') {
    await setProposalStatus(body.proposalId, 'recruited');
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'unknown kind' }, { status: 400 });
}
