# Lattice

> Relationships that run themselves. An ecosystem that completes itself.

Submission for Build with AI 2026 KL — MyHack (Cradle problem statement: *Automating Ecosystem Linkages Instead of Manual Coordination*).

## What it is
Lattice treats every linkage in an innovation ecosystem (mentor ↔ founder, company ↔ programme, partner ↔ initiative) as a **first-class AI agent** that proposes its own next action — and runs a meta-agent that detects structural gaps in the ecosystem itself.

- **Steward** — per-relationship agent. Observes, retrieves grounded context via embeddings, reasons with Gemini 3.1, proposes one action from a whitelist. Humans approve.
- **Cartographer** — graph-wide meta-agent. Detects over-allocation, under-utilization, missing expertise, dormant partners. Proposes new relationships to fill gaps.

Both agents emit structured JSON validated by Zod, with every citation resolved against Firestore. Anti-hallucination is structural, not aspirational.

## Stack
Next.js 14 · Gemini 3.1 (via `@google/genai`) · Vertex embedding · Firestore · Cloud Run · Tailwind · React Force Graph.

## Local dev
```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run seed                        # seeds 30 actors / 18 relationships / 50 outcomes
npm run dev
```

Open http://localhost:3000/graph.

## Demo flow
1. Open `/graph` — every line is a relationship agent.
2. Click an active edge → relationship detail.
3. Run Steward tick → reasoning + citations stream into the Steward log.
4. Edit the escalation policy YAML; save; tick again — agent reflects the new policy.
5. Open `/inbox` → Cartographer tab → run scan → surfaces three real structural gaps from the seed:
   - missing `b2b-pricing` expertise for 4 fintech founders
   - dormant partner (KPMG, 14 months)
   - under-utilized mentor (Gopal Iyer, rare expertise, 0 active)

## Architecture
See `docs/architecture.md`.

## SDG alignment
SDG 9 (innovation infrastructure), SDG 17 (multi-stakeholder partnerships), SDG 8 (entrepreneurship at scale).
