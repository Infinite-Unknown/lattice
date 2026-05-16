import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { getActor, upsertActor, deleteActor } from '@/lib/data/actors';
import { listRelationships, upsertRelationship } from '@/lib/data/relationships';
import { writeAuditEntry } from '@/lib/data/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(['graph.read']);
  if ('error' in auth) return auth.error;

  const actor = await getActor(params.id, auth.user.account_id);
  if (!actor) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ actor });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(['actor.write']);
  if ('error' in auth) return auth.error;

  const existing = await getActor(params.id, auth.user.account_id);
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

/**
 * Delete an entity. Cascade-closes every relationship that references it so
 * the graph stays consistent (no orphaned edges pointing at a missing node).
 *
 * Two modes:
 *  - GET via this DELETE without confirm: dry-run preview. Returns the
 *    list of relationships that would close, the count, and the entity
 *    name, so the UI can show a precise confirm dialog.
 *  - Real run requires query param `?confirm=true` so an accidental fetch
 *    doesn't nuke an entity. The UI hits it twice: first dry-run for the
 *    confirm preview, then confirm=true to actually delete.
 *
 * State transitions of cascade-closed relationships are appended to their
 * steward_log so the audit trail explains why they closed.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(['actor.write']);
  if ('error' in auth) return auth.error;
  const accountId = auth.user.account_id;

  const actor = await getActor(params.id, accountId);
  if (!actor) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Find every relationship that has this entity as a party — even closed
  // ones, so the preview can give an honest 'will close N, leave M alone' count.
  const allRels = await listRelationships(accountId);
  const touching = allRels.filter(r => r.parties.includes(actor.id));
  const willClose = touching.filter(r => r.state !== 'closed');

  const url = new URL(req.url);
  const confirmed = url.searchParams.get('confirm') === 'true';

  if (!confirmed) {
    return NextResponse.json({
      dryRun: true,
      entity: { id: actor.id, name: actor.name, type: actor.type },
      willCloseCount: willClose.length,
      alreadyClosedCount: touching.length - willClose.length,
      willClose: willClose.map(r => ({
        id: r.id,
        type: r.type,
        state: r.state,
        other_party: r.parties.find(p => p !== actor.id) ?? '?',
      })),
    });
  }

  // Cascade-close every non-closed relationship that references this entity.
  // We don't write a separate audit entry per relationship — one summary
  // entry under transition_relationship_state per closure is enough, and
  // the top-level edit_actor delete entry below captures the why.
  const now = new Date().toISOString();
  for (const r of willClose) {
    r.state = 'closed';
    r.steward_log.push({
      timestamp: now,
      action: 'sunset',
      reasoning: `Auto-closed: entity '${actor.name}' (${actor.id}) was deleted by ${auth.user.name}.`,
      citations: [`actor:${actor.id}`],
      confidence: 1,
      approved: true,
      decided_by_user_id: auth.user.id,
      decided_by_name: auth.user.name,
      decided_at: now,
    });
    await upsertRelationship(r);
  }

  const deleted = await deleteActor(actor.id, accountId);
  if (!deleted) {
    return NextResponse.json({ error: 'delete failed' }, { status: 500 });
  }

  await writeAuditEntry(
    auth.user, 'edit_actor', 'actor', actor.id,
    `DELETED ${actor.type} '${actor.name}' (${actor.id}); cascade-closed ${willClose.length} relationship(s)`,
  );

  return NextResponse.json({
    ok: true,
    deleted: { id: actor.id, name: actor.name, type: actor.type },
    closedCount: willClose.length,
  });
}
