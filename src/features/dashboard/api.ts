import { apiFetch } from '@/lib/http';
import type {
  DashboardResume,
  DashboardTrajetClassement,
  DashboardCompagnieClassement,
  DashboardSeriePoint,
} from './types';

export type PeriodeParams = { from?: string; to?: string; compagnieId?: number };
export type ClassementParams = PeriodeParams & { limit?: number };
export type SerieParams = PeriodeParams & { granularite?: 'jour' };

function toQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
}

function isoJour(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const dashboardApi = {
  resume: (params: PeriodeParams = {}) =>
    apiFetch<DashboardResume>(`/dashboard/resume${toQuery(params)}`),
  trajets: (params: ClassementParams = {}) =>
    apiFetch<DashboardTrajetClassement[]>(`/dashboard/trajets${toQuery(params)}`),
  compagnies: (params: ClassementParams = {}) =>
    apiFetch<DashboardCompagnieClassement[]>(`/dashboard/compagnies${toQuery(params)}`),

  /** Série journalière pour les courbes (GET /dashboard/series, borné à 92 j côté API). */
  async series(jours = 30, compagnieId?: number): Promise<DashboardSeriePoint[]> {
    const to = new Date();
    const from = new Date(to.getTime() - (jours - 1) * 86_400_000);
    try {
      return await apiFetch<DashboardSeriePoint[]>(
        `/dashboard/series${toQuery({
          from: isoJour(from),
          to: isoJour(to),
          granularite: 'jour',
          compagnieId,
        })}`,
      );
    } catch {
      return [];
    }
  },
};
