import { apiFetch } from '@/lib/http';
import type { Vehicule, Chauffeur } from './types';

export type VehiculeInput = {
  immatriculation: string;
  typeVehicule?: string;
  capacite: number;
  statut?: 'actif' | 'maintenance' | 'hors_service';
  compagnieId?: number;
};

export type ChauffeurInput = {
  nom: string;
  telephone?: string;
  numeroPermis?: string;
  compagnieId?: number;
};

type ListeParams = { take?: number; skip?: number };

export const vehiculesApi = {
  list: ({ take = 100, skip = 0 }: ListeParams = {}) =>
    apiFetch<Vehicule[]>(`/vehicules?take=${take}&skip=${skip}`),
  create: (data: VehiculeInput) =>
    apiFetch<Vehicule>('/vehicules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<VehiculeInput>) =>
    apiFetch<Vehicule>(`/vehicules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/vehicules/${id}`, { method: 'DELETE' }),
};

export const chauffeursApi = {
  list: ({ take = 100, skip = 0 }: ListeParams = {}) =>
    apiFetch<Chauffeur[]>(`/chauffeurs?take=${take}&skip=${skip}`),
  create: (data: ChauffeurInput) =>
    apiFetch<Chauffeur>('/chauffeurs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<ChauffeurInput>) =>
    apiFetch<Chauffeur>(`/chauffeurs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/chauffeurs/${id}`, { method: 'DELETE' }),
};
