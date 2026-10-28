import React, { useMemo } from 'react';
import { PlayerScore } from '../../../shared/types.ts';
import { SpectatorAvatar } from './SpectatorAvatar.tsx';
import { useElementSize } from '../../hooks/useElementSize.ts';
import { useRankDeltas } from '../../hooks/useStageData.ts';
import { formatScore } from '../../utils/format.ts';

interface ScoreboardProps {
  leaderboard: PlayerScore[];
  /** Unidade do palco em px; define quantas linhas completas cabem. */
  unit: number;
  rowUnits?: number;
}

/** Placar em lista com divisores: posição, nome, pontos. Top 3 com destaque; mudanças de posição só quando existem. */
export const Scoreboard: React.FC<ScoreboardProps> = ({ leaderboard, unit, rowUnits = 25 }) => {
  const [listRef, box] = useElementSize<HTMLOListElement>();
  const deltas = useRankDeltas(leaderboard);
  const rowPx = rowUnits * unit;
  const capacity = Math.max(1, Math.floor((box.height + 0.5) / Math.max(rowPx, 1)));
  const rows = useMemo(() => leaderboard.slice(0, capacity), [leaderboard, capacity]);

  return (
    <section className="sp board" aria-label="Placar da partida">
      <header className="sp__head">
        <h2 className="sp__title">Placar</h2>
        <span className="eyebrow">Partida</span>
      </header>

      {leaderboard.length === 0 ? (
        <div ref={listRef as unknown as React.Ref<HTMLDivElement>} className="sp__empty">
          <i className="playmark" aria-hidden="true" />
          <span>Aguardando os primeiros acertos</span>
        </div>
      ) : (
        <ol ref={listRef} className="board__list">
          {rows.map((player, index) => {
            const delta = deltas[player.id];
            return (
              <li key={player.id} className="board__row" data-rank={index < 3 ? index + 1 : undefined}>
                <span className="board__pos num">{index + 1}</span>
                <SpectatorAvatar username={player.username} avatarUrl={player.avatarUrl} size={17} />
                <span className="board__name">@{player.username}</span>
                {player.multiplierActive && <span className="board__mult num" title="Multiplicador ativo">×{player.multiplierValue || 2}</span>}
                {delta !== undefined && delta !== 0 && player.matchScore > 0 && (
                  <span className={`board__delta ${delta > 0 ? 'up' : 'down'} num`} aria-label={delta > 0 ? `subiu ${delta}` : `desceu ${-delta}`}>
                    {delta > 0 ? '▲' : '▼'}
                    {Math.abs(delta)}
                  </span>
                )}
                <span className="board__score">
                  <span className="board__total num">{formatScore(player.matchScore)}</span>
                  {player.roundScore > 0 && <span className="board__gain num">+{formatScore(player.roundScore)}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
