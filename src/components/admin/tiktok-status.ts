import { GameStateDTO } from '../../../shared/types.ts';

export type TikTokStatus = GameStateDTO['tiktokConnection']['status'];

/** Shared by the overview strip and the TikTok tab so both always speak the same words. */
export const TIKTOK_STATUS: Record<TikTokStatus, { label: string; dot: 'ok' | 'warn' | 'brand' | 'idle'; tone: 'success' | 'warn' | 'brand' | 'neutral' }> = {
  connected: { label: 'Conectado', dot: 'ok', tone: 'success' },
  connecting: { label: 'Conectando', dot: 'warn', tone: 'warn' },
  error: { label: 'Erro de conexão', dot: 'brand', tone: 'brand' },
  disconnected: { label: 'Desconectado', dot: 'idle', tone: 'neutral' },
};
