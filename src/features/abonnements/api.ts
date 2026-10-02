import { apiFetch } from '@/lib/http';
import type { Abonnement } from './types';

export type CreateAbonnementInput = {
  compagnieId: number;
  plan: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
};

export const abonnementsApi = {
  listAll: ({ take = 100, skip = 0 }: { take?: number; skip?: number } = {}) =>
    apiFetch<Abonnement[]>(`/abonnements?take=${take}&skip=${skip}`),
  listByCompagnie: (compagnieId: number) => apiFetch<Abonnement[]>(`/abonnements/compagnie/${compagnieId}`),
  create: (data: CreateAbonnementInput) =>
    apiFetch<Abonnement>('/abonnements', { method: 'POST', body: JSON.stringify(data) }),
  renew: (id: number, dateFin: string) =>
    apiFetch<Abonnement>(`/abonnements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ dateFin, statut: 'actif' }),
    }),
};
