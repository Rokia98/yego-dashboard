import { apiFetch } from '@/lib/http';
import type { SuiviDepart, SuiviHistorique, DemarrageDepart } from './types';
import type { Depart } from '@/features/departs';

export const suiviApi = {
  get: (departId: number) => apiFetch<SuiviDepart>(`/departs/${departId}/suivi`),
  historique: (departId: number, limite = 500) =>
    apiFetch<SuiviHistorique>(`/departs/${departId}/suivi/historique?limite=${limite}`),
  demarrer: (departId: number) =>
    apiFetch<{ depart: Depart } & DemarrageDepart>(`/departs/${departId}/demarrer`, {
      method: 'POST',
    }),
  signalerRetard: (departId: number, minutesRetard: number, motif?: string) =>
    apiFetch<Depart>(`/departs/${departId}/retard`, {
      method: 'POST',
      body: JSON.stringify({ minutesRetard, motif }),
    }),
};
