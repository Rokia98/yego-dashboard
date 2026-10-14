import { apiFetch, apiFetchAvecTotal } from '@/lib/http';
import { toQuery } from '@/lib/filtres';
import type { UserRole } from '@/lib/auth';
import type { Utilisateur } from './types';

export type ListeUtilisateursParams = {
  take?: number;
  skip?: number;
  role?: UserRole | '';
  compagnieId?: number | null;
  actif?: boolean | null;
  /** Nom, téléphone ou email (contient, insensible à la casse). */
  q?: string;
};

export const utilisateursApi = {
  /** Total hors pagination lu dans X-Total-Count (null si l'en-tête n'est pas exposé). */
  list: ({ take = 20, skip = 0, role, compagnieId, actif, q }: ListeUtilisateursParams = {}) =>
    apiFetchAvecTotal<Utilisateur[]>(`/utilisateurs${toQuery({ skip, take, role, compagnieId, actif, q: q?.trim() })}`),
  /** compagnieId requis pour agent / company_admin, ignoré sinon. Coupe les sessions de l'utilisateur. */
  setRole: (id: number, data: { role: UserRole; compagnieId?: number }) =>
    apiFetch<Utilisateur>(`/utilisateurs/${id}/role`, { method: 'PATCH', body: JSON.stringify(data) }),
};
