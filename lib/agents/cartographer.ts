import { listActors } from '@/lib/data/actors';
import { listRelationships } from '@/lib/data/relationships';
import { getAdminDb } from '@/lib/firebase-admin';
import { upsertProposal } from '@/lib/data/proposals';
import { generateStructured } from '@/lib/gemini';
import { CartographerResponseSchema } from '@/lib/schemas';
import { validateCitations } from './citation-resolver';
import {
  overAllocatedActors, underUtilizedActors, dormantPartners,
  unmetExpertiseDemand, capacityUtilization,
} from './graph-metrics';
import type { Outcome, ProposedRelationship, CartographerGap } from '@/lib/types';

const RESPONSE_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      gap_type: { type: 'string', enum: ['over_allocation','under_utilization','missing_expertise','dormant_partner','programme_bottleneck'] },
      candidate_parties: { type: 'array', items: { type: 'string' } },
      reasoning: { type: 'string' },
      citations: { type: 'array', items: { type: 'string' } },
      expected_impact: { type: 'string' },
      confidence: { type: 'number' },
    },
    required: ['gap_type','candidate_parties','reasoning','citations','expected_impact','confidence'],
  },
};

const VALID_METRICS = new Set([
  'capacity_utilization', 'expertise_coverage', 'dormancy_days',
  'unmet_expertise_demand',
]);

async function listAllOutcomes(): Promise<Outcome[]> {
  const snap = await getAdminDb().collection('outcomes').get();
  return snap.docs.map(d => d.data() as Outcome);
}

export async function runCartographerScan(): Promise<ProposedRelationship[]> {
  const actors = await listActors();
  const rels = await listRelationships();
  const outcomes = await listAllOutcomes();

  const u = capacityUtilization(actors);
  const summary = {
    actors_total: actors.length,
    over_allocated: overAllocatedActors(actors).map(a => ({ id: a.id, name: a.name, utilization: u.get(a.id) })),
    under_utilized: underUtilizedActors(actors).map(a => ({ id: a.id, name: a.name, expertise: a.expertise })),
    dormant_partners: dormantPartners(actors, rels, outcomes).map(a => ({ id: a.id, name: a.name })),
    unmet_expertise: unmetExpertiseDemand(actors, rels),
  };

  const prompt = `You are the Cartographer. You analyse an ecosystem graph and propose new relationships to fill structural gaps.

# Metric summary
${JSON.stringify(summary, null, 2)}

# Task
Return a JSON array of gaps. Each gap must:
- choose a gap_type from: over_allocation, under_utilization, missing_expertise, dormant_partner, programme_bottleneck
- list candidate_parties (actor IDs from the summary)
- include reasoning that cites at least one actor:<id> or metric:<name>
- estimate expected_impact in one sentence
- include a confidence score in [0,1]

Valid metric names: capacity_utilization, expertise_coverage, dormancy_days, unmet_expertise_demand.
Only cite actor IDs that appear in the summary.
Surface at most 5 gaps. Prioritise the most actionable.`;

  const raw = await generateStructured<unknown>(prompt, RESPONSE_SCHEMA);
  const parsed = CartographerResponseSchema.safeParse(raw);
  if (!parsed.success) return [];

  const proposals: ProposedRelationship[] = [];
  for (const g of parsed.data as CartographerGap[]) {
    const cv = await validateCitations(g.citations, VALID_METRICS);
    if (!cv.ok) continue;
    const p: ProposedRelationship = {
      id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'mentorship',
      candidate_parties: g.candidate_parties,
      gap_type: g.gap_type,
      reasoning: g.reasoning,
      citations: g.citations,
      expected_impact: g.expected_impact,
      confidence: g.confidence,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    await upsertProposal(p);
    proposals.push(p);
  }
  return proposals;
}
