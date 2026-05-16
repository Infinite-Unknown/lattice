import type { Actor, ActorType, RelationshipType } from '@/lib/types';

/**
 * Pick a sensible Relationship type given two actor types.
 * Falls back to 'service_engagement' for unusual pairings — admin can edit on detail.
 */
export function inferRelationshipType(a: ActorType, b: ActorType): RelationshipType {
  const pair = [a, b].sort().join('+');
  switch (pair) {
    case 'company+mentor':       return 'mentorship';
    case 'company+programme':    return 'company_in_programme';
    case 'partner+programme':    return 'partner_in_initiative';
    case 'company+partner':      return 'service_engagement';
    case 'mentor+partner':       return 'service_engagement';
    case 'mentor+programme':     return 'service_engagement';
    default:                     return 'service_engagement';
  }
}

export function defaultCadenceFor(type: RelationshipType): string {
  switch (type) {
    case 'mentorship':              return 'bi-weekly';
    case 'company_in_programme':    return 'cohort';
    case 'partner_in_initiative':   return 'quarterly';
    case 'service_engagement':      return 'as-needed';
  }
}

/**
 * Given the candidate actor IDs from a Cartographer proposal and the resolved
 * Actor objects, pick the two actors most likely to be the principals.
 *
 * Heuristic: take the first two of distinct types (so we don't end up with
 * mentor+mentor when the proposal also includes a company). Falls back to the
 * first two distinct IDs if every candidate has the same type.
 */
export function pickPrincipalPair(candidates: Actor[]): [Actor, Actor] | null {
  if (candidates.length < 2) return null;
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      if (candidates[i].type !== candidates[j].type) {
        return [candidates[i], candidates[j]];
      }
    }
  }
  return [candidates[0], candidates[1]];
}
