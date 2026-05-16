# Demo — Scripts & Flow

Operational doc for running the Lattice demo. The README covers *what Lattice is*; this file covers *how to put on the show*.

---

## 1. Scripts

### `npm run dev`
Boot the Next.js dev server on `http://localhost:3000`. Reads `.env.local`. Hot reload on every save.

### `npm run seed`
Minimal single-tenant seed against an existing account. **Refuses to run** if multiple accounts exist in the Firestore project — guards against accidentally writing fixture data into a tenant that already has live data.

Resolution order for the target account:
1. `SEED_ACCOUNT_ID` env var
2. `--account-id <id>` CLI flag
3. The single existing account if exactly one exists

```bash
# Single-account case (works out of the box)
npm run seed

# Multi-account case (explicit target required)
SEED_ACCOUNT_ID=acc_xxx npm run seed
# or
npm run seed -- --account-id acc_xxx
```

### `npm run reset`
**Destructive.** Wipes every Firebase Auth user and every Firestore collection, then provisions the full demo state: 4 root accounts + 3 IAM users + 4 distinct seed ecosystems. Idempotent — re-running produces the same state.

```bash
npm run reset
```

After it finishes you'll see the full sign-in matrix printed to the console.

### `npm run test`
Vitest suite — 19 tests across schemas, citation resolver, and graph metrics. Pure-logic unit tests; no Firestore touched.

### `npm run build`
Production build. Standalone output for Docker / Cloud Run.

---

## 2. What `reset` produces

### 4 Root accounts

Sign in: `/sign-in` → **Root user** tab → email + password.

All passwords: `01234567`

| Email | Account | Story this tenant tells |
|---|---|---|
| `jeff@gmail.com` | **Hack Garage Accelerator** | Healthy seed-stage accelerator. Sarah Chen ↔ Pulse just landed a $40k MRR enterprise deal. Marcus Tan running Brewly's paid acquisition. Pulse is in the Spring 2026 cohort. |
| `bob@gmail.com` | **Sunrise Ventures** | Corporate VC. One **escalated** mentorship — Diana Wong ↔ QuantumCore is mid-burnout, missed two check-ins. GridSpark closed Series A term sheet. |
| `larry@gmail.com` | **UTM Innovation Hub** | University tech-transfer. AgriBot secured pre-seed; MedScan navigating MDA medical-device approval. **KPMG partner is dormant** (zero outcomes) — Cartographer should flag it. |
| `billy@gmail.com` ★ | **Malaysia Tech Ecosystem** | Showcase. 12 entities including MDEC GAIN, 42 KL, Sunway iLabs, APU, GDG KL, Carsome, Aerodyne, Naluri, PolicyStreet. 8 relationships covering every edge type. 10 outcomes with real stories. |

### 3 IAM users under Billy's tenant

Sign in: `/sign-in` → **IAM user** tab → account name + username + password.

Account name: **`Malaysia Tech Ecosystem`** (case-insensitive exact match — type it exactly)

All passwords: `01234567`

| Username | Role | What they can do | Why this name |
|---|---|---|---|
| `faiz-hassan` | **admin** | Full operational access except IAM management | Cradle ops — the problem statement's contact |
| `jeff-sandhu` | **approver** | Run agents · approve proposals · no policy or actor mutation | CEO @ 42 Malaysia — opening keynote at MyHack 2026 |
| `analyst-team` | **viewer** | Read-only — no agent runs, no approvals | Generic ecosystem analyst |

### Built-in Cartographer hooks (Billy's tenant)

Two intentional gaps so a live `Run Cartographer scan` returns interesting proposals:

1. **Cheryl Yeoh is over-allocated** — capacity 5 / max 4 = 1.25× utilization → triggers `over_allocation`
2. **APU partner is dormant** — zero outcomes on the partner-in-initiative edge to 42 KL → triggers `dormant_partner`

---

## 3. The 90-second demo walk

Optimised for the prelim submission video and the finals pitch. Run on Billy's tenant.

### Setup
1. `npm run reset`
2. `npm run dev`
3. Open `http://localhost:3000`

### The walk

**Step 1 — Landing (5s).** Public landing page. Massive headline reads "Relationships that run themselves." Scroll past the four pain blocks and the pricing section to feel the design system land.

**Step 2 — Sign in as Billy (5s).** Email `billy@gmail.com` / password `01234567`. Land on `/dashboard`.

