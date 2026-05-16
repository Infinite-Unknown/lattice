import { z } from 'zod';

export const StewardActionSchema = z.object({
  action: z.enum([
    'propose-session', 'draft-checkin', 'propose-intro',
    'escalate', 'taper', 'sunset', 'hold',
  ]),
  reasoning: z.string().min(1),
  citations: z.array(z.string().regex(/^(outcome|profile|actor|metric):.+/)).min(1),
  confidence: z.number().min(0).max(1),
});
export type StewardActionParsed = z.infer<typeof StewardActionSchema>;

export const CartographerGapSchema = z.object({
  gap_type: z.enum([
    'over_allocation', 'under_utilization', 'missing_expertise',
    'dormant_partner', 'programme_bottleneck',
  ]),
  candidate_parties: z.array(z.string()),
  reasoning: z.string().min(1),
  citations: z.array(z.string().regex(/^(outcome|profile|actor|metric):.+/)).min(1),
  expected_impact: z.string().min(1),
  confidence: z.number().min(0).max(1),
  // Production auto-materialisation: the model commits to the SHAPE of
  // the relationship it's proposing — focus tags + cadence — so when an
  // admin approves we can stand up the new relationship fully wired
  // without making them fill in defaults manually.
  proposed_focus: z.array(z.string()).optional(),
  proposed_cadence: z.string().optional(),
});
export type CartographerGapParsed = z.infer<typeof CartographerGapSchema>;

export const CartographerResponseSchema = z.array(CartographerGapSchema);
