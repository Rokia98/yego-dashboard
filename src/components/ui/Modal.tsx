'use client';

import { useEffect, useId } from 'react';
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
  libelleEnvoi = 'Création…',
  onAnnuler,
}: {
  envoi: boolean;
  libelle: string;
  libelleEnvoi?: string;
  onAnnuler: () => void;
}) {
  return (
    <div className="mt-5 flex justify-end gap-2 border-t border-line-soft pt-4">
      <Button variant="ghost" onClick={onAnnuler} disabled={envoi}>
        Annuler
      </Button>
      <Button type="submit" disabled={envoi}>
        {envoi ? libelleEnvoi : libelle}
      </Button>
    </div>
  );
}

/**
 * Fenêtre modale centrée : fond assombri, fermeture par Échap, clic à
 * l'extérieur ou croix ; le défilement de la page est bloqué tant qu'elle est
 * ouverte. `onFermer` absent = fermeture désactivée (ex. envoi en cours).
 */
export default function Modal({
  ouvert,
  titre,
  sousTitre,
  onFermer,
  children,
  largeur = 'max-w-2xl',
}: {
  ouvert: boolean;
  titre: string;
  sousTitre?: string;
  onFermer?: () => void;
  children: React.ReactNode;
  largeur?: string;
}) {
  const idTitre = useId();

  useEffect(() => {
    if (!ouvert) return;
    const debordement = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer?.();
    };
    window.addEventListener('keydown', touche);
    return () => {
      document.body.style.overflow = debordement;
      window.removeEventListener('keydown', touche);
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm" onClick={onFermer} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        className={`relative my-8 w-full ${largeur} rounded-2xl border border-line bg-surface shadow-card`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div>
            <h2 id={idTitre} className="text-sm font-semibold text-ink">
              {titre}
            </h2>
            {sousTitre && <p className="mt-0.5 text-xs text-ink-faint">{sousTitre}</p>}
          </div>
          {onFermer && (
            <button
              type="button"
              onClick={onFermer}
              className="rounded-lg p-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
