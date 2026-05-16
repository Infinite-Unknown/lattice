# Lattice — Lessons learned

Field notes from building Lattice over a 24-hour hackathon (May 16–17 2026).
Each entry is a thing we hit, what it cost us in time, and what we'd do
differently next time. Future sessions: skim this before reimplementing
anything similar.

---

## 1. Firebase Auth + Next.js — ref forwarding gotchas

**What happened.** Spent ~25 minutes trying to make `fgRef.current.zoomToFit()` work on the graph view. The button silently no-op'd every time. Turned out `next/dynamic` doesn't reliably forward refs to `react-force-graph-2d` (which DOES use `forwardRef` internally). Optional chaining (`fgRef.current?.zoomToFit?.()`) hid the failure.

**Resolution.** Removed the broken "Fit view" button entirely. Kept "Reset layout" — which works by bumping a `key` prop on `<ForceGraph2D>` to force a full remount. This is more reliable than imperative method calls through a dynamic-imported component.

**Lesson.** When using `next/dynamic` with `ssr: false` for a library you need to call imperative methods on, either:
- Wrap the dynamic import in your own `forwardRef` helper, OR
- Use a `key`-bump remount strategy as the escape hatch

And **never use `?.method?.()`** when debugging — it makes failure silent. Use a real conditional with `console.warn` for the missing-ref case.

---

## 2. The IAM synthetic-email RFC trap

**What happened.** IAM creation worked in dev but Firebase Auth rejected the synthetic email `iam+aisha-mentor@acc_xxx.lattice.invalid` with `auth/invalid-email`. The error surfaced in the UI as if the form was asking for an email field that didn't exist.

**Root cause.** RFC 952/1123 forbids underscores in hostname labels. Our account IDs are `acc_<random>`, so the email's domain `acc_xxx.lattice.invalid` failed Firebase's regex.

**Resolution.** Sanitised account IDs to dashes (`acc-xxx`) before constructing the synthetic email. Also dropped the cosmetic `iam+` prefix while at it. See `lib/auth/identity.ts:accountIdToHostnameLabel`.

**Lesson.** When using synthetic emails for non-email identities, validate domain part against RFC 952/1123 (`[a-z0-9-]`, no underscores, no leading/trailing hyphen). The `.invalid` TLD is reserved by RFC 2606 — safe to use, never collides with real domains.

---

## 3. Dotenv loads `.env`, not `.env.local`

**What happened.** `npm run seed` crashed with "FIREBASE_ADMIN_CREDENTIALS missing" even though `.env.local` was correctly populated. Next.js loads `.env.local` automatically for the dev server, but standalone scripts (executed via `tsx`) don't.

**Resolution.** `lib/seed/seed.ts` now explicitly does `dotenv.config({ path: '.env.local' })` before any import that touches credentials.

**Lesson.** For any standalone script in a Next.js project, explicitly load `.env.local`. Don't assume Next's env loading applies — it only does inside the framework lifecycle.

---

## 4. Firestore service-account JSON in `.env.local` needs single quotes

**What happened.** Pasted the Firebase service-account JSON into `.env.local` as `FIREBASE_ADMIN_CREDENTIALS=`. Got `Expected property name or '}' in JSON at position 1` on every `getAdminDb()` call.

**Root cause.** Dotenv, when it sees a double-quoted value, processes `\n` escape sequences. The `private_key` field's `\n` sequences (which JSON expects to stay as the two-character escape) got converted to actual newlines, breaking the JSON.

**Resolution.** Wrap the JSON in **single quotes**. Single-quoted dotenv values are treated literally. We wrote a one-line node script (in our own dev flow) that compresses the JSON to one line and wraps in single quotes when injecting into `.env.local`.

**Lesson.** When putting JSON in `.env` files, always single-quote. Or better, base64-encode and decode at runtime.

---

## 5. The Firebase API key truncation incident

**What happened.** User got `auth/api-key-not-valid` from `signInWithEmailAndPassword`. Spent a minute looking at signup flow before realising the `NEXT_PUBLIC_FIREBASE_API_KEY` was 36 characters instead of the expected 39 — three characters got cut during copy-paste from the Firebase Console.

**Resolution.** Validated key length explicitly when troubleshooting; user re-copied the full key.

