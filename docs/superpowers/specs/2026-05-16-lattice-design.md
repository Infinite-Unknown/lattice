---
title: Lattice — Design Spec
date: 2026-05-16
status: draft
event: Build with AI 2026 KL — MyHack (Sunway University, 16–17 May 2026)
problem-statement: Automating Ecosystem Linkages Instead of Manual Coordination (Cradle)
---

# Lattice

> **Relationships that run themselves, in an ecosystem that completes itself.**

Lattice is an ecosystem operating system in which every linkage between actors — mentor ↔ founder, company ↔ programme, partner ↔ initiative — is a **first-class AI agent** that observes, reasons, and proposes its own next action. A second AI continuously analyses the *shape* of the ecosystem and proposes **new relationships to fill structural gaps**. Together, the two loops let an ecosystem operator stop manually coordinating linkages and start governing them as programmable, reusable entities.

This spec is the canonical design document for the MyHack 2026 hackathon build.

---

## 1. Problem statement (source: Cradle)

Regional innovation ecosystems still rely on manual coordination to create and manage relationships between companies, mentors, partners, service providers, and programme administrators. Critical linkages (mentor → company, company → programme, partner → initiative) are handled as one-off assignments rather than structured, reusable system entities.

The platform layer today does not treat ecosystem relationships as **first-class entities that can be defined, automated, governed, and reused** across different contexts. There is no consistent mechanism for **how relationships are formed, how they evolve over time, or how past engagement data improves future matching**.

**Design challenge:** *How might we design an AI-enabled platform system that treats ecosystem relationships as first-class, programmable entities, so that linkages can be created, managed, reused, and improved automatically across programmes, countries, and ecosystem actors?*

---

## 2. Goals & non-goals

### Goals (24-hour build)
1. Model `Relationship` as a first-class entity with lifecycle, policy, attached agent, and accumulating outcomes.
2. Deliver two working AI loops — **Stewards** (per-relationship) and **Cartographer** (whole-graph).
3. Ship a demoable web app with three views: Graph, Inbox, Relationship Detail.
4. Hit every line on the hackathon rubric: Google tech integration, AI essentiality, working demo, anti-hallucination posture, originality, problem fit, scalability, deployment readiness, pitch clarity.
5. Show one *visceral* moment that proves "programmable" — admin edits a relationship's escalation policy YAML and the Steward's next proposal reflects the change.

### Non-goals (v1 / hackathon scope)
- Real calendar / email integrations (stub message previews; no send).
- Cryptographic outcome verification (W3C Verifiable Credentials) — roadmap.
- Cross-platform-instance portability (BorderBridge) — roadmap.
- Multi-tenant SaaS plumbing (one ecosystem instance only).
- Mobile app.
- Production-grade auth flows beyond Firebase Auth defaults.

---

## 3. Stakeholders & SDG alignment

### Stakeholders directly served
- **Programme owners / ecosystem admins** — primary user; operates Lattice.
- **Mentors** — relationships they're part of accumulate verifiable history.
- **Founders / companies** — receive higher-quality, better-matched coordination.
- **Partners / service providers** — gain visibility into linkage opportunities and dormancy alerts.

### UN SDG alignment (handbook requirement)
- **SDG 9 — Industry, Innovation and Infrastructure.** Lattice is connective infrastructure that lets innovation ecosystems compound across programmes rather than restart with each cohort.
- **SDG 17 — Partnerships for the Goals.** The relationship-as-entity model is, literally, multi-stakeholder partnership made programmable, governable, and portable.
- **SDG 8 — Decent Work and Economic Growth.** Better-coordinated ecosystems produce more successful entrepreneurship outcomes per unit of mentor/admin time.

---

## 4. Product overview

### Two AI loops

#### Loop 1 — Stewards (per-relationship agents)
Each active relationship has an attached AI agent ("Steward") that runs on a heartbeat:
1. **Observe** — read parties' recent activity, logged outcomes, signals.
2. **Retrieve** — pull the most-similar past outcomes via Vertex AI embeddings for grounded context.
3. **Reason** — Gemini 3.1 picks one action from a fixed whitelist:
   `{propose-session, draft-checkin, propose-intro, escalate, taper, sunset, hold}`
