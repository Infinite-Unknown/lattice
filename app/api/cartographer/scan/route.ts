import { NextResponse } from 'next/server';
import { runCartographerScan } from '@/lib/agents/cartographer';
import { requireUser } from '@/lib/auth/current-user';

export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireUser(['cartographer.run']);
  if ('error' in auth) return auth.error;

  const proposals = await runCartographerScan();
  return NextResponse.json({ proposals });
}
