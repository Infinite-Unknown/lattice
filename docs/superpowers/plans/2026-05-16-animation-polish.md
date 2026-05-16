# Lattice Animation & Loading Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tasteful entrance animations, on-brand loading states, modal/button micro-interactions, and skeleton placeholders to make Lattice feel lively and premium for the Build with AI 2026 KL · MyHack demo.

**Architecture:** Pure CSS + Tailwind v3 keyframes (no new deps, <1 KB gzipped bundle delta). One branded SVG loader component (`<LatticeLoader>`) replaces every "Loading…" string. Two small client hooks: `useReveal` (IntersectionObserver) and `useCountUp` (requestAnimationFrame). Reduced-motion query is respected globally.

**Tech Stack:** Next.js 14 App Router · TypeScript · Tailwind v3 · pure CSS keyframes · IntersectionObserver · requestAnimationFrame · View Transitions API (`@view-transition`).

**Note on testing:** This work is presentational. Unit tests for animation timing/visuals are high-flake / low-value at hackathon pace. Verification is manual (`npm run dev`, scrub through each page) plus `npx tsc --noEmit` + `npx next build` cleanliness. Existing 19/19 Vitest suite must remain green (no logic changes).

**Spec reference:** [docs/superpowers/specs/2026-05-16-animation-polish-design.md](../specs/2026-05-16-animation-polish-design.md)

---

## File Structure

### Files to CREATE

| Path | Purpose |
|---|---|
| `app/components/LatticeLoader.tsx` | Branded SVG loader (3 pulsing nodes + drawing edges) |
| `app/components/Skeleton.tsx` | Generic shimmer block primitive + a few preset shapes |
| `app/hooks/useReveal.ts` | IntersectionObserver hook for scroll-reveal sections |
| `app/hooks/useCountUp.ts` | rAF-based number count-up for dashboard stats |
| `app/graph/loading.tsx` | Next.js route loader for `/graph` |
| `app/inbox/loading.tsx` | Next.js route loader for `/inbox` |
| `app/todos/loading.tsx` | Next.js route loader for `/todos` |
| `app/audit/loading.tsx` | Next.js route loader for `/audit` |
| `app/relationships/[id]/loading.tsx` | Next.js route loader for relationship detail |

### Files to MODIFY

| Path | What changes |
|---|---|
| `tailwind.config.ts` | Add `theme.extend.keyframes` + `theme.extend.animation` |
| `app/globals.css` | Add `@view-transition`, `prefers-reduced-motion` block |
| `app/LandingClient.tsx` | Hero stagger, gradient drift on hero, scroll reveals on sections |
| `app/components/Modal.tsx` | Backdrop fade-in + content scale-in |
| `app/graph/GraphClient.tsx` | Replace "Loading graph…" text with `<LatticeLoader>` |
| `app/DashboardClient.tsx` | Stats count-up + skeleton state |
| `app/inbox/InboxClient.tsx` | Skeleton rows, toast fade-in |
| `app/todos/TodosClient.tsx` | Skeleton rows, toast fade-in |
| `app/audit/AuditClient.tsx` | Skeleton rows |
| `app/AppShell.tsx` | `transition-colors` on nav links |

---

## Tasks

