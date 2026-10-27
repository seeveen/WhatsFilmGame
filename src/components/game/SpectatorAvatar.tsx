import React, { useState } from 'react';

interface SpectatorAvatarProps {
  username?: string;
  avatarUrl?: string;
  className?: string;
  sizeClassName?: string;
  badge?: React.ReactNode;
}

export const SpectatorAvatar: React.FC<SpectatorAvatarProps> = ({
  username = 'espectador',
  avatarUrl,
  className = '',
  sizeClassName = 'w-8 h-8',
  badge,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Generate a fallback avatar URL based on username if none is provided
  const fallbackUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(username)}&backgroundColor=0e0e10,1b1b1f,22252b`;
  const resolvedSrc = (!imageFailed && avatarUrl) ? avatarUrl : fallbackUrl;
  const initial = (username.replace(/^@/, '').charAt(0) || 'U').toUpperCase();

  return (
    <div className={`relative shrink-0 flex items-center justify-center ${sizeClassName} ${className}`}>
      <img
        src={resolvedSrc}
        alt={`@${username}`}
        className="w-full h-full object-cover rounded-full"
        loading="lazy"
        onError={() => {
          if (!imageFailed && avatarUrl) {
            setImageFailed(true);
          }
        }}
      />
      {/* If both failed, display styled initial */}
      {imageFailed && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C5163D] to-[#21171B] flex items-center justify-center font-display font-black text-white text-xs select-none">
          {initial}
        </div>
      )}
      {badge && <div className="absolute -bottom-1 -right-1 z-10">{badge}</div>}
    </div>
  );
};
