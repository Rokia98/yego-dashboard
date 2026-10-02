import { apiFetch } from '@/lib/http';
import type { Paiement, MoyenPaiementGuichet } from './types';

export const paiementsApi = {
  getPourReservation: (reservationId: number) =>
    apiFetch<Paiement>(`/paiements/reservation/${reservationId}`),
  encaisserGuichet: (reservationId: number, moyenPaiement: MoyenPaiementGuichet) =>
    apiFetch<Paiement>('/paiements/guichet', {
      method: 'POST',
      body: JSON.stringify({ reservationId, moyenPaiement }),
    }),
};