4. **Emit** — structured JSON: `{action, reasoning, citations, confidence}`.
5. **Approve** — admin / party clicks one button; nothing happens autonomously.
6. **Update** — approved action becomes a new outcome on the relationship; Steward memory refreshes.

**Safety property:** Stewards propose; humans dispose.

#### Loop 2 — Cartographer (whole-graph meta-agent)
Periodically scans the relationship graph and surfaces structural problems:
- **Over-allocation** — actor exceeds capacity threshold
- **Under-utilization** — high-expertise actor with near-zero edges
- **Missing expertise** — cluster of founders lacking matched mentor type
- **Dormant partner** — partner with no edges in N months
- **Programme bottleneck** — cohort transition gap

Each surfaced gap becomes a `ProposedRelationship` with reasoning, expected impact, and a recruit/activate workflow. Admin approves → Cartographer spawns a placeholder; once filled, a Steward attaches automatically.

#### Composition
Cartographer creates relationships → Stewards run them → Stewards' outcomes feed back into Cartographer's graph statistics on the next scan. The ecosystem is a closed learning loop.

---

## 5. Data model

```text
Actor
  id              string
  type            enum [company | mentor | programme | partner]
  name            string
  profile         object        # Gemini-extracted from intake form / PDF
  expertise       string[]      # tags
  expertise_embedding  float[]  # Vertex AI text-embedding
  capacity        object        # { allocated_units, max_units }
  status          enum [active | inactive]
  created_at      timestamp

Relationship
  id              string
  type            enum [mentorship | company_in_programme | partner_in_initiative | service_engagement]
  parties         actor_id[]    # 2..N
  state           enum [proposed | active | escalated | tapered | closed]
  focus           string[]
  cadence         string        # e.g. "bi-weekly"
  escalation_policy  string     # editable YAML
  sunset_policy   string        # editable YAML
  steward_state   object        # last_run, last_action, memory_summary
  outcomes        outcome_id[]
  created_at      timestamp
  last_steward_run  timestamp

Outcome
  id              string
  relationship_id string
  type            enum [session_held | intro_made | milestone | issue | closing_note]
  evidence_text   string
  evidence_embedding  float[]   # for Steward retrieval
  source          enum [steward | admin | party]
  verified        boolean       # admin checkbox in v1; VCs in v2
  timestamp       timestamp

ProposedRelationship
  id              string
  type            enum (same as Relationship.type)
  candidate_parties  actor_id[]
  gap_type        enum [over_allocation | under_utilization | missing_expertise | dormant_partner | programme_bottleneck]
  reasoning       string
  citations       string[]      # actor_ids / outcome_ids
  expected_impact string
  confidence      float
  status          enum [open | recruited | dismissed]
  created_at      timestamp

GraphSnapshot
  id              string
  timestamp       timestamp
  metrics         object        # per-Cartographer-run aggregates
  gaps_found      proposed_relationship_id[]
```

**The "first-class entity" promise is satisfied structurally:** `Relationship` owns its lifecycle, its policies, its agent state, and its outcomes. **The "programmable" promise is satisfied** by exposing `escalation_policy` and `sunset_policy` as editable YAML in the UI.

---

## 6. AI architecture

### Two Gemini 3.1 prompts (versioned in Google AI Studio)

**Steward prompt**
- **Input:** relationship state, parties' profiles (truncated), top-K most-similar past outcomes (via embedding retrieval), recent action history, current policy YAMLs.
- **Output schema (enforced):**
  ```json
  {
    "action": "propose-session | draft-checkin | propose-intro | escalate | taper | sunset | hold",
    "reasoning": "string (must reference at least one citation)",
    "citations": ["outcome:<id> | profile:<actor>.<field>"],
    "confidence": 0.0
  }
  ```

**Cartographer prompt**
- **Input:** aggregated graph stats, top-K most/least-utilised actors, dormant partner list, expertise coverage matrix.
- **Output schema (enforced):**
  ```json
  [{
    "gap_type": "over_allocation | under_utilization | missing_expertise | dormant_partner | programme_bottleneck",
    "candidate_parties": ["actor_id"],
    "reasoning": "string",
    "citations": ["actor:<id> | metric:<name>"],
    "expected_impact": "string",
    "confidence": 0.0
  }]
  ```

