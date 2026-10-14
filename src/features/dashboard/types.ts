export type DashboardResume = {
  periode: { debut: string; fin: string };
  reservations: {
    total: number;
    parStatut: Record<string, { nombre: number; places: number }>;
    parCanal: Record<string, number>;
    guichetParAgent: { agentId: number; nom: string; reservations: number; places: number }[];
  };
  chiffreAffaires: {
    parStatutPaiement: Record<string, { nombre: number; montant: string }>;
    /** Frais de service encaissés sur la période (revenu Yègo, hors CA compagnies) ; admin uniquement (omis pour company_admin / agent). */
    fraisService?: string;
  };
  occupation: {
    departs: number;
    placesTotales: number;
    placesOccupees: number;
    tauxRemplissage: number;
  };
};

export type DashboardTrajetClassement = {
  trajetId: number;
  villeDepart: string;
  villeArrivee: string;
  compagnie: { id: number; nom: string };
  reservations: number;
  placesVendues: number;
  revenu: string;
};

export type DashboardCompagnieClassement = {
  compagnieId: number;
  nom: string;
  reservations: number;
  placesVendues: number;
  revenu: string;
};

export type DashboardSeriePoint = {
  date: string; // YYYY-MM-DD
  reservations: number;
  placesVendues: number;
  revenu: string;
  parCanal?: { en_ligne: number; guichet: number };
};
