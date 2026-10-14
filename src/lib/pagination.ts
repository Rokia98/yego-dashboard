'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Fetcher<T> = (params: { take: number; skip: number }) => Promise<T[]>;

/** Nombre de lignes affichées par page dans toutes les listes. */
export const TAILLE_PAGE = 10;

/** État de la pagination « 1 2 3 … Suivant » affichée en pied de tableau. */
export type EtatPagination = {
  page: number; // 0-indexée
  nbPages: number; // pages connues (au moins 1)
  /** D'autres lignes existent au-delà des pages connues (API sans total). */
  plus: boolean;
  chargement: boolean;
  /** Lignes connues (ou total exact quand l'API le fournit). */
  total: number;
  totalExact: boolean;
  premier: number; // index 1-based de la 1re ligne affichée
  dernier: number;
  allerA: (page: number) => void;
};

function etatPagination(
  page: number,
  nbLignes: number,
  plus: boolean,
  chargement: boolean,
  allerA: (p: number) => void,
  totalExact?: number | null,
): EtatPagination {
  const total = totalExact ?? nbLignes;
  const nbPages = Math.max(1, Math.ceil((totalExact ?? nbLignes) / TAILLE_PAGE));
  return {
    page,
    nbPages,
    plus: totalExact != null ? false : plus,
    chargement,
    total,
    totalExact: totalExact != null || !plus,
    premier: nbLignes === 0 ? 0 : page * TAILLE_PAGE + 1,
    dernier: Math.min((page + 1) * TAILLE_PAGE, nbLignes),
    allerA,
  };
}

/** Pagination côté client d'une liste complète déjà chargée. `cle` change → retour page 1. */
export function usePaginationLocale<T>(items: T[], cle: unknown = '') {
  const [page, setPage] = useState(0);
  const [clePrecedente, setClePrecedente] = useState(cle);
  if (cle !== clePrecedente) {
    setClePrecedente(cle);
    setPage(0);
  }
  const nbPages = Math.max(1, Math.ceil(items.length / TAILLE_PAGE));
  const p = Math.min(page, nbPages - 1);
  return {
    pageItems: items.slice(p * TAILLE_PAGE, (p + 1) * TAILLE_PAGE),
    pagination: etatPagination(p, items.length, false, false, (n) => setPage(Math.max(0, Math.min(n, nbPages - 1)))),
  };
}

export type PagedList<T> = {
  items: T[];
  chargement: boolean; // premier chargement
  chargementSuite: boolean; // "charger plus" en cours
  aSuite: boolean;
  erreur: string | null;
  /** Nombre de lignes lues côté API (≥ items.length quand un filtre local écarte des lignes). */
  lues: number;
  chargerSuite: () => void;
  recharger: () => void;
  fusionner: (predicate: (t: T) => boolean, valeur: T) => void;
  retirer: (predicate: (t: T) => boolean) => void;
  /** Lignes de la page courante (TAILLE_PAGE). */
  pageItems: T[];
  pagination: EtatPagination;
};

export type OptionsPagedList<T> = {
  /**
   * Filtre appliqué côté client (repli quand l'API ne sait pas filtrer). Le
   * hook lit alors des pages source successives jusqu'à réunir `take` lignes
   * retenues ou épuiser la source (borné par `maxPagesParLot`).
   */
  filtreLocal?: (t: T) => boolean;
  /**
   * Avec un filtre local sur une source triée : vrai pour une ligne au-delà de
   * laquelle plus rien ne peut correspondre (ex. réservation plus ancienne que
   * la période, l'API triant par date décroissante) — on cesse alors de lire.
   */
  arretLocal?: (t: T) => boolean;
  /** Taille des pages lues côté API quand un filtre local est actif (≤ 100). */
  tailleSource?: number;
  maxPagesParLot?: number;
  /** Total exact hors pagination quand l'API le fournit (ex. X-Total-Count). */
  total?: number | null;
};

/**
 * Liste paginée : l'API ne renvoie ni total ni enveloppe, on déduit `aSuite`
 * d'une page source pleine. Affichage par pages de TAILLE_PAGE (`pageItems`,
 * `pagination` → composant Pagination) ; aller au-delà des lignes chargées lit
 * la suite côté API. `resetKey` : quand il change, on repart de skip 0 et de
 * la page 1 (filtres modifiés).
 */
