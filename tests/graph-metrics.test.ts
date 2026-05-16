import { describe, it, expect } from 'vitest';
import {
  capacityUtilization, overAllocatedActors, underUtilizedActors,
  dormantPartners, expertiseCoverage, monthsSinceLastOutcome,
} from '@/lib/agents/graph-metrics';
import type { Actor, Outcome } from '@/lib/types';

const A: Actor[] = [
  { id: 'a1', type: 'mentor', name: 'A', profile: {}, expertise: ['x'], capacity: { allocated_units: 3, max_units: 5 }, status: 'active', created_at: '' },
  { id: 'a2', type: 'mentor', name: 'B', profile: {}, expertise: ['y'], capacity: { allocated_units: 7, max_units: 5 }, status: 'active', created_at: '' },
  { id: 'a3', type: 'mentor', name: 'C', profile: {}, expertise: ['z'], capacity: { allocated_units: 0, max_units: 5 }, status: 'active', created_at: '' },
  { id: 'p1', type: 'partner', name: 'P1', profile: {}, expertise: [], capacity: { allocated_units: 0, max_units: 10 }, status: 'active', created_at: '' },
];

describe('graph metrics', () => {
  it('capacityUtilization returns ratios', () => {
    const u = capacityUtilization(A);
    expect(u.get('a1')).toBeCloseTo(0.6);
    expect(u.get('a2')).toBeCloseTo(1.4);
    expect(u.get('a3')).toBeCloseTo(0);
  });

  it('overAllocatedActors flags > 1.2 utilization', () => {
    expect(overAllocatedActors(A).map(a => a.id)).toEqual(['a2']);
  });

  it('underUtilizedActors flags mentors at 0% with rare expertise', () => {
    expect(underUtilizedActors(A).map(a => a.id)).toContain('a3');
  });

  it('expertiseCoverage maps expertise tag → set of mentor ids', () => {
    const cov = expertiseCoverage(A);
    expect(cov.get('x')).toEqual(new Set(['a1']));
    expect(cov.get('z')).toEqual(new Set(['a3']));
  });

  it('monthsSinceLastOutcome computes age', () => {
    const ms = monthsSinceLastOutcome(new Date(Date.now() - 60 * 30 * 86400_000).toISOString());
    expect(ms).toBeGreaterThan(58);
  });

  it('dormantPartners flags partners with last outcome older than 9 months', () => {
    const now = Date.now();
    const old = new Date(now - 365 * 86400_000).toISOString();
    const recent = new Date(now - 30 * 86400_000).toISOString();
    const outs: Outcome[] = [
      { id: 'o1', relationship_id: 'rX', type: 'session_held', evidence_text: '', source: 'admin', verified: true, timestamp: old },
    ];
    // partner p1 has only an old outcome -> dormant
    const rels = [{ id: 'rX', parties: ['p1', 'a1'] } as any];
    expect(dormantPartners(A, rels, outs).map(p => p.id)).toContain('p1');
    // add a recent outcome -> not dormant
    outs.push({ id: 'o2', relationship_id: 'rX', type: 'session_held', evidence_text: '', source: 'admin', verified: true, timestamp: recent });
    expect(dormantPartners(A, rels, outs).map(p => p.id)).not.toContain('p1');
  });
});
