# Lattice — Animation & Loading Polish

Author: Claude (Opus 4.7 · paired session)
Date: 2026-05-16
Status: Approved — moving to implementation plan

---

## 1. Goal

Make Lattice feel **lively and premium** in the pitch demo without bloating
the bundle or adding new dependencies. Replace inert "Loading…" text with
on-brand loading states. Add motion to entrance moments, hover states,
modal/toast lifecycle, and route transitions.

Optimised for the 9 am 17 May submission and the afternoon-of-17 May
finals demo arc.

## 2. Non-goals

- Animating inside the force-graph canvas (node spawn / edge draw beyond
  what `react-force-graph-2d` already does)
- Page-transition loading bar (nprogress-style) — skeletons cover the
  same UX need
- Citation chip stagger (invisible at demo pace)
- Adding `framer-motion` or any new animation runtime
- Mobile-specific touch micro-interactions

## 3. Constraints

- **Bundle impact must stay under 1 KB gzipped** — Tailwind purges unused
  utilities; SVGs are inline; no new deps
- **Must not break SSR** — Next.js 14 App Router; some animation hooks
  need `'use client'` boundaries, but the base CSS works server-side
- **Must not regress accessibility** — respect `prefers-reduced-motion`
  on every keyframe-based animation
- **Must not introduce layout shift** — animations transform/opacity only,
  not width/height/margin

## 4. Architecture

Five surfaces of change, each a self-contained unit:

```
1. Tailwind config             — adds custom keyframes + animation utilities
2. LatticeLoader component     — branded SVG loader, reusable
3. Landing page entrance       — staggered fade-up + scroll reveal hook
4. Modal + toast lifecycle     — backdrop fade, content scale-in, exit anim
5. Skeleton states             — inbox/todos/audit/dashboard placeholders
```

Plus one global addition: `@view-transition` CSS for free route fades in
modern browsers.

### 4.1 Tailwind config additions

Extend `tailwind.config.ts → theme.extend`:

```ts
keyframes: {
  fadeInUp:  { '0%': { opacity: '0', translate: '0 8px' },
               '100%': { opacity: '1', translate: '0 0' } },
  fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
  scaleIn:   { '0%': { opacity: '0', transform: 'scale(0.96)' },
               '100%': { opacity: '1', transform: 'scale(1)' } },
  pulseDot:  { '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.85)' },
               '40%':           { opacity: '1',   transform: 'scale(1.1)' } },
  drawLine:  { '0%':   { strokeDashoffset: '40' },
               '100%': { strokeDashoffset: '0' } },
  shimmer:   { '0%': { backgroundPosition: '-200% 0' },
               '100%': { backgroundPosition: '200% 0' } },
  gradientDrift: { '0%, 100%': { backgroundPosition: '0% 50%' },
                   '50%':       { backgroundPosition: '100% 50%' } },
},
animation: {
  'fade-in-up':     'fadeInUp 500ms ease-out both',
  'fade-in':        'fadeIn 400ms ease-out both',
  'scale-in':       'scaleIn 200ms ease-out both',
  'pulse-dot':      'pulseDot 1.4s ease-in-out infinite',
  'draw-line':      'drawLine 1.6s ease-in-out infinite',
  'shimmer':        'shimmer 2s linear infinite',
  'gradient-drift': 'gradientDrift 18s ease-in-out infinite',
},
```

Reasoning: ~7 keyframes covers every animation in this spec. They compose
via Tailwind utilities — no per-component CSS files needed.

### 4.2 `<LatticeLoader>` component

`app/components/LatticeLoader.tsx`. Inline SVG, no external assets.

```
                  (node, emerald, pulse-dot, delay 0ms)
                    /
                   /  edge — draw-line, emerald
                  /
                (node, amber, pulse-dot, delay 200ms)
                  \
                   \  edge — draw-line, amber
                    \
                  (node, pink, pulse-dot, delay 400ms)
```

Props:
- `label?: string` — caption text below the SVG (e.g. "Materialising your ecosystem…")
- `size?: 'sm' | 'md' | 'lg'` — `sm` = 32px (inline button), `md` = 64px (default), `lg` = 96px (full-pane)
- `className?: string`

