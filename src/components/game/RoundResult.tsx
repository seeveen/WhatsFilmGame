import React from 'react';
import { GameStateDTO } from '../../../shared/types.ts';
import { AnswerSlots } from './AnswerSlots.tsx';
import { EmojiClue } from './EmojiClue.tsx';
import { SpectatorAvatar } from './SpectatorAvatar.tsx';
import { useCountdown } from '../../hooks/useStageData.ts';
import { formatScore, pad2 } from '../../utils/format.ts';

interface RoundResultProps {
  gameState: GameStateDTO;
  unit: number;
  intermissionSeconds?: number;
}

/**
 * Fim de rodada: a resposta se revela (lacunas viram o título), quem acertou e a transição para a próxima etapa.
 * Substitui a área de jogo, mantendo o cabeçalho e o progresso da partida visíveis.
 */
export const RoundResult: React.FC<RoundResultProps> = ({ gameState, unit, intermissionSeconds }) => {
  const challenge = gameState.currentChallenge;
  const answer = gameState.revealedAnswer || challenge?.maskedTitle || '';
  const winners = gameState.roundWinners;
  const top = winners.slice(0, 3);
  const timedOut = gameState.timeRemainingSeconds <= 0;
  const isLast = gameState.currentRound >= gameState.totalRounds;
  const key = `${gameState.matchNumber}:${gameState.currentRound}`;
  const left = useCountdown(intermissionSeconds, key);
  const progress = left !== null && intermissionSeconds ? left / intermissionSeconds : 1;

  return (
    <section className="result result--round" aria-label="Resultado da rodada" key={key}>
      <div className="result__main">
        <p className="eyebrow eyebrow--brand result__kicker">
          <i className="playmark" aria-hidden="true" />
          Rodada {pad2(gameState.currentRound)}/{pad2(gameState.totalRounds)} · {timedOut ? 'Tempo esgotado' : 'Rodada encerrada'}
        </p>

        {challenge?.emoji && (
          <div className="result__clue">
            <EmojiClue clue={challenge.emoji} />
          </div>
        )}

        <div className="result__answer frame">
          <span className="eyebrow">A resposta era</span>
          <div className="result__slots">
            <AnswerSlots title={answer} reveal unit={unit} maxFontUnits={30} />
          </div>
        </div>
      </div>

      <div className="result__side">
        <header className="sp__head">
          <h2 className="sp__title">Quem acertou</h2>
          <span className="eyebrow num">
            {winners.length} {winners.length === 1 ? 'acerto' : 'acertos'}
          </span>
        </header>

        {top.length === 0 ? (
          <div className="sp__empty sp__empty--roomy">
            <i className="playmark" aria-hidden="true" />
            <span>Ninguém acertou desta vez</span>
          </div>
        ) : (
          <ol className="credits">
            {top.map((winner) => (
              <li key={`${winner.rank}-${winner.username}`} className="credits__row" data-rank={winner.rank}>
                <span className="credits__pos num">{winner.rank}</span>
                <SpectatorAvatar username={winner.username} avatarUrl={winner.avatarUrl} size={22} />
                <span className="credits__name">@{winner.username}</span>
                {winner.multiplierApplied && <span className="toast__chip toast__chip--brand">×2</span>}
                <span className="leader" aria-hidden="true" />
                <span className="credits__pts num">+{formatScore(winner.points)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <footer className="next" role="status">
        <div className="next__row">
          <span className="next__label">{isLast ? 'Resultado final em' : 'Próxima rodada em'}</span>
          {left !== null && <span className="next__sec num">{left}s</span>}
        </div>
        <div className="next__track" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </footer>
    </section>
  );
};
