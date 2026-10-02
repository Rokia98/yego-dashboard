import type { Paiement } from '@/features/paiements';

// en_cours : transfert Jèko lancé, en attente de l'opérateur ; echoue : transfert
// refusé (motifEchec), relançable avec le même PATCH.
export type RemboursementStatut = 'en_attente' | 'en_cours' | 'echoue' | 'rembourse' | string;

export type ModeRemboursement = 'jeko' | 'manuel';

export type Remboursement = {
  id: number;
  reservationId: number;
  montantRembourse: string;
  fraisRetenus: string;
  statut: RemboursementStatut;
  dateDemande: string;
  dateRemboursement: string | null;
  // Transfert Jèko (API 0.28.0).
  jekoTransferId?: string | null;
  jekoReference?: string | null; // 'YEGO-RB<id>-T<n>'
  jekoTentatives?: number;
  motifEchec?: string | null;
  reservation?: {
    id: number;
    utilisateurId: number | null;
    passagerNom: string | null;
    passagerTelephone: string | null;
    departId: number;
    nombrePlaces: number;
    canal: string;
    statut: string;
    dateReservation: string;
    // Présent depuis l'enrichissement de l'include (aligné sur /reservations).
    utilisateur?: { id: number; nom: string; telephone: string } | null;
    agent?: { id: number; nom: string } | null;
    // Inclus depuis l'API 0.28.0 : indique si le paiement est passé par Jèko.
    paiement?: Pick<Paiement, 'id' | 'moyenPaiement' | 'jekoReference' | 'telephonePayeur' | 'reversementId'> | null;
    depart?: {
      dateDepart: string;
      trajet: {
        villeDepart?: { nom: string };
        villeArrivee?: { nom: string };
        compagnie?: { id: number; nom: string };
      };
    } | null;
  } | null;
};

// Nom du voyageur, avec ou sans include enrichi.
export function nomBeneficiaire(r: Remboursement): string {
  const rr = r.reservation;
  if (!rr) return '—';
  return (
    rr.utilisateur?.nom ??
    rr.passagerNom ??
    (rr.utilisateurId ? `Client #${rr.utilisateurId}` : '—')
  );
}

export function libelleTrajetRemboursement(r: Remboursement): string | null {
  const t = r.reservation?.depart?.trajet;
  if (!t?.villeDepart?.nom || !t?.villeArrivee?.nom) return null;
  return `${t.villeDepart.nom} → ${t.villeArrivee.nom}`;
}

/**
 * Remboursable par transfert Jèko automatique : paiement encaissé via Jèko
 * (jekoReference), pas encore reversé à la compagnie (sinon l'API répond 400)
 * et montant non nul. Sinon, seul le constat manuel est possible.
 */
export function remboursableParJeko(r: Remboursement): boolean {
  const p = r.reservation?.paiement;
  return p?.jekoReference != null && p.reversementId == null && Number(r.montantRembourse) > 0;
}
