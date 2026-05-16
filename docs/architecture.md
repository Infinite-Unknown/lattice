# Lattice — Architecture

Snapshot as of commit `c6bf213` (May 17 2026). Updated post-build, supersedes the brief sketch that used to live here.

---

## 1. Mental model

```
┌──────────────────────────────────────────────────────────────────┐
│                       BROWSER (React, Next.js)                    │
│  /  · /dashboard · /graph · /inbox · /todos · /audit · /iam       │
│       │           │         │        │        │        │          │
│       └───────────┴─────────┴────────┴────────┴────────┘          │
│         all share <AuthProvider> → useAuth() hook                 │
└──────────────────────────────┬───────────────────────────────────┘
                               │ fetch (cookie auth)
┌──────────────────────────────┴───────────────────────────────────┐
│                   NEXT.JS API ROUTES (Node runtime)               │
│  /api/auth/*       /api/iam/users/*       /api/audit              │
│  /api/actors       /api/relationships/*   /api/stats              │
│  /api/steward/tick /api/cartographer/scan /api/approve            │
│  /api/inbox        /api/graph             /api/todos/*            │
└────────┬─────────────────┬──────────────────┬────────────────────┘
         │                 │                  │
    Firebase Admin    Gemini 3.1 (chat)   Gemini embeddings
    Auth + Firestore  (structured output)
```

The browser is a thin presentation layer. All security and AI calls happen server-side. Firebase Web SDK is loaded client-side **only for the sign-in flow** (to mint an idToken that the server exchanges for a session cookie) — never for data reads or writes.

---

## 2. Identity model (AWS-shaped)

```
Account (singleton for v1)
  ├── Root user (one — created at signup, signs in by email)
  └── IAM users (many — created by root, sign in by username)
```

Each user document carries `account_id`, `type ('root' | 'iam')`, and `role ('root' | 'admin' | 'approver' | 'viewer')`. Role maps to a fixed permission set via `lib/auth/permissions.ts`:

| Permission              | root | admin | approver | viewer |
|---|---|---|---|---|
| `graph.read`            | ✓ | ✓ | ✓ | ✓ |
| `inbox.read`            | ✓ | ✓ | ✓ | ✓ |
| `relationship.read`     | ✓ | ✓ | ✓ | ✓ |
| `steward.run`           | ✓ | ✓ | ✓ | ✗ |
| `cartographer.run`      | ✓ | ✓ | ✓ | ✗ |
| `approve.write`         | ✓ | ✓ | ✓ | ✗ |
| `policy.write`          | ✓ | ✓ | ✗ | ✗ |
| `actor.write`           | ✓ | ✓ | ✗ | ✗ |
| `relationship.write`    | ✓ | ✓ | ✗ | ✗ |
| `iam.manage`            | ✓ | ✗ | ✗ | ✗ |
| `seed.run`              | ✓ | ✗ | ✗ | ✗ |

### Session flow

```
client                                              server / Firebase
──────                                              ─────────────────
signInWithEmailAndPassword(email, password)  ──▶  Firebase Auth
    ↓ (success)
firebaseUser.getIdToken()
    ↓
POST /api/auth/session { idToken }            ──▶  Admin.verifyIdToken
                                                   Admin.createSessionCookie
                                                   Set-Cookie: lattice_session=<opaque>
    ↓ (cookie now set)
navigate to /dashboard
    ↓
middleware.ts checks for cookie presence (NOT validity)
    ↓ (passes)
page renders → AuthProvider fetches /api/auth/me
    ↓
  /api/auth/me reads cookie → Admin.verifySessionCookie → User doc → response
```

For IAM users, the synthetic email transform happens client-side before
`signInWithEmailAndPassword`: `aisha-mentor` + account `acc_abc123` →
`aisha-mentor@acc-abc123.lattice.invalid`. See `lib/auth/identity.ts`.

---

## 3. Data model (Firestore collections)