### Anti-hallucination layer (rubric: AI Model Performance — 5 pts)
1. **Structured-output enforcement.** Every AI action is typed JSON parsed by a Zod / Pydantic-equivalent schema. Invalid → retry once → degrade to `hold`.
2. **Citation resolution.** Every citation string must resolve to a real `outcome` or `actor` record. Unresolvable → reject action; surface as low-confidence.
3. **Confidence gating.** Actions with `confidence < 0.6` surface to admin as "needs review" rather than auto-queueing for one-click approval.
4. **Action whitelist.** Stewards can only emit from a fixed enum. No free-form effects.
5. **Grounded retrieval.** Steward prompt always includes top-K past outcomes retrieved by Vertex AI text-embedding similarity — the model reasons against actual prior events, not vibes.
6. **Determinism in demo.** Temperature pinned low for the live run; seeds fixed.

### Why AI is essential (rubric: AI Implementation Quality — 10 pts)
- Without Gemini, there are no Stewards — the central architectural primitive collapses.
- Without embeddings, the grounded-retrieval property collapses; Stewards become guessing dashboards.
- Without Cartographer's reasoning, structural-gap detection degrades to threshold alerts (rule-based, not AI).
- The product cannot be reconstructed without AI; AI is not a recommendation widget on top of a CRM.

---

## 7. Google technology stack (rubric: Google Tech Integration — 15 pts)

| Layer | Technology | Role | Why load-bearing |
|---|---|---|---|
| LLM | **Gemini 3.1** | Steward + Cartographer reasoning | Structured output, long-context graph state, citation grounding |
| Prompt management | **Google AI Studio** | Prompt versioning, A/B testing | Reproducible behaviour across the seeded dataset |
| Embeddings | **Vertex AI text-embedding** | Actor expertise vectors, outcome similarity retrieval | Required for grounded retrieval |
| Database | **Firestore** | Real-time graph + outcome log | Streams mutations to UI; supports the live-demo "watch the graph update" moment |
| Compute | **Cloud Run** | Single containerised Next.js app | Scales to zero; deploys in <2 min |
| Auth | **Firebase Auth** | Admin / party roles | Cheap, integrates with Firestore security rules |
| Intake | **Google Forms → Firestore** | Real "company applies" intake | Adds demo realism — judges see a non-mock data pipe |

**Justification narrative for the deck:** every choice is structurally required. Removing Gemini removes the agents. Removing Vertex embeddings removes the anti-hallucination grounding. Removing Firestore removes the live graph experience.

---

## 8. UI / UX

### Three core views

**Graph view (default)**
- Force-directed network. Nodes coloured by actor type. Edges coloured by relationship state.
- Edge thickness proportional to outcome count.
- Hover shows actor / relationship summary.
- Cartographer-flagged gaps overlay as red halos around clusters.

**Inbox**
- Two tabs: *Steward proposals* (per-relationship actions awaiting approval) and *Cartographer gaps* (structural issues awaiting decision).
- Each row: parties / gap headline, action / gap type, reasoning preview, confidence, Approve / Edit / Dismiss.
- One-click approve for `confidence > 0.6`; review modal for everything else.

**Relationship Detail**
- Header: parties, type, state, focus tags.
- Tabs:
  - *Timeline* — outcomes in chronological order with source badges.
  - *Steward log* — last N agent runs with full reasoning + citations expanded.
  - *Policy* — editable YAML for `escalation_policy` and `sunset_policy` with live validation.
  - *Parties* — links to both actors.

### The "programmable" moment in demo
Open Aisha ↔ Lina relationship → Policy tab → change escalation trigger from `nps<7` to `nps<8` → save → trigger Steward heartbeat → Steward now escalates where it didn't before. This is the single most important UI moment in the pitch.

---

## 9. Demo flow (90 seconds)

| Time | Action | Narration |
|---|---|---|
| 0:00 | Open Graph (30 actors, 18 relationships) | *"Every line you see is an autonomous AI agent."* |
| 0:15 | Click Aisha ↔ Lina mentorship | *"Each relationship has a Steward. It watches, reasons, proposes."* |
| 0:30 | Trigger Steward heartbeat | Watch JSON stream: action=`propose-session`, citations=`outcome:172, profile:aisha.deals`, confidence=0.84. Click Approve. |
| 0:45 | Open Policy tab; change escalation threshold; save | *"The relationship is programmable. Edit the policy — the agent obeys."* |
| 1:00 | Switch to Inbox → Cartographer | *"Now zoom out: what's the ecosystem missing?"* Three flagged gaps surface. |
| 1:15 | Click `missing_expertise` gap | Cartographer proposes two recruit candidates with reasoning. Approve → outreach drafted + placeholder created. |
| 1:25 | Return to Graph | Two new edges visible (one active, one proposed). *"Relationships that run themselves. An ecosystem that completes itself."* |