**Lesson.** Firebase Web API keys are exactly 39 chars and start with `AIzaSy`. Worth adding a small length check at app startup in production. Also: when copying from a UI, triple-click selects the whole field — middle-click selection or drag-select can truncate.

---

## 6. Firestore composite index requirement

**What happened.** `/audit` returned 500 the first time. Server log showed `FAILED_PRECONDITION` — Firestore needs a composite index for `where('account_id').orderBy('timestamp', 'desc')` on different fields.

**Resolution.** Removed `orderBy` from the Firestore query; sorted in memory after fetch. At hackathon audit-log volume (< a few hundred entries) this is cheaper than waiting for index provisioning.

**Lesson.** Avoid `where(x).orderBy(y)` on different fields unless you've pre-provisioned the composite index. Sort in memory for small data; pre-provision indexes for large. The Firestore error message contains a one-click URL to auto-create the index — would be nicer to surface that to the user.

---

## 7. AI variation requires both temperature AND memory

**What happened.** User reported every Steward tick on the same relationship was returning identical proposals. Same for Cartographer scans.

**Diagnosis.** Two stacked causes:
1. Temperature was pinned at `0.2` (almost deterministic — same input ≈ same output)
2. Prompts had no awareness of what the agent had just proposed → each run started from a blank slate

**Resolution.** Raised default temperature to `0.75` AND added a "recent decisions" block to the Steward prompt (last 5 log entries with approval status) AND added "previously proposed gaps" to the Cartographer prompt. Now Steward avoids repeating itself, and Cartographer doesn't re-surface open proposals.

**Lesson.** AI agent variation has two knobs: temperature (entropy in token selection) AND prompt memory (what the agent knows about its own past). Both matter. Just raising temperature gives chaotic variation; just adding memory gives stable but boring variation.

---

## 8. Approvals were silently no-op'ing — needed real materialisation

**What happened.** Cartographer approval used to just flip `proposal.status = 'recruited'`. The proposal disappeared from the inbox but nothing appeared in the graph. User correctly said: *"the approvals always break"*.

**Resolution.** Auto-materialise a real Relationship on approval. Specifically: extend the Cartographer's schema so it commits to `proposed_focus` + `proposed_cadence` at scan time, then use those at approval time to wire up the full relationship (focus, cadence, default policies, provenance outcome, audit entries, linked back to the proposal). User clicks Approve → graph gets a new edge with all attributes set → zero post-approval admin work.

**Lesson.** When an AI agent surfaces a recommendation, the **default** approval path should *do the work*, not just record the decision. If you find yourself adding "after approving, the admin still has to manually X", you have an incomplete automation.

---

## 9. The cross-user UI flash window

**What happened.** Sign out as admin → sign in as viewer → for ~200ms the viewer saw admin chrome (IAM nav link visible, enabled action buttons, admin role colour) before `/api/auth/me` round-tripped.

**Root cause.** `AuthContext` is React state. Signing out cleared the *cookie* but not the cached `{user, permissions}` data. The next user inherited it until the API call resolved.

**Resolution.** Three layers:
1. `AuthContext.clear()` — synchronous wipe on sign-out, before any await
2. Sign-in clients explicitly `await refreshAuth()` before navigating
3. Gated nav links also check `!loading` so even a stale cache can't leak

**Lesson.** Client-side identity cache is *its own* security surface. Server-side gates protect data, but the UI can still leak permission information. Always invalidate client cache on sign-out as the first action, before any network call.

---

## 10. Tailwind v3 vs v4 silent incompatibility

**What happened.** Project scaffolded with `npm install tailwindcss` which pulled in v4 by default. Configs (`tailwind.config.ts` + `globals.css` `@tailwind` directives) were written for v3. Build technically succeeded but Tailwind classes weren't applying.

**Resolution.** Pinned to v3.4.x explicitly. The plan's spec used v3 syntax; v4 changes the config format and CSS directives.

**Lesson.** Pin major versions of build-time dependencies in the package.json when bootstrapping. Tailwind v3 → v4 is a breaking change without a deprecation warning.

---

## 11. ID forwarding through Next.js dynamic routes

**Pattern.** `/relationships/[id]` needs the id from the URL. In App Router, this comes via `params.id` in the server component, which passes it as a prop to the client component:

