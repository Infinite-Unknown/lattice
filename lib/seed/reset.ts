/**
 * Destructive reset: wipes every Firestore collection AND every Firebase
 * Auth user, then provisions four root accounts with deliberately
 * different example ecosystems so the demo can show variety.
 *
 *   jeff@gmail.com  · password 01234567  · 'Hack Garage Accelerator' (small healthy)
 *   bob@gmail.com   · password 01234567  · 'Sunrise Ventures' (escalated mentorship)
 *   larry@gmail.com · password 01234567  · 'UTM Innovation Hub' (dormant partner)
 *   billy@gmail.com · password 01234567  · 'Malaysia Tech Ecosystem' (showcase tenant)
 *
 * The first three are intentionally small (6 entities each). Billy's is
 * the showcase tenant — 12 entities populated with recognisable Malaysian
 * names (MDEC, 42KL, Sunway iLabs, APU, GDG KL, Carsome, Aerodyne) wired
 * together so the graph reads as a real ecosystem map.
 *
 *   npm run reset
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { upsertActor } from '@/lib/data/actors';
import { upsertRelationship } from '@/lib/data/relationships';
import { upsertOutcome } from '@/lib/data/outcomes';
import { upsertAccount } from '@/lib/data/accounts';
import { upsertUser } from '@/lib/data/users';
import { syntheticEmailForIam } from '@/lib/auth/identity';
import type { Account, User, Role } from '@/lib/auth/types';
import type { Actor, Relationship, Outcome } from '@/lib/types';

const COLLECTIONS = [
  'accounts', 'users', 'actors', 'relationships',
  'proposals', 'outcomes', 'todos', 'audit_log',
];

async function wipeCollection(name: string): Promise<number> {
  const db = getAdminDb();
  const snap = await db.collection(name).get();
  if (snap.empty) return 0;
  // Firestore batch cap is 500 — chunk in 400s.
  let deleted = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    for (const doc of snap.docs.slice(i, i + 400)) batch.delete(doc.ref);
    await batch.commit();
    deleted += Math.min(400, snap.docs.length - i);
  }
  return deleted;
}

async function wipeFirestore() {
  console.log('Wiping Firestore collections…');
  for (const name of COLLECTIONS) {
    const count = await wipeCollection(name);
    console.log(`  ${name}: deleted ${count} doc(s)`);
  }
}

async function wipeAuthUsers() {
  console.log('Wiping Firebase Auth users…');
  const auth = getAdminAuth();
  let pageToken: string | undefined;
  let total = 0;
  do {
    const res = await auth.listUsers(1000, pageToken);
    if (res.users.length > 0) {
      await auth.deleteUsers(res.users.map(u => u.uid));
      total += res.users.length;
    }
    pageToken = res.pageToken;
  } while (pageToken);
  console.log(`  deleted ${total} auth user(s)`);
}

// ---------- shared helpers for seed data ----------

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();
const monthsAgo = (n: number) => new Date(Date.now() - n * 30 * 86400_000).toISOString();

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

function newAccountId(slug: string): string {
  return `acc_${slug}${Math.random().toString(36).slice(2, 5)}`;
}

// ---------- root creation ----------

async function createRoot(email: string, password: string, name: string, accountName: string): Promise<Account> {
  const auth = getAdminAuth();
  const firebaseUser = await auth.createUser({
    email, password, displayName: name, emailVerified: false,
  });
  const accountId = newAccountId(accountName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, ''));
  const createdAt = now();
  const account: Account = {
    id: accountId,
    name: accountName,
    root_user_id: firebaseUser.uid,
    created_at: createdAt,
  };
  const user: User = {
    id: firebaseUser.uid,
    account_id: accountId,
    type: 'root',
    email,
    firebase_email: email,
    name,
    role: 'root',
    created_at: createdAt,
    last_login: null,
  };
  await upsertAccount(account);
  await upsertUser(user);
  await auth.setCustomUserClaims(firebaseUser.uid, {
    role: 'root', account_id: accountId, type: 'root',
  });
  console.log(`  ${email} → ${accountName} (${accountId})`);
  return account;
}

/**
 * Provision an IAM user under an existing account. Mirrors the logic in
 * /api/iam/users POST: mint a Firebase Auth user with a synthetic email
 * (since IAM users have no real email), write the user doc, set custom
 * claims so the ID token carries role + account_id.
 */
