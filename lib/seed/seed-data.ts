import type { Actor, Relationship, Outcome } from '@/lib/types';

// Seed entities are tenant-agnostic — the seed runner stamps `account_id`
// onto each one at write time so the same fixture can populate any account.
type SeedActor = Omit<Actor, 'account_id'>;
type SeedRelationship = Omit<Relationship, 'account_id'>;
type SeedOutcome = Omit<Outcome, 'account_id'>;

const now = () => new Date().toISOString();
const monthsAgo = (n: number) => new Date(Date.now() - n * 30 * 86400_000).toISOString();

export const SEED_ACTORS: SeedActor[] = [
  // --- Mentors (10) ---
  { id: 'm1', type: 'mentor', name: 'Aisha Rahman', profile: { bio: 'Ex-fintech VP, 12y operator', deals: ['BigPay Series A', 'StashAway seed'] },
    expertise: ['fintech', 'fundraising', 'seed-stage'], capacity: { allocated_units: 3, max_units: 5 }, status: 'active', created_at: monthsAgo(18) },
  { id: 'm2', type: 'mentor', name: 'Ben Tan', profile: { bio: 'SaaS GTM specialist' },
    expertise: ['saas', 'gtm', 'seed-stage'], capacity: { allocated_units: 2, max_units: 5 }, status: 'active', created_at: monthsAgo(15) },
  { id: 'm3', type: 'mentor', name: 'Chong Wei', profile: { bio: 'Deeptech founder, 2 exits' },
    expertise: ['deeptech', 'hardware', 'series-a'], capacity: { allocated_units: 1, max_units: 4 }, status: 'active', created_at: monthsAgo(20) },
  { id: 'm4', type: 'mentor', name: 'Divya Kumar', profile: { bio: 'Brand and design ops' },
    expertise: ['brand', 'design', 'consumer'], capacity: { allocated_units: 4, max_units: 5 }, status: 'active', created_at: monthsAgo(10) },
  { id: 'm5', type: 'mentor', name: 'Ethan Ng', profile: { bio: 'Legal/regulatory specialist' },
    expertise: ['legal', 'regulatory', 'fintech'], capacity: { allocated_units: 7, max_units: 5 }, status: 'active', created_at: monthsAgo(14) }, // over-allocated
  { id: 'm6', type: 'mentor', name: 'Farah Yusoff', profile: { bio: 'Marketplace ops' },
    expertise: ['marketplace', 'ops', 'scale'], capacity: { allocated_units: 2, max_units: 5 }, status: 'active', created_at: monthsAgo(8) },
  { id: 'm7', type: 'mentor', name: 'Gopal Iyer', profile: { bio: 'B2B SaaS pricing/packaging strategist (Stripe alum)' },
    expertise: ['b2b-saas', 'pricing-strategy'], capacity: { allocated_units: 0, max_units: 5 }, status: 'active', created_at: monthsAgo(2) }, // under-utilized
  { id: 'm8', type: 'mentor', name: 'Hana Lim', profile: { bio: 'Healthtech operator' },
    expertise: ['healthtech', 'regulatory'], capacity: { allocated_units: 2, max_units: 5 }, status: 'active', created_at: monthsAgo(11) },
  { id: 'm9', type: 'mentor', name: 'Ivan Goh', profile: { bio: 'Consumer growth' },
    expertise: ['consumer', 'growth', 'paid-acq'], capacity: { allocated_units: 3, max_units: 5 }, status: 'active', created_at: monthsAgo(9) },
  { id: 'm10', type: 'mentor', name: 'Jasmine Wong', profile: { bio: 'Product leader, ex-Grab' },
    expertise: ['product', 'pm', 'south-east-asia'], capacity: { allocated_units: 3, max_units: 5 }, status: 'active', created_at: monthsAgo(13) },

  // --- Companies (12) ---
  { id: 'c1', type: 'company', name: 'PayLane', profile: { stage: 'seed', sector: 'fintech', focus: 'B2B payments' },
    expertise: ['fintech', 'b2b-payments'], capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(7) },
  { id: 'c2', type: 'company', name: 'KreditKita', profile: { stage: 'seed', sector: 'fintech', focus: 'SMB lending' },
    expertise: ['fintech', 'lending'], capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(6) },
  { id: 'c3', type: 'company', name: 'SaverPay', profile: { stage: 'seed', sector: 'fintech', focus: 'B2B SaaS for payroll' },
    expertise: ['fintech', 'b2b-saas'], capacity: { allocated_units: 0, max_units: 2 }, status: 'active', created_at: monthsAgo(5) },
  { id: 'c4', type: 'company', name: 'LedgerLoop', profile: { stage: 'seed', sector: 'fintech', focus: 'B2B accounting SaaS' },
    expertise: ['fintech', 'b2b-saas', 'accounting'], capacity: { allocated_units: 0, max_units: 2 }, status: 'active', created_at: monthsAgo(4) },
  { id: 'c5', type: 'company', name: 'MakanMate', profile: { stage: 'pre-seed', sector: 'consumer', focus: 'food delivery' },
    expertise: ['consumer', 'marketplace'], capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(3) },
  { id: 'c6', type: 'company', name: 'GreenGrid', profile: { stage: 'seed', sector: 'climate', focus: 'grid storage' },
    expertise: ['climate', 'hardware'], capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(8) },
  { id: 'c7', type: 'company', name: 'AyurDoc', profile: { stage: 'seed', sector: 'healthtech', focus: 'telemedicine' },
    expertise: ['healthtech', 'telemed'], capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(9) },
  { id: 'c8', type: 'company', name: 'ShopShop', profile: { stage: 'series-a', sector: 'consumer', focus: 'social commerce' },
    expertise: ['consumer', 'marketplace'], capacity: { allocated_units: 2, max_units: 2 }, status: 'active', created_at: monthsAgo(14) },
  { id: 'c9', type: 'company', name: 'EduBot', profile: { stage: 'seed', sector: 'edtech', focus: 'language learning' },
    expertise: ['edtech', 'consumer'], capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(6) },
  { id: 'c10', type: 'company', name: 'FleetIQ', profile: { stage: 'seed', sector: 'logistics', focus: 'fleet ops' },
    expertise: ['logistics', 'b2b-saas'], capacity: { allocated_units: 0, max_units: 2 }, status: 'active', created_at: monthsAgo(4) },
  { id: 'c11', type: 'company', name: 'HealHaus', profile: { stage: 'pre-seed', sector: 'healthtech', focus: 'mental health' },
    expertise: ['healthtech', 'consumer'], capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(2) },
  { id: 'c12', type: 'company', name: 'AgriX', profile: { stage: 'seed', sector: 'agritech', focus: 'precision farming' },
    expertise: ['agritech', 'hardware'], capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(10) },

  // --- Programmes (4) ---
  { id: 'p1', type: 'programme', name: 'Cradle Catalyst', profile: { sector: 'general', stage: 'seed' },
    expertise: ['seed-funding'], capacity: { allocated_units: 6, max_units: 10 }, status: 'active', created_at: monthsAgo(24) },
  { id: 'p2', type: 'programme', name: 'GDG KL Accelerator', profile: { sector: 'b2b-saas', stage: 'seed' },
    expertise: ['saas-accelerator'], capacity: { allocated_units: 4, max_units: 8 }, status: 'active', created_at: monthsAgo(18) },
  { id: 'p3', type: 'programme', name: 'ClimateBoost', profile: { sector: 'climate', stage: 'seed' },
    expertise: ['climate-accelerator'], capacity: { allocated_units: 1, max_units: 6 }, status: 'active', created_at: monthsAgo(12) },
  { id: 'p4', type: 'programme', name: 'HealthFwd', profile: { sector: 'healthtech', stage: 'all' },
    expertise: ['healthtech-accelerator'], capacity: { allocated_units: 2, max_units: 6 }, status: 'active', created_at: monthsAgo(15) },

  // --- Partners (4) ---
  { id: 'pt1', type: 'partner', name: 'Maybank Ventures', profile: { type: 'corporate-investor' },
    expertise: ['corp-investor', 'fintech'], capacity: { allocated_units: 2, max_units: 10 }, status: 'active', created_at: monthsAgo(20) },
  { id: 'pt2', type: 'partner', name: 'AWS Activate', profile: { type: 'credits-provider' },
    expertise: ['cloud-credits'], capacity: { allocated_units: 8, max_units: 30 }, status: 'active', created_at: monthsAgo(22) },
  { id: 'pt3', type: 'partner', name: 'KPMG Startup Lab', profile: { type: 'service-provider' },
    expertise: ['legal-services', 'accounting'], capacity: { allocated_units: 0, max_units: 10 }, status: 'active', created_at: monthsAgo(14) }, // dormant
  { id: 'pt4', type: 'partner', name: 'MaGIC Alumni Net', profile: { type: 'network' },
    expertise: ['network', 'alumni'], capacity: { allocated_units: 3, max_units: 15 }, status: 'active', created_at: monthsAgo(28) },
];

