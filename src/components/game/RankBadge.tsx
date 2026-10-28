import React from 'react';

interface RankBadgeProps {
  rank: 1 | 2 | 3;
  className?: string;
}

const colors = { 1: '#F0C75E', 2: '#C8D0DA', 3: '#CD8C5B' };

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, className = 'w-7 h-8' }) => {
  const color = colors[rank];
  return (
    <svg className={className} viewBox="0 0 24 28" role="img" aria-label={rank + 'º lugar'} fill="none">
      <path d="m6 15-1 11 7-3 7 3-1-11" fill={color} opacity=".72" />
      <circle cx="12" cy="10" r="8" fill={color} />
      {rank === 1 ? (
        <path d="m7.5 13 1-6 3.5 3 3.5-3 1 6h-9Z" fill="#30343B" />
      ) : rank === 2 ? (
        <path d="m12 5 1.4 3 3.2.4-2.3 2.2.6 3.2-2.9-1.5-2.9 1.5.6-3.2-2.3-2.2 3.2-.4L12 5Z" fill="#30343B" />
      ) : (
        <path d="m12 6 4 4-4 4-4-4 4-4Z" fill="#30343B" />
      )}
    </svg>
  );
};
