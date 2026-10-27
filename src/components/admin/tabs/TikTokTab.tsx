import React, { useState } from 'react';
import { Radio, RefreshCw, Terminal, Unplug } from 'lucide-react';
import { GameStateDTO } from '../../../../shared/types.ts';

interface TikTokTabProps {
  gameState: GameStateDTO;
}

export const TikTokTab: React.FC<TikTokTabProps> = ({ gameState }) => {
  const [username, setUsername] = useState(gameState.tiktokConnection.username || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState('');
  const [logs, setLogs] = useState<{ message: string; timestamp: number }[]>([
    { message: 'Módulo TikTok LIVE Connector (ttlc) inicializado.', timestamp: Date.now() },
  ]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Digite o nome de usuário do TikTok.');
      return;
    }
    setIsConnecting(true);
    setConnectMsg('');
    try {
      const res = await fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      setConnectMsg(data.message);
      setLogs((prev) => [
        { message: data.message, timestamp: Date.now() },
        ...prev.slice(0, 40),
      ]);
    } catch (e: any) {
      setConnectMsg(`Erro: ${e.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/tiktok/disconnect', { method: 'POST' });
      setConnectMsg('Desconectado com sucesso.');
      setLogs((prev) => [
        { message: 'Conexão encerrada pelo streamer.', timestamp: Date.now() },
        ...prev.slice(0, 40),
      ]);
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  const status = gameState.tiktokConnection.status;

  return (
    <div className="space-y-6 text-[#F7F2F4]">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white font-display flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-[#C5163D]" />
            Integração TikTok LIVE (tiktok-live-connector)
          </h2>
          <p className="text-xs text-[#B7A8AE] mt-1">
            Conecte sua transmissão ao vivo sem necessidade de chaves de API secretas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              status === 'connected'
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                : status === 'connecting'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400'
                : 'bg-zinc-800 border border-[#39272E] text-zinc-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : status === 'connecting'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-zinc-500'
              }`}
            />
            {status === 'connected'
              ? 'Conectado à LIVE'
              : status === 'connecting'
              ? 'Conectando...'
              : 'Desconectado'}
          </span>
        </div>
      </div>

      {connectMsg && (
        <div className="px-4 py-3 rounded-lg bg-[#21171B] border border-[#39272E] text-xs font-semibold text-white">
          {connectMsg}
        </div>
      )}

      {/* Connection Form */}
      <div className="p-6 sm:p-8 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl space-y-4">
        <h3 className="font-extrabold text-base text-white font-display">Conectar Canal TikTok</h3>
        <p className="text-xs text-[#B7A8AE]">
          Insira seu @username (o canal precisa estar <strong>AO VIVO</strong> no momento para estabelecer a conexão Webcast WebSocket).
        </p>

        <form onSubmit={handleConnect} className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[260px] relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
              placeholder="seu_usuario_tiktok"
              className="w-full pl-9 pr-4 py-3 rounded-lg bg-[#110F11] border border-[#39272E] text-xs text-white font-semibold focus:outline-none focus:border-[#C5163D]"
            />
          </div>

          <button
            type="submit"
            disabled={isConnecting}
            className="px-6 py-3 rounded-lg bg-[#C5163D] hover:bg-[#E5254D] text-white text-xs font-bold transition-all shadow-lg shadow-[#C5163D]/25 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            Conectar à LIVE
          </button>

          {status === 'connected' && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-5 py-3 rounded-lg bg-[#21171B] hover:bg-[#C5163D]/20 border border-[#39272E] text-[#E5254D] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Unplug className="w-4 h-4" />
              Desconectar
            </button>
          )}
        </form>

        <div className="p-4 rounded-lg bg-[#110F11] border border-[#39272E] text-xs text-[#B7A8AE] space-y-1">
          <p className="font-semibold text-white">Instruções:</p>
          <p>1. Inicie sua transmissão ao vivo no aplicativo do TikTok ou TikTok LIVE Studio.</p>
          <p>2. Digite seu @username acima e clique em "Conectar à LIVE".</p>
          <p>3. O backend se conectará via Webcast Socket e escutará automaticamente todos os comentários e presentes em tempo real.</p>
          <p>4. No OBS Studio, adicione uma fonte de navegador (Browser Source) apontando para a tela do jogo em resolução 1080x1920.</p>
        </div>
      </div>

      {/* Live Logs Terminal */}
      <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#39272E]">
          <span className="text-xs font-extrabold text-white font-display flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#C5163D]" />
            Log de Eventos da LIVE
          </span>
          <span className="text-[11px] text-zinc-500 font-mono-num">Tempo real</span>
        </div>

        <div className="p-4 rounded-lg bg-[#110F11] border border-[#39272E] font-mono-num text-[11px] text-zinc-400 max-h-48 overflow-y-auto space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-zinc-600 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
              </span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-300">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
