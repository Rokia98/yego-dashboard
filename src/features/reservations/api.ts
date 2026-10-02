import { apiFetch } from '@/lib/http';
import { toQuery } from '@/lib/filtres';
import type { Reservation, AnnulationResultat } from './types';
import { correspondReservation, paramsApiReservations, type FiltresReservations } from './filtres';

export type CreateReservationGuichetInput = {
  departId: number;
  nombrePlaces: number;
  passager: { nom: string; telephone?: string };
  sieges?: string[];
  paiementEspece?: boolean;
};

export type ListeParams = { take?: number; skip?: number; filtres?: FiltresReservations };

export const reservationsApi = {
  list: ({ take = 20, skip = 0, filtres }: ListeParams = {}) =>
    apiFetch<Reservation[]>(
      `/reservations${toQuery({ take, skip, ...(filtres ? paramsApiReservations(filtres) : {}) })}`,
    ),

  /**
   * Réservations correspondant aux filtres (pagine jusqu'à `maxi` lignes lues)
   * — pour l'export. Filtre aussi côté client (repli si l'API ignore les
   * paramètres). `tronque` : la limite a été atteinte, il en reste côté API.
   */
  async listAll(filtres?: FiltresReservations, maxi = 2000): Promise<{ items: Reservation[]; tronque: boolean }> {
    const page = 100;
    const items: Reservation[] = [];
    for (let skip = 0; skip < maxi; skip += page) {
      const lot = await reservationsApi.list({ take: page, skip, filtres });
      items.push(...(filtres ? lot.filter((r) => correspondReservation(r, filtres)) : lot));
      if (lot.length < page) return { items, tronque: false };
      // Tri par date de réservation décroissante : au-delà du début de période, fin.
      if (filtres?.resDu && lot.some((r) => (r.dateReservation ?? '').slice(0, 10) < filtres.resDu)) {
        return { items, tronque: false };
      }
    }
    return { items, tronque: true };
  },
  get: (id: number) => apiFetch<Reservation>(`/reservations/${id}`),
  annuler: (id: number) =>
    apiFetch<AnnulationResultat>(`/reservations/${id}/annuler`, { method: 'PATCH' }),
  creerGuichet: (data: CreateReservationGuichetInput) =>
    apiFetch<Reservation>('/reservations/guichet', { method: 'POST', body: JSON.stringify(data) }),
};
