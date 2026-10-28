import React, { useMemo } from 'react';
import { SlotWord, buildSlotModel } from '../../game/slots.ts';
import { fitSlots } from '../../game/fit.ts';
import { useElementSize } from '../../hooks/useElementSize.ts';

interface AnswerSlotsProps {
  title: string;
  revealedLetters?: string[];
  /** Mostra a resposta inteira (tela de resultado): as lacunas viram o título, em sequência. */
  reveal?: boolean;
  /** Unidade do palco em px, para limitar o corpo da fonte. */
  unit: number;
  maxFontUnits?: number;
}

function statsOf(model: SlotWord[]) {
  return model.map((word) => ({
    letters: word.filter((s) => s.kind !== 'punct').length,
    punct: word.filter((s) => s.kind === 'punct').length,
  }));
}

/**
 * Lacunas da resposta: uma palavra por grupo, pontuação sempre visível, letras reveladas em destaque.
 * O corpo da fonte é calculado para caber na caixa disponível (1 a N linhas).
 */
export const AnswerSlots: React.FC<AnswerSlotsProps> = ({ title, revealedLetters = [], reveal = false, unit, maxFontUnits = 34 }) => {
  const [boxRef, box] = useElementSize<HTMLDivElement>();
  const revealedKey = revealedLetters.join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const model = useMemo(() => buildSlotModel(title, revealedLetters), [title, revealedKey]);
  const stats = useMemo(() => statsOf(model), [model]);
  const fit = useMemo(
    () => fitSlots(stats, box.width, box.height, { min: Math.max(10, 12 * unit), max: Math.max(14, maxFontUnits * unit) }),
    [stats, box.width, box.height, unit, maxFontUnits]
  );

  let letterIndex = 0;
  const total = model.reduce((n, word) => n + word.filter((s) => s.kind !== 'punct').length, 0);
  const stagger = Math.min(40, 700 / Math.max(1, total));

  return (
    <div ref={boxRef} className="slots" data-reveal={reveal || undefined}>
      <div className="slots__flow" style={{ fontSize: `${fit.fontSize}px` }} role="img" aria-label={reveal ? title : `${model.reduce((n, w) => n + w.length, 0)} letras`}>
        {model.map((word, wi) => (
          <span key={wi} className="slots__word">
            {word.map((slot, ci) => {
              if (slot.kind === 'punct') {
                return (
                  <span key={ci} className="slot slot--punct" aria-hidden="true">
                    {slot.char}
                  </span>
                );
              }
              const kind = reveal ? 'revealed' : slot.kind;
              const delay = reveal ? { animationDelay: `${Math.round(letterIndex * stagger)}ms` } : undefined;
              letterIndex += 1;
              return (
                <span key={ci} className={`slot slot--${kind}`} style={delay} aria-hidden="true">
                  {kind === 'revealed' ? slot.char : ''}
                </span>
              );
            })}
          </span>
        ))}
      </div>
    </div>
  );
};
