import { GiftConfig } from '../../shared/types.ts';

/** Presente recebido na LIVE (payload do evento `game:gift_received`). */
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

/** Aviso de acerto (payload do evento `game:correct_guess`). */
export interface CorrectNotice {
  id: string;
  type: 'correct' | 'gift';
  text: string;
  subText?: string;
  username?: string;
  points?: number;
  rank?: number;
  multiplierApplied?: boolean;
  avatarUrl?: string;
}

export type LaneEvent =
  | { kind: 'correct'; id: string; data: CorrectNotice }
  | { kind: 'gift'; id: string; data: GiftPushData };

/** Texto curto do efeito de um presente configurado (usado na legenda quando ainda não chegou nenhum). */
export function describeGiftEffect(gift: Pick<GiftConfig, 'action' | 'value'>): string {
  switch (gift.action) {
    case 'add_time':
      return `+${gift.value}s na rodada`;
    case 'reveal_letter':
      return 'Revela letras';
    case 'multiplier_2x':
      return `Pontos ×${gift.value}`;
    default:
      return 'Bônus ativo';
  }
}
