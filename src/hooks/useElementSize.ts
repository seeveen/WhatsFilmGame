import { useCallback, useEffect, useRef, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Mede a área de conteúdo de um elemento (sem padding) e acompanha mudanças de tamanho.
 * Usado para ajustar emojis e lacunas à caixa realmente disponível, em qualquer proporção de janela.
 */
export function useElementSize<T extends HTMLElement>(): [(node: T | null) => void, ElementSize] {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const read = (width: number, height: number) =>
      setSize((prev) =>
        Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5 ? prev : { width, height }
      );

    const rect = node.getBoundingClientRect();
    read(rect.width, rect.height);

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      read(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return [ref, size];
}