### Task 1: Extend Tailwind config with custom keyframes

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace the file's contents**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseDot: {
          '0%, 80%, 100%': { opacity: '0.35', transform: 'scale(0.85)' },
          '40%':           { opacity: '1',    transform: 'scale(1.1)'  },
        },
        drawLine: {
          '0%':   { strokeDashoffset: '40' },
          '60%':  { strokeDashoffset: '0'  },
          '100%': { strokeDashoffset: '0'  },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
        gradientDrift: {
          '0%, 100%': { backgroundPosition: '0% 50%'   },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in-up':     'fadeInUp 500ms ease-out both',
        'fade-in':        'fadeIn 400ms ease-out both',
        'scale-in':       'scaleIn 200ms ease-out both',
        'pulse-dot':      'pulseDot 1.4s ease-in-out infinite',
        'draw-line':      'drawLine 1.8s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'gradient-drift': 'gradientDrift 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Verify Tailwind picks up new utilities**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0 (config is valid TS).

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "$(cat <<'EOF'
feat(animations): custom Tailwind keyframes for entrance, loading, and shimmer

Extends theme with 7 keyframes (fadeInUp, fadeIn, scaleIn, pulseDot,
drawLine, shimmer, gradientDrift) and 7 named animations consumed across
the new loader + landing/dashboard polish.

All animations use `both` fill mode so the end-state is visible even if
the animation utility gets purged or fails to fire — no opacity:0 stuck
states.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add global reduced-motion + view-transition CSS

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the file's contents**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { @apply bg-neutral-950 text-neutral-100; }

/* Free smooth route fades in modern browsers; Firefox ignores. */
@view-transition { navigation: auto; }

/* Reveal-on-scroll base. Default = visible so SSR/no-JS shows content. */
.reveal-on-scroll {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 600ms ease-out, transform 600ms ease-out;
}

/* When JS mounts, useReveal sets data-reveal="pending" until in viewport,
   then "shown". Pending state hides; shown state animates in. */
.reveal-on-scroll[data-reveal="pending"] {
  opacity: 0;
  transform: translateY(12px);
}
.reveal-on-scroll[data-reveal="shown"] {
  opacity: 1;
  transform: translateY(0);
}

/* Respect users who've asked for reduced motion. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .reveal-on-scroll[data-reveal="pending"] {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 2: Verify build still succeeds**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "$(cat <<'EOF'
feat(accessibility): reduced-motion safety + view-transition + reveal CSS

Three global additions:

1. @view-transition { navigation: auto } — free smooth route fades in
   Chrome/Edge/Safari. Firefox ignores. Zero JS, zero bundle cost.

2. prefers-reduced-motion media query — clamps every animation and
   transition to 0.01ms when the user has requested reduced motion.
   One sweep catches every keyframe we add elsewhere.

3. .reveal-on-scroll progressive-enhancement CSS — defaults to visible
   so non-JS users see content; hooks into data-reveal attribute set
   by the useReveal IntersectionObserver hook.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create `<LatticeLoader>` component

**Files:**
- Create: `app/components/LatticeLoader.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

/**
 * Branded loading indicator: three nodes (emerald/amber/pink) pulsing in
 * sequence with two edges drawing between them. Mirrors the look of
 * /graph so the loading state primes the user for what's coming.
 *
 * Sizes:
 *   sm — 32px (inline / button)
 *   md — 64px (default; data-fetch placeholders)
 *   lg — 96px (full-pane / route loaders)
 */
export default function LatticeLoader({
  label,
  size = 'md',
  className = '',
}: {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const px = size === 'sm' ? 32 : size === 'lg' ? 96 : 64;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Edge: emerald node → amber node */}
        <line
          x1="14" y1="20" x2="50" y2="20"
          stroke="#34d399"
          strokeWidth="1.5"
          strokeDasharray="40"
          strokeLinecap="round"
          className="animate-draw-line"
        />
        {/* Edge: amber node → pink node */}
        <line
          x1="50" y1="20" x2="32" y2="48"
          stroke="#fbbf24"
          strokeWidth="1.5"
          strokeDasharray="40"
          strokeLinecap="round"
          className="animate-draw-line"
          style={{ animationDelay: '300ms' }}
        />
        {/* Node 1 — emerald */}
        <circle
          cx="14" cy="20" r="5"
          fill="#34d399"
          className="animate-pulse-dot"
          style={{ transformOrigin: '14px 20px' }}
        />
        {/* Node 2 — amber */}
        <circle
          cx="50" cy="20" r="5"
          fill="#fbbf24"
          className="animate-pulse-dot"
          style={{ transformOrigin: '50px 20px', animationDelay: '200ms' }}
        />
        {/* Node 3 — pink */}
        <circle
          cx="32" cy="48" r="5"
          fill="#f472b6"
          className="animate-pulse-dot"
          style={{ transformOrigin: '32px 48px', animationDelay: '400ms' }}
        />
      </svg>
      {label && (
        <div className="text-xs text-neutral-500 tracking-wide">
          {label}
        </div>
      )}
      <span className="sr-only">Loading{label ? `: ${label}` : ''}</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/LatticeLoader.tsx
git commit -m "$(cat <<'EOF'
feat(loader): branded LatticeLoader component

Inline SVG: three pulsing nodes (emerald / amber / pink) connected by
two edges that draw themselves in via animated stroke-dashoffset. The
node colours mirror /graph's actor palette so the loading state primes
the user for the live graph.

Three sizes (sm=32px, md=64px, lg=96px). Optional label below. Carries
aria-live/aria-busy + sr-only fallback for screen readers.

Will replace 'Loading graph…' text on /graph and back every
route-level loading.tsx file in the next commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create `useReveal` and `useCountUp` hooks

**Files:**
- Create: `app/hooks/useReveal.ts`
- Create: `app/hooks/useCountUp.ts`

- [ ] **Step 1: Create `useReveal.ts`**

```ts
'use client';

import { useEffect, useRef } from 'react';

/**
 * Scroll-reveal hook. Returns a ref to attach to any element with the
 * `.reveal-on-scroll` class. On mount, the element gets data-reveal="pending"
 * (which the CSS uses to hide it). When the element enters the viewport,
 * data-reveal="shown" triggers the transition to visible.
 *
 * Single-shot: once shown, the observer disconnects.
 *
 * Progressive enhancement: if IntersectionObserver isn't available or JS
 * doesn't run, the .reveal-on-scroll class defaults to visible.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return;

    el.setAttribute('data-reveal', 'pending');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute('data-reveal', 'shown');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
```

- [ ] **Step 2: Create `useCountUp.ts`**

```ts
'use client';

import { useEffect, useState } from 'react';

/**
 * Animates a number from 0 → target over `duration` ms with
 * requestAnimationFrame. Only animates once on initial mount; subsequent
 * target changes (e.g. polling) snap to the new value instantly so the
 * UI doesn't keep re-animating.
 *
 * Falls back to setting the final value immediately if rAF is unavailable
 * or the user has requested reduced motion.
 */
export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const [hasAnimatedOnce, setHasAnimatedOnce] = useState(false);

  useEffect(() => {
    if (hasAnimatedOnce) {
      setValue(target);
      return;
    }

    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      setValue(target);
      setHasAnimatedOnce(true);
      return;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setValue(target);
      setHasAnimatedOnce(true);
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic for a smoother settle than linear.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setHasAnimatedOnce(true);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // Intentionally only re-runs when `target` first becomes non-zero —
    // see hasAnimatedOnce guard above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}
```

- [ ] **Step 3: Verify type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/hooks/useReveal.ts app/hooks/useCountUp.ts
git commit -m "$(cat <<'EOF'
feat(hooks): useReveal (scroll-reveal) + useCountUp (stats animation)

useReveal:
- Returns a ref. On mount, sets data-reveal='pending' (CSS hides element).
- IntersectionObserver flips to data-reveal='shown' on viewport entry,
  which triggers the 600ms CSS transition to visible.
- Single-shot — observer disconnects after first reveal.
- Falls back to visible if IntersectionObserver is unavailable.

useCountUp:
- Animates 0 → target with requestAnimationFrame + easeOutCubic.
- Only animates ONCE per mount; subsequent target changes snap (so
  every 30s poll doesn't restart the count-up).
- Respects prefers-reduced-motion (snaps immediately).
- Safe SSR (returns 0 server-side, animates client-side after hydration).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create `<Skeleton>` primitive

**Files:**
- Create: `app/components/Skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

/**
 * Shimmer placeholder block. Use to fill the layout while data loads so
 * subsequent render doesn't reflow.
 *
 *   <Skeleton className="h-4 w-3/4 mb-2" />
 *
 * For multi-row lists, use the SkeletonRows helper.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-[length:200%_100%] animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * N rows of a skeleton card. Used by inbox / todos / audit while loading.
 */
export function SkeletonRows({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-neutral-800 rounded-lg p-4 space-y-2"
        >
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * 4-cell stat strip placeholder for the dashboard.
 */
export function SkeletonStats({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`} aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-neutral-800 rounded-lg p-4 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-7 w-1/3" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/Skeleton.tsx
git commit -m "$(cat <<'EOF'
feat(loader): Skeleton + SkeletonRows + SkeletonStats primitives

Three exports, all using the new shimmer animation:

- Skeleton — single shimmer block (height/width via className)
- SkeletonRows — N=3 default card rows with eyebrow/title/sub layout,
  matches inbox / todos / audit row shape
- SkeletonStats — 4-cell stat strip for the dashboard

Backed by a left→right gradient sweep (animate-shimmer, 2s linear).
Carries aria-busy + aria-hidden so screen readers don't read the
placeholder noise — the page itself announces loading state separately
via LatticeLoader's aria-live region where present.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Animate landing page entrance

**Files:**
- Modify: `app/LandingClient.tsx`

- [ ] **Step 1: Add the `useReveal` import + hero gradient drift**

In `app/LandingClient.tsx`, replace the existing imports block at the top:

```tsx
'use client';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { useReveal } from './hooks/useReveal';
```

- [ ] **Step 2: Refactor `LandingClient` to add hero stagger + scroll reveals**

Replace the entire `LandingClient` function (the default export) with:

```tsx
export default function LandingClient() {
  const { user, account, loading } = useAuth();
  const isSignedIn = !!user;

  const painRef = useReveal<HTMLElement>();
  const anatomyRef = useReveal<HTMLElement>();
  const ctaRef = useReveal<HTMLElement>();

  return (
    <div>
      {/* Own minimal header — AppShell skips its nav for this route */}
      <header className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg flex items-center gap-2 transition-colors duration-150 hover:text-amber-300">
            <span className="text-amber-400">◉</span> Lattice
          </Link>
          <div className="flex items-center gap-3">
            {!loading && (
              isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-sm font-medium transition-colors duration-150 active:scale-[0.97]"
                >
                  Go to dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="text-sm text-neutral-300 hover:text-white transition-colors duration-150">
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-4 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-sm font-medium transition-colors duration-150 active:scale-[0.97]"
                  >
                    Get started
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero — staggered entrance, subtle gradient drift behind */}
        <section className="mb-20 relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-40 pointer-events-none animate-gradient-drift"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 30% 20%, rgba(251,191,36,0.10), transparent 60%), radial-gradient(ellipse 50% 35% at 70% 60%, rgba(52,211,153,0.08), transparent 60%)',
              backgroundSize: '200% 200%',
            }}
          />
          <div
            className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-4 font-medium animate-fade-in-up"
            style={{ animationDelay: '0ms' }}
          >
            Lattice · Autonomous Ecosystem Operations OS
          </div>
          <h1
            className="text-5xl md:text-6xl font-semibold leading-tight mb-6 animate-fade-in-up"
            style={{ animationDelay: '120ms' }}
          >
            Relationships that run themselves.
            <br />
            <span className="text-neutral-500">An ecosystem that completes itself.</span>
          </h1>
          <p
            className="text-neutral-300 max-w-3xl text-lg leading-relaxed mb-8 animate-fade-in-up"
            style={{ animationDelay: '240ms' }}
          >
            Lattice is built for <span className="text-white font-medium">programme owners and ecosystem
            administrators</span> at accelerators, corporate venture arms, and agencies like Cradle.
            We turn every linkage in your ecosystem — mentor ↔ founder, company ↔ programme,
            partner ↔ initiative — into a <span className="text-emerald-400">first-class AI agent</span>
            {' '}that proposes its own next action. You stop coordinating. You start governing.
          </p>
          {!loading && (
            <div
              className="flex gap-3 animate-fade-in-up"
              style={{ animationDelay: '360ms' }}
            >
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded bg-emerald-700 hover:bg-emerald-600 text-sm font-medium transition-colors duration-150 active:scale-[0.97]"
                >
                  Open your dashboard{account ? ` · ${account.name}` : ''}
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="px-5 py-2.5 rounded bg-amber-700 hover:bg-amber-600 text-sm font-medium transition-colors duration-150 active:scale-[0.97]"
                  >
                    Get started — bootstrap your account
                  </Link>
                  <Link
                    href="/sign-in"
                    className="px-5 py-2.5 rounded border border-neutral-700 hover:bg-neutral-900 text-sm font-medium transition-colors duration-150 active:scale-[0.97]"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          )}
        </section>

        {/* Why this matters → How Lattice answers */}
        <section ref={painRef} className="mb-20 reveal-on-scroll">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4 font-medium">
            The Cradle problem · How Lattice solves each piece
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Pain
              problem="Complex Actor Networks"
              problemBody="Innovation ecosystems span companies, mentors, partners, and service providers across programmes and regions."
              solution="Live ecosystem graph"
              solutionBody="Every actor, every linkage, in one force-directed view. Click any edge to see its full memory and policy."
              color="emerald"
            />
            <Pain
              problem="Everything Is Manual Today"
              problemBody="Admins verify participants, match mentors, assign cohorts, and track engagement — every time, from scratch."
              solution="Autonomous Stewards"
              solutionBody="Each relationship has its own AI agent that proposes the next session, intro, or escalation — grounded in past outcomes and citation-validated. You approve or edit."
              color="amber"
            />
            <Pain
              problem="Growth Amplifies the Pain"
              problemBody="At scale, manual coordination breaks. Programmes can't share signal across cohorts or borders. Gaps go unnoticed."
              solution="Cartographer meta-agent"
              solutionBody="Scans the whole graph for structural gaps — over-allocated mentors, dormant partners, missing expertise — and proposes new linkages to fill them."
              color="amber"
            />
            <Pain
              problem="Lost Intelligence"
              problemBody="Past engagements never inform future matching. Each cohort restarts from zero. Insight evaporates between programmes."
              solution="Outcome-grounded reasoning"
              solutionBody="Every approved action becomes a citable outcome. The next Steward tick retrieves the most-relevant past outcomes via embeddings — the ecosystem learns from itself."
              color="emerald"
            />
          </div>
        </section>

        {/* Anatomy of a Lattice Relationship */}
        <section ref={anatomyRef} className="mb-20 reveal-on-scroll">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4 font-medium">
            What is a Lattice relationship?
          </div>
          <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/30 transition-colors duration-200 hover:border-neutral-700">
            <p className="text-neutral-300 mb-5 max-w-3xl leading-relaxed">
              Today, a mentor-founder pairing is a row in a spreadsheet. In Lattice, it&apos;s a{' '}
              <span className="text-emerald-300 font-medium">first-class entity</span> with its own
              schema, its own AI agent, its own memory, and its own governance — defined, automated,
              governed, and reused across programmes.
            </p>

            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-6">
              <PartyCard color="#34d399" type="Party A" name="<actor>" sub="any type · profile · expertise tags · capacity" />
              <div className="text-center">
                <div className="px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-700/60 text-emerald-300 text-xs whitespace-nowrap inline-block">
                  ⟶ relationship ⟵
                </div>
                <div className="text-xs text-neutral-500 mt-1">cadence · focus tags</div>
              </div>
              <PartyCard color="#60a5fa" type="Party B" name="<actor>" sub="any type · profile · expertise tags · capacity" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <AnatomyBlock
                label="Schema"
                accent="emerald"
                body={
                  <div className="space-y-1 text-sm font-mono">
                    <KV k="type" v="mentorship | company_in_programme | partner_in_initiative | service_engagement" />
                    <KV k="state" v="active | escalated | tapered | closed" />
                    <KV k="focus" v="string[]" />
                    <KV k="cadence" v="string" />
                  </div>
                }
                hint="A typed, queryable record. Same shape across every account, every programme."
              />

              <AnatomyBlock
                label="Steward (AI agent)"
                accent="emerald"
                body={
                  <div className="text-sm text-neutral-300 space-y-1.5">
                    <div>↻ reads recent outcomes + retrieves similar past ones via embeddings</div>
                    <div>↻ reasons with Gemini, picks one action from a 7-action whitelist</div>
                    <div>↻ cites every claim (outcome:id, profile:actor.field)</div>
                    <div>↻ surfaces a proposal — never executes without your nod</div>
                  </div>
                }
                hint="Per-relationship AI that runs autonomously."
              />

              <AnatomyBlock
                label="Policy (programmable)"
                accent="amber"
                body={
                  <pre className="text-xs text-neutral-300 bg-neutral-950 rounded p-2 overflow-x-auto whitespace-pre-wrap">{`escalation:
  triggers:
    - if: <metric>
      value: <threshold>
      action: <admin_signal>

sunset:
  triggers:
    - if: <event>
      value: <match>
      action: close | review`}</pre>
                }
                hint="Edit the YAML, save, and the next Steward tick obeys the new rule."
              />

              <AnatomyBlock
                label="Outcomes (memory)"
                accent="emerald"
                body={
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="text-neutral-300">
                      <span className="text-emerald-400">session_held</span>
                      <span className="text-neutral-500"> | </span>
                      <span className="text-emerald-400">intro_made</span>
                      <span className="text-neutral-500"> | </span>
                      <span className="text-emerald-400">milestone</span>
                    </div>
                    <div className="text-neutral-300">
                      <span className="text-emerald-400">issue</span>
                      <span className="text-neutral-500"> | </span>
                      <span className="text-emerald-400">closing_note</span>
                    </div>
                    <div className="text-neutral-500 text-[10px] pt-1">
                      each outcome: { '{ id, type, evidence_text, source, verified, timestamp }' }
                    </div>
                  </div>
                }
                hint="Every approval becomes citable evidence for the next tick."
              />
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section ref={ctaRef} className="mb-12 text-center reveal-on-scroll">
          {!loading && (isSignedIn ? (
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 rounded bg-emerald-700 hover:bg-emerald-600 text-sm font-medium transition-colors duration-150 active:scale-[0.97]"
            >
              Go to your dashboard →
            </Link>
          ) : (
            <Link
              href="/sign-up"
              className="inline-block px-6 py-3 rounded bg-amber-700 hover:bg-amber-600 text-sm font-medium transition-colors duration-150 active:scale-[0.97]"
            >
              Bootstrap your Lattice account →
            </Link>
          ))}
        </section>

        {/* Footer */}
        <footer className="text-xs text-neutral-600 pt-6 border-t border-neutral-900">
          Built for Build with AI 2026 KL — MyHack · Cradle problem statement:
          <em> Automating Ecosystem Linkages Instead of Manual Coordination</em>.
          Powered by Gemini 3.1, Vertex AI embeddings, Firestore, Firebase Auth, and Cloud Run.
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Leave the helper components (`Pain`, `PartyCard`, `AnatomyBlock`, `KV`, `OutcomeRow`) below unchanged**

These already exist below the default export. Don't touch them — they're used by the new function body above.

Also add `transition-colors duration-200 hover:border-neutral-700` to the `Pain` helper's outer div so card hover feels alive. Edit the `Pain` function in the same file:

```tsx
function Pain({
  problem, problemBody, solution, solutionBody, color,
}: {
  problem: string; problemBody: string; solution: string; solutionBody: string;
  color: 'emerald' | 'amber';
}) {
  const accent = color === 'emerald' ? 'text-emerald-400' : 'text-amber-400';
  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden transition-colors duration-200 hover:border-neutral-700">
      <div className="p-4 bg-rose-950/10 border-b border-neutral-800">
        <div className="text-xs uppercase tracking-wider text-rose-400 mb-1 font-medium">The pain</div>
        <div className="font-semibold mb-1">{problem}</div>
        <div className="text-sm text-neutral-400 leading-relaxed">{problemBody}</div>
      </div>
      <div className="p-4">
        <div className={`text-xs uppercase tracking-wider ${accent} mb-1 font-medium`}>Lattice answers with</div>
        <div className="font-semibold mb-1">{solution}</div>
        <div className="text-sm text-neutral-400 leading-relaxed">{solutionBody}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify type-check + build**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add app/LandingClient.tsx
git commit -m "$(cat <<'EOF'
feat(landing): staggered hero entrance + scroll reveals + hover polish

Three visual upgrades to the public landing page:

1. Hero stagger — eyebrow (0ms) → h1 (120ms) → paragraph (240ms) → CTA
   row (360ms) all fade-up with the new animate-fade-in-up keyframe.
   Animation uses 'both' fill mode so end-state is visible even if the
   class fails to fire.

2. Subtle hero gradient drift — two radial-gradient blobs (amber +
   emerald, ~10% opacity) drift across the hero on an 18s loop via
   animate-gradient-drift. Adds 'aliveness' without distracting from copy.

3. Scroll reveals — the Pain grid, Anatomy block, and bottom CTA each
   carry a useReveal ref + .reveal-on-scroll class. IntersectionObserver
   flips data-reveal on viewport entry, triggering the 600ms fade-up.
   Progressive enhancement: no-JS / no-Observer falls back to visible.

4. Universal button + card polish — every CTA gets transition-colors
   duration-150 + active:scale-[0.97]; Pain cards get a hover border
   highlight.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Wire `<LatticeLoader>` into the graph page

**Files:**
- Modify: `app/graph/GraphClient.tsx`
- Create: `app/graph/loading.tsx`

- [ ] **Step 1: Replace the in-page loading state in GraphClient**

In `app/graph/GraphClient.tsx`, find line 133:

```tsx
  if (!data) return <div className="text-neutral-500 py-8">Loading graph…</div>;
```

Replace with:

```tsx
  if (!data) return (
    <div className="border border-neutral-800 rounded-lg py-24 flex items-center justify-center" style={{ height: '60vh' }}>
      <LatticeLoader size="lg" label="Materialising your ecosystem…" />
    </div>
  );
```

Also add the import at the top of the file, near the other component imports:

```tsx
import LatticeLoader from '../components/LatticeLoader';
```

- [ ] **Step 2: Add a fade-in to the graph container so it doesn't pop**

In the same file, find the graph canvas wrapper div:

```tsx
      <div ref={canvasContainerRef} className="border border-neutral-800 rounded-lg relative overflow-hidden" style={{ height: '60vh' }}>
```

Replace with:

```tsx
      <div ref={canvasContainerRef} className="border border-neutral-800 rounded-lg relative overflow-hidden animate-fade-in" style={{ height: '60vh' }}>
```

(Just appending `animate-fade-in` to the className.)

- [ ] **Step 3: Create the route-level loading state**

Create `app/graph/loading.tsx`:

```tsx
import LatticeLoader from '../components/LatticeLoader';

export default function GraphLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2 font-medium">
          View · Live ecosystem graph
        </div>
        <h1 className="text-2xl font-semibold mb-1">Your ecosystem at a glance</h1>
      </div>
      <div className="border border-neutral-800 rounded-lg py-24 flex items-center justify-center" style={{ height: '60vh' }}>
        <LatticeLoader size="lg" label="Materialising your ecosystem…" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify type-check + build**

Run:
```bash
npx tsc --noEmit
npx next build
```
Expected: both exit 0. Build output may show a "Loading" stat for the graph route — that's expected.

- [ ] **Step 5: Commit**

```bash
git add app/graph/GraphClient.tsx app/graph/loading.tsx
git commit -m "$(cat <<'EOF'
feat(graph): branded LatticeLoader replaces 'Loading graph…' text

Two surfaces:

1. In-page loader — when GraphClient is mounted but data hasn't arrived
   yet, render LatticeLoader (size=lg) inside a 60vh canvas-shaped frame
   so the layout matches what comes next. Graph canvas fades in (400ms)
   when data arrives instead of popping.

2. Route-level loading.tsx — Next.js streams this during route transition
   before the GraphClient JS is loaded, so navigating to /graph from
   anywhere else shows the loader instantly.

Both surfaces use the same node-and-edge SVG so the visual is consistent.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Add route-level loading.tsx for inbox / todos / audit / relationships

**Files:**
- Create: `app/inbox/loading.tsx`
- Create: `app/todos/loading.tsx`
- Create: `app/audit/loading.tsx`
- Create: `app/relationships/[id]/loading.tsx`

- [ ] **Step 1: Create `app/inbox/loading.tsx`**

```tsx
import { SkeletonRows } from '../components/Skeleton';

export default function InboxLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-2 font-medium">
          Inbox · Approvals queue
        </div>
        <h1 className="text-2xl font-semibold mb-1">Decisions waiting on you</h1>
      </div>
      <SkeletonRows count={4} />
    </div>
  );
}
```

- [ ] **Step 2: Create `app/todos/loading.tsx`**

```tsx
import { SkeletonRows } from '../components/Skeleton';

export default function TodosLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2 font-medium">
          Action queue
        </div>
        <h1 className="text-2xl font-semibold mb-1">Your next actions</h1>
      </div>
      <SkeletonRows count={3} />
    </div>
  );
}
```

- [ ] **Step 3: Create `app/audit/loading.tsx`**

```tsx
import { SkeletonRows } from '../components/Skeleton';

export default function AuditLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2 font-medium">
          Governance · Audit log
        </div>
        <h1 className="text-2xl font-semibold mb-1">Every admin action, recorded</h1>
      </div>
      <SkeletonRows count={5} />
    </div>
  );
}
```

- [ ] **Step 4: Create `app/relationships/[id]/loading.tsx`**

```tsx
import LatticeLoader from '../../components/LatticeLoader';

export default function RelationshipLoading() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="flex items-center justify-center min-h-[50vh]">
        <LatticeLoader size="lg" label="Loading relationship…" />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify type-check + build**

Run:
```bash
npx tsc --noEmit
npx next build
```
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/inbox/loading.tsx app/todos/loading.tsx app/audit/loading.tsx app/relationships/[id]/loading.tsx
git commit -m "$(cat <<'EOF'
feat(loaders): route-level loading.tsx for inbox / todos / audit / relationships

Next.js App Router streams the matching loading.tsx whenever a route is
transitioning or its data is fetching. Until now we returned nothing —
the screen went blank between nav-click and page paint. Each route now
shows a skeleton or LatticeLoader matched to the destination layout.

- inbox      — SkeletonRows ×4 (matches Steward + Cartographer row shape)
- todos      — SkeletonRows ×3
- audit      — SkeletonRows ×5
- relationships/[id] — LatticeLoader (graph branding for the per-edge view)

Eyebrow + h1 are repeated so the user sees the route 'land' instantly
even though the body is still loading.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Animate modal entrance

**Files:**
- Modify: `app/components/Modal.tsx`

- [ ] **Step 1: Replace the file's contents**

```tsx
'use client';
import { useEffect } from 'react';

export default function Modal({
  open, onClose, title, children, width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-12 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-neutral-950 border border-neutral-800 rounded-lg w-full mx-4 ${width} animate-scale-in`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
          <h2 className="font-semibold text-sm">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-200 text-lg leading-none transition-colors duration-150"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/Modal.tsx
git commit -m "$(cat <<'EOF'
feat(modal): backdrop fade-in + content scale-in entrance animation

Adds animate-fade-in to the backdrop (150ms) and animate-scale-in to
the content panel (200ms easing from 0.96 scale). Applies to every
modal in the app (Add Actor, Add Relationship, ApprovalResultModal,
Dispatch, etc.) without per-callsite changes.

Exit animation deliberately skipped — Modal unmounts on close, which
would require a state-machine refactor to support a leave anim, and the
demo value is marginal compared to entrance polish.

Close button also picks up transition-colors so the hover feels
consistent with the rest of the polish pass.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Add skeleton + count-up to dashboard

**Files:**
- Modify: `app/DashboardClient.tsx`

- [ ] **Step 1: Read the existing DashboardClient.tsx first to understand its shape**

Before editing, run:
```bash
cat app/DashboardClient.tsx | head -100
```

This task assumes the stats are rendered in a strip of `<div>`s with numeric children. The plan-time approach:

1. Identify where the numeric stats are rendered (look for `actorCount`, `relationshipCount`, or similar).
2. Wrap each numeric display with `useCountUp(value, 600)`.
3. While `loading` is true (the existing state), render `<SkeletonStats />` instead of the stats strip.

- [ ] **Step 2: Add the imports at the top of `app/DashboardClient.tsx`**

```tsx
import { useCountUp } from './hooks/useCountUp';
import { SkeletonStats } from './components/Skeleton';
```

(Add these after the existing imports — keep `'use client'` as the first line.)

- [ ] **Step 3: Wrap each stat number with `useCountUp`**

Find each stat display in the dashboard — typically rendered as `{stats.actors}` or similar inside a stat card. For each one, declare an animated version at the top of the component body and use that instead. Example:

```tsx
// Inside DashboardClient(), after the existing useState/useEffect declarations:
const actorCount = useCountUp(stats?.actors ?? 0);
const relationshipCount = useCountUp(stats?.relationships_active ?? 0);
const inboxCount = useCountUp(stats?.inbox_pending ?? 0);
const todoCount = useCountUp(stats?.todos_open ?? 0);
```

Then replace `{stats.actors}` (and the other three) with `{actorCount}`, `{relationshipCount}`, `{inboxCount}`, `{todoCount}` respectively.

**IMPORTANT:** The actual field names on `stats` may differ. Read the existing DashboardClient.tsx and `/api/stats` shape first to use the correct names. If `stats` is null while loading, return early or render skeleton in that branch.

- [ ] **Step 4: Render `<SkeletonStats>` while loading**

Find the section that renders the stats strip. If there's a guard like `if (!stats) return ...;` or `{stats ? <Stats /> : <Loading />}`, swap the loading branch for:

```tsx
<SkeletonStats className="mb-6" />
```

If the stats strip is rendered unconditionally and just shows `0`s while loading, wrap it:

```tsx
{stats ? (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
    {/* existing stat cards using actorCount/relationshipCount/inboxCount/todoCount */}
  </div>
) : (
  <SkeletonStats className="mb-6" />
)}
```

- [ ] **Step 5: Verify type-check + build**

Run:
```bash
npx tsc --noEmit
npx next build
```
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/DashboardClient.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): stats count-up + skeleton placeholder

Two polish wins for the dashboard's first paint:

1. SkeletonStats — replaces the empty stat strip during initial /api/stats
   fetch so the layout doesn't jump from blank → numbers. Four shimmer
   cells matching the live grid shape.

2. useCountUp — when stats arrive, each of the four numbers (Actors,
   Active relationships, Pending inbox, Open todos) animates from 0 →
   target over 600ms with easeOutCubic. Only fires on initial mount;
   subsequent 30s polls snap to new values (no jarring re-animation).

Respects prefers-reduced-motion (snaps immediately).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Replace inline loading text in inbox / todos / audit clients

**Files:**
- Modify: `app/inbox/InboxClient.tsx`
- Modify: `app/todos/TodosClient.tsx`
- Modify: `app/audit/AuditClient.tsx`

The route-level loading.tsx files only fire during route transitions and Suspense data fetches. Once the client mounts, any subsequent `fetch()` that toggles a local `loading` state needs its own skeleton.

- [ ] **Step 1: For each client file, find the inline "Loading…" text and swap to SkeletonRows**

In `app/inbox/InboxClient.tsx`, find the loading branch — likely something like:

```tsx
{loading && <div className="text-neutral-500">Loading…</div>}
```

or a `if (loading) return …` early return. Replace the placeholder text with:

```tsx
<SkeletonRows count={4} />
```

Add the import at the top:

```tsx
import { SkeletonRows } from '../components/Skeleton';
```

Also add `animate-fade-in` class to the toast container's outer div (find the line near `{toast && (` block):

```tsx
{toast && (
  <div className={`fixed bottom-4 right-4 max-w-md px-4 py-3 rounded-lg border animate-fade-in ${
    toast.kind === 'success' ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-200' :
    toast.kind === 'error' ? 'border-rose-900 bg-rose-950/30 text-rose-200' :
    'border-neutral-800 bg-neutral-900/80 text-neutral-200'
  }`}>
    {/* existing toast body */}
  </div>
)}
```

(Just append `animate-fade-in` to the existing className — the rest of the toast template is unchanged.)

- [ ] **Step 2: Repeat for `app/todos/TodosClient.tsx`**

Same pattern. Import `SkeletonRows`, swap any inline loading text for `<SkeletonRows count={3} />`, append `animate-fade-in` to the toast's outermost wrapper.

- [ ] **Step 3: Repeat for `app/audit/AuditClient.tsx`**

Import `SkeletonRows`, swap loading text for `<SkeletonRows count={5} />`. No toast in this file — skip the toast step.

- [ ] **Step 4: Verify type-check + build**

Run:
```bash
npx tsc --noEmit
npx next build
```
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/inbox/InboxClient.tsx app/todos/TodosClient.tsx app/audit/AuditClient.tsx
git commit -m "$(cat <<'EOF'
feat(skeletons): inline loading states use SkeletonRows + toast fade-in

The route-level loading.tsx files only fire on initial route transition.
For subsequent client-driven refreshes (after Approve, after Dismiss,
after Mark done), each *Client component manages its own loading state.
Until now those rendered plain 'Loading…' text. Now they render the
same SkeletonRows component used by loading.tsx — so the user sees the
same placeholder shape whether they arrived via nav or via a refresh.

Toasts in InboxClient + TodosClient pick up animate-fade-in (400ms ease
in) so they slide into view instead of popping.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Apply universal button + nav polish

**Files:**
- Modify: `app/AppShell.tsx`

- [ ] **Step 1: Read the AppShell file**

Run:
```bash
cat app/AppShell.tsx
```

- [ ] **Step 2: Add `transition-colors duration-150` to every nav link `<Link>` className**

For each `<Link>` in the file that has Tailwind hover classes (`hover:text-white`, `hover:bg-…`, `hover:border-…`), append `transition-colors duration-150` to the className.

For each `<button>` or `<Link>` styled as a primary action (`bg-emerald-700`, `bg-amber-700`, `bg-rose-700`), append `transition-colors duration-150 active:scale-[0.97]`.

For the sign-out button specifically, append `transition-colors duration-150` so the hover feels smooth.

- [ ] **Step 3: Verify type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/AppShell.tsx
git commit -m "$(cat <<'EOF'
feat(ui-polish): smooth color transitions + active-press feedback on nav

Every nav link and primary-action button in AppShell picks up:
- transition-colors duration-150 — hover state fades in instead of
  flipping instantly, which reads as more premium
- active:scale-[0.97] on primary CTAs — tactile press feedback

No behaviour changes; pure visual polish.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Final verification — build + manual smoke test

- [ ] **Step 1: Full type-check + production build + test suite**

Run:
```bash
npx tsc --noEmit && npx next build && npx vitest run
```

Expected:
- tsc: exits 0, no errors
- next build: completes, all routes prerender or are marked dynamic; no warnings about missing animations
- vitest: 19/19 passing (no logic changes; should be untouched)

- [ ] **Step 2: Start dev server and walk each route**

```bash
npm run dev
```

Open in a browser:

| Route | What to check |
|---|---|
| `/` | Hero eyebrow → h1 → para → CTA fade up in sequence; gradient drifts behind hero; scrolling reveals Pain grid + Anatomy + bottom CTA |
| `/dashboard` | Stats strip starts as shimmer skeletons, then numbers animate 0 → value |
| `/graph` | LatticeLoader pulses in canvas-shaped frame before graph appears; graph fades in |
| `/inbox` | SkeletonRows show during fetch; toast (after Approve/Dismiss) fades in |
| `/todos` | SkeletonRows during fetch; toast (after Mark done) fades in |
| `/audit` | SkeletonRows during fetch |
| `/relationships/:id` | LatticeLoader during fetch |
| Any modal (Add actor, Approve, etc.) | Backdrop fades in, content scales in from 0.96 |
| Reduced-motion toggle in DevTools (Rendering → Emulate CSS media features → prefers-reduced-motion: reduce) | Every animation should snap to its end-state |

If any step fails, fix and re-verify before continuing. Do NOT commit unless this step passes.

- [ ] **Step 3: Confirm bundle delta**

Run:
```bash
npx next build 2>&1 | grep -E "(First Load JS|Size)" | head -20
```

Compare to expectation: total JS delta should be <2 KB across all routes (LatticeLoader, hooks, Skeleton are small client components; Tailwind keyframes are CSS-only).

- [ ] **Step 4: Final commit (only if anything was changed during verification)**

If verification surfaced no issues, no further commit needed — the previous 12 commits are the full work. Otherwise commit any fixes with:

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(polish): address issues found during final smoke test

[describe fixes inline]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** All 9 spec sections (Tailwind config, LatticeLoader, landing entrance, modal lifecycle, skeleton states, count-up, view transitions, reduced-motion, hover polish) map to a task. Task 1 covers §4.1, Task 2 covers §4.8 + §4.9, Task 3 covers §4.2, Task 4 covers the hooks needed by §4.3 + §4.7, Task 5 covers §4.6, Task 6 covers §4.3 + part of §4.5 (landing buttons), Task 7+8 cover the loading.tsx half of §4.6 + the graph loader from §4.3, Task 9 covers §4.4, Task 10 covers §4.7, Task 11 covers the inline-loading half of §4.6 + the toast half of §4.4, Task 12 covers the remaining §4.5 (AppShell nav).
- **No placeholders:** Every step has a concrete file path, exact code, exact command. Task 10 step 3 has one note about reading the existing file first to confirm field names — that's not a placeholder, it's a deliberate cautionary check for a file we haven't yet read.
- **Type consistency:** `LatticeLoader` props `{label, size, className}` are consistent across every usage. `useReveal<T>` and `useCountUp(target, duration)` signatures consistent. Skeleton exports `{Skeleton, SkeletonRows, SkeletonStats}` named in plan match imports.
