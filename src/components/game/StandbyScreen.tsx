import React from 'react';
import { Play, RefreshCw, TriangleAlert } from 'lucide-react';
import { GameStateDTO } from '../../../shared/types.ts';
import { BrandMark } from '../brand/BrandMark.tsx';
import { Button } from '../ui/index.ts';

export type StandbyKind = 'connecting' | 'idle' | 'preparing' | 'error';

interface StandbyScreenProps {
  kind: StandbyKind;
  gameState?: GameStateDTO | null;
  onStart?: () => void;
}

/**
 * Telas sem rodada ativa: conectando, partida pronta, preparando e sem desafios.
 * Só exibe números reais (rodadas, duração, desafios disponíveis) vindos do servidor.
 */
export const StandbyScreen: React.FC<StandbyScreenProps> = ({ kind, gameState, onStart }) => {
  const facts: { label: string; value: string }[] = [];
  if (kind === 'idle' && gameState) {
    facts.push({ label: 'Rodadas', value: String(gameState.totalRounds) });
    facts.push({ label: 'Por rodada', value: `${gameState.roundDurationSeconds}s` });
    facts.push({ label: 'Desafios', value: String(gameState.totalChallengesAvailable) });
  }

  return (
    <section className="standby" data-kind={kind} aria-live="polite">
      <div className="sprockets standby__strip standby__strip--top" aria-hidden="true" />
      <div className="sprockets standby__strip standby__strip--bottom" aria-hidden="true" />
      <div className="standby__mark">
        {kind === 'error' ? <TriangleAlert className="standby__warn" aria-hidden="true" /> : <BrandMark className="standby__logo" />}
      </div>

      {kind === 'connecting' && (
        <>
          <h1 className="standby__title font-display">
            Qual é o <em>filme?</em>
          </h1>
          <p className="standby__text">
            <RefreshCw className="standby__spin" aria-hidden="true" /> Conectando ao servidor do jogo…
          </p>
        </>
      )}

      {kind === 'preparing' && (
        <>
          <h1 className="standby__title font-display">Preparando a partida</h1>
          <p className="standby__text">Sorteando o primeiro desafio…</p>
        </>
      )}

      {kind === 'idle' && (
        <>
          <p className="eyebrow eyebrow--brand">
            <i className="playmark" aria-hidden="true" />
            Partida pronta
          </p>
          <h1 className="standby__title font-display">
            Qual é o <em>filme?</em>
          </h1>
          <p className="standby__text">Aguardando o início da partida.</p>
          {facts.length > 0 && (
            <dl className="standby__facts">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd className="num">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {onStart && (
            <Button variant="primary" size="lg" icon={<Play />} onClick={onStart}>
              Iniciar partida
            </Button>
          )}
        </>
      )}

      {kind === 'error' && (
        <>
          <h1 className="standby__title font-display">Sem desafios disponíveis</h1>
          <p className="standby__text">
            A biblioteca está vazia ou o filtro de categoria não encontrou nada. Cadastre ou importe desafios no painel e tente de novo.
          </p>
          {onStart && (
            <Button variant="secondary" size="lg" icon={<RefreshCw />} onClick={onStart}>
              Tentar novamente
            </Button>
          )}
        </>
      )}
    </section>
  );
};
