import React, { useMemo } from 'react';
import { GameStateDTO, GiftConfig, GiftEvent } from '../../../shared/types.ts';
import { GiftIcon, getCleanGiftName } from './GiftIcon.tsx';
import { useElementSize } from '../../hooks/useElementSize.ts';
import { useNow } from '../../hooks/useStageData.ts';
import { describeGiftEffect } from '../../game/events.ts';
import { relativeAge } from '../../utils/format.ts';

interface GiftFeedProps {
  gameState: GameStateDTO;
  unit: number;
  rowUnits?: number;
}

function findConfig(configs: GiftConfig[] | undefined, gift: GiftEvent): GiftConfig | undefined {
  return configs?.find(
    (item) =>
      (gift.giftId !== undefined && String(item.id).toLowerCase() === String(gift.giftId).toLowerCase()) ||
      item.name.toLowerCase().trim() === (gift.giftName || '').toLowerCase().trim()
  );
}

/**
 * Presentes recebidos na LIVE, do mais novo para o mais antigo (sem rolagem contínua).
 * Enquanto nada chegou, mostra a legenda real dos presentes ativos e o efeito de cada um.
 */
export const GiftFeed: React.FC<GiftFeedProps> = ({ gameState, unit, rowUnits = 29 }) => {
  const [listRef, box] = useElementSize<HTMLUListElement>();
  const now = useNow(5000);
  const capacity = Math.max(1, Math.floor((box.height + 0.5) / Math.max(rowUnits * unit, 1)));
  const gifts = gameState.recentGifts;
  const active = useMemo(() => (gameState.giftsConfig ?? []).filter((g) => g.active), [gameState.giftsConfig]);
  const showLegend = gifts.length === 0 && active.length > 0;

  return (
    <section className="sp gifts" aria-label="Presentes da LIVE">
      <header className="sp__head">
        <h2 className="sp__title">Presentes</h2>
        <span className="eyebrow">{showLegend ? 'Efeitos' : 'Recentes'}</span>
      </header>

      {gifts.length === 0 && active.length === 0 ? (
        <div ref={listRef as unknown as React.Ref<HTMLDivElement>} className="sp__empty">
          <i className="playmark" aria-hidden="true" />
          <span>Os presentes da LIVE aparecem aqui</span>
        </div>
      ) : (
        <ul ref={listRef} className="gifts__list">
          {showLegend
            ? active.slice(0, capacity).map((gift) => (
                <li key={gift.id} className="gift">
                  <span className="gift__tile">
                    <GiftIcon gift={gift} className="gift-ico" fallbackEmoji="🎁" />
                  </span>
                  <span className="gift__body">
                    <span className="gift__name">{getCleanGiftName(gift.name, gift.iconType === 'image')}</span>
                    <span className="gift__user">
                      <span className="gift__effect">{describeGiftEffect(gift)}</span>
                    </span>
                  </span>
                </li>
              ))
            : gifts.slice(0, capacity).map((gift, index) => {
                const config = findConfig(gameState.giftsConfig, gift);
                const isImage =
                  config?.iconType === 'image' ||
                  gift.giftIconType === 'image' ||
                  (typeof gift.giftIcon === 'string' && (gift.giftIcon.startsWith('data:image') || gift.giftIcon.startsWith('http')));
                const name = getCleanGiftName(config?.name || gift.giftName, isImage);
                return (
                  <li key={gift.id || `${gift.timestamp}-${index}`} className="gift" data-new={index === 0 || undefined}>
                    <span className="gift__tile">
                      <GiftIcon gift={config || gift} giftName={name} className="gift-ico" fallbackEmoji={gift.giftIcon || '🎁'} />
                    </span>
                    <span className="gift__body">
                      <span className="gift__name">
                        {name}
                        {gift.amount > 1 && <span className="gift__qty num"> ×{gift.amount}</span>}
                      </span>
                      <span className="gift__user">@{gift.username}</span>
                    </span>
                    <span className="gift__meta">
                      <span className="gift__effect">{gift.effectLabel}</span>
                      <span className="gift__age num">{relativeAge(gift.timestamp, now)}</span>
                    </span>
                  </li>
                );
              })}
        </ul>
      )}
    </section>
  );
};
