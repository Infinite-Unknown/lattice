'use client';

/**
 * Branded loading indicator. Three nodes (foreground / accent / foreground)
 * pulsing in sequence with two edges drawing between them. Aligned with
 * the Bold Typography palette — vermillion is the only accent.
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
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
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
        {/* Edge: node1 → node2 (foreground stroke) */}
        <line
          x1="14" y1="20" x2="50" y2="20"
          stroke="#FAFAFA"
          strokeWidth="1.5"
          strokeDasharray="40"
          strokeLinecap="butt"
          className="animate-draw-line"
        />
        {/* Edge: node2 → node3 (accent stroke) */}
        <line
          x1="50" y1="20" x2="32" y2="48"
          stroke="#FF3D00"
          strokeWidth="1.5"
          strokeDasharray="40"
          strokeLinecap="butt"
          className="animate-draw-line"
          style={{ animationDelay: '300ms' }}
        />
        {/* Node 1 — foreground */}
        <rect
          x="9" y="15" width="10" height="10"
          fill="#FAFAFA"
          className="animate-pulse-dot"
          style={{ transformOrigin: '14px 20px' }}
        />
        {/* Node 2 — accent */}
        <rect
          x="45" y="15" width="10" height="10"
          fill="#FF3D00"
          className="animate-pulse-dot"
          style={{ transformOrigin: '50px 20px', animationDelay: '200ms' }}
        />
        {/* Node 3 — foreground */}
        <rect
          x="27" y="43" width="10" height="10"
          fill="#FAFAFA"
          className="animate-pulse-dot"
          style={{ transformOrigin: '32px 48px', animationDelay: '400ms' }}
        />
      </svg>
      {label && (
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
      )}
      <span className="sr-only">Loading{label ? `: ${label}` : ''}</span>
    </div>
  );
}
