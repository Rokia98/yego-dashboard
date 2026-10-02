export type Agent = {
  id: number;
  nom: string;
  telephone: string;
  email: string | null;
  role?: string;
  compagnieId?: number | null;
  actif: boolean;
  dateCreation?: string;
};
