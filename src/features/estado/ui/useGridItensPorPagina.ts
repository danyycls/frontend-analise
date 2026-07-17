import { useState, useEffect } from 'react';

export function useGridItensPorPagina(ref: React.RefObject<HTMLElement | null>, colMin: number, gap: number, rows: number): number {
  const [itens, setItens] = useState(rows * 2);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (!w) return;
      const cols = Math.max(1, Math.floor((w + gap) / (colMin + gap)));
      setItens(cols * rows);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, colMin, gap, rows]);
  return itens;
}
