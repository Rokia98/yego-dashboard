'use client';

import { useEffect, useState, type RefObject } from 'react';

/** Largeur en px d'un élément, suivie via ResizeObserver (pour des SVG nets). */
export function useElementWidth(ref: RefObject<HTMLElement>, fallback = 600): number {
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width || fallback);
    return () => ro.disconnect();
  }, [ref, fallback]);

  return width;
}
