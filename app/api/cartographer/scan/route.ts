import { NextResponse } from 'next/server';
import { runCartographerScan } from '@/lib/agents/cartographer';

export const runtime = 'nodejs';

export async function POST() {
  const proposals = await runCartographerScan();
  return NextResponse.json({ proposals });
}