Color palette: matches the actor node colours in `GraphClient` (emerald
#34d399, amber #fbbf24, pink #f472b6).

Used in:
- `/graph` initial load (replaces "Loading graph…" text)
- `app/graph/loading.tsx`, `app/inbox/loading.tsx`, `app/todos/loading.tsx`,
  `app/audit/loading.tsx`, `app/relationships/[id]/loading.tsx` —
  Next.js route-segment loading.

### 4.3 Landing page entrance

`app/LandingClient.tsx`:

- **Hero stagger** — add `animate-fade-in-up` to eyebrow / h1 / paragraph /
  CTA row, each with a `style={{ animationDelay: '<N>ms' }}` of 0/120/240/360 ms.
- **Hero gradient drift** — wrap hero section in a div with a subtle
  radial-gradient background and `animate-gradient-drift`. 18 s loop,
  almost imperceptible movement, conveys "alive".
- **Scroll-reveal hook** — new `app/hooks/useReveal.ts` exposing a `ref`
  that adds `.revealed` class when the element enters viewport
  (IntersectionObserver, single-shot). Pain grid, Anatomy section, and
  bottom CTA each get a ref.
- **Reveal CSS** — `.reveal-on-scroll { opacity: 0; translate: 0 12px; transition: opacity 600ms ease-out, translate 600ms ease-out; }` plus `.reveal-on-scroll.revealed { opacity: 1; translate: 0 0; }`.

### 4.4 Modal + toast lifecycle

`app/components/Modal.tsx`:

- Backdrop: `animate-fade-in` (150 ms)
- Content: `animate-scale-in` (200 ms)
- Exit: since the existing `Modal` unmounts on close, we get no exit
  animation for free. **Decision: accept this.** Exit anim would require
  state machine refactor; not worth it for the demo.

`app/Toaster.tsx` / `app/Toast.tsx` (whichever the existing file is):

- Already has entry; verify the entry uses `fade-in` or migrate to it
- Add `animate-fade-in` to entry; exit is auto-dismiss timer +
  unmount (no exit anim needed since toasts auto-clear).

### 4.5 Universal hover + active polish

A single sweep across `app/AppShell.tsx` and major page components:

- **Primary buttons** (`bg-emerald-700`, `bg-amber-700`) — add
  `transition-colors duration-150 active:scale-[0.97]`
- **Card surfaces** (`border border-neutral-800 rounded-lg`) — add
  `transition-colors duration-200 hover:border-neutral-700` where it's a
  link/clickable
- **Nav links** — already have `hover:text-white`; add `transition-colors duration-150`

This is a global polish pass — should touch <15 files.

### 4.6 Skeleton states

For each data-driven page that currently renders nothing while loading
(`/inbox`, `/todos`, `/audit`, `/dashboard` stats strip):

- Add a skeleton component that mirrors the row shape (height, layout,
  count = 3 or 4)
- Uses `bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-[length:200%_100%] animate-shimmer`
- Render the skeleton when `loading` (existing state) and the real data
  when loaded

Files touched:
- `app/inbox/InboxClient.tsx` — skeleton rows for both Steward and Cartographer tabs
- `app/todos/TodosClient.tsx`
- `app/audit/AuditClient.tsx`
- `app/DashboardClient.tsx` — stats strip skeleton (4 cells)

### 4.7 Dashboard stats count-up

`app/DashboardClient.tsx`:

- New `useCountUp(target, duration)` hook in `app/hooks/useCountUp.ts`
- Animates from 0 to target over 600 ms with `requestAnimationFrame`
- Applies to: Actors, Active relationships, Pending inbox, Open todos
- Only animates on initial mount; subsequent updates from polling go
  straight to new value (no jarring re-animation on every 30 s poll)

### 4.8 View Transitions API

Add to `app/globals.css`:

```css
@view-transition { navigation: auto; }
```

One line. Modern browsers get smooth route fades; older browsers ignore
the directive and route changes are instant (current behaviour).

### 4.9 Reduced-motion safety

Append to `app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Catches every animation in one sweep — keyframes finish instantly,
transitions become non-animated, infinite animations run once.

## 5. Data flow

No data-layer changes. All changes are presentational.

## 6. Error handling

- `IntersectionObserver` not supported on a browser → reveal class never
  fires, content stays in initial (visible) state. We initialise the CSS
  with `opacity: 1` as the default, then JS adds `.reveal-on-scroll`
  class on mount. If JS doesn't run, content is visible. **Progressive
  enhancement.**
- `requestAnimationFrame` not supported → count-up falls back to setting
  the final value immediately (degraded but functional).
- Tailwind animation utility not generated (e.g. tree-shake bug) →
  animation skipped, content still visible (no opacity:0 stuck state —
  every animation uses `both` fill mode so end-state is the visible state).

## 7. Testing

- **Type safety** — `npx tsc --noEmit` must remain clean
- **Build** — `npx next build` must succeed
- **Unit tests** — none added; this is presentational. Vitest count stays
  at 19/19
- **Manual** — load each route in dev, confirm:
  - Landing hero staggers in on first visit
  - Scrolling to Pain grid reveals it
  - `/graph` shows `<LatticeLoader>` before graph mounts, then crossfades
  - `/inbox`, `/todos`, `/audit` show skeletons on first load
  - Modals scale-in when opened
  - Buttons feel tactile on click (subtle scale-down)
  - `prefers-reduced-motion` query in DevTools disables animations
  - Bundle size delta < 1 KB gzipped (`npx next build` output)

## 8. Rollout

Single feature branch (`claude/relaxed-haslett-c00acb` worktree, already
checked out). One commit per logical surface for git readability:

1. `feat(animations): custom Tailwind keyframes + reduced-motion safety`
2. `feat(loader): branded LatticeLoader component`
3. `feat(landing): staggered hero entrance + scroll reveal`
4. `feat(graph): replace text loader with LatticeLoader + route-level loading.tsx`
5. `feat(skeletons): shimmer placeholders for inbox / todos / audit / dashboard`
6. `feat(ui-polish): modal scale-in + button micro-interactions + view transitions`
7. `feat(dashboard): stats count-up on initial mount`

## 9. Open questions

None. Design is approved.
