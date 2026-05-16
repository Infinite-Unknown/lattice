<div align="center">

# 🔗 Lattice
### *Relationships that run themselves. An ecosystem that completes itself.*

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14%20App%20Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-3.1%20%2B%20Embeddings-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Firestore-Multi--tenant-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Cloud%20Run-Deploy-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/SDG-9%20Industry%20%26%20Infrastructure-F26A2E?style=flat-square" />
  <img src="https://img.shields.io/badge/SDG-17%20Partnerships-19486A?style=flat-square" />
  <img src="https://img.shields.io/badge/SDG-8%20Decent%20Work-A21942?style=flat-square" />
  <img src="https://img.shields.io/badge/Build%20with%20AI%202026%20KL-MyHack-FF3D00?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Demo%20Ready-success?style=flat-square" />
</p>

---

### Stop coordinating. Start governing.

Innovation ecosystems still depend on manual coordination to verify participants, match mentors, assign companies to programmes, and manage partner linkages. **Lattice turns every one of those linkages into a first-class AI agent** — a Steward that proposes its own next action, grounded in past outcomes and gated by structured citations. A second meta-agent — **Cartographer** — scans the whole graph for structural gaps and proposes new relationships to fill them.

</div>

---

## ✨ Overview

**Lattice** is built for **programme owners and ecosystem administrators** at accelerators, corporate venture arms, university spinout offices, and government agencies like Cradle. We turn manual coordination into governed automation by closing the feedback loop between *what happened* and *what should happen next*:

- **Model** → every linkage is a typed `Relationship` with state, policy, and a memory of past outcomes
- **Observe** → outcomes are appended to the timeline; embeddings retrieve the most relevant prior ones
- **Reason** → per-edge Steward picks one action from a 7-action whitelist, cites every claim
- **Detect** → graph-wide Cartographer surfaces structural gaps the human eye misses
- **Govern** → root-and-IAM RBAC, audit log of every admin action, no AI execution without human approval

> If your accelerator burns operations time tracking mentor-founder pairings in spreadsheets, Lattice replaces the spreadsheet with a **graph of self-running agents** under your governance.

---

## 📊 The Lattice numbers

<div align="center">

|   |  |
|---|---|
| **4** | Relationship types — `mentorship` · `company_in_programme` · `partner_in_initiative` · `service_engagement` |
| **7** | Steward actions — `propose-session` · `draft-checkin` · `propose-intro` · `escalate` · `taper` · `sunset` · `hold` |
| **5** | Cartographer gap classes — `over_allocation` · `under_utilization` · `missing_expertise` · `dormant_partner` · `programme_bottleneck` |
| **0** | Manual coordination needed once a relationship is wired |

</div>

The schema is closed: judges and admins know exactly what the AI can propose. There is no open-ended "Steward decides anything" surface — every action is one of the seven, and every gap is one of the five.

---

## 🧩 Product Components

### 1) 🛰 Steward — per-relationship AI
`lib/agents/steward.ts` · invoked by `POST /api/steward/tick`

Each row in `relationships/` carries its own Steward. On every tick the agent:

| Step | What happens |
|------|-------------|
| **Load** | Pull the relationship doc, both parties, all outcomes |
| **Retrieve** | Top-5 recent outcomes by timestamp; if >5 exist, top-3 by embedding similarity to focus + memory |
| **Recall** | Last 5 of the agent's own decisions and how the admin reacted (approved / dismissed / pending) |
| **Propose** | Gemini 3.1 returns one of 7 actions + reasoning + citations + confidence |
| **Validate** | Zod schema → citation resolver (every claim must cite a real Firestore doc) → confidence floor |
| **Log** | Append a `StewardLogEntry`; admin sees it in the Agents queue |

Steward **proposes**. Nothing executes without an admin approval.

---

### 2) 🗺 Cartographer — graph-wide meta-agent
`lib/agents/cartographer.ts` · invoked by `POST /api/cartographer/scan`

Cartographer reads the entire account: every entity, every relationship, every outcome, every prior proposal. Then it:

1. Computes pure metrics (capacity utilization, dormancy days, unmet expertise demand, programme bottleneck counts)
2. Feeds the metric summary + proposal history to Gemini
3. Surfaces up to 5 structural gaps as `ProposedRelationship` docs
4. Pre-commits a `proposed_focus` + `proposed_cadence` for each, so approval is a single click

Approval **auto-materialises** a new `Relationship` with focus and cadence pre-set. The graph updates immediately.

---

### 3) 🔒 Identity & RBAC — AWS-shaped
`lib/auth/permissions.ts`

