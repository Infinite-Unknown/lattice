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
