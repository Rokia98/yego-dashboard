export type Vehicule = {
  id: number;
  compagnieId?: number;
  immatriculation: string;
  typeVehicule: string | null;
  capacite: number;
  statut: string;
};

export type Chauffeur = {
  id: number;
  compagnieId?: number;
  nom: string;
  telephone: string | null;
  numeroPermis: string | null;
};