| Role | Permissions |
|---|---|
| **Root** | All 11 permissions including `iam.manage` and `seed.run` |
| **Admin** | All except IAM management |
| **Approver** | `steward.run`, `cartographer.run`, `approve.write` — no policy or actor mutation |
| **Viewer** | Read-only |

Server-side enforcement on every mutating route via `requireUser([perms])`. Multi-tenant — one Firebase project can host any number of root accounts; `account_id` is on every query.

---

### 4) 🌐 Force-directed Graph
`app/graph/GraphClient.tsx`

Two-axis edge encoding so each state reads instantly:

| State | Colour | Pattern | Particles |
|---|---|---|---|
| `active` | Type colour | Solid | 2 (flowing) |
| `proposed` | Vermillion override | Long dash | 1 (slow) |
| `escalated` | Red override (unmissable) | Solid thick | 3 (fast) |
| `tapered` | Type colour @ 30% | Dotted | 0 |
| `closed` | Grey ghost | Solid faint | 0 |

Click any node to inspect or edit. Click any edge to open its full Steward log, policy editor, and outcome timeline.

---

## 🚀 Core Value Loop

```mermaid
flowchart LR
    A[Admin adds entities & relationships] --> B[Steward observes each edge]
    B --> C[Steward proposes next action]
    C --> D[Admin approves or dismisses]
    D --> E[Approved action becomes a citable outcome]
    E --> F[Next tick reasons from richer memory]
    F --> B
    G[Cartographer scans whole graph] --> H[Detects structural gaps]
    H --> I[Proposes new relationships]
    I --> D
```

---

## 🧠 Agent Workflow

```mermaid
sequenceDiagram
    participant U as Admin
    participant API as Next.js API
    participant S as Steward
    participant G as Gemini 3.1
    participant FS as Firestore

    U->>API: POST /api/steward/tick {relationshipId}
    API->>FS: Load relationship + parties + outcomes
    API->>FS: Load last 5 Steward decisions
    API->>S: runStewardTick(rel, accountId)
    S->>G: generateStructured(prompt, schema)
    G-->>S: {action, reasoning, citations, confidence}
    S->>S: Zod validate
    S->>S: Citation resolver (every cite must exist)
    S->>FS: Append StewardLogEntry
    API-->>U: Entry surfaces in /agents queue
    U->>API: POST /api/approve {kind: steward-log}
    API->>FS: Mark approved, append outcome, auto-state-transition
    API->>FS: Spawn Todo if action needs follow-up
    API->>FS: Write audit entry
```

---

## 🏗 System Architecture

```mermaid
flowchart TB
    subgraph FE[Frontend Next.js App Router]
        L[Landing /]
        DASH[Dashboard]
        GFX[Force Graph]
        AG[Agents queue]
        TD[Todos]
        AUD[Audit log]
        IAM[IAM mgmt]
    end

    subgraph MW[Middleware]
        COOKIE[Session cookie gate]
    end

    subgraph API[API Routes Node runtime]
        AUTH[Auth: signup/session/me/account]
        ACTORS[/api/actors]
        RELS[/api/relationships]
        TICK[/api/steward/tick]
        SCAN[/api/cartographer/scan]
        APR[/api/approve]
        STATS[/api/stats]
        ADMIN[/api/admin/backfill]
    end

    subgraph AGENTS[Agents]
        ST[Steward]
        CR[Cartographer]
        CIT[Citation resolver]
    end

    subgraph EXT[External]
        FB[Firebase Auth]
        FS[Firestore]
        GM[Gemini 3.1 chat]
        EM[Gemini embedding-001]
    end

    FE --> MW --> API
    API --> FB
    API --> FS
    TICK --> ST --> GM
    SCAN --> CR --> GM
    ST & CR --> CIT --> FS
    APR --> FS
    AGENTS --> EM
```

---

## 🌱 Why This Matters

### The Cradle Problem (from the MyHack 2026 brief)

> Innovation ecosystem platforms still depend on manual coordination to verify participants, match mentors, assign companies to programmes, and manage partner linkages. As ecosystems scale, these relationships remain ad hoc and difficult to reuse, making operations heavy, inconsistent, and hard to extend across geographies and initiatives.

Four pain points the brief identifies:

| Pain | Lattice answer |
|---|---|
| **Complex Actor Networks** | Live force-directed graph; every linkage clickable to its full memory |
| **Everything Is Manual Today** | Per-edge Stewards propose the next action automatically |
| **Growth Amplifies the Pain** | Cartographer detects structural gaps before humans notice |
| **Lost Intelligence** | Every approved outcome is a citable record; next tick retrieves it via embeddings |

