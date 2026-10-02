import { apiFetch } from '@/lib/http';
import { toQuery } from '@/lib/filtres';
import type { Depart, SiegesDepart } from './types';
import { paramsApiDeparts, type FiltresDeparts } from './filtres';

export type CreateDepartInput = {
  trajetId: number;
  dateDepart: string;
  placesTotales: number;
  vehiculeId?: number;
  chauffeurId?: number;
};

export type ListeParams = { take?: number; skip?: number; filtres?: FiltresDeparts };

// L'API plafonne `take` à 100.
const PAGE_MAX = 100;

export const departsApi = {
  list: ({ take = 20, skip = 0 }: ListeParams = {}) =>
    apiFetch<Depart[]>(`/departs${toQuery({ take, skip })}`),
  listByCompagnie: (compagnieId: number, { take = 100, skip = 0, filtres }: ListeParams = {}) =>
    apiFetch<Depart[]>(
      `/departs${toQuery({ compagnieId, take, skip, ...(filtres ? paramsApiDeparts(filtres) : {}) })}`,
    ),
  /** Tous les départs de la compagnie (pagine jusqu'à épuisement, borné à `maxPages`). */
  async tousParCompagnie(compagnieId: number, filtres?: FiltresDeparts, maxPages = 10): Promise<Depart[]> {
    const out: Depart[] = [];
    for (let p = 0; p < maxPages; p++) {
      const lot = await departsApi.listByCompagnie(compagnieId, { take: PAGE_MAX, skip: p * PAGE_MAX, filtres });
      out.push(...lot);
      if (lot.length < PAGE_MAX) break;
    }
    return out;
  },
  get: (id: number) => apiFetch<Depart>(`/departs/${id}`),
  sieges: (id: number) => apiFetch<SiegesDepart>(`/departs/${id}/sieges`),
  create: (data: CreateDepartInput) =>
    apiFetch<Depart>('/departs', { method: 'POST', body: JSON.stringify(data) }),
  updateStatut: (id: number, statut: string) =>
    apiFetch<Depart>(`/departs/${id}`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
};
