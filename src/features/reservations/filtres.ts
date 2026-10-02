import type { OptionFiltre } from '@/components/ui/Filtres';
import { dansPeriode, jourIso, normaliser } from '@/lib/filtres';
import { FILTRE_DATE_RESERVATION_SERVEUR } from '@/lib/capacites';
import type { Reservation } from './types';
import { nomVoyageur } from './labels';

export type FiltresReservations = {
  q: string;
  statut: '' | 'confirmee' | 'annulee' | 'expiree';
  canal: '' | 'en_ligne' | 'guichet';
  paiement: '' | 'paye' | 'non_paye';
  resDu: string; // date de réservation (YYYY-MM-DD)
  resAu: string;
  du: string; // date de départ (YYYY-MM-DD)
  au: string;
  compagnieId: string; // admin uniquement
};

/** Filtres par défaut : les réservations faites aujourd'hui (date évaluée à l'appel). */
export function filtresReservationsDefaut(): FiltresReservations {
  const aujourdhui = jourIso(0);
  return {
    q: '',
    statut: '',
    canal: '',
    paiement: '',
    resDu: aujourdhui,
    resAu: aujourdhui,
    du: '',
    au: '',
    compagnieId: '',
  };
}

export const OPTIONS_STATUT_RESERVATION: OptionFiltre<FiltresReservations['statut']>[] = [
  { valeur: '', label: 'Tous' },
  { valeur: 'confirmee', label: 'Confirmées' },
  { valeur: 'annulee', label: 'Annulées' },
  { valeur: 'expiree', label: 'Expirées' },
];

export const OPTIONS_CANAL: OptionFiltre<Exclude<FiltresReservations['canal'], ''>>[] = [
  { valeur: 'en_ligne', label: 'En ligne' },
  { valeur: 'guichet', label: 'Guichet' },
];

export const OPTIONS_PAIEMENT: OptionFiltre<Exclude<FiltresReservations['paiement'], ''>>[] = [
  { valeur: 'paye', label: 'Payées' },
  { valeur: 'non_paye', label: 'Non payées' },
];

/** Paramètres envoyés à GET /reservations (ignorés tant que l'API ne les gère pas). */
export function paramsApiReservations(f: FiltresReservations) {
  return {
    q: f.q.trim() || undefined,
    statut: f.statut || undefined,
    canal: f.canal || undefined,
    paiement: f.paiement || undefined,
    // Non envoyés tant que l'API ne les accepte pas (elle rejette les paramètres inconnus).
    reserveDu: FILTRE_DATE_RESERVATION_SERVEUR ? f.resDu || undefined : undefined,
    reserveAu: FILTRE_DATE_RESERVATION_SERVEUR ? f.resAu || undefined : undefined,
    du: f.du || undefined,
    au: f.au || undefined,
    compagnieId: f.compagnieId || undefined,
  };
}

function correspondRecherche(r: Reservation, q: string): boolean {
  const n = normaliser(q);
  if (!n) return true;
  const id = n.replace(/^#/, '');
  if (/^\d+$/.test(id) && String(r.id) === id) return true;
  const chiffres = q.replace(/\D/g, '');
  const tels = [r.passagerTelephone, r.utilisateur?.telephone].filter(Boolean).map((t) => t!.replace(/\D/g, ''));
  if (chiffres.length >= 4 && tels.some((t) => t.includes(chiffres))) return true;
  return normaliser(nomVoyageur(r)).includes(n);
}

/** Même sémantique que les filtres API — utilisé en repli côté client. */
export function correspondReservation(r: Reservation, f: FiltresReservations): boolean {
  if (f.statut && r.statut !== f.statut) return false;
  if (f.canal && r.canal !== f.canal) return false;
  if (f.paiement === 'paye' && r.paiement?.statut !== 'paye') return false;
  if (f.paiement === 'non_paye' && r.paiement?.statut === 'paye') return false;
  if (!dansPeriode(r.dateReservation, f.resDu, f.resAu)) return false;
  if (!dansPeriode(r.depart?.dateDepart, f.du, f.au)) return false;
  if (f.compagnieId && String(r.depart?.trajet?.compagnieId) !== f.compagnieId) return false;
  return correspondRecherche(r, f.q);
}
