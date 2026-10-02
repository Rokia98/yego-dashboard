export type TicketStatut = 'valide' | 'utilise' | 'annule' | string;

export type Ticket = {
  id: number;
  reservationId: number;
  codeQr: string; // jeton signé "YEGO1.<charge>.<sig>" (ou UUID sur anciennes versions)
  siege: string | null;
  statut: TicketStatut;
  dateCreation?: string;
};

export type ResultatScan =
  | 'valide'
  | 'deja_utilise'
  | 'annule'
  | 'introuvable'
  | 'refuse_hors_compagnie'
  | 'reservation_annulee' // API 0.26.0+
  | 'non_paye' // API 0.26.0+
  | string;

export type BilletScanne = {
  ticketId: number | null;
  siege: string | null;
  codeQr: string | null;
  resultat: ResultatScan | null;
  date: string;
  reservation: {
    nombrePlaces: number;
    depart: {
      dateDepart: string;
      trajet: {
        heureDepart: string;
        villeDepart: { nom: string };
        villeArrivee: { nom: string };
        compagnie: { nom: string };
      };
    };
  } | null;
};
