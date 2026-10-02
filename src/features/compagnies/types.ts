export type CompagnieStatut = 'en_attente' | 'actif' | 'suspendu';

export type Compagnie = {
  id: number;
  nom: string;
  telephone: string | null;
  email?: string | null;
  logoUrl?: string | null;
  statut: CompagnieStatut;
  dateCreation?: string;
};
