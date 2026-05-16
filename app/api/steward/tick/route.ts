import { NextResponse } from 'next/server';
import { getRelationship } from '@/lib/data/relationships';
import { runStewardTick } from '@/lib/agents/steward';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { relationshipId } = await req.json();
  if (!relationshipId) return NextResponse.json({ error: 'relationshipId required' }, { status: 400 });
  const r = await getRelationship(relationshipId);
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const entry = await runStewardTick(r);
  return NextResponse.json({ entry });
}
