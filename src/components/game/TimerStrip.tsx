import React from 'react';
import { formatClock } from '../../utils/format.ts';

interface TimerStripProps {
  time: number;
  /** Maior tempo visto na rodada: referência da barra (presentes podem somar segundos). */
  ceiling: number;
  low: boolean;
  paused: boolean;
  bonus: { id: number; amount: number } | null;
}

/** Cronômetro integrado ao desafio. Só leva o tempo do servidor; o alerta aparece apenas quando está realmente acabando. */
export const TimerStrip: React.FC<TimerStripProps> = ({ time, ceiling, low, paused, bonus }) => {
  const ratio = Math.max(0, Math.min(1, ceiling > 0 ? time / ceiling : 0));
  return (
    <div className="timer" data-low={low || undefined} data-paused={paused || undefined}>
      <div className="timer__row">
        <span className="eyebrow timer__label">
          <i className="playmark" aria-hidden="true" />
          Tempo
        </span>
        <span className="timer__aside">
          {bonus && (
            <span key={bonus.id} className="timer__bonus num" aria-live="polite">
              +{bonus.amount}s
            </span>
          )}
          {paused && <span className="timer__paused">Pausado</span>}
          <span
            key={low ? time : 'steady'}
            className="timer__clock num"
            role="timer"
            aria-label={`Tempo restante: ${time} segundos`}
          >
            {formatClock(time)}
          </span>
        </span>
      </div>
      <div className="timer__track" aria-hidden="true">
        <span className="timer__fill" style={{ transform: `scaleX(${ratio})` }} />
      </div>
    </div>
  );
};
