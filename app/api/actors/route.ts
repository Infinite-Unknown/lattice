import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { upsertActor } from '@/lib/data/actors';
import { writeAuditEntry } from '@/lib/data/audit';
import type { Actor, ActorType } from '@/lib/types';

const TYPES: ActorType[] = ['mentor', 'company', 'programme', 'partner'];
const PREFIX: Record<ActorType, string> = {
  mentor: 'm', company: 'c', programme: 'p', partner: 'pt',
};

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await requireUser(['actor.write']);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { type, name, expertise, bio, max_units } = body as Record<string, unknown>;

  if (typeof type !== 'string' || !TYPES.includes(type as ActorType)) {
    return NextResponse.json({ error: `type must be one of: ${TYPES.join(', ')}` }, { status: 400 });
  }
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }
  if (!Array.isArray(expertise)) {
    return NextResponse.json({ error: 'expertise must be an array of strings' }, { status: 400 });
  }
  const maxUnits = Number(max_units);
  if (!Number.isFinite(maxUnits) || maxUnits < 0) {
    return NextResponse.json({ error: 'max_units must be a non-negative number' }, { status: 400 });
  }

  const t = type as ActorType;
  const profile: Record<string, string | string[] | number> = {};
  if (typeof bio === 'string' && bio.trim()) profile.bio = bio.trim();

  const actor: Actor = {
    id: `${PREFIX[t]}_${Math.random().toString(36).slice(2, 8)}`,
    account_id: auth.user.account_id,
    type: t,
    name: name.trim(),
    profile,
    expertise: expertise.map(String).map(s => s.trim()).filter(Boolean),
    capacity: { allocated_units: 0, max_units: maxUnits },
    status: 'active',
    created_at: new Date().toISOString(),
  };
  await upsertActor(actor);
  await writeAuditEntry(
    auth.user, 'create_actor', 'actor', actor.id,
    `Created ${actor.type} '${actor.name}' (id: ${actor.id})`,
  );
  return NextResponse.json({ actor });
}
