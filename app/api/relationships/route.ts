import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { upsertRelationship } from '@/lib/data/relationships';
import { getActor } from '@/lib/data/actors';
import { writeAuditEntry } from '@/lib/data/audit';
import type { Relationship, RelationshipType } from '@/lib/types';

const TYPES: RelationshipType[] = ['mentorship', 'company_in_programme', 'partner_in_initiative', 'service_engagement'];

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

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await requireUser(['relationship.write']);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { type, parties, focus, cadence } = body as Record<string, unknown>;

  if (typeof type !== 'string' || !TYPES.includes(type as RelationshipType)) {
    return NextResponse.json({ error: `type must be one of: ${TYPES.join(', ')}` }, { status: 400 });
  }
  if (!Array.isArray(parties) || parties.length !== 2 || parties.some(p => typeof p !== 'string')) {
    return NextResponse.json({ error: 'parties must be an array of exactly 2 actor IDs' }, { status: 400 });
  }
  if (parties[0] === parties[1]) {
    return NextResponse.json({ error: 'parties must be distinct' }, { status: 400 });
  }

  const [a1, a2] = await Promise.all([getActor(parties[0] as string), getActor(parties[1] as string)]);
  if (!a1 || !a2) {
    return NextResponse.json({ error: 'one or both parties do not exist' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const rel: Relationship = {
    id: `r_${Math.random().toString(36).slice(2, 8)}`,
    type: type as RelationshipType,
    parties: [a1.id, a2.id],
    state: 'active',
    focus: Array.isArray(focus) ? focus.map(String).map(s => s.trim()).filter(Boolean) : [],
    cadence: typeof cadence === 'string' && cadence.trim() ? cadence.trim() : 'as-needed',
    escalation_policy: DEFAULT_ESCALATION,
    sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Newly created relationship — no history yet.' },
    steward_log: [],
    outcomes: [],
    created_at: now,
    last_steward_run: null,
  };
  await upsertRelationship(rel);
  await writeAuditEntry(
    auth.user, 'create_relationship', 'relationship', rel.id,
    `Created ${rel.type} between ${a1.name} ↔ ${a2.name}`,
  );
  return NextResponse.json({ relationship: rel });
}
