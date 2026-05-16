export type ActorType = 'company' | 'mentor' | 'programme' | 'partner';
export type RelationshipType = 'mentorship' | 'company_in_programme' | 'partner_in_initiative' | 'service_engagement';
export type RelationshipState = 'proposed' | 'active' | 'escalated' | 'tapered' | 'closed';
export type OutcomeType = 'session_held' | 'intro_made' | 'milestone' | 'issue' | 'closing_note';
export type OutcomeSource = 'steward' | 'admin' | 'party';
export type GapType = 'over_allocation' | 'under_utilization' | 'missing_expertise' | 'dormant_partner' | 'programme_bottleneck';
export type StewardAction =
  | 'propose-session' | 'draft-checkin' | 'propose-intro'
  | 'escalate' | 'taper' | 'sunset' | 'hold';

export interface Actor {
  id: string;
  type: ActorType;
  name: string;
  profile: Record<string, string | string[] | number>;
  expertise: string[];
  expertise_embedding?: number[];
  capacity: { allocated_units: number; max_units: number };
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Outcome {
  id: string;
  relationship_id: string;
  type: OutcomeType;
  evidence_text: string;
  evidence_embedding?: number[];
  source: OutcomeSource;
  verified: boolean;
  timestamp: string;
}

export interface StewardLogEntry {
  timestamp: string;
  action: StewardAction;
  reasoning: string;
  citations: string[];
  confidence: number;
  approved: boolean;
}

export interface Relationship {
  id: string;
  type: RelationshipType;
  parties: string[];
  state: RelationshipState;
  focus: string[];
  cadence: string;
  escalation_policy: string;
  sunset_policy: string;
  steward_state: { last_run: string | null; memory_summary: string };
  steward_log: StewardLogEntry[];
  outcomes: string[];
  created_at: string;
  last_steward_run: string | null;
}

export interface ProposedRelationship {
  id: string;
  type: RelationshipType;
  candidate_parties: string[];
  gap_type: GapType;
  reasoning: string;
  citations: string[];
  expected_impact: string;
  confidence: number;
  status: 'open' | 'recruited' | 'dismissed';
  created_at: string;
}

export interface StewardActionResponse {
  action: StewardAction;
  reasoning: string;
  citations: string[];
  confidence: number;
}

export interface CartographerGap {
  gap_type: GapType;
  candidate_parties: string[];
  reasoning: string;
  citations: string[];
  expected_impact: string;
  confidence: number;
}
