import React, { useState, useEffect } from 'react';
import { History, Trophy, Gift, Calendar, RefreshCw } from 'lucide-react';

export const HistoryTab: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [recentGifts, setRecentGifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setMatches(data.matches || []);
      setRecentGifts(data.recentGifts || []);
    } catch (e: any) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 text-[#F7F2F4]">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white font-display flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#C5163D]" />
            Histórico de Partidas e Presentes
          </h2>
          <p className="text-xs text-[#B7A8AE] mt-1">
            Registros persistidos localmente no banco de dados SQLite
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-xs font-semibold text-white cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Past Matches */}
        <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl space-y-4">
          <h3 className="font-extrabold text-base text-white font-display flex items-center gap-2 border-b border-[#39272E] pb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            Partidas Anteriores
          </h3>

          {matches.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 italic">
              Nenhuma partida finalizada registrada ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-lg bg-[#110F11] border border-[#39272E] text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-display text-sm">
                      Partida #{m.matchNumber} ({m.totalRounds} rounds)
                    </span>
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono-num">
                      <Calendar className="w-3 h-3" />
                      {new Date(m.completedAt).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Winners preview */}
                  {m.winners && m.winners.length > 0 && (
                    <div className="pt-2 border-t border-[#39272E]/60 flex items-center gap-3">
                      <span className="text-[11px] text-[#B7A8AE] font-semibold">Pódio:</span>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {m.winners.slice(0, 3).map((w: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-[#21171B] border border-[#39272E] text-white font-semibold"
                          >
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} @{w.username} ({w.matchScore} pts)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Gifts Log */}
        <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl space-y-4">
          <h3 className="font-extrabold text-base text-white font-display flex items-center gap-2 border-b border-[#39272E] pb-3">
            <Gift className="w-4 h-4 text-[#C5163D]" />
            Últimos Presentes Processados
          </h3>

          {recentGifts.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 italic">
              Nenhum presente registrado ainda nesta sessão.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {recentGifts.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#110F11] border border-[#39272E] text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-white">@{g.username}</span>
                    <span className="text-zinc-600 mx-1.5">•</span>
                    <span className="text-zinc-300 font-semibold">{g.giftName} {g.amount > 1 ? `×${g.amount}` : ''}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C5163D]/20 border border-[#C5163D]/30 text-[#E5254D] text-[11px] font-bold">
                      {g.effectLabel}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono-num">
                      {new Date(g.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
