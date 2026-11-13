'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';

/*
  Actions de ligne d'un tableau :
  - <ActionIcone> : bouton carré à icône, info-bulle au survol (actions fréquentes) ;
  - <MenuActions> : menu « ⋯ » pour les actions secondaires ou sensibles.
  Le menu et l'info-bulle sont rendus dans un portail : ils ne sont jamais
  coupés par le défilement horizontal du tableau.
*/

export type TonAction = 'neutre' | 'accent' | 'info' | 'success' | 'danger' | 'warning';

const TON_ICONE: Record<TonAction, string> = {
  neutre: 'bg-surface-2 text-ink-soft ring-1 ring-inset ring-line hover:bg-ink hover:text-paper hover:ring-ink',
  accent: 'bg-accent-soft text-accent-ink ring-1 ring-inset ring-accent/15 hover:bg-accent hover:text-white hover:ring-accent',
  info: 'bg-chart-1/10 text-chart-1 ring-1 ring-inset ring-chart-1/15 hover:bg-chart-1 hover:text-white hover:ring-chart-1',
  success: 'bg-success-soft text-success ring-1 ring-inset ring-success/15 hover:bg-success hover:text-white hover:ring-success',
  danger: 'bg-danger-soft text-danger ring-1 ring-inset ring-danger/15 hover:bg-danger hover:text-white hover:ring-danger',
  warning: 'bg-warning-soft text-warning ring-1 ring-inset ring-warning/15 hover:bg-warning hover:text-white hover:ring-warning',
};

const TON_ITEM: Record<TonAction, string> = {
  neutre: 'text-ink hover:bg-surface-2',
  info: 'text-chart-1 hover:bg-chart-1/10',
  accent: 'text-accent-ink hover:bg-accent-soft',
  success: 'text-success hover:bg-success-soft',
  danger: 'text-danger hover:bg-danger-soft',
  warning: 'text-warning hover:bg-warning-soft',
};

const CHIP_ITEM: Record<TonAction, string> = {
  neutre: 'bg-surface-2 text-ink-soft ring-1 ring-inset ring-line',
  accent: 'bg-accent-soft text-accent-ink',
  info: 'bg-chart-1/10 text-chart-1',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
};

/** Conteneur des actions d'une ligne, aligné à droite. */
export function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>;
}

/* ---------- Info-bulle ---------- */

function useInfoBulle() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const montrer = useCallback((e: React.SyntheticEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
  }, []);
  const cacher = useCallback(() => setPos(null), []);
  return { pos, montrer, cacher };
}

function InfoBulle({ pos, texte }: { pos: { x: number; y: number } | null; texte: string }) {
  if (!pos || typeof document === 'undefined') return null;
  return createPortal(
    <span
      role="tooltip"
      style={{ left: pos.x, top: pos.y - 6 }}
      className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-full animate-[fade-in_.12s_ease_both] whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-paper shadow-pop"
    >
      {texte}
    </span>,
    document.body,
  );
}

/* ---------- Bouton à icône ---------- */

type PropsIcone = {
  icone: LucideIcon;
  label: string;
  ton?: TonAction;
  disabled?: boolean;
  chargement?: boolean;
} & ({ onClick: () => void; href?: never } | { href: string; onClick?: never });

export function ActionIcone({ icone: Icone, label, ton = 'accent', disabled, chargement, onClick, href }: PropsIcone) {
  const { pos, montrer, cacher } = useInfoBulle();
  const classe = `inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 hover:-translate-y-px hover:shadow-subtle active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-35 ${TON_ICONE[ton]}`;
  const contenu = chargement ? (
    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
  ) : (
    <Icone className="h-4 w-4" strokeWidth={1.85} />
  );
  const evts = { onMouseEnter: montrer, onMouseLeave: cacher, onFocus: montrer, onBlur: cacher };

  return (
    <>
      {href ? (
        <Link href={href} aria-label={label} className={classe} {...evts}>
          {contenu}
        </Link>
      ) : (
        <button
          type="button"
          aria-label={label}
          disabled={disabled || chargement}
          onClick={() => {
            cacher();
            onClick?.();
          }}
          className={classe}
          {...evts}
        >
          {contenu}
        </button>
      )}
      <InfoBulle pos={pos} texte={label} />
    </>
  );
}

