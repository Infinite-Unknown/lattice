import { NextResponse } from 'next/server';
import { getRelationship, upsertRelationship } from '@/lib/data/relationships';
import { upsertOutcome } from '@/lib/data/outcomes';
import { setProposalStatus } from '@/lib/data/proposals';
import { requireUser } from '@/lib/auth/current-user';
import { writeAuditEntry } from '@/lib/data/audit';
import type { RelationshipState, StewardAction } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * Approve / dismiss endpoint. Handles four kinds:
 *   - 'steward-log'     — approve a Steward proposal (writes outcome; auto-transitions state for taper/sunset/escalate)
 *   - 'dismiss-steward' — reject a Steward proposal (no outcome, no state change)
 *   - 'proposal'        — approve a Cartographer gap (status → recruited)
 *   - 'dismiss-proposal'— reject a Cartographer gap (status → dismissed)
 *
 * Every action writes an audit_log entry.
 * Steward-action approvals automatically transition relationship.state when
 * the action implies a lifecycle change.
 */

// Which Steward actions, on approval, should automatically change the
// relationship's lifecycle state.
const AUTO_STATE_TRANSITION: Partial<Record<StewardAction, RelationshipState>> = {
  escalate: 'escalated',
  taper: 'tapered',
  sunset: 'closed',
};

const ACTION_TO_OUTCOME_TYPE = (a: StewardAction) =>
  a === 'propose-session' ? 'session_held'
  : a === 'propose-intro' ? 'intro_made'
  : a === 'escalate' ? 'issue'
  : a === 'sunset' ? 'closing_note'
  : 'milestone' as const;

export async function POST(req: Request) {
  const auth = await requireUser(['approve.write']);
  if ('error' in auth) return auth.error;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  const kind = (body as { kind?: string }).kind;
  const now = new Date().toISOString();

  // ---------------- Steward log: approve ----------------
  if (kind === 'steward-log') {
    const r = await getRelationship(body.relationshipId);
    if (!r) return NextResponse.json({ error: 'relationship not found' }, { status: 404 });
    const entry = r.steward_log.find(e => e.timestamp === body.timestamp);
    if (!entry) return NextResponse.json({ error: 'log entry not found' }, { status: 404 });
    if (entry.approved || entry.dismissed) {
      return NextResponse.json({ error: 'log entry already decided' }, { status: 409 });
    }

    entry.approved = true;
    entry.decided_by_user_id = user.id;
    entry.decided_by_name = user.name;
    entry.decided_at = now;

    // Auto state transition for lifecycle-affecting actions
    const newState = AUTO_STATE_TRANSITION[entry.action];
    const stateChanged = newState && newState !== r.state;
    const prevState = r.state;
    if (stateChanged) r.state = newState!;

    await upsertRelationship(r);

    // Write the outcome derived from the approved action
    const outcomeId = `o_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await upsertOutcome({
      id: outcomeId,
      relationship_id: r.id,
      type: ACTION_TO_OUTCOME_TYPE(entry.action),
      evidence_text: `Approved Steward action: ${entry.action}. ${entry.reasoning} (approved by ${user.name})`,
      source: 'admin',
      verified: false,
      timestamp: now,
    });

    // If the approval triggered an automatic state transition, also write an
    // outcome explaining that, so the timeline reads as a coherent story.
    if (stateChanged) {
      await upsertOutcome({
        id: `o_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        relationship_id: r.id,
        type: newState === 'closed' ? 'closing_note' : 'milestone',
        evidence_text: `Auto state transition: ${prevState} → ${newState} (triggered by approved Steward action: ${entry.action})`,
        source: 'admin',
        verified: true,
        timestamp: new Date(Date.now() + 1).toISOString(), // +1ms so ordering is stable
      });
      await writeAuditEntry(
        user, 'auto_state_transition', 'relationship', r.id,
        `Auto state ${prevState} → ${newState} after approving Steward action ${entry.action}`,
      );
    }

    await writeAuditEntry(
      user, 'approve_steward', 'steward_log_entry', `${r.id}:${entry.timestamp}`,
      `Approved Steward action '${entry.action}' on relationship ${r.id}`,
    );

    return NextResponse.json({ ok: true, outcomeId, stateChanged: !!stateChanged, newState });
  }

  // ---------------- Steward log: dismiss ----------------
  if (kind === 'dismiss-steward') {
    const r = await getRelationship(body.relationshipId);
    if (!r) return NextResponse.json({ error: 'relationship not found' }, { status: 404 });
    const entry = r.steward_log.find(e => e.timestamp === body.timestamp);
    if (!entry) return NextResponse.json({ error: 'log entry not found' }, { status: 404 });
    if (entry.approved || entry.dismissed) {
      return NextResponse.json({ error: 'log entry already decided' }, { status: 409 });
    }

    entry.dismissed = true;
    entry.decided_by_user_id = user.id;
    entry.decided_by_name = user.name;
    entry.decided_at = now;
    await upsertRelationship(r);

    await writeAuditEntry(
      user, 'dismiss_steward', 'steward_log_entry', `${r.id}:${entry.timestamp}`,
      `Dismissed Steward action '${entry.action}' on relationship ${r.id}`,
    );

    return NextResponse.json({ ok: true });
  }

  // ---------------- Cartographer proposal: approve ----------------
  if (kind === 'proposal') {
    await setProposalStatus(body.proposalId, 'recruited');
    await writeAuditEntry(
      user, 'approve_proposal', 'proposal', body.proposalId,
      `Approved Cartographer proposal ${body.proposalId} (status → recruited)`,
    );
    return NextResponse.json({ ok: true });
  }

  // ---------------- Cartographer proposal: dismiss ----------------
  if (kind === 'dismiss-proposal') {
    await setProposalStatus(body.proposalId, 'dismissed');
    await writeAuditEntry(
      user, 'dismiss_proposal', 'proposal', body.proposalId,
      `Dismissed Cartographer proposal ${body.proposalId}`,
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown kind' }, { status: 400 });
}