---

## 10. Scope plan

### IN (must build in 24h)
- Firestore schema + Firebase project provisioned
- Seeded dataset: 30 actors, 18 active relationships, ~50 historical outcomes (curated so 3 specific Cartographer gaps surface compellingly)
- Steward loop: Gemini call, structured-output parsing, citation validation, confidence gating, action whitelist
- Cartographer: 3 gap types implemented (`under_utilization`, `missing_expertise`, `dormant_partner`)
- Next.js dashboard: Graph view (`react-force-graph` or `vis-network`), Inbox, Relationship Detail with Policy editor
- One-click approve flow → writes new outcome → Steward state updates
- Pitch deck (10–12 slides)
- 3-minute demo video
- README + architecture diagram

### FAKED (good-enough for demo, transparent in pitch)
- Calendar / email — stub "drafted message" previews, no real send
- Outcome verification — admin checkbox; W3C VCs deferred
- In-app cross-actor messaging

### OUT (v2, on roadmap slide)
- BorderBridge cross-instance portability (signed relationship bundles, AI translation)
- EvidenceVault verifiable credentials layer
- Automated recruit/outreach execution
- Multi-tenancy / SaaS billing
- Mobile / native clients

---

## 11. Pitch narrative (rubric: Presentation & Pitching — 20 pts)

### Prelim submission video (target 2:45, hard cap 3:00)

| Beat | Time | Content |
|---|---|---|
| Hook | 0:10 | *"In 2026, regional innovation ecosystems still match mentors with spreadsheets and gut feel."* |
| Problem | 0:25 | Cradle's lived reality: manual coordination, no reuse, no compounding learning. |
| Insight | 0:20 | The brief asked for *relationships as first-class entities*. Today's platforms treat them as side-effects of actors. We invert that. |
| Product reveal | 1:05 | Stewards + Cartographer demo (§9, compressed). |
| AI essentiality | 0:15 | No Gemini → no Stewards. Structured-output + citation + confidence = trust contract. |
| SDG impact | 0:15 | SDG 9 / 17 / 8 — infrastructure that compounds, partnerships that scale, entrepreneurship that learns. |
| Business + roadmap | 0:20 | SaaS per operator; wedge → expansion; BorderBridge + EvidenceVault on the horizon. |
| Close | 0:10 | *"Relationships that run themselves. An ecosystem that completes itself."* |

Total: 2:40. Buffer for slide transitions: 0:20.

### Final round live pitch (8 min + 7 min Q&A)

Same arc, expanded:

| Beat | Time | Added depth vs prelim |
|---|---|---|
| Hook | 0:20 | + concrete Cradle anecdote |
| Problem | 1:00 | + stakeholder pain quantified per role |
| Insight | 0:40 | + the brief's six key phrases mapped to architectural choices |
| Live demo | 2:30 | + Policy YAML edit moment; + Cartographer recruit-workflow follow-through |
| AI architecture | 1:00 | + anti-hallucination layer walk-through |
| SDG impact | 0:30 | + measured outcomes per dollar narrative |
| Business + unit economics | 1:00 | + per-Steward cost; + go-to-market sequence |
| Roadmap | 0:30 | + BorderBridge cross-instance demo mockup |
| Close + Q&A handoff | 0:30 | |

Total: 8:00.

---

## 12. Business model & scalability (rubric: 15 pts)

### Customer
Ecosystem owners: Cradle, Enterprise SG, MaGIC successor, GDG/Google Developer programmes, corporate venture arms, university accelerators, regional development banks.

### Wedge
One accelerator's mentor programme → all relationship types within the same operator → cross-operator portability (BorderBridge, v2).

### Pricing
SaaS, per active relationship under management. Tiered with volume cap. Free pilot for design-partner operators.

