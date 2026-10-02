'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Fetcher<T> = (params: { take: number; skip: number }) => Promise<T[]>;

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
};

/**
 * Liste paginée par "charger plus" : l'API ne renvoie ni total ni enveloppe,
 * on déduit `aSuite` d'une page source pleine. `resetKey` : quand il change,
 * on repart de skip 0 (filtres modifiés).
 */
export function usePagedList<T>(
  fetcher: Fetcher<T>,
  resetKey: unknown = '',
  take = 10,
  options: OptionsPagedList<T> = {},
): PagedList<T> {
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
  };
}
