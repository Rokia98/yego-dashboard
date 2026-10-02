export type Abonnement = {
  id: number;
  compagnieId: number;
  plan: string;
  montant: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  compagnie?: { id: number; nom: string };
};
