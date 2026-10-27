import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, Clock } from 'lucide-react';
import { GiftConfig } from '../../../shared/types.ts';
import { GiftIcon, getCleanGiftName } from './GiftIcon.tsx';

export interface GiftPushData {
  id: string;
  username: string;
  giftId?: number | string;
  giftName: string;
  giftIcon?: string;
  giftIconType?: 'emoji' | 'image';
  action?: GiftConfig['action'];
  effectLabel: string;
  amount: number;
  timestamp: number;
  avatarUrl?: string;
}

interface GiftPushNotificationProps {
  notification: GiftPushData | null;
  giftsConfig?: GiftConfig[];
}

export const GiftPushNotification: React.FC<GiftPushNotificationProps> = ({
  notification,
  giftsConfig = [],
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!notification) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    const timeout = setTimeout(() => setIsVisible(false), 4500);

    return () => clearTimeout(timeout);
  }, [notification?.id]);

  if (!notification) return null;

  // Lookup matching configured gift for the canonical icon & name
  const matchedGift = giftsConfig.find((c) => {
    if (notification.giftId && String(c.id).toLowerCase() === String(notification.giftId).toLowerCase()) {
      return true;
    }
    const cleanPushName = notification.giftName.toLowerCase().trim();
    if (c.name.toLowerCase().trim() === cleanPushName) return true;
    if (cleanPushName.length >= 3 && (c.name.toLowerCase().includes(cleanPushName) || cleanPushName.includes(c.name.toLowerCase()))) {
      return true;
    }
    return false;
  });

  const isImage =
    matchedGift?.iconType === 'image' ||
    notification.giftIconType === 'image' ||
    (typeof notification.giftIcon === 'string' &&
      (notification.giftIcon.startsWith('data:image') || notification.giftIcon.startsWith('http')));

  const displayName = getCleanGiftName(matchedGift?.name || notification.giftName, isImage);

  return (
    <div
      className={`absolute top-14 right-3 sm:right-5 z-50 pointer-events-none transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-95'
      }`}
      style={{ maxWidth: 'min(320px, calc(100vw - 24px))' }}
    >
      {/* Push Notification Card */}
      <div className="rounded-md bg-[#1C171A] border border-[#39272E] p-3 sm:p-3.5 shadow-xl relative overflow-hidden flex flex-col gap-2">
        {/* Top Header Tag */}
        <div className="flex items-center justify-between text-[10px] tracking-wider uppercase font-extrabold text-[#B7A8AE] border-b border-[#39272E] pb-1.5 px-0.5">
          <span className="flex items-center gap-1.5 text-[#E5254D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5254D]" />
            TIKTOK LIVE
          </span>
          <span className="text-zinc-400 font-semibold font-mono-num flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            PRESENTE RECEBIDO
          </span>
        </div>

        {/* Content Row */}
        <div className="flex items-center gap-3">
          {/* Left: Gift Icon Frame */}
          <div className="w-12 h-12 rounded-md bg-[#151214] border border-[#39272E] p-1.5 flex items-center justify-center shrink-0 relative">
            <GiftIcon
              gift={matchedGift || notification}
              giftName={displayName}
              className="w-9 h-9 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
              fallbackEmoji={notification.giftIcon || '🎁'}
            />
          </div>

          {/* Center: Sender and Gift details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[150px]">
                @{notification.username}
              </span>
              {notification.amount > 1 && (
                <span className="px-1.5 py-0.2 rounded-md bg-[#C5163D] text-white text-[10px] font-mono-num font-black shadow-sm">
                  ×{notification.amount}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-300 truncate mt-0.5">
              Enviou <strong className="text-white font-extrabold">{displayName}</strong>
            </p>

            <div className="mt-1 flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-full bg-[#C5163D]/20 border border-[#C5163D]/40 text-[#E5254D] text-[10px] font-bold flex items-center gap-1">
                {notification.action === 'multiplier_2x' ? (
                  <Zap className="w-2.5 h-2.5" />
                ) : notification.action === 'add_time' ? (
                  <Clock className="w-2.5 h-2.5" />
                ) : (
                  <Sparkles className="w-2.5 h-2.5" />
                )}
                {notification.effectLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Bottom Lifetime Progress Line */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
          <div
            className="gift-push-progress h-full bg-gradient-to-r from-[#C5163D] to-[#E5254D] rounded-full"
            style={{ animationDuration: '4500ms' }}
          />
        </div>
      </div>
    </div>
  );
};
