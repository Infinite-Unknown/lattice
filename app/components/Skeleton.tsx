'use client';

/**
 * Shimmer placeholder block. Uses the new muted/border tokens so the
 * shimmer reads against the near-black background.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-card via-muted to-card bg-[length:200%_100%] animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * N rows of a skeleton card. Sharp borders, mono-spaced internal heights
 * matching the actual row shape used in inbox / todos / audit.
 */
export function SkeletonRows({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-px bg-border ${className}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-background p-6 md:p-8 space-y-3"
        >
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-5 w-3/4" />
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
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-px bg-border ${className}`} aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-background p-6 md:p-8 space-y-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-12 w-1/3" />
        </div>
      ))}
    </div>
  );
}
