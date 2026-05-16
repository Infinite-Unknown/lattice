import { getActor } from '@/lib/data/actors';
import { getOutcome } from '@/lib/data/outcomes';

export interface CitationResult { ok: boolean; invalid: string[]; }

export async function validateCitations(
  citations: string[],
  validMetrics: Set<string>,
  accountId: string,
): Promise<CitationResult> {
  const invalid: string[] = [];
  for (const c of citations) {
    const m = c.match(/^(outcome|profile|actor|metric):(.+)$/);
    if (!m) { invalid.push(c); continue; }
    const kind = m[1], rest = m[2];
    if (kind === 'outcome') {
      const o = await getOutcome(rest, accountId);
      if (!o) invalid.push(c);
    } else if (kind === 'actor') {
      const a = await getActor(rest, accountId);
      if (!a) invalid.push(c);
    } else if (kind === 'profile') {
      const [actorId, field] = rest.split('.', 2);
      const a = await getActor(actorId, accountId);
      if (!a || !(field in a.profile)) invalid.push(c);
    } else if (kind === 'metric') {
      if (!validMetrics.has(rest)) invalid.push(c);
    }
  }
  return { ok: invalid.length === 0, invalid };
}
