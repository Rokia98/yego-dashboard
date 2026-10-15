import type { CSSProperties } from 'react';
import Image from 'next/image';
import { Apple } from 'lucide-react';
import { EpingleYego } from './Logo';
import { MOBILE_MONEY, type MoyenAffiche } from './moyensPaiement';
import { LIEN_PLAY_STORE } from './contact';

/* ---------- Logo d'un moyen de paiement ---------- */

export function LogoPaiement({ moyen, taille = 40, className = '' }: { moyen: MoyenAffiche; taille?: number; className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/5 ${className}`}
      style={{ width: taille, height: taille }}
    >
      {moyen.logo ? (
        <Image src={moyen.logo} alt={moyen.nom} width={taille} height={taille} className="h-full w-full object-contain" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-bold text-white"
          style={{ background: moyen.couleur, fontSize: taille * 0.42 }}
          aria-label={moyen.nom}
        >
          {moyen.nom[0]}
        </span>
      )}
    </span>
  );
}

/** Rangée compacte de logos (héros, pied de page). */
export function RangeeLogos({ taille = 32, entree = false }: { taille?: number; entree?: boolean }) {
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {MOBILE_MONEY.map((m, i) => (
        <li
          key={m.nom}
          title={m.nom}
          className={entree ? 'lp-entree' : undefined}
          style={entree ? ({ '--d': `${1000 + i * 80}ms` } as CSSProperties) : undefined}
        >
          <LogoPaiement moyen={m} taille={taille} className="shadow-subtle transition-transform duration-300 hover:-translate-y-1 hover:scale-110" />
        </li>
      ))}
    </ul>
  );
}

/* ---------- Orbite : les logos tournent autour de l'épingle Yègo ---------- */

export function OrbitePaiements() {
  const n = MOBILE_MONEY.length;
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[420px] [container-type:inline-size]">
      {/* Anneaux */}
      <div className="absolute inset-0 rounded-full border border-line" />
      <div className="absolute inset-[18%] rounded-full border border-dashed border-line" />
      <div className="absolute inset-[34%] rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.22),transparent_70%)]" />

      {/* Centre */}
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] bg-[#2C3E50] shadow-pop">
        <span className="lp-onde absolute inset-0 rounded-[2rem] bg-accent/30" />
        <EpingleYego className="relative h-14 w-14" />
      </div>

      {/* Logos en orbite (anneau extérieur) */}
      <div className="lp-orbite absolute inset-0">
        {MOBILE_MONEY.map((m, i) => {
          const angle = (360 / n) * i - 90;
          return (
            <div
              key={m.nom}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `rotate(${angle}deg) translateX(44cqw) rotate(${-angle}deg) translate(-50%, -50%)` }}
            >
              <div className="lp-contre-orbite">
                <div className="flex flex-col items-center gap-1.5">
                  <LogoPaiement moyen={m} taille={60} className="shadow-card ring-4 ring-paper" />
                  <span className="whitespace-nowrap rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-ink-soft shadow-subtle">
                    {m.nom}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Petits points sur l'anneau intérieur, sens inverse */}
      <div className="lp-orbite-inverse absolute inset-[18%]">
        {[0, 120, 240].map((a) => (
          <span
            key={a}
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_rgb(var(--accent)/0.8)]"
            style={{ transform: `rotate(${a}deg) translateX(32cqw) translate(-50%, -50%)` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Boutons des stores ---------- */

function LogoPlay({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 26" className={className} aria-hidden>
      <path d="M1 1.2 13.4 13 1 24.8c-.4-.3-.6-.8-.6-1.4V2.6c0-.6.2-1.1.6-1.4Z" fill="#00D7FE" />
      <path d="m17.6 8.8-4.2 4.2L1 1.2c.4-.4 1.1-.5 1.8-.1l14.8 7.7Z" fill="#00F076" />
      <path d="M17.6 17.2 2.8 24.9c-.7.4-1.4.3-1.8-.1L13.4 13l4.2 4.2Z" fill="#F83B54" />
      <path d="m22.4 11.3-4.8-2.5-4.2 4.2 4.2 4.2 4.8-2.5c1.3-.7 1.3-2.7 0-3.4Z" fill="#FFC700" />
    </svg>
  );
}

export function BoutonsStores({ inverse = false }: { inverse?: boolean }) {
  const base =
    'flex h-14 items-center gap-3 rounded-2xl px-5 text-left transition-all duration-300';
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={LIEN_PLAY_STORE}
        target="_blank"
        rel="noopener noreferrer"
        className={`lp-brillant group ${base} hover:-translate-y-1 hover:shadow-pop ${
          inverse ? 'bg-white text-[#12141a]' : 'bg-ink text-paper'
        }`}
      >
        <LogoPlay className="h-6 w-6 transition-transform duration-500 group-hover:scale-110" />
        <span>
          <span className="block text-[10px] font-medium uppercase tracking-wider opacity-70">Disponible sur</span>
          <span className="block text-base font-semibold leading-tight">Google Play</span>
        </span>
      </a>
      <span
        aria-disabled
        className={`${base} cursor-default border ${
          inverse ? 'border-white/25 text-white/70' : 'border-line text-ink-faint'
        }`}
      >
        <Apple className="h-6 w-6" />
        <span>
          <span className="block text-[10px] font-medium uppercase tracking-wider opacity-80">Bientôt sur</span>
          <span className="block text-base font-semibold leading-tight">App Store</span>
        </span>
      </span>
    </div>
  );
}
