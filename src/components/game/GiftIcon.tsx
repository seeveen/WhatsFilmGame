import React from 'react';
import { GiftConfig, GiftEvent } from '../../../shared/types.ts';

interface GiftIconProps {
  gift?: GiftConfig | GiftEvent | Partial<GiftConfig> | Partial<GiftEvent> | null;
  giftName?: string;
  giftId?: string | number;
  giftsConfig?: GiftConfig[];
  className?: string;
  fallbackEmoji?: string;
}

/**
 * Normalizes and strips leading emoji symbols from gift names when an image icon is shown,
 * preventing duplicate/unwanted unicode symbols (e.g. '🫰 Finger Heart' -> 'Finger Heart').
 */
export function getCleanGiftName(name?: string, isImage: boolean = false): string {
  if (!name) return 'Presente';
  if (isImage) {
    return name.replace(/^[^\p{L}\p{N}]+\s*/u, '').trim() || name;
  }
  return name.trim();
}

/**
 * Universal Gift Icon component that reliably resolves custom PNG/WebP images
 * from admin configurations ('Presentes & Imagens') or falls back to emoji unicode cleanly.
 */
export const GiftIcon: React.FC<GiftIconProps> = ({
  gift,
  giftName,
  giftId,
  giftsConfig,
  className = '',
  fallbackEmoji = '🎁',
}) => {
  // If giftsConfig is provided, lookup the canonical gift settings first
  let resolvedConfig: GiftConfig | undefined = undefined;
  if (giftsConfig && giftsConfig.length > 0) {
    const targetId = giftId || (gift as any)?.id || (gift as any)?.giftId;
    const targetName = (giftName || (gift as any)?.name || (gift as any)?.giftName || '').toLowerCase().trim();

    resolvedConfig = giftsConfig.find((c) => {
      if (targetId && String(c.id).toLowerCase() === String(targetId).toLowerCase()) return true;
      if (targetName && c.name.toLowerCase().trim() === targetName) return true;
      if (targetName && (c.name.toLowerCase().includes(targetName) || targetName.includes(c.name.toLowerCase()))) {
        return true;
      }
      return false;
    });
  }

  const iconType = resolvedConfig?.iconType || (gift as any)?.iconType || (gift as any)?.giftIconType;
  const rawIconValue = resolvedConfig?.iconValue || (gift as any)?.iconValue || (gift as any)?.giftIcon;

  // Check if icon is an image by type or data/url pattern
  const isImage =
    iconType === 'image' ||
    (typeof rawIconValue === 'string' &&
      (rawIconValue.startsWith('data:image') ||
        rawIconValue.startsWith('http://') ||
        rawIconValue.startsWith('https://') ||
        rawIconValue.startsWith('/') ||
        rawIconValue.endsWith('.png') ||
        rawIconValue.endsWith('.webp') ||
        rawIconValue.endsWith('.jpg') ||
        rawIconValue.endsWith('.svg')));

  if (isImage && rawIconValue) {
    return (
      <img
        src={rawIconValue}
        alt={resolvedConfig?.name || giftName || (gift as any)?.name || 'Presente'}
        className={className}
        loading="lazy"
        onError={(e) => {
          // If image fails to load, gracefully fallback to emoji in place
          const target = e.currentTarget;
          target.style.display = 'none';
        }}
      />
    );
  }

  // Fallback emoji
  const emoji =
    rawIconValue ||
    resolvedConfig?.iconValue ||
    (gift as any)?.giftIcon ||
    (gift as any)?.iconValue ||
    fallbackEmoji;

  return (
    <span
      className={`gift-glyph ${className}`}
      role="img"
      aria-label={giftName || 'Presente'}
    >
      {emoji}
    </span>
  );
};