async function createIam(
  accountId: string,
  username: string,
  name: string,
  password: string,
  role: Role,
): Promise<void> {
  const auth = getAdminAuth();
  const firebaseEmail = syntheticEmailForIam(accountId, username);
  const firebaseUser = await auth.createUser({
    email: firebaseEmail,
    password,
    displayName: name,
    emailVerified: false,
  });
  const createdAt = now();
  const user: User = {
    id: firebaseUser.uid,
    account_id: accountId,
    type: 'iam',
    username,
    firebase_email: firebaseEmail,
    name,
    role,
    created_at: createdAt,
    last_login: null,
  };
  await upsertUser(user);
  await auth.setCustomUserClaims(firebaseUser.uid, { role, account_id: accountId, type: 'iam' });
  console.log(`    + IAM @${username} (${role}) · ${name}`);
}

// ---------- per-tenant ecosystems ----------

type Bundle = { actors: Actor[]; relationships: Relationship[]; outcomes: Outcome[] };

function ecosystemForJeff(accountId: string): Bundle {
  // Hack Garage Accelerator — a tight, healthy startup accelerator.
  // Story: two mentors actively running two companies, one company in
  // the programme, everyone making progress.
  const a: Actor[] = [
    { id: 'jeff_m1', account_id: accountId, type: 'mentor', name: 'Sarah Chen',
      profile: { bio: 'Ex-Stripe APAC growth lead, 10y operator' },
      expertise: ['fintech', 'b2b-saas', 'growth'],
      capacity: { allocated_units: 2, max_units: 5 }, status: 'active', created_at: monthsAgo(8) },
    { id: 'jeff_m2', account_id: accountId, type: 'mentor', name: 'Marcus Tan',
      profile: { bio: 'Consumer marketplaces operator (ex-Grab)' },
      expertise: ['consumer', 'marketplace', 'paid-acq'],
      capacity: { allocated_units: 1, max_units: 4 }, status: 'active', created_at: monthsAgo(6) },
    { id: 'jeff_c1', account_id: accountId, type: 'company', name: 'Pulse',
      profile: { stage: 'seed', sector: 'fintech', focus: 'B2B payments' },
      expertise: ['fintech', 'b2b-saas'],
      capacity: { allocated_units: 2, max_units: 3 }, status: 'active', created_at: monthsAgo(5) },
    { id: 'jeff_c2', account_id: accountId, type: 'company', name: 'Brewly',
      profile: { stage: 'pre-seed', sector: 'consumer', focus: 'Specialty coffee marketplace' },
      expertise: ['consumer', 'marketplace'],
      capacity: { allocated_units: 1, max_units: 3 }, status: 'active', created_at: monthsAgo(3) },
    { id: 'jeff_p1', account_id: accountId, type: 'programme', name: 'Hack Garage Spring 2026',
      profile: { sector: 'general', stage: 'seed' },
      expertise: ['seed-accelerator'],
      capacity: { allocated_units: 1, max_units: 12 }, status: 'active', created_at: monthsAgo(4) },
    { id: 'jeff_pt1', account_id: accountId, type: 'partner', name: 'Maybank Innovation',
      profile: { type: 'corporate-investor' },
      expertise: ['corp-investor', 'fintech'],
      capacity: { allocated_units: 0, max_units: 8 }, status: 'active', created_at: monthsAgo(7) },
  ];
  const r: Relationship[] = [
    { id: 'jeff_r1', account_id: accountId, type: 'mentorship',
      parties: ['jeff_m1', 'jeff_c1'], state: 'active',
      focus: ['fintech', 'gtm'], cadence: 'bi-weekly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Sarah is helping Pulse refine their pricing model for the seed round.' },
      steward_log: [], outcomes: ['jeff_o1', 'jeff_o2'],
      created_at: monthsAgo(3), last_steward_run: null },
    { id: 'jeff_r2', account_id: accountId, type: 'mentorship',
      parties: ['jeff_m2', 'jeff_c2'], state: 'active',
      focus: ['consumer', 'paid-acq'], cadence: 'weekly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Marcus helping Brewly with paid acquisition. Strong early traction.' },
      steward_log: [], outcomes: ['jeff_o3', 'jeff_o4'],
      created_at: monthsAgo(2), last_steward_run: null },
    { id: 'jeff_r3', account_id: accountId, type: 'company_in_programme',
      parties: ['jeff_c1', 'jeff_p1'], state: 'active',
      focus: ['fintech', 'seed-round'], cadence: 'monthly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Pulse is in the Spring 2026 cohort, raising seed.' },
      steward_log: [], outcomes: ['jeff_o5'],
      created_at: monthsAgo(2), last_steward_run: null },
  ];
  const o: Outcome[] = [
    { id: 'jeff_o1', account_id: accountId, relationship_id: 'jeff_r1', type: 'session_held',
      evidence_text: 'Pricing review session. Sarah recommended moving from per-seat to per-transaction. Pulse to draft revised model.',
      source: 'admin', verified: true, timestamp: daysAgo(14) },
    { id: 'jeff_o2', account_id: accountId, relationship_id: 'jeff_r1', type: 'milestone',
      evidence_text: 'Pulse closed first $40k MRR enterprise contract with a regional bank. Sarah introduced the warm lead.',
      source: 'admin', verified: true, timestamp: daysAgo(5) },
    { id: 'jeff_o3', account_id: accountId, relationship_id: 'jeff_r2', type: 'session_held',
      evidence_text: 'Reviewed paid-acquisition funnel. CAC at RM 18, LTV at RM 110. Healthy ratio for consumer.',
      source: 'admin', verified: true, timestamp: daysAgo(10) },
    { id: 'jeff_o4', account_id: accountId, relationship_id: 'jeff_r2', type: 'intro_made',
      evidence_text: 'Marcus introduced Brewly to a former Grab marketplace ops lead for a hiring conversation.',
      source: 'admin', verified: true, timestamp: daysAgo(3) },
    { id: 'jeff_o5', account_id: accountId, relationship_id: 'jeff_r3', type: 'milestone',
      evidence_text: 'Pulse completed Spring 2026 cohort midpoint review. Track to graduate with seed round closed.',
      source: 'admin', verified: true, timestamp: daysAgo(7) },
  ];
  return { actors: a, relationships: r, outcomes: o };
}

