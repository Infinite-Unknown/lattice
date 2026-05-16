import { NextResponse } from 'next/server';
import { updatePolicy } from '@/lib/data/relationships';
import { requireUser } from '@/lib/auth/current-user';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(['policy.write']);
  if ('error' in auth) return auth.error;

  const { escalation_policy, sunset_policy } = await req.json();
  await updatePolicy(params.id, escalation_policy, sunset_policy);
  return NextResponse.json({ ok: true });
}
