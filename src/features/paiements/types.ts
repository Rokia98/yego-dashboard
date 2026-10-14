export type MoyenPaiement = 'orange_money' | 'mtn_money' | 'moov_money' | 'wave' | 'djamo' | 'espece';

export type MoyenPaiementGuichet = Exclude<MoyenPaiement, 'djamo'>;

export type PaiementStatut = 'en_attente' | 'paye' | 'echoue' | 'rembourse' | string;

export type Paiement = {
  id: number;
  reservationId: number;
  montant: string; // prix des billets : part compagnie (CA, remboursements, reversements)
  /** Frais Yègo payés en plus par le voyageur (taux de GET /paiements/frais-service, 3,5 % en ligne ; 0 au guichet ; les paiements passés gardent leur taux d'origine) ; ni remboursés ni reversés. */
  fraisService?: string;
  moyenPaiement: string;
  referenceTransaction: string | null;
  statut: PaiementStatut;
  datePaiement: string | null;
  // Encaissement en ligne via Jèko (API 0.28.0) — absents sur les versions antérieures.
  telephonePayeur?: string | null;
  jekoReference?: string | null; // 'YEGO-P<id>-T<n>'
  jekoTentatives?: number;
  urlPaiement?: string | null;
  reversementId?: number | null; // null = pas encore reversé à la compagnie
};

/** Paiement encaissé en ligne sur le magasin Jèko de Yègo (vs guichet). */
export function estPaiementJeko(p: Pick<Paiement, 'jekoReference'> | null | undefined): boolean {
  return p?.jekoReference != null;
}

/** Montant réellement débité au voyageur : billets + frais de service. */
export function totalPaye(p: Pick<Paiement, 'montant' | 'fraisService'>): number {
  return Number(p.montant) + Number(p.fraisService ?? 0);
}

export const LIBELLE_MOYEN_PAIEMENT: Record<string, string> = {
  espece: 'Espèces',
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  moov_money: 'Moov Money',
  wave: 'Wave',
  djamo: 'Djamo',
};

export const MOYENS_PAIEMENT_GUICHET: { valeur: MoyenPaiementGuichet; label: string }[] = [
  { valeur: 'espece', label: 'Espèces' },
  { valeur: 'orange_money', label: 'Orange Money' },
  { valeur: 'mtn_money', label: 'MTN Money' },
  { valeur: 'moov_money', label: 'Moov Money' },
  { valeur: 'wave', label: 'Wave' },
];
