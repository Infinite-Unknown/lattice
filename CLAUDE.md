# Lattice — context for future Claude sessions

You are picking up an active hackathon project. Read this file first, then dip into
`docs/` as needed.

## What this is, in one sentence

Lattice is an **autonomous ecosystem operations OS** built for the *Build with AI 2026 KL · MyHack* hackathon. It addresses Cradle's problem statement: *"Automating Ecosystem Linkages Instead of Manual Coordination."*

The product turns every linkage in an innovation ecosystem (mentor ↔ founder, company ↔ programme, partner ↔ initiative) into a **first-class AI agent** that proposes its own next action, plus a graph-wide meta-agent that detects structural gaps.

## What's running right now

- Next.js 14 App Router app at `/Users/infinite/Documents/Hackerthons/MyHack 2 (2026) [Manual]/`
- Branch: `master`, ~45 commits, fully buildable (`npx next build` clean)
- Deployed to: not yet (Dockerfile + Cloud Run config ready; never executed)
- Local dev: `npm run dev` on `localhost:3000`

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript strict |
| UI | Tailwind CSS v3 (downgraded from v4 — see `docs/LESSONS_LEARNED.md`) |
| Graph viz | `react-force-graph-2d` (dynamic import, `ssr: false`) |
| Auth | Firebase Auth (HTTP-only session cookies, Admin SDK server-side) |
| Database | Firestore (Admin SDK on server, Web SDK client-only for auth) |
| LLM | Gemini 3.1 via `@google/genai` (model name from env `GEMINI_MODEL`) |
| Embeddings | `gemini-embedding-001` via same SDK |
| Validation | Zod (AI output schemas) |
| Testing | Vitest (TDD on pure logic: schemas, citation resolver, graph metrics) |
| Deploy target | Docker → Cloud Run (`output: 'standalone'`) |

## Where things live

- `app/` — Next.js routes (server components + 'use client' islands)
- `app/api/` — JSON API routes; every mutating route calls `requireUser([perms])`
- `lib/agents/` — Steward + Cartographer (the two AI loops)
- `lib/data/` — Firestore data access layer (one file per collection)
- `lib/auth/` — Firebase Auth wrappers, session cookies, role permissions
- `lib/format.ts` — humaniser for AI-generated content (citation resolution, label prettifying)
- `lib/seed/` — 30 actors / 18 relationships / 50 outcomes — curated to trigger 3 specific Cartographer gaps
- `tests/` — Vitest specs for schemas, citation resolver, graph metrics
- `docs/specs/` — original design spec (`2026-05-16-lattice-design.md`)
- `docs/plans/` — original 15-task implementation plan
- `docs/architecture.md` — current architecture deep-dive (post-build)
- `docs/lessons-learned.md` — pragmatic discoveries
- `docs/goals.md` — Cradle brief → what shipped → what's deferred

## How to run locally

```bash
# 1. Install
npm install

# 2. Configure
cp .env.local.example .env.local
# Fill in:
#   GEMINI_API_KEY              (from https://aistudio.google.com/apikey)
#   GEMINI_MODEL                (defaults to gemini-2.5-pro; user has gemini-3.1-flash-lite)
#   GEMINI_EMBED_MODEL          (defaults to gemini-embedding-001)
#   NEXT_PUBLIC_FIREBASE_*      (web app config from Firebase Console — full 39-char API key)
#   FIREBASE_ADMIN_CREDENTIALS  (service-account JSON, SINGLE-QUOTED, full one line)

# 3. Enable Firebase services (in console)
#    - Authentication → Sign-in method → Email/Password = enabled
#    - Firestore Database → Create database (start in test mode)

# 4. Seed the ecosystem
npm run seed     # writes 30 actors / 18 relationships / 50 outcomes to Firestore

# 5. Run
npm run dev      # localhost:3000

# 6. First-time bootstrap
# Visit / → click "Get started" → create root user
# Then /iam → create some IAM users (admin / approver / viewer) for the demo
```

## What works (current feature set)

**Auth & governance**
- AWS-style identity: 1 Account, 1 Root user, many IAM users with roles
- 4 roles: `root` (full), `admin` (no IAM mgmt), `approver` (run+approve), `viewer` (read-only)
- 11 permissions including `actor.write`, `relationship.write`, `policy.write`, `iam.manage`, etc.
- Server-side enforcement on every mutating route via `requireUser([perms])`
- Audit log of all admin actions at `/audit`

**Agents**
- Steward: per-relationship AI, picks 1 action from a 7-action whitelist
- Cartographer: graph-wide meta-agent, surfaces structural gaps + auto-suggests `proposed_focus` + `proposed_cadence`
- Both gate on: structured-output JSON schema → Zod parse → citation resolver (citations must resolve to real Firestore docs) → confidence gating
- Stewards remember their own last 5 decisions in the prompt (variation across runs)
- Cartographer sees all prior proposals (open/dismissed/recruited) — won't re-propose same gaps