**Step 3 — Dashboard stat strip (5s).** Numbers count up from 0. **12 entities · 8 active relationships · 0 awaiting decision · 10 outcomes captured.** Mention the Gemini model identifier in the header — governance transparency.

**Step 4 — Graph (10s).** Click `Graph`. 12 entities laid out as a force-directed network. Point out:
- Cheryl Yeoh ↔ Naluri is **amber-vermillion** (`escalated` state) — Steward already flagged this one
- Carsome ↔ MDEC GAIN is **dotted** (`tapered`, alumni status)
- GDG KL ↔ MDEC GAIN has **flowing particles** (active programme partnership)

**Step 5 — Relationship detail (10s).** Click the Carsome ↔ MDEC GAIN edge. Show the timeline (Thailand expansion milestone), the steward log (empty so far), and the policy editor (YAML).

**Step 6 — Run a Steward tick (15s).** Click **Run Steward tick →**. Gemini reasons live. JSON arrives. Reasoning prose reads in plain English ("Carsome is a flagship MDEC GAIN alumnus…"). Citations resolve to chips below the prose. Confidence shown.

**Step 7 — The policy-edit moment (15s).** Open the Policy tab. Change `nps_below: 7` to `nps_below: 8`. Save. Click **Run Steward tick** again. The new reasoning reflects the updated threshold — *the same agent, a different policy, a different proposal*. **This is the whole product in one motion.**

**Step 8 — Cartographer scan (15s).** Navigate to `/agents` → **Cartographer** tab → **Run Cartographer scan →**. Two gaps surface:
- `over_allocation` flagging Cheryl Yeoh
- `dormant_partner` flagging APU

**Step 9 — Approve a gap (10s).** Approve the Cheryl-Yeoh over-allocation gap. Persistent modal shows the new relationship materialised with the model-committed focus + cadence. **One click, full setup, no admin work.** Return to `/graph` — new edge visible.

**Step 10 — Role gradient (10s, optional).** Sign out. Sign in as IAM `analyst-team` (viewer). Same `/dashboard` but every action button is disabled, banner reads `Read-only role`. RBAC is structural.

### Closing line

> *Relationships that run themselves. An ecosystem that completes itself.*

---

## 4. Recovery / common errors

### "No Lattice account exists yet" on sign-in
The Firebase Auth project is empty. Run `npm run reset` to provision the demo accounts, or `/sign-up` to bootstrap your own.

### Stats are all zero on a fresh tenant
Expected — a brand-new account starts empty. Either:
- `npm run reset` (wipes everything, reseeds the 4 demo tenants), or
- Sign up a new account, then `SEED_ACCOUNT_ID=<id> npm run seed` to populate just that one

### Existing data from before the multi-tenant migration is invisible
Old docs lack `account_id` so post-migration queries skip them. Sign in as the original root and hit `POST /api/admin/backfill` to claim them:

```bash
# Dry-run — see what would be claimed
curl -X POST -b 'lattice_session=YOUR_COOKIE' http://localhost:3000/api/admin/backfill

# Actually stamp them
curl -X POST -b 'lattice_session=YOUR_COOKIE' \
  -H 'content-type: application/json' \
  -d '{"confirm":true}' \
  http://localhost:3000/api/admin/backfill
```

### IAM sign-in says "no account with that name"
Account names are case-insensitive but must match exactly. Use the exact account name as displayed (e.g. `Malaysia Tech Ecosystem`).

### Steward tick times out
Gemini API was slow. Click again — the second call usually succeeds in 3-5s. Cold first call after a reset can take 8s.

---

## 5. Quick reference card

```
Roots                                            password
  jeff@gmail.com   → Hack Garage Accelerator     01234567
  bob@gmail.com    → Sunrise Ventures            01234567
  larry@gmail.com  → UTM Innovation Hub          01234567
  billy@gmail.com  → Malaysia Tech Ecosystem     01234567    ★

IAM under Malaysia Tech Ecosystem                password
  @faiz-hassan     admin                         01234567
  @jeff-sandhu     approver                      01234567
  @analyst-team    viewer                        01234567

Cartographer hooks on Billy's tenant
  Cheryl Yeoh      over-allocated (5/4)          → over_allocation
  APU              no outcomes on 42KL edge      → dormant_partner

Built-in stats (always true)
  4 relationship types · 7 Steward actions · 5 gap classes · 0 manual
```
