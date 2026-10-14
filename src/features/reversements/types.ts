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
  /** null quand la compagnie n'a pas encore déclaré de compte. */
  coordonnees: CoordonneesReversement | null;
  nombrePaiements: number;
  montantBrut: string;
  commissionPourcent: string | number;
  commission: string;
  montantNet: string;
  /** Il reste du solde au-delà du plafond par reversement (2 000 000 F). */
  plafondAtteint: boolean;
  reversementsEnCours: number;
  /**
   * API 0.29.0 : après une modification du compte par la compagnie, POST
   * /reversements est bloqué 24 h (ISO) — levé si un admin réenregistre le compte.
   */
  bloqueJusquA?: string | null;
};

/** Le reversement est-il suspendu (compte modifié récemment par la compagnie) ? */
export function estBloque(apercu: Pick<ApercuReversement, 'bloqueJusquA'>, maintenant = Date.now()): boolean {
  return apercu.bloqueJusquA != null && new Date(apercu.bloqueJusquA).getTime() > maintenant;
}

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
  /**
   * Nouveau circuit (DEMANDES_REVERSEMENT) : le transfert arrive sur le numéro
   * Yègo (beneficiaire), puis l'admin remet l'argent en main propre.
   * remisLe ≠ null = remis à la compagnie.
   */
  remisLe?: string | null;
  remisParId?: number | null;
  remiseNote?: string | null;
};

/** Fonds arrivés chez Yègo mais pas encore remis à la compagnie. */
export function estARemettre(r: Pick<Reversement, 'statut' | 'remisLe'>): boolean {
  return r.statut === 'effectue' && !r.remisLe;
}

export type PaiementReverse = {
  id: number;
  reservationId: number;
  montant: string;
  statut: string;
  moyenPaiement: string;
  datePaiement: string | null;
};

export type ReversementDetail = Reversement & { paiements: PaiementReverse[] };

/** Ventilation d'une part du solde (montants en chaîne). */
export type PartSolde = {
  nombrePaiements: number;
  montantBrut: string;
  commission: string;
  montantNet: string;
};

/**
 * GET /dashboard/solde : ventes en ligne de la compagnie détenues par Yègo.
 * disponible = reversable maintenant ; enAttente = départ à venir ou
 * remboursement non soldé. Les ventes au guichet n'y figurent pas.
 */
export type SoldeCompagnie = {
  compagnieId: number;
  devise: string;
  commissionPourcent: string | number;
  disponible: PartSolde;
  enAttente: PartSolde;
  /** Validé par Yègo, pas encore remis à la compagnie. */
  enCoursDeReversement: { nombre: number; montant: string };
  /** Effectivement remis en main propre. */
  totalReverse: { nombre: number; montant: string };
  dernierReversement: { id: number; montantNet: string; remisLe: string | null } | null;
  demandeEnAttente: { id: number; montantNetEstime: string; dateDemande: string } | null;
};

// --- Demandes de reversement (compagnie → admin) ----------------------------

export type DemandeReversementStatut = 'en_attente' | 'approuvee' | 'rejetee' | 'annulee';

export type DemandeReversement = {
  id: number;
  compagnieId: number;
  compagnie?: { id: number; nom: string };
  statut: DemandeReversementStatut | string;
  /** Net disponible au moment de la demande ; recalculé à l'approbation. */
  montantNetEstime: string;
  commentaire: string | null;
  motifRejet: string | null;
  demandeParId: number | null;
  traiteParId: number | null;
  reversementId: number | null;
  reversement?: { id: number; statut: ReversementStatut; montantNet: string; dateEffectue: string | null } | null;
  dateDemande: string;
  dateTraitement: string | null;
};

export const LIBELLE_STATUT_DEMANDE: Record<string, string> = {
  en_attente: 'En attente',
  approuvee: 'Approuvée',
  rejetee: 'Rejetée',
  annulee: 'Annulée',
};

export const TONE_STATUT_DEMANDE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  en_attente: 'warning',
  approuvee: 'success',
  rejetee: 'danger',
  annulee: 'neutral',
};

// --- Numéro Mobile Money de Yègo (reversements, retraits) -------------------

/** Opérateur du numéro Yègo qui reçoit (reversements du nouveau circuit, retraits). */
export type MoyenRetrait = 'wave' | 'orange_money';
export type MoyenYego = MoyenRetrait;

export const MOYENS_RETRAIT: { valeur: MoyenRetrait; label: string }[] = [
  { valeur: 'wave', label: 'Wave' },
  { valeur: 'orange_money', label: 'Orange Money' },
];

/**
 * GET /retraits/apercu. retirable = soldeJeko − engagements (argent des
 * compagnies et des voyageurs, intouchable).
 */
export type ApercuRetrait = {
  devise: string;
  soldeJeko: number;
  engagements: {
    billetsNonReverses: string;
    fraisRetenusNonReverses: string;
    /** Frais Jèko des transferts de reversement encore à faire. */
    fraisTransfertsAVenir?: string;
    reversementsEnCours: string;
    retraitsEnCours: string;
    total: string;
  };
  /** Montant maximum à saisir : frais Jèko du retrait (fraisTransfertPourcent) déjà déduits. */
  retirable: string;
  fraisTransfertPourcent?: number;
  fraisServiceEncaisses: string;
  commissionsPercues: string;
  dejaRetire: string;
  /** Numéro Yègo fixé côté serveur (RETRAIT_YEGO_TELEPHONE) ; null = non configuré. */
  beneficiaire: string | null;
  moyens: MoyenRetrait[];
};

export type Retrait = {
  id: number;
  montant: string;
  moyen: MoyenRetrait | string;
  beneficiaire: string;
  statut: ReversementStatut;
  jekoTransferId: string | null;
  jekoReference: string | null;
  fraisJeko: string | null;
  motifEchec: string | null;
  creeParId: number | null;
  dateCreation: string;
  dateEffectue: string | null;
};

/** Bornes de POST /retraits (CreerRetraitDto). */
export const RETRAIT_MIN_FCFA = 100;
export const RETRAIT_MAX_FCFA = 2_000_000;

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
