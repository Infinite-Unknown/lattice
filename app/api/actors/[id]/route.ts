import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { getActor, upsertActor } from '@/lib/data/actors';
import { writeAuditEntry } from '@/lib/data/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(['graph.read']);
  if ('error' in auth) return auth.error;

  const actor = await getActor(params.id);
  if (!actor) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ actor });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(['actor.write']);
  if ('error' in auth) return auth.error;

  const existing = await getActor(params.id);
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { name, expertise, bio, max_units } = body as Record<string, unknown>;

  // Type and id are immutable — changing them would corrupt relationship
  // semantics across the rest of the schema.
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
  if (maxUnits < existing.capacity.allocated_units) {
    return NextResponse.json({
      error: `max_units (${maxUnits}) can't be lower than already-allocated (${existing.capacity.allocated_units}). Close or taper a relationship first.`,
    }, { status: 400 });
  }

  const profile: Record<string, string | string[] | number> = { ...existing.profile };
  if (typeof bio === 'string') {
    if (bio.trim()) profile.bio = bio.trim();
    else delete profile.bio;
  }

  const updated = {
    ...existing,
    name: name.trim(),
    profile,
    expertise: expertise.map(String).map(s => s.trim()).filter(Boolean),
    capacity: { ...existing.capacity, max_units: maxUnits },
  };

  await upsertActor(updated);

  // Build a concise audit diff so the log line tells you what actually changed.
  const diffs: string[] = [];
  if (existing.name !== updated.name) diffs.push(`name: '${existing.name}' → '${updated.name}'`);
  if ((existing.profile.bio ?? '') !== (updated.profile.bio ?? '')) diffs.push(`bio updated`);
  if (existing.expertise.join(',') !== updated.expertise.join(',')) {
    diffs.push(`expertise: [${existing.expertise.join(', ')}] → [${updated.expertise.join(', ')}]`);
  }
  if (existing.capacity.max_units !== updated.capacity.max_units) {
    diffs.push(`max_units: ${existing.capacity.max_units} → ${updated.capacity.max_units}`);
  }
  const summary = diffs.length === 0 ? 'no field changes' : diffs.join(' · ');

  await writeAuditEntry(
    auth.user, 'edit_actor', 'actor', updated.id,
    `Edited ${updated.type} '${updated.name}' (${updated.id}): ${summary}`,
  );

  return NextResponse.json({ actor: updated, summary });
}
