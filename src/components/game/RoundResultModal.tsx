import React, { useEffect, useState } from 'react';
import { Award, Clock, Trophy } from 'lucide-react';
import { RoundWinner } from '../../../shared/types.ts';
import { SpectatorAvatar } from './SpectatorAvatar.tsx';

interface RoundResultModalProps {
  filme: string;
  roundNumber: number;
  totalRounds: number;
  winners: RoundWinner[];
  countdownSeconds: number;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  filme,
  roundNumber,
  totalRounds,
  winners,
  countdownSeconds,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds || 5);

  useEffect(() => {
    setSecondsLeft(countdownSeconds || 5);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownSeconds]);

  return (
    <div className="absolute inset-0 bg-[#110F11]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-lg bg-[#1C171A] border border-[#39272E] p-5 sm:p-7 text-center shadow-2xl relative overflow-hidden">

        {/* Round badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5163D]/15 border border-[#C5163D]/30 text-xs font-bold text-[#E5254D] tracking-wider uppercase mb-3">
          <Award className="w-3.5 h-3.5" />
          FIM DO ROUND {String(roundNumber).padStart(2, '0')}/{String(totalRounds).padStart(2, '0')}
        </div>

        {/* Answer Revealed */}
        <h2 className="text-xs uppercase tracking-[0.14em] text-[#B7A8AE] font-semibold mt-1">
          A RESPOSTA CORRETA É:
        </h2>
        <div className="my-3 py-3.5 px-4 rounded-md bg-[#151214] border-l-2 border-[#C5163D] text-left">
          <span className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-wide">
            {filme}
          </span>
        </div>

        {/* Top 3 Round Winners */}
        <div className="mt-5 text-left">
          <div className="flex items-center justify-between text-xs font-semibold text-[#B7A8AE] uppercase tracking-wider mb-2.5">
            <span className="flex items-center gap-1.5 font-display font-bold text-white">
              <Trophy className="w-4 h-4 text-amber-400" />
              TOP 3 DESTE ROUND
            </span>
            <span className="text-[10px] text-zinc-500">Pontos da Rodada</span>
          </div>

          {winners.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-500 bg-[#110F11]/50 rounded-lg border border-[#39272E]/60">
              Nenhum participante acertou a tempo neste round!
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {winners.slice(0, 3).map((w, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs sm:text-sm transition-all ${
                    idx === 0
                      ? 'bg-gradient-to-r from-[#C5163D]/25 to-[#21171B] border border-[#C5163D]/50 text-white shadow-sm'
                      : 'bg-[#21171B] border border-[#39272E]/60 text-[#F7F2F4]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-display font-extrabold text-xs shrink-0 ${
                        idx === 0
                          ? 'bg-[#C5163D] text-white shadow-sm'
                          : idx === 1
                          ? 'bg-zinc-700 text-white'
                          : 'bg-amber-700 text-white'
                      }`}
                    >
                      {idx === 0 ? '1º' : idx === 1 ? '2º' : '3º'}
                    </span>
                    <SpectatorAvatar
                      username={w.username}
                      avatarUrl={w.avatarUrl}
                      sizeClassName="w-8 h-8"
                      className="rounded-full ring-2 ring-white/10"
                    />
                    <span className="font-semibold text-white truncate">
                      @{w.username}
                    </span>
                    {w.multiplierApplied && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C5163D]/20 text-[#E5254D] text-[10px] font-bold">
                        ×2 Capivara
                      </span>
                    )}
                  </div>

                  <span className="font-display font-extrabold text-sm sm:text-base text-emerald-400">
                    +{w.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Automatic countdown footer */}
        <div className="mt-6 pt-4 border-t border-[#39272E] flex items-center justify-between text-xs text-[#B7A8AE]">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E5254D]" />
            Próximo round iniciando...
          </span>
          <span className="font-display font-extrabold text-base text-[#E5254D]">
            0{secondsLeft}s
          </span>
        </div>
      </div>
    </div>
  );
};
