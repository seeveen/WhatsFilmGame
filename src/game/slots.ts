/**
 * Modelo visual das lacunas da resposta ("slots").
 *
 * É a mesma regra que a tela de jogo já usava (palavras separadas por espaço; pontuação sempre visível;
 * letra revelada quando está no conjunto de letras reveladas, com ou sem acento) — só que isolada em uma
 * função pura para poder ser testada e reaproveitada pelo layout novo.
 */

export type SlotKind = 'hidden' | 'revealed' | 'punct';

export interface SlotChar {
  char: string;
  kind: SlotKind;
}

export type SlotWord = SlotChar[];

const PUNCTUATION = /^[^\p{L}\p{N}]$/u;

function stripAccents(char: string): string {
  return char.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

export function buildSlotModel(title: string | null | undefined, revealedLetters: Iterable<string> = []): SlotWord[] {
  const trimmed = (title ?? '').trim();
  if (!trimmed) return [];
  const revealed = new Set(revealedLetters);

  return trimmed.split(/\s+/).map((word) =>
    Array.from(word).map<SlotChar>((char) => {
      if (char === HIDDEN_TITLE_SLOT) return { char: '', kind: 'hidden' };
      if (PUNCTUATION.test(char)) return { char, kind: 'punct' };
      const isRevealed = revealed.has(char.toUpperCase()) || revealed.has(stripAccents(char));
      return { char: char.toUpperCase(), kind: isRevealed ? 'revealed' : 'hidden' };
    })
  );
}

export function countSlots(model: SlotWord[]): { total: number; revealed: number } {
  let total = 0;
  let revealed = 0;
  for (const word of model) {
    for (const slot of word) {
      if (slot.kind === 'punct') continue;
      total += 1;
      if (slot.kind === 'revealed') revealed += 1;
    }
  }
  return { total, revealed };
}
import { HIDDEN_TITLE_SLOT } from './normalization.ts';