/* ---------- Menu « ⋯ » ---------- */

export type ItemMenu =
  | {
      label: string;
      icone?: LucideIcon;
      onClick: () => void;
      ton?: TonAction;
      disabled?: boolean;
      /** Item non rendu (pratique pour les actions conditionnelles). */
      masque?: boolean;
    }
  | 'separateur';

export function MenuActions({ items, label = 'Plus d’actions', disabled }: { items: ItemMenu[]; label?: string; disabled?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; enHaut: boolean } | null>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const idMenu = useId();
  const { pos: posBulle, montrer, cacher } = useInfoBulle();

  // Retire les séparateurs en tête, en fin et en double une fois les items masqués filtrés.
  const visibles = items
    .filter((i) => i === 'separateur' || !i.masque)
    .filter((i, k, arr) => i !== 'separateur' || (k > 0 && k < arr.length - 1 && arr[k - 1] !== 'separateur'));

  const placer = useCallback(() => {
    const b = bouton.current?.getBoundingClientRect();
    if (!b) return;
    const hauteur = menu.current?.offsetHeight ?? 200;
    const enHaut = b.bottom + hauteur + 8 > window.innerHeight && b.top > hauteur + 8;
    setPos({ top: enHaut ? b.top - 4 : b.bottom + 4, left: b.right, enHaut });
  }, []);

  useLayoutEffect(() => {
    if (ouvert) placer();
  }, [ouvert, placer]);

  useEffect(() => {
    if (!ouvert) return;
    const clic = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !bouton.current?.contains(t)) setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOuvert(false);
        bouton.current?.focus();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const els = [...(menu.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])];
        const i = els.indexOf(document.activeElement as HTMLButtonElement);
        const n = e.key === 'ArrowDown' ? (i + 1) % els.length : (i - 1 + els.length) % els.length;
        els[n]?.focus();
      }
    };
    const fermer = () => setOuvert(false);
    document.addEventListener('mousedown', clic);
    document.addEventListener('keydown', touche, true);
    window.addEventListener('resize', fermer);
    window.addEventListener('scroll', fermer, true);
    // Focus sur le premier item pour la navigation clavier.
    requestAnimationFrame(() => menu.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus());
    return () => {
      document.removeEventListener('mousedown', clic);
      document.removeEventListener('keydown', touche, true);
      window.removeEventListener('resize', fermer);
      window.removeEventListener('scroll', fermer, true);
    };
  }, [ouvert]);

  if (visibles.length === 0) return null;

  return (
    <>
      <button
        ref={bouton}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={ouvert ? idMenu : undefined}
        disabled={disabled}
        onClick={() => {
          cacher();
          setOuvert((o) => !o);
        }}
        onMouseEnter={ouvert ? undefined : montrer}
        onMouseLeave={cacher}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 hover:-translate-y-px hover:shadow-subtle active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-35 ${
          ouvert ? 'bg-surface-2 text-ink' : TON_ICONE.neutre
        }`}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>
      {!ouvert && <InfoBulle pos={posBulle} texte={label} />}
      {ouvert &&
        createPortal(
          <div
            ref={menu}
            id={idMenu}
            role="menu"
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              transform: `translate(-100%, ${pos?.enHaut ? '-100%' : '0'})`,
            }}
            className="fixed z-[75] min-w-[13rem] animate-[fade-in_.12s_ease_both] rounded-xl border border-line bg-surface p-1 shadow-pop"
          >
            {visibles.map((item, k) =>
              item === 'separateur' ? (
                <div key={`s${k}`} className="my-1 h-px bg-line-soft" role="separator" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setOuvert(false);
                    item.onClick();
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors focus:outline-none focus-visible:bg-surface-2 disabled:pointer-events-none disabled:opacity-40 ${
                    TON_ITEM[item.ton ?? 'neutre']
                  }`}
                >
                  {item.icone && (
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${CHIP_ITEM[item.ton ?? 'neutre']}`}>
                      <item.icone className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  )}
                  {item.label}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
