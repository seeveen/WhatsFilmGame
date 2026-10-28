import { useEffect, useRef, useState } from 'react';
import { GameStatus, PlayerScore } from '../../shared/types.ts';

/**
 * Pequenos derivados de VISUAL calculados a partir do estado real do jogo.
 * Nenhum deles cria dados: só comparam o estado atual com o anterior para animar mudanças.
 */

/** Maior tempo visto na rodada — dá à barra do cronômetro uma referência correta quando presentes adicionam segundos. */
export function useRoundCeiling(time: number, duration: number, roundKey: string): number {
  const ref = useRef({ key: '', max: 0 });
  if (ref.current.key !== roundKey) ref.current = { key: roundKey, max: Math.max(duration, 1) };
  ref.current.max = Math.max(ref.current.max, time, 1);
  return ref.current.max;
}

/** Quando o tempo AUMENTA durante a rodada (presente), devolve o acréscimo por ~2s. */
export function useTimeBonus(time: number, playing: boolean, roundKey: string): { id: number; amount: number } | null {
  const previous = useRef<{ time: number; key: string } | null>(null);
  const counter = useRef(0);
  const [bonus, setBonus] = useState<{ id: number; amount: number } | null>(null);

  useEffect(() => {
    const prev = previous.current;
    previous.current = { time, key: roundKey };
    if (!playing || !prev || prev.key !== roundKey || time <= prev.time) return;
    counter.current += 1;
    setBonus({ id: counter.current, amount: time - prev.time });
  }, [time, playing, roundKey]);

  useEffect(() => {
    if (!bonus) return;
    const timeout = setTimeout(() => setBonus(null), 2200);
    return () => clearTimeout(timeout);
  }, [bonus]);

  return bonus;
}

/** Mudanças de posição no ranking (positivo = subiu). Ficam visíveis por alguns segundos. */
export function useRankDeltas(leaderboard: PlayerScore[]): Record<string, number> {
  const previous = useRef<Map<string, number>>(new Map());
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  useEffect(() => {
    const next = new Map(leaderboard.map((player, index) => [player.id, index] as const));
    const fresh: Record<string, number> = {};
    next.forEach((rank, id) => {
      const before = previous.current.get(id);
      if (before !== undefined && before !== rank) fresh[id] = before - rank;
    });
    previous.current = next;
    if (next.size === 0) {
      setDeltas((d) => (Object.keys(d).length ? {} : d));
      return;
    }
    if (Object.keys(fresh).length > 0) setDeltas((d) => ({ ...d, ...fresh }));
  }, [leaderboard]);

  useEffect(() => {
    if (Object.keys(deltas).length === 0) return;
    const timeout = setTimeout(() => setDeltas({}), 6000);
    return () => clearTimeout(timeout);
  }, [deltas]);

  return deltas;
}

/** Relógio de 1 s para idades relativas ("12 s"). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export interface TransitionSettings {
  intermissionSeconds?: number;
  autoLoopMatches?: boolean;
}

/**
 * Lê as configurações reais (GET /api/settings, endpoint já existente) quando a tela de resultado abre,
 * para a contagem regressiva e o aviso de "nova partida" refletirem o que o servidor realmente fará.
 */
export function useTransitionSettings(status: GameStatus): TransitionSettings {
  const [settings, setSettings] = useState<TransitionSettings>({});
  useEffect(() => {
    if (status !== 'round_result' && status !== 'match_result') return;
    let alive = true;
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        setSettings({
          intermissionSeconds: Number(data?.intermissionSeconds) > 0 ? Number(data.intermissionSeconds) : undefined,
          autoLoopMatches: typeof data?.autoLoopMatches === 'boolean' ? data.autoLoopMatches : undefined,
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [status]);
  return settings;
}

/**
 * Contagem regressiva em segundos inteiros, reiniciada quando `key` muda.
 * Devolve null enquanto a duração ainda é desconhecida (nunca inventa um número).
 */
export function useCountdown(totalSeconds: number | undefined, key: string): number | null {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!totalSeconds || totalSeconds <= 0) {
      setLeft(null);
      return;
    }
    const startedAt = Date.now();
    setLeft(totalSeconds);
    const id = setInterval(() => {
      const remaining = Math.max(0, totalSeconds - Math.floor((Date.now() - startedAt) / 1000));
      setLeft(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [totalSeconds, key]);
  return left;
}
