# Lattice — Architecture

## Component map
```
Browser
  ├─ /graph        — react-force-graph-2d
  ├─ /inbox        — Steward proposals + Cartographer gaps
  └─ /relationships/<id>  — timeline / Steward log / Policy editor

Next.js API (Cloud Run)
  ├─ /api/graph                     — actor + edge feed
  ├─ /api/inbox                     — pending proposals
  ├─ /api/relationships/<id>        — detail
  ├─ /api/relationships/<id>/policy — policy save
  ├─ /api/steward/tick              — runs one Steward heartbeat
  ├─ /api/cartographer/scan         — runs Cartographer
  └─ /api/approve                   — approve a Steward action or proposal

lib/agents
  ├─ steward.ts          — Steward loop (retrieve → reason → validate → persist)
  ├─ cartographer.ts     — graph-wide scan
  ├─ graph-metrics.ts    — pure metric functions
  ├─ citation-resolver.ts — validates every citation against Firestore
  └─ prompts.ts          — versioned prompt templates

lib/gemini.ts        — Gemini structured-output wrapper
lib/embeddings.ts    — Vertex AI text-embedding wrapper
lib/schemas.ts       — Zod schemas for AI outputs
lib/data/*           — Firestore data access layer

Firestore
  ├─ actors
  ├─ relationships
  ├─ outcomes
  └─ proposals
```

## Anti-hallucination layer
1. **Structured-output enforcement** — every action is JSON validated against a strict JSON schema in Gemini *and* a Zod schema after parsing.
2. **Citation resolution** — every `outcome:<id>`, `actor:<id>`, `profile:<actor>.<field>`, `metric:<name>` must resolve in Firestore or against a known-metric set. Invalid → action is replaced with `hold`.
3. **Confidence gating** — actions below 0.6 surface as low-confidence in the UI.
4. **Action whitelist** — Stewards can only emit one of 7 actions; no free-form effects.
5. **Grounded retrieval** — Steward prompt always includes top-K embedding-similar past outcomes for the same relationship.
6. **Humans dispose** — nothing executes without one-click approval.

## Why each Google technology
| Tech | Role | Removing it breaks |
|---|---|---|
| Gemini 3.1 | Steward + Cartographer reasoning | The agents — there's no product |
| Vertex embeddings | Grounded retrieval | The anti-hallucination layer |
| Firestore | Real-time graph + outcome log | Live demo updates |
| Cloud Run | Container hosting | Production deploy in <2 min |
| Firebase Auth | Roles (v2) | Not used in v1 — open mode for hackathon demo |
| Google AI Studio | Prompt versioning | Reproducibility across seeded runs |