const DEFAULT_ESCALATION = `triggers:
  - if: nps_below
    value: 7
    action: notify_admin
  - if: no_outcome_in_days
    value: 30
    action: notify_admin`;

const DEFAULT_SUNSET = `triggers:
  - if: outcome_logged
    value: closing_note
    action: close
  - if: duration_months_exceeds
    value: 12
    action: review`;

export const SEED_RELATIONSHIPS: SeedRelationship[] = [
  { id: 'r1', type: 'mentorship', parties: ['m1', 'c1'], state: 'active', focus: ['fintech', 'fundraising'],
    cadence: 'bi-weekly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Series A prep underway' },
    steward_log: [], outcomes: [], created_at: monthsAgo(6), last_steward_run: null },
  { id: 'r2', type: 'mentorship', parties: ['m1', 'c2'], state: 'active', focus: ['lending', 'fundraising'],
    cadence: 'monthly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Recently closed seed' },
    steward_log: [], outcomes: [], created_at: monthsAgo(5), last_steward_run: null },
  { id: 'r3', type: 'mentorship', parties: ['m2', 'c3'], state: 'active', focus: ['saas', 'gtm'],
    cadence: 'bi-weekly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Early traction phase' },
    steward_log: [], outcomes: [], created_at: monthsAgo(4), last_steward_run: null },
  { id: 'r4', type: 'mentorship', parties: ['m3', 'c6'], state: 'active', focus: ['deeptech', 'hardware'],
    cadence: 'monthly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'PoC stage' },
    steward_log: [], outcomes: [], created_at: monthsAgo(7), last_steward_run: null },
  { id: 'r5', type: 'mentorship', parties: ['m4', 'c5'], state: 'active', focus: ['brand', 'design'],
    cadence: 'monthly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Brand refresh' },
    steward_log: [], outcomes: [], created_at: monthsAgo(3), last_steward_run: null },
  { id: 'r6', type: 'mentorship', parties: ['m4', 'c8'], state: 'active', focus: ['brand'],
    cadence: 'monthly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Series A push' },
    steward_log: [], outcomes: [], created_at: monthsAgo(8), last_steward_run: null },
  { id: 'r7', type: 'mentorship', parties: ['m4', 'c11'], state: 'active', focus: ['design'],
    cadence: 'bi-weekly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Early product' },
    steward_log: [], outcomes: [], created_at: monthsAgo(2), last_steward_run: null },
  { id: 'r8', type: 'mentorship', parties: ['m4', 'c9'], state: 'active', focus: ['brand', 'consumer'],
    cadence: 'monthly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'GTM' },
    steward_log: [], outcomes: [], created_at: monthsAgo(6), last_steward_run: null },
  { id: 'r9', type: 'mentorship', parties: ['m5', 'c1'], state: 'active', focus: ['regulatory'],
    cadence: 'monthly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'License application' },
    steward_log: [], outcomes: [], created_at: monthsAgo(5), last_steward_run: null },
  { id: 'r10', type: 'mentorship', parties: ['m5', 'c2'], state: 'active', focus: ['regulatory'],
    cadence: 'monthly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Compliance' },
    steward_log: [], outcomes: [], created_at: monthsAgo(4), last_steward_run: null },
  { id: 'r11', type: 'mentorship', parties: ['m6', 'c8'], state: 'active', focus: ['marketplace', 'scale'],
    cadence: 'bi-weekly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Scaling supply' },
    steward_log: [], outcomes: [], created_at: monthsAgo(7), last_steward_run: null },
  { id: 'r12', type: 'mentorship', parties: ['m8', 'c7'], state: 'active', focus: ['healthtech', 'regulatory'],
    cadence: 'monthly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'MoH approval' },
    steward_log: [], outcomes: [], created_at: monthsAgo(8), last_steward_run: null },
  { id: 'r13', type: 'mentorship', parties: ['m9', 'c5'], state: 'active', focus: ['growth'],
    cadence: 'bi-weekly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Paid acq scaling' },
    steward_log: [], outcomes: [], created_at: monthsAgo(2), last_steward_run: null },
  { id: 'r14', type: 'mentorship', parties: ['m10', 'c9'], state: 'active', focus: ['product'],
    cadence: 'bi-weekly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Roadmap' },
    steward_log: [], outcomes: [], created_at: monthsAgo(5), last_steward_run: null },
  { id: 'r15', type: 'company_in_programme', parties: ['c1', 'p1'], state: 'active', focus: ['seed-funding'],
    cadence: 'cohort', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Mid-programme' },
    steward_log: [], outcomes: [], created_at: monthsAgo(4), last_steward_run: null },
  { id: 'r16', type: 'company_in_programme', parties: ['c6', 'p3'], state: 'active', focus: ['climate'],
    cadence: 'cohort', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Demo day prep' },
    steward_log: [], outcomes: [], created_at: monthsAgo(6), last_steward_run: null },
  { id: 'r17', type: 'partner_in_initiative', parties: ['pt1', 'p1'], state: 'active', focus: ['corp-investor'],
    cadence: 'quarterly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Investor day participant' },
    steward_log: [], outcomes: [], created_at: monthsAgo(10), last_steward_run: null },
  { id: 'r18', type: 'partner_in_initiative', parties: ['pt2', 'p2'], state: 'active', focus: ['cloud-credits'],
    cadence: 'quarterly', escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
    steward_state: { last_run: null, memory_summary: 'Credits distribution' },
    steward_log: [], outcomes: [], created_at: monthsAgo(12), last_steward_run: null },
];

