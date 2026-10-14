import { apiFetch } from '@/lib/http';
import { toQuery } from '@/lib/filtres';
import type {
  CategorieSupport,
  CompteursSupport,
  DemandeSupport,
  DemandeSupportDetail,
  MessageSupport,
  PrioriteSupport,
  StatutSupport,
} from './types';

export type FiltresSupport = {
  q: string;
  statut: '' | StatutSupport;
  categorie: '' | CategorieSupport;
  origine: '' | 'voyageur' | 'compagnie'; // admin ; gestionnaire avec SUPPORT_COMPAGNIE
  compagnieId: string; // admin uniquement (ignoré sinon)
};

export const FILTRES_SUPPORT_DEFAUT: FiltresSupport = {
  q: '',
  statut: '',
  categorie: '',
  origine: '',
  compagnieId: '',
};

export type NouvelleDemandeInput = {
  categorie: CategorieSupport;
  sujet: string;
  message: string;
  reservationId?: number;
};

export const supportApi = {
  list: ({ take = 20, skip = 0, filtres }: { take?: number; skip?: number; filtres?: FiltresSupport } = {}) =>
    apiFetch<DemandeSupport[]>(
      `/support/demandes${toQuery({
        take,
        skip,
        q: filtres?.q.trim() || undefined,
        statut: filtres?.statut || undefined,
        categorie: filtres?.categorie || undefined,
        origine: filtres?.origine || undefined,
        compagnieId: filtres?.compagnieId || undefined,
      })}`,
    ),
  get: (id: number) => apiFetch<DemandeSupportDetail>(`/support/demandes/${id}`),
  creer: (data: NouvelleDemandeInput) =>
    apiFetch<DemandeSupportDetail>('/support/demandes', { method: 'POST', body: JSON.stringify(data) }),
  repondre: (id: number, contenu: string, interne = false) =>
    apiFetch<MessageSupport>(`/support/demandes/${id}/messages`, {
      method: 'POST',
      // `interne` n'est envoyé que s'il est vrai (réservé à l'admin côté API).
      body: JSON.stringify(interne ? { contenu, interne } : { contenu }),
    }),
  modifier: (id: number, data: { statut?: StatutSupport; priorite?: PrioriteSupport }) =>
    apiFetch<DemandeSupport>(`/support/demandes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  compteurs: () => apiFetch<CompteursSupport>('/support/compteurs'),
};