### The Solution

Lattice doesn't replace the admin. It compresses their decision surface from *"what should happen across 200 relationships?"* to *"yes / no on a queue of 5 proposed actions."* The AI does the watching. The human keeps governance.

---

## 🌍 SDG Alignment

| Goal | How Lattice contributes |
|---|---|
| **SDG 9 — Industry, Innovation and Infrastructure** | Connective infrastructure for innovation ecosystems that compounds across programmes instead of restarting per cohort |
| **SDG 17 — Partnerships for the Goals** | Relationship-as-entity is multi-stakeholder partnership made programmable, governable, and portable |
| **SDG 8 — Decent Work and Economic Growth** | Better-coordinated ecosystems mean more successful entrepreneurship outcomes per unit of mentor/admin time |

---

## 🧰 Tech Stack

### AI & ML
- **Google Gemini 3.1** — structured-output JSON for both Steward and Cartographer
- **Gemini `embedding-001`** — outcome retrieval, cosine similarity
- **Zod** — runtime schema validation as a second-line defence against shape drift
- **Citation resolver** — every claim must cite a real Firestore doc or a known metric

### Application
- **Next.js 14 App Router** + TypeScript strict
- **Tailwind v3** with custom Bold Typography design system (Inter Tight + Playfair Display + JetBrains Mono)
- **`react-force-graph-2d`** — canvas-based graph with custom node + edge rendering

### Auth & data
- **Firebase Auth** — HTTP-only session cookies, Admin SDK server-side
- **Firestore** — Admin SDK on the server, account-scoped queries (`.where('account_id', '==', accountId)`)
- **Multi-tenant** — one Firebase project can hold many root accounts side by side

### Infrastructure
- **Next.js `output: 'standalone'`** for Docker
- **Google Cloud Run** — single `gcloud run deploy` from this repo
- **`@view-transition`** for smooth route fades; `prefers-reduced-motion` respected per WCAG 2.3.3

---

## ⚙️ Prerequisites

- **Node.js 18+**
- **A Google Cloud project** with Firestore (Native mode) and Firebase Auth enabled
- **Firebase Admin SDK service-account JSON** (one-line, single-quoted in `.env.local`)
- **Gemini API key** (from Google AI Studio)

---

## 🚀 Setup Guide

### 1) Clone + install

```bash
git clone https://github.com/Infinite-Unknown/lattice.git
cd lattice
npm install
```

### 2) Configure environment

Create `.env.local`:

