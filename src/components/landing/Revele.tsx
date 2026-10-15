'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type Variante = 'haut' | 'gauche' | 'droite' | 'zoom';

// Un seul IntersectionObserver pour toute la page : chaque élément reçoit
// `est-visible` à sa première apparition, puis n'est plus observé.
let observateur: IntersectionObserver | null = null;

function observer(el: Element) {
  if (!observateur) {
    observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue;
          entree.target.classList.add('est-visible');
          observateur?.unobserve(entree.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    );
  }
  observateur.observe(el);
  return () => observateur?.unobserve(el);
}

export default function Revele({
  variante = 'haut',
  delai = 0,
  className = '',
  children,
}: {
  variante?: Variante;
  /** Retard d'apparition en ms (effet cascade). */
  delai?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) return observer(ref.current);
  }, []);

  return (
    <div
      ref={ref}
      data-variante={variante}
      className={`lp-revele ${className}`}
      style={{ '--d': `${delai}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