**CRUD**
- `/graph` → + Add actor (modal), click-node-then-form-relationship (contextual flow)
- `/relationships/[id]` → Close / Taper / Reopen state transitions
- Cartographer-approval auto-materialises a Relationship with focus + cadence the model committed to at scan time

**Action queue**
- `/todos` — auto-spawned from approved Steward proposals (propose-session, draft-checkin, propose-intro, escalate)
- Per-todo actions: Mark done, Send via 📧 Email / 📅 Calendar / 💬 Slack (all placeholder modals — real integrations are deferred)

**UI**
- Public landing `/` (chromeless, marketing + sign-in/up CTAs)
- Operational dashboard `/dashboard` (persona chip, stats strip, recent activity, action cards)
- Force-directed graph `/graph` with two-axis edge encoding (hue = type, style = state)
- Inbox `/inbox` with humanised AI output, citation chips, dismiss + approve, persistent modal for Cartographer
- Toasts for Steward decisions, Cartographer dismiss, Todo done/dispatch
- Live Gemini model identifier shown on dashboard for governance transparency

## What's deliberately NOT built

Read `docs/GOALS.md` for the full deferred list. Highlights:
- Real Email/Calendar/Slack dispatch (placeholders only — UI + audit infra ready, plug real API in)
- W3C Verifiable Credentials for outcome verification (roadmap)
- BorderBridge cross-instance portability (roadmap)
- Multi-tenancy (v1 is single Lattice instance = one Account)
- Maker-checker workflow (admin actions execute immediately; RBAC is the safeguard)
- Session origin tracking (IP, UA, geo) — user explicitly deprioritised

## Commit conventions

Conventional commits with detailed bodies. Pattern:
```
feat(scope): short title
fix(scope): short title

Multi-line body explaining what changed, why, edge cases handled.
Often references specific files / line numbers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Last commit: `c6bf213 feat(notifications): contextual toast for every approval/dismissal/mark-done`

## Hackathon timeline context

- Event: Build with AI 2026 KL — MyHack at Sunway University, May 16–17 2026
- Started building: ~9am 16 May
- Submission deadline: 9am 17 May (prelim — Google Form with deck + video + GitHub link)
- Top 10 → final pitch 8 min + 7 min Q&A in afternoon
- Scoring: Technical 40 / Business 40 / Pitch 20 (see `docs/superpowers/specs/2026-05-16-lattice-design.md` §14 for rubric mapping)

## Hard-won gotchas (skim these or you'll re-hit them)

- `.env.local` is loaded by `next dev` automatically, but standalone scripts (e.g. `npm run seed`) need explicit `dotenv.config({ path: '.env.local' })` — already fixed in `lib/seed/seed.ts`.
- IAM user synthetic emails must NOT contain underscores in the hostname part — `acc_xxx` is sanitised to `acc-xxx` before forming the synthetic email. RFC 952/1123. See `lib/auth/identity.ts`.
- Firestore composite indexes — avoid `where(...).orderBy(...)` on different fields. Sort in memory (cheap at hackathon scale). See `lib/data/audit.ts` for the precedent.
- `react-force-graph-2d`'s `ref` doesn't always propagate cleanly through `next/dynamic`. Don't trust `fgRef.current.zoomToFit` — Reset layout uses `key={resetKey}` remount instead, which works reliably.
- Firebase Auth requires Email/Password sign-in method to be enabled in the console before signup will work.
- Next.js needs `export const dynamic = 'force-dynamic'` on any GET API route that calls `getAdminDb()` — otherwise build-time prerender tries to evaluate and fails on missing credentials.

## How to add a new feature (the established pattern)

1. **Schema first** — add Type to `lib/types.ts` if needed
2. **Data layer** — add CRUD to `lib/data/<thing>.ts`
3. **API route** — gate with `requireUser([perms])`, write audit entry on mutations
4. **Permission** — if new, add to `lib/auth/permissions.ts` and `app/AuthContext.tsx` (both have to stay in sync)
5. **UI client component** — `'use client'`, use `useAuth()` hook for gating
6. **Nav link** — add to `app/AppShell.tsx` if needed
7. **Verify** — `npx tsc --noEmit` + `npx next build`
8. **Commit** — descriptive multi-line body

## When in doubt

- Read `docs/architecture.md` for the system shape
- Read `docs/lessons-learned.md` before chasing a bug — it might already be documented
- The original spec is at `docs/specs/2026-05-16-lattice-design.md` (still mostly accurate as of `c6bf213`)
- The user's main feedback loop is the `/inbox` and `/graph` pages — preserve their working state
