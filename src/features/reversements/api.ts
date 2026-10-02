import { apiFetch } from '@/lib/http';
import { toQuery } from '@/lib/filtres';
import type {
  ApercuReversement,
  CoordonneesReversement,
  MoyenReversement,
  Reversement,
  ReversementDetail,
} from './types';

type ListeParams = { take?: number; skip?: number; compagnieId?: number | null; statut?: string };

export const reversementsApi = {
  /** company_admin : toujours sa compagnie (compagnieId ignoré). take ≤ 100. */
  list: ({ take = 20, skip = 0, compagnieId, statut }: ListeParams = {}) =>
    apiFetch<Reversement[]>(`/reversements${toQuery({ compagnieId, statut, skip, take })}`),
  get: (id: number) => apiFetch<ReversementDetail>(`/reversements/${id}`),
  /** admin : compagnieId requis ; company_admin : facultatif (sa compagnie). */
  apercu: (compagnieId?: number | null) =>
    apiFetch<ApercuReversement>(`/reversements/apercu${toQuery({ compagnieId })}`),
  /** Solde du magasin Jèko Yègo (admin) ; null = illisible. */
  solde: () => apiFetch<{ soldeFcfa: number | null }>('/reversements/solde'),
  /** Lance le transfert du net éligible (admin). */
  creer: (compagnieId: number) =>
    apiFetch<Reversement>('/reversements', { method: 'POST', body: JSON.stringify({ compagnieId }) }),
  getCoordonnees: (compagnieId: number) =>
    apiFetch<CoordonneesReversement>(`/reversements/coordonnees/${compagnieId}`),
  /** Téléphone normalisé en +225… par l'API (400 si ce n'est pas un mobile CI). */
  setCoordonnees: (compagnieId: number, data: { moyen: MoyenReversement; telephone: string }) =>
    apiFetch<CoordonneesReversement>(`/reversements/coordonnees/${compagnieId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