### Unit economics (order-of-magnitude)
- Each Steward heartbeat = ~1 Gemini 3.1 call ≈ $0.001 at current pricing.
- A 200-relationship ecosystem running daily heartbeats = ~6,000 calls/month = ~$6 LLM cost.
- Embedding store grows linearly with outcomes; cost negligible at hackathon-relevant scale.

### Scalability
- Steward heartbeat is O(active relationships) and trivially parallelisable.
- Firestore + Cloud Run scale horizontally with no quadratic dependencies.
- Cartographer is O(actors × outcomes) but capped by snapshot frequency.

### Deployment readiness (rubric: 5 pts)
- Entire stack runs on free-tier GCP today.
- Production deploy = `gcloud run deploy` from the same container used in dev.
- Firebase project is the same dev → prod artefact.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Agent loops fragile on stage | Cap autonomy to *propose-only*. Pre-seed 30 actors with realistic stories. Pin Gemini temperature for the demo. |
| Hallucinated citations | Validation layer rejects actions whose citation IDs don't resolve in Firestore. |
| Cartographer gaps look generic | Curate seed data so 3 specific, compelling gaps exist; tune prompt around them. |
| Judges question *"isn't this just CRM + AI?"* | Demo opens with the Policy YAML edit — visceral proof of "programmable, not just a record." |
| 24-hour overrun | Cut Cartographer to 1 gap type. Steward loop alone is a complete, defensible demo. |
| AI ethics scrutiny | Lead with propose-never-execute design. Show citation + confidence UI. Acknowledge bias-audit as v2. |
| Force-directed graph performs poorly with 30 nodes | Pre-tuned layout; fallback to a static layout if needed. |
| Demo network failure | Local Firestore emulator + recorded backup video. |

---

## 14. Rubric mapping (target: 90+ / 100)

| Section | Points | How we earn them |
|---|---|---|
| Google Tech Integration | 15 | §7 — Gemini 3.1, AI Studio, Vertex embeddings, Firestore, Cloud Run, Firebase Auth all load-bearing |
| AI Implementation Quality | 10 | §6 — AI is the product, not a widget; ethics via propose-never-execute + transparent citations |
| Working Demo & UI/UX | 10 | §8, §9 — three coherent views; live agent + policy-edit moment |
| AI Model Performance | 5 | §6 — structured output, citation resolution, confidence gating, grounded retrieval |
| Originality | 10 | §4 — relationships-as-agents is unusual; gap-detection meta-agent is rarer; combined narrative is unique |
| Problem–Solution Fit | 15 | §1, §4 — every line of the brief is addressed structurally, not by name-dropping |
| Scalability | 10 | §12 — concrete unit economics; horizontal stack; clear wedge → expansion |
| Deployment Readiness | 5 | §12 — single `gcloud run deploy`; free-tier-capable |
| Clarity & Structure (pitch) | 10 | §11 — problem → solution → AI → impact arc, tight |
| Visual Appeal & Engagement | 10 | Graph view + live agent reasoning streams are visually distinctive |

**Total target: 100. Realistic floor: 85.**

---

## 15. Open questions (resolve during plan phase)

1. Graph library — `react-force-graph` (richer interactivity) vs `vis-network` (more stable). Decide during plan.
2. Steward heartbeat trigger in v1 — cron in Cloud Run, manual "tick" button in UI, or both? Default: both, with manual tick as the demo path.
3. Seed dataset persona authoring — fully fictional or based on anonymised real Cradle alumni? Default: fully fictional with realistic names; clearly labelled in deck.
4. Policy YAML schema — design a minimal v1 schema during plan phase (must support escalation threshold + sunset trigger at minimum).
5. Vertex embedding model variant — text-embedding-005 or latest at hackathon date. Default: latest available.

---

## 16. Submission checklist (due 9 am, 17 May 2026, Google Form)

- [ ] Slide deck (PDF, 10–12 slides)
- [ ] Pitch video (≤3 min, MP4)
- [ ] GitHub repo (public) with README, architecture diagram, demo screenshots
- [ ] Questionnaire answers drafted: elevator pitch, Google tech justification, AI essentiality + ethics, tech stack + deployment, problem alignment, business + revenue model, infra → prod plan

---

*End of spec. Implementation plan to be generated by the writing-plans skill.*
