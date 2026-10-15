import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowUpRight, MapPin, MessageCircle, Phone } from 'lucide-react';
import { PATH_CONNEXION } from '@/lib/session';
import BasculeTheme from './BasculeTheme';
import Logo from './Logo';
import Revele from './Revele';
import { LIEN_APPEL, LIEN_PLAY_STORE, LIEN_WHATSAPP, TELEPHONE_AFFICHE } from './contact';
import { RangeeLogos } from './Paiements';

const COLONNES: { titre: string; liens: { label: string; href: string; externe?: boolean }[] }[] = [
  {
    titre: 'Produit',
    liens: [
      { label: 'Fonctionnalités', href: '#fonctionnalites' },
      { label: 'Comment ça marche', href: '#fonctionnement' },
      { label: 'Moyens de paiement', href: '#paiements' },
      { label: 'Questions fréquentes', href: '#faq' },
    ],
  },
  {
    titre: 'Espace pro',
    liens: [
      { label: 'Se connecter', href: PATH_CONNEXION },
      { label: 'Devenir partenaire', href: '#contact' },
      { label: 'Parler à l’équipe', href: LIEN_WHATSAPP, externe: true },
    ],
  },
  {
    titre: 'Voyageurs',
    liens: [
      { label: 'Télécharger l’app', href: LIEN_PLAY_STORE, externe: true },
      { label: 'Côté voyageurs', href: '#voyageurs' },
      { label: 'L’application', href: '#application' },
    ],
  },
];

export default function PiedDePage() {
  return (
    <footer className="relative overflow-hidden border-t border-line-soft bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgb(var(--accent)/0.10),transparent_65%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.3fr]">
          {/* Marque */}
          <Revele className="col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">
              La billetterie digitale des compagnies de car : vente au guichet et en ligne, paiement Mobile Money,
              suivi GPS des départs.
            </p>
            <a
              href={LIEN_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-brillant group mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white shadow-subtle transition-transform duration-300 hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" />
              Écrire sur WhatsApp
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </Revele>

          {/* Liens */}
          {COLONNES.map((col, i) => (
            <Revele key={col.titre} delai={100 + i * 80}>
              <nav aria-label={col.titre}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">{col.titre}</p>
                <ul className="mt-5 space-y-3">
                  {col.liens.map((l) => (
                    <li key={l.label}>
                      <LienPied {...l} />
                    </li>
                  ))}
                </ul>
              </nav>
            </Revele>
          ))}

          {/* Contact */}
          <Revele delai={260} className="col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">Contact</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={LIEN_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-ink-soft transition-colors hover:text-ink"
                >
                  <IconeContact>
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  </IconeContact>
                  <span>
                    <span className="block text-xs text-ink-faint">WhatsApp</span>
                    <span className="font-medium tabular-nums text-ink">{TELEPHONE_AFFICHE}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={LIEN_APPEL} className="group flex items-center gap-3 text-ink-soft transition-colors hover:text-ink">
                  <IconeContact>
                    <Phone className="h-4 w-4 text-accent" />
                  </IconeContact>
                  <span>
                    <span className="block text-xs text-ink-faint">Téléphone</span>
                    <span className="font-medium tabular-nums text-ink">+225 {TELEPHONE_AFFICHE}</span>
                  </span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-ink-soft">
                <IconeContact>
                  <MapPin className="h-4 w-4 text-accent" />
                </IconeContact>
                <span>
                  <span className="block text-xs text-ink-faint">Zone</span>
                  <span className="font-medium text-ink">Côte d’Ivoire</span>
                </span>
              </li>
            </ul>
          </Revele>
        </div>

        {/* Grand logotype, lettres qui montent à l'apparition */}
        <Revele className="mt-16 select-none lg:mt-20">
          <p
            aria-hidden
            className="flex justify-center overflow-hidden text-[26vw] font-bold leading-none tracking-tighter lg:text-[15rem]"
          >
            {'Yègo'.split('').map((lettre, i) => (
              <span
                key={i}
                className="lp-lettre lp-degrade inline-block pb-[0.14em]"
                style={{ '--d': `${i * 90}ms` } as CSSProperties}
              >
                {lettre}
              </span>
            ))}
          </p>
        </Revele>
      </div>

      {/* Barre du bas */}
      <div className="relative border-t border-line-soft">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-ink-faint sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Yègo. Tous droits réservés.</p>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs md:inline">Paiements acceptés</span>
            <div className="hidden md:block">
              <RangeeLogos taille={26} />
            </div>
            <BasculeTheme />
            <a
              href="#haut"
              aria-label="Revenir en haut de la page"
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white"
            >
              <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function IconeContact({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-paper transition-transform duration-300 group-hover:scale-110">
      {children}
    </span>
  );
}

function LienPied({ label, href, externe }: { label: string; href: string; externe?: boolean }) {
  const classe = 'group inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink';
  const fleche = (
    <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
  );
  if (externe) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classe}>
        <span className="lp-lien">{label}</span>
        {fleche}
      </a>
    );
  }
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={classe}>
        <span className="lp-lien">{label}</span>
        {fleche}
      </Link>
    );
  }
  return (
    <a href={href} className={classe}>
      <span className="lp-lien">{label}</span>
      {fleche}
    </a>
  );
}
