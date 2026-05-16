import { NextResponse } from 'next/server';
import {
  getRelationship, upsertRelationship,
  findActiveRelationshipBetween,
} from '@/lib/data/relationships';
import { upsertOutcome } from '@/lib/data/outcomes';
import { getProposal, setProposalRecruited, setProposalStatus } from '@/lib/data/proposals';
import { getActor } from '@/lib/data/actors';
import { requireUser } from '@/lib/auth/current-user';
import { writeAuditEntry } from '@/lib/data/audit';
import { inferRelationshipType, defaultCadenceFor, pickPrincipalPair } from '@/lib/agents/relationship-inference';
import type { Actor, Relationship, RelationshipState, StewardAction } from '@/lib/types';

export const runtime = 'nodejs';

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

const DEFAULT_ESCALATION = `triggers:
  - if: nps_below
    value: 7
    action: notify_admin
  - if: no_outcome_in_days
    value: 30
    action: notify_admin`;

const DEFAULT_SUNSET = `triggers:
  - if: outcome_logged
    value: closing_note
    action: close
  - if: duration_months_exceeds
    value: 12
    action: review`;

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

    const newState = AUTO_STATE_TRANSITION[entry.action];
    const stateChanged = newState && newState !== r.state;
    const prevState = r.state;
    if (stateChanged) r.state = newState!;

    await upsertRelationship(r);

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

    if (stateChanged) {
      await upsertOutcome({
        id: `o_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        relationship_id: r.id,
        type: newState === 'closed' ? 'closing_note' : 'milestone',
        evidence_text: `Auto state transition: ${prevState} → ${newState} (triggered by approved Steward action: ${entry.action})`,
        source: 'admin',
        verified: true,
        timestamp: new Date(Date.now() + 1).toISOString(),
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
  // The big change vs prior: actually create the Relationship if the proposal
  // names two existing actors. Otherwise gracefully fall back to "recruited"
  // and tell the client why.
  if (kind === 'proposal') {
    const proposal = await getProposal(body.proposalId);
    if (!proposal) return NextResponse.json({ error: 'proposal not found' }, { status: 404 });
    if (proposal.status !== 'open') {
      return NextResponse.json({ error: `proposal already ${proposal.status}` }, { status: 409 });
    }

    // Resolve candidate IDs to actor records.
    const resolved = (await Promise.all(proposal.candidate_parties.map(getActor)))
      .filter((a): a is Actor => a !== null);

    let materializedRelationshipId: string | null = null;
    let materializedMessage = '';

    const pair = pickPrincipalPair(resolved);
    if (!pair) {
      materializedMessage = `Marked as recruited — the proposal references ${resolved.length} existing actor(s), need 2 to form a relationship. Form it manually from the Graph page.`;
    } else {
      const [a1, a2] = pair;
      const existing = await findActiveRelationshipBetween(a1.id, a2.id);
      if (existing) {
        materializedMessage = `Marked as recruited — ${a1.name} and ${a2.name} already have an active ${existing.type} relationship (${existing.id}). No duplicate created.`;
      } else {
        const inferredType = inferRelationshipType(a1.type, a2.type);
        const newRel: Relationship = {
          id: `r_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          type: inferredType,
          parties: [a1.id, a2.id],
          state: 'active',
          focus: [],            // admin can fill in via relationship detail
          cadence: defaultCadenceFor(inferredType),
          escalation_policy: DEFAULT_ESCALATION,
          sunset_policy: DEFAULT_SUNSET,
          steward_state: {
            last_run: null,
            memory_summary: `Materialised from Cartographer proposal ${proposal.id} (${proposal.gap_type}): ${proposal.expected_impact}`,
          },
          steward_log: [],
          outcomes: [],
          created_at: now,
          last_steward_run: null,
        };
        await upsertRelationship(newRel);

        // Audit outcome on the new relationship so its timeline starts with provenance.
        await upsertOutcome({
          id: `o_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          relationship_id: newRel.id,
          type: 'milestone',
          evidence_text: `Relationship created from Cartographer proposal ${proposal.id} (gap: ${proposal.gap_type}). Reasoning: ${proposal.reasoning}`,
          source: 'admin',
          verified: true,
          timestamp: now,
        });

        materializedRelationshipId = newRel.id;
        materializedMessage = `Created ${inferredType} between ${a1.name} ↔ ${a2.name} (${newRel.id}).`;

        await writeAuditEntry(
          user, 'create_relationship', 'relationship', newRel.id,
          `Materialised proposal ${proposal.id} → ${inferredType} between ${a1.name} and ${a2.name}`,
        );
      }
    }

    await setProposalRecruited(proposal.id, materializedRelationshipId ?? undefined);

    await writeAuditEntry(
      user, 'approve_proposal', 'proposal', proposal.id,
      materializedRelationshipId
        ? `Approved proposal ${proposal.id} → materialised relationship ${materializedRelationshipId}`
        : `Approved proposal ${proposal.id} → no relationship materialised (${materializedMessage})`,
    );

    return NextResponse.json({
      ok: true,
      materialized: !!materializedRelationshipId,
      relationshipId: materializedRelationshipId,
      message: materializedMessage,
    });
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
