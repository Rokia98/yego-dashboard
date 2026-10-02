import type { OptionFiltre } from '@/components/ui/Filtres';
import { jourIso } from '@/lib/filtres';
import type { Depart } from './types';

export type QuandDepart = 'a_venir' | 'aujourdhui' | 'passes' | 'tous';

export type FiltresDeparts = {
  quand: QuandDepart;
  statut: '' | 'planifie' | 'en_route' | 'arrive' | 'annule';
  trajetId: string;
};

export const FILTRES_DEPARTS_DEFAUT: FiltresDeparts = { quand: 'a_venir', statut: '', trajetId: '' };

export const OPTIONS_QUAND: OptionFiltre<QuandDepart>[] = [
  { valeur: 'a_venir', label: 'À venir' },
  { valeur: 'aujourdhui', label: 'Aujourd’hui' },
  { valeur: 'passes', label: 'Passés' },
  { valeur: 'tous', label: 'Tous' },
];

export const OPTIONS_STATUT_DEPART: OptionFiltre<Exclude<FiltresDeparts['statut'], ''>>[] = [
  { valeur: 'planifie', label: 'Planifié' },
  { valeur: 'en_route', label: 'En route' },
  { valeur: 'arrive', label: 'Arrivé' },
  { valeur: 'annule', label: 'Annulé' },
];

function bornes(quand: QuandDepart): { du?: string; au?: string } {
  if (quand === 'a_venir') return { du: jourIso(0) };
  if (quand === 'aujourdhui') return { du: jourIso(0), au: jourIso(0) };
  if (quand === 'passes') return { au: jourIso(-1) };
  return {};
}

/** Paramètres envoyés à GET /departs (ignorés tant que l'API ne les gère pas). */
export function paramsApiDeparts(f: FiltresDeparts) {
  return {
    ...bornes(f.quand),
    statut: f.statut || undefined,
    trajetId: f.trajetId || undefined,
    ordre: f.quand === 'passes' ? 'desc' : undefined,
  };
}

/** Même sémantique que les filtres API — utilisé en repli côté client. */
export function correspondDepart(d: Depart, f: FiltresDeparts): boolean {
  const { du, au } = bornes(f.quand);
  const jour = d.dateDepart.slice(0, 10);
  if (du && jour < du) return false;
  if (au && jour > au) return false;
  if (f.statut && d.statut !== f.statut) return false;
  if (f.trajetId && String(d.trajetId) !== f.trajetId) return false;
  return true;
}

/**
 * Date-heure réelle du départ : jour de `dateDepart` + heure de
 * `trajet.heureDepart` (stockée "1970-01-01THH:mm:ss.000Z", en UTC — heure
 * locale en Côte d'Ivoire).
 */
export function dateHeureDepart(d: Pick<Depart, 'dateDepart'> & { trajet: { heureDepart: string } }): Date {
  const jour = d.dateDepart.slice(0, 10);
  const heure = d.trajet.heureDepart.slice(11, 19) || '00:00:00';
  return new Date(`${jour}T${heure}Z`);
}

/** Départ ouvert à la vente au guichet : planifié, places libres, pas encore parti. */
export function estVendable(d: Depart, maintenant = new Date()): boolean {
  return d.statut === 'planifie' && d.placesDisponibles > 0 && dateHeureDepart(d) > maintenant;
}
