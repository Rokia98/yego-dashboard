import type { Ville } from '@/features/villes';
import type { Ticket } from '@/features/tickets';
import type { Paiement } from '@/features/paiements';

export type ReservationCanal = 'en_ligne' | 'guichet' | string;
export type ReservationStatut = 'confirmee' | 'annulee' | 'expiree' | string;

// depart.trajet est renvoyé "brut" (IDs de villes) sur la liste scopée des
// versions antérieures de l'API, et complet (villes + compagnie) sur /:id et
// sur les versions récentes. On type au plus large et on résout via cache si besoin.
export type ReservationTrajet = {
  id: number;
  compagnieId: number;
  prix: string;
  heureDepart: string;
  villeDepartId: number;
  villeArriveeId: number;
  villeDepart?: Ville;
  villeArrivee?: Ville;
  compagnie?: { id: number; nom: string };
};

export type Reservation = {
  id: number;
  utilisateurId: number | null;
  agentId: number | null;
  passagerNom: string | null;
  passagerTelephone: string | null;
  departId: number;
  nombrePlaces: number;
  sieges: string[];
  canal: ReservationCanal;
  statut: ReservationStatut;
  dateReservation: string;
  utilisateur?: { id: number; nom: string; telephone: string } | null;
  agent?: { id: number; nom: string } | null;
  paiement: Paiement | null;
  tickets?: Ticket[];
  depart: {
    id: number;
    dateDepart: string;
    placesDisponibles?: number;
    placesTotales?: number;
    statut?: string;
    trajet: ReservationTrajet;
  };
};

export type Remboursement = {
  montantRembourse: string;
  fraisRetenus: string;
  statut: string;
};

export type AnnulationResultat = Reservation & { remboursement?: Remboursement | null };
