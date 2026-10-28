import { GameStateDTO } from '../../../shared/types.ts';

type Dot = 'ok' | 'warn' | 'brand' | 'idle';

/** Palavras do painel para o estado da partida — as mesmas na barra de status e na Visão geral. */
export function describeGameStatus(state: Pick<GameStateDTO, 'status' | 'isPaused'>): { label: string; dot: Dot } {
  if (state.isPaused && (state.status === 'playing' || state.status === 'paused')) return { label: 'Pausada', dot: 'warn' };
  switch (state.status) {
    case 'playing':
      return { label: 'Rodada em andamento', dot: 'ok' };
    case 'preparing':
      return { label: 'Preparando', dot: 'warn' };
    case 'round_result':
    case 'intermission':
      return { label: 'Fim de rodada', dot: 'warn' };
    case 'match_result':
      return { label: 'Partida concluída', dot: 'brand' };
    case 'paused':
      return { label: 'Pausada', dot: 'warn' };
    case 'error':
      return { label: 'Sem desafios', dot: 'brand' };
    default:
      return { label: 'Aguardando início', dot: 'idle' };
  }
}
