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
  account_id: string;
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
  account_id: string;
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
  // Decision metadata (populated when approved or dismissed by an admin)
  dismissed?: boolean;
  decided_by_user_id?: string;
  decided_by_name?: string;
  decided_at?: string;
}

export interface Relationship {
  id: string;
  account_id: string;
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
  account_id: string;
  type: RelationshipType;
  candidate_parties: string[];
  gap_type: GapType;
  reasoning: string;
  citations: string[];
  expected_impact: string;
  confidence: number;
  status: 'open' | 'recruited' | 'dismissed';
  created_at: string;
  // Model-suggested shape — used at approval time to wire up the new
  // relationship without admin needing to set them by hand.
  proposed_focus?: string[];
  proposed_cadence?: string;
  // When approval materialises this proposal into an actual Relationship,
  // we link the two together so the audit trail is complete.
  linked_relationship_id?: string;
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
  proposed_focus?: string[];
  proposed_cadence?: string;
}

// ------------------------------------------------------------------
// Todo — actionable follow-ups created from approved Steward proposals.
// Every approved propose-session / draft-checkin / propose-intro /
// escalate spawns one of these. Lives in its own /todos surface so the
// admin has a single place to actually execute (or notify others to
// execute) the work the AI proposed.
// ------------------------------------------------------------------
export type TodoStatus = 'open' | 'done';
export type DispatchChannel = 'email' | 'calendar' | 'slack';

export interface Todo {
  id: string;
  account_id: string;
  relationship_id: string;
  steward_log_timestamp: string;     // links back to the originating log entry
  action: StewardAction;             // the approved action that spawned this
  title: string;                     // short human-readable summary
  description: string;               // longer — typically the steward's reasoning
  party_names: string[];             // who's involved (cached for display)
  status: TodoStatus;
  created_at: string;
  created_by_user_id: string;
  created_by_name: string;
  completed_at?: string;
  completed_by_name?: string;
  // Dispatch is separate from completion — recording that we notified the
  // parties via a channel doesn't mean the underlying work is done.
  dispatched_via?: DispatchChannel;
  dispatched_at?: string;
  dispatched_by_name?: string;
}
