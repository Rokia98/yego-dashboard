'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePaginationLocale, type EtatPagination } from '@/lib/pagination';

/**
 * Liste complète déjà chargée, affichée par pages de 10 : `children` reçoit
 * les lignes de la page courante (rendre le tableau), la pagination suit en
 * pied. `cle` (ex. filtres) change → retour à la page 1.
 */
export function ListePaginee<T>({
  items,
  cle,
  children,
}: {
  items: T[];
  cle?: unknown;
  children: (pageItems: T[]) => React.ReactNode;
}) {
  const { pageItems, pagination } = usePaginationLocale(items, cle);
  return (
    <>
      {children(pageItems)}
      <Pagination pagination={pagination} />
    </>
  );
}

/** Numéros affichés : première, dernière, et voisines de la page courante ; null = « … ». */
function numeros(page: number, nbPages: number): (number | null)[] {
  const garder = new Set([0, nbPages - 1, page - 1, page, page + 1]);
  const out: (number | null)[] = [];
  for (let i = 0; i < nbPages; i++) {
    if (garder.has(i)) out.push(i);
    else if (out[out.length - 1] !== null) out.push(null);
  }
  return out;
}

const bouton =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-40';

/** Pied de tableau : « 11–20 sur 45 » + Précédent / numéros de page / Suivant (pages de 10). */
export default function Pagination({ pagination: p }: { pagination: EtatPagination }) {
  if (p.total === 0) return null;
  const derniere = !p.plus && p.page >= p.nbPages - 1;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line-soft px-5 py-3 sm:flex-row">
      <p className="text-xs text-ink-faint">
        {p.premier}–{p.dernier} sur {p.total.toLocaleString('fr-FR')}
        {p.plus ? '+' : ''}
      </p>
      {(p.nbPages > 1 || p.plus) && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            onClick={() => p.allerA(p.page - 1)}
            disabled={p.page === 0 || p.chargement}
            className={`${bouton} text-ink-soft hover:bg-surface-2 hover:text-ink`}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Précédent</span>
          </button>
          {numeros(p.page, p.nbPages).map((n, i) =>
            n === null ? (
              <span key={`e${i}`} className="px-1 text-xs text-ink-faint">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => p.allerA(n)}
                disabled={p.chargement}
                aria-current={n === p.page ? 'page' : undefined}
                className={`${bouton} ${
                  n === p.page ? 'bg-accent text-white' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {n + 1}
              </button>
            ),
          )}
          {p.plus && <span className="px-1 text-xs text-ink-faint">…</span>}
          <button
            type="button"
            onClick={() => p.allerA(p.page + 1)}
            disabled={derniere || p.chargement}
            className={`${bouton} text-ink-soft hover:bg-surface-2 hover:text-ink`}
            aria-label="Page suivante"
          >
            <span className="hidden sm:inline">{p.chargement ? 'Chargement…' : 'Suivant'}</span>
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </nav>
      )}
    </div>
  );
}
