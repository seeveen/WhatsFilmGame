import React, { useState } from 'react';
import { Volume2, VolumeX, MessageSquare } from 'lucide-react';
import { GameStateDTO, PlayerScore } from '../../../shared/types.ts';
import { RoundResultModal } from './RoundResultModal.tsx';
import { MatchResultModal } from './MatchResultModal.tsx';
import { soundEffects } from '../../utils/audio.ts';
import { GiftIcon, getCleanGiftName } from './GiftIcon.tsx';
import { GiftPushNotification, GiftPushData } from './GiftPushNotification.tsx';
import { SpectatorAvatar } from './SpectatorAvatar.tsx';

interface LiveTransmissionViewProps {
  gameState: GameStateDTO;
  layout: 'portrait' | 'landscape';
  onRestartMatch: () => void;
  recentNotification: { id: string; type: 'correct' | 'gift'; text: string; subText?: string } | null;
  recentGiftPush?: GiftPushData | null;
}

export const LiveTransmissionView: React.FC<LiveTransmissionViewProps> = ({
  gameState,
  layout,
  onRestartMatch,
  recentNotification,
  recentGiftPush,
}) => {
  const [isMuted, setIsMuted] = useState(soundEffects.getIsMuted());
  const isLandscape = layout === 'landscape';

  const toggleSound = () => {
    const next = soundEffects.toggleMute();
    setIsMuted(next);
  };

  const challenge = gameState.currentChallenge;
  const filmeTitle = challenge?.filme || 'O Rei Leão';
  const revealedLetters = new Set(challenge?.revealedLetters || []);
  const activeGifts = gameState.giftsConfig?.filter((gift) => gift.active) || [];

  const progressRatio = Math.max(
    0,
    Math.min(1, gameState.timeRemainingSeconds / (gameState.roundDurationSeconds || 30))
  );
  const liveStatus = gameState.tiktokConnection.status === 'connected'
    ? 'CONECTADO'
    : gameState.tiktokConnection.status === 'connecting'
    ? 'CONECTANDO'
    : gameState.tiktokConnection.status === 'error'
    ? 'ERRO'
    : 'OFFLINE';

  // Compact three-level indicator used beside the difficulty label.
  const difficulty = challenge?.difficulty || 'medio';
  const difficultyLevel = difficulty === 'facil' ? 1 : difficulty === 'dificil' ? 3 : 2;
  const difficultyLabel = difficulty === 'facil' ? 'Fácil' : difficulty === 'dificil' ? 'Difícil' : 'Médio';

  // Render unified word boxes with internal dashes: [-] [------] [---] [-----]
  const renderSlots = () => {
    if (!filmeTitle) return null;
    const words = filmeTitle.trim().split(/\s+/);

    return (
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3.5 px-1 max-w-full">
        {words.map((word, wIdx) => {
          return (
            <div
              key={wIdx}
              className="inline-flex items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md bg-[#110F11] border border-[#39272E] shadow-md shadow-black/30 transition-all duration-300 max-w-full"
            >
              {Array.from(word).map((char, cIdx) => {
                const isPunctuation = /^[^\p{L}\p{N}]$/u.test(char);
                if (isPunctuation) {
                  return (
                    <span
                      key={cIdx}
                      className="text-lg sm:text-2xl font-black text-zinc-400 select-none px-0.5 leading-none"
                    >
                      {char}
                    </span>
                  );
                }

                const charNorm = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
                const isRevealed = revealedLetters.has(char.toUpperCase()) || revealedLetters.has(charNorm);

                if (isRevealed) {
                  return (
                    <span
                      key={cIdx}
                      className="inline-flex items-center justify-center min-w-[15px] sm:min-w-[20px] md:min-w-[28px] px-0.5 sm:px-1 py-0.5 rounded-md bg-[#C5163D] text-white font-display font-black text-lg sm:text-2xl md:text-3xl select-none leading-none shadow-sm shadow-[#C5163D]/40 animate-in zoom-in-75 duration-200"
                    >
                      {char.toUpperCase()}
                    </span>
                  );
                }

                return (
                  <span
                    key={cIdx}
                    className="inline-flex items-center justify-center min-w-[11px] sm:min-w-[16px] md:min-w-[20px] text-center font-mono font-black text-zinc-500 text-xl sm:text-2xl md:text-3xl select-none leading-none"
                  >
                    -
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`w-full ${isLandscape ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-[#110F11] flex flex-col items-center justify-start text-[#F7F2F4] font-body relative overflow-x-hidden selection:bg-[#C5163D] selection:text-white`}>
      <main
        className={`w-full h-screen min-h-0 relative overflow-hidden ${isLandscape
          ? 'max-w-[1280px] grid grid-rows-[auto_minmax(0,1fr)_auto_190px] gap-3 p-4'
          : 'max-w-[560px] mx-auto flex flex-col gap-2 p-3'} `}
        style={{
          background: '#110F11',
        }}
      >
        {/* Corner Push Notification for Live TikTok Gifts */}
        <GiftPushNotification
          notification={recentGiftPush || null}
          giftsConfig={gameState.giftsConfig}
        />

        {/* Real-time Celebration Banner for Correct Guesses */}
        {recentNotification && recentNotification.type === 'correct' && (
          <div className="absolute top-20 left-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-3.5 rounded-md border border-[#C5163D]/50 shadow-xl flex items-center justify-between bg-[#8F102B] text-white">
              <div>
                <p className="font-extrabold text-sm sm:text-base font-display">{recentNotification.text}</p>
                {recentNotification.subText && (
                  <p className="text-xs font-semibold text-zinc-200">{recentNotification.subText}</p>
                )}
              </div>
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        )}

        {/* 1. Header */}
        <header className="app-drag-region w-full flex items-center justify-between gap-2 shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            {/* Clapperboard SVG icon in red box */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-[#C5163D] flex items-center justify-center shrink-0 shadow-md shadow-[#C5163D]/20">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <path d="M3 8l2.5-4.5 14 -1" />
                <path d="M10 12.5v4l3.5-2z" />
              </svg>
            </div>

            <div className="flex flex-col">
              <h1 className="font-display text-lg sm:text-2xl font-extrabold leading-none tracking-tight text-white whitespace-nowrap">
                Qual é o <span className="text-[#C5163D]">filme?</span>
              </h1>
              {/* Only Partida #01, no TikTok Live */}
              <span className="font-body text-[9px] sm:text-xs font-semibold tracking-[0.12em] uppercase text-[#B7A8AE] mt-0.5">
                Partida #{String(gameState.matchNumber).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 app-drag-controls">
            <button
              onClick={toggleSound}
              className="w-6 h-6 rounded-md bg-[#21171B] border border-[#39272E] flex items-center justify-center hover:border-white/25 transition-colors cursor-pointer"
              title={isMuted ? 'Ativar sons' : 'Silenciar sons'}
              aria-label={isMuted ? 'Ativar sons' : 'Silenciar sons'}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-[#E5254D]" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
            </button>
            <div className="game-round-label px-1.5 sm:px-2 py-1 rounded-md bg-[#21171B] border border-[#39272E] text-[9px] sm:text-[11px] font-bold text-white whitespace-nowrap">
              Rodada {String(gameState.currentRound).padStart(2, '0')}/{String(gameState.totalRounds).padStart(2, '0')}
            </div>
            <div className={`px-1.5 sm:px-2 py-1 rounded-md border text-[9px] sm:text-[11px] font-bold tracking-wider flex items-center gap-1 whitespace-nowrap ${gameState.tiktokConnection.status === 'connected' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-[#21171B] border-[#39272E] text-[#B7A8AE]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${gameState.tiktokConnection.status === 'connected' ? 'bg-emerald-400' : gameState.tiktokConnection.status === 'connecting' ? 'bg-amber-300 animate-pulse' : 'bg-[#897A81]'}`} />
              <span>{liveStatus}</span>
            </div>
          </div>
        </header>

        {/* 2. Main challenge stage */}
        <section aria-label="Desafio da rodada" className={`w-full min-h-0 rounded-lg border border-[#39272E] bg-[#1C171A] flex flex-col justify-between relative overflow-hidden ${isLandscape ? 'h-full p-4 sm:p-5' : 'flex-1 p-3 sm:p-4'}`}>
          <div className="flex items-center justify-between border-b border-[#39272E] pb-2 mb-2">
            <span className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-[#897A81]">
              <span className="h-3.5 w-0.5 bg-[#C5163D]" />
              Cena {String(gameState.currentRound).padStart(2, '0')}
            </span>
            {challenge?.category && (
              <span className="truncate text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.1em] text-[#B7A8AE]">
                {challenge.category}
              </span>
            )}
          </div>

          {/* Difficulty and title length */}
          <div className="flex items-center justify-between gap-2 px-0.5 mb-2">
            <div className="flex items-center gap-2 rounded-md border border-[#39272E] bg-[#151214] px-2.5 py-1.5">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.12em] uppercase text-[#897A81]">Dificuldade</span>
              <span className="flex items-center gap-1.5">
                <span className="flex items-center gap-0.5" aria-label={`Nível ${difficultyLevel} de 3`}>
                  {[1, 2, 3].map((level) => (
                    <span key={level} className={`h-1.5 w-3 rounded-sm ${level <= difficultyLevel ? 'bg-[#E5254D]' : 'bg-[#39272E]'}`} />
                  ))}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#F7F2F4]">{difficultyLabel}</span>
              </span>
            </div>
            <div className="shrink-0 rounded-md border border-[#39272E] bg-[#151214] px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold text-[#B7A8AE]">
              <span className="text-white">{challenge?.wordCount || 1}</span> {challenge?.wordCount === 1 ? 'palavra' : 'palavras'}
              <span className="mx-1 text-[#897A81]">·</span>
              <span className="text-white">{challenge?.letterCount || 0}</span> caracteres
            </div>
          </div>

          {/* Timer is part of the challenge stage, keeping the game state in one glance. */}
          <div aria-label="Tempo restante da rodada" className="px-0.5 mb-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.13em] uppercase text-[#897A81]">Tempo restante</span>
              <span className={`font-mono-num text-sm sm:text-base font-bold leading-none ${gameState.timeRemainingSeconds <= 5 && !gameState.isPaused ? 'text-[#E5254D]' : 'text-[#F7F2F4]'}`}>
                {String(gameState.timeRemainingSeconds).padStart(2, '0')}s
                {gameState.isPaused && <span className="ml-1.5 font-body text-[9px] text-amber-300">Pausado</span>}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#39272E]">
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${gameState.timeRemainingSeconds <= 5 && !gameState.isPaused ? 'bg-[#E5254D]' : 'bg-[#C5163D]'}`}
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Large Emoji Showcase */}
          <div className="w-full py-1 sm:py-2 my-auto text-center">
            <span
              className={`inline-block max-w-full break-words select-none leading-[1.2] ${isLandscape ? 'text-6xl sm:text-7xl md:text-8xl tracking-normal' : 'text-5xl sm:text-6xl md:text-7xl tracking-normal'}`}
              style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
            >
              {challenge?.emoji || '🚢 🧊 💔 🌊'}
            </span>
          </div>

          {/* Letter Slots */}
          <div className="my-1 sm:my-2">
            {renderSlots()}
          </div>

          {/* Hint bubble */}
          <div className="flex justify-center pt-1">
            {(() => {
              const letterGift = gameState.giftsConfig?.find((g) => g.active && g.action === 'reveal_letter');
              if (!letterGift) return null;
              const isImg = letterGift.iconType === 'image';
              const cleanName = getCleanGiftName(letterGift.name, isImg);
              return (
                <div className="relative max-w-full rounded-md border border-[#C5163D]/35 bg-[#211316] px-2.5 py-1.5 text-[#F7F2F4] shadow-sm">
                  <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-[#C5163D]/35 bg-[#211316]" />
                  <span className="relative flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#F06A82]">Dica</span>
                    <GiftIcon gift={letterGift} className="w-3.5 h-3.5 object-contain inline-block" fallbackEmoji="🫰" />
                    <span className="text-[10px] sm:text-xs font-medium">{cleanName} revela letras extras</span>
                  </span>
                </div>
              );
            })()}
          </div>
        </section>

        {/* 4. Chat Prompt Banner */}
        <section aria-label="Instruções para o chat" className="w-full py-2 px-3 sm:px-5 rounded-md bg-[#151214] border border-[#39272E] flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-[#B7A8AE] shrink-0 select-none">
          <MessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#E5254D] shrink-0" />
          <span className="text-center whitespace-normal">
            Digite <strong className="mx-0.5 text-[#F7F2F4] font-bold">o nome do filme</strong> no chat para pontuar.
          </span>
        </section>

        {/* 5. Bottom Two-Column Row: Placar & Presentes */}
        <div className={`w-full grid grid-cols-2 gap-2 sm:gap-4 min-h-0 ${isLandscape ? 'h-full' : 'flex-none'}`} style={isLandscape ? undefined : { height: 'clamp(172px, 27vh, 230px)' }}>
          {/* Card 1: Placar */}
          <div className="min-h-0 rounded-lg bg-[#1C171A] border border-[#39272E] p-2.5 sm:p-4 flex flex-col shadow-lg overflow-hidden">
            <div className="flex items-baseline justify-between mb-1.5 sm:mb-3 shrink-0">
              <span className="font-display text-base sm:text-2xl font-extrabold text-white">
                Placar
              </span>
              <span className="font-body text-[10px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-[#B7A8AE]">
                {isLandscape ? 'TOP 3' : 'TOP 5'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-h-0 justify-center overflow-hidden">
              {gameState.leaderboard.length === 0 ? (
                <div className="text-center text-[10px] sm:text-xs text-zinc-500 py-3 italic">
                  Aguardando os primeiros acertos da partida...
                </div>
              ) : (
                gameState.leaderboard.slice(0, isLandscape ? 3 : 5).map((player: PlayerScore, index: number) => {
                  const isFirst = index === 0;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 border-b border-[#39272E] text-[10px] sm:text-xs transition-colors ${
                        isFirst
                          ? 'border-l-2 border-l-[#E5254D] bg-[#8F102B]/20 text-white'
                          : 'text-[#F7F2F4]'
                      }`}
                    >
                      <span className={`w-5 font-display font-extrabold text-center text-sm ${isFirst ? 'text-white' : 'text-[#B7A8AE]'}`}>
                        {index + 1}
                      </span>
                      <SpectatorAvatar
                        username={player.username}
                        avatarUrl={player.avatarUrl}
                        sizeClassName="w-6 h-6 sm:w-7 sm:h-7"
                        className="rounded-full ring-2 ring-white/10"
                      />
                      <span className="flex-1 font-semibold truncate">
                        @{player.username}
                      </span>
                      <span className="font-display font-extrabold text-xs sm:text-sm font-mono-num shrink-0">
                        {player.matchScore}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 2: Presentes */}
          <div className="min-h-0 rounded-lg bg-[#1C171A] border border-[#39272E] p-2.5 sm:p-4 flex flex-col shadow-lg overflow-hidden">
            <div className="flex items-baseline justify-between gap-1 mb-1.5 sm:mb-3 shrink-0">
              <span className="font-display text-base sm:text-2xl font-extrabold text-white">
                Presentes
              </span>
              <span className="font-body text-[8px] sm:text-xs font-bold tracking-wider uppercase text-[#E5254D] whitespace-nowrap">
                Disponíveis
              </span>
            </div>

            <div className="gift-scroll-mask flex-1 min-h-0" aria-label="Presentes disponíveis para envio na LIVE">
              {activeGifts.length > 0 ? (
                <div
                  className="gift-scroll-track"
                  style={{ animationDuration: `${Math.max(24, (activeGifts.length || 1) * 5)}s` }}
                >
                  {[0, 1].map((copy) => (
                    <div className="gift-scroll-group" key={`configured-${copy}`} aria-hidden={copy === 1}>
                      {activeGifts.map((gift) => {
                        const isImage = gift.iconType === 'image';
                        const displayName = getCleanGiftName(gift.name, isImage);
                        const effectLabel = gift.action === 'add_time'
                          ? `+${gift.value}s na rodada`
                          : gift.action === 'reveal_letter'
                          ? 'Revela letras extras'
                          : gift.action === 'multiplier_2x'
                          ? `Pontuação ×${gift.value}`
                          : 'Bônus ativo';

                        return (
                          <div key={`${gift.id}-${copy}`} className="flex min-h-[56px] items-center gap-2 rounded-md border border-[#39272E]/80 bg-[#21171B]/90 px-2 py-1.5 text-[10px]">
                            <div className="w-8 h-8 rounded-sm bg-[#110F11] flex items-center justify-center shrink-0 border border-[#39272E]/60 overflow-hidden">
                              <GiftIcon gift={gift} className="w-6 h-6 object-contain" fallbackEmoji="🎁" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-display text-xs sm:text-sm font-bold text-white">{displayName}</div>
                              <div className="truncate text-[10px] text-[#B7A8AE]">Presente ativo na LIVE</div>
                              <div className="truncate text-[10px] font-semibold text-[#F06A82]">{effectLabel}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-zinc-400">
                  Cadastre e ative presentes em “Presentes & Imagens” para exibi-los aqui.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals for Round Result & Final Match Podium */}
        {gameState.status === 'round_result' && (
          <RoundResultModal
            filme={gameState.revealedAnswer || filmeTitle}
            roundNumber={gameState.currentRound}
            totalRounds={gameState.totalRounds}
            winners={gameState.roundWinners}
            countdownSeconds={gameState.intermissionSeconds}
          />
        )}

        {gameState.status === 'match_result' && (
          <MatchResultModal
            matchNumber={gameState.matchNumber}
            winners={gameState.matchWinners}
            onRestartNow={onRestartMatch}
            autoLoop={gameState.totalRounds > 0}
          />
        )}
      </main>
    </div>
  );
};
