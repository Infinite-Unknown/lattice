import type { Actor, Relationship, Outcome, StewardLogEntry, ProposedRelationship } from '@/lib/types';

export function buildStewardPrompt(args: {
  relationship: Relationship;
  parties: Actor[];
  recentOutcomes: Outcome[];
  similarPastOutcomes: Outcome[];
  recentDecisions: StewardLogEntry[];
}): string {
  const { relationship, parties, recentOutcomes, similarPastOutcomes, recentDecisions } = args;

  const recentDecisionsBlock = recentDecisions.length === 0
    ? '(none — this is the first tick for this relationship)'
    : recentDecisions.map(e => {
        const status = e.approved ? 'APPROVED' : e.dismissed ? 'DISMISSED' : 'PENDING';
        const by = e.decided_by_name ? ` by ${e.decided_by_name}` : '';
        return `- [${status}${by}] action=${e.action} (conf ${e.confidence.toFixed(2)}) — ${e.reasoning}`;
      }).join('\n');

  return `You are the Steward for a single ecosystem relationship. Your job is to propose ONE next action.

# Relationship
ID: ${relationship.id}
Type: ${relationship.type}
State: ${relationship.state}
Focus: ${relationship.focus.join(', ')}
Cadence: ${relationship.cadence}
Memory: ${relationship.steward_state.memory_summary}

# Policies
Escalation policy (YAML):
${relationship.escalation_policy}

Sunset policy (YAML):
${relationship.sunset_policy}

# Parties
${parties.map(p => `- ${p.id} (${p.type}): ${p.name}\n  profile: ${JSON.stringify(p.profile)}\n  expertise: ${p.expertise.join(', ')}`).join('\n')}

# Recent outcomes (last 5, newest first)
${recentOutcomes.map(o => `- outcome:${o.id} [${o.type}] ${o.evidence_text} (${o.timestamp})`).join('\n') || '(none)'}

# Similar past outcomes (retrieved by embedding similarity)
${similarPastOutcomes.map(o => `- outcome:${o.id} ${o.evidence_text}`).join('\n') || '(none)'}

# Your own recent decisions on this relationship (newest first, last 5)
${recentDecisionsBlock}

Critical guidance:
- If your most recent decision was APPROVED, the admin agreed with you — pick a DIFFERENT, complementary next step (e.g. if you just proposed a session and it was approved, now propose a check-in afterwards or an intro).
- If your most recent decision was DISMISSED, the admin disagreed — pick a substantively different action; do not re-propose the same thing.
- If your most recent decision was PENDING, the admin hasn't decided yet — DO NOT re-propose the same thing on top; choose 'hold' or a clearly distinct alternative.

# Your task
Pick ONE action from the whitelist and return JSON matching the schema.

Action whitelist:
- propose-session: schedule a working session
- draft-checkin: draft an async check-in to one or both parties
- propose-intro: introduce one of the parties to another actor
- escalate: flag for admin review (use when an escalation policy trigger fires)
- taper: reduce cadence (relationship is winding down)
- sunset: close the relationship (sunset policy trigger fires)
- hold: no action this tick (use sparingly)

Rules:
- reasoning MUST reference at least one citation in the form outcome:<id> or profile:<actor>.<field>.
- Only cite IDs/fields that appear above.
- confidence in [0,1].
- Be concise. Be specific. No filler.`;
}

export function buildCartographerProposalContext(existing: ProposedRelationship[]): string {
  if (existing.length === 0) return '(none — this is the first scan; freely propose any gap.)';
  return existing.map(p => {
    const candidates = p.candidate_parties.join('+');
    return `- [${p.status.toUpperCase()}] gap_type=${p.gap_type}, candidates=${candidates}, reasoning="${p.reasoning.slice(0, 80)}..."`;
  }).join('\n');
}
