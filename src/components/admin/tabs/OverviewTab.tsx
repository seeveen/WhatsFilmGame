import React, { useState } from 'react';
import { Eye, Film, Pause, Play, RotateCcw, Send, SkipForward } from 'lucide-react';
import { GameStateDTO } from '../../../../shared/types.ts';
import {
  Button,
  Chip,
  DifficultyMeter,
  EmptyState,
  Field,
  PageHeader,
  Section,
  Stat,
  StatStrip,
  TextInput,
  useFeedback,
} from '../../ui/index.ts';
import { GiftIcon, getCleanGiftName } from '../../game/GiftIcon.tsx';
import { describeGameStatus } from '../game-status.ts';
import { describeGiftEffect } from '../../../game/events.ts';
import { buildSlotModel, countSlots } from '../../../game/slots.ts';
import { formatClock, pad2 } from '../../../utils/format.ts';

interface OverviewTabProps {
  gameState: GameStateDTO;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ gameState }) => {
  const { toast, confirm } = useFeedback();
  const [simUser, setSimUser] = useState('marcos_live');
  const [simMessage, setSimMessage] = useState('');

  const handleAction = async (endpoint: string, body?: any, okMessage = 'Ação executada.') => {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        toast('success', okMessage);
      } else {
        toast('error', data.error || data.message || 'O servidor não concluiu a ação.');
      }
    } catch (e: any) {
      toast('error', e.message, 'Erro');
    }
  };

  const matchInProgress = gameState.status === 'playing' || gameState.status === 'round_result' || gameState.status === 'intermission';

  const handleStart = async () => {
    if (matchInProgress) {
      const ok = await confirm({
        title: 'Iniciar uma nova partida?',
        message: 'Há uma partida em andamento. Iniciar agora descarta a rodada atual e zera o placar.',
        confirmLabel: 'Iniciar nova partida',
        tone: 'primary',
      });
      if (!ok) return;
    }
    await handleAction('/api/game/start', undefined, 'Nova partida iniciada.');
  };

  const handleResetLeaderboard = async () => {
    const ok = await confirm({
      title: 'Zerar o placar?',
      message: 'Zera apenas as pontuações da partida. A biblioteca de desafios não é afetada.',
      confirmLabel: 'Zerar placar',
    });
    if (ok) await handleAction('/api/game/reset-leaderboard', undefined, 'Placar zerado.');
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    await handleAction(
      '/api/tiktok/simulate-chat',
      { username: simUser, comment: simMessage.trim() },
      `Palpite enviado como @${simUser}.`
    );
    setSimMessage('');
  };

  const handleSendGift = async (gift: any) => {
    await handleAction(
      '/api/tiktok/simulate-gift',
      { username: simUser, giftName: gift.name, giftId: gift.id, repeatCount: 1 },
      `${getCleanGiftName(gift.name, gift.iconType === 'image')} enviado como @${simUser}.`
    );
  };

  const giftsConfig = gameState.giftsConfig || [];
  const challenge = gameState.currentChallenge;
  const status = describeGameStatus(gameState);
  const slots = challenge ? buildSlotModel(challenge.maskedTitle, challenge.revealedLetters) : [];
  const counts = countSlots(slots);
  const playing = gameState.status === 'playing';

  return (
    <div className="page">
      <PageHeader
        eyebrow="Partida"
        title="Visão geral"
        description="Controle a partida em andamento e acompanhe o desafio atual."
      />

      {/* Controles + números da partida */}
      <section className="ov-control" aria-label="Controles da partida">
        <div className="ov-control__bar">
          <div className="ov-control__who">
            <span className="eyebrow">Partida {pad2(gameState.matchNumber)}</span>
            <span className="ov-control__state font-display">
              <i className={`dot dot--${status.dot === 'idle' ? '' : status.dot}`} aria-hidden="true" />
              {status.label}
            </span>
          </div>
          <div className="ov-control__actions">
            <Button variant={matchInProgress ? 'secondary' : 'primary'} icon={<Play />} onClick={handleStart}>
              Iniciar partida
            </Button>
            {gameState.isPaused ? (
              <Button variant="primary" icon={<Play />} onClick={() => handleAction('/api/game/resume', undefined, 'Partida retomada.')}>
                Retomar
              </Button>
            ) : (
              <Button icon={<Pause />} onClick={() => handleAction('/api/game/pause', undefined, 'Partida pausada.')}>
                Pausar
              </Button>
            )}
            <Button icon={<SkipForward />} onClick={() => handleAction('/api/game/skip', undefined, 'Rodada pulada.')}>
              Pular rodada
            </Button>
            <Button variant="danger" icon={<RotateCcw />} onClick={handleResetLeaderboard} title="Zera apenas as pontuações da partida, sem apagar a biblioteca">
              Zerar placar
            </Button>
          </div>
        </div>

        {gameState.totalRounds > 0 && matchInProgress && (
          <div
            className="ov-rounds"
            role="progressbar"
            aria-label="Progresso da partida"
            aria-valuemin={0}
            aria-valuemax={gameState.totalRounds}
            aria-valuenow={gameState.currentRound}
          >
            {Array.from({ length: Math.min(gameState.totalRounds, 50) }, (_, i) => {
              const n = i + 1;
              return <i key={n} className={n < gameState.currentRound ? 'done' : n === gameState.currentRound ? 'now' : ''} />;
            })}
          </div>
        )}
      </section>

      <StatStrip>
        <Stat
          label="Rodada"
          value={
            <span className="num">
              {pad2(gameState.currentRound)}
              <span className="ov-of">/{pad2(gameState.totalRounds)}</span>
            </span>
          }
          meta={playing ? (gameState.isPaused ? 'Pausada' : 'Em andamento') : status.label}
        />
        <Stat
          label="Tempo"
          value={<span className="num">{playing ? formatClock(gameState.timeRemainingSeconds) : '—'}</span>}
          meta={playing ? `de ${formatClock(gameState.roundDurationSeconds)} por rodada` : `${formatClock(gameState.roundDurationSeconds)} por rodada`}
        />
        <Stat
          label="Acertos na rodada"
          value={<span className="num">{playing || gameState.status === 'round_result' ? gameState.roundCorrectCount : '—'}</span>}
          meta={gameState.activeMultipliersCount > 0 ? `${gameState.activeMultipliersCount} multiplicador(es) ativo(s)` : undefined}
        />
        <Stat label="Biblioteca" value={<span className="num">{gameState.totalChallengesAvailable}</span>} meta="desafios cadastrados" />
      </StatStrip>

      <div className="ov-columns">
        {/* Desafio atual */}
        <Section
          title="Desafio atual"
          actions={
            <Chip icon={<Eye />} title="A resposta fica oculta durante a rodada e aparece depois que ela termina">
              Só no painel
            </Chip>
          }
        >
          {challenge ? (
            <div className="ov-challenge">
              <div className="ov-challenge__well frame">
                <div className="ov-challenge__emoji emoji" aria-label="Pista em emojis">
                  {challenge.emoji}
                </div>
                <div className="slots__flow ov-challenge__slots" style={{ fontSize: 22 }} aria-hidden="true">
                  {slots.map((word, wi) => (
                    <span key={wi} className="slots__word">
                      {word.map((slot, ci) => (
                        <span key={ci} className={`slot slot--${slot.kind}`}>
                          {slot.kind === 'revealed' ? slot.char : slot.kind === 'punct' ? slot.char : ''}
                        </span>
                      ))}
                    </span>
                  ))}
                </div>
              </div>
              <dl className="ov-facts">
                <div>
                  <dt>Resposta</dt>
                  <dd className="ov-facts__answer font-display">
                    {gameState.revealedAnswer || (playing ? 'Oculta durante a rodada' : 'Resposta indisponível')}
                  </dd>
                </div>
                <div>
                  <dt>Categoria</dt>
                  <dd>{challenge.category || 'Geral'}</dd>
                </div>
                <div>
                  <dt>Dificuldade</dt>
                  <dd>
                    <DifficultyMeter level={challenge.difficulty} />
                  </dd>
                </div>
                <div>
                  <dt>Letras</dt>
                  <dd className="num">
                    {counts.revealed} reveladas de {counts.total}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <EmptyState
              icon={<Film />}
              title="Nenhum desafio em andamento"
              description="Clique em “Iniciar partida” para sortear o primeiro desafio."
            />
          )}
        </Section>

        {/* Simulador */}
        <Section
          title="Simulador de teste"
          description="Envie palpites e presentes como se viessem da LIVE para conferir pontuação, lacunas e avisos."
          actions={<Chip tone="warn">Modo teste</Chip>}
        >
          <div className="ov-sim">
            <Field label="Usuário simulado" htmlFor="ov-sim-user">
              <TextInput id="ov-sim-user" value={simUser} onChange={(e) => setSimUser(e.target.value)} placeholder="ex.: pedro_live" autoComplete="off" />
            </Field>

            <form className="ov-sim__chat" onSubmit={handleSendChat}>
              <Field label="Palpite no chat" htmlFor="ov-sim-guess" className="ov-sim__guess">
                <TextInput id="ov-sim-guess" value={simMessage} onChange={(e) => setSimMessage(e.target.value)} placeholder="Digite o nome do filme…" autoComplete="off" />
              </Field>
              <Button type="submit" icon={<Send />} disabled={!simMessage.trim()}>
                Enviar
              </Button>
            </form>

            <div className="ov-sim__gifts">
              <span className="field__label">Presentes cadastrados</span>
              {giftsConfig.length === 0 ? (
                <span className="field__hint">Nenhum presente cadastrado. Configure em “Presentes”.</span>
              ) : (
                <ul className="ov-gifts">
                  {giftsConfig.map((gift) => (
                    <li key={gift.id}>
                      <button
                        type="button"
                        className={`ov-gift ${gift.active ? '' : 'is-off'}`}
                        onClick={() => handleSendGift(gift)}
                        title={`Testar presente ${gift.name}`}
                      >
                        <span className="ov-gift__ico">
                          <GiftIcon gift={gift} className="ov-gift__img" fallbackEmoji="🎁" />
                        </span>
                        <span className="ov-gift__txt">
                          <span className="ov-gift__name">{getCleanGiftName(gift.name, gift.iconType === 'image')}</span>
                          <span className="ov-gift__fx">{gift.active ? describeGiftEffect(gift) : 'Inativo'}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};
