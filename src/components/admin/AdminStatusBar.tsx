import React from 'react';
import { GameStateDTO } from '../../../shared/types.ts';
import { Chip } from '../ui/index.ts';
import { TIKTOK_STATUS } from './tiktok-status.ts';
import { describeGameStatus } from './game-status.ts';
import { formatClock, pad2 } from '../../utils/format.ts';

/** Faixa fixa no topo do painel: estado real da partida e da conexão TikTok, visível em qualquer seção. */
export const AdminStatusBar: React.FC<{ gameState: GameStateDTO }> = ({ gameState }) => {
  const game = describeGameStatus(gameState);
  const tiktok = TIKTOK_STATUS[gameState.tiktokConnection.status];
  const live = gameState.status === 'playing' || gameState.status === 'round_result' || gameState.status === 'intermission';
  const username = gameState.tiktokConnection.username;

  return (
    <div className="admin-status" role="status" aria-label="Estado atual do jogo">
      <div className="admin-status__group">
        <Chip dot={game.dot}>{game.label}</Chip>
        {live && gameState.totalRounds > 0 && (
          <span className="admin-status__fact num">
            Rodada {pad2(gameState.currentRound)}/{pad2(gameState.totalRounds)}
          </span>
        )}
        {gameState.status === 'playing' && (
          <span className="admin-status__clock num" aria-label={`${gameState.timeRemainingSeconds} segundos restantes`}>
            {formatClock(gameState.timeRemainingSeconds)}
          </span>
        )}
      </div>
      <div className="admin-status__group">
        {gameState.tiktokConnection.status === 'connected' && typeof gameState.tiktokConnection.viewerCount === 'number' && (
          <span className="admin-status__fact num">{gameState.tiktokConnection.viewerCount} espectadores</span>
        )}
        <Chip dot={tiktok.dot} title={gameState.tiktokConnection.errorMsg}>
          TikTok · {username && gameState.tiktokConnection.status !== 'disconnected' ? `@${username.replace(/^@/, '')}` : tiktok.label}
        </Chip>
      </div>
    </div>
  );
};
