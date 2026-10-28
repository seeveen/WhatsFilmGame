/**
 * Ajuste automático de tamanho para o desafio (emojis e lacunas).
 *
 * A tela de jogo precisa manter os emojis grandes e legíveis para qualquer quantidade de símbolos e
 * qualquer proporção de janela (9:16, 16:9, OBS, TikTok LIVE Studio). Em vez de tamanhos fixos por
 * breakpoint, medimos a caixa disponível e escolhemos a melhor grade. Funções puras → testáveis.
 */

/* ── Emojis ───────────────────────────────────────────────────────────── */

/** Quebra a sequência em símbolos (clusters de grafemas: ZWJ, bandeiras, tons de pele) ignorando espaços. */
export function splitClue(clue: string | null | undefined): string[] {
  const text = (clue ?? '').trim();
  if (!text) return [];
  const Segmenter = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  const parts = Segmenter
    ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
    : Array.from(text);
  return parts.filter((part) => part.trim().length > 0);
}

export const EMOJI_GAP = 0.14; // espaço entre símbolos, relativo ao tamanho da célula
export const EMOJI_CELL_PER_FONT = 1.22; // célula = font-size × 1.22 (largura típica dos emojis coloridos)

export interface EmojiFit {
  cols: number;
  rows: number;
  /** Lado da célula, em px. */
  cell: number;
  /** font-size do emoji, em px. */
  fontSize: number;
  /** Espaço entre células, em px. */
  gap: number;
}

export function fitEmojiGrid(count: number, boxW: number, boxH: number): EmojiFit {
  if (count <= 0 || boxW <= 0 || boxH <= 0) return { cols: 1, rows: 1, cell: 0, fontSize: 0, gap: 0 };

  const maxCell = Math.min(boxH, boxW * 0.42);
  const options: EmojiFit[] = [];

  for (let cols = 1; cols <= count; cols += 1) {
    const rows = Math.ceil(count / cols);
    const widthCell = boxW / (cols + (cols - 1) * EMOJI_GAP);
    const heightCell = boxH / (rows + (rows - 1) * EMOJI_GAP);
    const cell = Math.min(widthCell, heightCell, maxCell);
    options.push({ cols, rows, cell, fontSize: cell / EMOJI_CELL_PER_FONT, gap: cell * EMOJI_GAP });
  }

  const best = Math.max(...options.map((o) => o.cell));
  // Maior símbolo possível; entre opções até 15% menores prefere menos linhas: uma sequência lê melhor numa linha só.
  const acceptable = options.filter((o) => o.cell >= best * 0.85);
  acceptable.sort((a, b) => a.rows - b.rows || b.cell - a.cell);
  const pick = acceptable[0];

  // Equilibra as linhas: n=7 com 4 colunas fica 4+3 (a última linha é centralizada pelo CSS).
  return pick;
}

/* ── Lacunas da resposta ──────────────────────────────────────────────── */

export const SLOT_CELL = 0.8; // largura de uma letra (em em)
export const SLOT_PUNCT = 0.5; // largura de um sinal de pontuação
export const SLOT_WORD_GAP = 1.0; // espaço entre palavras
export const SLOT_LINE = 1.6; // altura de linha

export interface SlotFit {
  fontSize: number;
  lines: number;
}

/** wordWidths: nº de letras e sinais de cada palavra → [{ letters, punct }] */
export function fitSlots(
  words: { letters: number; punct: number }[],
  boxW: number,
  boxH: number,
  limits: { min?: number; max?: number } = {}
): SlotFit {
  const min = limits.min ?? 14;
  const max = limits.max ?? 56;
  if (words.length === 0 || boxW <= 0 || boxH <= 0) return { fontSize: min, lines: 0 };

  const simulate = (fs: number): number => {
    const widths = words.map((w) => (w.letters * SLOT_CELL + w.punct * SLOT_PUNCT) * fs);
    const gap = SLOT_WORD_GAP * fs;
    let lines = 1;
    let used = 0;
    for (const width of widths) {
      if (used === 0) {
        used = width;
      } else if (used + gap + width <= boxW) {
        used += gap + width;
      } else {
        lines += 1;
        used = width;
      }
    }
    return lines;
  };

  const fits = (fs: number): boolean => {
    const widest = Math.max(...words.map((w) => (w.letters * SLOT_CELL + w.punct * SLOT_PUNCT) * fs));
    if (widest > boxW) return false;
    return simulate(fs) * SLOT_LINE * fs <= boxH;
  };

  for (let fs = max; fs >= min; fs -= 0.5) {
    if (fits(fs)) return { fontSize: fs, lines: simulate(fs) };
  }
  // Nada cabe com folga: usa o tamanho mínimo e deixa o CSS quebrar/cortar com elegância.
  return { fontSize: min, lines: simulate(min) };
}

/* ── Escala do palco ──────────────────────────────────────────────────── */

export type StageLayout = 'portrait' | 'landscape';

/** Tamanho de referência do palco, em unidades (1u = 1px na janela de referência). Espelha o CSS (`--u`). */
export const STAGE_REFERENCE: Record<StageLayout, { w: number; h: number }> = {
  portrait: { w: 360, h: 640 },
  landscape: { w: 640, h: 360 },
};

/** px por unidade do palco para a janela dada: o que limita primeiro (largura ou altura) define a escala. */
export function stageUnit(width: number, height: number, layout: StageLayout): number {
  const ref = STAGE_REFERENCE[layout];
  if (width <= 0 || height <= 0) return 1;
  return Math.min(width / ref.w, height / ref.h);
}
