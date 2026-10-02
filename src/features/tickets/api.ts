import { apiFetch } from '@/lib/http';
import { toQuery } from '@/lib/filtres';
import type { Ticket, BilletScanne } from './types';

export const ticketsApi = {
  listPourReservation: (reservationId: number) =>
    apiFetch<Ticket[]>(`/tickets/reservation/${reservationId}`),
  genererPourReservation: (reservationId: number, siege?: string) =>
    apiFetch<Ticket>(`/tickets/reservation/${reservationId}`, {
      method: 'POST',
      body: JSON.stringify({ siege }),
    }),
  /** Historique des scans. `resultat`/`du`/`au` : API 0.26.0+ (paramètres omis s'ils sont vides). */
  validations: ({
    take = 20,
    skip = 0,
    resultat,
    du,
    au,
  }: { take?: number; skip?: number; resultat?: 'valide' | 'refuse'; du?: string; au?: string } = {}) =>
    apiFetch<BilletScanne[]>(`/tickets/validations${toQuery({ take, skip, resultat, du, au })}`),
};
