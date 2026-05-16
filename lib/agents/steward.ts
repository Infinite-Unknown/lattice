import type { Actor, Relationship, Outcome, StewardLogEntry } from '@/lib/types';
import { getActor } from '@/lib/data/actors';
import { listOutcomesFor } from '@/lib/data/outcomes';
import { appendStewardLog } from '@/lib/data/relationships';
import { generateStructured } from '@/lib/gemini';
import { StewardActionSchema } from '@/lib/schemas';
import { validateCitations } from './citation-resolver';
import { buildStewardPrompt } from './prompts';
import { embed, cosine } from '@/lib/embeddings';

const STEWARD_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: ['propose-session','draft-checkin','propose-intro','escalate','taper','sunset','hold'] },
    reasoning: { type: 'string' },
    citations: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number' },
  },
  required: ['action','reasoning','citations','confidence'],
};

const VALID_METRICS = new Set<string>(); // Steward doesn't use metric: citations

export async function runStewardTick(relationship: Relationship, accountId: string): Promise<StewardLogEntry> {
  const partiesRaw = await Promise.all(relationship.parties.map(id => getActor(id, accountId)));
  const parties = partiesRaw.filter((p): p is Actor => p !== null);
  const allOutcomes = await listOutcomesFor(relationship.id, accountId);
  const sorted = allOutcomes.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const recent = sorted.slice(0, 5);

  let similar: Outcome[] = [];
  if (sorted.length > 5) {
    const queryText = `${relationship.focus.join(' ')} ${relationship.steward_state.memory_summary}`;
    const qVec = await embed(queryText);
    const scored: Array<{ o: Outcome; s: number }> = [];
    for (const o of sorted.slice(5, 30)) {
      if (!o.evidence_embedding) {
        const v = await embed(o.evidence_text);
        scored.push({ o, s: cosine(qVec, v) });
      } else {
        scored.push({ o, s: cosine(qVec, o.evidence_embedding) });
      }
    }
    similar = scored.sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.o);
  }

  // Recent decisions = last 5 steward_log entries newest-first, so the agent
  // can see what it just proposed and what the admin did with it.
  const recentDecisions = relationship.steward_log
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5);

  const prompt = buildStewardPrompt({
    relationship, parties,
    recentOutcomes: recent,
    similarPastOutcomes: similar,
    recentDecisions,
  });
  const raw = await generateStructured<unknown>(prompt, STEWARD_RESPONSE_SCHEMA);
  const parsed = StewardActionSchema.safeParse(raw);

  let entry: StewardLogEntry;
  if (!parsed.success) {
    entry = {
      timestamp: new Date().toISOString(),
      action: 'hold', reasoning: 'Schema validation failed; held.',
      citations: ['outcome:none'], confidence: 0, approved: false,
    };
  } else {
    const cv = await validateCitations(parsed.data.citations, VALID_METRICS, accountId);
    if (!cv.ok) {
      entry = {
        timestamp: new Date().toISOString(),
        action: 'hold',
        reasoning: `Unresolved citations: ${cv.invalid.join(', ')}. Held.`,
        citations: parsed.data.citations, confidence: parsed.data.confidence, approved: false,
      };
    } else {
      entry = {
        timestamp: new Date().toISOString(),
        action: parsed.data.action,
        reasoning: parsed.data.reasoning,
        citations: parsed.data.citations,
        confidence: parsed.data.confidence,
        approved: false,
      };
    }
  }
  await appendStewardLog(relationship.id, accountId, entry);
  return entry;
}
