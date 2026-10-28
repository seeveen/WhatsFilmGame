import React from 'react';
import { Check, Gift, Heart, MessageSquare, Share2, UserPlus } from 'lucide-react';
import { GameStateDTO, LiveNotification } from '../../../shared/types.ts';
import { GiftIcon, getCleanGiftName } from './GiftIcon.tsx';

interface EventLaneProps {
  gameState: GameStateDTO;
  notifications: LiveNotification[];
}

/** Feed curto: o evento mais novo entra embaixo e os antigos sobem até sair da faixa. */
export const EventLane: React.FC<EventLaneProps> = ({ gameState, notifications }) => {
  const playing = gameState.status === 'playing';
  const visible = notifications.slice(0, 3).reverse();

  return (
    <div className="lane" aria-live="polite" aria-relevant="additions">
      {visible.length > 0 ? (
        <ul className="lane__feed" aria-label="Notificações recentes da LIVE">
          {visible.map((notification) => {
            const Icon = notification.type === 'correct'
              ? Check
              : notification.type === 'gift'
                ? Gift
                : notification.type === 'likes'
                  ? Heart
                  : notification.type === 'follow'
                    ? UserPlus
                    : Share2;
            const detail = notification.type === 'correct'
              ? 'Acertou o filme'
              : notification.type === 'gift'
                ? `Enviou ${getCleanGiftName(notification.giftName || 'um presente', notification.giftIconType === 'image')}${notification.amount && notification.amount > 1 ? ` ×${notification.amount}` : ''}`
                : notification.type === 'likes'
                  ? `Curtiu a live ${notification.count || 0} vezes. Obrigado!`
                  : notification.type === 'follow'
                    ? 'Começou a seguir a live'
                    : 'Compartilhou a live';

            return (
              <li key={notification.id} className="toast lane__event" role="status">
                <span className="toast__icon lane__event-icon">
                  {notification.type === 'gift' ? (
                    <GiftIcon
                      gift={{ giftName: notification.giftName, giftIcon: notification.giftIcon, giftIconType: notification.giftIconType, giftId: notification.giftId }}
                      giftsConfig={gameState.giftsConfig}
                      giftName={notification.giftName}
                      giftId={notification.giftId}
                      className="gift-ico"
                      fallbackEmoji="🎁"
                    />
                  ) : (
                    <Icon aria-hidden="true" />
                  )}
                </span>
                <span className="toast__main">
                  <b className="toast__user">@{notification.username}</b>
                  <span className="toast__what">{detail}</span>
                </span>
                {notification.type === 'correct' && notification.points !== undefined && (
                  <span className="toast__value num">+{notification.points}</span>
                )}
                {notification.type === 'likes' && (
                  <span className="toast__value num">{notification.count || 0} ♥</span>
                )}
                {notification.type === 'gift' && notification.effectLabel && (
                  <span className="toast__chip toast__chip--brand">{notification.effectLabel}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="lane__hint">
          <MessageSquare aria-hidden="true" />
          {playing ? (
            <span>
              Digite o <b>nome do filme</b> no chat para pontuar
            </span>
          ) : (
            <span>Aguardando a próxima rodada</span>
          )}
        </p>
      )}
    </div>
  );
};