```tsx
// app/relationships/[id]/page.tsx
export default function RelationshipPage({ params }: { params: { id: string } }) {
  return <RelationshipClient id={params.id} />;
}
```

This is the established pattern in the codebase — don't try to `useParams()` from `next/navigation` in the client. It works but it's slower and creates two sources of truth.

---

## 12. The "I deferred X, now I need X" pattern

Twice during the build the user said "ignore X" (e.g. "ignore auto-materialising Cartographer proposals", "ignore approver role removal") only to need it later. The lesson: when a user defers a feature, ship it commented out + clearly TODO'd rather than dropping it entirely. The 30 minutes saved by skipping it doesn't justify the 60 minutes of re-context-building when they want it back.

Counter-pattern: if a feature is deferred but the API surface is touched, leave the placeholder. E.g., when I added permissions for actor.write but didn't ship the UI for it yet, the permission was still in the role map. Two days later when the UI shipped, nothing else had to change.

---

## 13. Modal vs toast vs persistent-banner: a decision matrix

Settled on this hierarchy after iterating:

| Surface | Use when |
|---|---|
| **Toast** (auto-dismiss 6s) | Quick acknowledgement, no decision needed — "Dismissed", "Marked done", "Approved X for Y" |
| **Persistent modal** | Important confirmation with next steps — Cartographer approval (materialised relationship), errors that need acting on |
| **Inline banner** (in-page) | Page-level state — "You're signed in as viewer · all actions disabled", `/audit` "no entries yet" |
| **Inline status chip** | Per-row state — `✓ approved by X at Y`, `dispatched via Email` |

Persistent modal for Steward approvals would have slowed triage — settled on a rich contextual toast instead (names action, parties, state change, spawned todo).

---

## 14. Things we built that ended up not needed

- **`actorPickPrincipalPair` heuristic complexity** — we wrote logic to prefer two actors of different types when materialising. In practice Cartographer almost always proposes 2-actor pairs of distinct types. Simpler `first two` would have worked.
- **`onEngineStop` auto-fit on graph** — written to handle drifted nodes, removed when we discovered `fgRef.current.zoomToFit` doesn't reliably work through dynamic import.
- **Custom random session token sessions** — first auth pass used `crypto.randomBytes` tokens stored in Firestore. Replaced with Firebase session cookies when migrating to Firebase Auth. The custom session collection was deleted; no migration needed because no real users existed.

---

## 15. Things we DIDN'T build that we should have noticed sooner

- **Real email/calendar/Slack dispatch** — punted to placeholders. For a production demo to enterprise customers (Cradle), the placeholders would be visibly half-built. Worth carving out 1-2 hours for at minimum a Slack webhook POST.
- **Steward tick performance** — Gemini calls take 3-8s. We disable buttons + show spinner, but for the demo it'd be smoother to pre-warm a couple of cached responses.
- **Auto-run a Steward tick after Cartographer materialisation** — so the new relationship immediately has a first proposal in its log. Currently the new relationship's Steward log is empty until the admin clicks "Run Steward tick" manually.
- **Bulk approve** in the inbox — when there are 5 Cartographer gaps and you trust them all, you click Approve 5 times. A "Approve all" + per-row checkbox would be ~30 mins of work.

---

## 16. Process lessons (not technical)

- **Subagent-driven development pattern from `superpowers:subagent-driven-development` actually worked.** Spawning a fresh subagent per task kept context tight, and the spec-reviewer + code-quality-reviewer two-stage review caught real issues. Worth using for any multi-task plan again.
- **Bug fixes deserve commits with context, not one-liners.** Several "fix(...)" commits in this repo have multi-paragraph bodies explaining the root cause + why this fix vs alternatives. Future Claude reading the log will know what was tried and why we landed where we did. Single-line fixes are anonymous; documented fixes are pedagogical.
- **TodoWrite is more useful for visible structure than for tracking.** The user sees the task list in real time, which double-checks whether we're scoping correctly. Even when "tracking" feels redundant, it's worth doing for the user-visible structure.
- **Document gotchas inline.** Most "gotcha" comments in the code (e.g. the `cooldownTicks` explanation in GraphClient, the "AWS-style" mental model in `lib/auth/types.ts`) earn their keep when someone hits the surrounding code six months later. Cost is one comment; benefit is one less debugging session.
