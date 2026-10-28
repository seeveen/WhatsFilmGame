import React, { useState } from 'react';
import { GameStateDTO, LiveNotification } from '../../../shared/types.ts';
import { stageUnit } from '../../game/fit.ts';
import { soundEffects } from '../../utils/audio.ts';
import { useElementSize } from '../../hooks/useElementSize.ts';
import { useTransitionSettings } from '../../hooks/useStageData.ts';
import { GameHeader } from './GameHeader.tsx';
import { ChallengeStage } from './ChallengeStage.tsx';
import { EventLane } from './EventLane.tsx';
import { Scoreboard } from './Scoreboard.tsx';
import { GiftFeed } from './GiftFeed.tsx';
import { RoundResult } from './RoundResult.tsx';
import { MatchResult } from './MatchResult.tsx';
import { StandbyScreen, StandbyKind } from './StandbyScreen.tsx';

interface LiveTransmissionViewProps {
  gameState: GameStateDTO;
  layout: 'portrait' | 'landscape';
  isConnected?: boolean;
  onRestartMatch: () => void;
  notifications: LiveNotification[];
}

/**
 * Tela de jogo (transmissão). Um palco de proporção fixa por layout (9:16 ou 16:9) que escala inteiro com a janela:
 * nada de rolagem, nada cortado. Toda a lógica continua no servidor; aqui só há apresentação.
 */
export const LiveTransmissionView: React.FC<LiveTransmissionViewProps> = ({
  gameState,
  layout,
  isConnected = true,
  onRestartMatch,
  notifications,
}) => {
  const [isMuted, setIsMuted] = useState(soundEffects.getIsMuted());
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();
  const unit = stageUnit(stageSize.width, stageSize.height, layout);
  const transition = useTransitionSettings(gameState.status);

  const toggleSound = () => setIsMuted(soundEffects.toggleMute());

  const { status } = gameState;
  const hasChallenge = Boolean(gameState.currentChallenge);
  let standby: StandbyKind | null = null;
  if (status === 'idle') standby = 'idle';
  else if (status === 'preparing') standby = 'preparing';
  else if (status === 'error') standby = 'error';
  else if (status !== 'match_result' && !hasChallenge) standby = 'preparing';

  const showRoundResult = (status === 'round_result' || status === 'intermission') && hasChallenge;
  const showMatchResult = status === 'match_result';
  const showPlay = !standby && !showRoundResult && !showMatchResult;

  return (
    <div ref={stageRef} className="stage" data-layout={layout} data-status={status}>
      <div className="stage__canvas">
        {standby ? (
          <>
            <StandbyScreen kind={standby} gameState={gameState} onStart={onRestartMatch} />
          </>
        ) : (
          <>
            <GameHeader
              matchNumber={gameState.matchNumber}
              currentRound={gameState.currentRound}
              totalRounds={gameState.totalRounds}
              isConnected={isConnected}
              isMuted={isMuted}
              onToggleSound={toggleSound}
              finished={showMatchResult}
            />

            {showPlay && (
              <main className="stage__body">
                <ChallengeStage gameState={gameState} unit={unit} />
                <EventLane gameState={gameState} notifications={notifications} />
                <aside className="stage__side">
                  <Scoreboard leaderboard={gameState.leaderboard} unit={unit} />
                  <GiftFeed gameState={gameState} unit={unit} />
                </aside>
              </main>
            )}

            {showRoundResult && (
              <main className="stage__body stage__body--result">
                <RoundResult gameState={gameState} unit={unit} intermissionSeconds={transition.intermissionSeconds} />
              </main>
            )}

            {showMatchResult && (
              <main className="stage__body stage__body--result">
                <MatchResult gameState={gameState} unit={unit} layout={layout} autoLoop={transition.autoLoopMatches} onRestartNow={onRestartMatch} />
              </main>
            )}
          </>
        )}
      </div>
    </div>
  );
};
