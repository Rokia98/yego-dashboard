import type { Reservation } from './types';

// Nom du voyageur, quel que soit le canal / la complétude de la réponse API.
export function nomVoyageur(r: Reservation): string {
  return r.utilisateur?.nom ?? r.passagerNom ?? (r.canal === 'guichet' ? 'Client guichet' : 'Client en ligne');
}

// Libellé "Ville → Ville" en tolérant un trajet renvoyé sans les objets villes
// (fallback sur un index id -> nom construit depuis GET /villes).
export function libelleTrajet(r: Reservation, villes?: Map<number, string>): string {
  const t = r.depart?.trajet;
  if (!t) return '—';
  const depart = t.villeDepart?.nom ?? villes?.get(t.villeDepartId) ?? `Ville #${t.villeDepartId}`;
  const arrivee = t.villeArrivee?.nom ?? villes?.get(t.villeArriveeId) ?? `Ville #${t.villeArriveeId}`;
  return `${depart} → ${arrivee}`;
}

export function nomCompagnie(r: Reservation, compagnies?: Map<number, string>): string {
  const t = r.depart?.trajet;
  if (!t) return '—';
  return t.compagnie?.nom ?? compagnies?.get(t.compagnieId) ?? `Compagnie #${t.compagnieId}`;
}

export const ENTETES_EXPORT_RESERVATIONS = [
  'ID',
  'Date réservation',
  'Voyageur',
  'Téléphone',
  'Compagnie',
  'Trajet',
  'Date départ',
  'Places',
  'Sièges',
  'Canal',
  'Montant',
  'Statut paiement',
  'Statut',
];

export function ligneExportReservation(
  r: Reservation,
  villes?: Map<number, string>,
  compagnies?: Map<number, string>,
): (string | number)[] {
  return [
    r.id,
    r.dateReservation?.slice(0, 10) ?? '',
    nomVoyageur(r),
    r.utilisateur?.telephone ?? r.passagerTelephone ?? '',
    nomCompagnie(r, compagnies),
    libelleTrajet(r, villes),
    r.depart?.dateDepart?.slice(0, 10) ?? '',
    r.nombrePlaces,
    r.sieges?.join(' ') ?? '',
    r.canal,
    r.paiement?.montant ?? '',
    r.paiement?.statut ?? '',
    r.statut,
  ];
}