```
accounts/{id}                 Account            id, name, root_user_id, created_at
users/{firebase_uid}          User               id (=uid), account_id, type, role,
                                                 email|username, firebase_email, name,
                                                 created_at, last_login
actors/{id}                   Actor              id, type, name, profile, expertise[],
                                                 capacity {allocated, max}, status,
                                                 created_at
relationships/{id}            Relationship       id, type, parties[2], state, focus[],
                                                 cadence, escalation_policy YAML,
                                                 sunset_policy YAML, steward_state,
                                                 steward_log[StewardLogEntry], outcomes[]
outcomes/{id}                 Outcome            id, relationship_id, type, evidence_text,
                                                 source, verified, timestamp, embedding?
proposals/{id}                ProposedRelationship (Cartographer gaps)
                                                 id, type, candidate_parties[], gap_type,
                                                 reasoning, citations, expected_impact,
                                                 confidence, status, proposed_focus[],
                                                 proposed_cadence, linked_relationship_id?
todos/{id}                    Todo               id, account_id, relationship_id,
                                                 steward_log_timestamp, action, title,
                                                 description, party_names[], status,
                                                 created_by_*, completed_*, dispatched_*
audit_log/{id}                AuditLogEntry      id, timestamp, account_id, actor_*,
                                                 action, target_kind, target_id, details
```

Things deliberately denormalised:
- `Relationship.outcomes[]` — array of outcome IDs (so we can render a timeline without scanning the outcomes collection)
- `Relationship.steward_log[]` — embedded in the relationship doc (not a separate collection — every log entry belongs to exactly one relationship)
- `Todo.party_names[]` — cached actor names (so the /todos page renders without joins)
- `AuditLogEntry.actor_name` + `actor_role` — cached so even revoked users still show meaningful audit trails

---

## 4. The two agents

### Steward (per-relationship)

`lib/agents/steward.ts` · triggered by `POST /api/steward/tick { relationshipId }`

```
1. Load relationship + parties + all outcomes
2. Sort outcomes desc by timestamp → recent = top 5
3. If >5 outcomes: embed query (focus + memory_summary),
   embed older outcomes lazily, cosine-rank, top 3 as similar
4. Pull last 5 steward_log entries (with their decision status) for context
5. Build prompt via buildStewardPrompt() — includes recent decisions block
   that tells the model how to react to its own past proposals
6. Call generateStructured() with Gemini schema:
     { action, reasoning, citations, confidence }
7. Zod-validate the response (StewardActionSchema)
8. Resolve every citation against Firestore (validateCitations)
9. If any layer fails → degrade to a `hold` log entry with reason
10. appendStewardLog() → append the entry; update last_steward_run
```

Output: one StewardLogEntry appended to the relationship's `steward_log[]`.
**Nothing executes automatically.** The entry sits with `approved: false` until an admin acts via `/inbox`.

### Cartographer (graph-wide)

`lib/agents/cartographer.ts` · triggered by `POST /api/cartographer/scan`

```
1. List ALL actors, relationships, outcomes, AND proposals
2. Compute pure metrics (lib/agents/graph-metrics.ts):
   - capacityUtilization per actor
   - overAllocatedActors (>1.2× capacity)
   - underUtilizedActors (mentors at 0% with non-empty expertise)
   - dormantPartners (no outcomes in ≥9 months)
   - unmetExpertiseDemand (clusters of companies + missing mentor tag)
3. Build summary JSON
4. Build proposal-history block via buildCartographerProposalContext()
   — tells the model what's already OPEN / DISMISSED / RECRUITED
5. Prompt Gemini with response schema requiring up to 5 gaps with:
     { gap_type, candidate_parties[], reasoning, citations,
       expected_impact, confidence, proposed_focus[], proposed_cadence }
6. Zod-validate (CartographerResponseSchema)
7. For each gap:
     a. Resolve citations (different valid metric set than Steward)
     b. Reject if isDuplicateOfExisting(g, openProposals) — same gap_type
        + overlapping candidate set as an open proposal
     c. Persist as ProposedRelationship with status='open'
```

Output: 0–5 ProposedRelationships. They appear in `/inbox` Cartographer tab.

### Why both agents have the same anti-hallucination stack

Every AI-generated decision passes through:
1. **Structured output** — Gemini enforces JSON schema server-side
2. **Zod parse** — second-line defence; rejects shape drift
3. **Citation resolver** — every claim must cite a real Firestore doc (or a known metric for Cartographer)
4. **Confidence gating** — values < 0.6 surface as "low-confidence" in the UI
5. **Whitelist enforcement** — only 7 Steward actions, only 5 gap types