function ecosystemForBob(accountId: string): Bundle {
  // Sunrise Ventures — a corporate VC focused on climate. The story
  // here has one ESCALATED relationship so the demo can show how
  // Lattice surfaces a struggling pairing.
  const a: Actor[] = [
    { id: 'bob_m1', account_id: accountId, type: 'mentor', name: 'Diana Wong',
      profile: { bio: 'Deeptech VC partner, 15y in semiconductors' },
      expertise: ['deeptech', 'hardware', 'series-a'],
      capacity: { allocated_units: 2, max_units: 5 }, status: 'active', created_at: monthsAgo(12) },
    { id: 'bob_m2', account_id: accountId, type: 'mentor', name: 'Raj Mehta',
      profile: { bio: 'Climate tech operator, ex-Tesla energy' },
      expertise: ['climate', 'hardware', 'energy'],
      capacity: { allocated_units: 3, max_units: 4 }, status: 'active', created_at: monthsAgo(10) },
    { id: 'bob_c1', account_id: accountId, type: 'company', name: 'GridSpark',
      profile: { stage: 'series-a', sector: 'climate', focus: 'Grid-scale battery storage' },
      expertise: ['climate', 'hardware', 'energy'],
      capacity: { allocated_units: 2, max_units: 3 }, status: 'active', created_at: monthsAgo(8) },
    { id: 'bob_c2', account_id: accountId, type: 'company', name: 'QuantumCore',
      profile: { stage: 'seed', sector: 'deeptech', focus: 'Quantum-resistant cryptography' },
      expertise: ['deeptech', 'security'],
      capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(4) },
    { id: 'bob_p1', account_id: accountId, type: 'programme', name: 'Sunrise Climate Cohort',
      profile: { sector: 'climate', stage: 'growth' },
      expertise: ['climate-accelerator'],
      capacity: { allocated_units: 1, max_units: 8 }, status: 'active', created_at: monthsAgo(9) },
    { id: 'bob_pt1', account_id: accountId, type: 'partner', name: 'Tenaga Nasional',
      profile: { type: 'industry-partner' },
      expertise: ['utilities', 'energy', 'grid-infrastructure'],
      capacity: { allocated_units: 1, max_units: 6 }, status: 'active', created_at: monthsAgo(11) },
  ];
  const r: Relationship[] = [
    { id: 'bob_r1', account_id: accountId, type: 'mentorship',
      parties: ['bob_m2', 'bob_c1'], state: 'active',
      focus: ['climate', 'series-a-prep'], cadence: 'bi-weekly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Raj is preparing GridSpark for their Series A. Strong progress.' },
      steward_log: [], outcomes: ['bob_o1', 'bob_o2'],
      created_at: monthsAgo(6), last_steward_run: null },
    { id: 'bob_r2', account_id: accountId, type: 'mentorship',
      parties: ['bob_m1', 'bob_c2'], state: 'escalated',
      focus: ['deeptech', 'commercialization'], cadence: 'bi-weekly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'QuantumCore struggling to find pilot customers. Two missed check-ins.' },
      steward_log: [], outcomes: ['bob_o3', 'bob_o4'],
      created_at: monthsAgo(3), last_steward_run: null },
    { id: 'bob_r3', account_id: accountId, type: 'partner_in_initiative',
      parties: ['bob_pt1', 'bob_c1'], state: 'active',
      focus: ['grid-pilot', 'energy-storage'], cadence: 'monthly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Tenaga is running a paid pilot of GridSpark batteries at a substation.' },
      steward_log: [], outcomes: ['bob_o5'],
      created_at: monthsAgo(5), last_steward_run: null },
  ];
  const o: Outcome[] = [
    { id: 'bob_o1', account_id: accountId, relationship_id: 'bob_r1', type: 'session_held',
      evidence_text: 'Reviewed Series A deck. Raj suggested reframing TAM around grid-firming, not raw storage.',
      source: 'admin', verified: true, timestamp: daysAgo(12) },
    { id: 'bob_o2', account_id: accountId, relationship_id: 'bob_r1', type: 'milestone',
      evidence_text: 'GridSpark signed term sheet from lead investor for $12M Series A.',
      source: 'admin', verified: true, timestamp: daysAgo(2) },
    { id: 'bob_o3', account_id: accountId, relationship_id: 'bob_r2', type: 'session_held',
      evidence_text: 'Diana reviewed pilot pipeline. Two prospects stalled. QuantumCore needs to refine ICP.',
      source: 'admin', verified: true, timestamp: daysAgo(28) },
    { id: 'bob_o4', account_id: accountId, relationship_id: 'bob_r2', type: 'issue',
      evidence_text: 'QuantumCore missed second scheduled check-in. CEO reports founder burnout. Escalating.',
      source: 'admin', verified: true, timestamp: daysAgo(4) },
    { id: 'bob_o5', account_id: accountId, relationship_id: 'bob_r3', type: 'milestone',
      evidence_text: 'Tenaga pilot extended for 6 more months. Adding a second substation.',
      source: 'admin', verified: true, timestamp: daysAgo(15) },
  ];
  return { actors: a, relationships: r, outcomes: o };
}

