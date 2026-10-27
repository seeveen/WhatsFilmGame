import React from 'react';
import { Crown, Sparkles, RotateCcw, Flame } from 'lucide-react';
import { PlayerScore } from '../../../shared/types.ts';
import { SpectatorAvatar } from './SpectatorAvatar.tsx';

interface MatchResultModalProps {
  matchNumber: number;
  winners: PlayerScore[];
  onRestartNow: () => void;
  autoLoop: boolean;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  matchNumber,
  winners,
  onRestartNow,
  autoLoop,
}) => {
  const champion = winners[0];
  const second = winners[1];
  const third = winners[2];

  return (
    <div className="absolute inset-0 bg-[#110F11]/92 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-300">
      <div className="w-full max-w-lg rounded-lg bg-[#1C171A] border border-[#39272E] p-5 sm:p-7 text-center shadow-2xl relative overflow-hidden">

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5163D]/20 border border-[#C5163D]/40 text-xs font-extrabold text-[#E5254D] tracking-wider uppercase mb-3">
          <Sparkles className="w-4 h-4" />
          PARTIDA #{String(matchNumber).padStart(2, '0')} CONCLUÍDA!
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
          Classificação final
        </h2>
        <p className="text-xs text-[#B7A8AE] mt-1 mb-6">
          Resultado da partida #{String(matchNumber).padStart(2, '0')}
        </p>

        {/* Podium Visualization */}
        <div className="grid grid-cols-3 gap-2.5 items-end mb-6 pt-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            {second ? (
              <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom duration-500 delay-100">
                <span className="mb-1 text-xs font-bold text-zinc-300">2º LUGAR</span>
                <div className="relative mb-1.5">
                  <SpectatorAvatar
                    username={second.username}
                    avatarUrl={second.avatarUrl}
                    sizeClassName="w-13 h-13 sm:w-16 sm:h-16"
                    className="rounded-full ring-3 ring-zinc-300 ring-offset-2 ring-offset-[#1C171A] shadow-lg"
                  />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-[90px]">
                  @{second.username}
                </span>
                <span className="font-mono-num text-xs font-semibold text-[#B7A8AE] mb-2">
                  {second.matchScore} pts
                </span>
                <div className="w-full h-24 rounded-t-lg bg-[#21171B] border-t-2 border-zinc-500 flex items-center justify-center font-bold text-sm text-zinc-400">
                  2º
                </div>
              </div>
            ) : (
              <div className="w-full h-20 rounded-t-lg bg-white/5" />
            )}
          </div>

          {/* 1st Place (Champion) */}
          <div className="flex flex-col items-center">
            {champion ? (
              <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom duration-500">
                <Crown className="w-8 h-8 text-[#D8B45C] mb-0.5" />
                <div className="relative mb-1.5">
                  <SpectatorAvatar
                    username={champion.username}
                    avatarUrl={champion.avatarUrl}
                    sizeClassName="w-16 h-16 sm:w-20 sm:h-20"
                    className="rounded-full ring-4 ring-[#FFD700] ring-offset-2 ring-offset-[#1C171A] shadow-[0_0_24px_rgba(255,215,0,0.5)]"
                  />
                </div>
                <span className="text-sm font-extrabold text-white truncate max-w-[110px]">
                  @{champion.username}
                </span>
                <span className="font-mono-num text-sm font-bold text-[#E5254D] mb-2">
                  {champion.matchScore} pts
                </span>
                <div className="w-full h-32 rounded-t-lg bg-[#8F102B]/35 border-t-2 border-[#C5163D] flex flex-col items-center justify-center font-extrabold text-base text-white">
                  <span>1º</span>
                  <span className="text-[10px] uppercase font-semibold text-[#E5254D]">CAMPEÃO</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-28 rounded-t-lg bg-white/5" />
            )}
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            {third ? (
              <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom duration-500 delay-200">
                <span className="mb-1 text-xs font-bold text-amber-500">3º LUGAR</span>
                <div className="relative mb-1.5">
                  <SpectatorAvatar
                    username={third.username}
                    avatarUrl={third.avatarUrl}
                    sizeClassName="w-12 h-12 sm:w-14 sm:h-14"
                    className="rounded-full ring-3 ring-amber-600 ring-offset-2 ring-offset-[#1C171A] shadow-lg"
                  />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-[90px]">
                  @{third.username}
                </span>
                <span className="font-mono-num text-xs font-semibold text-[#B7A8AE] mb-2">
                  {third.matchScore} pts
                </span>
                <div className="w-full h-18 rounded-t-lg bg-[#21171B] border-t-2 border-amber-700 flex items-center justify-center font-bold text-sm text-amber-600">
                  3º
                </div>
              </div>
            ) : (
              <div className="w-full h-16 rounded-t-lg bg-white/5" />
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-[#39272E] flex items-center justify-between">
          <span className="text-xs text-[#B7A8AE] text-left">
            {autoLoop ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Flame className="w-3.5 h-3.5" />
                Nova partida em breve
              </span>
            ) : (
              'Loop automático pausado'
            )}
          </span>

          <button
            onClick={onRestartNow}
            className="px-4 py-2 rounded-lg bg-[#C5163D] hover:bg-[#E5254D] text-white text-xs font-bold transition-all shadow-md shadow-[#C5163D]/25 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Iniciar Nova Agora
          </button>
        </div>
      </div>
    </div>
  );
};
