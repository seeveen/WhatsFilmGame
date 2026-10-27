import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Film,
  Radio,
  Clock,
  Send,
  Gift,
  Zap,
} from 'lucide-react';
import { GameStateDTO } from '../../../../shared/types.ts';

interface OverviewTabProps {
  gameState: GameStateDTO;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ gameState }) => {
  const [simUser, setSimUser] = useState('marcos_live');
  const [simMessage, setSimMessage] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleAction = async (endpoint: string, body?: any) => {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Ação executada com sucesso!');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (e: any) {
      setStatusMsg(`Erro: ${e.message}`);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    await handleAction('/api/tiktok/simulate-chat', {
      username: simUser,
      comment: simMessage.trim(),
    });
    setSimMessage('');
  };

  const handleSendGift = async (gift: any) => {
    await handleAction('/api/tiktok/simulate-gift', {
      username: simUser,
      giftName: gift.name,
      giftId: gift.id,
      repeatCount: 1,
    });
  };

  const giftsConfig = gameState.giftsConfig || [];

  return (
    <div className="space-y-6 text-[#F7F2F4]">
      {/* Top Banner Status Notification */}
      {statusMsg && (
        <div className="px-4 py-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-400 animate-in fade-in">
          {statusMsg}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Estado do Jogo */}
        <div className="p-5 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-lg">
          <span className="text-[11px] font-semibold text-[#B7A8AE] uppercase tracking-[0.14em] block mb-1.5">
            ESTADO DA PARTIDA
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold font-display text-white uppercase">
              {gameState.status === 'playing'
                ? 'Em Jogo'
                : gameState.status === 'round_result'
                ? 'Resultado'
                : gameState.status === 'match_result'
                ? 'Finalizada'
                : 'Aguardando'}
            </span>
            <span
              className={`w-3 h-3 rounded-full ${
                gameState.status === 'playing'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
          </div>
          <span className="text-xs text-zinc-500 mt-2 block font-medium">
            Partida #{String(gameState.matchNumber).padStart(2, '0')}
          </span>
        </div>

        {/* Metric 2: Round & Tempo */}
        <div className="p-5 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-lg">
          <span className="text-[11px] font-semibold text-[#B7A8AE] uppercase tracking-[0.14em] block mb-1.5">
            ROUND ATUAL
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-display text-[#C5163D]">
              {String(gameState.currentRound).padStart(2, '0')}/
              {String(gameState.totalRounds).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-white font-mono-num bg-[#21171B] px-2.5 py-1 rounded-md border border-[#39272E]">
              <Clock className="w-3.5 h-3.5 text-[#C5163D]" />
              {gameState.timeRemainingSeconds}s
            </div>
          </div>
          <span className="text-xs text-zinc-500 mt-2 block font-medium">
            {gameState.isPaused ? 'Pausado' : 'Temporizador rodando'}
          </span>
        </div>

        {/* Metric 3: Desafios no Banco */}
        <div className="p-5 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-lg">
          <span className="text-[11px] font-semibold text-[#B7A8AE] uppercase tracking-[0.14em] block mb-1.5">
            BIBLIOTECA ATIVA
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-display text-white">
              {gameState.totalChallengesAvailable}
            </span>
            <Film className="w-5 h-5 text-zinc-500" />
          </div>
          <span className="text-xs text-zinc-500 mt-2 block font-medium">
            Filmes cadastrados no SQLite
          </span>
        </div>

        {/* Metric 4: Conexão TikTok LIVE */}
        <div className="p-5 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-lg">
          <span className="text-[11px] font-semibold text-[#B7A8AE] uppercase tracking-[0.14em] block mb-1.5">
            CONEXÃO TIKTOK
          </span>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white truncate max-w-[130px]">
              {gameState.tiktokConnection.username
                ? `@${gameState.tiktokConnection.username}`
                : 'Não conectado'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                gameState.tiktokConnection.status === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {gameState.tiktokConnection.status}
            </span>
          </div>
          <span className="text-xs text-zinc-500 mt-2 block font-medium">
            {gameState.tiktokConnection.viewerCount !== undefined
              ? `${gameState.tiktokConnection.viewerCount} espectadores`
              : 'Conector ttlc'}
          </span>
        </div>
      </div>

      {/* Control Actions Row */}
      <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-white font-display">Controles da Partida</h2>
          <p className="text-xs text-[#B7A8AE] mt-0.5">
            Inicie novas partidas, pause o fluxo automático ou avance rounds
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleAction('/api/game/start')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C5163D] hover:bg-[#E5254D] text-white text-xs font-bold transition-all shadow-lg shadow-[#C5163D]/25 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Iniciar Partida
          </button>

          {gameState.isPaused ? (
            <button
              onClick={() => handleAction('/api/game/resume')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Retomar
            </button>
          ) : (
            <button
              onClick={() => handleAction('/api/game/pause')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              Pausar
            </button>
          )}

          <button
            onClick={() => handleAction('/api/game/skip')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            Pular Round
          </button>

          <button
            onClick={() => handleAction('/api/game/reset-leaderboard')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-zinc-400 hover:text-[#E5254D] text-xs font-semibold transition-all cursor-pointer"
            title="Zera apenas as pontuações da partida sem apagar biblioteca"
          >
            <RotateCcw className="w-4 h-4" />
            Zerar Placar
          </button>
        </div>
      </div>

      {/* Current Round Details & Quick Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Current Active Challenge Preview */}
        <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#39272E] pb-3">
            <h3 className="text-sm font-extrabold text-white font-display flex items-center gap-2">
              <Film className="w-4 h-4 text-[#C5163D]" />
              Desafio Ativo no Momento
            </h3>
            <span className="text-xs text-zinc-500">Visualização Admin</span>
          </div>

          {gameState.currentChallenge ? (
            <div className="space-y-3">
              <div className="p-5 rounded-lg bg-[#110F11] border border-[#39272E] text-center shadow-inner">
                <span className="text-5xl select-none block mb-2">
                  {gameState.currentChallenge.emoji}
                </span>
                <p className="font-mono-num text-lg font-extrabold tracking-widest text-zinc-300">
                  {gameState.currentChallenge.maskedTitle}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#21171B] border border-[#39272E] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#B7A8AE]">Resposta oficial:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {gameState.revealedAnswer || gameState.currentChallenge.filme}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B7A8AE]">Categoria:</span>
                  <span className="text-white font-semibold">
                    {gameState.currentChallenge.category || 'Geral'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              Nenhum desafio em andamento. Clique em "Iniciar Partida".
            </div>
          )}
        </div>

        {/* Right: Real-time Live Simulator (Chat & Gifts) */}
        <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#39272E] pb-3">
            <h3 className="text-sm font-extrabold text-white font-display flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#C5163D]" />
              Simulador de Teste (Chat & Presentes)
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C5163D]/20 text-[#E5254D] font-bold">
              Modo Teste
            </span>
          </div>

          <p className="text-xs text-[#B7A8AE]">
            Teste palpites e envio de presentes em tempo real para verificar a pontuação, slots de letras e notificações.
          </p>

          {/* User selector input */}
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-[#B7A8AE] shrink-0 font-semibold">Usuário simulado:</span>
            <input
              type="text"
              value={simUser}
              onChange={(e) => setSimUser(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-md bg-[#110F11] border border-[#39272E] text-white text-xs focus:outline-none focus:border-[#C5163D]"
              placeholder="ex: pedro_live"
            />
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={simMessage}
              onChange={(e) => setSimMessage(e.target.value)}
              placeholder="Digite o palpite do filme..."
              className="flex-1 px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-xs text-white focus:outline-none focus:border-[#C5163D]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-[#C5163D] hover:bg-[#E5254D] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#C5163D]/20"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar
            </button>
          </form>

          {/* Quick Gift Trigger Buttons */}
          <div className="pt-2 border-t border-[#39272E]">
            <span className="text-[11px] font-semibold text-[#B7A8AE] block mb-2">
              Disparar Presentes Cadastrados:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {giftsConfig.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleSendGift(g)}
                  className="px-2.5 py-2 rounded-md bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
                  title={`Testar presente ${g.name}`}
                >
                  {g.iconType === 'image' && g.iconValue ? (
                    <img src={g.iconValue} alt="" className="w-4 h-4 object-contain" />
                  ) : (
                    <span>{g.iconValue || '🎁'}</span>
                  )}
                  <span className="truncate">{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
