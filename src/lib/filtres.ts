'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Valeurs = Record<string, string>;

/** Construit une query string en ignorant les valeurs vides / undefined. */
export function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const e = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return e.length ? '?' + e.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&') : '';
}

function lireUrl<T extends Valeurs>(defauts: T): T {
  if (typeof window === 'undefined') return defauts;
  const sp = new URLSearchParams(window.location.search);
  const out = { ...defauts };
  for (const k of Object.keys(defauts)) {
    const v = sp.get(k);
    if (v !== null) (out as Valeurs)[k] = v;
  }
  return out;
}

function ecrireUrl<T extends Valeurs>(valeurs: T, defauts: T) {
  const sp = new URLSearchParams(window.location.search);
  for (const k of Object.keys(defauts)) {
    // Une valeur vide différente du défaut (ex. « toutes les dates » alors que
    // le défaut est aujourd'hui) est conservée dans l'URL sous la forme `k=`.
    if (valeurs[k] !== defauts[k]) sp.set(k, valeurs[k]);
    else sp.delete(k);
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

/**
 * État de filtres d'une page, synchronisé avec l'URL (rechargement / partage
 * du lien conservent les filtres). `cleRecherche` désigne un champ texte dont
 * la valeur appliquée est « debouncée » (on ne relance pas l'API à chaque touche).
 */
export function useFiltres<T extends Valeurs>(defauts: T, cleRecherche?: keyof T & string) {
  const [valeurs, setValeurs] = useState<T>(() => lireUrl(defauts));

  // Valeurs réellement appliquées : immédiates, sauf la saisie de recherche
  // (debouncée à 350 ms).
  const [appliques, setAppliques] = useState<T>(valeurs);
  useEffect(() => {
    const saisie = cleRecherche != null && valeurs[cleRecherche] !== appliques[cleRecherche];
    if (!saisie) {
      setAppliques(valeurs);
      return;
    }
    const t = setTimeout(() => setAppliques(valeurs), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeurs, cleRecherche]);

  useEffect(() => {
    ecrireUrl(appliques, defauts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliques]);

  const set = useCallback(<K extends keyof T>(cle: K, valeur: T[K]) => {
    setValeurs((v) => ({ ...v, [cle]: valeur }));
  }, []);

  const reinitialiser = useCallback(() => {
    setValeurs(defauts);
    setAppliques(defauts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nbActifs = useMemo(
    () => Object.keys(defauts).filter((k) => appliques[k] !== defauts[k]).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appliques],
  );

  /** Clé stable des filtres appliqués — à passer comme resetKey à usePagedList. */
  const cle = useMemo(() => JSON.stringify(appliques), [appliques]);

  return { valeurs, appliques, set, reinitialiser, nbActifs, cle };
}

/** Normalise pour une recherche insensible à la casse et aux accents. */
export function normaliser(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Vrai si `iso` (date ou date-heure) tombe dans [du, au] (YYYY-MM-DD, bornes incluses). */
export function dansPeriode(iso: string | null | undefined, du?: string, au?: string): boolean {
  if (!du && !au) return true;
  if (!iso) return false;
  const jour = iso.slice(0, 10);
  if (du && jour < du) return false;
  if (au && jour > au) return false;
  return true;
}

/** Date locale du jour au format YYYY-MM-DD (décalée de `jours`). */
export function jourIso(jours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
