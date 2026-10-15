// Moyens de paiement présentés sur la landing page. Reflète
// features/paiements/types.ts : Djamo n'existe qu'en ligne (pas au guichet),
// les espèces uniquement au guichet.

export type MoyenAffiche = {
  nom: string;
  /** Logo dans /public ; absent -> pastille avec l'initiale. */
  logo?: string;
  /** Couleur de la pastille quand il n'y a pas de logo. */
  couleur?: string;
  enLigne: boolean;
  guichet: boolean;
};

export const MOBILE_MONEY: MoyenAffiche[] = [
  { nom: 'Wave', logo: '/landing/paiements/wave.png', enLigne: true, guichet: true },
  { nom: 'Orange Money', logo: '/landing/paiements/orange.png', enLigne: true, guichet: true },
  { nom: 'MTN MoMo', logo: '/landing/paiements/mtn.png', enLigne: true, guichet: true },
  { nom: 'Moov Money', logo: '/landing/paiements/moov-money.png', enLigne: true, guichet: true },
  { nom: 'Djamo', couleur: '#1A1A2E', enLigne: true, guichet: false },
];
