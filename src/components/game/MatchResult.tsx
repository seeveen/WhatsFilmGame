import React from 'react';
import { Crown, RotateCcw } from 'lucide-react';
import { GameStateDTO, PlayerScore } from '../../../shared/types.ts';
import { SpectatorAvatar } from './SpectatorAvatar.tsx';
import { Button } from '../ui/index.ts';
import { useCountdown } from '../../hooks/useStageData.ts';
import { useElementSize } from '../../hooks/useElementSize.ts';
import { formatScore, pad2 } from '../../utils/format.ts';

interface MatchResultProps {
  gameState: GameStateDTO;
  unit: number;
  layout: 'portrait' | 'landscape';
  autoLoop?: boolean;
  onRestartNow: () => void;
}

/** Tempo que o servidor espera na tela de resultado antes de abrir a próxima partida (engine.endMatch). */
const AUTO_LOOP_SECONDS = 10;
const CREDIT_ROW_UNITS = 26;

const PodiumSlot: React.FC<{ player?: PlayerScore; place: 1 | 2 | 3; compact: boolean }> = ({ player, place, compact }) => (
  <li className={`podium__slot podium__slot--${place}`}>
    {player ? (
      <>
        {place === 1 && <Crown className="podium__crown" aria-hidden="true" />}
        <SpectatorAvatar username={player.username} avatarUrl={player.avatarUrl} size={place === 1 ? (compact ? 44 : 54) : compact ? 32 : 40} className="podium__avatar" />
        <span className="podium__name">@{player.username}</span>
        <span className="podium__pts num">{formatScore(player.matchScore)} pts</span>
      </>
    ) : (
      <span className="podium__empty" aria-hidden="true" />
    )}
    <span className="podium__step num">
      <b>{place}</b>
    </span>
  </li>
);

/** Fim da partida: campeão, pódio e classificação final em estilo de créditos. */
export const MatchResult: React.FC<MatchResultProps> = ({ gameState, unit, layout, autoLoop, onRestartNow }) => {
  const ranking = gameState.leaderboard;
  const [first, second, third] = gameState.matchWinners.length > 0 ? gameState.matchWinners : ranking;
  const podiumIds = new Set([first, second, third].filter(Boolean).map((p) => (p as PlayerScore).id));
  const rest = ranking.filter((p) => !podiumIds.has(p.id));
  const left = useCountdown(autoLoop ? AUTO_LOOP_SECONDS : undefined, `match:${gameState.matchNumber}`);
  const [rootRef, rootBox] = useElementSize<HTMLElement>();
  const [listRef, listBox] = useElementSize<HTMLOListElement>();
  const rowPx = Math.max(CREDIT_ROW_UNITS * unit, 1);
  // Retrato: a classificação ocupa no máximo ~44% da altura (o pódio centraliza no resto). Paisagem: coluna inteira.
  const capacity = Math.max(
    1,
    layout === 'landscape'
      ? Math.floor((listBox.height + 0.5) / rowPx)
      : Math.floor((rootBox.height * 0.44 - 34 * unit) / rowPx)
  );

  return (
    <section ref={rootRef} className="result result--match" aria-label="Resultado da partida">
      <div className="result__main">
        <p className="eyebrow eyebrow--brand result__kicker">
          <i className="playmark" aria-hidden="true" />
          Partida {pad2(gameState.matchNumber)} · Concluída
        </p>
        <h2 className="result__title font-display">{first ? 'Resultado final' : 'Partida encerrada'}</h2>

        {first ? (
          <ol className="podium" aria-label="Pódio">
            <PodiumSlot player={second} place={2} compact={layout === 'landscape'} />
            <PodiumSlot player={first} place={1} compact={layout === 'landscape'} />
            <PodiumSlot player={third} place={3} compact={layout === 'landscape'} />
          </ol>
        ) : (
          <div className="sp__empty sp__empty--roomy">
            <i className="playmark" aria-hidden="true" />
            <span>Ninguém pontuou nesta partida</span>
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <div className="result__side">
          <header className="sp__head">
            <h2 className="sp__title">Classificação</h2>
            <span className="eyebrow">Final</span>
          </header>
          <ol ref={listRef} className="credits credits--fill" start={4}>
            {rest.slice(0, capacity).map((player, index) => (
              <li key={player.id} className="credits__row">
                <span className="credits__pos num">{index + 4}</span>
                <span className="credits__name">@{player.username}</span>
                <span className="leader" aria-hidden="true" />
                <span className="credits__pts credits__pts--plain num">{formatScore(player.matchScore)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <footer className="next next--match" role="status">
        <span className="next__label">
          {autoLoop === undefined
            ? ''
            : autoLoop
              ? left !== null
                ? `Nova partida em ${left}s`
                : 'Nova partida em instantes'
              : 'Nova partida: início manual'}
        </span>
        <Button variant="secondary" size="sm" icon={<RotateCcw />} onClick={onRestartNow}>
          Iniciar nova agora
        </Button>
      </footer>
    </section>
  );
};
