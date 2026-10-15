'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

// Halo qui suit le pointeur sur chaque `.lp-projecteur` de la grille : un seul
// écouteur, positions écrites en variables CSS (aucun rendu React).
export default function GrilleProjecteur({ className = '', children }: { className?: string; children: ReactNode }) {
  const raf = useRef(0);

  function bouger(e: PointerEvent<HTMLDivElement>) {
    const grille = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      grille.querySelectorAll<HTMLElement>('.lp-projecteur').forEach((carte) => {
        const r = carte.getBoundingClientRect();
        carte.style.setProperty('--x', `${clientX - r.left}px`);
        carte.style.setProperty('--y', `${clientY - r.top}px`);
      });
    });
  }

  return (
    <div className={className} onPointerMove={bouger}>
      {children}
    </div>
  );
}
