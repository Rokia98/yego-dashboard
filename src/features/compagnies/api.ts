import { apiFetch } from '@/lib/http';
import type { Compagnie, CompagnieStatut } from './types';

export type CreateCompagnieInput = {
  nom: string;
  telephone?: string;
  email?: string;
  logoUrl?: string; // URL http(s) ou data-URI image (API 0.22.0+)
};

export type UpdateCompagnieInput = Partial<CreateCompagnieInput> & { logoUrl?: string };

export type CompteAdminInput = { nom: string; telephone: string; email?: string };

export type CompteAdminCree = {
  id?: number;
  nom?: string;
  telephone: string;
  motDePasseTemporaire: string;
};

export const compagniesApi = {
  list: ({ take = 100, skip = 0 }: { take?: number; skip?: number } = {}) =>
    apiFetch<Compagnie[]>(`/compagnies?take=${take}&skip=${skip}`),
  get: (id: number) => apiFetch<Compagnie>(`/compagnies/${id}`),
  create: (data: CreateCompagnieInput) =>
    apiFetch<Compagnie>('/compagnies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateCompagnieInput) =>
    apiFetch<Compagnie>(`/compagnies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStatut: (id: number, statut: CompagnieStatut) =>
    apiFetch<Compagnie>(`/compagnies/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
  /** Crée (ou régénère) le compte gestionnaire — disponible à partir de l'API 0.22.0. */
  creerCompteAdmin: (id: number, data: CompteAdminInput) =>
    apiFetch<CompteAdminCree>(`/compagnies/${id}/compte-admin`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
