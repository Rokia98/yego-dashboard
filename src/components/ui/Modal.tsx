'use client';

import { useEffect, useId, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Plus, X } from 'lucide-react';
import Button from './Button';

/** Bouton d'ouverture d'un formulaire de création, aligné à droite au-dessus d'une liste. */
export function BoutonCreation({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="mb-4 flex justify-end">
      <Button onClick={onClick}>
        <Plus className="h-4 w-4" strokeWidth={2} /> {label}
      </Button>
    </div>
  );
}

/** Pied d'un formulaire en modale : Annuler + bouton d'envoi. */
export function PiedModal({
  envoi,
  libelle,
  libelleEnvoi = 'Enregistrement…',
  onAnnuler,
  variante = 'primary',
}: {
  envoi: boolean;
  libelle: string;
  libelleEnvoi?: string;
  onAnnuler: () => void;
  variante?: 'primary' | 'danger';
}) {
  return (
    <div className="-mx-5 -mb-5 mt-6 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-line-soft bg-surface-2/60 px-5 py-3.5 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onAnnuler} disabled={envoi}>
        Annuler
      </Button>
      <Button type="submit" variant={variante} disabled={envoi}>
        {envoi && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />}
        {envoi ? libelleEnvoi : libelle}
      </Button>
    </div>
  );
}

/** Message d'erreur de formulaire, affiché dans une modale. */
export function ErreurFormulaire({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-4 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

// Pile des modales ouvertes : seule celle du dessus réagit à Échap.
const pile: string[] = [];

/**
 * Fenêtre modale centrée : fond assombri, fermeture par Échap, clic à
 * l'extérieur ou croix ; le défilement de la page est bloqué tant qu'elle est
 * ouverte. `onFermer` absent = fermeture désactivée (ex. envoi en cours).
 */
export default function Modal({
  ouvert,
  titre,
  sousTitre,
  icone: Icone,
  onFermer,
  children,
  largeur = 'max-w-2xl',
  sansEntete = false,
}: {
  ouvert: boolean;
  titre: string;
  sousTitre?: string;
  icone?: LucideIcon;
  onFermer?: () => void;
  children: React.ReactNode;
  largeur?: string;
  sansEntete?: boolean;
}) {
  const idTitre = useId();
  const boite = useRef<HTMLDivElement>(null);
  const fermer = useRef(onFermer);
  fermer.current = onFermer;

  useEffect(() => {
    if (!ouvert) return;
    pile.push(idTitre);
    const debordement = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pile[pile.length - 1] === idTitre) fermer.current?.();
    };
    window.addEventListener('keydown', touche);
    // Focus sur le premier champ (ou la boîte) pour la saisie au clavier.
    const champ = boite.current?.querySelector<HTMLElement>(
      '[autofocus], input:not([type=hidden]):not([disabled]), select, textarea',
    );
    (champ ?? boite.current)?.focus({ preventScroll: true });
    return () => {
      const i = pile.lastIndexOf(idTitre);
      if (i >= 0) pile.splice(i, 1);
      document.body.style.overflow = debordement;
      window.removeEventListener('keydown', touche);
    };
  }, [ouvert, idTitre]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 animate-[fade-in_.15s_ease_both] bg-ink/50 backdrop-blur-sm" onClick={onFermer} aria-hidden />
      <div
        ref={boite}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={sansEntete ? undefined : idTitre}
        className={`relative my-8 w-full ${largeur} animate-[rise_.22s_cubic-bezier(.22,1,.36,1)_both] rounded-2xl border border-line bg-surface shadow-pop outline-none`}
      >
        {!sansEntete && (
          <div className="flex items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
            <div className="flex min-w-0 items-start gap-3">
              {Icone && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                  <Icone className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
              )}
              <div className="min-w-0">
                <h2 id={idTitre} className="text-[15px] font-semibold text-ink">
                  {titre}
                </h2>
                {sousTitre && <p className="mt-0.5 text-xs text-ink-faint">{sousTitre}</p>}
              </div>
            </div>
            {onFermer && (
              <button
                type="button"
                onClick={onFermer}
                className="-mr-1 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