// 50 historical outcomes, distributed across relationships
export const SEED_OUTCOMES: SeedOutcome[] = [
  // r1 (m1-c1) — 5 outcomes
  { id: 'o1', relationship_id: 'r1', type: 'session_held', evidence_text: 'Cap-table review session', source: 'admin', verified: true, timestamp: monthsAgo(5.5) },
  { id: 'o2', relationship_id: 'r1', type: 'milestone', evidence_text: 'PayLane closed $800k pre-seed', source: 'admin', verified: true, timestamp: monthsAgo(4) },
  { id: 'o3', relationship_id: 'r1', type: 'intro_made', evidence_text: 'Intro to Maybank Ventures', source: 'admin', verified: true, timestamp: monthsAgo(3.5) },
  { id: 'o4', relationship_id: 'r1', type: 'session_held', evidence_text: 'Series A deck review', source: 'admin', verified: true, timestamp: monthsAgo(1) },
  { id: 'o5', relationship_id: 'r1', type: 'milestone', evidence_text: 'PayLane Series A target locked', source: 'admin', verified: false, timestamp: monthsAgo(0.5) },
  // r2 (m1-c2) — 4
  { id: 'o6', relationship_id: 'r2', type: 'milestone', evidence_text: 'KreditKita closed seed $1.2M', source: 'admin', verified: true, timestamp: monthsAgo(3) },
  { id: 'o7', relationship_id: 'r2', type: 'session_held', evidence_text: 'Hiring strategy session', source: 'admin', verified: true, timestamp: monthsAgo(2) },
  { id: 'o8', relationship_id: 'r2', type: 'session_held', evidence_text: 'Q1 board prep', source: 'admin', verified: true, timestamp: monthsAgo(1) },
  { id: 'o9', relationship_id: 'r2', type: 'intro_made', evidence_text: 'Intro to compliance counsel', source: 'admin', verified: true, timestamp: monthsAgo(0.5) },
  // r3 (m2-c3) — 3
  { id: 'o10', relationship_id: 'r3', type: 'session_held', evidence_text: 'Pricing workshop', source: 'admin', verified: true, timestamp: monthsAgo(3) },
  { id: 'o11', relationship_id: 'r3', type: 'session_held', evidence_text: 'GTM channel review', source: 'admin', verified: true, timestamp: monthsAgo(2) },
  { id: 'o12', relationship_id: 'r3', type: 'milestone', evidence_text: '10 design partners signed', source: 'admin', verified: true, timestamp: monthsAgo(1) },
  // r4 (m3-c6) — 3
  { id: 'o13', relationship_id: 'r4', type: 'session_held', evidence_text: 'Hardware roadmap critique', source: 'admin', verified: true, timestamp: monthsAgo(5) },
  { id: 'o14', relationship_id: 'r4', type: 'milestone', evidence_text: 'Working PoC delivered to pilot customer', source: 'admin', verified: true, timestamp: monthsAgo(3) },
  { id: 'o15', relationship_id: 'r4', type: 'session_held', evidence_text: 'Supply chain review', source: 'admin', verified: true, timestamp: monthsAgo(1) },
  // r5 (m4-c5) — 2
  { id: 'o16', relationship_id: 'r5', type: 'session_held', evidence_text: 'Brand audit', source: 'admin', verified: true, timestamp: monthsAgo(2.5) },
  { id: 'o17', relationship_id: 'r5', type: 'milestone', evidence_text: 'New brand identity launched', source: 'admin', verified: true, timestamp: monthsAgo(1) },
  // r6 (m4-c8) — 4
  { id: 'o18', relationship_id: 'r6', type: 'session_held', evidence_text: 'Series A narrative review', source: 'admin', verified: true, timestamp: monthsAgo(7) },
  { id: 'o19', relationship_id: 'r6', type: 'milestone', evidence_text: 'ShopShop closed Series A $5M', source: 'admin', verified: true, timestamp: monthsAgo(5) },
  { id: 'o20', relationship_id: 'r6', type: 'session_held', evidence_text: 'Post-raise priorities', source: 'admin', verified: true, timestamp: monthsAgo(4) },
  { id: 'o21', relationship_id: 'r6', type: 'session_held', evidence_text: 'International expansion brief', source: 'admin', verified: true, timestamp: monthsAgo(1) },
  // r7 (m4-c11) — 2
  { id: 'o22', relationship_id: 'r7', type: 'session_held', evidence_text: 'Brand workshop', source: 'admin', verified: true, timestamp: monthsAgo(1.5) },
  { id: 'o23', relationship_id: 'r7', type: 'session_held', evidence_text: 'Onboarding flow review', source: 'admin', verified: true, timestamp: monthsAgo(0.5) },
  // r8 (m4-c9) — 3
  { id: 'o24', relationship_id: 'r8', type: 'session_held', evidence_text: 'Brand strategy', source: 'admin', verified: true, timestamp: monthsAgo(5.5) },
  { id: 'o25', relationship_id: 'r8', type: 'milestone', evidence_text: 'Rebrand complete', source: 'admin', verified: true, timestamp: monthsAgo(3) },
  { id: 'o26', relationship_id: 'r8', type: 'session_held', evidence_text: 'Q3 brand metrics', source: 'admin', verified: true, timestamp: monthsAgo(1) },
  // r9 (m5-c1) — 3
  { id: 'o27', relationship_id: 'r9', type: 'session_held', evidence_text: 'BNM license preparation', source: 'admin', verified: true, timestamp: monthsAgo(4) },
  { id: 'o28', relationship_id: 'r9', type: 'milestone', evidence_text: 'License application submitted', source: 'admin', verified: true, timestamp: monthsAgo(2) },
  { id: 'o29', relationship_id: 'r9', type: 'issue', evidence_text: 'Regulatory delay flagged', source: 'admin', verified: true, timestamp: monthsAgo(0.5) },
  // r10 (m5-c2) — 2
  { id: 'o30', relationship_id: 'r10', type: 'session_held', evidence_text: 'Compliance review', source: 'admin', verified: true, timestamp: monthsAgo(3) },
  { id: 'o31', relationship_id: 'r10', type: 'session_held', evidence_text: 'Lending license deep-dive', source: 'admin', verified: true, timestamp: monthsAgo(1) },
  // r11 (m6-c8) — 3
  { id: 'o32', relationship_id: 'r11', type: 'session_held', evidence_text: 'Supply onboarding playbook', source: 'admin', verified: true, timestamp: monthsAgo(6) },
  { id: 'o33', relationship_id: 'r11', type: 'milestone', evidence_text: 'Supply growth 3× quarter-over-quarter', source: 'admin', verified: true, timestamp: monthsAgo(3) },
  { id: 'o34', relationship_id: 'r11', type: 'session_held', evidence_text: 'Geographic expansion plan', source: 'admin', verified: true, timestamp: monthsAgo(1) },
  // r12 (m8-c7) — 2
  { id: 'o35', relationship_id: 'r12', type: 'session_held', evidence_text: 'MoH conversation prep', source: 'admin', verified: true, timestamp: monthsAgo(6) },
  { id: 'o36', relationship_id: 'r12', type: 'milestone', evidence_text: 'MoH pilot approved', source: 'admin', verified: true, timestamp: monthsAgo(3) },
  // r13 (m9-c5) — 2
  { id: 'o37', relationship_id: 'r13', type: 'session_held', evidence_text: 'Paid acquisition playbook', source: 'admin', verified: true, timestamp: monthsAgo(1.5) },
  { id: 'o38', relationship_id: 'r13', type: 'milestone', evidence_text: 'CAC down 38%', source: 'admin', verified: true, timestamp: monthsAgo(0.5) },
  // r14 (m10-c9) — 2
  { id: 'o39', relationship_id: 'r14', type: 'session_held', evidence_text: 'Product roadmap review', source: 'admin', verified: true, timestamp: monthsAgo(4) },
  { id: 'o40', relationship_id: 'r14', type: 'session_held', evidence_text: 'PM org design', source: 'admin', verified: true, timestamp: monthsAgo(2) },
  // r15 (c1-p1) — 2
  { id: 'o41', relationship_id: 'r15', type: 'milestone', evidence_text: 'PayLane accepted into Catalyst cohort 7', source: 'admin', verified: true, timestamp: monthsAgo(3.5) },
  { id: 'o42', relationship_id: 'r15', type: 'session_held', evidence_text: 'Mid-cohort review', source: 'admin', verified: true, timestamp: monthsAgo(1.5) },
  // r16 (c6-p3) — 2
  { id: 'o43', relationship_id: 'r16', type: 'milestone', evidence_text: 'GreenGrid into ClimateBoost cohort 3', source: 'admin', verified: true, timestamp: monthsAgo(5.5) },
  { id: 'o44', relationship_id: 'r16', type: 'session_held', evidence_text: 'Demo day rehearsal', source: 'admin', verified: true, timestamp: monthsAgo(0.5) },
  // r17 (pt1-p1) — 2
  { id: 'o45', relationship_id: 'r17', type: 'session_held', evidence_text: 'Maybank investor day', source: 'admin', verified: true, timestamp: monthsAgo(9) },
  { id: 'o46', relationship_id: 'r17', type: 'intro_made', evidence_text: 'Maybank introduced to 4 cohort companies', source: 'admin', verified: true, timestamp: monthsAgo(2) },
  // r18 (pt2-p2) — 2
  { id: 'o47', relationship_id: 'r18', type: 'milestone', evidence_text: 'AWS credits delivered to cohort', source: 'admin', verified: true, timestamp: monthsAgo(11) },
  { id: 'o48', relationship_id: 'r18', type: 'milestone', evidence_text: 'Q2 credits refresh', source: 'admin', verified: true, timestamp: monthsAgo(3) },
  // 2 spare
  { id: 'o49', relationship_id: 'r6', type: 'intro_made', evidence_text: 'Intro to Series B angel network', source: 'admin', verified: true, timestamp: monthsAgo(0.3) },
  { id: 'o50', relationship_id: 'r11', type: 'milestone', evidence_text: 'Q4 supply target hit', source: 'admin', verified: true, timestamp: monthsAgo(0.3) },
];
