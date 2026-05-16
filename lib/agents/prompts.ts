import type { Actor, Relationship, Outcome } from '@/lib/types';

export function buildStewardPrompt(args: {
  relationship: Relationship;
  parties: Actor[];
  recentOutcomes: Outcome[];
  similarPastOutcomes: Outcome[];
}): string {
  const { relationship, parties, recentOutcomes, similarPastOutcomes } = args;
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

# Recent outcomes (last 5)
${recentOutcomes.map(o => `- outcome:${o.id} [${o.type}] ${o.evidence_text} (${o.timestamp})`).join('\n') || '(none)'}

# Similar past outcomes (retrieved by embedding)
${similarPastOutcomes.map(o => `- outcome:${o.id} ${o.evidence_text}`).join('\n') || '(none)'}

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
