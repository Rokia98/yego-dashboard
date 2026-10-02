import { apiFetch } from '@/lib/http';
import type { Ville } from './types';

export const villesApi = {
  list: () => apiFetch<Ville[]>('/villes'),
};

// Résout un nom de ville depuis un cache (id -> nom), utilisé quand l'API
// renvoie un trajet "brut" sans les objets villeDepart/villeArrivee.
export function indexerVilles(villes: Ville[]): Map<number, string> {
  return new Map(villes.map((v) => [v.id, v.nom]));
}