```env
# Gemini
GEMINI_API_KEY=your-google-ai-studio-key
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_EMBED_MODEL=gemini-embedding-001

# Firebase web (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...           # exactly 39 chars
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

# Firebase Admin (single-quoted, one-line JSON)
FIREBASE_ADMIN_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

### 3) Enable Firebase services

- Authentication → Sign-in method → **Email/Password = enabled**
- Firestore Database → Create database (Native mode, test mode for dev)

### 4) Run

```bash
npm run dev
```

Open http://localhost:3000.

### 5) Seed (optional)

`npm run seed` populates an existing account with a small ecosystem fixture. For the prepared 4-tenant demo state with IAM users and the showcase Malaysia ecosystem, see [`DEMO.md`](DEMO.md).

---

## 📦 Repository Structure

```
lattice/
├── app/                                      # Next.js App Router
│   ├── page.tsx, LandingClient.tsx           # Public landing
│   ├── sign-in/, sign-up/                    # Auth pages
│   ├── dashboard/, DashboardClient.tsx       # Stat strip + recent activity
│   ├── graph/                                # Force-directed graph + add/edit entity modals
│   ├── agents/                               # Steward + Cartographer queue
│   ├── todos/                                # Action queue with dispatch placeholders
│   ├── audit/                                # Governance log
│   ├── iam/                                  # IAM user management (root only)
│   ├── relationships/[id]/                   # Per-relationship detail
│   ├── api/                                  # All server routes
│   │   ├── auth/                             # signup, session, me, account, accounts/lookup
│   │   ├── actors/, relationships/           # CRUD + cascade delete
│   │   ├── steward/tick, cartographer/scan   # Agent invocations
│   │   ├── approve, inbox, stats, todos      # Decision queue + read APIs
│   │   ├── iam/users                         # IAM management
│   │   └── admin/backfill                    # One-shot tenant claim for pre-migration data
│   └── components/                           # Modal, Button, Input, LatticeLoader, Skeleton
│
├── lib/
│   ├── agents/                               # Steward, Cartographer, citation resolver, prompts
│   ├── auth/                                 # Permissions, identity, current-user
│   ├── data/                                 # Account-scoped Firestore access (one file per collection)
│   ├── seed/                                 # seed.ts + reset.ts (4-tenant fixture)
│   ├── format.ts                             # humaniseLabel, resolveCitation, rewriteReasoning
│   ├── gemini.ts                             # generateStructured wrapper
│   ├── embeddings.ts                         # embed + cosine
│   ├── schemas.ts                            # Zod schemas for Steward + Cartographer outputs
│   └── types.ts                              # Actor, Relationship, Outcome, ProposedRelationship, Todo
│
├── middleware.ts                             # Session-cookie gate
├── tailwind.config.ts                        # Bold Typography design system
├── tests/                                    # Vitest — schemas, citation-resolver, graph-metrics (19 tests)
└── docs/                                     # Specs + plans + architecture deep-dives
```

---

## 🔄 End-to-End Data Flow

```mermaid
flowchart TD
    A[Admin signs in] --> B[Middleware validates session cookie]
    B --> C[AuthContext loads user + permissions]
    C --> D{Action}

    D -->|View graph| E[GET /api/graph filtered by account_id]
    E --> F[react-force-graph-2d renders nodes + edges]

    D -->|Run Steward tick| G[POST /api/steward/tick]
    G --> H[Gemini structured-output call]
    H --> I[Zod + citation resolver gate]
    I --> J[StewardLogEntry appended]

    D -->|Approve action| K[POST /api/approve]
    K --> L[Outcome appended to timeline]
    K --> M[Auto state transition if taper/sunset/escalate]
    K --> N[Todo auto-spawned for follow-up]
    K --> O[Audit entry written]

    D -->|Run Cartographer| P[POST /api/cartographer/scan]
    P --> Q[Compute metrics over whole graph]
    Q --> R[Gemini proposes up to 5 gaps]
    R --> S[ProposedRelationships persisted]

    D -->|Approve gap| T[Materialise new Relationship]
    T --> M
    T --> O
```

---

## 🧭 Roadmap

```mermaid
timeline
    title Lattice Roadmap
    MyHack MVP : Live ecosystem graph
               : Per-edge Stewards (7-action whitelist)
               : Cartographer (5 gap classes)
               : Multi-tenant Root + IAM
               : Audit log + RBAC
               : Bold Typography redesign
    V1.1 : Real Email / Calendar / Slack dispatch
         : Pre-warmed Gemini cache for instant first-tick
         : Bulk approve + bulk dismiss
         : Auto-run Steward after Cartographer materialises
    V1.2 : W3C Verifiable Credentials on outcomes
         : Maker-checker queue for regulated deployments
         : Field-level RBAC (max_units, capacity)
    V2.0 : BorderBridge — cross-instance relationship portability
         : Mobile companion app
         : White-label for sovereign ecosystems
```

---

## 🏆 What Makes Lattice Different

This is not a CRM with a workflow tab.

| Layer | What we built |
|---|---|
| **Schema** | Relationships are typed first-class entities with their own AI, memory, and policy — not rows in a "matches" table |
| **AI** | Two-tier agent system. Per-edge Stewards reason locally. A graph-wide Cartographer reasons structurally. Both gated by Zod + citation resolution |
| **Anti-hallucination** | Structural, not aspirational — every claim must cite a real Firestore doc; whitelist of 7 actions, 5 gap classes; confidence floor surfaces low-conf calls visibly |
| **Multi-tenant** | One Firebase project hosts many root accounts; every query filtered by `account_id`; backfill endpoint included for pre-migration data |
| **Governance** | Root + IAM with 4 roles and 11 permissions; every admin action recorded in a 14-action audit catalog |
| **UX** | Bold Typography design system, force-directed graph with two-axis edge encoding, mobile hamburger drawer, reduce-motion safe |
| **Deployment** | Single `gcloud run deploy` from this repo. Free-tier-capable at small scale; unit economics in the deck |

---

## 🤝 Team

Built for **Build with AI 2026 KL · MyHack** at Sunway University, May 16–17 2026.

Problem statement: *Automating Ecosystem Linkages Instead of Manual Coordination* — Cradle Fund Sdn Bhd.

Contact for the brief: `faiz.hassan@cradle.com.my`

---

<div align="center">

## 🔗 Stop coordinating. Start governing.
## 🤖 Let the Stewards run the relationships.
## 🗺 Let the Cartographer find the gaps.

**Lattice — Autonomous Ecosystem Operations.**

</div>
