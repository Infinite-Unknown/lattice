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
