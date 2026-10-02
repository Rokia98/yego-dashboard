import { apiFetch } from '@/lib/http';
import type { ModeRemboursement, Remboursement } from './types';

type ListeParams = { take?: number; skip?: number };

export const remboursementsApi = {
  list: ({ take = 20, skip = 0 }: ListeParams = {}) =>
    apiFetch<Remboursement[]>(`/remboursements?take=${take}&skip=${skip}`),
  listParStatut: (statut: string, { take = 20, skip = 0 }: ListeParams = {}) =>
    apiFetch<Remboursement[]>(`/remboursements/statut/${statut}?take=${take}&skip=${skip}`),
  /**
   * Sans `mode` : défaut de l'API (transfert Jèko si le paiement a été encaissé
   * via Jèko, sinon constat manuel). `manuel` : remboursement fait hors plateforme.
   * Les versions < 0.28.0 rejettent le body : ne passer `mode` que si JEKO est actif.
   */
  confirmer: (id: number, mode?: ModeRemboursement) =>
    apiFetch<Remboursement>(`/remboursements/${id}/confirmer`, {
      method: 'PATCH',
      ...(mode ? { body: JSON.stringify({ mode }) } : {}),
    }),
};
