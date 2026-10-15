'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { Bus, CheckCircle2, MapPin } from 'lucide-react';
import { MotifQr } from './Illustrations';

// Billet du héros : inclinaison 3D qui suit la souris + pastilles en parallaxe.
// Désactivé sur écran tactile et en mouvement réduit (le billet reste flottant).
export default function BilletInteractif() {
  const zone = useRef<HTMLDivElement>(null);
  const carte = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const z = zone.current;
    const c = carte.current;
    if (!z || !c) return;
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const bouger = (e: PointerEvent) => {
      const r = z.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        c.style.transform = `perspective(1200px) rotateX(${(-y * 12).toFixed(2)}deg) rotateY(${(x * 14).toFixed(2)}deg)`;
        c.style.setProperty('--reflet-x', `${((x + 0.5) * 100).toFixed(1)}%`);
        c.style.setProperty('--reflet-y', `${((y + 0.5) * 100).toFixed(1)}%`);
        z.style.setProperty('--px', x.toFixed(3));
        z.style.setProperty('--py', y.toFixed(3));
      });
    };
    const quitter = () => {
      cancelAnimationFrame(raf);
      c.style.transform = '';
      z.style.setProperty('--px', '0');
      z.style.setProperty('--py', '0');
    };
    z.addEventListener('pointermove', bouger);
    z.addEventListener('pointerleave', quitter);
    return () => {
      cancelAnimationFrame(raf);
      z.removeEventListener('pointermove', bouger);
      z.removeEventListener('pointerleave', quitter);
    };
  }, []);

  return (
    <div ref={zone} aria-hidden className="relative mx-auto w-full max-w-md py-10">
      <div className="lp-entree" style={{ '--d': '350ms' } as CSSProperties}>
        <div className="lp-flotte">
          <div
            ref={carte}
            className="lp-billet relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-pop"
          >
            <div className="lp-reflet pointer-events-none absolute inset-0" />
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-chart-2 to-accent" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Billet de car</span>
              <span className="rounded-md bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">Payé</span>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-tight">Abidjan</p>
                <p className="text-xs text-ink-faint">Départ 07:30</p>
              </div>
              <div className="lp-piste relative flex h-6 flex-1 items-center">
                <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
                <span className="lp-car relative flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-subtle">
                  <Bus className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tracking-tight">Bouaké</p>
                <p className="text-xs text-ink-faint">Arrivée 12:15</p>
              </div>
            </div>

            <div className="relative my-6">
              <div className="border-t border-dashed border-line" />
              <span className="absolute -left-9 -top-3 h-6 w-6 rounded-full border border-line bg-paper" />
              <span className="absolute -right-9 -top-3 h-6 w-6 rounded-full border border-line bg-paper" />
            </div>

            <div className="flex items-end justify-between gap-6">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-ink-faint">Passager</dt>
                  <dd className="font-medium">K. Aya</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">Siège</dt>
                  <dd className="font-medium tabular-nums">14</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">Paiement</dt>
                  <dd className="font-medium">Wave</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">Montant</dt>
                  <dd className="font-medium tabular-nums">7 000 F</dd>
                </div>
              </dl>
              <MotifQr taille={7} scan />
            </div>
          </div>
        </div>
      </div>

      {/* Pastilles flottantes, en parallaxe inverse du billet */}
      <div
        className="lp-parallaxe absolute -right-2 top-2 sm:-right-8"
        style={{ '--force': '-26px' } as CSSProperties}
      >
        <div className="lp-entree" style={{ '--d': '900ms' } as CSSProperties}>
          <div className="lp-flotte flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-2.5 shadow-card" style={{ '--d': '-2s' } as CSSProperties}>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <div>
              <p className="text-xs font-semibold">Paiement reçu</p>
              <p className="text-[11px] tabular-nums text-ink-faint">+7 000 F · Wave</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="lp-parallaxe absolute -bottom-3 -left-2 sm:-left-10"
        style={{ '--force': '-34px' } as CSSProperties}
      >
        <div className="lp-entree" style={{ '--d': '1150ms' } as CSSProperties}>
          <div className="lp-flotte flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card" style={{ '--d': '-3.5s' } as CSSProperties}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            <div>
              <p className="text-xs font-semibold">Car en route</p>
              <p className="flex items-center gap-1 text-[11px] text-ink-faint">
                <MapPin className="h-3 w-3" /> Suivi GPS en direct
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
