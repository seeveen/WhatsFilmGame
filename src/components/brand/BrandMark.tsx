import React from 'react';

/**
 * QUAL É O FILME? — brand mark.
 * Evolution of the original clapperboard-with-play glyph: same idea, rebuilt as a solid
 * geometric symbol (readable at 16 px) instead of a thin stroked icon.
 * The same artwork lives in /public/favicon.svg.
 */
export const BrandMark: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    focusable="false"
  >
    <rect width="32" height="32" rx="7.5" fill="#C5163D" />
    {/* clapper arm, slightly open */}
    <g transform="rotate(-9 6.5 11.6)">
      <rect x="6.5" y="6.6" width="19" height="4.8" rx="1.3" fill="#fff" />
      <path d="M11.4 6.6l-2 4.8M16.6 6.6l-2 4.8M21.8 6.6l-2 4.8" stroke="#C5163D" strokeWidth="1.7" />
    </g>
    {/* slate body with play cut-out */}
    <path d="M6.5 13.4h19v10.1a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" fill="#fff" />
    <path d="M13.6 16.6v5.6l4.9-2.8z" fill="#C5163D" />
  </svg>
);

interface BrandLockupProps {
  /** Font size of the wordmark; the mark scales with it (em based). */
  size?: number | string;
  /** Optional mono sub-label under the wordmark (e.g. "Partida 01"). */
  sub?: React.ReactNode;
  className?: string;
}

/** Mark + two-tone wordmark: "Qual é o" in text white, "filme?" in the highlight red. */
export const BrandLockup: React.FC<BrandLockupProps> = ({ size, sub, className = '' }) => (
  <span className={`brand ${className}`} style={size !== undefined ? ({ ['--brand-fs' as string]: typeof size === 'number' ? `${size}px` : size } as React.CSSProperties) : undefined}>
    <BrandMark className="brand__mark" />
    <span className="brand__text">
      <span className="brand__word">
        Qual é o <em>filme?</em>
      </span>
      {sub !== undefined && sub !== null && <span className="brand__sub">{sub}</span>}
    </span>
  </span>
);