If any layer fails, the action degrades to `hold` (Steward) or is dropped (Cartographer). The agents can't take unbounded action.

---

## 5. Approval semantics — what each approval *does*

| What you approve | Server effect |
|---|---|
| Steward `propose-session` / `draft-checkin` / `propose-intro` | Outcome appended to timeline + Todo auto-spawned for follow-up |
| Steward `taper` | State transitions `→ tapered` + outcome appended (no Todo) |
| Steward `sunset` | State transitions `→ closed` + outcome appended (no Todo) |
| Steward `escalate` | State transitions `→ escalated` + outcome appended + Todo for review |
| Steward `hold` | Nothing notable (hold is intentionally inert) |
| Cartographer gap (≥2 resolvable actors, no duplicate) | Relationship materialised: type inferred, focus + cadence from model, default policies, provenance outcome, two audit entries |
| Cartographer gap (no resolvable actors, or duplicate) | Proposal marked `recruited` with explanation; no relationship created |

All paths write an audit log entry (`approve_steward`, `approve_proposal`, plus `create_todo`, `create_relationship`, `auto_state_transition` as applicable).

---

## 6. UI architecture

### Route surfaces

| Route | Type | Auth | Purpose |
|---|---|---|---|
| `/` | Static (public) | none | Landing page (marketing + sign-in CTAs) |
| `/sign-up` | Static (public) | none | Root account bootstrap (one-time) |
| `/sign-in` | Static (public) | none | Root + IAM tabbed sign-in |
| `/dashboard` | Static | required | Operational overview (slim) |
| `/graph` | Static | required | Force-directed graph + CRUD modals |
| `/inbox` | Static | required | Steward proposals + Cartographer gaps |
| `/todos` | Static | required | Auto-spawned action queue |
| `/audit` | Static | required | Governance history |
| `/iam` | Static | required (root only) | IAM user management |
| `/relationships/[id]` | Dynamic | required | Per-relationship detail (timeline, steward log, policy editor) |

### Cross-cutting client utilities

- `app/AuthContext.tsx` — `<AuthProvider>` + `useAuth()` — single source of truth for client-side identity. Exposes `user`, `account`, `permissions`, `loading`, `can()`, `refresh()`, `clear()`.
- `app/AppShell.tsx` — top nav, persona dropdown, sign-out. Auto-hidden on public pages (`/`, `/sign-in`, `/sign-up`). Signs out by clearing context FIRST so no UI flash.
- `app/NavInbox.tsx` + `app/NavTodos.tsx` — nav links with live count badges (poll `/api/stats` every 30s).
- `app/components/Modal.tsx` — keyboard-trapped overlay primitive (used by Add Actor, Add Relationship, Approval Result, Dispatch).
- `app/components/Spinner.tsx` — `animate-spin` SVG for inline button busy states.
- `app/components/CitationChip.tsx` — coloured pill rendering for resolved citations.
- `lib/format.ts` — `humaniseLabel`, `resolveCitation`, `rewriteReasoning` — used on both server (in `/api/inbox`, `/api/relationships/[id]`) and client.

### Server / client boundary

Pages that need any data are 100% client components (`'use client'`) that fetch JSON from `/api/*`. We don't use React Server Components for data because Firestore writes from RSC would require credentialing every render — easier to keep the data plane in API routes and let middleware enforce the cookie gate.

---

## 7. AI output humanisation pipeline

Every AI-generated string passes through two layers before reaching the user:

1. **`rewriteReasoning(text, actorNameById)`** — on the server, replaces:
   - `profile:m1.deals` → `Aisha's deals`
   - `actor:m_xyz` → `Bob`
   - `metric:capacity_utilization` → `capacity utilization`
   - `outcome:o_172` → `outcome #172`
2. **`resolveCitation(c, actorNameById)`** — on the server, returns `{kind, label, id, raw}` for the chip-based citation list rendered below the prose.

Both raw `reasoning` and the resolved `citations` are kept on the wire — audit / future export needs the unhumanised form.

Labels everywhere (gap_type, action, role, etc.) pass through `humaniseLabel()`: `under_utilization` → `Under utilization`, `propose-session` → `Propose session`. Underscores and dashes → spaces, sentence case.

