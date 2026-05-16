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