export function usePagedList<T>(
  fetcher: Fetcher<T>,
  resetKey: unknown = '',
  take = 10,
  options: OptionsPagedList<T> = {},
): PagedList<T> {
  const totalExact = options.total;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [items, setItems] = useState<T[]>([]);
  const [chargement, setChargement] = useState(true);
  const [chargementSuite, setChargementSuite] = useState(false);
  const [aSuite, setASuite] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lues, setLues] = useState(0);
  const [page, setPage] = useState(0);
  // Page demandée au-delà des lignes chargées : atteinte une fois la suite lue.
  const [pageVoulue, setPageVoulue] = useState<number | null>(null);

  // Position dans la source (API), distincte de items.length dès qu'un filtre
  // local écarte des lignes.
  const skipSource = useRef(0);
  // Numéro de la requête courante : une réponse d'une requête dépassée (filtre
  // changé entre-temps) est ignorée.
  const generation = useRef(0);
  const suiteEnVol = useRef(false);

  const charger = useCallback(
    async (remplacer: boolean) => {
      const gen = remplacer ? ++generation.current : generation.current;
      if (remplacer) {
        skipSource.current = 0;
        setPage(0);
        setPageVoulue(null);
        setChargement(true);
      } else {
        setChargementSuite(true);
      }
      setErreur(null);

      const { filtreLocal, arretLocal, tailleSource = 50, maxPagesParLot = 10 } = optionsRef.current;
      const taille = filtreLocal ? Math.min(100, Math.max(take, tailleSource)) : take;
      const retenus: T[] = [];
      let fin = false;

      try {
        for (let i = 0; i < (filtreLocal ? maxPagesParLot : 1); i++) {
          const page = await fetcherRef.current({ take: taille, skip: skipSource.current });
          if (gen !== generation.current) return;
          skipSource.current += page.length;
          retenus.push(...(filtreLocal ? page.filter(filtreLocal) : page));
          if (page.length < taille || (filtreLocal && arretLocal && page.some(arretLocal))) {
            fin = true;
            break;
          }
          if (retenus.length >= take) break;
        }
        setItems((prev) => (remplacer ? retenus : [...prev, ...retenus]));
        setASuite(!fin);
        setLues(skipSource.current);
      } catch (e) {
        if (gen !== generation.current) return;
        if (remplacer) setItems([]);
        setErreur(e instanceof Error ? e.message : 'Erreur de chargement');
        setASuite(false);
      } finally {
        if (gen === generation.current) {
          setChargement(false);
          setChargementSuite(false);
        }
      }
    },
    [take],
  );

  useEffect(() => {
    charger(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const chargerSuite = useCallback(() => {
    if (suiteEnVol.current || !aSuite) return;
    suiteEnVol.current = true;
    charger(false).finally(() => {
      suiteEnVol.current = false;
    });
  }, [charger, aSuite]);

  // Suite arrivée (ou source épuisée) : on se place sur la page demandée.
  const nbPagesChargees = Math.max(1, Math.ceil(items.length / TAILLE_PAGE));
  if (pageVoulue != null && !chargementSuite && (pageVoulue < nbPagesChargees || !aSuite)) {
    setPage(Math.min(pageVoulue, nbPagesChargees - 1));
    setPageVoulue(null);
  }

  // Saut de plusieurs pages (total connu) : on lit la suite jusqu'à l'atteindre.
  useEffect(() => {
    if (pageVoulue != null && !chargementSuite && aSuite && pageVoulue >= nbPagesChargees) chargerSuite();
  }, [pageVoulue, chargementSuite, aSuite, nbPagesChargees, chargerSuite]);

  const allerA = useCallback(
    (p: number) => {
      if (p < 0) return;
      if (p < nbPagesChargees) {
        setPage(p);
      } else if (aSuite) {
        setPageVoulue(p);
        chargerSuite();
      }
    },
    [nbPagesChargees, aSuite, chargerSuite],
  );

  // Une ligne retirée peut vider la dernière page : on reste dans les bornes.
  const pageCourante = Math.min(page, nbPagesChargees - 1);

  return {
    items,
    chargement,
    chargementSuite,
    aSuite,
    erreur,
    lues,
    chargerSuite,
    recharger: () => charger(true),
    fusionner: (predicate, valeur) => setItems((prev) => prev.map((t) => (predicate(t) ? valeur : t))),
    retirer: (predicate) => setItems((prev) => prev.filter((t) => !predicate(t))),
    pageItems: items.slice(pageCourante * TAILLE_PAGE, (pageCourante + 1) * TAILLE_PAGE),
    pagination: etatPagination(pageCourante, items.length, aSuite, chargementSuite, allerA, totalExact),
  };
}