function ecosystemForLarry(accountId: string): Bundle {
  // UTM Innovation Hub — a university tech-transfer office. The
  // distinguishing story: one DORMANT partner so Cartographer has
  // something interesting to flag if the demo driver runs a scan.
  const a: Actor[] = [
    { id: 'larry_m1', account_id: accountId, type: 'mentor', name: 'Prof. Lim Wei',
      profile: { bio: 'UTM agritech researcher, IP & licensing specialist' },
      expertise: ['agritech', 'research', 'ip-licensing'],
      capacity: { allocated_units: 1, max_units: 3 }, status: 'active', created_at: monthsAgo(18) },
    { id: 'larry_m2', account_id: accountId, type: 'mentor', name: 'Dr. Aisha Karim',
      profile: { bio: 'Commercialization advisor, ex-MaGIC' },
      expertise: ['commercialization', 'go-to-market', 'medtech'],
      capacity: { allocated_units: 1, max_units: 4 }, status: 'active', created_at: monthsAgo(14) },
    { id: 'larry_c1', account_id: accountId, type: 'company', name: 'AgriBot',
      profile: { stage: 'pre-seed', sector: 'agritech', focus: 'Autonomous farm robotics' },
      expertise: ['agritech', 'hardware', 'robotics'],
      capacity: { allocated_units: 1, max_units: 3 }, status: 'active', created_at: monthsAgo(5) },
    { id: 'larry_c2', account_id: accountId, type: 'company', name: 'MedScan',
      profile: { stage: 'seed', sector: 'medtech', focus: 'AI-assisted radiology' },
      expertise: ['medtech', 'ai', 'regulatory'],
      capacity: { allocated_units: 1, max_units: 3 }, status: 'active', created_at: monthsAgo(7) },
    { id: 'larry_p1', account_id: accountId, type: 'programme', name: 'UTM Spinout Programme',
      profile: { sector: 'university-tech-transfer' },
      expertise: ['spinout', 'ip-licensing'],
      capacity: { allocated_units: 1, max_units: 6 }, status: 'active', created_at: monthsAgo(20) },
    { id: 'larry_pt1', account_id: accountId, type: 'partner', name: 'KPMG Malaysia',
      profile: { type: 'service-provider' },
      expertise: ['legal-services', 'accounting', 'audit'],
      capacity: { allocated_units: 0, max_units: 8 }, status: 'active', created_at: monthsAgo(16) }, // dormant
  ];
  const r: Relationship[] = [
    { id: 'larry_r1', account_id: accountId, type: 'mentorship',
      parties: ['larry_m1', 'larry_c1'], state: 'active',
      focus: ['agritech', 'pilot-deployment'], cadence: 'bi-weekly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Prof. Lim guiding AgriBot through their first field deployment.' },
      steward_log: [], outcomes: ['larry_o1', 'larry_o2'],
      created_at: monthsAgo(4), last_steward_run: null },
    { id: 'larry_r2', account_id: accountId, type: 'mentorship',
      parties: ['larry_m2', 'larry_c2'], state: 'active',
      focus: ['regulatory', 'commercialization'], cadence: 'weekly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Aisha is navigating MedScan through MDA medical device approval.' },
      steward_log: [], outcomes: ['larry_o3'],
      created_at: monthsAgo(3), last_steward_run: null },
    { id: 'larry_r3', account_id: accountId, type: 'company_in_programme',
      parties: ['larry_c2', 'larry_p1'], state: 'active',
      focus: ['spinout', 'ip-licensing'], cadence: 'monthly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'MedScan is the latest UTM spinout, licensing core radiology models.' },
      steward_log: [], outcomes: ['larry_o4'],
      created_at: monthsAgo(2), last_steward_run: null },
  ];
  const o: Outcome[] = [
    { id: 'larry_o1', account_id: accountId, relationship_id: 'larry_r1', type: 'session_held',
      evidence_text: 'Field-deployment debrief at the Johor farm. Crop yield up 14% on the test plot.',
      source: 'admin', verified: true, timestamp: daysAgo(20) },
    { id: 'larry_o2', account_id: accountId, relationship_id: 'larry_r1', type: 'milestone',
      evidence_text: 'AgriBot secured pre-seed cheque from MAVCAP after the field results.',
      source: 'admin', verified: true, timestamp: daysAgo(6) },
    { id: 'larry_o3', account_id: accountId, relationship_id: 'larry_r2', type: 'session_held',
      evidence_text: 'Reviewed MDA Class II submission. Two minor revisions needed; resubmit in 3 weeks.',
      source: 'admin', verified: true, timestamp: daysAgo(8) },
    { id: 'larry_o4', account_id: accountId, relationship_id: 'larry_r3', type: 'milestone',
      evidence_text: 'MedScan signed IP licence with UTM. Royalty terms agreed; spinout formally activated.',
      source: 'admin', verified: true, timestamp: daysAgo(30) },
  ];
  return { actors: a, relationships: r, outcomes: o };
}

