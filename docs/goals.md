# Lattice — Goals

What we set out to build, what we actually shipped, what we deferred. Maps every line of the Cradle brief to a concrete artifact in the codebase so future sessions can see where each piece lives.

---

## 1. The Cradle brief (verbatim)

**Title:** Automating Ecosystem Linkages Instead of Manual Coordination
**Event:** Build with AI 2026 KL · MyHack · 16–17 May 2026

> Innovation ecosystem platforms still depend on manual coordination to verify
> participants, match mentors, assign companies to programmes, and manage partner
> linkages. As ecosystems scale, these relationships remain ad hoc and difficult to
> reuse, making operations heavy, inconsistent, and hard to extend across
> geographies and initiatives.
>
> How might we build an AI-enabled platform that automates and manages ecosystem
> relationships as **reusable, programmable entities** to improve scalability,
> efficiency, and outcomes?

Cradle's "Why this matters" slide lists four pain points:

1. **Complex Actor Networks** — span companies, mentors, partners, service providers, admins across programmes and regions
2. **Everything Is Manual Today** — verify, match, assign, track — every time from scratch
3. **Growth Amplifies the Pain** — manual coordination becomes operationally heavy at scale
4. **Lost Intelligence** — past engagements never inform future matching

---

## 2. Pain → solution mapping (what shipped)

| Cradle pain | Lattice's answer | Where it lives |
|---|---|---|
| Complex Actor Networks | **Live ecosystem graph** with two-axis edge encoding | `/graph` page + `app/graph/GraphClient.tsx` + `/api/graph` |
| Everything Is Manual Today | **Autonomous Stewards** — per-relationship AI agents that propose the next action | `lib/agents/steward.ts` + `/api/steward/tick` + `/inbox` |
| Growth Amplifies the Pain | **Cartographer meta-agent** — graph-wide scan for structural gaps + auto-materialisation on approval | `lib/agents/cartographer.ts` + `/api/cartographer/scan` + `/api/approve` |
| Lost Intelligence | **Outcome-grounded reasoning** — every approved action becomes a citable outcome the next Steward tick retrieves via embeddings | `lib/data/outcomes.ts` + `lib/embeddings.ts` + Steward's grounded retrieval loop |

Cradle's other framing — *"relationships as first-class, programmable entities"* — is satisfied structurally:

- **First-class**: `Relationship` is its own Firestore collection with state, lifecycle, attached agent, and outcome log
- **Programmable**: every relationship has editable `escalation_policy` and `sunset_policy` YAML — admin changes are picked up by the next Steward tick
- **Reusable**: relationship objects are portable inside the account; cross-account portability (BorderBridge) is roadmap

---

## 3. Hackathon rubric mapping

Total target: 90+/100. Realistic floor: 85.

| Section | Points | What earns them |
|---|---|---|
| Google Tech Integration | 15 | Gemini 3.1 (chat) + Gemini embedding + Firestore + Cloud Run + Firebase Auth — every choice load-bearing |
| AI Implementation Quality | 10 | AI is the product, not a widget; anti-hallucination via structured output + Zod + citation resolver + confidence gating + action whitelist |
| Working Demo & UI/UX | 10 | Five coherent views; live agent + policy-edit moment; CRUD + state transitions; auto-materialisation; humanised AI output |
| AI Model Performance | 5 | Structured output + Zod + citation resolution + confidence gating + grounded retrieval — anti-hallucination is structural, not aspirational |
| Originality | 10 | Relationships-as-agents framing + Cartographer's gap detection are unusual at hackathon level |
| Problem–Solution Fit | 15 | Every line of the Cradle brief addressed structurally (see §2) |
| Scalability | 10 | Stack scales horizontally (Cloud Run + Firestore + structured-output Gemini); unit economics in spec |
| Deployment Readiness | 5 | Single `gcloud run deploy`; Dockerfile + `output: 'standalone'`; free-tier-capable |
| Clarity & Structure (pitch) | 10 | Problem → solution → AI → impact arc; live demo with policy-edit moment |
| Visual Appeal & Engagement | 10 | Force-directed graph + live agent reasoning + dashboard stats strip |

---

## 4. SDG alignment (handbook requirement)

The pitch video must reference UN SDG impact. Lattice maps to:

- **SDG 9 — Industry, Innovation and Infrastructure** — Lattice is connective infrastructure for innovation ecosystems that compounds across programmes rather than restarting per cohort
- **SDG 17 — Partnerships for the Goals** — relationship-as-entity is literally multi-stakeholder partnership made programmable, governable, portable
- **SDG 8 — Decent Work and Economic Growth** — better-coordinated ecosystems → more successful entrepreneurship outcomes per unit of mentor/admin time

---

## 5. Submission checklist (deadline 9 am 17 May)

- [ ] Slide deck (PDF, 10–12 slides)
- [ ] Pitch video (≤ 3 min, MP4)
- [ ] GitHub repo (public) with README, architecture diagram, demo screenshots
- [ ] Google Form questionnaire (elevator pitch, Google tech justification, AI essentiality + ethics, tech stack + deployment, problem alignment, business + revenue model, infra → prod plan)
- [ ] Submitted by 9 am, 17 May 2026

---

## 6. What shipped beyond the original 15-task plan

The original plan ([docs/superpowers/plans/2026-05-16-lattice.md](superpowers/plans/2026-05-16-lattice.md)) was 15 tasks. We shipped all 15 plus 12 additional features that emerged during the build:

