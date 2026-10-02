import { apiFetch } from '@/lib/http';
import type { Trajet } from './types';

export type CreateTrajetInput = {
  compagnieId: number;
  villeDepartId: number;
  villeArriveeId: number;
  heureDepart: string;
  heureArriveeEstimee?: string;
  prix: number;
  joursRecurrence?: string;
};

export type UpdateTrajetInput = Partial<Omit<CreateTrajetInput, 'compagnieId'>> & { statut?: string };

export const trajetsApi = {
  listByCompagnie: (compagnieId: number, { take = 100, skip = 0 }: { take?: number; skip?: number } = {}) =>
    apiFetch<Trajet[]>(`/trajets/compagnie/${compagnieId}?take=${take}&skip=${skip}`),
  create: (data: CreateTrajetInput) =>
    apiFetch<Trajet>('/trajets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateTrajetInput) =>
    apiFetch<Trajet>(`/trajets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => apiFetch<void>(`/trajets/${id}`, { method: 'DELETE' }),
};
