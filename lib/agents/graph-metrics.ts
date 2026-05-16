import type { Actor, Outcome, Relationship } from '@/lib/types';

export function capacityUtilization(actors: Actor[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of actors) {
    m.set(a.id, a.capacity.max_units === 0 ? 0 : a.capacity.allocated_units / a.capacity.max_units);
  }
  return m;
}

export function overAllocatedActors(actors: Actor[], threshold = 1.2): Actor[] {
  const u = capacityUtilization(actors);
  return actors.filter(a => (u.get(a.id) ?? 0) > threshold);
}

export function underUtilizedActors(actors: Actor[]): Actor[] {
  const u = capacityUtilization(actors);
  return actors.filter(a =>
    a.type === 'mentor' && a.status === 'active' && (u.get(a.id) ?? 0) === 0 && a.expertise.length > 0,
  );
}

export function expertiseCoverage(actors: Actor[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const a of actors) {
    if (a.type !== 'mentor') continue;
    for (const tag of a.expertise) {
      if (!m.has(tag)) m.set(tag, new Set());
      m.get(tag)!.add(a.id);
    }
  }
  return m;
}

export function monthsSinceLastOutcome(timestamp: string): number {
  const ms = Date.now() - new Date(timestamp).getTime();
  return ms / (30 * 86400_000);
}

export function dormantPartners(actors: Actor[], rels: Relationship[], outcomes: Outcome[], months = 9): Actor[] {
  const partners = actors.filter(a => a.type === 'partner' && a.status === 'active');
  return partners.filter(p => {
    const partnerRels = rels.filter(r => r.parties.includes(p.id));
    if (partnerRels.length === 0) return true;
    const outs = outcomes.filter(o => partnerRels.some(r => r.id === o.relationship_id));
    if (outs.length === 0) return true;
    const latest = outs.map(o => o.timestamp).sort().reverse()[0];
    return monthsSinceLastOutcome(latest) > months;
  });
}

export function unmetExpertiseDemand(actors: Actor[], rels: Relationship[]): Array<{ tag: string; companies: Actor[]; reason: string }> {
  // companies grouped by sector-ish tag in profile
  const cov = expertiseCoverage(actors);
  const companies = actors.filter(a => a.type === 'company');
  const result: Array<{ tag: string; companies: Actor[]; reason: string }> = [];
  // synthesize candidate demand tags by company expertise / sector
  const sectorBuckets = new Map<string, Actor[]>();
  for (const c of companies) {
    for (const tag of c.expertise) {
      if (!sectorBuckets.has(tag)) sectorBuckets.set(tag, []);
      sectorBuckets.get(tag)!.push(c);
    }
  }
  for (const [tag, cs] of sectorBuckets) {
    if (cs.length < 3) continue;
    // is there a specialised mentor tag like "b2b-pricing" or "<tag>-pricing"? check derived needs
    const derivedTag = `${tag}-pricing`;
    if (!cov.has(derivedTag) && !cov.has(tag.replace(/^.*-/, '') + '-pricing')) {
      if (!cov.has('b2b-pricing') && cs.some(c => c.expertise.includes('b2b-saas'))) {
        result.push({ tag: 'b2b-pricing', companies: cs.filter(c => c.expertise.includes('b2b-saas')), reason: `${cs.length} ${tag} companies, no mentor with b2b-pricing` });
      }
    }
  }
  return result;
}
