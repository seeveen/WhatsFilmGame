import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, WifiOff } from 'lucide-react';
import { BrandLockup } from '../brand/BrandMark.tsx';
import { pad2 } from '../../utils/format.ts';

interface GameHeaderProps {
  matchNumber: number;
  currentRound: number;
  totalRounds: number;
  /** Estado real da conexão Socket.IO com o servidor do jogo. */
  isConnected: boolean;
  isMuted: boolean;
  onToggleSound: () => void;
  /** Partida concluída: todos os segmentos de progresso aparecem como cumpridos. */
  finished?: boolean;
}

/** Faixa de progresso das rodadas: um segmento por rodada (barra contínua quando são muitas). */
const RoundProgress: React.FC<{ current: number; total: number; finished?: boolean }> = ({ current, total, finished }) => {
  if (total <= 0) return null;
  const segmented = total <= 24;
  return (
    <div
      className="rounds"
      role="progressbar"
      aria-label="Progresso da partida"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={finished ? total : Math.min(current, total)}
    >
      {segmented ? (
        Array.from({ length: total }, (_, index) => {
          const n = index + 1;
          const state = finished || n < current ? 'done' : n === current ? 'now' : 'next';
          return <span key={n} className={`rounds__seg rounds__seg--${state}`} />;
        })
      ) : (
        <span className="rounds__bar">
          <span style={{ width: `${finished ? 100 : Math.min(100, (Math.max(current, 0) / total) * 100)}%` }} />
        </span>
      )}
    </div>
  );
};

export const GameHeader: React.FC<GameHeaderProps> = ({
  matchNumber,
  currentRound,
  totalRounds,
  isConnected,
  isMuted,
  onToggleSound,
  finished,
}) => {
  // Só avisa de queda depois de um instante: evita piscar no carregamento ou numa reconexão imediata.
  const [showOffline, setShowOffline] = useState(false);
  useEffect(() => {
    if (isConnected) {
      setShowOffline(false);
      return;
    }
    const timeout = setTimeout(() => setShowOffline(true), 2500);
    return () => clearTimeout(timeout);
  }, [isConnected]);

  return (
    <header className="hdr app-drag-region">
      <div className="hdr__row">
        <BrandLockup sub={`Partida ${pad2(matchNumber)}`} />

        <div className="hdr__end">
          {showOffline && (
            <span className="hdr__flag hdr__flag--warn" role="status">
              <WifiOff aria-hidden="true" />
              Reconectando
            </span>
          )}
          <div className="hdr__round" aria-label={`Rodada ${currentRound} de ${totalRounds}`}>
            <span className="hdr__round-label">Rodada</span>
            <span className="hdr__round-num num">
              {pad2(currentRound)}
              <i>/</i>
              {pad2(totalRounds)}
            </span>
          </div>
          <button
            type="button"
            className="hdr__sound"
            onClick={onToggleSound}
            title={isMuted ? 'Ativar sons' : 'Silenciar sons'}
            aria-label={isMuted ? 'Ativar sons' : 'Silenciar sons'}
            aria-pressed={isMuted}
          >
            {isMuted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
          </button>
        </div>
      </div>
      <RoundProgress current={currentRound} total={totalRounds} finished={finished} />
    </header>
  );
};