function ecosystemForBilly(accountId: string): Bundle {
  // 'Malaysia Tech Ecosystem' — the showcase tenant. 12 entities with
  // recognisable Malaysian names (MDEC, 42KL, Sunway iLabs, APU, GDG KL,
  // Carsome, Aerodyne, PolicyStreet, Naluri) and 8 relationships
  // showing how the ecosystem actually connects: government agency runs
  // accelerators, accelerators host startups, partners feed talent in,
  // mentors advise founders. Designed so /graph reads as a map a judge
  // recognises.
  //
  // Built-in demo hooks:
  //   - Cheryl Yeoh is over-allocated (5/4) → Cartographer over_allocation
  //   - APU has zero recent outcomes → Cartographer dormant_partner
  //   - Naluri ↔ Cheryl is ESCALATED so the agents tab shows urgency
  const a: Actor[] = [
    // --- Mentors (3) ---
    { id: 'billy_m1', account_id: accountId, type: 'mentor', name: "Dato' Yasmin Mahmood",
      profile: { bio: 'Ex-CEO of MDEC. Advisor on government grants, regional expansion, regulated industries.' },
      expertise: ['government-relations', 'regional-expansion', 'fintech'],
      capacity: { allocated_units: 2, max_units: 5 }, status: 'active', created_at: monthsAgo(24) },
    { id: 'billy_m2', account_id: accountId, type: 'mentor', name: 'Norman Vanhaecke',
      profile: { bio: 'CEO of Cradle. Seed-stage funding, deal structuring, syndication.' },
      expertise: ['seed-funding', 'deal-structuring', 'venture-debt'],
      capacity: { allocated_units: 2, max_units: 5 }, status: 'active', created_at: monthsAgo(20) },
    { id: 'billy_m3', account_id: accountId, type: 'mentor', name: 'Cheryl Yeoh',
      profile: { bio: 'Ex-founding CEO of MaGIC. Founder coaching, community building, GTM.' },
      expertise: ['founder-coaching', 'community-building', 'go-to-market'],
      capacity: { allocated_units: 5, max_units: 4 }, status: 'active', created_at: monthsAgo(18) }, // over-allocated → cartographer fodder

    // --- Companies (4) ---
    { id: 'billy_c1', account_id: accountId, type: 'company', name: 'Carsome',
      profile: { stage: 'unicorn', sector: 'marketplace', focus: 'Used-car cross-border marketplace, MY/ID/TH/SG' },
      expertise: ['marketplace', 'regional-expansion', 'logistics'],
      capacity: { allocated_units: 1, max_units: 2 }, status: 'active', created_at: monthsAgo(30) },
    { id: 'billy_c2', account_id: accountId, type: 'company', name: 'Aerodyne',
      profile: { stage: 'series-c', sector: 'deeptech', focus: 'Drone-as-a-service for utilities and inspection' },
      expertise: ['deeptech', 'hardware', 'enterprise-saas'],
      capacity: { allocated_units: 1, max_units: 3 }, status: 'active', created_at: monthsAgo(26) },
    { id: 'billy_c3', account_id: accountId, type: 'company', name: 'PolicyStreet',
      profile: { stage: 'series-a', sector: 'insurtech', focus: 'Embedded insurance for marketplaces and gig platforms' },
      expertise: ['insurtech', 'regulatory', 'b2b-saas'],
      capacity: { allocated_units: 2, max_units: 3 }, status: 'active', created_at: monthsAgo(14) },
    { id: 'billy_c4', account_id: accountId, type: 'company', name: 'Naluri',
      profile: { stage: 'seed', sector: 'healthtech', focus: 'Digital health coaching for chronic disease' },
      expertise: ['healthtech', 'b2b-saas', 'behaviour-change'],
      capacity: { allocated_units: 2, max_units: 2 }, status: 'active', created_at: monthsAgo(10) },

    // --- Programmes (3) ---
    { id: 'billy_p1', account_id: accountId, type: 'programme', name: 'MDEC GAIN',
      profile: { sector: 'general', stage: 'growth', focus: 'Global Acceleration & Innovation Network' },
      expertise: ['government-programme', 'regional-expansion'],
      capacity: { allocated_units: 3, max_units: 12 }, status: 'active', created_at: monthsAgo(36) },
    { id: 'billy_p2', account_id: accountId, type: 'programme', name: '42 Kuala Lumpur',
      profile: { sector: 'talent', focus: 'Peer-to-peer coding school; talent pipeline for the ecosystem' },
      expertise: ['talent', 'software-engineering'],
      capacity: { allocated_units: 1, max_units: 8 }, status: 'active', created_at: monthsAgo(28) },
    { id: 'billy_p3', account_id: accountId, type: 'programme', name: 'Sunway iLabs Accelerator',
      profile: { sector: 'general', stage: 'seed', focus: 'Sunway-backed seed accelerator at Sunway University' },
      expertise: ['seed-accelerator', 'university-spinouts'],
      capacity: { allocated_units: 2, max_units: 10 }, status: 'active', created_at: monthsAgo(22) },

    // --- Partners (2) ---
    { id: 'billy_pt1', account_id: accountId, type: 'partner', name: 'APU',
      profile: { type: 'university-partner', focus: 'Asia Pacific University — talent pipeline, joint research' },
      expertise: ['talent-pipeline', 'research', 'computer-science'],
      capacity: { allocated_units: 1, max_units: 8 }, status: 'active', created_at: monthsAgo(20) }, // dormant → cartographer fodder
    { id: 'billy_pt2', account_id: accountId, type: 'partner', name: 'GDG Kuala Lumpur',
      profile: { type: 'developer-community', focus: 'Google Developer Group KL — events, workshops, GDE pipeline' },
      expertise: ['developer-community', 'events', 'cloud'],
      capacity: { allocated_units: 2, max_units: 6 }, status: 'active', created_at: monthsAgo(15) },
  ];

  const r: Relationship[] = [
    // Mentor ↔ company axis (3)
    { id: 'billy_r1', account_id: accountId, type: 'mentorship',
      parties: ['billy_m1', 'billy_c1'], state: 'active',
      focus: ['regional-expansion', 'government-relations'], cadence: 'monthly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: "Yasmin is advising Carsome's expansion into Thailand and Indonesia, navigating each market's used-car regulations." },
      steward_log: [], outcomes: ['billy_o1', 'billy_o2'],
      created_at: monthsAgo(10), last_steward_run: null },
    { id: 'billy_r2', account_id: accountId, type: 'mentorship',
      parties: ['billy_m2', 'billy_c2'], state: 'active',
      focus: ['series-d-prep', 'enterprise-pipeline'], cadence: 'bi-weekly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Norman is helping Aerodyne structure their Series D round and prioritising utility enterprise contracts.' },
      steward_log: [], outcomes: ['billy_o3', 'billy_o4'],
      created_at: monthsAgo(8), last_steward_run: null },
    { id: 'billy_r3', account_id: accountId, type: 'mentorship',
      parties: ['billy_m3', 'billy_c4'], state: 'escalated',
      focus: ['gtm-pivot', 'b2b-pipeline'], cadence: 'weekly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Naluri is mid-pivot from B2C to B2B insurer partnerships. Two months without a closed deal. Cheryl pushing for urgency.' },
      steward_log: [], outcomes: ['billy_o5', 'billy_o6'],
      created_at: monthsAgo(4), last_steward_run: null },

    // Company ↔ programme axis (3)
    { id: 'billy_r4', account_id: accountId, type: 'company_in_programme',
      parties: ['billy_c1', 'billy_p1'], state: 'tapered',
      focus: ['regional-expansion'], cadence: 'quarterly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Carsome is a MDEC GAIN alumni — engagement is now quarterly check-ins only.' },
      steward_log: [], outcomes: ['billy_o7'],
      created_at: monthsAgo(20), last_steward_run: null },
    { id: 'billy_r5', account_id: accountId, type: 'company_in_programme',
      parties: ['billy_c3', 'billy_p3'], state: 'active',
      focus: ['seed-extension', 'go-to-market'], cadence: 'bi-weekly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'PolicyStreet is in the Sunway iLabs Spring 2026 cohort, raising a seed extension.' },
      steward_log: [], outcomes: ['billy_o8'],
      created_at: monthsAgo(3), last_steward_run: null },
    { id: 'billy_r6', account_id: accountId, type: 'company_in_programme',
      parties: ['billy_c4', 'billy_p1'], state: 'active',
      focus: ['regional-expansion', 'b2b-introductions'], cadence: 'monthly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'Naluri joined MDEC GAIN to access B2B insurer introductions across ASEAN.' },
      steward_log: [], outcomes: ['billy_o9'],
      created_at: monthsAgo(2), last_steward_run: null },

    // Partner ↔ programme axis (2) — shows the meta-network
    { id: 'billy_r7', account_id: accountId, type: 'partner_in_initiative',
      parties: ['billy_pt2', 'billy_p1'], state: 'active',
      focus: ['developer-events', 'ecosystem-engagement'], cadence: 'monthly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'GDG KL co-hosts monthly developer events for MDEC GAIN alumni. Steady inflow of mid-career engineers.' },
      steward_log: [], outcomes: ['billy_o10'],
      created_at: monthsAgo(12), last_steward_run: null },
    { id: 'billy_r8', account_id: accountId, type: 'partner_in_initiative',
      parties: ['billy_pt1', 'billy_p2'], state: 'active',
      focus: ['talent-pipeline', 'campus-recruitment'], cadence: 'quarterly',
      escalation_policy: DEFAULT_ESCALATION, sunset_policy: DEFAULT_SUNSET,
      steward_state: { last_run: null, memory_summary: 'APU is the formal university partner for 42KL. No engagement in the last quarter — dormant.' },
      steward_log: [], outcomes: [], // dormant: no outcomes
      created_at: monthsAgo(15), last_steward_run: null },
  ];

  const o: Outcome[] = [
    { id: 'billy_o1', account_id: accountId, relationship_id: 'billy_r1', type: 'session_held',
      evidence_text: 'Quarterly review on the Thailand expansion. Yasmin flagged Thai used-vehicle tax structure as the binding constraint.',
      source: 'admin', verified: true, timestamp: daysAgo(45) },
    { id: 'billy_o2', account_id: accountId, relationship_id: 'billy_r1', type: 'milestone',
      evidence_text: 'Carsome Thailand crossed 10k monthly transactions. Country GM reported the regulatory pathway is now clear.',
      source: 'admin', verified: true, timestamp: daysAgo(12) },
    { id: 'billy_o3', account_id: accountId, relationship_id: 'billy_r2', type: 'session_held',
      evidence_text: 'Series D term-sheet review. Norman recommended skipping the strategic lead and going with a financial sponsor for valuation control.',
      source: 'admin', verified: true, timestamp: daysAgo(18) },
    { id: 'billy_o4', account_id: accountId, relationship_id: 'billy_r2', type: 'intro_made',
      evidence_text: 'Norman introduced Aerodyne to Khazanah Nasional for the Series D anchor conversation.',
      source: 'admin', verified: true, timestamp: daysAgo(7) },
    { id: 'billy_o5', account_id: accountId, relationship_id: 'billy_r3', type: 'session_held',
      evidence_text: 'Pipeline review for the B2B pivot. Three insurer conversations stalled — incumbent ops teams reluctant to integrate.',
      source: 'admin', verified: true, timestamp: daysAgo(38) },
    { id: 'billy_o6', account_id: accountId, relationship_id: 'billy_r3', type: 'issue',
      evidence_text: 'Two missed weekly check-ins. CEO reports founder fatigue and confusion on Q3 priorities. Cheryl escalating.',
      source: 'admin', verified: true, timestamp: daysAgo(5) },
    { id: 'billy_o7', account_id: accountId, relationship_id: 'billy_r4', type: 'milestone',
      evidence_text: 'Carsome announced as a MDEC GAIN flagship alumnus at the annual ecosystem report.',
      source: 'admin', verified: true, timestamp: daysAgo(60) },
    { id: 'billy_o8', account_id: accountId, relationship_id: 'billy_r5', type: 'milestone',
      evidence_text: 'PolicyStreet selected for Sunway iLabs Spring 2026. Cohort kickoff held at Sunway University.',
      source: 'admin', verified: true, timestamp: daysAgo(40) },
    { id: 'billy_o9', account_id: accountId, relationship_id: 'billy_r6', type: 'intro_made',
      evidence_text: 'MDEC introduced Naluri to two ASEAN insurer CIOs. First exploratory call scheduled.',
      source: 'admin', verified: true, timestamp: daysAgo(15) },
    { id: 'billy_o10', account_id: accountId, relationship_id: 'billy_r7', type: 'session_held',
      evidence_text: "GDG KL ran 'Cloud Architecture for Scale-ups' workshop at MDEC headquarters. 47 attendees from 12 GAIN alumni companies.",
      source: 'admin', verified: true, timestamp: daysAgo(22) },
  ];

  return { actors: a, relationships: r, outcomes: o };
}

