'use client';

import { useEffect, useRef } from 'react';

type Etape = { titre: string; texte: string };

// Frise verticale qui se remplit au fil du défilement ; chaque étape s'allume
// quand la ligne l'atteint. Mises à jour directement dans le DOM (rAF).
export default function Parcours({ etapes }: { etapes: Etape[] }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const ligne = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    let raf = 0;
    const maj = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / r.height));
      if (ligne.current) ligne.current.style.transform = `scaleY(${p})`;
      el.querySelectorAll<HTMLElement>('[data-etape]').forEach((etape) => {
        const seuil = (etape.offsetTop + 20) / r.height;
        etape.toggleAttribute('data-actif', p >= seuil);
      });
    };
    const surDefilement = () => {
      if (!raf) raf = requestAnimationFrame(maj);
    };
    raf = requestAnimationFrame(maj);
    window.addEventListener('scroll', surDefilement, { passive: true });
    window.addEventListener('resize', surDefilement);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', surDefilement);
      window.removeEventListener('resize', surDefilement);
    };
  }, []);

  return (
    <div ref={conteneur} className="relative">
      <div aria-hidden className="absolute bottom-6 left-[19px] top-6 w-[2px] rounded-full bg-line">
        <div ref={ligne} className="lp-frise-remplie h-full w-full rounded-full bg-accent" />
      </div>
      <ol className="space-y-6 pl-16">
        {etapes.map((etape, i) => (
          <li key={etape.titre} data-etape className="relative">
            <span className="lp-etape-point absolute -left-16 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold tabular-nums text-ink-soft">
              {i + 1}
            </span>
            <div className="lp-etape-carte rounded-2xl border border-line bg-surface p-6 shadow-subtle">
              <h3 className="text-lg font-semibold tracking-tight">{etape.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{etape.texte}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
