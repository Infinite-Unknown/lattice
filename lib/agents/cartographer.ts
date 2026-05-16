import { listActors } from '@/lib/data/actors';
import { listRelationships } from '@/lib/data/relationships';
import { listAllOutcomes } from '@/lib/data/outcomes';
import { listAllProposals, upsertProposal } from '@/lib/data/proposals';
import { generateStructured } from '@/lib/gemini';
import { CartographerResponseSchema } from '@/lib/schemas';
import { validateCitations } from './citation-resolver';
import { buildCartographerProposalContext } from './prompts';
import {
  overAllocatedActors, underUtilizedActors, dormantPartners,
  unmetExpertiseDemand, capacityUtilization,
} from './graph-metrics';
import type { ProposedRelationship, CartographerGap } from '@/lib/types';

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
      // The model also commits to the shape of the proposed relationship:
      // 2-4 focus tags + a cadence string. Used at approval time to fully
      // wire up the new relationship.
      proposed_focus: { type: 'array', items: { type: 'string' } },
      proposed_cadence: { type: 'string' },
    },
    required: ['gap_type','candidate_parties','reasoning','citations','expected_impact','confidence','proposed_focus','proposed_cadence'],
  },
};

const VALID_METRICS = new Set([
  'capacity_utilization', 'expertise_coverage', 'dormancy_days',
  'unmet_expertise_demand',
]);

// Detect when a newly-proposed gap is effectively a duplicate of one that's
// already in the system (same gap_type + overlapping candidate set).
function isDuplicateOfExisting(g: CartographerGap, existing: ProposedRelationship[]): boolean {
  const gSet = new Set(g.candidate_parties);
  return existing.some(p => {
    if (p.gap_type !== g.gap_type) return false;
    const pSet = new Set(p.candidate_parties);
    // Consider duplicate if any candidate overlaps (we don't want two open
    // "missing fintech-pricing" gaps targeting the same actor).
    for (const id of pSet) if (gSet.has(id)) return true;
    return false;
  });
}

export async function runCartographerScan(accountId: string): Promise<ProposedRelationship[]> {
  const [actors, rels, outcomes, allExistingProposals] = await Promise.all([
    listActors(accountId),
    listRelationships(accountId),
    listAllOutcomes(accountId),
    listAllProposals(accountId),
  ]);

  const u = capacityUtilization(actors);
  const summary = {
    actors_total: actors.length,
    over_allocated: overAllocatedActors(actors).map(a => ({ id: a.id, name: a.name, utilization: u.get(a.id) })),
    under_utilized: underUtilizedActors(actors).map(a => ({ id: a.id, name: a.name, expertise: a.expertise })),
    dormant_partners: dormantPartners(actors, rels, outcomes).map(a => ({ id: a.id, name: a.name })),
    unmet_expertise: unmetExpertiseDemand(actors, rels),
  };

  // Surface what's already been proposed (open / recruited / dismissed) so
  // the model doesn't keep re-suggesting the same gaps every scan.
  const proposalContext = buildCartographerProposalContext(allExistingProposals);

  const prompt = `You are the Cartographer. You analyse an ecosystem graph and propose new relationships to fill structural gaps.

# Metric summary (current snapshot)
${JSON.stringify(summary, null, 2)}

# Previously proposed gaps (across all scans, with their current status)
${proposalContext}

Critical guidance:
- Do NOT re-propose gaps that are currently OPEN — the admin already has them in their inbox.
- Do NOT re-propose gaps that were DISMISSED unless the underlying conditions have materially changed; if you do, explain in reasoning why the situation is meaningfully different now.
- Gaps that were RECRUITED are resolved — only propose adjacent or follow-on gaps.
- Prefer NEW, distinct structural problems over re-stating ones already known.

# Task
Return a JSON array of gaps. Each gap must:
- choose a gap_type from: over_allocation, under_utilization, missing_expertise, dormant_partner, programme_bottleneck
- list candidate_parties (actor IDs from the summary — these stay as IDs)
- include reasoning that uses the entities' READABLE NAMES, not their IDs
- the citations array carries the audit-trail IDs (actor:<id> or metric:<name>)
- estimate expected_impact in one sentence (also using names, not IDs)
- include a confidence score in [0,1]
- propose 2-4 short lowercase focus tags (proposed_focus) that the resulting relationship should pursue, e.g. ['fintech', 'fundraising']
- propose a cadence string (proposed_cadence): one of 'weekly', 'bi-weekly', 'monthly', 'quarterly', or 'as-needed'

Reasoning/expected_impact prose style:
  GOOD: "Cheryl is supporting 5 active mentorships but her capacity cap
         is 4 — pair Pulse with another mentor before she burns out."
  BAD:  "billy_m3 is over-allocated (actor:billy_m3, metric:
         capacity_utilization). Pair billy_c1 with another mentor."

Valid metric names: capacity_utilization, expertise_coverage, dormancy_days, unmet_expertise_demand.
Only cite actor IDs (in the citations array) that appear in the summary.
Surface at most 5 gaps. Prioritise the most actionable AND novel ones.`;

  const raw = await generateStructured<unknown>(prompt, RESPONSE_SCHEMA);
  const parsed = CartographerResponseSchema.safeParse(raw);
  if (!parsed.success) return [];

  // Filter out duplicates of OPEN proposals server-side — the model might
  // ignore the guidance, so we enforce the invariant ourselves.
  const stillOpen = allExistingProposals.filter(p => p.status === 'open');

  const proposals: ProposedRelationship[] = [];
  for (const g of parsed.data as CartographerGap[]) {
    const cv = await validateCitations(g.citations, VALID_METRICS, accountId);
    if (!cv.ok) continue;
    if (isDuplicateOfExisting(g, stillOpen)) continue;
    const p: ProposedRelationship = {
      id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      account_id: accountId,
      type: 'mentorship',
      candidate_parties: g.candidate_parties,
      gap_type: g.gap_type,
      reasoning: g.reasoning,
      citations: g.citations,
      expected_impact: g.expected_impact,
      confidence: g.confidence,
      status: 'open',
      created_at: new Date().toISOString(),
      proposed_focus: g.proposed_focus,
      proposed_cadence: g.proposed_cadence,
    };
    await upsertProposal(p);
    proposals.push(p);
  }
  return proposals;
}
