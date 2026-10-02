// Reversements aux compagnies (API 0.28.0) : Yègo encaisse les billets en ligne
// sur son magasin Jèko puis reverse le net (brut − commission) par transfert
// Mobile Money vers le compte déclaré par la compagnie.

export type ReversementStatut = 'en_cours' | 'effectue' | 'echoue' | string;

export type MoyenReversement = 'orange_money' | 'mtn_money' | 'moov_money' | 'wave' | 'djamo';

export const MOYENS_REVERSEMENT: { valeur: MoyenReversement; label: string }[] = [
  { valeur: 'orange_money', label: 'Orange Money' },
  { valeur: 'mtn_money', label: 'MTN Money' },
  { valeur: 'moov_money', label: 'Moov Money' },
  { valeur: 'wave', label: 'Wave' },
  { valeur: 'djamo', label: 'Djamo' },
];

/** Compte Mobile Money de la compagnie (null/null tant que non renseigné). */
export type CoordonneesReversement = {
  moyen: MoyenReversement | null;
  telephone: string | null; // +225…
};

// Montants : Decimal sérialisés en chaîne (cf. formatFcfa).
export type ApercuReversement = {
  compagnieId: number;
  coordonnees: CoordonneesReversement;
  nombrePaiements: number;
  montantBrut: string;
  commissionPourcent: string | number;
  commission: string;
  montantNet: string;
  /** Il reste du solde au-delà du plafond par reversement (2 000 000 F). */
  plafondAtteint: boolean;
  reversementsEnCours: number;
};

export type Reversement = {
  id: number;
  compagnieId: number;
  compagnie?: { id: number; nom: string };
  montantBrut: string;
  commission: string;
  montantNet: string;
  nombrePaiements: number;
  moyen: string;
  beneficiaire: string;
  statut: ReversementStatut;
  jekoReference: string | null;
  fraisJeko: string | null;
  motifEchec: string | null;
  dateCreation: string;
  dateEffectue: string | null;
};

export type PaiementReverse = {
  id: number;
  reservationId: number;
  montant: string;
  statut: string;
  moyenPaiement: string;
  datePaiement: string | null;
};

export type ReversementDetail = Reversement & { paiements: PaiementReverse[] };

export const LIBELLE_STATUT_REVERSEMENT: Record<string, string> = {
  en_cours: 'En cours',
  effectue: 'Effectué',
  echoue: 'Échoué',
};

export const TONE_STATUT_REVERSEMENT: Record<string, 'success' | 'warning' | 'danger'> = {
  en_cours: 'warning',
  effectue: 'success',
  echoue: 'danger',
};
