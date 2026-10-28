import React, { useMemo } from 'react';
import { GameStateDTO } from '../../../shared/types.ts';
import { TimerStrip } from './TimerStrip.tsx';
import { EmojiClue } from './EmojiClue.tsx';
import { AnswerSlots } from './AnswerSlots.tsx';
import { GiftIcon, getCleanGiftName } from './GiftIcon.tsx';
import { splitClue } from '../../game/fit.ts';
import { DIFFICULTY_LEVEL, DIFFICULTY_NAME, Difficulty } from '../../utils/format.ts';
import { useRoundCeiling, useTimeBonus } from '../../hooks/useStageData.ts';

interface ChallengeStageProps {
  gameState: GameStateDTO;
  unit: number;
}

const Difficulty3: React.FC<{ level: Difficulty }> = ({ level }) => {
  const n = DIFFICULTY_LEVEL[level];
  return (
    <span className="diff" aria-label={`Dificuldade: ${DIFFICULTY_NAME[level]}`}>
      <span className="diff__bars" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= n ? 'on' : ''} style={{ height: `${40 + i * 20}%` }} />
        ))}
      </span>
      <span className="diff__name">{DIFFICULTY_NAME[level]}</span>
    </span>
  );
};

/** Desafio ativo: cronômetro, sequência de emojis (foco), lacunas da resposta e contadores. */
export const ChallengeStage: React.FC<ChallengeStageProps> = ({ gameState, unit }) => {
  const challenge = gameState.currentChallenge;
  const time = gameState.timeRemainingSeconds;
  const playing = gameState.status === 'playing';
  const roundKey = `${gameState.matchNumber}:${gameState.currentRound}:${challenge?.id ?? ''}`;
  const ceiling = useRoundCeiling(time, gameState.roundDurationSeconds, roundKey);
  const bonus = useTimeBonus(time, playing, roundKey);
  const low = playing && time <= 10 && time <= ceiling * 0.34;

  const revealed = challenge?.revealedLetters ?? [];
  const symbolCount = useMemo(() => splitClue(challenge?.emoji).length, [challenge?.emoji]);

  const letterGift = useMemo(
    () => gameState.giftsConfig?.find((g) => g.active && g.action === 'reveal_letter') ?? null,
    [gameState.giftsConfig]
  );

  if (!challenge) return null;

  const difficulty = challenge.difficulty;
  const wordLabel = `${challenge.wordCount} ${challenge.wordCount === 1 ? 'palavra' : 'palavras'}`;
  const correctCount = gameState.roundCorrectCount;

  return (
    <section className="play" aria-label="Desafio da rodada" data-low={low || undefined}>
      <TimerStrip time={time} ceiling={ceiling} low={low} paused={gameState.isPaused} bonus={bonus} />

      <div className="clue frame">
        <div className="clue__meta">
          <span className="eyebrow eyebrow--brand clue__cat">
            <i className="playmark" aria-hidden="true" />
            <span>{challenge.category || 'Pista'}</span>
            <span className="clue__count">
              {symbolCount} {symbolCount === 1 ? 'emoji' : 'emojis'}
            </span>
          </span>
          {difficulty && <Difficulty3 level={difficulty} />}
        </div>

        <EmojiClue clue={challenge.emoji} />

        <AnswerSlots title={challenge.maskedTitle} revealedLetters={revealed} unit={unit} />

        <div className="clue__foot">
          <span className="clue__facts num">
            {wordLabel} · {challenge.letterCount} letras
          </span>
          {correctCount > 0 ? (
            <span className="clue__hint clue__hint--ok">
              {correctCount} {correctCount === 1 ? 'acerto' : 'acertos'}
            </span>
          ) : (
            letterGift && (
              <span className="clue__hint">
                <GiftIcon gift={letterGift} className="gift-ico" fallbackEmoji="🎁" />
                {getCleanGiftName(letterGift.name, letterGift.iconType === 'image')} revela letras
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
};
