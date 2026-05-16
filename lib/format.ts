/**
 * Humanise machine identifiers + citation strings for UI display.
 *
 * Two layers:
 *  - humaniseLabel('under_utilization') -> 'Under utilization'
 *    Strip snake/kebab case, sentence-case.
 *  - resolveCitation('actor:m_xyz', actorMap) -> { kind, label, id, raw }
 *    Resolve actor IDs to names, fields to natural phrasing, etc.
 *  - rewriteReasoning(text, actorMap)
 *    Inline-replace embedded citation markers inside the model's prose.
 */

export type CitationKind = 'actor' | 'outcome' | 'profile' | 'metric' | 'unknown';

export interface ResolvedCitation {
  kind: CitationKind;
  label: string;
  /** The resolved id / field path (e.g. 'm_xyz' or 'aisha.deals') */
  id: string;
  /** The raw citation string (for tooltips / debugging) */
  raw: string;
}

export function humaniseLabel(s: string): string {
  if (!s) return '';
  const spaced = s.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function resolveCitation(c: string, actorNameById: Map<string, string>): ResolvedCitation {
  const m = c.match(/^(actor|outcome|profile|metric):(.+)$/);
  if (!m) return { kind: 'unknown', label: c, id: c, raw: c };
  const kind = m[1] as CitationKind;
  const rest = m[2];

  if (kind === 'actor') {
    const name = actorNameById.get(rest);
    return { kind, label: name ?? rest, id: rest, raw: c };
  }
  if (kind === 'profile') {
    const [actorId, field] = rest.split('.', 2);
    const name = actorNameById.get(actorId) ?? actorId;
    return { kind, label: `${name} → ${field ?? '?'}`, id: rest, raw: c };
  }
  if (kind === 'metric') {
    return { kind, label: humaniseLabel(rest), id: rest, raw: c };
  }
  if (kind === 'outcome') {
    return { kind, label: `#${rest.replace(/^o_?/, '')}`, id: rest, raw: c };
  }
  return { kind: 'unknown', label: rest, id: rest, raw: c };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace embedded citation markers (and bare entity IDs) inside the model's
 * prose with friendlier forms. The original raw citations are still surfaced
 * separately as chips, so the audit trail is preserved.
 *
 *   "actor:m_xyz is under-utilised"   -> "Bob is under-utilised"
 *   "metric:capacity_utilization"     -> "capacity utilization"
 *   "profile:m1.deals"                -> "Aisha's deals"
 *   "outcome:o172"                    -> "outcome #172"
 *
 * Plus a safety-net pass that swaps any bare actor ID (e.g. `billy_m3`) for
 * the matching name. We tell Gemini to use names in prose via the prompt,
 * but the model occasionally slips back into IDs — this catches that.
 */
export function rewriteReasoning(text: string, actorNameById: Map<string, string>): string {
  if (!text) return text;
  let out = text;

  // profile:<actor>.<field> -> "<name>'s <field>"
  out = out.replace(/profile:([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)/g, (_m, id, field) => {
    const name = actorNameById.get(id) ?? id;
    return `${name}'s ${field}`;
  });

  // actor:<id> -> <name>  (only replaces when we have a name; leaves raw id otherwise)
  out = out.replace(/actor:([A-Za-z0-9_-]+)/g, (_m, id) => actorNameById.get(id) ?? id);

  // metric:<name> -> humanised name (lowercased — sits naturally in prose)
  out = out.replace(/metric:([A-Za-z0-9_-]+)/g, (_m, name) =>
    name.replace(/[_-]+/g, ' ').toLowerCase()
  );

  // outcome:<id> -> "outcome #<short-id>"
  out = out.replace(/outcome:([A-Za-z0-9_-]+)/g, (_m, id) => `outcome #${id.replace(/^o_?/, '')}`);

  // Safety-net: replace bare actor IDs the model leaked into prose without the
  // 'actor:' prefix. Iterate longest-first so 'billy_m12' doesn't get
  // partial-matched by 'billy_m1'. Whole-word boundary so we don't mangle
  // substrings inside other words.
  const idsByLength = Array.from(actorNameById.keys()).sort((a, b) => b.length - a.length);
  for (const id of idsByLength) {
    const name = actorNameById.get(id);
    if (!name) continue;
    out = out.replace(new RegExp(`\\b${escapeRegExp(id)}\\b`, 'g'), name);
  }

  return out;
}