1. **Custom session auth → migrated to Firebase Auth** (real auth backend, not bcrypt + random tokens)
2. **AWS-style Root + IAM identity model** (one Account, 1 Root, many IAM users)
3. **RBAC with 4 roles + 11 permissions** (root/admin/approver/viewer)
4. **Audit log** for every admin action with author identity, role-at-time, target
5. **CRUD for actors + relationships + state transitions** (added: close, taper, reopen)
6. **Cartographer auto-materialisation** — approving a gap materialises a full Relationship with focus + cadence the model commits to at scan time
7. **Todo list auto-spawned from approved Steward actions** — `/todos` page with dispatch placeholders for Email / Calendar / Slack
8. **Humanised AI output** — citation resolution + reasoning rewrite + chip rendering
9. **Persistent ApprovalResultModal** for Cartographer decisions with structured "what was set up" report
10. **Click-node-then-form-relationship contextual flow** on the graph
11. **Two-axis edge encoding** (hue = type, style = state) with comprehensive legend
12. **AuthContext invalidation hardening** to prevent cross-user UI flash on sign-out → sign-in

---

## 7. What we deliberately deferred

### Cradle brief items not yet built
- **Cross-country / cross-instance portability** — the brief says *"reusable across programmes, countries, and ecosystem actors."* Lattice handles intra-account portability via the relationship-as-entity model, but cross-instance (BorderBridge) is roadmap. Mentioned in the deck's roadmap slide.
- **Verifiable outcomes** — the brief's "past engagement data improves future matching" is satisfied today via Firestore-stored outcomes, but cryptographic verification (W3C Verifiable Credentials) for trust-bearing outcomes is roadmap.

### Hackathon scope cuts (explicitly punted)
- **Real Email / Calendar / Slack dispatch** — UI + audit + Todo tracking infrastructure are in place; the actual API integrations are placeholders. Backend swap-in is ~1-2 hours work each.
- **Maker-checker workflow** — admin actions execute immediately, gated only by RBAC. For regulated deployments we'd add a pending-approval queue. ~30 min to add the API layer.
- **Session origin tracking** (IP, UA, geo, "my active sessions" page) — user explicitly deprioritised. ~60 min if reconsidered.
- **Multi-tenancy** — v1 is single Lattice instance = one Account. Multi-tenant would need Firestore security rules + account-scoped routing + admin pages for tenant management.
- **Mobile app** — out of scope.
- **Bulk approve** in the inbox — handy but not load-bearing.
- **Field-level permissions** — e.g. "admin can edit profile but only root can change max_units" — too granular for v1.

### Built but could be better
- **`unmetExpertiseDemand` heuristic** is narrow — only triggers on the `b2b-pricing` tag pattern. Works for the demo seed by design, but won't generalise to other expertise clusters without a more flexible derivation rule.
- **`onEngineStop` auto-fit + Fit view button** — removed because `react-force-graph-2d` doesn't reliably forward refs through `next/dynamic`. Reset layout (via key remount) is the working escape hatch.
- **No retry / queue layer** in front of Gemini calls — a flaky API request fails the whole tick.
- **`lib/agents/cartographer.ts` bypasses the data layer** for outcomes — has its own local `listAllOutcomes` helper. Should be moved to `lib/data/outcomes.ts`.

---

## 8. Demo arc the product was optimised for

The pitch demo (90 seconds):

1. Open `/graph` → 30 nodes, 18 active relationships, type-coloured by actor
2. Click Aisha ↔ Lina mentorship → relationship detail with timeline + Steward log + policy editor
3. Run Steward tick → JSON streams: action = `propose-session`, citations resolve to outcomes from Aisha's history
4. **The policy edit moment** — change escalation `nps_below: 7` → `nps_below: 8`, save, tick again → reasoning reflects new threshold
5. Switch to `/inbox` → Cartographer tab → Run scan → 3 gaps surface (missing b2b-pricing, dormant KPMG, under-utilised Gopal)
6. Approve "missing expertise" gap → persistent modal shows new relationship materialised with focus + cadence the model committed to
7. Return to `/graph` → new edge visible
8. **Tagline:** "Relationships that run themselves. An ecosystem that completes itself."

The 8-minute finals pitch is the same arc with deeper architecture + anti-hallucination explanation + unit economics.

---

## 9. Business model (deck content)

- **Customer:** ecosystem owners — Cradle, Enterprise SG, MaGIC successor, GDG/Google Developer programmes, corporate venture arms, university accelerators
- **Pricing:** SaaS, $X/month per active relationship under management (e.g. $5), tiered with floor + cap
- **Wedge:** one accelerator's mentor programme → all relationship types within same operator → cross-operator portability (BorderBridge, v2)
- **Unit economics (order-of-magnitude):** Steward heartbeat = ~1 Gemini call ≈ $0.001 each; 200-relationship ecosystem at daily heartbeats ≈ $6/mo LLM cost
- **Scalability:** Firestore + Cloud Run scale horizontally; embedding store grows linearly with outcomes
- **Deployment readiness:** entire stack on free-tier GCP today; production = one `gcloud run deploy`

See [docs/superpowers/specs/2026-05-16-lattice-design.md](superpowers/specs/2026-05-16-lattice-design.md) §12 for the spec-time business model with more detail.

---

## 10. Lattice's one-line identity

Pitched three different ways depending on audience:

- **For the brief author (Cradle):** *"An AI-enabled platform that treats ecosystem relationships as first-class, programmable, governable entities — automated and reused across programmes."*
- **For technical judges:** *"Relationships-as-agents. Per-edge Stewards propose actions, a graph-wide Cartographer detects structural gaps, both gated by structured output + citation resolution + confidence."*
- **For a programme owner who'd actually buy this:** *"Stop coordinating mentor-founder pairings in spreadsheets. The AI proposes the next session, the next intro, the next escalation. You approve. The system learns what works."*

All three describe the same product. The first is what the rubric scores against. The second is what an engineer-judge will dig into in Q&A. The third is the actual sales pitch.
