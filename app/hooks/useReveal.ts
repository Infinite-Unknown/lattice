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
