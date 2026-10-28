import React, { useMemo } from 'react';
import { fitEmojiGrid, splitClue } from '../../game/fit.ts';
import { useElementSize } from '../../hooks/useElementSize.ts';

/** A sequência de emojis é o foco da tela: ocupa toda a caixa livre, sem cortar, para qualquer quantidade. */
export const EmojiClue: React.FC<{ clue: string }> = ({ clue }) => {
  const [boxRef, box] = useElementSize<HTMLDivElement>();
  const symbols = useMemo(() => splitClue(clue), [clue]);
  const fit = useMemo(() => fitEmojiGrid(symbols.length, box.width, box.height), [symbols.length, box.width, box.height]);

  return (
    <div ref={boxRef} className="emojis" aria-label={`Pista: ${symbols.length} emojis`} role="img">
      {symbols.length > 0 && fit.cell > 0 && (
        <div
          className="emojis__grid"
          style={{
            width: `${fit.cols * fit.cell + (fit.cols - 1) * fit.gap}px`,
            gap: `${fit.gap}px`,
            fontSize: `${fit.fontSize}px`,
            ['--cell' as string]: `${fit.cell}px`,
          }}
        >
          {symbols.map((symbol, index) => (
            <span key={`${index}-${symbol}`} className="emojis__cell emoji" aria-hidden="true">
              {symbol}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