async function seedBundle(b: Bundle, label: string) {
  for (const a of b.actors) await upsertActor(a);
  for (const r of b.relationships) await upsertRelationship(r);
  for (const o of b.outcomes) await upsertOutcome(o);
  console.log(`  ${label}: ${b.actors.length} entities · ${b.relationships.length} relationships · ${b.outcomes.length} outcomes`);
}

// ---------- main ----------

async function main() {
  console.log('━'.repeat(60));
  console.log('LATTICE RESET — wiping Firestore + Auth, reseeding 3 tenants');
  console.log('━'.repeat(60));

  await wipeAuthUsers();
  await wipeFirestore();

  console.log('\nCreating root users…');
  const jeffAccount  = await createRoot('jeff@gmail.com',  '01234567', 'Jeff',  'Hack Garage Accelerator');
  const bobAccount   = await createRoot('bob@gmail.com',   '01234567', 'Bob',   'Sunrise Ventures');
  const larryAccount = await createRoot('larry@gmail.com', '01234567', 'Larry', 'UTM Innovation Hub');
  const billyAccount = await createRoot('billy@gmail.com', '01234567', 'Billy', 'Malaysia Tech Ecosystem');

  console.log('\nSeeding ecosystems…');
  await seedBundle(ecosystemForJeff(jeffAccount.id),   `Jeff   / ${jeffAccount.name}`);
  await seedBundle(ecosystemForBob(bobAccount.id),     `Bob    / ${bobAccount.name}`);
  await seedBundle(ecosystemForLarry(larryAccount.id), `Larry  / ${larryAccount.name}`);
  await seedBundle(ecosystemForBilly(billyAccount.id), `Billy  / ${billyAccount.name}`);

  // IAM users under Billy's tenant only — the showcase tenant. Names are
  // drawn from the Build with AI 2026 KL participant pack so the demo
  // can show the role gradient (root → admin → approver → viewer) with
  // people judges recognise from the opening keynotes and problem-statement
  // contact card.
  console.log('\nProvisioning IAM users (Billy / Malaysia Tech Ecosystem)…');
  await createIam(billyAccount.id, 'faiz-hassan',  'Faiz Hassan',   '01234567', 'admin');
  await createIam(billyAccount.id, 'jeff-sandhu',  'Jeff Sandhu',   '01234567', 'approver');
  await createIam(billyAccount.id, 'analyst-team', 'Analyst Team',  '01234567', 'viewer');

  console.log('\n━'.repeat(60));
  console.log('DONE. Root sign-ins (email + password):');
  console.log('  jeff@gmail.com  / 01234567  →  Hack Garage Accelerator');
  console.log('  bob@gmail.com   / 01234567  →  Sunrise Ventures');
  console.log('  larry@gmail.com / 01234567  →  UTM Innovation Hub');
  console.log('  billy@gmail.com / 01234567  →  Malaysia Tech Ecosystem ★ showcase');
  console.log('');
  console.log('Billy\'s IAM users (sign in with account name + username + password):');
  console.log('  account: Malaysia Tech Ecosystem');
  console.log('  @faiz-hassan   / 01234567  · admin     (full operational access)');
  console.log('  @jeff-sandhu   / 01234567  · approver  (run agents + approve, no policy edit)');
  console.log('  @analyst-team  / 01234567  · viewer    (read-only)');
  console.log('━'.repeat(60));
}

main().catch(e => { console.error('\nReset failed:', e); process.exit(1); });