---

## 8. Edge style conventions (graph view)

Two-axis encoding so each state reads instantly:

| State | Colour | Pattern | Width | Particles |
|---|---|---|---|---|
| `active` | Type colour | Solid | 1.6 | 2 (flowing) |
| `proposed` | **Amber** override (signals "needs decision") | Long dash `[8, 4]` | 1.6 | 1 (slow) |
| `escalated` | **Red** override (unmissable) | Solid | 2.6 | 3 (fast) |
| `tapered` | Type colour @ 30% opacity | Dotted `[1, 4]` round caps | 1.0 | 0 |
| `closed` | Grey ghost line | Solid | 0.7 | 0 |

Type colours mirror actor node colours: mentorship=emerald, company-in-programme=amber, partner-in-initiative=pink, service-engagement=blue. See `app/graph/GraphClient.tsx`.

---

## 9. Audit log — what gets recorded

Every state-changing admin action writes an entry to `audit_log/` via `writeAuditEntry(user, action, target_kind, target_id, details)`. Currently 14 action types:

| Action | When |
|---|---|
| `approve_steward` | Steward log entry approved |
| `dismiss_steward` | Steward log entry dismissed |
| `approve_proposal` | Cartographer gap approved (also records linked relationship if materialised) |
| `dismiss_proposal` | Cartographer gap dismissed |
| `auto_state_transition` | Relationship state auto-changed due to approved Steward action |
| `create_actor` | Actor added via /graph |
| `create_relationship` | Relationship created (manual OR auto-materialised from approval) |
| `transition_relationship_state` | Manual state change via relationship detail |
| `edit_policy` | Escalation/sunset YAML edited |
| `create_iam_user` | IAM user provisioned by root |
| `revoke_iam_user` | IAM user revoked by root |
| `create_todo` | Auto-spawned from approved Steward action |
| `complete_todo` | Todo marked done |
| `dispatch_todo` | Todo notified via email/calendar/slack (placeholder) |

`/audit` shows the last 200 entries with action-coloured chips, role-coloured author, and a filter for "agent-related only".

---

## 10. Build, deploy, test

```bash
npx tsc --noEmit                 # type check (must be clean)
npx vitest run                   # 19 tests across 3 files (schemas, citation-resolver, graph-metrics)
npx next build                   # production build
docker build -t lattice .        # multi-stage Dockerfile (deps → builder → runner)
gcloud run deploy lattice --source .   # only needed for prod deploy
```

Cloud Run config: `output: 'standalone'` (see `next.config.mjs`), `ENV HOSTNAME=0.0.0.0`, `PORT=8080`.

---

## 11. The two recurring traps when extending

1. **Don't bypass the data layer.** `lib/data/*` exists so writes go through one place. If a new feature touches Firestore, add the helper there first, then call it from the API route. Don't call `getAdminDb()` from API routes directly (one file already does — `lib/agents/cartographer.ts:listAllOutcomes` — and it's a known minor inconsistency that should be moved).

2. **Don't forget the AuthContext when changing roles.** `lib/auth/permissions.ts` and `app/AuthContext.tsx` both declare the Permission union. Both have to stay in sync — otherwise the client gates against a different set than the server enforces.

---

## 12. Where to look first when something breaks

| Symptom | First file to check |
|---|---|
| Auth flash on sign-out → sign-in | `app/AuthContext.tsx` (clear() + refresh() flow) |
| API returns 401 unexpectedly | `middleware.ts` PUBLIC_PATHS allowlist |
| API returns 403 unexpectedly | `lib/auth/permissions.ts` ROLE_PERMISSIONS map |
| Inbox count != actual rows | `app/api/stats/route.ts` filter must mirror `app/api/inbox/route.ts` filter |
| Build fails on a GET API route | Add `export const dynamic = 'force-dynamic'` |
| Cartographer keeps surfacing the same gap | `lib/agents/cartographer.ts` — check proposal history is being passed |
| Steward gives same answer every tick | `lib/gemini.ts` temperature + Steward prompt's recent-decisions block |
| Audit page 500s | `lib/data/audit.ts` — composite index issue, sort in memory |
| Graph view button does nothing | Don't trust `fgRef.current` through `next/dynamic`; remount via key bump |
