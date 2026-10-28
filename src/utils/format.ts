/** Formatação de números e tempos para a interface. */

/** 23 → "0:23" · 65 → "1:05". Negativos viram 0:00. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** 1250 → "1.250" (pt-BR). */
export function formatScore(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Number.isFinite(value) ? value : 0);
}

/** Dois dígitos: 4 → "04". */
export function pad2(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, '0');
}

/** "agora", "12 s", "3 min", "2 h". */
export function relativeAge(timestamp: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 5) return 'agora';
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h`;
}

export type Difficulty = 'facil' | 'medio' | 'dificil';

export const DIFFICULTY_LEVEL: Record<Difficulty, number> = { facil: 1, medio: 2, dificil: 3 };
export const DIFFICULTY_NAME: Record<Difficulty, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
